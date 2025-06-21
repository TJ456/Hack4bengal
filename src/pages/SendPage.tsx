import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SendTransaction from '@/components/SendTransaction';
import { connectWallet } from '@/web3/wallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Wallet, Shield } from 'lucide-react';

const SendPage: React.FC = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [fraudDetectionEnabled, setFraudDetectionEnabled] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Connect wallet on initial load
  useEffect(() => {
    const connectOnLoad = async () => {
      const address = await connectWallet();
      setConnectedAddress(address);
    };
    
    connectOnLoad();
  }, []);
  
  // Handle wallet connect button click
  const handleConnectWallet = async () => {
    const address = await connectWallet();
    setConnectedAddress(address);
  };
  
  // Handle successful transaction
  const handleTransactionSuccess = (txHash: string) => {
    setLastTransaction(txHash);
  };
  
  // Handle fraud detected
  const handleFraudDetected = (fraudData: any) => {
    console.log('Fraud detected:', fraudData);
    // Additional logic can be added here if needed
  };
  
  // Toggle fraud detection
  const toggleFraudDetection = () => {
    setFraudDetectionEnabled(!fraudDetectionEnabled);
  };
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Send Tokens</h1>
      
      {/* Wallet Connection Status */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Wallet Status</CardTitle>
            {connectedAddress ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {connectedAddress ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Connected Address:</p>
                <p className="font-mono text-sm">{connectedAddress}</p>
              </div>
              <Wallet className="h-5 w-5 text-gray-500" />
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-sm">Please connect your wallet to continue</p>
              <Button onClick={handleConnectWallet}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Fraud Detection Status */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Transaction Protection</CardTitle>
            <Button 
              variant={fraudDetectionEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={toggleFraudDetection}
            >
              <Shield className="mr-2 h-4 w-4" />
              {fraudDetectionEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          <CardDescription>
            AI-powered fraud detection using external ML API
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-start space-x-2 text-sm">
            <AlertCircle className={`h-5 w-5 ${fraudDetectionEnabled ? 'text-green-500' : 'text-yellow-500'}`} />
            <p>
              {fraudDetectionEnabled ? 
                "Fraud detection is active. Suspicious transactions will be flagged before processing." : 
                "Warning: Fraud detection is disabled. Enable it to protect your assets."}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Send Transaction Form */}
      {connectedAddress ? (
        <SendTransaction 
          onSuccess={handleTransactionSuccess} 
          onFraudDetected={handleFraudDetected}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Wallet className="mx-auto h-8 w-8 mb-2" />
              <p>Connect your wallet to send tokens</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Last Transaction Info */}
      {lastTransaction && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Transaction Hash:</p>
              <p className="font-mono text-sm break-all">{lastTransaction}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.open(`https://explorer.testnet.monad.xyz/tx/${lastTransaction}`, '_blank')}>
                View on Explorer
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SendPage;
