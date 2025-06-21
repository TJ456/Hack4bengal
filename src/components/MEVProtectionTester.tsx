import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import walletConnector from '@/web3/wallet';
import { DEX_ROUTER_ADDRESSES } from '@/web3/constants';

export default function MEVProtectionTester() {
    const [testResults, setTestResults] = useState<{
        dexDetection: boolean | null;
        flashbotsAvailable: boolean | null;
        slippageProtection: boolean | null;
    }>({
        dexDetection: null,
        flashbotsAvailable: null,
        slippageProtection: null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runTests = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // 1. Test DEX Detection
            const sampleDEXTx = {
                to: DEX_ROUTER_ADDRESSES.UNISWAP_V2,
                data: "0x38ed1739", // SWAP_EXACT_TOKENS_FOR_TOKENS
                value: ethers.parseEther("0.1")
            };

            const isDEXProtected = await walletConnector.isTransactionProtected(sampleDEXTx);
            
            // 2. Check Flashbots Availability
            const provider = walletConnector.provider;
            const network = await provider?.getNetwork();
            const isFlashbotsNetwork = network?.chainId === 1n || network?.chainId === 5n;

            // 3. Test Slippage Protection
            const protectedTx = await walletConnector.sendProtectedTransaction(sampleDEXTx);
            const hasSlippage = protectedTx.data !== sampleDEXTx.data;

            setTestResults({
                dexDetection: isDEXProtected,
                flashbotsAvailable: isFlashbotsNetwork,
                slippageProtection: hasSlippage
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-black/20 backdrop-blur-lg border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        MEV Protection Tester
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button 
                            onClick={runTests} 
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? "Running Tests..." : "Run MEV Protection Tests"}
                        </Button>

                        {error && (
                            <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {testResults.dexDetection !== null && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>DEX Detection:</span>
                                    <Badge className={testResults.dexDetection ? "bg-green-500/20" : "bg-red-500/20"}>
                                        {testResults.dexDetection ? "Working ✅" : "Failed ❌"}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Flashbots Available:</span>
                                    <Badge className={testResults.flashbotsAvailable ? "bg-green-500/20" : "bg-yellow-500/20"}>
                                        {testResults.flashbotsAvailable ? "Yes ✅" : "No ⚠️"}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Slippage Protection:</span>
                                    <Badge className={testResults.slippageProtection ? "bg-green-500/20" : "bg-red-500/20"}>
                                        {testResults.slippageProtection ? "Working ✅" : "Failed ❌"}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
