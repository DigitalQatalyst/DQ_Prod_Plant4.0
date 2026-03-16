import { useState } from "react";
import { useAssets } from "@/hooks/useAPM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Target, AlertTriangle, Info, Shield } from "lucide-react";
import { CriticalityTier } from "@/types/apm";
import { useNavigate } from "react-router-dom";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function CriticalityScoringPage() {
  const navigate = useNavigate();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<NavigationAsset | null>(null);
  const { data: assetsResponse, loading } = useAssets({ pageSize: 100 });
  const apmAssets = assetsResponse?.data || [];

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
    setSelectedAssetLocal(asset);
  };

  // Mock criticality model - in real implementation, this would come from API
  const [criticalityModel, setCriticalityModel] = useState({
    safety_weight: 0.35,
    production_weight: 0.30,
    environmental_weight: 0.20,
    detectability_weight: 0.15,
  });

  const [isEditing, setIsEditing] = useState(false);

  const assetsByCriticality = {
    Critical: apmAssets.filter((a) => a.criticality === "Critical") || [],
    Important: apmAssets.filter((a) => a.criticality === "Important") || [],
    Standard: apmAssets.filter((a) => a.criticality === "Standard") || [],
  };

  const handleSaveModel = () => {
    // TODO: Implement save criticality model
    console.log("Saving criticality model:", criticalityModel);
    setIsEditing(false);
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

  return (
    <APMPageShell
      title="Criticality Scoring"
      featureSetName="Asset Inventory & Criticality"
      featureName="Criticality Scoring"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={selectedAssetLocal}
      onAssetSelect={handleAssetSelection}
    >
      <div className="space-y-6">
        {/* Criticality Model */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Criticality Scoring Model
              </CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Model</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveModel}>Save Changes</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium">Criticality Scoring Model</p>
                    <p className="mt-1">
                      Asset criticality is calculated using weighted factors. Weights must sum to 1.0.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="safety_weight">Safety Impact Weight</Label>
                  <Input
                    id="safety_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={criticalityModel.safety_weight}
                    onChange={(e) =>
                      setCriticalityModel({
                        ...criticalityModel,
                        safety_weight: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Impact on personnel safety and public safety
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_weight">Production Impact Weight</Label>
                  <Input
                    id="production_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={criticalityModel.production_weight}
                    onChange={(e) =>
                      setCriticalityModel({
                        ...criticalityModel,
                        production_weight: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Impact on power transmission capacity and grid stability
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environmental_weight">Environmental Impact Weight</Label>
                  <Input
                    id="environmental_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={criticalityModel.environmental_weight}
                    onChange={(e) =>
                      setCriticalityModel({
                        ...criticalityModel,
                        environmental_weight: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Environmental and regulatory compliance impact
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detectability_weight">Detectability Weight</Label>
                  <Input
                    id="detectability_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={criticalityModel.detectability_weight}
                    onChange={(e) =>
                      setCriticalityModel({
                        ...criticalityModel,
                        detectability_weight: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ease of detecting failures before they occur
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Total Weight:</strong>{" "}
                  {(
                    criticalityModel.safety_weight +
                    criticalityModel.production_weight +
                    criticalityModel.environmental_weight +
                    criticalityModel.detectability_weight
                  ).toFixed(2)}
                  {" / 1.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets by Criticality */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Criticality Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingState isLoading loadingText="Loading criticality data..." />
              </div>
            ) : (
              <Tabs defaultValue="Critical">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Critical">
                    Critical ({assetsByCriticality.Critical.length})
                  </TabsTrigger>
                  <TabsTrigger value="Important">
                    Important ({assetsByCriticality.Important.length})
                  </TabsTrigger>
                  <TabsTrigger value="Standard">
                    Standard ({assetsByCriticality.Standard.length})
                  </TabsTrigger>
                </TabsList>

                {(["Critical", "Important", "Standard"] as CriticalityTier[]).map((tier) => (
                  <TabsContent key={tier} value={tier} className="space-y-4">
                    {assetsByCriticality[tier].length === 0 ? (
                      <EmptyState
                        icon={AlertTriangle}
                        title={`No ${tier} assets`}
                        description={`No assets are currently classified as ${tier}`}
                      />
                    ) : (
                      <div className="space-y-2">
                        {assetsByCriticality[tier].map((asset) => (
                          <div
                            key={asset.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/monitor/inventory-criticality/registry/${asset.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {asset.asset_type.replace(/_/g, " ")} • {asset.location}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getCriticalityColor(asset.criticality)}>
                                  {asset.criticality}
                                </Badge>
                                <Badge variant="outline">{asset.operational_status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}
