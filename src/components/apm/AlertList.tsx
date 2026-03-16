import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpstreamAlert } from "@/types/navigation";
import { AlertTriangle, Clock, CheckCircle, Eye } from "lucide-react";

interface AlertListProps {
  alerts: UpstreamAlert[];
  selectedAlert?: UpstreamAlert | null;
  onAlertSelect?: (alert: UpstreamAlert) => void;
  maxItems?: number;
  showAssetName?: boolean;
}

export function AlertList({
  alerts,
  selectedAlert,
  onAlertSelect,
  maxItems = 10,
  showAssetName = true,
}: AlertListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "Warning":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Information":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Investigating":
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-red-600";
      case "Investigating":
        return "text-yellow-600";
      case "Resolved":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return "< 1h ago";
    }
  };

  const displayAlerts = alerts.slice(0, maxItems);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No alerts available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Recent Alerts
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.length} total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all duration-200",
              selectedAlert?.id === alert.id
                ? "bg-primary/10 border-primary/30"
                : "hover:bg-secondary/50 border-border"
            )}
            onClick={() => onAlertSelect?.(alert)}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(alert.status)}
                  <span className={cn("text-sm font-medium", getStatusColor(alert.status))}>
                    {alert.status}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", getSeverityColor(alert.severity))}>
                    {alert.severity}
                  </Badge>
                </div>
                
                <h4 className="text-sm font-medium text-foreground truncate">
                  {alert.title}
                </h4>
                
                {showAssetName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.assetName}
                  </p>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground shrink-0 ml-2">
                {formatTimestamp(alert.timestamp)}
              </div>
            </div>

            {/* Alert Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {alert.description}
            </p>

            {/* Quick Actions */}
            {selectedAlert?.id === alert.id && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="text-xs h-6">
                  View Details
                </Button>
                {alert.status === "Active" && (
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    Acknowledge
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {alerts.length > maxItems && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All {alerts.length} Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}