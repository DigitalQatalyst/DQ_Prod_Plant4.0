import React from "react";
import { KPICard } from "@/components/shared/KPICard";
import { TrendingUp, TrendingDown, Target, Leaf, Zap, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IntensityMetric {
  type: "energy" | "carbon" | "cost" | "losses" | "efficiency" | "transmission";
  value: number;
  unit: string;
  benchmark?: number;
  target?: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface EnergyIntensityCardProps {
  metrics: IntensityMetric[];
  productionUnit?: string;
  title?: string;
  showBenchmarks?: boolean;
}

export function EnergyIntensityCard({
  metrics = [],
  productionUnit = "BBL",
  title = "Energy Intensity Metrics",
  showBenchmarks = true
}: EnergyIntensityCardProps) {
  // Default mock data if no metrics provided
  const defaultMetrics: IntensityMetric[] = [
    {
      type: "energy",
      value: 15.2,
      unit: "kWh",
      benchmark: 14.8,
      target: 13.5,
      trend: "up",
      trendValue: "+2.7%"
    },
    {
      type: "carbon",
      value: 6.84,
      unit: "kg CO2",
      benchmark: 6.66,
      target: 6.08,
      trend: "up",
      trendValue: "+2.7%"
    },
    {
      type: "cost",
      value: 1.82,
      unit: "USD",
      benchmark: 1.78,
      target: 1.62,
      trend: "up",
      trendValue: "+2.2%"
    }
  ];

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;
  const getMetricIcon = (type: string) => {
    switch (type) {
      case "energy":
        return Zap;
      case "carbon":
        return Leaf;
      case "cost":
        return DollarSign;
      case "losses":
        return TrendingDown;
      case "efficiency":
        return Target;
      default:
        return TrendingUp;
    }
  };

  const getMetricVariant = (type: string) => {
    switch (type) {
      case "energy":
        return "primary" as const;
      case "carbon":
        return "success" as const;
      case "cost":
        return "warning" as const;
      case "losses":
        return "destructive" as const;
      case "efficiency":
        return "success" as const;
      default:
        return "default" as const;
    }
  };

  const getBenchmarkStatus = (metric: IntensityMetric) => {
    if (!metric.benchmark) return null;

    const deviation = ((metric.value - metric.benchmark) / metric.benchmark) * 100;
    if (Math.abs(deviation) <= 5) return { status: "On Target", variant: "default" as const };
    if (deviation > 0) return { status: "Above Benchmark", variant: "destructive" as const };
    return { status: "Below Benchmark", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      {/* Intensity KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {displayMetrics.map((metric, index) => {
          const Icon = getMetricIcon(metric.type || 'default');
          return (
            <KPICard
              key={index}
              title={`${metric.type ? metric.type.charAt(0).toUpperCase() + metric.type.slice(1) : 'Unknown'} Intensity`}
              value={metric.value?.toFixed(2) || '0.00'}
              unit={`${metric.unit || 'units'}/${productionUnit}`}
              subtitle={`Per ${productionUnit} produced`}
              icon={Icon}
              variant={getMetricVariant(metric.type || 'default')}
              trend={metric.trend}
              trendValue={metric.trendValue}
            />
          );
        })}
      </div>

      {/* Benchmark Comparison */}
      {showBenchmarks && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Benchmark Comparison
          </h4>
          <div className="space-y-4">
            {displayMetrics.map((metric, index) => {
              if (!metric.benchmark) return null;

              const benchmarkStatus = getBenchmarkStatus(metric);
              const deviation = ((metric.value - metric.benchmark) / metric.benchmark) * 100;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      {React.createElement(getMetricIcon(metric.type || 'default'), {
                        className: "w-4 h-4 text-primary"
                      })}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{metric.type || 'Unknown'} Intensity</p>
                      <p className="text-xs text-muted-foreground">
                        {metric.value?.toFixed(2) || '0.00'} vs {metric.benchmark?.toFixed(2) || '0.00'} {metric.unit || 'units'}/{productionUnit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={benchmarkStatus?.variant || "secondary"}>
                      {benchmarkStatus?.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs">
                      {deviation > 0 ? (
                        <TrendingUp className="w-3 h-3 text-destructive" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-success" />
                      )}
                      <span className={deviation > 0 ? "text-destructive" : "text-success"}>
                        {Math.abs(deviation).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intensity Drivers */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Intensity Drivers</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Contributing Factors</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Gas compressor loading (65% efficiency)</li>
              <li>• ESP pump cycling frequency</li>
              <li>• Facility HVAC load variations</li>
              <li>• Production rate fluctuations</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Optimization Opportunities</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Optimize compressor operating point</li>
              <li>• Implement variable speed drives</li>
              <li>• Schedule non-critical loads</li>
              <li>• Improve process efficiency</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Target Bands */}
      {displayMetrics.some(m => m.target) && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">Target Performance Bands</h4>
          <div className="space-y-3">
            {displayMetrics.filter(m => m.target).map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{metric.type || 'Unknown'} Intensity</span>
                  <span className="text-xs text-muted-foreground">
                    Target: {metric.target?.toFixed(2) || '0.00'} {metric.unit || 'units'}/{productionUnit}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((metric.value / (metric.target || metric.value)) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>Current: {metric.value?.toFixed(2) || '0.00'}</span>
                  <span>Target: {metric.target?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}