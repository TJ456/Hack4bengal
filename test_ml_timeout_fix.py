import requests
import time
import json

# Test script to verify the ML risk assessment timeout fix

def test_predict_api():
    print("Testing ML risk assessment timeout fix...")
    
    # Test data with various scenarios
    test_data = [
        {
            "name": "Normal transaction",
            "data": {
                "from_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
                "to_address": "0x8C89a6bf53346A146192C0bE2f32b8C5f4F269C0",
                "transaction_value": 1.0,
                "gas_price": 20.0,
                "is_contract_interaction": False,
                "features": [20.0, 1.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            "expected_status": 200
        },
        {
            "name": "Contract interaction",
            "data": {
                "from_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "to_address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",  # UNI token contract
                "transaction_value": 0.1,
                "gas_price": 25.0,
                "is_contract_interaction": True,
                "features": [25.0, 0.1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            "expected_status": 200
        }
    ]
    
    # URLs to test
    urls = [
        "http://localhost:3000/api/predict",  # Local API using predict_v2.py
        "https://ml-fraud-transaction-detection.onrender.com/predict"  # Direct ML service
    ]
    
    # Test each URL with each test case
    results = []
    for url in urls:
        print(f"\nTesting URL: {url}")
        for test_case in test_data:
            print(f"  Testing {test_case['name']}...")
            start_time = time.time()
            
            try:
                response = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=test_case["data"],
                    timeout=20
                )
                duration = time.time() - start_time
                
                result = {
                    "url": url,
                    "test_case": test_case["name"],
                    "status": response.status_code,
                    "duration": duration,
                    "success": response.status_code == test_case["expected_status"],
                }
                
                if response.status_code == 200:
                    try:
                        result["data"] = response.json()
                        print(f"    Success! Got risk score: {result['data'].get('risk_score', 'unknown')}")
                        print(f"    Response time: {duration:.2f}s")
                    except:
                        result["data"] = "Error parsing JSON response"
                        print(f"    Error parsing response: {response.text[:100]}...")
                else:
                    print(f"    Error! Status code: {response.status_code}")
                    result["error"] = response.text[:200]
                
            except requests.exceptions.Timeout:
                duration = time.time() - start_time
                result = {
                    "url": url,
                    "test_case": test_case["name"],
                    "status": "Timeout",
                    "duration": duration,
                    "success": False,
                }
                print(f"    Timeout after {duration:.2f}s")
            
            except Exception as e:
                duration = time.time() - start_time
                result = {
                    "url": url,
                    "test_case": test_case["name"],
                    "status": "Error",
                    "error": str(e),
                    "duration": duration,
                    "success": False,
                }
                print(f"    Error: {str(e)}")
            
            results.append(result)
    
    # Print summary
    print("\n=== TEST SUMMARY ===")
    successes = sum(1 for r in results if r.get("success", False))
    print(f"Success rate: {successes}/{len(results)}")
    
    avg_duration = sum(r.get("duration", 0) for r in results) / len(results)
    print(f"Average response time: {avg_duration:.2f}s")
    
    # Export results to file
    with open("ml_timeout_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print("Results saved to ml_timeout_test_results.json")
    
    return results

if __name__ == "__main__":
    test_predict_api()
