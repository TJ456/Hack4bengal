import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Zap, Users, FileText, Settings, PieChart, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import WalletConnect from '@/components/WalletConnect';
import ThreatMonitor from '@/components/ThreatMonitor';
import TransactionHistory from '@/components/TransactionHistory';
import DAOPanel from '@/components/dao/DAOPanel';
import TransactionInterceptor from '@/components/TransactionInterceptor';
import SecurityScore from '@/components/SecurityScore';
import AILearningFeedback from '@/components/AILearningFeedback';
import TelegramCompanion from '@/components/TelegramCompanion';
import TelegramSettings from '@/components/TelegramSettings';
import WalletAnalytics from '@/components/WalletAnalytics';
import GuardianManager from '@/components/GuardianManager';
import { useCivicStore } from '@/stores/civicStore';
import SimpleCivicAuth from '@/components/civic/SimpleCivicAuth';

const Index = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [threatLevel, setThreatLevel] = useState<'safe' | 'warning' | 'danger'>('safe');
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState({
    fromAddress: '',
    toAddress: '',
    value: 0,
    gasPrice: 0
  });
  const [suspiciousAddress, setSuspiciousAddress] = useState('0xa12066091c6F636505Bd64F2160EA1884142B38c');  // Add this line
  const [activeTab, setActiveTab] = useState('overview');
  const [aiScansToday, setAiScansToday] = useState(247);
  const [blockedThreats, setBlockedThreats] = useState(15);
  const [savedAmount, setSavedAmount] = useState(12450);
  
  // New gamification states
  const [securityScore, setSecurityScore] = useState(67);
  const [shieldLevel, setShieldLevel] = useState('Defender');
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [lastAction, setLastAction] = useState<'vote' | 'report' | 'block' | 'scan'>('scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [civicClientId] = useState(import.meta.env.VITE_CIVIC_CLIENT_ID || "demo_client_id");
  
  const { toast } = useToast();

  // Reset threat level after some time for demo purposes
  useEffect(() => {
    if (threatLevel === 'danger' && !showInterceptor && !isProcessing) {
      const timer = setTimeout(() => {
        setThreatLevel('safe');
        toast({
          title: "System Secured",
          description: "Threat level returned to safe after blocking malicious transaction.",
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [threatLevel, showInterceptor, isProcessing, toast]);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'safe': return 'text-green-500 bg-green-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      case 'danger': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const simulateScamTransaction = () => {
    if (isProcessing) return;
    
    console.log('Simulating scam transaction...');
    setIsProcessing(true);
    
    // Set transaction details for the interceptor
    setTransactionDetails({
      fromAddress: currentAddress || '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
      toAddress: '0xa12066091c6F636505Bd64F2160EA1884142B38c',
      value: 0.00000000000001,
      gasPrice: 20
    });

    setAiScansToday(prev => prev + 1);
    setThreatLevel('danger');
    setLastAction('scan');
    setShowAIFeedback(true);
    
    toast({
      title: "⚠️ Analyzing Transaction",
      description: "ML model is analyzing the transaction...",
      variant: "default",
    });

    setTimeout(() => {
      setShowInterceptor(true);
      setIsProcessing(false);
    }, 800);
  };

  const handleBlockTransaction = () => {
    console.log('Transaction blocked by user');
    
    setBlockedThreats(prev => prev + 1);
    setSavedAmount(prev => prev + Math.floor(Math.random() * 5000) + 1000);
    setSecurityScore(prev => Math.min(100, prev + 3));
    setLastAction('block');
    setShowAIFeedback(true);
    
    setShowInterceptor(false);
    setIsProcessing(false);
    
    toast({
      title: "🛡️ Transaction Blocked",
      description: "Malicious transaction successfully blocked. Your funds are safe!",
    });

    setTimeout(() => {
      setThreatLevel('safe');
    }, 2000);
  };

  const handleCloseInterceptor = () => {
    console.log('Interceptor closed');
    setShowInterceptor(false);
    setIsProcessing(false);
    
    toast({
      title: "⚠️ Transaction Signed",
      description: "You chose to proceed with the risky transaction.",
      variant: "destructive",
    });
    
    setTimeout(() => {
      setThreatLevel('warning');
    }, 1000);
  };

  const handleDAOVote = (proposalId: number, vote: 'approve' | 'reject') => {
    console.log(`Voting ${vote} on proposal ${proposalId}`);
    setSecurityScore(prev => Math.min(100, prev + 2));
    setLastAction('vote');
    setShowAIFeedback(true);
    
    toast({
      title: "🗳️ Vote Recorded",
      description: `Your ${vote} vote has been submitted to the DAO.`,
    });
  };

  const handleThreatReport = () => {
    setSecurityScore(prev => Math.min(100, prev + 5));
    setLastAction('report');
    setShowAIFeedback(true);
    
    toast({
      title: "📊 Report Submitted",
      description: "Thank you for helping secure the Web3 community!",
    });
  };

  const handleCivicSuccess = (gatewayToken: string) => {
    if (currentAddress) {
      const store = useCivicStore.getState();
      store.setGatewayToken(currentAddress, gatewayToken);
      
      toast({
        title: "Identity Verified",
        description: "Your wallet is now verified with Civic",
      });
    }
  };

  const handleCivicError = (error: Error) => {
    toast({
      title: "Verification Failed",
      description: error.message,
      variant: "destructive"
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">The Unhackable Wallet</h1>
                <p className="text-sm text-gray-400">AI-Powered Web3 Guardian</p>
              </div>
            </div>
            <WalletConnect 
              onConnect={(address) => {
                setWalletConnected(true);
                setCurrentAddress(address);
                toast({
                  title: "Wallet Connected",
                  description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
                });
              }}
              isConnected={walletConnected}
              address={currentAddress}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-black/20 backdrop-blur-lg border-r border-white/10">
          <nav className="p-6 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'analytics', label: 'Wallet Analytics', icon: PieChart },
              { id: 'dao', label: 'DAO Voting', icon: Users },
              { id: 'reports', label: 'Threat Reports', icon: FileText },
              { id: 'recovery', label: 'Recovery', icon: Key },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Score Card */}
              <SecurityScore />

              {/* Threat Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Threat Level</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${threatLevel === 'danger' ? 'text-red-500' : threatLevel === 'warning' ? 'text-yellow-500' : 'text-green-500'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white capitalize">{threatLevel}</div>
                    <Badge className={`mt-2 ${getThreatColor(threatLevel)}`}>
                      {threatLevel === 'safe' ? 'All Systems Secure' : 
                       threatLevel === 'warning' ? 'Suspicious Activity' : 
                       'Threat Detected'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">AI Scans Today</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{aiScansToday}</div>
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="text-green-400">+{Math.floor(Math.random() * 20) + 5}%</span> from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Blocked Threats</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{blockedThreats}</div>
                    <p className="text-xs text-gray-400 mt-2">
                      Saved <span className="text-green-400">${savedAmount.toLocaleString()}</span> in potential losses
                    </p>
                  </CardContent>
                </Card>
              </div>              {/* Send Transaction Section */}
              <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Send Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">                    <Button 
                      asChild
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                    >
                      <Link to="/send">💸 Send Tokens Securely</Link>
                    </Button>
                    <p className="text-sm text-gray-400">
                      Send tokens to any address with ML-powered fraud detection.
                      Our AI will analyze the transaction and warn you about potential risks.
                      <span className="text-cyan-400 font-medium"> Protected by external ML fraud detection!</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Demo Section */}
              <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">AI Security Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={simulateScamTransaction}
                      disabled={showInterceptor || isProcessing}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : showInterceptor ? 'Threat Active...' : '🚨 Simulate Scam Transaction'}
                    </Button>
                    <p className="text-sm text-gray-400">
                      Test the AI threat detection system with a simulated malicious transaction. 
                      Our AI will analyze the transaction and warn you about potential risks.
                      <span className="text-cyan-400 font-medium"> Earn +3 Shield Points when you block threats!</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Threat Monitor */}
              <ThreatMonitor threatLevel={threatLevel} />

              {/* Transaction History */}
              <TransactionHistory />
            </div>
          )}

          {activeTab === 'analytics' && <WalletAnalytics walletAddress={currentAddress} />}
          
          {activeTab === 'dao' && (
            <div className="space-y-6">
              <DAOPanel />
            </div>
          )}

          {activeTab === 'reports' && (
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Community Threat Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Help protect the Web3 community by reporting suspicious contracts and activities.
                    <span className="text-purple-400 font-medium"> Earn +5 Shield Points per verified report!</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recent reports with enhanced styling */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Recent Reports</h4>
                      <div className="text-sm text-gray-400">
                        <div className="flex justify-between items-center mb-2">
                          <span>Token Drainer</span>
                          <Badge className="bg-red-500/20 text-red-400">High Risk</Badge>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Fake Airdrop</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400">Medium Risk</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Rug Pull Contract</span>
                          <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
                        </div>
                      </div>
                    </div>
                    {/* Enhanced submit button */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Submit New Report</h4>
                      <Button 
                        className="w-full bg-cyan-600 hover:bg-cyan-700"
                        onClick={handleThreatReport}
                      >
                        Report Suspicious Activity (+5 Points)
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}          {activeTab === 'recovery' && (
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Key className="h-5 w-5 text-cyan-400" />
                  <span>Social Recovery Settings</span>
                </CardTitle>
                <p className="text-gray-400 mt-2">
                  Set up trusted guardians who can help you recover your wallet if you lose access.
                  A minimum of {2} guardians must approve the recovery process.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">                <SimpleCivicAuth
                  clientId={civicClientId}
                  walletAddress={currentAddress}
                  onSuccess={handleCivicSuccess}
                  onError={handleCivicError}
                />
                <GuardianManager walletAddress={currentAddress} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Real-time Protection</h4>
                        <p className="text-sm text-gray-400">Enable AI-powered transaction scanning</p>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Auto-block High Risk</h4>
                        <p className="text-sm text-gray-400">Automatically block transactions with 90%+ risk score</p>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Community Reports</h4>
                        <p className="text-sm text-gray-400">Show warnings from community-reported contracts</p>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Telegram Settings Integration */}
              <TelegramSettings walletAddress={currentAddress} />
            </div>
          )}

          {activeTab === 'recovery' && (
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Guardian Recovery Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Manage your Guardian recovery settings. Enable recovery options to enhance wallet security.
                  </p>
                  
                  <GuardianManager walletAddress={currentAddress} />
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Enhanced Modals and Notifications */}
      {showInterceptor && (
        <TransactionInterceptor 
          onClose={handleCloseInterceptor}
          onBlock={handleBlockTransaction}
          fromAddress={transactionDetails.fromAddress}
          toAddress={transactionDetails.toAddress}
          value={transactionDetails.value}
          gasPrice={transactionDetails.gasPrice}
        />
      )}

      {/* AI Learning Feedback */}
      <AILearningFeedback 
        trigger={showAIFeedback}
        actionType={lastAction}
        onComplete={() => setShowAIFeedback(false)}
      />

      {/* Telegram Companion */}
      <TelegramCompanion />
    </div>
  );
};

export default Index;
