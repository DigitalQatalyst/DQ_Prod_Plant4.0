import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyIntensityCard } from "@/components/ems/widgets/EnergyIntensityCard";
import { TrendChart } from "@/components/ems/widgets/TrendChart";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Factory,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Zap,
  Fuel,
  DollarSign,
  Leaf,
  Settings,
  Activity,
  Network,
  TrendingDownIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type {
  TxSubstation,
  TxFeeder,
  TxEnergyMeterRegistry,
} from "@/types/transmission";
import { supabase } from "@/lib/supabase";
import { getTransmissionTenantId } from "@/lib/tenantUtils";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface IntensityMetric {
  id: string;
  name: string;
  type: "energy" | "carbon" | "cost" | "transmission";
  currentValue: number;
  unit: string;
  target: number;
  benchmark: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  substationName?: string;
  feederName?: string;
}

interface IntensityDriver {
  id: string;
  name: string;
  category: "equipment" | "process" | "operational";
  impact: "high" | "medium" | "low";
  currentState: string;
  recommendation: string;
  potentialSaving: number;
  unit: string;
}

// Mock production data
const mockProductionData = {
  oilProductionBBL: 1250,
  gasProductionMSCF: 850,
  runtimeHours: 22.5,
  lastUpdated: "2024-12-16T12:00:00Z"
};

// Mock transmission delivery context
const mockTransmissionDeliveryContext = {
  mwhDelivered: 1850.5,
  mwPeak: 95.2,
  lossesMwh: 42.3,
  lossesPercentage: 2.29,
  loadFactor: 0.81,
  avgLoadMw: 77.1,
  lastUpdated: "2024-12-16T12:00:00Z"
};

