import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  FileText,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmeaLibrary, FMEAEntry } from "@/data/apmUpstreamData";

// Asset type mapping for FMEA filtering
const getAssetTypeForFMEA = (assetType: string): string => {
  const mapping: Record<string, string> = {
    "Wellhead": "wellhead",
    "ESP Pump": "esp-pump",
    "Gas Compressor": "gas-compressor",
    "Crude Transfer Pump": "crude-pump",
    "Flare KO Drum": "flare-ko"
  };
  return mapping[assetType] || "unknown";
};

// Get RPN color based on risk level
const getRPNColor = (rpn: number) => {
  if (rpn >= 100) return "bg-red-500 text-white";
  if (rpn >= 70) return "bg-orange-500 text-white";
  if (rpn >= 40) return "bg-yellow-500 text-black";
  return "bg-green-500 text-white";
};

// Get RPN risk level
const getRPNRiskLevel = (rpn: number) => {
  if (rpn >= 100) return "Critical";
  if (rpn >= 70) return "High";
  if (rpn >= 40) return "Medium";
  return "Low";
};

// Generate failure mode trend data (mock)
const generateFailureTrend = (failureMode: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map(month => ({
    month,
    occurrences: Math.floor(Math.random() * 5) + 1,
    severity: Math.floor(Math.random() * 3) + 1
  }));
};

// Detection methods mapping
const getDetectionMethods = (assetType: string) => {
  const methods: Record<string, string[]> = {
    "wellhead": [
      "Pressure monitoring",
      "Flow rate monitoring", 
      "Temperature monitoring",
      "Visual inspection",
      "Valve position monitoring"
    ],
    "esp-pump": [
      "Motor current monitoring",
      "Vibration analysis",
      "Temperature monitoring",
      "Performance monitoring",
      "Pressure differential analysis"
    ],
    "gas-compressor": [
      "Vibration monitoring",
      "Oil analysis",
      "Temperature monitoring",
      "Performance monitoring",
      "Pressure analysis"
    ],
    "crude-pump": [
      "Leak detection",
      "Pressure monitoring",
      "Vibration analysis",
      "Performance monitoring",
      "Seal condition monitoring"
    ],
    "flare-ko": [
      "Level monitoring",
      "Flow monitoring",
      "Visual inspection",
      "Pressure monitoring",
      "Temperature monitoring"
    ]
  };
  return methods[assetType] || ["Visual inspection", "Performance monitoring"];
};

