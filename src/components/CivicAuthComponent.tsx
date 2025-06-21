import React, { useEffect, useState } from 'react';
import { CivicAuthManager } from '../utils/CivicAuthManager';
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from 'lucide-react';

interface CivicAuthProps {
  onAuthSuccess: (token: string) => void;
  onAuthFailure: (error: string) => void;
  clientId: string;
  rpcUrl: string;
}

const CivicAuthComponent: React.FC<CivicAuthProps> = ({
  onAuthSuccess,
  onAuthFailure,
  clientId,
  rpcUrl
}) => {
  const [authManager, setAuthManager] = useState<CivicAuthManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityInfo, setSecurityInfo] = useState<{
    level: number;
    factors: string[];
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Civic Auth Manager
    const manager = new CivicAuthManager(clientId, 'solana', rpcUrl);
    setAuthManager(manager);

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const isAuth = await manager.verifyAuth();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const security = await manager.getSecurityVerification();
          setSecurityInfo({
            level: security.securityLevel,
            factors: security.riskFactors
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };

    checkAuth();
  }, [clientId, rpcUrl]);

  const handleAuth = async () => {
    if (!authManager) return;

    setIsLoading(true);
    setError(null);

    try {
      // Start authentication
      await authManager.initiateCivicAuth();

      // Verify with enhanced security
      const securityCheck = await authManager.getSecurityVerification();
      
      if (!securityCheck.isValid) {
        throw new Error(
          `Security verification failed: ${securityCheck.riskFactors.join(', ')}`
        );
      }

      setSecurityInfo({
        level: securityCheck.securityLevel,
        factors: securityCheck.riskFactors
      });

      // Get user info and public key for authentication
      const userInfo = await authManager.getUserInfo();
      const publicKey = await authManager.getPublicKey();
      
      if (!userInfo || !publicKey) {
        throw new Error('Failed to get user information or wallet');
      }

      setIsAuthenticated(true);
      onAuthSuccess(publicKey.toString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onAuthFailure(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!authManager) return;

    setIsLoading(true);
    try {
      await authManager.logout();
      setSecurityInfo(null);
      setIsAuthenticated(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityColor = (level: number) => {
    if (level >= 3) return 'bg-green-500';
    if (level === 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Civic Authentication</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {securityInfo && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Security Level:</span>
            <span className={`px-2 py-1 rounded ${getSecurityColor(securityInfo.level)}`}>
              {securityInfo.level}/3
            </span>
          </div>
          <Progress 
            value={(securityInfo.level / 3) * 100}
            className={`h-2 ${getSecurityColor(securityInfo.level)}`}
          />
          {securityInfo.factors.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-semibold text-yellow-600">Security Notices:</span>
              <ul className="list-disc list-inside text-sm text-yellow-600">
                {securityInfo.factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center">
        {isAuthenticated ? (
          <Button 
            onClick={handleLogout}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging Out...
              </>
            ) : (
              'Disconnect Wallet'
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleAuth}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect with Civic'
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CivicAuthComponent;
