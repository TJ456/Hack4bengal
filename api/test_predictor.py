#!/usr/bin/env python3
"""
Test script for the updated predict.py integration with the external ML API

This script tests the local TransactionPredictor class with the external ML API.
"""

import os
import sys
import json
import requests
from predict import TransactionPredictor

def test_transaction_predictor():
    """Test the TransactionPredictor class with various inputs"""
    print("\nTesting TransactionPredictor integration with external ML API...")
    
    # Initialize the predictor
    predictor = TransactionPredictor()
    
    # Test cases
    test_cases = [
        {
            "name": "High-value transaction",
            "input": {
                "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
                "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
                "transaction_value": 10.0,
                "gas_price": 20,
                "is_contract_interaction": False,
                "recipient_age_days": 45,
                "sender_transaction_count": 20
            }
        },
        {
            "name": "Contract interaction",
            "input": {
                "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
                "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
                "transaction_value": 0.5,
                "gas_price": 30,
                "is_contract_interaction": True,
                "recipient_age_days": 100,
                "sender_transaction_count": 15
            }
        },
        {
            "name": "New recipient",
            "input": {
                "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
                "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
                "transaction_value": 0.25,
                "gas_price": 15,
                "is_contract_interaction": False,
                "recipient_age_days": 5,
                "sender_transaction_count": 50
            }
        }
    ]
    
    # Run tests
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        try:
            # Get prediction
            result = predictor.predict(test_case["input"])
            
            # Print result
            print("Result:")
            print(json.dumps(result, indent=2))
            
            # Check if result has expected fields
            if "risk_score" in result and "risk_level" in result and "factors" in result:
                print(f"✅ Test passed: {test_case['name']}")
            else:
                print(f"❌ Test failed: {test_case['name']} - Missing expected fields")
                
        except Exception as e:
            print(f"❌ Test failed: {test_case['name']} - {str(e)}")
    
    print("\nTesting complete!")

if __name__ == "__main__":
    # Change to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    test_transaction_predictor()
