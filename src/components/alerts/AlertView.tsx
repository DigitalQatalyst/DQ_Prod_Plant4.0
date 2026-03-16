import { useState, useEffect, useMemo } from "react";
import { Alert, Incident, AlertStatus, AlertWithTopology } from "@/types/alert";
import { FeatureAreaId } from "@/types/dashboard";
import { AlertList } from "./AlertList";
import { IncidentList } from "./IncidentList";
import { useApp } from "@/context/AppContext";
import {
  getAlertsForTenant,
  getAlertsForFeatureArea,
  updateAlertStatus
} from "@/lib/alertUtils";
import { alerts as allAlerts, incidents as allIncidents, alertsWithTopology } from "@/data/alertData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Layers, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface AlertViewProps {
  alerts: Alert[];
  incidents?: Incident[];
  isLoading?: boolean;
  featureArea?: FeatureAreaId;
  initialView?: "alerts" | "incidents";
  isTransmission?: boolean; // Whether to show transmission topology context
  onStatusChange?: (alertId: string, newStatus: AlertStatus) => void;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function AlertView({
  alerts: initialAlerts,
  incidents: initialIncidents = [],
  isLoading = false,
  featureArea,
  initialView = "alerts",
  isTransmission = false,
  onStatusChange,
  title,
  subtitle,
  hideHeader = false
}: AlertViewProps) {
  const { currentTenant } = useApp();
  const [view, setView] = useState<"alerts" | "incidents">(initialView);
  const [alerts, setAlerts] = useState<Alert[] | AlertWithTopology[]>(initialAlerts || []);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);

  // Fetch and filter alerts based on feature area and tenant
  // Re-filters when currentTenant changes (Requirement 13.2)
  useEffect(() => {
    if (initialAlerts && initialAlerts.length > 0) {
      setAlerts(initialAlerts);
      return;
    }

    let filteredAlerts: Alert[] | AlertWithTopology[];
    
    // Use extended alerts with topology for transmission mode
    const sourceAlerts = isTransmission ? alertsWithTopology : allAlerts;
    
    if (featureArea) {
      // Domain-specific view: filter by feature area and tenant
      filteredAlerts = sourceAlerts.filter(alert => 
        alert.featureArea === featureArea && alert.tenantId === currentTenant.id
      ) as Alert[] | AlertWithTopology[];
    } else {
      // Global view: filter by tenant only
      filteredAlerts = sourceAlerts.filter(alert => 
        alert.tenantId === currentTenant.id
      ) as Alert[] | AlertWithTopology[];
    }
    
    setAlerts(filteredAlerts);
  }, [featureArea, currentTenant.id, isTransmission, initialAlerts]);

  // Fetch and filter incidents by tenant (and optionally feature area)
  // Re-filters when currentTenant changes (Requirement 13.2)
  useEffect(() => {
    if (initialIncidents && initialIncidents.length > 0) {
      setIncidents(initialIncidents);
      return;
    }

    let filteredIncidents = allIncidents.filter(
      incident => incident.tenantId === currentTenant.id
    );
    
    // If viewing a specific feature area, filter incidents too
    if (featureArea) {
      filteredIncidents = filteredIncidents.filter(
        incident => incident.featureArea === featureArea
      );
    }
    
    setIncidents(filteredIncidents);
  }, [featureArea, currentTenant.id, initialIncidents]);

  // Handle alert status change local logic merged with prop callback
  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    if (onStatusChange) {
      onStatusChange(alertId, newStatus);
    }
    
    setAlerts(prevAlerts => {
      return prevAlerts.map(alert => {
        if (alert.id === alertId) {
          try {
            // Use the utility function to validate and update
            return updateAlertStatus(alert, newStatus) as any;
          } catch (error) {
            // If validation fails, show error and return unchanged
            console.error(`Failed to update alert status: ${error}`);
            // In a real app, we'd show a toast notification here
            return alert;
          }
        }
        return alert;
      });
    });
  };


  // Count open alerts
  const openAlertCount = useMemo(() => {
    return alerts.filter(alert => alert.status === "open").length;
  }, [alerts]);

  // Count open incidents
  const openIncidentCount = useMemo(() => {
    return incidents.filter(incident => incident.status === "open").length;
  }, [incidents]);

  const displayTitle = title || (featureArea
    ? `${featureArea.charAt(0).toUpperCase() + featureArea.slice(1)} Alerts`
    : "All Alerts");

  const displaySubtitle = subtitle || (featureArea
    ? `Monitor and respond to alerts in the ${featureArea} domain`
    : "Monitor and respond to alerts across all feature areas");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-10 bg-muted rounded w-full mt-8"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-muted-foreground mt-1">
              {displaySubtitle}
            </p>
          </div>

          {/* Link to global alerts view when in domain view */}
          {featureArea && (
            <Link to="/overview/alerts">
              <Button variant="outline" size="sm" aria-label="View all alerts across all feature areas">
                <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                View All Alerts
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* View Toggle with Counts */}
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as "alerts" | "incidents")}
        aria-label="Switch between alerts and incidents view"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger
            value="alerts"
            className="flex items-center gap-2"
            aria-label={`Alerts view${openAlertCount > 0 ? `, ${openAlertCount} open alerts` : ""}`}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Alerts</span>
            {openAlertCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 px-1 text-xs"
                aria-label={`${openAlertCount} open`}
              >
                {openAlertCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="incidents"
            className="flex items-center gap-2"
            aria-label={`Incidents view${openIncidentCount > 0 ? `, ${openIncidentCount} open incidents` : ""}`}
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>Incidents</span>
            {openIncidentCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 px-1 text-xs"
                aria-label={`${openIncidentCount} open`}
              >
                {openIncidentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Alerts View */}
        <TabsContent value="alerts" className="mt-6">
          <AlertList 
            alerts={alerts} 
            onStatusChange={handleStatusChange} 
            isTransmission={isTransmission}
          />

        </TabsContent>

        {/* Incidents View */}
        <TabsContent value="incidents" className="mt-6">
          <IncidentList
            incidents={incidents}
            alerts={alerts}
            onStatusChange={onStatusChange || (() => { })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
