import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Wrench, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lifecycle stage definitions
interface LifecycleStage {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  icon: any;
}

const lifecycleStages: LifecycleStage[] = [
  { id: "commissioned", name: "Commissioned", description: "Asset put into service", order: 1, color: "bg-blue-500", icon: CheckCircle },
  { id: "operational", name: "Operational", description: "Normal operation phase", order: 2, color: "bg-green-500", icon: Activity },
  { id: "maintenance", name: "Maintenance", description: "Scheduled maintenance periods", order: 3, color: "bg-yellow-500", icon: Wrench },
  { id: "overhaul", name: "Major Overhaul", description: "Major refurbishment", order: 4, color: "bg-orange-500", icon: Target },
  { id: "aging", name: "Aging", description: "End of life approach", order: 5, color: "bg-red-500", icon: AlertTriangle },
];

// Generate lifecycle data for an asset
const getLifecycleData = (asset: Asset) => {
  const commissionDate = new Date();
  commissionDate.setFullYear(commissionDate.getFullYear() - Math.floor(Math.random() * 5) - 2); // 2-7 years ago
  
  const expectedLifeYears = getExpectedLifeYears(asset.type);
  const currentAge = (Date.now() - commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const remainingLife = Math.max(0, expectedLifeYears - currentAge);
  const lifePercentage = Math.min(100, (currentAge / expectedLifeYears) * 100);
  
  return {
    commissionDate: commissionDate.toISOString().split('T')[0],
    currentAge: Math.round(currentAge * 10) / 10,
    expectedLifeYears,
    remainingLifeYears: Math.round(remainingLife * 10) / 10,
    lifePercentage: Math.round(lifePercentage),
    currentStage: getCurrentStage(lifePercentage),
    nextOverhaulDate: getNextOverhaulDate(commissionDate, currentAge),
    lastInspectionDate: getLastInspectionDate(),
    nextInspectionDue: getNextInspectionDate(),
    maintenanceHistory: generateMaintenanceHistory(commissionDate),
    costTracking: generateCostTracking(currentAge, asset.type)
  };
};

const getExpectedLifeYears = (assetType: string): number => {
  const lifespans: Record<string, number> = {
    "Wellhead": 20,
    "ESP Pump": 8,
    "Gas Compressor": 25,
    "Crude Transfer Pump": 15,
    "Flare KO Drum": 30
  };
  return lifespans[assetType] || 15;
};

const getCurrentStage = (lifePercentage: number): LifecycleStage => {
  if (lifePercentage < 10) return lifecycleStages[0]; // Commissioned
  if (lifePercentage < 60) return lifecycleStages[1]; // Operational
  if (lifePercentage < 80) return lifecycleStages[2]; // Maintenance
  if (lifePercentage < 95) return lifecycleStages[3]; // Overhaul
  return lifecycleStages[4]; // Aging
};

const getNextOverhaulDate = (commissionDate: Date, currentAge: number): string => {
  const nextOverhaul = new Date(commissionDate);
  const overhaulInterval = 5; // Every 5 years
  const nextInterval = Math.ceil(currentAge / overhaulInterval) * overhaulInterval;
  nextOverhaul.setFullYear(commissionDate.getFullYear() + nextInterval);
  return nextOverhaul.toISOString().split('T')[0];
};

const getLastInspectionDate = (): string => {
  const lastInspection = new Date();
  lastInspection.setDate(lastInspection.getDate() - Math.floor(Math.random() * 90) - 30); // 30-120 days ago
  return lastInspection.toISOString().split('T')[0];
};

const getNextInspectionDate = (): string => {
  const nextInspection = new Date();
  nextInspection.setDate(nextInspection.getDate() + Math.floor(Math.random() * 60) + 30); // 30-90 days from now
  return nextInspection.toISOString().split('T')[0];
};

const generateMaintenanceHistory = (commissionDate: Date) => {
  const history = [];
  const currentDate = new Date();
  const yearsSinceCommission = (currentDate.getTime() - commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Generate maintenance events
  for (let year = 1; year <= Math.floor(yearsSinceCommission); year++) {
    // Annual inspection
    const inspectionDate = new Date(commissionDate);
    inspectionDate.setFullYear(commissionDate.getFullYear() + year);
    history.push({
      date: inspectionDate.toISOString().split('T')[0],
      type: "Inspection",
      description: "Annual safety and performance inspection",
      cost: 5000 + Math.floor(Math.random() * 3000),
      status: "Completed"
    });
    
    // Maintenance every 2 years
    if (year % 2 === 0) {
      const maintenanceDate = new Date(inspectionDate);
      maintenanceDate.setMonth(maintenanceDate.getMonth() + 6);
      history.push({
        date: maintenanceDate.toISOString().split('T')[0],
        type: "Maintenance",
        description: "Scheduled preventive maintenance",
        cost: 15000 + Math.floor(Math.random() * 10000),
        status: "Completed"
      });
    }
    
    // Major overhaul every 5 years
    if (year % 5 === 0) {
      const overhaulDate = new Date(inspectionDate);
      overhaulDate.setMonth(overhaulDate.getMonth() + 3);
      history.push({
        date: overhaulDate.toISOString().split('T')[0],
        type: "Overhaul",
        description: "Major overhaul and refurbishment",
        cost: 50000 + Math.floor(Math.random() * 30000),
        status: "Completed"
      });
    }
  }
  
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
};

const generateCostTracking = (currentAge: number, assetType: string) => {
  const initialCost = getInitialCost(assetType);
  const totalMaintenanceCost = Math.floor(currentAge * 8000 * (1 + Math.random() * 0.5));
  const currentValue = Math.max(initialCost * 0.1, initialCost - (initialCost * 0.05 * currentAge));
  
  return {
    initialCost,
    totalMaintenanceCost,
    currentValue: Math.floor(currentValue),
    totalCostOfOwnership: initialCost + totalMaintenanceCost,
    annualizedCost: Math.floor((initialCost + totalMaintenanceCost) / Math.max(1, currentAge)),
    replacementCost: Math.floor(initialCost * 1.2) // 20% inflation
  };
};

const getInitialCost = (assetType: string): number => {
  const costs: Record<string, number> = {
    "Wellhead": 150000,
    "ESP Pump": 80000,
    "Gas Compressor": 500000,
    "Crude Transfer Pump": 120000,
    "Flare KO Drum": 200000
  };
  return costs[assetType] || 100000;
};

const getLifecycleRecommendations = (lifecycleData: any, asset: Asset) => {
  const recommendations = [];
  
  if (lifecycleData.lifePercentage > 80) {
    recommendations.push({
      type: "Critical",
      title: "Plan for Replacement",
      description: "Asset is approaching end of life. Begin replacement planning and procurement.",
      priority: "High",
      timeframe: "Next 6 months"
    });
  }
  
  if (lifecycleData.lifePercentage > 60) {
    recommendations.push({
      type: "Important",
      title: "Increase Monitoring",
      description: "Implement enhanced condition monitoring to track degradation trends.",
      priority: "Medium",
      timeframe: "Next 3 months"
    });
  }
  
  const daysTillOverhaul = Math.floor((new Date(lifecycleData.nextOverhaulDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysTillOverhaul < 180) {
    recommendations.push({
      type: "Scheduled",
      title: "Prepare for Overhaul",
      description: "Major overhaul scheduled. Begin planning for downtime and spare parts procurement.",
      priority: "Medium",
      timeframe: `${daysTillOverhaul} days`
    });
  }
  
  if (lifecycleData.costTracking.annualizedCost > lifecycleData.costTracking.initialCost * 0.15) {
    recommendations.push({
      type: "Economic",
      title: "Cost Optimization Review",
      description: "Annual maintenance costs are high. Consider cost-benefit analysis for replacement.",
      priority: "Low",
      timeframe: "Next quarter"
    });
  }
  
  return recommendations;
};

export function LifecycleTracking() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);

  const currentAsset = selectedAssetLocal || (selectedAsset as Asset);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const lifecycleData = currentAsset ? getLifecycleData(currentAsset) : null;
  const recommendations = lifecycleData ? getLifecycleRecommendations(lifecycleData, currentAsset) : [];

  return (
    <APMPageShell
      title="Lifecycle Stage Tracking"
      featureSetName="Asset Inventory & Criticality"
      featureName="Lifecycle Stage Tracking"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset && lifecycleData ? (
        <div className="space-y-6">
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                <StatusBadge status={currentAsset.status} />
                {sector && subsector && <SectorBadge sector={sector} subsector={subsector} />}
                <Badge className={cn("font-semibold", lifecycleData.currentStage.color, "text-white")}>
                  {lifecycleData.currentStage.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                <span>•</span>
                <span>Age: {lifecycleData.currentAge} years</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lifecycle Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Lifecycle Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Stage Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Current Stage</span>
                    <Badge className={cn("font-semibold", lifecycleData.currentStage.color, "text-white")}>
                      {lifecycleData.currentStage.name}
                    </Badge>
                  </div>
                  
                  {/* Timeline */}
                  <div className="space-y-3">
                    {lifecycleStages.map((stage, index) => {
                      const StageIcon = stage.icon;
                      const isActive = stage.id === lifecycleData.currentStage.id;
                      const isPast = stage.order < lifecycleData.currentStage.order;
                      
                      return (
                        <div key={stage.id} className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isActive ? stage.color + " text-white" :
                            isPast ? "bg-green-100 text-green-600" :
                            "bg-gray-100 text-gray-400"
                          )}>
                            <StageIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={cn("text-sm font-medium", isActive && "text-blue-600")}>
                              {stage.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{stage.description}</p>
                          </div>
                          {isActive && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age vs Expected Life */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Age vs Expected Service Life
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Life Gauge */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted-foreground/20"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - lifecycleData.lifePercentage / 100)}`}
                          className={cn(
                            lifecycleData.lifePercentage > 80 ? "text-red-500" :
                            lifecycleData.lifePercentage > 60 ? "text-orange-500" :
                            "text-green-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{lifecycleData.lifePercentage}%</div>
                          <div className="text-xs text-muted-foreground">Life Used</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Life Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Current Age</label>
                      <p className="font-semibold">{lifecycleData.currentAge} years</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Expected Life</label>
                      <p className="font-semibold">{lifecycleData.expectedLifeYears} years</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Remaining Life</label>
                      <p className="font-semibold">{lifecycleData.remainingLifeYears} years</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Commission Date</label>
                      <p className="font-semibold">{lifecycleData.commissionDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Maintenance Schedule & History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Upcoming Events</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Next Inspection</p>
                        <p className="text-xs text-muted-foreground">{lifecycleData.nextInspectionDue}</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Next Major Overhaul</p>
                        <p className="text-xs text-muted-foreground">{lifecycleData.nextOverhaulDate}</p>
                      </div>
                      <Badge variant="outline">Planned</Badge>
                    </div>
                  </div>
                </div>

                {/* Recent History */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Recent History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lifecycleData.maintenanceHistory.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{event.type}</p>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${event.cost.toLocaleString()}</p>
                          <Badge variant="secondary" className="text-xs">{event.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lifecycle Cost Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Lifecycle Cost Tracking & Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${lifecycleData.costTracking.initialCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Initial Cost</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ${lifecycleData.costTracking.totalMaintenanceCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Maintenance</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${lifecycleData.costTracking.currentValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Value</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${lifecycleData.costTracking.annualizedCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Annualized Cost</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Cost of Ownership:</span>
                      <span className="font-semibold">${lifecycleData.costTracking.totalCostOfOwnership.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Replacement Cost (Est.):</span>
                      <span className="font-semibold">${lifecycleData.costTracking.replacementCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Cost Optimization</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Preventive maintenance reducing failures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Condition monitoring optimizing intervals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>Spare parts inventory optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Lifecycle Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <Badge variant="outline" className="text-xs mt-1">{rec.type}</Badge>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            "text-xs",
                            rec.priority === "High" ? "bg-red-500 text-white" :
                            rec.priority === "Medium" ? "bg-orange-500 text-white" :
                            "bg-green-500 text-white"
                          )}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Timeframe: {rec.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an asset to view its lifecycle tracking and aging analysis
        </div>
      )}
    </APMPageShell>
  );
}