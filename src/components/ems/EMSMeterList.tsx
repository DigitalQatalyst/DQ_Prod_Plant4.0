import { useState } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getEnergyTypeIcon } from "@/lib/energy-icons";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface EMSMeterListProps {
  meters: any[];
  selectedMeter?: any;
  onMeterSelect: (meter: any) => void;
  searchQuery?: string;
}

export function EMSMeterList({ meters, selectedMeter, onMeterSelect, searchQuery = "" }: EMSMeterListProps) {
  const filteredMeters = meters.filter((meter) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meter.name.toLowerCase().includes(query) ||
      meter.scope?.toLowerCase().includes(query) ||
      meter.energyTypes?.some((type: string) => type.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-1">
      {filteredMeters.map((meter) => (
        <EMSMeterListItem
          key={meter.id}
          meter={meter}
          isSelected={selectedMeter?.id === meter.id}
          onClick={() => onMeterSelect(meter)}
        />
      ))}
    </div>
  );
}

interface EMSMeterListItemProps {
  meter: any;
  isSelected: boolean;
  onClick: () => void;
}

export function EMSMeterListItem({ meter, isSelected, onClick }: EMSMeterListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-secondary/50 border border-transparent"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isSelected ? "bg-primary/20" : "bg-secondary"
        )}
      >
        <Activity className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {meter.name}
          </span>
          <StatusBadge status={meter.status?.toLowerCase() || "normal"} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{meter.scope}</p>
        {meter.energyTypes && (
          <div className="flex items-center gap-1 mb-2">
            {meter.energyTypes.map((type: string) => (
              <div key={type} className="flex items-center gap-1">
                {getEnergyTypeIcon(type)}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {meter.linkedAssets?.length || 0} assets
          </span>
          {meter.currentKW && (
            <span className="font-medium">{meter.currentKW.toFixed(1)} kW</span>
          )}
        </div>
      </div>
    </button>
  );
}