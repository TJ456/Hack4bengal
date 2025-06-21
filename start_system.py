#!/usr/bin/env python3
"""
System Startup Script

This script helps start both frontend and backend servers
and verifies they are properly connected.
"""

import subprocess
import time
import sys
import os
import signal
import requests
from typing import List, Optional

class SystemManager:
    def __init__(self):
        self.processes: List[subprocess.Popen] = []
        self.frontend_port = 5173
        self.backend_port = 8080
        
    def cleanup(self, signum=None, frame=None):
        """Clean up all processes"""
        print("\n🛑 Shutting down system...")
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        print("✅ System shutdown complete")
        sys.exit(0)
    
    def check_port(self, port: int) -> bool:
        """Check if a port is in use"""
        try:
            response = requests.get(f"http://localhost:{port}", timeout=2)
            return True
        except:
            return False
    
    def wait_for_service(self, port: int, service_name: str, max_wait: int = 30) -> bool:
        """Wait for a service to start on given port"""
        print(f"⏳ Waiting for {service_name} to start on port {port}...")
        
        for i in range(max_wait):
            if self.check_port(port):
                print(f"✅ {service_name} is running on port {port}")
                return True
            time.sleep(1)
            if i % 5 == 0 and i > 0:
                print(f"   Still waiting... ({i}/{max_wait}s)")
        
        print(f"❌ {service_name} failed to start within {max_wait} seconds")
        return False
    
    def start_backend(self) -> bool:
        """Start the Go backend server"""
        print("🚀 Starting Backend Server...")
        
        # Check if backend directory exists
        if not os.path.exists("backend"):
            print("❌ Backend directory not found")
            return False
        
        # Check if Go is installed
        try:
            subprocess.run(["go", "version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ Go is not installed or not in PATH")
            return False
        
        # Start backend
        try:
            process = subprocess.Popen(
                ["go", "run", "main.go"],
                cwd="backend",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.processes.append(process)
            
            # Wait for backend to start
            if self.wait_for_service(self.backend_port, "Backend"):
                return True
            else:
                print("❌ Backend failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start backend: {e}")
            return False
    
    def start_frontend(self) -> bool:
        """Start the React frontend server"""
        print("🚀 Starting Frontend Server...")
        
        # Check if package.json exists
        if not os.path.exists("package.json"):
            print("❌ package.json not found")
            return False
        
        # Check if node_modules exists
        if not os.path.exists("node_modules"):
            print("📦 Installing dependencies...")
            try:
                subprocess.run(["npm", "install"], check=True)
            except subprocess.CalledProcessError:
                print("❌ Failed to install dependencies")
                return False
        
        # Start frontend
        try:
            process = subprocess.Popen(
                ["npm", "run", "dev"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.processes.append(process)
            
            # Wait for frontend to start
            if self.wait_for_service(self.frontend_port, "Frontend"):
                return True
            else:
                print("❌ Frontend failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start frontend: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Test if frontend and backend are properly connected"""
        print("🔍 Testing Frontend-Backend Connection...")
        
        try:
            # Test direct backend
            response = requests.get(f"http://localhost:{self.backend_port}/api/firewall/stats", timeout=5)
            if response.status_code not in [200, 404]:
                print("❌ Backend API not responding properly")
                return False
            
            # Test frontend proxy
            response = requests.get(f"http://localhost:{self.frontend_port}/api/firewall/stats", timeout=5)
            if response.status_code not in [200, 404]:
                print("❌ Frontend proxy not working")
                return False
            
            print("✅ Frontend-Backend connection is working")
            return True
            
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False
    
    def test_ml_endpoints(self) -> bool:
        """Test ML analytics endpoints"""
        print("🔍 Testing ML Analytics Endpoints...")
        
        try:
            test_address = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
            
            # Test analytics endpoint
            response = requests.get(
                f"http://localhost:{self.backend_port}/api/analytics/wallet/{test_address}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ ML Analytics endpoints are working")
                print(f"   Sample field: avg_min_between_received_tx = {data.get('avg_min_between_received_tx', 'N/A')}")
                return True
            else:
                print(f"❌ ML Analytics endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ ML Analytics test failed: {e}")
            return False
    
    def start_system(self) -> bool:
        """Start the complete system"""
        print("🎯 Starting Complete Wallet Analytics System")
        print("=" * 50)
        
        # Set up signal handlers for cleanup
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        
        # Start backend first
        if not self.start_backend():
            self.cleanup()
            return False
        
        # Start frontend
        if not self.start_frontend():
            self.cleanup()
            return False
        
        # Test connections
        if not self.test_connection():
            self.cleanup()
            return False
        
        # Test ML endpoints
        if not self.test_ml_endpoints():
            print("⚠️  ML endpoints not working, but system is running")
        
        print("\n" + "=" * 50)
        print("🎉 System Started Successfully!")
        print("=" * 50)
        print(f"🌐 Frontend: http://localhost:{self.frontend_port}")
        print(f"🔧 Backend API: http://localhost:{self.backend_port}/api")
        print("🤖 ML Analytics: Ready for data collection")
        print("\n📋 Available Commands:")
        print("   - Test ML API: python test_ml_api.py")
        print("   - Collect Data: python ml_data_collector.py --addresses sample_addresses.txt")
        print("   - Full Test: python test_full_connection.py")
        print("\n⏹️  Press Ctrl+C to stop the system")
        
        # Keep running until interrupted
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.cleanup()
        
        return True

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test-only":
        # Just run the connection test
        from test_full_connection import ConnectionTester
        tester = ConnectionTester()
        results = tester.run_full_test()
        sys.exit(0 if all(results.values()) else 1)
    
    manager = SystemManager()
    success = manager.start_system()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
