# ML Team Data Access Summary

## 🎯 Quick Start

Your wallet analytics system is **ready to provide all the ML data you requested**! Here's how to get started:

### 1. **Immediate Data Access**
```bash
# Test the API
python test_ml_api.py

# Collect sample data
python ml_data_collector.py --addresses sample_addresses.txt --output my_dataset.csv

# Get single wallet data
python ml_data_collector.py --single 0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b
```

### 2. **All Requested Data Fields Available** ✅

Your system provides **exactly** what you asked for:

| **Your Request** | **API Field** | **Description** |
|------------------|---------------|-----------------|
| Avg min between sent tnx | `avg_min_between_sent_tx` | ✅ Available |
| Avg min between received tnx | `avg_min_between_received_tx` | ✅ Available |
| Time Diff between first and last (Mins) | `time_diff_first_last_mins` | ✅ Available |
| Sent tnx | `sent_tx_count` | ✅ Available |
| Received Tnx | `received_tx_count` | ✅ Available |
| Number of Created Contracts | `created_contracts_count` | ✅ Available |
| Max value received | `max_value_received` | ✅ Available |
| Avg val received | `avg_value_received` | ✅ Available |
| Avg val sent | `avg_value_sent` | ✅ Available |
| Total Ether sent | `total_ether_sent` | ✅ Available |
| Total ether balance | `total_ether_balance` | ✅ Available |
| ERC20 total Ether received | `erc20_total_ether_received` | ✅ Available |
| ERC20 total ether sent | `erc20_total_ether_sent` | ✅ Available |
| ERC20 total Ether sent contract | `erc20_total_ether_sent_contract` | ✅ Available |
| ERC20 uniq sent addr | `erc20_uniq_sent_addr` | ✅ Available |
| ERC20 uniq rec token name | `erc20_uniq_rec_token_name` | ✅ Available |
| ERC20 most sent token type | `erc20_most_sent_token_type` | ✅ Available |
| ERC20_most_rec_token_type | `erc20_most_rec_token_type` | ✅ Available |

**Plus additional useful fields:**
- `txn_frequency` - Transactions per hour
- `avg_txn_value` - Average transaction value
- `wallet_age_days` - Wallet age in days
- `risk_score` - Calculated risk score

## 🚀 API Endpoints for ML Data

### **Single Wallet Analysis**
```bash
GET /api/analytics/wallet/{address}
```

### **Bulk Data Collection (JSON)**
```bash
POST /api/analytics/bulk
Content-Type: application/json

{
  "addresses": ["0x...", "0x..."],
  "format": "json"
}
```

### **Bulk Data Collection (CSV)**
```bash
POST /api/analytics/bulk
Content-Type: application/json

{
  "addresses": ["0x...", "0x..."],
  "format": "csv"
}
```

### **ML Dataset Export**
```bash
POST /api/analytics/export
Content-Type: application/json

{
  "addresses": ["0x...", "0x..."],
  "filename": "training_data.csv"
}
```

## 📊 Data Format & Field Explanations

### Sample Response:
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
  "avg_min_between_sent_tx": 120.5,          // Average minutes between sent transactions
  "avg_min_between_received_tx": 240.2,      // Average minutes between received transactions
  "time_diff_first_last_mins": 43200,        // Time difference between first and last transaction (minutes)
  "sent_tx_count": 42,                       // Total number of sent transactions
  "received_tx_count": 28,                   // Total number of received transactions
  "created_contracts_count": 3,              // Number of smart contracts created by this wallet
  "max_value_received": "1500000000000000000",     // Maximum value received in single transaction (Wei)
  "avg_value_received": "250000000000000000",      // Average value received per transaction (Wei)
  "avg_value_sent": "180000000000000000",          // Average value sent per transaction (Wei)
  "total_ether_sent": "5400000000000000000",       // Total Ether sent (Wei)
  "total_ether_balance": "2800000000000000000",    // Current Ether balance (Wei)
  "erc20_total_ether_received": "1000000000000000000",     // Total ERC20 tokens received (Wei equivalent)
  "erc20_total_ether_sent": "800000000000000000",          // Total ERC20 tokens sent (Wei equivalent)
  "erc20_total_ether_sent_contract": "200000000000000000", // Total ERC20 sent to contracts (Wei equivalent)
  "erc20_uniq_sent_addr": 15,                // Number of unique addresses sent ERC20 tokens to
  "erc20_uniq_rec_token_name": 8,            // Number of unique ERC20 token types received
  "erc20_most_sent_token_type": "USDC",      // Most frequently sent ERC20 token symbol
  "erc20_most_rec_token_type": "USDT",       // Most frequently received ERC20 token symbol
  "txn_frequency": 0.58,                     // Transaction frequency (transactions per hour)
  "avg_txn_value": "220000000000000000",     // Average transaction value (Wei)
  "wallet_age_days": 365,                    // Wallet age in days since first transaction
  "risk_score": 0.25                         // Calculated risk score (0.0 = low risk, 1.0 = high risk)
}
```

### 🔍 Important Data Notes:

**Value Formats:**
- **Ether Values**: All monetary values are in Wei (1 ETH = 10^18 Wei)
- **Time Values**: All time measurements are in minutes
- **Counts**: Integer values for transaction counts and unique addresses
- **Token Types**: String symbols like "USDC", "USDT", "WETH"

**Wei to ETH Conversion:**
```python
# Convert Wei to ETH
eth_value = int(wei_value) / (10**18)

