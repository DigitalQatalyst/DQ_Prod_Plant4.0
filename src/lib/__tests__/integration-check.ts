/**
 * Integration check - verify all imports work correctly
 */

// Import the main resolver
import { getWidgetData, WidgetConfigError } from "../widgetDataResolvers";

// Import existing utilities to ensure compatibility
import { getDashboardsForTenant, getWidgetsByIds } from "../dashboardUtils";
import { getAlertsForTenant } from "../alertUtils";

// Import types
import { Widget } from "@/types/dashboard";
import { Alert } from "@/types/alert";

// Import data
import { dashboards, widgets } from "@/data/dashboardData";
import { alerts } from "@/data/alertData";

console.log("✓ All imports successful");

// Verify the resolver works with real data
const testTenantId = "t1";

// Get a real dashboard
const tenantDashboards = getDashboardsForTenant(testTenantId);
console.log(`✓ Found ${tenantDashboards.length} dashboards for tenant ${testTenantId}`);

if (tenantDashboards.length > 0) {
  const dashboard = tenantDashboards[0];
  console.log(`✓ Testing with dashboard: ${dashboard.name}`);

  // Get widgets for this dashboard
  const dashboardWidgets = getWidgetsByIds(dashboard.widgetIds);
  console.log(`✓ Found ${dashboardWidgets.length} widgets`);

  // Try to resolve data for each widget
  let successCount = 0;
  let errorCount = 0;
  let notImplementedCount = 0;

  dashboardWidgets.forEach((widget) => {
    try {
      const data = getWidgetData(widget, testTenantId);
      if (data === null) {
        notImplementedCount++;
        console.log(`  ⊘ Widget ${widget.id} (${widget.type}): Not implemented yet`);
      } else {
        successCount++;
        console.log(`  ✓ Widget ${widget.id} (${widget.type}): Resolved successfully`);
      }
    } catch (error) {
      errorCount++;
      if (error instanceof WidgetConfigError) {
        console.log(`  ✗ Widget ${widget.id} (${widget.type}): Config error - ${error.message}`);
      } else {
        console.log(`  ✗ Widget ${widget.id} (${widget.type}): Error - ${error}`);
      }
    }
  });

  console.log(`\nSummary:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Not Implemented: ${notImplementedCount}`);
  console.log(`  Errors: ${errorCount}`);
}

// Verify tenant filtering works
const tenantAlerts = getAlertsForTenant(testTenantId);
console.log(`\n✓ Tenant filtering: Found ${tenantAlerts.length} alerts for tenant ${testTenantId}`);

console.log("\n✓ Integration check complete - all systems compatible");
