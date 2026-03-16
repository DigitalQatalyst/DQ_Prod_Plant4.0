import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, CheckCircle2, Clock, XCircle, Loader2, Target, Settings, Zap, History, Database, Activity } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { Simulation } from "@/types/processAutomation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SimulationPage() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("created-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, [currentTenant?.id, dataProvider]);

  async function loadSimulations() {
    setIsLoading(true);
    try {
      const data = await dataProvider.getSimulations(currentTenant.id);
      setSimulations(data);
    } catch (error) {
      console.error("Failed to load simulations:", error);
      toast.error("Failed to load simulations");
    } finally {
      setIsLoading(false);
    }
  }

  const handleStart = async () => {
    if (!selectedSimulation) return;
    setIsExecuting(true);
    try {
      toast.info("Initializing simulation environment...");
      const updated = await dataProvider.startSimulation(selectedSimulation.id);
      setSelectedSimulation(updated);
      setSimulations(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success("Simulation started");
      // Optionally switch to report tab
      // setActiveTab("report") - if we had a way to set it
    } catch (error) {
      toast.error("Failed to start simulation");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedSimulation) return;
    setIsExecuting(true);
    try {
      toast.info("Running full simulation sequence...");
      const updated = await dataProvider.executeSimulation(selectedSimulation.id);
      setSelectedSimulation(updated);
      setSimulations(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success("Simulation sequence completed");
    } catch (error) {
      toast.error("Simulation execution failed");
    } finally {
      setIsExecuting(false);
    }
  };


  // Get unique simulation types for filter
  const simulationTypes = useMemo(() => {
    const types = new Set(simulations.map(s => s.simulation_type));
    return Array.from(types).sort();
  }, [simulations]);

  // Filter and sort simulations
  const filteredSimulations = useMemo(() => {
    let filtered = simulations.filter((sim) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          sim.simulation_type.toLowerCase().includes(search) ||
          (sim.expected_outcome || "").toLowerCase().includes(search) ||
          (sim.target_id || "").toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && sim.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && sim.simulation_type !== typeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "type-asc":
          return a.simulation_type.localeCompare(b.simulation_type);
        case "type-desc":
          return b.simulation_type.localeCompare(a.simulation_type);
        case "duration-asc":
          return (a.duration_seconds || 0) - (b.duration_seconds || 0);
        case "duration-desc":
          return (b.duration_seconds || 0) - (a.duration_seconds || 0);
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [simulations, searchQuery, sortBy, statusFilter, typeFilter]);

  const [activeTab, setActiveTab] = useState("overview");

  const tabs = selectedSimulation
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab
          simulation={selectedSimulation}
          onStart={handleStart}
          onExecute={handleExecute}
          isExecuting={isExecuting}
          onShowReport={() => setActiveTab("report")}
        />,
      },
      {
        id: "parameters",
        label: "Parameters",
        content: <ParametersTab simulation={selectedSimulation} />,
      },
      {
        id: "raw",
        label: "Manifest",
        content: <JsonTab simulation={selectedSimulation} />,
      },
      {
        id: "report",
        label: "Report",
        content: <ReportTab simulation={selectedSimulation} />,
      },
    ]

    : [
      {
        id: "overview",
        label: "Simulations Overview",
        content: <SimulationsOverview simulations={filteredSimulations} setSelectedSimulation={setSelectedSimulation} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Simulations"
        subtitle="Virtual testing facility"
        count={filteredSimulations.length}
        searchPlaceholder="Search simulations..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "type-asc", label: "Type (A-Z)" },
          { value: "type-desc", label: "Type (Z-A)" },
          { value: "duration-asc", label: "Shortest Duration" },
          { value: "duration-desc", label: "Longest Duration" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
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
              { value: "not_started", label: "Not Started" },
              { value: "pending", label: "Pending" },
              { value: "running", label: "Running" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },

            ],
          },
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...simulationTypes.map(type => ({ value: type, label: type.toUpperCase() })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            New Simulation
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Warming Engines...</p>
          </div>
        ) : filteredSimulations.length === 0 ? (
          <EmptyState />
        ) : (
          filteredSimulations.map((simulation) => (
            <SimulationListItem
              key={simulation.id}
              simulation={simulation}
              isSelected={selectedSimulation?.id === simulation.id}
              onClick={() => setSelectedSimulation(simulation)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedSimulation ? `${selectedSimulation.simulation_type.toUpperCase()} TEST` : "Simulations"}
        subtitle={selectedSimulation ? `Ref: ${selectedSimulation.id.slice(0, 8)}` : "Select a simulation to monitor"}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="rounded-lg border bg-background shadow-sm"
      />

    </div>
  );
}

function SimulationListItem({ simulation, isSelected, onClick }: { simulation: Simulation; isSelected: boolean; onClick: () => void }) {
  const getStatusColor = () => {
    switch (simulation.status) {
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "running": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "not_started":
      case "pending": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  const statusLabel = simulation.status === 'not_started' ? 'Not Started' : simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1);


  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-2",
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium capitalize truncate">{simulation.simulation_type}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-normal", getStatusColor())}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground break-words mb-2 line-clamp-2">
            Target: {simulation.target_id}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationsOverview({
  simulations,
  setSelectedSimulation,
}: {
  simulations: Simulation[];
  setSelectedSimulation: (simulation: Simulation) => void;
}) {
  const stats = useMemo(() => {
    const totalSimulations = simulations.length;
    const completed = simulations.filter(s => s.status === 'completed').length;
    const running = simulations.filter(s => s.status === 'running').length;
    const recentRuns = simulations.filter(s => {
      const daysSinceCreation = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    }).length;

    return { totalSimulations, completed, running, recentRuns };
  }, [simulations]);

  const recentSimulations = useMemo(() => {
    return simulations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [simulations]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    simulations.forEach(s => counts[s.simulation_type] = (counts[s.simulation_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }))
      .sort((a, b) => b.value - a.value);
  }, [simulations]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    simulations.forEach(s => counts[s.status] = (counts[s.status] || 0) + 1);
    const statusColors: Record<string, string> = { completed: '#22c55e', failed: '#ef4444', running: '#3b82f6', pending: '#eab308' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || '#94a3b8'
      }));
  }, [simulations]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Simulations"
          value={stats.totalSimulations.toString()}
          subtitle="All test scenarios"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="Completed"
          value={stats.completed.toString()}
          subtitle="Successfully finished"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.completed / stats.totalSimulations) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Running"
          value={stats.running.toString()}
          subtitle="Currently executing"
          icon={Play}
          variant="primary"
        />
        <KPICard
          title="Recent Runs"
          value={stats.recentRuns.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Simulation Types</h3>
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

      {/* Recent Simulations Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Simulations</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Target</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Duration</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSimulations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No simulations found
                  </td>
                </tr>
              ) : (
                recentSimulations.map((sim) => (
                  <tr
                    key={sim.id}
                    onClick={() => setSelectedSimulation(sim)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium uppercase">{sim.simulation_type}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {sim.target_id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[9px] h-4 uppercase font-black">
                        {sim.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sim.duration_seconds ? `${sim.duration_seconds}s` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(sim.created_at).toLocaleDateString()}
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
  simulation,
  onStart,
  onExecute,
  isExecuting,
  onShowReport
}: {
  simulation: Simulation | null;
  onStart: () => void;
  onExecute: () => void;
  isExecuting: boolean;
  onShowReport: () => void;
}) {
  if (!simulation) return <EmptyWorkPaneState />;

  const isCompleted = simulation.status === 'completed';
  const isRunning = simulation.status === 'running';
  const isNotStarted = simulation.status === 'not_started' || simulation.status === 'pending';

  const formatTime = (ts?: string) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not recorded';
  const formatDate = (ts?: string) => ts ? new Date(ts).toLocaleDateString() : 'Not recorded';


  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold capitalize">{simulation.simulation_type} Simulation</h3>
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-black px-2 py-0.5",
                simulation.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  simulation.status === 'failed' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    simulation.status === 'running' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              )}>
                {simulation.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {simulation.expected_outcome || 'No explicit outcome defined.'}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(simulation.created_at).toLocaleDateString()}
              </span>
              {simulation.duration_seconds && (
                <><span>·</span><span>{simulation.duration_seconds}s duration</span></>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isNotStarted && (
              <Button onClick={onStart} disabled={isExecuting} size="sm" className="w-full">
                {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Simulation
              </Button>
            )}
            {isRunning && (
              <Button onClick={() => onShowReport()} variant="outline" size="sm" className="w-full">
                <Activity className="w-4 h-4 mr-2" />
                View Live Report
              </Button>
            )}
            {isCompleted && (
              <Button onClick={onShowReport} size="sm" className="w-full">
                <History className="w-4 h-4 mr-2" />
                Show Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Simulation Details</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm">
            <InfoRow label="Type" value={simulation.simulation_type} />
            <InfoRow label="Target ID" value={simulation.target_id || 'N/A'} />
            <InfoRow label="Parameters" value={`${Object.keys(simulation.input_parameters || {}).length} Defined`} />
            <InfoRow label="Duration" value={simulation.duration_seconds ? `${simulation.duration_seconds}s` : 'Not recorded'} />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Execution</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm">
            <InfoRow label="Status" value={simulation.status.replace('_', ' ')} />
            <InfoRow label="Started" value={simulation.started_at ? `${new Date(simulation.started_at).toLocaleDateString()} ${new Date(simulation.started_at).toLocaleTimeString()}` : 'Not recorded'} />
            <InfoRow label="Completed" value={simulation.completed_at ? `${new Date(simulation.completed_at).toLocaleDateString()} ${new Date(simulation.completed_at).toLocaleTimeString()}` : 'Not recorded'} />
          </div>
        </div>
      </div>


      {isCompleted && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Observed Outcome</h4>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed font-medium">
              {simulation.observed_outcome || simulation.actual_outcome || 'No outcome recorded.'}
            </p>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Live Performance Trends
            </h4>
            <span className="text-[10px] text-blue-500 animate-pulse font-black uppercase tracking-widest">Live Updates</span>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 h-[180px]">
            <MiniTrendChart />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniTrendChart() {
  const data = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    t: i,
    v: 50 + Math.sin(i / 2) * 20 + Math.random() * 10
  })), []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar dataKey="v" fill="hsl(var(--primary))" opacity={0.6} radius={[2, 2, 0, 0]} />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          labelStyle={{ display: 'none' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ReportTab({ simulation }: { simulation: Simulation }) {
  const isCompleted = simulation.status === 'completed';
  const isRunning = simulation.status === 'running';
  const isNotStarted = simulation.status === 'not_started' || simulation.status === 'pending';

  if (isNotStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold">Report Not Generated</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2">
          Start the simulation to generate a performance report and optimization audit.
        </p>
      </div>
    );
  }

  // Placeholder report data if not present
  const report = simulation.report || {
    summary: [
      { label: 'Optimizations Analyzed', value: '42' },
      { label: 'Peak Capacity Delta', value: '+18.4%' },
      { label: 'Risk Score', value: 'Low' },
      { label: 'Confidence', value: '94%' }
    ],
    optimizations: [
      { title: 'Dynamic Load Rebalancing', before: 'Unbalanced', after: 'Optimized', impact: 'High', confidence: 0.92 },
      { title: 'Voltage Profile Flattening', before: '1.02pu - 0.98pu', after: '1.00pu - 1.00pu', impact: 'Medium', confidence: 0.88 },
      { title: 'Reactive Support Allocation', before: 'Centralized', after: 'Distributed', impact: 'High', confidence: 0.95 }
    ],
    charts: [
      {
        metric: 'Grid Stability Index',
        points: Array.from({ length: 20 }, (_, i) => ({ t: `${i * 5}m`, v: 0.85 + Math.random() * 0.1 }))
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {report.summary?.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Metrics Visualization
        </h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.charts?.[0].points}>
              <XAxis dataKey="t" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="v" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} >
                {report.charts?.[0].points.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.3 + (index / 20) * 0.7})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Optimization Log & Recommendations</h4>
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Optimization</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Before</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">After</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Impact</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.optimizations?.map((opt, i) => (
                <tr key={i} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{opt.title}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{opt.before || '—'}</td>
                  <td className="px-4 py-3 text-primary font-mono text-xs font-bold">{opt.after || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] uppercase font-black bg-primary/5">
                      {opt.impact}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{(opt.confidence! * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



function SimulationParameterValue({ label, value }: { label: string, value: any }) {
  const isComplex = typeof value === 'object' && value !== null;

  return (
    <div className={cn("py-3 border-b border-dashed last:border-0", isComplex ? "block" : "flex justify-between items-center")}>
      <span className="text-xs font-bold text-muted-foreground uppercase">{label.replace(/_/g, ' ')}</span>
      {isComplex ? (
        <pre className="text-xs font-mono bg-accent/50 p-2 rounded text-primary mt-2 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <span className="text-xs font-mono bg-accent/50 px-2 py-1 rounded text-primary block max-w-[60%] truncate" title={String(value)}>
          {String(value)}
        </span>
      )}
    </div>
  );
}

function ParametersTab({ simulation }: { simulation: Simulation | null }) {
  if (!simulation) return <EmptyWorkPaneState />;

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
          <Settings className="w-4 h-4" />
          Input Configuration
        </h4>
        <div className="space-y-2">
          {Object.entries(simulation.input_parameters).map(([key, value]) => (
            <SimulationParameterValue key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JsonTab({ simulation }: { simulation: Simulation | null }) {
  if (!simulation) return <EmptyWorkPaneState />;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 px-4 py-3 border-b">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Database className="w-3 h-3" />
          Simulation Manifest
        </span>
      </div>
      <pre className="p-6 text-[11px] font-mono overflow-auto max-h-[600px] bg-black/20 leading-relaxed text-blue-400/80">
        {JSON.stringify(simulation, null, 2)}
      </pre>
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

function EmptyWorkPaneState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Simulation Selected</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a simulation from the list to view its details and results.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Simulations Found</h3>
      <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">No simulation scenarios have been defined for this environment.</p>
    </div>
  );
}
