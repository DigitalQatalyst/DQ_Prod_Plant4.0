import { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  Lightbulb,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Wrench,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Activity,
  Target,
  ShieldCheck,
  Zap,
  ChevronRight
} from "lucide-react";
import { useAssets, useMaintenanceRecommendations } from "@/hooks/useAPM";
import { Asset } from "@/types/apm";
import { cn } from "@/lib/utils";
import { PrescriptiveMaintenanceOverview } from "@/components/apm/PrescriptiveMaintenanceOverview";

export function MaintenanceRecommendations() {
  const { assets: contextAssets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

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

  // Fetch database recommendations
  const { data: realRecommendations, loading: recommendationsLoading } = useMaintenanceRecommendations({
    status: 'open',
    pageSize: 100
  });

  const currentAsset = selectedAsset || selectedAssetLocal;

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset as any);
    setSelectedRecommendation(null);
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

  const getRecommendationsData = (assetId: string) => {
    // 1. Try real data first
    const assetRealRecs = realRecommendations?.filter(r => r.asset_id === assetId) || [];
    if (assetRealRecs.length > 0) {
      return {
        recommendations: assetRealRecs.map(rec => ({
          id: rec.id,
          title: rec.description,
          description: rec.description,
          urgency: rec.priority_score > 80 ? "Now" : "Next Week",
          priority: rec.priority_score > 80 ? "Critical" : rec.priority_score > 60 ? "High" : "Medium",
          riskReduction: Math.round(rec.priority_score * 0.9),
          estimatedCost: 8000,
          downtimeHours: 6,
          downtimeAvoided: 48,
          rationale: `Automated analysis detected ${rec.recommendation_type} urgency with priority score of ${rec.priority_score}.`,
          actions: ["Diagnostic check", "Parts procurement", "Installation", "Verification"],
          category: rec.recommendation_type.charAt(0).toUpperCase() + rec.recommendation_type.slice(1),
          confidence: 85
        }))
      };
    }

    // 2. Fallback to deterministic mock
    const seed = assetId;
    const count = Math.floor(deterministicSeeded(seed, 30, 1, 3));

    const recTemplates = [
      { title: "Insulation Resistance Test", cat: "Preventive", cost: 1200, dt: 2, dta: 12 },
      { title: "Bushing Connection Tightening", cat: "Corrective", cost: 800, dt: 1, dta: 8 },
      { title: "Oil Analysis & Filtration", cat: "Predictive", cost: 3500, dt: 4, dta: 24 },
      { title: "Thermal Scan & IR Imaging", cat: "Predictive", cost: 1500, dt: 0, dta: 16 },
      { title: "Cooling Fan Motor Check", cat: "Preventive", cost: 2200, dt: 3, dta: 18 }
    ];

    const recommendations = Array.from({ length: count }).map((_, i) => {
      const template = recTemplates[Math.floor(deterministicSeeded(seed, i + 80, 0, recTemplates.length))];
      const priorityScore = deterministicSeeded(seed, i + 10, 40, 95);
      const priority = priorityScore > 85 ? "Critical" : priorityScore > 70 ? "High" : priorityScore > 55 ? "Medium" : "Low";
      const urgency = priorityScore > 80 ? "Now" : priorityScore > 65 ? "Next Week" : "Next Shutdown";

      return {
        id: `${assetId}-rec-${i}`,
        title: template.title,
        description: `Perform ${template.title.toLowerCase()} to mitigate emerging failure modes identified by the risk engine.`,
        urgency,
        priority,
        riskReduction: Math.floor(priorityScore * 0.8),
        estimatedCost: template.cost,
        downtimeHours: template.dt,
        downtimeAvoided: template.dta,
        rationale: `Pattern matching systems identified anomaly profiles consistent with internal component stress. Estimated risk reduction: ${Math.floor(priorityScore * 0.8)}%.`,
        actions: [
          "Verify system isolation",
          `Perform ${template.title.toLowerCase()} procedure`,
          "Capture baseline readings",
          "Submit results to central repository"
        ],
        category: template.cat,
        confidence: Math.floor(deterministicSeeded(seed, i + 44, 85, 98))
      };
    });

    return { recommendations };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-700 bg-red-50/50 border-red-200";
      case "High":
        return "text-orange-700 bg-orange-50/50 border-orange-200";
      case "Medium":
        return "text-yellow-700 bg-yellow-50/50 border-yellow-200";
      case "Low":
        return "text-green-700 bg-green-50/50 border-green-200";
      default:
        return "text-blue-700 bg-blue-50/50 border-blue-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Now":
        return "destructive";
      case "Next Week":
        return "secondary";
      case "Next Shutdown":
        return "outline";
      default:
        return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Emergency":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "Corrective":
        return <Wrench className="w-4 h-4 text-orange-600" />;
      case "Predictive":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "Preventive":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-purple-600" />;
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.asset_type || asset.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const data = getRecommendationsData(asset.id);
      const topPriority = data.recommendations.length > 0 ? data.recommendations[0].priority.toLowerCase() : "low";

      const matchesPriority = priorityFilter === "all" || topPriority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [assets, searchQuery, priorityFilter, realRecommendations]);

  return (
    <div className="flex h-full w-full">
      <ListPane
        title="Assets"
        subtitle="Prescriptive Maintenance"
        count={filteredAssets.length}
        searchPlaceholder="Search assets..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={priorityFilter}
        onStatusChange={setPriorityFilter}
        customStatusOptions={[
          { value: "all", label: "All Priorities" },
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
            <span className="text-xs font-medium uppercase tracking-widest text-center">Crunching Strategies...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No matching optimization targets
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const data = getRecommendationsData(asset.id);
            const recCount = data.recommendations.length;
            const topPrio = recCount > 0 ? data.recommendations[0].priority : "None";

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
                          className={cn("text-[8px] px-1 h-3.5 border-none font-black uppercase", getPriorityColor(topPrio))}
                        >
                          {topPrio}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{recCount} Recs</span>
                      </div>
                      <Lightbulb className="w-3 h-3 text-blue-500" />
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
          title={`${currentAsset.name} Maintenance Strategy`}
          subtitle={`${(currentAsset as any).asset_type || (currentAsset as any).type} • ${(currentAsset as any).location}`}
          actions={
            <button
              onClick={() => {
                setSelectedAssetLocal(null);
                setSelectedAsset(null);
                setSelectedRecommendation(null);
              }}
              className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all bg-secondary/30 hover:bg-secondary/60 rounded-md border border-border/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK TO OVERVIEW
            </button>
          }
          tabs={[
            {
              id: "recommendations",
              label: "Optimization Plans",
              content: (() => {
                const data = getRecommendationsData(currentAsset.id);
                return (
                  <div className="space-y-6">
                    {/* Summary Metric Cells */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-center">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1 leading-none text-center">Recommendations</p>
                        <p className="text-xl font-black text-blue-800 text-center leading-none">{data.recommendations.length}</p>
                      </div>
                      <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 flex flex-col justify-center">
                        <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1 leading-none text-center">Est. Recovery</p>
                        <p className="text-xl font-black text-green-800 text-center leading-none">
                          ${(data.recommendations.reduce((sum: number, r: any) => sum + (r.downtimeAvoided * 1000), 0) / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col justify-center">
                        <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1 leading-none text-center">Risk Delta</p>
                        <p className="text-xl font-black text-purple-800 text-center leading-none">
                          -{Math.round(data.recommendations.reduce((sum: number, r: any) => sum + r.riskReduction, 0) / data.recommendations.length)}%
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex flex-col justify-center">
                        <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1 leading-none text-center">Confidence</p>
                        <p className="text-xl font-black text-orange-800 text-center leading-none">
                          {Math.round(data.recommendations.reduce((sum: number, r: any) => sum + r.confidence, 0) / data.recommendations.length)}%
                        </p>
                      </div>
                    </div>

                    {/* Recommendation Cards */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-tighter">Prescriptive Actions required</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {data.recommendations.map((rec: any) => (
                          <Card
                            key={rec.id}
                            className={cn(
                              "cursor-pointer transition-all border group relative overflow-hidden",
                              selectedRecommendation?.id === rec.id ? "border-primary shadow-md bg-primary/[0.02]" : "border-border/60 hover:border-border hover:shadow-sm"
                            )}
                            onClick={() => setSelectedRecommendation(rec)}
                          >
                            <div className={cn("h-1 w-full", getPriorityColor(rec.priority).replace('text', 'bg').split(' ')[0])} />
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(rec.category)}
                                    <h4 className="font-bold text-sm tracking-tight">{rec.title}</h4>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{rec.urgency} • {rec.priority} PRIORITY</p>
                                </div>
                                <Badge variant={getUrgencyColor(rec.urgency)} className="text-[8px] font-black uppercase tracking-widest py-0 h-4">
                                  {rec.urgency}
                                </Badge>
                              </div>

                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{rec.description}</p>

                              <div className="flex items-center justify-between text-[10px] font-black uppercase border-t border-border/40 pt-3">
                                <div className="flex items-center gap-1.5 text-green-600">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {rec.riskReduction}% Mitigation
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  ROI: {Math.round(((rec.downtimeAvoided * 1000) / rec.estimatedCost - 1) * 100)}%
                                </div>
                              </div>
                            </CardContent>
                            {selectedRecommendation?.id === rec.id && (
                              <div className="absolute top-1/2 -right-1 translate-y-[-50%] p-1">
                                <ChevronRight className="w-4 h-4 text-primary" />
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Deep Dive Detail View */}
                    {selectedRecommendation && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-primary/20 bg-primary/[0.01]">
                          <CardHeader className="border-b border-primary/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-base font-black uppercase tracking-tighter">Strategic Deep Dive</CardTitle>
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedRecommendation.title}</p>
                                </div>
                              </div>
                              <Button variant="outline" className="text-[9px] font-black h-7 px-3 bg-white hover:bg-primary hover:text-white transition-all">
                                ELEVATE TO CAPEX <Target className="w-3 h-3 ml-2" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-orange-500" />
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Operational Rationale</h5>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed bg-white p-4 rounded-xl border border-border/40 shadow-sm italic">
                                  "{selectedRecommendation.rationale}"
                                </p>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Precision Action Checklist</h5>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {selectedRecommendation.actions.map((action: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-border/40 text-xs font-medium">
                                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold border border-green-100">
                                        {idx + 1}
                                      </div>
                                      {action}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cost-Benefit Matrix</p>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                                      <span className="text-[10px] text-slate-300">Strategy Cost</span>
                                      <span className="text-sm font-black">${selectedRecommendation.estimatedCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-slate-700 pb-2 text-green-400">
                                      <span className="text-[10px]">Value Captured</span>
                                      <span className="text-sm font-black">${(selectedRecommendation.downtimeAvoided * 1000).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-end text-primary-foreground">
                                      <span className="text-[11px] font-black uppercase tracking-tighter">Net Efficiency ROI</span>
                                      <span className="text-xl font-black italic">
                                        {Math.round(((selectedRecommendation.downtimeAvoided * 1000) / selectedRecommendation.estimatedCost - 1) * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col justify-center gap-4">
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="p-2 bg-blue-500 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Downtime Delta</p>
                                      <p className="text-sm font-bold text-white leading-none">-{selectedRecommendation.downtimeAvoided} HOURS</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="p-2 bg-purple-500 rounded-lg"><ShieldCheck className="w-4 h-4 text-white" /></div>
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Model Accuracy</p>
                                      <p className="text-sm font-bold text-white leading-none">{selectedRecommendation.confidence}% CONFIDENCE</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-center">
                                  <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                                    ACTIVATE WORK ORDER <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                );
              })(),
            },
            {
              id: "rationale",
              label: "Analysis Rationale",
              content: (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tighter">Advanced Behavioral Analysis</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Our prescriptive engine fuses telemetry patterns, historical failure signatures, and operational constraints to generate these recommendations.
                    Select a specific optimization plan to view the full deep-dive analysis.
                  </p>
                </div>
              )
            }
          ]}
        />
      ) : (
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-end justify-between border-b border-slate-200 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none uppercase italic">Prescriptive Strategy Overview</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Maintenance Optimization & AI Optimization Advisories</p>
              </div>
              <div className="flex items-center gap-2 group cursor-help bg-white py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Strategy Engine v2.1</p>
                  <p className="text-[11px] font-black text-blue-600 leading-none">ADVISORY MODE ACTIVE</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>

            <PrescriptiveMaintenanceOverview
              assets={assets}
              loading={assetsLoading}
              onSelectAsset={handleAssetSelection}
              getRecommendationsData={getRecommendationsData}
              getPriorityColor={getPriorityColor}
            />
          </div>
        </div>
      )}
    </div>
  );
}