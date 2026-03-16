import React from "react";
import { Widget } from "@/types/dashboard";
import { BaseWidget, createWidgetError, createWidgetEmpty, BaseWidgetProps } from "./BaseWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { getWidgetData, StatusBoardWidgetData, WidgetConfigError } from "@/lib/widgetDataResolvers";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBoardWidgetProps extends BaseWidgetProps {
  tenantId: string;
}

/**
 * Status Board Widget Component
 * Displays status counts grouped by category (e.g., severity, status)
 * 
 * Requirements: 7.2, 12.2, 14.4
 */
function StatusBoardWidgetInternal({ widget, tenantId, onAction, className }: StatusBoardWidgetProps) {
  // Fetch widget data
  let data: StatusBoardWidgetData | null = null;
  let error = null;

  try {
    const result = getWidgetData(widget, tenantId);
    if (result && 'categories' in result) {
      data = result as StatusBoardWidgetData;
    }
  } catch (err) {
    if (err instanceof WidgetConfigError) {
      error = createWidgetError("config_error", err.message);
    } else {
      error = createWidgetError("data_error", err instanceof Error ? err.message : "Failed to load widget data");
    }
  }

  // Handle error state
  if (error) {
    return <BaseWidget widget={widget} error={error} onAction={onAction} className={className} />;
  }

  // Handle empty state
  if (!data || data.categories.length === 0) {
    return (
      <BaseWidget
        widget={widget}
        empty={createWidgetEmpty("No status data available", "No items to display")}
        onAction={onAction}
        className={className}
      />
    );
  }

  // Get badge variant based on status
  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusLower = status.toLowerCase();
    
    // Severity-based
    if (statusLower === "critical") return "destructive";
    if (statusLower === "warning") return "default";
    if (statusLower === "info") return "secondary";
    
    // Status-based
    if (statusLower === "offline" || statusLower === "closed") return "destructive";
    if (statusLower === "online" || statusLower === "open") return "default";
    if (statusLower === "maintenance" || statusLower === "pending") return "secondary";
    if (statusLower === "in-progress" || statusLower === "acknowledged") return "outline";
    
    // Compliance-based
    if (statusLower === "compliant") return "default";
    if (statusLower === "non-compliant") return "destructive";
    
    return "outline";
  };

  // Get color indicator for status
  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    // Severity-based
    if (statusLower === "critical") return "bg-destructive";
    if (statusLower === "warning") return "bg-warning";
    if (statusLower === "info") return "bg-blue-500";
    
    // Status-based
    if (statusLower === "offline") return "bg-destructive";
    if (statusLower === "online") return "bg-success";
    if (statusLower === "maintenance") return "bg-purple-500";
    if (statusLower === "pending") return "bg-warning";
    if (statusLower === "in-progress") return "bg-blue-500";
    if (statusLower === "acknowledged") return "bg-yellow-500";
    if (statusLower === "open") return "bg-success";
    if (statusLower === "closed") return "bg-muted";
    
    // Compliance-based
    if (statusLower === "compliant") return "bg-success";
    if (statusLower === "non-compliant") return "bg-destructive";
    if (statusLower === "pending-review") return "bg-warning";
    
    return "bg-muted";
  };

  // Render status board content
  return (
    <BaseWidget widget={widget} onAction={onAction} className={className}>
      <div className="grid grid-cols-1 gap-3">
        {data.categories.map((category, index) => (
          <div
            key={`${category.status}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Status indicator dot */}
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(category.status))} />
              
              {/* Label */}
              <span className="text-sm font-medium">{category.label}</span>
            </div>

            {/* Count badge */}
            <Badge variant={getBadgeVariant(category.status)} className="font-semibold">
              {category.count}
            </Badge>
          </div>
        ))}
      </div>

      {/* Total count summary */}
      {data.categories.length > 1 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">
              {data.categories.reduce((sum, cat) => sum + cat.count, 0)}
            </span>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}

/**
 * Status Board Widget wrapped in error boundary
 */
export function StatusBoardWidget(props: StatusBoardWidgetProps) {
  return (
    <WidgetErrorBoundary widgetId={props.widget.id} widgetTitle={props.widget.title}>
      <StatusBoardWidgetInternal {...props} />
    </WidgetErrorBoundary>
  );
}
