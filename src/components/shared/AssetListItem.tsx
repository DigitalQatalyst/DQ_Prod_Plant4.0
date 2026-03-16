import { cn } from "@/lib/utils";
import { Asset } from "@/types/navigation";
import { StatusBadge } from "./StatusBadge";
import { AlertTriangle, Cpu, Zap } from "lucide-react";
import { getEnergyTypeIcon } from "@/lib/energy-icons";

interface AssetListItemProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}

export function AssetListItem({ asset, isSelected, onClick }: AssetListItemProps) {
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
        <Cpu className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-primary" : "text-foreground"
            )}
          >
            {asset.name}
          </span>
          {asset.criticality === "critical" && (
            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {asset.type} · {asset.site}
          </p>
          {asset.energyConsumer && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              {asset.primaryEnergyType && getEnergyTypeIcon(asset.primaryEnergyType, { className: "w-3 h-3" })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={asset.status} size="sm" />
            {asset.nominalPowerKw && (
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {asset.nominalPowerKw} kW
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{asset.lastSeen}</span>
        </div>
      </div>
    </button>
  );
}
