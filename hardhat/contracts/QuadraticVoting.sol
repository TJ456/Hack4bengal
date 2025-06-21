// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./civic/CivicVerifier.sol";
import "./civic/CivicSBT.sol";

/**
 * @title QuadraticVoting
 * @dev Implementation of quadratic voting mechanism for DAO proposals with SBT integration
 */
contract QuadraticVoting is Ownable, ReentrancyGuard {
    IERC20 public shieldToken;                 // The governance token (SHIELD)
    CivicVerifier public civicVerifier;        // Civic verification contract
    CivicSBT public civicSBT;                  // Civic Soulbound Token contract
    uint256 public constant SCALE = 1e18;      // Scaling factor for square root calculations
    uint256 public proposalCount;              // Total number of proposals created
    uint256 public votingPeriod = 7 days;     // Default voting period duration
    uint256 public minVerificationLevel = 2;   // Minimum Civic verification level required to vote
    
    struct Proposal {
        address reporter;           // Address that reported the potential scam
        address target;            // Address being reported
        string evidence;           // IPFS hash of evidence
        uint256 startTime;        // Start time of voting period
        uint256 endTime;          // End time of voting period
        uint256 forVotes;         // Accumulated square root of YES votes
        uint256 againstVotes;     // Accumulated square root of NO votes
        bool executed;            // Whether the proposal has been executed
        bool passed;              // Whether the proposal passed
        mapping(address => Vote) votes; // Votes cast by address
    }

    struct Vote {
        bool voted;       // Whether the vote has been cast
        bool support;     // Whether the vote is in support
        uint256 weight;   // Weight of the vote (based on tokens and reputation)
        uint256 time;     // When the vote was cast
    }

    struct VotingPower {
        uint256 base;     // Base voting power from SHIELD tokens
        uint256 bonus;    // Bonus voting power from SBT reputation
    }

    event ProposalCreated(uint256 indexed proposalId, address indexed reporter, address indexed target);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event MinVerificationLevelUpdated(uint256 newLevel);
    event CivicVerifierUpdated(address newVerifier);
    event CivicSBTUpdated(address newSBT);

    constructor(
        address _shieldToken,
        address _civicVerifier,
        address _civicSBT
    ) {
        shieldToken = IERC20(_shieldToken);
        civicVerifier = CivicVerifier(_civicVerifier);
        civicSBT = CivicSBT(_civicSBT);
    }

    /**
     * @dev Create a new proposal
     * @param target The address being reported
     * @param evidence IPFS hash of evidence
     */
    function createProposal(
        address target,
        string memory evidence
    ) external {
        require(civicVerifier.isVerified(msg.sender), "Must be Civic verified to create proposal");
        require(civicSBT.hasSBT(msg.sender), "Must have SBT to create proposal");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.reporter = msg.sender;
        proposal.target = target;
        proposal.evidence = evidence;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        
        emit ProposalCreated(proposalCount, msg.sender, target);
    }

    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support Whether to vote for or against
     */
    function castVote(
        uint256 proposalId,
        bool support
    ) external nonReentrant {
        require(civicVerifier.isVerified(msg.sender), "Must be Civic verified to vote");
        require(civicSBT.hasSBT(msg.sender), "Must have SBT to vote");
        require(civicVerifier.getVerificationLevel(msg.sender) >= minVerificationLevel, "Insufficient verification level");

        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.votes[msg.sender].voted, "Already voted");

        VotingPower memory power = calculateVotingPower(msg.sender);
        uint256 weight = power.base + power.bonus;
        require(weight > 0, "No voting power");

        proposal.votes[msg.sender] = Vote({
            voted: true,
            support: support,
            weight: weight,
            time: block.timestamp
        });

        // Add the square root of voting power to appropriate counter
        uint256 voteWeight = Math.sqrt(weight * SCALE);
        if (support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        // Update voter's metrics in their SBT
        updateVoterMetrics(msg.sender);

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev Calculate a user's voting power based on SHIELD tokens and SBT reputation
     */
    function calculateVotingPower(address voter) public view returns (VotingPower memory) {
        uint256 baseVotingPower = shieldToken.balanceOf(voter);
        
        // Get SBT reputation metrics
        CivicSBT.TokenMetadata memory metadata = civicSBT.getTokenMetadata(voter);
        
        // Calculate bonus based on verification level and metrics
        uint256 levelMultiplier = metadata.verificationLevel * 10; // 10% per level
        uint256 accuracyBonus = (metadata.votingAccuracy * baseVotingPower) / 100;
        uint256 participationBonus = (metadata.doiParticipation * baseVotingPower) / 1000;
        uint256 trustBonus = (metadata.trustScore * baseVotingPower) / 100;
        
        uint256 totalBonus = (baseVotingPower * levelMultiplier / 100) + accuracyBonus + participationBonus + trustBonus;

        return VotingPower({
            base: baseVotingPower,
            bonus: totalBonus
        });
    }

    /**
     * @dev Execute a proposal after its voting period
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        proposal.passed = proposal.forVotes > proposal.againstVotes;

        // If proposal passed, update reputation for correct voters
        if (proposal.passed) {
            updateReputationForVoters(proposalId, true);  // true voters
        } else {
            updateReputationForVoters(proposalId, false); // false voters
        }

        emit ProposalExecuted(proposalId, proposal.passed);
    }

    /**
     * @dev Update voter metrics in their SBT
     */
    function updateVoterMetrics(address voter) internal {
        // Get current metrics
        CivicSBT.TokenMetadata memory metadata = civicSBT.getTokenMetadata(voter);
        
        // Calculate new participation metric
        uint256 newParticipation = metadata.doiParticipation + 1;
        
        // Update SBT metadata
        civicSBT.updateMetadata(
            voter,
            metadata.verificationLevel,
            metadata.trustScore,
            metadata.votingAccuracy,
            newParticipation
        );
    }

    /**
     * @dev Update reputation for voters after proposal execution
     */
    function updateReputationForVoters(uint256 proposalId, bool votedCorrectly) internal {
        Proposal storage proposal = proposals[proposalId];
        
        // For each voter in this proposal
        // Note: In production, you'd want to handle this more efficiently
        // through a separate batch update mechanism
        for (uint256 i = 1; i <= proposalCount; i++) {
            address voter = proposals[i].reporter; // Example: loop through voters
            if (proposal.votes[voter].voted) {
                if (proposal.votes[voter].support == votedCorrectly) {
                    // Voter was correct, increase their accuracy
                    CivicSBT.TokenMetadata memory metadata = civicSBT.getTokenMetadata(voter);
                    uint256 newAccuracy = Math.min(100, metadata.votingAccuracy + 5);
                    civicSBT.updateMetadata(
                        voter,
                        metadata.verificationLevel,
                        metadata.trustScore,
                        newAccuracy,
                        metadata.doiParticipation
                    );
                }
            }
        }
    }

    // Admin functions

    function setMinVerificationLevel(uint256 _newLevel) external onlyOwner {
        require(_newLevel > 0 && _newLevel <= 3, "Invalid level");
        minVerificationLevel = _newLevel;
        emit MinVerificationLevelUpdated(_newLevel);
    }

    function setCivicVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid address");
        civicVerifier = CivicVerifier(_newVerifier);
        emit CivicVerifierUpdated(_newVerifier);
    }

    function setCivicSBT(address _newSBT) external onlyOwner {
        require(_newSBT != address(0), "Invalid address");
        civicSBT = CivicSBT(_newSBT);
        emit CivicSBTUpdated(_newSBT);
    }

    // View functions

    function getProposal(uint256 proposalId) external view returns (
        address reporter,
        address target,
        string memory evidence,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool passed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.reporter,
            proposal.target,
            proposal.evidence,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.passed
        );
    }

    function getVote(uint256 proposalId, address voter) external view returns (
        bool voted,
        bool support,
        uint256 weight,
        uint256 time
    ) {
        Vote storage vote = proposals[proposalId].votes[voter];
        return (vote.voted, vote.support, vote.weight, vote.time);
    }

    mapping(uint256 => Proposal) public proposals;
}
