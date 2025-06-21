// Example component demonstrating API Error Handling usage
// This shows different ways to use the API error handling components

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiGet, useApiPost } from '@/hooks/use-api';
import ApiErrorHandler from '@/components/ApiErrorHandler';
import { Badge } from '@/components/ui/badge';

interface WalletData {
  address: string;
  balance: string;
  transactions: number;
}

interface FirewallStats {
  total_analyzed: number;
  blocked_transactions: number;
  risk_score_avg: number;
}

export const ApiErrorExample: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [testEndpoint, setTestEndpoint] = useState('/firewall/stats');

  // Example 1: GET request with automatic error handling
  const {
    data: firewallStats,
    loading: statsLoading,
    error: statsError,
    retry: retryStats,
    isRetrying: statsRetrying
  } = useApiGet<FirewallStats>('/firewall/stats', {
    showToastOnError: true,
    onSuccess: (data) => {
      console.log('Firewall stats loaded:', data);
    }
  });

  // Example 2: GET request with manual execution
  const {
    data: walletData,
    loading: walletLoading,
    error: walletError,
    retry: retryWallet,
    isRetrying: walletRetrying,
    execute: fetchWallet
  } = useApiGet<WalletData>(`/analytics/wallet/${walletAddress}`, {
    immediate: false,
    showToastOnSuccess: true,
    successMessage: 'Wallet data loaded successfully!'
  });

  // Example 3: Test endpoint with controlled error scenarios
  const {
    data: testData,
    loading: testLoading,
    error: testError,
    retry: retryTest,
    isRetrying: testRetrying,
    execute: executeTest
  } = useApiGet<any>(testEndpoint, {
    immediate: false,
    onError: (error) => {
      console.log('Test endpoint error:', error);
    }
  });

  const handleFetchWallet = () => {
    if (walletAddress.trim()) {
      fetchWallet();
    }
  };

  const handleTestEndpoint = () => {
    executeTest();
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>API Error Handling Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="automatic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automatic">Automatic Loading</TabsTrigger>
              <TabsTrigger value="manual">Manual Execution</TabsTrigger>
              <TabsTrigger value="testing">Error Testing</TabsTrigger>
            </TabsList>

            {/* Example 1: Automatic loading with error handling */}
            <TabsContent value="automatic" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Firewall Statistics</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This example automatically loads data on component mount and shows different error states.
                </p>

                {statsLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Loading firewall statistics...</span>
                  </div>
                )}

                {statsError && (
                  <ApiErrorHandler
                    error={statsError}
                    onRetry={retryStats}
                    isRetrying={statsRetrying}
                    variant="alert"
                    showDetails={true}
                  />
                )}

                {firewallStats && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {firewallStats.total_analyzed}
                          </div>
                          <div className="text-sm text-gray-600">Total Analyzed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {firewallStats.blocked_transactions}
                          </div>
                          <div className="text-sm text-gray-600">Blocked</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {(firewallStats.risk_score_avg * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Avg Risk Score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Example 2: Manual execution */}
            <TabsContent value="manual" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Wallet Analytics</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This example uses GET request with manual execution and shows how to handle user input.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="wallet-address"
                        placeholder="Enter wallet address (e.g., 0x742d35Cc...)"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleFetchWallet}
                        disabled={walletLoading || !walletAddress.trim()}
                      >
                        {walletLoading ? 'Loading...' : 'Fetch Data'}
                      </Button>
                    </div>
                  </div>

                  {walletError && (
                    <ApiErrorHandler
                      error={walletError}
                      onRetry={retryWallet}
                      isRetrying={walletRetrying}
                      variant="inline"
                      customRetryText="Retry Wallet Fetch"
                    />
                  )}

                  {walletData && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Address:</span>
                            <Badge variant="outline">{walletData.address}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Balance:</span>
                            <span className="font-mono">{walletData.balance} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Transactions:</span>
                            <span className="font-mono">{walletData.transactions}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Example 3: Error testing */}
            <TabsContent value="testing" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Error Scenario Testing</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test different error scenarios by trying different endpoints.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-endpoint">Test Endpoint</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="test-endpoint"
                        value={testEndpoint}
                        onChange={(e) => setTestEndpoint(e.target.value)}
                        className="flex-1"
                        placeholder="/api/endpoint"
                      />
                      <Button onClick={handleTestEndpoint} disabled={testLoading}>
                        {testLoading ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestEndpoint('/nonexistent')}
                    >
                      404 Error
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestEndpoint('/auth/protected')}
                    >
                      Auth Error
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestEndpoint('/firewall/stats')}
                    >
                      Valid Endpoint
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestEndpoint('/invalid-json')}
                    >
                      Server Error
                    </Button>
                  </div>

                  {testError && (
                    <ApiErrorHandler
                      error={testError}
                      onRetry={retryTest}
                      isRetrying={testRetrying}
                      variant="card"
                      showDetails={true}
                      customRetryText="Retry Test"
                    />
                  )}

                  {testData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Response Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(testData, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiErrorExample;
