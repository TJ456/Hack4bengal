#!/usr/bin/env node
/**
 * Automated Monad deployment script
 * This script handles the entire workflow for deploying to Monad testnet
 */

const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to run commands
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`\n${question} `, (answer) => {
      resolve(answer);
    });
  });
}

// Validate private key format
function validatePrivateKey(envPath) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const privateKeyMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
    
    if (!privateKeyMatch) {
      return {
        valid: false,
        message: "PRIVATE_KEY not found in .env file"
      };
    }
    
    let privateKey = privateKeyMatch[1].trim();
    
    // Remove quotes if present
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // Remove 0x prefix if present to check length
    const keyWithoutPrefix = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
    
    if (keyWithoutPrefix.length !== 64) {
      return {
        valid: false,
        message: `Private key should be 64 hexadecimal characters (without 0x prefix), but got ${keyWithoutPrefix.length} characters`
      };
    }
    
    // Check if it's a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(keyWithoutPrefix)) {
      return {
        valid: false,
        message: "Private key contains invalid characters. It should only contain hexadecimal characters (0-9, a-f, A-F)."
      };
    }
    
    return {
      valid: true,
      message: "Private key format is valid."
    };
  } catch (error) {
    return {
      valid: false,
      message: `Error reading .env file: ${error.message}`
    };
  }
}

// Main function
async function main() {
  try {
    console.log('========================================');
    console.log('UnhackableWallet - Monad Deployment Tool');
    console.log('========================================\n');
    
    console.log('This script will guide you through the entire deployment process\n');
      // Step 1: Check if .env exists, if not create it
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('Creating .env file from template...');
      fs.copyFileSync(path.join(process.cwd(), '.env.example'), envPath);
      console.log('Please edit the .env file with your private key and other settings');
      console.log('\nIMPORTANT: Your private key must be exactly 32 bytes (64 hexadecimal characters)');
      console.log('You can include or omit the 0x prefix - both formats work now.');
      const shouldContinue = await askQuestion('Have you updated the .env file? (y/n)');
      if (shouldContinue.toLowerCase() !== 'y') {
        console.log('Please update the .env file and run this script again');
        return;
      }
    }
      // Validate private key format
    console.log('\nValidating private key format...');
    const keyValidation = validatePrivateKey(envPath);
    if (!keyValidation.valid) {
      console.log(`\n❌ Error: ${keyValidation.message}`);
      console.log('\nPlease fix your private key in the .env file and run this script again.');
      console.log('Your private key should be 64 hexadecimal characters (with or without 0x prefix).');
      console.log('Example format with prefix: 0x1234...abcd');
      console.log('Example format without prefix: 1234...abcd');
      return;
    }
    console.log('✅ Private key format is valid!');
    
    // Step 2: Install dependencies
    console.log('\nChecking and installing dependencies...');
    await runCommand('npm', ['install']);    // Step 3: Validate private key one more time
    console.log('\nValidating private key one more time before compilation...');
    const finalKeyValidation = validatePrivateKey(envPath);
    if (!finalKeyValidation.valid) {
      console.log(`\n❌ Error: ${finalKeyValidation.message}`);
      console.log('\nWould you like to run the private key validation tool to fix this issue?');
      const runValidator = await askQuestion('Run validation tool now? (y/n)');
      if (runValidator.toLowerCase() === 'y') {
        await runCommand('node', ['scripts/validate-private-key.js']);
        const shouldContinue = await askQuestion('Continue with deployment? (y/n)');
        if (shouldContinue.toLowerCase() !== 'y') {
          console.log('Deployment cancelled. Please fix your private key issues and try again.');
          return;
        }
      } else {
        console.log('Deployment cancelled. Please fix your private key issues and try again.');
        return;
      }
    }    // Step 4: Compile contracts
    console.log('\nCompiling smart contracts...');
    await runCommand('npm', ['run', 'compile']);
    
    // Step 4.5: Extract ABI and bytecode
    console.log('\nExtracting ABI and bytecode...');
    await runCommand('npm', ['run', 'extract-abi']);
    
    // Step 5: Ask if user has Monad testnet tokens
    const hasTokens = await askQuestion('Do you have Monad testnet tokens? (y/n)');
    if (hasTokens.toLowerCase() !== 'y') {
      console.log('\nPlease get Monad testnet tokens from:');
      console.log('1. https://faucet.testnet.monad.xyz/');
      console.log('2. Monad Discord: https://discord.gg/monad (#testnet-faucet channel)');
      const shouldContinue = await askQuestion('Have you obtained testnet tokens now? (y/n)');
      if (shouldContinue.toLowerCase() !== 'y') {
        console.log('Please get testnet tokens and run this script again');
        return;
      }
    }
    
    // Step 6: Deploy contract
    console.log('\nDeploying contract to Monad testnet...');
    try {
      await runCommand('npm', ['run', 'deploy:monad']);
    } catch (error) {
      console.log('\n❌ Deployment failed. This might be due to:');
      console.log('1. Private key issues');
      console.log('2. Insufficient MONAD tokens for gas');
      console.log('3. Network connectivity issues');
      
      const tryAgain = await askQuestion('Would you like to validate your private key and try again? (y/n)');
      if (tryAgain.toLowerCase() === 'y') {
        await runCommand('node', ['scripts/validate-private-key.js']);
        const shouldRetry = await askQuestion('Try deployment again? (y/n)');
        if (shouldRetry.toLowerCase() === 'y') {
          console.log('\nRetrying deployment...');
          await runCommand('npm', ['run', 'deploy:monad']);
        } else {
          console.log('Deployment cancelled.');
          return;
        }
      } else {
        console.log('Deployment cancelled.');
        return;
      }
    }
    
    // Step 6: Get contract address
    const contractAddress = await askQuestion('Please enter the deployed contract address (from the output above):');
    
    if (!contractAddress || !contractAddress.startsWith('0x')) {
      console.log('Invalid contract address. Please run the script again with a valid address.');
      return;
    }
    
    // Step 7: Update frontend configuration
    console.log('\nUpdating frontend configuration...');
    await runCommand('node', ['scripts/update-addresses.js', contractAddress, '2023']);
    
    // Step 8: Verify contract
    const shouldVerify = await askQuestion('Do you want to verify the contract on Monad Explorer? (y/n)');
    if (shouldVerify.toLowerCase() === 'y') {
      console.log('\nVerifying contract on Monad Explorer...');
      try {
        await runCommand('npm', ['run', 'verify:monad', contractAddress]);
      } catch (error) {
        console.log('Contract verification might have failed, but you can continue.');
      }
    }
    
    // Step 9: Test deployment
    const shouldTest = await askQuestion('Do you want to test the contract deployment? (y/n)');
    if (shouldTest.toLowerCase() === 'y') {
      console.log('\nTesting contract deployment...');
      process.env.CONTRACT_ADDRESS = contractAddress;
      await runCommand('npm', ['run', 'test:monad']);
    }
    
    // Final message
    console.log('\n=================================================');
    console.log('🎉 Deployment to Monad testnet completed successfully!');
    console.log('=================================================');
    console.log(`Contract address: ${contractAddress}`);
    console.log('View on Monad Explorer: https://explorer.testnet.monad.xyz/address/' + contractAddress);
    console.log('\nNext steps:');
    console.log('1. Test your frontend application with Monad testnet');
    console.log('2. Add liquidity or test tokens if needed');
    console.log('3. Monitor for any issues specific to Monad');
    console.log('=================================================');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('Please check the error message and try again.');
  } finally {
    rl.close();
  }
}

// Run the script
main();
