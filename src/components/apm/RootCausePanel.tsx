import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UpstreamAlert } from "@/types/navigation";
import { 
  Search, 
  Wrench, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Eye,
  ExternalLink
} from "lucide-react";

interface RootCausePanelProps {
  alert: UpstreamAlert;
  showEvidence?: boolean;
  onCreateWorkOrder?: () => void;
}

export function RootCausePanel({
  alert,
  showEvidence = true,
  onCreateWorkOrder,
}: RootCausePanelProps) {
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(alert.status)}
                <Badge variant="outline" className={cn("text-xs", getSeverityColor(alert.severity))}>
                  {alert.severity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {alert.status}
                </Badge>
              </div>
              
              <CardTitle className="text-lg">
                {alert.title}
              </CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{alert.assetName}</span>
                <span>•</span>
                <span>{formatTimestamp(alert.timestamp)}</span>
              </div>
            </div>
            
            <Button size="sm" variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Asset
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {alert.description}
          </p>
        </CardContent>
      </Card>

      {/* Root Cause Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" />
            Likely Root Causes
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {alert.likelyCauses.map((cause, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  {cause}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Corrective Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {alert.correctiveActions.map((action, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  {action}
                </p>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onCreateWorkOrder}>
              <Wrench className="w-4 h-4 mr-2" />
              Create Work Order
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Evidence */}
      {showEvidence && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Supporting Evidence
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Telemetry Signals</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Vibration Level</span>
                    <span className="font-medium text-red-600">4.8 mm/s (High)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Temperature</span>
                    <span className="font-medium">165°F (Normal)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pressure</span>
                    <span className="font-medium text-yellow-600">1450 psi (Warning)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Historical Context</h4>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    • Similar vibration pattern observed 3 months ago
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Last bearing replacement: 18 months ago
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Operating hours since maintenance: 12,450 hrs
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Trend Analysis
              </Button>
              <Button size="sm" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Similar Events
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}