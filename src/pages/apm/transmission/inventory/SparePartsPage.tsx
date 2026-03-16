import { useState } from "react";
import { useSpareParts, useAssets } from "@/hooks/useAPM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Package, Filter, AlertCircle } from "lucide-react";
import { TransmissionAssetType } from "@/types/apm";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function SparePartsPage() {
  const [search, setSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<TransmissionAssetType | "all">("all");
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<NavigationAsset | null>(null);

  const { data: assetsResponse } = useAssets({ pageSize: 100 });
  const apmAssets = assetsResponse?.data || [];

  const { data: spareParts, isLoading, error } = useSpareParts({
    asset_type: assetTypeFilter !== "all" ? assetTypeFilter : undefined,
  });

  const filteredParts = spareParts?.filter((part) =>
    search
      ? part.part_number.toLowerCase().includes(search.toLowerCase()) ||
      part.description.toLowerCase().includes(search.toLowerCase())
      : true
  );

  // Convert to navigation assets for sidebar
  const navigationAssets: NavigationAsset[] = apmAssets.map(a => {
    let criticality: "low" | "medium" | "high" | "critical" = "medium";
    if (a.criticality === "Critical") criticality = "critical";
    else if (a.criticality === "Important") criticality = "high";
    else if (a.criticality === "Standard") criticality = "medium";

    let status: "online" | "offline" | "pending" | "maintenance" = "online";
    if (a.operational_status === "online") status = "online";
    else if (a.operational_status === "offline") status = "offline";
    else if (a.operational_status === "maintenance") status = "maintenance";
    else if (a.operational_status === "pending") status = "pending";

    return {
      id: a.id,
      name: a.name,
      type: a.asset_type || "Unknown",
      site: "Main Substation",
      area: "Transmission",
      lastSeen: "Real-time",
      location: a.location || "",
      status: status,
      criticality: criticality,
    };
  });

  const handleAssetSelection = (asset: NavigationAsset) => {
    setSelectedAssetLocal(asset);
    if (asset.type) {
      setAssetTypeFilter(asset.type as TransmissionAssetType);
    }
  };

  const getStockStatus = (onHand: number, reorderPoint: number) => {
    if (onHand === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (onHand <= reorderPoint) return { label: "Low Stock", variant: "default" as const };
    return { label: "In Stock", variant: "secondary" as const };
  };

  return (
    <APMPageShell
      title="Spare Parts Library"
      featureSetName="Asset Inventory & Criticality"
      featureName="Spare Parts Library"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={selectedAssetLocal}
      onAssetSelect={handleAssetSelection}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Inventory Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search part number or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Asset Type</label>
                <Select value={assetTypeFilter} onValueChange={(value) => setAssetTypeFilter(value as TransmissionAssetType | "all")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="power_transformer">Power Transformer</SelectItem>
                    <SelectItem value="circuit_breaker">Circuit Breaker</SelectItem>
                    <SelectItem value="transmission_line">Transmission Line</SelectItem>
                    <SelectItem value="protection_relay">Protection Relay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spare Parts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spare Parts ({filteredParts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingState isLoading loadingText="Loading spare parts..." />
              </div>
            ) : error ? (
              <EmptyState
                icon={Package}
                title="Error loading spare parts"
                description={error.message || "Failed to load spare parts library"}
              />
            ) : !filteredParts?.length ? (
              <EmptyState
                icon={Package}
                title="No spare parts found"
                description="No spare parts match your current filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Applicable Types</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => {
                      const stockStatus = getStockStatus(part.on_hand_quantity, part.reorder_point);
                      return (
                        <TableRow key={part.id} className={part.is_critical ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{part.part_number}</span>
                              {part.is_critical && (
                                <AlertCircle className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{part.description}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {part.applicable_asset_types?.map((type) => (
                                <Badge key={type} variant="outline" className="text-[10px] px-1 h-4">
                                  {type.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="font-medium">{part.on_hand_quantity}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-muted-foreground">{part.reorder_point} (min)</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">${part.unit_cost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant} className="px-2 py-0 h-5 text-[10px]">{stockStatus.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}
