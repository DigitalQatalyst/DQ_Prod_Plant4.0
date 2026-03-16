import { KPICard } from "@/components/shared/KPICard";
import { getEnergyTypeIcon, energyTypeConfig } from "@/lib/energy-icons";
import { Zap, Flame, Droplets, Activity, Wind } from "lucide-react";

interface EnergyStream {
  type: "electricity" | "gas" | "diesel" | "steam" | "water" | "compressed_air";
  value: number;
  unit: string;
  cost?: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface MultiStreamKPIGridProps {
  streams: EnergyStream[];
  scope?: string;
}

export function MultiStreamKPIGrid({ streams = [], scope }: MultiStreamKPIGridProps) {
  // Default mock data if no streams provided
  const defaultStreams: EnergyStream[] = [
    {
      type: "electricity",
      value: 1245.3,
      unit: "kWh",
      cost: 149.44,
      trend: "up",
      trendValue: "+2.3%"
    },
    {
      type: "gas",
      value: 892.7,
      unit: "MMBtu",
      cost: 4018.15,
      trend: "down",
      trendValue: "-1.8%"
    },
    {
      type: "diesel",
      value: 45.2,
      unit: "L",
      cost: 56.50,
      trend: "neutral",
      trendValue: "0%"
    },
    {
      type: "steam",
      value: 234.1,
      unit: "lb",
      cost: 78.25,
      trend: "up",
      trendValue: "+0.5%"
    }
  ];

  const displayStreams = streams.length > 0 ? streams : defaultStreams;

  const getIconForType = (type: string) => {
    switch (type) {
      case "electricity":
        return Zap;
      case "gas":
        return Flame;
      case "diesel":
        return Droplets;
      case "steam":
        return Activity;
      case "water":
        return Droplets;
      case "compressed_air":
        return Wind;
      default:
        return Activity;
    }
  };

  const getVariantForType = (type: string) => {
    switch (type) {
      case "electricity":
        return "primary" as const;
      case "gas":
        return "warning" as const;
      case "diesel":
        return "default" as const;
      case "steam":
        return "success" as const;
      case "water":
        return "flow" as const;
      case "compressed_air":
        return "pressure" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <div className="space-y-4">
      {scope && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Energy Streams</h3>
          <span className="text-sm text-muted-foreground">• {scope}</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStreams.map((stream) => (
          <KPICard
            key={stream.type}
            title={energyTypeConfig[stream.type]?.label || stream.type}
            value={stream.value.toFixed(1)}
            unit={stream.unit}
            subtitle={stream.cost ? `$${stream.cost.toFixed(2)} cost` : undefined}
            icon={getIconForType(stream.type)}
            variant={getVariantForType(stream.type)}
            trend={stream.trend}
            trendValue={stream.trendValue}
          />
        ))}
      </div>
    </div>
  );
}