import { WorkPane } from "@/components/layout/WorkPane";
import { DashboardView } from "@/components/dashboard/DashboardView";

/**
 * MonitoringDashboard Page
 * Displays dashboards specific to the monitoring feature area
 * 
 * Requirements: 4.1, 4.3, 14.1
 */
export function MonitoringDashboard() {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      content: (
        <DashboardView featureArea="monitoring" />
      ),
    },
  ];

  return (
    <WorkPane
      title="Monitoring Dashboard"
      subtitle="Monitor system health, performance metrics, and operational status"
      tabs={tabs}
    />
  );
}
