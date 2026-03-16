import { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Asset as NavigationAsset } from "@/types/navigation";
import { Asset } from "@/types/apm";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTelemetrySeries, useAssets } from "@/hooks/useAPM";
import { supabase } from "@/lib/supabase";
import { generateMockTrendSeries } from "@/lib/mockTelemetry";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  Settings,
  Target,
  BarChart3,
  LineChart,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DegradationTrendsOverview } from "@/components/apm/DegradationTrendsOverview";

// Trend analysis types
interface TrendMetrics {
  slope: number;
  rateOfChange: number;
  projectedThresholdCrossing?: {
    date: string;
    threshold: string;
    thresholdValue: number;
    confidence: number;
  };
  trend: "accelerating" | "stable" | "improving" | "degrading";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
}

interface DegradationAnalysis {
  parameterId: string;
  parameterName: string;
  unit: string;
  currentValue: number;
  currentStatus: string;
  trendMetrics: TrendMetrics;
  rollingStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  warningThreshold?: number;
  criticalThreshold?: number;
}

interface TelemetryParameter {
  id: string;
  name: string;
  unit: string;
  parameter_type: string;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
}

const TIME_HORIZONS = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
] as const;

function calculateLinearRegression(dataPoints: { timestamp: string; value: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  if (dataPoints.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const firstTimestamp = new Date(dataPoints[0].timestamp).getTime();
  const points = dataPoints.map(p => ({
    x: (new Date(p.timestamp).getTime() - firstTimestamp) / (1000 * 60 * 60 * 24),
    y: p.value
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssResidual = points.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  return { slope, intercept, rSquared };
}

function calculateRollingStats(values: number[]): {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { mean, stdDev, min, max };
}

function projectThresholdCrossing(
  currentValue: number,
  slope: number,
  threshold: number,
  thresholdType: string,
  rSquared: number
): { date: string; threshold: string; thresholdValue: number; confidence: number } | undefined {
  if (slope === 0) return undefined;

  const willCross = (slope < 0 && currentValue > threshold) || (slope > 0 && currentValue < threshold);
  if (!willCross) return undefined;

  const daysUntilCrossing = Math.abs((threshold - currentValue) / slope);
  if (daysUntilCrossing > 365) return undefined;

  const crossingDate = new Date();
  crossingDate.setDate(crossingDate.getDate() + daysUntilCrossing);

  const confidence = Math.round(rSquared * 100);

  return {
    date: crossingDate.toISOString(),
    threshold: thresholdType,
    thresholdValue: threshold,
    confidence
  };
}

function analyzeDegradationTrend(
  dataPoints: { timestamp: string; value: number; status: string }[],
  parameterName: string,
  unit: string,
  warningThreshold?: number,
  criticalThreshold?: number
): DegradationAnalysis | null {
  if (dataPoints.length < 2) return null;

  const values = dataPoints.map(p => p.value);
  const currentValue = values[values.length - 1];
  const currentStatus = dataPoints[dataPoints.length - 1].status;

  const { slope, intercept, rSquared } = calculateLinearRegression(dataPoints);
  const rateOfChange = currentValue !== 0 ? (slope * 30 / currentValue) * 100 : 0;

  let trend: TrendMetrics['trend'];
  if (Math.abs(rateOfChange) < 1) {
    trend = 'stable';
  } else if (rateOfChange < -2) {
    trend = 'degrading';
  } else if (rateOfChange < -1) {
    trend = 'accelerating';
  } else {
    trend = 'improving';
  }

  let projectedThresholdCrossing: TrendMetrics['projectedThresholdCrossing'];

  if (criticalThreshold !== undefined) {
    const crossing = projectThresholdCrossing(currentValue, slope, criticalThreshold, 'Critical', rSquared);
    if (crossing) {
      projectedThresholdCrossing = crossing;
    }
  }

  if (!projectedThresholdCrossing && warningThreshold !== undefined) {
    const crossing = projectThresholdCrossing(currentValue, slope, warningThreshold, 'Warning', rSquared);
    if (crossing) {
      projectedThresholdCrossing = crossing;
    }
  }

  let riskLevel: TrendMetrics['riskLevel'];
  if (projectedThresholdCrossing) {
    const daysUntilCrossing = (new Date(projectedThresholdCrossing.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilCrossing < 30 && projectedThresholdCrossing.threshold === 'Critical') {
      riskLevel = 'Critical';
    } else if (daysUntilCrossing < 60) {
      riskLevel = 'High';
    } else if (daysUntilCrossing < 90) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Low';
    }
  } else if (currentStatus === 'Critical') {
    riskLevel = 'Critical';
  } else if (currentStatus === 'Warning') {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  const rollingStats = calculateRollingStats(values);

  return {
    parameterId: '',
    parameterName,
    unit,
    currentValue,
    currentStatus,
    trendMetrics: {
      slope,
      rateOfChange,
      projectedThresholdCrossing,
      trend,
      riskLevel
    },
    rollingStats,
    warningThreshold,
    criticalThreshold
  };
}

export function DegradationTrends() {
  const { setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<string>('30');
  const [availableParameters, setAvailableParameters] = useState<TelemetryParameter[]>([]);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const syncedAssetIdRef = useRef<string | null>(null);

  const currentAsset = selectedAssetLocal;

  const { data: assetsData, loading: assetsLoading } = useAssets({
    operational_status: 'online'
  });

  const mockAssets: Asset[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", asset_type: "power_transformer", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "high", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", asset_type: "circuit_breaker", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", asset_type: "power_transformer", location: "Substation Beta", operational_status: "maintenance", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", asset_type: "circuit_breaker", location: "Substation Beta", operational_status: "offline", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", asset_type: "line_terminal", location: "Substation Gamma", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "low", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() }
  ], []);

  const assets = useMemo(() => {
    const realAssets = assetsData?.data || [];
    if (!assetsLoading && realAssets.length === 0) return mockAssets;
    return realAssets;
  }, [assetsData?.data, assetsLoading, mockAssets]);



  // Convert APM Asset to Navigation Asset for APMPageShell
  const navigationAssets: NavigationAsset[] = assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    type: asset.asset_type,
    location: asset.location || '',
    site: '',
    area: '',
    status: asset.operational_status as any,
    lastSeen: asset.updated_at
  }));

  const currentNavigationAsset = currentAsset ? {
    id: currentAsset.id,
    name: currentAsset.name,
    type: currentAsset.asset_type,
    location: currentAsset.location || '',
    site: '',
    area: '',
    status: currentAsset.operational_status as any,
    lastSeen: currentAsset.updated_at
  } : null;

  const handleAssetSelection = (navAsset: NavigationAsset) => {
    const apmAsset = assets.find(a => a.id === navAsset.id);
    if (apmAsset) {
      setSelectedAssetLocal(apmAsset);
      setSelectedAsset(navAsset);
      setSelectedParameter(null);
    }
  };

  useEffect(() => {
    if (!currentAsset?.id) {
      setAvailableParameters([]);
      return;
    }

    const fetchParameters = async () => {
      setLoadingParameters(true);
      try {
        const { data: assetData, error: assetError } = await supabase
          .from('assets')
          .select('asset_types(name)')
          .eq('id', currentAsset.id)
          .single();

        let assetTypeName = (assetData?.asset_types as any)?.name || currentAsset.asset_type;

        const { data: paramMappings, error: paramError } = await supabase
          .from('asset_parameter_map')
          .select(`
            parameter_id,
            telemetry_parameters (
              id,
              name,
              unit,
              parameter_type,
              warning_min,
              warning_max,
              critical_min,
              critical_max
            )
          `)
          .eq('asset_type', assetTypeName);

        const params = paramMappings
          ?.map((m: any) => m.telemetry_parameters)
          .filter(Boolean) || [];

        if (params.length === 0) {
          // Fallback to mock parameters based on type
          const mockParams: TelemetryParameter[] = [
            { id: 'mock-p1', name: 'Phase A Voltage', unit: 'kV', parameter_type: 'analog', warning_max: 135, critical_max: 140 },
            { id: 'mock-p2', name: 'Phase B Voltage', unit: 'kV', parameter_type: 'analog', warning_max: 135, critical_max: 140 },
            { id: 'mock-p3', name: 'Phase C Voltage', unit: 'kV', parameter_type: 'analog', warning_max: 135, critical_max: 140 },
            { id: 'mock-p4', name: 'Total Load', unit: 'MW', parameter_type: 'analog', warning_max: 85, critical_max: 95 }
          ];
          setAvailableParameters(mockParams);
          if (!selectedParameter) setSelectedParameter(mockParams[0].id);
        } else {
          setAvailableParameters(params);
          if (!selectedParameter) setSelectedParameter(params[0].id);
        }
      } catch (error) {
        console.error('Error fetching parameters:', error);
        // Fallback on error too
        const mockParams: TelemetryParameter[] = [
          { id: 'mock-p1', name: 'Temperature', unit: '°C', parameter_type: 'analog', warning_max: 80, critical_max: 95 },
          { id: 'mock-p2', name: 'Pressure', unit: 'bar', parameter_type: 'analog', warning_min: 5.2, critical_min: 4.8 }
        ];
        setAvailableParameters(mockParams);
        if (!selectedParameter) setSelectedParameter(mockParams[0].id);
      } finally {
        setLoadingParameters(false);
      }
    };

    fetchParameters();
  }, [currentAsset?.id]);

  const dateRange = useMemo(() => {
    const to = new Date();
    to.setMinutes(0, 0, 0); // Round to the hour to prevent constant changes
    const from = new Date(to);
    from.setDate(from.getDate() - parseInt(timeHorizon));
    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }, [timeHorizon]);

  // Memoize parameter_ids array to prevent reference changes
  const parameterIds = useMemo(() => {
    return selectedParameter ? [selectedParameter] : [];
  }, [selectedParameter]);

  const { data: telemetryData, loading: telemetryLoading, refetch } = useTelemetrySeries({
    asset_id: currentAsset?.id || '',
    parameter_ids: parameterIds,
    from: dateRange.from,
    to: dateRange.to,
    interval: timeHorizon === '7' ? '1 hour' : timeHorizon === '30' ? '4 hours' : '12 hours'
  });

  const selectedParameterDetails = useMemo(() => {
    return availableParameters.find(p => p.id === selectedParameter);
  }, [availableParameters, selectedParameter]);

  const effectiveTelemetryData = useMemo(() => {
    if (telemetryLoading) return null;
    if (telemetryData?.series && telemetryData.series.length > 0) return telemetryData;

    // Fallback to mock series
    if (currentAsset && selectedParameterDetails) {
      const hours = parseInt(timeHorizon) * 24;
      const mockPoints = generateMockTrendSeries(
        currentAsset.id,
        currentAsset.asset_type,
        selectedParameterDetails.name,
        hours
      );

      return {
        asset_id: currentAsset.id,
        series: [
          {
            parameter_id: selectedParameterDetails.id,
            parameter_name: selectedParameterDetails.name,
            unit: selectedParameterDetails.unit,
            datapoints: mockPoints
          }
        ]
      };
    }
    return null;
  }, [telemetryData, telemetryLoading, currentAsset, selectedParameterDetails, timeHorizon]);

  const degradationAnalysis = useMemo<DegradationAnalysis | null>(() => {
    if (!effectiveTelemetryData?.series || effectiveTelemetryData.series.length === 0) return null;
    if (!selectedParameterDetails) return null;

    const series = effectiveTelemetryData.series[0];
    if (!series || series.datapoints.length < 2) return null;

    return analyzeDegradationTrend(
      series.datapoints,
      series.parameter_name,
      series.unit,
      selectedParameterDetails.warning_max || selectedParameterDetails.warning_min,
      selectedParameterDetails.critical_max || selectedParameterDetails.critical_min
    );
  }, [effectiveTelemetryData, selectedParameterDetails]);

  const chartData = useMemo(() => {
    if (!effectiveTelemetryData?.series || effectiveTelemetryData.series.length === 0) return [];

    const series = effectiveTelemetryData.series[0];
    if (!series) return [];

    return series.datapoints.map(dp => ({
      timestamp: new Date(dp.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      value: dp.value,
      status: dp.status
    }));
  }, [effectiveTelemetryData]);

  const trendLineData = useMemo(() => {
    if (!degradationAnalysis || !chartData.length || !effectiveTelemetryData?.series?.[0]) return [];

    const { slope, intercept } = calculateLinearRegression(
      effectiveTelemetryData.series[0].datapoints
    );

    return chartData.map((point, index) => ({
      ...point,
      trendValue: slope * index + intercept
    }));
  }, [degradationAnalysis, chartData, effectiveTelemetryData]);

  const getRiskColor = (riskLevel: TrendMetrics["riskLevel"]) => {
    switch (riskLevel) {
      case "Critical":
      case "High":
        return "destructive";
      case "Medium":
        return "outline";
      case "Low":
        return "secondary";
    }
  };

  const getTrendIcon = (trend: TrendMetrics["trend"]) => {
    switch (trend) {
      case "accelerating":
      case "degrading":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "stable":
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilCrossing = (dateString: string) => {
    const crossingDate = new Date(dateString);
    const now = new Date();
    const diffTime = crossingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <APMPageShell
      title="Degradation Trend Analysis"
      featureSetName="Asset Health & Diagnostics"
      featureName="Degradation Trend Analysis"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={currentNavigationAsset}
      onAssetSelect={handleAssetSelection}
    >
      <div className="space-y-6">
        {currentAsset ? (
          <>
            {/* Back to overview */}
            <button
              onClick={() => { setSelectedAssetLocal(null); setSelectedParameter(null); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Overview
            </button>

            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {currentAsset.asset_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{currentAsset.location || 'Unknown location'}</span>
                  <span>•</span>
                  <span>{availableParameters.length} parameters available</span>
                </div>
                <div className="flex items-center gap-2">
                  {sector && (
                    <Badge variant="secondary" className="text-xs">
                      {sector}
                    </Badge>
                  )}
                  {subsector && (
                    <Badge variant="outline" className="text-xs">
                      {subsector}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_HORIZONS.map(horizon => (
                        <SelectItem key={horizon.value} value={horizon.value}>
                          {horizon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={telemetryLoading}
                >
                  <RefreshCw className={cn("w-4 h-4", telemetryLoading && "animate-spin")} />
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Select Parameter for Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingParameters ? (
                  <div className="text-sm text-muted-foreground">Loading parameters...</div>
                ) : availableParameters.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No parameters available for this asset</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableParameters.map(param => (
                      <Button
                        key={param.id}
                        variant={selectedParameter === param.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedParameter(param.id)}
                        className="justify-start"
                      >
                        <span className="truncate">{param.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {telemetryLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading telemetry data...
                  </div>
                </CardContent>
              </Card>
            ) : !selectedParameter ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Target className="w-6 h-6 mr-2" />
                    Select a parameter to analyze degradation trends
                  </div>
                </CardContent>
              </Card>

            ) : !degradationAnalysis ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    Insufficient data for trend analysis (minimum 2 data points required)
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Current Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">
                            {degradationAnalysis.currentValue.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {degradationAnalysis.unit}
                          </div>
                        </div>
                        <Badge variant={
                          degradationAnalysis.currentStatus === 'Critical' ? 'destructive' :
                            degradationAnalysis.currentStatus === 'Warning' ? 'outline' :
                              'secondary'
                        }>
                          {degradationAnalysis.currentStatus}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Degradation Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">
                            {degradationAnalysis.trendMetrics.rateOfChange.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per month
                          </div>
                        </div>
                        {getTrendIcon(degradationAnalysis.trendMetrics.trend)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Trend Classification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-sm capitalize">
                          {degradationAnalysis.trendMetrics.trend}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Risk Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={getRiskColor(degradationAnalysis.trendMetrics.riskLevel) as any} className="text-sm">
                        {degradationAnalysis.trendMetrics.riskLevel}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChart className="w-4 h-4" />
                      {degradationAnalysis.parameterName} Trend - {timeHorizon} Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart data={trendLineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          label={{ value: degradationAnalysis.unit, angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip />
                        <Legend />

                        {degradationAnalysis.warningThreshold !== undefined && (
                          <ReferenceLine
                            y={degradationAnalysis.warningThreshold}
                            stroke="orange"
                            strokeDasharray="3 3"
                            label="Warning"
                          />
                        )}
                        {degradationAnalysis.criticalThreshold !== undefined && (
                          <ReferenceLine
                            y={degradationAnalysis.criticalThreshold}
                            stroke="red"
                            strokeDasharray="3 3"
                            label="Critical"
                          />
                        )}

                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Actual Value"
                        />

                        <Line
                          type="monotone"
                          dataKey="trendValue"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Trend Line"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Rolling Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Mean</div>
                        <div className="text-lg font-semibold">
                          {degradationAnalysis.rollingStats.mean.toFixed(2)} {degradationAnalysis.unit}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Std Dev</div>
                        <div className="text-lg font-semibold">
                          {degradationAnalysis.rollingStats.stdDev.toFixed(2)} {degradationAnalysis.unit}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Min</div>
                        <div className="text-lg font-semibold">
                          {degradationAnalysis.rollingStats.min.toFixed(2)} {degradationAnalysis.unit}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Max</div>
                        <div className="text-lg font-semibold">
                          {degradationAnalysis.rollingStats.max.toFixed(2)} {degradationAnalysis.unit}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {degradationAnalysis.trendMetrics.projectedThresholdCrossing && (
                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <h5 className="font-medium text-orange-800 dark:text-orange-200">
                            Threshold Crossing Projected
                          </h5>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Parameter <strong>{degradationAnalysis.parameterName}</strong> is projected to cross{" "}
                            <strong>{degradationAnalysis.trendMetrics.projectedThresholdCrossing.threshold}</strong> threshold{" "}
                            ({degradationAnalysis.trendMetrics.projectedThresholdCrossing.thresholdValue.toFixed(2)} {degradationAnalysis.unit}) on{" "}
                            <strong>{formatDate(degradationAnalysis.trendMetrics.projectedThresholdCrossing.date)}</strong>{" "}
                            ({getDaysUntilCrossing(degradationAnalysis.trendMetrics.projectedThresholdCrossing.date)} days from now)
                            with <strong>{degradationAnalysis.trendMetrics.projectedThresholdCrossing.confidence}% confidence</strong>.
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Maintenance
                            </Button>
                            <Button size="sm" variant="outline">
                              <Target className="w-4 h-4 mr-2" />
                              Adjust Thresholds
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : (
          <div className="overflow-y-auto">
            <DegradationTrendsOverview
              assets={navigationAssets}
              loading={assetsData === undefined}
              onSelectAsset={handleAssetSelection}
            />
          </div>
        )}
      </div>
    </APMPageShell>
  );
}
