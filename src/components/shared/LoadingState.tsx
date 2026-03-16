import React from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  loadingText?: string;
  errorText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Loading state component with error handling for content loading failures
 * Provides consistent loading indicators and error recovery options
 * 
 * Requirements: All requirements (error handling support)
 */
export function LoadingState({
  isLoading = false,
  error = null,
  onRetry,
  loadingText = "Loading...",
  errorText,
  size = "md",
  className,
  children,
}: LoadingStateProps) {
  const sizeConfig = {
    sm: {
      container: "py-4",
      spinner: "w-4 h-4",
      text: "text-sm",
      button: "sm" as const,
    },
    md: {
      container: "py-8",
      spinner: "w-6 h-6",
      text: "text-base",
      button: "default" as const,
    },
    lg: {
      container: "py-12",
      spinner: "w-8 h-8",
      text: "text-lg",
      button: "default" as const,
    },
  };

  const config = sizeConfig[size];

  // Show error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    const displayText = errorText || errorMessage || "Failed to load content";

    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center text-center",
          config.container,
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 w-16 h-16">
          <AlertTriangle className={cn(config.spinner, "text-destructive")} aria-hidden="true" />
        </div>
        
        <h3 className={cn("font-semibold text-foreground mb-2", config.text)}>
          Unable to Load Content
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {displayText}
        </p>
        
        {onRetry && (
          <Button
            variant="outline"
            size={config.button}
            onClick={onRetry}
            className="gap-2"
            aria-label="Retry loading content"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center text-center",
          config.container,
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={loadingText}
      >
        <Loader2 className={cn(config.spinner, "animate-spin text-primary mb-4")} aria-hidden="true" />
        <p className={cn("text-muted-foreground", config.text)}>
          {loadingText}
        </p>
      </div>
    );
  }

  // Show children when not loading and no error
  return <>{children}</>;
}

/**
 * Suspense-compatible loading fallback component
 */
export function SuspenseLoadingFallback({ 
  text = "Loading...", 
  size = "md" 
}: { 
  text?: string; 
  size?: "sm" | "md" | "lg" 
}) {
  return <LoadingState isLoading={true} loadingText={text} size={size} />;
}

/**
 * Hook for managing loading and error states
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<Error | string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((error: Error | string) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const retry = React.useCallback((asyncFn: () => Promise<void>) => {
    return async () => {
      try {
        startLoading();
        await asyncFn();
        stopLoading();
      } catch (err) {
        setLoadingError(err instanceof Error ? err : new Error(String(err)));
      }
    };
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    reset,
    retry,
  };
}