export function EnergySustainabilityEnergyIntensity() {
  const {
    energyMeters,
    energyTelemetry,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedMetric, setSelectedMetric] = useState<IntensityMetric | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [transmissionData, setTransmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Determine if we're in transmission mode
  const isTransmission = sector?.toLowerCase() === 'power' && subsector?.toLowerCase() === 'transmission';
  const dataBackend = import.meta.env.VITE_DATA_BACKEND;
  const useSupabase = isTransmission && (dataBackend === 'supabase' || dataBackend === 'hybrid');

  // Fetch transmission-specific data
  useEffect(() => {
    if (!useSupabase || !currentTenant?.id) {
      return;
    }

    const fetchTransmissionIntensityData = async () => {
      setLoading(true);
      try {
        const provider = getTransmissionProvider();

        // Fetch topology data for filters
        const [substations, feeders, meters] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id, active: true }),
          provider.listTxFeeders({ active: true }),
          provider.listEnergyMetersTxScoped({ org_id: currentTenant.id, active: true })
        ]);

        // Get real tenant ID
        const realTenantId = await getTransmissionTenantId(currentTenant.id);
        console.log('[EnergyIntensity] Fetching intensive data for tenant:', realTenantId);

        // Fetch delivery context data
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('tx_delivery_context')
          .select('*')
          .eq('org_id', realTenantId)
          .eq('scope_type', 'org')
          .order('period_start', { ascending: false })
          .limit(30);

        if (deliveryError) {
          console.error('[EnergyIntensity] Error fetching delivery context:', deliveryError);
        }

        // Fetch emissions snapshots
        const { data: emissionsData, error: emissionsError } = await supabase
          .from('energy_emissions_snapshots')
          .select('*')
          .eq('org_id', realTenantId)
          .eq('scope_type', 'org')
          .order('period_start', { ascending: false })
          .limit(30);

        if (emissionsError) {
          console.error('[EnergyIntensity] Error fetching emissions:', emissionsError);
        }

        setTransmissionData({
          deliveryContext: deliveryData || [],
          emissions: emissionsData || [],
          substations: substations || []
        });
      } catch (error) {
        console.error('[EnergyIntensity] Error fetching transmission intensity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransmissionIntensityData();
  }, [useSupabase, currentTenant?.id]);

  // Calculate intensity metrics
  const intensityMetrics: IntensityMetric[] = useMemo(() => {
    let result: IntensityMetric[] = [];

    if (isTransmission) {
      // Use Supabase data if available, otherwise fall back to mock data
      const latestDelivery = useSupabase ? transmissionData?.deliveryContext?.[0] : null;
      const latestEmissions = useSupabase ? transmissionData?.emissions?.[0] : null;

      // Use real data if available, otherwise use mock data
      const totalCO2 = latestEmissions?.co2e_kg || (useSupabase ? 0 : 450000); // 450 t CO2 mock
      const mwhDelivered = latestDelivery?.mwh_delivered || mockTransmissionDeliveryContext.mwhDelivered;
      const lossesPct = latestDelivery?.losses_percentage || mockTransmissionDeliveryContext.lossesPercentage;
      const loadFactor = latestDelivery?.load_factor || mockTransmissionDeliveryContext.loadFactor;
      const co2ePerMwhDelivered = mwhDelivered > 0 ? (totalCO2 / mwhDelivered) : 0;

      console.log('[EnergyIntensity] Calculated transmission metrics:', {
        totalCO2,
        mwhDelivered,
        lossesPct,
        loadFactor,
        co2ePerMwhDelivered,
        hasRealData: !!latestDelivery,
        useSupabase
      });

      result = [
        {
          id: "co2e-per-mwh-delivered",
          name: "Carbon Intensity (Transmission)",
          type: "transmission",
          currentValue: co2ePerMwhDelivered,
          unit: "kg CO₂e/MWh",
          target: 450,
          benchmark: 500,
          trend: co2ePerMwhDelivered < 475 ? "down" : "up",
          trendPercent: Math.abs(((co2ePerMwhDelivered - 475) / 475) * 100),
          status: co2ePerMwhDelivered <= 450 ? "excellent" : co2ePerMwhDelivered <= 500 ? "good" : co2ePerMwhDelivered <= 550 ? "warning" : "critical",
          description: "Carbon emissions per MWh delivered to customers"
        },
        {
          id: "losses-percentage",
          name: "Transmission Losses",
          type: "transmission",
          currentValue: lossesPct,
          unit: "%",
          target: 2.0,
          benchmark: 2.5,
          trend: lossesPct < 2.3 ? "down" : "up",
          trendPercent: Math.abs(((lossesPct - 2.3) / 2.3) * 100),
          status: lossesPct <= 2.0 ? "excellent" : lossesPct <= 2.5 ? "good" : lossesPct <= 3.0 ? "warning" : "critical",
          description: "Energy losses as percentage of delivered energy"
        },
        {
          id: "load-factor",
          name: "System Load Factor",
          type: "transmission",
          currentValue: loadFactor * 100,
          unit: "%",
          target: 85,
          benchmark: 75,
          trend: loadFactor * 100 > 80 ? "up" : "down",
          trendPercent: Math.abs(((loadFactor * 100 - 80) / 80) * 100),
          status: loadFactor * 100 >= 85 ? "excellent" : loadFactor * 100 >= 75 ? "good" : loadFactor * 100 >= 65 ? "warning" : "critical",
          description: "Ratio of average load to peak load (higher is better)"
        },
        {
          id: "energy-efficiency",
          name: "Transmission Efficiency",
          type: "transmission",
          currentValue: 100 - lossesPct,
          unit: "%",
          target: 98.0,
          benchmark: 97.5,
          trend: (100 - lossesPct) > 97.7 ? "up" : "down",
          trendPercent: Math.abs((((100 - lossesPct) - 97.7) / 97.7) * 100),
          status: (100 - lossesPct) >= 98.0 ? "excellent" : (100 - lossesPct) >= 97.5 ? "good" : (100 - lossesPct) >= 97.0 ? "warning" : "critical",
          description: "Overall transmission system efficiency"
        }
      ];
    }
    else {
      // Original upstream metrics
      // Calculate total energy consumption and costs
      const totalKWh = energyMeters.reduce((sum, meter) => {
        const telemetry = energyTelemetry[meter.id];
        return sum + (telemetry?.kWh[telemetry.kWh.length - 1] || 0);
      }, 0);

      const totalCost = totalKWh * 0.12; // Mock cost per kWh
      const totalCO2 = totalKWh * emissionFactors.electricityKgCo2PerKWh;

      // Calculate intensity metrics
      const kWhPerBBL = totalKWh / mockProductionData.oilProductionBBL;
      const co2PerBBL = totalCO2 / mockProductionData.oilProductionBBL;
      const costPerBBL = totalCost / mockProductionData.oilProductionBBL;
      const kWhPerMSCF = totalKWh / mockProductionData.gasProductionMSCF;
      const co2PerMSCF = totalCO2 / mockProductionData.gasProductionMSCF;
      const costPerMSCF = totalCost / mockProductionData.gasProductionMSCF;

      result = [
        {
          id: "kwh-per-bbl",
          name: "Energy Intensity (Oil)",
          type: "energy",
          currentValue: kWhPerBBL,
          unit: "kWh/BBL",
          target: 45,
          benchmark: 50,
          trend: kWhPerBBL < 47 ? "down" : "up",
          trendPercent: Math.abs(((kWhPerBBL - 47) / 47) * 100),
          status: kWhPerBBL <= 45 ? "excellent" : kWhPerBBL <= 50 ? "good" : kWhPerBBL <= 55 ? "warning" : "critical",
          description: "Energy consumption per barrel of oil produced"
        },
        {
          id: "co2-per-bbl",
          name: "Carbon Intensity (Oil)",
          type: "carbon",
          currentValue: co2PerBBL,
          unit: "kg CO₂/BBL",
          target: 18,
          benchmark: 22,
          trend: co2PerBBL < 20 ? "down" : "up",
          trendPercent: Math.abs(((co2PerBBL - 20) / 20) * 100),
          status: co2PerBBL <= 18 ? "excellent" : co2PerBBL <= 22 ? "good" : co2PerBBL <= 26 ? "warning" : "critical",
          description: "Carbon emissions per barrel of oil produced"
        },
        {
          id: "cost-per-bbl",
          name: "Energy Cost Intensity (Oil)",
          type: "cost",
          currentValue: costPerBBL,
          unit: "$/BBL",
          target: 5.5,
          benchmark: 6.0,
          trend: costPerBBL < 5.8 ? "down" : "up",
          trendPercent: Math.abs(((costPerBBL - 5.8) / 5.8) * 100),
          status: costPerBBL <= 5.5 ? "excellent" : costPerBBL <= 6.0 ? "good" : costPerBBL <= 6.5 ? "warning" : "critical",
          description: "Energy cost per barrel of oil produced"
        },
        {
          id: "kwh-per-mscf",
          name: "Energy Intensity (Gas)",
          type: "energy",
          currentValue: kWhPerMSCF,
          unit: "kWh/MSCF",
          target: 65,
          benchmark: 75,
          trend: kWhPerMSCF < 70 ? "down" : "up",
          trendPercent: Math.abs(((kWhPerMSCF - 70) / 70) * 100),
          status: kWhPerMSCF <= 65 ? "excellent" : kWhPerMSCF <= 75 ? "good" : kWhPerMSCF <= 85 ? "warning" : "critical",
          description: "Energy consumption per thousand cubic feet of gas produced"
        },
        {
          id: "co2-per-mscf",
          name: "Carbon Intensity (Gas)",
          type: "carbon",
          currentValue: co2PerMSCF,
          unit: "kg CO₂/MSCF",
          target: 2.5,
          benchmark: 3.0,
          trend: co2PerMSCF < 2.8 ? "down" : "up",
          trendPercent: Math.abs(((co2PerMSCF - 2.8) / 2.8) * 100),
          status: co2PerMSCF <= 2.5 ? "excellent" : co2PerMSCF <= 3.0 ? "good" : co2PerMSCF <= 3.5 ? "warning" : "critical",
          description: "Carbon emissions per thousand cubic feet of gas produced"
        },
        {
          id: "cost-per-mscf",
          name: "Energy Cost Intensity (Gas)",
          type: "cost",
          currentValue: costPerMSCF,
          unit: "$/MSCF",
          target: 8.0,
          benchmark: 9.0,
          trend: costPerMSCF < 8.5 ? "down" : "up",
          trendPercent: Math.abs(((costPerMSCF - 8.5) / 8.5) * 100),
          status: costPerMSCF <= 8.0 ? "excellent" : costPerMSCF <= 9.0 ? "good" : costPerMSCF <= 10.0 ? "warning" : "critical",
          description: "Energy cost per thousand cubic feet of gas produced"
        }
      ];
    }

    if (filters.status) {
      result = result.filter(m => m.status === filters.status);
    }

    if (filters.type) {
      result = result.filter(m => m.type === filters.type);
    }

    console.log('[EnergyIntensity] intensityMetrics count:', result.length, {
      useSupabase,
      isTransmission,
      filters
    });

    return result;
  }, [searchQuery, filters, energyMeters, energyTelemetry, emissionFactors, isTransmission, transmissionData, useSupabase]);

  // Generate intensity drivers
  const intensityDrivers: IntensityDriver[] = useMemo(() => {
    if (isTransmission) {
      return [
        {
          id: "transformer-loading",
          name: "Transformer Loading Optimization",
          category: "equipment",
          impact: "high",
          currentState: "Transformers running at 92% capacity",
          recommendation: "Balance load across transformers to 80-85% for optimal efficiency",
          potentialSaving: 15,
          unit: "% reduction"
        },
        {
          id: "voltage-regulation",
          name: "Voltage Regulation Efficiency",
          category: "operational",
          impact: "high",
          currentState: "Frequent tap changer operations",
          recommendation: "Optimize voltage set points to reduce reactive power losses",
          potentialSaving: 12,
          unit: "% reduction"
        },
        {
          id: "line-losses",
          name: "Transmission Line Losses",
          category: "equipment",
          impact: "high",
          currentState: "Line losses at 2.3%",
          recommendation: "Implement dynamic line rating and optimize power flow",
          potentialSaving: 18,
          unit: "% reduction"
        },
        {
          id: "reactive-power",
          name: "Reactive Power Management",
          category: "operational",
          impact: "medium",
          currentState: "Power factor at 0.92",
          recommendation: "Install additional capacitor banks at key substations",
          potentialSaving: 8,
          unit: "% reduction"
        },
        {
          id: "load-balancing",
          name: "Feeder Load Balancing",
          category: "process",
          impact: "medium",
          currentState: "Uneven load distribution across feeders",
          recommendation: "Redistribute loads to balance feeder utilization",
          potentialSaving: 10,
          unit: "% reduction"
        }
      ];
    }

    return [
      {
        id: "compressor-loading",
        name: "Gas Compressor Loading",
        category: "equipment",
        impact: "high",
        currentState: "Running at 85% capacity",
        recommendation: "Optimize loading to 75-80% for better efficiency",
        potentialSaving: 12,
        unit: "% reduction"
      },
      {
        id: "pump-cycling",
        name: "ESP Pump Cycling",
        category: "equipment",
        impact: "medium",
        currentState: "Frequent start/stop cycles",
        recommendation: "Implement variable speed control",
        potentialSaving: 8,
        unit: "% reduction"
      },
      {
        id: "production-rate",
        name: "Production Rate Optimization",
        category: "process",
        impact: "high",
        currentState: "Variable production rates",
        recommendation: "Maintain steady production flow",
        potentialSaving: 15,
        unit: "% reduction"
      },
      {
        id: "maintenance-schedule",
        name: "Equipment Maintenance",
        category: "operational",
        impact: "medium",
        currentState: "Scheduled maintenance due",
        recommendation: "Perform preventive maintenance on compressors",
        potentialSaving: 6,
        unit: "% reduction"
      },
      {
        id: "power-factor",
        name: "Power Factor Correction",
        category: "equipment",
        impact: "low",
        currentState: "PF at 0.89",
        recommendation: "Install capacitor banks to improve PF to 0.95+",
        potentialSaving: 4,
        unit: "% reduction"
      }
    ];
  }, [isTransmission]);

  const filteredMetrics = useMemo(() => {
    let currentMetrics = intensityMetrics;

    // In transmission mode, we might want to filter global metrics by substations/feeders 
    // if we had per-substation metrics. For now, metrics are global org-level.
    // However, we still show the filters for UI consistency as requested.

    if (!searchQuery) return currentMetrics;
    const query = searchQuery.toLowerCase();
    return currentMetrics.filter(
      (metric) =>
        metric.name.toLowerCase().includes(query) ||
        metric.type.toLowerCase().includes(query) ||
        metric.unit.toLowerCase().includes(query)
    );
  }, [intensityMetrics, searchQuery]);

  // Generate trend data for selected metric
  const trendData = useMemo(() => {
    if (!selectedMetric) return [];

    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: selectedMetric.currentValue * (0.9 + Math.random() * 0.2),
      target: selectedMetric.target,
      benchmark: selectedMetric.benchmark
    }));
  }, [selectedMetric]);

  const listItems = filteredMetrics.map(metric => ({
    id: metric.id,
    name: metric.name,
    subtitle: `${metric.currentValue.toFixed(2)} ${metric.unit}`,
    status: metric.status,
    metadata: {
      type: metric.type,
      trend: metric.trend,
      trendPercent: metric.trendPercent
    }
  }));

  const workPaneContent = selectedMetric ? (
    <IntensityMetricDetails
      metric={selectedMetric}
      trendData={trendData}
      drivers={intensityDrivers}
    />
  ) : (
    <IntensityOverview
      metrics={intensityMetrics}
      drivers={intensityDrivers}
      sector={sector}
      subsector={subsector}
    />
  );

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showRoleFilter={false}
      showTypeFilter={true}
      statusOptions={[
        { label: "Excellent", value: "excellent" },
        { label: "Good", value: "good" },
        { label: "Warning", value: "warning" },
        { label: "Critical", value: "critical" }
      ]}
      typeOptions={[
        { label: "Energy Intensity", value: "energy" },
        { label: "Carbon Intensity", value: "carbon" },
        { label: "Cost Intensity", value: "cost" },
        { label: "Transmission Losses", value: "transmission" }
      ]}
    />
  );

  return (
    <EMSPageShell
      title="Energy Intensity"
      featureSetName="Sustainability & Emissions Tracking"
      featureName="Energy Intensity"
      listType="meters"
      listItems={listItems}
      selectedItem={selectedMetric}
      onItemSelect={(item) => {
        const metric = intensityMetrics.find(m => m.id === item.id);
        setSelectedMetric(metric || null);
      }}
      workPaneContent={workPaneContent}
      searchPlaceholder="Search intensity metrics..."
      listFilterContent={filterView}
      sector={sector || undefined}
      subsector={subsector || undefined}
      actions={
        <div className="flex flex-col gap-2">
          <Button size="sm" className="w-full gap-2">
            <Target className="w-4 h-4" />
            Set Targets
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        </div>
      }
    />
  );
}

