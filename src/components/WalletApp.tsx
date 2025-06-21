// WalletApp Component - Main UI for Web3 Functionality
// Handles wallet connection, transfers, and security features

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Grid, Wallet, Send, Shield, Users, Lock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

import walletConnector from '../web3/wallet';
import contractService from '../web3/contract';
import { reportScam, voteOnProposal, sendTransaction } from '../web3/contract';
import { shortenAddress, isValidAddress, formatEth } from '../web3/utils';
import TransactionForm from './TransactionForm';
import WalletInfo from './WalletInfo';
import GuardianManager from './GuardianManager';

interface WalletAppProps {
  onAddressChanged?: (address: string | null) => void;
}

const WalletApp: React.FC<WalletAppProps> = ({ onAddressChanged }) => {
  // State for wallet connection
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for transfers (legacy - keeping for backward compatibility)
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // State for security checks
  const [isSafe, setIsSafe] = useState<boolean>(true);
  const [scamScore, setScamScore] = useState<number>(0);

  // New state for enhanced UI
  const [activeView, setActiveView] = useState<'overview' | 'send' | 'report' | 'vote' | 'security'>('overview');

  const { toast } = useToast();

  // State for scam reporting
  const [scamAddress, setScamAddress] = useState<string>('');
  const [scamReason, setScamReason] = useState<string>('');
  const [isReporting, setIsReporting] = useState<boolean>(false);

  // State for voting
  const [proposalId, setProposalId] = useState<string>('');
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  // Connect wallet on component mount if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (walletConnector.isMetaMaskInstalled() && walletConnector.address) {
        try {
          setIsConnecting(true);
          await walletConnector.connect();
          setAddress(walletConnector.address);
          await updateBalance();
          if (onAddressChanged) onAddressChanged(walletConnector.address);
        } catch (err: any) {
          console.error("Connection error:", err);
          setError(err.message);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    checkConnection();

    // Listen for wallet events
    window.addEventListener('wallet_disconnected', handleDisconnect);
    window.addEventListener('wallet_accountChanged', handleAccountChange);

    return () => {
      window.removeEventListener('wallet_disconnected', handleDisconnect);
      window.removeEventListener('wallet_accountChanged', handleAccountChange);
    };
  }, [onAddressChanged]);

  // Handle wallet connect button click
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectedAddress = await walletConnector.connect();
      setAddress(connectedAddress);
      await updateBalance();

      if (onAddressChanged) onAddressChanged(connectedAddress);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnect
  const handleDisconnect = () => {
    walletConnector.disconnect();
    setAddress(null);
    setBalance('0');
    if (onAddressChanged) onAddressChanged(null);
  };

  // Handle account change event
  const handleAccountChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const newAddress = customEvent.detail?.address;
    setAddress(newAddress);
    updateBalance();
    if (onAddressChanged) onAddressChanged(newAddress);
  };

  // Update ETH balance
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

  // Handle scam report submission
  const handleScamReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scamAddress || !scamReason) return;

    setIsReporting(true);
    try {
      await contractService.reportScam(scamAddress, scamReason, '');
      toast({
        title: "✅ Report Submitted",
        description: "Thank you for helping protect the community!",
        variant: "default"
      });
      setScamAddress('');
      setScamReason('');
      setActiveView('overview');
    } catch (error: any) {
      toast({
        title: "❌ Report Failed",
        description: error.message || "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setIsReporting(false);
    }
  };

  // Handle vote submission
  const handleVoteSubmit = async (support: boolean) => {
    if (!proposalId) return;

    setIsVoting(true);
    try {
      await contractService.voteOnScamReport(proposalId, support);
      toast({
        title: "🗳️ Vote Submitted",
        description: `Your ${support ? 'support' : 'opposition'} vote has been recorded.`,
        variant: "default"
      });
      setProposalId('');
      setActiveView('overview');
    } catch (error: any) {
      toast({
        title: "❌ Vote Failed",
        description: error.message || "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };
  // Legacy handler for form compatibility  
  const handleVoteForm = (e: React.FormEvent) => {
    e.preventDefault();
    // This is handled by handleVoteSubmit buttons
  };

  // Check if recipient address is safe (not reported as scam)
  const checkRecipientSafety = async (address: string) => {
    if (isValidAddress(address)) {
      try {
        const isScam = await contractService.isScamAddress(address);
        const score = await contractService.getScamScore(address);

        setIsSafe(!isScam);
        setScamScore(score);
      } catch (err) {
        console.error("Error checking address safety:", err);
        // Default to safe if can't check
        setIsSafe(true);
        setScamScore(0);
      }
    } else {
      // Invalid address format, no need to check
      setIsSafe(true);
      setScamScore(0);
    }
  };

  // Handle recipient input change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRecipient = e.target.value;
    setRecipient(newRecipient);

    // Check safety if address looks valid
    if (newRecipient.length > 30) {
      checkRecipientSafety(newRecipient);
    } else {
      setIsSafe(true);
      setScamScore(0);
    }
  };

  // Handle send transaction
  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !isValidAddress(recipient) || !amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid recipient address and amount");
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      // Check recipient safety one more time before sending
      await checkRecipientSafety(recipient);

      if (!isSafe && scamScore > 50) {
        if (!window.confirm(`WARNING: This address has been reported as potentially unsafe (Scam score: ${scamScore}/100). Do you still want to proceed?`)) {
          setIsSending(false);
          return;
        }
      }
        // Check if user has enough balance before sending
      const hasBalance = await contractService.hasEnoughBalance(amount);
      if (!hasBalance) {
        throw new Error("Insufficient balance for this transaction (including gas)");
      }

      // Use the standalone function for secure transfer
      const hash = await sendTransaction(recipient, amount);
      setTxHash(hash);

      // Clear form and update balance
      setRecipient('');
      setAmount('');

      // Set a timeout to clear the transaction hash display after a few seconds
      setTimeout(() => setTxHash(null), 5000);

      await updateBalance();
    } catch (err: any) {      console.error("Transaction error:", err);
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        setError('Transaction cancelled');
        toast({
          title: "Transaction Cancelled",
          description: "The transaction was cancelled",
          variant: "default"
        });
      } else {
        setError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };
    // Handle report scam submission
  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !isValidAddress(scamAddress) || !scamReason) {
      setError("Please enter a valid address and reason");
      return;
    }

    try {
      setIsReporting(true);
      setError(null);

      // First verify contract is valid
      const isContractValid = await contractService.verifyContract();
      if (!isContractValid) {
        throw new Error("Cannot connect to the contract. Please check your network connection.");
      }

      const hash = await reportScam(scamAddress, scamReason);
      setTxHash(hash);

      // Clear form
      setScamAddress('');
      setScamReason('');

      // Set success message
      setTimeout(() => setTxHash(null), 5000);
    } catch (err: any) {
      console.error("Report error:", err);
      setError(err.message);
    } finally {
      setIsReporting(false);
    }
  };
    // Handle vote submission
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !proposalId) {
      setError("Please enter a valid proposal ID");
      return;
    }

    try {
      setIsVoting(true);
      setError(null);

      // First verify contract is valid
      const isContractValid = await contractService.verifyContract();
      if (!isContractValid) {
        throw new Error("Cannot connect to the contract. Please check your network connection.");
      }

      // Show confirmation dialog
      if (!window.confirm(`Are you sure you want to vote ${voteSupport ? 'IN SUPPORT OF' : 'AGAINST'} proposal ${proposalId}?`)) {
        setIsVoting(false);
        return;
      }

      const hash = await voteOnProposal(proposalId, voteSupport);
      setTxHash(hash);

      // Clear form
      setProposalId('');

      // Set success message
      setTimeout(() => setTxHash(null), 5000);
    } catch (err: any) {
      console.error("Vote error:", err);
      setError(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  // Render safety warning badge
  const renderSafetyBadge = () => {
    if (!recipient || recipient.length < 30) return null;

    if (!isValidAddress(recipient)) {
      return <Badge variant="outline" className="bg-yellow-100">Invalid Address</Badge>;
    }

    if (!isSafe) {
      return <Badge variant="destructive">Reported as Unsafe!</Badge>;
    }

    if (scamScore > 30) {
      return <Badge variant="secondary" className="bg-yellow-100">Caution: Score {scamScore}/100</Badge>;
    }

    return <Badge variant="outline" className="bg-green-100">Address Looks Safe</Badge>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Unhackable Wallet</CardTitle>
                <CardDescription className="text-blue-100">
                  Secure Ethereum transactions with AI-powered scam protection
                </CardDescription>
              </div>
            </div>
            {address && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {!address ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Wallet className="h-16 w-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
                <p className="text-gray-600">Connect your MetaMask wallet to get started</p>
              </div>
              <Button
                onClick={handleConnect}
                className="w-full"
                disabled={isConnecting}
                size="lg"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>                <TabsList className="inline-flex w-full justify-center rounded-lg bg-muted p-1">
                  <TabsTrigger value="overview" className="w-full items-center justify-center gap-2 rounded-md px-3 py-2">
                    <Grid className="h-4 w-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="send" className="w-full items-center justify-center gap-2 rounded-md px-3 py-2">
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </TabsTrigger>
                  <TabsTrigger value="report" className="w-full items-center justify-center gap-2 rounded-md px-3 py-2">
                    <Shield className="h-4 w-4" />
                    <span>Report</span>
                  </TabsTrigger>
                  <TabsTrigger value="vote" className="w-full items-center justify-center gap-2 rounded-md px-3 py-2">
                    <Users className="h-4 w-4" />
                    <span>Vote</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="w-full items-center justify-center gap-2 rounded-md px-3 py-2">
                    <Lock className="h-4 w-4" />
                    <span>Security</span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Wallet Info - Full width on mobile, 1 column on desktop */}
                    <div className="lg:col-span-1">
                      <WalletInfo
                        showNetworkInfo={true}
                        autoRefresh={true}
                        className="h-fit"
                      />
                    </div>

                    {/* Quick Actions - 2 columns on desktop */}
                    <div className="lg:col-span-2 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              onClick={() => setActiveView('send')}
                              className="h-20 flex flex-col items-center justify-center space-y-2"
                              variant="outline"
                            >
                              <Send className="h-6 w-6" />
                              <span>Send Transaction</span>
                            </Button>
                            <Button
                              onClick={() => setActiveView('report')}
                              className="h-20 flex flex-col items-center justify-center space-y-2"
                              variant="outline"
                            >
                              <Shield className="h-6 w-6" />
                              <span>Report Scam</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Activity */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {txHash ? (
                            <div className="text-sm">
                              <p className="text-gray-600">Last transaction:</p>
                              <p className="font-mono">{shortenAddress(txHash, 6)}</p>
                            </div>
                          ) : (
                            <p className="text-gray-500">No recent transactions</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Send Tab */}
                <TabsContent value="send" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Wallet Info */}
                    <div className="lg:col-span-1">
                      <WalletInfo
                        showNetworkInfo={true}
                        autoRefresh={true}
                        className="h-fit"
                      />
                    </div>

                    {/* Transaction Form */}
                    <div className="lg:col-span-2">
                      <TransactionForm
                        onTransactionComplete={(txHash) => {
                          setTxHash(txHash);
                          updateBalance();
                          toast({
                            title: "🎉 Transaction Complete!",
                            description: `Transaction ${txHash.slice(0, 10)}... has been confirmed.`,
                            variant: "default"
                          });
                          // Switch back to overview after successful transaction
                          setTimeout(() => setActiveView('overview'), 2000);
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Report Tab */}
                <TabsContent value="report" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Report Scam Address</CardTitle>
                      <CardDescription>
                        Help protect the community by reporting suspicious addresses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleScamReport} className="space-y-4">
                        <div>
                          <Label htmlFor="scam-address">Suspicious Address</Label>
                          <Input
                            id="scam-address"
                            placeholder="0x..."
                            value={scamAddress}
                            onChange={(e) => setScamAddress(e.target.value)}
                            disabled={isReporting}
                          />
                        </div>

                        <div>
                          <Label htmlFor="scam-reason">Reason for Report</Label>
                          <Input
                            id="scam-reason"
                            placeholder="Describe the suspicious activity..."
                            value={scamReason}
                            onChange={(e) => setScamReason(e.target.value)}
                            disabled={isReporting}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isReporting || !scamAddress || !scamReason}
                        >
                          {isReporting ? "Submitting Report..." : "Submit Report"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Vote Tab */}
                <TabsContent value="vote" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>DAO Voting</CardTitle>
                      <CardDescription>
                        Vote on community scam reports
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleVoteForm} className="space-y-4">
                        <div>
                          <Label htmlFor="proposal-id">Proposal ID</Label>
                          <Input
                            id="proposal-id"
                            placeholder="Enter proposal ID..."
                            value={proposalId}
                            onChange={(e) => setProposalId(e.target.value)}
                            disabled={isVoting}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={() => handleVoteSubmit(true)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isVoting || !proposalId}
                          >
                            {isVoting ? "Voting..." : "Vote For"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleVoteSubmit(false)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isVoting || !proposalId}
                          >
                            {isVoting ? "Voting..." : "Vote Against"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Wallet Info */}
                    <div className="lg:col-span-1">
                      <WalletInfo
                        showNetworkInfo={true}
                        autoRefresh={true}
                        className="h-fit"
                      />
                    </div>

                    {/* Social Recovery Management */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Social Recovery</CardTitle>
                          <CardDescription>
                            Manage guardians and recovery settings for your wallet
                          </CardDescription>
                        </CardHeader>                      <CardContent className="p-6">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-medium">Active Guardians</h4>
                                <p className="text-sm text-muted-foreground">
                                  Manage your wallet recovery guardians
                                </p>
                              </div>
                              <Button
                                onClick={() => setActiveView('security')}
                                size="sm"
                                className="inline-flex items-center space-x-2"
                              >
                                <Lock className="h-4 w-4" />
                                <span>Manage</span>
                              </Button>
                            </div>
                            <GuardianManager walletAddress={address} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disconnect Button */}
      {address && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Connected to wallet</p>
                <p className="font-mono text-sm">{shortenAddress(address)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WalletApp;
