#!/usr/bin/env python3
"""
Comprehensive test script to verify the connection to the external ML API
and validate its response format and behavior
"""

import json
import requests
import time
import sys
from typing import Dict, Any, Optional

# Configuration
ML_API_URL = "https://ml-fraud-transaction-detection.onrender.com/predict"
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 5  # seconds
MAX_RETRY_DELAY = 20  # seconds
TIMEOUT = 30  # seconds

def create_test_transaction(value: float = 5.0, gas_price: float = 20.0) -> Dict[str, Any]:
    """Create a test transaction with the specified parameters"""
    return {
        "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
        "transaction_value": value,
        "gas_price": gas_price,
        "is_contract_interaction": False,
        "acc_holder": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "features": [0.0] * 12 + [value, gas_price] + [0.0] * 4  # 18 features with value and gas_price at positions 13 and 14
    }

def validate_response(response_data: Dict[str, Any]) -> bool:
    """Validate that the response contains the expected fields"""
    required_fields = ['prediction', 'Type']  # Updated to match actual API response format
    return all(field in response_data for field in required_fields)

def call_ml_api(transaction: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Call the ML API with exponential backoff retry logic
    Returns the response data if successful, None if all retries failed
    """
    retry_delay = INITIAL_RETRY_DELAY
    attempt = 0

    while attempt < MAX_RETRIES:
        try:
            print(f"\n📡 Attempt {attempt + 1}/{MAX_RETRIES}: Sending request to ML API...")
            if attempt > 0:
                print("⏳ This might take some time as the free tier of Render can be slow to spin up...")
            
            response = requests.post(
                ML_API_URL,
                json=transaction,
                headers={"Content-Type": "application/json"},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                if validate_response(data):
                    return data
                else:
                    print("❌ API response format is invalid!")
                    print(f"Expected fields missing from: {json.dumps(data, indent=2)}")
                    return None

            print(f"❌ API returned error {response.status_code}: {response.text}")
            
        except requests.exceptions.Timeout:
            print(f"⏳ Request timed out after {TIMEOUT} seconds")
        except requests.exceptions.ConnectionError:
            print("❌ Connection error - ensure you have internet connectivity")
        except json.JSONDecodeError:
            print("❌ API returned invalid JSON")
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")

        attempt += 1
        if attempt < MAX_RETRIES:
            print(f"🔄 Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)  # Exponential backoff
        else:
            print("\n❌ All retry attempts failed")
            return None

def test_ml_api() -> bool:
    """
    Test the external ML API with various scenarios
    Returns True if all tests pass, False otherwise
    """
    print("\n🔍 Testing External ML API Connection and Functionality\n")
    
    # Test 1: Basic transaction
    print("\n📝 Test 1: Basic transaction with normal values")
    transaction = create_test_transaction(5.0, 20.0)
    result = call_ml_api(transaction)
    if not result:
        return False
    
    print("\n✅ Success! API Response:")
    print(json.dumps(result, indent=2))
    
    # Test 2: High value transaction
    print("\n📝 Test 2: High value transaction")
    transaction = create_test_transaction(1000.0, 50.0)
    result = call_ml_api(transaction)
    if not result:
        return False
    
    print("\n✅ Success! API Response:")
    print(json.dumps(result, indent=2))
    
    print("\n🎉 All tests completed successfully!")
    return True

if __name__ == "__main__":
    success = test_ml_api()
    sys.exit(0 if success else 1)
