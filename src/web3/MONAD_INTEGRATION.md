# Monad Frontend Integration Guide

This guide explains how to integrate the Monad testnet with your frontend application for the UnhackableWallet.

## Configuring MetaMask for Monad Testnet

To interact with the UnhackableWallet contract on Monad testnet, users need to configure their MetaMask wallet:

1. Open MetaMask and click on the network selector at the top
2. Click "Add Network" and then "Add Network Manually"
3. Enter the following information:
   - **Network Name**: Monad Testnet
   - **New RPC URL**: https://rpc.testnet.monad.xyz
   - **Chain ID**: 2023
   - **Currency Symbol**: MONAD
   - **Block Explorer URL**: https://explorer.testnet.monad.xyz
4. Click Save

## Updating Wallet Connection Code

The wallet connection code should be updated to support Monad testnet. Here's how to do it:

```typescript
// In src/web3/wallet.ts

// Add Monad network details
const NETWORKS = {
  '1': {
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  '5': {
    name: 'Goerli Testnet',
    currency: 'ETH',
    explorer: 'https://goerli.etherscan.io'
  },
  '11155111': {
    name: 'Sepolia Testnet',
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io'
  },
  '2023': {
    name: 'Monad Testnet',
    currency: 'MONAD',
    explorer: 'https://explorer.testnet.monad.xyz'
  }
};

// Add this method to your wallet connection class
async function switchToMonad() {
  if (!window.ethereum) throw new Error('MetaMask is not installed');
  
  try {
    // Try to switch to Monad testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7E7' }], // 2023 in hex
    });
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7E7', // 2023 in hex
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'MONAD',
                symbol: 'MONAD',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.testnet.monad.xyz'],
              blockExplorerUrls: ['https://explorer.testnet.monad.xyz'],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Could not add Monad network to MetaMask');
      }
    } else {
      throw error;
    }
  }
}
```

## Transaction Optimizations for Monad

Monad has faster block times and lower gas fees than Ethereum mainnet. Consider these optimizations:

1. **Lower wait times**: Transactions confirm faster, so UI can be more responsive:

```typescript
// Before (Ethereum)
const tx = await contractService.reportScam(address, reason, evidence);
await tx.wait(2); // Wait for 2 confirmations

// After (Monad)
const tx = await contractService.reportScam(address, reason, evidence);
await tx.wait(1); // Only 1 confirmation needed
```

2. **Gas price adjustments**: Monad uses lower gas prices:

```typescript
// Optional gas price optimization
const gasPrice = await walletConnector.provider?.getGasPrice();
const adjustedGasPrice = gasPrice ? gasPrice * 0.8 : undefined; // 20% lower

const tx = await contract.reportScam(
  suspiciousAddress, 
  reason, 
  evidence, 
  { gasPrice: adjustedGasPrice }
);
```

## UI Considerations for Monad

1. Add a Monad-specific connect button:

```tsx
<button 
  className="btn btn-primary" 
  onClick={walletConnector.switchToMonad}
>
  Connect to Monad Testnet
</button>
```

2. Display transaction confirmations faster:

```tsx
// Traditional approach
const [confirmations, setConfirmations] = useState(0);
const requiredConfirmations = chainId === '2023' ? 1 : 3;

useEffect(() => {
  if (transaction) {
    const interval = setInterval(async () => {
      const receipt = await provider.getTransactionReceipt(transaction.hash);
      if (receipt) {
        setConfirmations(receipt.confirmations);
        if (receipt.confirmations >= requiredConfirmations) {
          clearInterval(interval);
        }
      }
    }, chainId === '2023' ? 500 : 2000); // Check more frequently on Monad
    
    return () => clearInterval(interval);
  }
}, [transaction, provider]);
```

## Testing the Integration

1. Make sure your contract is deployed to Monad testnet
2. Connect to Monad testnet in MetaMask
3. Try performing operations like reporting a scam or secure transfers
4. Verify that transactions are completed quickly

## Network Detection

Always check the current network in your application:

```tsx
useEffect(() => {
  const checkNetwork = async () => {
    const chainId = await walletConnector.getChainId();
    
    // Preferred network is Monad Testnet (2023)
    if (chainId !== '2023') {
      setNetworkWarning(
        `You're currently on ${NETWORKS[chainId]?.name || 'an unknown network'}. 
        For best performance, please switch to Monad Testnet.`
      );
    } else {
      setNetworkWarning(null);
    }
  };
  
  if (walletConnector.isConnected) {
    checkNetwork();
  }
}, [walletConnector.isConnected]);
```

## Resources

- [Monad Documentation](https://docs.monad.xyz/)
- [Monad Testnet Explorer](https://explorer.testnet.monad.xyz/)
- [Monad Discord](https://discord.gg/monad)
