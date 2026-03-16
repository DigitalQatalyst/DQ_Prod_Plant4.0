import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, List as ListIcon, Clock, ArrowRight, History, Loader2, CheckCircle2, Play, Activity } from "lucide-react";
import { Sequence, SequenceStep } from "@/types/processAutomation";
import { SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// PA Status Badge Component
function PAStatusBadge({ status }: { status: "active" | "inactive" | "archived" | string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
    inactive: { label: "Inactive", className: "bg-warning/10 text-warning border-warning/20" },
    archived: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
  };

  const { label, className } = config[status] || config.inactive;

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

export function SequencesPage() {
  const { currentSector, currentSubsector } = useApp();
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();

  const [selectedRecord, setSelectedRecord] = useState<Sequence | null>(null);
  const [records, setRecords] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [executionModeFilter, setExecutionModeFilter] = useState<string>("all");

  // Fetch sequences from provider
  useEffect(() => {
    async function fetchSequences() {
      if (!currentTenant) return;

      setLoading(true);
      try {
        const data = await dataProvider.getSequences(currentTenant.id, {
          search: searchQuery
        });
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch sequences:", error);
        toast.error("Failed to load sequences");
      } finally {
        setLoading(false);
      }
    }

    fetchSequences();
  }, [currentTenant, dataProvider]);

  // Get unique execution modes for filter
  const executionModes = useMemo(() => {
    const modes = new Set(records.map(r => r.execution_mode));
    return Array.from(modes).sort();
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
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Execution mode filter
      if (executionModeFilter !== "all" && r.execution_mode !== executionModeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "steps-asc":
          return (a.steps?.length || 0) - (b.steps?.length || 0);
        case "steps-desc":
          return (b.steps?.length || 0) - (a.steps?.length || 0);
        case "duration-asc":
          return (a.total_duration_seconds || 0) - (b.total_duration_seconds || 0);
        case "duration-desc":
          return (b.total_duration_seconds || 0) - (a.total_duration_seconds || 0);
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
  }, [records, searchQuery, sortBy, statusFilter, executionModeFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} />,
      },
      {
        id: "timeline",
        label: "Timeline",
        content: <TimelineTab record={selectedRecord} />,
      },
      {
        id: "parameters",
        label: "Parameters",
        content: <ParametersTab record={selectedRecord} />,
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
        label: "Sequences Overview",
        content: <SequencesOverview records={records} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Sequences"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search sequences..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "steps-asc", label: "Fewest Steps" },
          { value: "steps-desc", label: "Most Steps" },
          { value: "duration-asc", label: "Shortest Duration" },
          { value: "duration-desc", label: "Longest Duration" },
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
              { value: "archived", label: "Archived" },
            ],
          },
          {
            key: "executionMode",
            label: "Execution Mode",
            value: executionModeFilter,
            onChange: setExecutionModeFilter,
            options: [
              { value: "all", label: "All Modes" },
              ...executionModes.map(mode => ({ value: mode, label: mode.charAt(0).toUpperCase() + mode.slice(1) })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Sequence
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading sequences...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium text-sm">
            No sequences found
          </div>
        ) : (
          filteredRecords.map((record) => (
            <SequenceListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Sequences"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.steps?.length || 0} steps · ${selectedRecord.execution_mode}`
            : "Select a sequence to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function SequenceListItem({
  record,
  isSelected,
  onClick,
}: {
  record: Sequence;
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
          <ListIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 mb-1">
            <span className="text-sm font-medium break-words">{record.name}</span>
            <PAStatusBadge status={record.status} />
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">
            {record.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.steps?.length || 0} steps</span>
            <span>·</span>
            <span className="capitalize">{record.execution_mode}</span>
            {record.total_duration_seconds && (
              <>
                <span>·</span>
                <span>{record.total_duration_seconds}s</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SequencesOverview({
  records,
  setSelectedRecord,
}: {
  records: Sequence[];
  setSelectedRecord: (record: Sequence) => void;
}) {
  const stats = useMemo(() => {
    const totalSequences = records.length;
    const activeSequences = records.filter(r => r.status === 'active').length;
    const sequentialSequences = records.filter(r => r.execution_mode === 'sequential').length;
    const recentExecutions = records.filter(r => {
      if (!r.last_executed_at) return false;
      const daysSinceExecution = (Date.now() - new Date(r.last_executed_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceExecution <= 7;
    }).length;

    return { totalSequences, activeSequences, sequentialSequences, recentExecutions };
  }, [records]);

  const recentSequences = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const executionModeData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.execution_mode] = (counts[r.execution_mode] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
    const statusColors: Record<string, string> = { active: '#22c55e', inactive: '#eab308', archived: '#94a3b8' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || '#94a3b8'
      }));
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Sequences"
          value={stats.totalSequences.toString()}
          subtitle="All sequences"
          icon={ListIcon}
          variant="primary"
        />
        <KPICard
          title="Active Sequences"
          value={stats.activeSequences.toString()}
          subtitle="Ready to execute"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeSequences / stats.totalSequences) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Sequential Mode"
          value={stats.sequentialSequences.toString()}
          subtitle="Ordered execution"
          icon={Play}
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
          <h3 className="text-sm font-semibold mb-4">Execution Modes</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionModeData}>
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

      {/* Recent Sequences Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Sequences</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Steps</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Execution Mode</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSequences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No sequences found
                  </td>
                </tr>
              ) : (
                recentSequences.map((sequence) => (
                  <tr
                    key={sequence.id}
                    onClick={() => setSelectedRecord(sequence)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{sequence.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{sequence.steps?.length || 0} steps</td>
                    <td className="px-4 py-3 text-sm capitalize">{sequence.execution_mode}</td>
                    <td className="px-4 py-3">
                      <PAStatusBadge status={sequence.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sequence.total_duration_seconds ? `${sequence.total_duration_seconds}s` : '-'}
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

function OverviewTab({ record }: { record: Sequence | null }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <ListIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Sequence Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a sequence from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <ListIcon className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PAStatusBadge status={record.status} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Display Sector as primary context */}
              <span>Process Automation</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Modify Parameters
          </Button>
        </div>
      </div>

      {/* Steps Preview */}
      <div className="bg-card border border-border rounded-lg p-6 font-geist">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          Execution Sequence ({record.steps?.length || 0} stages)
        </h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {record.steps?.map((step, index) => (
            <div key={index} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-xs font-bold bg-primary/5">
                  {step.step}
                </div>
                <div className="w-24 text-center">
                  <p className="text-[10px] font-bold truncate leading-tight uppercase">{step.action}</p>
                  {step.wait_s && <p className="text-[9px] text-muted-foreground">Wait {step.wait_s}s</p>}
                  {step.delay_ms && <p className="text-[9px] text-muted-foreground">Delay {step.delay_ms}ms</p>}
                </div>
              </div>
              {index < record.steps.length - 1 && (
                <div className="w-8 h-px bg-border mb-8 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Execution Settings</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Execution Mode" value={record.execution_mode} />
            <InfoRow label="Estimated Duration" value={`${record.total_duration_seconds || 0}s`} />
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

function TimelineTab({ record }: { record: Sequence | null }) {
  if (!record) return <EmptyState title="No Sequence Selected" />;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Sequence Timeline Visualization
        </h4>
        <div className="relative pt-12 pb-8 px-4">
          {/* Horizontal Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="flex justify-between relative">
            {record.steps?.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 z-10" />
                <div className="absolute top-0 -translate-y-full mb-4 text-center">
                  <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border">T + {index * 5}s</span>
                </div>
                <div className="mt-4 text-center w-32">
                  <p className="text-xs font-bold leading-tight">{step.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 bg-secondary/30 rounded py-0.5">Stage {step.step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-primary">Note:</span> This timeline visualization uses estimated timing based on sequence parameters.
            Real-time execution may vary slightly based on system latency.
          </p>
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: Sequence | null }) {
  if (!record) {
    return <EmptyState title="No Sequence Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 text-primary">Technical Specification</h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Mode</label>
            <p className="text-sm font-medium capitalize">{record.execution_mode}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Stages</label>
            <p className="text-sm font-medium">{record.steps?.length || 0}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Total Duration</label>
            <p className="text-sm font-medium">{record.total_duration_seconds || 0} seconds</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {record.steps?.map((step) => (
          <div key={step.step} className="p-4 flex items-start justify-between bg-card hover:bg-muted/30 transition-colors">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-bold shrink-0">{step.step}</div>
              <div>
                <p className="text-sm font-bold uppercase">{step.action}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {step.wait_s && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Wait {step.wait_s}s</span>}
                  {step.delay_ms && <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Delay {step.delay_ms}ms</span>}
                  {step.duration && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Dur: {step.duration}s</span>}
                </div>
              </div>
            </div>
            {step.condition && (
              <div className="text-right max-w-[200px]">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Gatekeeper Condition</p>
                <p className="text-[10px] font-mono bg-warning/10 text-warning px-2 py-1 rounded truncate border border-warning/20">{step.condition}</p>
              </div>
            )}
          </div>
        ))}
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
        <ListIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a sequence from the list to view its details
      </p>
    </div>
  );
}
