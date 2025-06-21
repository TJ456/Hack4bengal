# Simple deployment script for Railway
# Handles both direct deployment and Docker builds

$ErrorActionPreference = "Stop"

Write-Host "Wallet Backend - Railway Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check for Railway CLI
$hasRailway = $null -ne (Get-Command railway -ErrorAction SilentlyContinue)
if (-not $hasRailway) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Deploy options
Write-Host "`nDeployment Options:" -ForegroundColor White
Write-Host "1. Deploy directly with Railway CLI" -ForegroundColor Green
Write-Host "2. Build Docker image locally and deploy" -ForegroundColor Green
Write-Host "3. Exit" -ForegroundColor Red

$choice = Read-Host "Select an option (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`nDeploying with Railway CLI..." -ForegroundColor Cyan
        railway up
    }
    "2" {
        # Build Docker image
        Write-Host "`nBuilding Docker image..." -ForegroundColor Cyan
        docker build -t wallet-backend -f Dockerfile.railway .
        
        # Deploy to Railway
        Write-Host "`nPushing to Railway registry..." -ForegroundColor Cyan
        railway login
        railway link
        $registryHost = railway variables get RAILWAY_SERVICE_REGISTRY
        
        if ($registryHost) {
            docker tag wallet-backend $registryHost
            docker push $registryHost
        } else {
            Write-Host "Could not get registry URL. Please deploy manually." -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 0
    }
    default {
        Write-Host "Invalid option. Exiting..." -ForegroundColor Red
        exit 1
    }
}
