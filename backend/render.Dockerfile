# This file tells Render how to build and start the app
FROM golang:1.21-alpine

# Install build tools
RUN apk add --no-cache git build-base ca-certificates tzdata

WORKDIR /app

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./
RUN sed -i 's/go 1.23.0/go 1.21.0/' go.mod && \
    sed -i 's/toolchain go1.24.2//' go.mod && \
    go mod download

# Copy the entire backend directory
COPY . .

# Build the application (with CGO disabled for better compatibility)
ENV CGO_ENABLED=0
RUN go build -ldflags="-s -w" -o app .

# Expose the port that will be used by Render
EXPOSE 8080

# Start the application - Render sets the PORT env var automatically
CMD ["./app"]
