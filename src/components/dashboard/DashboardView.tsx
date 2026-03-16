import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dashboard, FeatureAreaId, Widget } from "@/types/dashboard";
import { useApp } from "@/context/AppContext";
import {
  getDashboardsForTenant,
  getDashboardsForFeatureArea,
  getWidgetsByIds,
  pinWidgetToOverview,
} from "@/lib/dashboardUtils";
import { dashboards as allDashboards } from "@/data/dashboardData";
import { WidgetGrid } from "./WidgetGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface DashboardViewProps {
  featureArea?: FeatureAreaId; // undefined = show all/overview
  dashboardId?: string; // specific dashboard or default to first
}

/**
 * DashboardView Component
 * Main component for displaying dashboards with widgets
 * 
 * Requirements: 3.1, 3.4, 3.5, 4.1, 4.3, 4.4, 4.5, 13.1, 13.3, 13.5, 14.1
 */
export function DashboardView({ featureArea, dashboardId }: DashboardViewProps) {
  const { currentTenant } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [overviewDashboard, setOverviewDashboard] = useState<Dashboard | null>(null);

  /**
   * Fetch dashboards based on feature area and tenant context
   * Applies tenant filtering from AppContext (Requirement 3.4, 13.1, 13.3)
   * Re-filters when currentTenant changes (Requirement 13.1)
   */
  const dashboards = useMemo(() => {
    if (featureArea) {
      // Domain-specific dashboards
      return getDashboardsForFeatureArea(featureArea, currentTenant.id);
    } else {
      // Overview/global dashboards
      return getDashboardsForTenant(currentTenant.id).filter(
        (dashboard) => dashboard.isGlobal || dashboard.featureArea === "cross"
      );
    }
  }, [featureArea, currentTenant.id]);

  /**
   * Find the main overview dashboard for pinning widgets
   */
  useEffect(() => {
    const mainOverview = allDashboards.find(
      (d) => d.id === "main-overview" && d.isGlobal
    );
    setOverviewDashboard(mainOverview || null);
  }, []);

  /**
   * Select the appropriate dashboard based on dashboardId prop or default to first
   */
  useEffect(() => {
    if (dashboards.length === 0) {
      setSelectedDashboard(null);
      setWidgets([]);
      return;
    }

    let dashboard: Dashboard | undefined;

    if (dashboardId) {
      // Find specific dashboard by ID
      dashboard = dashboards.find((d) => d.id === dashboardId);
    }

    // Default to first dashboard if not found or not specified
    if (!dashboard) {
      dashboard = dashboards[0];
    }

    setSelectedDashboard(dashboard);
  }, [dashboards, dashboardId]);

  /**
   * Fetch widgets for the selected dashboard
   * Re-fetches when dashboard or tenant changes (Requirement 13.1)
   * Ensures widgets are refreshed when currentTenant changes
   */
  useEffect(() => {
    if (!selectedDashboard) {
      setWidgets([]);
      return;
    }

    const fetchedWidgets = getWidgetsByIds(selectedDashboard.widgetIds);
    setWidgets(fetchedWidgets);
  }, [selectedDashboard, currentTenant.id]);

  /**
   * Handle pin to overview action
   * Adds the widget to the main overview dashboard
   * Requirements: 5.2, 5.3, 5.5
   */
  const handlePinToOverview = (widgetId: string) => {
    if (!overviewDashboard) {
      toast({
        title: "Error",
        description: "Overview dashboard not found",
        variant: "destructive",
      });
      return;
    }

    // Find the widget to get its details
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) {
      toast({
        title: "Error",
        description: "Widget not found",
        variant: "destructive",
      });
      return;
    }

    // Check if widget is already pinned
    if (overviewDashboard.widgetIds.includes(widgetId)) {
      toast({
        title: "Already Pinned",
        description: `"${widget.title}" is already pinned to the overview dashboard`,
      });
      return;
    }

    // Pin the widget to overview
    const updatedDashboard = pinWidgetToOverview(overviewDashboard, widgetId);
    setOverviewDashboard(updatedDashboard);

    // In a real app, this would persist to backend
    // For now, we just update local state and show success message
    toast({
      title: "Widget Pinned",
      description: `"${widget.title}" has been pinned to the overview dashboard`,
    });
  };

  /**
   * Handle open in workspace action
   * Navigates to the widget's feature area with context preserved
   * Requirements: 6.2, 6.3
   */
  const handleOpenInWorkspace = (widgetId: string) => {
    // Find the widget to get its feature area and config
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) {
      toast({
        title: "Error",
        description: "Widget not found",
        variant: "destructive",
      });
      return;
    }

    // Don't navigate if widget is from cross-domain or overview
    if (widget.featureArea === "cross" || widget.featureArea === "overview") {
      toast({
        title: "Cannot Navigate",
        description: "This widget doesn't have a specific feature area workspace",
      });
      return;
    }

    // Build URL with widget context preserved in query params
    const params = new URLSearchParams();
    params.set("widgetId", widgetId);

    // Preserve widget filters in URL params
    if (widget.config.filters) {
      params.set("filters", JSON.stringify(widget.config.filters));
    }

    // Preserve time range if present
    if (widget.config.timeRange) {
      params.set("timeRange", JSON.stringify(widget.config.timeRange));
    }

    // Preserve other relevant config
    if (widget.config.displayLimit) {
      params.set("displayLimit", widget.config.displayLimit.toString());
    }

    // Navigate to the feature area's dashboard with context
    const targetPath = `/${widget.featureArea}/dashboard?${params.toString()}`;
    navigate(targetPath);

    toast({
      title: "Opening Workspace",
      description: `Navigating to ${widget.featureArea} workspace`,
    });
  };

  /**
   * Handle dashboard selection from multiple dashboards
   */
  const handleDashboardChange = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
  };

  // Empty state when no dashboards exist for tenant/feature area
  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" role="status">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
            No Dashboards Available
          </h2>
          <p className="text-sm text-muted-foreground">
            {featureArea
              ? `No dashboards are configured for the ${featureArea} feature area.`
              : "No overview dashboards are available for your tenant."}
          </p>
        </div>
      </div>
    );
  }

  // Empty state when dashboard has no widgets
  if (selectedDashboard && widgets.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          dashboard={selectedDashboard}
          dashboards={dashboards}
          onDashboardChange={handleDashboardChange}
        />
        <div className="flex flex-col items-center justify-center py-16 px-4" role="status">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No Widgets Configured
            </h3>
            <p className="text-sm text-muted-foreground">
              This dashboard doesn't have any widgets configured yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedDashboard && (
        <>
          <DashboardHeader
            dashboard={selectedDashboard}
            dashboards={dashboards}
            onDashboardChange={handleDashboardChange}
          />
          <WidgetGrid
            widgets={widgets}
            onPinToOverview={handlePinToOverview}
            onOpenInWorkspace={handleOpenInWorkspace}
          />
        </>
      )}
    </div>
  );
}

