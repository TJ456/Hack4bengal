import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Loader2, Info, AlertCircle, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import walletConnector from '@/web3/wallet';

// Types based on backend models/wallet_analytics.go
interface WalletAnalytics {
  // Basic transaction timing metrics
  avg_min_between_sent_tx: number;
  avg_min_between_received_tx: number;
  time_diff_first_last_mins: number;
  
  // Transaction counts
  sent_tx_count: number;
  received_tx_count: number;
  created_contracts_count: number;
  
  // ETH value metrics
  max_value_received: string;
  avg_value_received: string;
  avg_value_sent: string;
  total_ether_sent: string;
  total_ether_balance: string;
  
  // ERC20 token metrics
  erc20_total_ether_received: string;
  erc20_total_ether_sent: string;
  erc20_total_ether_sent_contract: string;
  erc20_uniq_sent_addr: number;
  erc20_uniq_rec_token_name: number;
  erc20_most_sent_token_type: string;
  erc20_most_rec_token_type: string;
  
  // Derived metrics
  txn_frequency: number;
  avg_txn_value: string;
  
  // Additional metrics
  wallet_age_days: number;
  risk_score: number;
}

interface RiskScoreResponse {
  address: string;
  risk_score: number;
  risk_level: string;
}

interface WalletAnalyticsProps {
  walletAddress?: string;
}

