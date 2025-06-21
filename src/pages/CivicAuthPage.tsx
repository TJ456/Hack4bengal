import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
// @ts-expect-error: AuthClient is a default export in some versions of @civic/auth
import AuthClient from '@civic/auth';
import { Web3AuthOptions } from '@web3auth/modal';
import { ethers } from 'ethers';

interface AuthStatus {
  isAuthenticated: boolean;
  isCivicVerified: boolean;
  hasFaceRegistration: boolean;
}

const CivicAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isCivicVerified: false,
    hasFaceRegistration: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [civicReady, setCivicReady] = useState(false);

  // Use useRef to persist Civic Auth client
  const civicAuth = useRef<AuthClient | null>(null);
  useEffect(() => {
    const appId = import.meta.env.VITE_CIVIC_APP_ID || '';
    const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';
    if (!appId || !walletConnectProjectId) {
      toast({
        variant: "destructive",
        title: "Civic Auth Config Error",
        description: "Civic App ID or WalletConnect Project ID is missing. Please check your environment variables.",
      });
      setCivicReady(false);
      return;
    }
    // If AuthClientOptions is not available, use 'any' as a workaround
    const authClientOptions: any = {
      appId,
      walletConnectProjectId,
      network: 'mainnet',
      defaultWeb3AuthLoginProvider: 'civic',
      logLevel: 'info',
      web3AuthNetwork: 'cyan',
      scope: 'openid wallet offline_access',
    };
    civicAuth.current = new AuthClient(authClientOptions);
    setCivicReady(true);
  }, [toast]);

  // Check Civic status if wallet is already connected
  useEffect(() => {
    if (walletAddress) {
      checkCivicStatus(walletAddress);
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      if (!window.ethereum) throw new Error('No Ethereum provider found');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      });
      // Automatically start Civic verification after wallet connect
      if (civicReady && civicAuth.current) {
        await startCivicVerification();
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCivicVerification = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet first.",
      });
      return;
    }
    if (!civicReady || !civicAuth.current) {
      toast({
        variant: "destructive",
        title: "Civic Auth Not Ready",
        description: "Civic Auth is not initialized. Please try again later.",
      });
      return;
    }
    try {
      setIsLoading(true);
      const response = await civicAuth.current.signIn();
      if (response.status === 'completed') {
        setAuthStatus(prev => ({ ...prev, isCivicVerified: true }));
        toast({
          title: "Civic Verification Complete",
          description: "Your identity has been successfully verified.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification Incomplete",
          description: "Civic verification was not completed.",
        });
      }
    } catch (err) {
      console.error('Civic verification failed:', err);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not complete Civic verification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToFaceRegistration = () => {
    if (!authStatus.isCivicVerified) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please complete Civic verification first.",
      });
      return;
    }
    // Simulate face registration for demo; in real app, handle on /register page
    setAuthStatus(prev => ({ ...prev, hasFaceRegistration: true }));
    toast({
      title: "Face Registration Complete",
      description: "Your biometrics have been registered.",
    });
    // navigate('/register'); // Uncomment if /register page handles real registration
  };

  const checkCivicStatus = async (address: string) => {
    try {
      if (!civicAuth.current) return;
      const authState = await civicAuth.current.getAuthState();
      setAuthStatus(prev => ({
        ...prev,
        isCivicVerified: authState.status === 'completed',
      }));
    } catch (err) {
      console.error('Failed to check Civic status:', err);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12">
      {/* Civic Auth Main Banner */}
      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-4 mb-2">
          <img src="https://www.civic.com/favicon.ico" alt="Civic Logo" className="w-10 h-10" />
          <span className="text-2xl font-bold text-cyan-700">Civic Authentication</span>
        </div>
        <div className="text-center text-base text-muted-foreground mb-2">
          Secure your wallet and identity with Civic's decentralized authentication.
        </div>
        <div className={`rounded-lg p-4 flex items-center space-x-4 ${civicReady ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}`}> 
          <span className={`font-bold ${civicReady ? 'text-green-700' : 'text-red-700'}`}>Civic Auth Status:</span>
          <span className="font-mono">{civicReady ? 'Ready' : 'Not Ready'}</span>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="ml-4">Reload</Button>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold">Connected Wallet:</span> <span className="font-mono">{walletAddress ? walletAddress : 'Not Connected'}</span>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-semibold">Civic Verification:</span> <span className={authStatus.isCivicVerified ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{authStatus.isCivicVerified ? 'Verified' : 'Not Verified'}</span>
          <Button size="sm" variant="ghost" className="ml-2" onClick={() => walletAddress && checkCivicStatus(walletAddress)} disabled={!walletAddress || !civicReady}>Refresh Civic Status</Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Enhanced Security Authentication</CardTitle>
          <CardDescription>
            Complete the authentication process to secure your wallet with multi-factor verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            {/* Step 1: Wallet Connection */}
            <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
              <Shield className={`w-8 h-8 ${walletAddress ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Step 1: Connect Wallet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Ethereum wallet to begin the verification process
                </p>
                <Button
                  variant={walletAddress ? "outline" : "default"}
                  onClick={connectWallet}
                  disabled={!!walletAddress || isLoading}
                >
                  {walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
                </Button>
              </div>
            </div>

            {/* Step 2: Civic Verification */}
            <div className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${authStatus.isCivicVerified ? 'border-green-500 bg-green-50' : civicReady ? 'border-cyan-500 bg-cyan-50' : 'border-red-400 bg-red-50 opacity-50 pointer-events-none'}`}>
              <Key className={`w-8 h-8 ${authStatus.isCivicVerified ? 'text-green-500' : 'text-cyan-500'}`} />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Step 2: Civic Identity Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {civicReady ? "Verify your identity using Civic's secure protocol" : "Civic Auth is not ready. Please check your configuration."}
                </p>
                <Button
                  onClick={startCivicVerification}
                  disabled={!walletAddress || authStatus.isCivicVerified || isLoading || !civicReady}
                  className="font-bold"
                >
                  {authStatus.isCivicVerified ? 'Verified with Civic' : 'Start Civic Verification'}
                </Button>
              </div>
            </div>

            {/* Step 3: Face Registration */}
            <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
              <UserCheck className={`w-8 h-8 ${authStatus.hasFaceRegistration ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Step 3: Biometric Registration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register your face for additional security layer
                </p>
                <Button
                  onClick={proceedToFaceRegistration}
                  disabled={!authStatus.isCivicVerified || isLoading}
                >
                  {authStatus.hasFaceRegistration ? 'Biometrics Registered' : 'Start Face Registration'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Level Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Security Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ 
                  width: `${(
                    (walletAddress ? 33 : 0) + 
                    (authStatus.isCivicVerified ? 33 : 0) + 
                    (authStatus.hasFaceRegistration ? 34 : 0)
                  )}%` 
                }}
              />
            </div>
            <span className="text-sm font-medium">
              {(
                (walletAddress ? 33 : 0) + 
                (authStatus.isCivicVerified ? 33 : 0) + 
                (authStatus.hasFaceRegistration ? 34 : 0)
              )}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Simulate Recovery Button for Demo Purposes */}
      <div className="flex justify-center mt-6">
        <Button
          variant="destructive"
          onClick={() => {
            setAuthStatus({
              isAuthenticated: false,
              isCivicVerified: false,
              hasFaceRegistration: false
            });
            setWalletAddress(null);
            toast({
              title: "Recovery Triggered",
              description: "All authentication factors have been reset. Please re-verify.",
            });
          }}
        >
          Simulate Account Recovery
        </Button>
      </div>
    </div>
  );
};

export default CivicAuthPage;
