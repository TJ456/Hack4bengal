import { 
  ethers, 
  AbiCoder,
  Interface,
  TransactionRequest,
  TransactionResponse,
  BrowserProvider,
  Wallet,
  JsonRpcProvider,
  Signer
} from 'ethers';
import { 
  FlashbotsBundleProvider, 
  FlashbotsBundleResolution,
  SimulationResponse,
  FlashbotsTransaction
} from '@flashbots/ethers-provider-bundle';
import { DEX_ROUTER_ADDRESSES, DEX_FUNCTION_SELECTORS, DEX_INTERFACES } from './constants';

export interface IMEVProtection {
  protectTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
  isTransactionProtected(tx: TransactionRequest): Promise<boolean>;
  initialize(signer: Signer): Promise<void>;
}

export interface MEVProtectionConfig {
  enabled: boolean;
  useFlashbots: boolean;
  slippageTolerance: number; // percentage between 0-100
  authSigner?: Wallet; // Optional Flashbots auth signer
}

export class MEVProtection implements IMEVProtection {
  private config: MEVProtectionConfig;  private provider: BrowserProvider | JsonRpcProvider;
  private flashbotsProvider: FlashbotsBundleProvider | null = null;
  private abiCoder: AbiCoder;
  private signer: Signer | null = null;

  constructor(provider: BrowserProvider | JsonRpcProvider, config: MEVProtectionConfig) {
    // Validate slippage tolerance
    if (config.slippageTolerance < 0 || config.slippageTolerance > 100) {
      throw new Error("Slippage tolerance must be between 0% and 100%");
    }

    this.provider = provider;
    this.config = config;
    this.abiCoder = AbiCoder.defaultAbiCoder();
  }

