import json
import os
from http.server import BaseHTTPRequestHandler
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from urllib.parse import parse_qs

# Environment variables would be set in Vercel
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres12345@localhost:5432/wallet")
# Always use the external ML API
ML_MODEL_URL = "https://ml-fraud-transaction-detection.onrender.com/predict"

def connect_to_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def get_wallet_info(wallet_address):
    """Get wallet information from database"""
    conn = connect_to_db()
    if not conn:
        return {"error": "Database connection failed"}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Query for transaction history
            cur.execute("""
                SELECT * FROM transactions 
                WHERE from_address = %s OR to_address = %s
                ORDER BY created_at DESC LIMIT 10
            """, (wallet_address, wallet_address))
            transactions = cur.fetchall()
            
            # Query for risk score if available
            cur.execute("""
                SELECT * FROM wallet_analytics
                WHERE address = %s
                LIMIT 1
            """, (wallet_address,))
            analytics = cur.fetchone()
            
            return {
                "address": wallet_address,
                "transactions": transactions if transactions else [],
                "analytics": analytics
            }
    except Exception as e:
        return {"error": f"Database query error: {str(e)}"}
    finally:
        conn.close()

def analyze_transaction(tx_data):
    """Analyze transaction risk using ML model"""
    try:
        # Call ML model API
        response = requests.post(
            ML_MODEL_URL,
            headers={"Content-Type": "application/json"},
            json=tx_data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"ML model API error: {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {"error": f"Error calling ML model: {str(e)}"}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Parse path to extract parameters
        path = self.path.split('?')[0]
        
        # Handle different endpoints
        if path == '/api/wallet':
            # Get query parameters
            query_params = parse_qs(self.path.split('?')[1]) if '?' in self.path else {}
            address = query_params.get('address', [''])[0]
            
            if not address:
                response = {"error": "Wallet address parameter is required"}
            else:
                response = get_wallet_info(address)
        else:
            response = {
                "message": "Welcome to the Wallet API",
                "endpoints": {
                    "/api/wallet": "Get wallet information (requires address parameter)",
                    "/api/analyze": "Analyze transaction risk (POST)"
                }
            }
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Parse JSON request body
        try:
            request_body = json.loads(post_data)
        except json.JSONDecodeError:
            response = {"error": "Invalid JSON in request body"}
            self.wfile.write(json.dumps(response).encode())
            return
            
        # Handle different endpoints
        if self.path == '/api/analyze':
            response = analyze_transaction(request_body)
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response).encode())
