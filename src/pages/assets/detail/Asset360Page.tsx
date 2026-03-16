import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDataProvider } from "@/hooks/useDataProvider";
import { cn } from "@/lib/utils";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import type { AssetFilter, TransmissionAsset } from "@/types/transmission";
import { TransmissionAssetDetailContent } from "@/pages/assets/detail/TransmissionAssetDetailPage";

interface AssetWithDetails extends TransmissionAsset {
  siteName?: string;
}

const DEFAULT_PAGE_SIZE = 25;

export function Asset360Page() {
  const { provider } = useDataProvider();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [tenantId, setTenantId] = useState<string>("");
  const [assets, setAssets] = useState<AssetWithDetails[]>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [assetTypes, setAssetTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(id ?? null);
  const [filters, setFilters] = useState<AssetFilter>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalAssets, setTotalAssets] = useState(0);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setSelectedAssetId(id ?? null);
  }, [id]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const defaultTenantId = await provider.getDefaultTransmissionTenantId();
      setTenantId(defaultTenantId);

      const [sitesData, assetTypesData] = await Promise.all([
        provider.getSitesByTenant(defaultTenantId),
        provider.getAssetTypesByTenant(defaultTenantId),
      ]);

      setSites(sitesData);
      setAssetTypes(assetTypesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const loadAssets = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const allAssets = await provider.getTransmissionAssetsByTenant(tenantId);
      let filteredAssets = allAssets;

      if (filters.siteId) {
        filteredAssets = filteredAssets.filter(asset => asset.siteId === filters.siteId);
      }

      if (filters.assetTypeId) {
        filteredAssets = filteredAssets.filter(asset => asset.assetTypeId === filters.assetTypeId);
      }

      if (filters.status) {
        filteredAssets = filteredAssets.filter(asset => asset.status === filters.status);
      }

      if (filters.criticality) {
        filteredAssets = filteredAssets.filter(asset => asset.criticality === filters.criticality);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredAssets = filteredAssets.filter(asset => asset.name.toLowerCase().includes(searchLower));
      }

      filteredAssets.sort((a, b) => {
        let aValue: string | number = "";
        let bValue: string | number = "";

        switch (sortBy) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "criticality": {
            const criticalityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
            aValue = criticalityOrder[a.criticality] || 0;
            bValue = criticalityOrder[b.criticality] || 0;
            break;
          }
          case "siteName": {
            const aSite = sites.find(s => s.id === a.siteId);
            const bSite = sites.find(s => s.id === b.siteId);
            aValue = aSite?.name || "";
            bValue = bSite?.name || "";
            break;
          }
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDir === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortDir === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      });

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

      const enrichedAssets: AssetWithDetails[] = paginatedAssets.map(asset => ({
        ...asset,
        siteName: sites.find(s => s.id === asset.siteId)?.name,
        assetTypeName: assetTypes.find(t => t.id === asset.assetTypeId)?.name || asset.assetTypeName,
      }));

      setAssets(enrichedAssets);
      setTotalAssets(filteredAssets.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [tenantId, provider, filters, sortBy, sortDir, sites, assetTypes, currentPage, pageSize]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (tenantId) {
      loadAssets();
    }
  }, [tenantId, filters, currentPage, pageSize, sortBy, sortDir, loadAssets]);

  const handleFilterChange = (key: keyof AssetFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" || !value ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalAssets / pageSize);

  const filterConfigs = [
    {
      key: "site",
      label: "Site",
      value: filters.siteId || "all",
      onChange: (val: string) => handleFilterChange("siteId", val),
      options: [{ value: "all", label: "All Sites" }, ...sites.map(s => ({ value: s.id, label: s.name }))],
    },
    {
      key: "assetType",
      label: "Asset Type",
      value: filters.assetTypeId || "all",
      onChange: (val: string) => handleFilterChange("assetTypeId", val),
      options: [{ value: "all", label: "All Types" }, ...assetTypes.map(t => ({ value: t.id, label: t.name }))],
    },
    {
      key: "status",
      label: "Status",
      value: filters.status || "all",
      onChange: (val: string) => handleFilterChange("status", val),
      options: [
        { value: "all", label: "All Statuses" },
        { value: "online", label: "Online" },
        { value: "offline", label: "Offline" },
        { value: "maintenance", label: "Maintenance" },
      ],
    },
    {
      key: "criticality",
      label: "Criticality",
      value: filters.criticality || "all",
      onChange: (val: string) => handleFilterChange("criticality", val),
      options: [
        { value: "all", label: "All Levels" },
        { value: "critical", label: "Critical" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
  ];

  const listActions = (
    <div className="flex items-center justify-between w-full mt-2">
      <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs">
        Clear Filters
      </Button>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Previous Page</span>
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {currentPage} / {totalPages || 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <span className="sr-only">Next Page</span>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const handleAssetSelect = (asset: AssetWithDetails) => {
    setSelectedAssetId(asset.id);
    navigate(`/assets/detail/360/${asset.id}`);
  };

  return (
    <>
      <ListPane
        title="Asset 360 View"
        subtitle={`${totalAssets} total assets`}
        count={totalAssets}
        searchPlaceholder="Filter assets..."
        onSearch={(val) => handleFilterChange("search", val)}
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={listActions}
      >
        {loading && assets.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground text-sm">{error}</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No assets match filters
          </div>
        ) : (
          <div className="space-y-1">
            {assets.map(asset => (
              <div
                key={asset.id}
                onClick={() => handleAssetSelect(asset)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedAssetId === asset.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card/50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium leading-none mb-1">{asset.name}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {asset.assetTypeName} • {asset.siteName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={asset.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={asset.criticality} />
                  <span className="text-[10px] text-muted-foreground font-mono">{asset.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ListPane>

      {selectedAssetId ? (
        <TransmissionAssetDetailContent assetId={selectedAssetId} showBack={false} />
      ) : (
        <WorkPane title="Asset 360 View" subtitle="No asset selected">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select an asset</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Choose an asset from the list to see the Transmission 360 context view.
            </p>
          </div>
        </WorkPane>
      )}
    </>
  );
}