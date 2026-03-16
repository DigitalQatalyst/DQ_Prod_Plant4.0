import { useQuery } from "@tanstack/react-query";
import { WorkPane } from "@/components/layout/WorkPane";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useApp } from "@/context/AppContext";
import { AlertStatus } from "@/types/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertView } from "@/components/alerts/AlertView";
import { incidents as allIncidents } from "@/data/alertData";

/**
 * AssetsAlerts Page
 * Displays alerts specific to the assets feature area using the shared AlertView component
 *
 * Requirements: 7.4, 7.5, 7.6
 */
export function AssetsAlerts() {
  const { provider } = useDataProvider();
  const { currentTenant } = useApp();
  const { toast } = useToast();

  // Get alerts for the current tenant
  const { data: alertsData = [], isLoading, refetch } = useQuery({
    queryKey: ['tenant-alerts', currentTenant.id],
    queryFn: () => provider.getAlertsByTenant(currentTenant.id),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filter for assets feature area
  const assetAlerts = alertsData.filter(alert => alert.featureArea === 'assets');

  // Filter incidents for assets feature area
  const assetIncidents = allIncidents.filter(
    incident => incident.tenantId === currentTenant.id && incident.featureArea === 'assets'
  );

  const handleStatusUpdate = async (alertId: string, newStatus: AlertStatus) => {
    try {
      await provider.updateAlertStatus(alertId, newStatus);
      refetch(); // Refresh the alerts list

      const statusMessages = {
        acknowledged: "Alert acknowledged",
        "in-progress": "Work started on alert",
        closed: "Alert resolved",
        open: "Alert reopened"
      };

      toast({
        title: "Alert Updated",
        description: statusMessages[newStatus] || "Alert status updated",
      });
    } catch (error) {
      console.error("Failed to update alert status:", error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive",
      });
    }
  };

  return (
    <WorkPane
      title="Assets Alerts"
      subtitle="Monitor and respond to asset-related alerts and incidents"
    >
      <AlertView
        alerts={assetAlerts}
        incidents={assetIncidents}
        isLoading={isLoading}
        featureArea="assets"
        onStatusChange={handleStatusUpdate}
        hideHeader // WorkPane already provides the header
      />
    </WorkPane>
  );
}
