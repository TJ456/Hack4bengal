# ML API Integration Documentation

This document outlines the integration between our wallet application and the external ML API for fraud detection.

## External ML API Details

- **API Endpoint**: `https://ml-fraud-transaction-detection.onrender.com/predict`
- **Purpose**: Detect potentially fraudulent or risky transactions
- **Provider**: External ML service

## API Request Format

The external ML API expects the following JSON format for requests:

```json
{
  "from_address": "0xSenderAddress",
  "to_address": "0xRecipientAddress", 
  "transaction_value": 5.0,
  "gas_price": 20,
  "is_contract_interaction": false,
  "acc_holder": "0xSenderAddress",
  "features": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
              0.0, 0.0, 0.0, 0.0, 5.0, 20.0, 0.0, 0.0, 0.0]
}
```

### Important Notes about the Features Array

- The `features` array must contain exactly 18 floating-point numbers
- The transaction value should be placed at index 13 (0-based)
- The gas price should be placed at index 14 (0-based)
- All other positions are currently set to 0.0 and reserved for future use

## API Response Format

The API responds with a prediction:

```json
{
  "prediction": "Fraud" | "Safe",
  "Type": "Unsafe Transaction" | "Safe Transaction"
}
```

## Integration Points

The external ML API is integrated in several places:

1. **Backend Service (Go)**: `backend/services/ai.go` handles the ML integration for backend processing
2. **API Endpoint (Python)**: `api/predict.py` provides a serverless API route that uses the external ML API
3. **Transaction Components**: 
   - `src/components/SendTransaction.tsx` - Handles transaction creation with ML fraud detection
   - `src/pages/SendPage.tsx` - Complete transaction page with wallet connection
   - `src/components/TransactionInterceptor.tsx` - Displays fraud warning messages

## Testing

We have several test scripts for the ML API integration:

1. `test_ml_connection.py` - Basic connectivity test
2. `test_external_ml_api.py` - More comprehensive testing of different transaction scenarios

Run these scripts to verify the ML API connectivity is working correctly.

## Troubleshooting

If you encounter issues with the ML API:

1. Check network connectivity to the API endpoint
2. Verify the request format matches exactly what the API expects
3. Ensure the features array has exactly 18 elements
4. Check that the transaction value and gas price are set in the correct positions (13 and 14)

## Future Improvements

- Extend the feature set with more transaction characteristics
- Implement local caching to reduce API calls
- Add more comprehensive error handling and fallback mechanisms
