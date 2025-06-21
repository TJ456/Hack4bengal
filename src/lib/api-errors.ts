// API Error Types and Utilities for Wallet Application
// Provides standardized error handling for all API interactions

export enum ApiErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation', 
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Classifies HTTP response errors into specific error types
 */
export function classifyApiError(response?: Response, error?: Error): ApiErrorType {
  // Network errors (no response)
  if (!response && error) {
    if (error.name === 'AbortError') {
      return ApiErrorType.TIMEOUT;
    }
    if (error.message.includes('fetch')) {
      return ApiErrorType.NETWORK;
    }
  }

  // HTTP status code based classification
  if (response) {
    const status = response.status;
    
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) {
        return ApiErrorType.AUTHORIZATION;
      }
      if (status === 400 || status === 422) {
        return ApiErrorType.VALIDATION;
      }
    }
    
    if (status >= 500) {
      return ApiErrorType.SERVER;
    }
  }

  return ApiErrorType.UNKNOWN;
}

/**
 * Determines if an error is retryable based on its type
 */
export function isRetryableError(errorType: ApiErrorType): boolean {
  switch (errorType) {
    case ApiErrorType.NETWORK:
    case ApiErrorType.TIMEOUT:
    case ApiErrorType.SERVER:
      return true;
    case ApiErrorType.AUTHORIZATION:
    case ApiErrorType.VALIDATION:
    case ApiErrorType.UNKNOWN:
      return false;
    default:
      return false;
  }
}

/**
 * Creates a standardized API error object
 */
export function createApiError(
  response?: Response,
  error?: Error,
  customMessage?: string
): ApiError {
  const type = classifyApiError(response, error);
  
  let message = customMessage || 'An unexpected error occurred';
  
  // Generate appropriate error messages
  switch (type) {
    case ApiErrorType.NETWORK:
      message = 'Network connection failed. Please check your internet connection.';
      break;
    case ApiErrorType.TIMEOUT:
      message = 'Request timed out. Please try again.';
      break;
    case ApiErrorType.AUTHORIZATION:
      message = 'Authentication failed. Please reconnect your wallet.';
      break;
    case ApiErrorType.VALIDATION:
      message = 'Invalid request data. Please check your input.';
      break;
    case ApiErrorType.SERVER:
      message = 'Server error occurred. Please try again later.';
      break;
  }

  return {
    type,
    message,
    statusCode: response?.status,
    details: error,
    retryable: isRetryableError(type),
    timestamp: new Date()
  };
}

/**
 * Calculates delay for retry attempts with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Gets user-friendly error messages for different error types
 */
export function getErrorDisplayInfo(error: ApiError) {
  const icons = {
    [ApiErrorType.NETWORK]: '🌐',
    [ApiErrorType.VALIDATION]: '⚠️',
    [ApiErrorType.AUTHORIZATION]: '🔒',
    [ApiErrorType.SERVER]: '🔧',
    [ApiErrorType.TIMEOUT]: '⏱️',
    [ApiErrorType.UNKNOWN]: '❓'
  };

  const colors = {
    [ApiErrorType.NETWORK]: 'text-blue-600',
    [ApiErrorType.VALIDATION]: 'text-yellow-600',
    [ApiErrorType.AUTHORIZATION]: 'text-red-600',
    [ApiErrorType.SERVER]: 'text-orange-600',
    [ApiErrorType.TIMEOUT]: 'text-purple-600',
    [ApiErrorType.UNKNOWN]: 'text-gray-600'
  };

  return {
    icon: icons[error.type],
    color: colors[error.type],
    title: error.type.charAt(0).toUpperCase() + error.type.slice(1) + ' Error',
    canRetry: error.retryable
  };
}