const WalletAnalytics: React.FC<WalletAnalyticsProps> = ({ walletAddress }) => {
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [riskData, setRiskData] = useState<RiskScoreResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use connected wallet if walletAddress is not provided
        const address = walletAddress || walletConnector.address;
        
        if (!address) {
          setError("No wallet address available");
          setLoading(false);
          return;
        }
        
        // Fetch wallet analytics data
        const analyticsResponse = await fetch(`/api/analytics/wallet/${address}`);
        if (!analyticsResponse.ok) {
          throw new Error(`Failed to fetch analytics: ${analyticsResponse.statusText}`);
        }
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
        
        // Fetch risk score data
        const riskResponse = await fetch(`/api/analytics/risk/${address}`);
        if (!riskResponse.ok) {
          throw new Error(`Failed to fetch risk score: ${riskResponse.statusText}`);
        }
        const riskData = await riskResponse.json();
        setRiskData(riskData);
      } catch (err) {
        console.error("Error fetching wallet analytics:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // For development/demo purposes, load mock data if the API is not available
        if (process.env.NODE_ENV === 'development') {
          setAnalytics(getMockAnalyticsData());
          setRiskData(getMockRiskData());
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [walletAddress]);

  // Format Ether values (from wei)
  const formatEther = (value: string) => {
    if (!value) return "0";
    try {
      // Simple conversion assuming the value is in wei
      const valueInEth = parseFloat(value) / 1e18;
      return valueInEth.toFixed(4);
    } catch (e) {
      return value;
    }
  };

  // Generate data for transaction activity chart
  const getTransactionActivityData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Sent', value: analytics.sent_tx_count, fill: '#4ADE80' },
      { name: 'Received', value: analytics.received_tx_count, fill: '#2DD4BF' },
      { name: 'Contracts Created', value: analytics.created_contracts_count, fill: '#A78BFA' }
    ];
  };

  // Generate data for token metrics chart
  const getTokenDistributionData = () => {
    if (!analytics) return [];
    
    const erc20Received = parseFloat(formatEther(analytics.erc20_total_ether_received));
    const erc20Sent = parseFloat(formatEther(analytics.erc20_total_ether_sent));
    const erc20SentToContracts = parseFloat(formatEther(analytics.erc20_total_ether_sent_contract));
    
    return [
      { name: 'Received', value: erc20Received, fill: '#2DD4BF' },
      { name: 'Sent to EOAs', value: erc20Sent - erc20SentToContracts, fill: '#4ADE80' },
      { name: 'Sent to Contracts', value: erc20SentToContracts, fill: '#F87171' }
    ];
  };

  // Generate data for wallet age and activity
  const getWalletActivityTimelineData = () => {
    if (!analytics) return [];
    
    // Mock timeline data based on wallet age
    const days = analytics.wallet_age_days;
    
    // Create activity points with diminishing frequency as we go back in time
    const points = [];
    const numPoints = Math.min(10, days); // Cap at 10 data points
    
    for (let i = 0; i < numPoints; i++) {
      const daysAgo = Math.round((days / numPoints) * i);
      const txCount = Math.round(analytics.txn_frequency * (numPoints - i) / numPoints * 2) + 
                     Math.round(Math.random() * 5);
      
      points.push({
        day: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
        transactions: txCount
      });
    }
    
    return points.reverse(); // Chronological order
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-400';
    if (score < 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  // Render metric card with tooltip explanation
  const MetricCard = ({ title, value, explanation, icon: Icon }: { 
    title: string; 
    value: string | number; 
    explanation: string;
    icon: React.ElementType;
  }) => (
    <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-400 flex items-center">
          {title}
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                  <Info className="h-3 w-3 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{explanation}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </h3>
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>
      <div className="text-xl font-semibold text-white mt-2">{value}</div>
    </div>
  );

  // Render loading state
  if (loading) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5" />
            Wallet Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-gray-400">Loading wallet analytics data...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5" />
            Wallet Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="font-medium text-white">Failed to load analytics</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          
          <Button 
            className="mt-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || !riskData) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5" />
            Wallet Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">No analytics data available for this wallet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <PieChartIcon className="mr-2 h-5 w-5" />
          Wallet Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score Banner */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${getRiskBadgeColor(riskData.risk_level)}`}>
          <div>
            <h3 className="font-medium text-white">Risk Level: {riskData.risk_level}</h3>
            <p className="text-sm">
              Risk Score: <span className={getRiskColor(riskData.risk_score)}>
                {(riskData.risk_score * 100).toFixed(1)}%
              </span>
            </p>
          </div>
          <Badge className={getRiskBadgeColor(riskData.risk_level)}>
            {riskData.risk_level.toUpperCase()}
          </Badge>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Wallet Age" 
            value={`${analytics.wallet_age_days} days`}
            explanation="The age of this wallet in days since its first transaction"
            icon={Info}
          />
          <MetricCard 
            title="Transaction Frequency" 
            value={`${analytics.txn_frequency.toFixed(2)} tx/hour`}
            explanation="Average number of transactions per hour over the wallet's lifetime"
            icon={BarChartIcon}
          />
          <MetricCard 
            title="Total Transactions" 
            value={analytics.sent_tx_count + analytics.received_tx_count}
            explanation="Total number of transactions sent and received"
            icon={BarChartIcon}
          />
        </div>

        {/* Tabs for Different Analytics Views */}
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-black/40">
            <TabsTrigger value="transactions">Transaction Activity</TabsTrigger>
            <TabsTrigger value="tokens">Token Metrics</TabsTrigger>
            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="mt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={getTransactionActivityData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      borderColor: '#333',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {getTransactionActivityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Transaction Details</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Sent Transactions:</span>
                    <span className="font-mono">{analytics.sent_tx_count}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Received Transactions:</span>
                    <span className="font-mono">{analytics.received_tx_count}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Contracts Created:</span>
                    <span className="font-mono">{analytics.created_contracts_count}</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Value Metrics</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Max Value Received:</span>
                    <span className="font-mono">{formatEther(analytics.max_value_received)} ETH</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Avg Value Sent:</span>
                    <span className="font-mono">{formatEther(analytics.avg_value_sent)} ETH</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total Ether Balance:</span>
                    <span className="font-mono">{formatEther(analytics.total_ether_balance)} ETH</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tokens" className="mt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getTokenDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getTokenDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      borderColor: '#333',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [`${value.toFixed(4)} ETH`, 'Value']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Token Activity</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Unique Receiving Tokens:</span>
                    <span className="font-mono">{analytics.erc20_uniq_rec_token_name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Unique Sent Addresses:</span>
                    <span className="font-mono">{analytics.erc20_uniq_sent_addr}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Most Sent Token Type:</span>
                    <span className="font-mono">{analytics.erc20_most_sent_token_type || 'N/A'}</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Value Details</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Total ERC20 Received:</span>
                    <span className="font-mono">{formatEther(analytics.erc20_total_ether_received)} ETH</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total ERC20 Sent:</span>
                    <span className="font-mono">{formatEther(analytics.erc20_total_ether_sent)} ETH</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sent to Contracts:</span>
                    <span className="font-mono">{formatEther(analytics.erc20_total_ether_sent_contract)} ETH</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getWalletActivityTimelineData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      borderColor: '#333',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    name="Transactions"
                    stroke="#2DD4BF"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Time Metrics</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Avg Time Between Sent Tx:</span>
                    <span className="font-mono">{analytics.avg_min_between_sent_tx.toFixed(2)} min</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Avg Time Between Received Tx:</span>
                    <span className="font-mono">{analytics.avg_min_between_received_tx.toFixed(2)} min</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Time Diff (First/Last):</span>
                    <span className="font-mono">{(analytics.time_diff_first_last_mins / 60).toFixed(2)} hours</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Pattern Analysis</h3>
                <ul className="space-y-2 text-white">
                  <li className="flex justify-between">
                    <span>Transaction Velocity:</span>
                    <span className="font-mono">{analytics.txn_frequency.toFixed(2)} tx/hour</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Avg Transaction Value:</span>
                    <span className="font-mono">{formatEther(analytics.avg_txn_value)} ETH</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Wallet Age:</span>
                    <span className="font-mono">{analytics.wallet_age_days} days</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Mock data for development/demo purposes
function getMockAnalyticsData(): WalletAnalytics {
  return {
    avg_min_between_sent_tx: 120.5,
    avg_min_between_received_tx: 240.2,
    time_diff_first_last_mins: 43200, // 30 days
    
    sent_tx_count: 42,
    received_tx_count: 28,
    created_contracts_count: 3,
    
    max_value_received: "1500000000000000000", // 1.5 ETH
    avg_value_received: "250000000000000000", // 0.25 ETH
    avg_value_sent: "180000000000000000", // 0.18 ETH
    total_ether_sent: "5400000000000000000", // 5.4 ETH
    total_ether_balance: "2800000000000000000", // 2.8 ETH
    
    erc20_total_ether_received: "4200000000000000000", // 4.2 ETH
    erc20_total_ether_sent: "2700000000000000000", // 2.7 ETH
    erc20_total_ether_sent_contract: "800000000000000000", // 0.8 ETH
    erc20_uniq_sent_addr: 15,
    erc20_uniq_rec_token_name: 8,
    erc20_most_sent_token_type: "USDC",
    erc20_most_rec_token_type: "WETH",
    
    txn_frequency: 0.8,
    avg_txn_value: "210000000000000000", // 0.21 ETH
    
    wallet_age_days: 30,
    risk_score: 0.15
  };
}

function getMockRiskData(): RiskScoreResponse {
  return {
    address: "0x123...abc",
    risk_score: 0.15,
    risk_level: "Low"
  };
}

export default WalletAnalytics;
