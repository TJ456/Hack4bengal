# ML Field Verification - Complete Mapping

## ✅ 100% Field Coverage Confirmed

**All 17 requested fields are available in the API:**

### 📊 Exact Field Mapping Table

| # | **Your Request** | **API Field** | **Sample Value** | **Data Type** | **Unit** |
|---|------------------|---------------|------------------|---------------|----------|
| 1 | Avg min between sent tnx | `avg_min_between_sent_tx` | `120.5` | float | minutes |
| 2 | Avg min between received tnx | `avg_min_between_received_tx` | `240.2` | float | minutes |
| 3 | Time Diff between first and last (Mins) | `time_diff_first_last_mins` | `43200` | float | minutes |
| 4 | Sent tnx | `sent_tx_count` | `42` | int | count |
| 5 | Received Tnx | `received_tx_count` | `28` | int | count |
| 6 | Number of Created Contracts | `created_contracts_count` | `3` | int | count |
| 7 | max value received | `max_value_received` | `"1500000000000000000"` | string | Wei |
| 8 | avg val received | `avg_value_received` | `"250000000000000000"` | string | Wei |
| 9 | avg val sent | `avg_value_sent` | `"180000000000000000"` | string | Wei |
| 10 | total Ether sent | `total_ether_sent` | `"5400000000000000000"` | string | Wei |
| 11 | total ether balance | `total_ether_balance` | `"2800000000000000000"` | string | Wei |
| 12 | ERC20 total Ether received | `erc20_total_ether_received` | `"1000000000000000000"` | string | Wei |
| 13 | ERC20 total ether sent | `erc20_total_ether_sent` | `"800000000000000000"` | string | Wei |
| 14 | ERC20 total Ether sent contract | `erc20_total_ether_sent_contract` | `"200000000000000000"` | string | Wei |
| 15 | ERC20 uniq sent addr | `erc20_uniq_sent_addr` | `15` | int | count |
| 16 | ERC20 uniq rec token name | `erc20_uniq_rec_token_name` | `8` | int | count |
| 17 | ERC20 most sent token type | `erc20_most_sent_token_type` | `"USDC"` | string | symbol |
| 18 | ERC20_most_rec_token_type | `erc20_most_rec_token_type` | `"USDT"` | string | symbol |

### 🎁 Bonus Fields (Additional ML Features)

| **Bonus Field** | **API Field** | **Sample Value** | **Description** |
|-----------------|---------------|------------------|-----------------|
| Transaction Frequency | `txn_frequency` | `0.58` | Transactions per hour |
| Average Transaction Value | `avg_txn_value` | `"220000000000000000"` | Average value per transaction |
| Wallet Age | `wallet_age_days` | `365` | Days since first transaction |
| Risk Score | `risk_score` | `0.25` | ML-ready risk score (0-1) |

## 📋 Sample CSV Output

**File: `sample_ml_data.csv`** (included in your project)

```csv
address,avg_min_between_sent_tx,avg_min_between_received_tx,time_diff_first_last_mins,sent_tx_count,received_tx_count,created_contracts_count,max_value_received,avg_value_received,avg_value_sent,total_ether_sent,total_ether_balance,erc20_total_ether_received,erc20_total_ether_sent,erc20_total_ether_sent_contract,erc20_uniq_sent_addr,erc20_uniq_rec_token_name,erc20_most_sent_token_type,erc20_most_rec_token_type,txn_frequency,avg_txn_value,wallet_age_days,risk_score
0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b,120.5,240.2,43200,42,28,3,1500000000000000000,250000000000000000,180000000000000000,5400000000000000000,2800000000000000000,1000000000000000000,800000000000000000,200000000000000000,15,8,USDC,USDT,0.58,220000000000000000,365,0.25
```

## 🔧 Data Processing Notes for ML

### **Wei to ETH Conversion**
```python
# All monetary values are in Wei (1 ETH = 10^18 Wei)
def wei_to_eth(wei_value):
    return int(wei_value) / (10**18)

# Example conversions:
# "1500000000000000000" Wei = 1.5 ETH
# "250000000000000000" Wei = 0.25 ETH
```

### **Time Values**
- All time measurements are in **minutes**
- `time_diff_first_last_mins`: Total wallet activity period
- `avg_min_between_*`: Average time between transactions

### **Count Values**
- All counts are integers
- `*_count` fields: Direct transaction counts
- `erc20_uniq_*` fields: Unique entity counts

### **Token Types**
- String values representing token symbols
- Examples: "USDC", "USDT", "WETH", "DAI"
- "UNKNOWN" if no token activity

## 🚀 Quick Start Commands

```bash
# 1. Test the API
python test_ml_api.py

# 2. Get sample data
python ml_data_collector.py --addresses sample_addresses.txt --output my_dataset.csv

# 3. Single wallet analysis
curl "http://localhost:8080/api/analytics/wallet/0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"

# 4. Bulk data collection
curl -X POST "http://localhost:8080/api/analytics/bulk" \
  -H "Content-Type: application/json" \
  -d '{"addresses":["0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"],"format":"csv"}'
```

## ✅ Verification Checklist

- [x] All 17 requested fields mapped and available
- [x] Correct data types for each field
- [x] Sample data provided
- [x] API endpoints working
- [x] CSV export functionality
- [x] Bulk processing capability
- [x] Python tools provided
- [x] Complete documentation
- [x] Test scripts included

## 📞 Ready to Use

**Your ML team now has:**
1. ✅ **All requested data fields** - 100% coverage
2. ✅ **Multiple access methods** - API, Python scripts, CSV export
3. ✅ **Sample data** - Ready for immediate testing
4. ✅ **Complete documentation** - No guesswork needed
5. ✅ **Production-ready** - Handles single wallets to large datasets

**Start with:** `python test_ml_api.py` to verify everything works!
