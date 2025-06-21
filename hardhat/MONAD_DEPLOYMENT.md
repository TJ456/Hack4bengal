# Deploying UnhackableWallet on Monad Testnet

This guide provides specific instructions for deploying and interacting with the UnhackableWallet smart contract on the Monad testnet.

## What is Monad?

Monad is a high-performance Layer-1 blockchain designed for maximum EVM compatibility, with significant performance improvements over traditional EVM chains. It's built to achieve high throughput while maintaining full EVM compatibility.

Key advantages of deploying on Monad:
- Up to 10,000 TPS (transactions per second)
- Sub-second block times
- 100% EVM compatibility
- Lower gas fees than Ethereum mainnet
- Fully decentralized infrastructure

## Prerequisites

1. Private key of an account with Monad testnet tokens
2. Basic knowledge of Ethereum development
3. Node.js and npm installed

## Getting Monad Testnet Tokens

To deploy on Monad testnet, you need testnet MONAD tokens. You can get them from:

- [Monad Testnet Faucet](https://faucet.testnet.monad.xyz/)
- [Monad Discord](https://discord.gg/monad) - Check the #testnet-faucet channel

## Setting Up for Monad

1. Create or update your `.env` file based on the `.env.example` template:

```bash
cd hardhat
cp .env.example .env
```

2. Edit the `.env` file to include your private key and optionally customize the Monad RPC URL:

```
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_private_key_here
```

> **Note**: Your private key must be 32 bytes (64 hexadecimal characters). You can include or omit the '0x' prefix - the system handles both formats.

## Deploying to Monad Testnet

Deploy your contract to Monad testnet:

```powershell
npm run deploy:monad
```

This will deploy the UnhackableWallet contract to Monad testnet and print the contract address.

For detailed step-by-step instructions, see the [MONAD_STEP_BY_STEP.md](./MONAD_STEP_BY_STEP.md) guide.

## Updating Frontend Configuration

After deployment, update your frontend configuration with the new contract address:

```bash
node scripts/update-addresses.js <contract-address> 2023
```

Where `<contract-address>` is the address of your newly deployed contract on Monad testnet.

## Verifying Your Contract on Monad Explorer

Verify your contract on the Monad Explorer:

```bash
npm run verify:monad <contract-address>
```

## Monad-Specific Considerations

1. **Transaction Speed**: Monad transactions are much faster than traditional EVM chains. Your UI might need adjustments to account for this improved speed.

2. **Gas Optimization**: While gas optimization is always important, Monad's architecture makes certain operations more efficient. Your contract is already optimized for standard EVM chains, but you may find that certain operations perform better on Monad.

3. **Block Times**: Monad has faster block times than chains like Ethereum mainnet, which can affect your application's UX design.

## Testing on Monad

Run a simple test transaction after deployment:

```bash
npx hardhat run scripts/test-monad-deployment.js --network monad_testnet
```

This will execute a test transaction to validate that your contract is working correctly on Monad.

## Troubleshooting

- **RPC Errors**: If you encounter RPC errors, ensure you're using the latest Monad testnet RPC URL.
- **Gas Estimation Issues**: Monad may handle gas estimation differently than other EVM chains. Try setting manual gas limits if you encounter issues.
- **Contract Verification Problems**: If contract verification fails, ensure you're using the exact same compiler version that was used for deployment.

## Resources

- [Monad Documentation](https://docs.monad.xyz/)
- [Monad Testnet Explorer](https://explorer.testnet.monad.xyz/)
- [Monad Testnet RPC](https://rpc.testnet.monad.xyz/)
