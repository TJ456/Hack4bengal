# Render Environment Variables Setup Guide

This guide lists all environment variables needed for deploying the application on Render.

## Backend Service Environment Variables

### Database Configuration
```
DATABASE_URL=postgres://username:password@host:5432/database_name
```

### Authentication
```
JWT_SECRET=your_jwt_secret_key
```

### Civic Integration
```
CIVIC_GATEKEEPER_NETWORK=your_gatekeeper_network
CIVIC_AUTH_KEY=your_civic_auth_key
CIVIC_AUTH_BASE_URL=https://auth.civic.com
CIVIC_AUTH_STAGING_URL=https://staging.auth.civic.com
```

### Server Configuration
```
PORT=8080
NODE_ENV=production
```

## Frontend Service Environment Variables

### API Configuration
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_CIVIC_CLIENT_ID=your_civic_client_id
VITE_RPC_URL=your_blockchain_rpc_url
```

## ML API Service Environment Variables

### Model Configuration
```
ML_MODEL_ENDPOINT=https://your-ml-endpoint
ML_API_KEY=your_ml_api_key
CACHE_DURATION=3600
```

## Deployment Steps

1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Copy each variable from this guide
6. Paste into Render, filling in your actual values
7. Click "Save Changes"

## Important Notes

- Never commit actual values to version control
- Keep production keys separate from development keys
- Rotate sensitive keys periodically
- Use Render's secret files feature for large configuration files

## Additional Configuration

For services that need multiple environment variables, you can also use Render's "Secret File" feature:

1. Go to your service's "Environment" tab
2. Under "Secret Files", add a new file
3. Name it `.env`
4. Paste all relevant variables
5. Save changes

This can be easier than adding variables one by one, but make sure to properly format the file.
