import { WorkPane } from "@/components/layout/WorkPane";
import { AlertView } from "@/components/alerts/AlertView";

/**
 * MonitoringAlerts Page
 * Displays alerts specific to the monitoring feature area
 * 
 * Requirements: 9.1, 9.2, 14.2
 */
export function MonitoringAlerts() {
  const tabs = [
    {
      id: "alerts",
      label: "Alerts",
      content: (
        <AlertView featureArea="monitoring" />
      ),
    },
  ];

  return (
    <WorkPane
      title="Monitoring Alerts"
      subtitle="Monitor and respond to monitoring-related alerts and incidents"
      tabs={tabs}
    />
  );
}
