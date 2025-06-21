
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ArrowUpRight, ArrowDownLeft, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import walletConnector from '@/web3/wallet';
import { shortenAddress } from '@/web3/utils';
import { formatUnits } from 'ethers';

interface Transaction {
  id: number;
  type: 'send' | 'receive' | 'approve' | 'contract';
  amount: string;
  to?: string;
  from?: string;
  status: 'safe' | 'blocked' | 'pending';
  hash: string | null;
  timestamp: string;
  gasUsed: string;
  reason?: string;
}

// Helper function to calculate time since a block
const getTimeSince = async (blockNumber: number): Promise<string> => {
  try {
    // Get current block
    const provider = walletConnector.provider;
    if (!provider) return "Unknown";
    
    const currentBlock = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    if (!block || !block.timestamp) return "Unknown";
    
    const blockTime = new Date(Number(block.timestamp) * 1000);
    const now = new Date();
    
    const seconds = Math.floor((now.getTime() - blockTime.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  } catch (err) {
    console.error("Error calculating time since:", err);
    return "Unknown";
  }
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!walletConnector.address || !walletConnector.provider) {
          setLoading(false);
          return;
        }
        
        // Get the last 10 transactions for the connected address
        const userAddress = walletConnector.address;
        
        try {
          // Get real transactions using ethers provider
          const provider = walletConnector.provider;
          
          if (!provider) {
            throw new Error("Provider not available");
          }
          
          // For simplicity in this implementation, we'll use mock data
          // In a real production app, you would:
          // 1. Use an explorer API like Etherscan, Alchemy, or Infura
          // 2. Or integrate with a proper transaction indexing service
          
          // This simulates real transaction history based on the connected wallet
          const mockTransactions: Transaction[] = [
            {
              id: 1,
              type: 'send',
              amount: '0.5 ETH',
              to: '0x742d35Cc6E8877bC2eC20E2a9eE29D38d098d6',
              from: userAddress,
              status: 'safe',
              hash: '0x8f4b7c1a2d3e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e',
              timestamp: '10 min ago',
              gasUsed: '21,000'
            },
            {
              id: 2,
              type: 'receive',
              amount: '0.1 ETH',
              from: '0x1f9840a85d5aF5bf1D1762F925BDAdc4201F984',
              to: userAddress,
              status: 'safe',
              hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
              timestamp: '1 hour ago',
              gasUsed: '21,000'
            },
            {
              id: 3,
              type: 'approve',
              amount: 'Token Approval',
              to: '0xDEADBEEF01234567ABCDEF123456789MALICIOUS',
              from: userAddress,
              status: 'blocked',
              hash: null,
              timestamp: '2 hours ago',
              gasUsed: 'N/A',
              reason: 'Detected unlimited approval to suspicious contract'
            },
            {
              id: 4,
              type: 'contract',
              amount: '0.01 ETH',
              to: '0x7a791fe5a35131b7d98f854a64e7f94180f27c7b',
              from: userAddress,
              status: 'safe',
              hash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
              timestamp: '1 day ago',
              gasUsed: '85,420'
            },
            {
              id: 5,
              type: 'receive',
              amount: '0.25 ETH',
              from: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
              to: userAddress,
              status: 'safe',
              hash: '0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
              timestamp: '3 days ago',
              gasUsed: '21,000'
            }
          ];
          
          setTransactions(mockTransactions);
          console.log("Mock transactions loaded for user", shortenAddress(userAddress));
          
          // In a future implementation, we'll replace this with:
          // 1. Get transactions from an explorer API
          // 2. Parse and categorize them
          // 3. Apply security checks on each transaction
        } catch (err: any) {
          console.error("Failed to fetch transaction history:", err);
          setError("Could not load transaction history");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    
    // Setup event listeners for wallet connection changes
    const handleAccountChange = () => fetchTransactions();
    window.addEventListener('wallet_accountChanged', handleAccountChange);
    
    return () => {
      window.removeEventListener('wallet_accountChanged', handleAccountChange);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="h-4 w-4 text-green-500" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="h-4 w-4 text-orange-400" />;
      case 'receive': return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'approve': return <Shield className="h-4 w-4 text-blue-400" />;
      default: return <History className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };
  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <History className="h-5 w-5 text-cyan-400" />
          <span>Transaction History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        ) : !walletConnector.address ? (
          <div className="text-center p-6">
            <p className="text-gray-400">Connect your wallet to view transaction history</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(tx.type)}
                    {getStatusIcon(tx.status)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium capitalize">{tx.type}</span>
                      <span className="text-cyan-400 font-mono">{tx.amount}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {tx.type === 'send' || tx.type === 'approve' ? `To: ${shortenAddress(tx.to || '')}` : `From: ${shortenAddress(tx.from || '')}`}
                    </div>
                    {tx.hash && (
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        Tx: {shortenAddress(tx.hash, 8)}
                      </div>
                    )}
                    {tx.reason && (
                      <div className="text-xs text-red-400 mt-1">{tx.reason}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{tx.timestamp}</div>
                    <div className="text-xs text-gray-500">Gas: {tx.gasUsed}</div>
                  </div>
                  <Badge className={getStatusColor(tx.status)}>
                    {tx.status === 'safe' ? '🟢' : tx.status === 'blocked' ? '🔴' : '🟠'} {tx.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
