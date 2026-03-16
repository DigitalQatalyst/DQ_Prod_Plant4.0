import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyIntensityCard } from "@/components/ems/widgets/EnergyIntensityCard";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAnalyticsProvider, TransmissionEfficiencyScope } from "@/lib/data/providers/AnalyticsProvider";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";
import {
  TrendingUp,
  Target,
  Zap,
  Leaf,
  DollarSign,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Activity,
  Gauge,
} from "lucide-react";

interface EfficiencyScope {
  id: string;
  name: string;
  category: "facility" | "asset" | "process" | "substation" | "feeder" | "transformer" | "organization";
  // Upstream KPIs
  kWhPerBBL?: number;
  co2KgPerBBL?: number;
  costPerBBL?: number;
  // Transmission KPIs
  kWhPerMWhDelivered?: number;
  lossesPct?: number;
  loadFactor?: number;
  avgPowerFactor?: number;
  utilizationPct?: number;
  benchmark: {
    kWhPerBBL?: number;
    co2KgPerBBL?: number;
    costPerBBL?: number;
    kWhPerMWhDelivered?: number;
    lossesPct?: number;
    loadFactor?: number;
    avgPowerFactor?: number;
    utilizationPct?: number;
  };
  target: {
    kWhPerBBL?: number;
    co2KgPerBBL?: number;
    costPerBBL?: number;
    kWhPerMWhDelivered?: number;
    lossesPct?: number;
    loadFactor?: number;
    avgPowerFactor?: number;
    utilizationPct?: number;
  };
  trend: "up" | "down" | "neutral";
  status: "Normal" | "Warning" | "Critical";
}

interface EfficiencyOpportunity {
  id: string;
  title: string;
  category: "equipment" | "operations" | "maintenance" | "grid_optimization" | "load_balancing";
  // Upstream savings
  savingsPotential?: number; // kWh/BBL
  costSavings?: number; // $/BBL
  co2Reduction?: number; // kg/BBL
  // Transmission savings
  savingsPotentialKWh?: number; // kWh/day
  costSavingsUSD?: number; // $/day
  co2ReductionKg?: number; // kg/day
  lossesPctReduction?: number; // % reduction in losses
  implementationCost: number;
  paybackMonths: number;
  priority: "High" | "Medium" | "Low";
  description: string;
}

