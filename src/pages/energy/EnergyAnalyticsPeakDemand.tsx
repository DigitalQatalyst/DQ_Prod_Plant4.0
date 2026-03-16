import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { PeakDemandPanel } from "@/components/ems/widgets/PeakDemandPanel";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Download,
  Settings,
  Calendar,
  BarChart3,
  Activity,
  Building2,
  Gauge,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getAnalyticsProvider } from "@/lib/data/providers/AnalyticsProvider";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxDemandWindowWithCalculations, TxSubstation, TxFeeder, TxEnergyMeterRegistry } from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface PeakDemandScope {
  id: string;
  name: string;
  category: "facility" | "asset" | "feeder" | "substation";
  currentDemandKW: number;
  peakLimitKW: number;
  utilizationPct: number;
  status: "Normal" | "Warning" | "Critical";
  timeToLimit: string;
  linkedMeters: string[];
  lastPeakTime: string;
  peakCause: string;
  // Transmission-specific fields
  substationId?: string;
  feederId?: string;
  demandChargeRate?: number;
  estimatedMonthlyCost?: number;
}

interface LoadShiftingWindow {
  id: string;
  startTime: string;
  endTime: string;
  availableCapacityKW: number;
  recommendedLoads: string[];
  savingsPotential: number;
  priority: "High" | "Medium" | "Low";
  // Transmission-specific fields
  demandChargeRate?: number;
  windowType?: 'peak' | 'off_peak' | 'shoulder' | 'super_peak' | 'critical_peak';
  utilityName?: string;
  tariffCode?: string;
}

interface PeakCauseAnalysis {
  timestamp: string;
  peakKW: number;
  contributors: Array<{
    asset: string;
    contributionKW: number;
    contributionPct: number;
    reason: string;
  }>;
}

