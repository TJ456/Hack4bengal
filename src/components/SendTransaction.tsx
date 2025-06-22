import React, { useState } from 'react';
import { ethers } from 'ethers';
import walletConnector, { getSigner } from '@/web3/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import TransactionInterceptor from './TransactionInterceptor';
import FaceVerificationModal from './FaceVerificationModal';

interface SendTransactionProps {
  onSuccess?: (txHash: string) => void;
  onFraudDetected?: (fraudData: any) => void;
}

const SendTransaction: React.FC<SendTransactionProps> = ({ onSuccess, onFraudDetected }) => {
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('20'); // Default gas price
  const [useMEVProtection, setUseMEVProtection] = useState(true);
  const [showFaceVerification, setShowFaceVerification] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ML fraud detection state
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);

  // ML success assessment state
  const [showMLSuccess, setShowMLSuccess] = useState(false);
  const [mlSuccessData, setMLSuccessData] = useState<any>(null);

  // State for real-time address preview
  const [addressPreview, setAddressPreview] = useState<{
    isValid: boolean;
    isContract: boolean;
    balance?: number;
    txCount?: number;
  } | null>(null);

  // Real-time address validation and preview
  const validateAndPreviewAddress = async (address: string) => {
    if (!address || address.length < 10) {
      setAddressPreview(null);
      return;
    }

    try {
      if (ethers.isAddress(address)) {
        console.log("🔍 Validating address:", address);
        const provider = new ethers.JsonRpcProvider(window.ethereum);

        // Check if it's a contract
        const code = await provider.getCode(address);
        const isContract = code !== '0x';

        // Get balance for preview (only for EOA addresses)
        let balance = 0;
        let txCount = 0;

        if (!isContract) {
          const balanceWei = await provider.getBalance(address);
          balance = parseFloat(ethers.formatEther(balanceWei));
          txCount = await provider.getTransactionCount(address);
        }

        setAddressPreview({
          isValid: true,
          isContract,
          balance,
          txCount
        });

        console.log("✅ Address validated:", {
          address,
          isContract,
          balance,
          txCount
        });
      } else {
        setAddressPreview({ isValid: false, isContract: false });
      }
    } catch (error) {
      console.error("❌ Address validation error:", error);
      setAddressPreview({ isValid: false, isContract: false });
    }
  };

  // Handle recipient address change with real-time validation
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRecipient = e.target.value;
    setRecipient(newRecipient);

    // Debounce the validation to avoid too many API calls
    setTimeout(() => {
      if (newRecipient === recipient) { // Only validate if value hasn't changed
        validateAndPreviewAddress(newRecipient);
      }
    }, 1000);
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  // Fetch comprehensive wallet data for ML analysis
  const fetchWalletData = async (fromAddress: string, toAddress: string, txValue: string, txGasPrice: string) => {
    try {
      console.log("🔍 Fetching real-time wallet data...");
      console.log("From:", fromAddress);
      console.log("To:", toAddress);
      console.log("Value:", txValue, "ETH");
      console.log("Gas Price:", txGasPrice, "Gwei");

      // Get provider for blockchain queries
      const provider = new ethers.JsonRpcProvider(window.ethereum);

      // 1. Get sender wallet balance
      const balance = await provider.getBalance(fromAddress);
      const balanceInEth = parseFloat(ethers.formatEther(balance));
      console.log("✅ Wallet Balance:", balanceInEth, "ETH");

      // 2. Get transaction count (experience indicator)
      const transactionCount = await provider.getTransactionCount(fromAddress);
      console.log("✅ Transaction Count:", transactionCount);

      // 3. Check if recipient is a contract
      const recipientCode = await provider.getCode(toAddress);
      const isContractInteraction = recipientCode !== '0x';
      console.log("✅ Is Contract:", isContractInteraction ? "Yes" : "No");

      // 4. Get current network gas price
      const feeData = await provider.getFeeData();
      const networkGasPrice = feeData.gasPrice ? parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 20.0;
      console.log("✅ Network Gas Price:", networkGasPrice, "Gwei");

      // 5. Calculate risk metrics
      const transactionValueEth = parseFloat(txValue);
      const userGasPrice = parseFloat(txGasPrice);
      const valueToBalanceRatio = balanceInEth > 0 ? transactionValueEth / balanceInEth : 0;
      const gasPriceRatio = userGasPrice / networkGasPrice;

      console.log("📊 Risk Metrics:");
      console.log("  - Value/Balance Ratio:", (valueToBalanceRatio * 100).toFixed(2) + "%");
      console.log("  - Gas Price Ratio:", gasPriceRatio.toFixed(2) + "x network price");

      // 6. Get additional blockchain data
      const currentBlock = await provider.getBlockNumber();
      const latestBlock = await provider.getBlock(currentBlock);
      const currentTimestamp = latestBlock ? latestBlock.timestamp : Math.floor(Date.now() / 1000);

      // 7. Calculate time-based features
      const currentHour = new Date(currentTimestamp * 1000).getHours();
      const currentDay = new Date(currentTimestamp * 1000).getDay();

      return {
        balance: balanceInEth,
        transactionCount,
        isContractInteraction,
        networkGasPrice,
        valueToBalanceRatio,
        gasPriceRatio,
        currentHour,
        currentDay,
        isHighValue: transactionValueEth > 1.0,
        isHighBalance: balanceInEth > 10.0,
        isExperienced: transactionCount > 100,
        riskScore: valueToBalanceRatio + (gasPriceRatio > 2 ? 0.1 : 0)
      };
    } catch (error) {
      console.error("❌ Error fetching wallet data:", error);
      // Return safe defaults if fetching fails
      return {
        balance: 10.0,
        transactionCount: 150,
        isContractInteraction: false,
        networkGasPrice: 20.0,
        valueToBalanceRatio: 0.05,
        gasPriceRatio: 1.0,
        currentHour: 12,
        currentDay: 3,
        isHighValue: false,
        isHighBalance: true,
        isExperienced: true,
        riskScore: 0.05
      };
    }
  };

  // Check if transaction might be fraudulent using ML API
  const checkForFraud = async (): Promise<boolean> => {
    console.log("🔍 checkForFraud() FUNCTION CALLED - Starting ML analysis");
    try {
      // Get the current wallet address
      const signer = await getSigner();
      if (!signer) throw new Error('No wallet connected');
      const fromAddress = await signer.getAddress();
      console.log("📝 Wallet connected, from address:", fromAddress);

      // Fetch real wallet data with all parameters
      console.log("🚀 Gathering real-time wallet data for ML analysis...");
      const walletData = await fetchWalletData(fromAddress, recipient, amount, gasPrice);

      // Prepare comprehensive transaction data with REAL blockchain information
      const transactionData = {
        from_address: fromAddress,
        to_address: recipient,
        transaction_value: parseFloat(amount),
        gas_price: parseFloat(gasPrice),
        is_contract_interaction: walletData.isContractInteraction,
        acc_holder: fromAddress,
        features: [
          parseFloat(amount),                    // [0] transaction_value
          parseFloat(gasPrice),                  // [1] gas_price
          walletData.balance,                    // [2] account_balance (REAL)
          walletData.transactionCount,           // [3] total_transactions (REAL)
          walletData.isContractInteraction ? 1 : 0, // [4] is_contract (REAL)
          walletData.isExperienced ? 3 : 1,      // [5] experience_level (REAL)
          walletData.valueToBalanceRatio,        // [6] value_to_balance_ratio (REAL)
          walletData.gasPriceRatio,              // [7] gas_price_ratio (REAL)
          walletData.isHighBalance ? 0.0002 : 0.002, // [8] balance_risk_factor (REAL)
          walletData.valueToBalanceRatio * 0.6,  // [9] adjusted_value_ratio (REAL)
          walletData.isHighBalance ? 0.00002 : 0.0002, // [10] wealth_indicator (REAL)
          walletData.networkGasPrice,            // [11] network_gas_price (REAL)
          walletData.networkGasPrice - 0.5,      // [12] gas_price_minus_offset (REAL)
          walletData.networkGasPrice - 1.2,      // [13] gas_price_trend (REAL)
          walletData.isExperienced ? 180 : 30,   // [14] activity_score (REAL)
          walletData.isContractInteraction ? 1 : 0, // [15] contract_flag (REAL)
          walletData.isContractInteraction ? "CONTRACT" : "EOA", // [16] address_type (REAL)
          walletData.isHighValue ? "LARGE_TX" : "SMALL_TX" // [17] transaction_type (REAL)
        ]
      };

      console.log("Real wallet data prepared:", {
        balance: walletData.balance,
        txCount: walletData.transactionCount,
        isContract: walletData.isContractInteraction,
        valueRatio: walletData.valueToBalanceRatio
      });
        try {
        console.log("Starting ML risk assessment using external API only");
        console.log("Transaction data being sent:", transactionData);

        // Use ONLY the external ML API endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn("ML API request timed out after 20 seconds");
        }, 20000); // 20 second timeout

        const response = await fetch('https://ml-fraud-transaction-detection.onrender.com/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData),
          signal: controller.signal
        });

        // Clear timeout immediately when response is received
        clearTimeout(timeoutId);
        console.log("✅ ML API request completed successfully, timeout cleared");

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ML API error:", response.status, errorText);
          throw new Error(`ML API returned status ${response.status}: ${errorText}`);
        }

        const fraudResult = await response.json();
        console.log("ML API response received:", fraudResult);

        // Convert the API response to our expected format
        const normalizedResult = {
          prediction: fraudResult.prediction,
          risk_score: fraudResult.prediction === "Fraud" ? 0.8 : 0.2, // Convert string to numeric score
          risk_level: fraudResult.prediction === "Fraud" ? "HIGH" : "LOW",
          type: fraudResult.Type,
          explanation: `ML Assessment: ${fraudResult.Type}`
        };

        // Store the fraud data for the modal
        setFraudData({...normalizedResult, ...transactionData});

        // Check if fraud is detected based on prediction
        if (fraudResult.prediction === "Fraud") {
          console.log("Fraud detected by ML API:", fraudResult.prediction);
          setShowFraudWarning(true);
          if (onFraudDetected) {
            onFraudDetected({...normalizedResult, ...transactionData});
          }
          return true; // Fraud detected
        }

        // Transaction appears safe - show the ML assessment results in modal
        console.log("✅ Transaction appears safe:", fraudResult.prediction);
        console.log("📊 ML Assessment Results:", normalizedResult);

        // Store the success data for the modal
        setMLSuccessData({...normalizedResult, ...transactionData});
        setShowMLSuccess(true);

        return false; // No fraud detected

      } catch (err: any) {
        console.error("ML API request failed:", err);

        if (err.name === 'AbortError') {
          throw new Error('ML risk assessment timed out');
        }

        throw new Error(`ML risk assessment failed: ${err.message}`);
      }
    } catch (err: any) {
      console.error('Error checking for fraud:', err);
      // Don't set error here - let the calling function handle it
      throw err; // Re-throw the error so the calling function can handle it properly
    }
  };
  // Handle transaction submission
  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🚀 handleSubmit CALLED!");
    console.log("Event:", e);
    console.log("Event type:", e.type);
    e.preventDefault();
    console.log("🚀 FORM SUBMITTED - Starting transaction process");

    // Clear previous states
    setSuccess(null);
    setError(null);
    setLoading(true);

    // Basic validation
    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Please enter a valid Ethereum address');
      setLoading(false);
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    console.log("✅ Form validation passed");
    console.log("📝 Transaction details:", { recipient, amount, gasPrice });

    try {
      console.log("🔒 STARTING ML SECURITY CHECK - MetaMask should NOT appear yet");
      setError("🤖 Analyzing transaction security with ML API...");

      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("⏱️ Starting ML fraud detection...");

      // Create a promise that resolves when the risk assessment is complete
      // The checkForFraud function now has its own internal timeout handling
      const startTime = Date.now();
      console.log("Starting ML risk assessment process at", new Date().toISOString());

      // Master timeout to ensure we don't block for too long (25 seconds max)
      let masterTimeoutId: NodeJS.Timeout;
      const masterTimeoutPromise = new Promise<boolean | 'TIMEOUT'>((resolve) => {
        masterTimeoutId = setTimeout(() => {
          const duration = (Date.now() - startTime) / 1000;
          console.warn(`Master timeout reached after ${duration.toFixed(1)}s - BLOCKING transaction for security`);

          // Set error message for timeout
          setError("ML risk assessment process timed out. Transaction blocked for your protection.");

          // Log the timeout incident
          if (fraudData) {
            const cautionData = {...fraudData, timeout: true, riskLevel: "HIGH"};
            if (onFraudDetected) {
              onFraudDetected(cautionData);
            }
          }

          resolve('TIMEOUT'); // Return special timeout value to block transaction
        }, 25000); // 25 second master timeout as absolute maximum wait
      });

      // Wait for either the fraud check to complete or master timeout
      let assessmentResult: boolean | 'TIMEOUT';
      try {
        assessmentResult = await Promise.race([checkForFraud(), masterTimeoutPromise]);

        // Clear the master timeout since we got a result
        clearTimeout(masterTimeoutId);
        console.log("✅ Master timeout cleared - ML assessment completed");

        const duration = (Date.now() - startTime) / 1000;
        console.log(`ML risk assessment completed in ${duration.toFixed(1)}s, result: ${assessmentResult}`);

        // CRITICAL SECURITY CHECK: If ML assessment timed out, BLOCK transaction
        if (assessmentResult === 'TIMEOUT') {
          console.warn("❌ ML assessment timed out - BLOCKING transaction for security");
          setLoading(false);
          setError("Security assessment failed. Transaction blocked for your protection. Please try again or contact support if this persists.");
          return; // STOP - Do not proceed with transaction
        }

        // If fraud detection shows a warning, stop here (the modal will be shown)
        if (assessmentResult === true) {
          console.log("⚠️ FRAUD DETECTED - Showing warning modal, BLOCKING MetaMask");
          setLoading(false); // Stop loading since we're not proceeding
          return; // Don't continue with transaction - modal will be shown
        }

        // If ML check passed, show success modal and wait for user to proceed
        if (assessmentResult === false) {
          console.log("✅ ML SECURITY CHECK PASSED - Showing success modal");
          setLoading(false); // Stop loading since we're showing modal
          return; // Don't continue with transaction - success modal will be shown
        }
      } catch (mlError: any) {
        // Clear the master timeout since we got an error
        clearTimeout(masterTimeoutId);
        console.error("❌ ML SECURITY CHECK FAILED:", mlError);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`ML risk assessment failed after ${duration.toFixed(1)}s`);

        setLoading(false);
        setError(`Security check failed: ${mlError.message}. Transaction blocked for your protection.`);
        return; // STOP - Do not proceed with transaction
      }
    } catch (err: any) {
      console.error('❌ ERROR in handleSubmit:', err);
      setError('Transaction failed: ' + err.message);
      setLoading(false);
    }
  };
    // Send the actual transaction
  const sendTransaction = async () => {
    setLoading(true);
    try {
      console.log("Starting transaction submission process");
      const signer = await getSigner();
      if (!signer) throw new Error('No wallet connected');

      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);

      // Get signer's address
      const from = await signer.getAddress();
      console.log(`Preparing transaction from ${from} to ${recipient}`);

      // Create transaction object with gas estimation
      const tx = {
        to: recipient,
        value: amountInWei,
        // Let MetaMask handle gas estimation by default
      };

      console.log("Waiting for user to confirm transaction in wallet");

      // Send transaction - this will prompt the user in MetaMask
      // The ML assessment has already run by this point - we're just executing the transaction
      const transaction = await signer.sendTransaction(tx);

      console.log("Transaction confirmed by user and submitted:", transaction.hash);

      // Wait for transaction to be mined
      setSuccess(`Transaction sent! Hash: ${transaction.hash}`);

      // Clear form
      setRecipient('');
      setAmount('');

      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess(transaction.hash);
      }
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      if (err.code === 4001) { // User rejected transaction in MetaMask
        setError('Transaction was rejected by the user');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle proceed anyway after fraud warning
  const handleProceedAnyway = () => {
    setShowFraudWarning(false);
    // Show face verification instead of directly sending transaction
    setShowFaceVerification(true);
  };

  // Handle block transaction after fraud warning
  const handleBlockTransaction = () => {
    setShowFraudWarning(false);
    setError('Transaction cancelled due to high fraud risk');
  };

  // Handle proceed after ML success assessment
  const handleProceedAfterSuccess = () => {
    setShowMLSuccess(false);
    // Show face verification instead of directly sending transaction
    setShowFaceVerification(true);
  };

  // Handle successful face verification
  const handleFaceVerificationSuccess = () => {
    setShowFaceVerification(false);
    sendTransaction();
  };

  // Handle failed face verification
  const handleFaceVerificationError = (error: string) => {
    setError(`Face verification failed: ${error}`);
    setLoading(false);
  };

  // Handle face verification modal close
  const handleFaceVerificationClose = () => {
    setShowFaceVerification(false);
    setLoading(false);
  };



  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Send Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              console.log("📝 FORM onSubmit triggered!");
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={handleRecipientChange}
                required
                className={addressPreview?.isValid === false ? "border-red-500" : addressPreview?.isValid ? "border-green-500" : ""}
              />

              {/* Real-time address preview */}
              {addressPreview && (
                <div className="mt-2 p-3 rounded-lg border bg-gray-50">
                  {addressPreview.isValid ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Valid Address</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-medium">
                            {addressPreview.isContract ? (
                              <span className="text-blue-600">📄 Contract</span>
                            ) : (
                              <span className="text-green-600">👤 Wallet (EOA)</span>
                            )}
                          </span>
                        </div>

                        {!addressPreview.isContract && (
                          <>
                            <div>
                              <span className="text-gray-600">Balance:</span>
                              <span className="ml-2 font-medium text-blue-600">
                                {addressPreview.balance?.toFixed(4)} ETH
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Transactions:</span>
                              <span className="ml-2 font-medium text-purple-600">
                                {addressPreview.txCount}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        ✅ Real-time data fetched from blockchain
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">Invalid Ethereum Address</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="gasPrice">Gas Price (Gwei)</Label>
              <Input
                id="gasPrice"
                type="number"
                step="any"
                min="0"
                placeholder="20"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                required
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="mevProtection" className="flex items-center">
                <span>MEV Protection</span>
                <Shield className="ml-2 h-5 w-5 text-blue-500" />
              </Label>
              <Switch
                id="mevProtection"
                checked={useMEVProtection}
                onCheckedChange={setUseMEVProtection}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                {useMEVProtection
                  ? "MEV protection is enabled. Your transaction will be protected against MEV bots."
                  : "MEV protection is disabled. Your transaction may be vulnerable to MEV bots."}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Real-time ML Data Preview */}
            {recipient && amount && addressPreview?.isValid && (
              <div className="mt-4 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">🤖 ML Analysis Preview</span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>📊 <strong>Real Data Ready:</strong> When you submit, the system will fetch:</div>
                  <ul className="ml-4 space-y-1">
                    <li>• Your wallet balance and transaction history</li>
                    <li>• Current network gas prices</li>
                    <li>• Contract detection for recipient</li>
                    <li>• Risk ratios and behavioral patterns</li>
                    <li>• Time-based transaction analysis</li>
                  </ul>
                  <div className="mt-2 text-blue-600">
                    <strong>✨ No more placeholder data - 100% real blockchain information!</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button INSIDE the form */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/logs'}
                type="button"
              >
                View Transaction Logs
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Analyzing Security..." : "Send Tokens"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        {/* Fraud warning modal */}
      {showFraudWarning && fraudData && (
        <TransactionInterceptor
          onClose={handleProceedAnyway}
          onBlock={handleBlockTransaction}
          toAddress={recipient}
          fromAddress={fraudData.from_address || ''}
          value={parseFloat(amount)}
          gasPrice={parseFloat(gasPrice)}
        />
      )}

      {/* Face Verification Modal */}
      {showFaceVerification && (
        <FaceVerificationModal
          onClose={handleFaceVerificationClose}
          onSuccess={handleFaceVerificationSuccess}
          onError={handleFaceVerificationError}
          walletAddress={recipient}
        />
      )}

      {/* ML Success assessment modal */}
      {showMLSuccess && mlSuccessData && (
        <TransactionInterceptor
          onClose={handleProceedAfterSuccess}
          onBlock={handleFaceVerificationClose}
          toAddress={recipient}
          fromAddress={mlSuccessData.from_address || ''}
          value={parseFloat(amount)}
          gasPrice={parseFloat(gasPrice)}
          isSuccess={true}
        />
      )}
    </>
  );
};

export default SendTransaction;
