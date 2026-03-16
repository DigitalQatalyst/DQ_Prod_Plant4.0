import React from "react";
import { cn } from "@/lib/utils";
import { Asset } from "@/types/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, MapPin } from "lucide-react";

interface APMAssetListProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onAssetSelect?: (asset: Asset) => void;
  filterCriteria?: {
    criticality?: string[];
    status?: string[];
    anomalyState?: string[];
  };
}

export function APMAssetList({
  assets,
  selectedAsset,
  onAssetSelect,
  filterCriteria,
}: APMAssetListProps) {
  // Filter assets based on criteria
  const filteredAssets = assets.filter((asset) => {
    if (filterCriteria?.criticality && !filterCriteria.criticality.includes(asset.criticality || "")) {
      return false;
    }
    if (filterCriteria?.status && !filterCriteria.status.includes(asset.status)) {
      return false;
    }
    if (filterCriteria?.anomalyState && !filterCriteria.anomalyState.includes(asset.anomalyState || "")) {
      return false;
    }
    return true;
  });

  const getCriticalityColor = (criticality?: string) => {
    switch (criticality) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  const getAnomalyStateColor = (anomalyState?: string) => {
    switch (anomalyState) {
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "Warning":
        return "bg-orange-500 text-white";
      case "Normal":
        return "bg-green-500 text-white";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getHealthIndexColor = (healthIndex?: number) => {
    if (!healthIndex) return "text-muted-foreground";
    if (healthIndex >= 80) return "text-green-600";
    if (healthIndex >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-1">
      {filteredAssets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => onAssetSelect?.(asset)}
          className={cn(
            "w-full flex flex-col gap-2 p-3 rounded-lg text-left transition-all duration-200",
            selectedAsset?.id === asset.id
              ? "bg-primary/10 border border-primary/30"
              : "hover:bg-secondary/50 border border-transparent"
          )}
        >
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    selectedAsset?.id === asset.id ? "text-primary" : "text-foreground"
                  )}
                >
                  {asset.name}
                </span>
                {asset.criticality === "critical" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {asset.type}
              </p>
            </div>
            
            {/* Health Index */}
            {asset.healthIndex && (
              <div className="flex items-center gap-1 shrink-0">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className={cn("text-xs font-medium", getHealthIndexColor(asset.healthIndex))}>
                  {asset.healthIndex}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          {asset.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{asset.location}</span>
            </div>
          )}

          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={asset.status} size="sm" />
              
              {/* Criticality Badge */}
              {asset.criticality && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0.5", getCriticalityColor(asset.criticality))}
                >
                  {asset.criticality.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Anomaly State */}
            {asset.anomalyState && (
              <Badge
                className={cn("text-[10px] px-1.5 py-0.5", getAnomalyStateColor(asset.anomalyState))}
              >
                {asset.anomalyState}
              </Badge>
            )}
          </div>

          {/* Last Seen */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">
              Last seen: {asset.lastSeen}
            </span>
          </div>
        </button>
      ))}

      {filteredAssets.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          No assets match the current filters
        </div>
      )}
    </div>
  );
}