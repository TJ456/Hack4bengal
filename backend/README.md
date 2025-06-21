# Wallet Firewall Backend

This repository contains the backend API for the Wallet Firewall application, providing transaction security analysis, scam reporting, and DAO governance functionality.

## Features

- **AI Transaction Firewall**: Analyzes blockchain transactions for potential risks and scams
- **Scam Reporting System**: Allows users to report suspicious addresses and transactions
- **DAO Governance**: Implements proposal creation and voting mechanisms
- **Transaction History**: Tracks and displays transaction security history

## Tech Stack

- **Language**: Go (Golang)
- **Web Framework**: Gin
- **Database**: PostgreSQL with GORM
- **Authentication**: JWT
- **ML Model**: External API for transaction risk assessment

## Project Structure

```
backend/
├── main.go                  # Starting point
├── config.go                # ENV, DB connection
├── .env                     # Secrets
├── routes/                  # API route config
│   └── routes.go
├── handlers/                # Functions for each route
│   ├── firewall.go          # Main ML handler
│   ├── report.go            # Report scam tx
│   └── dao.go               # DAO vote placeholder
├── models/                  # DB models
│   ├── transaction.go
│   ├── report.go
│   └── dao.go
├── services/                # Reusable logic
│   └── ai.go                # AI model call
```

## Setup Instructions

1. **Install Go**
   - Download and install Go from [golang.org](https://golang.org/dl/)
   - Ensure Go version 1.21 or higher

2. **Install PostgreSQL**
   - Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
   - Create a database named `wallet`

3. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>/backend
   ```

4. **Configure Environment Variables**
   - Copy the example env file: `cp .env.example .env`
   - Update the database connection string and other settings

5. **Install Dependencies**
   ```bash
   go mod download
   ```

6. **Run Migrations**
   - Migrations are automatically run on startup

7. **Start the Server**
   ```bash
   go run .
   ```
   - The server will start on port 8080 (or the port specified in `.env`)

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API endpoint documentation.

## Development

### Running in Development Mode

```bash
go run .
```

### Building for Production

```bash
go build -o wallet-backend .
```

### Running Tests

```bash
go test -v ./...
```

## Integration with Frontend

The frontend expects the API to be available at `/api/*` endpoints as documented in the API documentation. The backend implements CORS to allow requests from the frontend domains.

## ML Model Integration

The backend connects to an external ML model API for transaction risk analysis. The model is expected to provide a risk score between 0 and 1, where higher values indicate higher risk.

In development mode, a simplified risk scoring mechanism is used if the ML model is unavailable.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
