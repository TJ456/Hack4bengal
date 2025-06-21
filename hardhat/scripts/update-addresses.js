const fs = require('fs');
const path = require('path');

/**
 * This script updates the contract addresses in the frontend code after deployment
 * Run this script after a successful deployment with the contract address and network ID
 * 
 * Usage: node update-addresses.js <contract-address> <network-id>
 * Example: node update-addresses.js 0x123456789abcdef 5
 */

// Check for required arguments
if (process.argv.length < 4) {
  console.error('Error: Missing arguments!');
  console.log('Usage: node update-addresses.js <contract-address> <network-id>');
  console.log('Example: node update-addresses.js 0x123456789abcdef 5');
  process.exit(1);
}

// Get arguments
const contractAddress = process.argv[2];
const networkId = process.argv[3];

// Path to the frontend contract service file
const contractServicePath = path.join(__dirname, '../../src/web3/contract.ts');

try {
  // Read the current file content
  let content = fs.readFileSync(contractServicePath, 'utf8');
  
  // Match the CONTRACT_ADDRESSES object in the file
  const addressesRegex = /const\s+CONTRACT_ADDRESSES\s*=\s*\{[^}]*\};/s;
  const addressesMatch = content.match(addressesRegex);
  
  if (!addressesMatch) {
    throw new Error('Could not find CONTRACT_ADDRESSES object in the file');
  }
  
  // Extract the current addresses object
  const currentAddresses = addressesMatch[0];
  
  // Parse the addresses to preserve existing values
  const addressesStart = currentAddresses.indexOf('{');
  const addressesEnd = currentAddresses.lastIndexOf('}');
  const addressesObj = currentAddresses.substring(addressesStart, addressesEnd + 1);
  
  // Create a new addresses object with the updated address
  let newAddresses = addressesObj;
  
  // Replace or add the new address for the specified network
  const networkRegex = new RegExp(`'${networkId}'\\s*:\\s*'[^']*'`);
  if (networkRegex.test(newAddresses)) {
    // Replace existing address
    newAddresses = newAddresses.replace(networkRegex, `'${networkId}': '${contractAddress}'`);
  } else {
    // Add new address - insert before the closing brace
    const insertPos = newAddresses.lastIndexOf('}');
    const prefix = newAddresses.substring(0, insertPos);
    const suffix = newAddresses.substring(insertPos);
    
    // Check if we need to add a comma
    const needsComma = !prefix.trim().endsWith(',');
    newAddresses = `${prefix}${needsComma ? ',' : ''}\n  '${networkId}': '${contractAddress}'${suffix}`;
  }
  
  // Replace the addresses object in the file
  const newContent = content.replace(addressesRegex, `const CONTRACT_ADDRESSES = ${newAddresses};`);
  
  // Write the updated content back to the file
  fs.writeFileSync(contractServicePath, newContent, 'utf8');
  
  console.log(`Successfully updated contract address for network ${networkId} to ${contractAddress}`);
  
} catch (error) {
  console.error('Error updating contract address:', error.message);
  process.exit(1);
}
