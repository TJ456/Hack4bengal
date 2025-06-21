from http.server import BaseHTTPRequestHandler
import json
import os
import platform
import sys

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Return environment information to help with debugging
        response = {
            "message": "API is working",
            "environment": {
                "python_version": sys.version,
                "platform": platform.platform(),
                "environment": os.environ.get("ENVIRONMENT", "development"),
                "database_url_configured": bool(os.environ.get("DATABASE_URL")),
                "ml_model_url_configured": bool(os.environ.get("ML_MODEL_URL"))
            }
        }
        
        self.wfile.write(json.dumps(response).encode())