export function EnergyAnalyticsPeakDemand() {
  const {
    energyMeters,
    energyTelemetry,
    currentTenant,
    upstreamProductionContext,
    sector,
    subsector,
  } = useApp();

  const [selectedScope, setSelectedScope] = useState<PeakDemandScope | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Transmission-specific state
  const [substations, setSubstations] = useState<TxSubstation[]>([]);
  const [feeders, setFeeders] = useState<TxFeeder[]>([]);
  const [txMeters, setTxMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [demandWindows, setDemandWindows] = useState<TxDemandWindowWithCalculations[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if we're in transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Load transmission data when in transmission context
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionData();
    }
  }, [isTransmission, currentTenant?.id, filters.substationId, filters.feederId]);

  const loadTransmissionData = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    try {
      const transmissionProvider = getTransmissionProvider();
      const analyticsProvider = getAnalyticsProvider();

      // Load substations
      const substationData = await transmissionProvider.listTxSubstations({
        org_id: currentTenant.id,
        active: true
      });
      setSubstations(substationData);

      // Load feeders for selected substation
      if (filters.substationId) {
        const feederData = await transmissionProvider.listTxFeeders({
          substation_id: filters.substationId,
          active: true
        });
        setFeeders(feederData);
      }

      // Load meters
      const metersData = await transmissionProvider.listEnergyMetersTxScoped({
        org_id: currentTenant.id
      });
      setTxMeters(metersData);

      // Load demand windows with calculations
      const demandWindowData = await analyticsProvider.getDemandWindowsWithCalculations(
        currentTenant.id,
        filters.substationId || undefined,
        filters.feederId || undefined
      );
      setDemandWindows(demandWindowData);

    } catch (error) {
      console.error('Failed to load transmission data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate peak demand scopes from energy meters
  const peakDemandScopes: PeakDemandScope[] = useMemo(() => {
    if (isTransmission) {
      // Generate transmission-specific scopes
      const scopes: PeakDemandScope[] = [];

      // Add substation-level scopes
      substations.forEach(substation => {
        const substationMeters = txMeters.filter(m => m.substation_id === substation.id);

        if (substationMeters.length > 0) {
          const totalDemand = substationMeters.reduce((sum, meter) => sum + (meter.current_kw || 0), 0);
          const peakLimit = totalDemand * 1.3; // 130% of current as limit for substations
          const utilizationPct = (totalDemand / peakLimit) * 100;

          let status: "Normal" | "Warning" | "Critical";
          if (utilizationPct >= 85) status = "Critical";
          else if (utilizationPct >= 70) status = "Warning";
          else status = "Normal";

          // Find applicable demand window for cost estimation
          const currentWindow = demandWindows.find(w => w.is_current_window);
          const demandChargeRate = currentWindow?.demand_charge_rate || 50; // Default rate
          const estimatedMonthlyCost = totalDemand * demandChargeRate;

          scopes.push({
            id: substation.id,
            name: `${substation.name} Substation`,
            category: "substation",
            currentDemandKW: totalDemand,
            peakLimitKW: peakLimit,
            utilizationPct,
            status,
            timeToLimit: utilizationPct >= 85 ? "< 30 min" : utilizationPct >= 70 ? "1-2 hours" : "> 4 hours",
            linkedMeters: substationMeters.map(m => m.id),
            lastPeakTime: "2024-12-16 14:30",
            peakCause: "Transformer loading during peak hours",
            substationId: substation.id,
            demandChargeRate,
            estimatedMonthlyCost
          });
        }
      });

      // Add feeder-level scopes
      feeders.forEach(feeder => {
        const feederMeters = txMeters.filter(m => m.feeder_id === feeder.id);

        if (feederMeters.length > 0) {
          const totalDemand = feederMeters.reduce((sum, meter) => sum + (meter.current_kw || 0), 0);
          const peakLimit = totalDemand * 1.2; // 120% of current as limit for feeders
          const utilizationPct = (totalDemand / peakLimit) * 100;

          let status: "Normal" | "Warning" | "Critical";
          if (utilizationPct >= 90) status = "Critical";
          else if (utilizationPct >= 75) status = "Warning";
          else status = "Normal";

          const currentWindow = demandWindows.find(w => w.is_current_window);
          const demandChargeRate = currentWindow?.demand_charge_rate || 40; // Lower rate for feeders
          const estimatedMonthlyCost = totalDemand * demandChargeRate;

          scopes.push({
            id: feeder.id,
            name: `${feeder.name} Feeder`,
            category: "feeder",
            currentDemandKW: totalDemand,
            peakLimitKW: peakLimit,
            utilizationPct,
            status,
            timeToLimit: utilizationPct >= 90 ? "< 15 min" : utilizationPct >= 75 ? "30-60 min" : "> 2 hours",
            linkedMeters: feederMeters.map(m => m.id),
            lastPeakTime: "2024-12-16 15:45",
            peakCause: "Load transfer from adjacent feeder",
            feederId: feeder.id,
            demandChargeRate,
            estimatedMonthlyCost
          });
        }
      });

      return scopes;
    } else {
      // Original upstream logic
      return energyMeters.map(meter => {
        const telemetry = energyTelemetry[meter.id];
        const currentDemandKW = meter.currentKW;
        const peakLimitKW = currentDemandKW * 1.5; // Estimate 150% of current as limit
        const utilizationPct = (currentDemandKW / peakLimitKW) * 100;

        let status: "Normal" | "Warning" | "Critical";
        if (utilizationPct >= 90) status = "Critical";
        else if (utilizationPct >= 75) status = "Warning";
        else status = "Normal";

        const timeToLimit = utilizationPct >= 90 ? "< 1 hour" :
          utilizationPct >= 75 ? "2-4 hours" : "> 8 hours";

        let category: "facility" | "asset" | "feeder";
        if (meter.scope.includes("Facility") || meter.scope.includes("Total")) category = "facility";
        else if (meter.scope.includes("Feeder")) category = "feeder";
        else category = "asset";

        return {
          id: meter.id,
          name: `${meter.scope} Peak Demand`,
          category,
          currentDemandKW,
          peakLimitKW,
          utilizationPct,
          status,
          timeToLimit,
          linkedMeters: [meter.id],
          lastPeakTime: "2024-12-16 14:30",
          peakCause: "Compressor startup sequence"
        };
      });
    }
  }, [energyMeters, energyTelemetry, isTransmission, substations, feeders, demandWindows, txMeters]);

  const filteredScopes = useMemo(() => {
    let result = peakDemandScopes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }

    if (filters.status) {
      result = result.filter(s => s.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(s => s.substationId === filters.substationId || s.id === filters.substationId);
      }
      if (filters.feederId) {
        result = result.filter(s => s.feederId === filters.feederId || s.id === filters.feederId);
      }
    }

    return result;
  }, [peakDemandScopes, searchQuery, filters.status, filters.substationId, filters.feederId, isTransmission]);

  // Update selection if filtered out - REMOVED strictly to show overview initially
  /* 
  useEffect(() => {
    if (filteredScopes.length > 0 && (!selectedScope || !filteredScopes.find(s => s.id === selectedScope.id))) {
      setSelectedScope(filteredScopes[0]);
    }
  }, [filteredScopes, selectedScope]); 
  */

  // Generate load shifting windows
  const loadShiftingWindows: LoadShiftingWindow[] = useMemo(() => {
    if (isTransmission) {
      // Generate transmission-specific load shifting windows from demand windows
      return demandWindows.map((window, index) => {
        const isOffPeak = window.window_name === 'off_peak';
        const isShoulder = window.window_name === 'shoulder';

        let priority: "High" | "Medium" | "Low";
        let availableCapacity: number;
        let recommendedLoads: string[];

        if (isOffPeak) {
          priority = "High";
          availableCapacity = 200;
          recommendedLoads = ["Transformer cooling systems", "Capacitor bank switching", "Maintenance equipment"];
        } else if (isShoulder) {
          priority = "Medium";
          availableCapacity = 100;
          recommendedLoads = ["Non-critical protection systems", "Communication equipment"];
        } else {
          priority = "Low";
          availableCapacity = 50;
          recommendedLoads = ["Deferred maintenance", "Testing equipment"];
        }

        const savingsPotential = availableCapacity * (window.demand_charge_rate || 0);

        return {
          id: window.id,
          startTime: window.start_time.substring(0, 5), // Remove seconds
          endTime: window.end_time.substring(0, 5),
          availableCapacityKW: availableCapacity,
          recommendedLoads,
          savingsPotential,
          priority,
          demandChargeRate: window.demand_charge_rate,
          windowType: window.window_name,
          utilityName: window.utility_name,
          tariffCode: window.tariff_code
        };
      });
    } else {
      // Original upstream logic
      return [
        {
          id: "window-1",
          startTime: "22:00",
          endTime: "06:00",
          availableCapacityKW: 150,
          recommendedLoads: ["HVAC systems", "Water heating", "Battery charging"],
          savingsPotential: 1200,
          priority: "High"
        },
        {
          id: "window-2",
          startTime: "12:00",
          endTime: "14:00",
          availableCapacityKW: 75,
          recommendedLoads: ["Non-critical pumps", "Maintenance equipment"],
          savingsPotential: 450,
          priority: "Medium"
        },
        {
          id: "window-3",
          startTime: "16:00",
          endTime: "18:00",
          availableCapacityKW: 100,
          recommendedLoads: ["Deferred maintenance", "Testing equipment"],
          savingsPotential: 600,
          priority: "Medium"
        }
      ];
    }
  }, [isTransmission, demandWindows]);

  // Generate peak cause analysis
  const peakCauseAnalysis: PeakCauseAnalysis = useMemo(() => {
    if (isTransmission && selectedScope) {
      // Transmission-specific peak cause analysis
      if (selectedScope.category === "substation") {
        return {
          timestamp: "2024-12-16 14:30:00",
          peakKW: selectedScope.currentDemandKW,
          contributors: [
            {
              asset: "132kV Incomer Feeder",
              contributionKW: selectedScope.currentDemandKW * 0.45,
              contributionPct: 45.0,
              reason: "Peak load transfer from adjacent substation"
            },
            {
              asset: "33kV Distribution Feeder F1",
              contributionKW: selectedScope.currentDemandKW * 0.25,
              contributionPct: 25.0,
              reason: "Industrial customer peak demand"
            },
            {
              asset: "33kV Distribution Feeder F2",
              contributionKW: selectedScope.currentDemandKW * 0.18,
              contributionPct: 18.0,
              reason: "Residential air conditioning load"
            },
            {
              asset: "Station Service Load",
              contributionKW: selectedScope.currentDemandKW * 0.08,
              contributionPct: 8.0,
              reason: "Transformer cooling and protection systems"
            },
            {
              asset: "Other Loads",
              contributionKW: selectedScope.currentDemandKW * 0.04,
              contributionPct: 4.0,
              reason: "Auxiliary systems and losses"
            }
          ]
        };
      } else if (selectedScope.category === "feeder") {
        return {
          timestamp: "2024-12-16 15:45:00",
          peakKW: selectedScope.currentDemandKW,
          contributors: [
            {
              asset: "Industrial Customer IC-01",
              contributionKW: selectedScope.currentDemandKW * 0.60,
              contributionPct: 60.0,
              reason: "Manufacturing process peak demand"
            },
            {
              asset: "Commercial Complex CC-05",
              contributionKW: selectedScope.currentDemandKW * 0.20,
              contributionPct: 20.0,
              reason: "HVAC system peak cooling load"
            },
            {
              asset: "Residential Area RA-12",
              contributionKW: selectedScope.currentDemandKW * 0.15,
              contributionPct: 15.0,
              reason: "Coincident residential peak"
            },
            {
              asset: "Distribution Losses",
              contributionKW: selectedScope.currentDemandKW * 0.05,
              contributionPct: 5.0,
              reason: "Line losses and reactive power"
            }
          ]
        };
      }
    }

    // Original upstream logic
    return {
      timestamp: "2024-12-16 14:30:00",
      peakKW: 892.7,
      contributors: [
        {
          asset: "Gas Compressor GC-11",
          contributionKW: 425.3,
          contributionPct: 47.6,
          reason: "Startup sequence - high inrush current"
        },
        {
          asset: "ESP Pump ESP-07",
          contributionKW: 185.2,
          contributionPct: 20.7,
          reason: "Increased production demand"
        },
        {
          asset: "Transfer Pump P-21",
          contributionKW: 95.8,
          contributionPct: 10.7,
          reason: "Normal operation"
        },
        {
          asset: "Facility HVAC",
          contributionKW: 78.4,
          contributionPct: 8.8,
          reason: "Peak cooling load"
        },
        {
          asset: "Other loads",
          contributionKW: 108.0,
          contributionPct: 12.1,
          reason: "Various small loads"
        }
      ]
    };
  }, [isTransmission, selectedScope]);

  // Generate hourly demand data for charts
  const hourlyDemandData = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const baseLoad = 450 + Math.sin(hour * Math.PI / 12) * 200; // Sinusoidal pattern
      const peakMultiplier = hour >= 6 && hour <= 18 ? 1.2 : 0.8; // Higher during day
      const actualDemand = baseLoad * peakMultiplier + (Math.random() - 0.5) * 50;
      const limit = 850;

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        actualKW: actualDemand,
        limitKW: limit,
        utilizationPct: (actualDemand / limit) * 100,
        isNearLimit: actualDemand > limit * 0.85
      };
    });
  }, []);

  const renderWorkPaneContent = () => {
    if (!selectedScope) {
      // Overview Dashboard Logic
      const totalCurrentDemand = peakDemandScopes.reduce((acc, scope) => acc + (scope.currentDemandKW || 0), 0);
      const totalPeakLimit = peakDemandScopes.reduce((acc, scope) => acc + (scope.peakLimitKW || 0), 0);
      const criticalScopes = peakDemandScopes.filter(s => s.status === "Critical");
      const warningScopes = peakDemandScopes.filter(s => s.status === "Warning");
      const totalMonthlyCost = peakDemandScopes.reduce((acc, scope) => acc + (scope.estimatedMonthlyCost || 0), 0);

      // Sort by demand descending for Top Consumers
      const topConsumers = [...peakDemandScopes]
        .sort((a, b) => b.currentDemandKW - a.currentDemandKW)
        .slice(0, 5);

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={isTransmission ? "Total System Load" : "Total Peak Demand"}
              value={totalCurrentDemand.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              unit="kW"
              icon={Zap}
              variant="primary"
            />
            <KPICard
              title={isTransmission ? "Total Capacity" : "Peak Limit"}
              value={totalPeakLimit.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              unit="kW"
              icon={Activity}
              variant="default"
            />
            <KPICard
              title="Active Alerts"
              value={(criticalScopes.length + warningScopes.length).toString()}
              unit="Alerts"
              icon={AlertTriangle}
              variant={criticalScopes.length > 0 ? "destructive" : warningScopes.length > 0 ? "warning" : "success"}
              trend={criticalScopes.length > 0 || warningScopes.length > 0 ? "up" : "neutral"}
              trendValue={`${criticalScopes.length} Critical`}
            />
            {isTransmission ? (
              <KPICard
                title="Est. Monthly Cost"
                value={`$${totalMonthlyCost.toLocaleString()}`}
                unit="USD"
                icon={TrendingUp}
                variant="default"
              />
            ) : (
              <KPICard
                title="Avg Utilization"
                value={totalPeakLimit > 0 ? ((totalCurrentDemand / totalPeakLimit) * 100).toFixed(1) : "0.0"}
                unit="%"
                icon={Gauge}
                variant="default"
              />
            )}
          </div>

          {/* Top Consumers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {isTransmission ? "Highest Load Assets" : "Top Consumers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topConsumers.map((scope) => (
                  <div
                    key={scope.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedScope(scope)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${scope.category === 'substation' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                        scope.category === 'feeder' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                        {scope.category === 'substation' ? <Building2 className="h-5 w-5" /> :
                          scope.category === 'feeder' ? <Zap className="h-5 w-5" /> :
                            <Activity className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{scope.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={scope.status === "Normal" ? "outline" : scope.status === "Critical" ? "destructive" : "secondary"}>
                            {scope.status}
                          </Badge>
                          <span>•</span>
                          <span>{scope.utilizationPct.toFixed(1)}% Utilization</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{scope.currentDemandKW.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
                      <p className="text-xs text-muted-foreground">Limit: {scope.peakLimitKW.toLocaleString(undefined, { maximumFractionDigits: 0 })} kW</p>
                    </div>
                  </div>
                ))}
                {topConsumers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Active Demand Windows */}
        {isTransmission && demandWindows.length > 0 && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Active Demand Windows
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {demandWindows.map((window) => (
                  <Badge
                    key={window.id}
                    variant={window.is_current_window ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    {window.utility_name} - {window.window_name}
                    {window.is_current_window && " (Active)"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Peak Demand Panel */}
        <PeakDemandPanel
          data={{
            currentDemand: selectedScope.currentDemandKW,
            peakThreshold: selectedScope.peakLimitKW,
            monthlyPeak: selectedScope.peakLimitKW * 0.95, // Assume monthly peak is 95% of limit
            timeToThreshold: selectedScope.status === "Critical" ? 30 : selectedScope.status === "Warning" ? 120 : undefined,
            projectedPeak: selectedScope.currentDemandKW * 1.1
          }}
          loadShiftingWindows={loadShiftingWindows.map(window => ({
            startTime: window.startTime,
            endTime: window.endTime,
            potentialSavings: window.availableCapacityKW,
            description: `Shift ${window.recommendedLoads.join(", ")}`
          }))}
          unit="kW"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Peak Analysis</TabsTrigger>
            <TabsTrigger value="shifting">
              {isTransmission ? "Demand Windows" : "Load Shifting"}
            </TabsTrigger>
            <TabsTrigger value="causes">What Caused Peak?</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard
                title="Current Demand"
                value={selectedScope.currentDemandKW.toFixed(1)}
                unit="kW"
                icon={Zap}
                variant="primary"
                trend={selectedScope.utilizationPct > 75 ? "up" : "neutral"}
                trendValue={`${selectedScope.utilizationPct.toFixed(1)}%`}
              />
              <KPICard
                title={isTransmission ? "Capacity Limit" : "Peak Limit"}
                value={selectedScope.peakLimitKW.toFixed(1)}
                unit="kW"
                icon={Target}
                variant="default"
              />
              <KPICard
                title="Available Headroom"
                value={(selectedScope.peakLimitKW - selectedScope.currentDemandKW).toFixed(1)}
                unit="kW"
                icon={Activity}
                variant={selectedScope.status === "Critical" ? "destructive" : "success"}
              />
              {isTransmission && selectedScope.estimatedMonthlyCost ? (
                <KPICard
                  title="Est. Monthly Cost"
                  value={`$${selectedScope.estimatedMonthlyCost.toFixed(0)}`}
                  icon={TrendingUp}
                  variant="default"
                />
              ) : (
                <KPICard
                  title="Time to Limit"
                  value={selectedScope.timeToLimit}
                  icon={Clock}
                  variant={selectedScope.status === "Critical" ? "destructive" : "warning"}
                />
              )}
            </div>

            {/* 24-Hour Demand Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {isTransmission ? "24-Hour Demand Profile vs Capacity" : "24-Hour Demand Profile vs Limit"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyDemandData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="hour"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
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
                        dataKey="actualKW"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Actual Demand"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="limitKW"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={isTransmission ? "Capacity Limit" : "Peak Limit"}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {isTransmission ? "Utility Demand Windows & Tariff Optimization" : "Suggested Load Shifting Windows"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadShiftingWindows.map((window) => (
                    <div key={window.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{window.startTime} - {window.endTime}</h4>
                            <Badge variant={
                              window.priority === "High" ? "destructive" :
                                window.priority === "Medium" ? "default" : "secondary"
                            }>
                              {window.priority} Priority
                            </Badge>
                            {isTransmission && window.windowType && (
                              <Badge variant="outline">
                                {window.windowType.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Available capacity: {window.availableCapacityKW} kW
                          </p>
                          {isTransmission && window.utilityName && (
                            <p className="text-xs text-muted-foreground">
                              {window.utilityName} - {window.tariffCode}
                              {window.demandChargeRate && ` (${window.demandChargeRate.toFixed(2)} $/kW)`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-success">
                            ${window.savingsPotential.toFixed(0)}/month savings
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {isTransmission ? "Recommended load management:" : "Recommended loads to shift:"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {window.recommendedLoads.map((load, index) => (
                            <Badge key={index} variant="outline">
                              {load}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm">
                          {isTransmission ? "Apply Strategy" : "Apply Schedule"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="causes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Peak Demand Breakdown Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last peak: {peakCauseAnalysis.timestamp} ({peakCauseAnalysis.peakKW.toFixed(1)} kW)
                  {isTransmission && selectedScope.category === "substation" && " - Substation Level"}
                  {isTransmission && selectedScope.category === "feeder" && " - Feeder Level"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Contributors Chart */}
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakCauseAnalysis.contributors} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                          type="number"
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Contribution (kW)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="asset"
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any, name: string) => [
                            `${value.toFixed(1)} kW (${peakCauseAnalysis.contributors.find(c => c.contributionKW === value)?.contributionPct.toFixed(1)}%)`,
                            'Contribution'
                          ]}
                        />
                        <Bar
                          dataKey="contributionKW"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Contributing Factors</h4>
                    {peakCauseAnalysis.contributors.map((contributor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{contributor.asset}</p>
                          <p className="text-sm text-muted-foreground">{contributor.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{contributor.contributionKW.toFixed(1)} kW</p>
                          <p className="text-sm text-muted-foreground">{contributor.contributionPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <EMSPageShell
      title="Peak Demand"
      featureSetName="Energy Analytics & Optimisation"
      featureName="Peak Demand"
      listType="profiles"
      listItems={filteredScopes}
      selectedItem={selectedScope}
      onItemSelect={(item) => {
        setSelectedScope(item as PeakDemandScope);
        setActiveTab("analysis");
      }}

      workPaneContent={renderWorkPaneContent()}
      searchPlaceholder={isTransmission ? "Search substations, feeders, scopes..." : "Search demand scopes..."}
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showTypeFilter={false}
          showRoleFilter={isTransmission}
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
            Alert Limits
          </Button>
        </div>
      }
    />
  );
}

export default EnergyAnalyticsPeakDemand;