# Step-by-Step Monad Deployment Guide

This guide walks you through deploying the UnhackableWallet contract to Monad testnet in detail.

> **Having issues with your private key?** See our [Private Key Guide](./PRIVATE_KEY_GUIDE.md) for detailed instructions on handling private keys properly.

## Prerequisites

1. [Node.js](https://nodejs.org/) v16+ and npm v8+
2. An Ethereum wallet with Monad testnet tokens (see "Getting Testnet Tokens" section below)
3. Basic understanding of blockchain development

## Step 1: Setup Environment

1. Install dependencies:
```powershell
cd "c:\Users\Tanmay Joddar\Wallet1\hardhat"
npm install
```

2. Create a `.env` file:
```powershell
Copy-Item .env.example .env
```

3. Edit the `.env` file with your private key:
```
# You can include or omit the 0x prefix - both formats work now
PRIVATE_KEY=your_private_key_here
```

> **IMPORTANT**: Your private key must be exactly 32 bytes (64 hexadecimal characters, with or without the 0x prefix). If you're getting a "private key too short" error, make sure you're using the full private key from your wallet and not a shortened version or mnemonic.

### How to Export Your Private Key from MetaMask

If you're using MetaMask, follow these steps to export your private key:

1. Open your MetaMask extension
2. Click on the account icon in the top-right corner
3. Select "Account details"
4. Click "Show private key" (you'll need to enter your password)
5. Copy the entire key (it should be 64 characters plus the "0x" prefix)

⚠️ **Security Warning**: Never share your private key with anyone. Handle it with extreme caution and don't commit it to any public repositories.

## Step 2: Getting Testnet Tokens

Get Monad testnet tokens from the faucet:

1. Visit https://faucet.testnet.monad.xyz/
2. Enter your wallet address
3. Complete any verification steps
4. Receive testnet MONAD tokens (usually 1-2 MONAD)

Alternatively, join the Monad Discord (https://discord.gg/monad) and request tokens in the #testnet-faucet channel.

## Step 3: Compile the Smart Contract

Compile your contract using Hardhat:

```powershell
npm run compile
```

This creates the artifacts in the `artifacts` directory.

## Step 4: Deploy to Monad Testnet

Deploy the UnhackableWallet contract to Monad testnet:

```powershell
npm run deploy:monad
```

The deployment script will:
1. Connect to Monad testnet
2. Deploy the contract
3. Wait for confirmation
4. Print the contract address

**Save the contract address** displayed in the console, you'll need it in the next steps.

Example output:
```
Deploying UnhackableWallet contract...
Deploying contracts with the account: 0xYourAddress
Account balance: 1900000000000000000
UnhackableWallet deployed to: 0xContractAddress
```

## Step 5: Update Frontend Configuration

Update your frontend code with the new contract address:

```powershell
node scripts/update-addresses.js 0xContractAddress 2023
```

This updates the contract address in `src/web3/contract.ts` for chain ID 2023 (Monad testnet).

## Step 6: Verify the Contract on Monad Explorer

Verify your contract source code on Monad Explorer:

```powershell
npm run verify:monad 0xContractAddress
```

This makes your contract's source code viewable on the Monad Explorer and allows users to interact with it directly.

## Step 7: Test Your Deployment

Test that your contract is working correctly:

```powershell
$env:CONTRACT_ADDRESS = "0xContractAddress"
npm run test:monad
```

This will:
1. Connect to your deployed contract
2. Check basic read operations
3. Create a test report if none exist
4. Verify the transaction was successful

## Step 8: Interact with Your Contract

You can now interact with your contract through:

1. **The UnhackableWallet frontend**: Connect to Monad testnet in your wallet
2. **Monad Explorer**: Visit https://explorer.testnet.monad.xyz/address/0xContractAddress#code
3. **Direct contract calls**: Use the `contractService` in your frontend code

## Troubleshooting

### "Invalid account: #0 for network: monad_testnet - private key too short, expected 32 bytes"
- Your private key is not in the correct format or is incomplete
- Make sure your private key is exactly 64 hexadecimal characters (with or without 0x prefix)
- Check that you copied the entire private key from your wallet
- If using MetaMask, export the private key from the account details page
- Example of a valid private key format:
  - With prefix: `0x1234...` (total 66 characters including `0x`)
  - Without prefix: `1234...` (total 64 characters)

### Transaction Fails with "Insufficient funds"
- Ensure you have enough MONAD tokens for gas
- The faucet provides enough tokens for multiple deployments

### "Contract creation did not return a transaction receipt"
- The RPC might be temporarily congested
- Try again after a few minutes

### "Contract verification failed"
- Ensure the contract was compiled with the same compiler version as in hardhat.config.ts
- Try with explicit constructor arguments if any: `npm run verify:monad 0xContractAddress "arg1" "arg2"`

## Next Steps

1. **Test your frontend**: Open your app and connect to Monad testnet
2. **Monitor usage**: Watch for any issues specific to the Monad environment
3. **Optimize**: Consider any Monad-specific optimizations for your contract

## Quick Reference: Private Key Format

To avoid common deployment errors, ensure your private key is properly formatted:

| Format | Example | Valid |
|--------|---------|-------|
| With 0x prefix | `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` | ✅ |
| Without 0x prefix | `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` | ✅ |
| Too short | `1234abcd` | ❌ |
| Non-hex characters | `0x1234567890abcdef!@#$%^&*()` | ❌ |

Remember: A valid private key is **exactly 64 hexadecimal characters** (without 0x prefix) or **66 characters** (with 0x prefix).

If you're having issues with your private key, run:

```powershell
npm run validate:key
```
