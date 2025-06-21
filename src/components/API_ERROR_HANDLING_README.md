# API Error Handling System

This document describes the comprehensive API error handling system implemented for the wallet application frontend.

## Overview

The API error handling system provides:
- **Standardized error classification** (network, validation, authorization, server, timeout)
- **Automatic retry logic** with exponential backoff
- **Consistent error display** with user-friendly messages
- **React hooks** for easy integration
- **Centralized API service** with built-in error handling

## Components

### 1. Error Types and Utilities (`src/lib/api-errors.ts`)

Defines error types and utility functions:

```typescript
import { ApiError, ApiErrorType, createApiError } from '@/lib/api-errors';

// Error types
enum ApiErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation', 
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}
```

### 2. API Service (`src/lib/api-service.ts`)

Centralized HTTP client with automatic retry and error handling:

```typescript
import { apiService } from '@/lib/api-service';

// Basic usage
const response = await apiService.get('/analytics/wallet/0x123');
const data = await apiService.post('/reports', { address: '0x123' });

// With custom configuration
const response = await apiService.get('/data', {
  timeout: 5000,
  retryConfig: { maxAttempts: 5 },
  skipRetry: false
});
```

### 3. React Hooks (`src/hooks/use-api.ts`)

React hooks for API calls with integrated state management:

```typescript
import { useApiGet, useApiPost } from '@/hooks/use-api';

// GET request with automatic loading
const { data, loading, error, retry } = useApiGet('/firewall/stats');

// POST request with manual execution
const { data, loading, error, execute } = useApiPost('/reports', {
  immediate: false,
  showToastOnSuccess: true
});
```

### 4. Error Display Component (`src/components/ApiErrorHandler.tsx`)

Standardized error display with retry functionality:

```typescript
import ApiErrorHandler from '@/components/ApiErrorHandler';

<ApiErrorHandler
  error={error}
  onRetry={retry}
  isRetrying={isRetrying}
  variant="alert" // 'alert' | 'card' | 'inline'
  showDetails={true}
  customRetryText="Retry Operation"
/>
```

## Usage Examples

### Basic GET Request

```typescript
import { useApiGet } from '@/hooks/use-api';
import ApiErrorHandler from '@/components/ApiErrorHandler';

const MyComponent = () => {
  const { data, loading, error, retry, isRetrying } = useApiGet('/api/data');

  if (loading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <ApiErrorHandler
        error={error}
        onRetry={retry}
        isRetrying={isRetrying}
        variant="alert"
      />
    );
  }

  return <div>{JSON.stringify(data)}</div>;
};
```

### POST Request with Form

```typescript
import { useApiPost } from '@/hooks/use-api';

const FormComponent = () => {
  const { data, loading, error, execute } = useApiPost('/api/submit', {
    immediate: false,
    showToastOnSuccess: true,
    successMessage: 'Form submitted successfully!'
  });

  const handleSubmit = (formData) => {
    execute(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {error && <ApiErrorHandler error={error} variant="inline" />}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Multiple API Calls

```typescript
import { useApiMultiple } from '@/hooks/use-api';

const DashboardComponent = () => {
  const { data, loading, error, retry } = useApiMultiple([
    { method: 'GET', endpoint: '/analytics/wallet/0x123' },
    { method: 'GET', endpoint: '/analytics/risk/0x123' }
  ]);

  const [analytics, riskData] = data || [];

  if (error) {
    return <ApiErrorHandler error={error} onRetry={retry} />;
  }

  return (
    <div>
      <div>Analytics: {JSON.stringify(analytics)}</div>
      <div>Risk: {JSON.stringify(riskData)}</div>
    </div>
  );
};
```

## Error Types and Handling

### Network Errors
- **Cause**: Connection failures, DNS issues
- **Retryable**: Yes
- **User Message**: "Network connection failed. Please check your internet connection."

### Validation Errors (400, 422)
- **Cause**: Invalid request data
- **Retryable**: No
- **User Message**: "Invalid request data. Please check your input."

### Authorization Errors (401, 403)
- **Cause**: Authentication/permission issues
- **Retryable**: No
- **User Message**: "Authentication failed. Please reconnect your wallet."

### Server Errors (500+)
- **Cause**: Backend issues
- **Retryable**: Yes
- **User Message**: "Server error occurred. Please try again later."

### Timeout Errors
- **Cause**: Request took too long
- **Retryable**: Yes
- **User Message**: "Request timed out. Please try again."

## Configuration

### Retry Configuration

```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  backoffMultiplier: 2  // Exponential backoff
};

// Usage in API service
apiService.get('/data', { retryConfig });

// Usage in hooks
useApiGet('/data', { retryConfig });
```

### Global Configuration

```typescript
// Set default headers
apiService.setDefaultHeaders({
  'X-API-Key': 'your-api-key'
});

// Set auth token
apiService.setAuthToken('bearer-token');

// Clear auth token
apiService.clearAuthToken();
```

## Best Practices

1. **Use appropriate error variants**:
   - `alert`: For critical errors that need immediate attention
   - `card`: For contained error displays within components
   - `inline`: For form validation and inline errors

2. **Show details in development**:
   ```typescript
   <ApiErrorHandler
     error={error}
     showDetails={process.env.NODE_ENV === 'development'}
   />
   ```

3. **Provide meaningful retry text**:
   ```typescript
   <ApiErrorHandler
     error={error}
     customRetryText="Retry Wallet Connection"
   />
   ```

4. **Handle success and error callbacks**:
   ```typescript
   useApiPost('/data', {
     onSuccess: (data) => console.log('Success:', data),
     onError: (error) => console.error('Error:', error),
     showToastOnSuccess: true
   });
   ```

## Integration with Existing Components

The system is designed to be gradually adopted. Existing components can be updated one at a time:

1. Replace manual `fetch()` calls with `useApiGet/useApiPost`
2. Replace custom error handling with `ApiErrorHandler`
3. Remove manual loading and error state management

See `WalletAnalytics.tsx` for an example of migrating an existing component to use the new error handling system.
