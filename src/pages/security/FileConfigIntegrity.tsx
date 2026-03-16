import { getFileIntegrityMonitors, getFileIntegrityViolations } from "@/lib/loggingForensicsQueries";
import type {
  FileIntegrityMonitor as SupabaseMonitor,
  FileIntegrityViolation as SupabaseViolation
} from "@/types/security";
import { useApp } from "@/context/AppContext";
import { useEffect, useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";

import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  FileText,
  Hash,
  History,
  Lock,
  RefreshCw,
  Router,
  Server,
  Settings,
  Shield,
  XCircle,
  Zap
} from "lucide-react";

interface FileIntegrityMonitor {
  id: string;
  tenantId: string;
  filePath: string;
  fileName: string;
  fileType: 'gateway-config' | 'sis-config' | 'plc-program' | 'scada-config' |
  'firewall-rules' | 'network-config' | 'safety-logic' | 'control-logic' | 'system-config';
  systemName: string;
  systemType: 'gateway' | 'sis' | 'plc' | 'scada' | 'firewall' | 'rtu' | 'dcs';
  siteId: string;
  siteName: string;
  integrityStatus: 'verified' | 'modified' | 'corrupted' | 'missing' | 'unknown';
  lastCheck: string;
  lastModified: string;
  baselineHash: string;
  currentHash: string;
  hashAlgorithm: 'SHA-256' | 'MD5' | 'SHA-1';
  fileSize: number; // in bytes
  permissions: string;
  owner: string;
  criticality: 'safety-critical' | 'production-critical' | 'high' | 'medium' | 'low';
  monitoringEnabled: boolean;
  alertOnChange: boolean;
  backupAvailable: boolean;
  lastBackup?: string;
  changeHistory: IntegrityChange[];
}

interface IntegrityChange {
  id: string;
  timestamp: string;
  changeType: 'modified' | 'created' | 'deleted' | 'restored';
  previousHash: string;
  newHash: string;
  changedBy?: string;
  changeReason?: string;
  approved: boolean;
  approvedBy?: string;
}

