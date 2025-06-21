// Smart Contract Interaction Module for UnhackableWallet
// Handles all interactions with deployed smart contracts

import { Contract, formatUnits, parseUnits } from 'ethers';
import walletConnector from './wallet';
import UnhackableWalletABI from './abi/UnhackableWallet.json';
import { shortenAddress } from './utils';

// Contract addresses for each network - load from environment variables when available
const CONTRACT_ADDRESSES: { [chainId: string]: string } = {
  // Mainnet and testnet addresses
  '1': import.meta.env.VITE_CONTRACT_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
  '5': import.meta.env.VITE_CONTRACT_ADDRESS_GOERLI || '0x0000000000000000000000000000000000000000',
  '11155111': import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA || '0x0000000000000000000000000000000000000000', 
  '2023': import.meta.env.VITE_CONTRACT_ADDRESS_MONAD || '0x7A791FE5A35131B7D98F854A64e7F94180F27C7B', // Default Monad testnet address
  // Add more networks as needed
};

/**
 * Smart contract interaction class for UnhackableWallet
 */
class ContractService {
  private contractInstance: Contract | null = null;

  /**
   * Initialize the contract instance
   * @returns {Promise<Contract>} The contract instance
   */
  async initContract(): Promise<Contract> {
    if (!walletConnector.provider || !walletConnector.signer || !walletConnector.chainId) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    const chainId = walletConnector.chainId.toString();
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    
    // Validate contract address
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Contract not deployed on network ${walletConnector.networkName || chainId}. Please switch to a supported network.`);
    }

    try {
      this.contractInstance = new Contract(
        contractAddress,
        UnhackableWalletABI.abi,
        walletConnector.signer
      );
      
      // Verify the contract exists on the network by calling a view function
      await this.contractInstance.getReportCount();
      
      return this.contractInstance;
    } catch (error: any) {
      console.error('Failed to initialize contract:', error);
      if (error.message.includes('call revert exception')) {
        throw new Error(`Contract at ${contractAddress} doesn't match the expected ABI. Please check deployment.`);
      }
      throw new Error(`Failed to connect to the contract: ${error.message}`);
    }
  }
  
  /**
   * Get the contract instance, initializing if necessary
   * @returns {Promise<Contract>} The contract instance
   */
  async getContract(): Promise<Contract> {
    if (!this.contractInstance) {
      return this.initContract();
    }
    return this.contractInstance;
  }
  
  /**
   * Verify that the contract on the connected network matches our ABI
   * @returns {Promise<boolean>} True if contract is valid
   */
  async verifyContract(): Promise<boolean> {
    try {
      const contract = await this.getContract();
      
      // Try to call a view functions to verify the contract
      await contract.getReportCount();
      
      // If we got here, the contract is valid
      return true;
    } catch (error) {
      console.error("Contract verification failed:", error);
      return false;
    }
  }
  
  /**
   * Check if user has enough ETH to perform a transaction
   * @param {string} amount - The amount in ETH to check
   * @returns {Promise<boolean>} True if user has enough balance
   */
  async hasEnoughBalance(amount: string): Promise<boolean> {
    if (!walletConnector.address) return false;
    
    try {
      const balance = await walletConnector.getBalance();
      const amountValue = parseFloat(amount);
      const balanceValue = parseFloat(balance);
      
      // Add 10% for gas costs
      const totalNeeded = amountValue * 1.1;
      return balanceValue >= totalNeeded;
    } catch (error) {
      console.error("Error checking balance:", error);
      return false;
    }
  }

  /**
   * Report a potential scam address
   * @param {string} suspiciousAddress - The address suspected of scam activity
   * @param {string} reason - Description of the scam
   * @param {string} evidence - Evidence URL or IPFS hash
   * @returns {Promise<any>} Transaction result
   */
  async reportScam(
    suspiciousAddress: string,
    reason: string,
    evidence: string
  ): Promise<any> {
    try {
      // Check wallet connection
      if (!walletConnector.address) {
        throw new Error('Wallet not connected');
      }
      
      const contract = await this.getContract();
      
      console.log(`Reporting scam: ${shortenAddress(suspiciousAddress)}`);
      const tx = await contract.reportScam(suspiciousAddress, reason, evidence);
      
      return tx;
    } catch (error: any) {
      console.error('Report scam error:', error);
      throw new Error(`Failed to report scam: ${error.message}`);
    }
  }

  /**
   * Vote on a scam report (DAO functionality)
   * @param {string} proposalId - The ID of the report to vote on
   * @param {boolean} inSupport - Whether the user believes the report is valid
   * @returns {Promise<any>} Transaction result
   */
  async voteOnScamReport(
    proposalId: string,
    inSupport: boolean
  ): Promise<any> {
    try {
      // Check wallet connection
      if (!walletConnector.address) {
        throw new Error('Wallet not connected');
      }
      
      const contract = await this.getContract();
      
      console.log(`Voting on report with proposalId: ${proposalId}, inSupport: ${inSupport}`);
      const tx = await contract.voteOnReport(proposalId, inSupport);
      
      return tx;
    } catch (error: any) {
      console.error('Vote error:', error);
      throw new Error(`Failed to vote on report: ${error.message}`);
    }
  }

  /**
   * Get all scam reports
   * @returns {Promise<any[]>} List of scam reports
   */
  async getScamReports(): Promise<any[]> {
    try {
      const contract = await this.getContract();
      
      const reportCount = await contract.getReportCount();
      const reports = [];
      
      for (let i = 0; i < reportCount.toNumber(); i++) {
        const report = await contract.getReport(i);
        reports.push({
          id: i,
          reporter: report.reporter,
          suspiciousAddress: report.suspiciousAddress,
          description: report.description, // This matches with 'reason' in the contract
          evidence: report.evidence,
          timestamp: new Date(Number(report.timestamp) * 1000),
          votesFor: Number(report.votesFor),
          votesAgainst: Number(report.votesAgainst),
          confirmed: report.confirmed
        });
      }
      
      return reports;
    } catch (error: any) {
      console.error('Get reports error:', error);
      return [];
    }
  }

  /**
   * Get scam reports filed by the connected address
   * @returns {Promise<any[]>} List of user's scam reports
   */
  async getUserReports(): Promise<any[]> {
    try {
      if (!walletConnector.address) return [];
      
      const reports = await this.getScamReports();
      return reports.filter(
        report => report.reporter.toLowerCase() === walletConnector.address?.toLowerCase()
      );
    } catch (error) {
      console.error('Get user reports error:', error);
      return [];
    }
  }

  /**
   * Transfer funds using the secure transfer function of the wallet
   * @param {string} to - Recipient address
   * @param {string} amount - Amount in ETH
   * @returns {Promise<any>} Transaction result
   */
  async secureSendETH(
    to: string,
    amount: string
  ): Promise<any> {
    try {
      // Check wallet connection
      if (!walletConnector.address) {
        throw new Error('Wallet not connected');
      }
      
      // Check if user has enough balance
      const hasBalance = await this.hasEnoughBalance(amount);
      if (!hasBalance) {
        throw new Error('Insufficient balance for this transaction (including gas fees)');
      }
      
      const contract = await this.getContract();
      
      // Convert ETH amount to Wei
      const amountWei = parseUnits(amount, 18);
      console.log(`Sending ${amount} ETH to ${shortenAddress(to)}`);
      
      const tx = await contract.secureTransfer(to, {
        value: amountWei
      });
      
      return tx;
    } catch (error: any) {
      console.error('Secure send error:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Check if an address has been reported as a scam
   * @param {string} address - The address to check
   * @returns {Promise<boolean>} Whether the address is flagged as a scam
   */
  async isScamAddress(address: string): Promise<boolean> {
    try {
      const contract = await this.getContract();
      return await contract.isScamAddress(address);
    } catch (error) {
      console.error('Check scam address error:', error);
      // Default to false if error occurs during check
      return false;
    }
  }

  /**
   * Get scam probability score for an address
   * @param {string} address - The address to check
   * @returns {Promise<number>} Score from 0-100 representing scam likelihood
   */
  async getScamScore(address: string): Promise<number> {
    try {
      const contract = await this.getContract();
      const score = await contract.getScamScore(address);
      return score.toNumber();
    } catch (error) {
      console.error('Get scam score error:', error);
      // Return zero score if error occurs
      return 0;
    }
  }
}

// Create a singleton instance
const contractService = new ContractService();

// Standalone functions for Step 6

/**
 * Get a contract instance
 * @returns {Promise<Contract>} Contract instance
 */
export const getContract = async (): Promise<Contract> => {
  return contractService.getContract();
};

/**
 * Send ETH securely
 * @param to Recipient address
 * @param amountEth Amount in ETH
 * @returns Transaction hash
 */
export const sendTransaction = async (to: string, amountEth: string): Promise<string> => {
  try {
    const tx = await contractService.secureSendETH(to, amountEth);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    console.error('Send transaction error:', error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};

/**
 * Report scammer
 * @param scammer Address to report
 * @param reason Reason for the report
 * @param evidence Evidence URL or documentation (optional)
 * @returns Transaction hash
 */
export const reportScam = async (scammer: string, reason: string, evidence: string = ""): Promise<string> => {
  try {
    const tx = await contractService.reportScam(scammer, reason, evidence);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    console.error('Report scam error:', error);
    throw new Error(`Report submission failed: ${error.message}`);
  }
};

/**
 * Vote on a proposal
 * @param proposalId ID of the proposal
 * @param inSupport Whether to vote in support
 * @returns Transaction hash
 */
export const voteOnProposal = async (proposalId: string, inSupport: boolean): Promise<string> => {
  try {
    const tx = await contractService.voteOnScamReport(proposalId, inSupport);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    console.error('Vote error:', error);
    throw new Error(`Vote submission failed: ${error.message}`);
  }
};

export default contractService;
