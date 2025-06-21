// Integration of AI scam detection with Civic identity verification

import { verifyCivicIdentity } from './auth';

/**
 * Combination verification using both Civic identity and ML scam detection
 * Implements the "AI + Civic Parallel Check" concept
 * 
 * @param address User's wallet address
 * @param transaction Transaction details to analyze
 * @returns Combined verification result
 */
export const dualVerification = async (address: string, transaction: any) => {
  try {
    // Step 1: Check Civic verification
    const civicVerification = await verifyCivicIdentity(address);
    
    // Step 2: Run ML scam detection
    const mlVerification = await runMlScamDetection(transaction);
    
    return {
      civicVerified: civicVerification.isVerified,
      mlSafe: mlVerification.isSafe,
      riskScore: mlVerification.riskScore,
      combinedSafe: civicVerification.isVerified && mlVerification.isSafe,
      warnings: mlVerification.warnings,
      recommendation: getCombinedRecommendation(civicVerification.isVerified, mlVerification),
    };
  } catch (error) {
    console.error('Dual verification failed:', error);
    return {
      civicVerified: false,
      mlSafe: false,
      riskScore: 100, // High risk score on error
      combinedSafe: false,
      warnings: ['Verification failed'],
      recommendation: 'Transaction verification failed. Please try again.',
    };
  }
};

/**
 * Run ML-based scam detection on a transaction
 * This connects to your existing ML API
 * 
 * @param transaction Transaction details to analyze
 * @returns ML verification result
 */
const runMlScamDetection = async (transaction: any) => {
  try {
    // This should connect to your existing ML API
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionData: transaction,
      }),
    });
    
    if (!response.ok) {
      throw new Error('ML API request failed');
    }
    
    const result = await response.json();
    
    return {
      isSafe: result.scamProbability < 0.3, // Consider safe if scam probability is less than 30%
      riskScore: Math.round(result.scamProbability * 100),
      warnings: result.warnings || [],
      details: result.details || {},
    };
  } catch (error) {
    console.error('ML scam detection failed:', error);
    return {
      isSafe: false,
      riskScore: 75, // Default high risk on error
      warnings: ['Could not complete ML verification'],
      details: {},
    };
  }
};

/**
 * Get a recommendation based on combined verification results
 * 
 * @param civicVerified Whether the user is Civic verified
 * @param mlVerification ML verification result
 * @returns User-friendly recommendation
 */
const getCombinedRecommendation = (civicVerified: boolean, mlVerification: any): string => {
  if (civicVerified && mlVerification.isSafe) {
    return 'Transaction appears safe. You are verified with Civic, and our AI detected no issues.';
  }
  
  if (civicVerified && !mlVerification.isSafe) {
    return `CAUTION: While you are verified with Civic, our AI detected potential issues (Risk: ${mlVerification.riskScore}%). Review carefully before proceeding.`;
  }
  
  if (!civicVerified && mlVerification.isSafe) {
    return 'Verify your identity with Civic to enhance transaction security. Our AI detected no issues with this transaction.';
  }
  
  return `WARNING: You are not verified with Civic, and our AI detected potential issues (Risk: ${mlVerification.riskScore}%). We strongly recommend not proceeding with this transaction.`;
};
