import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, X, ExternalLink, Zap, Brain, Heart } from 'lucide-react';
import { ethers } from 'ethers';
import walletConnector from '@/web3/wallet';

interface TransactionInterceptorProps {
  onClose: () => void;
  onBlock: () => void;
  toAddress: string;
  fromAddress: string;
  value: number;
  gasPrice: number;
  isSuccess?: boolean; // Optional prop to show success modal instead of warning
  transaction?: ethers.TransactionRequest;
}

interface MLResponse {
  prediction: number;
  risk_score: number;
  features: number[];
}

const isContractAddress = async (address: string): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      console.warn("No ethereum provider available");
      return false;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);
    // If address has code, it's a contract
    return code !== '0x';
  } catch (error) {
    // If there's an error, assume it's not a contract
    console.warn("Error checking contract address:", error);
    return false;
  }
};

// Function to retrieve transaction logs from localStorage
const getTransactionLogs = () => {
  try {
    const logs = localStorage.getItem('transaction-logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error retrieving transaction logs:', error);
    return [];
  }
};

const TransactionInterceptor: React.FC<TransactionInterceptorProps> = ({
  onClose,
  onBlock,
  toAddress,
  fromAddress,
  value,
  gasPrice,
  isSuccess = false,
  transaction
}) => {
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('whitelisted-addresses');
    return saved ? JSON.parse(saved) : [];
  });

  const [mlResponse, setMlResponse] = useState<MLResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMEVProtected, setIsMEVProtected] = useState<boolean | null>(null);

  const isAddressWhitelisted = whitelistedAddresses.includes(toAddress);

  const addToWhitelist = () => {
    const newWhitelist = [...whitelistedAddresses, toAddress];
    setWhitelistedAddresses(newWhitelist);
    localStorage.setItem('whitelisted-addresses', JSON.stringify(newWhitelist));
    onClose();
  };

  useEffect(() => {
    const checkTransaction = async () => {
      try {
        console.log("Starting ML risk assessment for transaction:", {
          fromAddress,
          toAddress,
          value,
          gasPrice
        });

        // Check if address is a contract - do this first to avoid delays later
        const isContract = await isContractAddress(toAddress);
        console.log("Contract address check result:", isContract);

        // Prepare features array with real transaction data
        const features = [
          gasPrice,             // gas_price
          value,               // transaction_value
          isAddressWhitelisted ? 1 : 0, // trusted address
          isContract ? 1 : 0, // is_contract
          0,                   // remaining features, could be enhanced with historical data
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ];

        const transactionData = {
          from_address: fromAddress,
          to_address: toAddress,
          transaction_value: value,
          gas_price: gasPrice,
          is_contract_interaction: isContract, // Use the value we already computed
          acc_holder: fromAddress,
          features
        };

        console.log("Sending transaction data to ML service:", transactionData);

        try {
          console.log("Starting ML risk assessment using external API only");

          // Use ONLY the external ML API endpoint
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn("ML API request timed out after 15 seconds");
          }, 15000); // 15 second timeout

          const response = await fetch('https://dl-fraud-detection.onrender.com/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("ML API error:", response.status, errorText);
            throw new Error(`ML API returned status ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log("ML API response received:", data);

          if (!data || !data.prediction) {
            console.error("ML response missing required fields:", data);
            throw new Error('Invalid response format from ML service - missing prediction data');
          }

          // Convert the API response to our expected format
          const normalizedData = {
            prediction: data.prediction,
            risk_score: data.prediction === "Fraud" ? 0.8 : 0.2, // Convert string to numeric score
            risk_level: data.prediction === "Fraud" ? "HIGH" : "LOW",
            type: data.Type,
            explanation: `ML Assessment: ${data.Type}`,
            features: features // Include the features array we prepared earlier
          };

          // Success - valid response received
          console.log("Valid ML risk assessment received:", normalizedData);
          setMlResponse(normalizedData);

        } catch (err: any) {
          console.error('Error in ML service communication:', err);

          if (err.name === 'AbortError') {
            throw new Error('ML risk assessment timed out');
          }

          throw err; // Re-throw to be caught by outer catch
        }
      } catch (err) {
        console.error('Transaction check error:', err);

        // Provide more informative error message
        if (err instanceof Error) {
          if (err.message.includes('timed out')) {
            setError('ML risk assessment timed out. You may proceed with caution or try again.');
          } else if (err.message.includes('fetch')) {
            setError('Could not connect to ML service. Network issue or service unavailable.');
          } else {
            setError(err.message);
          }
        } else {
          setError('An unexpected error occurred while checking the transaction');
        }

        // Still set ML response to a default "cautious" value so UI can render
        setMlResponse({
          prediction: 0.5, // neutral prediction
          risk_score: 0.5, // medium risk
          features: new Array(18).fill(0) // Default features
        });
      } finally {
        // Always finish loading state to avoid UI getting stuck
        setIsLoading(false);
      }
    };

    checkTransaction();
  }, [fromAddress, toAddress, value, gasPrice]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get whitelisted addresses from local storage
  useEffect(() => {
    const loadWhitelist = () => {
      try {
        const whitelist = localStorage.getItem('whitelisted-addresses');
        if (whitelist) {
          setWhitelistedAddresses(JSON.parse(whitelist));
        }
      } catch (error) {
        console.error('Error loading whitelist:', error);
      }
    };
    loadWhitelist();
  }, []);
  // Functions for logging transaction attempts
  const logTransactionAttempt = (transaction, risk) => {
    try {
      // Get existing logs from localStorage
      const existingLogs = localStorage.getItem('transaction-logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Create log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        from: transaction.fromAddress,
        to: transaction.toAddress,
        value: transaction.value,
        gasPrice: transaction.gasPrice,
        riskScore: risk.score,
        riskLevel: risk.level,
        blocked: risk.blocked,
        whitelisted: risk.whitelisted
      };

      // Add to beginning of logs array (most recent first)
      logs.unshift(logEntry);

      // Keep only the most recent 100 logs
      const trimmedLogs = logs.slice(0, 100);

      // Save back to localStorage
      localStorage.setItem('transaction-logs', JSON.stringify(trimmedLogs));

      // Dispatch an event that a transaction was logged
      window.dispatchEvent(new CustomEvent('transaction-logged', { detail: logEntry }));

      // Log for debugging
      console.log('Transaction logged:', logEntry);
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  };

  useEffect(() => {
    const checkMEVProtection = async () => {
      if (transaction && walletConnector.isTransactionProtected) {
        try {
          const isProtected = await walletConnector.isTransactionProtected(transaction);
          setIsMEVProtected(isProtected);
        } catch (err) {
          console.warn('Failed to check MEV protection:', err);
          setIsMEVProtected(false);
        }
      }
    };

    checkMEVProtection();
  }, [transaction]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-black/90 backdrop-blur-lg border-yellow-500/30 border-2">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Analyzing transaction with ML model...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-black/90 backdrop-blur-lg border-red-500/30 border-2">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-white">Failed to analyze transaction: {error}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskScore = mlResponse ? mlResponse.risk_score * 100 : 0;
  const riskLevel = riskScore > 75 ? 'High' : riskScore > 50 ? 'Medium' : 'Low';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className={`w-full max-w-2xl bg-black/90 backdrop-blur-lg border-2 animate-scale-in ${
        isSuccess ? 'border-green-500/30' : 'border-red-500/30'
      }`}>
        <CardHeader className={`border-b ${isSuccess ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-white">
              <div className="relative">
                {isSuccess ? (
                  <>
                    <Shield className="h-6 w-6 text-green-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </>
                )}
              </div>
              <span>{isSuccess ? '✅ SECURITY PASSED' : '🚨 RISK ASSESSMENT'}</span>
            </CardTitle>
            
            {/* MEV Protection Status */}
            {isMEVProtected !== null && (
              <Badge 
                className={isMEVProtected 
                  ? "bg-green-500/20 text-green-400 flex items-center gap-1"
                  : "bg-yellow-500/20 text-yellow-400 flex items-center gap-1"
                }
              >
                <Shield className="w-3 h-3" />
                {isMEVProtected ? "MEV Protected" : "MEV Protection Available"}
              </Badge>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className={`text-sm ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess
              ? 'ML security analysis completed successfully. Transaction appears safe to proceed.'
              : 'Transaction analysis completed. Review the details below.'
            }
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isAddressWhitelisted && (
            <div className="flex items-center p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
              <Heart className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <div className="text-green-400 font-semibold">Whitelisted Address</div>
                <div className="text-sm text-gray-400">This address is in your trusted contacts</div>
              </div>
            </div>
          )}

          {/* Risk Score */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${
            isSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center space-x-3">
              <Brain className={`h-6 w-6 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <div className="text-white font-semibold">ML Risk Assessment</div>
                <div className="text-sm text-gray-400">
                  {isSuccess ? 'Security Analysis Result' : 'Transaction Risk Level'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                {riskScore.toFixed(1)}%
              </div>
              <Badge className={
                isSuccess
                  ? "bg-green-500/20 text-green-400"
                  : riskLevel === 'High'
                    ? "bg-red-500/20 text-red-400"
                    : riskLevel === 'Medium'
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-green-500/20 text-green-400"
              }>
                {isSuccess ? 'SAFE' : `${riskLevel} RISK`}
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span>Transaction Details</span>
            </h3>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm text-gray-400">To Address</div>
                  <div className="font-mono text-sm text-white bg-black/30 p-2 rounded break-all">
                    {toAddress}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Value</div>
                  <div className="text-white font-medium">{value} ETH</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Gas Price</div>
                  <div className="text-white font-medium">{gasPrice} Gwei</div>
                </div>
              </div>
            </div>
          </div>

          {/* MEV Protection Status */}
          {transaction && (
            <div className="p-4 rounded-lg border bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">MEV Protection Status</div>
                <div className="text-sm">
                  {isMEVProtected === null ? (
                    <div className="animate-pulse h-4 bg-gray-700 rounded-full w-1/2"></div>
                  ) : isMEVProtected ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      Protected
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400">
                      Not Protected
                    </Badge>
                  )}
                </div>
              </div>
              {isMEVProtected === false && (
                <div className="mt-2 text-sm text-red-400">
                  ⚠️ This transaction is not protected against MEV (Miner Extractable Value) attacks.
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {!isAddressWhitelisted && (
              <Button
                variant="outline"
                onClick={() => {
                  logTransactionAttempt(
                    {fromAddress, toAddress, value, gasPrice},
                    {score: riskScore, level: riskLevel, blocked: false, whitelisted: true}
                  );
                  addToWhitelist();
                }}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Heart className="h-4 w-4 mr-2" />
                Trust this Address
              </Button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  logTransactionAttempt(
                    {fromAddress, toAddress, value, gasPrice},
                    {score: riskScore, level: riskLevel, blocked: false, whitelisted: isAddressWhitelisted}
                  );
                  onClose();
                }}
                className={`${
                  isSuccess
                    ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                }`}
              >
                {isSuccess ? '✅ Proceed to MetaMask' : 'Sign Anyway'}
              </Button>
              {!isSuccess && !isAddressWhitelisted && riskLevel === 'High' && (
                <Button
                  onClick={() => {
                    logTransactionAttempt(
                      {fromAddress, toAddress, value, gasPrice},
                      {score: riskScore, level: riskLevel, blocked: true, whitelisted: false}
                    );
                    onBlock();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🛑 Block Transaction
                </Button>
              )}
              {isSuccess && (
                <Button
                  onClick={() => {
                    logTransactionAttempt(
                      {fromAddress, toAddress, value, gasPrice},
                      {score: riskScore, level: riskLevel, blocked: true, whitelisted: false}
                    );
                    onBlock();
                  }}
                  className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionInterceptor;
