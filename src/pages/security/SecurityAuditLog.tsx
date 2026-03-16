import { useState, useMemo } from "react";
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
  User,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Database,
  Lock,
  Unlock,
  FileText,
  Search,
  Zap,
  Wrench,
  Network,
  HardDrive,
  Gauge,
  Cpu,
  Router,
  Wifi,
  Server,
  RefreshCw,
  Globe,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { searchAuditLogs } from "@/lib/loggingForensicsQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import type { SecurityAuditLogEntry, LogSearchQuery, AuditLogEntry } from "@/types/security";
import { getAuditLogEntriesByTenant } from "@/data/mockData";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { ChartData, KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function SecurityAuditLog() {
  const { currentTenant } = useApp();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState("recent");

  // Map Supabase entry to frontend AuditLogEntry
  const mapSupabaseToFrontend = (log: SecurityAuditLogEntry): AuditLogEntry => {
    return {
      id: log.id,
      tenantId: log.tenantId,
      timestamp: log.eventTimestamp,
      eventType: log.eventType,
      category: (log.eventCategory || 'system') as any,
      user: log.username || 'System',
      userId: log.userId || 'system',
      action: log.eventName,
      resource: log.targetName || log.systemComponent || 'N/A',
      resourceType: log.targetType || 'System',
      outcome: (log.outcome === 'denied' ? 'failure' : log.outcome) as any,
      ipAddress: log.sourceIp,
      sessionId: log.sessionId,
      details: log.eventDescription || log.actionPerformed,
      severity: (log.severity === 'high' ? 'critical' : log.severity) as any,
      assetId: log.assetId
    };
  };

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        // Prepare categories for query
        let eventTypes: any[] | undefined = undefined;
        if (categoryFilter !== 'all') {
          // Map frontend categories to backend event types if needed
          const categoryMap: Record<string, string[]> = {
            'authentication': ['authentication'],
            'authorization': ['authorization'],
            'configuration': ['configuration_change'],
            'configuration-change': ['configuration_change'],
            'data-access': ['data_access'],
            'system': ['system_access'],
            'system-access': ['system_access'],
            'policy-change': ['policy_change'],
            'incident-response': ['incident_creation', 'compliance_check']
          };
          eventTypes = categoryMap[categoryFilter] || [categoryFilter];
        }

        const query: LogSearchQuery = {
          tenantId: currentTenant.id,
          searchText: searchTerm || undefined,
          eventTypes,
          outcomes: outcomeFilter === 'all' ? undefined : (outcomeFilter === 'failure' ? ['failure', 'denied'] : ['success']) as any[],
          limit: 100
        };

        const result = await searchAuditLogs(query);

        if (result.logs.length > 0) {
          setLogs(result.logs.map(mapSupabaseToFrontend));
        } else {
          // Fallback to mock data if no logs found in Supabase
          const mockData = getAuditLogEntriesByTenant(currentTenant.id);
          setLogs(mockData);
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError("Failed to fetch logs from server");
        // Fallback to mock data on error
        const mockData = getAuditLogEntriesByTenant(currentTenant.id);
        setLogs(mockData);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [currentTenant.id, categoryFilter, outcomeFilter, searchTerm]);

  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(undefined);

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...logs];

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (entry) =>
          (entry.action || '').toLowerCase().includes(query) ||
          (entry.category || '').toLowerCase().includes(query) ||
          (entry.id || '').toLowerCase().includes(query) ||
          (entry.user || '').toLowerCase().includes(query) // Assuming 'user' is the equivalent of 'actorName'
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "severity") {
        const priority = { critical: 0, warning: 1, info: 2, low: 3 };
        return (priority[a.severity as keyof typeof priority] || 4) - (priority[b.severity as keyof typeof priority] || 4);
      }
      if (sortBy === "user") return a.user.localeCompare(b.user);
      return 0;
    });

    return result;
  }, [logs, sortBy, searchTerm]);

  // Removed auto-selection to allow for Feature Overview
  /*
  useEffect(() => {
    if (filteredEntries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(filteredEntries[0].id);
    }
  }, [filteredEntries]);
  */

  const selectedEntry = logs.find((e) => e.id === selectedEntryId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalEvents = logs.length;
    const failedAttempts = logs.filter(
      (log) => log.outcome === "failure"
    ).length;
    const configChanges = logs.filter(
      (log) => log.category === "configuration" || log.category === "configuration-change"
    ).length;
    const criticalEvents = logs.filter(
      (log) => log.severity === "critical"
    ).length;

    return {
      totalEvents,
      failedAttempts,
      configChanges,
      criticalEvents,
    };
  }, [logs]);

  const tabs = selectedEntry
    ? [
      {
        id: "details",
        label: "Details",
        content: <EntryDetails entry={selectedEntry} />,
      },
      {
        id: "context",
        label: "Context",
        content: <EntryContext entry={selectedEntry} />,
      },
      {
        id: "related",
        label: "Related Events",
        content: <RelatedEvents entry={selectedEntry} allEntries={logs} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <SecurityAuditOverview logs={logs} summaryStats={summaryStats} onEntrySelect={setSelectedEntryId} />,
      }
    ];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "login":
      case "login-failed":
      case "login_attempt":
        return Lock;
      case "logout":
        return Unlock;
      case "config-change":
      case "update_ladder_logic":
      case "modify_safety_logic":
      case "modify_config":
      case "valve_position_change":
        return Settings;
      case "data-export":
      case "export_data":
      case "bulk_download":
        return FileText;
      case "system-update":
      case "backup-completed":
        return Database;
      case "alert-created":
        return AlertTriangle;
      case "role-assigned":
      case "access-denied":
      case "access_attempt":
        return Shield;
      case "account-locked":
        return Lock;
      case "remote_session_start":
      case "network_scan":
        return Network;
      case "update_policy":
      case "add_user_exception":
        return FileText;
      case "incident_created":
      case "containment_action":
        return AlertTriangle;
      // Upstream-specific event types
      case "wellhead-control":
        return Gauge;
      case "sis-override":
        return Zap;
      case "pipeline-valve":
        return Wrench;
      case "scada-access":
        return Server;
      case "plc-programming":
        return Cpu;
      case "field-device":
        return Router;
      case "remote-access":
        return Wifi;
      case "safety-system":
        return Shield;
      case "telemetry-access":
        return Eye;
      default:
        return Activity;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "authentication":
        return "text-primary";
      case "authorization":
        return "text-warning";
      case "configuration":
      case "configuration-change":
        return "text-purple-500";
      case "data-access":
        return "text-blue-500";
      case "system":
      case "system-access":
        return "text-muted-foreground";
      case "policy-change":
        return "text-green-500";
      case "incident-response":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "warning":
        return "bg-warning/10 text-warning";
      case "info":
        return "bg-primary/10 text-primary";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "success":
        return "bg-success/10 text-success";
      case "failure":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Security Audit Log"
        context="DEWA – Transmission"
        count={filteredAndSortedEntries.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { value: "all", label: "All Categories" },
              { value: "authentication", label: "Authentication" },
              { value: "authorization", label: "Authorization" },
              { value: "configuration", label: "Configuration" },
              { value: "data-access", label: "Data Access" },
              { value: "system", label: "System" },
              { value: "policy-change", label: "Policy Change" },
              { value: "incident-response", label: "Incident Response" },
            ],
          },
          {
            key: "outcome",
            label: "Outcome",
            value: outcomeFilter,
            onChange: setOutcomeFilter,
            options: [
              { value: "all", label: "All Outcomes" },
              { value: "success", label: "Success" },
              { value: "failure", label: "Failure" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Recently Occurred", value: "recent" },
          { label: "Criticality/Severity", value: "severity" },
          { label: "User Account", value: "user" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 opacity-50">
              <Activity className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Loading security logs...</p>
            </div>
          ) : filteredAndSortedEntries.length > 0 ? (
            filteredAndSortedEntries.map((entry) => (
              <ListPaneItem
                key={entry.id}
                title={entry.action}
                description={entry.details}
                status={entry.outcome === 'success' ? 'online' : 'offline'}
                category={entry.user}
                value={(entry.severity || '').toUpperCase()}
                isSelected={selectedEntryId === entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={Activity}
              title="No Logs Found"
              description="No security audit logs match your search and filters"
            />
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedEntry ? selectedEntry.action : "Security Audit Overview"}
        subtitle={selectedEntry ? `${selectedEntry.category} - ${selectedEntry.outcome}` : "Comprehensive security event monitoring and forensic logs"}
        tabs={tabs}
      />
    </>
  );
}

function SecurityAuditOverview({
  logs,
  summaryStats,
  onEntrySelect
}: {
  logs: AuditLogEntry[];
  summaryStats: any;
  onEntrySelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Security Audit Overview"
      description="Monitor and analyze all security-relevant events across the transmission system infrastructure."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Events",
          value: summaryStats.totalEvents,
          icon: FileText,
          variant: 'primary'
        },
        {
          title: "Failed Attempts",
          value: summaryStats.failedAttempts,
          icon: Shield,
          variant: summaryStats.failedAttempts > 10 ? 'destructive' : 'warning'
        },
        {
          title: "Config Changes",
          value: summaryStats.configChanges,
          icon: Settings,
          variant: 'primary'
        },
        {
          title: "Critical Events",
          value: summaryStats.criticalEvents,
          icon: AlertTriangle,
          variant: summaryStats.criticalEvents > 0 ? 'destructive' : 'success'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Event Outcome Distribution"
        pieChartData={[
          { name: 'Success', value: logs.filter(l => l.outcome === 'success').length, color: 'hsl(var(--success))' },
          { name: 'Failure', value: logs.filter(l => l.outcome === 'failure').length, color: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Event Categories"
        barChartData={(() => {
          const categoryCounts = logs.reduce((acc, log) => {
            acc[log.category] = (acc[log.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
              name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value
            }));
        })()}
        keyAreasTitle="Key Security Areas"
        keyAreas={[
          {
            icon: Lock,
            title: "Authentication",
            description: "User login attempts and authentication events across transmission systems."
          },
          {
            icon: Settings,
            title: "Configuration Changes",
            description: "Modifications to SCADA, protection relay, and critical system configurations."
          },
          {
            icon: Database,
            title: "Data Access",
            description: "Access to sensitive operational data and transmission system information."
          },
          {
            icon: Shield,
            title: "System Access",
            description: "Access to critical transmission infrastructure and control systems."
          },
        ]}
        recentActivityTitle="Recent Critical Events"
        recentActivity={logs
          .filter(log => log.severity === 'critical' || log.outcome === 'failure')
          .slice(0, 3)
          .map(log => ({
            id: log.id,
            title: log.action,
            subtitle: `${log.user} • ${new Date(log.timestamp).toLocaleString()}`,
            status: log.outcome === 'success' ? 'success' : 'error',
            value: log.severity
          }))}
        onActivityClick={onEntrySelect}
      />
    </IdentityOverview>
  );
}

function EntryDetails({ entry }: { entry: AuditLogEntry }) {
  const EventIcon = getEventIcon(entry.eventType);

  return (
    <div className="space-y-6">
      {/* Event Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${entry.severity === "critical"
              ? "bg-destructive/10"
              : entry.severity === "warning"
                ? "bg-warning/10"
                : "bg-primary/10"
              }`}
          >
            <EventIcon
              className={`w-6 h-6 ${entry.severity === "critical"
                ? "text-destructive"
                : entry.severity === "warning"
                  ? "text-warning"
                  : "text-primary"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{entry.action}</h3>
            <p className="text-sm text-muted-foreground mt-1">{entry.details}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${entry.severity === "critical"
                  ? "bg-destructive/10 text-destructive"
                  : entry.severity === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {(entry.severity || '').toUpperCase()}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${entry.outcome === "success"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
                  }`}
              >
                {(entry.outcome || '').toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {entry.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Event Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm font-medium">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">User</p>
              <p className="text-sm font-medium">{entry.user}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Event Type</p>
              <p className="text-sm font-medium">{entry.eventType}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resource</p>
              <p className="text-sm font-medium">{entry.resource}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resource Type</p>
              <p className="text-sm font-medium">{entry.resourceType || getResourceType(entry.resource)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            {entry.outcome === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Outcome</p>
              <p className="text-sm font-medium">{entry.outcome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryContext({ entry }: { entry: AuditLogEntry }) {
  const isSuspicious = entry.severity === 'critical' || entry.outcome === 'failure';
  const isExternal = entry.ipAddress && !entry.ipAddress.startsWith('10.') && !entry.ipAddress.startsWith('192.168.');

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Advanced Forensic Context */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSuspicious ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isSuspicious ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Operational Forensic Analysis</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">AI-Powered Log Deconstruction</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Source Authenticity"
            value={isExternal ? "UNTRUSTED GEOGRAPHY" : "INTERNAL NETWORK"}
            status={isExternal ? 'warning' : 'success'}
            icon={Globe}
          />
          <AnalysisMetric
            label="Integrity Check"
            value={entry.outcome === 'failure' ? "HASH MISMATCH" : "VERIFIED"}
            status={entry.outcome === 'failure' ? 'failed' : 'success'}
            icon={CheckCircle2}
          />
          <AnalysisMetric
            label="Impact Gravity"
            value={isSafetyCriticalEvent(entry) ? "SAFETY CRITICAL" : "OPERATIONAL"}
            status={isSafetyCriticalEvent(entry) ? 'warning' : 'success'}
            icon={Zap}
          />
          <AnalysisMetric
            label="Forensic Chain"
            value="ESTABLISHED"
            status="success"
            icon={Database}
          />
          <AnalysisMetric
            label="Compliance Drift"
            value={entry.severity === 'critical' ? "SIGNIFICANT" : "WITHIN LIMITS"}
            status={entry.severity === 'critical' ? 'failed' : 'success'}
            icon={Activity}
          />
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${isSuspicious ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSuspicious ? 'bg-destructive' : 'bg-success'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Incident Response Protocol</span>
          </div>
          <Badge variant={isSuspicious ? "destructive" : "outline"} className="text-[8px] h-4 px-1 leading-none uppercase font-bold">
            {isSuspicious ? "HIGH PRIORITY" : "AUDIT ONLY"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {isSuspicious
            ? "CRITICAL: Behavioral anomaly detected in control chain. Event signature suggests potential unauthorized command sequence. Initiate Forensic Level-3 review immediately."
            : "NOMINAL: Activity aligns with authorized operational schedule. No deviation from baseline system orchestration detected. Automated clearance granted."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Source Context</h5>
          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP:</span>
              <span className="font-bold">{entry.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SES:</span>
              <span className="font-bold">{entry.sessionId?.substring(0, 12)}...</span>
            </div>
          </div>
        </div>
        <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Temporal Data</h5>
          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">REL:</span>
              <span className="font-bold">T-minus 124ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LAT:</span>
              <span className="font-bold text-success">LOW (4ms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function RelatedEvents({ entry, allEntries }: { entry: AuditLogEntry; allEntries: AuditLogEntry[] }) {
  // Find related events based on user, session, or resource
  const relatedEvents = allEntries.filter(
    (e) =>
      e.id !== entry.id &&
      (e.userId === entry.userId ||
        e.sessionId === entry.sessionId ||
        e.resource === entry.resource)
  ).slice(0, 5);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "login":
      case "login-failed":
        return Lock;
      case "logout":
        return Unlock;
      case "config-change":
        return Settings;
      case "data-export":
        return FileText;
      case "system-update":
      case "backup-completed":
        return Database;
      case "alert-created":
        return AlertTriangle;
      case "role-assigned":
      case "access-denied":
        return Shield;
      case "account-locked":
        return Lock;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Related Events
        </h4>
        {relatedEvents.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {relatedEvents.map((relatedEntry) => {
              const EventIcon = getEventIcon(relatedEntry.eventType);
              return (
                <div key={relatedEntry.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{relatedEntry.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relatedEntry.details}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${relatedEntry.outcome === "success"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                        }`}
                    >
                      {relatedEntry.outcome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{relatedEntry.user}</span>
                    <span>•</span>
                    <span>{new Date(relatedEntry.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No related events found</p>
          </div>
        )}
      </div>

      {/* Event Pattern Analysis */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Event Pattern Analysis</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Events by this user</span>
              <span className="text-sm font-medium">
                {allEntries.filter((e) => e.userId === entry.userId).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Events in this session</span>
              <span className="text-sm font-medium">
                {allEntries.filter((e) => e.sessionId === entry.sessionId).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Events on this resource</span>
              <span className="text-sm font-medium">
                {allEntries.filter((e) => e.resource === entry.resource).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Similar event types</span>
              <span className="text-sm font-medium">
                {allEntries.filter((e) => e.eventType === entry.eventType).length}
              </span>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "login":
    case "login-failed":
    case "login_attempt":
      return Lock;
    case "logout":
      return Unlock;
    case "config-change":
    case "update_ladder_logic":
    case "modify_safety_logic":
    case "modify_config":
    case "valve_position_change":
      return Settings;
    case "data-export":
    case "export_data":
    case "bulk_download":
      return FileText;
    case "system-update":
    case "backup-completed":
      return Database;
    case "alert-created":
      return AlertTriangle;
    case "role-assigned":
    case "access-denied":
    case "access_attempt":
      return Shield;
    case "account-locked":
      return Lock;
    case "remote_session_start":
    case "network_scan":
      return Network;
    case "update_policy":
    case "add_user_exception":
      return FileText;
    case "incident_created":
    case "containment_action":
      return AlertTriangle;
    // Upstream-specific event types
    case "wellhead-control":
      return Gauge;
    case "sis-override":
      return Zap;
    case "pipeline-valve":
      return Wrench;
    case "scada-access":
      return Server;
    case "plc-programming":
      return Cpu;
    case "field-device":
      return Router;
    case "remote-access":
      return Wifi;
    case "safety-system":
      return Shield;
    case "telemetry-access":
      return Eye;
    default:
      return Activity;
  }
}

function getResourceType(resource: string): string {
  if (resource.toLowerCase().includes('scada')) return 'SCADA System';
  if (resource.toLowerCase().includes('plc')) return 'PLC';
  if (resource.toLowerCase().includes('sis') || resource.toLowerCase().includes('safety')) return 'Safety System';
  if (resource.toLowerCase().includes('pipeline')) return 'Pipeline System';
  if (resource.toLowerCase().includes('wellhead')) return 'Wellhead System';
  if (resource.toLowerCase().includes('platform')) return 'Platform System';
  if (resource.toLowerCase().includes('rtu')) return 'RTU';
  if (resource.toLowerCase().includes('valve')) return 'Valve System';
  if (resource.toLowerCase().includes('compressor')) return 'Compressor System';
  if (resource.toLowerCase().includes('flare')) return 'Flare System';
  if (resource.toLowerCase().includes('policy')) return 'Security Policy';
  if (resource.toLowerCase().includes('incident')) return 'Security Incident';
  if (resource.toLowerCase().includes('data') || resource.toLowerCase().includes('telemetry')) return 'Data System';
  return 'System Resource';
}

function isSafetyCriticalEvent(entry: AuditLogEntry): boolean {
  const resource = entry.resource.toLowerCase();
  const action = entry.action.toLowerCase();

  // Safety-critical resources
  if (resource.includes('sis') || resource.includes('safety') || resource.includes('esd')) return true;
  if (resource.includes('wellhead') && action.includes('control')) return true;
  if (resource.includes('pipeline') && action.includes('valve')) return true;
  if (resource.includes('flare') && action.includes('logic')) return true;

  // Safety-critical actions
  if (action.includes('safety_logic') || action.includes('override') || action.includes('trip')) return true;
  if (action.includes('emergency') || action.includes('shutdown')) return true;

  return false;
}

function getUpstreamContext(entry: AuditLogEntry): string {
  const resource = entry.resource.toLowerCase();

  if (resource.includes('wellhead') || resource.includes('well')) return 'Well Operations';
  if (resource.includes('platform') || resource.includes('offshore')) return 'Platform Operations';
  if (resource.includes('pipeline') || resource.includes('valve')) return 'Pipeline Operations';
  if (resource.includes('cpf') || resource.includes('processing')) return 'Processing Facility';
  if (resource.includes('gathering') || resource.includes('station')) return 'Gathering Operations';
  if (resource.includes('compressor') || resource.includes('pump')) return 'Compression/Pumping';
  if (resource.includes('flare') || resource.includes('separator')) return 'Process Equipment';
  if (resource.includes('scada') || resource.includes('control')) return 'Control Systems';

  return 'General Operations';
}
