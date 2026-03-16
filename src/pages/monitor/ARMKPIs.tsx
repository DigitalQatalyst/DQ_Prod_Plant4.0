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
  Shield,
  Minus,
  Info,
  History,
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Filter,
  Download,
  Clock,
  BarChart3,
  Target,
  Wrench,
  Zap,
  Calendar
} from "lucide-react";
import { useReliabilityMetrics, useDowntimeEvents, useAssets } from "@/hooks/useAPM";
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
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface ARMKPIData {
  assetId: string;
  assetName: string;
  assetType: string;
  // Availability metrics
  availability: number; // %
  availabilityTarget: number; // %
  availabilityTrend: "improving" | "stable" | "degrading";
  uptime: number; // hours
  downtime: number; // hours

  // Reliability metrics
  mtbf: number; // hours
  mtbfTarget: number; // hours
  mtbfTrend: "improving" | "stable" | "degrading";
  failureCount: number;
  lastFailure?: string;

  // Maintainability metrics
  mttr: number; // hours
  mttrTarget: number; // hours
  mttrTrend: "improving" | "stable" | "degrading";
  mttf: number; // hours

  // Additional metrics
  reliabilityIndex: number; // 0-100
  maintenanceEfficiency: number; // %
  criticalityLevel: "High" | "Medium" | "Low";

  // Variance analysis
  availabilityVariance: number; // % from target
  mtbfVariance: number; // % from target
  mttrVariance: number; // % from target

  // Notes and context
  reliabilityNotes: string[];
  maintenanceHistory: MaintenanceEvent[];
}

interface MaintenanceEvent {
  id: string;
  date: string;
  type: "preventive" | "corrective" | "predictive";
  duration: number; // hours
  description: string;
  cost?: number;
  effectiveness: "high" | "medium" | "low";
}

interface ReliabilityTarget {
  assetType: string;
  availabilityTarget: number;
  mtbfTarget: number;
  mttrTarget: number;
  industryBenchmark: {
    availability: number;
    mtbf: number;
    mttr: number;
  };
}

