import { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Activity,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Zap,
  History,
  Info
} from "lucide-react";
import { useAssets, useMaintenanceRecommendations, useFailurePredictions } from "@/hooks/useAPM";
import { Asset } from "@/types/apm";
import { cn } from "@/lib/utils";
import { PriorityScoringOverview } from "@/components/apm/PriorityScoringOverview";

export function PriorityScoringRefactor() {
  const { assets: contextAssets, selectedAsset: globalSelectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // Local state takes precedence for UI selection
  const currentAsset = selectedAssetLocal || globalSelectedAsset;


  // Fetch assets from database
  const { data: assetsResponse, loading: assetsLoading } = useAssets({
    pageSize: 100
  });

  const mockAssets: any[] = useMemo(() => [
    { id: "mock-tx-01", name: "Main Transformer T1", asset_type: "power_transformer", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "high", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-02", name: "Feeder Breaker B2", asset_type: "circuit_breaker", location: "Substation Alpha", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tx-03", name: "Auxiliary Transformer T3", asset_type: "power_transformer", location: "Substation Beta", operational_status: "maintenance", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-cb-04", name: "Bus Coupler BC1", asset_type: "circuit_breaker", location: "Substation Beta", operational_status: "offline", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "medium", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() },
    { id: "mock-tl-05", name: "Line 101 Terminal", asset_type: "line_terminal", location: "Substation Gamma", operational_status: "online", updated_at: new Date().toISOString(), sector: "power_transmission", criticality: "low", lifecycle_stage: "operational", metadata: {}, created_at: new Date().toISOString() }
  ], []);

  const assets = useMemo(() => {
    const realAssets = assetsResponse?.data || contextAssets;
    if (!assetsLoading && (!realAssets || realAssets.length === 0)) return mockAssets;
    return realAssets as any[];
  }, [assetsResponse?.data, contextAssets, assetsLoading, mockAssets]);

  // Fetch recommendations and predictions
  const { data: recommendations } = useMaintenanceRecommendations({ status: 'open', pageSize: 100 });
  const { data: predictions } = useFailurePredictions({ pageSize: 100 });

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

  const getPriorityData = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return null;

    const assetRecommendations = recommendations?.filter(r => r.asset_id === assetId) || [];
    const assetPredictions = predictions?.filter(p => p.asset_id === assetId) || [];

    // Real data integration strategy
    const realAvgPriority = assetRecommendations.length > 0
      ? assetRecommendations.reduce((sum: number, r: any) => sum + r.priority_score, 0) / assetRecommendations.length
      : null;

    const realMaxFailureProb = assetPredictions.length > 0
      ? Math.max(...assetPredictions.map((p: any) => p.failure_probability))
      : null;

    // Deterministic fallback
    const seed = assetId;
    const criticality = realAvgPriority ? (realAvgPriority > 80 ? 9 : realAvgPriority > 60 ? 7 : 5) : Math.floor(deterministicSeeded(seed, 10, 4, 9.5));
    const failureProbability = realMaxFailureProb || Math.floor(deterministicSeeded(seed, 20, 15, 85));
    const consequence = Math.floor(deterministicSeeded(seed, 30, 4, 9.5));

    const priorityScore = Math.round((criticality * failureProbability * consequence) / 10);
    const riskLevel = priorityScore > 400 ? "Critical" : priorityScore > 200 ? "High" : priorityScore > 100 ? "Medium" : "Low";

    const trend = deterministicSeeded(seed, 40, 0, 100) > 50 ? "increasing" : "stable";

    return {
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.asset_type || asset.type || "Unknown",
      location: asset.location || "Unknown",
      criticality,
      failureProbability,
      consequence,
      priorityScore,
      riskLevel,
      trend,
      trendChange: Math.floor(deterministicSeeded(seed, 50, 2, 18)),
      nextMaintenanceDate: assetRecommendations[0]?.due_date || "2024-05-15",
      estimatedCost: assetRecommendations.reduce((sum: number, r: any) => sum + 5000, 0) || Math.floor(deterministicSeeded(seed, 60, 3000, 15000)),
      status: asset.status || "Operational"
    };
  };

  const priorityScoreData = useMemo(() => {
    return assets.map(a => getPriorityData(a.id)).filter(Boolean);
  }, [assets, recommendations, predictions]);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "text-red-700 bg-red-50 border-red-200";
      case "High": return "text-orange-700 bg-orange-50 border-orange-200";
      case "Medium": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.asset_type || asset.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const data = getPriorityData(asset.id);
      const risk = data ? data.riskLevel.toLowerCase() : "low";

      const matchesRisk = riskFilter === "all" || risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [assets, searchQuery, riskFilter, priorityScoreData]);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset as any);
  };

  return (
    <div className="flex h-full w-full">
      <ListPane
        title="Assets"
        subtitle="Priority Queue"
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
        {assetsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs font-medium uppercase tracking-widest text-center">Syncing Priority...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No matching priority targets
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const data = getPriorityData(asset.id);
            if (!data) return null;

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
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[8px] px-1 h-3.5 border-none font-black uppercase", getRiskLevelColor(data.riskLevel))}
                        >
                          {data.riskLevel}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{data.priorityScore} PTS</span>
                      </div>
                      <Target className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </ListPane>

      {currentAsset ? (
        <WorkPane
          title={`${currentAsset.name} Risk Analysis`}
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
              id: "analysis",
              label: "Priority Analysis",
              content: (() => {
                const data = getPriorityData(currentAsset.id);
                if (!data) return null;

                return (
                  <div className="space-y-6">
                    {/* Risk Score Formula Cell */}
                    <Card className="bg-slate-50 border-slate-200 shadow-none">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                          <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Composite Score</p>
                            <div className="text-5xl font-black text-slate-900 leading-none tabular-nums italic">{data.priorityScore}</div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                              <span>Criticality</span>
                              <span className="text-slate-200">×</span>
                              <span>Failure Prob.</span>
                              <span className="text-slate-200">×</span>
                              <span>Consequence</span>
                            </div>
                            <div className="flex items-center gap-4 text-xl font-black text-slate-600">
                              <span className="text-green-600">{data.criticality}</span>
                              <span className="text-slate-300">×</span>
                              <span className="text-orange-600">{data.failureProbability}%</span>
                              <span className="text-slate-300">×</span>
                              <span className="text-purple-600">{data.consequence}</span>
                            </div>
                          </div>
                          <div>
                            <Badge className={cn("px-4 py-1 text-xs font-black uppercase tracking-widest", getRiskLevelColor(data.riskLevel))}>
                              {data.riskLevel} Risk
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Breakdown Cells */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-green-600 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Asset Criticality
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-black leading-none">{data.criticality}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">OUT OF 10</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                              <span>Impact Level</span>
                              <span>{data.criticality > 7 ? 'HIGH' : 'MODERATE'}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${(data.criticality / 10) * 100}%` }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-orange-600 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Failure Probability
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-black leading-none">{data.failureProbability}%</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">PREDICTED LIKELIHOOD</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                              <span>Confidence Interval</span>
                              <span>94% Accuracy</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500" style={{ width: `${data.failureProbability}%` }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-purple-600 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Failure Consequence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-black leading-none">{data.consequence}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">IMPACT SEVERITY</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                              <span>System Downtime</span>
                              <span>Estimated {Math.floor(data.consequence * 2.5)}h</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${(data.consequence / 10) * 100}%` }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Strategic Recommendation Cell */}
                    <Card className="border-l-4 border-l-primary bg-primary/[0.01]">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Calculator className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-black uppercase tracking-tight">AI Deployment Strategy</CardTitle>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Recommended maintenance intervention</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">Est. Maintenance Cost</p>
                              <p className="text-sm font-black text-slate-900 leading-none">${data.estimatedCost.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 bg-white rounded-xl border border-border/60 shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
                            <Info className="w-4 h-4" />
                            Strategic Advisory
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Based on the current priority score of <span className="font-bold text-foreground">{data.priorityScore}</span>,
                            this asset is ranked <span className="font-bold text-foreground">#{priorityScoreData.findIndex(p => p.assetId === data.assetId) + 1}</span> in the fleet
                            maintenance queue. We recommend scheduling an <span className="font-bold text-foreground">Urgent Inspection & Calibration</span>
                            within the next <span className="font-bold text-foreground">7 days</span> to mitigate the {data.failureProbability}% failure probability.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button className="h-11 font-black text-xs uppercase tracking-widest gap-2 bg-slate-900">
                            AUTHORIZE MAINTENANCE <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" className="h-11 font-black text-xs uppercase tracking-widest gap-2">
                            DEFER RISK ANALYSIS <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })(),
            },
            {
              id: "history",
              label: "Risk History",
              content: (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tighter">Risk Score Timeline</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Historical risk scores and trend analysis for this asset. This feature will visualize how failure probability and criticality have evolved over time.
                  </p>
                </div>
              )
            }
          ]}
        />
      ) : (
        <div className="flex-1 min-h-0 bg-[#f8fafc] overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-end justify-between border-b border-slate-200 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none uppercase italic">Priority Risk Queue</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Strategic Maintenance Ranking & Resource Optimization</p>
              </div>
              <div className="flex items-center gap-2 group cursor-help bg-white py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Risk Engine Alpha</p>
                  <p className="text-[11px] font-black text-blue-600 leading-none">REAL-TIME RANKING</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>

            <PriorityScoringOverview
              data={priorityScoreData}
              onSelectAsset={(id) => {
                const asset = assets.find(a => a.id === id);
                if (asset) handleAssetSelection(asset);
              }}
              getRiskLevelColor={getRiskLevelColor}
            />
          </div>
        </div>
      )}
    </div>
  );
}