
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import walletConnector from '@/web3/wallet';
import { shortenAddress } from '@/web3/utils';
import { NETWORK_INFO, isMonadNetwork } from '@/web3/utils';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  isConnected: boolean;
  address: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, isConnected, address }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update network info when component mounts or address changes
  useEffect(() => {
    const updateNetworkInfo = async () => {
      if (walletConnector.provider) {
        try {
          const network = await walletConnector.provider.getNetwork();
          const name = walletConnector.getNetworkName(Number(network.chainId));
          setNetworkName(name);
        } catch (err) {
          console.error("Failed to get network info:", err);
        }
      }
    };
    
    if (isConnected) {
      updateNetworkInfo();
    }
    
    // Listen for chain changes
    const handleChainChanged = () => updateNetworkInfo();
    window.ethereum?.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Use the real wallet connector
      const connectedAddress = await walletConnector.connect();
      onConnect(connectedAddress);
      
      // Get network info after connection
      const network = await walletConnector.provider?.getNetwork();
      if (network) {
        setNetworkName(walletConnector.getNetworkName(Number(network.chainId)));
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };
  
  // Get explorer URL for the address
  const getExplorerUrl = () => {
    // Default to Etherscan
    let url = `https://etherscan.io/address/${address}`;
    
    // Use appropriate blockchain explorer based on the network
    if (networkName?.includes('Monad')) {
      url = `https://explorer.testnet.monad.xyz/address/${address}`;
    } else if (networkName?.includes('Goerli')) {
      url = `https://goerli.etherscan.io/address/${address}`;
    } else if (networkName?.includes('Sepolia')) {
      url = `https://sepolia.etherscan.io/address/${address}`;
    }
    
    return url;
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Connected
        </Badge>
        {networkName && (        <Badge className={`${networkName?.toLowerCase().includes('mainnet') 
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
            {networkName}
          </Badge>
        )}
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <Wallet className="h-4 w-4 text-cyan-400" />
          <span className="text-white font-mono text-sm">{shortenAddress(address)}</span>
          <button 
            onClick={copyAddress}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy Address"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a 
            href={getExplorerUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            title="View in Explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button 
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      {error && (
        <div className="flex items-center text-xs text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
