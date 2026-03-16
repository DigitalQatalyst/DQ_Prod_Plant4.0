import { useState, useEffect } from "react";
import { Alert, AlertStatus, AlertWithTopology } from "@/types/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Info, Clock, MapPin, Package, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AlertCardProps {
  alert: Alert | AlertWithTopology;
  onStatusChange: (alertId: string, newStatus: AlertStatus) => void;
  compact?: boolean;
  isTransmission?: boolean;
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

export function AlertCard({ alert, onStatusChange, compact = false, isTransmission = false }: AlertCardProps) {
  const severityInfo = severityConfig[alert.severity];
  const statusInfo = statusConfig[alert.status];
  const SeverityIcon = severityInfo.icon;
  const [announcement, setAnnouncement] = useState<string>("");

  const handleStatusChange = (newStatus: string) => {
    const newStatusInfo = statusConfig[newStatus as AlertStatus];
    // Set announcement for screen readers
    setAnnouncement(`Alert status changed to ${newStatusInfo.label}`);
    onStatusChange(alert.id, newStatus as AlertStatus);
  };

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  // Format the created time
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true });

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors",
          alert.severity === "critical" && "border-l-4 border-l-destructive"
        )}
        role="article"
        aria-label={`${severityInfo.label} alert: ${alert.title}`}
      >
        <SeverityIcon 
          className={cn("h-4 w-4 mt-0.5 flex-shrink-0", severityInfo.iconClass)} 
          aria-label={`${severityInfo.label} severity`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight">{alert.title}</h4>
            <Badge 
              variant="outline" 
              className={cn("text-xs flex-shrink-0", statusInfo.badgeClass)}
              aria-label={`Status: ${statusInfo.label}`}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{alert.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Created </span>
              {timeAgo}
            </span>
            {isTransmission && 'substationName' in alert && alert.substationName && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Substation: </span>
                {alert.substationName}
              </span>
            )}
            {isTransmission && 'feederName' in alert && alert.feederName && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Feeder: </span>
                {alert.feederName}
              </span>
            )}
            {!isTransmission && alert.siteId && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Site: </span>
                {alert.siteId.replace("site-", "").replace(/-/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen reader announcement for status changes */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      
      <Card 
        className={cn(
          "transition-shadow hover:shadow-md",
          alert.severity === "critical" && "border-l-4 border-l-destructive"
        )}
        role="article"
        aria-label={`${severityInfo.label} alert: ${alert.title}`}
      >
        <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <SeverityIcon 
              className={cn("h-5 w-5 mt-0.5 flex-shrink-0", severityInfo.iconClass)} 
              aria-label={`${severityInfo.label} severity`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold leading-tight">{alert.title}</h3>
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
                  className="text-xs bg-secondary/50"
                  aria-label={`Feature area: ${alert.featureArea}`}
                >
                  {alert.featureArea}
                </Badge>
                {alert.tags && alert.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs" aria-label={`Tag: ${tag}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Select 
              value={alert.status} 
              onValueChange={handleStatusChange}
              aria-label={`Change alert status, current status: ${statusInfo.label}`}
            >
              <SelectTrigger className={cn("w-[140px] h-8 text-xs", statusInfo.badgeClass)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{alert.summary}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span><span className="sr-only">Created </span>{timeAgo}</span>
          </span>
          
          {isTransmission && 'substationName' in alert && alert.substationName && (
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span><span className="sr-only">Substation: </span>{alert.substationName}</span>
            </span>
          )}
          
          {isTransmission && 'feederName' in alert && alert.feederName && (
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span><span className="sr-only">Feeder: </span>{alert.feederName}</span>
            </span>
          )}
          
          {isTransmission && 'meterName' in alert && alert.meterName && (
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              <span><span className="sr-only">Meter: </span>{alert.meterName}</span>
            </span>
          )}
          
          {!isTransmission && alert.siteId && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span><span className="sr-only">Site: </span>{alert.siteId.replace("site-", "").replace(/-/g, " ")}</span>
            </span>
          )}
          
          {!isTransmission && alert.assetId && (
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Asset: {alert.assetId}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
