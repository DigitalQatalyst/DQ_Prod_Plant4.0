import { useState } from "react";
import { AlertList } from "./AlertList";
import { Alert, AlertStatus } from "@/types/alert";
import { alerts as mockAlerts } from "@/data/alertData";

/**
 * Demo component for AlertList
 * Shows AlertList with mock data and status change handling
 */
export function AlertListDemo() {
  // Use a subset of alerts for demo (tenant t1)
  const [alerts, setAlerts] = useState<Alert[]>(
    mockAlerts.filter(alert => alert.tenantId === "t1")
  );

  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, status: newStatus, updatedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Alert List Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating alert filtering, sorting, and status management
        </p>
      </div>

      <AlertList alerts={alerts} onStatusChange={handleStatusChange} />
    </div>
  );
}
