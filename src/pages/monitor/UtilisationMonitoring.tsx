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
  Gauge,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Filter,
  Download,
  Minus,
  ArrowUp,
  ArrowDown,
  Info,
  Clock,
  History
} from "lucide-react";
import { useUtilisationMetrics, useLatestTelemetry, useAssets } from "@/hooks/useAPM";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface UtilizationMetrics {
  assetId: string;
  assetName: string;
  assetType: string;
  currentUtilization: number; // 0-100%
  ratedCapacity: number;
  currentLoad: number;
  averageLoad24h: number;
  peakLoad24h: number;
  minLoad24h: number;
  utilizationTrend: "increasing" | "stable" | "decreasing";
  loadProfile: LoadProfilePoint[];
  status: "optimal" | "underutilized" | "overutilized" | "critical";
  recommendations: string[];
  efficiency: number;
  powerFactor?: number; // For electrical equipment
  flowRate?: number; // For pumps/compressors
  pressure?: number; // For compressors
}

interface LoadProfilePoint {
  timestamp: string;
  utilization: number;
  load: number;
}

interface CapacityOptimization {
  assetId: string;
  currentCapacity: number;
  optimalCapacity: number;
  potentialSavings: number;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export function UtilisationMonitoring() {
  const { assets: contextAssets, selectedAsset, setSelectedAsset } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

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
  const { periodStart, periodEnd } = useMemo(() => {
    const start = new Date(Date.now() - (timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720) * 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();
    return { periodStart: start, periodEnd: end };
  }, [timeRange]);

  // Fetch utilisation metrics from database
  const { data: utilisationMetricsData, loading: utilisationLoading, error: utilisationError } = useUtilisationMetrics({
    asset_id: currentAsset?.id,
    period_start: periodStart,
    period_end: periodEnd,
  });

  // Fetch latest telemetry for current load information
  const { data: latestTelemetryData, loading: telemetryLoading } = useLatestTelemetry({
    asset_id: currentAsset?.id || "",
  });

  // ── Use real data if available, else fall back to deterministic mock data ──
  const effectiveUtilisationData = useMemo(() => {
    if (utilisationMetricsData && utilisationMetricsData.length > 0) return utilisationMetricsData;
    if (utilisationLoading) return [];

    // Generate mock utilization data for the assets we have
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;

    return targetAssets.map(asset => ({
      id: `mock-util-${asset.id}`,
      asset_id: asset.id,
      period_start: periodStart,
      period_end: periodEnd,
      load_factor: deterministicSeeded(asset.id, 100, 35, 85),
      peak_current: deterministicSeeded(asset.id, 110, 50, 450),
      avg_voltage: deterministicSeeded(asset.id, 120, 110, 400),
      energy_throughput_kwh: deterministicSeeded(asset.id, 130, 1000, 5000),
      runtime_hours: deterministicSeeded(asset.id, 140, 10, 24),
      computed_at: new Date().toISOString()
    }));
  }, [utilisationMetricsData, utilisationLoading, assets, currentAsset, periodStart, periodEnd]);

  // Generate utilization metrics from database data
  const utilizationMetrics = useMemo(() => {
    if (effectiveUtilisationData.length === 0) {
      return [];
    }

    return effectiveUtilisationData.map(metric => {
      const asset = assets.find(a => a.id === metric.asset_id);
      const assetType = (asset as any)?.asset_type || asset?.type || "power_transformer";

      // Get rated capacity based on asset type (simplified)
      const ratedCapacity = assetType.includes("transformer") ? 100 : // MVA
        assetType.includes("breaker") ? 3000 : // A
          assetType.includes("line") || assetType.includes("meter") ? 500 : // MW
            100;

      // Calculate current load from load factor
      const currentLoad = (metric.load_factor || 50) * ratedCapacity / 100;
      const currentUtilization = metric.load_factor || 50;

      // Generate load profile (deterministic mock for visualization)
      const loadProfile: LoadProfilePoint[] = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        // Use deterministic variation based on asset ID and hour
        const variation = (deterministicSeeded(metric.asset_id, i + 200, 0, 1) - 0.5) * 0.2 * currentLoad;
        const hourlyLoad = Math.max(0, currentLoad + variation);
        const hourlyUtilization = (hourlyLoad / ratedCapacity) * 100;

        loadProfile.push({
          timestamp: timestamp.toISOString(),
          utilization: hourlyUtilization,
          load: hourlyLoad,
        });
      }

      const averageLoad24h = loadProfile.reduce((sum, p) => sum + p.load, 0) / loadProfile.length;
      const peakLoad24h = Math.max(...loadProfile.map(p => p.load));
      const minLoad24h = Math.min(...loadProfile.map(p => p.load));

      // Determine status and recommendations
      let status: "optimal" | "underutilized" | "overutilized" | "critical";
      let recommendations: string[] = [];

      if (currentUtilization < 30) {
        status = "underutilized";
        recommendations = [
          "Consider consolidating load with other assets",
          "Review operational schedule for optimization",
          "Evaluate downsizing opportunities during next maintenance"
        ];
      } else if (currentUtilization > 90) {
        status = currentUtilization > 95 ? "critical" : "overutilized";
        recommendations = [
          "Consider load balancing with backup equipment",
          "Schedule capacity expansion evaluation",
          "Monitor for signs of equipment stress"
        ];
      } else {
        status = "optimal";
        recommendations = [
          "Maintain current operating parameters",
          "Continue monitoring for trend changes"
        ];
      }

      // Determine trend
      const recentUtilization = loadProfile.slice(-6).reduce((sum, p) => sum + p.utilization, 0) / 6;
      const earlierUtilization = loadProfile.slice(0, 6).reduce((sum, p) => sum + p.utilization, 0) / 6;
      const utilizationTrend = recentUtilization > earlierUtilization + 2 ? "increasing" :
        recentUtilization < earlierUtilization - 2 ? "decreasing" : "stable";

      return {
        assetId: metric.asset_id,
        assetName: asset?.name || metric.asset_id,
        assetType: assetType.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        currentUtilization,
        ratedCapacity,
        currentLoad,
        averageLoad24h,
        peakLoad24h,
        minLoad24h,
        utilizationTrend,
        loadProfile,
        status,
        recommendations,
        efficiency: 95 + deterministicSeeded(metric.asset_id, 300, -5, 3),
        powerFactor: assetType.includes("transformer") ? 0.85 + deterministicSeeded(metric.asset_id, 310, 0, 0.1) : undefined,
        flowRate: metric.peak_current,
        pressure: undefined,
      };
    });
  }, [effectiveUtilisationData, assets]);

  // Get metrics for selected asset
  const selectedMetrics = currentAsset
    ? utilizationMetrics.find(m => m.assetId === currentAsset.id)
    : null;

  // Generate capacity optimization recommendations
  const capacityOptimizations = useMemo(() => {
    return utilizationMetrics.map(metric => {
      let optimalCapacity = metric.ratedCapacity;
      let potentialSavings = 0;
      let recommendation = "";
      let priority: "high" | "medium" | "low" = "low";

      if (metric.currentUtilization < 30) {
        optimalCapacity = metric.ratedCapacity * 0.7;
        potentialSavings = (metric.ratedCapacity - optimalCapacity) * 0.1;
        recommendation = "Consider downsizing during next maintenance window";
        priority = "medium";
      } else if (metric.currentUtilization > 85) {
        optimalCapacity = metric.ratedCapacity * 1.2;
        potentialSavings = -((optimalCapacity - metric.ratedCapacity) * 0.15);
        recommendation = "Consider capacity expansion to improve reliability";
        priority = metric.currentUtilization > 95 ? "high" : "medium";
      } else {
        recommendation = "Current capacity is well-matched to demand";
        priority = "low";
      }

      return {
        assetId: metric.assetId,
        currentCapacity: metric.ratedCapacity,
        optimalCapacity,
        potentialSavings,
        recommendation,
        priority,
      };
    });
  }, [utilizationMetrics]);

  // Show loading state
  if (utilisationLoading || telemetryLoading) {
    return (
      <APMPageShell
        title="Utilisation & Load Monitoring"
        featureSetName="Asset Performance & Utilisation"
        featureName="Utilisation & Load Monitoring"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading utilisation data...</p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  // Show error state
  if (utilisationError) {
    return (
      <APMPageShell
        title="Utilisation & Load Monitoring"
        featureSetName="Asset Performance & Utilisation"
        featureName="Utilisation & Load Monitoring"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Error loading data: {utilisationError.message}
            </p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "text-green-600 bg-green-50 border-green-200";
      case "underutilized":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "overutilized":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "underutilized":
        return <ArrowDown className="w-4 h-4 text-blue-600" />;
      case "overutilized":
        return <ArrowUp className="w-4 h-4 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-blue-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatCapacity = (value: number, assetType: string) => {
    switch (assetType) {
      case "Wellhead":
        return `${value.toFixed(0)} bbl/day`;
      case "ESP Pump":
        return `${value.toFixed(0)} HP`;
      case "Gas Compressor":
        return `${value.toFixed(0)} kW`;
      case "Crude Pump":
        return `${value.toFixed(0)} bbl/hr`;
      case "Flare KO Drum":
        return `${value.toFixed(0)} scf/min`;
      default:
        return `${value.toFixed(0)}`;
    }
  };

  return (
    <APMPageShell
      title="Utilisation & Load Monitoring"
      featureSetName="Asset Performance & Utilisation"
      featureName="Utilisation & Load Monitoring"
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
        {/* Selected Asset Detailed View */}
        {selectedMetrics && (
          <div className="space-y-6">
            {/* Utilization Gauge and Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    {selectedMetrics.assetName} - Utilization Overview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(selectedMetrics.status))}>
                      {getStatusIcon(selectedMetrics.status)}
                      <span className="ml-1 capitalize">{selectedMetrics.status}</span>
                    </Badge>
                    {getTrendIcon(selectedMetrics.utilizationTrend)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Utilization Display */}
                <div className="text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="text-6xl font-bold text-primary">
                      {selectedMetrics.currentUtilization.toFixed(1)}%
                    </div>
                  </div>
                  <Progress value={selectedMetrics.currentUtilization} className="h-4" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span>Rated Capacity: {formatCapacity(selectedMetrics.ratedCapacity, selectedMetrics.assetType)}</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Current Load Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCapacity(selectedMetrics.currentLoad, selectedMetrics.assetType)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Current Load</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCapacity(selectedMetrics.averageLoad24h, selectedMetrics.assetType)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">24h Average</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCapacity(selectedMetrics.peakLoad24h, selectedMetrics.assetType)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">24h Peak</p>
                  </div>
                </div>

                {/* Additional Metrics */}
                {(selectedMetrics.powerFactor || selectedMetrics.flowRate || selectedMetrics.pressure) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {selectedMetrics.powerFactor && (
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {selectedMetrics.powerFactor.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Power Factor</p>
                      </div>
                    )}
                    {selectedMetrics.flowRate && (
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {selectedMetrics.flowRate.toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedMetrics.assetType.includes("Pump") ? "Flow Rate" : "Production Rate"}
                        </p>
                      </div>
                    )}
                    {selectedMetrics.pressure && (
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {selectedMetrics.pressure.toFixed(0)} psi
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Discharge Pressure</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {selectedMetrics.efficiency.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Efficiency</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Load Profile Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Load Profile - Last 24 Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedMetrics.loadProfile}>
                      <defs>
                        <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="timestamp"
                        fontSize={10}
                        tickFormatter={(t) => new Date(t).getHours() + ":00"}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                        dx={-10}
                      />
                      <Tooltip
                        labelFormatter={(t) => new Date(t).toLocaleString()}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="utilization"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorUtil)"
                        strokeWidth={2}
                        name="Utilization"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Operational Guidance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Operational Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedMetrics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Asset Comparison Overview */}
        {!currentAsset && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Asset Utilization Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {utilizationMetrics.map((metric) => (
                  <div key={metric.assetId} className="p-4 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{metric.assetName}</span>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(metric.status))}>
                          {getStatusIcon(metric.status)}
                          <span className="ml-1 capitalize">{metric.status}</span>
                        </Badge>
                        {getTrendIcon(metric.utilizationTrend)}
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {metric.currentUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.currentUtilization} className="h-3 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Load: {formatCapacity(metric.currentLoad, metric.assetType)} / {formatCapacity(metric.ratedCapacity, metric.assetType)}
                      </span>
                      <span>
                        24h Avg: {formatCapacity(metric.averageLoad24h, metric.assetType)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Capacity Optimization Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Capacity Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {capacityOptimizations
                .filter(opt => currentAsset ? opt.assetId === currentAsset.id : true)
                .map((optimization) => {
                  const metric = utilizationMetrics.find(m => m.assetId === optimization.assetId);
                  if (!metric) return null;

                  return (
                    <div key={optimization.assetId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{metric.assetName}</span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          optimization.priority === "high" ? "text-red-600 bg-red-50 border-red-200" :
                            optimization.priority === "medium" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                              "text-green-600 bg-green-50 border-green-200"
                        )}>
                          {optimization.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{optimization.recommendation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Current Capacity:</span>
                          <div className="font-medium">{formatCapacity(optimization.currentCapacity, metric.assetType)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Optimal Capacity:</span>
                          <div className="font-medium">{formatCapacity(optimization.optimalCapacity, metric.assetType)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Potential Impact:</span>
                          <div className={cn(
                            "font-medium",
                            optimization.potentialSavings > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {optimization.potentialSavings > 0 ? "+" : ""}{optimization.potentialSavings.toFixed(0)}% cost
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Underload/Overload Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Load Condition Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {utilizationMetrics
                .filter(metric =>
                  (currentAsset ? metric.assetId === currentAsset.id : true) &&
                  (metric.status === "underutilized" || metric.status === "overutilized" || metric.status === "critical")
                )
                .map((metric) => (
                  <div key={metric.assetId} className={cn(
                    "p-3 rounded-lg border-l-4",
                    metric.status === "critical" ? "border-l-red-500 bg-red-50 dark:bg-red-950/30" :
                      metric.status === "overutilized" ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30" :
                        "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(metric.status)}
                      <span className="font-medium text-sm">{metric.assetName}</span>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(metric.status))}>
                        {metric.currentUtilization.toFixed(1)}% Utilization
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metric.status === "underutilized" && "Asset is operating below optimal capacity. Consider load consolidation or downsizing."}
                      {metric.status === "overutilized" && "Asset is operating near maximum capacity. Monitor for stress indicators."}
                      {metric.status === "critical" && "Asset is operating at critical capacity levels. Immediate attention required."}
                    </p>
                  </div>
                ))}

              {utilizationMetrics.filter(metric =>
                (currentAsset ? metric.assetId === currentAsset.id : true) &&
                (metric.status === "underutilized" || metric.status === "overutilized" || metric.status === "critical")
              ).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">
                      All assets are operating within optimal utilization ranges
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