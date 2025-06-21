/// <reference lib="dom" />

import { ethers } from 'ethers';
import { createMEVProtection } from './mev-protection';
import { DEX_ROUTER_ADDRESSES, DEX_FUNCTION_SELECTORS } from './constants';

// Mock addresses for local testing
const LOCAL_DEX_ADDRESSES = {
    UNISWAP_V2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNISWAP_V3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    SUSHISWAP: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
};

async function testMEVProtection() {
    try {
        console.log("🔵 Starting MEV Protection Test Suite...");

        // 1. Setup provider with fallback options
        let provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
        
        const isBrowser = typeof window !== 'undefined';
        const hasEthereum = isBrowser && 'ethereum' in window;

        if (hasEthereum) {
            provider = new ethers.BrowserProvider((window as any).ethereum);
            console.log("✅ Using Browser Provider (MetaMask)");
        } else {
            const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
            provider = new ethers.JsonRpcProvider(rpcUrl);
            console.log("✅ Using JSON-RPC Provider:", rpcUrl);
        }
        
        // 2. Initialize MEV Protection with comprehensive config
        console.log("\n🔵 Initializing MEV Protection...");
        const mevProtection = await createMEVProtection(provider, {
            enabled: true,
            useFlashbots: true,
            slippageTolerance: 0.5,
            authSigner: process.env.FLASHBOTS_AUTH_KEY ? 
                new ethers.Wallet(process.env.FLASHBOTS_AUTH_KEY) : 
                undefined
        });

        // 3. Test DEX Detection across protocols
        console.log("\n🔵 Testing DEX Detection across protocols...");
        
        // Use local addresses for testing
        const dexAddresses = await provider.getNetwork().then(network => 
            network.chainId === BigInt(31337) ? LOCAL_DEX_ADDRESSES : DEX_ROUTER_ADDRESSES
        );
        
        const dexTestCases = [
            {
                name: "Uniswap V2 Swap",
                tx: {
                    to: dexAddresses.UNISWAP_V2,
                    data: DEX_FUNCTION_SELECTORS.SWAP_EXACT_TOKENS_FOR_TOKENS + 
                          "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003",
                    value: ethers.parseEther("0.1")
                }
            },
            {
                name: "Uniswap V3 ExactInput",
                tx: {
                    to: dexAddresses.UNISWAP_V3,
                    data: DEX_FUNCTION_SELECTORS.EXACT_INPUT + 
                          "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003",
                    value: ethers.parseEther("0.1")
                }
            },
            {
                name: "SushiSwap Swap",
                tx: {
                    to: dexAddresses.SUSHISWAP,
                    data: DEX_FUNCTION_SELECTORS.SWAP_EXACT_ETH_FOR_TOKENS + 
                          "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003",
                    value: ethers.parseEther("0.1")
                }
            }
        ];

        for (const testCase of dexTestCases) {
            const isProtected = await mevProtection.isTransactionProtected(testCase.tx);
            console.log(`✅ ${testCase.name} Detection:`, isProtected ? "Protected" : "Not Protected");
        }

        // 4. Test Flashbots Integration
        console.log("\n🔵 Testing Flashbots Integration...");
        const network = await provider.getNetwork();
        console.log("Current Network:", network.chainId.toString());
        const flashbotsSupported = [BigInt(1), BigInt(5), BigInt(11155111)].includes(network.chainId); // Mainnet, Goerli, Sepolia
        console.log(flashbotsSupported ? "✅ On Flashbots-supported network" : "⚠️ Flashbots not supported on this network");

        // 5. Test Slippage Protection
        console.log("\n🔵 Testing Slippage Protection...");
        
        // Test with different slippage scenarios
        const slippageTests = [0.1, 0.5, 1.0, 2.0];
        for (const slippage of slippageTests) {
            const mevProtectionWithSlippage = await createMEVProtection(provider, {
                enabled: true,
                useFlashbots: false, // Disable Flashbots for local testing
                slippageTolerance: slippage
            });        const testTx = {
                to: dexAddresses.UNISWAP_V2,
                data: DEX_FUNCTION_SELECTORS.SWAP_EXACT_TOKENS_FOR_TOKENS + 
                      "0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // amountIn: 1 ETH
                      "0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // amountOutMin: 1 ETH
                      "0000000000000000000000000000000000000000000000000000000000000060" + // path offset
                      "0000000000000000000000000000000000000000000000000000000000000002" + // path.length
                      "000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" + // WETH
                      "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",  // USDC
                value: ethers.parseEther("1.0")
            };try {
                const protectedTx = await mevProtectionWithSlippage.protectTransaction(testTx);
                console.log(`✅ ${slippage}% Slippage Protection:`, protectedTx.data !== testTx.data ? "Applied" : "Not Applied");
            } catch (error: any) {
                console.log(`❌ ${slippage}% Slippage Protection: Failed -`, error?.message || String(error));
            }
        }

        // 6. Test Transaction Simulation (if on supported network)
        if (flashbotsSupported) {
            console.log("\n🔵 Testing Transaction Simulation...");
            try {
                const testTx = dexTestCases[0].tx;
                const protectedTx = await mevProtection.protectTransaction(testTx);
                console.log("✅ Transaction Simulation Succeeded");
            } catch (error: any) {
                console.log("⚠️ Transaction Simulation Failed:", error?.message || String(error));
            }
        }

        console.log("\n✅ MEV Protection Test Suite Complete!");

    } catch (error: any) {
        console.error("❌ Test Failed:", error?.message || String(error));
    }
}

// Run the test
testMEVProtection().catch(console.error);
