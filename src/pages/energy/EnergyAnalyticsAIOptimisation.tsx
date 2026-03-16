import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { AdvisoryActionsList } from "@/components/ems/widgets/AdvisoryActionsList";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  Download,
  Settings,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Brain,
  Network,
  Gauge,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder } from "@/types/transmission";

interface OptimizationScope {
  id: string;
  name: string;
  category: "facility" | "asset" | "process" | "substation" | "feeder" | "transformer" | "grid";
  aiModelType: "predictive" | "prescriptive" | "adaptive";
  confidenceScore: number;
  totalRecommendations: number;
  potentialSavingsKWhPerDay: number;
  potentialCostSavingsPerMonth: number;
  status: "Active" | "Learning" | "Optimized";
  lastUpdated: string;
  // Transmission-specific fields
  voltageLevel?: number;
  substationId?: string;
  feederId?: string;
  gridTopologyContext?: {
    substationName?: string;
    feederName?: string;
    region?: string;
    connectedAssets?: number;
  };
}

interface AIRecommendation {
  id: string;
  title: string;
  timeframe: "Now" | "Next shift" | "Next shutdown";
  category: "efficiency" | "scheduling" | "maintenance" | "control" | "grid_optimization" | "load_balancing" | "voltage_regulation" | "loss_reduction";
  priority: "High" | "Medium" | "Low";
  confidenceScore: number;
  savingsEstimate: number; // kWh/day
  costSavings: number; // $/month
  riskLevel: "Low" | "Medium" | "High";
  affectedAssets: string[];
  description: string;
  actionSteps: string[];
  implementationTime: string;
  requiredResources: string[];
  status: "Pending" | "In Progress" | "Completed" | "Rejected";
  // Transmission-specific fields
  gridContext?: {
    substationName?: string;
    feederName?: string;
    voltageLevel?: number;
    affectedCustomers?: number;
    gridImpact?: "Local" | "Regional" | "System-wide";
  };
  transmissionMetrics?: {
    lossReductionPct?: number;
    loadFactorImprovement?: number;
    voltageStabilityIndex?: number;
    reliabilityImprovement?: number;
  };
}