/**
 * DashboardHeader Component
 * Displays dashboard title, metadata, and actions
 */
interface DashboardHeaderProps {
  dashboard: Dashboard;
  dashboards: Dashboard[];
  onDashboardChange: (dashboard: Dashboard) => void;
}

function DashboardHeader({
  dashboard,
  dashboards,
  onDashboardChange,
}: DashboardHeaderProps) {
  const { currentTenant } = useApp();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
          {dashboard.featureArea !== "cross" && (
            <Badge variant="outline" className="capitalize">
              {dashboard.featureArea}
            </Badge>
          )}
          {dashboard.isGlobal && (
            <Badge variant="secondary">Global</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {currentTenant.name} • {dashboard.widgetIds.length} widget
          {dashboard.widgetIds.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Dashboard selector when multiple dashboards available */}
      {dashboards.length > 1 && (
        <div className="flex items-center gap-2" role="group" aria-label="Dashboard selection">
          <span className="text-sm text-muted-foreground" id="dashboard-selector-label">Dashboard:</span>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-labelledby="dashboard-selector-label">
            {dashboards.map((d) => (
              <Button
                key={d.id}
                variant={d.id === dashboard.id ? "default" : "outline"}
                size="sm"
                onClick={() => onDashboardChange(d)}
                role="radio"
                aria-checked={d.id === dashboard.id}
                aria-label={`Switch to ${d.name} dashboard`}
              >
                {d.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
