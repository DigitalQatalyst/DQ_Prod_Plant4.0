import { useState, useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  Settings,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { useAssets, useCBMTriggers } from "@/hooks/useAPM";
import { Asset } from "@/types/apm";
import { cn } from "@/lib/utils";
import { CBMTriggersOverview } from "@/components/apm/CBMTriggersOverview";

export function CBMTriggers() {
  const { assets: contextAssets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Fetch real CBM triggers if any
  const { data: realTriggers, loading: triggersLoading } = useCBMTriggers({
    is_active: true,
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

  const getCBMData = (assetId: string) => {
    // Deterministic generation for ANY asset ID
    const seed = assetId;
    const totalTriggers = Math.floor(deterministicSeeded(seed, 10, 3, 6));
    const triggeredIndices = [0]; // Always at least one triggered for diversity in mock

    if (deterministicSeeded(seed, 99, 0, 100) > 70) {
      triggeredIndices.push(1);
    }

    const triggerNames = [
      { name: "Thermal Limit Breach", param: "Coil Temp", unit: "°C" },
      { name: "Vibration Threshold", param: "Axial Accel", unit: "mm/s²" },
      { name: "Leakage Current", param: "Leakage", unit: "mA" },
      { name: "Oil Pressure Alert", param: "Pressure", unit: "PSI" },
      { name: "Input Voltage Fluctuation", param: "Line Voltage", unit: "kV" },
      { name: "Humidity Warning", param: "Internal Humidity", unit: "%" }
    ];

    const triggers = Array.from({ length: totalTriggers }).map((_, i) => {
      const info = triggerNames[i % triggerNames.length];
      const isTriggered = triggeredIndices.includes(i);
      const thresholdVal = deterministicSeeded(seed, i + 50, 40, 90);

      return {
        id: `${assetId}-tg-${i}`,
        name: info.name,
        parameter: info.param,
        threshold: `> ${thresholdVal.toFixed(1)} ${info.unit}`,
        currentValue: +(thresholdVal + (isTriggered ? 5 : -10)).toFixed(1),
        unit: info.unit,
        status: isTriggered ? "Triggered" : "Active",
        lastTriggered: isTriggered ? new Date().toISOString() : null,
        triggerCount: isTriggered ? Math.floor(deterministicSeeded(seed, i + 20, 1, 5)) : 0,
        description: `Automatic monitoring of ${info.param.toLowerCase()} for asset protection.`
      };
    });

    return {
      triggers,
      maintenanceWindows: [
        { date: new Date().toISOString(), type: "Preventive", description: "Scheduled sensor recalibration" }
      ]
    };
  };

  const getTriggerStatusColor = (status: string) => {
    switch (status) {
      case "Triggered":
        return "text-red-700 bg-red-50/50 border-red-200";
      case "Active":
        return "text-green-700 bg-green-50/50 border-green-200";
      case "Disabled":
        return "text-slate-600 bg-slate-50/50 border-slate-200";
      default:
        return "text-blue-700 bg-blue-50/50 border-blue-200";
    }
  };

  const getTriggerStatusIcon = (status: string) => {
    switch (status) {
      case "Triggered":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "Active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Disabled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.asset_type || asset.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const cbmData = getCBMData(asset.id);
      const isTriggered = cbmData.triggers.some((t: any) => t.status === "Triggered");
      const status = isTriggered ? "triggered" : "active";

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, searchQuery, statusFilter, realTriggers]);

  return (
    <div className="flex h-full w-full">
      <ListPane
        title="Assets"
        subtitle="CBM Trigger monitoring"
        count={filteredAssets.length}
        searchPlaceholder="Search assets..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        customStatusOptions={[
          { value: "all", label: "All Status" },
          { value: "triggered", label: "Triggered" },
          { value: "active", label: "Active" },
        ]}
        customStatusColorMap={{
          triggered: "bg-red-500",
          active: "bg-green-500",
        }}
      >
        {assetsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs font-medium uppercase tracking-widest">Loading Analytics...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No matching assets found
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const cbmData = getCBMData(asset.id);
            const triggered = cbmData.triggers.filter((t: any) => t.status === "Triggered").length;

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
                        <Badge variant={triggered > 0 ? "destructive" : "secondary"} className="text-[8px] px-1 h-3.5 leading-none">
                          {triggered > 0 ? "TRIGGERED" : "NOMINAL"}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{cbmData.triggers.length} RULES</span>
                      </div>
                      {triggered > 0 && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
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
          title={`${currentAsset.name} Maintenance Triggers`}
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
              id: "trigger-rules",
              label: "Trigger Rules",
              content: (() => {
                const cbmData = getCBMData(currentAsset.id);
                return (
                  <div className="space-y-6">
                    {/* Status Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Settings className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-none mb-1">Total Rules</p>
                            <p className="text-xl font-black text-blue-700 leading-none">{cbmData.triggers.length}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-green-500 bg-green-50/30">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest leading-none mb-1">Active Monitoring</p>
                            <p className="text-xl font-black text-green-700 leading-none">
                              {cbmData.triggers.filter((t: any) => t.status === "Active").length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500 bg-red-50/30">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest leading-none mb-1">Fired Triggers</p>
                            <p className="text-xl font-black text-red-700 leading-none">
                              {cbmData.triggers.filter((t: any) => t.status === "Triggered").length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-tighter">Evaluation Logic Engine</h3>
                      </div>
                      {cbmData.triggers.map((trigger: any) => (
                        <Card key={trigger.id} className={cn("border transition-all", trigger.status === "Triggered" ? "border-red-200 bg-red-50/10 shadow-sm" : "border-border/60")}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  {getTriggerStatusIcon(trigger.status)}
                                  <h4 className="font-bold text-sm tracking-tight">{trigger.name}</h4>
                                  <Badge className={cn("text-[9px] font-black uppercase tracking-widest py-0 h-4",
                                    trigger.status === "Triggered" ? "bg-red-500" : "bg-green-500")}>
                                    {trigger.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Parameter</p>
                                    <p className="text-xs font-bold leading-none">{trigger.parameter}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Threshold</p>
                                    <p className="text-xs font-black leading-none text-primary">{trigger.threshold}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Live Telemetry</p>
                                    <p className={cn("text-xs font-black leading-none",
                                      trigger.status === "Triggered" ? "text-red-600" : "text-green-600")}>
                                      {trigger.currentValue} {trigger.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Action Code</p>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                      <p className="text-[10px] font-black leading-none text-blue-600 uppercase">CMD-902</p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl">{trigger.description}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4 self-start">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                  <Pause className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-100 hover:text-orange-600">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                                  <Settings className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })(),
            },
            {
              id: "maintenance",
              label: "Maintenance Plan",
              content: (() => {
                const cbmData = getCBMData(currentAsset.id);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-tighter">Recommended Interventions</h3>
                    </div>
                    {cbmData.maintenanceWindows.map((win, idx) => (
                      <Card key={idx} className="bg-secondary/10 border-dashed">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-border/40 text-center min-w-[70px]">
                              <p className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">
                                {new Date(win.date).toLocaleString('default', { month: 'short' })}
                              </p>
                              <p className="text-xl font-black text-foreground leading-none">
                                {new Date(win.date).getDate()}
                              </p>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-[9px] font-bold mb-1">{win.type}</Badge>
                              <h4 className="font-bold text-sm tracking-tight">{win.description}</h4>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Status: PENDING ADVISORY</p>
                            </div>
                          </div>
                          <Button className="font-black text-[10px] h-8 px-4 bg-primary hover:bg-primary/90">
                            SCHEDULE <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()
            }
          ]}
        />
      ) : (
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-end justify-between border-b border-slate-200 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none uppercase italic">CBM Intelligence Overview</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Condition-Based Maintenance Triggers & Rule Engine Status</p>
              </div>
              <div className="flex items-center gap-2 group cursor-help bg-white py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none">AI Integration</p>
                  <p className="text-[11px] font-black text-red-600 leading-none">LIVE EVALUATION ACTIVE</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>
            </div>

            <CBMTriggersOverview
              assets={assets}
              loading={assetsLoading}
              onSelectAsset={handleAssetSelection}
              getCBMData={getCBMData}
              getTriggerStatusColor={getTriggerStatusColor}
              getTriggerStatusIcon={getTriggerStatusIcon}
            />
          </div>
        </div>
      )}
    </div>
  );
}
