import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("UnhackableWallet", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployUnhackableWalletFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2, scammer] = await ethers.getSigners();

    const UnhackableWallet = await ethers.getContractFactory("UnhackableWallet");
    const unhackableWallet = await UnhackableWallet.deploy();

    return { unhackableWallet, owner, user1, user2, scammer };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { unhackableWallet, owner } = await loadFixture(deployUnhackableWalletFixture);

      expect(await unhackableWallet.owner()).to.equal(owner.address);
    });
  });

  describe("Reporting scams", function () {
    it("Should allow users to report a suspicious address", async function () {
      const { unhackableWallet, user1, scammer } = await loadFixture(deployUnhackableWalletFixture);
      
      const reason = "Fake token scam";
      const evidence = "https://evidence.example.com/proof";
      
      await expect(
        unhackableWallet.connect(user1).reportScam(scammer.address, reason, evidence)
      ).to.emit(unhackableWallet, "ScamReported")
        .withArgs(user1.address, scammer.address, reason);
      
      // Check if report count increased
      expect(await unhackableWallet.totalReports()).to.equal(1);
      
      // Check if scam score increased
      expect(await unhackableWallet.getScamScore(scammer.address)).to.equal(10);
    });
    
    it("Should reject reports with empty reason", async function () {
      const { unhackableWallet, user1, scammer } = await loadFixture(deployUnhackableWalletFixture);
      
      const emptyReason = "";
      const evidence = "https://evidence.example.com/proof";
      
      await expect(
        unhackableWallet.connect(user1).reportScam(scammer.address, emptyReason, evidence)
      ).to.be.revertedWith("Reason cannot be empty");
    });
  });
  
  describe("Secure transfer", function () {
    it("Should allow transferring funds to non-scam addresses", async function () {
      const { unhackableWallet, owner, user1 } = await loadFixture(deployUnhackableWalletFixture);
      
      const transferAmount = ethers.parseEther("1.0");
      
      // Fund the contract first
      await owner.sendTransaction({
        to: await unhackableWallet.getAddress(),
        value: transferAmount
      });
      
      // Check contract balance
      expect(await ethers.provider.getBalance(await unhackableWallet.getAddress())).to.equal(transferAmount);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Transfer funds
      await expect(
        unhackableWallet.connect(owner).secureTransfer(user1.address, { value: transferAmount })
      ).to.emit(unhackableWallet, "SecureTransfer")
        .withArgs(owner.address, user1.address, transferAmount, true);
        
      // Check recipient balance increased
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance - initialBalance).to.equal(transferAmount);
    });
  });
});
