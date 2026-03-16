import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, SlidersHorizontal, AlertTriangle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyStates } from "@/components/shared/EmptyState";
import { ContentErrorHandler } from "@/lib/errorHandling";

interface ErrorAwareListPaneProps {
  title: string;
  subtitle?: string;
  count?: number;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showFilters?: boolean;
  children: ReactNode;
  actions?: ReactNode;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  contentType?: string;
  className?: string;
}

/**
 * Enhanced ListPane with comprehensive error handling and loading states
 * Provides graceful degradation for content loading failures and navigation errors
 * 
 * Requirements: All requirements (error handling support)
 */
export function ErrorAwareListPane({
  title,
  subtitle,
  count,
  searchPlaceholder = "Search...",
  onSearch,
  showFilters = true,
  children,
  actions,
  isLoading = false,
  error = null,
  onRetry,
  contentType = "content",
  className,
}: ErrorAwareListPaneProps) {
  const handleSearchError = (searchError: Error) => {
    ContentErrorHandler.handleContentLoadingFailure(
      "search_results",
      searchError,
      onRetry
    );
  };

  const handleFilterError = (filterError: Error) => {
    ContentErrorHandler.handleContentLoadingFailure(
      "filtered_content",
      filterError,
      onRetry
    );
  };

  const safeOnSearch = (query: string) => {
    try {
      onSearch?.(query);
    } catch (searchError) {
      handleSearchError(searchError instanceof Error ? searchError : new Error(String(searchError)));
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        ContentErrorHandler.handleContentLoadingFailure(
          "list_pane",
          error,
          onRetry
        );
      }}
      resetKeys={[title, subtitle, count]}
      resetOnPropsChange={true}
    >
      <div className={cn("w-80 bg-pane-list border-r border-border flex flex-col shrink-0 min-w-80 h-full overflow-hidden", className)} style={{ minWidth: "320px" }}>
        {/* Header */}
        <div className="pane-header flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {count !== undefined && !error && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {count}
              </span>
            )}
            {error && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                <span>Error</span>
              </div>
            )}
          </div>
          {actions && <div className="w-full">{actions}</div>}
        </div>

        {/* Search & Filters */}
        {showFilters && !error && (
          <ErrorBoundary
            fallback={
              <div className="px-3 py-2 border-b border-border/50">
                <div className="text-xs text-muted-foreground text-center py-2">
                  Search temporarily unavailable
                </div>
              </div>
            }
          >
            <div className="px-3 py-2 border-b border-border/50 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-8 h-8 text-sm bg-secondary/50 border-border/50"
                  onChange={(e) => safeOnSearch(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  disabled={isLoading}
                  onClick={() => {
                    try {
                      // Filter functionality would go here
                    } catch (filterError) {
                      handleFilterError(filterError instanceof Error ? filterError : new Error(String(filterError)));
                    }
                  }}
                >
                  <Filter className="w-3 h-3" />
                  Filter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  disabled={isLoading}
                  onClick={() => {
                    try {
                      // Sort functionality would go here
                    } catch (sortError) {
                      handleFilterError(sortError instanceof Error ? sortError : new Error(String(sortError)));
                    }
                  }}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Sort
                </Button>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* List Content with Error Handling */}
        <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
          <div className="p-2 space-y-1">
            <LoadingState
              isLoading={isLoading}
              error={error}
              onRetry={onRetry}
              loadingText={`Loading ${contentType}...`}
              errorText={`Failed to load ${contentType}. Please try again.`}
              size="sm"
            >
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    size="sm"
                    title="Content Error"
                    description={`Unable to display ${contentType}. Please refresh the page.`}
                    action={{
                      label: "Retry",
                      onClick: onRetry || (() => window.location.reload()),
                      variant: "outline",
                    }}
                  />
                }
                onError={(error) => {
                  ContentErrorHandler.handleContentLoadingFailure(
                    contentType,
                    error,
                    onRetry
                  );
                }}
              >
                {children}
              </ErrorBoundary>
            </LoadingState>
          </div>
        </div>

        {/* Error Recovery Actions */}
        {error && onRetry && (
          <div className="p-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

/**
 * Hook for managing list pane error states
 */
export function useListPaneErrorHandling(contentType: string = "content") {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | string | null>(null);

  const handleAsyncOperation = React.useCallback(async (
    operation: () => Promise<void>,
    operationType: string = "operation"
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      ContentErrorHandler.handleContentLoadingFailure(
        `${contentType}_${operationType}`,
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [contentType]);

  const retry = React.useCallback((operation: () => Promise<void>) => {
    return () => handleAsyncOperation(operation, "retry");
  }, [handleAsyncOperation]);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleAsyncOperation,
    retry,
    reset,
  };
}