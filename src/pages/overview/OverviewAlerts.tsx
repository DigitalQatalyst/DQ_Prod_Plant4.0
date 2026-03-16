import { useState, useEffect } from "react";
import { WorkPane } from "@/components/layout/WorkPane";
import { AlertView } from "@/components/alerts/AlertView";
import { useApp } from "@/context/AppContext";
import { Alert, AlertStatus } from "@/types/alert";
import { incidents as allIncidents } from "@/data/alertData";
import {
  getAlertsForTenant,
  updateAlertStatus as updateAlertStatusUtil
} from "@/lib/alertUtils";

/**
 * OverviewAlerts Page
 * Displays all alerts across the platform from all feature areas
 * 
 * Requirements: 8.1, 14.2
 */
export function OverviewAlerts() {
  const { currentTenant } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Fetch alerts on tenant change
  useEffect(() => {
    setAlerts(getAlertsForTenant(currentTenant.id));
  }, [currentTenant.id]);

  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? updateAlertStatusUtil(a, newStatus) : a
    ));
  };

  const incidents = allIncidents.filter(i => i.tenantId === currentTenant.id);

  const tabs = [
    {
      id: "alerts",
      label: "Alerts",
      content: (
        <AlertView
          alerts={alerts}
          incidents={incidents}
          onStatusChange={handleStatusChange}
          hideHeader
        />
      ),
    },
  ];

  return (
    <WorkPane
      title="All Alerts"
      subtitle="Monitor and respond to alerts across all feature areas"
      tabs={tabs}
    />
  );
}
