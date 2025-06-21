@echo off
echo ========================================
echo  Complete Database Setup for Wallet Analytics
echo ========================================

echo.
echo Step 1: Testing PostgreSQL connection...
echo Please enter your PostgreSQL password when prompted:
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to PostgreSQL
    echo Please ensure:
    echo 1. PostgreSQL is installed and running
    echo 2. Service is started (check Services.msc)
    echo 3. Username/password are correct
    pause
    exit /b 1
)

echo.
echo Step 2: Creating wallet database and tables...
echo Please enter your PostgreSQL password when prompted:
psql -h localhost -p 5432 -U postgres -f setup_database.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)

echo.
echo Step 3: Updating .env file with your password...
echo Current DATABASE_URL in .env:
type backend\.env | findstr DATABASE_URL

echo.
echo IMPORTANT: Update the password in backend\.env file:
echo Change: postgresql://Records_owner:npg_fELAr2DGw3TZ@ep-odd-shape-a4yij4cq-pooler.us-east-1.aws.neon.tech/Records?sslmode=require
echo To:     postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/wallet
echo.

echo Step 4: Testing backend connection...
cd backend
echo Testing Go compilation...
set CGO_ENABLED=0
go mod tidy
go build .
if %errorlevel% neq 0 (
    echo ERROR: Backend compilation failed
    cd ..
    pause
    exit /b 1
)

echo.
echo Testing backend startup...
timeout /t 3 /nobreak > nul
start /b go run . > backend_output.log 2>&1
timeout /t 5 /nobreak > nul

echo.
echo Checking if backend started...
curl -s http://localhost:8080/api/firewall/stats > nul
if %errorlevel% equ 0 (
    echo SUCCESS: Backend is running and connected to database!
) else (
    echo WARNING: Backend may not be fully started yet
    echo Check backend_output.log for details
)

cd ..

echo.
echo ========================================
echo  Database Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update password in backend\.env if needed
echo 2. Start backend: cd backend && go run .
echo 3. Start frontend: npm run dev
echo 4. Test ML API: python test_ml_api.py
echo.
echo Database contains:
echo - transactions table (with sample data)
echo - reports table (with sample data)
echo - dao_votes and dao_proposals tables
echo - recovery_attempts table
echo - wallet_analytics_view (for ML queries)
echo.
pause
