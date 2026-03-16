import { useMemo } from "react";
import { Incident, Alert, AlertStatus } from "@/types/alert";
import { IncidentCard } from "./IncidentCard";
import { Layers } from "lucide-react";

interface IncidentListProps {
  incidents: Incident[];
  alerts: Alert[];
  onStatusChange: (alertId: string, newStatus: AlertStatus) => void;
}

export function IncidentList({ incidents, alerts, onStatusChange }: IncidentListProps) {
  // Create a map of alert ID to alert for efficient lookup
  const alertMap = useMemo(() => {
    const map = new Map<string, Alert>();
    alerts.forEach(alert => {
      map.set(alert.id, alert);
    });
    return map;
  }, [alerts]);

  // Get related alerts for each incident
  const getRelatedAlerts = (incident: Incident): Alert[] => {
    return incident.relatedAlertIds
      .map(alertId => alertMap.get(alertId))
      .filter((alert): alert is Alert => alert !== undefined);
  };

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div 
        className="flex items-center justify-between text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          Showing {incidents.length} {incidents.length === 1 ? "incident" : "incidents"}
        </span>
      </div>

      {/* Incident Cards */}
      {incidents.length > 0 ? (
        <div className="space-y-3" role="list" aria-label="Incident list">
          {incidents.map((incident) => (
            <div key={incident.id} role="listitem">
              <IncidentCard
                incident={incident}
                relatedAlerts={getRelatedAlerts(incident)}
                onStatusChange={onStatusChange}
              />
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div 
          className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg"
          role="status"
        >
          <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">No incidents found</h3>
          <p className="text-sm text-muted-foreground">
            There are no incidents to display.
          </p>
        </div>
      )}
    </div>
  );
}