export function EnergyAnalyticsEfficiencyKPIs() {
  const {
    currentTenant,
    sector,
    subsector,
    upstreamProductionContext,
    upstreamEnergyBenchmarks
  } = useApp();

  const [selectedScope, setSelectedScope] = useState<EfficiencyScope | null>(null);
  const [activeTab, setActiveTab] = useState("trends");

  const [transmissionScopes, setTransmissionScopes] = useState<TransmissionEfficiencyScope[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Check if we're in transmission mode
  const isTransmission = sector === 'power' && subsector === 'Transmission';
  const isUpstream = sector === 'oil-gas' && subsector === 'Upstream';

  // Load transmission efficiency scopes when in transmission mode
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionScopes();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionScopes = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    setError(null);

    try {
      const analyticsProvider = getAnalyticsProvider();
      const scopes = await analyticsProvider.getTransmissionEfficiencyScopes(currentTenant.id);
      setTransmissionScopes(scopes);
    } catch (err) {
      console.error('Failed to load transmission efficiency scopes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transmission data');
    } finally {
      setLoading(false);
    }
  };

  // Generate efficiency scopes based on sector
  const allEfficiencyScopes: EfficiencyScope[] = useMemo(() => {
    if (isTransmission) {
      // Convert transmission scopes to unified format
      return transmissionScopes.map(scope => ({
        id: scope.id,
        name: scope.name,
        category: scope.category,
        kWhPerMWhDelivered: scope.kWhPerMWhDelivered,
        lossesPct: scope.lossesPct,
        loadFactor: scope.loadFactor,
        avgPowerFactor: scope.avgPowerFactor,
        utilizationPct: scope.utilizationPct,
        benchmark: {
          kWhPerMWhDelivered: scope.benchmark.kWhPerMWhDelivered,
          lossesPct: scope.benchmark.lossesPct,
          loadFactor: scope.benchmark.loadFactor,
          avgPowerFactor: scope.benchmark.avgPowerFactor,
          utilizationPct: scope.benchmark.utilizationPct,
        },
        target: {
          kWhPerMWhDelivered: scope.target.kWhPerMWhDelivered,
          lossesPct: scope.target.lossesPct,
          loadFactor: scope.target.loadFactor,
          avgPowerFactor: scope.target.avgPowerFactor,
          utilizationPct: scope.target.utilizationPct,
        },
        trend: scope.trend,
        status: scope.status,
        // Add transmission metadata for filtering
        substation_id: scope.substation_id,
        feeder_id: scope.feeder_id,
        meter_role: scope.meter_role
      } as EfficiencyScope & { substation_id?: string; feeder_id?: string; meter_role?: string }));
    }

    // Upstream scopes (existing logic)
    if (!upstreamProductionContext || !upstreamEnergyBenchmarks) return [];

    const current = upstreamEnergyBenchmarks.currentPerformance;
    const industry = upstreamEnergyBenchmarks.industryAverages;
    const bestInClass = upstreamEnergyBenchmarks.bestInClass;

    return [
      {
        id: "facility-total",
        name: "Total Facility",
        category: "facility",
        kWhPerBBL: current.kWhPerBBL,
        co2KgPerBBL: current.co2KgPerBBL,
        costPerBBL: current.kWhPerBBL * 0.12, // $0.12/kWh
        benchmark: {
          kWhPerBBL: industry.kWhPerBBL,
          co2KgPerBBL: industry.co2KgPerBBL,
          costPerBBL: industry.kWhPerBBL * 0.12,
        },
        target: {
          kWhPerBBL: bestInClass.kWhPerBBL,
          co2KgPerBBL: bestInClass.co2KgPerBBL,
          costPerBBL: bestInClass.kWhPerBBL * 0.12,
        },
        trend: current.kWhPerBBL < industry.kWhPerBBL ? "down" : "up",
        status: current.kWhPerBBL <= bestInClass.kWhPerBBL ? "Normal" :
          current.kWhPerBBL <= industry.kWhPerBBL ? "Warning" : "Critical"
      },
      {
        id: "pad-a",
        name: "Pad A Operations",
        category: "asset",
        kWhPerBBL: 2.1,
        co2KgPerBBL: 0.95,
        costPerBBL: 0.25,
        benchmark: {
          kWhPerBBL: 2.8,
          co2KgPerBBL: 1.26,
          costPerBBL: 0.34,
        },
        target: {
          kWhPerBBL: 1.8,
          co2KgPerBBL: 0.81,
          costPerBBL: 0.22,
        },
        trend: "down",
        status: "Normal"
      },
      {
        id: "gas-compression",
        name: "Gas Compression",
        category: "process",
        kWhPerBBL: 0.68,
        co2KgPerBBL: 0.31,
        costPerBBL: 0.08,
        benchmark: {
          kWhPerBBL: 0.85,
          co2KgPerBBL: 0.38,
          costPerBBL: 0.10,
        },
        target: {
          kWhPerBBL: 0.55,
          co2KgPerBBL: 0.25,
          costPerBBL: 0.07,
        },
        trend: "neutral",
        status: "Warning"
      }
    ];
  }, [isTransmission, transmissionScopes, upstreamProductionContext, upstreamEnergyBenchmarks]);

  // Apply filtering and searching
  const filteredEfficiencyScopes = useMemo(() => {
    let result = allEfficiencyScopes;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query));
    }

    // Status filter
    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }

    // Transmission specific filters
    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(s => (s as any).substation_id === filters.substationId);
      }
      if (filters.feederId) {
        result = result.filter(s => (s as any).feeder_id === filters.feederId);
      }
      if (filters.role) {
        result = result.filter(s => (s as any).meter_role === filters.role);
      }
    }

    return result;
  }, [allEfficiencyScopes, searchQuery, filters, isTransmission]);

  // Set default selected scope when filteredEfficiencyScopes changes
  useEffect(() => {
    if (!selectedScope && filteredEfficiencyScopes.length > 0) {
      setSelectedScope(filteredEfficiencyScopes[0]);
    } else if (selectedScope && !filteredEfficiencyScopes.find(s => s.id === selectedScope.id)) {
      setSelectedScope(filteredEfficiencyScopes[0] || null);
    }
  }, [filteredEfficiencyScopes, selectedScope]);
  const efficiencyOpportunities: EfficiencyOpportunity[] = useMemo(() => {
    if (isTransmission) {
      return [
        {
          id: "transformer-tap-optimization",
          title: "Transformer Tap Position Optimization",
          category: "grid_optimization",
          savingsPotentialKWh: 2400,
          costSavingsUSD: 288,
          co2ReductionKg: 1080,
          lossesPctReduction: 0.8,
          implementationCost: 15000,
          paybackMonths: 14,
          priority: "High",
          description: "Optimize transformer tap positions to reduce losses and improve voltage regulation across the transmission network"
        },
        {
          id: "feeder-load-balancing",
          title: "Feeder Load Balancing",
          category: "load_balancing",
          savingsPotentialKWh: 1800,
          costSavingsUSD: 216,
          co2ReductionKg: 810,
          lossesPctReduction: 0.6,
          implementationCost: 8000,
          paybackMonths: 10,
          priority: "High",
          description: "Balance loads across feeders to reduce losses and improve system efficiency"
        },
        {
          id: "capacitor-bank-optimization",
          title: "Capacitor Bank Switching Optimization",
          category: "equipment",
          savingsPotentialKWh: 1200,
          costSavingsUSD: 144,
          co2ReductionKg: 540,
          implementationCost: 12000,
          paybackMonths: 18,
          priority: "Medium",
          description: "Optimize capacitor bank switching to improve power factor and reduce reactive power losses"
        },
        {
          id: "conductor-upgrade",
          title: "High-Loss Conductor Replacement",
          category: "equipment",
          savingsPotentialKWh: 3600,
          costSavingsUSD: 432,
          co2ReductionKg: 1620,
          lossesPctReduction: 1.2,
          implementationCost: 45000,
          paybackMonths: 28,
          priority: "Medium",
          description: "Replace aging conductors on high-loss transmission lines with modern low-resistance alternatives"
        }
      ];
    }

    // Upstream opportunities (existing logic)
    return [
      {
        id: "esp-optimization",
        title: "ESP Pump Speed Optimization",
        category: "equipment",
        savingsPotential: 0.15,
        costSavings: 0.018,
        co2Reduction: 0.068,
        implementationCost: 5000,
        paybackMonths: 8,
        priority: "High",
        description: "Optimize ESP pump speeds based on well conditions to reduce energy consumption while maintaining production"
      },
      {
        id: "compressor-staging",
        title: "Compressor Load Staging",
        category: "operations",
        savingsPotential: 0.22,
        costSavings: 0.026,
        co2Reduction: 0.099,
        implementationCost: 12000,
        paybackMonths: 12,
        priority: "High",
        description: "Implement intelligent load staging for gas compressors to operate closer to optimal efficiency points"
      },
      {
        id: "motor-maintenance",
        title: "Motor Efficiency Maintenance",
        category: "maintenance",
        savingsPotential: 0.08,
        costSavings: 0.010,
        co2Reduction: 0.036,
        implementationCost: 3000,
        paybackMonths: 6,
        priority: "Medium",
        description: "Preventive maintenance program for electric motors to maintain peak efficiency"
      },
      {
        id: "power-factor-correction",
        title: "Power Factor Correction",
        category: "equipment",
        savingsPotential: 0.12,
        costSavings: 0.014,
        co2Reduction: 0.054,
        implementationCost: 8000,
        paybackMonths: 10,
        priority: "Medium",
        description: "Install power factor correction equipment to reduce reactive power consumption"
      }
    ];
  }, [isTransmission]);

  // Generate trend data for efficiency over time based on sector
  const efficiencyTrendData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    if (isTransmission) {
      return days.map((date, i) => ({
        date,
        actual: 2.8 + (Math.sin(i * 0.15) * 0.2) + (Math.random() - 0.5) * 0.1, // Losses %
        target: 2.2,
        industry: 3.5,
      }));
    }

    // Upstream trend data (existing logic)
    return days.map((date, i) => ({
      date,
      actual: 2.78 + (Math.sin(i * 0.2) * 0.15) + (Math.random() - 0.5) * 0.1,
      target: 2.1,
      industry: 3.2,
    }));
  }, [isTransmission]);

  const renderWorkPaneContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading efficiency data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={loadTransmissionScopes}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (allEfficiencyScopes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No efficiency scopes available</p>
            <p className="text-sm text-muted-foreground mt-2">
              {isTransmission ? 'No transmission efficiency data found' : 'No efficiency data found'}
            </p>
          </div>
        </div>
      );
    }

    if (!selectedScope) {
      return <div>Select a scope to view efficiency KPIs</div>;
    }

    return (
      <div className="space-y-6">
        {/* Energy Intensity Cards - Different for transmission vs upstream */}
        {isTransmission ? (
          <EnergyIntensityCard
            metrics={[
              {
                type: "energy",
                value: selectedScope.kWhPerMWhDelivered || 0,
                unit: "kWh/MWh",
                benchmark: selectedScope.benchmark.kWhPerMWhDelivered,
                target: selectedScope.target.kWhPerMWhDelivered,
                trend: selectedScope.trend,
                trendValue: selectedScope.trend === "down" ? "↓ 3.2%" : selectedScope.trend === "up" ? "↑ 2.1%" : "→ 0%"
              },
              {
                type: "losses",
                value: selectedScope.lossesPct || 0,
                unit: "% losses",
                benchmark: selectedScope.benchmark.lossesPct,
                target: selectedScope.target.lossesPct,
                trend: selectedScope.trend === "down" ? "up" : selectedScope.trend === "up" ? "down" : "neutral", // Inverted for losses
                trendValue: selectedScope.trend === "down" ? "↓ 0.8%" : selectedScope.trend === "up" ? "↑ 0.5%" : "→ 0%"
              },
              {
                type: "efficiency",
                value: selectedScope.loadFactor || selectedScope.avgPowerFactor || selectedScope.utilizationPct || 0,
                unit: selectedScope.loadFactor ? "load factor" : selectedScope.avgPowerFactor ? "power factor" : "% utilization",
                benchmark: selectedScope.benchmark.loadFactor || selectedScope.benchmark.avgPowerFactor || selectedScope.benchmark.utilizationPct,
                target: selectedScope.target.loadFactor || selectedScope.target.avgPowerFactor || selectedScope.target.utilizationPct,
                trend: selectedScope.trend,
                trendValue: selectedScope.trend === "down" ? "↓ 2.1%" : selectedScope.trend === "up" ? "↑ 1.8%" : "→ 0%"
              }
            ]}
            productionUnit={selectedScope.category === "organization" ? "System" : selectedScope.category === "substation" ? "Substation" : "Feeder"}
            title="Transmission Efficiency Metrics"
            showBenchmarks={true}
          />
        ) : (
          <EnergyIntensityCard
            metrics={[
              {
                type: "energy",
                value: selectedScope.kWhPerBBL || 0,
                unit: "kWh",
                benchmark: selectedScope.benchmark.kWhPerBBL,
                target: selectedScope.target.kWhPerBBL,
                trend: selectedScope.trend,
                trendValue: selectedScope.trend === "down" ? "↓ 5.2%" : selectedScope.trend === "up" ? "↑ 3.1%" : "→ 0%"
              },
              {
                type: "carbon",
                value: selectedScope.co2KgPerBBL || 0,
                unit: "kg CO₂",
                benchmark: selectedScope.benchmark.co2KgPerBBL,
                target: selectedScope.target.co2KgPerBBL,
                trend: selectedScope.trend,
                trendValue: selectedScope.trend === "down" ? "↓ 4.8%" : selectedScope.trend === "up" ? "↑ 2.9%" : "→ 0%"
              },
              {
                type: "cost",
                value: selectedScope.costPerBBL || 0,
                unit: "$",
                benchmark: selectedScope.benchmark.costPerBBL,
                target: selectedScope.target.costPerBBL,
                trend: selectedScope.trend,
                trendValue: selectedScope.trend === "down" ? "↓ 6.1%" : selectedScope.trend === "up" ? "↑ 3.5%" : "→ 0%"
              }
            ]}
            productionUnit="BBL"
            title="Energy Intensity Metrics"
            showBenchmarks={true}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Efficiency Trends</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmark Comparison</TabsTrigger>
            <TabsTrigger value="opportunities">Top Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {isTransmission ? "Grid Losses Trend (30 Days)" : "Energy Intensity Trend (30 Days)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: isTransmission ? "Losses %" : "kWh/BBL",
                          angle: -90,
                          position: 'insideLeft'
                        }}
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
                        dataKey="actual"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Actual"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="industry"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        name="Industry Avg"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            {isTransmission ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="vs Industry Average"
                  value={selectedScope.benchmark.lossesPct && selectedScope.lossesPct ?
                    ((selectedScope.benchmark.lossesPct - selectedScope.lossesPct) / selectedScope.benchmark.lossesPct * 100).toFixed(1) : "0"}
                  unit="% better"
                  icon={Target}
                  trend={selectedScope.lossesPct && selectedScope.benchmark.lossesPct && selectedScope.lossesPct < selectedScope.benchmark.lossesPct ? "up" : "down"}
                  trendValue={selectedScope.lossesPct && selectedScope.benchmark.lossesPct && selectedScope.lossesPct < selectedScope.benchmark.lossesPct ? "Better" : "Worse"}
                  variant={selectedScope.lossesPct && selectedScope.benchmark.lossesPct && selectedScope.lossesPct < selectedScope.benchmark.lossesPct ? "success" : "warning"}
                />
                <KPICard
                  title="vs Best in Class"
                  value={selectedScope.target.lossesPct && selectedScope.lossesPct ?
                    ((selectedScope.lossesPct - selectedScope.target.lossesPct) / selectedScope.target.lossesPct * 100).toFixed(1) : "0"}
                  unit="% gap"
                  icon={TrendingUp}
                  trend={selectedScope.lossesPct && selectedScope.target.lossesPct && selectedScope.lossesPct <= selectedScope.target.lossesPct ? "up" : "down"}
                  trendValue={selectedScope.lossesPct && selectedScope.target.lossesPct && selectedScope.lossesPct <= selectedScope.target.lossesPct ? "At Target" : "Gap"}
                  variant={selectedScope.lossesPct && selectedScope.target.lossesPct && selectedScope.lossesPct <= selectedScope.target.lossesPct ? "success" : "destructive"}
                />
                <KPICard
                  title="Improvement Potential"
                  value={selectedScope.lossesPct && selectedScope.target.lossesPct ?
                    ((selectedScope.lossesPct - selectedScope.target.lossesPct) * 1000).toFixed(0) : "0"}
                  unit="kWh/day"
                  icon={Zap}
                  trend="up"
                  trendValue="Potential"
                  variant="primary"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="vs Industry Average"
                  value={selectedScope.benchmark.kWhPerBBL && selectedScope.kWhPerBBL ?
                    ((selectedScope.benchmark.kWhPerBBL - selectedScope.kWhPerBBL) / selectedScope.benchmark.kWhPerBBL * 100).toFixed(1) : "0"}
                  unit="% better"
                  icon={Target}
                  trend={selectedScope.kWhPerBBL && selectedScope.benchmark.kWhPerBBL && selectedScope.kWhPerBBL < selectedScope.benchmark.kWhPerBBL ? "up" : "down"}
                  trendValue={selectedScope.kWhPerBBL && selectedScope.benchmark.kWhPerBBL && selectedScope.kWhPerBBL < selectedScope.benchmark.kWhPerBBL ? "Better" : "Worse"}
                  variant={selectedScope.kWhPerBBL && selectedScope.benchmark.kWhPerBBL && selectedScope.kWhPerBBL < selectedScope.benchmark.kWhPerBBL ? "success" : "warning"}
                />
                <KPICard
                  title="vs Best in Class"
                  value={selectedScope.target.kWhPerBBL && selectedScope.kWhPerBBL ?
                    ((selectedScope.target.kWhPerBBL - selectedScope.kWhPerBBL) / selectedScope.target.kWhPerBBL * 100).toFixed(1) : "0"}
                  unit="% gap"
                  icon={TrendingUp}
                  trend={selectedScope.kWhPerBBL && selectedScope.target.kWhPerBBL && selectedScope.kWhPerBBL <= selectedScope.target.kWhPerBBL ? "up" : "down"}
                  trendValue={selectedScope.kWhPerBBL && selectedScope.target.kWhPerBBL && selectedScope.kWhPerBBL <= selectedScope.target.kWhPerBBL ? "At Target" : "Gap"}
                  variant={selectedScope.kWhPerBBL && selectedScope.target.kWhPerBBL && selectedScope.kWhPerBBL <= selectedScope.target.kWhPerBBL ? "success" : "destructive"}
                />
                <KPICard
                  title="Improvement Potential"
                  value={selectedScope.kWhPerBBL && selectedScope.target.kWhPerBBL && upstreamProductionContext ?
                    ((selectedScope.kWhPerBBL - selectedScope.target.kWhPerBBL) * upstreamProductionContext.barrelsPerDay).toFixed(0) : "0"}
                  unit="kWh/day"
                  icon={Zap}
                  trend="up"
                  trendValue="Potential"
                  variant="primary"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <div className="space-y-4">
              {efficiencyOpportunities.map((opportunity) => (
                <Card key={opportunity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{opportunity.title}</h4>
                          <Badge variant={
                            opportunity.priority === "High" ? "destructive" :
                              opportunity.priority === "Medium" ? "default" : "secondary"
                          }>
                            {opportunity.priority}
                          </Badge>
                          <Badge variant="outline">{opportunity.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {opportunity.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {isTransmission ? (
                            <>
                              <div>
                                <div className="text-muted-foreground">Savings Potential</div>
                                <div className="font-medium">{opportunity.savingsPotentialKWh} kWh/day</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Cost Savings</div>
                                <div className="font-medium">${opportunity.costSavingsUSD}/day</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">CO₂ Reduction</div>
                                <div className="font-medium">{opportunity.co2ReductionKg} kg/day</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Payback</div>
                                <div className="font-medium">{opportunity.paybackMonths} months</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="text-muted-foreground">Savings Potential</div>
                                <div className="font-medium">{opportunity.savingsPotential} kWh/BBL</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Cost Savings</div>
                                <div className="font-medium">${opportunity.costSavings}/BBL</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">CO₂ Reduction</div>
                                <div className="font-medium">{opportunity.co2Reduction} kg/BBL</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Payback</div>
                                <div className="font-medium">{opportunity.paybackMonths} months</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showRoleFilter={isTransmission}
      showSubstationFilter={isTransmission}
      showFeederFilter={isTransmission}
    />
  );

  return (
    <EMSPageShell
      title="Efficiency KPIs"
      featureSetName="Energy Analytics & Optimisation"
      featureName="Efficiency KPIs"
      listType="scopes"
      listItems={filteredEfficiencyScopes}
      selectedItem={selectedScope}
      onItemSelect={(item) => {
        setSelectedScope(item as EfficiencyScope);
        setActiveTab("trends");
      }}

      workPaneContent={renderWorkPaneContent()}
      searchPlaceholder={isTransmission ? "Search transmission scopes..." : "Search efficiency scopes..."}
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      sector={sector || undefined}
      subsector={subsector || undefined}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
          {isTransmission && (
            <Button variant="outline" size="sm" onClick={loadTransmissionScopes}>
              <Activity className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      }
    />
  );
}