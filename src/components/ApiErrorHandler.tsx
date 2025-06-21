// API Error Handler Component
// Provides standardized error display with retry functionality for API failures

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, Wifi, Lock, Server, Clock, HelpCircle } from 'lucide-react';
import { ApiError, ApiErrorType, getErrorDisplayInfo } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

export interface ApiErrorHandlerProps {
  error: ApiError | null;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  className?: string;
  variant?: 'alert' | 'card' | 'inline';
  showDetails?: boolean;
  customRetryText?: string;
  hideRetryButton?: boolean;
}

const ErrorIcon = ({ type }: { type: ApiErrorType }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case ApiErrorType.NETWORK:
      return <Wifi {...iconProps} />;
    case ApiErrorType.AUTHORIZATION:
      return <Lock {...iconProps} />;
    case ApiErrorType.SERVER:
      return <Server {...iconProps} />;
    case ApiErrorType.TIMEOUT:
      return <Clock {...iconProps} />;
    case ApiErrorType.VALIDATION:
      return <AlertTriangle {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
};

export const ApiErrorHandler: React.FC<ApiErrorHandlerProps> = ({
  error,
  onRetry,
  isRetrying = false,
  className,
  variant = 'alert',
  showDetails = false,
  customRetryText,
  hideRetryButton = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  const displayInfo = getErrorDisplayInfo(error);
  const canRetry = displayInfo.canRetry && onRetry && !hideRetryButton;

  const handleRetry = async () => {
    if (onRetry) {
      await onRetry();
    }
  };

  const ErrorContent = () => (
    <>
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0 mt-0.5", displayInfo.color)}>
          <ErrorIcon type={error.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayInfo.title}
            </h4>
            <div className="flex items-center space-x-2">
              {error.statusCode && (
                <Badge variant="outline" className="text-xs">
                  {error.statusCode}
                </Badge>
              )}
              <Badge 
                variant={error.retryable ? "default" : "destructive"} 
                className="text-xs"
              >
                {error.retryable ? "Retryable" : "Non-retryable"}
              </Badge>
            </div>
          </div>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {error.message}
          </p>

          {showDetails && error.details && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs p-0 h-auto"
              >
                {isExpanded ? 'Hide' : 'Show'} Details
              </Button>
              
              {isExpanded && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {canRetry && (
            <div className="mt-3 flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="text-xs"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {customRetryText || 'Retry'}
                  </>
                )}
              </Button>
              
              <span className="text-xs text-gray-500">
                Last attempt: {error.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (variant === 'card') {
    return (
      <Card className={cn("border-red-200 dark:border-red-800", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-800 dark:text-red-200">
            API Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ErrorContent />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("p-3 rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950", className)}>
        <ErrorContent />
      </div>
    );
  }

  // Default alert variant
  return (
    <Alert variant="destructive" className={className}>
      <ErrorIcon type={error.type} />
      <AlertTitle>{displayInfo.title}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{error.message}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {error.statusCode && (
                <Badge variant="outline" className="text-xs">
                  {error.statusCode}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {error.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="text-xs"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {customRetryText || 'Retry'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ApiErrorHandler;
