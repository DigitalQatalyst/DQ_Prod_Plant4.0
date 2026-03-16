import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Settings,
  Clock,
  User,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Cpu,
  Zap,
  Wrench,
  Server,
  Router,
  Gauge,
  Shield,
  Eye,
  GitCommit,
  History,
  Database,
} from "lucide-react";
import { getConfigurationChanges } from "@/lib/loggingForensicsQueries";
import type { ConfigurationChange, SecurityAuditEntry } from "@/types/security";
import { getSecurityAuditEntriesByTenant } from "@/data/upstreamSecurityMockData";
import { useEffect } from "react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function ConfigChangeHistory() {
  const { currentTenant } = useApp();

  const [changes, setChanges] = useState<SecurityAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");

  const mapSupabaseToFrontend = (change: ConfigurationChange): SecurityAuditEntry => {
    return {
      id: change.id,
      tenantId: change.tenantId,
      timestamp: change.changeTimestamp,
      eventType: 'configuration-change',
      userName: change.changedBy,
      resource: change.componentName || change.configurationPath,
      action: change.changeType,
      outcome: (change.validationStatus === 'validated' ? 'success' : 'failure') as any,
      details: `${change.parameterName}: ${change.changeReason || ''}`,
      riskLevel: (change.securityImpact === 'critical' || change.securityImpact === 'high') ? 'high' :
        (change.securityImpact === 'medium' ? 'medium' : 'low'),
      assetId: change.assetId
    };
  };

  useEffect(() => {
    async function fetchChanges() {
      setLoading(true);
      setError(null);
      try {
        const result = await getConfigurationChanges(currentTenant.id);

        if (result.length > 0) {
          setChanges(result.map(mapSupabaseToFrontend));
        } else {
          // Fallback to mock data
          const mockEntries = getSecurityAuditEntriesByTenant(currentTenant.id);
          const mockChanges = mockEntries.filter(entry =>
            entry.eventType === 'configuration-change' ||
            entry.action.includes('config') ||
            entry.action.includes('logic') ||
            entry.action.includes('setting') ||
            entry.action.includes('parameter')
          );
          setChanges(mockChanges);
        }
      } catch (err) {
        console.error("Error fetching config changes:", err);
        setError("Failed to fetch changes from server");
        // Fallback to mock data
        const mockEntries = getSecurityAuditEntriesByTenant(currentTenant.id);
        const mockChanges = mockEntries.filter(entry =>
          entry.eventType === 'configuration-change' ||
          entry.action.includes('config') ||
          entry.action.includes('logic') ||
          entry.action.includes('setting') ||
          entry.action.includes('parameter')
        );
        setChanges(mockChanges);
      } finally {
        setLoading(false);
      }
    }

    fetchChanges();
  }, [currentTenant.id]);

  const [selectedChangeId, setSelectedChangeId] = useState<string | undefined>(undefined);

  // Filter and sort configuration changes
  const filteredChanges = useMemo(() => {
    let filtered = [...changes];

    // Apply asset type filter
    if (assetFilter !== "all") {
      filtered = filtered.filter((change) => {
        const resource = change.resource.toLowerCase();
        switch (assetFilter) {
          case "plc":
            return resource.includes('plc') || resource.includes('wellhead');
          case "sis":
            return resource.includes('sis') || resource.includes('safety');
          case "scada":
            return resource.includes('scada') || resource.includes('master');
          case "pipeline":
            return resource.includes('pipeline') || resource.includes('valve');
          case "rtu":
            return resource.includes('rtu');
          case "dcs":
            return resource.includes('dcs') || resource.includes('control');
          default:
            return true;
        }
      });
    }

    // Apply change type filter
    if (changeTypeFilter !== "all") {
      filtered = filtered.filter((change) => {
        const action = change.action.toLowerCase();
        switch (changeTypeFilter) {
          case "logic":
            return action.includes('logic') || action.includes('ladder');
          case "parameter":
            return action.includes('parameter') || action.includes('setting');
          case "position":
            return action.includes('position') || action.includes('valve');
          case "config":
            return action.includes('config') || action.includes('modify');
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (change) =>
          change.resource.toLowerCase().includes(query) ||
          change.action.toLowerCase().includes(query) ||
          change.details.toLowerCase().includes(query) ||
          (change.userName && change.userName.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "risk") {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.riskLevel as keyof typeof order] ?? 3) - (order[b.riskLevel as keyof typeof order] ?? 3);
      }
      if (sortBy === "resource") return a.resource.localeCompare(b.resource);
      return 0;
    });

    return filtered;
  }, [changes, assetFilter, changeTypeFilter, searchTerm, sortBy]);

  // Removed auto-selection to allow for Feature Overview
  /*
  useEffect(() => {
    if (filteredChanges.length > 0 && !selectedChangeId) {
      setSelectedChangeId(filteredChanges[0].id);
    }
  }, [filteredChanges]);
  */

  const selectedChange = changes.find((c) => c.id === selectedChangeId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalChanges = changes.length;
    const highRiskChanges = changes.filter(
      (change) => change.riskLevel === "high"
    ).length;
    const failedChanges = changes.filter(
      (change) => change.outcome === "failure"
    ).length;
    const safetySystemChanges = changes.filter(
      (change) => change.resource.toLowerCase().includes('sis') ||
        change.resource.toLowerCase().includes('safety')
    ).length;

    return {
      totalChanges,
      highRiskChanges,
      failedChanges,
      safetySystemChanges,
    };
  }, [changes]);

  const tabs = selectedChange
    ? [
      {
        id: "details",
        label: "Change Details",
        content: <ChangeDetails change={selectedChange} />,
      },
      {
        id: "comparison",
        label: "Before/After",
        content: <BeforeAfterComparison change={selectedChange} />,
      },
      {
        id: "impact",
        label: "Impact Analysis",
        content: <ImpactAnalysis change={selectedChange} />,
      },
      {
        id: "approval",
        label: "Approval Chain",
        content: <ApprovalChain change={selectedChange} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <ConfigChangeOverview changes={changes} summaryStats={summaryStats} onChangeSelect={setSelectedChangeId} />,
      }
    ];

  const getChangeIcon = (resource: string, action: string) => {
    const resourceLower = resource.toLowerCase();
    const actionLower = action.toLowerCase();

    if (resourceLower.includes('plc') || resourceLower.includes('wellhead')) return Cpu;
    if (resourceLower.includes('sis') || resourceLower.includes('safety')) return Zap;
    if (resourceLower.includes('pipeline') || resourceLower.includes('valve')) return Wrench;
    if (resourceLower.includes('scada')) return Server;
    if (resourceLower.includes('rtu')) return Router;
    if (resourceLower.includes('dcs')) return Database;
    if (actionLower.includes('logic')) return GitCommit;
    if (actionLower.includes('parameter')) return Settings;
    return Activity;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-success/10 text-success";
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
      case "partial":
        return "bg-warning/10 text-warning";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Configuration Change History"
        context="DEWA – Transmission"
        count={filteredChanges.length}
        searchPlaceholder="Search changes..."
        onSearch={setSearchTerm}
        filters={[
          {
            key: "assetType",
            label: "Asset Type",
            value: assetFilter,
            onChange: setAssetFilter,
            options: [
              { label: "All Assets", value: "all" },
              { label: "Wellhead PLCs", value: "plc" },
              { label: "SIS Controllers", value: "sis" },
              { label: "SCADA Systems", value: "scada" },
              { label: "Pipeline Systems", value: "pipeline" },
              { label: "RTUs", value: "rtu" },
              { label: "DCS Systems", value: "dcs" },
            ],
          },
          {
            key: "changeType",
            label: "Change Type",
            value: changeTypeFilter,
            onChange: setChangeTypeFilter,
            options: [
              { label: "All Changes", value: "all" },
              { label: "Logic Changes", value: "logic" },
              { label: "Parameter Changes", value: "parameter" },
              { label: "Position Changes", value: "position" },
              { label: "Configuration Changes", value: "config" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Most Recent", value: "recent" },
          { label: "Risk Level", value: "risk" },
          { label: "Resource Name", value: "resource" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {/* Configuration Change List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-50">
            <Activity className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm">Loading configuration changes...</p>
          </div>
        ) : filteredChanges.length > 0 ? (
          filteredChanges.map((change) => (
            <ListPaneItem
              key={change.id}
              title={change.resource}
              description={`${change.action}: ${change.details}`}
              status={change.outcome === 'success' ? 'online' : 'offline'}
              category={change.riskLevel.toUpperCase()}
              value={new Date(change.timestamp).toLocaleDateString()}
              isSelected={selectedChangeId === change.id}
              onClick={() => setSelectedChangeId(change.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-lg">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No configuration changes found</p>
          </div>
        )}
      </ListPane>

      <WorkPane
        title={selectedChange ? selectedChange.resource : "Config Change Overview"}
        subtitle={selectedChange ? `${selectedChange.action} - ${selectedChange.outcome}` : "Comprehensive history of all configuration modifications and logic updates"}
        tabs={tabs}
      />
    </>
  );
}

function ConfigChangeOverview({
  changes,
  summaryStats,
  onChangeSelect
}: {
  changes: SecurityAuditEntry[];
  summaryStats: any;
  onChangeSelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Configuration Change Overview"
      description="Monitor and analyze all modifications to critical transmission system configurations, logic programs, and operational parameters."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Changes",
          value: summaryStats.totalChanges,
          icon: FileText,
          variant: 'primary'
        },
        {
          title: "High Risk",
          value: summaryStats.highRiskChanges,
          icon: AlertTriangle,
          variant: summaryStats.highRiskChanges > 0 ? 'destructive' : 'default'
        },
        {
          title: "Failed Changes",
          value: summaryStats.failedChanges,
          icon: XCircle,
          variant: summaryStats.failedChanges > 0 ? 'destructive' : 'success'
        },
        {
          title: "Safety System",
          value: summaryStats.safetySystemChanges,
          icon: Zap,
          variant: 'warning'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Change Outcome Distribution"
        pieChartData={[
          { name: 'Success', value: changes.filter(c => c.outcome === 'success').length, color: 'hsl(var(--success))' },
          { name: 'Failure', value: changes.filter(c => c.outcome === 'failure').length, color: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Recent Risk Distribution"
        barChartData={(() => {
          const riskCounts = changes.reduce((acc, c) => {
            acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(riskCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1) + ' Risk',
              value
            }));
        })()}
        keyAreasTitle="Key Configuration Areas"
        keyAreas={[
          {
            icon: Zap,
            title: "Safety Logic",
            description: "Modifications to SIS, ESD, and interlock logic programs."
          },
          {
            icon: Gauge,
            title: "Process Parameters",
            description: "Operational setpoints, threshold values, and control loop parameters."
          },
          {
            icon: Cpu,
            title: "Hardware Config",
            description: "PLC, RTU, and I/O module configuration updates."
          },
          {
            icon: Router,
            title: "Network Settings",
            description: "Gateway, firewall, and industrial protocol configurations."
          },
        ]}
        recentActivityTitle="Recent Configuration Changes"
        recentActivity={changes
          .slice(0, 3)
          .map(change => ({
            id: change.id,
            title: change.resource,
            subtitle: `${change.action} • ${change.userName || 'System'}`,
            status: change.outcome === 'success' ? 'success' : 'error',
            value: new Date(change.timestamp).toLocaleDateString()
          }))}
        onActivityClick={onChangeSelect}
      />
    </IdentityOverview>
  );
}

function ChangeDetails({ change }: { change: SecurityAuditEntry }) {
  const ChangeIcon = getChangeIcon(change.resource, change.action);

  return (
    <div className="space-y-6">
      {/* Change Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${change.riskLevel === "high"
              ? "bg-destructive/10"
              : change.riskLevel === "medium"
                ? "bg-warning/10"
                : "bg-success/10"
              }`}
          >
            <ChangeIcon
              className={`w-6 h-6 ${change.riskLevel === "high"
                ? "text-destructive"
                : change.riskLevel === "medium"
                  ? "text-warning"
                  : "text-success"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{change.action}</h3>
            <p className="text-sm text-muted-foreground mt-1">{change.details}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${change.riskLevel === "high"
                  ? "bg-destructive/10 text-destructive"
                  : change.riskLevel === "medium"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                  }`}
              >
                {change.riskLevel.toUpperCase()} RISK
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${change.outcome === "success"
                  ? "bg-success/10 text-success"
                  : change.outcome === "failure"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"
                  }`}
              >
                {change.outcome.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {change.eventType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Change Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm font-medium">
                {new Date(change.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Changed By</p>
              <p className="text-sm font-medium">{change.userName || 'System User'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Server className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resource</p>
              <p className="text-sm font-medium">{change.resource}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Action Type</p>
              <p className="text-sm font-medium">{change.action}</p>
            </div>
          </div>
          {change.sourceIp && (
            <div className="p-4 flex items-center gap-3">
              <Router className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Source IP</p>
                <p className="text-sm font-medium font-mono">{change.sourceIp}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            {change.outcome === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : change.outcome === "failure" ? (
              <XCircle className="w-4 h-4 text-destructive" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Outcome</p>
              <p className="text-sm font-medium">{change.outcome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforeAfterComparison({ change }: { change: SecurityAuditEntry }) {
  // Mock before/after data based on the change type
  const getBeforeAfterData = (change: SecurityAuditEntry) => {
    const action = change.action.toLowerCase();

    if (action.includes('valve_position')) {
      return {
        before: { position: "100%", status: "Fully Open", pressure: "2500 PSI" },
        after: { position: "75%", status: "Partially Open", pressure: "1875 PSI" }
      };
    } else if (action.includes('ladder_logic')) {
      return {
        before: {
          logic: "IF (Pressure > 3000) THEN (Alarm = TRUE)",
          checksum: "A1B2C3D4",
          version: "v1.2.3"
        },
        after: {
          logic: "IF (Pressure > 2800) THEN (Alarm = TRUE)",
          checksum: "E5F6G7H8",
          version: "v1.2.4"
        }
      };
    } else if (action.includes('safety_logic')) {
      return {
        before: {
          tripPoint: "95% of design pressure",
          responseTime: "500ms",
          bypassEnabled: "false"
        },
        after: {
          tripPoint: "90% of design pressure",
          responseTime: "300ms",
          bypassEnabled: "false"
        }
      };
    } else {
      return {
        before: { parameter: "Previous Value", status: "Active" },
        after: { parameter: "New Value", status: "Active" }
      };
    }
  };

  const { before, after } = getBeforeAfterData(change);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before State */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            Before Change
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {Object.entries(before).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <span className="text-sm font-medium font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* After State */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-primary" />
            After Change
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {Object.entries(after).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <span className="text-sm font-medium font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Change Summary</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change Type</span>
              <span className="text-sm font-medium">{getChangeType(change.action)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <span className={`text-sm font-medium ${change.riskLevel === 'high' ? 'text-destructive' :
                change.riskLevel === 'medium' ? 'text-warning' : 'text-success'
                }`}>
                {change.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Safety Impact</span>
              <span className="text-sm font-medium">
                {isSafetyRelated(change) ? "Safety Critical" : "Non-Safety"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rollback Available</span>
              <span className="text-sm font-medium">
                {change.outcome === 'success' ? "Yes" : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactAnalysis({ change }: { change: SecurityAuditEntry }) {
  const getImpactData = (change: SecurityAuditEntry) => {
    const resource = change.resource.toLowerCase();

    if (resource.includes('wellhead')) {
      return {
        affectedSystems: ["Wellhead Control", "Production Monitoring", "Safety Systems"],
        downtime: change.outcome === 'success' ? "0 minutes" : "15 minutes",
        productionImpact: "Minimal - 2% reduction during change",
        safetyImpact: "Low - Safety systems remained active"
      };
    } else if (resource.includes('pipeline')) {
      return {
        affectedSystems: ["Pipeline Control", "Flow Monitoring", "Pressure Management"],
        downtime: change.outcome === 'success' ? "0 minutes" : "30 minutes",
        productionImpact: "Moderate - 15% flow reduction",
        safetyImpact: "Medium - Temporary pressure variance"
      };
    } else if (resource.includes('sis') || resource.includes('safety')) {
      return {
        affectedSystems: ["Safety Instrumented System", "Emergency Shutdown", "Alarm System"],
        downtime: change.outcome === 'success' ? "0 minutes" : "5 minutes",
        productionImpact: "None - Safety change only",
        safetyImpact: "High - Critical safety system modified"
      };
    } else {
      return {
        affectedSystems: ["Control System", "Monitoring"],
        downtime: change.outcome === 'success' ? "0 minutes" : "10 minutes",
        productionImpact: "Low - Minor operational impact",
        safetyImpact: "Low - No safety system impact"
      };
    }
  };

  const impact = getImpactData(change);

  return (
    <div className="space-y-6">
      {/* Impact Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Impact Overview</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Downtime</span>
              <span className="text-sm font-medium">{impact.downtime}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Production Impact</span>
              <span className="text-sm font-medium">{impact.productionImpact}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Safety Impact</span>
              <span className="text-sm font-medium">{impact.safetyImpact}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Affected Systems */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Affected Systems</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            {impact.affectedSystems.map((system, index) => (
              <div key={index} className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-sm">{system}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Assessment</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change Risk</span>
              <span className={`text-sm font-medium ${change.riskLevel === 'high' ? 'text-destructive' :
                change.riskLevel === 'medium' ? 'text-warning' : 'text-success'
                }`}>
                {change.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rollback Risk</span>
              <span className="text-sm font-medium">
                {change.riskLevel === 'high' ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Compliance Impact</span>
              <span className="text-sm font-medium">
                {isSafetyRelated(change) ? 'High' : 'Medium'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalChain({ change }: { change: SecurityAuditEntry }) {
  // Mock approval chain data
  const approvals = [
    {
      role: "Change Initiator",
      user: change.userName || "System User",
      status: "approved",
      timestamp: change.timestamp,
      comments: "Change requested for operational improvement"
    },
    {
      role: "OT Engineer",
      user: "Sarah Johnson",
      status: "approved",
      timestamp: new Date(new Date(change.timestamp).getTime() - 30 * 60000).toISOString(),
      comments: "Technical review completed - change approved"
    },
    {
      role: "Safety Manager",
      user: isSafetyRelated(change) ? "Mike Chen" : "N/A",
      status: isSafetyRelated(change) ? "approved" : "not-required",
      timestamp: isSafetyRelated(change) ? new Date(new Date(change.timestamp).getTime() - 15 * 60000).toISOString() : "",
      comments: isSafetyRelated(change) ? "Safety impact assessed - approved with conditions" : "Safety review not required"
    },
    {
      role: "Operations Manager",
      user: "Ahmed Al-Rashid",
      status: change.outcome === 'success' ? "approved" : "pending",
      timestamp: change.outcome === 'success' ? change.timestamp : "",
      comments: change.outcome === 'success' ? "Final approval granted" : "Awaiting change completion"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "not-required":
        return <Eye className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Approval Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Approval Timeline</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-4">
            {approvals.map((approval, index) => (
              <div key={index} className="flex items-start gap-3">
                {getStatusIcon(approval.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{approval.role}</p>
                    <span className="text-xs text-muted-foreground">
                      {approval.timestamp ? new Date(approval.timestamp).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{approval.user}</p>
                  <p className="text-xs text-muted-foreground mt-1">{approval.comments}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change Authorization */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Change Authorization</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Authorization Level</span>
              <span className="text-sm font-medium">
                {change.riskLevel === 'high' ? 'Level 3 (Manager)' :
                  change.riskLevel === 'medium' ? 'Level 2 (Supervisor)' : 'Level 1 (Engineer)'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change Window</span>
              <span className="text-sm font-medium">Maintenance Window</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rollback Plan</span>
              <span className="text-sm font-medium">
                {change.outcome === 'success' ? 'Available' : 'Required'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documentation</span>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getChangeIcon(resource: string, action: string) {
  const resourceLower = resource.toLowerCase();
  const actionLower = action.toLowerCase();

  if (resourceLower.includes('plc') || resourceLower.includes('wellhead')) return Cpu;
  if (resourceLower.includes('sis') || resourceLower.includes('safety')) return Zap;
  if (resourceLower.includes('pipeline') || resourceLower.includes('valve')) return Wrench;
  if (resourceLower.includes('scada')) return Server;
  if (resourceLower.includes('rtu')) return Router;
  if (resourceLower.includes('dcs')) return Database;
  if (actionLower.includes('logic')) return GitCommit;
  if (actionLower.includes('parameter')) return Settings;
  return Activity;
}

function getChangeType(action: string): string {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('logic')) return 'Logic Modification';
  if (actionLower.includes('parameter') || actionLower.includes('setting')) return 'Parameter Change';
  if (actionLower.includes('position') || actionLower.includes('valve')) return 'Position Change';
  if (actionLower.includes('config')) return 'Configuration Change';
  return 'System Change';
}

function isSafetyRelated(change: SecurityAuditEntry): boolean {
  const resource = change.resource.toLowerCase();
  const action = change.action.toLowerCase();

  return resource.includes('sis') ||
    resource.includes('safety') ||
    resource.includes('esd') ||
    action.includes('safety') ||
    action.includes('trip') ||
    action.includes('interlock');
}