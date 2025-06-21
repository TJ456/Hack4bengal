@echo off
echo ========================================
echo  Wallet Analytics System Setup
echo ========================================

echo.
echo 1. Checking Go installation...
go version
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    echo Please download and install Go 64-bit from: https://golang.org/dl/
    pause
    exit /b 1
)

echo.
echo 2. Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 3. Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 4. Testing backend compilation...
cd backend
go mod tidy
go build .
if %errorlevel% neq 0 (
    echo ERROR: Backend compilation failed
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  Setup Complete! 
echo ========================================
echo.
echo To start the system:
echo   1. Backend: cd backend && go run main.go
echo   2. Frontend: npm run dev
echo   3. Test: python test_full_connection.py
echo.
echo Or use automated startup:
echo   python start_system.py
echo.
pause
