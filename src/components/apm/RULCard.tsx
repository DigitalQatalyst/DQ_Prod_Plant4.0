import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Asset } from "@/types/navigation";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Calendar,
  Wrench
} from "lucide-react";

interface RULCardProps {
  asset: Asset;
  component?: string;
  rulDays: number;
  confidence: number;
  trend: "improving" | "stable" | "degrading";
  maxRulDays?: number;
  showDetails?: boolean;
}

export function RULCard({
  asset,
  component = "Overall System",
  rulDays,
  confidence,
  trend,
  maxRulDays = 365,
  showDetails = true,
}: RULCardProps) {
  const getRiskLevel = (days: number): "low" | "medium" | "high" | "critical" => {
    if (days > 90) return "low";
    if (days > 30) return "medium";
    if (days > 7) return "high";
    return "critical";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "degrading":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "improving":
        return "text-green-600";
      case "degrading":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-600";
    if (conf >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (days: number) => {
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours}h`;
    } else if (days < 30) {
      return `${Math.round(days)}d`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months}mo`;
    } else {
      const years = Math.round(days / 365 * 10) / 10;
      return `${years}y`;
    }
  };

  const getMaintenanceDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + rulDays);
    return date.toLocaleDateString();
  };

  const riskLevel = getRiskLevel(rulDays);
  const progressPercentage = Math.max(0, Math.min(100, (rulDays / maxRulDays) * 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Remaining Useful Life
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", getRiskColor(riskLevel))}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Asset and Component Info */}
        <div className="space-y-1">
          <div className="text-sm font-medium">{asset.name}</div>
          <div className="text-xs text-muted-foreground">{component}</div>
        </div>

        {/* Main RUL Display */}
        <div className="text-center space-y-2">
          <div className={cn("text-3xl font-bold", 
            riskLevel === "critical" ? "text-red-600" :
            riskLevel === "high" ? "text-orange-600" :
            riskLevel === "medium" ? "text-yellow-600" : "text-green-600"
          )}>
            {formatDuration(rulDays)}
          </div>
          <div className="text-sm text-muted-foreground">
            Estimated remaining life
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              indicatorClassName={
                riskLevel === "critical" ? "bg-red-500" :
                riskLevel === "high" ? "bg-orange-500" :
                riskLevel === "medium" ? "bg-yellow-500" : "bg-green-500"
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0d</span>
              <span>{formatDuration(maxRulDays)}</span>
            </div>
          </div>
        </div>

        {/* Confidence and Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {trend === "improving" ? "Improving" : 
               trend === "degrading" ? "Degrading" : "Stable"}
            </span>
          </div>
          
          <div className="text-right">
            <div className={cn("text-sm font-medium", getConfidenceColor(confidence))}>
              {confidence}% confidence
            </div>
            <div className="text-xs text-muted-foreground">
              Model accuracy
            </div>
          </div>
        </div>

        {/* Additional Details */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Maintenance Due</span>
                </div>
                <div className="font-medium">{getMaintenanceDate()}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wrench className="w-3 h-3" />
                  <span>Action Required</span>
                </div>
                <div className="font-medium">
                  {riskLevel === "critical" ? "Immediate" :
                   riskLevel === "high" ? "Within 7 days" :
                   riskLevel === "medium" ? "Plan maintenance" : "Monitor"}
                </div>
              </div>
            </div>

            {/* Warning for critical/high risk */}
            {(riskLevel === "critical" || riskLevel === "high") && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-orange-800">
                  {riskLevel === "critical" 
                    ? "Critical: Immediate maintenance required to prevent failure"
                    : "High Risk: Schedule maintenance within the next week"
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}