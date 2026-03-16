import { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { Brain, AlertTriangle, TrendingUp, Clock, Target, Filter, ArrowLeft, Activity, ShieldAlert } from "lucide-react";
import { useAssets, useFailurePredictions } from "@/hooks/useAPM";
import { FailurePredictionOverview } from "@/components/apm/FailurePredictionOverview";
import type { RiskLevel, PredictionHorizon } from "@/types/apm";

// Mock ML failure prediction data for upstream assets with multi-horizon forecasting (fallback)
const mockFailurePredictionData = {
  "WH-01": {
    failureProbability: {
      "7d": 5,
      "30d": 15,
      "90d": 28
    },
    riskLevel: "Low",
    rulDays: 245,
    confidenceLevel: 87,
    lastModelUpdate: "2024-01-15T10:30:00Z",
    primaryFailureMode: "Wellhead valve degradation",
    nextMaintenanceWindow: "Q2 2024",
    criticalComponents: ["Surface safety valve", "Choke valve", "Pressure sensors"],
    fmeaFailureModes: [
      { mode: "Valve seat erosion", probability: 35, severity: "Medium", rpn: 120 },
      { mode: "Actuator failure", probability: 25, severity: "High", rpn: 180 },
      { mode: "Seal degradation", probability: 20, severity: "Low", rpn: 80 }
    ]
  },
  "ESP-07": {
    failureProbability: {
      "7d": 12,
      "30d": 28,
      "90d": 45
    },
    riskLevel: "Medium",
    rulDays: 180,
    confidenceLevel: 92,
    lastModelUpdate: "2024-01-15T10:30:00Z",
    primaryFailureMode: "Motor bearing wear",
    nextMaintenanceWindow: "Q1 2024",
    criticalComponents: ["Motor bearings", "Pump impeller", "Downhole cable"],
    fmeaFailureModes: [
      { mode: "Bearing fatigue", probability: 40, severity: "High", rpn: 240 },
      { mode: "Impeller cavitation", probability: 30, severity: "Medium", rpn: 150 },
      { mode: "Cable insulation failure", probability: 15, severity: "Critical", rpn: 300 }
    ]
  },
  "GC-11": {
    failureProbability: {
      "7d": 35,
      "30d": 65,
      "90d": 85
    },
    riskLevel: "High",
    rulDays: 90,
    confidenceLevel: 89,
    lastModelUpdate: "2024-01-15T10:30:00Z",
    primaryFailureMode: "Compressor blade fatigue",
    nextMaintenanceWindow: "Immediate",
    criticalComponents: ["Compressor blades", "Thrust bearings", "Seal system"],
    fmeaFailureModes: [
      { mode: "Blade fouling", probability: 50, severity: "High", rpn: 300 },
      { mode: "Thrust bearing failure", probability: 35, severity: "Critical", rpn: 420 },
      { mode: "Seal system leak", probability: 25, severity: "Medium", rpn: 125 }
    ]
  },
  "P-21": {
    failureProbability: {
      "7d": 8,
      "30d": 22,
      "90d": 38
    },
    riskLevel: "Low",
    rulDays: 210,
    confidenceLevel: 85,
    lastModelUpdate: "2024-01-15T10:30:00Z",
    primaryFailureMode: "Impeller erosion",
    nextMaintenanceWindow: "Q2 2024",
    criticalComponents: ["Pump impeller", "Mechanical seal", "Motor coupling"],
    fmeaFailureModes: [
      { mode: "Impeller wear", probability: 45, severity: "Medium", rpn: 180 },
      { mode: "Seal leakage", probability: 30, severity: "Low", rpn: 90 },
      { mode: "Coupling misalignment", probability: 20, severity: "Medium", rpn: 120 }
    ]
  },
  "KO-03": {
    failureProbability: {
      "7d": 45,
      "30d": 78,
      "90d": 95
    },
    riskLevel: "Critical",
    rulDays: 45,
    confidenceLevel: 94,
    lastModelUpdate: "2024-01-15T10:30:00Z",
    primaryFailureMode: "Vessel corrosion",
    nextMaintenanceWindow: "Immediate",
    criticalComponents: ["Vessel shell", "Internal baffles", "Drain system"],
    fmeaFailureModes: [
      { mode: "Corrosion under insulation", probability: 60, severity: "Critical", rpn: 480 },
      { mode: "Baffle structural failure", probability: 40, severity: "High", rpn: 280 },
      { mode: "Drain blockage", probability: 25, severity: "Medium", rpn: 150 }
    ]
  }
};

export function FailurePrediction() {
  const { assets: contextAssets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [timeHorizonFilter, setTimeHorizonFilter] = useState<PredictionHorizon | "all">("all");

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
  const allAssets = useMemo(() => {
    const realAssets = assetsResponse?.data || contextAssets;
    if (!assetsLoading && (!realAssets || realAssets.length === 0)) return mockAssets;
    return (realAssets || []) as any[];
  }, [assetsResponse?.data, contextAssets, assetsLoading, mockAssets]);

  // Fetch failure predictions with filters
  const { data: predictions, loading: predictionsLoading, refetch } = useFailurePredictions({
    risk_level: riskLevelFilter !== "all" ? riskLevelFilter as RiskLevel : undefined,
    time_horizon: timeHorizonFilter !== "all" ? timeHorizonFilter : undefined,
    pageSize: 100
  });

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

  // Filter assets based on search and predictions
  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = asset.name.toLowerCase().includes(q);
        const matchType = (asset.asset_type || asset.type || "").toLowerCase().includes(q);
        const matchLoc = (asset.location || "").toLowerCase().includes(q);
        if (!matchName && !matchType && !matchLoc) return false;
      }

      // Risk filter (derived from predictions)
      if (riskLevelFilter !== "all") {
        const predictionData = getAllPredictionsForAsset(asset.id);
        if (!predictionData || predictionData.riskLevel.toLowerCase() !== riskLevelFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [allAssets, searchQuery, riskLevelFilter, predictions]);

  const currentAsset = selectedAssetLocal || selectedAsset;

  const handleAssetSelection = (asset: any) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  // Get failure prediction data for an asset
  const getFailurePredictionData = (assetId: string) => {
    // First try to find real prediction data
    const realPrediction = predictions?.find(p => p.asset_id === assetId);
    if (realPrediction) {
      // Transform database prediction to match UI expectations
      return {
        failureProbability: {
          "7d": realPrediction.time_horizon_days === 7 ? realPrediction.failure_probability : 0,
          "30d": realPrediction.time_horizon_days === 30 ? realPrediction.failure_probability : 0,
          "90d": realPrediction.time_horizon_days === 90 ? realPrediction.failure_probability : 0
        },
        riskLevel: realPrediction.risk_level.charAt(0).toUpperCase() + realPrediction.risk_level.slice(1),
        rulDays: realPrediction.rul_days || 0,
        confidenceLevel: realPrediction.confidence,
        lastModelUpdate: realPrediction.created_at,
        primaryFailureMode: "Asset degradation detected",
        nextMaintenanceWindow: realPrediction.rul_days && realPrediction.rul_days < 90 ? "Immediate" : "Q2 2024",
        criticalComponents: realPrediction.contributing_factors || [],
        fmeaFailureModes: []
      };
    }
    // Fall back to mock data if no real prediction exists
    return mockFailurePredictionData[assetId] || null;
  };

  // Get all predictions for an asset (all horizons)
  const getAllPredictionsForAsset = (assetId: string) => {
    const assetPredictions = predictions?.filter(p => p.asset_id === assetId) || [];

    if (assetPredictions.length === 0) {
      // Fallback to older mock array if exists
      if (mockFailurePredictionData[assetId]) return mockFailurePredictionData[assetId];

      // NEW: Generate deterministic prediction for ANY asset ID
      const seed = assetId;
      const prob30 = Math.floor(deterministicSeeded(seed, 30, 5, 85));
      const prob7 = Math.floor(prob30 * 0.4);
      const prob90 = Math.min(95, Math.floor(prob30 * 1.8));

      let riskLevel: string = "Low";
      if (prob30 > 75) riskLevel = "Critical";
      else if (prob30 > 50) riskLevel = "High";
      else if (prob30 > 25) riskLevel = "Medium";

      return {
        failureProbability: { "7d": prob7, "30d": prob30, "90d": prob90 },
        riskLevel,
        rulDays: Math.floor(deterministicSeeded(seed, 55, 10, 300)),
        confidenceLevel: Math.floor(deterministicSeeded(seed, 88, 85, 96)),
        lastModelUpdate: new Date().toISOString(),
        primaryFailureMode: "Insulation degradation detected",
        nextMaintenanceWindow: prob30 > 60 ? "Immediate" : "Q2 2024",
        criticalComponents: ["Winding", "Bushing", "Core"],
        fmeaFailureModes: []
      };
    }

    // Combine predictions from different horizons (as before)
    const result = {
      failureProbability: { "7d": 0, "30d": 0, "90d": 0 },
      riskLevel: "Low",
      rulDays: 0,
      confidenceLevel: 85,
      lastModelUpdate: new Date().toISOString(),
      primaryFailureMode: "Asset degradation detected",
      nextMaintenanceWindow: "Q2 2024",
      criticalComponents: [] as string[],
      fmeaFailureModes: []
    };

    assetPredictions.forEach(pred => {
      if (pred.time_horizon_days === 7) {
        result.failureProbability["7d"] = pred.failure_probability;
      } else if (pred.time_horizon_days === 30) {
        result.failureProbability["30d"] = pred.failure_probability;
      } else if (pred.time_horizon_days === 90) {
        result.failureProbability["90d"] = pred.failure_probability;
      }

      // Use the highest risk level
      if (pred.risk_level === "critical") result.riskLevel = "Critical";
      else if (pred.risk_level === "high" && result.riskLevel !== "Critical") result.riskLevel = "High";
      else if (pred.risk_level === "medium" && !["Critical", "High"].includes(result.riskLevel)) result.riskLevel = "Medium";

      // Use the shortest RUL
      if (pred.rul_days && (result.rulDays === 0 || pred.rul_days < result.rulDays)) {
        result.rulDays = pred.rul_days;
      }

      // Use the highest confidence
      if (pred.confidence > result.confidenceLevel) {
        result.confidenceLevel = pred.confidence;
      }

      // Use the most recent update
      if (!result.lastModelUpdate || pred.created_at > result.lastModelUpdate) {
        result.lastModelUpdate = pred.created_at;
      }

      // Combine contributing factors
      if (pred.contributing_factors) {
        result.criticalComponents = [...new Set([...result.criticalComponents, ...pred.contributing_factors])];
      }
    });

    result.nextMaintenanceWindow = result.rulDays && result.rulDays < 90 ? "Immediate" : "Q2 2024";

    return result;
  };

  // Get risk level color and variant
  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical":
        return { variant: "destructive" as const, color: "text-red-600", bgColor: "bg-red-50" };
      case "High":
        return { variant: "destructive" as const, color: "text-orange-600", bgColor: "bg-orange-50" };
      case "Medium":
        return { variant: "outline" as const, color: "text-yellow-600", bgColor: "bg-yellow-50" };
      case "Low":
        return { variant: "secondary" as const, color: "text-green-600", bgColor: "bg-green-50" };
      default:
        return { variant: "secondary" as const, color: "text-gray-600", bgColor: "bg-gray-50" };
    }
  };

  // Get failure probability color
  const getFailureProbabilityColor = (probability: number) => {
    if (probability >= 70) return "text-red-600";
    if (probability >= 50) return "text-orange-600";
    if (probability >= 30) return "text-yellow-600";
    return "text-green-600";
  };

  // Get RUL status color
  const getRULStatusColor = (days: number) => {
    if (days <= 60) return "text-red-600";
    if (days <= 120) return "text-orange-600";
    if (days <= 180) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="flex h-full w-full bg-background/50">
      <ListPane
        title="Assets"
        subtitle="Failure prediction analysis"
        count={filteredAssets.length}
        searchPlaceholder="Search assets..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={riskLevelFilter}
        onStatusChange={setRiskLevelFilter}
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
        actions={
          <div className="flex items-center gap-2 mt-1">
            <Select value={String(timeHorizonFilter)} onValueChange={(value) => setTimeHorizonFilter(value === "all" ? "all" : Number(value) as PredictionHorizon)}>
              <SelectTrigger className="h-7 text-[10px] bg-secondary/40 border-border/40 w-full font-bold uppercase tracking-wider">
                <SelectValue placeholder="Horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">ALL HORIZONS</SelectItem>
                <SelectItem value="7" className="text-[10px]">7 DAYS</SelectItem>
                <SelectItem value="30" className="text-[10px]">30 DAYS</SelectItem>
                <SelectItem value="90" className="text-[10px]">90 DAYS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {assetsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No assets match filters
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const predictionData = getAllPredictionsForAsset(asset.id);
            const riskStyle = predictionData ? getRiskLevelStyle(predictionData.riskLevel) : null;

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
                    {predictionData && (
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40 gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Badge variant={riskStyle?.variant} className="text-[8px] px-1 h-3.5 leading-none shrink-0">
                            {predictionData.riskLevel}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground truncate">30d Risk</span>
                        </div>
                        <span className={cn("text-[10px] font-bold shrink-0", getFailureProbabilityColor(predictionData.failureProbability["30d"]))}>
                          {predictionData.failureProbability["30d"]}%
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
          title={`${currentAsset.name} Failure Prediction`}
          subtitle={`${currentAsset.asset_type || currentAsset.type} • ${currentAsset.location}`}
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
              id: "prediction",
              label: "Prediction Analysis",
              content: (() => {
                const predictionData = getAllPredictionsForAsset(currentAsset.id);
                if (!predictionData) {
                  return (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border/60">
                      <Activity className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-sm">No prediction data available for this asset</p>
                    </div>
                  );
                }

                const riskStyle = getRiskLevelStyle(predictionData.riskLevel);

                return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Risk Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className={cn("border-none shadow-sm", riskStyle.bgColor)}>
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className={cn("w-5 h-5", riskStyle.color)} />
                            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-70">Risk Level</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className={cn("text-3xl font-bold tracking-tight", riskStyle.color)}>
                              {predictionData.riskLevel}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={riskStyle.variant} className="text-[10px] h-4">
                                {predictionData.failureProbability["30d"]}% Probability
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">30-day horizon</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Brain className="w-5 h-5" />
                            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-70">ML Confidence</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold tracking-tight text-blue-600">
                              {predictionData.confidenceLevel}%
                            </div>
                            <Progress value={predictionData.confidenceLevel} className="h-1.5 bg-blue-100" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-2 text-purple-600">
                            <Clock className="w-5 h-5" />
                            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-70">Estimated RUL</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className={cn("text-3xl font-bold tracking-tight", getRULStatusColor(predictionData.rulDays))}>
                              {predictionData.rulDays}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Days remaining</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-2 text-indigo-600">
                            <Target className="w-5 h-5" />
                            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-70">Maint. Window</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-xl font-bold text-indigo-600 truncate">
                              {predictionData.nextMaintenanceWindow}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Scheduled window</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Analysis Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Failure Mode Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Primary Failure Mode</h4>
                            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-sm font-medium">
                              {predictionData.primaryFailureMode}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Critical Components at Risk</h4>
                            <div className="flex flex-wrap gap-2">
                              {predictionData.criticalComponents.map((component, index) => (
                                <Badge key={index} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md font-medium">
                                  {component}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Multi-Horizon Forecasting</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {[
                                { horizon: "7 days", val: predictionData.failureProbability["7d"] },
                                { horizon: "30 days", val: predictionData.failureProbability["30d"] },
                                { horizon: "90 days", val: predictionData.failureProbability["90d"] }
                              ].map((h, i) => (
                                <div key={i} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px] font-medium">
                                    <span className="text-muted-foreground">{h.horizon} Prediction</span>
                                    <span className={cn("font-bold", getFailureProbabilityColor(h.val))}>
                                      {h.val}% probability
                                    </span>
                                  </div>
                                  <Progress value={h.val} className="h-1.5" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-6">
                        <Card className="border-border/60 shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              FMEA Knowledge Base Matches
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {predictionData.fmeaFailureModes.length > 0 ? (
                                predictionData.fmeaFailureModes.map((mode, index) => (
                                  <div key={index} className="group p-3 bg-secondary/30 hover:bg-secondary/50 border border-border/40 rounded-xl transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold text-xs">{mode.mode}</h4>
                                      <Badge variant={mode.severity === "Critical" ? "destructive" : "outline"} className="text-[9px] h-4">
                                        {mode.severity}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {mode.probability}% Prob</span>
                                      <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> {mode.rpn} RPN</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border/40">
                                  No FMEA library matches for current profile
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm bg-primary/[0.02]">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model Governance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[11px]">
                              <div>
                                <span className="text-muted-foreground block mb-0.5">Last Full training</span>
                                <div className="font-bold">{new Date(predictionData.lastModelUpdate).toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block mb-0.5">Asset Type Profile</span>
                                <div className="font-bold">{currentAsset.asset_type || currentAsset.type}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block mb-0.5">Model Family</span>
                                <div className="font-bold text-blue-600 italic">XGBoost Ensemble v4.2</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block mb-0.5">Computing Env</span>
                                <div className="font-bold">Edge-Inference Node 04</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
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
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Fleet Failure Prediction</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Predictive maintenance insights across all monitored assets</p>
              </div>
              <div className="flex items-center gap-2 group cursor-help">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Model Status</p>
                  <p className="text-[11px] font-black text-green-600">LIVE / OPERATIONAL</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>

            <FailurePredictionOverview
              assets={allAssets}
              loading={assetsLoading || predictionsLoading}
              onSelectAsset={handleAssetSelection}
              getAllPredictionsForAsset={getAllPredictionsForAsset}
              getRiskLevelStyle={getRiskLevelStyle}
              getFailureProbabilityColor={getFailureProbabilityColor}
              getRULStatusColor={getRULStatusColor}
            />
          </div>
        </div>
      )}
    </div>
  );
}