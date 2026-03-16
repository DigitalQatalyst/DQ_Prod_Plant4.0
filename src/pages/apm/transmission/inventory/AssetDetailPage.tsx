import { useParams, useNavigate } from "react-router-dom";
import { useAssetById, useFMEAEntries, useAssets } from "@/hooks/useAPM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ArrowLeft,
  Edit,
  Database,
  Network,
  GitBranch,
  Calendar,
  Package,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assetData, loading: isLoading, error } = useAssetById(id!);
  const { data: assetsResponse } = useAssets({ pageSize: 100 });
  const apmAssets = assetsResponse?.data || [];

  const { data: fmeaEntries } = useFMEAEntries({
    asset_type: assetData?.asset.asset_type,
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

  const selectedNavigationAsset = navigationAssets.find(a => a.id === id) || null;

  const handleAssetSelection = (asset: NavigationAsset) => {
    navigate(`/monitor/inventory-criticality/registry/${asset.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState isLoading loadingText="Loading asset details..." />
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={Database}
          title="Asset not found"
          description="The requested asset could not be found"
        />
      </div>
    );
  }

  const { asset, parent, children, relationships, linked_spares, lifecycle_events } = assetData;

  const getCriticalityColor = (criticality: string) => {
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

  const getStatusColor = (status: string) => {
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

  // Sort FMEA entries by RPN (descending)
  const topFMEAEntries = fmeaEntries
    ?.sort((a, b) => b.rpn - a.rpn)
    .slice(0, 5);

  return (
    <APMPageShell
      title={`Asset Details: ${asset.name}`}
      featureSetName="Asset Inventory & Criticality"
      featureName="Asset Registry"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={selectedNavigationAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/monitor/inventory-criticality/registry")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registry
          </Button>
          <Button size="sm" onClick={() => navigate(`/monitor/inventory-criticality/registry/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              Asset Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Asset Tag</label>
                <p className="text-sm font-mono mt-1">{asset.asset_tag || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Location</label>
                <p className="text-sm mt-1">{asset.location}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Voltage (kV)</label>
                <p className="text-sm mt-1">{asset.voltage_kv || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Commissioning Date</label>
                <p className="text-sm mt-1">
                  {asset.commissioning_date ? new Date(asset.commissioning_date).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(asset.operational_status)} className="px-2 py-0 h-5 text-[10px] capitalize">
                    {asset.operational_status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Criticality</label>
                <div className="mt-1">
                  <Badge variant={getCriticalityColor(asset.criticality)} className="px-2 py-0 h-5 text-[10px]">
                    {asset.criticality}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Lifecycle Stage</label>
                <p className="text-sm mt-1 capitalize">{asset.lifecycle_stage}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Owner Org Unit</label>
                <p className="text-sm mt-1">{asset.owner_org_unit || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hierarchy Tree */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Asset Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parent && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Parent Asset</label>
                    <div className="mt-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/monitor/inventory-criticality/registry/${parent.id}`)}>
                      <p className="font-medium text-sm">{parent.name}</p>
                      <p className="text-xs text-muted-foreground">{parent.asset_type.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                )}

                {children && children.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Child Assets ({children.length})</label>
                    <div className="mt-2 space-y-2">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/monitor/inventory-criticality/registry/${child.id}`)}
                        >
                          <p className="font-medium text-sm">{child.name}</p>
                          <p className="text-xs text-muted-foreground">{child.asset_type.replace(/_/g, " ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!parent && (!children || children.length === 0) && (
                  <p className="text-sm text-muted-foreground">No hierarchy relationships defined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relationships Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-5 h-5" />
                Infrastructure Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relationships && relationships.length > 0 ? (
                <div className="space-y-3">
                  {relationships.map((rel) => (
                    <div key={rel.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Badge variant="outline" className="text-[10px] h-5 px-2">{rel.relation_type.replace(/_/g, " ")}</Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {rel.from_asset_id === asset.id ? "→" : "←"} Related Asset
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rel.from_asset_id === asset.id ? "Outgoing" : "Incoming"} relationship
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No relationships defined</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lifecycle Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Lifecycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lifecycle_events && lifecycle_events.length > 0 ? (
                <div className="space-y-4">
                  {lifecycle_events.map((event) => (
                    <div key={event.id} className="flex gap-4 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                        <div className="w-0.5 h-full bg-border mt-1" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{event.stage}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.occurred_at).toLocaleDateString()}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="mt-1">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No lifecycle events recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Linked Spares */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5" />
                Linked Spare Parts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linked_spares && linked_spares.length > 0 ? (
                <div className="space-y-3">
                  {linked_spares.map((spare) => (
                    <div
                      key={spare.id}
                      className={`p-3 border rounded-lg ${spare.is_critical ? "border-destructive/30 bg-destructive/5" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{spare.part_number}</p>
                          <p className="text-xs text-muted-foreground">{spare.description}</p>
                        </div>
                        {spare.is_critical && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Critical</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">On Hand:</span> {spare.on_hand_quantity}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lead Time:</span> {spare.lead_time_days}d
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost:</span> ${spare.unit_cost}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No spare parts linked</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FMEA Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Potential Risks (FMEA Library)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFMEAEntries && topFMEAEntries.length > 0 ? (
              <div className="space-y-3">
                {topFMEAEntries.map((fmea) => (
                  <div key={fmea.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{fmea.failure_mode}</p>
                        {fmea.failure_cause && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cause: {fmea.failure_cause}
                          </p>
                        )}
                        {fmea.failure_effect && (
                          <p className="text-xs text-muted-foreground">
                            Effect: {fmea.failure_effect}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={fmea.rpn > 200 ? "destructive" : fmea.rpn > 100 ? "default" : "secondary"}
                        className="ml-4 h-5 px-2 text-[10px]"
                      >
                        RPN: {fmea.rpn}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-[11px]">
                      <div>
                        <span className="text-muted-foreground uppercase font-medium">Severity:</span> {fmea.severity}
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-medium">Occurrence:</span> {fmea.occurrence}
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-medium">Detection:</span> {fmea.detection}
                      </div>
                    </div>
                    {fmea.recommended_actions && (
                      <div className="mt-3 p-2 bg-muted rounded text-[11px]">
                        <span className="font-semibold text-primary">Recommended Actions:</span> {fmea.recommended_actions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No specific risks recorded for this asset type in the FMEA database.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}
