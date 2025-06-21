import { Web3AuthCore } from '@web3auth/core';
import { CHAIN_NAMESPACES, ADAPTER_STATUS } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

interface SecurityVerificationResult {
  isValid: boolean;
  securityLevel: number;
  riskFactors: string[];
}

export class CivicAuthManager {
  private auth: Web3AuthCore;
  private connection: Connection;
  private web3AuthProvider: any = null;
  private readonly uiConfig = {
    theme: 'dark',
    loginMethodsOrder: ['apple', 'google', 'twitter'],
  };

  constructor(clientId: string, chain: string = 'solana', rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
    
    // Initialize Web3Auth core
    this.auth = new Web3AuthCore({
      clientId,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.SOLANA,
        chainId: "0x1", // Solana mainnet
        rpcTarget: rpcUrl,
      },
      web3AuthNetwork: "cyan",
    });

    // Configure OpenLogin Adapter with additional security
    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        network: "mainnet",
        uxMode: "popup",
        whiteLabel: {
          appName: "Solana Wallet", // Changed name to appName
          logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
          logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
          defaultLanguage: "en",
          mode: "dark", // Changed dark to mode
        },
        loginConfig: {
          jwt: {
            verifier: 'civic-jwt-verifier',
            typeOfLogin: 'jwt',
            clientId,
          },
        },
      },
    });

    this.auth.configureAdapter(openloginAdapter as any);
  }

  async initiateCivicAuth(): Promise<void> {
    try {
      // Initialize Web3Auth
      await this.auth.init();
      
      // Connect with OpenLogin
      this.web3AuthProvider = await this.auth.connectTo('openlogin');
      
      if (!this.web3AuthProvider) {
        throw new Error('Authentication failed');
      }

      const userInfo = await this.auth.getUserInfo();
      console.log('Authenticated user:', userInfo);

    } catch (error) {
      console.error('Civic auth initiation failed:', error);
      throw error;
    }
  }

  async verifyAuth(): Promise<boolean> {
    try {
      const status = await this.auth.status;
      return status === ADAPTER_STATUS.CONNECTED;
    } catch (error) {
      console.error('Civic verification failed:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      this.web3AuthProvider = null;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getSecurityVerification(): Promise<SecurityVerificationResult> {
    try {
      if (!this.web3AuthProvider) {
        throw new Error('Not authenticated');
      }

      const userInfo = await this.auth.getUserInfo();
      const status = await this.auth.status;

      // Perform security checks
      const riskFactors: string[] = [];
      let securityLevel = 3; // High security by default

      // Check authentication status
      if (status !== ADAPTER_STATUS.CONNECTED) {
        riskFactors.push('Not fully connected');
        securityLevel--;
      }

      // Check email verification
      if (!userInfo.email || userInfo.verifierId !== 'email') {
        riskFactors.push('Email not verified');
        securityLevel--;
      }

      // Check provider
      if (!this.web3AuthProvider.isConnected) {
        riskFactors.push('Provider disconnected');
        securityLevel--;
      }

      // Additional security checks for Solana
      try {
        const publicKey = await this.getPublicKey();
        if (!publicKey) {
          riskFactors.push('No Solana public key');
          securityLevel--;
        }
      } catch {
        riskFactors.push('Solana wallet error');
        securityLevel--;
      }

      return {
        isValid: securityLevel > 0,
        securityLevel,
        riskFactors
      };

    } catch (error) {
      console.error('Security verification failed:', error);
      return {
        isValid: false,
        securityLevel: 0,
        riskFactors: ['Authentication error']
      };
    }
  }

  async getPublicKey(): Promise<PublicKey | null> {
    if (!this.web3AuthProvider) return null;
    const accounts = await this.web3AuthProvider.requestAccounts();
    return accounts.length > 0 ? new PublicKey(accounts[0]) : null;
  }

  async getProvider(): Promise<any> {
    return this.web3AuthProvider;
  }

  async getUserInfo(): Promise<any> {
    if (!this.auth) return null;
    return await this.auth.getUserInfo();
  }
}
