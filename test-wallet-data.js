// Test script to show what real wallet data looks like
// This demonstrates the data that will be sent to your ML API

const exampleRealWalletData = {
  // Basic transaction info (user inputs)
  from_address: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87", // Real connected wallet
  to_address: "0x8ba1f109551bD432803012645Hac136c22C177ec",   // User entered recipient
  transaction_value: 0.5,                                      // User entered amount
  gas_price: 25,                                              // User selected gas price
  is_contract_interaction: true,                              // Detected from blockchain
  acc_holder: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",  // Same as from_address
  
  // Rich feature array with REAL wallet data
  features: [
    0.5,        // [0] transaction_value (ETH)
    25,         // [1] gas_price (Gwei)
    12.45,      // [2] account_balance (ETH) - REAL balance from blockchain
    156,        // [3] total_transactions - REAL transaction count from blockchain
    1,          // [4] is_contract (1=yes, 0=no) - REAL contract detection
    0.04,       // [5] value_to_balance_ratio (0.5/12.45) - CALCULATED risk metric
    20.5,       // [6] current_network_gas_price - REAL network gas price
    1.22,       // [7] gas_price_ratio (25/20.5) - CALCULATED overpay indicator
    42,         // [8] recipient_address_length - REAL address length
    42,         // [9] sender_address_length - REAL address length  
    14.5,       // [10] hour_of_day (0-24) - REAL timestamp
    3,          // [11] day_of_week (0-6) - REAL day
    0,          // [12] is_large_transaction (>1 ETH = 1)
    1,          // [13] is_high_balance_account (>10 ETH = 1)
    1,          // [14] is_experienced_user (>100 txs = 1)
    0.05,       // [15] random_feature (placeholder)
    0,          // [16] reserved
    0           // [17] reserved
  ]
};

// Example of what gets sent vs placeholder data
console.log("=== BEFORE (Placeholder Data) ===");
console.log({
  from_address: "0x123",
  to_address: "0x456", 
  transaction_value: 0.01,
  gas_price: 20,
  is_contract_interaction: false,
  features: [0.01, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
});

console.log("\n=== AFTER (Real Wallet Data) ===");
console.log(exampleRealWalletData);

console.log("\n=== Key Improvements ===");
console.log("✅ Real wallet balance:", exampleRealWalletData.features[2], "ETH");
console.log("✅ Real transaction history:", exampleRealWalletData.features[3], "transactions");
console.log("✅ Real contract detection:", exampleRealWalletData.features[4] ? "Contract" : "EOA");
console.log("✅ Real risk ratios calculated from actual data");
console.log("✅ Real network conditions included");
