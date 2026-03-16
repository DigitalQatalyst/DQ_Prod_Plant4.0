import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { DowntimeTable } from "@/components/apm/DowntimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Filter,
  Download,
  Minus,
  MessageSquare,
  History,
  Info
} from "lucide-react";
import { useDowntimeEvents, useReliabilityMetrics, useAssets } from "@/hooks/useAPM";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";

interface UptimeMetrics {
  assetId: string;
  assetName: string;
  uptimePercent: number;
  downtimeHours: number;
  plannedDowntimeHours: number;
  unplannedDowntimeHours: number;
  totalHours: number;
  trend: "improving" | "stable" | "degrading";
  lastIncident?: string;
  mtbf: number;
  targetUptime: number;
}

interface DowntimeEventForTable {
  id: string;
  assetId: string;
  assetName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  category: "Planned" | "Unplanned";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Ongoing" | "Completed" | "Investigating";
  workOrderId?: string;
  costImpact?: number;
}

export function UptimeDowntimeTracking() {
  const { selectedAsset, setSelectedAsset } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("30d");

  // Fetch real assets from Supabase instead of using mock data from AppContext
  const { data: assetsResponse, loading: assetsLoading } = useAssets({
    sector: 'power_transmission',
    page: 1,
    pageSize: 100
  });

  // ─── Mock Assets Fallback ──────────────────────────────────────────────────
  const mockAssets: Asset[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", type: "Power Transformer", location: "Substation Alpha", site: "Substation Alpha", area: "Yard 1", status: "online", criticality: "critical", lastSeen: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", type: "Circuit Breaker", location: "Substation Alpha", site: "Substation Alpha", area: "Bay 2", status: "online", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", type: "Power Transformer", location: "Substation Beta", site: "Substation Beta", area: "Yard 2", status: "maintenance", criticality: "medium", lastSeen: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", type: "Circuit Breaker", location: "Substation Beta", site: "Substation Beta", area: "Bay 1", status: "offline", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", type: "Line Terminal", location: "Substation Gamma", site: "Substation Gamma", area: "Line Yard", status: "online", criticality: "critical", lastSeen: new Date().toISOString() }
  ], []);

  // Use database assets if available, otherwise fall back to mock assets
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

  // Helper for deterministic random based on string
  const deterministicSeeded = (id: string, offset: number, min: number, max: number) => {
    let hash = 0;
    const str = id + offset;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const val = Math.abs(hash) % 10000;
    return min + (val / 10000) * (max - min);
  };

  // Calculate time range for queries
  const { periodStart, periodEnd, timeRangeHours } = useMemo(() => {
    const hours = timeRange === "24h" ? 24 :
      timeRange === "7d" ? 168 :
        timeRange === "30d" ? 720 : 2160;

    return {
      timeRangeHours: hours,
      periodStart: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString()
    };
  }, [timeRange]);

  // Fetch downtime events from database
  const { data: downtimeEventsData, loading: downtimeLoading, error: downtimeError } = useDowntimeEvents({
    asset_id: currentAsset?.id,
    from: periodStart,
    to: periodEnd,
  });

  // Fetch reliability metrics from database
  const { data: reliabilityMetricsData, loading: reliabilityLoading, error: reliabilityError } = useReliabilityMetrics({
    asset_id: currentAsset?.id,
    period_start: periodStart,
    period_end: periodEnd,
  });

  // ── Use real data if available, else fall back to deterministic mock data ──
  const effectiveReliabilityData = useMemo(() => {
    if (reliabilityMetricsData && reliabilityMetricsData.length > 0) return reliabilityMetricsData;
    if (reliabilityLoading) return [];

    // Generate mock reliability data for the assets we have
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;

    return targetAssets.map(asset => {
      const avail = deterministicSeeded(asset.id, 10, 92, 99.9);
      const totalMin = timeRangeHours * 60;
      const downtimeMin = totalMin * (1 - avail / 100);

      return {
        id: `mock-rel-${asset.id}`,
        asset_id: asset.id,
        period_start: periodStart,
        period_end: periodEnd,
        availability_percent: avail,
        total_downtime_minutes: downtimeMin,
        mtbf_hours: Math.floor(deterministicSeeded(asset.id, 20, 500, 2000)),
        failure_count: Math.floor(deterministicSeeded(asset.id, 30, 0, 4)),
        computed_at: new Date().toISOString()
      };
    });
  }, [reliabilityMetricsData, reliabilityLoading, assets, currentAsset, timeRangeHours, periodStart, periodEnd]);

  const effectiveDowntimeEvents = useMemo(() => {
    if (downtimeEventsData && downtimeEventsData.length > 0) return downtimeEventsData;
    if (downtimeLoading) return [];

    // Generate mock downtime events for the assets we have
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;
    const items: any[] = [];

    targetAssets.forEach(asset => {
      const eventCount = Math.floor(deterministicSeeded(asset.id, 40, 0, 3));
      for (let i = 0; i < eventCount; i++) {
        const duration = deterministicSeeded(asset.id, i + 50, 30, 480);
        const startOffsetHours = deterministicSeeded(asset.id, i + 60, 1, timeRangeHours);
        const startTime = new Date(Date.now() - startOffsetHours * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

        items.push({
          id: `mock-event-${asset.id}-${i}`,
          asset_id: asset.id,
          event_type: i === 0 ? "planned_maintenance" : "unplanned_failure",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: duration,
          description: i === 0 ? "Routine inspection & maintenance" : "Transient fault detected",
          grid_impact_mw: deterministicSeeded(asset.id, i + 70, 0, 150),
          created_at: new Date().toISOString()
        });
      }
    });

    return items;
  }, [downtimeEventsData, downtimeLoading, assets, currentAsset, timeRangeHours]);

  // Calculate uptime metrics from reliability data
  const uptimeMetrics = useMemo(() => {
    if (effectiveReliabilityData.length === 0) {
      return [];
    }

    return effectiveReliabilityData.map(metric => {
      const totalHours = timeRangeHours;
      const downtimeHours = metric.total_downtime_minutes / 60;

      // Split downtime into planned/unplanned (estimate 60/40 split)
      const plannedDowntimeHours = downtimeHours * 0.6;
      const unplannedDowntimeHours = downtimeHours * 0.4;

      const uptimePercent = metric.availability_percent;

      // Determine trend based on availability
      const trend: "improving" | "stable" | "degrading" =
        uptimePercent >= 99 ? "improving" :
          uptimePercent >= 95 ? "stable" : "degrading";

      return {
        assetId: metric.asset_id,
        assetName: assets.find(a => a.id === metric.asset_id)?.name || metric.asset_id,
        uptimePercent,
        downtimeHours,
        plannedDowntimeHours,
        unplannedDowntimeHours,
        totalHours,
        trend,
        lastIncident: effectiveDowntimeEvents.find(d => d.asset_id === metric.asset_id)?.start_time,
        mtbf: metric.mtbf_hours || 0,
        targetUptime: 99.5, // Default target
      };
    });
  }, [effectiveReliabilityData, timeRangeHours, assets, effectiveDowntimeEvents]);

  // Get metrics for selected asset or overall
  const selectedMetrics = currentAsset
    ? uptimeMetrics.find(m => m.assetId === currentAsset.id)
    : null;

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (uptimeMetrics.length === 0) {
      return {
        avgUptime: 0,
        totalDowntime: 0,
        totalPlanned: 0,
        totalUnplanned: 0,
      };
    }

    return {
      avgUptime: uptimeMetrics.reduce((sum, m) => sum + m.uptimePercent, 0) / uptimeMetrics.length,
      totalDowntime: uptimeMetrics.reduce((sum, m) => sum + m.downtimeHours, 0),
      totalPlanned: uptimeMetrics.reduce((sum, m) => sum + m.plannedDowntimeHours, 0),
      totalUnplanned: uptimeMetrics.reduce((sum, m) => sum + m.unplannedDowntimeHours, 0),
    };
  }, [uptimeMetrics]);

  // Transform downtime events for the table component
  const transformedDowntimeEvents: DowntimeEventForTable[] = useMemo(() => {
    if (!effectiveDowntimeEvents) return [];

    return effectiveDowntimeEvents.map(event => {
      const asset = assets.find(a => a.id === event.asset_id);
      const durationMinutes = event.duration_minutes ||
        (event.end_time ? (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60) : 0);

      return {
        id: event.id,
        assetId: event.asset_id,
        assetName: asset?.name || event.asset_id,
        startTime: event.start_time,
        endTime: event.end_time || new Date().toISOString(),
        durationMinutes,
        reason: event.description || `${event.event_type} event`,
        category: event.event_type === "planned_maintenance" ? "Planned" as const : "Unplanned" as const,
        severity: event.grid_impact_mw && event.grid_impact_mw > 100 ? "Critical" as const :
          event.grid_impact_mw && event.grid_impact_mw > 50 ? "High" as const :
            event.grid_impact_mw && event.grid_impact_mw > 10 ? "Medium" as const : "Low" as const,
        status: event.end_time ? "Completed" as const : "Ongoing" as const,
        workOrderId: event.rca_id,
        costImpact: event.grid_impact_mw ? event.grid_impact_mw * 1000 : undefined, // Estimate cost
      };
    });
  }, [effectiveDowntimeEvents, assets]);

  // Generate Pareto Data
  const paretoData = useMemo(() => {
    const reasons = [
      { reason: "Insulation Breakdown", hours: 42, color: "#ef4444" },
      { reason: "Thermal Overload", hours: 28, color: "#f97316" },
      { reason: "Contact Wear", hours: 15, color: "#facc15" },
      { reason: "Control System Fault", hours: 12, color: "#3b82f6" },
      { reason: "External Grid Trip", hours: 8, color: "#8b5cf6" },
      { reason: "Planned Inspection", hours: 64, color: "#10b981" },
    ];

    // If we have an asset, seed the data deterministically
    if (currentAsset) {
      return reasons.map((r, i) => ({
        ...r,
        hours: deterministicSeeded(currentAsset.id, i + 500, 5, 100)
      })).sort((a, b) => b.hours - a.hours);
    }

    return reasons.sort((a, b) => b.hours - a.hours);
  }, [currentAsset]);

  // Generate Trend Data
  const trendData = useMemo(() => {
    const points = [];
    const now = new Date();
    const count = timeRange === "24h" ? 12 : timeRange === "7d" ? 7 : 12;
    const interval = timeRange === "24h" ? 2 : 1; // 2 hours or 1 day/period

    for (let i = count; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === "24h") date.setHours(now.getHours() - i * interval);
      else if (timeRange === "7d") date.setDate(now.getDate() - i);
      else date.setDate(now.getDate() - i * (timeRange === "30d" ? 3 : 7));

      const seed = currentAsset?.id || "overall";
      const uptime = deterministicSeeded(seed, i + 1000, 94, 100);
      const downtime = 100 - uptime;

      points.push({
        name: timeRange === "24h" ? `${date.getHours()}:00` : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        uptime: parseFloat(uptime.toFixed(2)),
        downtime: parseFloat(downtime.toFixed(2)),
      });
    }
    return points;
  }, [currentAsset, timeRange]);

  // Show loading state
  if (downtimeLoading || reliabilityLoading || assetsLoading) {
    return (
      <APMPageShell
        title="Uptime & Downtime Tracking"
        featureSetName="Asset Performance & Utilisation"
        featureName="Uptime & Downtime Tracking"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading downtime data...</p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  // Show error state
  if (downtimeError || reliabilityError) {
    return (
      <APMPageShell
        title="Uptime & Downtime Tracking"
        featureSetName="Asset Performance & Utilisation"
        featureName="Uptime & Downtime Tracking"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Error loading data: {(downtimeError || reliabilityError)?.message}
            </p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  const getTrendIcon = (trend: "improving" | "stable" | "degrading") => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "degrading":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getUptimeColor = (uptime: number, target: number) => {
    if (uptime >= target) return "text-green-600";
    if (uptime >= target - 1) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <APMPageShell
      title="Uptime & Downtime Tracking"
      featureSetName="Asset Performance & Utilisation"
      featureName="Uptime & Downtime Tracking"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(["24h", "7d", "30d", "90d"] as const).map((range) => (
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
        {/* Overall Summary Cards */}
        {!currentAsset && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Average Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {overallStats.avgUptime.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all assets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Downtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overallStats.totalDowntime.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Planned Downtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {overallStats.totalPlanned.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((overallStats.totalPlanned / overallStats.totalDowntime) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Unplanned Downtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {overallStats.totalUnplanned.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((overallStats.totalUnplanned / overallStats.totalDowntime) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Asset Metrics */}
        {selectedMetrics && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {selectedMetrics.assetName} - Performance Overview
                </CardTitle>
                {getTrendIcon(selectedMetrics.trend)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Uptime Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold", getUptimeColor(selectedMetrics.uptimePercent, selectedMetrics.targetUptime))}>
                      {selectedMetrics.uptimePercent.toFixed(2)}%
                    </span>
                    {selectedMetrics.uptimePercent >= selectedMetrics.targetUptime ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                </div>
                <Progress value={selectedMetrics.uptimePercent} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target: {selectedMetrics.targetUptime}%</span>
                  <span>
                    {selectedMetrics.uptimePercent >= selectedMetrics.targetUptime
                      ? `+${(selectedMetrics.uptimePercent - selectedMetrics.targetUptime).toFixed(2)}% above target`
                      : `${(selectedMetrics.targetUptime - selectedMetrics.uptimePercent).toFixed(2)}% below target`
                    }
                  </span>
                </div>
              </div>

              {/* Downtime Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">Total Downtime</span>
                  </div>
                  <div className="text-2xl font-bold">{selectedMetrics.downtimeHours.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Out of {selectedMetrics.totalHours}h
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600 uppercase">Planned</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedMetrics.plannedDowntimeHours.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((selectedMetrics.plannedDowntimeHours / selectedMetrics.downtimeHours) * 100).toFixed(0)}% of downtime
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-600 uppercase">Unplanned</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedMetrics.unplannedDowntimeHours.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((selectedMetrics.unplannedDowntimeHours / selectedMetrics.downtimeHours) * 100).toFixed(0)}% of downtime
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">MTBF</div>
                  <div className="text-xl font-bold">{selectedMetrics.mtbf}h</div>
                  <p className="text-xs text-muted-foreground">Mean Time Between Failures</p>
                </div>
                {selectedMetrics.lastIncident && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Last Incident</div>
                    <div className="text-xl font-bold">
                      {new Date(selectedMetrics.lastIncident).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - new Date(selectedMetrics.lastIncident).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Comparison Table */}
        {!currentAsset && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Asset Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uptimeMetrics.map((metric) => (
                  <div key={metric.assetId} className="p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{metric.assetName}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <span className={cn("text-lg font-bold", getUptimeColor(metric.uptimePercent, metric.targetUptime))}>
                        {metric.uptimePercent.toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={metric.uptimePercent} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Downtime: {metric.downtimeHours.toFixed(1)}h
                        ({metric.plannedDowntimeHours.toFixed(1)}h planned, {metric.unplannedDowntimeHours.toFixed(1)}h unplanned)
                      </span>
                      <span>Target: {metric.targetUptime}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Downtime Events Table */}
        <DowntimeTable
          events={transformedDowntimeEvents}
          selectedAsset={currentAsset}
          timeRange={timeRange}
          showCosts={true}
          maxItems={10}
        />

        {/* Pareto Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Downtime Contribution by Failure Mode (Pareto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="reason"
                    type="category"
                    width={150}
                    fontSize={12}
                    tick={{ fill: 'currentColor', opacity: 0.7 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                    {paretoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Failures</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>External</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downtime Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Downtime Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Frequency Metrics</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Total Events</span>
                      <span className="text-sm font-bold">{transformedDowntimeEvents.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Planned Events</span>
                      <span className="text-sm font-bold text-blue-600">
                        {transformedDowntimeEvents.filter(e => e.category === "Planned").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Unplanned Events</span>
                      <span className="text-sm font-bold text-red-600">
                        {transformedDowntimeEvents.filter(e => e.category === "Unplanned").length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Duration Metrics</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Avg Event Duration</span>
                      <span className="text-sm font-bold">
                        {(transformedDowntimeEvents.reduce((sum, e) => sum + e.durationMinutes, 0) / transformedDowntimeEvents.length / 60).toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Longest Event</span>
                      <span className="text-sm font-bold">
                        {(Math.max(...transformedDowntimeEvents.map(e => e.durationMinutes)) / 60).toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Shortest Event</span>
                      <span className="text-sm font-bold">
                        {(Math.min(...transformedDowntimeEvents.map(e => e.durationMinutes)) / 60).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDowntime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                      domain={[90, 100]}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="uptime"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorUptime)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="downtime"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorDowntime)"
                      strokeWidth={2}
                      hide
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}
