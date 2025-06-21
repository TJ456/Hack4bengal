import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  return (    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">      
      {/* Header */}
      <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur-lg animate-fade-in-down">
        <div className="w-full py-4">
          <div className="flex items-center justify-between w-full">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 pl-4">
              <div className="relative transition-transform hover:scale-105 duration-300">
                <Shield className="h-10 w-10 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="whitespace-nowrap">
                <h1 className="text-3xl font-bold text-white tracking-tight hover:text-cyan-400 transition-colors duration-300">The Unhackable Wallet</h1>
                <p className="text-sm text-gray-400 font-medium">AI-Powered Web3 Guardian</p>
              </div>
            </div>            {/* Navigation Links */}
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-6 whitespace-nowrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'overview'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'register'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Key className="h-5 w-5" />
                <span>Register</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'analytics'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <PieChart className="h-5 w-5" />
                <span>Wallet Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('dao')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'dao'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>DAO Voting</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'reports'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Threat Reports</span>
              </button>
              <button
                onClick={() => setActiveTab('recovery')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'recovery'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Key className="h-5 w-5" />
                <span>Recovery</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-2 py-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'settings'
                    ? 'text-cyan-400 font-medium scale-105'
                    : 'text-gray-400 hover:text-white hover:underline decoration-cyan-400/50 underline-offset-4'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Connect Wallet and Register */}
            <div className="flex items-center gap-4 pr-4">
              <Link to="/register">
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  Register
                </Button>
              </Link>
              <div className="transition-transform hover:scale-105 duration-300">
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
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-black/20 backdrop-blur-lg border-r border-white/10">
          <nav className="p-6 space-y-2">            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'register', label: 'Register', icon: Key },
              { id: 'analytics', label: 'Wallet Analytics', icon: PieChart },
              { id: 'dao', label: 'DA