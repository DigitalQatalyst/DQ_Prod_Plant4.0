import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { HealthIndexCard } from "@/components/apm/HealthIndexCard";
import { SignalKPIGrid } from "@/components/apm/SignalKPIGrid";
import { MiniTrendChart } from "@/components/apm/MiniTrendChart";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeartPulse, Activity, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { ConditionMonitoringOverview } from "@/components/apm/ConditionMonitoringOverview";
import { useAssets, useLatestTelemetry, useHealthScore } from "@/hooks/useAPM";
import { generateMockTelemetry, generateMockHealthScore, generateMockTrendSeries } from "@/lib/mockTelemetry";
import type { Asset as APMAsset, TelemetryStatus } from "@/types/apm";

export function ConditionMonitoring() {
  const { setSelectedAsset } = useApp();
  // Use PAGE-LOCAL state only — never inherit the global selectedAsset so that
  // the overview is always the landing view when navigating to this page.
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [selectedAPMAssetId, setSelectedAPMAssetId] = useState<string | null>(null);

  // ─── Mock Assets Fallback ──────────────────────────────────────────────────
  const mockAssets: Asset[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", type: "Power Transformer", location: "Substation Alpha", site: "Substation Alpha", area: "Yard 1", status: "online", criticality: "critical", lastSeen: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", type: "Circuit Breaker", location: "Substation Alpha", site: "Substation Alpha", area: "Bay 2", status: "online", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", type: "Power Transformer", location: "Substation Beta", site: "Substation Beta", area: "Yard 2", status: "maintenance", criticality: "medium", lastSeen: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", type: "Circuit Breaker", location: "Substation Beta", site: "Substation Beta", area: "Bay 1", status: "offline", criticality: "high", lastSeen: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", type: "Line Terminal", location: "Substation Gamma", site: "Substation Gamma", area: "Line Yard", status: "online", criticality: "critical", lastSeen: new Date().toISOString() }
  ], []);

  // Fetch transmission assets from APM system
  const { data: apmAssetsData, loading: assetsLoading } = useAssets({
    pageSize: 100,
  });



  // Fetch latest telemetry for selected asset
  const { data: telemetryData, loading: telemetryLoading, refetch: refetchTelemetry } = useLatestTelemetry({
    asset_id: selectedAPMAssetId || '',
  });

  // Fetch health score for selected asset
  const { data: healthScoreData, loading: healthScoreLoading, refetch: refetchHealthScore } = useHealthScore({
    asset_id: selectedAPMAssetId || '',
  });
  const apmAssetsForSidebar: Asset[] = useMemo(() => {
    const realAssets = apmAssetsData?.data?.map(apmAsset => ({
      id: apmAsset.id,
      name: apmAsset.name,
      type: (apmAsset as any).asset_types?.name || apmAsset.asset_type || 'Unknown',
      location: apmAsset.location || '',
      site: apmAsset.location || '',
      area: apmAsset.location || '',
      lastSeen: apmAsset.updated_at || new Date().toISOString(),
      status: apmAsset.operational_status || (apmAsset as any).status || 'unknown',
      criticality: (() => {
        const c = (apmAsset.criticality || 'standard').toLowerCase();
        if (c === 'critical') return 'critical';
        if (c === 'important' || c === 'high') return 'high';
        if (c === 'standard' || c === 'medium') return 'medium';
        return 'low';
      })() as Asset['criticality'],
    })) || [];

    if (!assetsLoading && realAssets.length === 0) {
      return mockAssets;
    }
    return realAssets;
  }, [apmAssetsData, assetsLoading, mockAssets]);

  const handleAssetSelection = (asset: Asset) => {
    setCurrentAsset(asset);
    setSelectedAsset(asset);
    setSelectedAPMAssetId(asset.id);
  };

  // Auto-refresh telemetry every 30 seconds
  useEffect(() => {
    if (selectedAPMAssetId) {
      const interval = setInterval(() => {
        refetchTelemetry();
        refetchHealthScore();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedAPMAssetId, refetchTelemetry, refetchHealthScore]);

  // ── Use real data if available, else fall back to deterministic mock data ──
  const effectiveTelemetry = (telemetryData && telemetryData.readings.length > 0)
    ? telemetryData
    : (selectedAPMAssetId
      ? generateMockTelemetry(selectedAPMAssetId, currentAsset?.type || '')
      : null);

  const effectiveHealthScore = healthScoreData
    ? healthScoreData
    : (selectedAPMAssetId
      ? generateMockHealthScore(selectedAPMAssetId, currentAsset?.type || '')
      : null);

  // Convert telemetry readings to chart format (24-h trend series)
  const getTelemetryChartData = () => {
    if (!effectiveTelemetry?.readings) return {};

    const chartData: Record<string, any[]> = {};
    effectiveTelemetry.readings.forEach(reading => {
      // Use a generated 24-h trend so charts always display a real line
      const series = selectedAPMAssetId
        ? generateMockTrendSeries(selectedAPMAssetId, currentAsset?.type || '', reading.parameter_name)
        : [{ timestamp: reading.timestamp, value: reading.value, unit: reading.unit, status: reading.status }];
      chartData[reading.parameter_name] = series.map(p => ({
        ...p,
        unit: reading.unit,
      }));
    });
    return chartData;
  };

  // Get health index breakdown from health score data
  const getHealthIndexBreakdown = (): {
    vibrationScore: number;
    temperatureScore: number;
    pressureScore: number;
    electricalScore: number;
    runtimeFactor: number;
  } | undefined => {
    if (!effectiveHealthScore?.breakdown || effectiveHealthScore.breakdown.length === 0) return undefined;

    // Map dynamic parameter names to the 5-slot typed breakdown
    const find = (keywords: string[]) => {
      const item = effectiveHealthScore.breakdown.find(b =>
        keywords.some(k => b.parameter_name.toLowerCase().includes(k))
      );
      // Scale 0-100 from contribution weight; clamp 0-100
      return item ? Math.min(100, Math.max(0, Math.round(item.contribution * 6))) : Math.round(effectiveHealthScore.score);
    };

    return {
      vibrationScore: find(['vibration', 'mechanical', 'vib']),
      temperatureScore: find(['temp', 'thermal', 'heat', 'oil', 'winding']),
      pressureScore: find(['pressure', 'gas', 'sf6', 'vacuum']),
      electricalScore: find(['voltage', 'current', 'power', 'electrical', 'load']),
      runtimeFactor: find(['runtime', 'operation', 'age', 'cycle', 'wear']),
    };
  };

  // Get condition summary based on health score and telemetry status
  const getConditionSummary = () => {
    const healthScore = effectiveHealthScore?.score || 0;
    const criticalReadings = effectiveTelemetry?.readings.filter(r => r.status === 'Critical').length || 0;
    const warningReadings = effectiveTelemetry?.readings.filter(r => r.status === 'Warning').length || 0;

    if (criticalReadings > 0 || healthScore < 70) {
      return {
        state: "Critical",
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: AlertTriangle,
        description: "Immediate attention required - critical condition detected"
      };
    } else if (warningReadings > 0 || healthScore < 85) {
      return {
        state: "Warning",
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        icon: Activity,
        description: "Monitoring required - degraded performance detected"
      };
    } else {
      return {
        state: "Normal",
        color: "bg-green-500/10 text-green-600 border-green-500/20",
        icon: CheckCircle,
        description: "Operating within normal parameters"
      };
    }
  };

  // Get trend for health index
  const getHealthTrend = (): "improving" | "stable" | "degrading" => {
    const healthScore = effectiveHealthScore?.score || 0;
    const criticalReadings = effectiveTelemetry?.readings.filter(r => r.status === 'Critical').length || 0;

    if (criticalReadings > 0 || healthScore < 70) return "degrading";
    if (healthScore < 85) return "stable";
    return "improving";
  };

  // Convert telemetry data to KPI grid format
  const getTelemetryDataForGrid = () => {
    if (!effectiveTelemetry?.readings) return {};

    const gridData: Record<string, any[]> = {};
    effectiveTelemetry.readings.forEach(reading => {
      gridData[reading.parameter_name] = [
        {
          timestamp: reading.timestamp,
          value: reading.value,
          unit: reading.unit,
          status: reading.status,
        }
      ];
    });
    return gridData;
  };

  const isLoading = telemetryLoading || healthScoreLoading;
  const chartData = getTelemetryChartData();
  const telemetryForGrid = getTelemetryDataForGrid();

  return (
    <APMPageShell
      title="Real-time Condition Monitoring"
      featureSetName="Asset Health & Diagnostics"
      featureName="Real-time Condition Monitoring"
      listType="assets"
      assets={apmAssetsForSidebar}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset ? (
        <div className="space-y-6">
          {/* Back to overview */}
          <button
            onClick={() => { setCurrentAsset(null); setSelectedAPMAssetId(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Overview
          </button>

          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                <StatusBadge status={currentAsset.status} />
                {isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                {effectiveTelemetry && effectiveTelemetry.readings.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Last reading: {new Date(effectiveTelemetry.readings[0].timestamp).toLocaleString()}</span>
                    {!telemetryData?.readings.length && (
                      <span className="text-xs italic text-muted-foreground/60">(simulated)</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Condition Summary */}
          {effectiveTelemetry && (
            <>
              {(() => {
                const condition = getConditionSummary();
                const ConditionIcon = condition.icon;
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ConditionIcon className="w-5 h-5" />
                        Condition Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn("text-sm px-3 py-1", condition.color)}
                        >
                          {condition.state}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {condition.description}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {effectiveTelemetry.readings.length} parameters monitored •
                        {' '}{effectiveTelemetry.readings.filter(r => r.status === 'Normal').length} normal •
                        {' '}{effectiveTelemetry.readings.filter(r => r.status === 'Warning').length} warning •
                        {' '}{effectiveTelemetry.readings.filter(r => r.status === 'Critical').length} critical
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Health Index Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {effectiveHealthScore ? (
                  <HealthIndexCard
                    asset={currentAsset}
                    breakdown={getHealthIndexBreakdown()}
                    trend={getHealthTrend()}
                    healthScore={effectiveHealthScore.score}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Health Index</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        No health score data available
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Process Variables - Mini Trend Charts */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-lg font-semibold">Key Process Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(chartData).slice(0, 4).map(([parameter, data]) => (
                      <MiniTrendChart
                        key={parameter}
                        data={data}
                        parameter={parameter}
                        unit={data[0]?.unit || ""}
                        title={parameter}
                      />
                    ))}
                  </div>
                  {Object.keys(chartData).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No telemetry data available for visualization
                    </div>
                  )}
                </div>
              </div>

              {/* Asset-Type-Aware KPI Grid */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Asset Parameters</h4>
                <SignalKPIGrid
                  asset={currentAsset}
                  telemetryData={telemetryForGrid}
                  assetType={currentAsset.type}
                />
              </div>
            </>
          )}

          {/* Remove the empty state — we always show mock data when DB is empty */}
        </div>
      ) : (
        <div className="overflow-y-auto">
          <ConditionMonitoringOverview
            assets={apmAssetsForSidebar}
            loading={assetsLoading}
            onSelectAsset={handleAssetSelection}
          />
        </div>
      )}
    </APMPageShell>
  );
}