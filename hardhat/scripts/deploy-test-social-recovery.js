const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Social Recovery contract...");

  // Get the account that will deploy the contract
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy the contract
  const SocialRecovery = await ethers.getContractFactory("SocialRecoveryWallet");
  const threshold = 2; // Number of guardians required for recovery
  const socialRecovery = await SocialRecovery.deploy(threshold);
  await socialRecovery.waitForDeployment();

  const contractAddress = await socialRecovery.getAddress();
  console.log("Social Recovery contract deployed to:", contractAddress);

  // Add some initial guardians for testing
  const guardian1 = "0x1234567890123456789012345678901234567890"; // Replace with actual address
  const guardian2 = "0x0987654321098765432109876543210987654321"; // Replace with actual address
  
  console.log("Adding test guardians...");
  await socialRecovery.addGuardian(guardian1);
  await socialRecovery.addGuardian(guardian2);
  
  console.log("Initial setup complete!");
  console.log("Contract address:", contractAddress);
  console.log("Guardian 1:", guardian1);
  console.log("Guardian 2:", guardian2);
  console.log("Recovery threshold:", threshold);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
