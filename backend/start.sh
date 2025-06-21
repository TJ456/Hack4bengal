#!/bin/sh
# This script is used as the start command for Render
# It ensures the application uses the PORT environment variable provided by Render

# Set default port if not provided
export PORT=${PORT:-8080}

# Run the application
exec ./server
