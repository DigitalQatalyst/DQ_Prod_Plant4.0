import { useState } from "react";
import { IncidentCard } from "./IncidentCard";
import { incidents, alerts } from "@/data/alertData";
import { AlertStatus } from "@/types/alert";

export function IncidentCardDemo() {
  const [localAlerts, setLocalAlerts] = useState(alerts);

  // Get the first incident for demo
  const demoIncident = incidents[0];

  // Get related alerts for the demo incident
  const relatedAlerts = localAlerts.filter(alert =>
    demoIncident.relatedAlertIds.includes(alert.id)
  );

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
          <h2 className="text-2xl font-bold mb-2">Incident Card Demo</h2>
          <p className="text-muted-foreground">
            Demonstrating incident card with expand/collapse and related alerts
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Single Incident</h3>
          <IncidentCard
            incident={demoIncident}
            relatedAlerts={relatedAlerts}
            onStatusChange={handleStatusChange}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cross-Domain Incident</h3>
          <IncidentCard
            incident={incidents[10]} // incident-011 is cross-domain
            relatedAlerts={localAlerts.filter(alert =>
              incidents[10].relatedAlertIds.includes(alert.id)
            )}
            onStatusChange={handleStatusChange}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Multiple Incidents</h3>
          {incidents.slice(0, 3).map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              relatedAlerts={localAlerts.filter(alert =>
                incident.relatedAlertIds.includes(alert.id)
              )}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
