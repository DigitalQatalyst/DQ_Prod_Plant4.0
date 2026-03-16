import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Camera,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Database,
  FileText,
  Download,
  Eye,
  Settings,
  Zap,
  Wrench,
  Server,
  Cpu,
  Router,
  Gauge,
  Archive,
  Lock,
  Unlock,
  Hash,
  Calendar,
  User,
  MapPin,
  Info,
  CheckCircle2,
  XCircle,
  HardDrive,
  Code,
  Terminal,
  Gavel,
} from "lucide-react";
import { getForensicSnapshots, getForensicSnapshotComponents } from "@/lib/loggingForensicsQueries";
import {
  ForensicSnapshotDb,
  ForensicSnapshotComponentDb
} from "@/types/security";
import { getForensicSnapshotsByTenant } from "@/data/upstreamSecurityMockData";

// Use the frontend-friendly interface
import type { ForensicSnapshot } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function ForensicSnapshots() {
  const { currentTenant } = useApp();

  const [snapshots, setSnapshots] = useState<ForensicSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>(undefined);
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [regulatoryFilter, setRegulatoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("capturedAt");

  const mapSupabaseToFrontend = (s: ForensicSnapshotDb): ForensicSnapshot => {
    return {
      id: s.id,
      tenantId: s.tenantId,
      incidentId: s.triggeredByIncident || s.triggeredByAlert,
      triggerEvent: s.snapshotName,
      triggerType: (s.snapshotType === 'incident_response' ? 'security-incident' :
        s.snapshotType === 'manual' ? 'manual-capture' :
          s.snapshotType === 'triggered' ? 'well-control-event' : 'security-incident') as any,
      capturedAt: s.captureStart,
      scope: [], // Will be populated by components
      systemState: {},
      configurations: {},
      logSegments: [],
      capturedBy: s.triggeredByUser || 'System',
      retentionUntil: s.retentionUntil || new Date(new Date(s.captureStart).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      isRegulatory: s.legalHold
    };
  };

  useEffect(() => {
    async function fetchSnapshots() {
      setLoading(true);
      setError(null);
      try {
        const result = await getForensicSnapshots(currentTenant.id);
        if (result && result.length > 0) {
          setSnapshots(result.map(mapSupabaseToFrontend));
        } else {
          // Fallback to mock data
          setSnapshots(getForensicSnapshotsByTenant(currentTenant.id));
        }
      } catch (err) {
        console.error("Error fetching snapshots:", err);
        setError("Failed to fetch snapshots");
        setSnapshots(getForensicSnapshotsByTenant(currentTenant.id));
      } finally {
        setLoading(false);
      }
    }
    fetchSnapshots();
  }, [currentTenant.id]);

  // Fetch components for the selected snapshot
  useEffect(() => {
    if (!selectedSnapshotId) return;

    // Find the snapshot in our list
    const snapshot = snapshots.find(s => s.id === selectedSnapshotId);
    if (!snapshot) return;

    // Only fetch if scope is empty (basic check to see if we already have detailed data)
    // In a real app, we might want to refresh this, but for now we check if it's "minimal"
    if (snapshot.scope.length > 0) return;

    async function fetchComponents() {
      try {
        const components = await getForensicSnapshotComponents(selectedSnapshotId!);
        if (components && components.length > 0) {
          const newSystemState: Record<string, any> = {};
          const newConfigurations: Record<string, any> = {};
          const newLogSegments: string[] = [];
          const componentScope = new Set<string>();

          components.forEach(c => {
            // Add component name to scope
            componentScope.add(c.componentName);

            // Parse data content (it might be a string in some cases despite the type)
            let content = c.dataContent;
            if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
              try {
                content = JSON.parse(content);
              } catch (e) {
                // Keep as string if parsing fails
              }
            }

            // Merge metadata into system state for indicators
            if (c.metadata) {
              Object.entries(c.metadata).forEach(([mKey, mValue]) => {
                newSystemState[mKey] = mValue;
              });
            }

            // Map based on component type
            if (c.componentType === 'process_list' || c.componentType === 'network_connections' || c.componentType === 'system_status') {
              newSystemState[c.componentType] = content;
              // If it's a known object structure, flat map it to systemState for direct access
              if (content && typeof content === 'object' && !Array.isArray(content)) {
                Object.entries(content).forEach(([k, v]) => {
                  newSystemState[k] = v;
                });
              }
            } else if (c.componentType === 'configuration_file') {
              newConfigurations[c.componentName || c.componentType] = content;
            } else if (c.componentType === 'log_file' || c.componentType === 'event_log') {
              if (Array.isArray(content)) {
                newLogSegments.push(...(content as string[]));
              } else if (typeof content === 'string') {
                newLogSegments.push(content);
              } else if (content && typeof content === 'object') {
                newLogSegments.push(JSON.stringify(content));
              }
            } else {
              // Generic fallback for other types
              newSystemState[c.componentType] = content;
            }
          });

          // Update the snapshot in the list
          setSnapshots(prev => prev.map(s =>
            s.id === selectedSnapshotId
              ? {
                ...s,
                scope: Array.from(componentScope),
                systemState: newSystemState,
                configurations: newConfigurations,
                logSegments: newLogSegments
              }
              : s
          ));
        }
      } catch (err) {
        console.error("Error fetching components:", err);
      }
    }

    // Only fetch if it looks like a Supabase ID (UUID usually)
    if (selectedSnapshotId.length > 20) {
      fetchComponents();
    }
  }, [selectedSnapshotId]);

  // Filter and sort forensic snapshots
  const filteredAndSortedSnapshots = useMemo(() => {
    let result = [...snapshots];

    // Apply trigger type filter
    if (triggerTypeFilter !== "all") {
      result = result.filter((snapshot) => snapshot.triggerType === triggerTypeFilter);
    }

    // Apply regulatory filter
    if (regulatoryFilter !== "all") {
      const isRegulatory = regulatoryFilter === "regulatory";
      result = result.filter((snapshot) => snapshot.isRegulatory === isRegulatory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (snapshot) =>
          snapshot.triggerEvent.toLowerCase().includes(query) ||
          snapshot.capturedBy.toLowerCase().includes(query) ||
          snapshot.scope.some(scope => scope.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "capturedAt") {
        return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
      }
      if (sortBy === "trigger") {
        return a.triggerType.localeCompare(b.triggerType);
      }
      if (sortBy === "name") {
        return a.triggerEvent.localeCompare(b.triggerEvent);
      }
      return 0;
    });

    return result;
  }, [snapshots, triggerTypeFilter, regulatoryFilter, searchTerm, sortBy]);

  // Removed auto-selection to allow for Feature Overview
  /*
  useEffect(() => {
    if (filteredSnapshots.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(filteredSnapshots[0].id);
    }
  }, [filteredSnapshots]);
  */

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSnapshots = snapshots.length;
    const regulatorySnapshots = snapshots.filter(
      (snapshot) => snapshot.isRegulatory
    ).length;
    const sisOverrides = snapshots.filter(
      (snapshot) => snapshot.triggerType === "sis-override"
    ).length;
    const pipelineAnomalies = snapshots.filter(
      (snapshot) => snapshot.triggerType === "pipeline-anomaly"
    ).length;

    return {
      totalSnapshots,
      regulatorySnapshots,
      sisOverrides,
      pipelineAnomalies,
    };
  }, [snapshots]);

  const tabs = selectedSnapshot
    ? [
      {
        id: "details",
        label: "Snapshot Details",
        content: <SnapshotDetails snapshot={selectedSnapshot} />,
      },
      {
        id: "system-state",
        label: "System State",
        content: <SystemState snapshot={selectedSnapshot} />,
      },
      {
        id: "configurations",
        label: "Configurations",
        content: <Configurations snapshot={selectedSnapshot} />,
      },
      {
        id: "logs",
        label: "Log Segments",
        content: <LogSegments snapshot={selectedSnapshot} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <ForensicsOverview snapshots={snapshots} summaryStats={summaryStats} onSnapshotSelect={setSelectedSnapshotId} />,
      }
    ];

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "sis-override":
        return Zap;
      case "pipeline-anomaly":
        return Wrench;
      case "well-control-event":
        return Gauge;
      case "security-incident":
        return Shield;
      case "manual-capture":
        return Camera;
      default:
        return Activity;
    }
  };

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType) {
      case "sis-override":
        return "bg-destructive/10 text-destructive";
      case "pipeline-anomaly":
        return "bg-warning/10 text-warning";
      case "well-control-event":
        return "bg-destructive/10 text-destructive";
      case "security-incident":
        return "bg-primary/10 text-primary";
      case "manual-capture":
        return "bg-success/10 text-success";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Forensic Snapshots"
        context="DEWA – Transmission"
        count={filteredAndSortedSnapshots.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "triggerType", label: "Trigger Type", value: triggerTypeFilter, options: [
              { label: "All Triggers", value: "all" },
              { label: "SIS Override", value: "sis-override" },
              { label: "Pipeline Anomaly", value: "pipeline-anomaly" },
              { label: "Well Control Event", value: "well-control-event" },
              { label: "Security Incident", value: "security-incident" },
              { label: "Manual Capture", value: "manual-capture" },
            ], onChange: setTriggerTypeFilter
          },
          {
            key: "regulatory", label: "Regulatory", value: regulatoryFilter, options: [
              { label: "All Statuses", value: "all" },
              { label: "Regulatory Required", value: "regulatory" },
              { label: "Non-Regulatory", value: "non-regulatory" },
            ], onChange: setRegulatoryFilter
          }
        ]}
        sortOptions={[
          { label: "Capture Date", value: "capturedAt" },
          { label: "Trigger Type", value: "trigger" },
          { label: "Event Name", value: "name" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {/* Forensic Snapshot List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-50">
            <Activity className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading snapshots...</p>
          </div>
        ) : filteredAndSortedSnapshots.length > 0 ? (
          filteredAndSortedSnapshots.map((snapshot) => (
            <ListPaneItem
              key={snapshot.id}
              title={snapshot.triggerEvent}
              description={`Captured by: ${snapshot.capturedBy} • ${snapshot.scope.length} systems`}
              status={snapshot.triggerType === 'security-incident' || snapshot.triggerType === 'sis-override' ? 'offline' : (snapshot.triggerType === 'manual-capture' ? 'online' : 'maintenance')}
              category={snapshot.triggerType.replace('-', ' ')}
              value={new Date(snapshot.capturedAt).toLocaleDateString()}
              isSelected={selectedSnapshotId === snapshot.id}
              onClick={() => setSelectedSnapshotId(snapshot.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center opacity-50">
            <Camera className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">No forensic snapshots found</p>
          </div>
        )}
      </ListPane>

      <WorkPane
        title={selectedSnapshot ? selectedSnapshot.triggerEvent : "Forensic Snapshots Overview"}
        subtitle={selectedSnapshot ? `${selectedSnapshot.scope.join(', ')} • ${new Date(selectedSnapshot.capturedAt).toLocaleDateString()}` : "Comprehensive point-in-time state captures for forensic investigation and post-incident reconstruction"}
        tabs={tabs}
      />
    </>
  );
}

function ForensicsOverview({
  snapshots,
  summaryStats,
  onSnapshotSelect
}: {
  snapshots: ForensicSnapshot[];
  summaryStats: any;
  onSnapshotSelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Forensic Readiness Overview"
      description="Access point-in-time system state snapshots captured during anomalous events or security incidents."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Snapshots",
          value: summaryStats.totalSnapshots,
          icon: Camera,
          variant: 'primary'
        },
        {
          title: "Regulatory Captures",
          value: summaryStats.regulatorySnapshots,
          icon: Gavel,
          variant: 'primary'
        },
        {
          title: "SIS Overrides",
          value: summaryStats.sisOverrides,
          icon: Zap,
          variant: summaryStats.sisOverrides > 0 ? 'destructive' : 'success'
        },
        {
          title: "Pipeline Anomalies",
          value: summaryStats.pipelineAnomalies,
          icon: Wrench,
          variant: summaryStats.pipelineAnomalies > 0 ? 'warning' : 'success'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Trigger Distribution"
        pieChartData={[
          { name: 'Security Incident', value: snapshots.filter(s => s.triggerType === 'security-incident').length, color: 'hsl(var(--primary))' },
          { name: 'SIS Override', value: summaryStats.sisOverrides, color: 'hsl(var(--destructive))' },
          { name: 'Pipeline Anomaly', value: summaryStats.pipelineAnomalies, color: 'hsl(var(--warning))' },
          { name: 'Manual', value: snapshots.filter(s => s.triggerType === 'manual-capture').length, color: 'hsl(var(--success))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Captured Systems"
        barChartData={(() => {
          const systemCounts = snapshots.flatMap(s => s.scope).reduce((acc, system) => {
            acc[system] = (acc[system] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(systemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
        })()}
        keyAreasTitle="Forensic Investigation Areas"
        keyAreas={[
          {
            icon: Shield,
            title: "Incident Analysis",
            description: "Digital forensic artifacts for security breach reconstruction and attribution."
          },
          {
            icon: Gavel,
            title: "Regulatory Evidence",
            description: "Immutable point-in-time snapshots for legal holds and regulatory reporting."
          },
          {
            icon: Activity,
            title: "Root Cause Discovery",
            description: "Detailed system state comparisons to identify the source of operational failures."
          },
          {
            icon: HardDrive,
            title: "State Integrity",
            description: "Verification of PLC memory, register values, and hardware signatures."
          },
        ]}
        recentActivityTitle="Recent Forensic Captures"
        recentActivity={snapshots
          .slice(0, 3)
          .map(snapshot => ({
            id: snapshot.id,
            title: snapshot.triggerEvent,
            subtitle: `Captured by ${snapshot.capturedBy}`,
            status: snapshot.triggerType === 'security-incident' ? 'error' : snapshot.triggerType === 'manual-capture' ? 'success' : 'warning',
            value: new Date(snapshot.capturedAt).toLocaleDateString()
          }))}
        onActivityClick={onSnapshotSelect}
      />
    </IdentityOverview>
  );
}

function SnapshotDetails({ snapshot }: { snapshot: ForensicSnapshot }) {
  // Use a local getTriggerIcon for components to avoid conflicts
  const getIcon = (type: string) => {
    switch (type) {
      case "sis-override": return Zap;
      case "pipeline-anomaly": return Wrench;
      case "well-control-event": return Gauge;
      case "security-incident": return Shield;
      case "manual-capture": return Camera;
      default: return Activity;
    }
  };
  const TriggerIcon = getIcon(snapshot.triggerType);

  return (
    <div className="space-y-6">
      {/* Snapshot Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${snapshot.triggerType === "sis-override" || snapshot.triggerType === "well-control-event"
              ? "bg-destructive/10"
              : snapshot.triggerType === "pipeline-anomaly"
                ? "bg-warning/10"
                : snapshot.triggerType === "security-incident"
                  ? "bg-primary/10"
                  : "bg-success/10"
              }`}
          >
            <TriggerIcon
              className={`w-6 h-6 ${snapshot.triggerType === "sis-override" || snapshot.triggerType === "well-control-event"
                ? "text-destructive"
                : snapshot.triggerType === "pipeline-anomaly"
                  ? "text-warning"
                  : snapshot.triggerType === "security-incident"
                    ? "text-primary"
                    : "text-success"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{snapshot.triggerEvent}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Forensic snapshot captured during {snapshot.triggerType.replace('-', ' ')} event
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${snapshot.triggerType === "sis-override" || snapshot.triggerType === "well-control-event"
                  ? "bg-destructive/10 text-destructive"
                  : snapshot.triggerType === "pipeline-anomaly"
                    ? "bg-warning/10 text-warning"
                    : snapshot.triggerType === "security-incident"
                      ? "bg-primary/10 text-primary"
                      : "bg-success/10 text-success"
                  }`}
              >
                {snapshot.triggerType.replace('-', ' ').toUpperCase()}
              </span>
              {snapshot.isRegulatory && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  REGULATORY
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3" />
                {snapshot.scope.length} systems captured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Snapshot Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Captured At</p>
              <p className="text-sm font-medium">
                {new Date(snapshot.capturedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Captured By</p>
              <p className="text-sm font-medium">{snapshot.capturedBy}</p>
            </div>
          </div>
          {snapshot.incidentId && (
            <div className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Related Incident</p>
                <p className="text-sm font-medium font-mono">{snapshot.incidentId}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Retention Until</p>
              <p className="text-sm font-medium">
                {new Date(snapshot.retentionUntil).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Scope</p>
              <p className="text-sm font-medium">{snapshot.scope.length} systems/components</p>
            </div>
          </div>
        </div>
      </div>

      {/* Captured Scope */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Captured Scope</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            {snapshot.scope.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemState({ snapshot }: { snapshot: ForensicSnapshot }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          System State at Capture Time
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            {snapshot.systemState && typeof snapshot.systemState === 'object' && Object.entries(snapshot.systemState).length > 0 ? (
              Object.entries(snapshot.systemState).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium font-mono">
                    {Array.isArray(value) ? (
                      <div className="text-right space-y-1">
                        {value.map((item, index) => (
                          <div key={index} className="text-xs bg-muted/30 px-2 py-0.5 rounded">
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                          </div>
                        ))}
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <div className="bg-muted/50 p-2 rounded text-xs overflow-auto max-w-[300px]">
                        <pre>{JSON.stringify(value, null, 2)}</pre>
                      </div>
                    ) : (
                      String(value || 'N/A')
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No system state data captured</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div>
        <h4 className="text-sm font-semibold mb-3">System Status Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getSystemStatusIndicators(snapshot).map((indicator, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${indicator.color}`} />
                <div>
                  <p className="text-sm font-medium">{indicator.label}</p>
                  <p className="text-xs text-muted-foreground">{indicator.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Configurations({ snapshot }: { snapshot: ForensicSnapshot }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          System Configurations
        </h4>
        <div className="space-y-4">
          {snapshot.configurations && typeof snapshot.configurations === 'object' && Object.entries(snapshot.configurations).length > 0 ? (
            Object.entries(snapshot.configurations).map(([configKey, configValue]) => (
              <div key={configKey} className="bg-card border border-border rounded-lg p-4">
                <h5 className="text-sm font-medium mb-3 capitalize">
                  {configKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h5>
                <div className="space-y-2">
                  {configValue && typeof configValue === 'object' ? (
                    Object.entries(configValue as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span className="text-sm font-medium font-mono">
                          {Array.isArray(value) ? (
                            <div className="text-right">
                              {value.map((item, index) => (
                                <div key={index} className="text-xs">{String(item)}</div>
                              ))}
                            </div>
                          ) : typeof value === 'object' && value !== null ? (
                            <pre className="text-xs max-w-xs overflow-auto bg-muted p-1 rounded">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            String(value || 'N/A')
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted p-3 rounded font-mono text-xs whitespace-pre-wrap overflow-auto max-h-40">
                      {typeof configValue === 'string' ? configValue : JSON.stringify(configValue, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border border-dashed rounded-lg p-8 text-center">
              <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No configuration data captured for this snapshot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogSegments({ snapshot }: { snapshot: ForensicSnapshot }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Captured Log Segments
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            {snapshot.logSegments.map((logEntry, index) => (
              <div key={index} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-mono text-foreground flex-1">
                  {logEntry}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Analysis */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Log Analysis</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Log Entries</span>
              <span className="text-sm font-medium">{snapshot.logSegments.length}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time Span</span>
              <span className="text-sm font-medium">
                {getLogTimeSpan(snapshot.logSegments)}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Critical Events</span>
              <span className="text-sm font-medium">
                {getCriticalEventCount(snapshot.logSegments)}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Systems Involved</span>
              <span className="text-sm font-medium">
                {getInvolvedSystems(snapshot.logSegments).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions (Internal to this file)
function getSystemStatusIndicators(snapshot: ForensicSnapshot) {
  const indicators = [];
  const state = snapshot.systemState;

  if (state.sisStatus) {
    indicators.push({
      label: "SIS Status",
      value: String(state.sisStatus).replace('_', ' ').toUpperCase(),
      color: state.sisStatus === "override_active" ? "bg-destructive" : "bg-success"
    });
  }

  if (state.safetySystemStatus) {
    indicators.push({
      label: "Safety Systems",
      value: String(state.safetySystemStatus).replace('_', ' ').toUpperCase(),
      color: state.safetySystemStatus === "active" ? "bg-success" : "bg-warning"
    });
  }

  if (state.alertLevel) {
    indicators.push({
      label: "Alert Level",
      value: String(state.alertLevel).toUpperCase(),
      color: state.alertLevel === "critical" ? "bg-destructive" :
        state.alertLevel === "high" ? "bg-warning" : "bg-success"
    });
  }

  if (state.emergencyResponse) {
    indicators.push({
      label: "Emergency Response",
      value: String(state.emergencyResponse).toUpperCase(),
      color: state.emergencyResponse === "active" ? "bg-destructive" : "bg-success"
    });
  }

  return indicators;
}

function getLogTimeSpan(logSegments: string[]): string {
  if (logSegments.length < 2) return "N/A";

  const timestamps = logSegments
    .map(log => {
      const match = log.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      return match ? new Date(match[1]) : null;
    })
    .filter(Boolean) as Date[];

  if (timestamps.length < 2) return "N/A";

  const earliest = new Date(Math.min(...timestamps.map(t => t.getTime())));
  const latest = new Date(Math.max(...timestamps.map(t => t.getTime())));
  const diffMs = latest.getTime() - earliest.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "< 1 minute";
  if (diffMinutes < 60) return `${diffMinutes} minutes`;
  return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
}

function getCriticalEventCount(logSegments: string[]): number {
  return logSegments.filter(log =>
    log.toLowerCase().includes('critical') ||
    log.toLowerCase().includes('emergency') ||
    log.toLowerCase().includes('override') ||
    log.toLowerCase().includes('alarm')
  ).length;
}

function getInvolvedSystems(logSegments: string[]): string[] {
  const systems = new Set<string>();

  logSegments.forEach(log => {
    const match = log.match(/\[([A-Z]+)\]/);
    if (match) {
      systems.add(match[1]);
    }
  });

  return Array.from(systems);
}