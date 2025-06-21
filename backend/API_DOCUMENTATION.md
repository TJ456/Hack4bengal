# Wallet Backend API Documentation

## API Endpoints

### AI Firewall

#### Analyze Transaction
- **URL**: `/api/firewall/tx`
- **Method**: `POST`
- **Description**: Analyzes a blockchain transaction for potential risks
- **Request Body**:
  ```json
  {
    "from": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
    "to": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
    "value": 1.2,
    "currency": "ETH",
    "txHash": "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    "network": "ethereum",
    "timestamp": "2023-05-28T14:30:00Z"
  }
  ```
- **Response**:
  ```json
  {
    "status": "safe", // "safe", "suspicious", or "blocked"
    "risk": 0.12
  }
  ```

#### Get Security Stats
- **URL**: `/api/firewall/stats`
- **Method**: `GET`
- **Description**: Returns statistics about transactions analyzed by the firewall
- **Response**:
  ```json
  {
    "safe": 152,
    "suspicious": 23,
    "blocked": 7,
    "total": 182
  }
  ```

#### Get Transaction History
- **URL**: `/api/transactions?address={walletAddress}`
- **Method**: `GET`
- **Description**: Returns transaction history for a specific wallet address
- **Parameters**:
  - `address` (query): Wallet address to retrieve transactions for
- **Response**: Array of transaction objects
  ```json
  [
    {
      "id": 1,
      "from": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
      "to": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      "value": 1.2,
      "currency": "ETH",
      "txHash": "0x3a4b...",
      "network": "ethereum",
      "risk": 0.1,
      "status": "safe",
      "timestamp": "2023-05-28T14:30:00Z",
      "createdAt": "2023-05-28T14:30:05Z"
    },
    // ...more transactions
  ]
  ```

### Scam Reports

#### Submit Report
- **URL**: `/api/report`
- **Method**: `POST`
- **Description**: Submits a report about a scam or phishing attempt
- **Request Body**:
  ```json
  {
    "reportedAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "reporterAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
    "txHash": "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    "category": "phishing",
    "description": "This address sent me a phishing link trying to steal my funds.",
    "evidence": "Screenshot URL or description"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "message": "Report submitted successfully"
  }
  ```

#### Get Reports
- **URL**: `/api/reports?address={address}`
- **Method**: `GET`
- **Description**: Retrieves reports for a specific address or all reports (admin only)
- **Parameters**:
  - `address` (query, optional): Address to retrieve reports for
- **Response**: Array of report objects
  ```json
  [
    {
      "id": 1,
      "reportedAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "reporterAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
      "category": "phishing",
      "description": "This address sent me a phishing link trying to steal my funds.",
      "evidence": "Screenshot URL or description",
      "createdAt": "2023-05-28T14:30:00Z",
      "status": "pending",
      "severity": 3
    },
    // ...more reports
  ]
  ```

### DAO Governance

#### Cast Vote
- **URL**: `/api/dao/vote`
- **Method**: `POST`
- **Description**: Casts a vote for a DAO proposal
- **Request Body**:
  ```json
  {
    "proposalId": 1,
    "voterAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
    "voteType": "for", // "for" or "against"
    "votePower": 1.0
  }
  ```
- **Response**:
  ```json
  {
    "message": "Vote recorded successfully",
    "proposal": {
      "id": 1,
      "title": "Integration with Uniswap",
      "description": "This proposal aims to integrate Uniswap...",
      "creatorAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
      "createdAt": "2023-05-28T14:30:00Z",
      "endTime": "2023-06-04T14:30:00Z",
      "status": "active",
      "votesFor": 6,
      "votesAgainst": 2
    }
  }
  ```

#### Get Proposals
- **URL**: `/api/dao/proposals`
- **Method**: `GET`
- **Description**: Retrieves all active DAO proposals
- **Response**: Array of proposal objects
  ```json
  [
    {
      "id": 1,
      "title": "Integration with Uniswap",
      "description": "This proposal aims to integrate Uniswap...",
      "creatorAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
      "createdAt": "2023-05-28T14:30:00Z",
      "endTime": "2023-06-04T14:30:00Z",
      "status": "active",
      "votesFor": 5,
      "votesAgainst": 2
    },
    // ...more proposals
  ]
  ```

#### Create Proposal
- **URL**: `/api/dao/proposals`
- **Method**: `POST`
- **Description**: Creates a new DAO governance proposal
- **Request Body**:
  ```json
  {
    "title": "Add support for hardware wallets",
    "description": "Integrate with common hardware wallets like Ledger and Trezor for improved security.",
    "creatorAddress": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0",
    "executionData": "0x..." // Optional contract call data if proposal passes
  }
  ```
- **Response**:
  ```json
  {
    "id": 3,
    "message": "Proposal created successfully"
  }
  ```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing the issue"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid parameters or request format
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict (e.g., already voted)
- `500`: Internal Server Error - Server-side issue

## Authentication

For endpoints requiring authentication, include a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

JWT tokens can be obtained by authenticating with a wallet address using signature verification (not implemented in this version).
