import { useState, useCallback, useEffect } from 'react';
import { useCivicStore } from '@/stores/civicStore';
import { CivicAuthService } from '@/services/civicAuth';

interface UseCivicAuth {
  isVerified: boolean;
  isLoading: boolean;
  verify: () => Promise<void>;
  error: Error | null;
  trustScore: number;
  canSocialRecover: boolean;
  canVoteInDAO: boolean;
}

export const useCivicAuth = (walletAddress: string | null): UseCivicAuth => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [trustScore, setTrustScore] = useState(0);
  const { getGatewayToken, setGatewayToken } = useCivicStore();

  const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;
  const isVerified = walletAddress ? !!getGatewayToken(walletAddress) : false;
  const canSocialRecover = isVerified && trustScore >= 80;
  const canVoteInDAO = isVerified && trustScore >= 60;

  const verify = useCallback(async () => {
    if (!walletAddress) {
      setError(new Error('Wallet not connected'));
      return;
    }

    if (!clientId) {
      setError(new Error('Civic client ID not configured'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = CivicAuthService.getInstance(clientId);
      const state = await service.verifyWallet(walletAddress);

      if (!state.isVerified) {
        throw new Error('Verification failed. Please try again.');
      }

      setTrustScore(state.score);

      if (state.gatewayToken) {
        setGatewayToken(walletAddress, state.gatewayToken.identifier);
      }

      return;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, clientId, setGatewayToken]);

  // Check verification status and trust score on wallet change
  useEffect(() => {
    if (walletAddress && clientId) {
      const service = CivicAuthService.getInstance(clientId);
      const checkStatus = async () => {
        try {
          const state = await service.verifyWallet(walletAddress);
          setTrustScore(state.score);
        } catch (err) {
          console.error('Failed to check verification status:', err);
        }
      };
      checkStatus();
    }
  }, [walletAddress, clientId]);

  return {
    isVerified,
    isLoading,
    verify,
    error,
    trustScore,
    canSocialRecover,
    canVoteInDAO
  };
};
