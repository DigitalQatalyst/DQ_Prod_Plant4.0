import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  AlertTriangle,
  Clock,
  Users,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  FileText,
  Target,
  Plus,
  BarChart,
  Zap,
  TrendingUp,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getIncidentCases,
  updateIncidentCase,
  getIncidentTimeline,
  addIncidentTimelineEntry,
  createIncidentCase
} from "@/lib/threatMonitoringQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  IncidentCase,
  IncidentStatus,
  IncidentSeverity,
  IncidentType,
  IncidentTimelineEntry
} from "@/types/security";

// Helper components for tab refinements

function getIncidentHeuristics(incident: IncidentCase) {
  const isCritical = incident.severity === 'critical';
  const isHigh = incident.severity === 'high';

  return {
    forensicHeartbeat: isCritical ? "Intense" : isHigh ? "Steady" : "Sporadic",
    activityDensity: isCritical ? "8.4 events/hr" : isHigh ? "3.2 events/hr" : "0.5 events/hr",
    continuityRisk: isCritical ? "Immediate" : isHigh ? "Near-term" : "Low",
    regulatoryExposure: incident.incidentType === 'data-exfiltration' ? "Critical" : "Nominal",
    recoveryComplexity: incident.affectedAssets && incident.affectedAssets.length > 3 ? "High" : "Moderate"
  };
}

