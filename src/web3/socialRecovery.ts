import { ethers } from 'ethers';
import walletConnector from './wallet';
import addresses from './addresses.json';

const SOCIAL_RECOVERY_ABI = [
  "function addGuardian(address _guardian) external",
  "function removeGuardian(address _guardian) external",
  "function getGuardians() external view returns (address[])",
  "function initiateRecovery(address _proposedOwner) external",
  "function approveRecovery(uint256 _requestId) external",
  "function cancelRecovery(uint256 _requestId) external",
  "function getRecoveryRequest(uint256 _requestId) external view returns (address proposedOwner, uint256 initiationTime, uint256 approvals, bool executed)",
  "function isGuardian(address) external view returns (bool)",
  "function guardianCount() external view returns (uint256)",
  "function GUARDIAN_THRESHOLD() external view returns (uint256)",
  "event GuardianAdded(address indexed guardian)",
  "event GuardianRemoved(address indexed guardian)",
  "event RecoveryInitiated(uint256 indexed requestId, address indexed proposedOwner)",
  "event RecoveryApproved(uint256 indexed requestId, address indexed guardian)",
  "event RecoveryExecuted(uint256 indexed requestId, address indexed oldOwner, address indexed newOwner)",
  "event RecoveryCancelled(uint256 indexed requestId)"
];

class SocialRecoveryService {
  private contract: ethers.Contract | null = null;
  private static instance: SocialRecoveryService;
  public isInitialized = false;  private constructor() {
    // Initial initialization if wallet is ready
    if (walletConnector.signer && addresses.socialRecoveryWallet) {
      this.initialize(addresses.socialRecoveryWallet).catch(console.error);
    }

    // Watch for wallet changes
    window.ethereum?.on('accountsChanged', () => {
      if (walletConnector.signer && addresses.socialRecoveryWallet) {
        this.initialize(addresses.socialRecoveryWallet).catch(console.error);
      } else {
        this.isInitialized = false;
        this.contract = null;
      }
    });
  }

  public static getInstance(): SocialRecoveryService {
    if (!SocialRecoveryService.instance) {
      SocialRecoveryService.instance = new SocialRecoveryService();
    }
    return SocialRecoveryService.instance;
  }

  /**
   * Initialize the service with contract address
   * @param contractAddress The deployed social recovery contract address
   */
  public async initialize(contractAddress: string): Promise<void> {
    if (!walletConnector.provider || !walletConnector.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      this.contract = new ethers.Contract(
        contractAddress,
        SOCIAL_RECOVERY_ABI,
        walletConnector.signer
      );
      this.isInitialized = true;
      console.log("Social recovery service initialized with contract:", contractAddress);
    } catch (error) {
      console.error("Failed to initialize social recovery contract:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Add a new guardian
   * @param guardianAddress The address to add as guardian
   */
  public async addGuardian(guardianAddress: string): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const tx = await this.contract.addGuardian(guardianAddress);
    await tx.wait();
  }

  /**
   * Remove a guardian
   * @param guardianAddress The address to remove from guardians
   */
  public async removeGuardian(guardianAddress: string): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const tx = await this.contract.removeGuardian(guardianAddress);
    await tx.wait();
  }

  /**
   * Get all guardians
   * @returns Array of guardian addresses
   */
  public async getGuardians(): Promise<string[]> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    return await this.contract.getGuardians();
  }

  /**
   * Check if an address is a guardian
   * @param address Address to check
   * @returns True if address is a guardian
   */
  public async isGuardian(address: string): Promise<boolean> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    return await this.contract.isGuardian(address);
  }

  /**
   * Get the number of guardians required for recovery
   * @returns Required number of guardians
   */
  public async getGuardianThreshold(): Promise<number> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    return (await this.contract.GUARDIAN_THRESHOLD()).toNumber();
  }

  /**
   * Initiate a recovery request
   * @param newOwnerAddress Proposed new owner address
   */
  public async initiateRecovery(newOwnerAddress: string): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const tx = await this.contract.initiateRecovery(newOwnerAddress);
    await tx.wait();
  }

  /**
   * Approve a recovery request
   * @param requestId ID of the recovery request
   */
  public async approveRecovery(requestId: number): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const tx = await this.contract.approveRecovery(requestId);
    await tx.wait();
  }

  /**
   * Cancel a recovery request
   * @param requestId ID of the recovery request
   */
  public async cancelRecovery(requestId: number): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const tx = await this.contract.cancelRecovery(requestId);
    await tx.wait();
  }

  /**
   * Get recovery request details
   * @param requestId ID of the recovery request
   */
  public async getRecoveryRequest(requestId: number): Promise<{
    proposedOwner: string;
    initiationTime: number;
    approvals: number;
    executed: boolean;
  }> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const [proposedOwner, initiationTime, approvals, executed] = 
      await this.contract.getRecoveryRequest(requestId);
    
    return {
      proposedOwner,
      initiationTime: initiationTime.toNumber(),
      approvals: approvals.toNumber(),
      executed
    };
  }

  /**
   * Get all recovery requests
   * @returns Array of recovery requests
   */
  public async getRecoveryRequests(): Promise<{ id: number; proposedOwner: string; initiationTime: number; approvals: number; executed: boolean; }[]> {
    if (!this.contract) throw new Error("Contract not initialized");
    
    const requestIds = await this.contract.getRecoveryIds();
    const requests = await Promise.all(requestIds.map(async (id: number) => {
      const request = await this.contract.getRecoveryRequest(id);
      return {
        id,
        proposedOwner: request.proposedOwner,
        initiationTime: Number(request.initiationTime),
        approvals: Number(request.approvals),
        executed: request.executed
      };
    }));

    return requests;
  }
}

export const socialRecoveryService = SocialRecoveryService.getInstance();
export default socialRecoveryService;
