import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import walletConnector from '../web3/wallet';
import { shortenAddress, formatEth } from '../web3/utils';

interface WalletInfoProps {
  showNetworkInfo?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

const WalletInfo: React.FC<WalletInfoProps> = ({ showNetworkInfo = false, autoRefresh = false, className = '' }) => {
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState<string | null>(null);

  const updateBalance = async () => {
    if (walletConnector.address) {
      try {
        const newBalance = await walletConnector.getBalance();
        setBalance(newBalance);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    }
  };

  useEffect(() => {
    updateBalance();

    if (autoRefresh) {
      const interval = setInterval(updateBalance, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    const getNetwork = async () => {
      try {
        const network = await walletConnector.provider.getNetwork();
        const networkName = walletConnector.getNetworkName(Number(network.chainId));
        setNetwork(networkName);
      } catch (err) {
        console.error("Error fetching network:", err);
      }
    };

    if (showNetworkInfo) {
      getNetwork();
    }
  }, [showNetworkInfo]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Wallet Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-mono text-sm">{shortenAddress(walletConnector.address || '')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Balance</p>
            <p className="font-mono text-sm">{formatEth(balance)} ETH</p>
          </div>
          {showNetworkInfo && network && (
            <div>
              <p className="text-sm text-gray-600">Network</p>
              <Badge variant="outline">{network}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletInfo;
