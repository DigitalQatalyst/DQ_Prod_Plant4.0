import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upstreamAssetModes, transmissionAssetModes, type AssetMode } from "@/data/mockData";
import { Settings, Zap, AlertTriangle, Clock, Wrench } from "lucide-react";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

export default function EnergyControlAssetModes() {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Select data source based on sector
  const rawAssetModes = isTransmission ? transmissionAssetModes : upstreamAssetModes;

  const [selectedId, setSelectedId] = useState<string>("overview");
  const [modeChangeOpen, setModeChangeOpen] = useState(false);
  const [selectedNewMode, setSelectedNewMode] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [activeTab, setActiveTab] = useState("modes");

  // Helper function to extract transmission context from asset ID for filtering and display
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

    const match = assetId.match(/LOAD-([A-Z]+)-/);
    const substationCode = match ? match[1] : null;
    const substationId = substationCode ? substationCodeMap[substationCode] : null;
    const substationName = substationCode ? substationNameMap[substationCode] : 'Unknown';

    // Determine feeder if applicable
    const feederMap: Record<string, { id: string, name: string }> = {
      'CAP-01': { id: 'feeder-220a', name: 'FDR-OUT-01' },
      'CAP-02': { id: 'feeder-132b', name: 'FDR-OUT-02' },
      'BESS-01': { id: 'feeder-220a', name: 'FDR-OUT-01' }
    };

    const feederMatch = assetId.match(/-(CAP-\d+|BESS-\d+)/);
    const feederKey = feederMatch ? feederMatch[1] : null;
    const feederData = feederKey ? feederMap[feederKey] : null;

    return {
      substationId,
      substationName,
      substation: substationName,
      feederId: feederData?.id,
      feeder: feederData?.name
    };
  };

  const assetModes = useMemo(() => {
    let result = rawAssetModes;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.assetName.toLowerCase().includes(query) || a.assetId.toLowerCase().includes(query));
    }

    // Status (current mode)
    if (filters.status) {
      result = result.filter(a => a.currentMode.toLowerCase() === filters.status.toLowerCase());
    }

    // Transmission filters
    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(a => getTransmissionContext(a.assetId)?.substationId === filters.substationId);
      }
      if (filters.feederId) {
        result = result.filter(a => getTransmissionContext(a.assetId)?.feederId === filters.feederId);
      }
    }



    // Type Filter (Asset Type)
    if (filters.type) {
      if (isTransmission) {
        const typeCode = filters.type.toLowerCase();
        if (typeCode === 'hvac') result = result.filter(a => a.assetId.includes('HVAC'));
        else if (typeCode === 'pump') result = result.filter(a => a.assetId.includes('PUMP'));
        else if (typeCode === 'bess') result = result.filter(a => a.assetId.includes('BESS'));
        else if (typeCode === 'cap') result = result.filter(a => a.assetId.includes('CAP'));
        else if (typeCode === 'tap') result = result.filter(a => a.assetId.includes('TAP'));
        else if (typeCode === 'light') result = result.filter(a => a.assetId.includes('LIGHT'));
        else if (typeCode === 'ev') result = result.filter(a => a.assetId.includes('EV'));
      } else {
        result = result.filter(a => a.assetType.toLowerCase() === filters.type.toLowerCase());
      }
    }

    return result;
  }, [rawAssetModes, searchQuery, filters, isTransmission]);

  // Selected Asset derived from ID
  const selectedAsset = useMemo(() => assetModes.find(a => a.id === selectedId), [assetModes, selectedId]);

  // List Items
  const listItems = useMemo(() => {
    return assetModes.map(a => ({
      ...a,
      name: a.assetName,
      subtitle: `${a.assetType} • ${a.currentMode}`,
      status: a.recommendations.length > 0 ? 'Action Required' : 'Optimized'
    }));
  }, [assetModes]);

  // Update selection if filtered out
  useEffect(() => {
    if (selectedId !== 'overview' && !selectedAsset && assetModes.length > 0) {
      // If selected asset is lost (e.g. filtered out), go to overview
      setSelectedId('overview');
    }
  }, [assetModes, selectedAsset, selectedId]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "idle": return "⏸️";
      case "normal": return "▶️";
      case "high": return "⚡";
      default: return "❓";
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "idle": return "text-muted-foreground";
      case "normal": return "text-success";
      case "high": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "Low": return "default";
      case "Medium": return "secondary";
      case "High": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Low": return "outline";
      case "Medium": return "secondary";
      case "High": return "destructive";
      default: return "outline";
    }
  };

  // Helper function to get transmission equipment type display name
  const getTransmissionEquipmentType = (assetId: string) => {
    if (!isTransmission) return null;

    if (assetId.includes('TAP')) return 'Transformer Tap Changer';
    if (assetId.includes('CAP')) return 'Capacitor Bank';
    if (assetId.includes('HVAC')) return 'HVAC System';
    if (assetId.includes('PUMP')) return 'Cooling Pump';
    if (assetId.includes('LIGHT')) return 'Lighting System';
    if (assetId.includes('BESS')) return 'Battery Storage';
    if (assetId.includes('EV')) return 'EV Charger';

    return 'Controllable Load';
  };

  const OverviewContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset Energy Modes Overview</CardTitle>
          <CardDescription>
            {isTransmission ? 'Summary of transmission equipment operating states' : 'Summary of asset operating modes and efficiency opportunities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
              <div className="text-2xl font-bold">{assetModes.length}</div>
            </div>
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Optimized</div>
              <div className="text-2xl font-bold text-green-600">
                {assetModes.filter(a => a.recommendations.length === 0).length}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Action Required</div>
              <div className="text-2xl font-bold text-amber-600">
                {assetModes.filter(a => a.recommendations.length > 0).length}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Est. Savings</div>
              <div className="text-2xl font-bold text-primary">
                ${assetModes.reduce((sum, a) => sum + a.recommendations.reduce((s, r) => s + r.expectedSavings, 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Operating Mode Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['normal', 'high', 'idle'].map(mode => {
                const count = assetModes.filter(a => a.currentMode === mode).length;
                const total = assetModes.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{mode}</span>
                      <span className="text-muted-foreground">{count} assets ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mode === 'normal' ? 'bg-green-500' : mode === 'high' ? 'bg-amber-500' : 'bg-slate-400'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetModes
                .flatMap(a => a.recommendations.map(r => ({ ...r, assetName: a.assetName, assetId: a.id })))
                .sort((a, b) => b.expectedSavings - a.expectedSavings)
                .slice(0, 5)
                .map(rec => (
                  <div key={`${rec.assetId}-${rec.id}`} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{rec.assetName}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Switch to <span className="font-semibold">{rec.recommendedMode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">${rec.expectedSavings}</div>
                      <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px] mt-1">
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              {assetModes.flatMap(a => a.recommendations).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recommendations active
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAssetDetails = () => {
    if (!selectedAsset) return null;
    return (
      <div className="space-y-6">
        {/* Transmission Context Banner */}
        {isTransmission && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Transmission Equipment Control</h3>
                  <p className="text-sm text-muted-foreground">
                    {getTransmissionContext(selectedAsset.assetId)?.substation} Substation
                    {getTransmissionContext(selectedAsset.assetId)?.feeder &&
                      ` • Feeder ${getTransmissionContext(selectedAsset.assetId)?.feeder}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Equipment Type</div>
                  <div className="font-semibold">{getTransmissionEquipmentType(selectedAsset.assetId)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modes">Operating Modes</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="status">{isTransmission ? 'Equipment Status' : 'Asset Status'}</TabsTrigger>
          </TabsList>

          <TabsContent value="modes" className="space-y-6">
            {/* Current Mode Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Current Operating Mode
                    </CardTitle>
                    <CardDescription>
                      {selectedAsset.assetName}
                      {isTransmission && ` • ${getTransmissionEquipmentType(selectedAsset.assetId)}`}
                    </CardDescription>
                  </div>
                  <Dialog open={modeChangeOpen} onOpenChange={setModeChangeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Change Mode
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Change Operating Mode</DialogTitle>
                        <DialogDescription>
                          Select a new operating mode for {selectedAsset.assetName}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="new-mode" className="text-right">
                            New Mode
                          </Label>
                          <Select value={selectedNewMode} onValueChange={setSelectedNewMode}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedAsset.availableModes.map((mode) => (
                                <SelectItem key={mode.mode} value={mode.mode}>
                                  {getModeIcon(mode.mode)} {mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModeChangeOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setModeChangeOpen(false)}>
                          Apply Mode Change
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">{getModeIcon(selectedAsset.currentMode)}</div>
                  <div>
                    <div className={`text-2xl font-bold ${getModeColor(selectedAsset.currentMode)}`}>
                      {selectedAsset.currentMode.charAt(0).toUpperCase() + selectedAsset.currentMode.slice(1)} Mode
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Active since {new Date(selectedAsset.lastModeChange).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Current Mode Details */}
                {selectedAsset.availableModes
                  .filter(mode => mode.mode === selectedAsset.currentMode)
                  .map(currentMode => (
                    <div key={currentMode.mode} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Power Consumption</Label>
                        <div className="text-xl font-bold">{currentMode.powerKw} kW</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Efficiency</Label>
                        <div className="text-xl font-bold">{currentMode.efficiency}%</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Risk Level</Label>
                        <div className="mt-1">
                          <Badge variant={getRiskBadgeVariant(currentMode.riskLevel)}>
                            {currentMode.riskLevel}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Operating Hours</Label>
                        <div className="text-xl font-bold">{selectedAsset.operatingHours}</div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Available Modes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Operating Modes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedAsset.availableModes.map((mode) => (
                  <Card key={mode.mode} className={mode.mode === selectedAsset.currentMode ? "ring-2 ring-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-xl">{getModeIcon(mode.mode)}</span>
                          {mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}
                        </CardTitle>
                        {mode.mode === selectedAsset.currentMode && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Power:</span>
                          <span className="font-medium">{mode.powerKw} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efficiency:</span>
                          <span className="font-medium">{mode.efficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk:</span>
                          <Badge variant={getRiskBadgeVariant(mode.riskLevel)} className="text-xs">
                            {mode.riskLevel}
                          </Badge>
                        </div>
                        {mode.maxRunTimeHours && (
                          <div className="flex justify-between">
                            <span>Max Runtime:</span>
                            <span className="font-medium">{mode.maxRunTimeHours}h</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mode Change Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  {isTransmission
                    ? 'AI-generated recommendations for optimal equipment operation and demand response'
                    : 'AI-generated recommendations for optimal operating modes'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedAsset.recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xl">{getModeIcon(rec.recommendedMode)}</span>
                        Switch to {rec.recommendedMode.charAt(0).toUpperCase() + rec.recommendedMode.slice(1)} Mode
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                          {rec.priority} Priority
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {rec.implementationTime}
                        </Badge>
                      </div>
                    </div>
                    {isTransmission && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {getTransmissionContext(selectedAsset.assetId)?.substation} •
                        {getTransmissionEquipmentType(selectedAsset.assetId)}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Rationale</Label>
                        <p className="text-sm text-muted-foreground mt-1">{rec.rationale}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Expected Savings</Label>
                          <div className={`text-lg font-bold ${rec.expectedSavings >= 0 ? 'text-success' : 'text-warning'}`}>
                            {rec.expectedSavings >= 0 ? '+' : ''}${rec.expectedSavings}/month
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Implementation</Label>
                          <div className="text-lg font-bold">{rec.implementationTime}</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                          <div>
                            <Label className="text-sm font-medium">Risk Notes</Label>
                            <p className="text-sm text-muted-foreground mt-1">{rec.riskNotes}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm">
                          Apply Recommendation
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedAsset.recommendations.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No mode change recommendations at this time</p>
                      <p className="text-sm text-muted-foreground">Current operating mode is optimal for current conditions</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {isTransmission ? 'Equipment Status & Control' : 'Asset Status & Maintenance'}
                </CardTitle>
                <CardDescription>
                  {selectedAsset.assetName} - {selectedAsset.assetType.toUpperCase()}
                  {isTransmission && ` • ${getTransmissionEquipmentType(selectedAsset.assetId)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      {isTransmission ? "Equipment Type" : "Asset Type"}
                    </Label>
                    <div className="text-lg font-bold">
                      {isTransmission
                        ? getTransmissionEquipmentType(selectedAsset.assetId)
                        : selectedAsset.assetType.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Operating Hours</Label>
                    <div className="text-lg font-bold">{selectedAsset.operatingHours.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Maintenance</Label>
                    <div className="text-lg font-bold">{selectedAsset.nextMaintenanceHours}h</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Mode Change</Label>
                    <div className="text-lg font-bold">
                      {new Date(selectedAsset.lastModeChange).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {isTransmission && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Transmission Grid Context
                    </Label>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Substation:</span>
                        <span className="ml-2 font-medium">
                          {getTransmissionContext(selectedAsset.assetId)?.substation || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Feeder:</span>
                        <span className="ml-2 font-medium">
                          {getTransmissionContext(selectedAsset.assetId)?.feeder || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Control Method:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('TAP') ? 'SCADA' :
                            selectedAsset.assetId.includes('CAP') ? 'SCADA' :
                              selectedAsset.assetId.includes('HVAC') ? 'BACnet' :
                                selectedAsset.assetId.includes('PUMP') ? 'Modbus' :
                                  selectedAsset.assetId.includes('BESS') ? 'API' :
                                    selectedAsset.assetId.includes('EV') ? 'API' :
                                      selectedAsset.assetId.includes('LIGHT') ? 'Manual' : 'SCADA'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Equipment Category:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('TAP') ? 'Voltage Control' :
                            selectedAsset.assetId.includes('CAP') ? 'Reactive Power' :
                              selectedAsset.assetId.includes('HVAC') ? 'Comfort Load' :
                                selectedAsset.assetId.includes('PUMP') ? 'Cooling System' :
                                  selectedAsset.assetId.includes('BESS') ? 'Energy Storage' :
                                    selectedAsset.assetId.includes('EV') ? 'EV Charging' :
                                      selectedAsset.assetId.includes('LIGHT') ? 'Lighting' : 'Controllable Load'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Shed Priority:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('TAP') ? 'Very High (10)' :
                            selectedAsset.assetId.includes('CAP') ? 'High (20)' :
                              selectedAsset.assetId.includes('PUMP') ? 'High (15)' :
                                selectedAsset.assetId.includes('BESS') ? 'Very High (5)' :
                                  selectedAsset.assetId.includes('HVAC') ? 'Medium (40)' :
                                    selectedAsset.assetId.includes('LIGHT') ? 'Low (60)' :
                                      selectedAsset.assetId.includes('EV') ? 'Low (70)' : 'Medium (50)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Shed Group:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('TAP') ? 'voltage_control' :
                            selectedAsset.assetId.includes('CAP') ? 'reactive_power' :
                              selectedAsset.assetId.includes('PUMP') ? 'cooling' :
                                selectedAsset.assetId.includes('BESS') ? 'energy_storage' :
                                  selectedAsset.assetId.includes('HVAC') ? 'comfort' :
                                    selectedAsset.assetId.includes('LIGHT') ? 'lighting' :
                                      selectedAsset.assetId.includes('EV') ? 'ev_charging' : 'general'}
                        </span>
                      </div>
                    </div>

                    {/* Transmission-specific operational notes */}
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <Label className="text-sm font-medium">Operational Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedAsset.assetId.includes('TAP') &&
                          'Automatic voltage regulation equipment. Critical for grid stability. Requires SCADA control.'}
                        {selectedAsset.assetId.includes('CAP') &&
                          'Reactive power compensation for power factor correction. Can be switched for demand response.'}
                        {selectedAsset.assetId.includes('HVAC') &&
                          'Control room climate control. Can be reduced during peak demand periods with minimal impact.'}
                        {selectedAsset.assetId.includes('PUMP') &&
                          'Transformer cooling system. Essential for transformer operation. Monitor oil temperature.'}
                        {selectedAsset.assetId.includes('BESS') &&
                          'Grid-scale battery storage. Provides peak shaving, frequency regulation, and backup power.'}
                        {selectedAsset.assetId.includes('EV') &&
                          'Fleet vehicle charging. Can be scheduled or reduced during peak demand periods.'}
                        {selectedAsset.assetId.includes('LIGHT') &&
                          'Substation lighting. Can be reduced to emergency levels during demand response events.'}
                      </p>
                    </div>
                  </div>
                )}

                {!isTransmission && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium">Upstream Context</Label>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Facility:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('ESP') ? 'Well Site Alpha' :
                            selectedAsset.assetId.includes('GC') ? 'Gas Processing Plant' :
                              selectedAsset.assetId.includes('P-') ? 'Transfer Station' : 'Production Facility'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Control Method:</span>
                        <span className="ml-2 font-medium">
                          {selectedAsset.assetId.includes('ESP') ? 'VFD' :
                            selectedAsset.assetId.includes('GC') ? 'PLC' :
                              selectedAsset.assetId.includes('P-') ? 'SCADA' : 'Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <Label className="text-sm font-medium">Available Modes Summary</Label>
                  <div className="mt-2 space-y-2">
                    {selectedAsset.availableModes.map((mode) => (
                      <div key={mode.mode} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <span>{getModeIcon(mode.mode)}</span>
                          <span className="font-medium">{mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}</span>
                          {mode.mode === selectedAsset.currentMode && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mode.powerKw} kW • {mode.efficiency}% eff
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label className="text-sm font-medium">Control Actions</Label>
                  <div className="flex gap-2 flex-wrap">
                    {isTransmission ? (
                      <>
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4 mr-2" />
                          {selectedAsset.assetId.includes('TAP') ? 'Manual Tap Control' :
                            selectedAsset.assetId.includes('CAP') ? 'Switch Capacitor' :
                              selectedAsset.assetId.includes('BESS') ? 'Charge/Discharge' :
                                'Emergency Shutdown'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          {selectedAsset.assetId.includes('BESS') ? 'Battery Management' : 'Control Settings'}
                        </Button>
                        {(selectedAsset.assetId.includes('HVAC') ||
                          selectedAsset.assetId.includes('PUMP') ||
                          selectedAsset.assetId.includes('EV')) && (
                            <Button size="sm" variant="outline">
                              <Clock className="h-4 w-4 mr-2" />
                              Schedule DR Event
                            </Button>
                          )}
                        <Button size="sm" variant="outline">
                          <Wrench className="h-4 w-4 mr-2" />
                          Schedule Maintenance
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4 mr-2" />
                          Emergency Stop
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Manual Override
                        </Button>
                        <Button size="sm" variant="outline">
                          <Wrench className="h-4 w-4 mr-2" />
                          Schedule Maintenance
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const workPaneContent = selectedId === 'overview' ? OverviewContent : (selectedAsset ? renderAssetDetails() : null);

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={true}
      showRoleFilter={false}
      showSubstationFilter={isTransmission}
      showFeederFilter={isTransmission}
      statusOptions={[
        { label: "Normal Operation", value: "normal" },
        { label: "High Output", value: "high" },
        { label: "Idle / Standby", value: "idle" }
      ]}
      typeOptions={isTransmission ? [
        { label: "HVAC", value: "hvac" },
        { label: "Pumps", value: "pump" },
        { label: "Battery Storage", value: "bess" },
        { label: "Capacitor Banks", value: "cap" },
        { label: "Tap Changers", value: "tap" },
        { label: "Lighting", value: "light" },
        { label: "EV Chargers", value: "ev" }
      ] : [
        { label: "ESP", value: "ESP" },
        { label: "Compressors", value: "compressor" },
        { label: "Pumps", value: "pump" },
        { label: "Generators", value: "generator" }
      ]}
    />
  );

  return (
    <EMSPageShell
      title={isTransmission ? "Transmission Equipment Control Modes" : "Asset Energy Mode Recommendations"}
      featureSetName="Energy Control Advisory & Integration"
      featureName={isTransmission ? "Equipment Modes" : "Asset Modes"}
      listType="meters"
      listItems={listItems}
      selectedItem={listItems.find(i => i.id === selectedId)}
      onItemSelect={(item) => {
        setSelectedId(item.id);
        setActiveTab("modes");
      }}

      workPaneContent={workPaneContent}
      searchPlaceholder={isTransmission ? "Search equipment..." : "Search assets..."}
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      sector={sector}
      subsector={subsector}
      tenantName={isTransmission ? "DEWA - Transmission" : "GulfUpstream Demo"}
    />
  );
}