import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, Workflow as WorkflowIcon, Play, CheckCircle, History, Loader2, Activity, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Workflow, WorkflowStep } from "@/types/processAutomation";
import { SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// PA Status Badge Component
function PAStatusBadge({ status }: { status: "idle" | "running" | "completed" | "failed" | string }) {
  const config: Record<string, { label: string; className: string }> = {
    idle: { label: "Idle", className: "bg-muted text-muted-foreground border-border" },
    running: { label: "Running", className: "bg-primary/10 text-primary border-primary/20 animate-pulse" },
    completed: { label: "Completed", className: "bg-success/10 text-success border-success/20" },
    failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
    active: { label: "Active", className: "bg-success/10 text-success border-success/20" }, // For backward compatibility
  };

  const { label, className } = config[status] || config.idle;

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

export function WorkflowsPage() {
  const { currentSector, currentSubsector } = useApp();
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();

  const [selectedRecord, setSelectedRecord] = useState<Workflow | null>(null);
  const [records, setRecords] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch workflows from provider
  useEffect(() => {
    async function fetchWorkflows() {
      if (!currentTenant) return;

      setLoading(true);
      try {
        const data = await dataProvider.getWorkflows(currentTenant.id);
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
        toast.error("Failed to load workflows");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, [currentTenant, dataProvider]);

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
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && r.execution_status !== statusFilter) return false;

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
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "executed-asc":
          const aTime = a.last_executed_at ? new Date(a.last_executed_at).getTime() : 0;
          const bTime = b.last_executed_at ? new Date(b.last_executed_at).getTime() : 0;
          return aTime - bTime;
        case "executed-desc":
          const aTimeDesc = a.last_executed_at ? new Date(a.last_executed_at).getTime() : 0;
          const bTimeDesc = b.last_executed_at ? new Date(b.last_executed_at).getTime() : 0;
          return bTimeDesc - aTimeDesc;
        case "updated-asc":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "updated-desc":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [records, searchQuery, sortBy, statusFilter, triggerTypeFilter]);

  const handleExecute = async () => {
    if (!selectedRecord) return;

    setIsExecuting(true);
    try {
      await dataProvider.executeWorkflow(selectedRecord.id);
      toast.success(`Started executing workflow: ${selectedRecord.name}`);

      // Refresh workflows to show running state
      const updatedWorkflows = await dataProvider.getWorkflows(selectedRecord.tenant_id);
      setRecords(updatedWorkflows);

      // Update selected record
      const updated = updatedWorkflows.find(w => w.id === selectedRecord.id);
      if (updated) setSelectedRecord(updated);

      // Start polling for completion (simple version)
      const pollInterval = setInterval(async () => {
        const data = await dataProvider.getWorkflow(selectedRecord.id);
        if (data && data.execution_status !== 'running') {
          setSelectedRecord(data);
          const currentData = await dataProvider.getWorkflows(selectedRecord.tenant_id);
          setRecords(currentData);
          clearInterval(pollInterval);
          if (data.execution_status === 'completed') {
            toast.success(`Workflow completed: ${selectedRecord.name}`);
          } else if (data.execution_status === 'failed') {
            toast.error(`Workflow failed: ${selectedRecord.name}`);
          }
        }
      }, 2000);

      // Backup timeout to stop polling
      setTimeout(() => clearInterval(pollInterval), 30000);

    } catch (error) {
      console.error("Failed to execute workflow:", error);
      toast.error("Failed to execute workflow");
    } finally {
      setIsExecuting(false);
    }
  };

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} onExecute={handleExecute} isExecuting={isExecuting} onViewSteps={() => setActiveTab("steps")} />,
      },
      {
        id: "steps",
        label: "Steps & Plan",
        content: <StepsTab record={selectedRecord} />,
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
        label: "Workflows Overview",
        content: <WorkflowsOverview records={records} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  // Reset active tab when selected record changes
  const handleSelectRecord = (record: Workflow) => {
    setSelectedRecord(record);
    setActiveTab("overview");
  };

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Workflows"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search workflows..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
          { value: "updated-asc", label: "Least Recently Updated" },
          { value: "updated-desc", label: "Most Recently Updated" },
          { value: "executed-asc", label: "Least Recently Executed" },
          { value: "executed-desc", label: "Most Recently Executed" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            key: "status",
            label: "Execution Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "idle", label: "Idle" },
              { value: "running", label: "Running" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
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
            Add Workflow
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading workflows...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium text-sm">
            No workflows found
          </div>
        ) : (
          filteredRecords.map((record) => (
            <WorkflowListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => handleSelectRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Workflows"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.steps?.length || 0} steps · ${selectedRecord.trigger_type}`
            : "Select a workflow to view details"
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function WorkflowListItem({
  record,
  isSelected,
  onClick,
}: {
  record: Workflow;
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
          <WorkflowIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 mb-1">
            <span className="text-sm font-medium break-words">{record.name}</span>
            <PAStatusBadge status={record.execution_status} />
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">
            {record.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.steps?.length || 0} steps</span>
            <span>·</span>
            <span className="capitalize">{record.trigger_type}</span>
            {record.requires_approval && (
              <>
                <span>·</span>
                <span>Approval Required</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowsOverview({
  records,
  setSelectedRecord,
}: {
  records: Workflow[];
  setSelectedRecord: (record: Workflow) => void;
}) {
  const stats = {
    totalWorkflows: records.length,
    activeWorkflows: records.filter(r => r.execution_status === 'running').length,
    pendingApprovals: records.filter(r => r.requires_approval && r.execution_status === 'idle').length,
    recentExecutions: records.filter(r => {
      if (!r.last_executed_at) return false;
      const daysSinceExecution = (Date.now() - new Date(r.last_executed_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceExecution <= 7;
    }).length,
  };

  const recentWorkflows = records
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { completed: 0, failed: 0, running: 0, idle: 0 };
    records.forEach(r => {
      const s = r.execution_status || 'idle';
      counts[s] = (counts[s] || 0) + 1;
    });

    const colorMap: Record<string, string> = {
      completed: '#22c55e',
      failed: '#ef4444',
      running: '#3b82f6',
      idle: '#94a3b8'
    };

    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colorMap[name] || '#94a3b8'
      }))
      .filter(d => d.value > 0);
  }, [records]);

  const triggerData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.trigger_type] = (counts[r.trigger_type] || 0) + 1);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Workflows"
          value={stats.totalWorkflows.toString()}
          subtitle="All workflows"
          icon={WorkflowIcon}
          variant="primary"
        />
        <KPICard
          title="Active Workflows"
          value={stats.activeWorkflows.toString()}
          subtitle="Currently running"
          icon={Activity}
          variant="success"
        />
        <KPICard
          title="Pending Approvals"
          value={stats.pendingApprovals.toString()}
          subtitle="Awaiting approval"
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="Recent Executions"
          value={stats.recentExecutions.toString()}
          subtitle="Last 7 days"
          icon={Clock}
          variant="primary"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Execution Status</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Trigger Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triggerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {triggerData.map((entry, index) => (
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

      {/* Recent Workflows Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Workflows</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Steps</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Trigger Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Last Executed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No workflows found
                  </td>
                </tr>
              ) : (
                recentWorkflows.map((workflow) => (
                  <tr
                    key={workflow.id}
                    onClick={() => setSelectedRecord(workflow)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{workflow.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{workflow.steps?.length || 0}</td>
                    <td className="px-4 py-3 text-sm capitalize">{workflow.trigger_type}</td>
                    <td className="px-4 py-3">
                      <PAStatusBadge status={workflow.execution_status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {workflow.last_executed_at ? new Date(workflow.last_executed_at).toLocaleDateString() : "Never"}
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
  onExecute,
  isExecuting,
  onViewSteps,
}: {
  record: Workflow | null;
  onExecute: () => void;
  isExecuting: boolean;
  onViewSteps?: () => void;
}) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <WorkflowIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Workflow Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a workflow from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Header Card */}
      <div className="bg-card border border-border rounded-lg p-6 font-geist">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <WorkflowIcon className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PAStatusBadge status={record.execution_status} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Display Sector as primary context */}
              <span>Process Automation</span>
            </div>
          </div>
          <Button
            variant={record.execution_status === 'running' ? "secondary" : "default"}
            size="sm"
            className="gap-2"
            onClick={onExecute}
            disabled={isExecuting || record.execution_status === 'running'}
          >
            {isExecuting || record.execution_status === 'running' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {record.execution_status === 'running' ? "Executing..." : "Execute"}
          </Button>
        </div>
      </div>

      {/* Workflow Steps Preview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Workflow Steps ({record.steps?.length || 0})
        </h4>
        <div className="space-y-3">
          {record.steps?.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-secondary/30 border border-border rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-medium text-primary">
                {step.step || index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-0.5">{step.name}</p>
                <p className="text-xs text-muted-foreground">
                  Action: <span className="font-mono">{step.action}</span>
                </p>
              </div>
            </div>
          ))}
          {onViewSteps && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/60"
                onClick={onViewSteps}
              >
                View Full Steps &amp; Plan
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Trigger Configuration</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Trigger Type" value={record.trigger_type} />
            <InfoRow
              label="Approval Required"
              value={record.requires_approval ? "Yes" : "No"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
            {record.last_executed_at && (
              <InfoRow label="Last Executed" value={new Date(record.last_executed_at).toLocaleString()} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepsTab({ record }: { record: Workflow | null }) {
  if (!record) return <EmptyState title="No Workflow Selected" />;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Detailed Step Sequence</h4>
        <div className="space-y-4">
          {record.steps?.map((step, index) => (
            <div key={index} className="relative pl-8 pb-6 last:pb-0">
              {/* Timeline Line */}
              {index !== record.steps.length - 1 && (
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
              )}
              {/* Timeline Dot */}
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="bg-secondary/20 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold">{step.name}</h5>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">STEP {step.step || index + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Target Action</label>
                    <p className="text-xs font-mono bg-background p-1.5 rounded border border-border">{step.action}</p>
                  </div>
                  {step.duration && (
                    <div>
                      <label className="text-xs text-muted-foreground">Expected Duration</label>
                      <p className="text-xs">{step.duration} seconds</p>
                    </div>
                  )}
                </div>
                {step.condition && (
                  <div className="mt-3">
                    <label className="text-xs text-muted-foreground">Pre-condition</label>
                    <p className="text-xs italic text-warning font-medium">"{step.condition}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: Workflow | null }) {
  if (!record) {
    return <EmptyState title="No Workflow Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 text-primary">Workflow Configuration</h4>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Trigger Type</label>
              <p className="text-sm font-medium capitalize">{record.trigger_type}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Approval Flow</label>
              <p className="text-sm font-medium">{record.requires_approval ? "Requires Human-in-the-loop" : "Direct Execution"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Total Operations</label>
              <p className="text-sm font-medium">{record.steps?.length || 0} stages</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Execution Status</label>
              <div className="mt-1"><PAStatusBadge status={record.execution_status} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Technical Metadata</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Internal UUID</label>
            <p className="text-xs font-mono truncate">{record.id}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tenant Reference</label>
            <p className="text-xs font-mono truncate">{record.tenant_id}</p>
          </div>
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
        <WorkflowIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a workflow from the list to view its details
      </p>
    </div>
  );
}
