import { AlertTriangle, TrendingUp, Clock, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/KPICard";

interface PeakDemandData {
  currentDemand: number;
  peakThreshold: number;
  monthlyPeak: number;
  timeToThreshold?: number; // minutes
  projectedPeak?: number;
}

interface LoadShiftingWindow {
  startTime: string;
  endTime: string;
  potentialSavings: number;
  description: string;
}

interface PeakDemandPanelProps {
  data: PeakDemandData;
  loadShiftingWindows?: LoadShiftingWindow[];
  unit?: string;
}

export function PeakDemandPanel({ 
  data, 
  loadShiftingWindows = [], 
  unit = "kW" 
}: PeakDemandPanelProps) {
  const thresholdPercentage = (data.currentDemand / data.peakThreshold) * 100;
  const isApproachingLimit = thresholdPercentage > 85;
  const isOverLimit = thresholdPercentage > 100;

  const getStatusVariant = () => {
    if (isOverLimit) return "destructive" as const;
    if (isApproachingLimit) return "warning" as const;
    return "success" as const;
  };

  return (
    <div className="space-y-6">
      {/* Peak Demand Status */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Current Demand"
          value={data.currentDemand.toFixed(1)}
          unit={unit}
          subtitle="Real-time load"
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Peak Threshold"
          value={data.peakThreshold.toFixed(1)}
          unit={unit}
          subtitle={`${thresholdPercentage.toFixed(1)}% utilized`}
          icon={AlertTriangle}
          variant={getStatusVariant()}
        />
        <KPICard
          title="Monthly Peak"
          value={data.monthlyPeak.toFixed(1)}
          unit={unit}
          subtitle="Highest this month"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Warning Panel */}
      {isApproachingLimit && (
        <div className={`bg-card border rounded-lg p-6 ${
          isOverLimit ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 mt-0.5 ${
              isOverLimit ? 'text-destructive' : 'text-warning'
            }`} />
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                isOverLimit ? 'text-destructive' : 'text-warning'
              }`}>
                {isOverLimit ? 'Peak Demand Exceeded!' : 'Approaching Peak Limit'}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {isOverLimit 
                  ? `Current demand is ${(thresholdPercentage - 100).toFixed(1)}% over the peak threshold.`
                  : `Current demand is at ${thresholdPercentage.toFixed(1)}% of peak threshold.`
                }
                {data.timeToThreshold && data.timeToThreshold > 0 && (
                  ` Estimated ${data.timeToThreshold} minutes to threshold at current rate.`
                )}
              </p>
              {data.projectedPeak && (
                <p className="text-sm text-muted-foreground">
                  Projected peak: {data.projectedPeak.toFixed(1)} {unit}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Load Shifting Recommendations */}
      {loadShiftingWindows.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Suggested Load Shifting Windows
          </h4>
          <div className="space-y-3">
            {loadShiftingWindows.map((window, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {window.startTime} - {window.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">{window.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Save {window.potentialSavings.toFixed(1)} {unit}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Peak Demand Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">What's driving the peak?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Gas compressor at 95% load</li>
              <li>• ESP pumps running simultaneously</li>
              <li>• Camp HVAC during peak hours</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Optimization opportunities</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Stagger ESP pump starts</li>
              <li>• Pre-cool camp facilities</li>
              <li>• Optimize compressor loading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}