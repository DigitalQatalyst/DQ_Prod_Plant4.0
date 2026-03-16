import { useState, useMemo, useEffect } from "react";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from "recharts";
import { upstreamEfficiencyCurves, transmissionEfficiencyCurves, type EfficiencyCurve } from "@/data/mockData";
import { TrendingUp, Target, AlertCircle, Lightbulb, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

export default function EnergyControlEfficiencyCurves() {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Select data source based on sector
  const efficiencyCurves = useMemo(() => {
    return isTransmission ? transmissionEfficiencyCurves : upstreamEfficiencyCurves;
  }, [isTransmission]);

  const [selectedAsset, setSelectedAsset] = useState<EfficiencyCurve | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [activeTab, setActiveTab] = useState("curves");

  // Helper function to extract transmission context from asset ID
  const getTransmissionContext = (assetId: string) => {
    if (!isTransmission) return null;

    // Mapping codes in asset IDs to IDs and names
    const substationCodeMap: Record<string, string> = {
      'DXB': 'ss-central',
      'JA': 'ss-north',
      'AW': 'ss-east',
      'SOUTH': 'ss-south'
    };

    const substationNameMap: Record<string, string> = {
      'DXB': 'Dubai Main',
      'JA': 'Jebel Ali',
      'AW': 'Al Aweer',
      'SOUTH': 'Dubai South'
    };

    const match = assetId.match(/TX-T\d+-([A-Z]+)/);
    const substationCode = match ? match[1] : null;
    const substationId = substationCode ? substationCodeMap[substationCode] : null;
    const substationName = substationCode ? substationNameMap[substationCode] : 'Unknown';

    return {
      substationId,
      substationName,
      substation: substationName,
      transformerId: assetId
    };
  };

  const filteredAssets = useMemo(() => {
    let result = efficiencyCurves;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.assetName.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q)
      );
    }

    // Status (simulated based on efficiency vs BEP)
    if (filters.status) {
      result = result.filter(a => {
        const efficiency = a.currentOperatingPoint.efficiency;
        const bepEfficiency = a.bestEfficiencyPoint.efficiency;
        const gap = bepEfficiency - efficiency;
        let status = "Normal";
        if (gap > 5) status = "Critical";
        else if (gap > 2) status = "Warning";
        return status.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Transmission filters
    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(a => getTransmissionContext(a.assetId)?.substationId === filters.substationId);
      }
      // Add feeder logic if needed, but transformers are usually substation-level
    }

    return result;
  }, [efficiencyCurves, searchQuery, filters, isTransmission]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredAssets.length > 0 && (!selectedAsset || !filteredAssets.find(a => a.id === selectedAsset.id))) {
      setSelectedAsset(filteredAssets[0]);
    } else if (filteredAssets.length === 0) {
      setSelectedAsset(null);
    }
  }, [filteredAssets, selectedAsset]);

  const getAssetTypeIcon = (assetType: string) => {
    if (isTransmission) {
      switch (assetType) {
        case "transformer" as any: return "⚡";
        default: return "🔌";
      }
    }

    switch (assetType) {
      case "ESP": return "🔧";
      case "compressor": return "🌪️";
      case "pump": return "💧";
      default: return "⚙️";
    }
  };

  const getAssetTypeLabel = (assetType: string) => {
    if (isTransmission) {
      switch (assetType) {
        case "transformer" as any: return "TRANSFORMER";
        default: return "EQUIPMENT";
      }
    }
    return assetType.toUpperCase();
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (isTransmission) {
      if (efficiency >= 98.5) return "text-success";
      if (efficiency >= 98.0) return "text-warning";
      return "text-destructive";
    }
    if (efficiency >= 85) return "text-success";
    if (efficiency >= 75) return "text-warning";
    return "text-destructive";
  };

  const listItems = useMemo(() => {
    return filteredAssets.map(asset => {
      const efficiency = asset.currentOperatingPoint.efficiency;
      const bepEfficiency = asset.bestEfficiencyPoint.efficiency;
      const gap = bepEfficiency - efficiency;
      let status = "Optimal";
      if (gap > 5) status = "Critical";
      else if (gap > 2) status = "Warning";

      return {
        ...asset,
        name: asset.assetName,
        subtitle: `${getAssetTypeLabel(asset.assetType)} • Eff: ${efficiency}%`,
        status: status
      };
    });
  }, [filteredAssets, isTransmission]);

  const formatChartData = (curve: EfficiencyCurve) => {
    return curve.curvePoints.map(point => ({
      flowRate: point.flowRate,
      efficiency: point.efficiency,
      powerKw: point.powerKw,
      isBEP: point.flowRate === curve.bestEfficiencyPoint.flowRatePct,
      isCurrent: point.flowRate === curve.currentOperatingPoint.flowRatePct
    }));
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isBEP) {
      return <Dot cx={cx} cy={cy} r={6} fill="hsl(var(--success))" stroke="hsl(var(--success))" strokeWidth={2} />;
    }
    if (payload.isCurrent) {
      return <Dot cx={cx} cy={cy} r={6} fill="hsl(var(--warning))" stroke="hsl(var(--warning))" strokeWidth={2} />;
    }
    return null;
  };

  const workPaneContent = selectedAsset ? (
    <div className="space-y-6">
      {isTransmission && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Zap className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Transformer Efficiency Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  {getTransmissionContext(selectedAsset.assetId)?.substation} Substation
                  {' • '}
                  {getTransmissionContext(selectedAsset.assetId)?.transformerId}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Equipment Type</div>
                <div className="font-semibold">Power Transformer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="curves">Efficiency Curves</TabsTrigger>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">BEP Guidance</TabsTrigger>
        </TabsList>

        <TabsContent value="curves" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Efficiency Curve Analysis
                  </CardTitle>
                  <CardDescription>{selectedAsset.assetName}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getAssetTypeIcon(selectedAsset.assetType)}</span>
                  <Badge variant="outline">{getAssetTypeLabel(selectedAsset.assetType)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium">
                    {isTransmission ? "Design Capacity" : "Design Flow Rate"}
                  </Label>
                  <div className="text-xl font-bold">
                    {selectedAsset.designFlowRate.toLocaleString()} {selectedAsset.designFlowUnit}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Efficiency</Label>
                  <div className={`text-xl font-bold ${getEfficiencyColor(selectedAsset.currentOperatingPoint.efficiency)}`}>
                    {selectedAsset.currentOperatingPoint.efficiency}%
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {isTransmission ? "Current Losses" : "Current Power"}
                  </Label>
                  <div className="text-xl font-bold">{selectedAsset.currentOperatingPoint.powerKw} kW</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {isTransmission ? "Load Level" : "Flow Rate"}
                  </Label>
                  <div className="text-xl font-bold">{selectedAsset.currentOperatingPoint.flowRatePct}%</div>
                </div>
              </div>

              <div className="h-96 w-full">
                <h4 className="text-lg font-semibold mb-4">
                  {isTransmission ? "Efficiency vs Load Level" : "Efficiency vs Flow Rate"}
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(selectedAsset)}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="flowRate"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={<CustomDot />}
                    />
                    <ReferenceLine x={selectedAsset.bestEfficiencyPoint.flowRatePct} stroke="hsl(var(--success))" strokeDasharray="5 5" />
                    <ReferenceLine x={selectedAsset.currentOperatingPoint.flowRatePct} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-success" />
                  Best Efficiency Point (BEP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Efficiency:</span><span className="font-bold text-success">{selectedAsset.bestEfficiencyPoint.efficiency}%</span></div>
                  <div className="flex justify-between"><span>Power/Losses:</span><span className="font-bold">{selectedAsset.bestEfficiencyPoint.powerKw} kW</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Current Operating Point
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Efficiency:</span><span className={`font-bold ${getEfficiencyColor(selectedAsset.currentOperatingPoint.efficiency)}`}>{selectedAsset.currentOperatingPoint.efficiency}%</span></div>
                  <div className="flex justify-between"><span>Power/Losses:</span><span className="font-bold">{selectedAsset.currentOperatingPoint.powerKw} kW</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {selectedAsset.recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-5 w-5 text-warning" />{rec.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                <div className="flex gap-4">
                  <Badge variant="outline">+{rec.expectedEfficiencyGain}% gain</Badge>
                  <Badge variant="outline">Savings: ${rec.estimatedSavings}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">No assets found matching filters</p>
    </div>
  );

  return (
    <EMSPageShell
      title="Efficiency Curves"
      featureSetName="Energy Control Advisory & Integration"
      featureName="Efficiency Curves"
      listType="meters"
      listItems={listItems}
      selectedItem={listItems.find(item => item.id === selectedAsset?.id)}
      onItemSelect={(item) => {
        setSelectedAsset(item as EfficiencyCurve);
        setActiveTab("curves");
      }}


      workPaneContent={workPaneContent}
      searchPlaceholder={isTransmission ? "Search transformers..." : "Search assets..."}
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showTypeFilter={!isTransmission}
          showSubstationFilter={isTransmission}
        />
      }
    />
  );
}