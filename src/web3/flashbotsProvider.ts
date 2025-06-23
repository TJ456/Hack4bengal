// flashbotsProvider.ts
// Flashbots provider setup for MEV protection
// You must provide a relayer private key (NOT your main wallet key!)

import { ethers } from 'ethers';
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';

// Replace with your relayer private key (never use your main wallet key)
const RELAYER_PRIVATE_KEY = process.env.NEXT_PUBLIC_FLASHBOTS_RELAYER_KEY || '';

if (!RELAYER_PRIVATE_KEY) {
  throw new Error('Flashbots relayer private key not set. Set NEXT_PUBLIC_FLASHBOTS_RELAYER_KEY in your environment.');
}

// Mainnet or Goerli RPC URL
const ETHEREUM_RPC_URL = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';

export async function getFlashbotsProvider() {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
  const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, relayerWallet);
  return flashbotsProvider;
}
