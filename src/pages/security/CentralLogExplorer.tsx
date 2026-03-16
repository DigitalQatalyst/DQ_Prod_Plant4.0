import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Search,
  Filter,
  Clock,
  Server,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Database,
  Network,
  Cpu,
  Router,
  Gauge,
  Zap,
  Wrench,
  Shield,
  Eye,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  Fingerprint,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { searchAuditLogs } from "@/lib/loggingForensicsQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import type {
  SecurityAuditLogEntry as SupabaseLogEntry,
  LogSearchQuery
} from "@/types/security";
import { getSecurityAuditEntriesByTenant } from "@/data/upstreamSecurityMockData";
import { useEffect } from "react";
import type { SecurityAuditEntry } from "@/types/security";
import { Badge } from "@/components/ui/badge";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details: string;
  category: string;
  tags: string[];
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  sourceIp?: string;
}

export function CentralLogExplorer() {
  const { currentTenant } = useApp();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseToFrontend = (s: SupabaseLogEntry): LogEntry => {
    return {
      id: s.id,
      timestamp: s.eventTimestamp,
      source: s.sourceIp || 'Internal System',
      level: ((s.severity === 'critical' || s.severity === 'high' ? 'error' :
        s.severity === 'warning' ? 'warning' : 'info') as 'info' | 'warning' | 'error' | 'debug'),
      message: s.eventName,
      details: s.eventDescription || '',
      category: s.eventCategory,
      tags: [s.eventType],
      correlationId: s.id,
      userId: s.userId,
      sourceIp: s.sourceIp
    };
  };

  useEffect(() => {
    async function fetchLogs() {
      console.log('[LogDebug] CentralLogExplorer: Fetching logs for tenant:', currentTenant.id);
      setLoading(true);
      setError(null);
      try {
        const query: LogSearchQuery = {
          tenantId: currentTenant.id
        };
        const result = await searchAuditLogs(query);
        console.log('[LogDebug] CentralLogExplorer: Received logs:', result.logs.length);
        if (result.logs.length > 0) {
          const mapped = result.logs.map(mapSupabaseToFrontend);
          console.log('[LogDebug] CentralLogExplorer: Mapped logs:', mapped.length);
          if (mapped.length > 0) {
            console.log('[LogDebug] First mapped log keys:', Object.keys(mapped[0]));
            console.log('[LogDebug] First mapped log timestamp:', mapped[0].timestamp);
          }
          setLogs(mapped);
        } else {
          // Fallback to mock data conversion if Supabase is empty
          console.log('[LogDebug] CentralLogExplorer: Supabase empty, trying mock fallback');
          const auditEntries = getSecurityAuditEntriesByTenant(currentTenant.id);
          console.log('[LogDebug] CentralLogExplorer: Mock entries found:', auditEntries.length);
          const converted = auditEntries.map(entry => ({
            id: entry.id,
            timestamp: entry.timestamp,
            source: getLogSource(entry.resource),
            level: (entry.outcome === 'failure' ? 'error' :
              entry.riskLevel === 'high' ? 'warning' : 'info') as 'info' | 'warning' | 'error' | 'debug',
            message: `${entry.action}: ${entry.resource}`,
            details: entry.details,
            category: entry.eventType,
            tags: getLogTags(entry),
            correlationId: entry.id,
            userId: entry.userId,
            sourceIp: entry.sourceIp
          }));
          setLogs(converted);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [currentTenant.id]);

  const [selectedLogId, setSelectedLogId] = useState<string | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Filter and sort log entries
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    // Apply time range filter
    const now = new Date();

    if (timeRange !== "all") {
      const timeRangeMs = {
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      }[timeRange] || 24 * 60 * 60 * 1000;

      result = result.filter(log => {
        const logDate = new Date(log.timestamp);
        const ageMs = now.getTime() - logDate.getTime();
        return ageMs <= timeRangeMs;
      });
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      result = result.filter(log =>
        log.source.toLowerCase().includes(sourceFilter.toLowerCase())
      );
    }

    // Apply level filter
    if (levelFilter !== "all") {
      result = result.filter(log => log.level === levelFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(log => log.category === categoryFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        log.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "timestamp") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "level") {
        const levelOrder = { error: 0, warning: 1, info: 2, debug: 3 };
        return levelOrder[a.level] - levelOrder[b.level];
      }
      if (sortBy === "source") {
        return a.source.localeCompare(b.source);
      }
      return 0;
    });

    return result;
  }, [logs, sourceFilter, levelFilter, categoryFilter, searchTerm, timeRange, sortBy]);

  // Removed auto-selection to allow for Feature Overview
  /*
  useEffect(() => {
    if (filteredLogs.length > 0 && !selectedLogId) {
      setSelectedLogId(filteredLogs[0].id);
    }
  }, [filteredLogs]);
  */

  const selectedLog = logs.find(log => log.id === selectedLogId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalLogs = filteredAndSortedLogs.length;
    const errorLogs = filteredAndSortedLogs.filter(log => log.level === "error").length;
    const warningLogs = filteredAndSortedLogs.filter(log => log.level === "warning").length;
    const uniqueSources = new Set(filteredAndSortedLogs.map(log => log.source)).size;

    return {
      totalLogs,
      errorLogs,
      warningLogs,
      uniqueSources,
    };
  }, [filteredAndSortedLogs]);

  const tabs = selectedLog
    ? [
      {
        id: "details",
        label: "Log Details",
        content: <LogDetails log={selectedLog} />,
      },
      {
        id: "context",
        label: "Context",
        content: <LogContext log={selectedLog} />,
      },
      {
        id: "correlation",
        label: "Correlated Events",
        content: <CorrelatedEvents log={selectedLog} allLogs={logs} />,
      },
      {
        id: "raw",
        label: "Raw Data",
        content: <RawLogData log={selectedLog} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <CentralLogOverview logs={logs} filteredLogs={filteredAndSortedLogs} summaryStats={summaryStats} onLogSelect={setSelectedLogId} />,
      }
    ];

  const getLogIcon = (source: string, level: string) => {
    if (level === "error") return XCircle;
    if (level === "warning") return AlertTriangle;

    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('scada')) return Server;
    if (sourceLower.includes('sis') || sourceLower.includes('safety')) return Zap;
    if (sourceLower.includes('pipeline')) return Wrench;
    if (sourceLower.includes('plc') || sourceLower.includes('wellhead')) return Cpu;
    if (sourceLower.includes('rtu') || sourceLower.includes('gateway')) return Router;
    if (sourceLower.includes('firewall') || sourceLower.includes('security')) return Shield;
    if (sourceLower.includes('historian') || sourceLower.includes('database')) return Database;
    if (sourceLower.includes('network')) return Network;
    if (sourceLower.includes('sensor') || sourceLower.includes('gauge')) return Gauge;

    return Activity;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-primary";
      case "debug":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-destructive/10 text-destructive";
      case "warning":
        return "bg-warning/10 text-warning";
      case "info":
        return "bg-primary/10 text-primary";
      case "debug":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  // Get unique values for filters
  const uniqueSources = [...new Set(logs.map(log => log.source))];
  const uniqueCategories = [...new Set(logs.map(log => log.category))];

  return (
    <>
      <ListPane
        title="Central Log Explorer"
        context="DEWA – Transmission"
        count={filteredAndSortedLogs.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "timeRange", label: "Time Range", value: timeRange, options: [
              { label: "Last Hour", value: "1h" },
              { label: "Last 6 Hours", value: "6h" },
              { label: "Last 24 Hours", value: "24h" },
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
              { label: "All Time", value: "all" },
            ], onChange: setTimeRange
          },
          {
            key: "level", label: "Log Level", value: levelFilter, options: [
              { label: "All Levels", value: "all" },
              { label: "Error", value: "error" },
              { label: "Warning", value: "warning" },
              { label: "Info", value: "info" },
              { label: "Debug", value: "debug" },
            ], onChange: setLevelFilter
          }
        ]}
        sortOptions={[
          { label: "Timestamp (Newest)", value: "timestamp" },
          { label: "Log Level", value: "level" },
          { label: "Source System", value: "source" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {/* Log Entries */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-50">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading logs...</p>
          </div>
        ) : filteredAndSortedLogs.length > 0 ? (
          filteredAndSortedLogs.map((log) => (
            <ListPaneItem
              key={log.id}
              title={log.message}
              description={log.details}
              status={log.level === 'error' ? 'offline' : (log.level === 'warning' ? 'maintenance' : 'online')}
              category={log.source}
              value={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              isSelected={selectedLogId === log.id}
              onClick={() => setSelectedLogId(log.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center opacity-50">
            <Search className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">No log entries found</p>
          </div>
        )}
      </ListPane>

      <WorkPane
        title={selectedLog ? selectedLog.message : "Central Log Overview"}
        subtitle={selectedLog ? `${selectedLog.source} - ${selectedLog.level}` : "Global log aggregation and forensic analysis across all transmission systems"}
        tabs={tabs}
      >
        {selectedLog ? (
          <LogDetails log={selectedLog} />
        ) : (
          <CentralLogOverview
            logs={logs}
            filteredLogs={filteredAndSortedLogs}
            summaryStats={summaryStats}
            onLogSelect={setSelectedLogId}
          />
        )}
      </WorkPane>
    </>
  );
}

function CentralLogOverview({
  logs,
  filteredLogs,
  summaryStats,
  onLogSelect
}: {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  summaryStats: any;
  onLogSelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Central Log Overview"
      description="Unified real-time visibility into application, system, and security logs across the entire transmission infrastructure."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Logs",
          value: summaryStats.totalLogs,
          icon: FileText,
          variant: 'primary'
        },
        {
          title: "Active Sources",
          value: summaryStats.uniqueSources,
          icon: Server,
          variant: 'primary'
        },
        {
          title: "Error Rate",
          value: summaryStats.totalLogs > 0 ? `${Math.round((summaryStats.errorLogs / summaryStats.totalLogs) * 100)}%` : '0%',
          icon: XCircle,
          variant: summaryStats.errorLogs > 0 ? 'destructive' : 'success'
        },
        {
          title: "Warning Rate",
          value: summaryStats.totalLogs > 0 ? `${Math.round((summaryStats.warningLogs / summaryStats.totalLogs) * 100)}%` : '0%',
          icon: AlertTriangle,
          variant: summaryStats.warningLogs > 0 ? 'warning' : 'success'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Log Level Distribution"
        pieChartData={[
          { name: 'Error', value: summaryStats.errorLogs, color: 'hsl(var(--destructive))' },
          { name: 'Warning', value: summaryStats.warningLogs, color: 'hsl(var(--warning))' },
          { name: 'Info', value: filteredLogs.filter(l => l.level === 'info').length, color: 'hsl(var(--primary))' },
          { name: 'Debug', value: filteredLogs.filter(l => l.level === 'debug').length, color: 'hsl(var(--muted))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Log Sources"
        barChartData={(() => {
          const sourceCounts = filteredLogs.reduce((acc, log) => {
            acc[log.source] = (acc[log.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
        })()}
        keyAreasTitle="Key Monitoring Areas"
        keyAreas={[
          {
            icon: Shield,
            title: "Security Events",
            description: "Authentication attempts, privilege escalations, and access violations."
          },
          {
            icon: Network,
            title: "Communication Traces",
            description: "Industrial protocol traffic logs and network connection audits."
          },
          {
            icon: Activity,
            title: "Forensic Data",
            description: "Detailed breakdown of anomalous events for incident investigation."
          },
          {
            icon: RefreshCw,
            title: "System Logs",
            description: "Operational health and performance metrics from across the grid."
          },
        ]}
        recentActivityTitle="Recent Critical Logs"
        recentActivity={filteredLogs
          .filter(l => l.level === 'error')
          .slice(0, 3)
          .map(log => ({
            id: log.id,
            title: log.message,
            subtitle: `${log.source} • ${new Date(log.timestamp).toLocaleString()}`,
            status: 'error',
            value: log.category
          }))}
        onActivityClick={onLogSelect}
      />
    </IdentityOverview>
  );
}

function LogDetails({ log }: { log: LogEntry }) {
  const LogIcon = getLogIcon(log.source, log.level);

  return (
    <div className="space-y-6">
      {/* Log Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${log.level === "error"
              ? "bg-destructive/10"
              : log.level === "warning"
                ? "bg-warning/10"
                : "bg-primary/10"
              }`}
          >
            <LogIcon
              className={`w-6 h-6 ${log.level === "error"
                ? "text-destructive"
                : log.level === "warning"
                  ? "text-warning"
                  : "text-primary"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{log.message}</h3>
            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${log.level === "error"
                  ? "bg-destructive/10 text-destructive"
                  : log.level === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {log.level.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {log.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Server className="w-3 h-3" />
                {log.source}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Log Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm font-medium">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Server className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Source System</p>
              <p className="text-sm font-medium">{log.source}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{log.category}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Log Level</p>
              <p className="text-sm font-medium">{log.level}</p>
            </div>
          </div>
          {log.correlationId && (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Correlation ID</p>
                <p className="text-sm font-medium font-mono">{log.correlationId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {log.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Tags</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {log.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogContext({ log }: { log: LogEntry }) {
  const isSuspicious = log.level === 'error' || log.level === 'warning';
  const isExternal = log.sourceIp && !log.sourceIp.startsWith('10.') && !log.sourceIp.startsWith('192.168.');

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Advanced System Context */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSuspicious ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isSuspicious ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Operational System Analysis</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">AI-Powered Log Deconstruction</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Source Authenticity"
            value={isExternal ? "UNTRUSTED IP" : "SECURE INTRANET"}
            status={isExternal ? 'warning' : 'success'}
            icon={Globe}
          />
          <AnalysisMetric
            label="System Criticality"
            value={getSystemCriticality(log.source).toUpperCase()}
            status={getSystemCriticality(log.source) === 'Safety Critical' ? 'failed' : getSystemCriticality(log.source) === 'High' ? 'warning' : 'success'}
            icon={Zap}
          />
          <AnalysisMetric
            label="Network Zone"
            value={getNetworkZone(log.source).toUpperCase()}
            status="success"
            icon={Network}
          />
          <AnalysisMetric
            label="Event frequency"
            value={getEventFrequency(log.category).split(' ')[0].toUpperCase()}
            status="success"
            icon={Activity}
          />
          <AnalysisMetric
            label="Business Impact"
            value={getBusinessImpact(log.level, log.source).split(' - ')[0].toUpperCase()}
            status={log.level === 'error' ? 'failed' : 'success'}
            icon={Database}
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
            ? `CRITICAL: Behavioral anomaly detected in ${getNetworkZone(log.source)}. Event signature suggests potential ${getBusinessImpact(log.level, log.source)}. Manual identity verification required.`
            : `ROUTINE: Access pattern aligns with historical baseline for ${getSystemType(log.source)}. Event recorded in operational profile for ${getUpstreamContext(log.source, log.message)}.`}
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


function CorrelatedEvents({ log, allLogs }: { log: LogEntry; allLogs: LogEntry[] }) {
  // Find correlated events based on correlation ID, user, or time proximity
  const correlatedEvents = allLogs.filter(
    (l) =>
      l.id !== log.id &&
      (l.correlationId === log.correlationId ||
        l.userId === log.userId ||
        (Math.abs(new Date(l.timestamp).getTime() - new Date(log.timestamp).getTime()) < 5 * 60 * 1000 &&
          l.source === log.source))
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Correlated Events
        </h4>
        {correlatedEvents.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {correlatedEvents.map((correlatedLog) => {
              const LogIcon = getLogIcon(correlatedLog.source, correlatedLog.level);
              return (
                <div key={correlatedLog.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <LogIcon className={`w-4 h-4 mt-0.5 ${getLevelColor(correlatedLog.level)}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{correlatedLog.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {correlatedLog.details}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${getLevelBadgeColor(correlatedLog.level)}`}
                        >
                          {correlatedLog.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{correlatedLog.source}</span>
                        <span>•</span>
                        <span>{new Date(correlatedLog.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No correlated events found</p>
          </div>
        )}
      </div>

      {/* Event Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Event Timeline</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Events in last hour</span>
              <span className="text-sm font-medium">
                {allLogs.filter(l =>
                  new Date().getTime() - new Date(l.timestamp).getTime() < 60 * 60 * 1000 &&
                  l.source === log.source
                ).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Similar events today</span>
              <span className="text-sm font-medium">
                {allLogs.filter(l =>
                  l.category === log.category &&
                  new Date(l.timestamp).toDateString() === new Date(log.timestamp).toDateString()
                ).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Same source events</span>
              <span className="text-sm font-medium">
                {allLogs.filter(l => l.source === log.source).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RawLogData({ log }: { log: LogEntry }) {
  const rawData = {
    id: log.id,
    timestamp: log.timestamp,
    source: log.source,
    level: log.level,
    message: log.message,
    details: log.details,
    category: log.category,
    tags: log.tags,
    ...(log.correlationId && { correlationId: log.correlationId }),
    ...(log.userId && { userId: log.userId }),
    ...(log.sessionId && { sessionId: log.sessionId }),
    ...(log.sourceIp && { sourceIp: log.sourceIp }),
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Raw Log Data
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
          <Download className="w-3 h-3" />
          Export Log
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}

// Helper functions
function getLogSource(resource: string): string {
  const resourceLower = resource.toLowerCase();

  if (resourceLower.includes('scada')) return 'SCADA Master';
  if (resourceLower.includes('sis') || resourceLower.includes('safety')) return 'SIS Controller';
  if (resourceLower.includes('pipeline')) return 'Pipeline Control';
  if (resourceLower.includes('wellhead') || resourceLower.includes('plc')) return 'Wellhead PLC';
  if (resourceLower.includes('rtu')) return 'RTU Gateway';
  if (resourceLower.includes('dcs')) return 'DCS System';
  if (resourceLower.includes('firewall')) return 'OT Firewall';
  if (resourceLower.includes('historian')) return 'Data Historian';
  if (resourceLower.includes('gateway')) return 'Field Gateway';

  return 'System';
}

function getLogTags(entry: SecurityAuditEntry): string[] {
  const tags: string[] = [];

  const resource = entry.resource.toLowerCase();
  const action = entry.action.toLowerCase();

  // Resource-based tags
  if (resource.includes('scada')) tags.push('scada');
  if (resource.includes('sis') || resource.includes('safety')) tags.push('sis', 'safety');
  if (resource.includes('pipeline')) tags.push('pipeline');
  if (resource.includes('wellhead')) tags.push('wellhead');
  if (resource.includes('plc')) tags.push('plc');
  if (resource.includes('rtu')) tags.push('rtu');
  if (resource.includes('valve')) tags.push('valve');

  // Action-based tags
  if (action.includes('login')) tags.push('authentication');
  if (action.includes('config') || action.includes('modify')) tags.push('configuration');
  if (action.includes('logic')) tags.push('logic-change');
  if (action.includes('position')) tags.push('position-change');
  if (action.includes('access')) tags.push('access-control');

  // Risk-based tags
  if (entry.riskLevel === 'high') tags.push('high-risk');
  if (entry.outcome === 'failure') tags.push('failed');

  return tags;
}

function getLogIcon(source: string, level: string) {
  if (level === "error") return XCircle;
  if (level === "warning") return AlertTriangle;

  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('scada')) return Server;
  if (sourceLower.includes('sis') || sourceLower.includes('safety')) return Zap;
  if (sourceLower.includes('pipeline')) return Wrench;
  if (sourceLower.includes('plc') || sourceLower.includes('wellhead')) return Cpu;
  if (sourceLower.includes('rtu') || sourceLower.includes('gateway')) return Router;
  if (sourceLower.includes('firewall') || sourceLower.includes('security')) return Shield;
  if (sourceLower.includes('historian') || sourceLower.includes('database')) return Database;
  if (sourceLower.includes('network')) return Network;
  if (sourceLower.includes('sensor') || sourceLower.includes('gauge')) return Gauge;

  return Activity;
}

function getLevelColor(level: string) {
  switch (level) {
    case "error":
      return "text-destructive";
    case "warning":
      return "text-warning";
    case "info":
      return "text-primary";
    case "debug":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

function getLevelBadgeColor(level: string) {
  switch (level) {
    case "error":
      return "bg-destructive/10 text-destructive";
    case "warning":
      return "bg-warning/10 text-warning";
    case "info":
      return "bg-primary/10 text-primary";
    case "debug":
      return "bg-secondary text-muted-foreground";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function getSystemType(source: string): string {
  const sourceLower = source.toLowerCase();

  if (sourceLower.includes('scada')) return 'SCADA System';
  if (sourceLower.includes('sis') || sourceLower.includes('safety')) return 'Safety Instrumented System';
  if (sourceLower.includes('pipeline')) return 'Pipeline Control System';
  if (sourceLower.includes('plc') || sourceLower.includes('wellhead')) return 'Programmable Logic Controller';
  if (sourceLower.includes('rtu')) return 'Remote Terminal Unit';
  if (sourceLower.includes('dcs')) return 'Distributed Control System';
  if (sourceLower.includes('firewall')) return 'Network Security Device';
  if (sourceLower.includes('historian')) return 'Data Historian';
  if (sourceLower.includes('gateway')) return 'Communication Gateway';

  return 'Industrial Control System';
}

function getSystemCriticality(source: string): string {
  const sourceLower = source.toLowerCase();

  if (sourceLower.includes('sis') || sourceLower.includes('safety')) return 'Safety Critical';
  if (sourceLower.includes('wellhead') || sourceLower.includes('pipeline')) return 'Production Critical';
  if (sourceLower.includes('scada') || sourceLower.includes('dcs')) return 'High';
  if (sourceLower.includes('firewall') || sourceLower.includes('security')) return 'High';

  return 'Medium';
}

function getNetworkZone(source: string): string {
  const sourceLower = source.toLowerCase();

  if (sourceLower.includes('sis') || sourceLower.includes('safety')) return 'Safety Zone';
  if (sourceLower.includes('scada') || sourceLower.includes('dcs')) return 'Control Zone';
  if (sourceLower.includes('wellhead') || sourceLower.includes('plc') || sourceLower.includes('rtu')) return 'Field Zone';
  if (sourceLower.includes('firewall') || sourceLower.includes('gateway')) return 'DMZ';
  if (sourceLower.includes('historian')) return 'Enterprise Zone';

  return 'Control Zone';
}

function getEventFrequency(category: string): string {
  switch (category) {
    case 'telemetry':
    case 'data-collection':
      return 'High (Continuous)';
    case 'authentication':
    case 'system-access':
      return 'Medium (Hourly)';
    case 'configuration-change':
    case 'valve-control':
      return 'Low (Daily)';
    case 'safety-alarm':
    case 'security-block':
      return 'Variable (Event-driven)';
    default:
      return 'Medium';
  }
}

function getBusinessImpact(level: string, source: string): string {
  if (level === 'error') {
    if (source.toLowerCase().includes('sis') || source.toLowerCase().includes('safety')) {
      return 'Critical - Safety Impact';
    }
    if (source.toLowerCase().includes('wellhead') || source.toLowerCase().includes('pipeline')) {
      return 'High - Production Impact';
    }
    return 'Medium - Operational Impact';
  }

  if (level === 'warning') {
    return 'Low - Monitoring Required';
  }

  return 'Minimal';
}

function getUpstreamContext(source: string, message: string): string {
  const sourceLower = source.toLowerCase();
  const messageLower = message.toLowerCase();

  if (sourceLower.includes('wellhead') || messageLower.includes('well')) return 'Well Operations';
  if (sourceLower.includes('pipeline') || messageLower.includes('pipeline')) return 'Pipeline Operations';
  if (sourceLower.includes('platform') || messageLower.includes('platform')) return 'Platform Operations';
  if (sourceLower.includes('sis') || sourceLower.includes('safety')) return 'Safety Systems';
  if (sourceLower.includes('scada') || sourceLower.includes('control')) return 'Control Systems';
  if (sourceLower.includes('compressor') || messageLower.includes('compressor')) return 'Compression Operations';
  if (sourceLower.includes('separator') || messageLower.includes('separator')) return 'Processing Operations';

  return 'General Operations';
}