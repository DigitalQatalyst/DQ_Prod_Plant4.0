import { Dashboard, Widget, FeatureAreaId } from "@/types/dashboard";
import { dashboards, widgets } from "@/data/dashboardData";

/**
 * Get all dashboards for a specific tenant
 * Returns dashboards where scope.tenantId matches or is undefined (global)
 */
export function getDashboardsForTenant(tenantId: string): Dashboard[] {
  return dashboards.filter(
    (dashboard) => !dashboard.scope?.tenantId || dashboard.scope.tenantId === tenantId
  );
}

/**
 * Get dashboards filtered by feature area and tenant
 * Returns dashboards matching the feature area (or "cross") and tenant context
 */
export function getDashboardsForFeatureArea(
  featureArea: FeatureAreaId,
  tenantId: string
): Dashboard[] {
  return dashboards.filter(
    (dashboard) =>
      (dashboard.featureArea === featureArea || dashboard.featureArea === "cross") &&
      (!dashboard.scope?.tenantId || dashboard.scope.tenantId === tenantId)
  );
}

/**
 * Get widgets by their IDs
 * Returns an array of widgets matching the provided IDs
 */
export function getWidgetsByIds(widgetIds: string[]): Widget[] {
  return widgets.filter((widget) => widgetIds.includes(widget.id));
}

/**
 * Pin a widget to the overview dashboard
 * Adds the widget ID to the overview dashboard's widgetIds if not already present
 * Returns the updated dashboard
 */
export function pinWidgetToOverview(
  overviewDashboard: Dashboard,
  widgetId: string
): Dashboard {
  // Check if widget is already pinned
  if (overviewDashboard.widgetIds.includes(widgetId)) {
    return overviewDashboard;
  }

  // Create a new dashboard object with the widget added
  return {
    ...overviewDashboard,
    widgetIds: [...overviewDashboard.widgetIds, widgetId]
  };
}

/**
 * Unpin a widget from the overview dashboard
 * Removes the widget ID from the overview dashboard's widgetIds
 * Returns the updated dashboard
 */
export function unpinWidgetFromOverview(
  overviewDashboard: Dashboard,
  widgetId: string
): Dashboard {
  return {
    ...overviewDashboard,
    widgetIds: overviewDashboard.widgetIds.filter((id) => id !== widgetId)
  };
}
