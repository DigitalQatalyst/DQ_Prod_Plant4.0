import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Thermometer,
  Gauge,
  Shield,
  Link,
  Target,
  CheckCircle2,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getAnomalySignals,
  updateAnomalySignal,
  getBehavioralBaselines
} from "@/lib/threatMonitoringQueries";
import type {
  AnomalySignal,
  AnomalySeverity,
  AnomalyStatus,
  BehavioralBaseline
} from "@/types/security";

export function AnomalySignals() {
  const { currentTenant } = useApp();

  // State management
  const [anomalies, setAnomalies] = useState<AnomalySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("detectedAt");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load anomalies
  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        setLoading(true);
        const data = await getAnomalySignals(currentTenant.id, {
          limit: 100
        });
        setAnomalies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load anomalies');
      } finally {
        setLoading(false);
      }
    };

    loadAnomalies();
  }, [currentTenant.id]);

  // Filter and sort anomalies
  const filteredAndSortedAnomalies = useMemo(() => {
    let result = [...anomalies];

    // Search filtering
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.anomalyType?.toLowerCase().includes(query) ||
        a.parameter?.toLowerCase().includes(query) ||
        (a.potentialCause || '').toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((anomaly) => anomaly.anomalyType === typeFilter);
    }

    // Apply severity filter
    if (severityFilter !== "all") {
      result = result.filter((anomaly) => anomaly.severity === severityFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((anomaly) => anomaly.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      }
      if (sortBy === 'detectedAt') {
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      }
      if (sortBy === 'deviation') {
        return Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage);
      }
      return 0;
    });

    return result;
  }, [anomalies, typeFilter, severityFilter, statusFilter, searchTerm, sortBy]);

  const selectedAnomaly = anomalies.find((a) => a.id === selectedAnomalyId);

  // Handle anomaly updates
  const handleAnomalyUpdate = async (anomalyId: string, updates: Partial<AnomalySignal>) => {
    try {
      const updatedAnomaly = await updateAnomalySignal(currentTenant.id, anomalyId, updates);
      setAnomalies(prev => prev.map(anomaly =>
        anomaly.id === anomalyId ? { ...anomaly, ...updatedAnomaly } : anomaly
      ));
    } catch (err) {
      console.error('Failed to update anomaly:', err);
    }
  };

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-warning/10 text-warning";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "voltage-deviation":
        return <Zap className="h-4 w-4" />;
      case "frequency-anomaly":
        return <Activity className="h-4 w-4" />;
      case "load-imbalance":
        return <BarChart3 className="h-4 w-4" />;
      case "protection-relay-trip":
        return <Shield className="h-4 w-4" />;
      case "transformer-overload":
        return <Gauge className="h-4 w-4" />;
      case "communication-failure":
        return <Link className="h-4 w-4" />;
      case "switching-anomaly":
        return <Target className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "voltage-deviation":
        return "Voltage Deviation";
      case "frequency-anomaly":
        return "Frequency Anomaly";
      case "load-imbalance":
        return "Load Imbalance";
      case "protection-relay-trip":
        return "Protection Relay Trip";
      case "transformer-overload":
        return "Transformer Overload";
      case "communication-failure":
        return "Communication Failure";
      case "switching-anomaly":
        return "Switching Anomaly";
      default:
        return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDeviation = (deviation: number) => {
    const sign = deviation >= 0 ? "+" : "";
    return `${sign}${deviation.toFixed(1)}%`;
  };

  if (loading) {
    return <LoadingState loadingText="Loading API keys..." />;
  }

  if (error) {
    return <EmptyState
      title="Error Loading Anomalies"
      description={error}
      icon={AlertTriangle}
    />;
  }

  const tabs = selectedAnomaly
    ? [
      {
        id: "signal-details",
        label: "Signal Details",
        content: <SignalDetails anomaly={selectedAnomaly} onUpdate={handleAnomalyUpdate} />,
      },
      {
        id: "baseline",
        label: "Baseline Comparison",
        content: <BaselineComparison anomaly={selectedAnomaly} />,
      },
      {
        id: "correlations",
        label: "Correlations",
        content: <Correlations anomaly={selectedAnomaly} />,
      },
      {
        id: "actions",
        label: "Actions",
        content: <AnomalyActions anomaly={selectedAnomaly} onUpdate={handleAnomalyUpdate} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview
            title="Anomaly Signals Overview"
            description="Monitor and analyze behavioral anomalies detected across the transmission grid infrastructure."
            metrics={[
              {
                title: "Total Anomalies",
                value: anomalies.length,
                icon: Activity,
                variant: "primary" as const
              },
              {
                title: "Critical Signals",
                value: anomalies.filter(a => a.severity === 'critical').length,
                icon: AlertTriangle,
                variant: anomalies.filter(a => a.severity === 'critical').length > 0 ? "destructive" as const : "default" as const
              },
              {
                title: "Under Investigation",
                value: anomalies.filter(a => a.status === 'investigating').length,
                icon: Target,
                variant: "warning" as const
              },
              {
                title: "Resolved Today",
                value: anomalies.filter(a => a.status === 'resolved' && new Date(a.detectedAt).toDateString() === new Date().toDateString()).length,
                icon: CheckCircle2,
                variant: "success" as const
              }
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Anomaly Severity Distribution"
                icon={AlertTriangle}
                data={[
                  { name: 'Critical', value: anomalies.filter(a => a.severity === 'critical').length, color: 'hsl(var(--destructive))' },
                  { name: 'High', value: anomalies.filter(a => a.severity === 'high').length, color: 'hsl(var(--warning))' },
                  { name: 'Medium', value: anomalies.filter(a => a.severity === 'medium').length, color: 'hsl(var(--primary))' },
                  { name: 'Low', value: anomalies.filter(a => a.severity === 'low').length, color: 'hsl(var(--secondary))' },
                ].filter(d => d.value > 0)}
                centerText={anomalies.length.toString()}
              />
              <ThreatsTopList
                title="Critical Unresolved Anomalies"
                icon={AlertTriangle}
                items={anomalies
                  .filter(a => a.severity === 'critical' && a.status !== 'resolved')
                  .map(a => ({
                    id: a.id,
                    title: a.anomalyType.replace('-', ' '),
                    subtitle: `Detected: ${new Date(a.detectedAt).toLocaleString()}`,
                    icon: getTypeIcon(a.anomalyType).type,
                    variant: 'destructive' as const
                  }))
                  .slice(0, 5)}
                emptyMessage="No critical unresolved anomalies"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];



  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Anomaly Signals"
        context="DEWA – Transmission"
        count={filteredAndSortedAnomalies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type", label: "Anomaly Type", value: typeFilter, options: [
              { label: "All Types", value: "all" },
              { label: "Voltage Deviation", value: "voltage-deviation" },
              { label: "Frequency Anomaly", value: "frequency-anomaly" },
              { label: "Load Imbalance", value: "load-imbalance" },
              { label: "Relay Trip", value: "protection-relay-trip" },
              { label: "Transformer Overload", value: "transformer-overload" },
              { label: "Communication Failure", value: "communication-failure" },
              { label: "Switching Anomaly", value: "switching-anomaly" },
            ], onChange: setTypeFilter
          },
          {
            key: "severity", label: "Severity", value: severityFilter, options: [
              { label: "All Severities", value: "all" },
              { label: "Critical", value: "critical" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ], onChange: setSeverityFilter
          },
          {
            key: "status", label: "Status", value: statusFilter, options: [
              { label: "All Statuses", value: "all" },
              { label: "New", value: "new" },
              { label: "Investigating", value: "investigating" },
              { label: "Confirmed", value: "confirmed" },
              { label: "False Positive", value: "false-positive" },
              { label: "Resolved", value: "resolved" },
            ], onChange: setStatusFilter
          }
        ]}
        sortOptions={[
          { label: "Date (Newest)", value: "detectedAt" },
          { label: "Severity", value: "severity" },
          { label: "Deviation Magnitude", value: "deviation" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {filteredAndSortedAnomalies.map((anomaly) => (
          <ListPaneItem
            key={anomaly.id}
            title={getTypeLabel(anomaly.anomalyType || 'unknown')}
            description={`${anomaly.parameter}: ${anomaly.observedValue} ${anomaly.unit}`}
            status={anomaly.severity === 'critical' ? 'offline' : (anomaly.severity === 'high' ? 'maintenance' : 'online')}
            category={anomaly.anomalyType?.replace('-', ' ')}
            value={formatDeviation(anomaly.deviationPercentage || 0)}
            isSelected={selectedAnomalyId === anomaly.id}
            onClick={() => setSelectedAnomalyId(anomaly.id)}
          />
        ))}
      </ListPane>

      <WorkPane
        title={selectedAnomaly ? getTypeLabel(selectedAnomaly.anomalyType || 'unknown') : "Anomaly Signals"}
        subtitle={selectedAnomaly ? `${selectedAnomaly.parameter} - ${selectedAnomaly.status}` : "Select an anomaly to view details"}
        tabs={tabs}
      />
    </div>
  );
}

// Signal Details Component
function SignalDetails({ anomaly, onUpdate }: { anomaly: AnomalySignal; onUpdate: (anomalyId: string, updates: Partial<AnomalySignal>) => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Signal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Parameter</label>
              <div className="text-sm">{anomaly.parameter}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="text-sm">{anomaly.anomalyType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Severity</label>
              <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                {anomaly.severity}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={anomaly.status === 'new' ? 'destructive' : 'secondary'}>
                {anomaly.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Detected At</label>
              <div className="text-sm">{new Date(anomaly.detectedAt).toLocaleString()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Unit</label>
              <div className="text-sm">{anomaly.unit}</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Analysis Notes</label>
            <div className="text-sm mt-1 p-3 bg-muted rounded-md">{anomaly.potentialCause || 'No analysis notes available'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Baseline Comparison Component
function BaselineComparison({ anomaly }: { anomaly: AnomalySignal }) {
  const deviationColor = anomaly.deviationPercentage >= 0 ? "text-red-600" : "text-blue-600";
  const deviationIcon = anomaly.deviationPercentage >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Baseline vs Observed Values
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">
                {anomaly.baselineValue?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Baseline Value</div>
              <div className="text-xs text-muted-foreground">{anomaly.unit}</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {anomaly.observedValue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Observed Value</div>
              <div className="text-xs text-muted-foreground">{anomaly.unit}</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${deviationColor}`}>
                {deviationIcon}
                {Math.abs(anomaly.deviationPercentage).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Deviation</div>
              <div className="text-xs text-muted-foreground">
                {anomaly.deviationPercentage >= 0 ? "Above" : "Below"} baseline
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Value Comparison</div>
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-muted-foreground/20 rounded-full"
                style={{ width: '50%' }}
              />
              <div
                className={`absolute top-0 h-full rounded-full ${anomaly.deviationPercentage >= 0 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                style={{
                  left: anomaly.deviationPercentage >= 0 ? '50%' : `${50 + (anomaly.deviationPercentage / 2)}%`,
                  width: `${Math.abs(anomaly.deviationPercentage) / 2}%`
                }}
              />
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-foreground/50" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Lower</span>
              <span>Baseline</span>
              <span>Higher</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Correlations Component
function Correlations({ anomaly }: { anomaly: AnomalySignal }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Correlated Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anomaly.correlatedEvents && anomaly.correlatedEvents.length > 0 ? (
            <div className="space-y-3">
              {anomaly.correlatedEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No correlated events found</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Anomaly Actions Component
function AnomalyActions({ anomaly, onUpdate }: { anomaly: AnomalySignal; onUpdate: (anomalyId: string, updates: Partial<AnomalySignal>) => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {anomaly.severity === 'critical' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium">
                  <Shield className="h-4 w-4" />
                  Critical Anomaly Alert
                </div>
                <div className="text-sm text-red-700 mt-1">
                  This anomaly requires immediate investigation and response.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Immediate Actions:</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Verify current system status and readings</li>
                <li>• Check for ongoing maintenance or operational changes</li>
                <li>• Review recent control system modifications</li>
                {anomaly.severity === 'critical' && (
                  <li className="text-red-600">• Notify operations personnel immediately</li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Investigation Steps:</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Analyze historical trends for this parameter</li>
                <li>• Correlate with other system events</li>
                <li>• Check for similar anomalies in related systems</li>
                <li>• Review access logs for unauthorized changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}