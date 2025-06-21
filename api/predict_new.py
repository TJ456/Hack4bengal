import json
from http.server import BaseHTTPRequestHandler
import requests

# External ML API endpoint - hardcoded since we will only use this one
EXTERNAL_ML_API = "https://ml-fraud-transaction-detection.onrender.com/predict"

class TransactionPredictor:
    def __init__(self):
        self.api_url = EXTERNAL_ML_API
    
    def predict(self, features):
        """
        Predict risk score for a transaction using external ML API
        Simply forwards the features to the external API and returns the prediction
        """
        try:
            # Forward the features to the external API
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=features,
                timeout=10  # Add timeout to avoid hanging
            )
            
            # If successful, return the API response directly
            if response.status_code == 200:
                return response.json()
            else:
                # Return error information
                return {
                    "error": f"API Error: {response.status_code}",
                    "risk_score": 0.5,
                    "risk_level": "MEDIUM",
                    "factors": ["External ML API unavailable"]
                }
        except Exception as e:
            # Handle any exception
            return {
                "error": f"Connection Error: {str(e)}",
                "risk_score": 0.5,
                "risk_level": "MEDIUM",
                "factors": ["Failed to connect to external ML API"]
            }

# Initialize the predictor
predictor = TransactionPredictor()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse transaction data
            tx_data = json.loads(post_data)
            
            # Get prediction from external ML API
            prediction = predictor.predict(tx_data)
            
            # Return prediction
            self.wfile.write(json.dumps(prediction).encode())
        except Exception as e:
            error_response = {
                "error": "Prediction error",
                "details": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
