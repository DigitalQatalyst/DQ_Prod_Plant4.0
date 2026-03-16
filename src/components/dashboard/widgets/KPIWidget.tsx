import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Widget } from "@/types/dashboard";
import { BaseWidget, createWidgetError, createWidgetEmpty, BaseWidgetProps } from "./BaseWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { getWidgetData, KPIWidgetData, WidgetConfigError } from "@/lib/widgetDataResolvers";
import { cn } from "@/lib/utils";

interface KPIWidgetProps extends BaseWidgetProps {
  tenantId: string;
}

/**
 * KPI Widget Component
 * Displays a single numeric value with optional trend indicator
 * 
 * Requirements: 7.2, 12.1, 14.4
 */
function KPIWidgetInternal({ widget, tenantId, onAction, className }: KPIWidgetProps) {
  // Fetch widget data
  let data: KPIWidgetData | null = null;
  let error = null;

  try {
    const result = getWidgetData(widget, tenantId);
    if (result && 'value' in result) {
      data = result as KPIWidgetData;
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
  if (!data) {
    return (
      <BaseWidget
        widget={widget}
        empty={createWidgetEmpty("No data available", "Unable to retrieve KPI data")}
        onAction={onAction}
        className={className}
      />
    );
  }

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!data.trend) return null;
    
    const trendLower = data.trend.toLowerCase();
    if (trendLower.startsWith('+') || trendLower.includes('up') || trendLower.includes('increase')) {
      return <TrendingUp className="w-4 h-4" />;
    } else if (trendLower.startsWith('-') || trendLower.includes('down') || trendLower.includes('decrease')) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!data.trend) return "text-muted-foreground";
    
    const trendLower = data.trend.toLowerCase();
    if (trendLower.startsWith('+') || trendLower.includes('up') || trendLower.includes('increase')) {
      return "text-success";
    } else if (trendLower.startsWith('-') || trendLower.includes('down') || trendLower.includes('decrease')) {
      return "text-destructive";
    }
    return "text-muted-foreground";
  };

  // Render KPI content
  return (
    <BaseWidget widget={widget} onAction={onAction} className={className}>
      <div className="flex flex-col space-y-4">
        {/* Main KPI Value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-foreground">
              {data.value.toLocaleString()}
              {data.unit && <span className="text-2xl text-muted-foreground ml-1">{data.unit}</span>}
            </p>
          </div>

          {/* Trend Indicator */}
          {data.trend && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{data.trend}</span>
            </div>
          )}
        </div>

        {/* Trend Label */}
        {data.trendLabel && (
          <p className="text-xs text-muted-foreground">{data.trendLabel}</p>
        )}
      </div>
    </BaseWidget>
  );
}

/**
 * KPI Widget wrapped in error boundary
 */
export function KPIWidget(props: KPIWidgetProps) {
  return (
    <WidgetErrorBoundary widgetId={props.widget.id} widgetTitle={props.widget.title}>
      <KPIWidgetInternal {...props} />
    </WidgetErrorBoundary>
  );
}
