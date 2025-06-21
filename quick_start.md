# Quick Start Guide - 64-bit Setup

## 🔽 Prerequisites

### **1. Download & Install Go 64-bit**
- **URL**: https://golang.org/dl/
- **File**: `go1.21.x.windows-amd64.msi`
- **Install**: Run the MSI installer
- **Verify**: Open new terminal and run `go version`

### **2. Download & Install Node.js**
- **URL**: https://nodejs.org/
- **File**: `node-v20.x.x-x64.msi`
- **Install**: Run the MSI installer
- **Verify**: Run `node --version`

### **3. Install Python (if not installed)**
- **URL**: https://python.org/downloads/
- **File**: `python-3.11.x-amd64.exe`
- **Install**: Check "Add to PATH" during installation

## 🚀 Quick Setup

### **Option 1: Automated Setup**
```bash
# Run the setup script
setup_and_test.bat

# Start the system
python start_system.py
```

### **Option 2: Manual Setup**
```bash
# 1. Install dependencies
npm install

# 2. Test backend compilation
cd backend
go mod tidy
go build .
cd ..

# 3. Start backend (Terminal 1)
cd backend
go run main.go

# 4. Start frontend (Terminal 2)
npm run dev

# 5. Test connection (Terminal 3)
python test_full_connection.py
```

## 🧪 Testing

### **Test ML Analytics API**
```bash
# Test the ML endpoints
python test_ml_api.py

# Collect sample data
python ml_data_collector.py --addresses sample_addresses.txt --output test_data.csv
```

### **Test Frontend Connection**
1. Open: http://localhost:5173
2. Connect MetaMask wallet
3. View wallet analytics
4. Check browser console for any errors

## 🔧 Troubleshooting

### **Go Issues**
```bash
# Check Go installation
go version
go env

# If Go not found, add to PATH:
# C:\Program Files\Go\bin
```

### **Backend Issues**
```bash
# Check if backend compiles
cd backend
go mod tidy
go build .

# Check dependencies
go mod download
```

### **Frontend Issues**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Check if Vite starts
npm run dev
```

### **Connection Issues**
```bash
# Check ports
netstat -an | findstr :5173
netstat -an | findstr :8080

# Test API directly
curl http://localhost:8080/api/firewall/stats
```

## 📊 Expected Results

### **After Setup:**
- ✅ Go 64-bit installed and working
- ✅ Backend compiles without errors
- ✅ Frontend starts on port 5173
- ✅ Backend starts on port 8080
- ✅ API proxy works (frontend → backend)
- ✅ ML analytics endpoints respond

### **Test Output:**
```
🎯 Overall: 6/6 tests passed
🎉 All connections are working! Your system is fully integrated.
```

## 🎯 Next Steps

1. **Install Go 64-bit**: Download from golang.org
2. **Run Setup**: `setup_and_test.bat`
3. **Start System**: `python start_system.py`
4. **Test ML API**: `python test_ml_api.py`
5. **Open Frontend**: http://localhost:5173

Your system will be fully connected and ready for ML data collection!
