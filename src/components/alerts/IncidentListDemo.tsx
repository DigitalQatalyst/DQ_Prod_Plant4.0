import { useState } from "react";
import { IncidentList } from "./IncidentList";
import { incidents, alerts } from "@/data/alertData";
import { AlertStatus } from "@/types/alert";

export function IncidentListDemo() {
  const [localAlerts, setLocalAlerts] = useState(alerts);

  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    setLocalAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: newStatus, updatedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold mb-2">Incident List Demo</h2>
          <p className="text-muted-foreground">
            Demonstrating incident list with all incidents and their related alerts
          </p>
        </div>

        <IncidentList
          incidents={incidents}
          alerts={localAlerts}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
