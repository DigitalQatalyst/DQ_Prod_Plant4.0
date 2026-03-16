import { useState } from "react";
import { useAssets } from "@/hooks/useAPM";
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
import { Search, Download, RefreshCw, Filter, Database } from "lucide-react";
import { TransmissionAssetType, OperationalStatus, CriticalityTier, LifecycleStage } from "@/types/apm";
import { useNavigate } from "react-router-dom";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function AssetRegistryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<TransmissionAssetType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OperationalStatus | "all">("all");
  const [criticalityFilter, setCriticalityFilter] = useState<CriticalityTier | "all">("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleStage | "all">("all");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: assetsResponse, loading, error, refetch } = useAssets({
    sector: "power_transmission",
    asset_type: assetTypeFilter !== "all" ? assetTypeFilter : undefined,
    operational_status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
    pageSize: 100,
  });

  const apmAssets = assetsResponse?.data || [];

  const filteredAssets = apmAssets.filter((asset) => {
    if (criticalityFilter !== "all" && asset.criticality !== criticalityFilter) return false;
    if (lifecycleFilter !== "all" && asset.lifecycle_stage !== lifecycleFilter) return false;
    if (locationFilter && !asset.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  // Convert to navigation assets for sidebar
  const navigationAssets: NavigationAsset[] = apmAssets.map(a => {
    // Map criticality tier to navigation criticality
    let criticality: "low" | "medium" | "high" | "critical" = "medium";
    if (a.criticality === "Critical") criticality = "critical";
    else if (a.criticality === "Important") criticality = "high";
    else if (a.criticality === "Standard") criticality = "medium";

    // Map operational status to navigation status
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
    navigate(`/monitor/inventory-criticality/registry/${asset.id}`);
  };

  const handleExportCSV = () => {
    if (!filteredAssets) return;

    const headers = ["Asset Tag", "Name", "Type", "Location", "Voltage (kV)", "Status", "Criticality", "Lifecycle", "Updated"];
    const rows = filteredAssets.map((asset) => [
      asset.asset_tag || "",
      asset.name,
      asset.asset_type,
      asset.location,
      asset.voltage_kv?.toString() || "",
      asset.operational_status,
      asset.criticality,
      asset.lifecycle_stage,
      new Date(asset.updated_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transmission-assets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCriticalityColor = (criticality: CriticalityTier) => {
    switch (criticality) {
      case "Critical":
        return "destructive";
      case "Important":
        return "default";
      case "Standard":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: OperationalStatus) => {
    switch (status) {
      case "online":
        return "default";
      case "offline":
        return "destructive";
      case "maintenance":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <APMPageShell
      title="Asset Registry"
      featureSetName="Asset Inventory & Criticality"
      featureName="Asset Registry"
      listType="assets"
      assets={navigationAssets}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredAssets?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 xl:col-span-1">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Asset Type Filter */}
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Type</label>
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
                    <SelectItem value="substation_bay">Substation Bay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OperationalStatus | "all")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Criticality Filter */}
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Criticality</label>
                <Select value={criticalityFilter} onValueChange={(value) => setCriticalityFilter(value as CriticalityTier | "all")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Criticality</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Assets Inventory ({filteredAssets?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingState isLoading loadingText="Loading assets..." />
              </div>
            ) : error ? (
              <EmptyState
                icon={Database}
                title="Error loading assets"
                description={error.message || "Failed to load transmission assets"}
              />
            ) : !filteredAssets?.length ? (
              <EmptyState
                icon={Database}
                title="No assets found"
                description="No transmission assets match your current filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Voltage (kV)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criticality</TableHead>
                      <TableHead>Lifecycle</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow
                        key={asset.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/monitor/inventory-criticality/registry/${asset.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{asset.asset_tag || "-"}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-sm">{asset.asset_type.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-sm">{asset.location}</TableCell>
                        <TableCell className="text-sm">{asset.voltage_kv || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(asset.operational_status)} className="capitalize px-2 py-0 h-5 text-[10px]">
                            {asset.operational_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCriticalityColor(asset.criticality)} className="px-2 py-0 h-5 text-[10px]">
                            {asset.criticality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{asset.lifecycle_stage}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/monitor/inventory-criticality/registry/${asset.id}/edit`);
                            }}
                          >
                            <span className="sr-only">Edit</span>
                            {/* lucide settings icon or similar */}
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
