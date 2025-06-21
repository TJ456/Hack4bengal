#!/bin/sh
echo "Starting build process..."
echo "Checking Go version..."
go version

echo "\nChecking module status..."
go mod verify

echo "\nDownloading dependencies..."
go mod download

echo "\nBuilding application..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o app

echo "\nBuild complete!"
