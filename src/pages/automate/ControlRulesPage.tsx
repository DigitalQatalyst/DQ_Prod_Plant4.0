import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, FileCode, AlertCircle, CheckCircle2, History, Loader2, Power, Activity, Layers } from "lucide-react";
import { ControlRule } from "@/types/processAutomation";
import { SharedLinkedAssetsTab, SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// PA Status Badge Component
function PAStatusBadge({ status }: { status: "active" | "draft" | "archived" | string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
    draft: { label: "Draft", className: "bg-warning/10 text-warning border-warning/20" },
    archived: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
  };

  const { label, className } = config[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" | "critical" }) {
  const config = {
    low: { label: "Low", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    high: { label: "High", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    critical: { label: "Critical", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  const { label, className } = config[priority] || config.low;

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

export function ControlRulesPage() {
  const { currentSector, currentSubsector } = useApp();
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();

  const [selectedRecord, setSelectedRecord] = useState<ControlRule | null>(null);
  const [records, setRecords] = useState<ControlRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isToggling, setIsToggling] = useState(false);

  // Fetch control rules
  useEffect(() => {
    async function fetchRules() {
      if (!currentTenant) return;

      setLoading(true);
      try {
        const data = await dataProvider.getControlRules(currentTenant.id, {
          search: searchQuery
        });
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch control rules:", error);
        toast.error("Failed to load control rules");
      } finally {
        setLoading(false);
      }
    }

    fetchRules();
  }, [currentTenant, dataProvider]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search)) ||
          r.condition_expression.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.enabled) return false;
      if (statusFilter === "inactive" && r.enabled) return false;

      // Priority filter
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;

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
  }, [records, searchQuery, sortBy, statusFilter, priorityFilter]);

  const handleToggle = async () => {
    if (!selectedRecord) return;

    setIsToggling(true);
    try {
      const updated = await dataProvider.toggleControlRule(selectedRecord.id, !selectedRecord.enabled);
      toast.success(`Rule ${updated.enabled ? 'enabled' : 'disabled'}: ${updated.name}`);

      // Update local state
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedRecord(updated);
    } catch (error) {
      console.error("Failed to toggle rule:", error);
      toast.error("Failed to update rule status");
    } finally {
      setIsToggling(false);
    }
  };

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} onToggle={handleToggle} isToggling={isToggling} />,
      },
      {
        id: "parameters",
        label: "Logic & Params",
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
        label: "Control Rules Overview",
        content: <ControlRulesOverview records={records} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Control Rules"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search control rules..."
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
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
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
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading rules...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium text-sm">
            No rules found
          </div>
        ) : (
          filteredRecords.map((record) => (
            <ControlRuleListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Control Rules"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.rule_type} · ${selectedRecord.priority} priority`
            : "Select a control rule to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function ControlRuleListItem({
  record,
  isSelected,
  onClick,
}: {
  record: ControlRule;
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
          <FileCode className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{record.name}</span>
            <PriorityBadge priority={record.priority} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">
            {record.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{record.rule_type}</span>
            <span>·</span>
            <span>{record.action_binding_ids?.length || 0} actions</span>
            <span>·</span>
            {record.enabled ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="w-3 h-3" />
                Enabled
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRulesOverview({
  records,
  setSelectedRecord,
}: {
  records: ControlRule[];
  setSelectedRecord: (record: ControlRule) => void;
}) {
  const stats = useMemo(() => {
    const totalRules = records.length;
    const activeRules = records.filter(r => r.enabled).length;
    const continuousRules = records.filter(r => r.rule_type === 'continuous').length;
    const recentUpdates = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalRules, activeRules, continuousRules, recentUpdates };
  }, [records]);

  const recentRules = useMemo(() => {
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

  const statusData = useMemo(() => {
    const active = records.filter(r => r.enabled).length;
    const disabled = records.length - active;
    return [
      { name: 'Enabled', value: active, color: '#22c55e' },
      { name: 'Disabled', value: disabled, color: '#94a3b8' },
    ];
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Rules"
          value={stats.totalRules.toString()}
          subtitle="All control rules"
          icon={FileCode}
          variant="primary"
        />
        <KPICard
          title="Active Rules"
          value={stats.activeRules.toString()}
          subtitle="Currently enabled"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeRules / stats.totalRules) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Continuous Rules"
          value={stats.continuousRules.toString()}
          subtitle="Real-time control"
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
          <h3 className="text-sm font-semibold mb-4">Priority Distribution</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
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

      {/* Recent Rules Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Control Rules</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Rule Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Condition</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No control rules found
                  </td>
                </tr>
              ) : (
                recentRules.map((rule) => (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRecord(rule)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-sm capitalize">{rule.rule_type}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {rule.condition_expression}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={rule.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {rule.enabled ? (
                        <span className="flex items-center gap-1 text-success text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <AlertCircle className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
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

function OverviewTab({
  record,
  onToggle,
  isToggling
}: {
  record: ControlRule | null;
  onToggle: () => void;
  isToggling: boolean;
}) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <FileCode className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Control Rule Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a control rule from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rule Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileCode className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PriorityBadge priority={record.priority} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Display Sector as primary context */}
              <span>Process Automation</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={record.enabled ? "outline" : "default"}
              size="sm"
              className="gap-2"
              onClick={onToggle}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : record.enabled ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Disable
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Enable
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              Edit Logic
            </Button>
          </div>
        </div>
      </div>

      {/* Rule Logic */}
      <div className="bg-card border border-border rounded-lg p-6 font-geist">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          Governance Logic (SQL/EXPR)
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Trigger Condition</label>
            <div className="bg-secondary/30 border border-border rounded-lg p-4">
              <code className="text-sm font-mono text-primary">{record.condition_expression}</code>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Bound Action IDs ({record.action_binding_ids?.length || 0})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {record.action_binding_ids?.map((id, index) => (
                <div
                  key={index}
                  className="bg-secondary/50 border border-border rounded p-2 flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                    {index + 1}
                  </div>
                  <code className="text-[10px] font-mono truncate text-muted-foreground">{id}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Rule Context</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Rule Class" value={record.rule_type} />
            <InfoRow label="Priority Tier" value={record.priority} />
            <InfoRow label="Operational Status" value={record.enabled ? "Active" : "Bypass"} />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: ControlRule | null }) {
  if (!record) {
    return <EmptyState title="No Control Rule Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 text-primary">Runtime Parameters</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Evaluation</label>
              <p className="text-sm font-bold capitalize">{record.rule_type}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Criticality</label>
              <p className="text-sm font-bold capitalize">{record.priority}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Enabled</label>
              <p className="text-sm font-bold">{record.enabled ? "TRUE" : "FALSE"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 font-geist">
        <h4 className="text-sm font-semibold mb-4">Raw Expression</h4>
        <div className="bg-secondary/20 border border-border rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-warning">
            {`SELECT * FROM telemetry \nWHERE ${record.condition_expression}\nLIMIT 1;`}
          </pre>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Action Pipeline</h4>
        <div className="space-y-3">
          {record.action_binding_ids?.map((id, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">#0{index + 1}</span>
                <span className="text-xs font-mono">{id}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold tracking-tighter hover:bg-primary/10 hover:text-primary">
                View Binding
              </Button>
            </div>
          ))}
          {(!record.action_binding_ids || record.action_binding_ids.length === 0) && (
            <p className="text-xs text-muted-foreground italic">No actions defined for this rule.</p>
          )}
        </div>
      </div>
    </div>
  );
}



function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <FileCode className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a control rule from the list to view its details
      </p>
    </div>
  );
}
