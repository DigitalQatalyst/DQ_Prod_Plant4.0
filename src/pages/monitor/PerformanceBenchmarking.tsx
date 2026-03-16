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
  Minus,
  Info,
  Clock,
  History,
  Activity,
  AlertTriangle,
  Trophy,
  Target,
  Lightbulb,
  Award,
  CheckCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  Download
} from "lucide-react";
import { usePerformanceBenchmarks, useReliabilityMetrics, useAssets } from "@/hooks/useAPM";
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

interface AssetBenchmark {
  assetId: string;
  assetName: string;
  assetType: string;
  metrics: BenchmarkMetric[];
  overallRank: number; // 1-100 percentile
  overallScore: number; // 0-100
  improvementPotential: number; // 0-100
  topStrengths: string[];
  improvementAreas: string[];
}

interface BenchmarkMetric {
  metricName: string;
  unit: string;
  currentValue: number;
  target: number;
  bestObserved: number;
  worstObserved: number;
  industryAverage: number;
  percentileRank: number;
  trend: "improving" | "stable" | "degrading";
  gapToTarget: number;
  gapToBest: number;
  benchmarkSource: string;
}

interface ImprovementSuggestion {
  assetId: string;
  assetName: string;
  metric: string;
  currentGap: number;
  potentialImprovement: number;
  priority: "high" | "medium" | "low";
  suggestions: string[];
  estimatedTimeframe: string;
  estimatedCost: string;
}

