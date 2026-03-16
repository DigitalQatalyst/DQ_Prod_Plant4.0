import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Loader2, CheckCircle2, AlertCircle, Plus, Search, Building2, Zap, Info, MapPin, Settings2 } from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import type { TransmissionAsset } from "@/types/transmission";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  assetTypeId: string;
  siteId: string;
  status: 'online' | 'offline' | 'maintenance';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  properties: string; // JSON string for custom properties
}

interface FormErrors {
  name?: string;
  assetTypeId?: string;
  siteId?: string;
  properties?: string;
  general?: string;
}

export function ManualAssetCapturePage() {
  const { provider } = useDataProvider();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<Array<{ id: string; code: string; name: string; category: string }>>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [recentAssets, setRecentAssets] = useState<TransmissionAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [criticalityFilter, setCriticalityFilter] = useState("All");
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    assetTypeId: "",
    siteId: "",
    status: "online",
    criticality: "medium",
    properties: "{}"
  });

  // Load tenant ID, asset types, sites, and recent assets
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        const [typesData, sitesData, assetsData] = await Promise.all([
          provider.getAssetTypesByTenant(tid),
          provider.getSitesByTenant(tid),
          provider.getTransmissionAssetsByTenant(tid)
        ]);

        setAssetTypes(typesData);
        setSites(sitesData);
        setRecentAssets(assetsData.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 10));
      } catch (err) {
        setErrors({ general: err instanceof Error ? err.message : "Failed to load form data" });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  const filteredAssets = recentAssets.filter(asset => {
    const matchesSearch = !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.siteName && asset.siteName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
    const matchesCriticality = criticalityFilter === "All" || asset.criticality === criticalityFilter;

    return matchesSearch && matchesStatus && matchesCriticality;
  });

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Asset name is required";
    }

    if (!formData.assetTypeId) {
      newErrors.assetTypeId = "Asset type is required";
    }

    if (!formData.siteId) {
      newErrors.siteId = "Site is required";
    }

    // Validate properties JSON
    if (formData.properties.trim()) {
      try {
        JSON.parse(formData.properties);
      } catch {
        newErrors.properties = "Properties must be valid JSON";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId || !validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setSuccess(false);

      // Parse properties
      let properties = {};
      if (formData.properties.trim()) {
        properties = JSON.parse(formData.properties);
      }

      const created = await provider.createTransmissionAsset({
        tenantId,
        name: formData.name.trim(),
        assetTypeId: formData.assetTypeId,
        siteId: formData.siteId,
        status: formData.status,
        criticality: formData.criticality,
        properties
      });

      setSuccess(true);

      // Add to recent assets
      setRecentAssets([created, ...recentAssets.slice(0, 9)]);

      // Reset form
      setFormData({
        name: "",
        assetTypeId: "",
        siteId: "",
        status: "online",
        criticality: "medium",
        properties: "{}"
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create asset";

      // Check if it's a uniqueness error
      if (errorMessage.includes("already exists")) {
        setErrors({ name: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading form data..." />;
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* List Pane */}
      <ListPane
        className="w-96 min-w-96"
        title="Manual Asset Capture"
        subtitle={`${filteredAssets.length} recent asset${filteredAssets.length !== 1 ? "s" : ""}`}
        onSearch={setSearchQuery}
        searchPlaceholder="Search recent assets..."
        showExpandableFilters={true}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
              { value: "maintenance", label: "Maintenance" },
            ],
          },
          {
            key: "criticality",
            label: "Criticality",
            value: criticalityFilter,
            onChange: setCriticalityFilter,
            options: [
              { value: "All", label: "All Levels" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ],
          }
        ]}
      >
        <div className="space-y-1 pb-8">
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No assets found"
              description={searchQuery ? "Try a different search term" : "Assets you create will appear here"}
            />
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => navigate(`/assets/portfolio/overview?assetId=${asset.id}`)}
                className="p-3 rounded-lg border border-border/60 hover:border-primary/30 bg-card/40 hover:bg-card/60 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 overflow-hidden">
                    <div className="p-1.5 rounded-md bg-muted/30 border border-border/50 mt-0.5 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
                      <Zap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate leading-none mb-1 group-hover:text-primary transition-colors">
                        {asset.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                        {asset.assetTypeName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant="outline" className={cn(
                          "px-1 py-0 text-[8px] font-bold border-none uppercase",
                          asset.criticality === 'critical' || asset.criticality === 'high' ? "bg-red-500/10 text-red-500" :
                            asset.criticality === 'medium' ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                        )}>
                          {asset.criticality}
                        </Badge>
                        <span className="text-muted-foreground/30">•</span>
                        <p className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {asset.siteName || "Unknown Site"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "ml-2 capitalize py-0 px-1.5 text-[9px] font-bold border-none",
                    asset.status === 'online' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {asset.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </ListPane>

      {/* Work Pane */}
      <WorkPane
        title="Manual Asset Capture"
        subtitle="Create a new transmission asset manually"
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Messages */}
            {errors.general && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-500/10 animate-in slide-in-from-top-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Asset created successfully!</AlertDescription>
              </Alert>
            )}

            {/* Basic Information Section */}
            <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Basic Information</CardTitle>
                  <CardDescription className="text-xs">Enter the core details for the new asset</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Asset Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Transformer T1-220kV"
                      className={cn("h-11 bg-background", errors.name && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetTypeId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Asset Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.assetTypeId}
                      onValueChange={(value) => handleChange('assetTypeId', value)}
                    >
                      <SelectTrigger className={cn("h-11 bg-background", errors.assetTypeId && "border-red-500 focus-visible:ring-red-500")}>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.assetTypeId && <p className="text-[10px] font-bold text-red-500">{errors.assetTypeId}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the asset..."
                    className="min-h-[100px] bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Hierarchy Section */}
            <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Location Hierarchy</CardTitle>
                  <CardDescription className="text-xs">Assign this asset to a site or facility</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Site / Substation <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.siteId}
                      onValueChange={(value) => handleChange('siteId', value)}
                    >
                      <SelectTrigger className={cn("h-11 bg-background", errors.siteId && "border-red-500 focus-visible:ring-red-500")}>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.siteId && <p className="text-[10px] font-bold text-red-500">{errors.siteId}</p>}
                  </div>

                  <div className="space-y-2 opacity-50 cursor-not-allowed">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Voltage Level (Optional)</Label>
                    <Select disabled>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Properties Section */}
            <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Additional Properties</CardTitle>
                  <CardDescription className="text-xs">Configure status, criticality, and custom data</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operational Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'online' | 'offline' | 'maintenance') =>
                        handleChange('status', value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="criticality" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Criticality Level</Label>
                    <Select
                      value={formData.criticality}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                        handleChange('criticality', value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="properties" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Custom Properties (JSON)
                  </Label>
                  <Textarea
                    id="properties"
                    value={formData.properties}
                    onChange={(e) => handleChange('properties', e.target.value)}
                    placeholder='{"voltage_kv": 220, "manufacturer": "ABB"}'
                    className={cn(
                      "min-h-[120px] bg-background font-mono text-sm",
                      errors.properties && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground italic">
                      Experimental: Enter custom properties as valid JSON object
                    </p>
                    {errors.properties && <p className="text-[10px] font-bold text-red-500">{errors.properties}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                className="font-bold text-xs uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setFormData({
                    name: "",
                    assetTypeId: "",
                    siteId: "",
                    status: "online",
                    criticality: "medium",
                    properties: "{}"
                  });
                  setErrors({});
                  setSuccess(false);
                }}
                disabled={submitting}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                className="px-8 h-11 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                disabled={submitting || assetTypes.length === 0 || sites.length === 0}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create New Asset
              </Button>
            </div>
          </form>
        </div>
      </WorkPane>
    </div>
  );
}
