// Setup script for Civic Auth integration

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up Civic Auth integration...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with Civic configuration placeholders...');
  
  const envContent = `# Civic Auth Configuration
CIVIC_GATEKEEPER_NETWORK=your_gatekeeper_network
CIVIC_AUTH_BASE_URL=https://auth.civic.com
CIVIC_AUTH_STAGING_URL=https://staging.auth.civic.com

# Add your other environment variables below
`;
  
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('Updating existing .env file with Civic configuration...');
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('CIVIC_GATEKEEPER_NETWORK')) {
    envContent += `\n# Civic Auth Configuration
CIVIC_GATEKEEPER_NETWORK=your_gatekeeper_network
CIVIC_AUTH_BASE_URL=https://auth.civic.com
CIVIC_AUTH_STAGING_URL=https://staging.auth.civic.com
`;
    
    fs.writeFileSync(envPath, envContent);
  }
}

// Install Civic dependencies
console.log('Installing Civic dependencies...');
try {
  console.log('Installing @solana/web3.js package...');
  execSync('npm install @solana/web3.js --save --legacy-peer-deps', { stdio: 'inherit' });

  // Try to install Civic packages without breaking React 18 compatibility
  console.log('Installing Civic Pass API package...');
  try {
    execSync('npm install @civic/civic-pass-api --save --legacy-peer-deps', { stdio: 'inherit' });
    console.log('@civic/civic-pass-api installed successfully!');
  } catch (error) {
    console.warn('Could not install @civic/civic-pass-api. Using mock implementation instead.');
  }

  console.log('Civic dependencies installed successfully!');
} catch (error) {
  console.error('Failed to install Civic dependencies:', error);
  console.log('Continuing with mocked Civic implementation...');
}

console.log('\nCivic Auth setup completed!');
console.log('\nNext steps:');
console.log('1. Update CIVIC_GATEKEEPER_NETWORK in .env file with your actual values');
console.log('2. The app is currently using a mocked implementation of Civic authentication.');
console.log('   To use the actual Civic API, you\'ll need to implement the real API calls.');
console.log('\nRefer to CIVIC_INTEGRATION.md for complete documentation');
