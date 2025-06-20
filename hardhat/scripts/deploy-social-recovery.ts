import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface AddressConfig {
  socialRecoveryWallet?: string;
  [key: string]: string | undefined;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Social Recovery contract with account:", deployer.address);

  // Default guardian threshold is 2 (can be changed during deployment)
  const GUARDIAN_THRESHOLD = 2;

  // Deploy the contract
  const SocialRecoveryWallet = await ethers.getContractFactory("SocialRecoveryWallet");
  const socialRecoveryWallet = await SocialRecoveryWallet.deploy(GUARDIAN_THRESHOLD);
  await socialRecoveryWallet.waitForDeployment();

  const address = await socialRecoveryWallet.getAddress();
  console.log("SocialRecoveryWallet deployed to:", address);

  // Add contract deployment info to addresses.json for frontend use
  const addressesPath = path.resolve(__dirname, "../../src/web3/addresses.json");
  let addresses: AddressConfig = {};
  
  try {
    if (fs.existsSync(addressesPath)) {
      const fileContent = fs.readFileSync(addressesPath, "utf8");
      addresses = JSON.parse(fileContent || "{}");
      console.log("Existing addresses.json found:", addresses);
    }
  } catch (err) {
    console.log("Creating new addresses.json file...");
  }
  
  addresses.socialRecoveryWallet = address;
  
  // Ensure the directory exists
  const dir = path.dirname(addressesPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Contract address saved to src/web3/addresses.json");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
