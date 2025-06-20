import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { QuadraticVoting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("QuadraticVoting", function () {
  // Define a fixture to reuse the same setup in different tests
  async function deployQuadraticVotingFixture() {
    // Get the signers (accounts)
    const [owner, reporter, voter1, voter2, suspiciousAddress] = await ethers.getSigners();

    // Deploy mock SHIELD token
    const MockToken = await ethers.getContractFactory("MockShieldToken");
    const shieldToken = (await MockToken.deploy()) as any;

    // Deploy QuadraticVoting contract
    const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
    const voting = (await QuadraticVoting.deploy(await shieldToken.getAddress())) as QuadraticVoting;

    // Mint some tokens for testing
    const testAmount = ethers.parseEther("1000");
    await shieldToken.mint(voter1.address, testAmount);
    await shieldToken.mint(voter2.address, testAmount);

    return { 
      voting, 
      shieldToken, 
      owner, 
      reporter, 
      voter1, 
      voter2, 
      suspiciousAddress,
      testAmount 
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { voting, owner } = await loadFixture(deployQuadraticVotingFixture);
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should set the correct SHIELD token address", async function () {
      const { voting, shieldToken } = await loadFixture(deployQuadraticVotingFixture);
      expect(await voting.shieldToken()).to.equal(await shieldToken.getAddress());
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow creating a new proposal", async function () {
      const { voting, reporter, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      const description = "Scam NFT minting";
      const evidence = "https://evidence.com/proof";
      
      await expect(voting.connect(reporter).submitProposal(
        suspiciousAddress.address,
        description,
        evidence
      )).to.emit(voting, "ProposalCreated")
        .withArgs(0, reporter.address, suspiciousAddress.address);
      
      const proposal = await voting.getProposal(0);
      expect(proposal.reporter).to.equal(reporter.address);
      expect(proposal.suspiciousAddress).to.equal(suspiciousAddress.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.evidence).to.equal(evidence);
      expect(proposal.isActive).to.be.true;
    });

    it("Should reject proposals with empty description", async function () {
      const { voting, reporter, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      await expect(voting.connect(reporter).submitProposal(
        suspiciousAddress.address,
        "",
        "evidence"
      )).to.be.revertedWith("Description required");
    });

    it("Should reject proposals with zero address", async function () {
      const { voting, reporter } = await loadFixture(deployQuadraticVotingFixture);
      
      await expect(voting.connect(reporter).submitProposal(
        ethers.ZeroAddress,
        "description",
        "evidence"
      )).to.be.revertedWith("Invalid address");
    });
  });

  // Helper function to create a test proposal
  async function createTestProposal(
    reporter: HardhatEthersSigner,
    voting: QuadraticVoting,
    suspiciousAddress: HardhatEthersSigner
  ) {
    await voting.connect(reporter).submitProposal(
      suspiciousAddress.address,
      "Test Proposal",
      "Test Evidence"
    );
    return 0; // First proposal ID
  }

  describe("Voting", function () {

    it("Should allow voting with correct quadratic weight", async function () {
      const { voting, shieldToken, reporter, voter1, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      
      const voteTokens = ethers.parseEther("100");
      await shieldToken.connect(voter1).approve(voting, voteTokens);
      
      await expect(voting.connect(voter1).castVote(proposalId, true, voteTokens))
        .to.emit(voting, "VoteCast")
        .withArgs(proposalId, voter1.address, true, voteTokens, ethers.parseEther("10")); // sqrt(100) = 10
      
      const proposal = await voting.getProposal(proposalId);
      expect(proposal.votesFor).to.equal(ethers.parseEther("10")); // sqrt(100) = 10
    });

    it("Should prevent voting twice", async function () {
      const { voting, shieldToken, reporter, voter1, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      
      const voteTokens = ethers.parseEther("100");
      await shieldToken.connect(voter1).approve(voting, voteTokens * 2n);
      
      await voting.connect(voter1).castVote(proposalId, true, voteTokens);
      
      await expect(voting.connect(voter1).castVote(
        proposalId,
        true,
        voteTokens
      )).to.be.revertedWith("Already voted");
    });

    it("Should require sufficient token balance", async function () {
      const { voting, reporter, voter1, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      
      const tooManyTokens = ethers.parseEther("1001"); // More than minted
      
      await expect(voting.connect(voter1).castVote(
        proposalId,
        true,
        tooManyTokens
      )).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Proposal Execution", function () {
    it("Should execute proposal after voting period", async function () {
      const { voting, shieldToken, reporter, voter1, voter2, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      // Create proposal
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      
      // Vote for
      const voteTokens1 = ethers.parseEther("100");
      await shieldToken.connect(voter1).approve(voting, voteTokens1);
      await voting.connect(voter1).castVote(proposalId, true, voteTokens1);
      
      // Vote against
      const voteTokens2 = ethers.parseEther("25");
      await shieldToken.connect(voter2).approve(voting, voteTokens2);
      await voting.connect(voter2).castVote(proposalId, false, voteTokens2);
      
      // Increase time past voting period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 days
      await ethers.provider.send("evm_mine", []);
      
      // Execute proposal
      await expect(voting.executeProposal(proposalId))
        .to.emit(voting, "ProposalExecuted")
        .withArgs(proposalId, true); // Should pass as more votes for than against
      
      // Check scammer status
      expect(await voting.isScammer(suspiciousAddress.address)).to.be.true;
    });

    it("Should not allow executing a proposal before voting period ends", async function () {
      const { voting, reporter, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      
      await expect(voting.executeProposal(proposalId))
        .to.be.revertedWith("Voting still active");
    });
  });

  describe("View Functions", function () {
    it("Should return correct proposal details", async function () {
      const { voting, reporter, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      const description = "Test Proposal";
      const evidence = "Test Evidence";
      
      await voting.connect(reporter).submitProposal(
        suspiciousAddress.address,
        description,
        evidence
      );
      
      const proposal = await voting.getProposal(0);
      expect(proposal.reporter).to.equal(reporter.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.evidence).to.equal(evidence);
    });

    it("Should return correct vote details", async function () {
      const { voting, shieldToken, reporter, voter1, suspiciousAddress } = await loadFixture(deployQuadraticVotingFixture);
      
      const proposalId = await createTestProposal(reporter, voting, suspiciousAddress);
      const voteTokens = ethers.parseEther("100");
      
      await shieldToken.connect(voter1).approve(voting, voteTokens);
      await voting.connect(voter1).castVote(proposalId, true, voteTokens);
      
      const [hasVoted, support, tokens, power] = await voting.getVote(proposalId, voter1.address);
      expect(hasVoted).to.be.true;
      expect(support).to.be.true;
      expect(tokens).to.equal(voteTokens);
      expect(power).to.equal(ethers.parseEther("10")); // sqrt(100) = 10
    });
  });
});
