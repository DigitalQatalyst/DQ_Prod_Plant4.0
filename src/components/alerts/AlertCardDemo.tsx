import { useState } from "react";
import { AlertCard } from "./AlertCard";
import { Alert, AlertStatus } from "@/types/alert";
import { alerts } from "@/data/alertData";

/**
 * Demo component to showcase AlertCard functionality
 * This demonstrates both compact and full modes, and status changes
 */
export function AlertCardDemo() {
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>(alerts.slice(0, 5));

  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    setDemoAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: newStatus, updatedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-2">AlertCard Component Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating alert cards in full and compact modes with interactive status changes
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Full Mode</h2>
          <div className="space-y-4">
            {demoAlerts.slice(0, 3).map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Compact Mode</h2>
          <div className="space-y-2">
            {demoAlerts.slice(0, 5).map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onStatusChange={handleStatusChange}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Severity Examples</h2>
          <div className="space-y-4">
            {/* Critical */}
            <AlertCard
              alert={demoAlerts.find(a => a.severity === "critical")!}
              onStatusChange={handleStatusChange}
            />
            {/* Warning */}
            <AlertCard
              alert={demoAlerts.find(a => a.severity === "warning")!}
              onStatusChange={handleStatusChange}
            />
            {/* Info */}
            <AlertCard
              alert={alerts.find(a => a.severity === "info")!}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