# Example: "1500000000000000000" Wei = 1.5 ETH
```

**ERC20 Token Metrics Explanation:**
- `erc20_total_ether_received`: Sum of all ERC20 token values received (converted to Wei equivalent)
- `erc20_total_ether_sent`: Sum of all ERC20 token values sent (converted to Wei equivalent)
- `erc20_total_ether_sent_contract`: ERC20 tokens sent specifically to smart contracts
- `erc20_uniq_sent_addr`: Count of unique recipient addresses for ERC20 transfers
- `erc20_uniq_rec_token_name`: Count of different ERC20 token types received
- `erc20_most_sent_token_type`: Token symbol most frequently sent (e.g., "USDC")
- `erc20_most_rec_token_type`: Token symbol most frequently received (e.g., "USDT")

## 🛠️ Tools Provided

### **1. Python Data Collector Script**
- **File**: `ml_data_collector.py`
- **Purpose**: Easy data collection for ML teams
- **Features**:
  - Single wallet analysis
  - Bulk data collection
  - Batch processing for large datasets
  - CSV export
  - Error handling

### **2. API Documentation**
- **File**: `ML_DATA_API_GUIDE.md`
- **Purpose**: Complete API reference
- **Includes**: Examples in Python, JavaScript, curl

### **3. Test Script**
- **File**: `test_ml_api.py`
- **Purpose**: Verify all endpoints work
- **Usage**: `python test_ml_api.py`

### **4. Sample Data**
- **File**: `sample_addresses.txt`
- **Purpose**: Test addresses for initial data collection

## 🔧 Setup Instructions

### **1. Install Dependencies**
```bash
pip install -r requirements.txt
```

### **2. Start the Backend Server**
```bash
cd backend
go run main.go
```

### **3. Test the API**
```bash
python test_ml_api.py
```

### **4. Collect Your First Dataset**
```bash
python ml_data_collector.py --addresses sample_addresses.txt --output my_first_dataset.csv
```

## 📈 Scaling for Production

### **Batch Processing**
- Maximum 1000 addresses per request
- Use batch processing for larger datasets
- Built-in rate limiting

### **Performance Tips**
1. Use bulk endpoints instead of single wallet calls
2. Cache frequently accessed data
3. Process in batches of 100-500 addresses
4. Use CSV format for large datasets

### **Error Handling**
- API returns detailed error messages
- Bulk requests continue processing even if some addresses fail
- Failed addresses are reported in the `errors` array

## 🎯 Next Steps

1. **Test the System**: Run `python test_ml_api.py`
2. **Collect Sample Data**: Use the provided sample addresses
3. **Scale Up**: Provide your own address lists
4. **Integrate**: Use the API in your ML pipeline
5. **Monitor**: Check for errors and performance

## 📞 Support

- **API Documentation**: `ML_DATA_API_GUIDE.md`
- **Code Examples**: Included in documentation
- **Test Script**: `test_ml_api.py`
- **Sample Data**: `sample_addresses.txt`

## ✅ Summary

**You now have:**
- ✅ All requested ML data fields
- ✅ Multiple API endpoints for different use cases
- ✅ Python tools for easy data collection
- ✅ Comprehensive documentation
- ✅ Test scripts to verify everything works
- ✅ Sample data to get started immediately

**The system is production-ready and can handle:**
- Single wallet analysis
- Bulk data collection (up to 1000 addresses per request)
- Large dataset exports
- CSV and JSON formats
- Error handling and rate limiting

Start with the test script and sample data, then scale up to your production address lists!
