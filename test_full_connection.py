#!/usr/bin/env python3
"""
Full Connection Test Script

This script tests the complete connection between:
1. Frontend (React/Vite) - Port 5173
2. Backend (Go/Gin) - Port 8080
3. Web3 Integration
4. ML Analytics API

Run this to verify everything is connected properly.
"""

import requests
import json
import time
import subprocess
import sys
from typing import Dict, Any

class ConnectionTester:
    def __init__(self):
        self.frontend_url = "http://localhost:5173"
        self.backend_url = "http://localhost:8080"
        self.api_base = f"{self.backend_url}/api"
        
    def test_backend_health(self) -> bool:
        """Test if backend server is running"""
        print("🔍 Testing Backend Server...")
        try:
            # Test a simple endpoint
            response = requests.get(f"{self.api_base}/firewall/stats", timeout=5)
            if response.status_code in [200, 404]:  # 404 is ok, means server is running
                print("✅ Backend server is running on port 8080")
                return True
            else:
                print(f"❌ Backend server responded with status {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Backend server is not running on port 8080")
            return False
        except Exception as e:
            print(f"❌ Backend test failed: {e}")
            return False
    
    def test_frontend_health(self) -> bool:
        """Test if frontend server is running"""
        print("\n🔍 Testing Frontend Server...")
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend server is running on port 5173")
                return True
            else:
                print(f"❌ Frontend server responded with status {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Frontend server is not running on port 5173")
            return False
        except Exception as e:
            print(f"❌ Frontend test failed: {e}")
            return False
    
    def test_api_proxy(self) -> bool:
        """Test if frontend can proxy API calls to backend"""
        print("\n🔍 Testing API Proxy (Frontend -> Backend)...")
        try:
            # Test API call through frontend proxy
            response = requests.get(f"{self.frontend_url}/api/firewall/stats", timeout=5)
            if response.status_code in [200, 404]:
                print("✅ Frontend API proxy is working")
                return True
            else:
                print(f"❌ API proxy failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API proxy test failed: {e}")
            return False
    
    def test_analytics_endpoints(self) -> bool:
        """Test ML analytics endpoints"""
        print("\n🔍 Testing ML Analytics Endpoints...")
        
        # Test single wallet endpoint
        test_address = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
        
        try:
            # Test direct backend call
            response = requests.get(f"{self.api_base}/analytics/wallet/{test_address}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print("✅ Single wallet analytics endpoint working")
                print(f"   Sample data: avg_min_between_received_tx = {data.get('avg_min_between_received_tx', 'N/A')}")
            else:
                print(f"❌ Analytics endpoint failed: {response.status_code}")
                return False
            
            # Test through frontend proxy
            response = requests.get(f"{self.frontend_url}/api/analytics/wallet/{test_address}", timeout=10)
            if response.status_code == 200:
                print("✅ Analytics endpoint accessible through frontend proxy")
            else:
                print(f"❌ Analytics proxy failed: {response.status_code}")
                return False
            
            # Test bulk endpoint
            bulk_data = {
                "addresses": [test_address],
                "format": "json"
            }
            response = requests.post(f"{self.api_base}/analytics/bulk", json=bulk_data, timeout=10)
            if response.status_code == 200:
                print("✅ Bulk analytics endpoint working")
            else:
                print(f"❌ Bulk analytics failed: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Analytics endpoints test failed: {e}")
            return False
    
    def test_cors_configuration(self) -> bool:
        """Test CORS configuration"""
        print("\n🔍 Testing CORS Configuration...")
        try:
            headers = {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{self.api_base}/analytics/wallet/test", headers=headers, timeout=5)
            
            cors_headers = response.headers
            if 'Access-Control-Allow-Origin' in cors_headers:
                print("✅ CORS is properly configured")
                print(f"   Allowed origins: {cors_headers.get('Access-Control-Allow-Origin')}")
                return True
            else:
                print("❌ CORS headers not found")
                return False
                
        except Exception as e:
            print(f"❌ CORS test failed: {e}")
            return False
    
    def test_web3_integration(self) -> bool:
        """Test Web3 integration (basic check)"""
        print("\n🔍 Testing Web3 Integration...")
        try:
            # This is a basic test - in reality, Web3 requires browser environment
            # We'll just check if the endpoints that would be used by Web3 are available
            
            # Test auth endpoints
            response = requests.get(f"{self.api_base}/auth/nonce", timeout=5)
            if response.status_code in [200, 400]:  # 400 is ok, means endpoint exists
                print("✅ Web3 auth endpoints are available")
                return True
            else:
                print(f"❌ Web3 auth endpoints failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Web3 integration test failed: {e}")
            return False
    
    def run_full_test(self) -> Dict[str, bool]:
        """Run all connection tests"""
        print("🚀 Starting Full Connection Test")
        print("=" * 50)
        
        results = {
            "backend_health": self.test_backend_health(),
            "frontend_health": self.test_frontend_health(),
            "api_proxy": self.test_api_proxy(),
            "analytics_endpoints": self.test_analytics_endpoints(),
            "cors_configuration": self.test_cors_configuration(),
            "web3_integration": self.test_web3_integration()
        }
        
        print("\n" + "=" * 50)
        print("📊 Test Results Summary:")
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All connections are working! Your system is fully integrated.")
            self.print_usage_instructions()
        else:
            print("❌ Some connections failed. Check the issues above.")
            self.print_troubleshooting()
        
        return results
    
    def print_usage_instructions(self):
        """Print usage instructions for the integrated system"""
        print("\n" + "=" * 50)
        print("🎯 How to Use Your Integrated System:")
        print("=" * 50)
        print("1. Frontend: http://localhost:5173")
        print("2. Backend API: http://localhost:8080/api")
        print("3. ML Analytics: Use the Python scripts or API directly")
        print("\n📱 Frontend Features:")
        print("   - Wallet connection (MetaMask)")
        print("   - Transaction analytics")
        print("   - Risk scoring")
        print("   - Real-time data from backend")
        print("\n🤖 ML Data Collection:")
        print("   - python ml_data_collector.py --addresses sample_addresses.txt")
        print("   - Direct API: GET /api/analytics/wallet/{address}")
        print("   - Bulk API: POST /api/analytics/bulk")
    
    def print_troubleshooting(self):
        """Print troubleshooting guide"""
        print("\n" + "=" * 50)
        print("🔧 Troubleshooting Guide:")
        print("=" * 50)
        print("1. Start Backend: cd backend && go run main.go")
        print("2. Start Frontend: npm run dev (or yarn dev)")
        print("3. Check ports: Backend=8080, Frontend=5173")
        print("4. Check CORS: Frontend must be on port 5173")
        print("5. Database: Ensure PostgreSQL is running")

def main():
    tester = ConnectionTester()
    results = tester.run_full_test()
    
    # Exit with appropriate code
    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
