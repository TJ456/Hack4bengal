// Script to deploy Civic integration contracts

const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Civic integration contracts...");

  // Deploy mock Civic Pass for testing
  // In production, you would use the actual Civic Pass contract address
  const MockCivicPass = await ethers.getContractFactory("MockCivicPass");
  const mockCivicPass = await MockCivicPass.deploy();
  await mockCivicPass.deployed();
  console.log(`MockCivicPass deployed to: ${mockCivicPass.address}`);

  // Deploy CivicVerifier
  const CivicVerifier = await ethers.getContractFactory("CivicVerifier");
  const civicVerifier = await CivicVerifier.deploy(mockCivicPass.address);
  await civicVerifier.deployed();
  console.log(`CivicVerifier deployed to: ${civicVerifier.address}`);

  // Deploy CivicGatedWallet with a threshold of 1 ETH (in wei)
  const threshold = ethers.utils.parseEther("1.0");
  const CivicGatedWallet = await ethers.getContractFactory("CivicGatedWallet");
  const civicGatedWallet = await CivicGatedWallet.deploy(mockCivicPass.address, threshold);
  await civicGatedWallet.deployed();
  console.log(`CivicGatedWallet deployed to: ${civicGatedWallet.address}`);

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