export function ARMKPIs() {
  const { selectedAsset, setSelectedAsset } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("90d");
  const [metricView, setMetricView] = useState<"overview" | "detailed">("overview");

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

  // Calculate time range for queries
  const { periodStart, periodEnd, timeMultiplier } = useMemo(() => {
    const multiplier = timeRange === "30d" ? 1 : timeRange === "90d" ? 3 : 12;
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * multiplier).toISOString();
    const end = new Date().toISOString();
    return { periodStart: start, periodEnd: end, timeMultiplier: multiplier };
  }, [timeRange]);

  // Fetch reliability metrics from database
  const { data: reliabilityMetricsData, loading: reliabilityLoading, error: reliabilityError } = useReliabilityMetrics({
    asset_id: currentAsset?.id,
    period_start: periodStart,
    period_end: periodEnd,
  });

  // Fetch downtime events for maintenance history
  const { data: downtimeEventsData, loading: downtimeLoading } = useDowntimeEvents({
    asset_id: currentAsset?.id,
    from: periodStart,
    to: periodEnd,
  });

  // Define reliability targets by asset type
  const reliabilityTargets: ReliabilityTarget[] = [
    {
      assetType: "power_transformer",
      availabilityTarget: 99.5,
      mtbfTarget: 2400,
      mttrTarget: 6,
      industryBenchmark: { availability: 98.8, mtbf: 1800, mttr: 8 }
    },
    {
      assetType: "circuit_breaker",
      availabilityTarget: 99.5,
      mtbfTarget: 1800,
      mttrTarget: 8,
      industryBenchmark: { availability: 97.5, mtbf: 1440, mttr: 12 }
    },
    {
      assetType: "transmission_line",
      availabilityTarget: 98.5,
      mtbfTarget: 1200,
      mttrTarget: 12,
      industryBenchmark: { availability: 96.8, mtbf: 720, mttr: 16 }
    },
    {
      assetType: "protection_relay",
      availabilityTarget: 99.5,
      mtbfTarget: 1800,
      mttrTarget: 6,
      industryBenchmark: { availability: 98.9, mtbf: 1440, mttr: 8 }
    },
  ];

  // Generate ARM KPI data
  const armKPIData = useMemo(() => {
    if ((reliabilityMetricsData && reliabilityMetricsData.length > 0) || reliabilityLoading) {
      if (!reliabilityMetricsData || reliabilityMetricsData.length === 0) return [];

      return reliabilityMetricsData.map(metric => {
        const asset = assets.find(a => a.id === metric.asset_id);
        const assetType = asset?.asset_type || "power_transformer";
        const targets = reliabilityTargets.find(t => t.assetType === assetType) || reliabilityTargets[0];

        // Calculate time-based metrics
        const totalHours = 30 * 24 * timeMultiplier;
        const downtime = (metric.total_downtime_minutes || 0) / 60;
        const uptime = totalHours - downtime;
        const availability = metric.availability_percent;

        // Generate maintenance history from downtime events
        const maintenanceHistory: MaintenanceEvent[] = (downtimeEventsData || [])
          .filter(event => event.asset_id === metric.asset_id)
          .map((event) => ({
            id: event.id,
            date: event.start_time,
            type: event.event_type === "planned_maintenance" ? "preventive" as const : "corrective" as const,
            duration: (event.duration_minutes || 0) / 60,
            description: event.description || `${event.event_type} event`,
            cost: event.grid_impact_mw ? event.grid_impact_mw * 1000 : undefined,
            effectiveness: Math.random() > 0.5 ? "high" as const : "medium" as const,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate reliability index (composite score)
        const availabilityScore = Math.min(100, (availability / targets.availabilityTarget) * 100);
        const mtbfScore = Math.min(100, ((metric.mtbf_hours || 0) / targets.mtbfTarget) * 100);
        const mttrScore = Math.min(100, (targets.mttrTarget / (metric.mttr_hours || 1)) * 100);
        const reliabilityIndex = (availabilityScore + mtbfScore + mttrScore) / 3;

        // Calculate maintenance efficiency
        const preventiveMaint = maintenanceHistory.filter(m => m.type === "preventive").length;
        const correctiveMaint = maintenanceHistory.filter(m => m.type === "corrective").length;
        const maintenanceEfficiency = preventiveMaint / Math.max(1, preventiveMaint + correctiveMaint) * 100;

        // Generate reliability notes
        const reliabilityNotes: string[] = [];

        if (availability < targets.availabilityTarget) {
          reliabilityNotes.push(`Availability below target by ${(targets.availabilityTarget - availability).toFixed(1)}%`);
        }

        if ((metric.mtbf_hours || 0) < targets.mtbfTarget) {
          reliabilityNotes.push(`MTBF requires improvement - currently ${(targets.mtbfTarget - (metric.mtbf_hours || 0)).toFixed(0)} hours below target`);
        }

        if ((metric.mttr_hours || 0) > targets.mttrTarget) {
          reliabilityNotes.push(`MTTR exceeds target - focus on maintenance efficiency improvements`);
        }

        if (availability > 99) {
          reliabilityNotes.push("Excellent performance - maintain current practices");
        }

        // Determine trend
        const trend: "improving" | "stable" | "degrading" =
          availability >= 99 ? "improving" :
            availability >= 95 ? "stable" : "degrading";

        return {
          assetId: metric.asset_id,
          assetName: asset?.name || metric.asset_id,
          assetType: assetType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          availability,
          availabilityTarget: targets.availabilityTarget,
          availabilityTrend: trend,
          uptime,
          downtime,
          mtbf: metric.mtbf_hours || 0,
          mtbfTarget: targets.mtbfTarget,
          mtbfTrend: trend,
          failureCount: metric.failure_count,
          lastFailure: (downtimeEventsData || []).find(d => d.asset_id === metric.asset_id)?.start_time,
          mttr: metric.mttr_hours || 0,
          mttrTarget: targets.mttrTarget,
          mttrTrend: trend,
          mttf: metric.mtbf_hours || 0, // Simplified
          reliabilityIndex,
          maintenanceEfficiency,
          criticalityLevel: "High" as const, // Default to high for transmission assets
          availabilityVariance: availability - targets.availabilityTarget,
          mtbfVariance: targets.mtbfTarget ? ((metric.mtbf_hours || 0) - targets.mtbfTarget) / targets.mtbfTarget * 100 : 0,
          mttrVariance: targets.mttrTarget ? ((metric.mttr_hours || 0) - targets.mttrTarget) / targets.mttrTarget * 100 : 0,
          reliabilityNotes,
          maintenanceHistory,
        };
      });
    }

    // Generate mock ARM data if no real data
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;
    return targetAssets.map(asset => {
      const targets = reliabilityTargets.find(t => t.assetType === asset.asset_type) || reliabilityTargets[0];
      const avail = deterministicSeeded(asset.id, 60, targets.availabilityTarget - 5, 100);
      const mtbf = deterministicSeeded(asset.id, 61, targets.mtbfTarget * 0.7, targets.mtbfTarget * 1.2);
      const mttr = deterministicSeeded(asset.id, 62, targets.mttrTarget * 0.5, targets.mttrTarget * 1.5);
      const uptime = 30 * 24 * (avail / 100);
      const downtime = 30 * 24 * (1 - avail / 100);

      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        availability: avail,
        availabilityTarget: targets.availabilityTarget,
        availabilityTrend: avail >= targets.availabilityTarget ? "improving" as const : "degrading" as const,
        uptime,
        downtime,
        mtbf,
        mtbfTarget: targets.mtbfTarget,
        mtbfTrend: mtbf >= targets.mtbfTarget ? "improving" as const : "degrading" as const,
        failureCount: Math.round(30 * 24 / mtbf),
        lastFailure: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        mttr: mttr,
        mttrTarget: targets.mttrTarget,
        mttrTrend: mttr <= targets.mttrTarget ? "improving" as const : "degrading" as const,
        mttf: mtbf - mttr,
        reliabilityIndex: (avail + (mtbf / targets.mtbfTarget * 100) + (targets.mttrTarget / mttr * 100)) / 3,
        maintenanceEfficiency: 85,
        criticalityLevel: "High" as const,
        availabilityVariance: avail - targets.availabilityTarget,
        mtbfVariance: (mtbf - targets.mtbfTarget) / targets.mtbfTarget * 100,
        mttrVariance: (mttr - targets.mttrTarget) / targets.mttrTarget * 100,
        reliabilityNotes: ["Asset performance within normal operating parameters"],
        maintenanceHistory: []
      };
    });
  }, [reliabilityMetricsData, reliabilityLoading, downtimeEventsData, assets, timeMultiplier, reliabilityTargets, currentAsset]);

  // Generate Trend Data for Chart
  const trendData = useMemo(() => {
    const points = [];
    const now = new Date();
    const count = timeRange === "30d" ? 6 : timeRange === "90d" ? 6 : 6;

    for (let i = count; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === "30d") date.setDate(now.getDate() - i * 5);
      else if (timeRange === "90d") date.setDate(now.getDate() - i * 15);
      else date.setMonth(now.getMonth() - i * 2);

      const seed = currentAsset?.id || "overall";
      const mtbf = deterministicSeeded(seed, i + 5000, 1000, 2500);
      const mttr = deterministicSeeded(seed, i + 6000, 4, 12);

      points.push({
        name: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        mtbf: Math.round(mtbf),
        mttr: parseFloat(mttr.toFixed(1)),
      });
    }
    return points;
  }, [currentAsset, timeRange]);

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

  // Filter data based on selected asset
  const filteredKPIData = currentAsset
    ? armKPIData.filter(data => data.assetId === currentAsset.id)
    : armKPIData;

  // Show loading state
  if (reliabilityLoading || downtimeLoading) {
    return (
      <APMPageShell
        title="Availability / Reliability KPIs (A/R/M)"
        featureSetName="Asset Performance & Utilisation"
        featureName="Availability / Reliability KPIs (A/R/M)"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading reliability metrics...</p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  // Show error state
  if (reliabilityError) {
    return (
      <APMPageShell
        title="Availability / Reliability KPIs (A/R/M)"
        featureSetName="Asset Performance & Utilisation"
        featureName="Availability / Reliability KPIs (A/R/M)"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Error loading data: {reliabilityError.message}
            </p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  const getPerformanceColor = (value: number, target: number, isLowerBetter: boolean = false) => {
    const ratio = isLowerBetter ? target / value : value / target;
    if (ratio >= 1.0) return "text-green-600";
    if (ratio >= 0.95) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadgeColor = (value: number, target: number, isLowerBetter: boolean = false) => {
    const ratio = isLowerBetter ? target / value : value / target;
    if (ratio >= 1.0) return "text-green-600 bg-green-50 border-green-200";
    if (ratio >= 0.95) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "degrading":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCriticalityColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    if (hours < 168) return `${(hours / 24).toFixed(1)}d`;
    return `${(hours / 168).toFixed(1)}w`;
  };

  return (
    <APMPageShell
      title="Availability / Reliability KPIs (A/R/M)"
      featureSetName="Asset Performance & Utilisation"
      featureName="Availability / Reliability KPIs (A/R/M)"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(["30d", "90d", "1y"] as const).map((range) => (
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
            {(["overview", "detailed"] as const).map((view) => (
              <Button
                key={view}
                size="sm"
                variant={metricView === view ? "default" : "ghost"}
                onClick={() => setMetricView(view)}
                className="h-7 px-3"
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
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
        {/* Overall ARM Summary */}
        {!currentAsset && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Fleet Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {armKPIData.length > 0
                    ? `${(armKPIData.reduce((sum, data) => sum + data.availability, 0) / armKPIData.length).toFixed(2)}%`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average across all assets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fleet MTBF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {armKPIData.length > 0
                    ? formatHours(armKPIData.reduce((sum, data) => sum + data.mtbf, 0) / armKPIData.length)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mean time between failures
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Fleet MTTR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {armKPIData.length > 0
                    ? formatHours(armKPIData.reduce((sum, data) => sum + data.mttr, 0) / armKPIData.length)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mean time to repair
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Reliability Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {armKPIData.length > 0
                    ? (armKPIData.reduce((sum, data) => sum + data.reliabilityIndex, 0) / armKPIData.length).toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Composite reliability score
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Asset ARM KPIs */}
        {filteredKPIData.map((kpiData) => (
          <Card key={kpiData.assetId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {kpiData.assetName} - ARM KPIs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", getCriticalityColor(kpiData.criticalityLevel))}>
                    {kpiData.criticalityLevel} Criticality
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Reliability Index: {kpiData.reliabilityIndex.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main ARM Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Availability */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Availability</span>
                      {getTrendIcon(kpiData.availabilityTrend)}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPerformanceBadgeColor(kpiData.availability, kpiData.availabilityTarget))}>
                      {kpiData.availability >= kpiData.availabilityTarget ? "ON TARGET" : "BELOW TARGET"}
                    </Badge>
                  </div>

                  <div className="text-center space-y-2">
                    <div className={cn("text-4xl font-bold", getPerformanceColor(kpiData.availability, kpiData.availabilityTarget))}>
                      {kpiData.availability.toFixed(2)}%
                    </div>
                    <Progress value={kpiData.availability} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {kpiData.availabilityTarget}%</span>
                      <span className={cn(
                        "font-medium",
                        kpiData.availabilityVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.availabilityVariance >= 0 ? "+" : ""}{kpiData.availabilityVariance.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-green-50 dark:bg-green-950/30">
                      <div className="font-bold text-green-600">{formatHours(kpiData.uptime)}</div>
                      <div className="text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-2 rounded bg-red-50 dark:bg-red-950/30">
                      <div className="font-bold text-red-600">{formatHours(kpiData.downtime)}</div>
                      <div className="text-muted-foreground">Downtime</div>
                    </div>
                  </div>
                </div>

                {/* Reliability (MTBF) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Reliability (MTBF)</span>
                      {getTrendIcon(kpiData.mtbfTrend)}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPerformanceBadgeColor(kpiData.mtbf, kpiData.mtbfTarget))}>
                      {kpiData.mtbf >= kpiData.mtbfTarget ? "ON TARGET" : "BELOW TARGET"}
                    </Badge>
                  </div>

                  <div className="text-center space-y-2">
                    <div className={cn("text-4xl font-bold", getPerformanceColor(kpiData.mtbf, kpiData.mtbfTarget))}>
                      {formatHours(kpiData.mtbf)}
                    </div>
                    <Progress value={Math.min(100, (kpiData.mtbf / kpiData.mtbfTarget) * 100)} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {formatHours(kpiData.mtbfTarget)}</span>
                      <span className={cn(
                        "font-medium",
                        kpiData.mtbfVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.mtbfVariance >= 0 ? "+" : ""}{kpiData.mtbfVariance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-secondary/30">
                      <div className="font-bold">{kpiData.failureCount}</div>
                      <div className="text-muted-foreground">Failures</div>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/30">
                      <div className="font-bold">{formatHours(kpiData.mttf)}</div>
                      <div className="text-muted-foreground">MTTF</div>
                    </div>
                  </div>
                </div>

                {/* Maintainability (MTTR) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Maintainability (MTTR)</span>
                      {getTrendIcon(kpiData.mttrTrend)}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPerformanceBadgeColor(kpiData.mttr, kpiData.mttrTarget, true))}>
                      {kpiData.mttr <= kpiData.mttrTarget ? "ON TARGET" : "ABOVE TARGET"}
                    </Badge>
                  </div>

                  <div className="text-center space-y-2">
                    <div className={cn("text-4xl font-bold", getPerformanceColor(kpiData.mttr, kpiData.mttrTarget, true))}>
                      {formatHours(kpiData.mttr)}
                    </div>
                    <Progress value={Math.min(100, (kpiData.mttrTarget / kpiData.mttr) * 100)} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {formatHours(kpiData.mttrTarget)}</span>
                      <span className={cn(
                        "font-medium",
                        kpiData.mttrVariance <= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.mttrVariance >= 0 ? "+" : ""}{kpiData.mttrVariance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-secondary/30">
                      <div className="font-bold">{kpiData.maintenanceEfficiency.toFixed(1)}%</div>
                      <div className="text-muted-foreground">Maint. Eff.</div>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/30">
                      <div className="font-bold">
                        {kpiData.lastFailure ? new Date(kpiData.lastFailure).toLocaleDateString() : "None"}
                      </div>
                      <div className="text-muted-foreground">Last Failure</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reliability Notes */}
              {kpiData.reliabilityNotes.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Reliability Notes & Operational Context
                  </h4>
                  <div className="space-y-2">
                    {kpiData.reliabilityNotes.map((note, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed View - Maintenance History */}
              {metricView === "detailed" && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Recent Maintenance History
                  </h4>
                  <div className="space-y-2">
                    {kpiData.maintenanceHistory.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            event.type === "preventive" ? "bg-green-600" :
                              event.type === "predictive" ? "bg-blue-600" : "bg-red-600"
                          )} />
                          <div>
                            <div className="text-sm font-medium">{event.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()} • {formatHours(event.duration)} • {event.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            event.effectiveness === "high" ? "text-green-600 bg-green-50 border-green-200" :
                              event.effectiveness === "medium" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                                "text-red-600 bg-red-50 border-red-200"
                          )}>
                            {event.effectiveness.toUpperCase()}
                          </Badge>
                          {event.cost && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ${event.cost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* ARM Trend Charts Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              ARM Trend Analysis (MTBF & MTTR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full mt-4">
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
                    yAxisId="left"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'MTBF (h)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10 } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'MTTR (h)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10 } }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mtbf"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    name="MTBF"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="mttr"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f97316' }}
                    name="MTTR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reliability Target Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Reliability Target Tracking & Variance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredKPIData.map((kpiData) => (
                <div key={kpiData.assetId} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">{kpiData.assetName}</span>
                    <Badge variant="outline" className={cn("text-xs", getCriticalityColor(kpiData.criticalityLevel))}>
                      {kpiData.criticalityLevel} Criticality
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-xs text-muted-foreground mb-1">Availability Variance</div>
                      <div className={cn(
                        "text-lg font-bold",
                        kpiData.availabilityVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.availabilityVariance >= 0 ? "+" : ""}{kpiData.availabilityVariance.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {kpiData.availability.toFixed(2)}% vs {kpiData.availabilityTarget}% target
                      </div>
                    </div>

                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-xs text-muted-foreground mb-1">MTBF Variance</div>
                      <div className={cn(
                        "text-lg font-bold",
                        kpiData.mtbfVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.mtbfVariance >= 0 ? "+" : ""}{kpiData.mtbfVariance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatHours(kpiData.mtbf)} vs {formatHours(kpiData.mtbfTarget)} target
                      </div>
                    </div>

                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-xs text-muted-foreground mb-1">MTTR Variance</div>
                      <div className={cn(
                        "text-lg font-bold",
                        kpiData.mttrVariance <= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {kpiData.mttrVariance >= 0 ? "+" : ""}{kpiData.mttrVariance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatHours(kpiData.mttr)} vs {formatHours(kpiData.mttrTarget)} target
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}