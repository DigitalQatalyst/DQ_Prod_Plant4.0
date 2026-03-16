/**
 * Example demonstrating how to use BaseWidget and WidgetErrorBoundary
 * This file shows the three main states: normal, error, and empty
 */

import { Widget } from "@/types/dashboard";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { BaseWidget, createWidgetError, createWidgetEmpty } from "./BaseWidget";

// Example widget data
const exampleWidget: Widget = {
  id: "example-widget-1",
  type: "kpi",
  featureArea: "assets",
  title: "Example Widget",
  description: "This is an example widget",
  config: {
    metricKey: "totalAssets",
  },
};

// Example 1: Normal widget with content
export function NormalWidgetExample() {
  return (
    <WidgetErrorBoundary widgetId={exampleWidget.id} widgetTitle={exampleWidget.title}>
      <BaseWidget widget={exampleWidget} onAction={(action) => console.log("Action:", action)}>
        <div className="p-4">
          <p className="text-2xl font-bold">42</p>
          <p className="text-sm text-muted-foreground">Total Assets</p>
        </div>
      </BaseWidget>
    </WidgetErrorBoundary>
  );
}

// Example 2: Widget with error state
export function ErrorWidgetExample() {
  const errorWidget: Widget = {
    ...exampleWidget,
    id: "error-widget-1",
    title: "Widget with Error",
  };

  const error = createWidgetError(
    "config_error",
    "Missing required configuration property: metricKey"
  );

  return (
    <WidgetErrorBoundary widgetId={errorWidget.id} widgetTitle={errorWidget.title}>
      <BaseWidget widget={errorWidget} error={error}>
        {/* This content won't be rendered due to error state */}
      </BaseWidget>
    </WidgetErrorBoundary>
  );
}

// Example 3: Widget with empty state
export function EmptyWidgetExample() {
  const emptyWidget: Widget = {
    ...exampleWidget,
    id: "empty-widget-1",
    title: "Widget with No Data",
  };

  const empty = createWidgetEmpty(
    "No data available",
    "Try adjusting your filters or check back later"
  );

  return (
    <WidgetErrorBoundary widgetId={emptyWidget.id} widgetTitle={emptyWidget.title}>
      <BaseWidget widget={emptyWidget} empty={empty}>
        {/* This content won't be rendered due to empty state */}
      </BaseWidget>
    </WidgetErrorBoundary>
  );
}

// Example 4: Widget that throws an error (caught by ErrorBoundary)
export function CrashingWidgetExample() {
  const crashingWidget: Widget = {
    ...exampleWidget,
    id: "crashing-widget-1",
    title: "Widget that Crashes",
  };

  const CrashingContent = () => {
    // This will throw an error and be caught by WidgetErrorBoundary
    throw new Error("Simulated rendering error");
  };

  return (
    <WidgetErrorBoundary widgetId={crashingWidget.id} widgetTitle={crashingWidget.title}>
      <BaseWidget widget={crashingWidget}>
        <CrashingContent />
      </BaseWidget>
    </WidgetErrorBoundary>
  );
}

// Example 5: Loading state
export function LoadingWidgetExample() {
  const loadingWidget: Widget = {
    ...exampleWidget,
    id: "loading-widget-1",
    title: "Loading Widget",
  };

  return (
    <WidgetErrorBoundary widgetId={loadingWidget.id} widgetTitle={loadingWidget.title}>
      <BaseWidget widget={loadingWidget} loading={true}>
        {/* This content won't be rendered while loading */}
      </BaseWidget>
    </WidgetErrorBoundary>
  );
}