export function PerformanceBenchmarking() {
  const { selectedAsset, setSelectedAsset } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [metricFilter, setMetricFilter] = useState<string>("all");

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

  // Fetch performance benchmarks from database
  const { data: benchmarksData, loading: benchmarksLoading, error: benchmarksError } = usePerformanceBenchmarks({});

  // Fetch reliability metrics for comparison
  const { data: reliabilityMetricsData, loading: reliabilityLoading } = useReliabilityMetrics({
    asset_id: currentAsset?.id,
  });

  // Generate asset benchmarks
  const assetBenchmarks = useMemo(() => {
    if ((reliabilityMetricsData && reliabilityMetricsData.length > 0) || reliabilityLoading) {
      if (!reliabilityMetricsData || reliabilityMetricsData.length === 0) return [];

      return reliabilityMetricsData.map(metric => {
        const asset = assets.find(a => a.id === metric.asset_id);
        const assetType = asset?.asset_type || "power_transformer";
        const benchmark = benchmarksData?.find(b => b.asset_type === assetType);

        const metrics: BenchmarkMetric[] = [];

        // Availability metric
        if (benchmark?.availability_target) {
          const currentValue = metric.availability_percent;
          const target = benchmark.availability_target;
          const bestObserved = target * 1.02; // 2% above target
          const worstObserved = target * 0.90; // 10% below target
          const industryAverage = target * 0.98;
          const percentileRank = Math.min(100, (currentValue / target) * 100);

          metrics.push({
            metricName: "Availability",
            unit: "%",
            currentValue,
            target,
            bestObserved,
            worstObserved,
            industryAverage,
            percentileRank,
            trend: currentValue >= target ? "improving" : "degrading",
            gapToTarget: ((target - currentValue) / target) * 100,
            gapToBest: ((bestObserved - currentValue) / bestObserved) * 100,
            benchmarkSource: "Industry Standard",
          });
        }

        // MTBF metric
        if (benchmark?.mtbf_target && metric.mtbf_hours) {
          const currentValue = metric.mtbf_hours;
          const target = benchmark.mtbf_target;
          const bestObserved = target * 1.2;
          const worstObserved = target * 0.7;
          const industryAverage = target * 0.95;
          const percentileRank = Math.min(100, (currentValue / target) * 100);

          metrics.push({
            metricName: "MTBF",
            unit: "hours",
            currentValue,
            target,
            bestObserved,
            worstObserved,
            industryAverage,
            percentileRank,
            trend: currentValue >= target ? "improving" : "degrading",
            gapToTarget: ((target - currentValue) / target) * 100,
            gapToBest: ((bestObserved - currentValue) / bestObserved) * 100,
            benchmarkSource: "Industry Standard",
          });
        }

        // MTTR metric
        if (metric.mttr_hours) {
          const currentValue = metric.mttr_hours;
          const target = 8; // Default target
          const bestObserved = target * 0.5;
          const worstObserved = target * 2;
          const industryAverage = target * 1.1;
          const percentileRank = Math.min(100, (target / currentValue) * 100); // Lower is better

          metrics.push({
            metricName: "MTTR",
            unit: "hours",
            currentValue,
            target,
            bestObserved,
            worstObserved,
            industryAverage,
            percentileRank,
            trend: currentValue <= target ? "improving" : "degrading",
            gapToTarget: ((currentValue - target) / target) * 100,
            gapToBest: ((currentValue - bestObserved) / bestObserved) * 100,
            benchmarkSource: "Industry Standard",
          });
        }

        // Calculate overall performance
        const avgPercentileRank = metrics.reduce((sum, m) => sum + m.percentileRank, 0) / Math.max(1, metrics.length);
        const overallScore = avgPercentileRank;
        const improvementPotential = 100 - avgPercentileRank;

        // Identify strengths and improvement areas
        const topStrengths = metrics
          .filter(m => m.percentileRank >= 80)
          .map(m => m.metricName)
          .slice(0, 3);

        const improvementAreas = metrics
          .filter(m => m.percentileRank < 60)
          .sort((a, b) => a.percentileRank - b.percentileRank)
          .map(m => m.metricName)
          .slice(0, 3);

        return {
          assetId: metric.asset_id,
          assetName: asset?.name || metric.asset_id,
          assetType: assetType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          metrics,
          overallRank: Math.round(avgPercentileRank),
          overallScore,
          improvementPotential,
          topStrengths,
          improvementAreas,
        };
      });
    }

    // Generate mock benchmarks if no real data
    const targetAssets = currentAsset ? assets.filter(a => a.id === currentAsset.id) : assets;
    return targetAssets.map(asset => {
      const score = deterministicSeeded(asset.id, 50, 75, 98);
      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        metrics: [
          {
            metricName: "Availability", unit: "%", currentValue: deterministicSeeded(asset.id, 51, 92, 99),
            target: 98, bestObserved: 99.5, worstObserved: 85, industryAverage: 97.5,
            percentileRank: score, trend: "stable" as const, gapToTarget: 1, gapToBest: 1.5,
            benchmarkSource: "Industry standard"
          },
          {
            metricName: "MTBF", unit: "hours", currentValue: deterministicSeeded(asset.id, 52, 1000, 5000),
            target: 4000, bestObserved: 6000, worstObserved: 200, industryAverage: 3800,
            percentileRank: score - 5, trend: "improving" as const, gapToTarget: 0, gapToBest: 1000,
            benchmarkSource: "Industry standard"
          }
        ],
        overallRank: Math.round(score),
        overallScore: score,
        improvementPotential: 100 - score,
        topStrengths: ["Availability", "Load Factor"],
        improvementAreas: ["MTTR"]
      };
    });
  }, [benchmarksData, reliabilityMetricsData, reliabilityLoading, assets, currentAsset]);

  // Generate Trend Data for Chart
  const trendData = useMemo(() => {
    const points = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);

      const seed = currentAsset?.id || "overall";
      const actual = deterministicSeeded(seed, i + 4000, 75, 95);
      const benchmark = deterministicSeeded("industry", i + 4000, 80, 85);

      points.push({
        name: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        actual: parseFloat(actual.toFixed(1)),
        benchmark: parseFloat(benchmark.toFixed(1)),
      });
    }
    return points;
  }, [currentAsset]);

  // Helper for deterministic random matching other files (since it wasn't here)
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

  // Generate improvement suggestions
  const improvementSuggestions = useMemo(() => {
    const suggestions: ImprovementSuggestion[] = [];

    assetBenchmarks.forEach(benchmark => {
      benchmark.metrics.forEach(metric => {
        if (metric.percentileRank < 70) { // Focus on metrics below 70th percentile
          const currentGap = Math.abs(metric.gapToTarget);
          const potentialImprovement = metric.gapToBest;

          let priority: "high" | "medium" | "low";
          if (metric.percentileRank < 30) priority = "high";
          else if (metric.percentileRank < 50) priority = "medium";
          else priority = "low";

          let metricSuggestions: string[] = [];
          let timeframe = "";
          let cost = "";

          // Generate specific suggestions based on metric type
          switch (metric.metricName.toLowerCase()) {
            case "availability":
              metricSuggestions = [
                "Implement predictive maintenance program",
                "Improve spare parts inventory management",
                "Enhance preventive maintenance scheduling"
              ];
              timeframe = "6-12 months";
              cost = "$50K-$150K";
              break;
            case "mtbf":
              metricSuggestions = [
                "Upgrade to higher reliability components",
                "Improve operating procedures and training",
                "Optimize maintenance intervals"
              ];
              timeframe = "3-9 months";
              cost = "$25K-$100K";
              break;
            case "mttr":
              metricSuggestions = [
                "Improve maintenance crew training",
                "Pre-position critical spare parts",
                "Enhance diagnostic capabilities"
              ];
              timeframe = "1-3 months";
              cost = "$10K-$40K";
              break;
            default:
              metricSuggestions = [
                "Benchmark against industry best practices",
                "Implement continuous improvement program",
                "Invest in technology upgrades"
              ];
              timeframe = "3-6 months";
              cost = "$20K-$80K";
          }

          suggestions.push({
            assetId: benchmark.assetId,
            assetName: benchmark.assetName,
            metric: metric.metricName,
            currentGap,
            potentialImprovement,
            priority,
            suggestions: metricSuggestions,
            estimatedTimeframe: timeframe,
            estimatedCost: cost,
          });
        }
      });
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [assetBenchmarks]);

  // Filter data based on selected asset
  const filteredBenchmarks = currentAsset
    ? assetBenchmarks.filter(b => b.assetId === currentAsset.id)
    : assetBenchmarks;

  const filteredSuggestions = currentAsset
    ? improvementSuggestions.filter(s => s.assetId === currentAsset.id)
    : improvementSuggestions;

  // Show loading state
  if (benchmarksLoading || reliabilityLoading) {
    return (
      <APMPageShell
        title="Benchmarking of Asset Performance"
        featureSetName="Asset Performance & Utilisation"
        featureName="Benchmarking of Asset Performance"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading benchmark data...</p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  // Show error state
  if (benchmarksError) {
    return (
      <APMPageShell
        title="Benchmarking of Asset Performance"
        featureSetName="Asset Performance & Utilisation"
        featureName="Benchmarking of Asset Performance"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelection}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Error loading data: {benchmarksError.message}
            </p>
          </div>
        </div>
      </APMPageShell>
    );
  }

  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 80) return "text-green-600";
    if (percentile >= 60) return "text-yellow-600";
    if (percentile >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getPerformanceBadgeColor = (percentile: number) => {
    if (percentile >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentile >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (percentile >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "%") return `${value.toFixed(1)}%`;
    if (unit === "hours") return `${value.toFixed(0)}h`;
    if (unit === "days") return `${value.toFixed(0)}d`;
    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <APMPageShell
      title="Benchmarking of Asset Performance"
      featureSetName="Asset Performance & Utilisation"
      featureName="Benchmarking of Asset Performance"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
      actions={
        <div className="flex items-center gap-2">
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
        {/* Overall Performance Summary */}
        {!currentAsset && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600">
                  {assetBenchmarks.length > 0
                    ? assetBenchmarks.sort((a, b) => b.overallRank - a.overallRank)[0]?.assetName?.split(' ')[0]
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {assetBenchmarks.length > 0
                    ? `${assetBenchmarks.sort((a, b) => b.overallRank - a.overallRank)[0]?.overallRank}th percentile`
                    : "No data available"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Avg Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {assetBenchmarks.length > 0
                    ? `${(assetBenchmarks.reduce((sum, b) => sum + b.overallRank, 0) / assetBenchmarks.length).toFixed(0)}th`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentile rank
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Below Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">
                  {assetBenchmarks.filter(b => b.overallRank < 50).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assets need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Improvement Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  {assetBenchmarks.length > 0
                    ? `${(assetBenchmarks.reduce((sum, b) => sum + b.improvementPotential, 0) / assetBenchmarks.length).toFixed(0)}%`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average potential
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Asset Detailed Benchmarking */}
        {currentAsset && filteredBenchmarks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {filteredBenchmarks[0].assetName} - Performance Ranking
                </CardTitle>
                <Badge variant="outline" className={cn("text-sm", getPerformanceBadgeColor(filteredBenchmarks[0].overallRank))}>
                  {filteredBenchmarks[0].overallRank}th Percentile
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score Display */}
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {filteredBenchmarks[0].overallRank}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Performance Percentile
                </div>
                <Progress value={filteredBenchmarks[0].overallRank} className="h-4" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Bottom 10%</span>
                  <span>Industry Average (50th)</span>
                  <span>Top 10%</span>
                </div>
              </div>

              {/* Strengths and Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Top Strengths
                  </h4>
                  <div className="space-y-2">
                    {filteredBenchmarks[0].topStrengths.length > 0 ? (
                      filteredBenchmarks[0].topStrengths.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          <span>{strength}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No metrics in top 20%</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Improvement Areas
                  </h4>
                  <div className="space-y-2">
                    {filteredBenchmarks[0].improvementAreas.length > 0 ? (
                      filteredBenchmarks[0].improvementAreas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-600" />
                          <span>{area}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">All metrics performing well</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benchmark Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Benchmark Comparison Table
              {currentAsset && (
                <span className="text-sm font-normal text-muted-foreground">
                  • {currentAsset.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredBenchmarks.map((benchmark) => (
                <div key={benchmark.assetId} className="space-y-4">
                  {!currentAsset && (
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h4 className="font-medium">{benchmark.assetName}</h4>
                      <Badge variant="outline" className={cn("text-xs", getPerformanceBadgeColor(benchmark.overallRank))}>
                        {benchmark.overallRank}th Percentile
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-3">
                    {benchmark.metrics.map((metric, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{metric.metricName}</span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs", getPerformanceBadgeColor(metric.percentileRank))}>
                              {metric.percentileRank}th Percentile
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Current</div>
                            <div className={cn("text-sm font-bold", getPerformanceColor(metric.percentileRank))}>
                              {formatValue(metric.currentValue, metric.unit)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Target</div>
                            <div className="text-sm font-bold text-blue-600">
                              {formatValue(metric.target, metric.unit)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Best Observed</div>
                            <div className="text-sm font-bold text-green-600">
                              {formatValue(metric.bestObserved, metric.unit)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Industry Avg</div>
                            <div className="text-sm font-bold">
                              {formatValue(metric.industryAverage, metric.unit)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Rank Position</div>
                            <div className={cn("text-sm font-bold", getPerformanceColor(metric.percentileRank))}>
                              #{Math.round((100 - metric.percentileRank) + 1)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Performance vs Peers</span>
                            <span>{metric.percentileRank}th percentile</span>
                          </div>
                          <Progress value={metric.percentileRank} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                          <span>Source: {metric.benchmarkSource}</span>
                          <div className="flex items-center gap-4">
                            <span>Gap to target: {Math.abs(metric.gapToTarget).toFixed(1)}%</span>
                            <span>Gap to best: {Math.abs(metric.gapToBest).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why You're Below Benchmark */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Why You're Below Benchmark & Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">{suggestion.assetName}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.metric}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                        {suggestion.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-xs text-muted-foreground mb-1">Current Gap</div>
                        <div className="text-lg font-bold text-red-600">
                          {suggestion.currentGap.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-xs text-muted-foreground mb-1">Improvement Potential</div>
                        <div className="text-lg font-bold text-green-600">
                          {suggestion.potentialImprovement.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-xs text-muted-foreground mb-1">Est. Timeframe</div>
                        <div className="text-lg font-bold">
                          {suggestion.estimatedTimeframe}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Improvement Suggestions</div>
                        <div className="space-y-2">
                          {suggestion.suggestions.map((sug, sugIndex) => (
                            <div key={sugIndex} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                        <span>Estimated investment: {suggestion.estimatedCost}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Create Action Plan
                          </Button>
                          <Button size="sm" variant="outline">
                            Schedule Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    All selected assets are performing at or above industry benchmarks
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benchmark Trend Analysis Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Benchmark Trend Analysis Over Time
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
                    domain={[60, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Industry Benchmark"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981' }}
                    name="Actual Performance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}