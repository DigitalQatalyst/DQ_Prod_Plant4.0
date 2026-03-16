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
  ArrowRight,
  Zap,
  Shield,
  Gauge,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  Loader2
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { LifecycleState } from "@/types/transmission";

// Category icons for Power Transmission
const categoryIcons: Record<string, React.ElementType> = {
  electrical: Zap,
  protection: Shield,
  measurement: Gauge,
  switching: Settings
};

// Status icons for lifecycle states
const stateIcons: Record<string, React.ElementType> = {
  "Commissioning": Clock,
  "In Service": CheckCircle,
  "Standby": Pause,
  "Outage": AlertCircle,
  "Decommissioned": XCircle
};

// Status colors for lifecycle states
const stateColors: Record<string, string> = {
  "Commissioning": "bg-blue-100 text-blue-700 border-blue-200",
  "In Service": "bg-green-100 text-green-700 border-green-200",
  "Standby": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Outage": "bg-orange-100 text-orange-700 border-orange-200",
  "Decommissioned": "bg-red-100 text-red-700 border-red-200"
};

// Default categories for Power Transmission
const defaultCategories = ["electrical", "protection", "measurement", "switching"];

export function LifecycleConfigPage() {
  const { provider } = useDataProvider();
  const [lifecycleStates, setLifecycleStates] = useState<LifecycleState[]>([]);
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

  // Track active tab in WorkPane
  const [activeTab, setActiveTab] = useState("overview");

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newState, setNewState] = useState({
    assetCategory: "electrical",
    name: "",
    orderIndex: 1,
    description: ""
  });

  // Load tenant ID and lifecycle states
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get the default transmission tenant ID
        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        // Load lifecycle states for all categories
        const allStates: LifecycleState[] = [];
        for (const category of defaultCategories) {
          const states = await provider.getLifecycleStatesByCategory(tid, category);
          allStates.push(...states);
        }

        setLifecycleStates(allStates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lifecycle states");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  // Get unique categories from loaded states
  const categories = Array.from(new Set(lifecycleStates.map(s => s.assetCategory)));

  // Group lifecycle states by category
  const groupedStates = categories.reduce((acc, category) => {
    acc[category] = lifecycleStates.filter(s => s.assetCategory === category);
    return acc;
  }, {} as Record<string, LifecycleState[]>);

  // Filter states based on selected category and search
  const filteredStates = lifecycleStates.filter(state => {
    const matchesCategory = filters.category === "All" || state.assetCategory === filters.category;
    const matchesSearch = !filters.search ||
      state.name.toLowerCase().includes(filters.search.toLowerCase());
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
              New State
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lifecycle State</DialogTitle>
              <DialogDescription>
                Define a new lifecycle state for Power Transmission assets.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Asset Category</Label>
                <Select
                  value={newState.assetCategory}
                  onValueChange={(value) => setNewState(prev => ({ ...prev, assetCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                    <SelectItem value="measurement">Measurement</SelectItem>
                    <SelectItem value="switching">Switching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">State Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., In Service"
                  value={newState.name}
                  onChange={(e) => setNewState(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Order Index</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  min={1}
                  value={newState.orderIndex}
                  onChange={(e) => setNewState(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique within the category
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the lifecycle state..."
                  value={newState.description}
                  onChange={(e) => setNewState(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
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
              <Button onClick={handleCreate} disabled={creating || !newState.name}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  // Handle create lifecycle state
  async function handleCreate() {
    if (!tenantId) return;

    try {
      setCreating(true);
      setCreateError(null);

      const created = await provider.createLifecycleState({
        tenantId,
        assetCategory: newState.assetCategory,
        name: newState.name,
        orderIndex: newState.orderIndex,
        description: newState.description || undefined
      });

      setLifecycleStates(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewState({ assetCategory: "electrical", name: "", orderIndex: 1, description: "" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create lifecycle state");
    } finally {
      setCreating(false);
    }
  }

  const tabs = [
    {
      id: "overview",
      label: "Lifecycle Overview",
      content: loading ? (
        <LoadingState isLoading={true} loadingText="Loading lifecycle states..." />
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <LifecycleOverview
          groupedStates={groupedStates}
          selectedCategory={filters.category}
        />
      )
    },
    {
      id: "electrical",
      label: "Electrical",
      content: <CategoryLifecycle
        category="electrical"
        states={lifecycleStates.filter(s => s.assetCategory === "electrical")}
      />
    },
    {
      id: "protection",
      label: "Protection",
      content: <CategoryLifecycle
        category="protection"
        states={lifecycleStates.filter(s => s.assetCategory === "protection")}
      />
    },
    {
      id: "measurement",
      label: "Measurement",
      content: <CategoryLifecycle
        category="measurement"
        states={lifecycleStates.filter(s => s.assetCategory === "measurement")}
      />
    },
    {
      id: "switching",
      label: "Switching",
      content: <CategoryLifecycle
        category="switching"
        states={lifecycleStates.filter(s => s.assetCategory === "switching")}
      />
    },
  ];

  if (loading) {
    return (
      <>
        <ListPane title="Lifecycle Configuration" subtitle="Power Transmission States">
          <LoadingState isLoading={true} loadingText="Loading..." />
        </ListPane>
        <WorkPane title="Lifecycle Configuration" subtitle="Loading...">
          <LoadingState isLoading={true} loadingText="Loading lifecycle states..." />
        </WorkPane>
      </>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Lifecycle Configuration"
        subtitle="Power Transmission States"
        count={filteredStates.length}
        searchPlaceholder="Search lifecycle states..."
        onSearch={(val) => handleFilterChange('search', val)}
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={ListActions}
      >

        {/* Lifecycle States List */}
        {filteredStates.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No lifecycle states defined"
            description="Create your first lifecycle state to get started."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedStates).map(([categoryName, states]) => {
              if (filters.category !== "All" && filters.category !== categoryName) return null;
              if (states.length === 0) return null;

              const CategoryIcon = categoryIcons[categoryName] || Zap;

              return (
                <div key={categoryName} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground capitalize">
                    <CategoryIcon className="w-3 h-3" />
                    {categoryName}
                  </div>
                  {states
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((state) => {
                      const StateIcon = stateIcons[state.name] || Clock;
                      const stateColor = stateColors[state.name] || "bg-gray-100 text-gray-700 border-gray-200";

                      return (
                        <button
                          key={state.id}
                          onClick={() => {
                            setActiveTab(categoryName);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <StateIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{state.name}</span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0.5", stateColor)}
                              >
                                Step {state.orderIndex}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {state.description || 'No description'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </ListPane>

      <WorkPane
        title="Lifecycle Configuration"
        subtitle="Manage Power Transmission asset lifecycle states and transitions"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        }
      />
    </div>
  );
}


function LifecycleOverview({
  groupedStates,
  selectedCategory
}: {
  groupedStates: Record<string, LifecycleState[]>;
  selectedCategory: string;
}) {
  if (Object.keys(groupedStates).length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No lifecycle states defined"
        description="Create lifecycle states to define asset lifecycle progression."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Power Transmission Lifecycle Configuration</h2>
        <p className="text-muted-foreground">
          Manage lifecycle states for electrical, protection, and measurement equipment
        </p>
      </div>

      {Object.entries(groupedStates).map(([categoryName, states]) => {
        if (selectedCategory !== "All" && selectedCategory !== categoryName) return null;
        if (states.length === 0) return null;

        const CategoryIcon = categoryIcons[categoryName] || Zap;

        return (
          <div key={categoryName}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
              <CategoryIcon className="w-5 h-5" />
              {categoryName} Lifecycle
              <Badge variant="secondary">{states.length} states</Badge>
            </h3>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lifecycle Flow</CardTitle>
                <CardDescription>
                  Sequential states for {categoryName} equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {states
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((state, index) => {
                      const StateIcon = stateIcons[state.name] || Clock;
                      const stateColor = stateColors[state.name] || "bg-gray-100 text-gray-700 border-gray-200";

                      return (
                        <div key={state.id} className="flex items-center gap-2">
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium",
                            stateColor
                          )}>
                            <StateIcon className="w-3 h-3" />
                            {state.name}
                          </div>
                          {index < states.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function CategoryLifecycle({
  category,
  states
}: {
  category: string;
  states: LifecycleState[];
}) {
  const CategoryIcon = categoryIcons[category] || Zap;
  const sortedStates = states.sort((a, b) => a.orderIndex - b.orderIndex);

  // Get category display name
  const categoryDisplayName = category.charAt(0).toUpperCase() + category.slice(1);

  if (states.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={`No ${categoryDisplayName} lifecycle states`}
        description={`Create lifecycle states for ${categoryDisplayName.toLowerCase()} equipment.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <CategoryIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{categoryDisplayName} Lifecycle</CardTitle>
              <CardDescription className="mt-1">
                {states.length} lifecycle states configured
              </CardDescription>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total States:</span>
                  <span className="font-medium ml-2">{states.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium ml-2 capitalize">{category}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Lifecycle States</h4>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add State
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium">Order</th>
                <th className="text-left p-3 text-sm font-medium">State Name</th>
                <th className="text-left p-3 text-sm font-medium">Description</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedStates.map((state) => {
                const StateIcon = stateIcons[state.name] || Clock;
                const stateColor = stateColors[state.name] || "bg-gray-100 text-gray-700 border-gray-200";

                return (
                  <tr key={state.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20">
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {state.orderIndex}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StateIcon className="w-4 h-4" />
                        <span className="font-medium">{state.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {state.description || '-'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", stateColor)}
                      >
                        Active
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lifecycle Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifecycle Flow</CardTitle>
          <CardDescription>
            Visual representation of {categoryDisplayName.toLowerCase()} lifecycle progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStates.map((state, index) => {
              const StateIcon = stateIcons[state.name] || Clock;
              const stateColor = stateColors[state.name] || "bg-gray-100 text-gray-700 border-gray-200";
              const isLast = index === sortedStates.length - 1;

              return (
                <div key={state.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center",
                      stateColor
                    )}>
                      <StateIcon className="w-5 h-5" />
                    </div>
                    {!isLast && (
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{state.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        Step {state.orderIndex}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {state.description || 'No description'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
