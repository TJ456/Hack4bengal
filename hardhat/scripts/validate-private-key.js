#!/usr/bin/env node
/**
 * Private Key Troubleshooting Script
 * This script validates the format of your private key in the .env file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Validate private key format
 */
function validatePrivateKey(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      return {
        valid: false,
        message: ".env file not found. Please create it first by copying from .env.example"
      };
    }

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
    
    // Check if it's the default or placeholder
    if (privateKey === "your_private_key_here" || 
        privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000" ||
        privateKey === "your_private_key_without_0x_prefix") {
      return {
        valid: false,
        message: "You need to replace the placeholder with your actual private key"
      };
    }
    
    // Remove 0x prefix if present to check length
    const keyWithoutPrefix = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
    
    // Check length
    if (keyWithoutPrefix.length !== 64) {
      return {
        valid: false,
        length: keyWithoutPrefix.length,
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
    
    // All checks passed
    return {
      valid: true,
      hasPrefix: privateKey.startsWith("0x"),
      key: privateKey,
      message: "Private key format is valid."
    };
    
  } catch (error) {
    return {
      valid: false,
      message: `Error reading .env file: ${error.message}`
    };
  }
}

/**
 * Fix common private key issues
 */
async function fixPrivateKeyIssues(validation, envPath) {
  if (validation.valid) return true;
  
  console.log(`${colors.yellow}I'll help you fix your private key format. Please answer the following questions:${colors.reset}`);
  
  if (!validation.length) {
    console.log(`${colors.red}Issue detected: ${validation.message}${colors.reset}`);
    return false;
  }
  
  // For length issues, ask for the correct private key
  if (validation.length !== 64) {
    console.log(`${colors.yellow}\nYour private key is ${validation.length} characters (without 0x prefix), but it should be exactly 64.${colors.reset}`);
    
    const inputKey = await askQuestion(`Please enter your full private key (with or without 0x prefix): `);
    if (!inputKey) {
      console.log(`${colors.red}No private key provided. Cannot continue.${colors.reset}`);
      return false;
    }
    
    // Normalize the key
    let normalizedKey = inputKey.trim();
    if ((normalizedKey.startsWith('"') && normalizedKey.endsWith('"')) || 
        (normalizedKey.startsWith("'") && normalizedKey.endsWith("'"))) {
      normalizedKey = normalizedKey.substring(1, normalizedKey.length - 1);
    }
    
    // Update the .env file
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const updatedContent = envContent.replace(/PRIVATE_KEY=([^\r\n]+)/, `PRIVATE_KEY=${normalizedKey}`);
      fs.writeFileSync(envPath, updatedContent, 'utf8');
      
      console.log(`${colors.green}Private key updated in .env file.${colors.reset}`);
      
      // Validate again
      const newValidation = validatePrivateKey(envPath);
      if (newValidation.valid) {
        console.log(`${colors.green}✓ Success! Your private key is now correctly formatted.${colors.reset}`);
        return true;
      } else {
        console.log(`${colors.red}The provided key still has issues: ${newValidation.message}${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.log(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
      return false;
    }
  }
  
  return false;
}

/**
 * Ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}Private Key Format Validation Tool${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  
  console.log(`${colors.cyan}Checking private key format in your .env file...${colors.reset}\n`);
  
  const validation = validatePrivateKey(envPath);
  
  if (validation.valid) {
    console.log(`${colors.green}✓ Success! Your private key format is valid.${colors.reset}`);
    console.log(`${colors.gray}Key details:${colors.reset}`);
    console.log(`${colors.gray}- Has 0x prefix: ${validation.hasPrefix ? 'Yes' : 'No'}${colors.reset}`);
    console.log(`${colors.gray}- Length: ${validation.hasPrefix ? validation.key.length - 2 : validation.key.length} characters (without 0x prefix)${colors.reset}`);
    
    const maskedKey = validation.key.substring(0, 6) + '...' + validation.key.substring(validation.key.length - 4);
    console.log(`${colors.gray}- Key preview: ${maskedKey}${colors.reset}\n`);
    
    console.log(`${colors.green}You're ready to deploy! Use the following command:${colors.reset}`);
    console.log(`${colors.cyan}npm run deploy:monad${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Error: ${validation.message}${colors.reset}\n`);
    
    // Try to fix issues
    const fixed = await fixPrivateKeyIssues(validation, envPath);
    
    if (!fixed) {
      console.log(`\n${colors.yellow}Please follow these steps to fix your private key:${colors.reset}\n`);
      console.log(`${colors.cyan}1. Open your .env file${colors.reset}`);
      console.log(`${colors.cyan}2. Find the PRIVATE_KEY line${colors.reset}`);
      console.log(`${colors.cyan}3. Replace it with your full private key (should be 64 hex characters, with or without 0x prefix)${colors.reset}`);
      console.log(`${colors.cyan}4. Save the file and run this validation tool again${colors.reset}\n`);
      
      console.log(`${colors.yellow}Example of a correctly formatted private key:${colors.reset}`);
      console.log(`${colors.gray}With prefix: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef${colors.reset}`);
      console.log(`${colors.gray}Without prefix: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef${colors.reset}\n`);
    
      console.log(`${colors.cyan}For security reasons, never share your private key with anyone!${colors.reset}`);
    }
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
});
