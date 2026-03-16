import React, { ReactNode } from "react";
import { AlertCircle, Database, MoreVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Widget } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export interface BaseWidgetProps {
  widget: Widget;
  children?: ReactNode;
  onAction?: (action: string, payload?: any) => void;
  className?: string;
}

export interface WidgetErrorState {
  type: "config_error" | "data_error" | "render_error";
  message: string;
}

export interface WidgetEmptyState {
  message: string;
  description?: string;
}

interface BaseWidgetInternalProps extends BaseWidgetProps {
  error?: WidgetErrorState;
  empty?: WidgetEmptyState;
  loading?: boolean;
}

/**
 * Base widget component that provides common wrapper functionality for all widget types.
 * Includes card layout, title, actions menu, error states, and empty states.
 * 
 * Requirements: 7.5, 14.4
 */
export function BaseWidget({
  widget,
  children,
  onAction,
  error,
  empty,
  loading = false,
  className,
}: BaseWidgetInternalProps) {
  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, { widgetId: widget.id });
    }
  };

  // Render error state
  if (error) {
    return (
      <Card className={cn("widget-card", className)} role="region" aria-label={`Widget: ${widget.title}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{widget.title}</CardTitle>
              {widget.description && (
                <CardDescription>{widget.description}</CardDescription>
              )}
            </div>
            {widget.featureArea !== "cross" && (
              <Badge variant="outline" className="ml-2 text-xs" aria-label={`Feature area: ${widget.featureArea}`}>
                {widget.featureArea}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>
              {error.type === "config_error" && "Configuration Error"}
              {error.type === "data_error" && "Data Error"}
              {error.type === "render_error" && "Rendering Error"}
            </AlertTitle>
            <AlertDescription>
              <p className="text-sm">{error.message}</p>
              {error.type === "config_error" && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Please check the widget configuration and ensure all required
                  properties are present.
                </p>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (empty) {
    return (
      <Card className={cn("widget-card", className)} role="region" aria-label={`Widget: ${widget.title}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{widget.title}</CardTitle>
              {widget.description && (
                <CardDescription>{widget.description}</CardDescription>
              )}
            </div>
            {widget.featureArea !== "cross" && (
              <Badge variant="outline" className="ml-2 text-xs" aria-label={`Feature area: ${widget.featureArea}`}>
                {widget.featureArea}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center" role="status">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">
              {empty.message}
            </p>
            {empty.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {empty.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render normal widget with content
  return (
    <Card className={cn("widget-card", className)} role="region" aria-label={`Widget: ${widget.title}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{widget.title}</CardTitle>
            {widget.description && (
              <CardDescription>{widget.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {widget.featureArea !== "cross" && (
              <Badge variant="outline" className="text-xs" aria-label={`Feature area: ${widget.featureArea}`}>
                {widget.featureArea}
              </Badge>
            )}
            {onAction && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label={`Widget actions for ${widget.title}`}
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {widget.featureArea !== "overview" && (
                    <DropdownMenuItem 
                      onClick={() => handleAction("pin")}
                      aria-label="Pin this widget to overview dashboard"
                    >
                      Pin to Overview
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleAction("open")}
                    aria-label="Open this widget in its feature area workspace"
                  >
                    Open in Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAction("refresh")}
                    aria-label="Refresh widget data"
                  >
                    Refresh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-label="Loading widget data">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to create error state for widgets
 */
export function createWidgetError(
  type: WidgetErrorState["type"],
  message: string
): WidgetErrorState {
  return { type, message };
}

/**
 * Helper function to create empty state for widgets
 */
export function createWidgetEmpty(
  message: string,
  description?: string
): WidgetEmptyState {
  return { message, description };
}
