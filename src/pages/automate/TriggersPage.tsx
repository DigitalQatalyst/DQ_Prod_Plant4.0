import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, Zap, AlertCircle, History, Loader2, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { Trigger, ActionBinding } from "@/types/processAutomation";
import { getHybridProvider } from "@/lib/data/providers/HybridProvider";

import { SharedLinkedAssetsTab, SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";

// PA Status Badge Component
function PAStatusBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-success/10 text-success border-success/20")}>
        Active
      </span>
    );
  }
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-muted text-muted-foreground border-border")}>
      Disabled
    </span>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' | 'critical' }) {
  const config = {
    low: { label: "Low", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    high: { label: "High", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    critical: { label: "Critical", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  const { label, className } = config[priority];

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

export function TriggersPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Trigger | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tenant changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getTriggers(currentTenant.id);
        setRecords(data);
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch triggers:", err);
        setError("Failed to load triggers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique trigger types for filter
  const triggerTypes = useMemo(() => {
    const types = new Set(records.map(r => r.trigger_type));
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
          r.condition_expression.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;

      // Priority filter
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;

      // Trigger type filter
      if (triggerTypeFilter !== "all" && r.trigger_type !== triggerTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "priority-asc":
          const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "priority-desc":
          const priorityOrderDesc = { low: 1, medium: 2, high: 3, critical: 4 };
          return priorityOrderDesc[b.priority] - priorityOrderDesc[a.priority];
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
  }, [records, searchQuery, sortBy, statusFilter, priorityFilter, triggerTypeFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} />,
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
        label: "Triggers Overview",
        content: <TriggersOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Triggers"
        subtitle={`${currentSector.name} · ${currentSubsector}`}

        count={filteredRecords.length}
        searchPlaceholder="Search triggers..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "priority-asc", label: "Priority (Low to Critical)" },
          { value: "priority-desc", label: "Priority (Critical to Low)" },
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
              { value: "disabled", label: "Disabled Only" },
            ],
          },
          {
            key: "priority",
            label: "Priority",
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { value: "all", label: "All Priorities" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ],
          },
          {
            key: "triggerType",
            label: "Trigger Type",
            value: triggerTypeFilter,
            onChange: setTriggerTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...triggerTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Trigger
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
          <div className="p-4 text-sm text-muted-foreground text-center">No triggers found</div>
        ) : (
          filteredRecords.map((record) => (
            <TriggerListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Triggers"}
        subtitle={
          selectedRecord
            ? `Priority: ${selectedRecord.priority}`
            : "Select a trigger to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function TriggerListItem({
  record,
  isSelected,
  onClick,
}: {
  record: Trigger;
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
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 mb-1">
            <span className="text-sm font-medium break-words">{record.name}</span>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={record.priority} />
              <PAStatusBadge enabled={record.enabled} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">
            {record.condition_expression}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.action_binding_ids.length} actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TriggersOverview({
  records,
  setSelectedRecord,
}: {
  records: Trigger[];
  setSelectedRecord: (record: Trigger) => void;
}) {
  const stats = useMemo(() => {
    const totalTriggers = records.length;
    const activeTriggers = records.filter(r => r.enabled).length;
    const criticalPriority = records.filter(r => r.priority === 'critical').length;
    const recentActivations = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalTriggers, activeTriggers, criticalPriority, recentActivations };
  }, [records]);

  const recentTriggers = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.priority] = (counts[r.priority] || 0) + 1);
    const priorityColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: priorityColors[name] || '#94a3b8'
      }));
  }, [records]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.trigger_type] = (counts[r.trigger_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Triggers"
          value={stats.totalTriggers.toString()}
          subtitle="All triggers"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="Active Triggers"
          value={stats.activeTriggers.toString()}
          subtitle="Currently enabled"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeTriggers / stats.totalTriggers) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Critical Priority"
          value={stats.criticalPriority.toString()}
          subtitle="High importance"
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Recent Activations"
          value={stats.recentActivations.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Trigger Priorities</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
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

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Trigger Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
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
      </div>

      {/* Recent Triggers Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Triggers</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Condition</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTriggers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No triggers found
                  </td>
                </tr>
              ) : (
                recentTriggers.map((trigger) => (
                  <tr
                    key={trigger.id}
                    onClick={() => setSelectedRecord(trigger)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{trigger.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {trigger.condition_expression}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {trigger.action_binding_ids.length} actions
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={trigger.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <PAStatusBadge enabled={trigger.enabled} />
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

function OverviewTab({ record }: { record: Trigger | null }) {
  const [actionBindings, setActionBindings] = useState<ActionBinding[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);

  useEffect(() => {
    if (!record) return;

    const fetchBindings = async () => {
      if (!record.action_binding_ids || record.action_binding_ids.length === 0) {
        setActionBindings([]);
        return;
      }

      setLoadingBindings(true);
      try {
        const provider = getHybridProvider();
        const promises = record.action_binding_ids.map(id => provider.getActionBinding(id));
        const results = await Promise.all(promises);
        setActionBindings(results.filter((b): b is ActionBinding => b !== null));
      } catch (err) {
        console.error("Failed to fetch action bindings", err);
      } finally {
        setLoadingBindings(false);
      }
    };

    fetchBindings();
  }, [record]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Trigger Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a trigger from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trigger Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PriorityBadge priority={record.priority} />
              <PAStatusBadge enabled={record.enabled} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description || "No description provided"}</p>
          </div>
          <Button variant="outline" size="sm">
            Edit Trigger
          </Button>
        </div>
      </div>

      {/* Trigger Condition */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          Trigger Condition
        </h4>
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-sm font-mono">{record.condition_expression}</p>
        </div>
      </div>

      {/* Action Bindings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Linked Action Bindings</h4>
        <div className="space-y-2">
          {loadingBindings ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : actionBindings.length > 0 ? (
            actionBindings.map((binding, index) => (
              <div
                key={binding.id}
                className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium">{binding.name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span className="capitalize">{binding.action_type}</span>
                    {binding.target_tag && <span>· {binding.target_tag}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No actions configured for this trigger</p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Configuration</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Trigger Type" value={record.trigger_type} />
            <InfoRow label="Interval" value={record.evaluation_interval ? `${record.evaluation_interval}s` : "Event-driven"} />
            <InfoRow label="Priority" value={record.priority} />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {record.created_by && <InfoRow label="Created By" value={record.created_by} />}
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: Trigger | null }) {
  if (!record) {
    return <EmptyState title="No Trigger Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Trigger Details</h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Condition Expression</label>
            <p className="text-sm font-mono mt-1 p-3 bg-secondary/50 border border-border rounded-lg">
              {record.condition_expression}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <p className="text-sm mt-1 capitalize">{record.trigger_type}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Evaluation Interval</label>
              <p className="text-sm mt-1">{record.evaluation_interval ? `${record.evaluation_interval}s` : "Immediate / Event-driven"}</p>
            </div>
          </div>
        </div>
      </div>

      {record.tags && record.tags.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {record.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-secondary border border-border rounded text-[10px]">
                {tag}
              </span>
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
        <Zap className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a trigger from the list to view its details
      </p>
    </div>
  );
}
