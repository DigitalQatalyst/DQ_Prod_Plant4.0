import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Truck,
  Search,
  Filter,
  Plus,
  ExternalLink,
  BarChart3,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sparePartsInventory, SparePart } from "@/data/apmUpstreamData";

// Asset type mapping for spare parts filtering
const getAssetTypeForSpares = (assetType: string): string => {
  const mapping: Record<string, string> = {
    "Wellhead": "wellhead",
    "ESP Pump": "esp-pump", 
    "Gas Compressor": "gas-compressor",
    "Crude Transfer Pump": "crude-pump",
    "Flare KO Drum": "flare-ko"
  };
  return mapping[assetType] || "unknown";
};

// Get stock status color and label
const getStockStatus = (part: SparePart) => {
  const stockRatio = part.onHandQuantity / part.reorderPoint;
  
  if (part.onHandQuantity === 0) {
    return { status: "Out of Stock", color: "bg-red-500 text-white", level: "critical" };
  } else if (stockRatio <= 1) {
    return { status: "Low Stock", color: "bg-orange-500 text-white", level: "warning" };
  } else if (stockRatio <= 2) {
    return { status: "Adequate", color: "bg-yellow-500 text-black", level: "caution" };
  } else {
    return { status: "Good Stock", color: "bg-green-500 text-white", level: "good" };
  }
};

