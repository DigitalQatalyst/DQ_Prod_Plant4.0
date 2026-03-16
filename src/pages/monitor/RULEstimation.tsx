import { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/context/AppContext";
import { Clock, TrendingDown, AlertTriangle, Target, Calendar, Activity, Wrench, BarChart3, TrendingUp } from "lucide-react";
import { useAssets, useFailurePredictions } from "@/hooks/useAPM";
import { Asset } from "@/types/apm";
import { RULEstimationOverview } from "@/components/apm/RULEstimationOverview";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// Mock RUL estimation data for upstream assets (fallback)
const mockRULData = {
  "WH-01": {
    rulDays: 245,
    rulMonths: 8.2,
    confidenceLevel: 87,
    confidenceInterval: { lower: 82, upper: 92 },
    degradationRate: 2.3, // % per month
    trendDirection: "stable",
    criticalComponents: [
      { name: "Surface safety valve", rulDays: 245, confidence: 87, degradation: 2.3, confidenceInterval: { lower: 82, upper: 92 } },
      { name: "Choke valve", rulDays: 180, confidence: 82, degradation: 3.1, confidenceInterval: { lower: 78, upper: 86 } },
      { name: "Wellhead assembly", rulDays: 300, confidence: 90, degradation: 1.8, confidenceInterval: { lower: 88, upper: 94 } }
    ],
    maintenanceHistory: [
      { date: "2024-01-15", type: "Preventive", description: "Valve inspection and calibration" },
      { date: "2023-11-20", type: "Corrective", description: "Choke valve replacement" }
    ],
    riskFactors: [
      { factor: "Operating pressure", impact: "Medium", trend: "Stable" },
      { factor: "Environmental conditions", impact: "Low", trend: "Improving" },
      { factor: "Production rate", impact: "Medium", trend: "Stable" }
    ],
    degradationMarkers: [
      { component: "Surface safety valve", severity: "Low", description: "Normal wear patterns observed" },
      { component: "Choke valve", severity: "Medium", description: "Moderate erosion detected" }
    ]
  },
  "ESP-07": {
    rulDays: 180,
    rulMonths: 6.0,
    confidenceLevel: 92,
    confidenceInterval: { lower: 88, upper: 96 },
    degradationRate: 3.8,
    trendDirection: "decreasing",
    criticalComponents: [
      { name: "Motor bearings", rulDays: 180, confidence: 92, degradation: 3.8, confidenceInterval: { lower: 88, upper: 96 } },
      { name: "Pump impeller", rulDays: 220, confidence: 85, degradation: 3.2, confidenceInterval: { lower: 80, upper: 90 } },
      { name: "Downhole cable", rulDays: 365, confidence: 78, degradation: 2.1, confidenceInterval: { lower: 72, upper: 84 } }
    ],
    maintenanceHistory: [
      { date: "2024-01-10", type: "Preventive", description: "Motor inspection and testing" },
      { date: "2023-09-15", type: "Corrective", description: "Impeller replacement" }
    ],
    riskFactors: [
      { factor: "Motor load", impact: "High", trend: "Increasing" },
      { factor: "Vibration levels", impact: "Medium", trend: "Stable" },
      { factor: "Operating temperature", impact: "Low", trend: "Stable" }
    ],
    degradationMarkers: [
      { component: "Motor bearings", severity: "High", description: "Accelerated wear due to high load" },
      { component: "Pump impeller", severity: "Medium", description: "Cavitation damage observed" }
    ]
  },
  "GC-11": {
    rulDays: 90,
    rulMonths: 3.0,
    confidenceLevel: 89,
    confidenceInterval: { lower: 84, upper: 94 },
    degradationRate: 5.2,
    trendDirection: "decreasing",
    criticalComponents: [
      { name: "Compressor blades", rulDays: 90, confidence: 89, degradation: 5.2, confidenceInterval: { lower: 84, upper: 94 } },
      { name: "Thrust bearings", rulDays: 120, confidence: 86, degradation: 4.5, confidenceInterval: { lower: 81, upper: 91 } },
      { name: "Seal system", rulDays: 150, confidence: 83, degradation: 3.8, confidenceInterval: { lower: 78, upper: 88 } }
    ],
    maintenanceHistory: [
      { date: "2024-01-08", type: "Preventive", description: "Blade inspection and cleaning" },
      { date: "2023-12-20", type: "Preventive", description: "Bearing lubrication" }
    ],
    riskFactors: [
      { factor: "Vibration levels", impact: "High", trend: "Increasing" },
      { factor: "Operating temperature", impact: "Medium", trend: "Stable" },
      { factor: "Gas composition", impact: "Low", trend: "Stable" }
    ],
    degradationMarkers: [
      { component: "Compressor blades", severity: "Critical", description: "Significant fouling and erosion detected" },
      { component: "Thrust bearings", severity: "High", description: "Elevated temperature and vibration" }
    ]
  },
  "P-21": {
    rulDays: 210,
    rulMonths: 7.0,
    confidenceLevel: 85,
    confidenceInterval: { lower: 80, upper: 90 },
    degradationRate: 2.8,
    trendDirection: "stable",
    criticalComponents: [
      { name: "Pump impeller", rulDays: 210, confidence: 85, degradation: 2.8, confidenceInterval: { lower: 80, upper: 90 } },
      { name: "Mechanical seal", rulDays: 180, confidence: 88, degradation: 3.2, confidenceInterval: { lower: 83, upper: 93 } },
      { name: "Motor windings", rulDays: 400, confidence: 92, degradation: 1.5, confidenceInterval: { lower: 89, upper: 95 } }
    ],
    maintenanceHistory: [
      { date: "2024-01-12", type: "Preventive", description: "Seal inspection and replacement" },
      { date: "2023-11-28", type: "Corrective", description: "Motor bearing replacement" }
    ],
    riskFactors: [
      { factor: "Fluid properties", impact: "Medium", trend: "Stable" },
      { factor: "Operating pressure", impact: "Low", trend: "Stable" },
      { factor: "Operating temperature", impact: "Low", trend: "Improving" }
    ],
    degradationMarkers: [
      { component: "Pump impeller", severity: "Low", description: "Normal wear patterns observed" },
      { component: "Mechanical seal", severity: "Medium", description: "Minor leakage detected" }
    ]
  },
  "KO-03": {
    rulDays: 60,
    rulMonths: 2.0,
    confidenceLevel: 94,
    confidenceInterval: { lower: 90, upper: 97 },
    degradationRate: 8.1,
    trendDirection: "decreasing",
    criticalComponents: [
      { name: "Vessel shell", rulDays: 60, confidence: 94, degradation: 8.1, confidenceInterval: { lower: 90, upper: 97 } },
      { name: "Internal baffles", rulDays: 60, confidence: 91, degradation: 7.2, confidenceInterval: { lower: 87, upper: 95 } },
      { name: "Drain system", rulDays: 90, confidence: 87, degradation: 5.5, confidenceInterval: { lower: 82, upper: 92 } }
    ],
    maintenanceHistory: [
      { date: "2024-01-05", type: "Corrective", description: "Emergency repair of vessel shell" },
      { date: "2023-12-20", type: "Preventive", description: "Internal inspection" }
    ],
    riskFactors: [
      { factor: "Corrosion rate", impact: "Critical", trend: "Increasing" },
      { factor: "Operating pressure", impact: "High", trend: "Stable" },
      { factor: "Material degradation", impact: "High", trend: "Increasing" }
    ],
    degradationMarkers: [
      { component: "Vessel shell", severity: "Critical", description: "Severe corrosion and wall thinning" },
      { component: "Internal baffles", severity: "Critical", description: "Structural integrity compromised" }
    ]
  }
};

export function RULEstimation() {
  const { assets: contextAssets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // Fetch assets from database
  const { data: assetsResponse, loading: assetsLoading } = useAssets({
    sector: 'power_transmission',
    pageSize: 100
  });

  const mockAssets: any[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", asset_type: "power_transformer", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "high", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", asset_type: "circuit_breaker", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", asset_type: "power_transformer", location: "Substation Beta", operational_status: "maintenance", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", asset_type: "circuit_breaker", location: "Substation Beta", operational_status: "offline", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", asset_type: "line_terminal", location: "Substation Gamma", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "low", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() }
  ], []);

  // Use database assets if available, otherwise fall back to context or mock assets
  const assets = useMemo(() => {
    const realAssets = assetsResponse?.data || contextAssets;
    if (!assetsLoading && (!realAssets || realAssets.length === 0)) return mockAssets;
    return realAssets as any[];
  }, [assetsResponse?.data, contextAssets, assetsLoading, mockAssets]);

  // Fetch failure predictions (which include RUL data)
  const { data: predictions, loading: predictionsLoading } = useFailurePredictions({
    pageSize: 100
  });

  const currentAsset = selectedAsset || selectedAssetLocal;

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset as any);
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

  const getRULData = (assetId: string) => {
    // First try to find real prediction data with RUL
    const assetPredictions = predictions?.filter(p => p.asset_id === assetId && p.rul_days) || [];

    if (assetPredictions.length === 0) {
      // Fallback to older mock array if exists
      if (mockRULData[assetId as keyof typeof mockRULData]) return mockRULData[assetId as keyof typeof mockRULData];

      // NEW: Generate deterministic RUL for ANY asset ID
      const seed = assetId;
      const rulDays = Math.floor(deterministicSeeded(seed, 55, 10, 360));
      const confidence = Math.floor(deterministicSeeded(seed, 88, 82, 96));
      const degradation = +deterministicSeeded(seed, 22, 1.5, 6.5).toFixed(1);

      return {
        rulDays,
        rulMonths: rulDays / 30,
        confidenceLevel: confidence,
        confidenceInterval: {
          lower: confidence - 4,
          upper: Math.min(100, confidence + 4)
        },
        degradationRate: degradation,
        trendDirection: rulDays < 100 ? "decreasing" : "stable",
        criticalComponents: [
          { name: "Main Bearings", rulDays, confidence, degradation, confidenceInterval: { lower: confidence - 4, upper: confidence + 4 } }
        ],
        maintenanceHistory: [],
        riskFactors: [
          { factor: "Loading Stress", impact: "Medium", trend: "Stable" }
        ],
        degradationMarkers: []
      };
    }

    // Use the prediction with the shortest RUL (as before)
    const shortestRUL = assetPredictions.reduce((min, p) =>
      (p.rul_days && (!min.rul_days || p.rul_days < min.rul_days)) ? p : min
    );

    return {
      rulDays: shortestRUL.rul_days || 0,
      rulMonths: shortestRUL.rul_days ? shortestRUL.rul_days / 30 : 0,
      confidenceLevel: shortestRUL.confidence,
      confidenceInterval: {
        lower: Math.max(0, shortestRUL.confidence - 5),
        upper: Math.min(100, shortestRUL.confidence + 5)
      },
      degradationRate: 2.5,
      trendDirection: shortestRUL.rul_days < 90 ? "decreasing" : "stable",
      criticalComponents: shortestRUL.contributing_factors?.map(factor => ({
        name: factor,
        rulDays: shortestRUL.rul_days || 0,
        confidence: shortestRUL.confidence,
        degradation: 2.5,
        confidenceInterval: {
          lower: Math.max(0, shortestRUL.confidence - 5),
          upper: Math.min(100, shortestRUL.confidence + 5)
        }
      })) || [],
      maintenanceHistory: [],
      riskFactors: [],
      degradationMarkers: []
    };
  };

  // Get RUL status color based on remaining days
  const getRULStatusColor = (days: number) => {
    if (days <= 60) return "text-red-600";
    if (days <= 120) return "text-orange-600";
    if (days <= 180) return "text-yellow-600";
    return "text-green-600";
  };

  // Get RUL status badge variant
  const getRULStatusBadge = (days: number) => {
    if (days <= 60) return { variant: "destructive" as const, label: "Critical" };
    if (days <= 120) return { variant: "secondary" as const, label: "High Risk" };
    if (days <= 180) return { variant: "outline" as const, label: "Medium Risk" };
    return { variant: "secondary" as const, label: "Low Risk" };
  };

  // Get degradation trend icon and color
  const getDegradationTrend = (trend: string) => {
    switch (trend) {
      case "decreasing":
        return { icon: TrendingDown, color: "text-red-600", label: "Decreasing" };
      case "increasing":
        return { icon: TrendingUp, color: "text-green-600", label: "Increasing" };
      default:
        return { icon: Activity, color: "text-blue-600", label: "Stable" };
    }
  };

  // Get degradation marker severity color
  const getDegradationSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50";
      case "High":
        return "text-orange-600 bg-orange-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.asset_type || asset.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const rulData = getRULData(asset.id);
      const riskLevelBadge = rulData ? getRULStatusBadge(rulData.rulDays).label.toLowerCase() : "low risk";
      const riskLevel = riskLevelBadge.includes("critical") ? "critical" :
        riskLevelBadge.includes("high") ? "high" :
          riskLevelBadge.includes("medium") ? "medium" : "low";

      const matchesRisk = riskFilter === "all" || riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [assets, searchQuery, riskFilter, predictions, mockRULData]);


  return (
    <div className="flex h-full w-full">
      <ListPane
        title="Assets"
        subtitle="Remaining Useful Life estimation"
        count={filteredAssets.length}
        searchPlaceholder="Search assets..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={riskFilter}
        onStatusChange={setRiskFilter}
        customStatusOptions={[
          { value: "all", label: "All Risks" },
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
        customStatusColorMap={{
          critical: "bg-red-500",
          high: "bg-orange-500",
          medium: "bg-yellow-500",
          low: "bg-green-500",
        }}
      >
        {assetsLoading || predictionsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs font-medium uppercase tracking-widest">Calculating RUL...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No assets match filters
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const rulData = getRULData(asset.id);
            const statusBadge = rulData ? getRULStatusBadge(rulData.rulDays) : null;

            return (
              <div
                key={asset.id}
                className={cn(
                  "p-3 rounded-xl border border-transparent cursor-pointer transition-all duration-200 group relative overflow-hidden",
                  currentAsset?.id === asset.id
                    ? "bg-primary/5 border-primary/20 shadow-sm"
                    : "hover:bg-secondary/60 hover:border-border/60"
                )}
                onClick={() => handleAssetSelection(asset)}
              >
                {currentAsset?.id === asset.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-xs truncate group-hover:text-primary transition-colors">{asset.name}</h4>
                      <StatusBadge status={asset.status || "operational"} size="sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mb-2">
                      {asset.asset_type || asset.type} • {asset.location}
                    </p>
                    {rulData && (
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40 gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Badge variant={statusBadge?.variant} className="text-[8px] px-1 h-3.5 leading-none shrink-0">
                            {statusBadge?.label}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground truncate">RUL</span>
                        </div>
                        <span className={cn("text-[10px] font-bold shrink-0", getRULStatusColor(rulData.rulDays))}>
                          {rulData.rulDays}d
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </ListPane>
      {currentAsset ? (
        <WorkPane
          title={`${currentAsset.name} RUL Analysis`}
          subtitle={`${(currentAsset as any).asset_type || (currentAsset as any).type} • ${(currentAsset as any).location}`}
          actions={
            <button
              onClick={() => {
                setSelectedAssetLocal(null);
                setSelectedAsset(null);
              }}
              className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all bg-secondary/30 hover:bg-secondary/60 rounded-md border border-border/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK TO OVERVIEW
            </button>
          }
          tabs={[
            {
              id: "rul-analysis",
              label: "RUL Analysis",
              content: (() => {
                const rulData = getRULData(currentAsset.id);
                if (!rulData) {
                  return (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No RUL data available for this asset
                    </div>
                  );
                }

                const statusBadge = getRULStatusBadge(rulData.rulDays);
                const trendInfo = getDegradationTrend(rulData.trendDirection);

                return (
                  <div className="space-y-6 -mr-4 pr-4">
                    {/* RUL Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                      <Card className="border-l-4 border-l-red-500 bg-red-50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600" />
                            <CardTitle className="text-sm">Days Remaining</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className={`text-2xl font-bold ${getRULStatusColor(rulData.rulDays)}`}>
                              {rulData.rulDays}
                            </div>
                            <div className="text-xs text-muted-foreground">days until failure</div>
                            <Badge variant={statusBadge.variant} className="text-xs">
                              {statusBadge.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <CardTitle className="text-sm">Confidence Level</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-blue-600">
                              {rulData.confidenceLevel}%
                            </div>
                            <Progress value={rulData.confidenceLevel} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              CI: {rulData.confidenceInterval.lower}% - {rulData.confidenceInterval.upper}%
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <trendInfo.icon className={`w-4 h-4 ${trendInfo.color}`} />
                            <CardTitle className="text-sm">Degradation Rate</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className={`text-2xl font-bold ${trendInfo.color}`}>
                              {rulData.degradationRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">per month</div>
                            <Badge variant="outline" className="text-xs">
                              {trendInfo.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <CardTitle className="text-sm">Months Remaining</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-purple-600">
                              {Number(rulData.rulMonths).toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">months remaining</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Critical Components RUL */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tighter">
                            <AlertTriangle className="w-5 h-5" />
                            Sub-Component Life Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {rulData.criticalComponents.map((component, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm">{component.name}</h4>
                                  <span className={`text-sm font-medium ${getRULStatusColor(component.rulDays)}`}>
                                    {component.rulDays} days
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Progress value={Math.round((365 - component.rulDays) / 365 * 100)} className="h-1.5" />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {Math.round((365 - component.rulDays) / 365 * 100)}% consumed
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tighter">
                            <BarChart3 className="w-5 h-5" />
                            Degradation Progression
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 bg-secondary/20 rounded flex items-center justify-center border-2 border-dashed border-border/60">
                            <div className="text-center">
                              <BarChart3 className="w-6 h-6 mx-auto mb-1 text-muted-foreground/50" />
                              <div className="text-[10px] text-muted-foreground uppercase font-bold">Chart visualization</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="p-2 bg-secondary/20 rounded text-center">
                              <div className="text-xs font-bold text-blue-600">{rulData.confidenceLevel}%</div>
                              <div className="text-[8px] text-muted-foreground uppercase font-bold">Reliability</div>
                            </div>
                            <div className="p-2 bg-secondary/20 rounded text-center">
                              <div className={cn("text-xs font-bold", trendInfo.color)}>{trendInfo.label}</div>
                              <div className="text-[8px] text-muted-foreground uppercase font-bold">Trend</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Signals Driving RUL */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tighter">
                          <Activity className="w-5 h-5" />
                          Life-limiting factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {rulData.riskFactors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border/30">
                              <div className="flex-1">
                                <h4 className="font-bold text-xs">{factor.factor}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={factor.impact === "Critical" ? "destructive" : factor.impact === "High" ? "secondary" : "outline"}
                                    className="text-[9px] px-1 h-3.5"
                                  >
                                    {factor.impact}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    Trend: {factor.trend}
                                  </span>
                                </div>
                              </div>
                              <div className={`text-lg font-black ${factor.trend === "Increasing" ? "text-red-500" : "text-blue-500"}`}>
                                {factor.trend === "Increasing" ? "↑" : "→"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })(),
            },
          ]}
        />
      ) : (
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-end justify-between border-b border-slate-200 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Fleet Life Expectancy</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Remaining Useful Life (RUL) insights across all monitored assets</p>
              </div>
              <div className="flex items-center gap-2 group cursor-help">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">AI Analysis</p>
                  <p className="text-[11px] font-black text-blue-600">DEGRADATION PROFILER v1.8</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>

            <RULEstimationOverview
              assets={filteredAssets}
              loading={assetsLoading || predictionsLoading}
              onSelectAsset={handleAssetSelection}
              getRULData={getRULData}
              getRULStatusColor={getRULStatusColor}
              getRULStatusBadge={getRULStatusBadge}
              getDegradationTrend={getDegradationTrend}
            />
          </div>
        </div>
      )}
    </div>
  );
}