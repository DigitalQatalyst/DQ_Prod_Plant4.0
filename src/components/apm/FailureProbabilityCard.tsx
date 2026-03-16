import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Asset } from "@/types/navigation";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Zap
} from "lucide-react";

interface FailureProbabilityCardProps {
  asset: Asset;
  horizons: {
    "7d": number;
    "30d": number;
    "90d": number;
  };
  topFailureModes: string[];
  confidence?: number;
  lastUpdated?: string;
}

export function FailureProbabilityCard({
  asset,
  horizons,
  topFailureModes,
  confidence = 85,
  lastUpdated,
}: FailureProbabilityCardProps) {
  const getHighestRisk = () => {
    const maxProb = Math.max(horizons["7d"], horizons["30d"], horizons["90d"]);
    if (maxProb >= 80) return "critical";
    if (maxProb >= 60) return "high";
    if (maxProb >= 30) return "medium";
    return "low";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-red-600";
    if (probability >= 60) return "text-orange-600";
    if (probability >= 30) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (probability: number) => {
    if (probability >= 80) return "bg-red-500";
    if (probability >= 60) return "bg-orange-500";
    if (probability >= 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-600";
    if (conf >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Just now";
    const date = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "< 1h ago";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const riskLevel = getHighestRisk();
  const maxProbability = Math.max(horizons["7d"], horizons["30d"], horizons["90d"]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Failure Probability
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", getRiskColor(riskLevel))}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Asset Info */}
        <div className="space-y-1">
          <div className="text-sm font-medium">{asset.name}</div>
          <div className="text-xs text-muted-foreground">{asset.type}</div>
        </div>

        {/* Probability Horizons */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Failure Probability by Time Horizon
          </h4>
          
          {/* 7 Day */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Next 7 days</span>
              <span className={cn("text-sm font-bold", getProbabilityColor(horizons["7d"]))}>
                {horizons["7d"].toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={horizons["7d"]} 
              className="h-1.5"
              indicatorClassName={getProgressColor(horizons["7d"])}
            />
          </div>

          {/* 30 Day */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Next 30 days</span>
              <span className={cn("text-sm font-bold", getProbabilityColor(horizons["30d"]))}>
                {horizons["30d"].toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={horizons["30d"]} 
              className="h-1.5"
              indicatorClassName={getProgressColor(horizons["30d"])}
            />
          </div>

          {/* 90 Day */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Next 90 days</span>
              <span className={cn("text-sm font-bold", getProbabilityColor(horizons["90d"]))}>
                {horizons["90d"].toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={horizons["90d"]} 
              className="h-1.5"
              indicatorClassName={getProgressColor(horizons["90d"])}
            />
          </div>
        </div>

        {/* Top Failure Modes */}
        {topFailureModes.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Top Predicted Failure Modes
            </h4>
            <div className="space-y-1">
              {topFailureModes.slice(0, 3).map((mode, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-foreground">{mode}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Updated {formatLastUpdated()}
            </span>
          </div>
          
          <div className="text-right">
            <div className={cn("text-xs font-medium", getConfidenceColor(confidence))}>
              {confidence}% confidence
            </div>
          </div>
        </div>

        {/* Warning for high risk */}
        {maxProbability >= 60 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800">
              {maxProbability >= 80 
                ? "Critical: High failure probability detected. Immediate attention required."
                : "Warning: Elevated failure risk. Consider scheduling preventive maintenance."
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}