import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Plus,
  Settings,
  Database,
  Zap,
  Shield,
  Gauge,
  AlertCircle,
  Loader2,
  Trash2,
  Activity
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";

// Asset type from Supabase
interface AssetType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: string | null;
  propertiesSchema: Record<string, unknown> | null;
  createdAt: string;
}

// Category icons for Power Transmission
const categoryIcons: Record<string, React.ElementType> = {
  electrical: Zap,
  protection: Shield,
  switching: Settings,
  measurement: Gauge
};

export function AssetCatalogPage() {
  const { provider } = useDataProvider();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    search: string;
    category: string;
  }>({
    search: "",
    category: "All"
  });

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newType, setNewType] = useState({
    code: "",
    name: "",
    category: "electrical",
    propertiesSchema: "{}"
  });

  // Load tenant ID and asset types
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get the default transmission tenant ID
        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        // Load asset types directly from Supabase
        const types = await provider.getAssetTypesByTenant(tid);

        setAssetTypes(types.map(t => ({
          ...t,
          tenantId: tid,
          propertiesSchema: t.properties_schema,
          createdAt: t.created_at
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load asset types");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  // Helper to determine category from code
  function getCategoryFromCode(code: string): string {
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes('transformer') || lowerCode.includes('breaker') || lowerCode.includes('switchgear')) {
      return 'electrical';
    }
    if (lowerCode.includes('relay') || lowerCode.includes('protection')) {
      return 'protection';
    }
    if (lowerCode.includes('switch') || lowerCode.includes('disconnect')) {
      return 'switching';
    }
    if (lowerCode.includes('meter') || lowerCode.includes('ct') || lowerCode.includes('pt') || lowerCode.includes('sensor')) {
      return 'measurement';
    }
    return 'electrical';
  }

  // Get unique categories
  const categories = Array.from(new Set(assetTypes.map(t => t.category || 'uncategorized')));

  // Filter types based on selected category and search
  const filteredTypes = assetTypes.filter(type => {
    const matchesCategory = filters.category === "All" || type.category === filters.category;
    const matchesSearch = !filters.search ||
      type.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      type.code.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All"
    });
  };

  const filterConfigs = [
    {
      key: 'category',
      label: 'Category',
      value: filters.category,
      onChange: (val: string) => handleFilterChange('category', val),
      options: [
        { value: 'All', label: 'All Categories' },
        ...categories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
      ],
    },
  ];

  const ListActions = (
    <div className="flex items-center justify-between w-full mt-2">
      <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs">
        Clear Filters
      </Button>
      <div className="flex items-center gap-1">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" />
              New Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Asset Type</DialogTitle>
              <DialogDescription>
                Define a new asset type for the Power Transmission catalog.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., TRANSFORMER"
                  value={newType.code}
                  onChange={(e) => setNewType(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Power Transformer"
                  value={newType.name}
                  onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newType.category}
                  onValueChange={(value) => setNewType(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                    <SelectItem value="switching">Switching</SelectItem>
                    <SelectItem value="measurement">Measurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schema">Properties Schema (JSON)</Label>
                <Textarea
                  id="schema"
                  placeholder="{}"
                  value={newType.propertiesSchema}
                  onChange={(e) => setNewType(prev => ({ ...prev, propertiesSchema: e.target.value }))}
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newType.code || !newType.name}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  // Handle create asset type
  async function handleCreate() {
    if (!tenantId) return;

    try {
      setCreating(true);
      setCreateError(null);

      // Validate code uniqueness
      const existingType = assetTypes.find(t => t.code === newType.code);
      if (existingType) {
        setCreateError(`Asset type code '${newType.code}' already exists`);
        return;
      }

      // For now, add to local state (actual Supabase insert would go here)
      const created: AssetType = {
        id: crypto.randomUUID(),
        tenantId,
        code: newType.code,
        name: newType.name,
        category: newType.category,
        propertiesSchema: JSON.parse(newType.propertiesSchema || "{}"),
        createdAt: new Date().toISOString()
      };

      setAssetTypes(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewType({ code: "", name: "", category: "electrical", propertiesSchema: "{}" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create asset type");
    } finally {
      setCreating(false);
    }
  }

  // Handle delete asset type
  async function handleDelete(type: AssetType) {
    // Check for linked assets
    const linkedAssets = await provider.getTransmissionAssetsByTenant(tenantId!);
    const linkedCount = linkedAssets.filter(a => a.assetTypeId === type.id).length;

    if (linkedCount > 0) {
      setError(`Cannot delete asset type: ${linkedCount} assets are linked`);
      return;
    }

    // Remove from local state
    setAssetTypes(prev => prev.filter(t => t.id !== type.id));
    if (selectedType?.id === type.id) {
      setSelectedType(null);
    }
  }

  const tabs = selectedType
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <TypeOverview type={selectedType} />
      },
      {
        id: "instances",
        label: "Asset Instances",
        content: <TypeInstances type={selectedType} />
      },
      {
        id: "schema",
        label: "Properties Schema",
        content: <TypePropertiesSchema type={selectedType} />
      },
      {
        id: "mappings",
        label: "Property Mappings",
        content: <TypeMappings type={selectedType} />
      },
    ]
    : [
      {
        id: "catalog",
        label: "Asset Types",
        content: loading ? (
          <LoadingState isLoading={true} loadingText="Loading asset types..." />
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <AssetTypeCatalog
            types={filteredTypes}
            categories={categories}
            onSelect={setSelectedType}
          />
        )
      },
    ];

  if (loading) {
    return (
      <>
        <ListPane title="Asset Types" subtitle="Power Transmission Catalog">
          <LoadingState isLoading={true} loadingText="Loading..." />
        </ListPane>
        <WorkPane title="Asset Type Catalog" subtitle="Loading...">
          <LoadingState isLoading={true} loadingText="Loading asset types..." />
        </WorkPane>
      </>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Asset Types"
        subtitle="Power Transmission Catalog"
        count={filteredTypes.length}
        searchPlaceholder="Search asset types..."
        onSearch={(val) => handleFilterChange('search', val)}
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={ListActions}
      >

        {/* Asset Type List */}
        {filteredTypes.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No asset types defined"
            description="Create your first asset type to get started."
          />
        ) : (
          <div className="space-y-2">
            {filteredTypes.map((type) => {
              const IconComponent = categoryIcons[type.category || 'electrical'] || Zap;

              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
                    selectedType?.id === type.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary/50 border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      selectedType?.id === type.id ? "bg-primary/20" : "bg-secondary"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        selectedType?.id === type.id ? "text-primary" : "text-foreground"
                      )}>
                        {type.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {type.code}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 capitalize">
                        {type.category || 'uncategorized'}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ListPane>

      <WorkPane
        title={selectedType ? selectedType.name : "Asset Type Catalog"}
        subtitle={selectedType
          ? `${selectedType.code} · ${selectedType.category || 'uncategorized'}`
          : "Manage Power Transmission asset types and configurations"
        }
        tabs={tabs}
        actions={
          selectedType && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Edit Type
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => handleDelete(selectedType)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )
        }
      />
    </div>
  );
}


function TypeOverview({ type }: { type: AssetType }) {
  const IconComponent = categoryIcons[type.category || 'electrical'] || Zap;

  // Mock stats for demonstration
  const stats = {
    totalAssets: 12,
    healthIndex: 94,
    activeAlerts: 2,
    nextMaintenance: "Mar 12, 2026",
    manufacturers: [
      { name: "ABB", count: 5, percentage: 42 },
      { name: "Siemens", count: 4, percentage: 33 },
      { name: "GE", count: 3, percentage: 25 },
    ]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{type.name}</CardTitle>
              <CardDescription className="mt-1 capitalize">
                {type.category || 'Uncategorized'} Equipment
              </CardDescription>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Code:</span>
                  <Badge variant="secondary" className="ml-2">
                    {type.code}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline" className="ml-2 capitalize">
                    {type.category || 'uncategorized'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Assets", value: stats.totalAssets, icon: Database, color: "text-blue-500" },
          { label: "Health Index", value: `${stats.healthIndex}%`, icon: Activity, color: "text-green-500" },
          { label: "Active Alerts", value: stats.activeAlerts, icon: AlertCircle, color: "text-red-500" },
          { label: "Next Main.", value: "Mar 12", icon: Settings, color: "text-orange-500" },
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-secondary/20 border-none shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={cn("w-3 h-3", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manufacturer Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.manufacturers.map((m, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{m.count} units ({m.percentage}%)</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Created</p>
                <p className="text-sm font-medium mt-1">{new Date(type.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Last Modified</p>
                <p className="text-sm font-medium mt-1">{new Date(type.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">System ID</p>
                <p className="text-xs font-mono mt-1 text-muted-foreground truncate">{type.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TypePropertiesSchema({ type }: { type: AssetType }) {
  const schema = type.propertiesSchema as any;

  if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Database className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No properties schema defined</p>
        <p className="text-xs mt-1">Add a JSON schema to define custom properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold">Field Name</th>
              <th className="text-left p-3 font-semibold">Type</th>
              <th className="text-left p-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(schema.properties).map(([key, value]: [string, any]) => (
              <tr key={key} className="border-b border-border last:border-b-0 hover:bg-secondary/20">
                <td className="p-3">
                  <span className="font-mono font-medium text-primary">{key}</span>
                  {schema.required?.includes(key) && (
                    <span className="ml-2 text-[10px] text-red-500 font-bold uppercase">Required</span>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {value.type || 'string'}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {value.description || 'No description provided'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="bg-secondary/10 border-none shadow-none mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Raw JSON Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-[10px] font-mono overflow-auto max-h-48 text-muted-foreground">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function TypeInstances({ type }: { type: AssetType }) {
  const { provider } = useDataProvider();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        const tid = await provider.getDefaultTransmissionTenantId();
        const allAssets = await provider.getTransmissionAssetsByTenant(tid);
        setAssets(allAssets.filter(a => a.assetTypeId === type.id));
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, [type.id, provider]);

  if (loading) return <LoadingState isLoading={true} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{assets.length} assets of this type found</p>
        <Button size="sm" variant="outline" className="h-7 text-xs">View All Assets</Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold">Asset Name</th>
              <th className="text-left p-3 font-semibold">Site</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Criticality</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20">
                <td className="p-3 font-medium">{asset.name}</td>
                <td className="p-3 text-muted-foreground">{asset.siteName}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5",
                      asset.status === 'online' ? "border-green-500 text-green-500" :
                        asset.status === 'maintenance' ? "border-orange-500 text-orange-500" : "border-red-500 text-red-500"
                    )}
                  >
                    {asset.status}
                  </Badge>
                </td>
                <td className="p-3 capitalize text-muted-foreground">{asset.criticality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TypeMappings({ type }: { type: AssetType }) {
  const mappings = [
    { name: "Technical Specifications", id: "prop-tech-01", fields: 8, type: "technical" },
    { name: "Operational Limits", id: "prop-oper-01", fields: 5, type: "operational" },
    { name: "Safety Clearances", id: "prop-safe-01", fields: 4, type: "safety" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The following property sets are mapped to this asset type for all instances.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {mappings.map((m) => (
          <Card key={m.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">{m.name}</CardTitle>
              <Badge variant="secondary" className="capitalize text-[10px]">{m.type}</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">{m.fields} standard metadata fields</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2 group-hover:text-primary">View Property Set</Button>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed flex items-center justify-center p-6 hover:bg-secondary/20 transition-colors cursor-pointer">
          <div className="text-center">
            <Plus className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Add Mapping</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AssetTypeCatalog({
  types,
  categories,
  onSelect
}: {
  types: AssetType[];
  categories: string[];
  onSelect: (type: AssetType) => void;
}) {
  // Group types by category
  const groupedTypes = categories.reduce((acc, category) => {
    acc[category] = types.filter(t => t.category === category);
    return acc;
  }, {} as Record<string, AssetType[]>);

  if (types.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No asset types defined"
        description="Create your first asset type to get started."
      />
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedTypes).map(([categoryName, categoryTypes]) => {
        if (categoryTypes.length === 0) return null;

        return (
          <div key={categoryName}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
              {categoryName}
              <Badge variant="secondary">{categoryTypes.length}</Badge>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTypes.map((type) => {
                const IconComponent = categoryIcons[type.category || 'electrical'] || Zap;

                return (
                  <button
                    key={type.id}
                    onClick={() => onSelect(type)}
                    className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{type.name}</h4>
                        <p className="text-xs text-muted-foreground">{type.code}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {type.category || 'uncategorized'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
