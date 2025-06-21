@echo off
echo ========================================
echo  Testing PostgreSQL Connection
echo ========================================

echo.
echo 1. Testing PostgreSQL service...
sc query postgresql-x64-15
if %errorlevel% neq 0 (
    echo PostgreSQL service not found. Checking other versions...
    sc query postgresql-x64-16
    if %errorlevel% neq 0 (
        echo ERROR: PostgreSQL service not running
        echo Please start PostgreSQL service from Services.msc
        pause
        exit /b 1
    )
)

echo.
echo 2. Testing database connection...
echo Please enter your PostgreSQL password when prompted:
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to PostgreSQL
    echo Check username/password and service status
    pause
    exit /b 1
)

echo.
echo ========================================
echo  PostgreSQL is working correctly!
echo ========================================
pause
