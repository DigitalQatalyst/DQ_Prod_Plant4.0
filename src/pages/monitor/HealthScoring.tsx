import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { HealthIndexCard } from "@/components/apm/HealthIndexCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Clock,
  Target,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAssets, useHealthScore, useTelemetrySeries } from "@/hooks/useAPM";
import { generateMockHealthScore } from "@/lib/mockTelemetry";
import { HealthScoringOverview } from "@/components/apm/HealthScoringOverview";
import type { Asset as APMAsset } from "@/types/apm";

export function HealthScoring() {
  const [selectedAPMAsset, setSelectedAPMAsset] = useState<APMAsset | null>(null);
  const [historicalHealthData, setHistoricalHealthData] = useState<any[]>([]);

  // Fetch transmission assets from APM system
  const { data: apmAssetsData, loading: assetsLoading } = useAssets({
    pageSize: 100,
  });

  const mockAssetsList: APMAsset[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", asset_type: "Power Transformer", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", asset_type: "Circuit Breaker", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", asset_type: "Power Transformer", location: "Substation Beta", operational_status: "maintenance", updated_at: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", asset_type: "Circuit Breaker", location: "Substation Beta", operational_status: "offline", updated_at: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", asset_type: "Line Terminal", location: "Substation Gamma", operational_status: "online", updated_at: new Date().toISOString() }
  ], []);

  // Convert APM assets to Asset format for the sidebar
  const assets: Asset[] = useMemo(() => {
    const realAssets = apmAssetsData?.data || [];
    const baseAssets = (!assetsLoading && realAssets.length === 0) ? mockAssetsList : realAssets;

    return baseAssets.map(apmAsset => ({
      id: apmAsset.id,
      name: apmAsset.name,
      type: apmAsset.asset_type || 'Unknown',
      location: apmAsset.location || '',
      site: apmAsset.location || '',
      area: apmAsset.location || '',
      lastSeen: apmAsset.updated_at || new Date().toISOString(),
      status: apmAsset.operational_status || 'online',
      criticality: (() => {
        const score = (apmAsset as any).criticality_score;
        if (score === undefined || score === null) return 'medium';
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
      })() as Asset['criticality'],
    }));
  }, [apmAssetsData?.data, assetsLoading, mockAssetsList]);

  // Use the selected APM asset directly
  const currentAsset = selectedAPMAsset ? {
    id: selectedAPMAsset.id,
    name: selectedAPMAsset.name,
    type: selectedAPMAsset.asset_type || 'Unknown',
    location: selectedAPMAsset.location || '',
    site: selectedAPMAsset.location || '',
    area: selectedAPMAsset.location || '',
    lastSeen: selectedAPMAsset.updated_at || new Date().toISOString(),
    status: selectedAPMAsset.operational_status || 'online',
    criticality: (() => {
      const score = (selectedAPMAsset as any).criticality_score;
      if (score === undefined || score === null) return 'medium';
      if (score >= 80) return 'critical';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      return 'low';
    })() as Asset['criticality'],
  } as Asset : null;

  // Fetch health score for selected asset (fall back to mock when DB returns nothing)
  const { data: healthScoreRaw, loading: healthScoreLoading, refetch: refetchHealthScore } = useHealthScore({
    asset_id: selectedAPMAsset?.id || '',
  });

  const healthScoreData = healthScoreRaw
    ?? (selectedAPMAsset
      ? generateMockHealthScore(selectedAPMAsset.id, selectedAPMAsset.asset_type || '')
      : null);

  // Fetch historical health scores (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: telemetrySeriesData, loading: telemetryLoading } = useTelemetrySeries({
    asset_id: selectedAPMAsset?.id || '',
    parameter_ids: healthScoreData?.breakdown.map(b => b.parameter_name) || [],
    from: thirtyDaysAgo.toISOString(),
    to: new Date().toISOString(),
  });

  const handleAssetSelection = (asset: Asset) => {
    // Find the corresponding APM asset from real or mock list
    const realAssets = apmAssetsData?.data || [];
    const baseAssets = realAssets.length > 0 ? realAssets : mockAssetsList;
    const apmAsset = baseAssets.find(a => a.id === asset.id);
    if (apmAsset) {
      setSelectedAPMAsset(apmAsset);
    }
  };

  // Auto-refresh health score every 60 seconds
  useEffect(() => {
    if (selectedAPMAsset?.id) {
      const interval = setInterval(() => {
        refetchHealthScore();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [selectedAPMAsset?.id, refetchHealthScore]);

  // Generate health score history from telemetry data
  useEffect(() => {
    if (healthScoreData && telemetrySeriesData) {
      // Simulate historical health scores based on telemetry trends
      // In production, this would query actual historical health_scores table
      const currentHealth = healthScoreData.score;
      const data = [];
      const days = 30;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Simulate trend based on current health
        let healthValue = currentHealth;
        if (currentHealth < 70) {
          healthValue = currentHealth + (i * 0.5); // Was degrading
        } else if (currentHealth < 85) {
          healthValue = currentHealth + (Math.sin(i / 5) * 2); // Stable with fluctuations
        } else {
          healthValue = currentHealth - (Math.random() * 5); // Stable high
        }

        data.push({
          date: date.toISOString().split('T')[0],
          health: Math.max(40, Math.min(100, Math.round(healthValue))),
          timestamp: date.getTime()
        });
      }

      setHistoricalHealthData(data.sort((a, b) => a.timestamp - b.timestamp));
    }
  }, [healthScoreData, telemetrySeriesData]);

  // Generate component health breakdown from health score data
  const getComponentHealthBreakdown = () => {
    if (!healthScoreData?.breakdown) return [];

    return healthScoreData.breakdown.map(item => ({
      name: item.parameter_name,
      health: Math.round(item.contribution),
      trend: item.status === 'Critical' ? 'degrading' :
        item.status === 'Warning' ? 'stable' : 'improving',
      criticality: item.contribution < 70 ? 'high' :
        item.contribution < 85 ? 'medium' : 'low',
      lastInspection: healthScoreData.computed_at,
      currentValue: item.current_value,
      status: item.status,
    }));
  };

  // Get top degradation contributors from health breakdown
  const getTopDegradationContributors = () => {
    if (!healthScoreData?.breakdown) return [];

    return healthScoreData.breakdown
      .filter(item => item.status !== 'Normal')
      .map(item => ({
        factor: item.parameter_name,
        impact: Math.round((100 - item.contribution) * 0.5), // Convert to impact percentage
        description: `Current value: ${item.current_value.toFixed(2)} (${item.status})`,
        trend: item.status === 'Critical' ? 'increasing' : 'stable',
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 4);
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

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-600";
    if (health >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const isLoading = healthScoreLoading || telemetryLoading || assetsLoading;
  const componentBreakdown = getComponentHealthBreakdown();
  const degradationContributors = getTopDegradationContributors();
  const healthTrend = healthScoreData ?
    (healthScoreData.score < 70 ? "degrading" :
      healthScoreData.score < 85 ? "stable" : "improving") : "stable";

  return (
    <APMPageShell
      title="Asset Health Scoring / Index"
      featureSetName="Asset Health & Diagnostics"
      featureName="Asset Health Scoring / Index"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset ? (
        <div className="space-y-6">
          {/* Back to overview */}
          <button
            onClick={() => setSelectedAPMAsset(null)}
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
                <Badge variant="outline" className={cn("text-xs", getCriticalityColor(currentAsset.criticality || "medium"))}>
                  {(currentAsset.criticality || "medium").toUpperCase()} CRITICALITY
                </Badge>
                {isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                {healthScoreData && (
                  <>
                    <span>•</span>
                    <span>Last computed: {new Date(healthScoreData.computed_at).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {healthScoreData ? (
            <>
              {/* Health Score Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Health Index Card */}
                <HealthIndexCard
                  asset={currentAsset}
                  breakdown={componentBreakdown.length > 0 ? {
                    vibrationScore: componentBreakdown[0]?.health || 85,
                    temperatureScore: componentBreakdown[1]?.health || 85,
                    pressureScore: componentBreakdown[2]?.health || 85,
                    electricalScore: componentBreakdown[3]?.health || 85,
                    runtimeFactor: componentBreakdown[4]?.health || 85,
                  } : undefined}
                  trend={healthTrend}
                  healthScore={healthScoreData.score}
                />

                {/* Health History Trend */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Health Score History (30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {historicalHealthData.length > 0 ? (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalHealthData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis
                                domain={[40, 100]}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '6px',
                                }}
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                formatter={(value: number) => [`${value}%`, 'Health Score']}
                              />
                              <Area
                                type="monotone"
                                dataKey="health"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.1}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                          Loading historical data...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Top Contributors to Degradation */}
              {degradationContributors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Top Contributors to Degradation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {degradationContributors.map((contributor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{contributor.factor}</span>
                              {getTrendIcon(contributor.trend)}
                              <Badge variant="outline" className="text-xs">
                                {contributor.impact}% Impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {contributor.description}
                            </p>
                          </div>
                          <div className="w-24">
                            <Progress value={contributor.impact} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Component Health Breakdown */}
              {componentBreakdown.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Health Score Breakdown by Component
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {componentBreakdown.map((component, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{component.name}</h4>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs mt-1", getCriticalityColor(component.criticality))}
                                >
                                  {component.criticality.toUpperCase()}
                                </Badge>
                              </div>
                              {getTrendIcon(component.trend)}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Health Score</span>
                                <span className={cn("text-lg font-bold", getHealthColor(component.health))}>
                                  {component.health}%
                                </span>
                              </div>
                              <Progress value={component.health} className="h-2" />
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Last updated: {new Date(component.lastInspection).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : !isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No health score data available for this asset</p>
                  <p className="text-sm mt-2">
                    Health scores are computed based on telemetry data and asset models
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="overflow-y-auto">
          <HealthScoringOverview
            assets={assets}
            loading={assetsLoading}
            onSelectAsset={handleAssetSelection}
          />
        </div>
      )}
    </APMPageShell>
  );
}