$ErrorActionPreference = "Stop"

Write-Host "Building simplified Docker image for Railway..."

# Change to the backend directory
Set-Location -Path "$PSScriptRoot"

# Build the Docker image
docker build -t wallet-backend-railway -f Dockerfile.railway .

Write-Host "Build completed! Now you can manually push this to your registry."
Write-Host "Example:"
Write-Host "docker tag wallet-backend-railway registry.railway.app/your-project/your-service"
Write-Host "docker push registry.railway.app/your-project/your-service"
