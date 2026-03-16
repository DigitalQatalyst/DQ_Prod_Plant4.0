import React from "react";
import { WidgetGrid } from "./WidgetGrid";
import { widgets } from "@/data/dashboardData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Demo component to verify WidgetGrid functionality
 * This demonstrates:
 * - Rendering multiple widget types in a grid
 * - Pin to Overview action
 * - Open in Workspace action
 */
export function WidgetGridDemo() {
  const navigate = useNavigate();

  // Get a sample of different widget types for demo
  const demoWidgets = [
    widgets.find((w) => w.id === "w-total-assets")!,
    widgets.find((w) => w.id === "w-alert-summary")!,
    widgets.find((w) => w.id === "w-critical-assets")!,
    widgets.find((w) => w.id === "w-connectivity-health")!,
  ].filter(Boolean);

  const handlePinToOverview = (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    toast.success(`Pinned "${widget?.title}" to Overview Dashboard`);
    console.log("Pin to overview:", widgetId);
  };

  const handleOpenInWorkspace = (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (widget && widget.featureArea !== "cross") {
      toast.info(`Opening "${widget.title}" in ${widget.featureArea} workspace`);
      navigate(`/${widget.featureArea}/dashboard`);
    } else {
      toast.info(`Opening widget in workspace`);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">WidgetGrid Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrating the WidgetGrid component with various widget types
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sample Widgets</h2>
          <WidgetGrid
            widgets={demoWidgets}
            onPinToOverview={handlePinToOverview}
            onOpenInWorkspace={handleOpenInWorkspace}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Empty State</h2>
          <WidgetGrid widgets={[]} />
        </div>

        {/* Add some bottom padding for better scrolling */}
        <div className="h-20" />
      </div>
    </div>
  );
}
