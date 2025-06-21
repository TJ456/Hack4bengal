import { ethers } from 'ethers';

interface GatewayToken {
  identifier: string;
  issuedAt: string;
  expiresAt: string;
  chainAddress: string;
  clientId: string;
  type: string;
}

interface CivicAuthState {
  isVerified: boolean;
  gatewayToken?: GatewayToken;
  score: number;
  level: 'low' | 'medium' | 'high';
}

export class CivicAuthService {
  private clientId: string;
  private static instance: CivicAuthService;
  private verifiedAddresses: Map<string, CivicAuthState> = new Map();

  private constructor(clientId: string) {
    this.clientId = clientId;
  }

  public static getInstance(clientId: string): CivicAuthService {
    if (!CivicAuthService.instance) {
      CivicAuthService.instance = new CivicAuthService(clientId);
    }
    return CivicAuthService.instance;
  }

  private generateMockGatewayToken(address: string): GatewayToken {
    const timestamp = Date.now();
    return {
      identifier: `civic_${timestamp}_${address.slice(2, 8)}`,
      issuedAt: new Date(timestamp).toISOString(),
      expiresAt: new Date(timestamp + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
      chainAddress: address,
      clientId: this.clientId,
      type: 'civic'
    };
  }

  public async verifyWallet(address: string): Promise<CivicAuthState> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    // Check if already verified
    const existing = this.verifiedAddresses.get(address);
    if (existing && this.isValidState(existing)) {
      return existing;
    }

    // For demo: addresses starting with 0x1 get high trust,
    // 0x2 get medium, others get low
    const prefix = address.toLowerCase().substring(0, 3);
    let score: number;
    let level: 'low' | 'medium' | 'high';

    switch(prefix) {
      case '0x1':
        score = 85 + Math.floor(Math.random() * 15);
        level = 'high';
        break;
      case '0x2':
        score = 50 + Math.floor(Math.random() * 35);
        level = 'medium';
        break;
      default:
        score = Math.floor(Math.random() * 50);
        level = 'low';
        break;
    }

    const state: CivicAuthState = {
      isVerified: true,
      gatewayToken: this.generateMockGatewayToken(address),
      score,
      level
    };

    this.verifiedAddresses.set(address, state);
    return state;
  }

  private isValidState(state: CivicAuthState): boolean {
    if (!state.gatewayToken) return false;
    const expiry = new Date(state.gatewayToken.expiresAt);
    return expiry > new Date();
  }

  public async calculateTrustScore(address: string): Promise<{ score: number; details: any }> {
    try {
      const state = await this.verifyWallet(address);
      
      let details = {
        verification: state.level === 'high' ? 40 : state.level === 'medium' ? 25 : 10,
        history: Math.floor(Math.random() * 30), // Mock transaction history score
        behavior: Math.floor(Math.random() * 30), // Mock behavioral score
      };

      return {
        score: state.score,
        details
      };
    } catch (error) {
      console.error('Trust score calculation failed:', error);
      return { score: 0, details: {} };
    }
  }

  public async checkIdentityStatus(address: string): Promise<{
    isVerified: boolean;
    level: string;
    expiresAt?: string;
    verificationId?: string;
  }> {
    const state = this.verifiedAddresses.get(address);
    
    if (!state || !this.isValidState(state)) {
      return {
        isVerified: false,
        level: 'none'
      };
    }

    return {
      isVerified: true,
      level: state.level,
      expiresAt: state.gatewayToken?.expiresAt,
      verificationId: state.gatewayToken?.identifier
    };
  }

  public async requestNewVerification(address: string): Promise<CivicAuthState> {
    // Clear existing verification if any
    this.verifiedAddresses.delete(address);
    // Generate new verification
    return this.verifyWallet(address);
  }
}

export default CivicAuthService;
