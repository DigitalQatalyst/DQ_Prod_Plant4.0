import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Monitor,
  MapPin,
  Terminal,
  FileText,
  XCircle,
  Play,
  Pause,
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
  Database,
  Lock,
  Unlock,
} from "lucide-react";
import {
  getRemoteAccessSessions,
  terminateRemoteAccessSession,
} from "@/lib/otSecurityQueries";
import { searchAuditLogs } from "@/lib/loggingForensicsQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { getDataBackend } from "@/lib/supabase";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import type { RemoteAccessSession } from "@/types/security";

// Mock session data generator fallback
function generateMockSessionsFallback(tenantId: string): RemoteAccessSession[] {
  const sessionTypes: Array<'rdp' | 'ssh' | 'vnc' | 'web' | 'scada-client' | 'iec61850-client'> = ['rdp', 'ssh', 'vnc', 'web'];
  const usernames = ['admin.dewa', 'engineer.grid', 'contractor.main'];
  const sessions: RemoteAccessSession[] = [];
  for (let i = 0; i < 5; i++) {
    sessions.push({
      id: `mock-session-${i}`,
      tenantId,
      siteId: 'site-1',
      userId: `user-${i}`,
      username: usernames[i % usernames.length],
      sessionType: sessionTypes[i % sessionTypes.length],
      targetSystem: `System-${i}`,
      targetAssetId: `asset-${i}`,
      sourceIp: '10.0.0.1',
      destinationIp: '192.168.1.1',
      status: i === 0 ? 'active' : 'terminated',
      authenticationMethod: 'mfa',
      authorizationStatus: 'authorized',
      sessionStart: new Date().toISOString(),
      durationSeconds: 3600,
      commandsExecuted: 10,
      filesTransferred: 0,
      alertsTriggered: 0,
      riskScore: 20,
      auditTrail: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return sessions;
}

export function RemoteAccessSessions() {
  const { currentTenant } = useApp();
  const [selectedSession, setSelectedSession] = useState<RemoteAccessSession | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");

  // State for Supabase / Hybrid data
  const [sessions, setSessions] = useState<RemoteAccessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRemoteAccessSessions(currentTenant.id);
        setSessions(data);
      } catch (err) {
        console.error('Error loading remote access sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');

        // Fallback to mock data on error or if in 'mock' mode
        if (getDataBackend() === 'mock') {
          setSessions(generateMockSessionsFallback(currentTenant.id));
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let result = sessions.filter((session) => {
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;
      const matchesType = typeFilter === "all" || session.sessionType === typeFilter;

      let matchesRisk = true;
      if (riskFilter !== "all") {
        if (riskFilter === "high") {
          matchesRisk = session.riskScore >= 70;
        } else if (riskFilter === "medium") {
          matchesRisk = session.riskScore >= 40 && session.riskScore < 70;
        } else if (riskFilter === "low") {
          matchesRisk = session.riskScore < 40;
        }
      }

      const matchesSearch =
        (session.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.targetSystem || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesType && matchesRisk && matchesSearch;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime();
        case 'risk':
          return b.riskScore - a.riskScore;
        case 'username':
          return (a.username || '').localeCompare(b.username || '');
        case 'commands':
          return b.commandsExecuted - a.commandsExecuted;
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, statusFilter, typeFilter, riskFilter, searchTerm, sortBy]);

  // Set initial selection
  /*
  useEffect(() => {
    if (!selectedSession && filteredSessions.length > 0) {
      setSelectedSession(filteredSessions[0]);
    }
  }, [filteredSessions, selectedSession]);
  */

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "terminated", label: "Terminated" },
    { value: "expired", label: "Expired" },
    { value: "failed", label: "Failed" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "rdp", label: "RDP" },
    { value: "ssh", label: "SSH" },
    { value: "vnc", label: "VNC" },
    { value: "web", label: "Web" },
    { value: "scada-client", label: "SCADA Client" },
    { value: "iec61850-client", label: "IEC 61850 Client" },
  ];

  const riskOptions = [
    { value: "all", label: "All Risk Levels" },
    { value: "high", label: "High Risk (70+)" },
    { value: "medium", label: "Medium Risk (40-69)" },
    { value: "low", label: "Low Risk (<40)" },
  ];

  const filters = [
    {
      key: "status",
      label: "Session Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions,
    },
    {
      key: "type",
      label: "Session Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: typeOptions,
    },
    {
      key: "risk",
      label: "Risk Level",
      value: riskFilter,
      onChange: setRiskFilter,
      options: riskOptions,
    },
  ];

  const tabs = selectedSession ? [
    {
      id: "overview",
      label: "Session Overview",
      content: <SessionOverview session={selectedSession} />,
    },
    {
      id: "activity",
      label: "Session Activity",
      content: <SessionActivity session={selectedSession} />,
    },
    {
      id: "security",
      label: "Security Analysis",
      content: <SessionSecurity session={selectedSession} />,
    },
    {
      id: "audit",
      label: "Audit Trail",
      content: <SessionAudit session={selectedSession} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <RemoteAccessOverview sessions={sessions} />,
    },
  ];

  // Calculate summary stats
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const highRiskSessions = sessions.filter(s => s.riskScore >= 70).length;
  const unauthorizedSessions = sessions.filter(s => s.authorizationStatus === 'unauthorized').length;

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateRemoteAccessSession(currentTenant.id, sessionId, 'Administrative termination');
      // Refresh local state or re-fetch
      setSessions(prev => prev.map(s => s.id === sessionId ?
        { ...s, status: 'terminated' as any, sessionEnd: new Date().toISOString(), terminationReason: 'Administrative termination' } : s
      ));
      alert('Session terminated successfully.');
    } catch (err) {
      console.error('Failed to terminate session:', err);
      alert('Failed to terminate session. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingState loadingText="Loading remote sessions..." />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Admin Sessions"
        context="DEWA – Transmission"
        count={filteredAndSortedSessions.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "type",
            label: "Type",
            options: typeOptions,
            value: typeFilter,
            onChange: setTypeFilter,
          },
          {
            key: "risk",
            label: "Risk",
            options: riskOptions,
            value: riskFilter,
            onChange: setRiskFilter,
          }
        ]}
        sortOptions={[
          { label: 'Recently Started', value: 'recent' },
          { label: 'High Risk', value: 'risk' },
          { label: 'Username', value: 'username' },
          { label: 'Command Count', value: 'commands' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedSessions.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="No Sessions Found"
              description="No remote access sessions match the selected filters"
            />
          ) : (
            filteredAndSortedSessions.map((session) => (
              <ListPaneItem
                key={session.id}
                title={session.username}
                description={`${session.targetSystem} • ${session.sessionType?.toUpperCase()}`}
                status={session.status === 'active' ? 'online' : (session.status === 'failed' ? 'offline' : 'maintenance')}
                category={session.sessionType?.toUpperCase() || 'SESSION'}
                value={`${session.riskScore}`}
                isSelected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedSession ? `Session: ${selectedSession.username}` : "Remote Access Overview"}
        subtitle={
          selectedSession
            ? `${selectedSession.sessionType?.toUpperCase()} • ${selectedSession.targetSystem} • ${selectedSession.status}`
            : "Monitor and audit remote access sessions"
        }
        tabs={tabs}
        actions={
          selectedSession && selectedSession.status === 'active' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleTerminateSession(selectedSession.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Terminate Session
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

function SessionOverview({ session }: { session: RemoteAccessSession }) {
  const duration = session.durationSeconds
    ? `${Math.floor(session.durationSeconds / 3600)}h ${Math.floor((session.durationSeconds % 3600) / 60)}m`
    : 'Ongoing';

  const isActive = session.status === 'active';
  const isHighRisk = session.riskScore >= 70;

  return (
    <div className="space-y-6">
      {/* Session KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Session Status"
          value={session.status}
          subtitle={isActive ? 'Currently active' : 'Session ended'}
          icon={isActive ? Activity : CheckCircle2}
          variant={
            isActive ? "success" :
              session.status === "terminated" ? "default" : "warning"
          }
        />
        <KPICard
          title="Risk Score"
          value={session.riskScore}
          subtitle={isHighRisk ? "High risk" : "Normal"}
          icon={isHighRisk ? AlertTriangle : Shield}
          variant={isHighRisk ? "destructive" : "success"}
        />
        <KPICard
          title="Commands Executed"
          value={session.commandsExecuted}
          subtitle="Total commands"
          icon={Terminal}
          variant="primary"
        />
        <KPICard
          title="Alerts Triggered"
          value={session.alertsTriggered}
          subtitle={session.alertsTriggered > 0 ? "Requires review" : "No issues"}
          icon={session.alertsTriggered > 0 ? AlertTriangle : CheckCircle2}
          variant={session.alertsTriggered > 0 ? "warning" : "success"}
        />
      </div>

      {/* Session Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Session Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium">{session.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session Type:</span>
              <span>{session.sessionType?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target System:</span>
              <span>{session.targetSystem}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Time:</span>
              <span>{new Date(session.sessionStart).toLocaleString()}</span>
            </div>
            {session.sessionEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Time:</span>
                <span>{new Date(session.sessionEnd).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Network Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source IP:</span>
              <span className="font-mono text-xs">{session.sourceIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination IP:</span>
              <span className="font-mono text-xs">{session.destinationIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authentication:</span>
              <span>{session.authenticationMethod?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authorization:</span>
              <StatusBadge status={session.authorizationStatus} />
            </div>
            {session.terminationReason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Termination:</span>
                <span>{session.terminationReason}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      {isHighRisk && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-destructive mb-2">High Risk Session</h3>
              <p className="text-xs text-muted-foreground mb-3">
                This session has been flagged as high risk based on multiple factors including access patterns,
                target system criticality, and behavioral analysis.
              </p>
              <div className="space-y-1 text-xs">
                {session.authorizationStatus === 'unauthorized' && (
                  <p className="text-destructive">• Unauthorized access attempt detected</p>
                )}
                {session.alertsTriggered > 0 && (
                  <p className="text-destructive">• {session.alertsTriggered} security alerts triggered</p>
                )}
                {session.commandsExecuted > 100 && (
                  <p className="text-destructive">• Unusually high command execution count</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Activity Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Activity Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Commands Executed</p>
            <p className="text-2xl font-bold">{session.commandsExecuted}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Files Transferred</p>
            <p className="text-2xl font-bold">{session.filesTransferred}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Security Alerts</p>
            <p className="text-2xl font-bold">{session.alertsTriggered}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionActivity({ session }: { session: RemoteAccessSession }) {
  // Mock activity data
  const startTime = new Date(session.sessionStart).getTime();
  const baseTime = isNaN(startTime) ? Date.now() : startTime;

  const activities = [
    {
      id: 1,
      timestamp: new Date(baseTime + 60000).toISOString(),
      type: 'authentication',
      action: 'User authenticated successfully',
      details: `Authentication method: ${session.authenticationMethod}`,
      severity: 'info',
    },
    {
      id: 2,
      timestamp: new Date(baseTime + 120000).toISOString(),
      type: 'command',
      action: 'Command executed: show system status',
      details: 'Read-only command executed',
      severity: 'info',
    },
    {
      id: 3,
      timestamp: new Date(baseTime + 300000).toISOString(),
      type: 'file-transfer',
      action: 'File downloaded: config_backup.xml',
      details: 'Configuration file accessed',
      severity: session.riskScore > 70 ? 'warning' : 'info',
    },
    {
      id: 4,
      timestamp: new Date(baseTime + 600000).toISOString(),
      type: 'command',
      action: 'Command executed: modify relay settings',
      details: 'Configuration change attempted',
      severity: 'warning',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Activity Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Session Timeline</h4>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {activity.type === 'authentication' && <User className="w-4 h-4 text-primary" />}
                  {activity.type === 'command' && <Terminal className="w-4 h-4 text-primary" />}
                  {activity.type === 'file-transfer' && <FileText className="w-4 h-4 text-primary" />}
                  <h5 className="text-sm font-medium">{activity.action}</h5>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${activity.severity === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                    }`}
                >
                  {activity.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{activity.details}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{new Date(activity.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recent Commands</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">$</span>
              <span>show system status</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">$</span>
              <span>list active connections</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">$</span>
              <span>get relay configuration</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">$</span>
              <span className="text-warning">modify relay settings --zone=protection</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">$</span>
              <span>backup configuration</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Transfers */}
      {session.filesTransferred > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">File Transfers ({session.filesTransferred})</h4>
          <div className="space-y-2">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">config_backup.xml</p>
                    <p className="text-xs text-muted-foreground">Downloaded • 2.4 MB</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(Date.now() - 300000).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">relay_settings.dat</p>
                    <p className="text-xs text-muted-foreground">Downloaded • 156 KB</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(Date.now() - 600000).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionSecurity({ session }: { session: RemoteAccessSession }) {
  const isHighRisk = session.riskScore >= 70;
  const isMediumRisk = session.riskScore >= 40 && session.riskScore < 70;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Risk Architecture */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-foreground">Cyber-Kinetic Risk Analysis</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Heuristic Behavioral Profile</p>
          </div>
          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isHighRisk ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
            {isHighRisk ? 'Critical Threat' : 'Nominal Status'}
          </div>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all ${isHighRisk ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'}`}>
            <span className={`text-4xl font-black tracking-tighter ${isHighRisk ? 'text-destructive' : 'text-primary'}`}>
              {session.riskScore}
            </span>
            <span className="text-[8px] font-bold uppercase opacity-60">Risk Index</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 opacity-70">
                <span>Threat Probability</span>
                <span>{session.riskScore}%</span>
              </div>
              <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-destructive' : isMediumRisk ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${session.riskScore}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              "Automated analysis indicates {isHighRisk ? 'extreme' : isMediumRisk ? 'moderate' : 'negligible'} behavioral deviation from baseline OT access patterns."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AnalysisMetric
            label="MFA Integrity"
            value={session.authenticationMethod === 'mfa' ? "VERIFIED" : "BYPASSED"}
            status={session.authenticationMethod === 'mfa' ? 'success' : 'failed'}
            icon={Fingerprint}
          />
          <AnalysisMetric
            label="Geo-Velocity"
            value="ESTABLISHED"
            status="success"
            icon={Globe}
          />
          <AnalysisMetric
            label="Command Depth"
            value={session.commandsExecuted > 50 ? "ABNORMAL" : "EXPECTED"}
            status={session.commandsExecuted > 50 ? 'warning' : 'success'}
            icon={Terminal}
          />
          <AnalysisMetric
            label="Access Window"
            value="AUTHORIZED"
            status="success"
            icon={Clock}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
          <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" />
            Active Risk Drivers
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Privilege Elevation</span>
              <span className="font-bold text-success">CLEAN</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Impossible Travel</span>
              <span className="font-bold text-success">NONE</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Direct SCADA Access</span>
              <span className={`font-bold ${session.targetSystem.toLowerCase().includes('scada') ? 'text-warning' : 'text-success'}`}>
                {session.targetSystem.toLowerCase().includes('scada') ? 'DETECTED' : 'NONE'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
          <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            Session Hygiene
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Concurrent Ops</span>
              <span className="font-bold">LOW</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Data Exfil Rate</span>
              <span className="font-bold text-success">0.0 KB/s</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Session Age</span>
              <span className="font-bold italic">NOMINAL</span>
            </div>
          </div>
        </div>
      </div>

      {(isHighRisk || session.authorizationStatus === 'unauthorized') && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-4 items-start animate-pulse">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-destructive uppercase tracking-tight">Immediate Protocol Required</h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {session.authorizationStatus === 'unauthorized'
                ? "SECURITY BREACH: Unauthorized access attempt detected. Initiate credential revocation and forensic session capture."
                : "ELEVATED RISK: risk score threshold exceeded. Initiate secondary-channel verification before allowing further SCADA write-ops."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


function SessionAudit({ session }: { session: RemoteAccessSession }) {
  // Mock audit trail entries
  const startTime = new Date(session.sessionStart).getTime();
  const baseTime = isNaN(startTime) ? Date.now() : startTime;

  const auditEntries = [
    {
      id: 1,
      timestamp: new Date(baseTime).toISOString(),
      event: 'Session Initiated',
      user: session.username,
      details: `Remote access session started from ${session.sourceIp}`,
      category: 'session-management',
    },
    {
      id: 2,
      timestamp: new Date(baseTime + 60000).toISOString(),
      event: 'Authentication Successful',
      user: session.username,
      details: `User authenticated using ${session.authenticationMethod}`,
      category: 'authentication',
    },
    {
      id: 3,
      timestamp: new Date(baseTime + 120000).toISOString(),
      event: 'Authorization Verified',
      user: session.username,
      details: `Access authorization status: ${session.authorizationStatus}`,
      category: 'authorization',
    },
    {
      id: 4,
      timestamp: new Date(baseTime + 300000).toISOString(),
      event: 'System Access',
      user: session.username,
      details: `Connected to ${session.targetSystem}`,
      category: 'system-access',
    },
  ];

  if (session.sessionEnd) {
    auditEntries.push({
      id: 5,
      timestamp: session.sessionEnd,
      event: 'Session Terminated',
      user: session.username,
      details: session.terminationReason || 'Session ended',
      category: 'session-management',
    });
  }

  return (
    <div className="space-y-6">
      {/* Audit Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Audit Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Total Events</p>
            <p className="text-2xl font-bold">{auditEntries.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Session Duration</p>
            <p className="text-2xl font-bold">
              {session.durationSeconds
                ? `${Math.floor(session.durationSeconds / 60)}m`
                : 'Ongoing'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Audit Status</p>
            <p className="text-sm font-medium mt-2">
              <StatusBadge status="complete" />
            </p>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Audit Trail</h4>
        <div className="space-y-3">
          {auditEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h5 className="text-sm font-medium">{entry.event}</h5>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {entry.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{entry.details}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{entry.user}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Information */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Compliance & Retention</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audit Log Retention:</span>
            <span className="font-medium">7 years</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Compliance Standards:</span>
            <span>IEC 62443, NERC CIP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Log Integrity:</span>
            <StatusBadge status="verified" />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audit Export:</span>
            <Button variant="outline" size="sm">
              <FileText className="w-3 h-3 mr-2" />
              Export Audit Log
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RemoteAccessOverview({ sessions }: { sessions: RemoteAccessSession[] }) {
  // Calculate metrics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const highRiskSessions = sessions.filter(s => s.riskScore >= 70).length;

  // Sessions by type
  const sessionsByType = sessions.reduce((acc, session) => {
    const type = session.sessionType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sessions by status
  const sessionsByStatus = sessions.reduce((acc, session) => {
    const status = session.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent sessions (last 5)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime())
    .slice(0, 5);

  // Prepare chart data
  const typeData = Object.entries(sessionsByType)
    .map(([type, count]) => ({
      name: type.toUpperCase(),
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  const statusData = [
    { name: 'Active', value: sessionsByStatus['active'] || 0, color: 'hsl(var(--success))' },
    { name: 'Terminated', value: sessionsByStatus['terminated'] || 0, color: 'hsl(var(--muted))' },
    { name: 'Expired', value: sessionsByStatus['expired'] || 0, color: 'hsl(var(--warning))' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Session Status Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Session Status
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
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
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sessions by Type Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Sessions by Access Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={typeData} layout="vertical" margin={{ left: 60, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Access Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Key Access Controls
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">MFA Enforcement</p>
              <p className="text-xs text-muted-foreground">Require multi-factor authentication for all remote access.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Session Monitoring</p>
              <p className="text-xs text-muted-foreground">Real-time monitoring and recording of all remote sessions.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Access Logging</p>
              <p className="text-xs text-muted-foreground">Comprehensive audit trails for compliance and forensics.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recent Sessions
        </h4>
        <div className="space-y-4">
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                    }`} />
                  <span className="text-sm font-medium truncate max-w-[120px]">{session.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{session.sessionType?.toUpperCase()}</span>
                  <span className="text-xs">{new Date(session.sessionStart).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No recent sessions.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a session from the list to view detailed activity and audit trail.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
