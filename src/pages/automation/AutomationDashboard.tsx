import { useState, useEffect } from "react";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Workflow,
  Zap,
  ShieldCheck,
  FileText,
  Play,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
  Loader2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { KPICard } from "@/components/shared";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { AutomationDashboardData } from "@/types/processAutomation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AutomationDashboard() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [data, setData] = useState<AutomationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    loadDashboardData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 30000); // 30s refresh
    }

    return () => clearInterval(interval);
  }, [currentTenant?.id, autoRefresh, timeRange]);

  async function loadDashboardData() {
    setIsRefreshing(true);
    try {
      // timeRange mapping
      const now = new Date();
      let fromDate = new Date();
      if (timeRange === "24h") fromDate.setHours(now.getHours() - 24);
      else if (timeRange === "7d") fromDate.setDate(now.getDate() - 7);
      else if (timeRange === "30d") fromDate.setDate(now.getDate() - 30);
      else if (timeRange === "90d") fromDate.setDate(now.getDate() - 90);

      const dashboardData = await dataProvider.getAutomationDashboardData(
        currentTenant.id,
        { from: fromDate.toISOString(), to: now.toISOString() }
      );
      setData(dashboardData);
    } catch (error) {
      console.error("Dashboard load failed:", error);
      toast.error("Telemetry sync failed");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const tabs = [
    {
      id: "overview",
      label: "Live Monitor",
      content: isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest">Aggregating Automation Telemetry...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="Active Workflows"
              value={data?.kpis.active_workflows || 0}
              icon={Workflow}
              trend="up"
              trendValue="+2"
              subtitle="Running processes"
              variant="primary"
            />
            <KPICard
              title="Active Triggers"
              value={data?.kpis.active_triggers || 0}
              icon={Zap}
              trend="neutral"
              trendValue="Stable"
              subtitle="Event listeners"
              variant="primary"
            />
            <KPICard
              title="Pending Approvals"
              value={data?.kpis.pending_approvals || 0}
              icon={ShieldCheck}
              trend="up"
              trendValue="-1"
              subtitle="Awaiting action"
              variant={data?.kpis.pending_approvals && data.kpis.pending_approvals > 5 ? "warning" : "success"}
            />
            <KPICard
              title="Daily Simulations"
              value={data?.kpis.recent_simulations || 0}
              icon={Play}
              trend="up"
              trendValue="100% Pass"
              subtitle="Test scenarios"
              variant="success"
            />
            <KPICard
              title="Alarm Rules"
              value={data?.kpis.active_alarm_rules || 0}
              icon={Activity}
              trendValue="3 Active"
              subtitle="Monitoring rules"
              variant="primary"
            />
            <KPICard
              title="Audit Events"
              value={data?.kpis.recent_audit_events || 0}
              icon={FileText}
              trend="down"
              trendValue="+142"
              subtitle="24h Activity"
              variant="default"
            />
          </div>

          {/* Main Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Workflow Execution Timeline
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Last 7 Operating Days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.workflow_timeline}>
                    <defs>
                      <linearGradient id="colorExecuted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="executed" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorExecuted)" strokeWidth={2} />
                    <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Approval Cycle Distribution
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Governance state analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.approval_distribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data?.approval_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Audit Event Taxonomy
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">System operation breakdown (24h)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.audit_event_types} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="action" type="category" fontSize={12} width={100} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning" />
                    Trigger Activity Hotspots
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Activation distribution (Last 24h)</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">LIVE STREAM</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.trigger_heatmap.map((item, id) => (
                  <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div>
                      <h5 className="text-sm font-medium">{item.trigger_name}</h5>
                      <span className="text-[10px] text-muted-foreground font-mono">TIME: {item.hour}:00 HRS</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning"
                          style={{ width: `${Math.min(100, (item.activation_count / 15) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono font-medium">{item.activation_count}</span>
                    </div>
                  </div>
                ))}
                {(!data?.trigger_heatmap || data.trigger_heatmap.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">No Trigger Hotspots Detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  return (
    <WorkPane
      title="Automation Command Center"
      subtitle="Real-time control plane telemetry"
      tabs={tabs}
      actions={
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[130px] text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-2 text-xs font-medium", autoRefresh ? "text-primary" : "text-muted-foreground")}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Sync On" : "Sync Off"}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-2 bg-primary hover:bg-primary/90 text-xs font-medium"
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>
      }
    />
  );
}
