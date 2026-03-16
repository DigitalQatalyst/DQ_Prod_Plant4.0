import { useState, useEffect, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  ShieldAlert,
  Zap,
  Workflow,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Eye,
  Check,
  BarChart2,
  PieChart as PieChartIcon,
  Monitor,
  Calendar
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { KPICard } from "@/components/shared";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { AutomationAlert } from "@/types/processAutomation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AutomationAlerts() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AutomationAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search / Sort / Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("created-desc");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadAlerts();
  }, [currentTenant?.id]);

  async function loadAlerts() {
    setIsLoading(true);
    try {
      const data = await dataProvider.getAutomationAlerts(currentTenant.id, {});
      setAlerts(data);
    } catch (error) {
      console.error("Alert load failed:", error);
      toast.error("Alert stream disconnected");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcknowledge(id: string) {
    setIsProcessing(true);
    try {
      const updated = await dataProvider.acknowledgeAutomationAlert(id, "system-user");
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
      setSelectedAlert(updated);
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleResolve(id: string) {
    setIsProcessing(true);
    try {
      const updated = await dataProvider.resolveAutomationAlert(id, "system-user");
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
      setSelectedAlert(updated);
      toast.success("Threat cleared");
    } catch (error) {
      toast.error("Resolution failed");
    } finally {
      setIsProcessing(false);
    }
  }

  // Unique alert types for the filter dropdown
  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map(a => a.alert_type));
    return Array.from(types).sort();
  }, [alerts]);

  // Client-side filter + sort
  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter(alert => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          alert.title.toLowerCase().includes(q) ||
          alert.message.toLowerCase().includes(q) ||
          alert.alert_type.toLowerCase().includes(q) ||
          alert.severity.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (statusFilter !== "all" && alert.status !== statusFilter) return false;
      if (alertTypeFilter !== "all" && alert.alert_type !== alertTypeFilter) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "severity-asc":
          return a.severity.localeCompare(b.severity);
        case "severity-desc":
          return b.severity.localeCompare(a.severity);
        case "status-asc":
          return a.status.localeCompare(b.status);
        case "status-desc":
          return b.status.localeCompare(a.status);
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [alerts, searchQuery, sortBy, severityFilter, statusFilter, alertTypeFilter]);

  const tabs = selectedAlert
    ? [
      {
        id: "overview",
        label: "Incident Overview",
        content: <AlertDetail alert={selectedAlert} onAcknowledge={handleAcknowledge} onResolve={handleResolve} isProcessing={isProcessing} />,
      },
      {
        id: "metadata",
        label: "Event Payload",
        content: <MetadataTab alert={selectedAlert} />,
      },
    ]
    : [
      {
        id: "dashboard",
        label: "Alerts Overview",
        content: <AlertsOverview alerts={filteredAlerts} onSelect={setSelectedAlert} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Automation Alerts"
        subtitle="Real-time threat monitoring"
        count={filteredAlerts.length}
        searchPlaceholder="Search alerts..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "created-desc", label: "Newest First" },
          { value: "created-asc", label: "Oldest First" },
          { value: "severity-desc", label: "Severity (High → Low)" },
          { value: "severity-asc", label: "Severity (Low → High)" },
          { value: "status-asc", label: "Status (A-Z)" },
          { value: "status-desc", label: "Status (Z-A)" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            key: "severity",
            label: "Severity",
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [
              { value: "all", label: "All Severities" },
              { value: "critical", label: "Critical" },
              { value: "alarm", label: "Alarm" },
              { value: "warning", label: "Warning" },
              { value: "info", label: "Info" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "resolved", label: "Resolved" },
            ],
          },
          {
            key: "alertType",
            label: "Alert Type",
            value: alertTypeFilter,
            onChange: setAlertTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...alertTypes.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })),
            ],
          },
        ]}
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAlerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              isSelected={selectedAlert?.id === alert.id}
              onClick={() => setSelectedAlert(alert)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedAlert ? `${selectedAlert.severity.charAt(0).toUpperCase() + selectedAlert.severity.slice(1)} Alert` : "Alerts Overview"}
        subtitle={selectedAlert ? selectedAlert.title : "System health monitoring and incident response"}
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function AlertListItem({ alert, isSelected, onClick }: { alert: AutomationAlert; isSelected: boolean; onClick: () => void }) {
  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
      case 'alarm': return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' };
      case 'warning': return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' };
      default: return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
    }
  };

  const getStatusIcon = () => {
    switch (alert.status) {
      case 'active': return <AlertCircle className="w-4 h-4" />;
      case 'acknowledged': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const styles = getSeverityStyles();

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
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", styles.bg, styles.border)}>
          <div className={styles.text}>
            {getStatusIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium truncate">{alert.title}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {alert.message}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-background/50 text-muted-foreground">
              {alert.alert_type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertDetail({ alert, onAcknowledge, onResolve, isProcessing }: {
  alert: AutomationAlert | null,
  onAcknowledge: (id: string) => void,
  onResolve: (id: string) => void,
  isProcessing: boolean
}) {
  if (!alert) return <EmptyWorkPaneState />;

  const getSourceIcon = () => {
    switch (alert.source_entity_type) {
      case 'workflow': return <Workflow className="w-8 h-8 text-primary" />;
      case 'trigger': return <Zap className="w-8 h-8 text-orange-500" />;
      case 'version': return <ShieldCheck className="w-8 h-8 text-blue-500" />;
      default: return <Activity className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {getSourceIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold truncate">{alert.title}</h3>
              <Badge variant="outline" className={cn(
                "capitalize",
                alert.severity === 'critical' ? "border-red-500 text-red-500 bg-red-500/10" :
                  alert.severity === 'alarm' ? "border-orange-500 text-orange-500 bg-orange-500/10" :
                    alert.severity === 'warning' ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                      "border-blue-500 text-blue-500 bg-blue-500/10"
              )}>
                {alert.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{alert.message}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(alert.created_at).toLocaleString()}
              </span>
              <span>·</span>
              <span className="capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {alert.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge(alert.id)}
                disabled={isProcessing}
              >
                Acknowledge
              </Button>
            )}
            {alert.status !== 'resolved' && (
              <Button
                size="sm"
                variant="default"
                className={cn(alert.status === 'active' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}
                onClick={() => onResolve(alert.id)}
                disabled={isProcessing}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Incident Details</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Status" value={alert.status} className="capitalize" />
            <InfoRow label="Source" value={alert.source_entity_type || 'System'} className="capitalize" />
            <InfoRow label="ID" value={alert.id} className="font-mono text-xs" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Response History</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {alert.acknowledged_at ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Acknowledged</span>
                <div className="text-right">
                  <p className="font-medium">{new Date(alert.acknowledged_at).toLocaleTimeString()}</p>
                  <p className="text-xs text-muted-foreground">by {alert.acknowledged_by}</p>
                </div>
              </div>
            ) : (
              <InfoRow label="Acknowledged" value="Pending" />
            )}
            {alert.resolved_at ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Resolved</span>
                <div className="text-right">
                  <p className="font-medium">{new Date(alert.resolved_at).toLocaleTimeString()}</p>
                  <p className="text-xs text-muted-foreground">by {alert.resolved_by}</p>
                </div>
              </div>
            ) : (
              <InfoRow label="Resolved" value="Pending" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string, value: string, className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", className)}>{value}</span>
    </div>
  );
}

function MetadataTab({ alert }: { alert: AutomationAlert | null }) {
  if (!alert) return <EmptyWorkPaneState />;
  return (
    <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 px-6 py-4 border-b flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Telemetry Metadata</span>
        <Badge variant="outline" className="text-[9px] font-mono opacity-50 px-2">STRUCT_V1</Badge>
      </div>
      <pre className="p-8 text-[11px] font-mono overflow-auto max-h-[600px] bg-black/5 leading-relaxed text-blue-400 dark:text-blue-300">
        {JSON.stringify(alert.metadata || {}, null, 2)}
      </pre>
    </div>
  );
}

function EmptyWorkPaneState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 animate-pulse">
        <ShieldAlert className="w-10 h-10 text-muted-foreground/30" />
      </div>
      <h3 className="text-xl font-black tracking-tighter mb-2 uppercase">Analysis Engine Ready</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed px-4 text-center">
        Select an active incident from the monitoring stream to perform forensic analysis, view telemetry metadata, and execute response actions.
      </p>
    </div>
  );
}

function AlertsOverview({ alerts, onSelect }: { alerts: AutomationAlert[]; onSelect: (alert: AutomationAlert) => void }) {
  // Calculate statistics
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  // Prepare chart data
  const severityData = [
    { name: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: '#ef4444' },
    { name: 'High', value: alerts.filter(a => a.severity === 'alarm').length, color: '#f97316' },
    { name: 'Medium', value: alerts.filter(a => a.severity === 'warning').length, color: '#eab308' },
    { name: 'Low', value: alerts.filter(a => a.severity === 'info').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const typeData = Object.entries(
    alerts.reduce((acc, alert) => {
      const type = alert.alert_type.replace('_', ' ');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const recentAlerts = [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Alerts"
          value={stats.total}
          subtitle="All detected incidents"
          icon={AlertCircle}
          variant="primary"
        />
        <KPICard
          title="Active Incidents"
          value={stats.active}
          subtitle="Requires attention"
          icon={Activity}
          variant={stats.active > 0 ? "destructive" : "success"}
          trend={stats.active > 0 ? "up" : "neutral"}
          trendValue={stats.active > 0 ? "High Priority" : "Stable"}
        />
        <KPICard
          title="Critical Threats"
          value={stats.critical}
          subtitle="Severity: Critical"
          icon={ShieldAlert}
          variant="destructive"
        />
        <KPICard
          title="Resolution Rate"
          value={`${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%`}
          subtitle="Incidents resolved"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Severity Distribution
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Top Alert Types
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Alerts
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Severity</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Time</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No alerts found
                  </td>
                </tr>
              ) : (
                recentAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => onSelect(alert)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <Badge variant="outline" className={cn(
                        "uppercase text-[10px] font-black tracking-widest",
                        alert.severity === 'critical' ? "border-red-500 text-red-500 bg-red-500/10" :
                          alert.severity === 'alarm' ? "border-orange-500 text-orange-500 bg-orange-500/10" :
                            alert.severity === 'warning' ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                              "border-blue-500 text-blue-500 bg-blue-500/10"
                      )}>
                        {alert.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-sm truncate max-w-[200px]">{alert.title}</div>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground capitalize">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        {alert.status === 'acknowledged' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                        {alert.status === 'resolved' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        <span className="text-xs font-medium capitalize">{alert.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-10">
      <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center mb-4 text-muted-foreground/30">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <p className="text-sm font-black uppercase tracking-widest mb-1 text-foreground">No Threats Detected</p>
      <p className="text-xs text-muted-foreground leading-relaxed text-center">The automation stream is currently stable. No active alerts match your filters.</p>
    </div>
  );
}
