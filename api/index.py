from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "message": "UnhackableWallet API is running",
            "status": "online",
            "version": "1.0.0",
            "endpoints": {
                "/api/wallet": "Get wallet information",
                "/api/analyze": "Analyze transaction risk"
            }
        }
        
        self.wfile.write(json.dumps(response).encode())
