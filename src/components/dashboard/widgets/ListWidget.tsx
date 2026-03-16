import React from "react";
import { Widget } from "@/types/dashboard";
import { BaseWidget, createWidgetError, createWidgetEmpty, BaseWidgetProps } from "./BaseWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { getWidgetData, ListWidgetData, WidgetConfigError } from "@/lib/widgetDataResolvers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ListWidgetProps extends BaseWidgetProps {
  tenantId: string;
}

/**
 * List Widget Component
 * Displays a scrollable list of items with configurable columns
 * 
 * Requirements: 7.2, 12.3, 14.4
 */
function ListWidgetInternal({ widget, tenantId, onAction, className }: ListWidgetProps) {
  // Fetch widget data
  let data: ListWidgetData | null = null;
  let error = null;

  try {
    const result = getWidgetData(widget, tenantId);
    if (result && 'items' in result && 'columns' in result) {
      data = result as ListWidgetData;
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
  if (!data || data.items.length === 0) {
    return (
      <BaseWidget
        widget={widget}
        empty={createWidgetEmpty("No items to display", "The list is currently empty")}
        onAction={onAction}
        className={className}
      />
    );
  }

  // Format cell value for display
  const formatCellValue = (value: any, columnKey: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    // Handle status/severity with badges
    if (columnKey === "status" || columnKey === "severity") {
      const variant = 
        value === "critical" || value === "offline" ? "destructive" :
        value === "warning" || value === "maintenance" ? "default" :
        value === "online" || value === "open" ? "default" :
        "secondary";
      
      return (
        <Badge variant={variant} className="text-xs">
          {String(value)}
        </Badge>
      );
    }

    // Handle dates
    if (columnKey.includes("At") || columnKey.includes("Date") || columnKey === "lastSeen") {
      try {
        const date = new Date(value);
        return date.toLocaleString();
      } catch {
        return String(value);
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Format column header
  const formatColumnHeader = (columnKey: string): string => {
    // Convert camelCase to Title Case
    return columnKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Render list content
  return (
    <BaseWidget widget={widget} onAction={onAction} className={className}>
      <ScrollArea className="h-[300px] w-full" role="region" aria-label="Scrollable list">
        <div className="space-y-2" role="list">
          {data.items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              role="listitem"
            >
              <div className="grid gap-2">
                {data.columns.map((columnKey) => (
                  <div key={columnKey} className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
                      {formatColumnHeader(columnKey)}
                    </span>
                    <span className="text-sm text-right flex-1">
                      {formatCellValue(item[columnKey], columnKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Show count info if there are more items */}
      {data.totalCount > data.items.length && (
        <div className="mt-4 pt-4 border-t" role="status">
          <p className="text-xs text-muted-foreground text-center">
            Showing {data.items.length} of {data.totalCount} items
          </p>
        </div>
      )}
    </BaseWidget>
  );
}

/**
 * List Widget wrapped in error boundary
 */
export function ListWidget(props: ListWidgetProps) {
  return (
    <WidgetErrorBoundary widgetId={props.widget.id} widgetTitle={props.widget.title}>
      <ListWidgetInternal {...props} />
    </WidgetErrorBoundary>
  );
}
