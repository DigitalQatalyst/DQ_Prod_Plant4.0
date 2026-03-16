import { WorkPane } from "@/components/layout/WorkPane";
import { AlertView } from "@/components/alerts/AlertView";

/**
 * SecurityAlerts Page
 * Displays alerts specific to the security feature area
 * 
 * Requirements: 9.1, 9.2, 14.2
 */
export function SecurityAlerts() {
  const tabs = [
    {
      id: "alerts",
      label: "Alerts",
      content: (
        <AlertView featureArea="security" />
      ),
    },
  ];

  return (
    <WorkPane
      title="Security Alerts"
      subtitle="Monitor and respond to security-related alerts and incidents"
      tabs={tabs}
    />
  );
}