// Get criticality color
const getCriticalityColor = (criticality: string) => {
  switch (criticality) {
    case "Critical": return "bg-red-500 text-white";
    case "Important": return "bg-orange-500 text-white";
    case "Standard": return "bg-green-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

// Generate additional spare parts for the selected asset
const generateAdditionalSpares = (assetType: string, assetId: string): SparePart[] => {
  const additionalParts: Record<string, Partial<SparePart>[]> = {
    "wellhead": [
      {
        partNumber: "WH-SEAL-001",
        description: "Wellhead Seal Kit 3-1/16\"",
        onHandQuantity: 3,
        reorderPoint: 2,
        leadTimeDays: 21,
        unitCost: 2500,
        supplier: "Cameron International",
        criticalityLevel: "Important"
      },
      {
        partNumber: "WH-GASKET-001", 
        description: "Flange Gasket Set",
        onHandQuantity: 5,
        reorderPoint: 3,
        leadTimeDays: 14,
        unitCost: 450,
        supplier: "Local Supplier",
        criticalityLevel: "Standard"
      }
    ],
    "esp-pump": [
      {
        partNumber: "ESP-CABLE-450",
        description: "ESP Power Cable 450 Series",
        onHandQuantity: 1,
        reorderPoint: 1,
        leadTimeDays: 60,
        unitCost: 25000,
        supplier: "Baker Hughes",
        criticalityLevel: "Critical"
      },
      {
        partNumber: "ESP-SENSOR-001",
        description: "Downhole Pressure Sensor",
        onHandQuantity: 2,
        reorderPoint: 1,
        leadTimeDays: 45,
        unitCost: 8500,
        supplier: "Schlumberger",
        criticalityLevel: "Important"
      }
    ],
    "gas-compressor": [
      {
        partNumber: "GC-VALVE-001",
        description: "Compressor Valve Set",
        onHandQuantity: 0,
        reorderPoint: 2,
        leadTimeDays: 35,
        unitCost: 12000,
        supplier: "Siemens Energy",
        criticalityLevel: "Critical"
      },
      {
        partNumber: "GC-BEARING-001",
        description: "Main Bearing Assembly",
        onHandQuantity: 1,
        reorderPoint: 1,
        leadTimeDays: 42,
        unitCost: 18000,
        supplier: "SKF",
        criticalityLevel: "Critical"
      }
    ],
    "crude-pump": [
      {
        partNumber: "CP-IMPELLER-001",
        description: "Pump Impeller Assembly",
        onHandQuantity: 1,
        reorderPoint: 1,
        leadTimeDays: 28,
        unitCost: 6500,
        supplier: "Flowserve",
        criticalityLevel: "Important"
      },
      {
        partNumber: "CP-SEAL-001",
        description: "Mechanical Seal Kit",
        onHandQuantity: 2,
        reorderPoint: 2,
        leadTimeDays: 21,
        unitCost: 3200,
        supplier: "John Crane",
        criticalityLevel: "Critical"
      }
    ],
    "flare-ko": [
      {
        partNumber: "KO-TRANSMITTER-001",
        description: "Level Transmitter",
        onHandQuantity: 1,
        reorderPoint: 1,
        leadTimeDays: 30,
        unitCost: 4500,
        supplier: "Emerson",
        criticalityLevel: "Critical"
      },
      {
        partNumber: "KO-VALVE-001",
        description: "Relief Valve 6\" 150 PSI",
        onHandQuantity: 0,
        reorderPoint: 1,
        leadTimeDays: 45,
        unitCost: 8900,
        supplier: "Anderson Greenwood",
        criticalityLevel: "Critical"
      }
    ]
  };

  const parts = additionalParts[assetType] || [];
  return parts.map((part, index) => ({
    id: `sp-${assetType}-${index + 100}`,
    partNumber: part.partNumber || `PART-${index}`,
    description: part.description || "Generic Part",
    compatibleAssetTypes: [assetType],
    compatibleAssets: [assetId],
    onHandQuantity: part.onHandQuantity || 0,
    reorderPoint: part.reorderPoint || 1,
    maxStock: (part.reorderPoint || 1) * 3,
    leadTimeDays: part.leadTimeDays || 30,
    unitCost: part.unitCost || 1000,
    supplier: part.supplier || "Unknown Supplier",
    criticalityLevel: part.criticalityLevel as "Critical" | "Important" | "Standard" || "Standard",
    storageLocation: "Warehouse A-1",
    condition: "New" as const
  }));
};

// Calculate risk due to spares
const calculateSparePartsRisk = (parts: SparePart[]) => {
  let totalRisk = 0;
  let criticalOutOfStock = 0;
  let lowStockItems = 0;

  parts.forEach(part => {
    const stockStatus = getStockStatus(part);
    
    if (stockStatus.level === "critical") {
      totalRisk += part.criticalityLevel === "Critical" ? 10 : 
                   part.criticalityLevel === "Important" ? 7 : 3;
      if (part.criticalityLevel === "Critical") criticalOutOfStock++;
    } else if (stockStatus.level === "warning") {
      totalRisk += part.criticalityLevel === "Critical" ? 5 : 
                   part.criticalityLevel === "Important" ? 3 : 1;
      lowStockItems++;
    }
  });

  return {
    totalRisk,
    criticalOutOfStock,
    lowStockItems,
    riskLevel: totalRisk > 20 ? "High" : totalRisk > 10 ? "Medium" : "Low"
  };
};

export function SparePartsLinkage() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const currentAsset = selectedAssetLocal || (selectedAsset as Asset);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
    setSelectedPart(null);
  };

  // Get spare parts for the current asset
  const assetSpares = currentAsset ? [
    ...sparePartsInventory.filter(part => 
      part.compatibleAssetTypes.includes(getAssetTypeForSpares(currentAsset.type)) ||
      part.compatibleAssets.includes(currentAsset.id)
    ),
    ...generateAdditionalSpares(getAssetTypeForSpares(currentAsset.type), currentAsset.id)
  ] : [];

  const riskAnalysis = calculateSparePartsRisk(assetSpares);

  return (
    <APMPageShell
      title="Spare-Part Linkage & Metadata"
      featureSetName="Asset Inventory & Criticality"
      featureName="Spare-Part Linkage & Metadata"
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
                {riskAnalysis.riskLevel === "High" && (
                  <Badge className="bg-red-500 text-white">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High Spare Parts Risk
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                <span>•</span>
                <span>{assetSpares.length} spare parts linked</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search Catalog
              </Button>
            </div>
          </div>

          {/* Risk Summary */}
          {riskAnalysis.totalRisk > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Due to Spares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{riskAnalysis.criticalOutOfStock}</div>
                    <div className="text-sm text-muted-foreground">Critical Parts Out of Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{riskAnalysis.lowStockItems}</div>
                    <div className="text-sm text-muted-foreground">Low Stock Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{riskAnalysis.riskLevel}</div>
                    <div className="text-sm text-muted-foreground">Overall Risk Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spare Parts Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Compatible Spare Parts
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assetSpares.map((part, index) => {
                      const stockStatus = getStockStatus(part);
                      const isSelected = selectedPart?.id === part.id;
                      
                      return (
                        <div 
                          key={part.id}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            isSelected && "bg-blue-50 border-blue-200"
                          )}
                          onClick={() => setSelectedPart(part)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">{part.partNumber}</h4>
                                <Badge className={cn("text-xs", getCriticalityColor(part.criticalityLevel))}>
                                  {part.criticalityLevel}
                                </Badge>
                                <Badge className={cn("text-xs", stockStatus.color)}>
                                  {stockStatus.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{part.description}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">On Hand:</span>
                                  <span className="ml-1 font-medium">{part.onHandQuantity}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reorder:</span>
                                  <span className="ml-1 font-medium">{part.reorderPoint}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Lead Time:</span>
                                  <span className="ml-1 font-medium">{part.leadTimeDays}d</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span>
                                  <span className="ml-1 font-medium">${part.unitCost.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="w-16">
                                <Progress 
                                  value={Math.min(100, (part.onHandQuantity / part.maxStock) * 100)} 
                                  className="h-2"
                                />
                              </div>
                              <div className="text-xs text-center mt-1 text-muted-foreground">
                                {part.onHandQuantity}/{part.maxStock}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {assetSpares.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No spare parts linked to this asset
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Inventory Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stock Status Distribution */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Stock Status</h4>
                    <div className="space-y-2">
                      {["critical", "warning", "caution", "good"].map(level => {
                        const count = assetSpares.filter(part => getStockStatus(part).level === level).length;
                        const percentage = assetSpares.length > 0 ? (count / assetSpares.length) * 100 : 0;
                        const colors = {
                          critical: "bg-red-500",
                          warning: "bg-orange-500", 
                          caution: "bg-yellow-500",
                          good: "bg-green-500"
                        };
                        
                        return (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", colors[level as keyof typeof colors])} />
                              <span className="text-sm capitalize">{level === "critical" ? "Out of Stock" : 
                                                                   level === "warning" ? "Low Stock" :
                                                                   level === "caution" ? "Adequate" : "Good Stock"}</span>
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Criticality Distribution */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">By Criticality</h4>
                    <div className="space-y-2">
                      {["Critical", "Important", "Standard"].map(criticality => {
                        const count = assetSpares.filter(part => part.criticalityLevel === criticality).length;
                        return (
                          <div key={criticality} className="flex items-center justify-between">
                            <span className="text-sm">{criticality}</span>
                            <Badge className={cn("text-xs", getCriticalityColor(criticality))}>
                              {count}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Total Value */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Inventory Value</h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ${assetSpares.reduce((sum, part) => sum + (part.onHandQuantity * part.unitCost), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total On-Hand Value</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Part Details */}
          {selectedPart && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Part Details: {selectedPart.partNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Part Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Part Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">Part Number</label>
                          <p className="font-mono">{selectedPart.partNumber}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Description</label>
                          <p>{selectedPart.description}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Supplier</label>
                          <p>{selectedPart.supplier}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Condition</label>
                          <p>{selectedPart.condition}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Storage Location</label>
                          <p>{selectedPart.storageLocation}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Criticality</label>
                          <Badge className={cn("text-xs", getCriticalityColor(selectedPart.criticalityLevel))}>
                            {selectedPart.criticalityLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-3">Compatibility</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Asset Types</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPart.compatibleAssetTypes.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Compatible Assets</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPart.compatibleAssets.map((asset, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {asset}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory & Procurement */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Inventory Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold">{selectedPart.onHandQuantity}</div>
                          <div className="text-xs text-muted-foreground">On Hand</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold">{selectedPart.reorderPoint}</div>
                          <div className="text-xs text-muted-foreground">Reorder Point</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold">{selectedPart.maxStock}</div>
                          <div className="text-xs text-muted-foreground">Max Stock</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold">{selectedPart.leadTimeDays}</div>
                          <div className="text-xs text-muted-foreground">Lead Time (days)</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-3">Cost Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Unit Cost:</span>
                          <span className="font-semibold">${selectedPart.unitCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Value:</span>
                          <span className="font-semibold">
                            ${(selectedPart.onHandQuantity * selectedPart.unitCost).toLocaleString()}
                          </span>
                        </div>
                        {selectedPart.lastOrderDate && (
                          <div className="flex justify-between">
                            <span>Last Order:</span>
                            <span>{new Date(selectedPart.lastOrderDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedPart.nextOrderDue && (
                          <div className="flex justify-between">
                            <span>Next Order Due:</span>
                            <span className="text-orange-600 font-medium">
                              {new Date(selectedPart.nextOrderDue).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Order Part
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Procurement Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Procurement Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Immediate Orders Needed */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-sm">Immediate Orders</span>
                  </div>
                  <div className="space-y-2">
                    {assetSpares.filter(part => part.onHandQuantity === 0).slice(0, 3).map((part, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{part.partNumber}</p>
                        <p className="text-xs text-muted-foreground">Out of stock - {part.leadTimeDays}d lead time</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Reorders */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm">Upcoming Reorders</span>
                  </div>
                  <div className="space-y-2">
                    {assetSpares.filter(part => part.onHandQuantity <= part.reorderPoint && part.onHandQuantity > 0).slice(0, 3).map((part, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{part.partNumber}</p>
                        <p className="text-xs text-muted-foreground">Low stock - reorder soon</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Optimization */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm">Cost Optimization</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-green-500" />
                      <span>Bulk order discounts available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      <span>Consolidate suppliers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Review lead times quarterly</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an asset to view its spare parts linkage and inventory management
        </div>
      )}
    </APMPageShell>
  );
}