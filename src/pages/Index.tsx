import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Zap, Users, FileText, PieChart, Key, UserPlus } from 'lucide-react';
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
import ChatbotAssistant from '@/components/ChatbotAssistant';
import WalletAnalytics from '@/components/WalletAnalytics';
import GuardianManager from '@/components/GuardianManager';
import ThreatReport from '@/components/ThreatReport';
import GuardianSettings from '@/components/GuardianSettings';
import { useCivicStore } from '@/stores/civicStore';
import SimpleCivicAuth from '@/components/civic/SimpleCivicAuth';

const Index = () => {
  const navigate = useNavigate();
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
  
  const [registrationData, setRegistrationData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

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
  
  const handleNavigation = (item: { id: string; label: string }) => {
    if (item.id === 'register') {
      navigate('/register');
    } else {
      setActiveTab(item.id);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    try {
      // TODO: Replace with your actual registration API endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registrationData.email,
          password: registrationData.password,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Registration successful! Please login.",
        });
        setActiveTab('overview');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">      
      {/* Header */}
      <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur-lg animate-fade-in-down">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>              <div>
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Neuro</span>Shield
                </h1>
                <p className="text-sm text-gray-400">Next-Gen Web3 Security</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-6 whitespace-nowrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'overview'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Shield className="h-5 w-5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'report'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
                Threat Report
              </button>
              <button
                onClick={() => setActiveTab('guardian')}
                className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'guardian'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Key className="h-5 w-5" />
                Guardian
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'analytics'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <PieChart className="h-5 w-5" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('dao')}
                className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'dao'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Users className="h-5 w-5" />
                DAO
              </button>

              {/* Register Link */}
              <Link
                to="/register"
                className="flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-105 text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4"
              >
                <UserPlus className="h-5 w-5" />
                Register
              </Link>
            </nav>

            {/* Wallet Connect Button */}
            <div className="hidden md:block">
              <WalletConnect 
              isConnected={walletConnected}
              address={currentAddress}
              onConnect={(address) => {
                setWalletConnected(true);
                setCurrentAddress(address);
              }}
              />
            </div>
          </div>
        </div>
      </header>      {/* Hero Landing Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-cyan-500/30 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 text-center md:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in-up">
                Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Digital Assets</span> with AI
              </h1>
              <p className="text-xl text-gray-300 animate-fade-in-up animation-delay-200">
                The world's first AI-powered smart wallet with real-time threat detection and autonomous security features.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start animate-fade-in-up animation-delay-300">
                <Button 
                  onClick={() => {
                    if (!walletConnected) {
                      if (typeof window.ethereum !== 'undefined') {
                        window.ethereum.request({ method: 'eth_requestAccounts' })
                          .then((accounts: string[]) => {
                            setWalletConnected(true);
                            setCurrentAddress(accounts[0]);
                            toast({
                              title: "Wallet Connected",
                              description: "Your wallet has been successfully connected!",
                            });
                          })
                          .catch((error: Error) => {
                            toast({
                              title: "Connection Failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          });
                      } else {
                        toast({
                          title: "Wallet Not Found",
                          description: "Please install MetaMask or another Web3 wallet.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
                >
                  {walletConnected ? 'Connected ✓' : 'Get Started'}
                </Button>
                <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105">
                  Watch Demo
                </Button>
              </div>              <div className="flex items-center gap-8 justify-center md:justify-start animate-fade-in-up animation-delay-400">
                <div className="flex -space-x-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white/10 bg-gradient-to-br from-purple-500 to-cyan-500"
                    >
                      <img
                        src={`https://api.dicebear.com/6.x/personas/svg?seed=${i}`}
                        alt={`User avatar ${i + 1}`}
                        className="w-full h-full rounded-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">10k+</div>
                  <div className="text-gray-400">Protected Wallets</div>
                </div>
              </div>
            </div>

            {/* Right Column - Wallet Image */}
            <div className="relative">
              {/* Background glow effects */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-3xl transform scale-150"></div>
              </div>
              
              {/* Wallet Image Container */}
              <div className="relative max-w-[500px] mx-auto">
                <img
                  src="https://www.shrewsburycartoonfestival.org/wp-content/uploads/2025/02/313130.jpg"
                  alt="3D Secure Wallet Visualization"
                  className="w-full rounded-xl shadow-2xl ring-1 ring-white/10 hover:scale-105 hover:rotate-2 transition duration-300"
                />
                
                {/* Overlay gradient for depth */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">        
        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Score Card */}
              <SecurityScore />              {/* Threat Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="group bg-black/20 backdrop-blur-lg border-white/10 hover:bg-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Threat Level</CardTitle>
                    <AlertTriangle className={`h-4 w-4 transform group-hover:scale-110 transition-all ${threatLevel === 'danger' ? 'text-red-500' : threatLevel === 'warning' ? 'text-yellow-500' : 'text-green-500'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white capitalize group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all">{threatLevel}</div>
                    <Badge className={`mt-2 transition-all transform hover:scale-105 ${getThreatColor(threatLevel)}`}>
                      {threatLevel === 'safe' ? 'All Systems Secure' : 
                       threatLevel === 'warning' ? 'Suspicious Activity' : 
                       'Threat Detected'}
                    </Badge>
                  </CardContent>
                </Card>                <Card className="group bg-black/20 backdrop-blur-lg border-white/10 hover:bg-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">AI Scans Today</CardTitle>
                    <div className="relative">
                      <Zap className="h-4 w-4 text-yellow-500 group-hover:animate-ping absolute" />
                      <Zap className="h-4 w-4 text-yellow-500 relative" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-orange-400 transition-all">{aiScansToday}</div>
                    <p className="text-xs text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">
                      <span className="text-green-400 group-hover:animate-pulse">+{Math.floor(Math.random() * 20) + 5}%</span> from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="group bg-black/20 backdrop-blur-lg border-white/10 hover:bg-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Blocked Threats</CardTitle>
                    <div className="relative">
                      <CheckCircle className="h-4 w-4 text-green-500 transform group-hover:scale-125 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-emerald-400 transition-all">{blockedThreats}</div>
                    <p className="text-xs text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">
                      Saved <span className="text-green-400 group-hover:animate-pulse">${savedAmount.toLocaleString()}</span> in potential losses
                    </p>
                  </CardContent>
                </Card>
              </div>              {/* Send Transaction Section */}              <Card className="group bg-black/20 backdrop-blur-lg border-white/10 hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="transform group-hover:scale-110 transition-transform">Send Tokens</span>
                    <div className="relative h-6 w-6">
                      <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 group-hover:animate-ping"></div>
                      <div className="absolute inset-0 flex items-center justify-center">💸</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white w-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20 rounded-xl"
                    >
                      <Link to="/send" className="flex items-center justify-center gap-2 py-3">
                        <span className="text-lg">Send Tokens Securely</span>
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      </Link>
                    </Button>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      Send tokens to any address with ML-powered fraud detection.
                      Our AI will analyze the transaction and warn you about potential risks.
                      <span className="text-cyan-400 font-medium group-hover:animate-pulse"> Protected by external ML fraud detection!</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Demo Section */}
              <Card className="group bg-black/20 backdrop-blur-lg border-white/10 hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="transform group-hover:scale-110 transition-transform">AI Security Demo</span>
                    <div className="relative h-6 w-6">
                      <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 group-hover:animate-ping"></div>
                      <div className="absolute inset-0 flex items-center justify-center">🚨</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={simulateScamTransaction}
                      disabled={showInterceptor || isProcessing}
                      className="relative bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white w-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:hover:scale-100 rounded-xl py-3"
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
                      <span className="relative text-lg">
                        {isProcessing ? 'Processing...' : showInterceptor ? 'Threat Active...' : '🚨 Simulate Scam Transaction'}
                      </span>
                    </Button>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      Test the AI threat detection system with a simulated malicious transaction. 
                      Our AI will analyze the transaction and warn you about potential risks.
                      <span className="text-cyan-400 font-medium group-hover:animate-pulse"> Earn +3 Shield Points when you block threats!</span>
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
          )}          {activeTab === 'report' && (
            <ThreatReport 
              walletAddress={currentAddress}
              onReportSubmit={(report) => {
                setSecurityScore(prev => Math.min(100, prev + 5));
                setLastAction('report');
                setShowAIFeedback(true);
                handleThreatReport();
              }}
            />
          )}{activeTab === 'recovery' && (
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
            </Card>          )}          {activeTab === 'guardian' && (
            <GuardianSettings 
              walletAddress={currentAddress} 
            />
          )}{activeTab === 'register' && (
            <div className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Register New Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Registration form will be added here */}
                    <div className="flex flex-col space-y-4">
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="bg-black/30 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        className="bg-black/30 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="bg-black/30 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        Register
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      <ChatbotAssistant />
    </div>
  );
};

export default Index;