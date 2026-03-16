import React, { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { APMAssetList } from "./APMAssetList";
import { Asset } from "@/types/navigation";
import { useApp } from "@/context/AppContext";

interface APMPageShellProps {
  title: string;
  featureSetName: string;
  featureName: string;
  listType: "assets" | "events" | "workOrders";
  children: React.ReactNode;
  assets?: Asset[];
  selectedAsset?: Asset | null;
  onAssetSelect?: (asset: Asset) => void;
  subtitle?: string;
  actions?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function APMPageShell({
  title,
  featureSetName,
  featureName,
  listType,
  children,
  assets = [],
  selectedAsset,
  onAssetSelect,
  subtitle,
  actions,
  headerContent,
}: APMPageShellProps) {
  const { sector, subsector } = useApp();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [criticalityFilter, setCriticalityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Derive unique asset types from the list
  const assetTypes = useMemo(() => {
    const types = Array.from(new Set(assets.map((a) => a.type).filter(Boolean)));
    return types.sort();
  }, [assets]);

  // Apply search + filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search: name, type, location
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = asset.name.toLowerCase().includes(q);
        const matchType = asset.type?.toLowerCase().includes(q) ?? false;
        const matchLocation = asset.location?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchType && !matchLocation) return false;
      }
      // Status filter
      if (statusFilter !== "all" && asset.status !== statusFilter) return false;
      // Criticality filter
      if (criticalityFilter !== "all" && asset.criticality !== criticalityFilter) return false;
      // Type filter
      if (typeFilter !== "all" && asset.type !== typeFilter) return false;

      return true;
    });
  }, [assets, searchQuery, statusFilter, criticalityFilter, typeFilter]);

  const breadcrumbSubtitle = (
    <div className="flex items-center gap-2">
      <span>{featureSetName} → {featureName}</span>
      {sector && subsector && <SectorBadge sector={sector} subsector={subsector} />}
    </div>
  );

  const finalSubtitle = subtitle || breadcrumbSubtitle;

  return (
    <div className="flex h-full w-full">
      <ListPane
        title={listType === "assets" ? "Assets" : listType === "events" ? "Events" : "Work Orders"}
        subtitle={`${filteredAssets.length} of ${assets.length} items`}
        count={filteredAssets.length}
        searchPlaceholder="Search assets..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        criticalityFilter={criticalityFilter}
        onCriticalityChange={setCriticalityFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        assetTypes={assetTypes}
      >
        {listType === "assets" && assets.length > 0 ? (
          <APMAssetList
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onAssetSelect={onAssetSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No {listType} available
          </div>
        )}
      </ListPane>

      <WorkPane
        title={title}
        subtitle={finalSubtitle}
        actions={actions}
        headerContent={headerContent}
      >
        {children}
      </WorkPane>
    </div>
  );
}