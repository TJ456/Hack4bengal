import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import walletConnector from '@/web3/wallet';
import { DEX_ROUTER_ADDRESSES } from '@/web3/constants';

export default function MEVProtectionTester() {
  const [testResults, setTestResults] = useState({
    dexDetection: null,
    flashbotsAvailable: null,
    slippageProtection: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    setStep(0);

    try {
      const sampleDEXTx = {
        to: DEX_ROUTER_ADDRESSES.UNISWAP_V2,
        data: '0x38ed1739',
        value: ethers.parseEther('0'),
      };

      setStep(1);
      const isDEXProtected = await walletConnector.isTransactionProtected(sampleDEXTx);

      setStep(2);
      const provider = walletConnector.provider;
      const network = await provider?.getNetwork();
      const isFlashbotsNetwork = network?.chainId === 1n || network?.chainId === 5n;

      setStep(3);
      const protectedTx = await walletConnector.sendProtectedTransaction(sampleDEXTx);
      const hasSlippage = protectedTx.data !== sampleDEXTx.data;

      setTestResults({
        dexDetection: isDEXProtected,
        flashbotsAvailable: isFlashbotsNetwork,
        slippageProtection: hasSlippage,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStep(0);
    }
  };

  const allPassed =
    testResults.dexDetection &&
    testResults.flashbotsAvailable &&
    testResults.slippageProtection;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse rounded-t-2xl" />
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl p-6">
          <CardTitle className="flex items-center gap-2 text-white text-xl">
            <Shield className="w-5 h-5 text-cyan-400 animate-bounce" />
            MEV Protection Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="text-white space-y-6 p-6">
          <Button
            onClick={runTests}
            disabled={isLoading}
            className="w-full transition-transform duration-300 hover:scale-105 bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            {isLoading ? `Running Test ${step}/3...` : 'Run MEV Protection Tests'}
          </Button>

          {error && (
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {testResults.dexDetection !== null && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-400 w-4 h-4" />
                  <span>DEX Detection:</span>
                </div>
                <Badge
                  className={`${
                    testResults.dexDetection
                      ? 'bg-green-500/20 animate-pulse'
                      : 'bg-red-500/20'
                  }`}
                >
                  {testResults.dexDetection ? 'Working ✅' : 'Failed ❌'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-400 w-4 h-4" />
                  <span>Flashbots Available:</span>
                </div>
                <Badge
                  className={`${
                    testResults.flashbotsAvailable
                      ? 'bg-green-500/20 animate-pulse'
                      : 'bg-yellow-500/20'
                  }`}
                >
                  {testResults.flashbotsAvailable ? 'Yes ✅' : 'No ⚠️'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400 w-4 h-4" />
                  <span>Slippage Protection:</span>
                </div>
                <Badge
                  className={`${
                    testResults.slippageProtection
                      ? 'bg-green-500/20 animate-pulse'
                      : 'bg-red-500/20'
                  }`}
                >
                  {testResults.slippageProtection ? 'Working ✅' : 'Failed ❌'}
                </Badge>
              </div>

              {allPassed ? (
                <div className="p-4 mt-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center animate-fade-in">
                  <p className="text-green-300 text-sm font-semibold">🎉 All Systems Secure! Great job.</p>
                </div>
              ) : (
                <div className="text-center mt-4 text-red-300 animate-fade-in">
                  Some protections failed. Please review above results.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