export function FailureModeMapping() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedFMEA, setSelectedFMEA] = useState<FMEAEntry | null>(null);
  const [sortBy, setSortBy] = useState<"rpn" | "severity" | "occurrence">("rpn");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const currentAsset = selectedAssetLocal || (selectedAsset as Asset);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
    setSelectedFMEA(null); // Reset FMEA selection when asset changes
  };

  // Filter FMEA entries by asset type
  const filteredFMEA = currentAsset ? 
    fmeaLibrary.filter(entry => entry.assetType === getAssetTypeForFMEA(currentAsset.type)) : 
    [];

  // Sort FMEA entries
  const sortedFMEA = [...filteredFMEA].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const multiplier = sortOrder === "desc" ? -1 : 1;
    return (aValue - bValue) * multiplier;
  });

  const handleSort = (field: "rpn" | "severity" | "occurrence") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const detectionMethods = currentAsset ? getDetectionMethods(getAssetTypeForFMEA(currentAsset.type)) : [];

  return (
    <APMPageShell
      title="Failure Mode Mapping (FMEA/FMECA)"
      featureSetName="Asset Inventory & Criticality"
      featureName="Failure Mode Mapping (FMEA/FMECA)"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset ? (
        <div className="space-y-6">
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                <StatusBadge status={currentAsset.status} />
                {sector && subsector && <SectorBadge sector={sector} subsector={subsector} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                <span>•</span>
                <span>{filteredFMEA.length} failure modes identified</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FMEA Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      FMEA/FMECA Analysis
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                      <div className="col-span-4">Failure Mode</div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("severity")}>
                        Severity
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("occurrence")}>
                        Occurrence
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                      <div className="col-span-2">Detection</div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("rpn")}>
                        RPN
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {sortedFMEA.map((fmea, index) => (
                        <div 
                          key={fmea.id}
                          className={cn(
                            "grid grid-cols-12 gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedFMEA?.id === fmea.id && "bg-blue-50 border-blue-200"
                          )}
                          onClick={() => setSelectedFMEA(fmea)}
                        >
                          <div className="col-span-4">
                            <p className="text-sm font-medium">{fmea.failureMode}</p>
                            <p className="text-xs text-muted-foreground truncate">{fmea.effect}</p>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {fmea.severity}/10
                            </Badge>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {fmea.occurrence}/10
                            </Badge>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {fmea.detection}/10
                            </Badge>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Badge className={cn("text-xs font-semibold", getRPNColor(fmea.rpn))}>
                              {fmea.rpn}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredFMEA.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No FMEA data available for this asset type
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detection Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Detection Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectionMethods.map((method, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">{method}</p>
                        <p className="text-xs text-muted-foreground">
                          {method.includes("monitoring") ? "Continuous" : "Periodic"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected FMEA Details */}
          {selectedFMEA && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Failure Mode Details: {selectedFMEA.failureMode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* FMEA Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Failure Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Effect</label>
                          <p className="text-sm">{selectedFMEA.effect}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Cause</label>
                          <p className="text-sm">{selectedFMEA.cause}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Detection Method</label>
                          <p className="text-sm">{selectedFMEA.detectionMethod}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Risk Assessment</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold">{selectedFMEA.severity}</div>
                          <div className="text-xs text-muted-foreground">Severity</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold">{selectedFMEA.occurrence}</div>
                          <div className="text-xs text-muted-foreground">Occurrence</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold">{selectedFMEA.detection}</div>
                          <div className="text-xs text-muted-foreground">Detection</div>
                        </div>
                        <div className={cn("text-center p-3 rounded-lg", getRPNColor(selectedFMEA.rpn))}>
                          <div className="text-lg font-bold">{selectedFMEA.rpn}</div>
                          <div className="text-xs">RPN</div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <Badge className={cn("text-xs", getRPNColor(selectedFMEA.rpn))}>
                          {getRPNRiskLevel(selectedFMEA.rpn)} Risk
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions and Controls */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Current Controls</h4>
                      <div className="space-y-2">
                        {selectedFMEA.currentControls.map((control, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                            <p className="text-sm">{control}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Recommended Actions</h4>
                      <div className="space-y-2">
                        {selectedFMEA.recommendedActions.map((action, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failure Mode Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Failure Mode Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* High Risk Modes */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-sm">High Risk Modes</span>
                  </div>
                  <div className="space-y-2">
                    {sortedFMEA.filter(f => f.rpn >= 100).slice(0, 3).map((fmea, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{fmea.failureMode}</p>
                        <p className="text-xs text-muted-foreground">RPN: {fmea.rpn}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Occurrences */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm">Recent Occurrences</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="font-medium">Motor Failure</p>
                      <p className="text-xs text-muted-foreground">2 occurrences this month</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Seal Failure</p>
                      <p className="text-xs text-muted-foreground">1 occurrence this month</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Valve Failure</p>
                      <p className="text-xs text-muted-foreground">3 occurrences last month</p>
                    </div>
                  </div>
                </div>

                {/* Improvement Opportunities */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm">Improvement Opportunities</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="font-medium">Enhanced Monitoring</p>
                      <p className="text-xs text-muted-foreground">Reduce detection scores</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Preventive Maintenance</p>
                      <p className="text-xs text-muted-foreground">Reduce occurrence rates</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Design Improvements</p>
                      <p className="text-xs text-muted-foreground">Reduce severity impact</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an asset to view its failure mode mapping and FMEA analysis
        </div>
      )}
    </APMPageShell>
  );
}