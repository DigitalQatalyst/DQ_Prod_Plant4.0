import { useState, useEffect, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, FileEdit, Trash2, Play, User, Activity, Monitor, ShieldCheck, Download, Loader2, XCircle } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { AuditLog } from "@/types/processAutomation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AuditLogsPage() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("created-desc");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [currentTenant?.id, dataProvider]);

  async function loadLogs() {
    setIsLoading(true);
    try {
      const data = await dataProvider.getAuditLogs(currentTenant.id);
      setLogs(data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Cloud sync failed for audit logs");
    } finally {
      setIsLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      const blob = await dataProvider.exportAuditLogs(currentTenant.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${currentTenant.id}-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Audit manifest exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  // Get unique event and record types for filters
  const eventTypes = useMemo(() => {
    const types = new Set(logs.map(l => l.event_type));
    return Array.from(types).sort();
  }, [logs]);

  const recordTypes = useMemo(() => {
    const types = new Set(logs.map(l => l.record_type));
    return Array.from(types).sort();
  }, [logs]);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          log.user_name.toLowerCase().includes(search) ||
          log.record_type.toLowerCase().includes(search) ||
          log.event_type.toLowerCase().includes(search) ||
          log.record_id.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Event Type filter
      if (eventTypeFilter !== "all" && log.event_type !== eventTypeFilter) return false;

      // Record Type filter
      if (recordTypeFilter !== "all" && log.record_type !== recordTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "user-asc":
          return a.user_name.localeCompare(b.user_name);
        case "user-desc":
          return b.user_name.localeCompare(a.user_name);
        case "event-asc":
          return a.event_type.localeCompare(b.event_type);
        case "event-desc":
          return b.event_type.localeCompare(a.event_type);
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [logs, searchQuery, sortBy, eventTypeFilter, recordTypeFilter]);

  const tabs = selectedLog
    ? [
      {
        id: "overview",
        label: "Log Details",
        content: <OverviewTab log={selectedLog} />,
      },
      {
        id: "diff",
        label: "Delta Analysis",
        content: <DiffTab log={selectedLog} />,
      },
      {
        id: "raw",
        label: "System Trail",
        content: <JsonTab log={selectedLog} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Audit Overview",
        content: <AuditLogsOverview logs={filteredLogs} setSelectedLog={setSelectedLog} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Audit Logs"
        subtitle="Forensic security trail"
        count={filteredLogs.length}
        searchPlaceholder="Search audit logs..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "user-asc", label: "User (A-Z)" },
          { value: "user-desc", label: "User (Z-A)" },
          { value: "event-asc", label: "Event (A-Z)" },
          { value: "event-desc", label: "Event (Z-A)" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            key: "event",
            label: "Event Type",
            value: eventTypeFilter,
            onChange: setEventTypeFilter,
            options: [
              { value: "all", label: "All Events" },
              ...eventTypes.map(type => ({ value: type, label: type.toUpperCase() })),
            ],
          },
          {
            key: "record",
            label: "Record Type",
            value: recordTypeFilter,
            onChange: setRecordTypeFilter,
            options: [
              { value: "all", label: "All Records" },
              ...recordTypes.map(type => ({ value: type, label: type.toUpperCase() })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV Manifest
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Parsing Trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState />
        ) : (
          filteredLogs.map((log) => (
            <AuditLogListItem
              key={log.id}
              log={log}
              isSelected={selectedLog?.id === log.id}
              onClick={() => setSelectedLog(log)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedLog ? `${selectedLog.event_type.toUpperCase()} EVENT` : "Audit Trail"}
        subtitle={selectedLog ? `Sequence No: ${selectedLog.id.slice(0, 12)}` : "Select an entry for forensic review"}
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function AuditLogListItem({ log, isSelected, onClick }: { log: AuditLog; isSelected: boolean; onClick: () => void }) {
  const getEventIcon = () => {
    switch (log.event_type) {
      case "create": return <Plus className="w-4 h-4 text-primary" />;
      case "update": return <FileEdit className="w-4 h-4 text-yellow-500" />;
      case "delete": return <Trash2 className="w-4 h-4 text-red-500" />;
      case "execute": return <Play className="w-4 h-4 text-green-500" />;
      case "approve": return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case "reject": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

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
          {getEventIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium capitalize">{log.event_type}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">
            {log.record_type} · {log.user_name}
          </p>
          <div className="flex items-center justify-between mt-2">
            <code className="text-[10px] text-muted-foreground bg-secondary px-1 py-0.5 rounded">
              {log.record_id.slice(0, 8)}
            </code>
            <span className="text-[10px] text-muted-foreground">
              {new Date(log.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogsOverview({
  logs,
  setSelectedLog,
}: {
  logs: AuditLog[];
  setSelectedLog: (log: AuditLog) => void;
}) {
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const errors = logs.filter(l => l.event_type === 'error' || l.event_type === 'delete' || l.event_type === 'reject').length;
    const uniqueUsers = new Set(logs.map(l => l.user_name)).size;
    const recentActivity = logs.filter(l => {
      const days = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 1;
    }).length;
    return { totalLogs, errors, uniqueUsers, recentActivity };
  }, [logs]);

  const recentLogs = useMemo(() => {
    return logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [logs]);

  const eventTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => counts[l.event_type] = (counts[l.event_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const recordTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => counts[l.record_type] = (counts[l.record_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Events"
          value={stats.totalLogs.toString()}
          subtitle="Recorded actions"
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Critical Actions"
          value={stats.errors.toString()}
          subtitle="Deletions & Rejections"
          icon={ShieldCheck}
          variant="destructive"
        />
        <KPICard
          title="Active Users"
          value={stats.uniqueUsers.toString()}
          subtitle="Unique identities"
          icon={User}
          variant="default"
        />
        <KPICard
          title="24h Activity"
          value={stats.recentActivity.toString()}
          subtitle="Events today"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Event Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData}>
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
          <h3 className="text-sm font-semibold mb-4">Top Record Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recordTypeData} layout="vertical">
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Audit Entries</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Event</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Record Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold uppercase">{log.event_type}</td>
                    <td className="px-4 py-3 text-sm">{log.record_type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.user_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
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

function OverviewTab({ log }: { log: AuditLog | null }) {
  if (!log) return <EmptyWorkPaneState />;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold capitalize">{log.event_type} Event</h3>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-normal",
                log.event_type === 'delete' || log.event_type === 'reject' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  log.event_type === 'create' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    log.event_type === 'approve' || log.event_type === 'execute' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                      "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              )}>
                {log.event_type.charAt(0).toUpperCase() + log.event_type.slice(1)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {log.record_type} · by {log.user_name}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" />
                {log.user_ip || 'Internal System'}
              </span>
              <span>·</span>
              <span>{new Date(log.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Event Details</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Operation" value={log.event_type} />
            <InfoRow label="Entity Class" value={log.record_type} />
            <InfoRow label="Entity ID" value={log.record_id.slice(0, 16) + '...'} />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Identity</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="User" value={log.user_name} />
            <InfoRow label="Source IP" value={log.user_ip || 'Internal'} />
            <InfoRow label="Timestamp" value={new Date(log.created_at).toLocaleString()} />
          </div>
        </div>
      </div>

      {log.execution_result && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Execution Result</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground font-mono">{log.execution_result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DiffTab({ log }: { log: AuditLog | null }) {
  if (!log) return <EmptyWorkPaneState />;

  if (!log.changes_before && !log.changes_after) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-10">
        <FileText className="w-12 h-12 text-muted-foreground/20 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">No Delta Snapshot</p>
        <p className="text-[11px] text-muted-foreground text-center">This operation did not modify state or captured no differential context.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 px-1">Baseline (Before)</h4>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 overflow-auto max-h-[400px]">
            <pre className="text-[10px] font-mono text-red-700 dark:text-red-400">
              {JSON.stringify(log.changes_before || {}, null, 2)}
            </pre>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500 px-1">Revision (After)</h4>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 overflow-auto max-h-[400px]">
            <pre className="text-[10px] font-mono text-green-700 dark:text-green-400">
              {JSON.stringify(log.changes_after || {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function JsonTab({ log }: { log: AuditLog | null }) {
  if (!log) return <EmptyWorkPaneState />;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 px-4 py-3 border-b flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forensic Trail Data</span>
        <Badge variant="outline" className="text-[9px] font-mono opacity-50">{log.id}</Badge>
      </div>
      <pre className="p-6 text-[11px] font-mono overflow-auto max-h-[600px] bg-black/20 leading-relaxed text-blue-400/80">
        {JSON.stringify(log, null, 2)}
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
        <Activity className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Log Selected</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select an audit log entry to view its details.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Clean Audit Trail</h3>
      <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">No audit log entries found for this scope.</p>
    </div>
  );
}
