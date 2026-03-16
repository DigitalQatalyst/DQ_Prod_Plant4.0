import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAssetById, useUpsertAsset, useAssets } from "@/hooks/useAPM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ArrowLeft, Save, Database } from "lucide-react";
import { TransmissionAssetType, OperationalStatus, CriticalityTier, LifecycleStage } from "@/types/apm";
import { useToast } from "@/hooks/use-toast";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function AssetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: assetData, loading: assetLoading } = useAssetById(id!);
  const { data: allAssetsResponse } = useAssets({ pageSize: 100 });
  const allAssets = allAssetsResponse?.data || [];
  const upsertAsset = useUpsertAsset();

  const [formData, setFormData] = useState({
    name: "",
    asset_type: "power_transformer" as TransmissionAssetType,
    asset_tag: "",
    location: "",
    voltage_kv: "",
    commissioning_date: "",
    operational_status: "online" as OperationalStatus,
    criticality: "Standard" as CriticalityTier,
    lifecycle_stage: "operate" as LifecycleStage,
    parent_asset_id: "",
    substation_id: "",
    bay_code: "",
    owner_org_unit: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assetData?.asset) {
      const asset = assetData.asset;
      setFormData({
        name: asset.name,
        asset_type: asset.asset_type,
        asset_tag: asset.asset_tag || "",
        location: asset.location,
        voltage_kv: asset.voltage_kv?.toString() || "",
        commissioning_date: asset.commissioning_date || "",
        operational_status: asset.operational_status,
        criticality: asset.criticality,
        lifecycle_stage: asset.lifecycle_stage,
        parent_asset_id: asset.parent_asset_id || "",
        substation_id: asset.substation_id || "",
        bay_code: asset.bay_code || "",
        owner_org_unit: asset.owner_org_unit || "",
      });
    }
  }, [assetData]);

  // Convert to navigation assets for sidebar
  const navigationAssets: NavigationAsset[] = allAssets.map(a => {
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
    navigate(`/monitor/inventory-criticality/registry/${asset.id}/edit`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.asset_type) {
      newErrors.asset_type = "Asset type is required";
    }

    if (formData.voltage_kv && parseFloat(formData.voltage_kv) <= 0) {
      newErrors.voltage_kv = "Voltage must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      await upsertAsset.mutate({
        sector: "power_transmission",
        name: formData.name,
        asset_type: formData.asset_type,
        asset_tag: formData.asset_tag || undefined,
        location: formData.location,
        voltage_kv: formData.voltage_kv ? parseFloat(formData.voltage_kv) : undefined,
        commissioning_date: formData.commissioning_date || undefined,
        operational_status: formData.operational_status,
        criticality: formData.criticality,
        lifecycle_stage: formData.lifecycle_stage,
        parent_asset_id: formData.parent_asset_id || null,
        metadata: {},
      });

      toast({
        title: "Success",
        description: "Asset updated successfully",
      });

      navigate(`/monitor/inventory-criticality/registry/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update asset",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(`/monitor/inventory-criticality/registry/${id}`);
  };

  if (assetLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState isLoading loadingText="Loading asset..." />
      </div>
    );
  }

  if (!assetData) {
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

  return (
    <APMPageShell
      title={`Edit Asset: ${assetData.asset.name}`}
      featureSetName="Asset Inventory & Criticality"
      featureName="Asset Registry"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={selectedNavigationAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={upsertAsset.loading}>
            <Save className="w-4 h-4 mr-2" />
            {upsertAsset.loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive h-9" : "h-9"}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_type" className="text-xs font-semibold uppercase text-muted-foreground">
                    Asset Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.asset_type}
                    onValueChange={(value) => setFormData({ ...formData, asset_type: value as TransmissionAssetType })}
                  >
                    <SelectTrigger id="asset_type" className={errors.asset_type ? "border-destructive h-9" : "h-9"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="power_transformer">Power Transformer</SelectItem>
                      <SelectItem value="circuit_breaker">Circuit Breaker</SelectItem>
                      <SelectItem value="disconnect_switch">Disconnect Switch</SelectItem>
                      <SelectItem value="busbar">Busbar</SelectItem>
                      <SelectItem value="transmission_line">Transmission Line</SelectItem>
                      <SelectItem value="line_terminal">Line Terminal</SelectItem>
                      <SelectItem value="substation_bay">Substation Bay</SelectItem>
                      <SelectItem value="protection_relay">Protection Relay</SelectItem>
                      <SelectItem value="ct">Current Transformer (CT)</SelectItem>
                      <SelectItem value="vt">Voltage Transformer (VT)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.asset_type && <p className="text-xs text-destructive">{errors.asset_type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_tag" className="text-xs font-semibold uppercase text-muted-foreground">Asset Tag</Label>
                  <Input
                    id="asset_tag"
                    value={formData.asset_tag}
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-xs font-semibold uppercase text-muted-foreground">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voltage_kv" className="text-xs font-semibold uppercase text-muted-foreground">Voltage (kV)</Label>
                  <Input
                    id="voltage_kv"
                    type="number"
                    step="0.1"
                    value={formData.voltage_kv}
                    onChange={(e) => setFormData({ ...formData, voltage_kv: e.target.value })}
                    className={errors.voltage_kv ? "border-destructive h-9" : "h-9"}
                  />
                  {errors.voltage_kv && <p className="text-xs text-destructive">{errors.voltage_kv}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissioning_date" className="text-xs font-semibold uppercase text-muted-foreground">Commissioning Date</Label>
                  <Input
                    id="commissioning_date"
                    type="date"
                    value={formData.commissioning_date}
                    onChange={(e) => setFormData({ ...formData, commissioning_date: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operational_status" className="text-xs font-semibold uppercase text-muted-foreground">Operational Status</Label>
                  <Select
                    value={formData.operational_status}
                    onValueChange={(value) => setFormData({ ...formData, operational_status: value as OperationalStatus })}
                  >
                    <SelectTrigger id="operational_status" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criticality" className="text-xs font-semibold uppercase text-muted-foreground">Criticality</Label>
                  <Select
                    value={formData.criticality}
                    onValueChange={(value) => setFormData({ ...formData, criticality: value as CriticalityTier })}
                  >
                    <SelectTrigger id="criticality" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifecycle_stage" className="text-xs font-semibold uppercase text-muted-foreground">Lifecycle Stage</Label>
                  <Select
                    value={formData.lifecycle_stage}
                    onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value as LifecycleStage })}
                  >
                    <SelectTrigger id="lifecycle_stage" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="procure">Procure</SelectItem>
                      <SelectItem value="install">Install</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="operate">Operate</SelectItem>
                      <SelectItem value="maintain">Maintain</SelectItem>
                      <SelectItem value="refurbish">Refurbish</SelectItem>
                      <SelectItem value="retire">Retire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_asset_id" className="text-xs font-semibold uppercase text-muted-foreground">Parent Asset</Label>
                  <Select
                    value={formData.parent_asset_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_asset_id: value })}
                  >
                    <SelectTrigger id="parent_asset_id" className="h-9">
                      <SelectValue placeholder="Select parent asset (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {allAssets
                        ?.filter((a) => a.id !== id)
                        .map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} ({asset.asset_type.replace(/_/g, " ")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_org_unit" className="text-xs font-semibold uppercase text-muted-foreground">Owner Org Unit</Label>
                  <Input
                    id="owner_org_unit"
                    value={formData.owner_org_unit}
                    onChange={(e) => setFormData({ ...formData, owner_org_unit: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Sector Enforcement Notice */}
              <div className="p-3 bg-muted rounded-lg text-xs text-center text-muted-foreground border border-dashed border-border">
                This asset is automatically assigned to the <span className="font-mono font-bold text-foreground">power_transmission</span> sector.
              </div>

              {/* Form Actions in Card */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                  Discard Changes
                </Button>
                <Button type="submit" size="sm" disabled={upsertAsset.loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {upsertAsset.loading ? "Saving..." : "Save Asset"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </APMPageShell>
  );
}
