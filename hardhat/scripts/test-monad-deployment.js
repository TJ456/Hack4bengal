const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Testing UnhackableWallet deployment on Monad Testnet...");
    
    // Get the signer
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    
    // Get the contract instance
    const UnhackableWallet = await ethers.getContractFactory("UnhackableWallet");
    
    // You should replace this with your deployed contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.error("Please set CONTRACT_ADDRESS environment variable");
      process.exit(1);
    }
    
    console.log(`Connecting to deployed contract at: ${contractAddress}`);
    const contract = UnhackableWallet.attach(contractAddress);
    
    // Test basic read operations
    console.log("Running basic tests...");
    
    // Get owner
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    
    // Get report count
    const reportCount = await contract.totalReports();
    console.log(`Total reports: ${reportCount.toString()}`);
    
    // Create a test report if there are none
    if (reportCount.toString() === "0") {
      console.log("Creating a test scam report...");
      
      // Report a test address as a scam
      const testAddress = "0x0000000000000000000000000000000000000001";
      const tx = await contract.reportScam(
        testAddress,
        "Test report from Monad deployment script",
        "https://example.com/evidence"
      );
      
      console.log("Waiting for transaction confirmation...");
      await tx.wait();
      console.log(`Report created successfully! TX: ${tx.hash}`);
      
      // Verify the report was created
      const newReportCount = await contract.totalReports();
      console.log(`New total reports: ${newReportCount.toString()}`);
      
      // Get the scam score
      const scamScore = await contract.getScamScore(testAddress);
      console.log(`Scam score for test address: ${scamScore.toString()}`);
    }
    
    console.log("\nTest completed successfully! ✅");
    console.log("Your contract is working correctly on Monad Testnet.");
    
  } catch (error) {
    console.error("Error testing contract:", error);
    process.exit(1);
  }
}

// Execute the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
