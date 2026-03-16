import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Settings,
  Activity,
  Calendar,
  AlertCircle,
  Lock,
  Unlock,
  Timer,
  User,
  ShieldCheck,
  Server,
  Terminal,
  Fingerprint,
  Command,
  Search,
  Key,
  Database,
  Eye,
  ArrowRight,
  Globe
} from "lucide-react";
import { PrivilegedAccessSession } from "@/types/security";
import { getPrivilegedAccessSessions } from "@/lib/securityQueries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import {
  IdentityGovernanceMetrics,
  EnforcementHeatmap,
  SecurityMix,
  GovernanceTimeline,
  DetailPropertyRow,
  StatusLifecycle,
  TagBadgeList,
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivilegedAccessControls() {
  const { currentTenant } = useApp();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sessions, setSessions] = useState<PrivilegedAccessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load privileged access sessions
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPrivilegedAccessSessions(currentTenant?.id || "");
        setSessions(data);
      } catch (err) {
        console.error('Failed to load privileged access sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [currentTenant?.id]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessions];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (session) =>
          session.requestedBy.toLowerCase().includes(query) ||
          session.targetResourceType.toLowerCase().includes(query) ||
          session.targetResourceId.toLowerCase().includes(query) ||
          session.sessionType.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((session) => session.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "resource") return a.targetResourceType.localeCompare(b.targetResourceType);
      if (sortBy === "requestor") return a.requestedBy.localeCompare(b.requestedBy);
      return 0;
    });

    return result;
  }, [sessions, searchTerm, statusFilter, sortBy]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const tabs = selectedSession
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <SessionOverview session={selectedSession} />,
      },
      {
        id: "activity",
        label: "Session Activity",
        content: <SessionActivity session={selectedSession} />,
      },
      {
        id: "approval",
        label: "Approval Audit",
        content: <SessionApproval session={selectedSession} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <PrivilegedAccessOverview sessions={sessions} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Loading privileged access controls..." />;
  }

  return (
    <>
      <ListPane
        title="Privileged Access"
        context="DEWA – Transmission"
        count={filteredAndSortedSessions.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "denied", label: "Denied" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Date (Newest)", value: "date" },
          { label: "Resource Type", value: "resource" },
          { label: "Requestor", value: "requestor" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedSessions.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Sessions Found"
              description="No privileged access sessions match your current filters"
            />
          ) : (
            filteredAndSortedSessions.map((session) => (
              <ListPaneItem
                key={session.id}
                title={session.targetResourceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                description={session.targetResourceId}
                status={session.status === 'active' ? 'online' : (session.status === 'pending' ? 'pending' : (session.status === 'completed' ? 'online' : 'offline'))}
                category={session.requestedBy.split('@')[0]}
                value={session.isEmergency ? 'EMERGENCY' : new Date(session.createdAt).toLocaleDateString()}
                isSelected={selectedSessionId === session.id}
                onClick={() => setSelectedSessionId(session.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedSession ? `PAM Session: ${selectedSession.id.split('-').pop()}` : "Privileged Access Management"}
        subtitle={
          selectedSession
            ? `${selectedSession.sessionType.replace(/-/g, ' ')} • Authorized by ${selectedSession.approvedBy || 'Pending'}`
            : `Governance and oversight for mission-critical grid operations at ${currentTenant.name}`
        }
        tabs={tabs}
      />
    </>
  );
}

function PrivilegedAccessOverview({ sessions }: { sessions: PrivilegedAccessSession[] }) {
  const overviewMetrics = [
    {
      title: "Active Sessions",
      value: sessions.filter(s => s.status === 'active').length,
      subtitle: "Currently elevated",
      icon: Unlock,
      variant: "success" as any
    },
    {
      title: "Pending Requests",
      value: sessions.filter(s => s.status === 'pending').length,
      subtitle: "Awaiting approval",
      icon: Clock,
      variant: sessions.some(s => s.status === 'pending') ? "warning" : "success" as any
    },
    {
      title: "Emergencies",
      value: sessions.filter(s => s.isEmergency).length,
      subtitle: "Priority cases",
      icon: AlertTriangle,
      variant: sessions.some(s => s.isEmergency) ? "destructive" : "success" as any
    },
    {
      title: "Approval Rate",
      value: sessions.length > 0 ? `${Math.round((sessions.filter(s => s.status !== 'denied').length / sessions.length) * 100)}%` : "0%",
      subtitle: `${sessions.length} total requests`,
      icon: CheckCircle2,
      variant: "primary" as any
    }
  ];

  const sessionMixData = [
    { name: "Emergency", value: sessions.filter(s => s.sessionType === 'emergency-access').length, color: "hsl(var(--destructive))" },
    { name: "Maintenance", value: sessions.filter(s => s.sessionType === 'scheduled-maintenance').length, color: "hsl(var(--primary))" },
    { name: "Vendor", value: sessions.filter(s => s.sessionType === 'vendor-support').length, color: "hsl(var(--warning))" },
    { name: "Critical Ops", value: sessions.filter(s => s.sessionType === 'critical-operation').length, color: "hsl(var(--success))" },
  ];

  const infrastructureData = [
    { name: "Relays", value: sessions.filter(s => s.targetResourceType === 'protection-relay').length, total: sessions.length, color: "hsl(var(--primary))" },
    { name: "SCADA", value: sessions.filter(s => s.targetResourceType === 'scada-node').length, total: sessions.length, color: "hsl(var(--success))" },
    { name: "Network", value: sessions.filter(s => s.targetResourceType === 'network-switch').length, total: sessions.length, color: "hsl(var(--warning))" },
  ];

  const timelineData = [
    { date: "09:00", count: 4 },
    { date: "11:00", count: 7 },
    { date: "13:00", count: 12 },
    { date: "15:00", count: 9 },
    { date: "17:00", count: 5 },
    { date: "19:00", count: 3 },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8">
      <IdentityGovernanceMetrics
        title="PAM Governance"
        description="Zero-trust oversight for high-impact grid infrastructure and transmission control systems"
        metrics={overviewMetrics}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnforcementHeatmap
            title="Targeted Infrastructure"
            description="Elevation distribution across critical asset classes"
            data={infrastructureData}
          />
          <SecurityMix
            title="Session Distribution"
            data={sessionMixData}
          />
          <GovernanceTimeline
            title="Elevation Velocity"
            data={timelineData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Oversight Priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Just-In-Time Access", desc: "Reducing permanent high-privilege exposure.", icon: Lock },
                  { title: "Grid Stabilization", desc: "Fast-track emergency access workflows.", icon: Zap },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-semibold">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Active & Pending Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions
                  .filter(s => s.status === 'active' || s.status === 'pending')
                  .slice(0, 3)
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium truncate max-w-[120px]">{s.requestedBy.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{s.targetResourceType.split('-')[0]}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.isEmergency ? 'EMERG' : 'STD'}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </IdentityGovernanceMetrics>
    </div>
  );
}

function SessionOverview({ session }: { session: PrivilegedAccessSession }) {
  const durationMs = session.actualStart && session.actualEnd
    ? new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()
    : null;
  const durationMin = durationMs !== null ? Math.round(durationMs / 60000) : null;
  const maxWindow = session.requestedStart && session.requestedEnd
    ? Math.round((new Date(session.requestedEnd).getTime() - new Date(session.requestedStart).getTime()) / 60000)
    : 480;

  const overviewMetrics = [
    {
      title: "Status",
      value: session.status.toUpperCase(),
      subtitle: session.isEmergency ? '⚡ Emergency Access' : 'Standard elevation',
      icon: Activity,
      variant: session.status === 'active' ? "success" : session.status === 'pending' ? "warning" : "default" as any
    },
    {
      title: "Duration",
      value: durationMin !== null ? `${durationMin}m` : session.status === 'active' ? 'Active' : 'N/A',
      subtitle: `${maxWindow}m authorized window`,
      icon: Timer,
      variant: "primary" as any
    },
    {
      title: "Capabilities",
      value: session.approvedActions.length,
      subtitle: `of ${session.requestedActions.length} requested`,
      icon: Lock,
      variant: session.approvedActions.length > 0 ? "success" : "warning" as any
    },
    {
      title: "Audit Events",
      value: session.sessionLog.length,
      subtitle: "Recorded actions",
      icon: Terminal,
      variant: "default" as any
    }
  ];

  const lifecycleSteps: import("@/components/security/IdentityGovernanceMetrics").LifecycleStep[] = [
    { label: "Requested", sublabel: new Date(session.createdAt).toLocaleTimeString(), status: "completed" },
    { label: "Reviewed", sublabel: session.approvedBy ?? "Pending", status: session.approvedBy ? "completed" : session.status === 'denied' ? "failed" : "active" },
    { label: "Activated", sublabel: session.actualStart ? new Date(session.actualStart).toLocaleTimeString() : "Pending", status: session.actualStart ? (session.status === 'active' ? "active" : "completed") : "pending" },
    { label: "Closed", sublabel: session.actualEnd ? new Date(session.actualEnd).toLocaleTimeString() : "Ongoing", status: session.actualEnd ? "completed" : "pending" },
  ];

  const actionColorFn = (action: string) => {
    if (action.includes('read') || action.includes('view')) return 'hsl(var(--primary))';
    if (action.includes('write') || action.includes('modify') || action.includes('execute')) return 'hsl(var(--warning))';
    if (action.includes('delete') || action.includes('shutdown') || action.includes('emergency')) return 'hsl(var(--destructive))';
    return 'hsl(var(--success))';
  };

  return (
    <div className="space-y-5 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewMetrics.map((m, i) => {
          const Icon = m.icon;
          const variantColors: Record<string, string> = {
            success: 'text-success bg-success/10 border-success/20',
            warning: 'text-warning bg-warning/10 border-warning/20',
            destructive: 'text-destructive bg-destructive/10 border-destructive/20',
            primary: 'text-primary bg-primary/10 border-primary/20',
            default: 'text-muted-foreground bg-muted/20 border-muted/30',
          };
          return (
            <Card key={i} className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.title}</p>
                    <p className="text-xl font-bold mt-0.5">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${variantColors[m.variant as string] || variantColors.default}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Session Lifecycle */}
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Session Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusLifecycle steps={lifecycleSteps} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource Context */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Target Context</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailPropertyRow label="Resource Type" value={session.targetResourceType.replace(/-/g, ' ')} icon={Server} />
            <DetailPropertyRow label="Resource ID" value={session.targetResourceId} icon={Fingerprint} mono />
            <DetailPropertyRow label="Requestor" value={session.requestedBy} icon={User} />
            <DetailPropertyRow label="Justification" value={session.requestReason} icon={Shield} />
          </CardContent>
        </Card>

        {/* Approved Capabilities */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Approved Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TagBadgeList tags={session.approvedActions} colorFn={actionColorFn} />
            {session.approvalReason && (
              <p className="text-[10px] text-muted-foreground mt-3 italic border-t border-border/40 pt-3">{session.approvalReason}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Log Events */}
      {session.sessionLog.length > 0 && (
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {session.sessionLog.slice(-5).reverse().map((log, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tight text-primary">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-muted-foreground">{log.details}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionActivity({ session }: { session: PrivilegedAccessSession }) {
  if (session.sessionLog.length === 0) {
    return <EmptyState icon={Terminal} title="No Activity" description="No actions have been recorded for this session yet." />;
  }

  const getLogIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('auth')) return Key;
    if (a.includes('cmd') || a.includes('command') || a.includes('exec')) return Command;
    if (a.includes('read') || a.includes('view') || a.includes('query')) return Eye;
    if (a.includes('write') || a.includes('update') || a.includes('delete')) return Database;
    if (a.includes('connect')) return Terminal;
    return Activity;
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Session Metadata Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/20 border border-border/50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Source Context</p>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono font-bold tracking-tight">192.168.1.104</span>
          </div>
        </div>
        <div className="bg-secondary/20 border border-border/50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Access Method</p>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter">SSH-TERMINAL V2</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
        {session.sessionLog.slice().reverse().map((log, index) => {
          const LogIcon = getLogIcon(log.action);
          return (
            <div key={index} className="relative group">
              <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform z-10" />

              <div className="bg-card/40 border border-border/60 rounded-xl p-4 group-hover:border-primary/40 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-secondary/30 text-primary">
                      <LogIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] h-4 px-1 leading-none uppercase tracking-tighter opacity-70">
                    VERIFIED
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90 font-medium leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  "{log.details}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionApproval({ session }: { session: PrivilegedAccessSession }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Approval Governance Path
        </h4>

        <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
          <AuditStep
            title="Request Initiation"
            user={session.requestedBy}
            date={session.createdAt}
            status="completed"
            details={session.requestReason}
          />

          <AuditStep
            title="Supervisor Review"
            user={session.approvedBy || "Reviewing Authority"}
            date={session.updatedAt}
            status={session.approvedBy ? "completed" : session.status === 'denied' ? 'failed' : 'pending'}
            details={session.approvalReason || (session.status === 'pending' ? "Assessment in progress..." : "No additional notes")}
          />

          <AuditStep
            title="Credential Release"
            user="Vault Auto-Bot"
            status={session.actualStart ? "completed" : "pending"}
            details={session.actualStart ? `One-time credentials released at ${new Date(session.actualStart).toLocaleTimeString()}` : "Waiting for approval lifecycle completion"}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4">Authorized Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {session.approvedActions.map(action => (
            <div key={action} className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{action}</span>
            </div>
          ))}
          {session.approvedActions.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No actions authorized yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditStep({ title, user, date, status, details }: { title: string; user: string; date?: string; status: 'completed' | 'pending' | 'failed'; details: string }) {
  return (
    <div className="pl-6 relative">
      <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full z-10 ${status === 'completed' ? 'bg-success' : status === 'failed' ? 'bg-destructive' : 'bg-warning'}`} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold">{title}</span>
        {date && <span className="text-[10px] text-muted-foreground">{new Date(date).toLocaleString()}</span>}
      </div>
      <p className="text-xs text-muted-foreground mb-1">Entity: <span className="text-foreground font-medium">{user}</span></p>
      <p className="text-xs italic bg-secondary/30 p-2 rounded border border-border/50">{details}</p>
    </div>
  );
}