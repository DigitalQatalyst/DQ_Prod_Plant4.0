import { KPICard } from "@/components/shared/KPICard";
import { Zap, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PowerQualityData {
  powerFactor: number;
  thdPct: number;
  voltageV: number;
  frequencyHz: number;
  sagEventsCount?: number;
  swellEventsCount?: number;
}

interface PowerQualityCardProps {
  data: PowerQualityData;
  title?: string;
}

export function PowerQualityCard({ data, title = "Power Quality Metrics" }: PowerQualityCardProps) {
  const getPowerFactorStatus = (pf: number) => {
    if (pf >= 0.95) return { status: "Excellent", variant: "success" as const };
    if (pf >= 0.90) return { status: "Good", variant: "default" as const };
    if (pf >= 0.85) return { status: "Fair", variant: "warning" as const };
    return { status: "Poor", variant: "destructive" as const };
  };

  const getTHDStatus = (thd: number) => {
    if (thd <= 5) return { status: "Good", variant: "success" as const };
    if (thd <= 8) return { status: "Fair", variant: "warning" as const };
    return { status: "Poor", variant: "destructive" as const };
  };

  const getVoltageStatus = (voltage: number, nominal: number = 480) => {
    const deviation = Math.abs((voltage - nominal) / nominal) * 100;
    if (deviation <= 5) return { status: "Normal", variant: "success" as const };
    if (deviation <= 10) return { status: "Caution", variant: "warning" as const };
    return { status: "Alert", variant: "destructive" as const };
  };

  const pfStatus = getPowerFactorStatus(data.powerFactor);
  const thdStatus = getTHDStatus(data.thdPct);
  const voltageStatus = getVoltageStatus(data.voltageV);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {/* Main PQ Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Power Factor"
          value={data.powerFactor.toFixed(3)}
          subtitle={pfStatus.status}
          icon={Zap}
          variant={pfStatus.variant}
        />
        <KPICard
          title="THD"
          value={data.thdPct.toFixed(1)}
          unit="%"
          subtitle={thdStatus.status}
          icon={Activity}
          variant={thdStatus.variant}
        />
        <KPICard
          title="Voltage"
          value={data.voltageV.toFixed(0)}
          unit="V"
          subtitle={voltageStatus.status}
          icon={TrendingUp}
          variant={voltageStatus.variant}
        />
        <KPICard
          title="Frequency"
          value={data.frequencyHz.toFixed(1)}
          unit="Hz"
          subtitle="Grid frequency"
          icon={Activity}
          variant="default"
        />
      </div>

      {/* PQ Events */}
      {(data.sagEventsCount !== undefined || data.swellEventsCount !== undefined) && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Power Quality Events (24h)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Voltage Sags</p>
                <p className="text-xs text-muted-foreground">Below 90% nominal</p>
              </div>
              <Badge variant={data.sagEventsCount && data.sagEventsCount > 0 ? "destructive" : "secondary"}>
                {data.sagEventsCount || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Voltage Swells</p>
                <p className="text-xs text-muted-foreground">Above 110% nominal</p>
              </div>
              <Badge variant={data.swellEventsCount && data.swellEventsCount > 0 ? "destructive" : "secondary"}>
                {data.swellEventsCount || 0}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}