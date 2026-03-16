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
  User,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Network,
  TrendingUp,
  Target,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTrendChart } from "@/components/security/ThreatsTrendChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getSecurityAlerts,
  updateSecurityAlert,
  getAlertCorrelations,
  linkIncidentToAlert
} from "@/lib/threatMonitoringQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  TransmissionSecurityAlert as BaseTransmissionSecurityAlert,
  SecurityAlertSeverity,
  SecurityAlertStatus,
  TransmissionThreatCategory
} from "@/types/security";

// Extended type for UI purposes
interface TransmissionSecurityAlert extends BaseTransmissionSecurityAlert {
  affectedAsset?: string;
  affectedAssetId?: string;
}

// Helper components for tab refinements

function getAlertHeuristics(alert: TransmissionSecurityAlert) {
  const isCritical = alert.severity === 'critical';
  const isHigh = alert.severity === 'high';
  const category = (alert.threatCategory || alert.category || '').toLowerCase();

  let recommendations = alert.mitigationSteps || (isCritical ? [
    "Immediately isolate affected systems from the network",
    "Notify security team and management",
    "Begin incident response procedures"
  ] : [
    "Monitor system for suspicious activity",
    "Review access logs for affected asset",
    "Verify system integrity and configuration"
  ]);

  // Contextual additions
  if (category.includes('injection') || category.includes('scada')) {
    recommendations = [...recommendations, "Perform deep packet inspection on SCADA protocols"];
  }
  if (category.includes('ddos')) {
    recommendations = [...recommendations, "Activate upstream traffic scrubbing", "Verify BGP flowspec rules"];
  }

  return {
    recommendations,
    propagationVelocity: isCritical ? "92%" : isHigh ? "65%" : "28%",
    isolationConfidence: isCritical ? "45%" : isHigh ? "78%" : "95%",
    redundancyDepth: alert.escalationLevel >= 3 ? "Low" : "Optimal",
    systemStress: isCritical ? "Critical" : isHigh ? "High" : "Stable"
  };
}