interface IntensityMetricListItemProps {
  metric: IntensityMetric;
  isSelected: boolean;
  onClick: () => void;
}

function IntensityMetricListItem({ metric, isSelected, onClick }: IntensityMetricListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-success";
      case "good": return "text-primary";
      case "warning": return "text-warning";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "energy": return <Zap className="w-4 h-4" />;
      case "carbon": return <Leaf className="w-4 h-4" />;
      case "cost": return <DollarSign className="w-4 h-4" />;
      case "transmission": return <Network className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-secondary/50 border border-transparent"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isSelected ? "bg-primary/20" : "bg-secondary"
        )}
      >
        {getTypeIcon(metric.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {metric.name}
          </span>
          <StatusBadge status={metric.status} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{metric.description}</p>
        <div className="flex items-center justify-between text-xs">
          <span className={getStatusColor(metric.status)}>
            {metric.currentValue.toFixed(2)} {metric.unit}
          </span>
          <div className="flex items-center gap-1">
            {metric.trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-destructive" />
            ) : metric.trend === "down" ? (
              <TrendingDown className="w-3 h-3 text-success" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            )}
            <span className="text-muted-foreground">{metric.trendPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}

interface IntensityMetricDetailsProps {
  metric: IntensityMetric;
  trendData: any[];
  drivers: IntensityDriver[];
}

function IntensityMetricDetails({ metric, trendData, drivers }: IntensityMetricDetailsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "excellent": return "success";
      case "good": return "primary";
      case "warning": return "warning";
      case "critical": return "destructive";
      default: return "default";
    }
  };

  const relatedDrivers = drivers.filter(driver =>
    (metric.type === "energy" && driver.category === "equipment") ||
    (metric.type === "carbon" && driver.impact === "high") ||
    (metric.type === "cost" && driver.category !== "operational")
  );

  return (
    <div className="space-y-6">
      {/* Metric KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Current Value"
          value={`${metric.currentValue.toFixed(2)} ${metric.unit}`}
          subtitle="Latest measurement"
          icon={Activity}
          variant={getStatusVariant(metric.status) as any}
        />
        <KPICard
          title="Target"
          value={`${metric.target.toFixed(2)} ${metric.unit}`}
          subtitle="Performance target"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="Benchmark"
          value={`${metric.benchmark.toFixed(2)} ${metric.unit}`}
          subtitle="Industry benchmark"
          icon={BarChart3}
          variant="default"
        />
        <KPICard
          title="Performance"
          value={metric.currentValue <= metric.target ? "On Target" : "Above Target"}
          subtitle={`${((metric.currentValue - metric.target) / metric.target * 100).toFixed(1)}% vs target`}
          icon={metric.currentValue <= metric.target ? CheckCircle : AlertTriangle}
          variant={metric.currentValue <= metric.target ? "success" : "warning"}
        />
      </div>

      {/* Benchmark Bands */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Bands</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-success">Excellent</p>
              <p className="text-xs text-muted-foreground">≤ {metric.target} {metric.unit}</p>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Target Range
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-primary">Good</p>
              <p className="text-xs text-muted-foreground">{metric.target} - {metric.benchmark} {metric.unit}</p>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Acceptable Range
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-warning">Warning</p>
              <p className="text-xs text-muted-foreground">{metric.benchmark} - {(metric.benchmark * 1.2).toFixed(1)} {metric.unit}</p>
            </div>
            <Badge variant="outline" className="text-warning border-warning">
              Needs Attention
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-destructive">Critical</p>
              <p className="text-xs text-muted-foreground">&gt; {(metric.benchmark * 1.2).toFixed(1)} {metric.unit}</p>
            </div>
            <Badge variant="outline" className="text-destructive border-destructive">
              Action Required
            </Badge>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">30-Day Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: metric.unit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(2)} ${metric.unit}`,
                  name === 'value' ? 'Actual' : name === 'target' ? 'Target' : 'Benchmark'
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Related Drivers */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Key Drivers</h3>
        <div className="space-y-3">
          {relatedDrivers.map((driver) => (
            <div key={driver.id} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{driver.name}</span>
                  <Badge variant={driver.impact === "high" ? "destructive" : driver.impact === "medium" ? "secondary" : "default"}>
                    {driver.impact} impact
                  </Badge>
                </div>
                <span className="text-sm font-bold text-success">
                  -{driver.potentialSaving}{driver.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                <p><strong>Current:</strong> {driver.currentState}</p>
                <p><strong>Recommendation:</strong> {driver.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface IntensityOverviewProps {
  metrics: IntensityMetric[];
  drivers: IntensityDriver[];
  sector: string | null;
  subsector: string | null;
}

function IntensityOverview({ metrics, drivers, sector, subsector }: IntensityOverviewProps) {
  const isTransmission = sector?.toLowerCase() === 'power' && subsector?.toLowerCase() === 'transmission';

  // Group metrics by type
  const energyMetrics = metrics.filter(m => m.type === "energy");
  const carbonMetrics = metrics.filter(m => m.type === "carbon");
  const costMetrics = metrics.filter(m => m.type === "cost");
  const transmissionMetrics = metrics.filter(m => m.type === "transmission");

  console.log('[IntensityOverview] Rendering:', {
    sector,
    subsector,
    isTransmission,
    metricsCount: metrics.length,
    transmissionMetricsCount: transmissionMetrics.length,
    energyMetricsCount: energyMetrics.length
  });

  if (isTransmission) {
    return (
      <div className="space-y-6">
        {/* Transmission Overview KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {transmissionMetrics.map((metric) => (
            <KPICard
              key={metric.id}
              title={metric.name}
              value={`${metric.currentValue.toFixed(2)} ${metric.unit}`}
              subtitle={metric.description}
              icon={Network}
              variant={metric.status === "excellent" ? "success" : metric.status === "good" ? "primary" : metric.status === "warning" ? "warning" : "destructive"}
            />
          ))}
        </div>

        {/* Transmission Performance Summary */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Transmission System Performance</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Efficiency Metrics</h4>
              {transmissionMetrics.filter(m => m.id.includes("efficiency") || m.id.includes("losses")).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">Target: {metric.target} {metric.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{metric.currentValue.toFixed(2)} {metric.unit}</p>
                    <StatusBadge status={metric.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Load & Carbon Metrics</h4>
              {transmissionMetrics.filter(m => m.id.includes("load") || m.id.includes("co2e")).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">Target: {metric.target} {metric.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{metric.currentValue.toFixed(2)} {metric.unit}</p>
                    <StatusBadge status={metric.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Intensity Drivers</h3>
          <div className="space-y-3">
            {drivers
              .sort((a, b) => b.potentialSaving - a.potentialSaving)
              .slice(0, 5)
              .map((driver) => (
                <div key={driver.id} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{driver.name}</span>
                      <Badge variant={driver.impact === "high" ? "destructive" : driver.impact === "medium" ? "secondary" : "default"}>
                        {driver.impact}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-success">
                      -{driver.potentialSaving}{driver.unit}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Current:</strong> {driver.currentState}</p>
                    <p><strong>Action:</strong> {driver.recommendation}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Transmission Context */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Grid Delivery Context</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Energy Delivered</span>
              </div>
              <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.mwhDelivered.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">MWh</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Peak Demand</span>
              </div>
              <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.mwPeak.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">MW</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDownIcon className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium">Losses</span>
              </div>
              <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.lossesMwh.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">MWh ({mockTransmissionDeliveryContext.lossesPercentage.toFixed(2)}%)</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Load Factor</span>
              </div>
              <p className="text-2xl font-bold">{(mockTransmissionDeliveryContext.loadFactor * 100).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <EnergyIntensityCard
          title="Energy Intensity"
          metrics={energyMetrics.map(m => ({
            type: m.type,
            value: m.currentValue,
            unit: m.unit,
            target: m.target,
            benchmark: m.benchmark,
            trend: m.trend === "stable" ? "neutral" : m.trend,
            trendValue: `${m.trendPercent > 0 ? '+' : ''}${m.trendPercent.toFixed(1)}%`
          }))}
        />
        <EnergyIntensityCard
          title="Carbon Intensity"
          metrics={carbonMetrics.map(m => ({
            type: m.type,
            value: m.currentValue,
            unit: m.unit,
            target: m.target,
            benchmark: m.benchmark,
            trend: m.trend === "stable" ? "neutral" : m.trend,
            trendValue: `${m.trendPercent > 0 ? '+' : ''}${m.trendPercent.toFixed(1)}%`
          }))}
        />
        <EnergyIntensityCard
          title="Cost Intensity"
          metrics={costMetrics.map(m => ({
            type: m.type,
            value: m.currentValue,
            unit: m.unit,
            target: m.target,
            benchmark: m.benchmark,
            trend: m.trend === "stable" ? "neutral" : m.trend,
            trendValue: `${m.trendPercent > 0 ? '+' : ''}${m.trendPercent.toFixed(1)}%`
          }))}
        />
      </div>

      {/* Performance Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Oil Production Metrics</h4>
            {metrics.filter(m => m.name.includes("Oil")).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{metric.name}</p>
                  <p className="text-xs text-muted-foreground">Target: {metric.target} {metric.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{metric.currentValue.toFixed(2)} {metric.unit}</p>
                  <StatusBadge status={metric.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Gas Production Metrics</h4>
            {metrics.filter(m => m.name.includes("Gas")).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{metric.name}</p>
                  <p className="text-xs text-muted-foreground">Target: {metric.target} {metric.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{metric.currentValue.toFixed(2)} {metric.unit}</p>
                  <StatusBadge status={metric.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Drivers */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Intensity Drivers</h3>
        <div className="space-y-3">
          {drivers
            .sort((a, b) => b.potentialSaving - a.potentialSaving)
            .slice(0, 5)
            .map((driver) => (
              <div key={driver.id} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{driver.name}</span>
                    <Badge variant={driver.impact === "high" ? "destructive" : driver.impact === "medium" ? "secondary" : "default"}>
                      {driver.impact}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-success">
                    -{driver.potentialSaving}{driver.unit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Current:</strong> {driver.currentState}</p>
                  <p><strong>Action:</strong> {driver.recommendation}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Production Context */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Production Context</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Oil Production</span>
            </div>
            <p className="text-2xl font-bold">{mockProductionData.oilProductionBBL}</p>
            <p className="text-xs text-muted-foreground">BBL/day</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Gas Production</span>
            </div>
            <p className="text-2xl font-bold">{mockProductionData.gasProductionMSCF}</p>
            <p className="text-xs text-muted-foreground">MSCF/day</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Runtime</span>
            </div>
            <p className="text-2xl font-bold">{mockProductionData.runtimeHours}</p>
            <p className="text-xs text-muted-foreground">hours/day</p>
          </div>
        </div>
      </div>
    </div>
  );
}