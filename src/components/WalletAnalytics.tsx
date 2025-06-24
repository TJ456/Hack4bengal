import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Loader2, AlertCircle, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  wallet_age_days: number;
  risk_score: number;
}

interface WalletAnalyticsProps {
  walletAddress?: string;
}

const WalletAnalytics: React.FC<WalletAnalyticsProps> = ({ walletAddress }) => {
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // For demo/development, using mock data
        const mockData: WalletAnalytics = {
          avg_min_between_sent_tx: 120.5,
          avg_min_between_received_tx: 240.2,
          time_diff_first_last_mins: 43200,
          sent_tx_count: 42,
          received_tx_count: 28,
          created_contracts_count: 3,
          max_value_received: "1500000000000000000",
          avg_value_received: "250000000000000000",
          avg_value_sent: "180000000000000000",
          total_ether_sent: "5400000000000000000",
          total_ether_balance: "2800000000000000000",
          erc20_total_ether_received: "4200000000000000000",
          erc20_total_ether_sent: "2700000000000000000",
          erc20_total_ether_sent_contract: "800000000000000000",
          erc20_uniq_sent_addr: 15,
          erc20_uniq_rec_token_name: 8,
          erc20_most_sent_token_type: "USDC",
          erc20_most_rec_token_type: "WETH",
          txn_frequency: 0.8,
          avg_txn_value: "210000000000000000",
          wallet_age_days: 30,
          risk_score: 0.15
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalytics(mockData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  const formatEther = (value: string): string => {
    if (!value) return "0";
    try {
      const valueInEth = parseFloat(value) / 1e18;
      return valueInEth.toFixed(4);
    } catch {
      return "0";
    }
  };

  const getActivityData = () => [
    { name: 'Sent', value: analytics?.sent_tx_count || 0, fill: '#4ADE80' },
    { name: 'Received', value: analytics?.received_tx_count || 0, fill: '#2DD4BF' },
    { name: 'Contracts', value: analytics?.created_contracts_count || 0, fill: '#A78BFA' }
  ];

  const getTokenData = () => [
    { name: 'Received', value: parseFloat(formatEther(analytics?.erc20_total_ether_received || '0')), fill: '#2DD4BF' },
    { name: 'Sent (EOAs)', value: parseFloat(formatEther(analytics?.erc20_total_ether_sent || '0')), fill: '#4ADE80' },
    { name: 'Sent (Contracts)', value: parseFloat(formatEther(analytics?.erc20_total_ether_sent_contract || '0')), fill: '#F87171' }
  ];

  if (loading) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <p className="text-gray-400">Analyzing wallet data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>Analytics Error</span>
          </div>
          <p className="text-gray-400">{error || "No analytics data available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Wallet Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {analytics.sent_tx_count + analytics.received_tx_count}
              </div>
              <p className="text-gray-400">Total Transactions</p>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-400">
                {formatEther(analytics.total_ether_balance)} ETH
              </div>
              <p className="text-gray-400">Current Balance</p>
            </div>
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-fuchsia-400">
                {analytics.wallet_age_days} days
              </div>
              <p className="text-gray-400">Wallet Age</p>
            </div>
          </div>

          {/* Charts */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-black/40">
              <TabsTrigger value="activity">Transaction Activity</TabsTrigger>
              <TabsTrigger value="tokens">Token Distribution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <div className="h-[300px] w-full bg-black/20 rounded-lg p-4">
                <ResponsiveContainer>
                  <BarChart data={getActivityData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111',
                        borderColor: '#333',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Transactions">
                      {getActivityData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="tokens">
              <div className="h-[300px] w-full bg-black/20 rounded-lg p-4">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={getTokenData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getTokenData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111',
                        borderColor: '#333',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(4)} ETH`, 'Value']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Transaction Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sent Transactions</span>
                  <span className="text-white">{analytics.sent_tx_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Received Transactions</span>
                  <span className="text-white">{analytics.received_tx_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contracts Created</span>
                  <span className="text-white">{analytics.created_contracts_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction Frequency</span>
                  <span className="text-white">{analytics.txn_frequency.toFixed(2)} tx/hour</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Value Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Received</span>
                  <span className="text-white">{formatEther(analytics.max_value_received)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Sent</span>
                  <span className="text-white">{formatEther(analytics.avg_value_sent)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Sent</span>
                  <span className="text-white">{formatEther(analytics.total_ether_sent)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Balance</span>
                  <span className="text-white">{formatEther(analytics.total_ether_balance)} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletAnalytics;
