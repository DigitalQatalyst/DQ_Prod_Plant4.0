import { WorkPane } from "@/components/layout/WorkPane";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { BarChart3 } from "lucide-react";

/**
 * OverviewDashboard Page
 * Displays global dashboards that aggregate metrics from multiple feature areas
 * 
 * Requirements: 3.1, 14.1
 */
export function OverviewDashboard() {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      content: (
        <DashboardView />
      ),
    },
  ];

  return (
    <WorkPane
      title="Overview Dashboard"
      subtitle="Platform overview and key metrics across all feature areas"
      tabs={tabs}
    />
  );
}
