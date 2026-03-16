import { KPICard } from "@/components/shared/KPICard";
import { Zap, Activity, DollarSign, Leaf } from "lucide-react";

interface EnergyKPIGridProps {
  currentKW?: number;
  dailyKWh?: number;
  energyCost?: number;
  co2Emissions?: number;
  baselinePercentage?: number;
  currency?: string;
}

export function EnergyKPIGrid({
  currentKW = 0,
  dailyKWh = 0,
  energyCost = 0,
  co2Emissions = 0,
  baselinePercentage,
  currency = "USD",
}: EnergyKPIGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        title="Instantaneous Demand"
        value={currentKW.toFixed(1)}
        unit="kW"
        subtitle="Current power draw"
        icon={Zap}
        variant="primary"
      />
      <KPICard
        title="Daily Consumption"
        value={dailyKWh.toFixed(0)}
        unit="kWh"
        subtitle="Today's usage"
        icon={Activity}
        variant="default"
        trend={baselinePercentage !== undefined ? (baselinePercentage > 0 ? "up" : "down") : undefined}
        trendValue={baselinePercentage !== undefined ? `${Math.abs(baselinePercentage).toFixed(1)}%` : undefined}
      />
      <KPICard
        title="Energy Cost Today"
        value={energyCost.toFixed(2)}
        unit={currency}
        subtitle="At current rates"
        icon={DollarSign}
        variant="default"
      />
      <KPICard
        title="CO₂ Emissions Today"
        value={co2Emissions.toFixed(1)}
        unit="kg"
        subtitle="Carbon footprint"
        icon={Leaf}
        variant="default"
      />
    </div>
  );
}