export function EnergyAnalyticsAIOptimisation() {
  const {
    energyMeters,
    energyTelemetry,
    sector,
    subsector,
    upstreamProductionContext
  } = useApp();

  const [selectedScope, setSelectedScope] = useState<OptimizationScope | null>(null);
  const [activeTab, setActiveTab] = useState("recommendations");

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  const [transmissionData, setTransmissionData] = useState<{
    substations: TxSubstation[];
    feeders: TxFeeder[];
  }>({
    substations: [],
    feeders: []
  });

  const { currentTenant } = useApp();

  // Check if we're in transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';
  const isUpstream = sector === 'oil-gas' && subsector === 'Upstream';

  useMemo(() => {
    if (isTransmission && currentTenant?.id) {
      const provider = getTransmissionProvider();
      Promise.all([
        provider.listTxSubstations({ org_id: currentTenant?.id, active: true }),
        provider.listTxFeeders({ org_id: currentTenant?.id, active: true })
      ]).then(([substations, feeders]) => {
        setTransmissionData({ substations, feeders });
      });
    }
  }, [isTransmission, currentTenant?.id]);

  // Generate optimization scopes based on sector
  const optimizationScopes: OptimizationScope[] = useMemo(() => {
    if (isTransmission) {
      // Transmission-specific optimization scopes
      return [
        {
          id: "grid-wide-ai",
          name: "Grid-Wide AI Optimization",
          category: "grid",
          aiModelType: "prescriptive",
          confidenceScore: 94,
          totalRecommendations: 15,
          potentialSavingsKWhPerDay: 850,
          potentialCostSavingsPerMonth: 3060,
          status: "Active",
          lastUpdated: "2024-12-16T12:00:00Z",
          gridTopologyContext: {
            region: "Central Region",
            connectedAssets: 45,
          }
        },
        {
          id: "substation-main-ai",
          name: "Main Substation AI Control",
          category: "substation",
          aiModelType: "adaptive",
          confidenceScore: 91,
          totalRecommendations: 12,
          potentialSavingsKWhPerDay: 420,
          potentialCostSavingsPerMonth: 1512,
          status: "Active",
          lastUpdated: "2024-12-16T11:45:00Z",
          voltageLevel: 220,
          substationId: "sub-001",
          gridTopologyContext: {
            substationName: "Main Transmission Hub",
            region: "Central",
            connectedAssets: 18,
          }
        },
        {
          id: "feeder-optimization-ai",
          name: "Feeder Load Balancing AI",
          category: "feeder",
          aiModelType: "predictive",
          confidenceScore: 88,
          totalRecommendations: 9,
          potentialSavingsKWhPerDay: 280,
          potentialCostSavingsPerMonth: 1008,
          status: "Learning",
          lastUpdated: "2024-12-16T10:30:00Z",
          voltageLevel: 132,
          feederId: "feed-001",
          gridTopologyContext: {
            substationName: "Main Transmission Hub",
            feederName: "Feeder A1",
            connectedAssets: 8,
          }
        },
        {
          id: "transformer-efficiency-ai",
          name: "Transformer Efficiency AI",
          category: "transformer",
          aiModelType: "adaptive",
          confidenceScore: 89,
          totalRecommendations: 7,
          potentialSavingsKWhPerDay: 195,
          potentialCostSavingsPerMonth: 702,
          status: "Active",
          lastUpdated: "2024-12-16T09:15:00Z",
          voltageLevel: 220,
          gridTopologyContext: {
            substationName: "Main Transmission Hub",
            connectedAssets: 3,
          }
        }
      ];
    } else {
      // Upstream (existing) optimization scopes
      return [
        {
          id: "facility-ai",
          name: "Facility-Wide AI Optimization",
          category: "facility",
          aiModelType: "prescriptive",
          confidenceScore: 92,
          totalRecommendations: 12,
          potentialSavingsKWhPerDay: 450,
          potentialCostSavingsPerMonth: 1620,
          status: "Active",
          lastUpdated: "2024-12-16T12:00:00Z"
        },
        {
          id: "compressor-ai",
          name: "Gas Compressor AI Control",
          category: "asset",
          aiModelType: "adaptive",
          confidenceScore: 88,
          totalRecommendations: 8,
          potentialSavingsKWhPerDay: 280,
          potentialCostSavingsPerMonth: 1008,
          status: "Active",
          lastUpdated: "2024-12-16T11:45:00Z"
        },
        {
          id: "production-ai",
          name: "Production Process Optimization",
          category: "process",
          aiModelType: "predictive",
          confidenceScore: 85,
          totalRecommendations: 6,
          potentialSavingsKWhPerDay: 180,
          potentialCostSavingsPerMonth: 648,
          status: "Learning",
          lastUpdated: "2024-12-16T10:30:00Z"
        }
      ];
    }
  }, [isTransmission]);

  const filteredScopes = useMemo(() => {
    let result = optimizationScopes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter(s => s.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(s => s.substationId === filters.substationId);
      }
      if (filters.feederId) {
        result = result.filter(s => s.feederId === filters.feederId);
      }
    }

    return result;
  }, [optimizationScopes, searchQuery, filters, isTransmission]);

  // Generate AI recommendations grouped by timeframe based on sector
  const aiRecommendations: AIRecommendation[] = useMemo(() => {
    if (isTransmission) {
      // Transmission-specific AI recommendations
      return [
        // Now (Immediate actions)
        {
          id: "tx-rec-001",
          title: "Optimize Transformer Tap Position for Voltage Regulation",
          timeframe: "Now",
          category: "voltage_regulation",
          priority: "High",
          confidenceScore: 96,
          savingsEstimate: 145,
          costSavings: 522,
          riskLevel: "Low",
          affectedAssets: ["TX-220-01"],
          description: "AI model detected suboptimal tap position causing voltage deviation. Adjusting tap can reduce losses by 8% and improve voltage profile.",
          actionSteps: [
            "Adjust transformer tap from position 5 to position 3",
            "Monitor voltage levels at all connection points",
            "Verify load distribution remains within limits"
          ],
          implementationTime: "10 minutes",
          requiredResources: ["Control room operator", "SCADA access"],
          status: "Pending",
          gridContext: {
            substationName: "Main Transmission Hub",
            voltageLevel: 220,
            affectedCustomers: 15000,
            gridImpact: "Regional"
          },
          transmissionMetrics: {
            lossReductionPct: 8.2,
            voltageStabilityIndex: 0.95,
            reliabilityImprovement: 2.1
          }
        },
        {
          id: "tx-rec-002",
          title: "Rebalance Feeder Loads to Minimize System Losses",
          timeframe: "Now",
          category: "load_balancing",
          priority: "Medium",
          confidenceScore: 89,
          savingsEstimate: 95,
          costSavings: 342,
          riskLevel: "Medium",
          affectedAssets: ["FEED-A1", "FEED-A2"],
          description: "Current load imbalance between feeders is causing 12% higher losses. Transferring 15MW load can optimize system efficiency.",
          actionSteps: [
            "Transfer 15MW load from Feeder A1 to Feeder A2",
            "Monitor feeder utilization levels",
            "Verify thermal limits are not exceeded"
          ],
          implementationTime: "20 minutes",
          requiredResources: ["Grid operator", "Load dispatch center"],
          status: "Pending",
          gridContext: {
            substationName: "Main Transmission Hub",
            feederName: "Feeder A1/A2",
            voltageLevel: 132,
            affectedCustomers: 8500,
            gridImpact: "Local"
          },
          transmissionMetrics: {
            lossReductionPct: 12.3,
            loadFactorImprovement: 0.15,
            reliabilityImprovement: 1.8
          }
        },

        // Next shift
        {
          id: "tx-rec-003",
          title: "Implement Predictive Capacitor Bank Switching",
          timeframe: "Next shift",
          category: "voltage_regulation",
          priority: "High",
          confidenceScore: 93,
          savingsEstimate: 125,
          costSavings: 450,
          riskLevel: "Low",
          affectedAssets: ["CAP-BANK-01", "CAP-BANK-02"],
          description: "AI forecasts reactive power demand patterns. Pre-switching capacitor banks can reduce losses and improve power factor by 18%.",
          actionSteps: [
            "Configure automatic capacitor switching schedule",
            "Set reactive power thresholds based on load forecast",
            "Enable coordinated voltage control mode"
          ],
          implementationTime: "3 hours",
          requiredResources: ["Protection engineer", "SCADA technician"],
          status: "Pending",
          gridContext: {
            substationName: "Main Transmission Hub",
            voltageLevel: 132,
            affectedCustomers: 12000,
            gridImpact: "Regional"
          },
          transmissionMetrics: {
            lossReductionPct: 18.5,
            voltageStabilityIndex: 0.98,
            reliabilityImprovement: 3.2
          }
        },
        {
          id: "tx-rec-004",
          title: "Optimize Generation Dispatch for Loss Minimization",
          timeframe: "Next shift",
          category: "grid_optimization",
          priority: "Medium",
          confidenceScore: 87,
          savingsEstimate: 85,
          costSavings: 306,
          riskLevel: "Low",
          affectedAssets: ["GEN-01", "GEN-02"],
          description: "Current generation dispatch is not optimal for transmission losses. Adjusting dispatch can reduce system losses by 6%.",
          actionSteps: [
            "Coordinate with generation dispatch center",
            "Implement loss-optimized dispatch algorithm",
            "Monitor system stability during transition"
          ],
          implementationTime: "4 hours",
          requiredResources: ["Grid operator", "Generation coordinator"],
          status: "Pending",
          gridContext: {
            voltageLevel: 400,
            affectedCustomers: 25000,
            gridImpact: "System-wide"
          },
          transmissionMetrics: {
            lossReductionPct: 6.1,
            reliabilityImprovement: 1.5
          }
        },

        // Next shutdown
        {
          id: "tx-rec-005",
          title: "Install Advanced Voltage Regulator on Transformer",
          timeframe: "Next shutdown",
          category: "voltage_regulation",
          priority: "High",
          confidenceScore: 98,
          savingsEstimate: 220,
          costSavings: 792,
          riskLevel: "Medium",
          affectedAssets: ["TX-220-01"],
          description: "Installing advanced voltage regulator with load tap changer will enable continuous voltage optimization and reduce losses by 15%.",
          actionSteps: [
            "Procure advanced voltage regulator (6-8 weeks)",
            "Schedule installation during planned outage",
            "Commission and integrate with SCADA system",
            "Train operators on new control capabilities"
          ],
          implementationTime: "2 days",
          requiredResources: ["Electrical contractor", "Commissioning engineer", "Outage crew"],
          status: "Pending",
          gridContext: {
            substationName: "Main Transmission Hub",
            voltageLevel: 220,
            affectedCustomers: 18000,
            gridImpact: "Regional"
          },
          transmissionMetrics: {
            lossReductionPct: 15.2,
            voltageStabilityIndex: 0.99,
            reliabilityImprovement: 4.5
          }
        },
        {
          id: "tx-rec-006",
          title: "Upgrade Conductor to Reduce Line Losses",
          timeframe: "Next shutdown",
          category: "loss_reduction",
          priority: "Medium",
          confidenceScore: 91,
          savingsEstimate: 165,
          costSavings: 594,
          riskLevel: "Low",
          affectedAssets: ["LINE-132-A1"],
          description: "Upgrading to high-temperature low-sag conductor will reduce line resistance by 25% and increase capacity by 40%.",
          actionSteps: [
            "Source HTLS conductor with same mechanical properties",
            "Plan conductor replacement during line outage",
            "Update protection settings for new conductor",
            "Verify thermal ratings and clearances"
          ],
          implementationTime: "3 days",
          requiredResources: ["Line crew", "Protection engineer", "Outage coordinator"],
          status: "Pending",
          gridContext: {
            voltageLevel: 132,
            affectedCustomers: 10000,
            gridImpact: "Local"
          },
          transmissionMetrics: {
            lossReductionPct: 25.0,
            reliabilityImprovement: 2.8
          }
        }
      ];
    } else {
      // Upstream (existing) AI recommendations
      return [
        // Now (Immediate actions)
        {
          id: "rec-001",
          title: "Optimize Gas Compressor Loading Sequence",
          timeframe: "Now",
          category: "control",
          priority: "High",
          confidenceScore: 94,
          savingsEstimate: 120,
          costSavings: 432,
          riskLevel: "Low",
          affectedAssets: ["GC-11"],
          description: "AI model detected suboptimal compressor loading pattern. Adjusting sequence can reduce energy consumption by 15%.",
          actionSteps: [
            "Reduce initial loading from 100% to 75%",
            "Implement gradual ramp-up over 10 minutes",
            "Monitor pressure stability during transition"
          ],
          implementationTime: "15 minutes",
          requiredResources: ["Control room operator"],
          status: "Pending"
        },
        {
          id: "rec-002",
          title: "Adjust ESP Pump Speed Based on Well Conditions",
          timeframe: "Now",
          category: "efficiency",
          priority: "Medium",
          confidenceScore: 87,
          savingsEstimate: 85,
          costSavings: 306,
          riskLevel: "Medium",
          affectedAssets: ["ESP-07"],
          description: "Current well conditions allow for 12% reduction in pump speed while maintaining production targets.",
          actionSteps: [
            "Reduce pump speed from 3500 to 3080 RPM",
            "Monitor production rate for 2 hours",
            "Adjust if production drops below 95% target"
          ],
          implementationTime: "30 minutes",
          requiredResources: ["Production engineer", "Control system access"],
          status: "Pending"
        },

        // Next shift
        {
          id: "rec-003",
          title: "Implement Predictive HVAC Scheduling",
          timeframe: "Next shift",
          category: "scheduling",
          priority: "High",
          confidenceScore: 91,
          savingsEstimate: 95,
          costSavings: 342,
          riskLevel: "Low",
          affectedAssets: ["HVAC-CAMP"],
          description: "Pre-cool facilities during off-peak hours based on weather forecast and occupancy patterns.",
          actionSteps: [
            "Configure pre-cooling schedule for 04:00-06:00",
            "Set temperature setback during peak hours",
            "Enable occupancy-based control"
          ],
          implementationTime: "2 hours",
          requiredResources: ["Facilities technician", "BMS access"],
          status: "Pending"
        },
        {
          id: "rec-004",
          title: "Optimize Transfer Pump Operation Timing",
          timeframe: "Next shift",
          category: "scheduling",
          priority: "Medium",
          confidenceScore: 83,
          savingsEstimate: 65,
          costSavings: 234,
          riskLevel: "Low",
          affectedAssets: ["P-21"],
          description: "Shift pump operation to align with optimal production windows and reduce peak demand charges.",
          actionSteps: [
            "Reschedule pump cycles to 22:00-06:00 window",
            "Implement buffer tank management",
            "Coordinate with production schedule"
          ],
          implementationTime: "4 hours",
          requiredResources: ["Operations supervisor", "Production planner"],
          status: "Pending"
        },

        // Next shutdown
        {
          id: "rec-005",
          title: "Install Variable Speed Drive on Compressor",
          timeframe: "Next shutdown",
          category: "efficiency",
          priority: "High",
          confidenceScore: 96,
          savingsEstimate: 200,
          costSavings: 720,
          riskLevel: "Medium",
          affectedAssets: ["GC-11"],
          description: "VSD installation will enable optimal speed control and reduce energy consumption by 25% during partial load conditions.",
          actionSteps: [
            "Procure VSD unit (estimated 4-6 weeks)",
            "Schedule installation during planned shutdown",
            "Commission and tune control parameters",
            "Train operators on new control system"
          ],
          implementationTime: "3 days",
          requiredResources: ["Electrical contractor", "Commissioning engineer", "Shutdown crew"],
          status: "Pending"
        },
        {
          id: "rec-006",
          title: "Upgrade ESP Motor to High-Efficiency Model",
          timeframe: "Next shutdown",
          category: "maintenance",
          priority: "Medium",
          confidenceScore: 89,
          savingsEstimate: 75,
          costSavings: 270,
          riskLevel: "Low",
          affectedAssets: ["ESP-07"],
          description: "Replace current motor with IE4 efficiency class motor to reduce energy consumption by 8%.",
          actionSteps: [
            "Source IE4 motor with same specifications",
            "Plan motor replacement during well workover",
            "Update motor protection settings",
            "Verify performance after installation"
          ],
          implementationTime: "1 day",
          requiredResources: ["Well service crew", "Electrical technician"],
          status: "Pending"
        }
      ];
    }
  }, [isTransmission]);

  // Group recommendations by timeframe
  const recommendationsByTimeframe = useMemo(() => {
    return {
      "Now": aiRecommendations.filter(rec => rec.timeframe === "Now"),
      "Next shift": aiRecommendations.filter(rec => rec.timeframe === "Next shift"),
      "Next shutdown": aiRecommendations.filter(rec => rec.timeframe === "Next shutdown")
    };
  }, [aiRecommendations]);

  // Calculate totals
  const totalSavingsKWhPerDay = aiRecommendations.reduce((sum, rec) => sum + rec.savingsEstimate, 0);
  const totalCostSavingsPerMonth = aiRecommendations.reduce((sum, rec) => sum + rec.costSavings, 0);
  const avgConfidenceScore = aiRecommendations.reduce((sum, rec) => sum + rec.confidenceScore, 0) / aiRecommendations.length;
  const highPriorityRecommendations = aiRecommendations.filter(rec => rec.priority === "High").length;

  // Generate AI model performance data based on sector
  const aiPerformanceData = useMemo(() => {
    if (isTransmission) {
      return [
        { metric: "Grid Stability", value: 95, fullMark: 100 },
        { metric: "Loss Prediction", value: 92, fullMark: 100 },
        { metric: "Load Forecasting", value: 89, fullMark: 100 },
        { metric: "Voltage Control", value: 94, fullMark: 100 },
        { metric: "Fault Detection", value: 97, fullMark: 100 },
        { metric: "Optimization", value: 91, fullMark: 100 }
      ];
    } else {
      return [
        { metric: "Accuracy", value: 92, fullMark: 100 },
        { metric: "Precision", value: 88, fullMark: 100 },
        { metric: "Recall", value: 85, fullMark: 100 },
        { metric: "Confidence", value: 90, fullMark: 100 },
        { metric: "Reliability", value: 94, fullMark: 100 },
        { metric: "Adaptability", value: 87, fullMark: 100 }
      ];
    }
  }, [isTransmission]);

  // Generate savings trend data
  const savingsTrendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));

      const baseSavings = 300 + Math.sin(i * 0.2) * 50;
      const actualSavings = baseSavings + (Math.random() - 0.5) * 40;

      return {
        date: date.toISOString().split('T')[0],
        projected: baseSavings,
        actual: actualSavings,
        cumulative: actualSavings * (i + 1)
      };
    });
  }, []);

  // Set default selected scope
  if (!selectedScope && optimizationScopes.length > 0) {
    setSelectedScope(optimizationScopes[0]);
  }

  const renderWorkPaneContent = () => {
    if (!selectedScope) return <div>Select an optimization scope to view AI recommendations</div>;

    return (
      <div className="space-y-6">
        {/* AI Advisory Actions List */}
        <AdvisoryActionsList
          actions={aiRecommendations.map(rec => ({
            id: rec.id,
            title: rec.title,
            description: rec.description,
            timeframe: rec.timeframe,
            savingsEstimate: rec.savingsEstimate,
            savingsUnit: "kWh/day" as const,
            riskLevel: rec.riskLevel,
            confidenceScore: rec.confidenceScore,
            affectedAssets: rec.affectedAssets,
            category: rec.category,
            status: rec.status === "Pending" ? "new" as const :
              rec.status === "In Progress" ? "reviewing" as const :
                rec.status === "Completed" ? "implemented" as const : "rejected" as const,
            implementationTime: rec.implementationTime
          }))}
          groupByTimeframe={true}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="performance">Model Performance</TabsTrigger>
            <TabsTrigger value="savings">Savings Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard
                title={isTransmission ? "Grid Savings Potential" : "Total Savings Potential"}
                value={totalSavingsKWhPerDay.toFixed(0)}
                unit="kWh/day"
                icon={isTransmission ? Network : Zap}
                variant="primary"
                trend="up"
                trendValue="15.2%"
              />
              <KPICard
                title="Monthly Cost Savings"
                value={`$${totalCostSavingsPerMonth.toLocaleString()}`}
                icon={DollarSign}
                variant="success"
                trend="up"
                trendValue="12.8%"
              />
              <KPICard
                title="Avg Confidence Score"
                value={`${avgConfidenceScore.toFixed(0)}%`}
                icon={Target}
                variant="primary"
              />
              <KPICard
                title={isTransmission ? "Critical Grid Actions" : "High Priority Actions"}
                value={highPriorityRecommendations}
                icon={AlertTriangle}
                variant="warning"
              />
            </div>

            {/* Recommendations by Timeframe */}
            <div className="space-y-6">
              {Object.entries(recommendationsByTimeframe).map(([timeframe, recommendations]) => (
                <Card key={timeframe}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {timeframe} ({recommendations.length} recommendations)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{rec.title}</h4>
                                <Badge variant={
                                  rec.priority === "High" ? "destructive" :
                                    rec.priority === "Medium" ? "default" : "secondary"
                                }>
                                  {rec.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {rec.confidenceScore}% confidence
                                </Badge>
                                <Badge variant={
                                  rec.riskLevel === "Low" ? "default" :
                                    rec.riskLevel === "Medium" ? "secondary" : "destructive"
                                }>
                                  {rec.riskLevel} risk
                                </Badge>
                                {isTransmission && rec.gridContext?.gridImpact && (
                                  <Badge variant="outline">
                                    <Network className="h-3 w-3 mr-1" />
                                    {rec.gridContext.gridImpact}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {rec.description}
                              </p>

                              {/* Transmission-specific grid context */}
                              {isTransmission && rec.gridContext && (
                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Network className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Grid Context</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                                    {rec.gridContext.substationName && (
                                      <div>Substation: {rec.gridContext.substationName}</div>
                                    )}
                                    {rec.gridContext.feederName && (
                                      <div>Feeder: {rec.gridContext.feederName}</div>
                                    )}
                                    {rec.gridContext.voltageLevel && (
                                      <div>Voltage: {rec.gridContext.voltageLevel}kV</div>
                                    )}
                                    {rec.gridContext.affectedCustomers && (
                                      <div>Customers: {rec.gridContext.affectedCustomers.toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Transmission metrics */}
                              {isTransmission && rec.transmissionMetrics && (
                                <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                  <div className="flex items-center gap-1 mb-1">
                                    <BarChart3 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Expected Improvements</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-green-700 dark:text-green-300">
                                    {rec.transmissionMetrics.lossReductionPct && (
                                      <div>Loss Reduction: {rec.transmissionMetrics.lossReductionPct}%</div>
                                    )}
                                    {rec.transmissionMetrics.loadFactorImprovement && (
                                      <div>Load Factor: +{rec.transmissionMetrics.loadFactorImprovement}</div>
                                    )}
                                    {rec.transmissionMetrics.voltageStabilityIndex && (
                                      <div>Voltage Stability: {rec.transmissionMetrics.voltageStabilityIndex}</div>
                                    )}
                                    {rec.transmissionMetrics.reliabilityImprovement && (
                                      <div>Reliability: +{rec.transmissionMetrics.reliabilityImprovement}%</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Savings</div>
                                  <div className="font-medium">{rec.savingsEstimate} kWh/day</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Cost Savings</div>
                                  <div className="font-medium">${rec.costSavings}/month</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Implementation</div>
                                  <div className="font-medium">{rec.implementationTime}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Affected Assets</div>
                                  <div className="font-medium">{rec.affectedAssets.join(", ")}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Activity className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Implement
                              </Button>
                            </div>
                          </div>

                          {/* Action Steps */}
                          <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                            <p className="text-sm font-medium mb-2">Action Steps:</p>
                            <ol className="text-sm text-muted-foreground space-y-1">
                              {rec.actionSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="font-medium">{index + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {isTransmission ? "Grid AI Model Performance" : "AI Model Performance Metrics"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={aiPerformanceData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Model Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {optimizationScopes.map((scope) => (
                <Card key={scope.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{scope.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model Type:</span>
                        <span className="capitalize">{scope.aiModelType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span>{scope.confidenceScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={scope.status === "Active" ? "default" : "secondary"}>
                          {scope.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recommendations:</span>
                        <span>{scope.totalRecommendations}</span>
                      </div>
                      {/* Transmission-specific context */}
                      {isTransmission && scope.gridTopologyContext && (
                        <>
                          {scope.voltageLevel && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Voltage Level:</span>
                              <span>{scope.voltageLevel}kV</span>
                            </div>
                          )}
                          {scope.gridTopologyContext.region && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Region:</span>
                              <span>{scope.gridTopologyContext.region}</span>
                            </div>
                          )}
                          {scope.gridTopologyContext.connectedAssets && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assets:</span>
                              <span>{scope.gridTopologyContext.connectedAssets}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {isTransmission ? "Grid AI Optimization Tracking (30 Days)" : "AI-Driven Savings Tracking (30 Days)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={savingsTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Savings (kWh/day)', angle: -90, position: 'insideLeft' }}
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
                        dataKey="projected"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Projected"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Actual"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Savings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard
                title={isTransmission ? "Grid Losses Avoided" : "Today's Savings"}
                value={isTransmission ? "425" : "285"}
                unit="kWh"
                icon={isTransmission ? Network : Zap}
                variant="success"
                trend="up"
                trendValue={isTransmission ? "12.5%" : "8.2%"}
              />
              <KPICard
                title="This Month"
                value={isTransmission ? "$3,850" : "$2,340"}
                icon={DollarSign}
                variant="success"
                trend="up"
                trendValue={isTransmission ? "18.3%" : "15.1%"}
              />
              <KPICard
                title="YTD Savings"
                value={isTransmission ? "$42,200" : "$28,500"}
                icon={TrendingUp}
                variant="primary"
              />
              <KPICard
                title={isTransmission ? "Grid Efficiency Gain" : "ROI on AI System"}
                value={isTransmission ? "8.5%" : "340%"}
                icon={isTransmission ? Gauge : Target}
                variant="success"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <EMSPageShell
      title={isTransmission ? "Grid AI Optimisation" : "AI Optimisation"}
      featureSetName="Energy Analytics & Optimisation"
      featureName={isTransmission ? "Grid AI Optimisation" : "AI Optimisation"}
      listType="scopes"
      listItems={filteredScopes}
      selectedItem={selectedScope}
      onItemSelect={(item) => {
        setSelectedScope(item as OptimizationScope);
        setActiveTab("recommendations");
      }}

      workPaneContent={renderWorkPaneContent()}
      onSearch={setSearchQuery}
      searchPlaceholder={isTransmission ? "Search grid optimization scopes..." : "Search optimization scopes..."}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showRoleFilter={isTransmission}
          showTypeFilter={false}
          showSubstationFilter={isTransmission}
          showFeederFilter={isTransmission}
        />
      }
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            {isTransmission ? "Configure Grid AI" : "Configure AI"}
          </Button>
        </div>
      }
    />
  );
}