export function SecurityAlertInbox() {
  const { currentTenant } = useApp();

  // State management
  const [alerts, setAlerts] = useState<TransmissionSecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [threatCategoryFilter, setThreatCategoryFilter] = useState<string>("all");
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [escalationLevelFilter, setEscalationLevelFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("escalation");

  // Load alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data = await getSecurityAlerts(currentTenant.id, {
          limit: 100
        });
        setAlerts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [currentTenant.id]);

  // Filter and sort alerts
  const filteredAndSortedAlerts = useMemo(() => {
    // Search
    const query = searchTerm.toLowerCase();
    let result = alerts.filter((alert) => {
      const matchesSearch =
        (alert.title || '').toLowerCase().includes(query) ||
        (alert.description || '').toLowerCase().includes(query) ||
        (alert.assetId || '').toLowerCase().includes(query);

      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
      const matchesCategory = threatCategoryFilter === "all" || alert.threatCategory === threatCategoryFilter;
      const matchesProtocol = protocolFilter === "all" || alert.affectedProtocol === protocolFilter;

      let matchesEscalation = true;
      if (escalationLevelFilter !== "all") {
        const level = parseInt(escalationLevelFilter);
        matchesEscalation = alert.escalationLevel >= level;
      }

      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesProtocol && matchesEscalation;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "escalation") {
        if (a.escalationLevel !== b.escalationLevel) return b.escalationLevel - a.escalationLevel;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "severity") {
        const priority = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return (priority[a.severity as keyof typeof priority] || 5) - (priority[b.severity as keyof typeof priority] || 5);
      }
      return 0;
    });

    return result;
  }, [alerts, searchTerm, severityFilter, statusFilter, threatCategoryFilter, protocolFilter, escalationLevelFilter, sortBy]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

  // Compute overview data and charts (must be before any conditional returns per Rules of Hooks)
  const overviewData = {
    title: "Security Alert Inbox Overview",
    description: "Monitor and respond to real-time security threats, anomalies, and compliance violations across the transmission network.",
    metrics: [
      {
        title: "Total Alerts",
        value: alerts.length,
        icon: Activity,
        variant: "primary" as const
      },
      {
        title: "Critical Alerts",
        value: alerts.filter(a => a.severity === 'critical').length,
        icon: AlertTriangle,
        variant: alerts.some(a => a.severity === 'critical') ? "destructive" as const : "default" as const
      },
      {
        title: "New Alerts",
        value: alerts.filter(a => a.status === 'new').length,
        icon: Shield,
        variant: alerts.some(a => a.status === 'new') ? "warning" as const : "default" as const
      },
      {
        title: "Average Response Time",
        value: alerts.length > 0 ? "< 15 min" : "N/A",
        icon: Clock,
        variant: "success" as const
      }
    ]
  };

  const severityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    alerts.forEach(a => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: 'hsl(var(--destructive))' },
      { name: 'High', value: counts.high, color: 'hsl(var(--warning))' },
      { name: 'Medium', value: counts.medium, color: 'hsl(var(--primary))' },
      { name: 'Low', value: counts.low, color: 'hsl(var(--secondary))' },
      { name: 'Info', value: counts.info, color: 'hsl(var(--muted))' },
    ].filter(d => d.value > 0);
  }, [alerts]);

  const topTargetedAssets = useMemo(() => {
    const assetCounts: Record<string, number> = {};
    alerts.forEach(a => {
      const assetName = a.assetId || 'Unknown Asset';
      assetCounts[assetName] = (assetCounts[assetName] || 0) + 1;
    });
    return Object.entries(assetCounts)
      .map(([name, count]) => ({
        id: name,
        title: name,
        value: count,
        icon: Shield,
        variant: 'default' as const
      }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  }, [alerts]);

  const alertTrend = useMemo(() => {
    // Generate simple trend from last 7 days of alerts
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend: Record<string, number> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      trend[days[d.getDay()]] = 0;
    }

    alerts.forEach(a => {
      const d = new Date(a.createdAt);
      const day = days[d.getDay()];
      if (trend[day] !== undefined) trend[day]++;
    });

    return Object.entries(trend).map(([name, count]) => ({ date: name, count }));
  }, [alerts]);

  // Handle alert updates
  const handleAlertUpdate = async (alertId: string, updates: Partial<TransmissionSecurityAlert>) => {
    try {
      const updatedAlert = await updateSecurityAlert(currentTenant.id, alertId, updates);
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, ...updatedAlert } : alert
      ));
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  if (loading) {
    return <LoadingState loadingText="Loading security alerts..." />;
  }

  if (error) {
    return <EmptyState
      title="Error Loading Alerts"
      description={error}
      icon={AlertTriangle}
    />;
  }

  const tabs = selectedAlert
    ? [
      {
        id: "details",
        label: "Details",
        content: <AlertDetails alert={selectedAlert} onUpdate={handleAlertUpdate} />,
      },
      {
        id: "affected-systems",
        label: "Affected Systems",
        content: <AffectedSystems alert={selectedAlert} />,
      },
      {
        id: "grid-impact",
        label: "Grid Impact",
        content: <GridImpact alert={selectedAlert} />,
      },
      {
        id: "timeline",
        label: "Timeline",
        content: <AlertTimeline alert={selectedAlert} />,
      },
      {
        id: "actions",
        label: "Actions",
        content: <AlertActions alert={selectedAlert} onUpdate={handleAlertUpdate} />,
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
                title="Severity Distribution"
                icon={AlertTriangle}
                data={severityDistribution}
                centerText={alerts.length.toString()}
              />
              <ThreatsTrendChart
                title="Alert Trend (7 Days)"
                icon={Activity}
                data={alertTrend}
              />
              <div className="lg:col-span-2">
                <ThreatsTopList
                  title="Top Targeted Assets"
                  icon={Shield}
                  items={topTargetedAssets}
                  emptyMessage="No assets targeted by recent alerts"
                />
              </div>
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
      case "new":
        return "bg-warning/10 text-warning";
      case "acknowledged":
        return "bg-primary/10 text-primary";
      case "investigating":
        return "bg-primary/10 text-primary";
      case "resolved":
        return "bg-success/10 text-success";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Security Alerts"
        context="DEWA – Transmission"
        count={filteredAndSortedAlerts.length}
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
              { value: "info", label: "Info" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "new", label: "New" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "investigating", label: "Investigating" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            key: "threatCategory",
            label: "Category",
            value: threatCategoryFilter,
            onChange: setThreatCategoryFilter,
            options: [
              { value: "all", label: "All Categories" },
              { value: "switching-manipulation", label: "Switching manipulation" },
              { value: "relay-tampering", label: "Relay tampering" },
              { value: "scada-compromise", label: "SCADA compromise" },
              { value: "protocol-abuse", label: "Protocol abuse" },
              { value: "unauthorized-access", label: "Unauthorized access" },
              { value: "denial-of-service", label: "Denial of service" },
            ],
          },
          {
            key: "escalation",
            label: "Escalation",
            value: escalationLevelFilter,
            onChange: setEscalationLevelFilter,
            options: [
              { value: "all", label: "All Levels" },
              { value: "5", label: "Level 5+" },
              { value: "4", label: "Level 4+" },
              { value: "3", label: "Level 3+" },
              { value: "2", label: "Level 2+" },
              { value: "1", label: "Level 1+" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Escalation", value: "escalation" },
          { label: "Recently Detected", value: "date" },
          { label: "Severity", value: "severity" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedAlerts.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Alerts Found"
              description="No security alerts match your current filters"
            />
          ) : (
            filteredAndSortedAlerts.map((alert) => (
              <ListPaneItem
                key={alert.id}
                title={alert.title}
                description={alert.threatCategory?.replace(/-/g, ' ') || 'unspecified threat'}
                status={['resolved', 'closed'].includes(alert.status) ? 'online' : (['investigating', 'in-progress'].includes(alert.status) ? 'maintenance' : 'pending')}
                category={alert.assetId || 'Unknown Asset'}
                value={alert.severity.toUpperCase()}
                isSelected={selectedAlertId === alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedAlert ? selectedAlert.title : "Security Alert Inbox Overview"}
        subtitle={selectedAlert ? `${selectedAlert.severity.toUpperCase()} - ${selectedAlert.status}` : currentTenant?.name}
        tabs={tabs}
      />
    </>
  );
}

function AlertDetails({ alert, onUpdate }: { alert: TransmissionSecurityAlert; onUpdate: (alertId: string, updates: Partial<TransmissionSecurityAlert>) => void }) {
  return (
    <div className="space-y-6">
      {/* Alert Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${alert.severity === "critical"
              ? "bg-destructive/10"
              : alert.severity === "high"
                ? "bg-warning/10"
                : alert.severity === "medium"
                  ? "bg-primary/10"
                  : "bg-secondary"
              }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${alert.severity === "critical"
                ? "text-destructive"
                : alert.severity === "high"
                  ? "text-warning"
                  : alert.severity === "medium"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{alert.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${alert.severity === "critical"
                  ? "bg-destructive/10 text-destructive"
                  : alert.severity === "high"
                    ? "bg-warning/10 text-warning"
                    : alert.severity === "medium"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
              >
                {alert.severity.toUpperCase()}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${alert.status === "new"
                  ? "bg-warning/10 text-warning"
                  : alert.status === "resolved"
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {alert.status.toUpperCase()}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${alert.threatCategory || alert.category
                  }`}
              >
                {alert.threatCategory?.replace('-', ' ').toUpperCase() || alert.category?.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Alert Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Detected At</p>
              <p className="text-sm font-medium">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Detected By</p>
              <p className="text-sm font-medium">{alert.detectedBy}</p>
            </div>
          </div>
          {alert.assignedTo && (
            <div className="p-4 flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium">{alert.assignedTo}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Threat Category</p>
              <p className="text-sm font-medium">{alert.threatCategory || alert.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recommended Actions</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {getAlertHeuristics(alert).recommendations.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Critical Escalation Alert Warning */}
      {alert.escalationLevel >= 4 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-destructive mb-2">Critical Escalation Alert</h4>
              <p className="text-sm text-destructive/80">
                This alert has reached escalation level {alert.escalationLevel}. Immediate attention and proper protocols are required.
                Coordinate with operations personnel and follow emergency response procedures.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AffectedSystems({ alert }: { alert: TransmissionSecurityAlert }) {
  // Mock affected systems data
  const affectedSystems = alert.assetId
    ? [
      {
        id: alert.assetId,
        name: alert.assetId,
        type: "Primary",
        status: "affected",
        impact: "High",
      },
    ]
    : [];

  // Add some related systems
  const relatedSystems = [
    {
      id: "2",
      name: "Network Switch NS-01",
      type: "Related",
      status: "monitoring",
      impact: "Medium",
    },
    {
      id: "3",
      name: "Firewall FW-Main",
      type: "Related",
      status: "secure",
      impact: "Low",
    },
  ];

  const allSystems = [...affectedSystems, ...relatedSystems];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Affected and Related Systems</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {allSystems.map((system) => (
            <div key={system.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h5 className="text-sm font-medium">{system.name}</h5>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${system.status === "affected"
                    ? "bg-destructive/10 text-destructive"
                    : system.status === "monitoring"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                    }`}
                >
                  {system.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Type: {system.type}</span>
                <span>·</span>
                <span>Impact: {system.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Impact Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Systems</p>
            <p className="text-2xl font-bold">{allSystems.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Directly Affected</p>
            <p className="text-2xl font-bold text-destructive">
              {affectedSystems.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Under Monitoring</p>
            <p className="text-2xl font-bold text-warning">
              {relatedSystems.filter((s) => s.status === "monitoring").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertTimeline({ alert }: { alert: TransmissionSecurityAlert }) {
  // Mock timeline events
  const timelineEvents = [
    {
      id: "1",
      timestamp: alert.createdAt,
      event: "Alert Created",
      description: `${alert.severity} severity alert detected by ${alert.detectedBy}`,
      type: "created",
    },
    {
      id: "2",
      timestamp: new Date(
        new Date(alert.createdAt).getTime() + 5 * 60000
      ).toISOString(),
      event: alert.status === "acknowledged" || alert.status === "investigating" || alert.status === "resolved" ? "Alert Acknowledged" : "Pending Acknowledgment",
      description: alert.assignedTo
        ? `Assigned to ${alert.assignedTo}`
        : "Awaiting assignment",
      type: alert.status === "acknowledged" || alert.status === "investigating" || alert.status === "resolved" ? "acknowledged" : "pending",
    },
  ];

  if (alert.status === "investigating" || alert.status === "resolved") {
    timelineEvents.push({
      id: "3",
      timestamp: new Date(
        new Date(alert.createdAt).getTime() + 15 * 60000
      ).toISOString(),
      event: "Investigation Started",
      description: "Security team began investigating the alert",
      type: "investigating",
    });
  }

  if (alert.status === "resolved") {
    timelineEvents.push({
      id: "4",
      timestamp: new Date(
        new Date(alert.createdAt).getTime() + 60 * 60000
      ).toISOString(),
      event: "Alert Resolved",
      description: "Issue has been resolved and verified",
      type: "resolved",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Event Timeline
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="p-4 flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${event.type === "created"
                  ? "bg-warning"
                  : event.type === "acknowledged"
                    ? "bg-primary"
                    : event.type === "investigating"
                      ? "bg-primary"
                      : event.type === "resolved"
                        ? "bg-success"
                        : "bg-muted-foreground"
                  }`}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{event.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.description}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${event.type === "created"
                      ? "bg-warning/10 text-warning"
                      : event.type === "resolved"
                        ? "bg-success/10 text-success"
                        : event.type === "pending"
                          ? "bg-secondary text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                  >
                    {event.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Timeline Summary</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alert Age</span>
              <span className="text-sm font-medium">
                {Math.floor(
                  (Date.now() - new Date(alert.createdAt).getTime()) / 60000
                )}{" "}
                minutes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Status</span>
              <span className="text-sm font-medium">{alert.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Events</span>
              <span className="text-sm font-medium">{timelineEvents.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GridImpact({ alert }: { alert: TransmissionSecurityAlert }) {
  return (
    <div className="space-y-6">
      {/* Grid Impact Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          Grid Impact Heuristics
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AnalysisMetric
            label="Propagation Velocity"
            value={getAlertHeuristics(alert).propagationVelocity}
            icon={Zap}
            variant="card"
            status={alert.severity === 'critical' ? 'failed' : 'warning'}
          />
          <AnalysisMetric
            label="Isolation Confidence"
            value={getAlertHeuristics(alert).isolationConfidence}
            icon={Shield}
            variant={getAlertHeuristics(alert).isolationConfidence.startsWith('4') ? 'destructive' : 'success'}
          />
          <AnalysisMetric
            label="Redundancy Depth"
            value={getAlertHeuristics(alert).redundancyDepth}
            icon={Activity}
            variant="card"
            status={getAlertHeuristics(alert).redundancyDepth === 'Optimal' ? 'success' : 'failed'}
          />
          <AnalysisMetric
            label="System Stress"
            value={getAlertHeuristics(alert).systemStress}
            icon={TrendingUp}
            variant="card"
            status={alert.severity === 'critical' ? 'failed' : 'warning'}
          />
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Escalation Level</p>
              <p className="text-2xl font-bold text-destructive">{alert.escalationLevel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Affected Protocol</p>
              <p className="text-sm font-medium">{alert.affectedProtocol || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Affected Grid Components */}
      {(alert.gridNodeId || alert.gridLineId) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Affected Grid Components</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {alert.gridNodeId && (
              <div className="p-4 flex items-center gap-3">
                <Zap className="w-4 h-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Grid Node</p>
                  <p className="text-sm font-medium">{alert.gridNodeId}</p>
                </div>
              </div>
            )}
            {alert.gridLineId && (
              <div className="p-4 flex items-center gap-3">
                <Network className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Grid Line</p>
                  <p className="text-sm font-medium">{alert.gridLineId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blast Radius Assessment */}
      {alert.blastRadiusAssessment && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Blast Radius Assessment</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Impact analysis data available. Detailed assessment can be viewed in the Impact Analysis module.
            </p>
          </div>
        </div>
      )}

      {/* Mitigation Status */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Mitigation Status</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mitigation Steps Available</span>
              <span className="text-sm font-medium">
                {alert.mitigationSteps?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Evidence Collected</span>
              <span className="text-sm font-medium">
                {alert.evidenceCollected?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">False Positive</span>
              <span className={`text-sm font-medium ${alert.falsePositive ? 'text-success' : 'text-muted-foreground'}`}>
                {alert.falsePositive ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertActions({ alert, onUpdate }: { alert: TransmissionSecurityAlert; onUpdate: (alertId: string, updates: Partial<TransmissionSecurityAlert>) => void }) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Contextual Response</h4>
        <div className="grid grid-cols-2 gap-4">
          <button className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${alert.status === 'new' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card border border-border opacity-50 cursor-not-allowed'
            }`}>
            {alert.status === 'new' ? 'Acknowledge Alert' : 'Acknowledged'}
          </button>
          <button className="bg-card border border-border hover:border-primary/30 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            {alert.assignedTo ? 'Reassign Task' : 'Assign to User'}
          </button>
          <button className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${alert.status === 'resolved' ? 'bg-card border border-border opacity-50 cursor-not-allowed' : 'bg-card border border-border hover:border-primary/30'
            }`}>
            Investigate Context
          </button>
          <button className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${alert.severity === 'critical' ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-success text-white hover:bg-success/90'
            }`}>
            Resolution Protocol
          </button>
        </div>
      </div>

      {/* Additional Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Additional Actions</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Export Alert Details</p>
            <p className="text-xs text-muted-foreground mt-1">
              Download alert information as PDF or CSV
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Create Incident Ticket</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate incident ticket in ticketing system
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Add to Watchlist</p>
            <p className="text-xs text-muted-foreground mt-1">
              Monitor this alert for similar patterns
            </p>
          </button>
          <button className="w-full p-4 text-left hover:bg-secondary/50 transition-colors">
            <p className="text-sm font-medium">Share with Team</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send alert details to team members
            </p>
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Investigation Notes</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <textarea
            className="w-full min-h-[120px] bg-transparent border-0 focus:outline-none text-sm resize-none"
            placeholder="Add notes about your investigation..."
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
