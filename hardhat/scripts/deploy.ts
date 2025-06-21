import { ethers } from "hardhat";

async function main() {
  console.log("Deploying UnhackableWallet contract...");

  // Get the ContractFactory and Signer
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  const UnhackableWallet = await ethers.getContractFactory("UnhackableWallet");
  
  // Deploy the contract
  const unhackableWallet = await UnhackableWallet.deploy();
  await unhackableWallet.waitForDeployment();
  
  const contractAddress = await unhackableWallet.getAddress();
  
  console.log("UnhackableWallet deployed to:", contractAddress);
  
  // Log additional deployment information
  console.log("\n-------------------------------------------------------");
  console.log("Deployment completed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network <network> ${contractAddress}`);
  console.log("-------------------------------------------------------");
  
  return { contractAddress };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
