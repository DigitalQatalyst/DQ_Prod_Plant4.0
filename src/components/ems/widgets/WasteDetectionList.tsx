import { AlertTriangle, DollarSign, TrendingUp, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WasteCategory {
  id: string;
  type: "standby" | "inefficiency" | "leak" | "oversizing" | "scheduling";
  description: string;
  location: string;
  estimatedWasteKWh: number;
  costImpact: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  detectedAt: string;
  status: "new" | "investigating" | "resolved";
}

interface WasteDetectionListProps {
  wasteCategories: WasteCategory[];
  onInvestigate?: (category: WasteCategory) => void;
  onResolve?: (category: WasteCategory) => void;
}

export function WasteDetectionList({ 
  wasteCategories = [], 
  onInvestigate, 
  onResolve 
}: WasteDetectionListProps) {
  // Default mock data if no waste categories provided
  const defaultWasteCategories: WasteCategory[] = [
    {
      id: "waste-1",
      type: "standby",
      description: "ESP Pump Standby Power Consumption",
      location: "Pad A - ESP-07",
      estimatedWasteKWh: 45.2,
      costImpact: 130.25,
      severity: "High",
      detectedAt: "2024-01-15T08:30:00Z",
      status: "new"
    },
    {
      id: "waste-2", 
      type: "inefficiency",
      description: "Compressor Operating Below Optimal Efficiency",
      location: "Central Facility - GC-11",
      estimatedWasteKWh: 125.8,
      costImpact: 567.60,
      severity: "Critical",
      detectedAt: "2024-01-14T14:15:00Z",
      status: "investigating"
    },
    {
      id: "waste-3",
      type: "scheduling",
      description: "Non-Critical Loads During Peak Hours",
      location: "Camp & Utilities",
      estimatedWasteKWh: 23.4,
      costImpact: 89.45,
      severity: "Medium",
      detectedAt: "2024-01-13T16:45:00Z",
      status: "new"
    }
  ];

  const displayWasteCategories = wasteCategories.length > 0 ? wasteCategories : defaultWasteCategories;
  const sortedCategories = [...displayWasteCategories].sort((a, b) => b.costImpact - a.costImpact);
  const totalWaste = displayWasteCategories.reduce((sum, cat) => sum + cat.estimatedWasteKWh, 0);
  const totalCost = displayWasteCategories.reduce((sum, cat) => sum + cat.costImpact, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "standby":
        return "⏸️";
      case "inefficiency":
        return "📉";
      case "leak":
        return "💧";
      case "oversizing":
        return "📏";
      case "scheduling":
        return "⏰";
      default:
        return "⚠️";
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "destructive" as const;
      case "High":
        return "destructive" as const;
      case "Medium":
        return "secondary" as const;
      case "Low":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Energy Waste Detection
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{displayWasteCategories.length}</p>
            <p className="text-sm text-muted-foreground">Waste Sources</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-warning">{totalWaste.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">kWh/day Waste</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-destructive">${totalCost.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Daily Cost Impact</p>
          </div>
        </div>
      </div>

      {/* Waste Categories List */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold">Waste Categories (Ranked by Cost Impact)</h4>
        {sortedCategories.map((category) => (
          <div key={category.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getTypeIcon(category.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium">{category.description}</h5>
                    <Badge variant={getSeverityVariant(category.severity)}>
                      {category.severity}
                    </Badge>
                    {category.status === "resolved" && (
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{category.location}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-warning" />
                      <span>{category.estimatedWasteKWh.toFixed(1)} kWh/day</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-destructive" />
                      <span>${category.costImpact.toFixed(2)}/day</span>
                    </div>
                    <span className="text-muted-foreground">
                      Detected {new Date(category.detectedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {category.status !== "resolved" && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onInvestigate?.(category)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Investigate
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onResolve?.(category)}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Before/After Comparison */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Potential Impact</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Daily Waste</p>
            <p className="text-3xl font-bold text-destructive">{totalWaste.toFixed(0)} kWh</p>
            <p className="text-sm text-muted-foreground">${totalCost.toFixed(2)} cost</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">After Optimization</p>
            <p className="text-3xl font-bold text-success">0 kWh</p>
            <p className="text-sm text-muted-foreground">$0 waste cost</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg text-center">
          <p className="text-sm font-medium text-success">
            Annual Savings Potential: ${(totalCost * 365).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}