export function IncidentCases() {
  const { currentTenant } = useApp();

  // State management
  const [incidents, setIncidents] = useState<IncidentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("severity");

  // Load incidents
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setLoading(true);
        const data = await getIncidentCases(currentTenant.id, {
          limit: 100
        });
        setIncidents(data);
        // Removed auto-selection to show overview
        /*
        */
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    loadIncidents();
  }, [currentTenant.id]);

  // Filter and sort incidents
  const filteredAndSortedIncidents = useMemo(() => {
    let filtered = [...incidents];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(query) ||
          incident.description.toLowerCase().includes(query) ||
          incident.incidentType.toLowerCase().includes(query)
      );
    }

    // Apply severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((incident) => incident.severity === severityFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((incident) => incident.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((incident) => incident.incidentType === typeFilter);
    }

    // Sort by severity first, then by creation time (most recent first)
    filtered.sort((a, b) => {
      if (sortBy === "severity") {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = (severityOrder[a.severity as keyof typeof severityOrder] || 4) - (severityOrder[b.severity as keyof typeof severityOrder] || 4);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

    return filtered;
  }, [incidents, searchTerm, severityFilter, statusFilter, typeFilter, sortBy]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.status === 'open').length;
    const critical = incidents.filter(i => i.severity === 'critical').length;
    const investigating = incidents.filter(i => i.status === 'investigating').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;

    // Calculate simple resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, open, critical, investigating, resolutionRate };
  }, [incidents]);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // Compute overview data and charts (must be before any conditional returns per Rules of Hooks)
  const incidentSeverityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    incidents.forEach(i => {
      if (counts[i.severity] !== undefined) counts[i.severity]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: 'hsl(var(--destructive))' },
      { name: 'High', value: counts.high, color: 'hsl(var(--warning))' },
      { name: 'Medium', value: counts.medium, color: 'hsl(var(--primary))' },
      { name: 'Low', value: counts.low, color: 'hsl(var(--secondary))' },
    ].filter(d => d.value > 0);
  }, [incidents]);

  const criticalUnresolvedIncidents = useMemo(() => {
    return incidents
      .filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed')
      .map(i => ({
        id: i.id,
        title: i.title,
        subtitle: i.incidentType.replace('-', ' '),
        icon: AlertTriangle,
        variant: 'destructive' as const
      }))
      .slice(0, 5);
  }, [incidents]);

  const overviewData = {
    title: "Incident Cases Overview",
    description: "Manage and track security incidents throughout their entire lifecycle, from detection to resolution and post-incident review.",
    metrics: [
      {
        title: "Total Incidents",
        value: summaryStats.total,
        icon: Activity,
        variant: "primary" as const
      },
      {
        title: "Active Investigations",
        value: summaryStats.open + summaryStats.investigating,
        icon: Target,
        variant: "warning" as const
      },
      {
        title: "Critical Issues",
        value: summaryStats.critical,
        icon: AlertTriangle,
        variant: summaryStats.critical > 0 ? "destructive" as const : "default" as const
      },
      {
        title: "Resolution Rate",
        value: `${summaryStats.resolutionRate}%`,
        icon: CheckCircle2,
        variant: "success" as const
      }
    ]
  };

  // Handle incident updates
  const handleIncidentUpdate = async (incidentId: string, updates: Partial<IncidentCase>) => {
    try {
      const updatedIncident = await updateIncidentCase(currentTenant.id, incidentId, updates);
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId ? { ...incident, ...updatedIncident } : incident
      ));
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  if (loading) {
    return <LoadingState loadingText="Loading incident cases..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Incidents"
        description={error}
        icon={AlertTriangle}
      />
    );
  }

  const tabs = selectedIncident
    ? [
      {
        id: "details",
        label: "Details",
        content: <IncidentDetails incident={selectedIncident} onUpdate={handleIncidentUpdate} />,
      },
      {
        id: "timeline",
        label: "Investigation Timeline",
        content: <IncidentTimeline incident={selectedIncident} />,
      },
      {
        id: "impact",
        label: "Impact Analysis",
        content: <IncidentImpact incident={selectedIncident} />,
      },
      {
        id: "response",
        label: "Response Actions",
        content: <IncidentResponse incident={selectedIncident} onUpdate={handleIncidentUpdate} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview {...overviewData}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Incident Severity Distribution"
                icon={AlertTriangle}
                data={incidentSeverityDistribution}
                centerText={incidents.length.toString()}
              />
              <ThreatsTopList
                title="Critical Unresolved Incidents"
                icon={AlertTriangle}
                items={criticalUnresolvedIncidents}
                onItemClick={(id) => setSelectedIncidentId(id)}
                emptyMessage="No critical unresolved incidents"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-warning/10 text-warning";
      case "medium":
        return "bg-primary/10 text-primary";
      case "low":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-warning/10 text-warning";
      case "investigating":
        return "bg-primary/10 text-primary";
      case "contained":
        return "bg-primary/10 text-primary";
      case "resolved":
        return "bg-success/10 text-success";
      case "closed":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Incident Cases"
        context="DEWA – Transmission"
        count={filteredAndSortedIncidents.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "severity",
            label: "Severity",
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [
              { value: "all", label: "All Severities" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "open", label: "Open" },
              { value: "investigating", label: "Investigating" },
              { value: "contained", label: "Contained" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "security-breach", label: "Security Breach" },
              { value: "malware-infection", label: "Malware Infection" },
              { value: "unauthorized-access", label: "Unauthorized Access" },
              { value: "data-exfiltration", label: "Data Exfiltration" },
              { value: "system-compromise", label: "System Compromise" },
              { value: "denial-of-service", label: "Denial of Service" },
              { value: "insider-threat", label: "Insider Threat" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Severity", value: "severity" },
          { label: "Recently Created", value: "date" },
          { label: "Status", value: "status" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedIncidents.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Incidents Found"
              description="No security incidents match your current search and filters"
            />
          ) : (
            filteredAndSortedIncidents.map((incident) => (
              <ListPaneItem
                key={incident.id}
                title={incident.title}
                description={incident.incidentType.replace(/-/g, ' ')}
                status={['resolved', 'closed'].includes(incident.status) ? 'online' : (['investigating', 'contained'].includes(incident.status) ? 'maintenance' : 'pending')}
                category={`${incident.affectedSites?.length || 0} Sites`}
                value={incident.severity.toUpperCase()}
                isSelected={selectedIncidentId === incident.id}
                onClick={() => setSelectedIncidentId(incident.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedIncident ? selectedIncident.title : "Incident Management Overview"}
        subtitle={selectedIncident
          ? `${selectedIncident.severity.toUpperCase()} - ${selectedIncident.status}`
          : "Overview of security incidents, threats, and response activities"}
        tabs={tabs}
      >
        {!selectedIncident && (
          <IdentityOverview
            title="Security Incidents Overview"
            description="Track and manage security incidents, breaches, and threats across the organization."
            metrics={[
              {
                title: "Total Incidents",
                value: summaryStats.total,
                icon: AlertCircle,
                variant: "primary"
              },
              {
                title: "Active Investigations",
                value: summaryStats.investigating,
                icon: Activity,
                variant: "warning"
              },
              {
                title: "Critical Incidents",
                value: summaryStats.critical,
                icon: AlertTriangle,
                variant: summaryStats.critical > 0 ? "destructive" : "success"
              },
              {
                title: "Resolution Rate",
                value: `${summaryStats.resolutionRate}%`,
                icon: CheckCircle2,
                variant: summaryStats.resolutionRate >= 90 ? "success" : "default"
              }
            ]}
          />
        )}
      </WorkPane>
    </>
  );
}

function IncidentDetails({ incident, onUpdate }: { incident: IncidentCase; onUpdate: (incidentId: string, updates: Partial<IncidentCase>) => void }) {
  return (
    <div className="space-y-6">
      {/* Incident Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${incident.severity === "critical"
              ? "bg-destructive/10"
              : incident.severity === "high"
                ? "bg-warning/10"
                : incident.severity === "medium"
                  ? "bg-primary/10"
                  : "bg-secondary"
              }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${incident.severity === "critical"
                ? "text-destructive"
                : incident.severity === "high"
                  ? "text-warning"
                  : incident.severity === "medium"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{incident.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${incident.severity === "critical"
                  ? "bg-destructive/10 text-destructive"
                  : incident.severity === "high"
                    ? "bg-warning/10 text-warning"
                    : incident.severity === "medium"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
              >
                {incident.severity.toUpperCase()}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${incident.status === "open"
                  ? "bg-warning/10 text-warning"
                  : incident.status === "resolved"
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {incident.status.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {incident.incidentType.replace(/-/g, ' ')}
              </span>
              {/* Priority removed */}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Incident Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="text-sm font-medium">
                {new Date(incident.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(incident.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="text-sm font-medium">{incident.assignedResponders?.[0] || 'Unassigned'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Incident Type</p>
              <p className="text-sm font-medium">{incident.incidentType.replace(/-/g, ' ')}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            {/* Priority field removed from details */}
          </div>
        </div>
      </div>

      {/* Response Actions renamed to Containment Actions */}
      {incident.containmentActions && incident.containmentActions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Containment Actions Taken</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              {incident.containmentActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {incident.lessonsLearned && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Lessons Learned</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm">{incident.lessonsLearned}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentTimeline({ incident }: { incident: IncidentCase }) {
  const [timelineEntries, setTimelineEntries] = useState<IncidentTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const entries = await getIncidentTimeline(incident.tenantId, incident.id);
        setTimelineEntries(entries);
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [incident.id, incident.tenantId]);

  if (loading) {
    return <LoadingState loadingText="Loading timeline..." />;
  }

  return (
    <div className="space-y-6">
      {/* Forensic Heartbeat Heuristics */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Forensic Heartbeat
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AnalysisMetric
            label="Forensic Heartbeat"
            value={getIncidentHeuristics(incident).forensicHeartbeat}
            icon={Zap}
            variant="card"
            status={incident.severity === 'critical' ? 'failed' : 'warning'}
          />
          <AnalysisMetric
            label="Activity Density"
            value={getIncidentHeuristics(incident).activityDensity}
            icon={TrendingUp}
            variant="card"
            status="default"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Investigation Timeline
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {timelineEntries.map((entry, index) => (
            <div key={entry.id} className="p-4 flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${entry.entryType === "status-change"
                  ? "bg-primary"
                  : entry.entryType === "action-taken"
                    ? "bg-success"
                    : entry.entryType === "evidence-collected"
                      ? "bg-warning"
                      : entry.entryType === "communication"
                        ? "bg-primary"
                        : "bg-muted-foreground"
                  }`}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.description}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${entry.entryType === "status-change"
                      ? "bg-primary/10 text-primary"
                      : entry.entryType === "action-taken"
                        ? "bg-success/10 text-success"
                        : entry.entryType === "evidence-collected"
                          ? "bg-warning/10 text-warning"
                          : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {entry.entryType.replace('-', ' ')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {timelineEntries.length === 0 && (
            <div className="p-8 text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No timeline entries yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IncidentImpact({ incident }: { incident: IncidentCase }) {
  return (
    <div className="space-y-6">
      {/* Impact Depth Heuristics */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Impact Depth Heuristics
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <AnalysisMetric
            label="Continuity Risk"
            value={getIncidentHeuristics(incident).continuityRisk}
            icon={AlertTriangle}
            variant="card"
            status={incident.severity === 'critical' ? 'failed' : 'warning'}
          />
          <AnalysisMetric
            label="Regulatory Exposure"
            value={getIncidentHeuristics(incident).regulatoryExposure}
            icon={Shield}
            variant="card"
            status={getIncidentHeuristics(incident).regulatoryExposure === 'Critical' ? 'failed' : 'default'}
          />
          <AnalysisMetric
            label="Recovery Complexity"
            value={getIncidentHeuristics(incident).recoveryComplexity}
            icon={Activity}
            variant="card"
            status={getIncidentHeuristics(incident).recoveryComplexity === 'High' ? 'warning' : 'default'}
          />
        </div>
      </div>

      {/* Impact Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Impact Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Affected Sites</p>
            <p className="text-2xl font-bold">{incident.affectedSites?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Affected Assets</p>
            <p className="text-2xl font-bold">{incident.affectedAssets?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Impact Level</p>
            <p className="text-2xl font-bold text-warning">{incident.oilGas?.impactLevel || 'TBD'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Containment</p>
            <p className="text-2xl font-bold text-warning">{incident.oilGas?.containmentStatus || 'TBD'}</p>
          </div>
        </div>
      </div>

      {/* Affected Sites */}
      {incident.affectedSites && incident.affectedSites.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Affected Sites</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {incident.affectedSites.map((siteId) => (
              <div key={siteId} className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h5 className="text-sm font-medium">{siteId}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Assets */}
      {incident.affectedAssets && incident.affectedAssets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Affected Assets</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {incident.affectedAssets.map((assetId) => (
              <div key={assetId} className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h5 className="text-sm font-medium">{assetId}</h5>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="w-3 h-3" />
                  {incident.assignedResponders?.length ? '1 responder' : 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentResponse({ incident, onUpdate }: { incident: IncidentCase; onUpdate: (incidentId: string, updates: Partial<IncidentCase>) => void }) {
  return (
    <div className="space-y-6">
      {/* Response Team */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Response Team</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h5 className="text-sm font-medium">{incident.assignedResponders?.[0] || 'Unassigned'}</h5>
          </div>
          {/* Incident Commander removed as it doesn't exist in type */}
        </div>
      </div>

      {/* Response Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Response Actions</h4>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            Update Status
          </button>
          <button className="bg-card border border-border hover:border-primary/30 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            Add Responder
          </button>
          <button className="bg-card border border-border hover:border-primary/30 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            Log Action
          </button>
          <button className="bg-card border border-border hover:border-primary/30 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Additional Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Additional Actions</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Escalate to Management</p>
            <p className="text-xs text-muted-foreground mt-1">
              Notify senior management about incident status
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Create Regulatory Report</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate report for regulatory notification
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Schedule Post-Incident Review</p>
            <p className="text-xs text-muted-foreground mt-1">
              Plan lessons learned session with team
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Export Incident Data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Download incident details and timeline
            </p>
          </button>
        </div>
      </div>

      {/* Investigation Notes */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Investigation Notes</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <textarea
            className="w-full min-h-[120px] bg-transparent border-0 focus:outline-none text-sm resize-none"
            placeholder="Add notes about the investigation progress..."
          />
          <div className="flex justify-end mt-2">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded text-xs font-medium transition-colors">
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}