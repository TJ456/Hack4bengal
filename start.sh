#!/bin/sh
# Use default port if not provided
export PORT=${PORT:-8080}

# Run the Go binary
exec /app/server
