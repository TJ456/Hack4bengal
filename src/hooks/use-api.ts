// Custom React Hook for API calls with integrated error handling
// Provides state management, automatic retries, and error handling

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, ApiRequestConfig, ApiResponse } from '@/lib/api-service';
import { ApiError } from '@/lib/api-errors';
import { useToast } from '@/hooks/use-toast';

export interface UseApiOptions<T> extends Omit<ApiRequestConfig, 'method' | 'body'> {
  immediate?: boolean; // Whether to execute immediately on mount
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  showToastOnError?: boolean;
  showToastOnSuccess?: boolean;
  successMessage?: string;
}

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  isRetrying: boolean;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (body?: any) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for GET requests
 */
export function useApiGet<T = any>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  return useApi<T>('GET', endpoint, options);
}

/**
 * Hook for POST requests
 */
export function useApiPost<T = any>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  return useApi<T>('POST', endpoint, options);
}

/**
 * Hook for PUT requests
 */
export function useApiPut<T = any>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  return useApi<T>('PUT', endpoint, options);
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<T = any>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  return useApi<T>('DELETE', endpoint, options);
}

/**
 * Main API hook that handles all HTTP methods
 */
export function useApi<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    immediate = method === 'GET',
    onSuccess,
    onError,
    showToastOnError = false,
    showToastOnSuccess = false,
    successMessage,
    ...requestConfig
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    isRetrying: false
  });

  const lastBodyRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (body?: any) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastBodyRef.current = body;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isRetrying: false
    }));

    try {
      let response: ApiResponse<T>;

      const config = {
        ...requestConfig,
        signal: abortControllerRef.current.signal
      };

      switch (method) {
        case 'GET':
          response = await apiService.get<T>(endpoint, config);
          break;
        case 'POST':
          response = await apiService.post<T>(endpoint, body, config);
          break;
        case 'PUT':
          response = await apiService.put<T>(endpoint, body, config);
          break;
        case 'DELETE':
          response = await apiService.delete<T>(endpoint, config);
          break;
        case 'PATCH':
          response = await apiService.patch<T>(endpoint, body, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        error: null
      }));

      // Success callbacks
      if (onSuccess) {
        onSuccess(response.data);
      }

      if (showToastOnSuccess) {
        toast({
          title: "Success",
          description: successMessage || "Operation completed successfully",
          variant: "default"
        });
      }

    } catch (error) {
      // Don't update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const apiError = error as ApiError;

      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }));

      // Error callbacks
      if (onError) {
        onError(apiError);
      }

      if (showToastOnError) {
        toast({
          title: "Error",
          description: apiError.message,
          variant: "destructive"
        });
      }
    }
  }, [endpoint, method, requestConfig, onSuccess, onError, showToastOnError, showToastOnSuccess, successMessage, toast]);

  const retry = useCallback(async () => {
    if (!state.error) return;

    setState(prev => ({
      ...prev,
      isRetrying: true
    }));

    await execute(lastBodyRef.current);

    setState(prev => ({
      ...prev,
      isRetrying: false
    }));
  }, [execute, state.error]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
      isRetrying: false
    });
  }, []);

  // Execute immediately if requested (typically for GET requests)
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate]); // Only depend on immediate, not execute to avoid re-running

  return {
    ...state,
    execute,
    retry,
    reset
  };
}

/**
 * Hook for making multiple API calls in parallel
 */
export function useApiMultiple<T = any>(
  requests: Array<{ method: string; endpoint: string; body?: any }>,
  options: UseApiOptions<T[]> = {}
): UseApiReturn<T[]> {
  const [state, setState] = useState<UseApiState<T[]>>({
    data: null,
    loading: false,
    error: null,
    isRetrying: false
  });

  const { onSuccess, onError, showToastOnError = false } = options;
  const { toast } = useToast();

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const promises = requests.map(({ method, endpoint, body }) => {
        switch (method.toUpperCase()) {
          case 'GET':
            return apiService.get(endpoint);
          case 'POST':
            return apiService.post(endpoint, body);
          case 'PUT':
            return apiService.put(endpoint, body);
          case 'DELETE':
            return apiService.delete(endpoint);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      });

      const responses = await Promise.all(promises);
      const data = responses.map(response => response.data);

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null
      }));

      if (onSuccess) {
        onSuccess(data);
      }

    } catch (error) {
      const apiError = error as ApiError;

      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }));

      if (onError) {
        onError(apiError);
      }

      if (showToastOnError) {
        toast({
          title: "Error",
          description: apiError.message,
          variant: "destructive"
        });
      }
    }
  }, [requests, onSuccess, onError, showToastOnError, toast]);

  const retry = useCallback(async () => {
    setState(prev => ({ ...prev, isRetrying: true }));
    await execute();
    setState(prev => ({ ...prev, isRetrying: false }));
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isRetrying: false
    });
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset
  };
}
