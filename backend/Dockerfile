# Build stage
FROM golang:1.24.2-bullseye AS builder

# Set up proper Go path for your module
WORKDIR /go/src/Wallet

# Copy backend code to the correct module path
COPY . backend/

# Set working directory to backend
WORKDIR /go/src/Wallet/backend

# Download dependencies
RUN go mod download && \
    go mod verify

# Show debug information
RUN echo "=== Directory Contents ===" && \
    ls -la && \
    echo "=== Go Environment ===" && \
    go env && \
    echo "=== Module Info ===" && \
    go list -m all

# Build with verbose output
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o server .

# Final stage
FROM debian:bullseye-slim

# Install SSL certificates and timezone data
RUN apt-get update && \
    apt-get install -y ca-certificates tzdata && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and app directory
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app && \
    chown appuser:appuser /app

# Set up app directory
WORKDIR /app

# ✅ FIXED: Correct build paths
COPY --from=builder /go/src/Wallet/backend/server ./  
COPY --from=builder /go/src/Wallet/backend/start.sh ./  

# Set permissions
RUN chmod +x server start.sh && \
    chown appuser:appuser server start.sh

# Use non-root user
USER appuser

# Set environment variables
ENV GO_ENV=production \
    PORT=8080 \
    GIN_MODE=release

# Expose port
EXPOSE 8080

# Use start script
CMD ["./start.sh"]
