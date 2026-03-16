import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetId?: string;
  widgetTitle?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component that catches rendering errors in widgets
 * and displays a user-friendly error state without breaking the entire dashboard.
 * 
 * Requirements: 7.5, 14.4
 */
export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error("Widget rendering error:", {
      widgetId: this.props.widgetId,
      widgetTitle: this.props.widgetTitle,
      error,
      errorInfo,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Widget Error</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  {this.props.widgetTitle
                    ? `Failed to render widget "${this.props.widgetTitle}"`
                    : "Failed to render widget"}
                </p>
                {this.state.error && (
                  <p className="text-xs font-mono bg-destructive/10 p-2 rounded">
                    {this.state.error.message}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
