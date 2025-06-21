# ML Risk Assessment Timeout Fix - README

This document provides instructions for applying the ML risk assessment timeout fix.

## What was fixed

The "ML risk assessment timed out" error was occurring because:
1. The fetch requests to the ML service had inadequate timeout handling
2. There was no proper fallback mechanism when the ML service was unavailable
3. Error handling was insufficient

## How to apply the fixes

### 1. Replace the predict_v2.py file

The most important fix has already been applied:
- We replaced `api/predict_v2.py` with an improved version that:
  - Uses progressive timeouts (10s then 20s)
  - Provides smart fallbacks based on transaction data
  - Has better error handling

### 2. Optional UI Improvements

To improve the error UI when timeouts occur:
1. Open `src/components/TransactionInterceptor.tsx`
2. Find the "if (error)" block (around line 350)
3. Replace this block with the contents of `src/components/improved-error-ui.tsx`

### 3. Additional Configuration (Optional)

We've added an `api/config.js` file with timeout settings that you can adjust:
- `ML_TIMEOUT_FIRST_ATTEMPT`: Time to wait for first API attempt (default: 8000ms)
- `ML_TIMEOUT_SECOND_ATTEMPT`: Time to wait for retry attempt (default: 15000ms)
- `ML_MASTER_TIMEOUT`: Maximum time to wait overall (default: 25000ms)

## Testing the fix

1. Normal operation:
   - Transactions should be assessed normally
   - ML risk assessment completes successfully

2. Slow ML service:
   - System will retry automatically
   - A warning appears if all attempts timeout
   - User can still proceed with caution

3. ML service unavailable:
   - Smart fallback risk assessment is displayed
   - Clear indication that fallback is being used
   - Transaction can proceed with appropriate warnings

## Verification

The system now properly waits for ML risk assessment to complete before allowing transactions to proceed, fixing the core security issue.

For more technical details, see `ML_TIMEOUT_FIX.md`.
