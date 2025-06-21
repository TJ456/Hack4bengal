#!/usr/bin/env python3
"""
Test script for the external ML API

This script tests the external ML API to ensure it works correctly.
"""

import requests
import json
import time

# External ML API URL
EXTERNAL_ML_API_URL = "https://ml-fraud-transaction-detection.onrender.com/predict"

def test_ml_api():
    """Test the external ML API with a sample transaction"""
    print("\nTesting External ML API...")
    # Sample transaction data with the correct format
    transaction_data = {
        "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
        "transaction_value": 5.0,
        "gas_price": 20,
        "is_contract_interaction": False,
        "acc_holder": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "features": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
                   0.0, 0.0, 0.0, 0.0, 5.0, 20.0, 0.0, 0.0, 0.0]  # 18 features with transaction value at position 13 and gas price at 14
    }
    
    try:
        print(f"Sending request to {EXTERNAL_ML_API_URL}...")
        response = requests.post(
            EXTERNAL_ML_API_URL,
            headers={"Content-Type": "application/json"},
            json=transaction_data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ External ML API is working!")
            print("\nResponse:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ External ML API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing external ML API: {e}")
        return False

if __name__ == "__main__":
    test_ml_api()
