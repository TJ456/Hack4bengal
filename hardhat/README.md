# UnhackableWallet Smart Contract Deployment Guide

This guide explains how to deploy the UnhackableWallet smart contract to Ethereum testnets and integrate it with the frontend application.

## Prerequisites

1. Node.js and npm installed
2. An Ethereum wallet with private key (e.g., MetaMask)
3. Some testnet ETH (for Sepolia, Goerli, or Mumbai)
4. API key from Infura or Alchemy
5. Etherscan and/or Polygonscan API key (for contract verification)

## Setup

1. Copy `.env.example` to `.env` and fill in your details:

```bash
cd hardhat
cp .env.example .env
```

2. Edit `.env` and add your private key and API keys

3. Install dependencies:

```bash
cd hardhat
npm install
```

## Compilation

Compile the smart contract:

```bash
npm run compile
```

This will generate the ABI and other artifacts in the `artifacts` folder.

## Extract ABI

Extract the ABI and bytecode to the frontend folder:

```bash
npm run extract-abi
```

This will copy the ABI and bytecode to `src/web3/abi/UnhackableWallet.json` for use in the frontend.

## Deployment

### Local Deployment (Hardhat Network)

For testing, you can deploy to the local Hardhat network:

```bash
npx hardhat node
```

In a separate terminal:

```bash
npm run deploy:local
```

### Testnet Deployment

Deploy to Sepolia testnet:

```bash
npm run deploy:sepolia
```

Or deploy to Goerli:

```bash
npm run deploy:goerli
```

Or deploy to Mumbai (Polygon testnet):

```bash
npm run deploy:mumbai
```

Or deploy to Monad testnet:

```bash
npm run deploy:monad
```

### Update Frontend Contract Addresses

After deploying, update the contract address in the frontend:

```bash
node scripts/update-addresses.js <contract-address> <network-id>
```

Example:

```bash
node scripts/update-addresses.js 0x123456789abcdef 11155111
```

Network IDs:
- Ethereum Mainnet: 1
- Goerli: 5
- Sepolia: 11155111
- Polygon Mainnet: 137
- Mumbai: 80001
- Monad Testnet: 2023

## Verify Contract on Blockchain Explorers

Verify the contract on the blockchain explorer:

For Ethereum testnets (Sepolia, Goerli):
```bash
npx hardhat verify --network sepolia <contract-address>
```

For Monad testnet:
```bash
npm run verify:monad <contract-address>
```

## Testing

Run tests:

```bash
npm test
```

## Integration with Frontend

The frontend code in `src/web3/contract.ts` is already set up to interact with the deployed contract. After updating the contract address, the frontend should be able to interact with the deployed contract automatically.

## Contract Features

The UnhackableWallet smart contract provides the following features:

1. Report suspicious addresses as potential scams
2. DAO-based voting system for confirming scam reports
3. Secure fund transfer with scam address checking
4. Scam likelihood scoring for addresses

## Troubleshooting

### Private Key Issues

If you encounter errors related to your private key, use our validation tool:

```powershell
npm run validate:key
```

This tool will check your private key format and help diagnose common issues. To automatically attempt to fix private key issues:

```powershell
npm run fix:key
```

Common private key errors and their solutions:

- **"Invalid account: #0 - private key too short, expected 32 bytes"**: Your private key must be exactly 64 hexadecimal characters (without the 0x prefix). Make sure you've copied the entire private key.

- **"Cannot read properties of undefined (reading 'wait')"**: This typically means your private key is invalid or you don't have enough funds on the account.

For complete instructions on managing private keys, see [MONAD_STEP_BY_STEP.md](./MONAD_STEP_BY_STEP.md).

### Other Common Issues

- **Transaction Reverted**: Check that you have enough native tokens (ETH, MATIC, MONAD) for gas
- **Contract Not Found**: Verify the contract address in `src/web3/contract.ts`
- **Network Mismatch**: Make sure you're connected to the same network where the contract is deployed
