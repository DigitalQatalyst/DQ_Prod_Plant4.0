import { WorkPane } from "@/components/layout/WorkPane";
import { AlertView } from "@/components/alerts/AlertView";

/**
 * OptimizationAlerts Page
 * Displays alerts specific to the optimization feature area
 * 
 * Requirements: 9.1, 9.2, 14.2
 */
export function OptimizationAlerts() {
  const tabs = [
    {
      id: "alerts",
      label: "Alerts",
      content: (
        <AlertView featureArea="optimization" />
      ),
    },
  ];

  return (
    <WorkPane
      title="Optimization Alerts"
      subtitle="Monitor and respond to optimization-related alerts and incidents"
      tabs={tabs}
    />
  );
}
