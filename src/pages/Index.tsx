import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Zap,Lock,Cloud,CrediCard,Smartphone,Users, FileText, Settings, PieChart, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
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
      {/* New Header Component */}
      <Header
        walletConnected={walletConnected}
        currentAddress={currentAddress}
        onWalletConnect={(address) => {
          setWalletConnected(true);
          setCurrentAddress(address);
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Secure Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {" "}Web3 Journey
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              AI-powered protection against scams, fraud, and malicious transactions.
              Your ultimate guardian in the decentralized world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg">
                Get Protected Now
              </Button>
              <Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-8 py-3 text-lg">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Side - 3D Animated Wallet with Orbiting Features */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative flex justify-center items-center h-96 lg:h-[500px] w-full max-w-lg">

              {/* Floating Coins */}
              {/* Bitcoin Coin - Top Left */}
              <div className="absolute top-16 left-8 lg:left-16 animate-float z-20">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-white font-bold text-lg">₿</span>
                  </div>
                  {/* Coin Glow */}
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Ethereum Coin - Top Right */}
              <div className="absolute top-20 right-8 lg:right-20 animate-float-delayed z-20">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 rounded-full shadow-xl flex items-center justify-center relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-white font-bold text-sm">Ξ</span>
                  </div>
                  {/* Coin Glow */}
                  <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Custom Coin - Bottom Left */}
              <div className="absolute bottom-16 left-12 lg:left-24 animate-float-reverse z-20">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 rounded-full shadow-xl flex items-center justify-center relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-white font-bold text-base">◆</span>
                  </div>
                  {/* Coin Glow */}
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Realistic Closed Wallet Button */}
              <div className="relative z-10">
                <button
                  onClick={() => {
                    setWalletConnected(true);
                    setCurrentAddress('0x1234...5678');
                  }}
                  className="group relative w-80 h-56 lg:w-96 lg:h-64 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                >
                  {/* Wallet Shadow */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-72 h-8 bg-black/20 rounded-full blur-lg"></div>

                  {/* Main Wallet Body */}
                  <div className="relative w-full h-full">

                    {/* Wallet Back Part */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-40 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl shadow-2xl">
                      {/* Wallet texture */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent rounded-2xl"></div>

                      {/* Stitching lines */}
                      <div className="absolute inset-2 border border-purple-400/20 rounded-xl"></div>
                      <div className="absolute top-4 left-4 right-4 h-px bg-purple-400/30"></div>
                      <div className="absolute bottom-4 left-4 right-4 h-px bg-purple-400/30"></div>
                    </div>

                    {/* Wallet Front Flap (Closed) */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-72 h-32 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-t-2xl shadow-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)' }}>
                      {/* Flap texture */}
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent rounded-t-2xl"></div>

                      {/* Flap stitching */}
                      <div className="absolute inset-2 border-t border-l border-r border-purple-400/20 rounded-t-xl"></div>
                    </div>                    {/* Connect Wallet Text */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="text-white text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                        Connect Wallet
                      </div>
                      <div className="text-purple-200 text-sm opacity-80">
                        Click to open and connect
                      </div>
                    </div>                    {/* Lock/Unlock Icon at Flap Bottom */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg flex items-center justify-center z-20 border-2 border-purple-300/20">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {walletConnected ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        )}
                      </svg>
                    </div>

                    {/* Connection Status */}
                    <div className="absolute top-4 right-8 w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </div>

                    {/* Hover Glow */}
                    <div className="absolute -inset-4 bg-purple-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                </button>
              </div>

              {/* Orbiting Feature Icons */}
              {/* Top Icon - Security Lock */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 animate-orbit-1">
                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Right Icon - AI Chip */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-12 h-12 animate-orbit-2">
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Bottom Icon - Globe */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 animate-orbit-3">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Left Icon - Rupee */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-12 h-12 animate-orbit-4">
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>              {/* Add custom animation keyframes */}
              <style>
                {`
                @keyframes orbit-1 {
                  from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
                  to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
                }
                @keyframes orbit-2 {
                  from { transform: rotate(90deg) translateX(120px) rotate(-90deg); }
                  to { transform: rotate(450deg) translateX(120px) rotate(-450deg); }
                }
                @keyframes orbit-3 {
                  from { transform: rotate(180deg) translateX(120px) rotate(-180deg); }
                  to { transform: rotate(540deg) translateX(120px) rotate(-540deg); }
                }
                @keyframes orbit-4 {
                  from { transform: rotate(270deg) translateX(120px) rotate(-270deg); }
                  to { transform: rotate(630deg) translateX(120px) rotate(-630deg); }
                }
                .animate-orbit-1 { animation: orbit-1 12s linear infinite; }
                .animate-orbit-2 { animation: orbit-2 12s linear infinite; }
                .animate-orbit-3 { animation: orbit-3 12s linear infinite; }
                .animate-orbit-4 { animation: orbit-4 12s linear infinite; }
                `}
              </style>

              {/* Background Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>              {/* Orbiting Feature Icons */}
              {/* Top Icon - Security Lock */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 animate-orbit-1">
                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Right Icon - AI Chip */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-12 h-12 animate-orbit-2">
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Bottom Icon - Globe */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 animate-orbit-3">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Left Icon - Rupee */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-12 h-12 animate-orbit-4">
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg flex items-center justify-center relative group transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                </div>
              </div>

              {/* Add custom animation keyframes */}
              <style>{`
                @keyframes orbit-1 {
                  0% { transform: rotate(0deg) translateY(-120px) rotate(0deg); }
                  100% { transform: rotate(360deg) translateY(-120px) rotate(-360deg); }
                }
                @keyframes orbit-2 {
                  0% { transform: rotate(90deg) translateY(-120px) rotate(-90deg); }
                  100% { transform: rotate(450deg) translateY(-120px) rotate(-450deg); }
                }
                @keyframes orbit-3 {
                  0% { transform: rotate(180deg) translateY(-120px) rotate(-180deg); }
                  100% { transform: rotate(540deg) translateY(-120px) rotate(-540deg); }
                }
                @keyframes orbit-4 {
                  0% { transform: rotate(270deg) translateY(-120px) rotate(-270deg); }
                  100% { transform: rotate(630deg) translateY(-120px) rotate(-630deg); }
                }
                .animate-orbit-1 { animation: orbit-1 12s linear infinite; }
                .animate-orbit-2 { animation: orbit-2 12s linear infinite; }
                .animate-orbit-3 { animation: orbit-3 12s linear infinite; }
                .animate-orbit-4 { animation: orbit-4 12s linear infinite; }
              `}</style>
            </div>
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
            </div>            {/* Send Transaction Section */}
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Send Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
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
        )}        {activeTab === 'settings' && (
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
      </main>

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
