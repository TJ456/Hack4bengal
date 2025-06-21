// Script to extract ABI and bytecode from compiled artifact
const fs = require('fs');
const path = require('path');

// Path to the compiled artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/UnhackableWallet.sol/UnhackableWallet.json');

// Path to the destination JSON file
const targetPath = path.join(__dirname, '../../src/web3/abi/UnhackableWallet.json');

// Ensure target directory exists
const targetDir = path.dirname(targetPath);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

try {
  // Read the contract artifact
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Extract the relevant information
  const contractInfo = {
    contractName: artifact.contractName,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    deployedBytecode: artifact.deployedBytecode,
    linkReferences: artifact.linkReferences,
    deployedLinkReferences: artifact.deployedLinkReferences
  };
  
  // Write the JSON file
  fs.writeFileSync(
    targetPath,
    JSON.stringify(contractInfo, null, 2),
    'utf8'
  );
  
  console.log(`✅ ABI and bytecode extracted to: ${targetPath}`);
} catch (error) {
  console.error(`❌ Error extracting ABI and bytecode: ${error.message}`);
  process.exit(1);
}
