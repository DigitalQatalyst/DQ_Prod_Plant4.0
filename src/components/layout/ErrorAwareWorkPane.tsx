import React, { ReactNode, useState } from "react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyStates } from "@/components/shared/EmptyState";
import { ContentErrorHandler, TemplateErrorHandler } from "@/lib/errorHandling";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
}

interface ErrorAwareWorkPaneProps {
  title: string;
  subtitle?: string;
  tabs: Tab[];
  defaultTab?: string;
  actions?: ReactNode;
  headerContent?: ReactNode;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  contentType?: string;
  className?: string;
}

/**
 * Enhanced WorkPane with comprehensive error handling for tab loading failures
 * Provides graceful degradation and recovery options for work pane content
 * 
 * Requirements: All requirements (error handling support)
 */
export function ErrorAwareWorkPane({
  title,
  subtitle,
  tabs,
  defaultTab,
  actions,
  headerContent,
  isLoading = false,
  error = null,
  onRetry,
  contentType = "work_pane_content",
  className,
}: ErrorAwareWorkPaneProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [tabErrors, setTabErrors] = useState<Record<string, Error | string | null>>({});
  const [tabLoadingStates, setTabLoadingStates] = useState<Record<string, boolean>>({});

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const activeTabContent = activeTabData?.content;
  const activeTabError = activeTabData?.error || tabErrors[activeTab];
  const activeTabLoading = activeTabData?.isLoading || tabLoadingStates[activeTab];

  const handleTabError = (tabId: string, error: Error) => {
    setTabErrors(prev => ({ ...prev, [tabId]: error }));
    ContentErrorHandler.handleContentLoadingFailure(
      `tab_${tabId}`,
      error,
      activeTabData?.onRetry
    );
  };

  const handleTabSwitch = (tabId: string) => {
    try {
      const tab = tabs.find(t => t.id === tabId);
      if (tab && !tab.disabled) {
        setActiveTab(tabId);
        // Clear previous error when switching tabs
        setTabErrors(prev => ({ ...prev, [tabId]: null }));
      }
    } catch (error) {
      handleTabError(tabId, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const retryActiveTab = () => {
    if (activeTabData?.onRetry) {
      activeTabData.onRetry();
    } else if (onRetry) {
      onRetry();
    } else {
      // Clear error and attempt to re-render
      setTabErrors(prev => ({ ...prev, [activeTab]: null }));
    }
  };

  // Handle overall work pane error
  if (error) {
    return (
      <div className="flex-1 bg-pane-work flex flex-col min-w-0 w-full">
        <div className="pane-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {title}
            </h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <EmptyStates.Error
            title="Unable to Load Work Pane"
            description={typeof error === "string" ? error : error.message}
            action={{
              label: "Try Again",
              onClick: onRetry || (() => window.location.reload()),
              variant: "outline",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        ContentErrorHandler.handleContentLoadingFailure(
          contentType,
          error,
          onRetry
        );
      }}
      resetKeys={[title, subtitle, activeTab]}
      resetOnPropsChange={true}
    >
      <div className={cn("flex-1 bg-pane-work flex flex-col min-w-0 w-full h-full overflow-hidden", className)}>
        {/* Header */}
        <ErrorBoundary
          fallback={
            <div className="pane-header">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Error Loading Header
                </h2>
                <p className="text-sm text-muted-foreground">Header content unavailable</p>
              </div>
            </div>
          }
        >
          <div className="pane-header">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && (
              <ErrorBoundary
                fallback={
                  <div className="text-xs text-muted-foreground">Actions unavailable</div>
                }
              >
                <div className="flex items-center gap-2">{actions}</div>
              </ErrorBoundary>
            )}
          </div>
        </ErrorBoundary>

        {headerContent && (
          <ErrorBoundary
            fallback={
              <div className="px-4 py-3 border-b border-border/50 text-xs text-muted-foreground">
                Header content unavailable
              </div>
            }
          >
            <div className="px-4 py-3 border-b border-border/50">{headerContent}</div>
          </ErrorBoundary>
        )}

        {/* Tab Bar */}
        <ErrorBoundary
          fallback={
            <div className="border-b border-border px-4 py-3">
              <div className="text-xs text-muted-foreground">Navigation unavailable</div>
            </div>
          }
        >
          <div className="border-b border-border px-4 flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => {
              const hasError = tab.error || tabErrors[tab.id];
              const isTabLoading = tab.isLoading || tabLoadingStates[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  disabled={tab.disabled || isTabLoading}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-2",
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : tab.disabled || isTabLoading
                        ? "text-muted-foreground/50 border-transparent cursor-not-allowed"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
                    hasError && "text-destructive"
                  )}
                >
                  {tab.label}
                  {hasError && <AlertTriangle className="w-3 h-3" />}
                  {isTabLoading && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
                </button>
              );
            })}
          </div>
        </ErrorBoundary>

        {/* Tab Content */}
        <div className="flex-1 w-full overflow-y-auto scrollbar-thin min-h-0">
          <div className="p-4">
            <LoadingState
              isLoading={isLoading || activeTabLoading}
              error={activeTabError}
              onRetry={retryActiveTab}
              loadingText={`Loading ${activeTabData?.label || 'content'}...`}
              errorText={`Failed to load ${activeTabData?.label || 'content'}.`}
            >
              <ErrorBoundary
                key={activeTab} // Force remount on tab change
                fallback={
                  <EmptyStates.Error
                    title="Tab Content Error"
                    description={`Unable to display content for the ${activeTabData?.label || 'current'} tab.`}
                    action={{
                      label: "Retry Tab",
                      onClick: retryActiveTab,
                      variant: "outline",
                    }}
                  />
                }
                onError={(error) => handleTabError(activeTab, error)}
              >
                {activeTabContent}
              </ErrorBoundary>
            </LoadingState>
          </div>
        </div>

        {/* Error Recovery Footer */}
        {(activeTabError || Object.values(tabErrors).some(Boolean)) && (
          <div className="border-t border-border/50 p-3 bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span>Some content may not be available</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTabErrors({})}
                  className="text-xs"
                >
                  Clear Errors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryActiveTab}
                  className="gap-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

/**
 * Hook for managing work pane tab error states
 */
export function useWorkPaneErrorHandling() {
  const [tabStates, setTabStates] = useState<Record<string, {
    isLoading: boolean;
    error: Error | string | null;
  }>>({});

  const setTabLoading = React.useCallback((tabId: string, isLoading: boolean) => {
    setTabStates(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isLoading }
    }));
  }, []);

  const setTabError = React.useCallback((tabId: string, error: Error | string | null) => {
    setTabStates(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], error, isLoading: false }
    }));
  }, []);

  const handleTabAsyncOperation = React.useCallback(async (
    tabId: string,
    operation: () => Promise<void>,
    operationType: string = "operation"
  ) => {
    try {
      setTabLoading(tabId, true);
      setTabError(tabId, null);
      await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setTabError(tabId, error);
      ContentErrorHandler.handleContentLoadingFailure(
        `tab_${tabId}_${operationType}`,
        error
      );
    } finally {
      setTabLoading(tabId, false);
    }
  }, [setTabLoading, setTabError]);

  const retryTab = React.useCallback((tabId: string, operation: () => Promise<void>) => {
    return () => handleTabAsyncOperation(tabId, operation, "retry");
  }, [handleTabAsyncOperation]);

  const clearTabError = React.useCallback((tabId: string) => {
    setTabError(tabId, null);
  }, [setTabError]);

  const getTabState = React.useCallback((tabId: string) => {
    return tabStates[tabId] || { isLoading: false, error: null };
  }, [tabStates]);

  return {
    tabStates,
    setTabLoading,
    setTabError,
    handleTabAsyncOperation,
    retryTab,
    clearTabError,
    getTabState,
  };
}