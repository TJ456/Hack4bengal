import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SimpleCivicAuthProps {
  clientId: string;
  walletAddress?: string | null;
  onSuccess?: (gatewayToken: string) => void;
  onError?: (error: Error) => void;
}

const SimpleCivicAuth: React.FC<SimpleCivicAuthProps> = ({
  clientId,
  walletAddress,
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkVerification();
  }, [walletAddress]);

  const checkVerification = async () => {
    if (!walletAddress || !clientId) return;

    try {
      // For demo, we'll consider addresses starting with "0x1" as verified
      const mockVerified = walletAddress.toLowerCase().startsWith("0x1");
      setIsVerified(mockVerified);

      if (mockVerified) {
        const mockGatewayToken = `civic_${Date.now()}_${walletAddress.slice(2, 8)}`;
        onSuccess?.(mockGatewayToken);
      }
    } catch (error) {
      console.error('Verification check failed:', error);
      onError?.(error as Error);
    }
  };

  const handleVerify = async () => {
    if (!walletAddress) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Mock verification process - in production this would call Civic APIs
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockGatewayToken = `civic_${Date.now()}_${walletAddress.slice(2, 8)}`;
      
      setIsVerified(true);
      onSuccess?.(mockGatewayToken);

      toast({
        title: "Verification Successful",
        description: "Your wallet has been verified with Civic.",
      });

    } catch (error) {
      console.error('Verification failed:', error);
      const err = error as Error;
      onError?.(err);
      
      toast({
        title: "Verification Failed",
        description: err.message || "Failed to verify with Civic",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Civic Identity Verification
          {isVerified && (
            <span className="ml-2 text-sm text-green-500 bg-green-50 px-2 py-1 rounded-full">
              ✓ Verified
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Verify your identity using Civic to enhance your wallet security
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!walletAddress ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to begin verification
            </AlertDescription>
          </Alert>
        ) : isVerified ? (
          <div className="text-center py-2">
            <p className="text-green-600 font-medium">
              ✓ Your wallet is verified with Civic
            </p>
            <p className="text-sm text-gray-500 mt-1">
              You have full access to all features
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isLoading || !clientId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify with Civic'
              )}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Verification requires a one-time check to enhance security
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleCivicAuth;
