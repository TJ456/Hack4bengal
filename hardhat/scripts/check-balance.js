const { ethers } = require("hardhat");

async function main() {
  const [account] = await ethers.getSigners();
  console.log("Checking balance for:", account.address);
  
  const balance = await ethers.provider.getBalance(account.address);
  console.log("Balance:", ethers.formatEther(balance), "MONAD");
  
  if (ethers.formatEther(balance) === "0.0") {
    console.log("\n❌ No MONAD tokens found!");
    console.log("Please get tokens from Monad Testnet Faucet:");
    console.log("https://faucet.testnet.monad.xyz/");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
