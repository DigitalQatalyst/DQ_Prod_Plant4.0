import { useState } from "react";
import { useFMEAEntries, useAssets } from "@/hooks/useAPM";
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
import { Search, AlertTriangle, Filter } from "lucide-react";
import { TransmissionAssetType } from "@/types/apm";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function FMEALibraryPage() {
  const [search, setSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<TransmissionAssetType | "all">("all");
  const [minRPN, setMinRPN] = useState("");
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<NavigationAsset | null>(null);

  const { data: assetsResponse } = useAssets({ pageSize: 100 });
  const apmAssets = assetsResponse?.data || [];

  const { data: fmeaEntries, isLoading, error } = useFMEAEntries({
    asset_type: assetTypeFilter !== "all" ? assetTypeFilter : undefined,
    min_rpn: minRPN ? parseInt(minRPN) : undefined,
    search: search || undefined,
  });

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
    // Filters FMEA library by the selected asset type automatically
    if (asset.type) {
      setAssetTypeFilter(asset.type as TransmissionAssetType);
    }
  };

  const getRPNColor = (rpn: number) => {
    if (rpn > 200) return "destructive";
    if (rpn > 100) return "default";
    return "secondary";
  };

  return (
    <APMPageShell
      title="FMEA Library"
      featureSetName="Asset Inventory & Criticality"
      featureName="FMEA Library"
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
              Library Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search failure modes..."
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

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">Minimum RPN</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={minRPN}
                  onChange={(e) => setMinRPN(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FMEA Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FMEA Entries ({fmeaEntries?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingState isLoading loadingText="Loading FMEA entries..." />
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertTriangle}
                title="Error loading FMEA entries"
                description={error.message || "Failed to load FMEA library"}
              />
            ) : !fmeaEntries?.length ? (
              <EmptyState
                icon={AlertTriangle}
                title="No FMEA entries found"
                description="No failure modes match your current filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Type</TableHead>
                      <TableHead>Failure Mode</TableHead>
                      <TableHead>RPN</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Occurrence</TableHead>
                      <TableHead>Detection</TableHead>
                      <TableHead>Recommended Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fmeaEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">{entry.asset_type.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{entry.failure_mode}</p>
                            {entry.failure_cause && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Cause: {entry.failure_cause}
                              </p>
                            )}
                            {entry.failure_effect && (
                              <p className="text-[10px] text-muted-foreground">
                                Effect: {entry.failure_effect}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRPNColor(entry.rpn)} className="px-2 py-0 h-5 text-[10px]">{entry.rpn}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.severity}</TableCell>
                        <TableCell className="text-sm">{entry.occurrence}</TableCell>
                        <TableCell className="text-sm">{entry.detection}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs truncate">{entry.recommended_actions || "-"}</p>
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
