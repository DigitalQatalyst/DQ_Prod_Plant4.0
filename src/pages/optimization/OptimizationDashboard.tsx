import { WorkPane } from "@/components/layout/WorkPane";
import { DashboardView } from "@/components/dashboard/DashboardView";

/**
 * OptimizationDashboard Page
 * Displays dashboards specific to the optimization feature area
 * 
 * Requirements: 4.1, 4.3, 14.1
 */
export function OptimizationDashboard() {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      content: (
        <DashboardView featureArea="optimization" />
      ),
    },
  ];

  return (
    <WorkPane
      title="Optimization Dashboard"
      subtitle="Monitor optimization strategies, performance, and recommendations"
      tabs={tabs}
    />
  );
}
