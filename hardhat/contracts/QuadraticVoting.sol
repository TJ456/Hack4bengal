// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title QuadraticVoting
 * @dev Implementation of quadratic voting mechanism for DAO proposals
 */
contract QuadraticVoting is Ownable, ReentrancyGuard {
    IERC20 public shieldToken; // The governance token (SHIELD)
    uint256 public constant SCALE = 1e18;    // Scaling factor for square root calculations
    uint256 public proposalCount;            // Total number of proposals created
    uint256 public votingPeriod = 7 days;   // Default voting period duration
    
    struct Proposal {
        address reporter;           // Address that reported the potential scam
        address suspiciousAddress;  // The address being reported as suspicious
        string description;         // Description of why this address is suspicious
        string evidence;            // Evidence URL or IPFS hash
        uint256 startTime;         // When voting starts
        uint256 endTime;           // When voting ends
        uint256 votesFor;          // Quadratic weighted votes in support
        uint256 votesAgainst;      // Quadratic weighted votes against
        bool isActive;             // Whether voting is still active
        bool isExecuted;           // Whether the proposal has been executed
        mapping(address => Vote) votes; // Track votes by address
    }

    struct Vote {
        bool hasVoted;     // Whether this address has voted
        bool support;      // Whether the vote was in support
        uint256 tokens;    // Number of tokens committed to the vote
        uint256 power;     // Square root of tokens (quadratic voting power)
    }

    struct ProposalView {
        uint256 id;
        address reporter;
        address suspiciousAddress;
        string description;
        string evidence;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        bool isActive;
        bool isExecuted;
    }

    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Mapping to track if an address has been confirmed as a scammer
    mapping(address => bool) public confirmedScammers;
    
    // Mapping from address to scam score (0-100)
    mapping(address => uint256) public scamScores;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address reporter, address suspiciousAddress);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 tokens, uint256 power);
    event ProposalExecuted(uint256 indexed proposalId, bool approved);
    event VotingPeriodSet(uint256 oldPeriod, uint256 newPeriod);

    /**
     * @dev Constructor to initialize the quadratic voting contract
     * @param _shieldToken The address of the SHIELD governance token
     */
    constructor(address _shieldToken) {
        shieldToken = IERC20(_shieldToken);
    }

    /**
     * @dev Submit a new scam report proposal
     * @param suspiciousAddress Address being reported
     * @param description Reason for the report
     * @param evidence Supporting evidence URL/IPFS hash
     */
    function submitProposal(
        address suspiciousAddress,
        string calldata description,
        string calldata evidence
    ) external nonReentrant returns (uint256) {
        require(suspiciousAddress != address(0), "Invalid address");
        require(bytes(description).length > 0, "Description required");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.reporter = msg.sender;
        proposal.suspiciousAddress = suspiciousAddress;
        proposal.description = description;
        proposal.evidence = evidence;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.isActive = true;
        
        emit ProposalCreated(proposalId, msg.sender, suspiciousAddress);
        
        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal using quadratic voting
     * @param proposalId The ID of the proposal
     * @param support Whether to vote for or against
     * @param tokens Number of tokens to commit to the vote
     */
    function castVote(
        uint256 proposalId,
        bool support,
        uint256 tokens
    ) external nonReentrant {
        require(tokens > 0, "Must commit tokens");
        require(shieldToken.balanceOf(msg.sender) >= tokens, "Insufficient balance");
        require(shieldToken.allowance(msg.sender, address(this)) >= tokens, "Insufficient allowance");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.isActive, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        
        // Calculate quadratic voting power (sqrt of tokens)
        uint256 votePower = _sqrt(tokens * SCALE);
        
        // Transfer tokens from voter
        require(shieldToken.transferFrom(msg.sender, address(this), tokens), "Token transfer failed");
        
        // Record the vote
        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            support: support,
            tokens: tokens,
            power: votePower
        });
        
        // Update vote tallies
        if (support) {
            proposal.votesFor += votePower;
        } else {
            proposal.votesAgainst += votePower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, tokens, votePower);
    }

    /**
     * @dev Execute a proposal after its voting period ends
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.isActive, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.isExecuted, "Already executed");
        
        proposal.isActive = false;
        proposal.isExecuted = true;
        
        bool approved = proposal.votesFor > proposal.votesAgainst;
        
        // If approved, update scam status
        if (approved) {
            confirmedScammers[proposal.suspiciousAddress] = true;
            // Increase scam score (max 100)
            uint256 currentScore = scamScores[proposal.suspiciousAddress];
            uint256 scoreIncrease = (proposal.votesFor - proposal.votesAgainst) * 10 / (proposal.votesFor + proposal.votesAgainst);
            scamScores[proposal.suspiciousAddress] = Math.min(100, currentScore + scoreIncrease);
        }
        
        emit ProposalExecuted(proposalId, approved);
    }

    /**
     * @dev Get a proposal's current status and details
     * @param proposalId The ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (ProposalView memory) {
        Proposal storage proposal = proposals[proposalId];
        return ProposalView({
            id: proposalId,
            reporter: proposal.reporter,
            suspiciousAddress: proposal.suspiciousAddress,
            description: proposal.description,
            evidence: proposal.evidence,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            votesFor: proposal.votesFor,
            votesAgainst: proposal.votesAgainst,
            isActive: proposal.isActive,
            isExecuted: proposal.isExecuted
        });
    }

    /**
     * @dev Get vote details for a specific voter on a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     */
    function getVote(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        bool support,
        uint256 tokens,
        uint256 power
    ) {
        Vote storage vote = proposals[proposalId].votes[voter];
        return (vote.hasVoted, vote.support, vote.tokens, vote.power);
    }

    /**
     * @dev Get the scam score for an address (0-100)
     * @param subject The address to check
     */
    function getScamScore(address subject) external view returns (uint256) {
        return scamScores[subject];
    }

    /**
     * @dev Check if an address is a confirmed scammer
     * @param subject The address to check
     */
    function isScammer(address subject) external view returns (bool) {
        return confirmedScammers[subject];
    }

    /**
     * @dev Update the voting period duration (admin only)
     * @param newVotingPeriod New duration in seconds
     */
    function setVotingPeriod(uint256 newVotingPeriod) external onlyOwner {
        require(newVotingPeriod > 0, "Invalid period");
        uint256 oldPeriod = votingPeriod;
        votingPeriod = newVotingPeriod;
        emit VotingPeriodSet(oldPeriod, newVotingPeriod);
    }

    /**
     * @dev Calculate the square root of a number scaled by SCALE
     * @param x The number to calculate the square root of
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        // Initial guess
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        // z = (z + x/z) / 2 until convergence
        while (z < y) {
            y = z;
            z = (z + x / z) / 2;
        }
        
        return y;
    }
}
