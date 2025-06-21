# Frontend-Backend Connection Setup

## 🎯 System Architecture

```
Frontend (React/Vite)     Backend (Go/Gin)        Database
Port 5173            →    Port 8080          →    PostgreSQL
                     ↓
                 ML Analytics API
                 /api/analytics/*
```

## ✅ Connection Status

### **Fixed Issues:**
1. ✅ **Port Conflict Resolved**: Frontend now runs on 5173, Backend on 8080
2. ✅ **API Proxy Configured**: Frontend proxies `/api/*` calls to backend
3. ✅ **CORS Configured**: Backend allows requests from `localhost:5173`
4. ✅ **ML Endpoints Connected**: Analytics API accessible from frontend

### **Current Configuration:**
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:8080` (Go Gin server)
- **API Proxy**: Frontend `/api/*` → Backend `http://localhost:8080/api/*`

## 🚀 Quick Start

### **Option 1: Automated Startup**
```bash
# Start everything automatically
python start_system.py

# Test connections only
python test_full_connection.py
```

### **Option 2: Manual Startup**
```bash
# Terminal 1: Start Backend
cd backend
go run main.go

# Terminal 2: Start Frontend
npm run dev

# Terminal 3: Test Connection
python test_full_connection.py
```

## 🔧 Configuration Details

### **Frontend (vite.config.ts)**
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

### **Backend (routes.go)**
```go
// CORS Configuration
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
    AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowCredentials: true,
}))

// ML Analytics Endpoints
api.GET("/analytics/wallet/:address", analyticsHandler.GetWalletAnalytics)
api.GET("/analytics/risk/:address", analyticsHandler.GetWalletRiskScore)
api.POST("/analytics/bulk", analyticsHandler.GetBulkWalletAnalytics)
api.POST("/analytics/export", analyticsHandler.ExportMLDataset)
```

## 🧪 Testing

### **Connection Tests**
```bash
# Full system test
python test_full_connection.py

# ML API specific test
python test_ml_api.py

# Manual API test
curl "http://localhost:8080/api/analytics/wallet/0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
```

### **Frontend Integration Test**
1. Open `http://localhost:5173`
2. Connect MetaMask wallet
3. View wallet analytics
4. Check browser network tab for API calls

## 📊 Data Flow

### **Frontend → Backend**
```
React Component
    ↓
fetch('/api/analytics/wallet/0x...')
    ↓
Vite Proxy (localhost:5173/api/*)
    ↓
Backend API (localhost:8080/api/*)
    ↓
Analytics Service
    ↓
Database/Blockchain
```

### **ML Team → Backend**
```
Python Script
    ↓
requests.get('http://localhost:8080/api/analytics/wallet/0x...')
    ↓
Backend API
    ↓
JSON/CSV Response
```

## 🔍 Troubleshooting

### **Common Issues:**

1. **Port Already in Use**
   ```bash
   # Kill processes on ports
   npx kill-port 5173
   npx kill-port 8080
   ```

2. **CORS Errors**
   - Ensure frontend is on port 5173
   - Check backend CORS configuration
   - Clear browser cache

3. **API Proxy Not Working**
   - Restart frontend server
   - Check vite.config.ts proxy settings
   - Verify backend is running on 8080

4. **Database Connection**
   ```bash
   # Check PostgreSQL
   psql -h localhost -p 5432 -U postgres -d wallet
   ```

### **Debug Commands:**
```bash
# Check if ports are in use
netstat -an | findstr :5173
netstat -an | findstr :8080

# Test backend directly
curl http://localhost:8080/api/firewall/stats

# Test frontend proxy
curl http://localhost:5173/api/firewall/stats
```

## ✅ Verification Checklist

- [ ] Backend starts on port 8080
- [ ] Frontend starts on port 5173
- [ ] API proxy works (frontend → backend)
- [ ] CORS allows frontend requests
- [ ] ML analytics endpoints respond
- [ ] Web3 wallet connection works
- [ ] Database connection established

## 🎯 Next Steps

1. **Start System**: `python start_system.py`
2. **Test ML API**: `python test_ml_api.py`
3. **Collect Data**: `python ml_data_collector.py --addresses sample_addresses.txt`
4. **Open Frontend**: `http://localhost:5173`

Your frontend and backend are now fully connected and ready for use!
