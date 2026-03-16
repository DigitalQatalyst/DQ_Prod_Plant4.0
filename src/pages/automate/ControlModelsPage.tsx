import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, Activity, History, Loader2, CheckCircle2, Layers } from "lucide-react";
import { ControlModel, ControlModelState } from "@/types/processAutomation";
import { getHybridProvider } from "@/lib/data/providers/HybridProvider";
import { SharedLinkedAssetsTab, SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";

// PA Status Badge Component
function PAStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-success/10 text-success border-success/20")}>
        Active
      </span>
    );
  }
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-muted text-muted-foreground border-border")}>
      Inactive
    </span>
  );
}

export function ControlModelsPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<ControlModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ControlModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getControlModels(currentTenant.id);
        setRecords(data);
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch control models:", err);
        setError("Failed to load control models");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique equipment types for filter
  const equipmentTypes = useMemo(() => {
    const types = new Set(records.map(r => r.equipment_type));
    return Array.from(types).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;

      // Equipment type filter
      if (equipmentTypeFilter !== "all" && r.equipment_type !== equipmentTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "states-asc":
          return a.states.length - b.states.length;
        case "states-desc":
          return b.states.length - a.states.length;
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated-asc":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "updated-desc":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [records, searchQuery, sortBy, statusFilter, equipmentTypeFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} sectorName={currentSector.name} subsectorName={currentSubsector} />,
      },
      {
        id: "states",
        label: "States & Transitions",
        content: <StatesTab record={selectedRecord} />,
      },
      {
        id: "linked-assets",
        label: "Linked Assets",
        content: <SharedLinkedAssetsTab record={selectedRecord} />,
      },
      {
        id: "history",
        label: "History",
        content: <SharedHistoryTab record={selectedRecord} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Control Models Overview",
        content: <ControlModelsOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Control Models"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search control models..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "states-asc", label: "Fewest States" },
          { value: "states-desc", label: "Most States" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
          { value: "updated-asc", label: "Least Recently Updated" },
          { value: "updated-desc", label: "Most Recently Updated" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
            ],
          },
          {
            key: "equipmentType",
            label: "Equipment Type",
            value: equipmentTypeFilter,
            onChange: setEquipmentTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...equipmentTypes.map(type => ({ value: type, label: type })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Model
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive text-center">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No control models found</div>
        ) : (
          filteredRecords.map((record) => (
            <ControlModelListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Control Models"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.states.length} states · Current: ${selectedRecord.current_state || "N/A"}`
            : "Select a model to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function ControlModelListItem({
  record,
  isSelected,
  onClick,
}: {
  record: ControlModel;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <GitBranch className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{record.name}</span>
            <PAStatusBadge isActive={record.is_active} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">{record.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.states.length} states</span>
            {record.current_state && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">{record.current_state}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlModelsOverview({
  records,
  setSelectedRecord,
}: {
  records: ControlModel[];
  setSelectedRecord: (record: ControlModel) => void;
}) {
  const stats = useMemo(() => {
    const totalModels = records.length;
    const activeModels = records.filter(r => r.is_active).length;
    const totalStates = records.reduce((sum, r) => sum + r.states.length, 0);
    const recentUpdates = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalModels, activeModels, totalStates, recentUpdates };
  }, [records]);

  const recentModels = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const equipmentTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.equipment_type] = (counts[r.equipment_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  const statusData = useMemo(() => {
    const active = records.filter(r => r.is_active).length;
    const inactive = records.length - active;
    return [
      { name: 'Active', value: active, color: '#22c55e' },
      { name: 'Inactive', value: inactive, color: '#94a3b8' },
    ];
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Models"
          value={stats.totalModels.toString()}
          subtitle="All control models"
          icon={GitBranch}
          variant="primary"
        />
        <KPICard
          title="Active Models"
          value={stats.activeModels.toString()}
          subtitle="Currently in use"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeModels / stats.totalModels) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Total States"
          value={stats.totalStates.toString()}
          subtitle="Across all models"
          icon={Layers}
          variant="primary"
        />
        <KPICard
          title="Recent Updates"
          value={stats.recentUpdates.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Models by Equipment Type</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentTypeData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Status Overview</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Models Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Control Models</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">States</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Current State</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentModels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No control models found
                  </td>
                </tr>
              ) : (
                recentModels.map((model) => (
                  <tr
                    key={model.id}
                    onClick={() => setSelectedRecord(model)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{model.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{model.states.length}</td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{model.current_state || "Not Set"}</td>
                    <td className="px-4 py-3">
                      <PAStatusBadge isActive={model.is_active} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(model.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ record, sectorName, subsectorName }: { record: ControlModel | null, sectorName: string, subsectorName: string }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <GitBranch className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Model Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a control model from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PAStatusBadge isActive={record.is_active} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description || "No description provided"}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{sectorName}</span>
              <span>·</span>
              <span>{subsectorName}</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Edit Model
          </Button>
        </div>
      </div>

      {/* State Machine Diagram */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          State Machine Diagram
        </h4>
        <div className="bg-secondary/30 border border-border rounded-lg p-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {record.states.map((state: ControlModelState, index: number) => (
              <div
                key={index}
                className={cn(
                  "px-6 py-4 rounded-lg border-2 font-medium text-sm transition-colors",
                  state.name === record.current_state
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                )}
              >
                {state.display_name || state.name}
              </div>
            ))}
          </div>
          {record.transitions && record.transitions.length > 0 && (
            <div className="mt-6 text-xs text-muted-foreground text-center">
              {record.transitions.length} transitions defined
            </div>
          )}
        </div>
      </div>

      {/* Current State Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Current State</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {record.current_state || "Not Set"}
              </div>
              <p className="text-xs text-muted-foreground">Active State</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Model Info</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Equipment Type" value={record.equipment_type} />
            <InfoRow label="Total States" value={record.states.length.toString()} />
            <InfoRow
              label="Transitions"
              value={record.transitions?.length.toString() || "0"}
            />
            <InfoRow label="Created By" value={record.created_by} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatesTab({ record }: { record: ControlModel | null }) {
  if (!record) {
    return <EmptyState title="No Model Selected" />;
  }

  return (
    <div className="space-y-6">
      {/* States List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">States</h4>
        <div className="grid grid-cols-2 gap-3">
          {record.states.map((state: ControlModelState, idx: number) => (
            <div
              key={idx}
              className={cn(
                "px-4 py-3 rounded-lg border",
                state.name === record.current_state
                  ? "bg-primary/10 border-primary"
                  : "bg-secondary/50 border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{state.display_name || state.name}</span>
                {state.name === record.current_state && (
                  <span className="text-xs text-primary font-medium">Active</span>
                )}
              </div>
              {state.description && (
                <p className="text-xs text-muted-foreground mt-1">{state.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transitions */}
      {record.transitions && record.transitions.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">State Transitions</h4>
          <div className="space-y-3">
            {record.transitions.map((transition, index) => (
              <div
                key={index}
                className="bg-secondary/50 border border-border rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium">{transition.from_state}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm font-medium">{transition.to_state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-primary/10 px-2 py-0.5 rounded text-primary">{transition.trigger}</span>
                  {transition.conditions && transition.conditions.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Conditions: {transition.conditions.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <GitBranch className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a control model from the list to view its details
      </p>
    </div>
  );
}
