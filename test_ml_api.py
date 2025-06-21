#!/usr/bin/env python3
"""
Test script for ML Analytics API endpoints

This script tests all the ML data collection endpoints to ensure they work correctly.
"""

import requests
import json
import time

API_BASE = "http://localhost:8080/api"

def test_single_wallet():
    """Test single wallet analytics endpoint"""
    print("Testing single wallet analytics...")
    
    # Use a sample address
    address = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
    
    try:
        response = requests.get(f"{API_BASE}/analytics/wallet/{address}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Single wallet endpoint working")
            print(f"Sample data keys: {list(data.keys())}")
            return True
        else:
            print(f"❌ Single wallet endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing single wallet: {e}")
        return False

def test_bulk_analytics_json():
    """Test bulk analytics with JSON format"""
    print("\nTesting bulk analytics (JSON format)...")
    
    addresses = [
        "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "0x8ba1f109551bD432803012645Hac136c22C501"
    ]
    
    payload = {
        "addresses": addresses,
        "format": "json"
    }
    
    try:
        response = requests.post(f"{API_BASE}/analytics/bulk", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Bulk analytics (JSON) endpoint working")
            print(f"Retrieved data for {data.get('count', 0)} wallets")
            if data.get('errors'):
                print(f"Errors: {len(data['errors'])}")
            return True
        else:
            print(f"❌ Bulk analytics (JSON) endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing bulk analytics (JSON): {e}")
        return False

def test_bulk_analytics_csv():
    """Test bulk analytics with CSV format"""
    print("\nTesting bulk analytics (CSV format)...")
    
    addresses = [
        "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "0x8ba1f109551bD432803012645Hac136c22C501"
    ]
    
    payload = {
        "addresses": addresses,
        "format": "csv"
    }
    
    try:
        response = requests.post(f"{API_BASE}/analytics/bulk", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            csv_data = response.text
            lines = csv_data.strip().split('\n')
            print("✅ Bulk analytics (CSV) endpoint working")
            print(f"CSV has {len(lines)} lines (including header)")
            if len(lines) > 0:
                print(f"Header: {lines[0][:100]}...")
            return True
        else:
            print(f"❌ Bulk analytics (CSV) endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing bulk analytics (CSV): {e}")
        return False

def test_export_dataset():
    """Test ML dataset export endpoint"""
    print("\nTesting ML dataset export...")
    
    addresses = [
        "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "0x8ba1f109551bD432803012645Hac136c22C501"
    ]
    
    payload = {
        "addresses": addresses,
        "filename": "test_export.csv"
    }
    
    try:
        response = requests.post(f"{API_BASE}/analytics/export", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            csv_data = response.text
            lines = csv_data.strip().split('\n')
            print("✅ ML dataset export endpoint working")
            print(f"CSV has {len(lines)} lines (including header)")
            
            # Check if Content-Disposition header is set
            content_disposition = response.headers.get('Content-Disposition', '')
            if 'attachment' in content_disposition:
                print("✅ Proper download headers set")
            else:
                print("⚠️  Download headers not set properly")
            
            return True
        else:
            print(f"❌ ML dataset export endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing ML dataset export: {e}")
        return False

def test_risk_score():
    """Test risk score endpoint"""
    print("\nTesting risk score endpoint...")
    
    address = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
    
    try:
        response = requests.get(f"{API_BASE}/analytics/risk/{address}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Risk score endpoint working")
            print(f"Risk score: {data.get('risk_score')}")
            print(f"Risk level: {data.get('risk_level')}")
            return True
        else:
            print(f"❌ Risk score endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing risk score: {e}")
        return False

def main():
    print("🧪 Testing ML Analytics API Endpoints")
    print("=" * 50)
    
    # Test all endpoints
    tests = [
        test_single_wallet,
        test_bulk_analytics_json,
        test_bulk_analytics_csv,
        test_export_dataset,
        test_risk_score
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(0.5)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The ML API is ready to use.")
        print("\nNext steps:")
        print("1. Use the Python script: python ml_data_collector.py --addresses sample_addresses.txt")
        print("2. Or use the API directly with curl/requests")
        print("3. Check ML_DATA_API_GUIDE.md for detailed documentation")
    else:
        print("❌ Some tests failed. Check the backend server and try again.")

if __name__ == "__main__":
    main()
