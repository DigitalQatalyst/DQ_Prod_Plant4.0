import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon, Zap, History, Loader2, CheckCircle2, Layers, Activity } from "lucide-react";
import { ActionBinding } from "@/types/processAutomation";
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


function ParameterValue({ value }: { value: any }) {
  // Check if value is an array of strings (like pre_checks/post_checks)
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {value.map((item, index) => (
          <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border">
            {item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <pre className="text-xs font-mono bg-background/50 p-2 rounded border border-border/50 overflow-auto whitespace-pre-wrap mt-1">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <p className="text-sm font-medium break-all">{String(value)}</p>;
}

export function ActionBindingsPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<ActionBinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ActionBinding | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getActionBindings(currentTenant.id);
        setRecords(data);
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch action bindings:", err);
        setError("Failed to load action bindings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    const types = new Set(records.map(r => r.action_type));
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
          r.command.toLowerCase().includes(search) ||
          r.target_system.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;

      // Action type filter
      if (actionTypeFilter !== "all" && r.action_type !== actionTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
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
  }, [records, searchQuery, sortBy, statusFilter, actionTypeFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} sectorName={currentSector.name} subsectorName={currentSubsector} />,
      },
      {
        id: "parameters",
        label: "Parameters",
        content: <ParametersTab record={selectedRecord} />,
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
        label: "Action Bindings Overview",
        content: <ActionBindingsOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Action Bindings"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search action bindings..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
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
            key: "actionType",
            label: "Action Type",
            value: actionTypeFilter,
            onChange: setActionTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...actionTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Binding
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
          <div className="p-4 text-sm text-muted-foreground text-center">No action bindings found</div>
        ) : (
          filteredRecords.map((record) => (
            <ActionBindingListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Action Bindings"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.command} → ${selectedRecord.target_system}`
            : "Select a binding to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function ActionBindingListItem({
  record,
  isSelected,
  onClick,
}: {
  record: ActionBinding;
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
          <LinkIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 mb-1">
            <span className="text-sm font-medium break-words">{record.name}</span>
            <PAStatusBadge isActive={record.is_active} />
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">{record.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.command}</span>
            <span>→</span>
            <span>{record.target_system}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBindingsOverview({
  records,
  setSelectedRecord,
}: {
  records: ActionBinding[];
  setSelectedRecord: (record: ActionBinding) => void;
}) {
  const stats = useMemo(() => {
    const totalActions = records.length;
    const activeBindings = records.filter(r => r.is_active).length;
    const uniqueActionTypes = new Set(records.map(r => r.action_type)).size;
    const recentExecutions = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalActions, activeBindings, uniqueActionTypes, recentExecutions };
  }, [records]);

  const recentBindings = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const actionTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.action_type] = (counts[r.action_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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
          title="Total Actions"
          value={stats.totalActions.toString()}
          subtitle="All action bindings"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="Active Bindings"
          value={stats.activeBindings.toString()}
          subtitle="Currently in use"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeBindings / stats.totalActions) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Action Types"
          value={stats.uniqueActionTypes.toString()}
          subtitle="Unique types"
          icon={Layers}
          variant="primary"
        />
        <KPICard
          title="Recent Executions"
          value={stats.recentExecutions.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Action Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionTypeData}>
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

      {/* Recent Bindings Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Action Bindings</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Action Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Command</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Target System</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentBindings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No action bindings found
                  </td>
                </tr>
              ) : (
                recentBindings.map((binding) => (
                  <tr
                    key={binding.id}
                    onClick={() => setSelectedRecord(binding)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{binding.name}</td>
                    <td className="px-4 py-3 text-sm capitalize">{binding.action_type}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs text-muted-foreground">{binding.command}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{binding.target_system}</td>
                    <td className="px-4 py-3">
                      <PAStatusBadge isActive={binding.is_active} />
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

function OverviewTab({ record, sectorName, subsectorName }: { record: ActionBinding | null, sectorName: string, subsectorName: string }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <LinkIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Binding Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select an action binding from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Binding Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <LinkIcon className="w-8 h-8 text-primary" />
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
            Edit Binding
          </Button>
        </div>
      </div>

      {/* Action to Actuator Mapping */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Action to Actuator Mapping
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Command (Action)</p>
            <p className="text-sm font-mono font-medium">{record.command}</p>
          </div>
          <LinkIcon className="w-5 h-5 text-primary" />
          <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Target System</p>
            <p className="text-sm font-mono font-medium">{record.target_system}</p>
          </div>
        </div>
      </div>

      {/* Parameters */}
      {record.parameters && Object.keys(record.parameters).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Binding Parameters</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(record.parameters).map(([key, value]) => (
              <div key={key} className="bg-secondary/50 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{key}</p>
                <ParameterValue value={value} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Configuration</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Action Type" value={record.action_type} />
            <InfoRow label="Target Tag" value={record.target_tag || "-"} />
            <InfoRow
              label="Parameters"
              value={record.parameters ? Object.keys(record.parameters).length.toString() : "0"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Created By" value={record.created_by} />
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}




function ParametersTab({ record }: { record: ActionBinding | null }) {
  if (!record) {
    return <EmptyState title="No Binding Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Action Configuration</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Command</label>
              <p className="text-sm font-mono mt-1">{record.command}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target System</label>
              <p className="text-sm font-mono mt-1">{record.target_system}</p>
            </div>
          </div>
        </div>
      </div>

      {record.parameters && Object.keys(record.parameters).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Binding Parameters</h4>
          <div className="space-y-3">
            {Object.entries(record.parameters).map(([key, value]) => (
              <div key={key} className="py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground block mb-1">{key}</span>
                <ParameterValue value={value} />
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
        <LinkIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select an action binding from the list to view its details
      </p>
    </div>
  );
}
