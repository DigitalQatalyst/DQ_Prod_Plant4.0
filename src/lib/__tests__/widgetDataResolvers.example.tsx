/**
 * Example usage of widget data resolvers
 * This demonstrates how to use the resolvers in React components
 */

import React from "react";
import { getWidgetData, WidgetConfigError } from "../widgetDataResolvers";
import { Widget } from "@/types/dashboard";
import { useApp } from "@/context/AppContext";

/**
 * Example: Using widget data resolver in a component
 */
export function ExampleWidgetComponent({ widget }: { widget: Widget }) {
  const { currentTenant } = useApp();
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      // Get widget data with tenant context
      const widgetData = getWidgetData(widget, currentTenant.id);
      setData(widgetData);
      setError(null);
    } catch (err) {
      if (err instanceof WidgetConfigError) {
        setError(`Configuration error: ${err.message}`);
      } else {
        setError("Failed to load widget data");
      }
      setData(null);
    }
  }, [widget, currentTenant.id]);

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        <p className="text-red-800 font-semibold">Widget Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 border border-gray-300 bg-gray-50 rounded">
        <p className="text-gray-600">Loading widget data...</p>
      </div>
    );
  }

  // Render based on widget type
  switch (widget.type) {
    case "kpi":
      return (
        <div className="p-4 border rounded">
          <h3 className="font-semibold">{widget.title}</h3>
          <p className="text-3xl font-bold">
            {data.value} {data.unit}
          </p>
          {data.trend && (
            <p className="text-sm text-gray-600">
              {data.trend} {data.trendLabel}
            </p>
          )}
        </div>
      );

    case "statusBoard":
      return (
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{widget.title}</h3>
          <div className="space-y-2">
            {data.categories.map((cat: any) => (
              <div key={cat.status} className="flex justify-between">
                <span>{cat.label}</span>
                <span className="font-semibold">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "list":
      return (
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{widget.title}</h3>
          <div className="text-sm text-gray-600 mb-2">
            Showing {data.items.length} of {data.totalCount}
          </div>
          <div className="space-y-1">
            {data.items.map((item: any, idx: number) => (
              <div key={idx} className="text-sm">
                {data.columns.map((col: string) => (
                  <span key={col} className="mr-2">
                    {item[col]}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "table":
      return (
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{widget.title}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {data.columns.map((col: any) => (
                  <th key={col.key} className="text-left p-2">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  {data.columns.map((col: any) => (
                    <td key={col.key} className="p-2">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return (
        <div className="p-4 border border-gray-300 bg-gray-50 rounded">
          <p className="text-gray-600">Widget type not implemented</p>
        </div>
      );
  }
}

/**
 * Example: Using widget data resolver with error boundary
 */
export function SafeWidgetComponent({ widget }: { widget: Widget }) {
  return (
    <ErrorBoundary>
      <ExampleWidgetComponent widget={widget} />
    </ErrorBoundary>
  );
}

/**
 * Simple error boundary for widget rendering
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded">
          <p className="text-red-800 font-semibold">Widget Rendering Error</p>
          <p className="text-red-600 text-sm">
            {this.state.error?.message || "Unknown error"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