  public async initialize(signer: Signer): Promise<void> {
    this.signer = signer;
    
    if (this.config.useFlashbots) {
      try {
        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);
        
        // Initialize Flashbots for supported networks
        if (chainId === 1 || chainId === 5) { // Mainnet or Goerli
          const authSigner = this.config.authSigner || Wallet.createRandom();
          this.flashbotsProvider = await FlashbotsBundleProvider.create(
            this.provider as JsonRpcProvider,  // Type assertion for Flashbots compatibility
            authSigner,
            chainId === 1 
              ? 'https://relay.flashbots.net'
              : 'https://relay-goerli.flashbots.net'
          );
        }
      } catch (error) {
        console.warn("Failed to initialize Flashbots provider:", error);
        this.flashbotsProvider = null;
      }
    }
  }
  public async protectTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error("MEV Protection not initialized. Call initialize() first.");
    }

    if (!this.config.enabled) {
      return this.signer.sendTransaction(transaction);
    }

    // Add slippage protection for DEX trades
    const protectedTx = await this.addSlippageProtection(transaction);

    // Try Flashbots if enabled and available
    if (this.config.useFlashbots && this.flashbotsProvider) {
      try {
        const response = await this.sendViaFlashbots(protectedTx);
        return response;
      } catch (error) {
        console.warn("Flashbots submission failed, falling back to regular transaction:", error);
      }
    }

    // Fallback to regular transaction
    return this.signer.sendTransaction(protectedTx);
  }

  private isDEXTrade(address: string): boolean {
    const dexAddresses = Object.values(DEX_ROUTER_ADDRESSES) as string[];
    return dexAddresses.map(a => a.toLowerCase())
                      .includes(address.toLowerCase());
  }

  private isDEXSwapFunction(selector: string): boolean {
    const functionSelectors = Object.values(DEX_FUNCTION_SELECTORS) as string[];
    return functionSelectors.includes(selector.toLowerCase());
  }

  private async sendViaFlashbots(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    if (!this.flashbotsProvider || !this.signer) {
      throw new Error("Flashbots provider not initialized");
    }

    // Wait for the next block to be mined
    const block = await this.provider.getBlock('latest');
    if (!block) throw new Error("Failed to get latest block");
    
    const targetBlockNumber = block.number + 1;

    // Prepare the signed transaction
    const tx = {
      ...transaction,
      chainId: Number((await this.provider.getNetwork()).chainId)
    };

    // Convert to legacy transaction if needed
    if (!tx.gasPrice && tx.maxFeePerGas) {
      tx.gasPrice = tx.maxFeePerGas;
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
    }

    return new Promise<TransactionResponse>(async (resolve, reject) => {
      try {
        const bundle = [{
          transaction: tx,
          signer: this.signer
        }];

        if (!this.flashbotsProvider) {
          throw new Error("Flashbots provider was unexpectedly null");
        }

        // Simulate first
        const simulation = await this.flashbotsProvider.simulate(
          bundle as any[],
          targetBlockNumber
        );
        
        if ("error" in simulation) {
          throw new Error(`Simulation failed: ${simulation.error.message}`);
        }

        // Submit the bundle
        const bundleResponse = await this.flashbotsProvider.sendBundle(
          bundle as any[],
          targetBlockNumber
        );

        if ("error" in bundleResponse) {
          throw new Error(`Bundle submission failed: ${bundleResponse.error.message}`);
        }

        // Wait for bundle inclusion
        const response = await bundleResponse.wait();
        
        switch (response) {
          case FlashbotsBundleResolution.BundleIncluded:            const txReceipt = await bundleResponse.receipts();
            if (txReceipt && txReceipt[0] && txReceipt[0].hash) {
              const includedTx = await this.provider.getTransaction(txReceipt[0].hash);
              if (includedTx) {
                resolve(includedTx);
                return;
              }
            }
            reject(new Error("Transaction not found after bundle inclusion"));
            break;

          case FlashbotsBundleResolution.BlockPassedWithoutInclusion:
          case FlashbotsBundleResolution.AccountNonceTooHigh:
            reject(new Error(`Bundle not included: ${response}`));
            break;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private async addSlippageProtection(tx: TransactionRequest): Promise<TransactionRequest> {
    if (!tx.data || !tx.to) return tx;

    // Add slippage check for DEX trades
    const slippageLimit = (100 - this.config.slippageTolerance) / 100;
    
    // Clone transaction
    const protectedTx = { ...tx };

    // If this is a DEX trade, add slippage protection
    if (tx.to && this.isDEXTrade(tx.to.toString())) {
      // Extract function selector (first 4 bytes of data)
      const selector = tx.data.slice(0, 10);
      
      // Only process known DEX swap functions
      if (this.isDEXSwapFunction(selector)) {
        // Add deadline to prevent pending transactions from being executed after prices move
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
        
        try {
          // Decode function data and add slippage protection
          const amountOutMin = this.calculateMinimumOutput(tx.data, slippageLimit);
          protectedTx.data = this.encodeWithSlippage(tx.data, amountOutMin, deadline);
        } catch (error) {
          console.warn("Failed to add slippage protection:", error);
          return tx; // Return original tx if we can't add protection
        }
      }
    }

    return protectedTx;
  }

  private calculateMinimumOutput(txData: string, slippageLimit: number): bigint {
    try {
      const swapInterface = new Interface(DEX_INTERFACES.UNISWAP_V2);
      const decoded = swapInterface.parseTransaction({ data: txData });
      if (!decoded) return BigInt(0);

      // Get the relevant amount based on swap type
      const amount = decoded.name.startsWith('swapExact') 
        ? decoded.args[1] // amountOutMin
        : decoded.args[0]; // amountOut

      return BigInt(Math.floor(Number(amount) * slippageLimit));
    } catch (error) {
      console.warn("Failed to decode swap data:", error);
      return BigInt(0);
    }
  }

  private encodeWithSlippage(txData: string, minOutput: bigint, deadline: number): string {
    try {
      const swapInterface = new Interface(DEX_INTERFACES.UNISWAP_V2);
      const decoded = swapInterface.parseTransaction({ data: txData });
      if (!decoded) return txData;

      // Encode with updated parameters based on swap type
      if (decoded.name.startsWith('swapExact')) {
        const args = [...decoded.args];
        args[1] = minOutput; // Update amountOutMin
        args[args.length - 1] = deadline; // Update deadline
        return swapInterface.encodeFunctionData(decoded.name, args);
      } else {
        const args = [...decoded.args];
        args[0] = minOutput; // Update amountOut
        args[args.length - 1] = deadline; // Update deadline
        return swapInterface.encodeFunctionData(decoded.name, args);
      }

      return txData;
    } catch (error) {
      console.warn("Failed to encode with slippage:", error);
      return txData;
    }
  }

  async isTransactionProtected(transaction: ethers.TransactionRequest): Promise<boolean> {
    // Check if transaction is using Flashbots
    const isFlashbots = this.flashbotsProvider != null && 
                       transaction.maxFeePerGas !== undefined &&
                       transaction.maxPriorityFeePerGas !== undefined;
    
    // Check if transaction has slippage protection
    const hasSlippage = transaction.to && 
                       this.isDEXTrade(transaction.to.toString()) &&
                       transaction.data != null &&
                       this.hasSlippageProtection(transaction.data);
    
    return Boolean(isFlashbots || hasSlippage);
  }

  private hasSlippageProtection(txData: string): boolean {
    // Check if the transaction data includes slippage parameters
    // This is a simplified check - you'll need to implement DEX-specific checks
    try {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256', 'uint256', 'address[]', 'address', 'uint256'],
        ethers.dataSlice(txData, 4)
      );
      return decoded[1] > 0 && decoded[4] > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }
}

/**
 * Creates and initializes a new MEV protection instance
 */
export async function createMEVProtection(
  provider: BrowserProvider | JsonRpcProvider,
  config: MEVProtectionConfig
): Promise<MEVProtection> {
  const protection = new MEVProtection(provider, config);
  
  // Get signer from provider
  const signer = await provider.getSigner();
  if (!signer) {
    throw new Error("No signer available from provider");
  }
  
  // Initialize with signer
  await protection.initialize(signer);
  
  return protection;
}
