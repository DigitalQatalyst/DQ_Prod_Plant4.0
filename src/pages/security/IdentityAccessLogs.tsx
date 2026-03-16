import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Shield,
  User,
  Clock,
  MapPin,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Search,
  Activity,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Settings,
  Key,
  AlertCircle,
  Fingerprint,
  Zap,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchAuditLogEntries } from "@/lib/securityQueries";
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
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

// Identity Access Log Entry Interface
interface AccessLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: string;
  action: 'login' | 'logout' | 'access-granted' | 'access-denied' | 'password-change' | 'role-change' | 'mfa-challenge' | 'session-timeout';
  result: 'success' | 'failure' | 'warning';
  resourceType?: 'page' | 'api' | 'asset' | 'zone' | 'system';
  resourceId?: string;
  resourceName?: string;
  sourceIp: string;
  userAgent?: string;
  location?: string;
  sessionId?: string;
  details?: string;
  riskScore?: number;
  flagged: boolean;
  createdAt: string;
  description?: string;
}

export function IdentityAccessLogs() {
  const { currentTenant } = useApp();
  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load access logs
  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await searchAuditLogEntries(currentTenant?.id || "", {
          searchText: searchTerm,
        });

        const mappedLogs: AccessLogEntry[] = data.map(log => ({
          id: log.id,
          tenantId: log.tenantId,
          timestamp: log.eventTimestamp,
          userId: log.userId || "unknown",
          username: log.username || "Unknown User",
          userRole: log.userRole || "unknown",
          action: log.actionPerformed as any,
          result: log.outcome === 'success' ? 'success' : (log.outcome === 'failure' ? 'failure' : 'warning'),
          resourceType: log.targetType as any,
          resourceId: log.targetId,
          resourceName: log.targetName,
          sourceIp: log.sourceIp || "unknown",
          userAgent: log.userAgent,
          location: (log.additionalData?.location as string) || "Unknown",
          sessionId: log.sessionId,
          details: log.eventDescription,
          riskScore: log.riskScore,
          flagged: log.requiresInvestigation,
          createdAt: log.createdAt,
          description: log.eventDescription || `${log.actionPerformed} event for user ${log.username}`
        }));

        setLogs(mappedLogs);
      } catch (err) {
        console.error('Failed to load access logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [currentTenant?.id, searchTerm]);

  // Filter and sort access logs
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.username.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.sourceIp.includes(query) ||
        (log.details || '').toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (actionFilter !== "all") {
      result = result.filter(log => log.action === actionFilter);
    }

    // Apply result filter
    if (resultFilter !== "all") {
      result = result.filter(log => log.result === resultFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "timestamp") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "username") {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === "risk") {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      return 0;
    });

    return result;
  }, [logs, searchTerm, actionFilter, resultFilter, sortBy]);

  const selectedLog = logs.find((l) => l.id === selectedLogId);

  const tabs = selectedLog
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <LogOverview log={selectedLog} />,
      },
      {
        id: "context",
        label: "Context & Analysis",
        content: <LogContext log={selectedLog} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <LogsOverview logs={filteredAndSortedLogs} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Loading access logs..." />;
  }

  return (
    <>
      <ListPane
        title="Audit Logs"
        context="DEWA – Transmission"
        count={filteredAndSortedLogs.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "action", label: "Action", value: actionFilter, options: [
              { label: "All Actions", value: "all" },
              { label: "Login", value: "login" },
              { label: "Logout", value: "logout" },
              { label: "Access Granted", value: "access-granted" },
              { label: "Access Denied", value: "access-denied" },
              { label: "MFA Challenge", value: "mfa-challenge" },
            ], onChange: setActionFilter
          },
          {
            key: "result", label: "Result", value: resultFilter, options: [
              { label: "All Results", value: "all" },
              { label: "Success", value: "success" },
              { label: "Failure", value: "failure" },
              { label: "Warning", value: "warning" },
            ], onChange: setResultFilter
          }
        ]}
        sortOptions={[
          { label: "Time (Newest)", value: "timestamp" },
          { label: "Username", value: "username" },
          { label: "Risk Score", value: "risk" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {filteredAndSortedLogs.map((log) => (
          <ListPaneItem
            key={log.id}
            title={(log.username || 'unknown').split('@')[0]}
            description={(log.action || '').replace(/-/g, ' ')}
            status={log.result === 'success' ? 'online' : (log.result === 'failure' ? 'offline' : 'maintenance')}
            category={log.sourceIp}
            value={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            isSelected={selectedLogId === log.id}
            onClick={() => setSelectedLogId(log.id)}
          />
        ))}
      </ListPane>

      <WorkPane
        title={selectedLog ? `Event Trace: ${selectedLog.id.split('-')[0]}` : "Identity Governance Trails"}
        subtitle={
          selectedLog
            ? `${selectedLog.details || selectedLog.action.replace(/-/g, ' ')}`
            : `Continuous monitoring and forensics for ${currentTenant.name} identity infrastructure`
        }
        tabs={tabs}
      />
    </>
  );
}

function LogsOverview({ logs }: { logs: AccessLogEntry[] }) {
  const overviewMetrics = [
    {
      title: "Success Rate",
      value: logs.length > 0 ? `${Math.round((logs.filter(l => l.result === 'success').length / logs.length) * 100)}%` : "0%",
      subtitle: `from ${logs.length} events`,
      icon: CheckCircle2,
      variant: "success" as any
    },
    {
      title: "Access Denied",
      value: logs.filter(l => l.result === 'failure').length,
      subtitle: "Critical violations",
      icon: Lock,
      variant: logs.some(l => l.result === 'failure') ? "destructive" : "success" as any
    },
    {
      title: "Avg Risk",
      value: logs.length > 0 ? (logs.reduce((acc, l) => acc + (l.riskScore || 0), 0) / logs.length).toFixed(1) : "0",
      subtitle: "Threat posture",
      icon: Activity,
      variant: "primary" as any
    },
    {
      title: "Anomalies",
      value: logs.filter(l => l.flagged).length,
      subtitle: "Requires review",
      icon: AlertTriangle,
      variant: logs.some(l => l.flagged) ? "warning" : "success" as any
    }
  ];

  const pieChartData = [
    { name: "Success", value: logs.filter(l => l.result === 'success').length, color: "hsl(var(--success))" },
    { name: "Failure", value: logs.filter(l => l.result === 'failure').length, color: "hsl(var(--destructive))" },
    { name: "Warning", value: logs.filter(l => l.result === 'warning').length, color: "hsl(var(--warning))" },
  ];

  const barChartData = [
    { name: "Login", value: logs.filter(l => l.action === 'login').length },
    { name: "Access", value: logs.filter(l => l.action === 'access-granted' || l.action === 'access-denied').length },
    { name: "MFA", value: logs.filter(l => l.action === 'mfa-challenge').length },
    { name: "Admin", value: logs.filter(l => ['role-change', 'password-change'].includes(l.action)).length },
  ];

  const keyAreas = [
    {
      icon: Fingerprint,
      title: "Behavioral Analytics",
      description: "Detecting deviations in user access patterns and identifying potential hijacked accounts."
    },
    {
      icon: Globe,
      title: "Impossible Travel",
      description: "Monitoring for access attempts from geographically disparate locations in short timeframes."
    },
    {
      icon: Shield,
      title: "Compliance Archival",
      description: "Fulfilling NERC-CIP and ISO 27001 requirements for identity audit trail retention and integrity."
    },
    {
      icon: Zap,
      title: "Real-time Response",
      description: "Automated triggering of SOAR playbooks based on high-risk identity event clusters."
    }
  ];

  const recentAnomalies = logs
    .filter(l => l.flagged || l.result === 'failure')
    .slice(0, 5)
    .map(l => ({
      id: l.id,
      title: (l.username || 'unknown').split('@')[0],
      subtitle: (l.action || '').replace(/-/g, ' '),
      status: l.result === 'failure' ? 'destructive' : 'warning' as any,
      value: l.sourceIp
    }));

  return (
    <IdentityOverview
      title="Audit Intelligence"
      description="Holistic visibility into identity lifecycles and authentication patterns across grid domains"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Session Outcomes"
        pieChartData={pieChartData}
        pieChartIcon={Shield}
        barChartTitle="Event Categories"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={recentAnomalies}
        recentActivityTitle="Recent Deviations"
      />
    </IdentityOverview>
  );
}

function LogOverview({ log }: { log: AccessLogEntry }) {
  const overviewMetrics = [
    {
      title: "Outcome",
      value: log.result,
      subtitle: "Submission result",
      icon: Shield,
      variant: log.result === 'success' ? "success" : log.result === 'failure' ? "destructive" : "warning" as any
    },
    {
      title: "Risk Score",
      value: log.riskScore || 0,
      subtitle: "Assessment level",
      icon: Activity,
      variant: (log.riskScore || 0) >= 7 ? "destructive" : (log.riskScore || 0) >= 4 ? "warning" : "success" as any
    },
    {
      title: "Origin",
      value: log.sourceIp,
      subtitle: log.location || "Unknown Location",
      icon: MapPin,
      variant: "primary" as any
    },
    {
      title: "Timestamp",
      value: new Date(log.timestamp).toLocaleTimeString(),
      subtitle: new Date(log.timestamp).toLocaleDateString(),
      icon: Clock,
      variant: "default" as any
    }
  ];

  const keyAreas = [
    {
      icon: User,
      title: "Subject Identity",
      description: `${log.username} (${log.userRole.toUpperCase()})`
    },
    {
      icon: Monitor,
      title: "Target Resource",
      description: log.resourceName ? `${log.resourceName} [${log.resourceType || 'Unknown'}]` : "General Identity Event"
    }
  ];

  return (
    <IdentityOverview
      title={`${log.action.replace(/-/g, ' ').toUpperCase()}`}
      description={log.details || "Forensic audit details for the selected identity event"}
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4">Event Context Summary</h4>
        <div className="grid grid-cols-2 gap-6">
          {keyAreas.map((area, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
                <area.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{area.title}</p>
                <p className="text-sm font-medium">{area.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-muted/30 border border-border rounded-lg p-4 font-mono text-xs">
        <p className="text-muted-foreground mb-2">// Technical Metadata</p>
        <p><span className="text-primary">UserAgent:</span> {log.userAgent || "N/A"}</p>
        <p><span className="text-primary">SessionID:</span> {log.sessionId || "N/A"}</p>
        <p><span className="text-primary">ResourceID:</span> {log.resourceId || "N/A"}</p>
        <p><span className="text-primary">Flagged:</span> {log.flagged ? "TRUE (Requires Investigation)" : "FALSE"}</p>
      </div>
    </IdentityOverview>
  );
}

function LogContext({ log }: { log: AccessLogEntry }) {
  const isExternal = !log.sourceIp.startsWith('192.168.');
  const isSuspicious = log.flagged || isExternal;

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSuspicious ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
            {isSuspicious ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Advanced Heuristic Analysis</h4>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Automated behavioral verification system</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Source Integrity"
            value={isExternal ? "UNTRUSTED IP" : "SECURE INTRANET"}
            status={isExternal ? 'warning' : 'success'}
            icon={Globe}
          />
          <AnalysisMetric
            label="MFA Strength"
            value={log.flagged ? "CERT-BYPASS" : "HARDWARE KEY"}
            status={log.flagged ? 'failed' : 'success'}
            icon={Fingerprint}
          />
          <AnalysisMetric
            label="Resource Gravity"
            value={log.resourceType === 'system' ? "CRITICAL ASSET" : "GENERAL RESOURCE"}
            status={log.resourceType === 'system' ? 'warning' : 'success'}
            icon={Zap}
          />
          <AnalysisMetric
            label="Temporal Alignment"
            value="ESTABLISHED WINDOW"
            status="success"
            icon={Clock}
          />
          <AnalysisMetric
            label="Access Velocity"
            value={log.flagged ? "ANOMALOUS" : "NOMINAL"}
            status={log.flagged ? 'failed' : 'success'}
            icon={Activity}
          />
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${isSuspicious ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSuspicious ? 'bg-destructive' : 'bg-primary'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Protocol</span>
          </div>
          <Badge variant={isSuspicious ? "destructive" : "secondary"} className="text-[8px] h-4 px-1 leading-none uppercase font-bold">
            {isSuspicious ? "IMMEDIATE INTERVENTION" : "STANDARD LOGGING"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {isSuspicious
            ? "SECURITY ALERT: Initiate credential rotation and isolate source workstation. A behavioral mismatch has been detected in the authentication chain. Manual identity verification is required."
            : "ROUTINE: Access pattern aligns with historical baseline for this identity. Entry recorded in behavioral profile. No further action required by SOC."}
        </p>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Behavioral Fingerprint</h5>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isSuspicious ? 'bg-destructive' : 'bg-success'}`} style={{ width: isSuspicious ? '85%' : '15%' }} />
          </div>
          <span className="text-[10px] font-mono font-bold">{isSuspicious ? '85% RISK' : '15% RISK'}</span>
        </div>
      </div>
    </div>
  );
}


function RelatedEvents({ log, logs }: { log: AccessLogEntry; logs: AccessLogEntry[] }) {
  const related = logs.filter(l => l.userId === log.userId && l.id !== log.id).slice(0, 10);

  if (related.length === 0) {
    return <EmptyState icon={Activity} title="Isolated Event" description="No recent events found for this specific user identity." />;
  }

  return (
    <div className="space-y-3">
      <div className="bg-secondary/30 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
        Historical Trace for {log.username}
      </div>
      {related.map(r => (
        <div key={r.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium capitalize">{r.action.replace(/-/g, ' ')}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <StatusBadge status={r.result === 'success' ? 'online' : 'offline'} />
        </div>
      ))}
    </div>
  );
}