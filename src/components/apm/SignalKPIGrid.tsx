import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Asset, TelemetryDataPoint } from "@/types/navigation";
import { Gauge, Thermometer, Zap, Droplets, Activity, AlertTriangle } from "lucide-react";

interface SignalKPIGridProps {
  asset: Asset;
  telemetryData?: { [parameter: string]: TelemetryDataPoint[] };
  assetType?: string;
  showStatus?: boolean;
}

interface KPIConfig {
  parameter: string;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  normalRange?: [number, number];
  warningRange?: [number, number];
}

export function SignalKPIGrid({
  asset,
  telemetryData = {},
  assetType,
  showStatus = true,
}: SignalKPIGridProps) {
  // Asset-type-aware KPI configurations
  const getKPIConfig = (type: string): KPIConfig[] => {
    switch (type?.toLowerCase()) {
      case "wellhead":
        return [
          { parameter: "tubingPressure", label: "Tubing Pressure", unit: "psi", icon: Gauge, normalRange: [2800, 2900], warningRange: [2700, 3000] },
          { parameter: "casingPressure", label: "Casing Pressure", unit: "psi", icon: Gauge, normalRange: [3150, 3250], warningRange: [3100, 3300] },
          { parameter: "temperature", label: "Temperature", unit: "°F", icon: Thermometer, normalRange: [175, 195], warningRange: [165, 205] },
          { parameter: "flowRate", label: "Flow Rate", unit: "bbl/day", icon: Droplets, normalRange: [1200, 1300], warningRange: [1100, 1400] },
        ];
      case "esp pump":
        return [
          { parameter: "motorCurrent", label: "Motor Current", unit: "A", icon: Zap, normalRange: [42, 48], warningRange: [40, 50] },
          { parameter: "intakePressure", label: "Intake Pressure", unit: "psi", icon: Gauge, normalRange: [1800, 1900], warningRange: [1750, 1950] },
          { parameter: "dischargePressure", label: "Discharge Pressure", unit: "psi", icon: Gauge, normalRange: [3100, 3300], warningRange: [3000, 3400] },
          { parameter: "vibration", label: "Vibration", unit: "mm/s", icon: Activity, normalRange: [1.8, 2.4], warningRange: [1.5, 2.7] },
        ];
      case "gas compressor":
        return [
          { parameter: "suctionPressure", label: "Suction Pressure", unit: "psi", icon: Gauge, normalRange: [820, 880], warningRange: [800, 900] },
          { parameter: "dischargePressure", label: "Discharge Pressure", unit: "psi", icon: Gauge, normalRange: [1400, 1500], warningRange: [1350, 1550] },
          { parameter: "gasTemp", label: "Gas Temperature", unit: "°F", icon: Thermometer, normalRange: [155, 175], warningRange: [145, 185] },
          { parameter: "vibration", label: "Vibration", unit: "mm/s", icon: Activity, normalRange: [4.0, 5.6], warningRange: [3.5, 6.0] },
        ];
      default:
        return [
          { parameter: "pressure", label: "Pressure", unit: "psi", icon: Gauge },
          { parameter: "temperature", label: "Temperature", unit: "°F", icon: Thermometer },
          { parameter: "flowRate", label: "Flow Rate", unit: "units", icon: Droplets },
        ];
    }
  };

  const getValueStatus = (value: number, config: KPIConfig): "normal" | "warning" | "critical" => {
    if (!config.normalRange || !config.warningRange) return "normal";
    
    const [normalMin, normalMax] = config.normalRange;
    const [warningMin, warningMax] = config.warningRange;
    
    if (value >= normalMin && value <= normalMax) return "normal";
    if (value >= warningMin && value <= warningMax) return "warning";
    return "critical";
  };

  const getStatusColor = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "normal":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const kpiConfigs = getKPIConfig(assetType || asset.type);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiConfigs.map((config) => {
        const parameterData = telemetryData[config.parameter];
        const latestValue = parameterData && parameterData.length > 0 
          ? parameterData[parameterData.length - 1] 
          : null;
        
        const value = latestValue?.value ?? 0;
        const status = latestValue ? getValueStatus(value, config) : "normal";
        const IconComponent = config.icon;
        
        return (
          <Card key={config.parameter} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                  {config.label}
                </CardTitle>
                {showStatus && status !== "normal" && (
                  <AlertTriangle className={cn("w-4 h-4", 
                    status === "warning" ? "text-yellow-500" : "text-red-500"
                  )} />
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-2xl font-bold", 
                    status === "normal" ? "text-foreground" : 
                    status === "warning" ? "text-yellow-600" : "text-red-600"
                  )}>
                    {latestValue ? value.toFixed(1) : "--"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {config.unit}
                  </span>
                </div>
                
                {showStatus && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(status))}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                )}
                
                {latestValue && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(latestValue.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}