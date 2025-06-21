# Vercel Serverless API for UnhackableWallet

This directory contains serverless Python functions that will be deployed on Vercel. Each `.py` file in this directory represents an API endpoint that will be available at `/api/{filename}`.

## Available Endpoints

- `/api/index`: API status and information
- `/api/wallet`: Get wallet information and transaction history
- `/api/predict`: ML model prediction for transaction risk analysis
- `/api/test`: Testing endpoint that returns environment information

## Environment Variables

The API requires the following environment variables to be set in Vercel:

- `DATABASE_URL`: PostgreSQL connection string
- `ML_MODEL_URL`: URL to the ML model API (if hosted separately)
- `JWT_SECRET`: Secret key for JWT token generation/validation
- `ENVIRONMENT`: Deployment environment (development, production)

## Local Development

To test these functions locally before deploying to Vercel, you can use the Vercel CLI:

1. Install Vercel CLI: `npm i -g vercel`
2. Run the development server: `vercel dev`

## Deployment

These functions will be automatically deployed when you push to Vercel. The `vercel.json` file at the root of the project configures how these functions are deployed.

## Function Structure

Each function follows the Vercel Python serverless function format, with a `handler` class that inherits from `BaseHTTPRequestHandler` and implements methods like `do_GET` and `do_POST` to handle requests.
