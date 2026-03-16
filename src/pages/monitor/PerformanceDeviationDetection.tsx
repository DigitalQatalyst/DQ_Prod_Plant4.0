import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Info,
  History
} from "lucide-react";
import { usePerformanceDeviations, usePerformanceBenchmarks, useAssets } from "@/hooks/useAPM";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

interface DeviationEvent {
  id: string;
  assetId: string;
  assetName: string;
  parameter: string;
  deviationScore: number; // 0-100
  deviationType: "positive" | "negative";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "investigating" | "resolved" | "acknowledged";
  detectedAt: string;
  duration: number; // hours
  baselineValue: number;
  currentValue: number;
  expectedValue: number;
  contributingSignals: string[];
  rootCause?: string;
  corrective_actions?: string[];
}

interface BaselineComparison {
  assetId: string;
  assetName: string;
  parameter: string;
  currentValue: number;
  baselineValue: number;
  expectedValue: number;
  deviationPercent: number;
  trend: "improving" | "stable" | "degrading";
  confidence: number; // 0-100
  lastCalibrated: string;
  recommendRecalibration: boolean;
}

export function PerformanceDeviationDetection() {
  const { assets: globalAssets, selectedAsset, setSelectedAsset } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "critical">("all");

  // Calculate time range for queries
  const { periodStart, periodEnd } = useMemo(() => {
    const start = new Date(Date.now() - (timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720) * 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();
    return { periodStart: start, periodEnd: end };
  }, [timeRange]);

  // ─── Mock Assets Fallback ──────────────────────────────────────────────────
  const mockAssets: Asset[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", type: "Power Transformer", location: "Substation Alpha", site: "Substation Alpha", area: "Yard 1", status: "online", criticality: "critical", lastSeen: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", type: "Circuit Breaker", location: "Substation Alpha", site: "Substation Alpha", area: "Bay 2", status: "online", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", type: "Power Transformer", location: "Substation Beta", site: "Substation Beta", area: "Yard 2", status: "maintenance", criticality: "medium", lastSeen: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", type: "Circuit Breaker", location: "Substation Beta", site: "Substation Beta", area: "Bay 1", status: "offline", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", type: "Line Terminal", location: "Substation Gamma", site: "Substation Gamma", area: "Line Yard", status: "online", criticality: "critical", lastSeen: new Date().toISOString() }
  ], []);

  // Use database assets if available, otherwise fall back to mock assets
  const { data: assetsResponse, loading: assetsLoading } = useAssets({
    pageSize: 100
  });

  const assets = useMemo(() => {
    const realAssets = assetsResponse?.data || [];
    if (!assetsLoading && realAssets.length === 0) return mockAssets;
    return realAssets;
  }, [assetsResponse?.data, assetsLoading, mockAssets]);

  // Use local state for this page, but update global context when asset is selected
  // Ensure currentAsset is actually in our assets list, otherwise treat as no selection for this specific page
  const currentAsset = useMemo(() => {
    const candidate = selectedAssetLocal || (selectedAsset as Asset);
    if (!candidate || !candidate.id) return null;
    return assets.find(a => a.id === candidate.id) || null;
  }, [selectedAssetLocal, selectedAsset, assets]);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  // Fetch performance deviations from database
  const { data: deviationsData, loading: deviationsLoading, error: deviationsError } = usePerformanceDeviations({
    asset_id: currentAsset?.id,
    from: periodStart,
    to: periodEnd,
  });

  // Fetch performance benchmarks
  const { data: benchmarksData, loading: benchmarksLoading } = usePerformanceBenchmarks({});

  // Helper for deterministic random
  function deterministicSeeded(id: string, offset: number, min: number, max: number) {
    let hash = 0;
    const str = id + offset;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const val = Math.abs(hash) % 10000;
    return min + (val / 10000) * (max - min);
  }

  // Transform deviations data into display format
  const deviationEvents = useMemo(() => {
    if ((deviationsData && deviationsData.length > 0) || deviationsLoading) {
      if (!deviationsData) return [];
      return deviationsData.map(deviation => {
        const asset = assets.find(a => a.id === deviation.asset_id);
        const magnitude = Math.abs(deviation.magnitude);

        let severity: "low" | "medium" | "high" | "critical";
        if (magnitude > 80) severity = "critical";
        else if (magnitude > 60) severity = "high";
        else if (magnitude > 30) severity = "medium";
        else severity = "low";

        const deviationScore = Math.min(100, magnitude * 2);

        return {
          id: deviation.id,
          assetId: deviation.asset_id,
          assetName: asset?.name || deviation.asset_id,
          parameter: deviation.deviation_type,
          deviationScore,
          deviationType: deviation.magnitude > 0 ? "positive" as const : "negative" as const,
          severity,
          status: severity === "critical" ? "investigating" as const :
            severity === "high" ? "active" as const : "acknowledged" as const,
          detectedAt: deviation.detected_at,
          duration: deviation.telemetry_window_end && deviation.telemetry_window_start ?
            (new Date(deviation.telemetry_window_end).getTime() - new Date(deviation.telemetry_window_start).getTime()) / (1000 * 60 * 60) : 0,
          baselineValue: 100,
          currentValue: 100 + deviation.magnitude,
          expectedValue: 100,
          contributingSignals: [deviation.deviation_type],
          rootCause: severity === "high" || severity === "critical" ?
            `${deviation.deviation_type} deviation detected` : undefined,
          corrective_actions: severity === "high" || severity === "critical" ? [
            `Investigate ${deviation.deviation_type} parameters`,
            "Review recent operational changes",
            "Check sensor calibration"
          ] : undefined,
        };
      });
    }

    // Generate mock deviations for the assets we have
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;

    return targetAssets.flatMap(asset => {
      const results = [];
      const types: ("Current" | "Voltage" | "Temperature" | "Pressure")[] = ["Current", "Voltage", "Temperature"];

      for (let i = 0; i < 2; i++) {
        const magnitude = deterministicSeeded(asset.id, i + 2000, 5, 45);
        if (magnitude < 15) continue;

        let severity: "low" | "medium" | "high" | "critical";
        if (magnitude > 40) severity = "critical";
        else if (magnitude > 30) severity = "high";
        else if (magnitude > 20) severity = "medium";
        else severity = "low";

        results.push({
          id: `mock-dev-${asset.id}-${i}`,
          assetId: asset.id,
          assetName: asset.name,
          parameter: types[i % types.length],
          deviationScore: magnitude * 2,
          deviationType: i % 2 === 0 ? "positive" as const : "negative" as const,
          severity,
          status: severity === "critical" ? "investigating" as const : "active" as const,
          detectedAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString(),
          duration: deterministicSeeded(asset.id, i + 2100, 1, 12),
          baselineValue: 100,
          currentValue: 100 + (i % 2 === 0 ? magnitude : -magnitude),
          expectedValue: 100,
          contributingSignals: ["Load Factor", "Ambient Temperature"],
          rootCause: "Unusual load pattern detected",
          corrective_actions: ["Monitor load profiles", "Check cooling system effectiveness"]
        });
      }
      return results;
    });
  }, [deviationsData, deviationsLoading, assets, currentAsset]);

  // Generate baseline comparisons
  const baselineComparisons = useMemo(() => {
    if ((deviationsData && deviationsData.length > 0) || deviationsLoading) {
      if (!deviationsData) return [];
      return deviationsData.map(deviation => {
        const asset = assets.find(a => a.id === deviation.asset_id);
        const benchmark = benchmarksData?.find(b => b.asset_type === asset?.asset_type);

        return {
          assetId: deviation.asset_id,
          assetName: asset?.name || deviation.asset_id,
          parameter: deviation.deviation_type,
          currentValue: 100 + deviation.magnitude,
          baselineValue: 100,
          expectedValue: benchmark?.availability_target || 100,
          deviationPercent: deviation.magnitude,
          trend: deviation.magnitude > 0 ? "degrading" as const : "improving" as const,
          confidence: Math.max(60, 100 - Math.abs(deviation.magnitude) * 2),
          lastCalibrated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          recommendRecalibration: Math.abs(deviation.magnitude) > 15,
        };
      });
    }

    // Mock comparisons
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;
    return targetAssets.map(asset => ({
      assetId: asset.id,
      assetName: asset.name,
      parameter: "Uptime Efficiency",
      currentValue: deterministicSeeded(asset.id, 3000, 85, 98),
      baselineValue: 95,
      expectedValue: 96,
      deviationPercent: deterministicSeeded(asset.id, 3100, -5, 5),
      trend: Math.random() > 0.5 ? "improving" as const : "degrading" as const,
      confidence: deterministicSeeded(asset.id, 3200, 80, 99),
      lastCalibrated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      recommendRecalibration: false
    }));
  }, [deviationsData, deviationsLoading, benchmarksData, assets, currentAsset]);

  // Filtered lists for rendering
  const filteredEvents = deviationEvents.filter(event => {
    const assetMatch = !currentAsset || event.assetId === currentAsset.id;
    const severityMatch = severityFilter === "all" ||
      (severityFilter === "high" && (event.severity === "high" || event.severity === "critical")) ||
      (severityFilter === "critical" && event.severity === "critical");
    return assetMatch && severityMatch;
  });

  const filteredComparisons = baselineComparisons.filter(comp =>
    !currentAsset || comp.assetId === currentAsset.id
  );

  // Generate Trend Data for Chart
  const trendData = useMemo(() => {
    const points = [];
    const now = new Date();
    const count = timeRange === "24h" ? 12 : timeRange === "7d" ? 7 : 12;

    for (let i = count; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === "24h") date.setHours(now.getHours() - i * 2);
      else if (timeRange === "7d") date.setDate(now.getDate() - i);
      else date.setDate(now.getDate() - i * 3);

      const baseValue = 100;
      const seed = currentAsset?.id || "overall";
      const deviation = deterministicSeeded(seed, i + 3500, -10, 10);

      points.push({
        name: timeRange === "24h" ? `${date.getHours()}:00` : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        expected: baseValue,
        actual: baseValue + deviation,
        timestamp: date.getTime()
      });
    }
    return points;
  }, [currentAsset, timeRange]);

  // Show loading state
  if (deviationsLoading || benchmarksLoading) {
    return (
      <APMPageShell
        title="Performance Deviation Detection"
        featureSetName="Asset Performance & Utilisation"
        featureName="Performance Deviation Detection"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading deviation data...</p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  // Show error state
  if (deviationsError) {
    return (
      <APMPageShell
        title="Performance Deviation Detection"
        featureSetName="Asset Performance & Utilisation"
        featureName="Performance Deviation Detection"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Error loading data: {deviationsError.message}
            </p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-red-600 bg-red-50 border-red-200";
      case "investigating":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "acknowledged":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "resolved":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "investigating":
        return <Activity className="w-4 h-4 text-orange-600" />;
      case "acknowledged":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "degrading":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatParameterName = (param: string) => {
    return param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <APMPageShell
      title="Performance Deviation Detection"
      featureSetName="Asset Performance & Utilisation"
      featureName="Performance Deviation Detection"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(["24h", "7d", "30d"] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? "default" : "ghost"}
                onClick={() => setTimeRange(range)}
                className="h-7 px-3"
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(["all", "high", "critical"] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={severityFilter === filter ? "default" : "ghost"}
                onClick={() => setSeverityFilter(filter)}
                className="h-7 px-3"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Active Deviations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredEvents.filter(e => e.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Under Investigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {filteredEvents.filter(e => e.status === "investigating").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Being analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Avg Deviation Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredEvents.length > 0
                  ? (filteredEvents.reduce((sum, e) => sum + e.deviationScore, 0) / filteredEvents.length).toFixed(1)
                  : "0"
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recalibration Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredComparisons.filter(c => c.recommendRecalibration).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baselines to update
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deviation Events List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Deviation Events
              {currentAsset && (
                <span className="text-sm font-normal text-muted-foreground">
                  • {currentAsset.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-4 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(event.status)}
                        <div>
                          <div className="font-medium text-sm">{event.assetName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatParameterName(event.parameter)} • Detected {new Date(event.detectedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getSeverityColor(event.severity))}>
                          {event.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(event.status))}>
                          {event.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Deviation Score and Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Deviation Score</span>
                        <span className="text-lg font-bold text-primary">
                          {event.deviationScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={event.deviationScore} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Normal (0-20)</span>
                        <span>Critical (80+)</span>
                      </div>
                    </div>

                    {/* Expected vs Actual */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Baseline</div>
                        <div className="text-lg font-bold">{event.baselineValue.toFixed(2)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Expected</div>
                        <div className="text-lg font-bold">{event.expectedValue.toFixed(2)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Current</div>
                        <div className={cn(
                          "text-lg font-bold",
                          event.deviationType === "positive" ? "text-orange-600" : "text-blue-600"
                        )}>
                          {event.currentValue.toFixed(2)}
                          <span className="text-sm ml-1">
                            ({event.deviationType === "positive" ? "+" : ""}{((event.currentValue - event.baselineValue) / event.baselineValue * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contributing Signals */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Contributing Signals</div>
                      <div className="flex flex-wrap gap-2">
                        {event.contributingSignals.map((signal, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {formatParameterName(signal)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Root Cause and Actions */}
                    {(event.rootCause || event.corrective_actions) && (
                      <div className="pt-3 border-t space-y-3">
                        {event.rootCause && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Root Cause Analysis</div>
                            <p className="text-sm">{event.rootCause}</p>
                          </div>
                        )}
                        {event.corrective_actions && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Corrective Actions</div>
                            <div className="space-y-1">
                              {event.corrective_actions.map((action, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duration and Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Duration: {formatDuration(event.duration)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  No performance deviations detected for the selected criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expected vs Actual Trend Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Expected (Baseline) vs Actual Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Expected (Baseline)"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    name="Actual Performance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Baseline Recalibration Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Baseline Recalibration Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredComparisons
                .filter(comp => comp.recommendRecalibration)
                .map((comparison, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">{comparison.assetName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatParameterName(comparison.parameter)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-yellow-600 bg-yellow-50 border-yellow-200">
                          RECALIBRATION NEEDED
                        </Badge>
                        {getTrendIcon(comparison.trend)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Current</div>
                        <div className="text-lg font-bold">{comparison.currentValue.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Baseline</div>
                        <div className="text-lg font-bold">{comparison.baselineValue.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Deviation</div>
                        <div className={cn(
                          "text-lg font-bold",
                          Math.abs(comparison.deviationPercent) > 10 ? "text-red-600" : "text-yellow-600"
                        )}>
                          {comparison.deviationPercent > 0 ? "+" : ""}{comparison.deviationPercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Confidence</div>
                        <div className={cn(
                          "text-lg font-bold",
                          comparison.confidence > 80 ? "text-green-600" :
                            comparison.confidence > 60 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {comparison.confidence.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Last calibrated: {new Date(comparison.lastCalibrated).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Recalibrate Baseline
                        </Button>
                        <Button size="sm" variant="outline">
                          Schedule Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

              {filteredComparisons.filter(comp => comp.recommendRecalibration).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    All baselines are within acceptable confidence levels
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}