export function FileConfigIntegrity() {
  const { currentTenant } = useApp();

  const [monitors, setMonitors] = useState<FileIntegrityMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseToFrontend = (s: SupabaseMonitor, violations: SupabaseViolation[] = []): FileIntegrityMonitor => {
    const monitorViolations = violations
      .filter(v => v.monitorId === s.id)
      .map(v => ({
        id: v.id,
        timestamp: v.detectedTimestamp,
        changeType: (v.violationType === 'unauthorized_modification' || v.violationType === 'hash_mismatch' || v.violationType === 'size_change' || v.violationType === 'permission_change' ? 'modified' :
          v.violationType === 'unexpected_deletion' ? 'deleted' : 'modified') as any,
        previousHash: v.expectedHash,
        newHash: v.actualHash || '',
        changedBy: v.investigatedBy,
        changeReason: v.changeDescription,
        approved: v.investigationStatus === 'authorized',
        approvedBy: v.investigatedBy
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      id: s.id,
      tenantId: s.tenantId,
      filePath: s.filePath,
      fileName: s.monitorName.split(' - ')[1] || s.monitorName,
      fileType: (s.fileType === 'logic' ? 'safety-logic' :
        s.fileType === 'configuration' ? 'system-config' :
          s.fileType === 'parameter' ? 'control-logic' : 'gateway-config') as any,
      systemName: s.systemName,
      systemType: (s.systemType === 'protection_relay' ? 'plc' :
        s.systemType === 'scada_node' ? 'scada' :
          s.systemType === 'rtu' ? 'rtu' : 'gateway') as any,
      siteId: s.siteId || 'unknown',
      siteName: s.monitorName.split(' - ')[0] || 'Unknown Site',
      integrityStatus: (s.integrityStatus === 'intact' ? 'verified' : s.integrityStatus) as any,
      lastCheck: s.lastChecked || s.createdAt,
      lastModified: s.baselineTimestamp,
      baselineHash: s.baselineHash,
      currentHash: s.currentHash || s.baselineHash,
      hashAlgorithm: 'SHA-256',
      fileSize: s.currentSizeBytes || s.baselineSizeBytes,
      permissions: '644',
      owner: 'system',
      criticality: s.criticality as any,
      monitoringEnabled: s.monitoringEnabled,
      alertOnChange: s.alertOnChange,
      backupAvailable: s.autoRestore,
      lastBackup: s.lastChecked,
      changeHistory: monitorViolations
    };
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [monitorsResult, violationsResult] = await Promise.all([
          getFileIntegrityMonitors(currentTenant.id),
          getFileIntegrityViolations(currentTenant.id)
        ]);

        if (monitorsResult.length > 0) {
          setMonitors(monitorsResult.map(m => mapSupabaseToFrontend(m, violationsResult)));
        } else {
          setMonitors([]);
        }
      } catch (err) {
        console.error("Error fetching FIM data:", err);
        setError("Failed to fetch integrity data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentTenant.id]);

  const [selectedMonitorId, setSelectedMonitorId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [systemTypeFilter, setSystemTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("criticality");

  // Filter and sort monitors
  const filteredAndSortedMonitors = useMemo(() => {
    let result = monitors.filter((monitor) => {
      const matchesSearch =
        (monitor.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (monitor.systemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (monitor.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (monitor.filePath || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || monitor.integrityStatus === statusFilter;
      const matchesCriticality = criticalityFilter === "all" || monitor.criticality === criticalityFilter;
      const matchesSystemType = systemTypeFilter === "all" || monitor.systemType === systemTypeFilter;

      return matchesSearch && matchesStatus && matchesCriticality && matchesSystemType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'criticality': {
          const criticalityOrder = { 'safety-critical': 0, 'production-critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
          const criticalityDiff = (criticalityOrder[a.criticality] ?? 5) - (criticalityOrder[b.criticality] ?? 5);
          if (criticalityDiff !== 0) return criticalityDiff;
          const statusOrder = { 'corrupted': 0, 'missing': 1, 'modified': 2, 'unknown': 3, 'verified': 4 };
          return (statusOrder[a.integrityStatus] ?? 5) - (statusOrder[b.integrityStatus] ?? 5);
        }
        case 'status': {
          const statusOrder = { 'corrupted': 0, 'missing': 1, 'modified': 2, 'unknown': 3, 'verified': 4 };
          return (statusOrder[a.integrityStatus] ?? 5) - (statusOrder[b.integrityStatus] ?? 5);
        }
        case 'name':
          return (a.fileName || '').localeCompare(b.fileName || '');
        case 'system':
          return (a.systemName || '').localeCompare(b.systemName || '');
        case 'lastCheck':
          return new Date(b.lastCheck).getTime() - new Date(a.lastCheck).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [monitors, searchTerm, statusFilter, criticalityFilter, systemTypeFilter, sortBy]);

  /*
  useEffect(() => {
    if (filteredMonitors.length > 0 && !selectedMonitorId) {
      setSelectedMonitorId(filteredMonitors[0].id);
    }
  }, [filteredMonitors]);
  */

  const selectedMonitor = monitors.find((m) => m.id === selectedMonitorId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalFiles = monitors.length;
    if (totalFiles === 0) return {
      totalFiles: 0, verifiedFiles: 0, modifiedFiles: 0, corruptedFiles: 0,
      missingFiles: 0, safetyCriticalFiles: 0, integrityScore: 100
    };

    const verifiedFiles = monitors.filter(m => m.integrityStatus === "verified").length;
    const modifiedFiles = monitors.filter(m => m.integrityStatus === "modified").length;
    const corruptedFiles = monitors.filter(m => m.integrityStatus === "corrupted").length;
    const missingFiles = monitors.filter(m => m.integrityStatus === "missing").length;
    const safetyCriticalFiles = monitors.filter(m => m.criticality === "safety-critical").length;

    return {
      totalFiles,
      verifiedFiles,
      modifiedFiles,
      corruptedFiles,
      missingFiles,
      safetyCriticalFiles,
      integrityScore: Math.round((verifiedFiles / totalFiles) * 100)
    };
  }, [monitors]);

  const tabs = selectedMonitor
    ? [
      {
        id: "details",
        label: "File Details",
        content: <FileDetails monitor={selectedMonitor} />,
      },
      {
        id: "integrity",
        label: "Integrity Status",
        content: <IntegrityStatus monitor={selectedMonitor} />,
      },
      {
        id: "history",
        label: "Change History",
        content: <ChangeHistory monitor={selectedMonitor} />,
      },
      {
        id: "actions",
        label: "Actions",
        content: <IntegrityActions monitor={selectedMonitor} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <FileIntegrityOverview monitors={monitors} summaryStats={summaryStats} onMonitorSelect={setSelectedMonitorId} />,
      }
    ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return CheckCircle2;
      case "modified":
        return AlertTriangle;
      case "corrupted":
        return XCircle;
      case "missing":
        return XCircle;
      case "unknown":
        return Clock;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-success";
      case "modified":
        return "text-warning";
      case "corrupted":
        return "text-destructive";
      case "missing":
        return "text-destructive";
      case "unknown":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success/10 text-success";
      case "modified":
        return "bg-warning/10 text-warning";
      case "corrupted":
        return "bg-destructive/10 text-destructive";
      case "missing":
        return "bg-destructive/10 text-destructive";
      case "unknown":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "safety-critical":
        return "text-destructive";
      case "production-critical":
        return "text-warning";
      case "high":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getSystemIcon = (systemType: string) => {
    switch (systemType) {
      case "sis":
        return Zap;
      case "plc":
        return Cpu;
      case "scada":
        return Server;
      case "gateway":
        return Router;
      case "firewall":
        return Shield;
      case "rtu":
        return Router;
      case "dcs":
        return Database;
      default:
        return Settings;
    }
  };

  return (
    <>
      <ListPane
        title="File & Config Integrity"
        context="DEWA – Transmission"
        count={filteredAndSortedMonitors.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Status" },
              { value: "verified", label: "Verified" },
              { value: "modified", label: "Modified" },
              { value: "corrupted", label: "Corrupted" },
              { value: "missing", label: "Missing" },
              { value: "unknown", label: "Unknown" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "criticality",
            label: "Criticality",
            options: [
              { value: "all", label: "All Criticality" },
              { value: "safety-critical", label: "Safety Critical" },
              { value: "production-critical", label: "Production Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
            value: criticalityFilter,
            onChange: setCriticalityFilter,
          },
          {
            key: "system",
            label: "System Type",
            options: [
              { value: "all", label: "All Systems" },
              { value: "sis", label: "SIS" },
              { value: "plc", label: "PLC" },
              { value: "scada", label: "SCADA" },
              { value: "gateway", label: "Gateway" },
              { value: "firewall", label: "Firewall" },
              { value: "rtu", label: "RTU" },
              { value: "dcs", label: "DCS" },
            ],
            value: systemTypeFilter,
            onChange: setSystemTypeFilter,
          },
        ]}
        sortOptions={[
          { label: 'Criticality', value: 'criticality' },
          { label: 'Integrity Status', value: 'status' },
          { label: 'File Name', value: 'name' },
          { label: 'System Name', value: 'system' },
          { label: 'Last Check', value: 'lastCheck' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedMonitors.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Monitors Found"
              description="No integrity monitors match your current filters"
            />
          ) : (
            filteredAndSortedMonitors.map((monitor) => (
              <ListPaneItem
                key={monitor.id}
                title={monitor.fileName}
                description={`${monitor.systemName} • ${monitor.siteName}`}
                status={monitor.integrityStatus === 'verified' ? 'online' : (monitor.integrityStatus === 'unknown' ? 'maintenance' : 'offline')}
                category={monitor.systemType.toUpperCase()}
                value={monitor.criticality.replace('-critical', '').toUpperCase()}
                isSelected={selectedMonitorId === monitor.id}
                onClick={() => setSelectedMonitorId(monitor.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      {selectedMonitor ? (
        <WorkPane
          title={selectedMonitor.fileName}
          subtitle={`${selectedMonitor.systemName} - ${selectedMonitor.integrityStatus}`}
          tabs={tabs}
        />
      ) : (
        <WorkPane
          title={selectedMonitor ? selectedMonitor.fileName : "File & Config Integrity Overview"}
          subtitle={selectedMonitor ? `${selectedMonitor.systemName} • ${selectedMonitor.siteName}` : "Continuous monitoring of critical transmission system files and safety configurations"}
          tabs={tabs}
        />
      )
      }
    </>
  );
}

function FileIntegrityOverview({
  monitors,
  summaryStats,
  onMonitorSelect
}: {
  monitors: FileIntegrityMonitor[];
  summaryStats: any;
  onMonitorSelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="File & Config Integrity Overview"
      description="Continuous verification of critical configuration files, safety-system logic, and transmission system parameters."
      showTitleCard={false}
      metrics={[
        {
          title: "Integrity Score",
          value: `${summaryStats.integrityScore}%`,
          icon: Activity,
          variant: summaryStats.integrityScore >= 90 ? 'success' : summaryStats.integrityScore >= 70 ? 'warning' : 'destructive'
        },
        {
          title: "Verified Files",
          value: summaryStats.verifiedFiles,
          icon: CheckCircle2,
          variant: 'success'
        },
        {
          title: "Integrity Issues",
          value: summaryStats.corruptedFiles + summaryStats.missingFiles,
          icon: XCircle,
          variant: (summaryStats.corruptedFiles + summaryStats.missingFiles) > 0 ? 'destructive' : 'success'
        },
        {
          title: "Safety Critical",
          value: summaryStats.safetyCriticalFiles,
          icon: Shield,
          variant: 'warning'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Integrity Status Distribution"
        pieChartData={[
          { name: 'Verified', value: summaryStats.verifiedFiles, color: 'hsl(var(--success))' },
          { name: 'Modified', value: summaryStats.modifiedFiles, color: 'hsl(var(--warning))' },
          { name: 'Corrupted', value: summaryStats.corruptedFiles, color: 'hsl(var(--destructive))' },
          { name: 'Missing', value: summaryStats.missingFiles, color: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Systems by Monitored Files"
        barChartData={(() => {
          const systemCounts = monitors.reduce((acc, monitor) => {
            acc[monitor.systemType] = (acc[monitor.systemType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(systemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
              name: name.toUpperCase(),
              value
            }));
        })()}
        keyAreasTitle="Key Integrity Areas"
        keyAreas={[
          {
            icon: Zap,
            title: "Safety-Critical Files",
            description: "Protection relay logic, SIS configurations, and safety system programs."
          },
          {
            icon: Server,
            title: "SCADA Configurations",
            description: "SCADA node configurations, HMI settings, and control system parameters."
          },
          {
            icon: Cpu,
            title: "PLC Programs",
            description: "Programmable logic controller ladder logic and control programs."
          },
          {
            icon: Router,
            title: "Network Configurations",
            description: "Gateway configurations, firewall rules, and network device settings."
          },
        ]}
        recentActivityTitle="Recent Integrity Violations"
        recentActivity={monitors
          .filter(m => m.integrityStatus !== 'verified')
          .slice(0, 3)
          .map(m => ({
            id: m.id,
            title: m.fileName,
            subtitle: `${m.systemName} • ${m.siteName}`,
            status: m.integrityStatus === 'modified' ? 'warning' : 'error',
            value: m.integrityStatus
          }))}
        onActivityClick={onMonitorSelect}
      />
    </IdentityOverview>
  );
}

function FileDetails({ monitor }: { monitor: FileIntegrityMonitor }) {
  const SystemIcon = getSystemIcon(monitor.systemType);

  return (
    <div className="space-y-6">
      {/* File Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${monitor.integrityStatus === "verified"
              ? "bg-success/10"
              : monitor.integrityStatus === "modified"
                ? "bg-warning/10"
                : "bg-destructive/10"
              }`}
          >
            <SystemIcon
              className={`w-6 h-6 ${monitor.integrityStatus === "verified"
                ? "text-success"
                : monitor.integrityStatus === "modified"
                  ? "text-warning"
                  : "text-destructive"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{monitor.fileName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{monitor.filePath}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${monitor.integrityStatus === "verified"
                  ? "bg-success/10 text-success"
                  : monitor.integrityStatus === "modified"
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {monitor.integrityStatus.toUpperCase()}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${monitor.criticality === "safety-critical"
                  ? "bg-destructive/10 text-destructive"
                  : monitor.criticality === "production-critical"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {monitor.criticality.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <SystemIcon className="w-3 h-3" />
                {monitor.systemType.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* File Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">File Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">File Path</p>
              <p className="text-sm font-medium font-mono">{monitor.filePath}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">File Size</p>
              <p className="text-sm font-medium">{formatFileSize(monitor.fileSize)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Permissions</p>
              <p className="text-sm font-medium font-mono">{monitor.permissions}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm font-medium">{monitor.owner}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Modified</p>
              <p className="text-sm font-medium">
                {new Date(monitor.lastModified).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">System Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <SystemIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">System Name</p>
              <p className="text-sm font-medium">{monitor.systemName}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">System Type</p>
              <p className="text-sm font-medium">{monitor.systemType.toUpperCase()}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">File Type</p>
              <p className="text-sm font-medium">{getFileTypeDescription(monitor.fileType)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Site</p>
              <p className="text-sm font-medium">{monitor.siteName}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Criticality</p>
              <p className="text-sm font-medium">{monitor.criticality}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrityStatus({ monitor }: { monitor: FileIntegrityMonitor }) {
  const StatusIcon = getStatusIcon(monitor.integrityStatus);

  return (
    <div className="space-y-6">
      {/* Integrity Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Integrity Status
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <StatusIcon
              className={`w-8 h-8 ${monitor.integrityStatus === "verified"
                ? "text-success"
                : monitor.integrityStatus === "modified"
                  ? "text-warning"
                  : "text-destructive"
                }`}
            />
            <div>
              <p className="text-lg font-semibold capitalize">{monitor.integrityStatus}</p>
              <p className="text-sm text-muted-foreground">
                {getStatusDescription(monitor.integrityStatus)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Check</span>
              <span className="text-sm font-medium">
                {new Date(monitor.lastCheck).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monitoring</span>
              <span className="text-sm font-medium">
                {monitor.monitoringEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alert on Change</span>
              <span className="text-sm font-medium">
                {monitor.alertOnChange ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hash Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Hash Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Hash Algorithm</p>
            <p className="text-sm font-medium">{monitor.hashAlgorithm}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Baseline Hash</p>
            <p className="text-sm font-medium font-mono break-all">{monitor.baselineHash}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Current Hash</p>
            <p className={`text-sm font-medium font-mono break-all ${monitor.currentHash === monitor.baselineHash ? 'text-success' : 'text-destructive'
              }`}>
              {monitor.currentHash || 'N/A (File Missing)'}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Hash Match</p>
            <div className="flex items-center gap-2">
              {monitor.currentHash === monitor.baselineHash ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">Match</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Mismatch</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backup Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Backup Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backup Available</span>
              <span className="text-sm font-medium">
                {monitor.backupAvailable ? "Yes" : "No"}
              </span>
            </div>
          </div>
          {monitor.backupAvailable && monitor.lastBackup && (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Backup</span>
                <span className="text-sm font-medium">
                  {new Date(monitor.lastBackup).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Assessment</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security Risk</span>
              <span className={`text-sm font-medium ${monitor.integrityStatus === 'corrupted' || monitor.integrityStatus === 'missing' ? 'text-destructive' :
                monitor.integrityStatus === 'modified' ? 'text-warning' : 'text-success'
                }`}>
                {monitor.integrityStatus === 'corrupted' || monitor.integrityStatus === 'missing' ? 'High' :
                  monitor.integrityStatus === 'modified' ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operational Impact</span>
              <span className="text-sm font-medium">
                {monitor.criticality === 'safety-critical' ? 'Critical' :
                  monitor.criticality === 'production-critical' ? 'High' : 'Medium'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Requires Action</span>
              <span className="text-sm font-medium">
                {monitor.integrityStatus !== 'verified' ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeHistory({ monitor }: { monitor: FileIntegrityMonitor }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Change History
        </h4>
        {monitor.changeHistory.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {monitor.changeHistory.map((change) => (
              <div key={change.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${change.changeType === 'modified' ? 'bg-warning/10' :
                    change.changeType === 'deleted' ? 'bg-destructive/10' :
                      change.changeType === 'created' ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                    {change.changeType === 'modified' && <AlertTriangle className="w-4 h-4 text-warning" />}
                    {change.changeType === 'deleted' && <XCircle className="w-4 h-4 text-destructive" />}
                    {change.changeType === 'created' && <CheckCircle2 className="w-4 h-4 text-success" />}
                    {change.changeType === 'restored' && <RefreshCw className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium capitalize">{change.changeType}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {change.changeReason || 'No reason provided'}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${change.approved ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}>
                        {change.approved ? 'Approved' : 'Unauthorized'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {change.changedBy && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Changed by: {change.changedBy}</span>
                        </div>
                      )}
                      {change.approvedBy && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Approved by: {change.approvedBy}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(change.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Hash Information */}
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Previous Hash</p>
                          <p className="text-xs font-mono break-all">{change.previousHash}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">New Hash</p>
                          <p className="text-xs font-mono break-all">{change.newHash || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No changes recorded</p>
          </div>
        )}
      </div>

      {/* Change Statistics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Change Statistics</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Changes</span>
              <span className="text-sm font-medium">{monitor.changeHistory.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Approved Changes</span>
              <span className="text-sm font-medium">
                {monitor.changeHistory.filter(c => c.approved).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unauthorized Changes</span>
              <span className="text-sm font-medium text-destructive">
                {monitor.changeHistory.filter(c => !c.approved).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Change</span>
              <span className="text-sm font-medium">
                {monitor.changeHistory.length > 0
                  ? new Date(monitor.changeHistory[0].timestamp).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrityActions({ monitor }: { monitor: FileIntegrityMonitor }) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
            <RefreshCw className="w-3 h-3" />
            Refresh Integrity Check
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
            <Hash className="w-3 h-3" />
            Update Baseline Hash
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
            <Download className="w-3 h-3" />
            Download File
          </button>
          {monitor.backupAvailable && (
            <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
              <History className="w-3 h-3" />
              Restore from Backup
            </button>
          )}
        </div>
      </div>

      {/* Monitoring Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Monitoring Settings</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monitoring Enabled</span>
              <span className="text-sm font-medium">
                {monitor.monitoringEnabled ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alert on Change</span>
              <span className="text-sm font-medium">
                {monitor.alertOnChange ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Check Frequency</span>
              <span className="text-sm font-medium">Every 15 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remediation Actions */}
      {monitor.integrityStatus !== 'verified' && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Remediation Actions</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {monitor.integrityStatus === 'missing' && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">File Missing</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    The monitored file is missing from the expected location.
                  </p>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded">
                      Investigate
                    </button>
                    {monitor.backupAvailable && (
                      <button className="text-xs px-2 py-1 border border-border rounded">
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              )}

              {monitor.integrityStatus === 'corrupted' && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">File Corrupted</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    The file has been corrupted or tampered with.
                  </p>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded">
                      Quarantine
                    </button>
                    {monitor.backupAvailable && (
                      <button className="text-xs px-2 py-1 border border-border rounded">
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              )}

              {monitor.integrityStatus === 'modified' && (
                <div className="p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-warning mb-2">File Modified</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    The file has been modified since the last baseline.
                  </p>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 bg-warning text-warning-foreground rounded">
                      Review Changes
                    </button>
                    <button className="text-xs px-2 py-1 border border-border rounded">
                      Approve Changes
                    </button>
                    <button className="text-xs px-2 py-1 border border-border rounded">
                      Revert
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">System Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
            <Settings className="w-3 h-3" />
            Configure Monitoring
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
            <Eye className="w-3 h-3" />
            View System Logs
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
            <Shield className="w-3 h-3" />
            Security Scan
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusIcon(status: string) {
  switch (status) {
    case "verified":
      return CheckCircle2;
    case "modified":
      return AlertTriangle;
    case "corrupted":
      return XCircle;
    case "missing":
      return XCircle;
    case "unknown":
      return Clock;
    default:
      return Activity;
  }
}

function getSystemIcon(systemType: string) {
  switch (systemType) {
    case "sis":
      return Zap;
    case "plc":
      return Cpu;
    case "scada":
      return Server;
    case "gateway":
      return Router;
    case "firewall":
      return Shield;
    case "rtu":
      return Router;
    case "dcs":
      return Database;
    default:
      return Settings;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeDescription(fileType: string): string {
  switch (fileType) {
    case 'gateway-config':
      return 'Gateway Configuration';
    case 'sis-config':
      return 'SIS Configuration';
    case 'plc-program':
      return 'PLC Program';
    case 'scada-config':
      return 'SCADA Configuration';
    case 'firewall-rules':
      return 'Firewall Rules';
    case 'network-config':
      return 'Network Configuration';
    case 'safety-logic':
      return 'Safety Logic';
    case 'control-logic':
      return 'Control Logic';
    case 'system-config':
      return 'System Configuration';
    default:
      return 'Configuration File';
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'verified':
      return 'File integrity verified - no changes detected';
    case 'modified':
      return 'File has been modified since last baseline';
    case 'corrupted':
      return 'File appears to be corrupted or tampered with';
    case 'missing':
      return 'File is missing from expected location';
    case 'unknown':
      return 'Integrity status could not be determined';
    default:
      return 'Unknown status';
  }
}