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
  Wrench,
  Shield,
  Activity,
  Zap,
  FileText,
  AlertCircle,
  Loader2,
  DollarSign
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { PropertySet, PropertyField } from "@/types/transmission";

// Property set type icons for Power Transmission
const propertySetTypeIcons: Record<string, React.ElementType> = {
  technical: Zap,
  operational: Activity,
  safety: Shield,
  financial: DollarSign,
  maintenance: Wrench
};

// Property set type colors
const propertySetTypeColors: Record<string, string> = {
  technical: "bg-yellow-100 text-yellow-700 border-yellow-200",
  operational: "bg-blue-100 text-blue-700 border-blue-200",
  safety: "bg-red-100 text-red-700 border-red-200",
  financial: "bg-green-100 text-green-700 border-green-200",
  maintenance: "bg-orange-100 text-orange-700 border-orange-200"
};

export function PropertySetsPage() {
  const { provider } = useDataProvider();
  const [propertySets, setPropertySets] = useState<PropertySet[]>([]);
  const [selectedPropertySet, setSelectedPropertySet] = useState<PropertySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    search: string;
    type: string;
  }>({
    search: "",
    type: "all"
  });

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newPropertySet, setNewPropertySet] = useState({
    name: "",
    type: "technical" as PropertySet['type'],
    description: "",
    fields: "[]"
  });

  // Load tenant ID and property sets
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get the default transmission tenant ID
        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        // Load property sets
        const result = await provider.getPropertySetsByTenant(tid, { limit: 100 });
        setPropertySets(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load property sets");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  // Get unique property set types for filtering
  const propertySetTypes = Array.from(new Set(propertySets.map(ps => ps.type)));

  // Filter property sets by type and search
  const filteredPropertySets = propertySets.filter(ps => {
    const matchesType = filters.type === "all" || ps.type === filters.type;
    const matchesSearch = !filters.search ||
      ps.name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesType && matchesSearch;
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
      type: "all"
    });
  };

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      value: filters.type,
      onChange: (val: string) => handleFilterChange('type', val),
      options: [
        { value: 'all', label: 'All Types' },
        ...propertySetTypes.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))
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
              New Property Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Property Set</DialogTitle>
              <DialogDescription>
                Define a new property set for Power Transmission assets.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Technical Specifications"
                  value={newPropertySet.name}
                  onChange={(e) => setNewPropertySet(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newPropertySet.type}
                  onValueChange={(value) => setNewPropertySet(prev => ({ ...prev, type: value as PropertySet['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the property set..."
                  value={newPropertySet.description}
                  onChange={(e) => setNewPropertySet(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fields">Fields (JSON)</Label>
                <Textarea
                  id="fields"
                  placeholder='[{"id": "field1", "label": "Field 1", "dataType": "string"}]'
                  value={newPropertySet.fields}
                  onChange={(e) => setNewPropertySet(prev => ({ ...prev, fields: e.target.value }))}
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
              <Button onClick={handleCreate} disabled={creating || !newPropertySet.name}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  // Handle create property set
  async function handleCreate() {
    if (!tenantId) return;

    try {
      setCreating(true);
      setCreateError(null);

      let parsedFields: PropertyField[];
      try {
        parsedFields = JSON.parse(newPropertySet.fields || "[]");
      } catch {
        setCreateError("Invalid JSON for fields");
        return;
      }

      const created = await provider.createPropertySet({
        tenantId,
        name: newPropertySet.name,
        type: newPropertySet.type,
        description: newPropertySet.description || undefined,
        fields: parsedFields
      });

      setPropertySets(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewPropertySet({ name: "", type: "technical", description: "", fields: "[]" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create property set");
    } finally {
      setCreating(false);
    }
  }

  const tabs = selectedPropertySet
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <PropertySetOverview propertySet={selectedPropertySet} />
      },
      {
        id: "fields",
        label: "Fields",
        content: <PropertySetFields propertySet={selectedPropertySet} />
      },
    ]
    : [
      {
        id: "catalog",
        label: "Property Sets",
        content: loading ? (
          <LoadingState isLoading={true} loadingText="Loading property sets..." />
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <PropertySetsCatalog
            propertySets={filteredPropertySets}
            onSelect={setSelectedPropertySet}
          />
        )
      },
    ];

  if (loading) {
    return (
      <>
        <ListPane title="Property Sets" subtitle="Power Transmission Metadata">
          <LoadingState isLoading={true} loadingText="Loading..." />
        </ListPane>
        <WorkPane title="Property Sets Catalog" subtitle="Loading...">
          <LoadingState isLoading={true} loadingText="Loading property sets..." />
        </WorkPane>
      </>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Property Sets"
        subtitle="Power Transmission Metadata"
        count={filteredPropertySets.length}
        searchPlaceholder="Search property sets..."
        onSearch={(val) => handleFilterChange('search', val)}
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={ListActions}
      >

        {/* Property Sets List */}
        {filteredPropertySets.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No property sets defined"
            description="Create your first property set to get started."
          />
        ) : (
          <div className="space-y-2">
            {filteredPropertySets.map((propertySet) => {
              const IconComponent = propertySetTypeIcons[propertySet.type] || Database;

              return (
                <button
                  key={propertySet.id}
                  onClick={() => setSelectedPropertySet(propertySet)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
                    selectedPropertySet?.id === propertySet.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary/50 border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      selectedPropertySet?.id === propertySet.id ? "bg-primary/20" : "bg-secondary"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        selectedPropertySet?.id === propertySet.id ? "text-primary" : "text-foreground"
                      )}>
                        {propertySet.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {propertySet.fields.length} fields
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 capitalize",
                          propertySetTypeColors[propertySet.type]
                        )}
                      >
                        {propertySet.type}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {propertySet.fields.filter(f => f.required).length} required
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
        title={selectedPropertySet ? selectedPropertySet.name : "Property Sets Catalog"}
        subtitle={selectedPropertySet
          ? `${selectedPropertySet.type} · ${selectedPropertySet.fields.length} fields`
          : "Manage Power Transmission property sets and metadata fields"
        }
        tabs={tabs}
        actions={
          selectedPropertySet && (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Edit Property Set
            </Button>
          )
        }
      />
    </div>
  );
}


function PropertySetOverview({ propertySet }: { propertySet: PropertySet }) {
  const IconComponent = propertySetTypeIcons[propertySet.type] || Database;
  const requiredFields = propertySet.fields.filter(f => f.required);
  const optionalFields = propertySet.fields.filter(f => !f.required);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{propertySet.name}</CardTitle>
              <CardDescription className="mt-1 capitalize">
                {propertySet.type} Property Set
              </CardDescription>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Fields:</span>
                  <span className="font-medium ml-2">{propertySet.fields.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Required:</span>
                  <span className="font-medium ml-2">{requiredFields.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Optional:</span>
                  <span className="font-medium ml-2">{optionalFields.length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        {propertySet.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{propertySet.description}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Field Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Required Fields</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">{requiredFields.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Optional Fields</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">{optionalFields.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                propertySet.fields.reduce((acc, field) => {
                  acc[field.dataType] = (acc[field.dataType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([dataType, count]) => (
                <div key={dataType} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{dataType}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium mt-1">
              {new Date(propertySet.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground">ID</p>
            <p className="text-sm font-mono mt-1 truncate">
              {propertySet.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertySetFields({ propertySet }: { propertySet: PropertySet }) {
  if (propertySet.fields.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No fields defined</p>
        <p className="text-xs mt-1">Add fields to define metadata for this property set</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {propertySet.fields.length} fields configured
        </p>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/30">
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium">Field Name</th>
              <th className="text-left p-3 text-sm font-medium">Data Type</th>
              <th className="text-left p-3 text-sm font-medium">Unit</th>
              <th className="text-left p-3 text-sm font-medium">Required</th>
            </tr>
          </thead>
          <tbody>
            {propertySet.fields.map((field) => (
              <tr key={field.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20">
                <td className="p-3">
                  <div className="font-medium">{field.label}</div>
                  <div className="text-xs text-muted-foreground">{field.id}</div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="capitalize">
                    {field.dataType}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {field.unit || '-'}
                </td>
                <td className="p-3">
                  {field.required ? (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PropertySetsCatalog({
  propertySets,
  onSelect
}: {
  propertySets: PropertySet[];
  onSelect: (propertySet: PropertySet) => void;
}) {
  // Group property sets by type
  const groupedPropertySets = propertySets.reduce((acc, ps) => {
    if (!acc[ps.type]) {
      acc[ps.type] = [];
    }
    acc[ps.type].push(ps);
    return acc;
  }, {} as Record<string, PropertySet[]>);

  if (propertySets.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No property sets defined"
        description="Create your first property set to get started."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Power Transmission Property Sets</h2>
        <p className="text-muted-foreground">
          Manage metadata fields for transformers, breakers, meters, and other equipment
        </p>
      </div>

      {Object.entries(groupedPropertySets).map(([type, sets]) => {
        const IconComponent = propertySetTypeIcons[type] || Database;

        return (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
              <IconComponent className="w-5 h-5" />
              {type} Property Sets
              <Badge variant="secondary">{sets.length}</Badge>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sets.map((propertySet) => {
                const requiredFields = propertySet.fields.filter(f => f.required);

                return (
                  <button
                    key={propertySet.id}
                    onClick={() => onSelect(propertySet)}
                    className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors",
                        propertySetTypeColors[propertySet.type]
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold">{propertySet.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {propertySet.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {propertySet.fields.length} fields
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {requiredFields.length} required
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Data types: {Array.from(new Set(propertySet.fields.map(f => f.dataType))).join(", ") || 'None'}
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
