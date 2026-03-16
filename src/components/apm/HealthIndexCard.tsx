import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Asset } from "@/types/navigation";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HealthIndexCardProps {
  asset: Asset;
  breakdown?: {
    vibrationScore: number;
    temperatureScore: number;
    pressureScore: number;
    electricalScore: number;
    runtimeFactor: number;
  };
  showTrend?: boolean;
  trend?: "improving" | "stable" | "degrading";
  healthScore?: number; // Allow override of health score
}

export function HealthIndexCard({
  asset,
  breakdown,
  showTrend = true,
  trend = "stable",
  healthScore,
}: HealthIndexCardProps) {
  const healthIndex = healthScore !== undefined ? healthScore : (asset.healthIndex || 0);
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Good", color: "bg-green-500/10 text-green-600 border-green-500/20" };
    if (score >= 60) return { label: "Fair", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
    return { label: "Poor", color: "bg-red-500/10 text-red-600 border-red-500/20" };
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

  const status = getHealthStatus(healthIndex);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Index
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", status.color)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Health Score */}
        <div className="text-center">
          <div className={cn("text-3xl font-bold", getHealthColor(healthIndex))}>
            {healthIndex}
          </div>
          <div className="text-sm text-muted-foreground">out of 100</div>
          
          {/* Progress Ring Visual */}
          <div className="mt-3">
            <Progress 
              value={healthIndex} 
              className="h-2"
              indicatorClassName={getHealthBgColor(healthIndex)}
            />
          </div>
        </div>

        {/* Trend Indicator */}
        {showTrend && (
          <div className="flex items-center justify-center gap-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {trend === "improving" ? "Improving" : trend === "degrading" ? "Degrading" : "Stable"}
            </span>
          </div>
        )}

        {/* Breakdown Factors */}
        {breakdown && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contributing Factors
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vibration</span>
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.vibrationScore} className="w-16 h-1.5" />
                  <span className={cn("text-xs font-medium w-8", getHealthColor(breakdown.vibrationScore))}>
                    {breakdown.vibrationScore}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Temperature</span>
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.temperatureScore} className="w-16 h-1.5" />
                  <span className={cn("text-xs font-medium w-8", getHealthColor(breakdown.temperatureScore))}>
                    {breakdown.temperatureScore}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pressure</span>
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.pressureScore} className="w-16 h-1.5" />
                  <span className={cn("text-xs font-medium w-8", getHealthColor(breakdown.pressureScore))}>
                    {breakdown.pressureScore}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Electrical</span>
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.electricalScore} className="w-16 h-1.5" />
                  <span className={cn("text-xs font-medium w-8", getHealthColor(breakdown.electricalScore))}>
                    {breakdown.electricalScore}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Runtime</span>
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.runtimeFactor} className="w-16 h-1.5" />
                  <span className={cn("text-xs font-medium w-8", getHealthColor(breakdown.runtimeFactor))}>
                    {breakdown.runtimeFactor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}