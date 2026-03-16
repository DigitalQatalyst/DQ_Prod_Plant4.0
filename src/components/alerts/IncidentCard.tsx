import { useState, useMemo } from "react";
import { Incident, Alert, AlertStatus } from "@/types/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Users, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AlertCard } from "./AlertCard";

interface IncidentCardProps {
  incident: Incident;
  relatedAlerts: Alert[];
  onStatusChange: (alertId: string, newStatus: AlertStatus) => void;
}

// Severity configuration with icons and colors
const severityConfig = {
  critical: {
    label: "Critical",
    icon: AlertCircle,
    badgeClass: "bg-destructive text-destructive-foreground border-destructive",
    iconClass: "text-destructive"
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    badgeClass: "bg-warning/10 text-warning border-warning/20",
    iconClass: "text-warning"
  },
  info: {
    label: "Info",
    icon: Info,
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconClass: "text-blue-600"
  }
};

// Status configuration with colors
const statusConfig = {
  open: {
    label: "Open",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20"
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass: "bg-warning/10 text-warning border-warning/20"
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-success/10 text-success border-success/20"
  }
};

export function IncidentCard({ incident, relatedAlerts, onStatusChange }: IncidentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const severityInfo = severityConfig[incident.severity];
  const statusInfo = statusConfig[incident.status];
  const SeverityIcon = severityInfo.icon;

  // Format the created time
  const timeAgo = formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true });

  // Detect cross-domain incident (alerts from multiple feature areas)
  const isCrossDomain = useMemo(() => {
    if (relatedAlerts.length === 0) return false;
    const featureAreas = new Set(relatedAlerts.map(alert => alert.featureArea));
    return featureAreas.size > 1;
  }, [relatedAlerts]);

  // Get unique feature areas for cross-domain indicator
  const featureAreas = useMemo(() => {
    const areas = new Set(relatedAlerts.map(alert => alert.featureArea));
    return Array.from(areas).sort();
  }, [relatedAlerts]);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <Card 
      className={cn(
        "transition-shadow hover:shadow-md",
        incident.severity === "critical" && "border-l-4 border-l-destructive"
      )}
      role="article"
      aria-label={`${severityInfo.label} incident: ${incident.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="h-6 w-6 p-0 flex-shrink-0 mt-0.5"
              aria-label={isExpanded ? "Collapse incident details" : "Expand incident details"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            
            <SeverityIcon 
              className={cn("h-5 w-5 mt-0.5 flex-shrink-0", severityInfo.iconClass)} 
              aria-label={`${severityInfo.label} severity`}
            />
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold leading-tight">{incident.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", severityInfo.badgeClass)}
                  aria-label={`Severity: ${severityInfo.label}`}
                >
                  {severityInfo.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", statusInfo.badgeClass)}
                  aria-label={`Status: ${statusInfo.label}`}
                >
                  {statusInfo.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs bg-secondary/50"
                  aria-label={`Feature area: ${incident.featureArea}`}
                >
                  {incident.featureArea}
                </Badge>
                {isCrossDomain && (
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20"
                    aria-label="Cross-domain incident spanning multiple feature areas"
                  >
                    <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
                    Cross-Domain
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  aria-label={`${relatedAlerts.length} related ${relatedAlerts.length === 1 ? "alert" : "alerts"}`}
                >
                  <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                  {relatedAlerts.length} {relatedAlerts.length === 1 ? "Alert" : "Alerts"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Incident Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>Created {timeAgo}</span>
          
          {incident.siteId && (
            <span>Site: {incident.siteId.replace("site-", "").replace(/-/g, " ")}</span>
          )}
          
          {incident.ownerUserId && (
            <span>Owner: {incident.ownerUserId}</span>
          )}
          
          {isCrossDomain && (
            <span className="text-purple-600 font-medium">
              Spans: {featureAreas.join(", ")}
            </span>
          )}
        </div>

        {/* Related Alerts (Expanded) */}
        {isExpanded && relatedAlerts.length > 0 && (
          <div className="pt-3 border-t space-y-2" role="region" aria-label="Related alerts">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Related Alerts ({relatedAlerts.length})
            </h4>
            <div className="space-y-2" role="list">
              {relatedAlerts.map((alert) => (
                <div key={alert.id} role="listitem">
                  <AlertCard
                    alert={alert}
                    onStatusChange={onStatusChange}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for no related alerts */}
        {isExpanded && relatedAlerts.length === 0 && (
          <div className="pt-3 border-t" role="status">
            <p className="text-sm text-muted-foreground text-center py-4">
              No related alerts found for this incident.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
