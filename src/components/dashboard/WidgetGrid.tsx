import React from "react";
import { Widget, WidgetType } from "@/types/dashboard";
import {
  KPIWidget,
  StatusBoardWidget,
  ListWidget,
  TableWidget,
} from "./widgets";
import { useApp } from "@/context/AppContext";

export interface WidgetGridProps {
  widgets: Widget[];
  onPinToOverview?: (widgetId: string) => void;
  onOpenInWorkspace?: (widgetId: string) => void;
}

/**
 * WidgetGrid Component
 * Renders a responsive grid of dashboard widgets with appropriate actions
 * 
 * Requirements: 3.2, 3.3, 5.1, 5.4, 6.1
 */
export function WidgetGrid({
  widgets,
  onPinToOverview,
  onOpenInWorkspace,
}: WidgetGridProps) {
  const { currentTenant } = useApp();

  /**
   * Handle widget actions (pin, open, refresh)
   */
  const handleWidgetAction = (action: string, payload: any) => {
    const { widgetId } = payload;

    switch (action) {
      case "pin":
        if (onPinToOverview) {
          onPinToOverview(widgetId);
        }
        break;
      case "open":
        if (onOpenInWorkspace) {
          onOpenInWorkspace(widgetId);
        }
        break;
      case "refresh":
        // Future: implement widget refresh logic
        console.log("Refresh widget:", widgetId);
        break;
      default:
        console.warn("Unknown widget action:", action);
    }
  };

  /**
   * Render the appropriate widget component based on widget type
   */
  const renderWidget = (widget: Widget) => {
    const commonProps = {
      widget,
      tenantId: currentTenant.id,
      onAction: handleWidgetAction,
    };

    switch (widget.type) {
      case "kpi":
        return <KPIWidget key={widget.id} {...commonProps} />;
      
      case "statusBoard":
        return <StatusBoardWidget key={widget.id} {...commonProps} />;
      
      case "list":
        return <ListWidget key={widget.id} {...commonProps} />;
      
      case "table":
        return <TableWidget key={widget.id} {...commonProps} />;
      
      case "timeseries":
        // Future: implement timeseries widget
        return (
          <div key={widget.id} className="p-4 border rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Timeseries widget not yet implemented
            </p>
          </div>
        );
      
      case "custom":
        // Future: implement custom widget support
        return (
          <div key={widget.id} className="p-4 border rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Custom widget not yet implemented
            </p>
          </div>
        );
      
      default:
        return (
          <div key={widget.id} className="p-4 border rounded-lg bg-destructive/10">
            <p className="text-sm text-destructive">
              Unknown widget type: {widget.type}
            </p>
          </div>
        );
    }
  };

  // Handle empty state
  if (!widgets || widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-lg font-medium text-muted-foreground">
          No widgets to display
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This dashboard doesn't have any widgets configured yet.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="region"
      aria-label="Dashboard widgets"
    >
      {widgets.map((widget) => renderWidget(widget))}
    </div>
  );
}
