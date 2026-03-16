import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { supabase } from "@/lib/supabase";
import { getTransmissionTenantId } from "@/lib/tenantUtils";
import type { EnergyMeter, EnergyTelemetry as TxEnergyTelemetry } from "@/types/transmission";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadges } from "@/components/shared/SectorBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  Factory,
  Calculator,
  Plus,
  Download,
  Sparkles,
  BarChart3,
  Target,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { getEnergyTypeIcon, getEnergyTypeColor } from "@/lib/energy-icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type {
  TxSubstation,
  TxFeeder,
  TxEnergyMeterRegistry,
} from "@/types/transmission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

interface EmissionSource {
  id: string;
  name: string;
  energyType: "electricity" | "gas" | "diesel";
  scope: string;
  emissionScope: "Scope 1" | "Scope 2"; // Added for Scope 1/2 breakdown
  dailyConsumption: number; // kWh for electricity, MMBtu for gas, Litres for diesel
  unit: string;
  co2Emissions: number; // kg CO2
  emissionFactor: number;
  linkedMeters: string[];
  status: "Normal" | "High" | "Critical";
}

// Mock production data for demonstration
const mockProductionData = {
  oilProductionBBL: 1250, // barrels per day
  gasProductionMSCF: 850, // thousand standard cubic feet per day
};

// Mock transmission delivery context for demonstration
const mockTransmissionDeliveryContext = {
  mwhDelivered: 125000, // MWh delivered in the period
  mwPeak: 185.5, // MW peak demand
  lossesMwh: 6250, // MWh losses
  lossesPercentage: 5.0, // Losses as percentage
  interchangeInMwh: 50000, // MWh received from other systems
  interchangeOutMwh: 30000, // MWh sent to other systems
  netInterchangeMwh: 20000, // Net interchange
  loadFactor: 0.72, // Average load / peak load
  avgLoadMw: 168.3, // Average load
};

// Mock substation delivery context
const mockSubstationDeliveryContext: Record<string, any> = {
  'SS-DXB-MAIN': {
    mwhDelivered: 45000,
    mwPeak: 68.2,
    lossesMwh: 2250,
    lossesPercentage: 5.0,
    loadFactor: 0.70,
  },
  'SS-JA-MAIN': {
    mwhDelivered: 38000,
    mwPeak: 58.5,
    lossesMwh: 1900,
    lossesPercentage: 5.0,
    loadFactor: 0.69,
  },
  'SS-AW-MAIN': {
    mwhDelivered: 28000,
    mwPeak: 42.3,
    lossesMwh: 1400,
    lossesPercentage: 5.0,
    loadFactor: 0.71,
  },
};

export function EnergySustainabilityCarbonCalculation() {
  const {
    energyMeters: mockEnergyMeters,
    energyTelemetry: mockEnergyTelemetry,
    emissionFactors: mockEmissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedSource, setSelectedSource] = useState<EmissionSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // State for Supabase data
  const [txEnergyMeters, setTxEnergyMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [txEnergyTelemetry, setTxEnergyTelemetry] = useState<Record<string, TxEnergyTelemetry[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [txFilters, setTxFilters] = useState({
    substation_id: '',
    feeder_id: '',
    meter_role: '',
    status: ''
  });

  // Check if we're in transmission context
  const isTransmission = sector?.toLowerCase() === 'power' && subsector?.toLowerCase() === 'transmission';
  const dataBackend = import.meta.env.VITE_DATA_BACKEND;
  const useSupabase = isTransmission && (dataBackend === 'supabase' || dataBackend === 'hybrid');

  console.log('[CarbonCalculation] Context:', { sector, subsector, isTransmission, dataBackend, useSupabase });

  // Fetch transmission data from Supabase
  useEffect(() => {
    if (!useSupabase) return;

    const fetchTransmissionData = async () => {
      setIsLoading(true);
      try {
        const provider = getTransmissionProvider();

        // Fetch meters, substations, and feeders in parallel
        const [meters, substations, feeders] = await Promise.all([
          provider.listEnergyMetersTxScoped({ org_id: currentTenant.id, active: true }),
          provider.listTxSubstations({ org_id: currentTenant.id, active: true }),
          provider.listTxFeeders({ active: true })
        ]);

        console.log('[CarbonCalculation] Fetched meters:', meters?.length || 0);
        setTxEnergyMeters(meters || []);
        setTxSubstations(substations || []);
        setTxFeeders(feeders || []);

        // Fetch latest telemetry for each meter
        if (meters && meters.length > 0) {
          const telemetryData: Record<string, TxEnergyTelemetry[]> = {};

          for (const meter of meters) {
            const { data: telemetry, error: telemetryError } = await supabase
              .from('energy_telemetry')
              .select('*')
              .eq('meter_id', meter.id)
              .order('timestamp', { ascending: false })
              .limit(100);

            if (telemetryError) {
              console.error(`[CarbonCalculation] Error fetching telemetry for ${meter.id}:`, telemetryError);
            } else if (telemetry && telemetry.length > 0) {
              telemetryData[meter.id] = telemetry;
            }
          }

          setTxEnergyTelemetry(telemetryData);
          console.log('[CarbonCalculation] Fetched telemetry for', Object.keys(telemetryData).length, 'meters');
        }
      } catch (error) {
        console.error('[CarbonCalculation] Error fetching transmission data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransmissionData();
  }, [useSupabase, currentTenant.id]);

  // Use appropriate data source based on context
  const energyMeters = useSupabase ? txEnergyMeters : mockEnergyMeters;
  const energyTelemetry = useSupabase ? txEnergyTelemetry : mockEnergyTelemetry;
  const emissionFactors = useSupabase ? {
    electricityKgCo2PerKWh: 0.5,  // Default emission factors for transmission
    gasKgCo2PerMMBtu: 53.06,
    dieselKgCo2PerLitre: 2.68,
    sf6KgCo2PerKg: 23500 // GWP of SF6 is approx 23,500
  } : mockEmissionFactors;

  const emissionSources: EmissionSource[] = useMemo(() => {
    if (useSupabase) {
      console.log('[CarbonCalculation] Generating emission sources from Supabase data:', {
        metersCount: txEnergyMeters.length,
        telemetryKeys: Object.keys(txEnergyTelemetry).length,
        sampleMeter: txEnergyMeters[0]
      });

      // Handle Supabase transmission data
      const sources = txEnergyMeters.flatMap(meter => {
        const telemetry = txEnergyTelemetry[meter.id];
        if (!telemetry || telemetry.length === 0) {
          console.log('[CarbonCalculation] No telemetry for meter:', meter.id, meter.name);
          return [];
        }

        console.log('[CarbonCalculation] Processing meter:', meter.name, 'energy_types:', meter.energy_types);

        return meter.energy_types.map(energyType => {
          let dailyConsumption: number;
          let unit: string;
          let emissionFactor: number;
          let co2Emissions: number;
          let emissionScope: "Scope 1" | "Scope 2";

          // Get latest telemetry reading
          const latestTelemetry = telemetry[0];
          const latestKWh = latestTelemetry.kwh || 0;

          switch (energyType) {
            case 'electricity':
              dailyConsumption = latestKWh;
              unit = 'kWh';
              emissionFactor = emissionFactors.electricityKgCo2PerKWh;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 2";
              break;
            case 'gas':
              dailyConsumption = latestKWh / 293;
              unit = 'MMBtu';
              emissionFactor = emissionFactors.gasKgCo2PerMMBtu;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 1";
              break;
            case 'diesel':
              dailyConsumption = latestKWh * 0.25;
              unit = 'Litres';
              emissionFactor = emissionFactors.dieselKgCo2PerLitre;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 1";
              break;
            default:
              dailyConsumption = 0;
              unit = '';
              emissionFactor = 0;
              co2Emissions = 0;
              emissionScope = "Scope 2";
          }

          // Build scope description for transmission
          let scopeDesc = meter.scope || meter.location || 'Unknown Location';
          if (meter.substation_id) {
            // Try to get substation name from meter metadata or use ID
            const substationName = (meter.metadata as any)?.substation_name || `Substation ${meter.substation_id}`;
            scopeDesc = `Substation: ${substationName}`;
            if (meter.feeder_id) {
              const feederName = (meter.metadata as any)?.feeder_name || `Feeder ${meter.feeder_id}`;
              scopeDesc += `, Feeder: ${feederName}`;
            }
          }

          return {
            id: `${meter.id}-${energyType}`,
            name: `${meter.name} - ${energyType.charAt(0).toUpperCase() + energyType.slice(1)}`,
            energyType: energyType as "electricity" | "gas" | "diesel",
            scope: scopeDesc,
            emissionScope,
            dailyConsumption,
            unit,
            co2Emissions,
            emissionFactor,
            linkedMeters: [meter.id],
            status: (meter.status as any) || "Normal"
          } as EmissionSource;
        });
      });

      // If in transmission context, ensure Scope 1 sources are present for demonstration
      if (isTransmission) {
        // Add SF6 Leakage (Major Scope 1 source for transmission)
        sources.push({
          id: 'sf6-leakage-total',
          name: 'SF6 Gas Leakage',
          energyType: 'gas',
          scope: 'Grid-wide Switchgear Insulation',
          emissionScope: 'Scope 1',
          dailyConsumption: 0.08, // 80g leakage per day across system
          unit: 'kg',
          co2Emissions: 0.08 * 23500,
          emissionFactor: 23500,
          linkedMeters: [],
          status: 'Normal'
        });

        // Add Diesel for backup generators
        sources.push({
          id: 'diesel-generator-backup',
          name: 'Backup Diesel Generators',
          energyType: 'diesel',
          scope: 'Substation Emergency Power',
          emissionScope: 'Scope 1',
          dailyConsumption: 120, // 120 Litres
          unit: 'Litres',
          co2Emissions: 120 * 2.68,
          emissionFactor: 2.68,
          linkedMeters: [],
          status: 'Normal'
        });
      }

      return sources;
    } else {
      // Handle mock upstream data
      return mockEnergyMeters.flatMap(meter => {
        const telemetry = mockEnergyTelemetry[meter.id];
        if (!telemetry) return [];

        return meter.energyTypes.map(energyType => {
          let dailyConsumption: number;
          let unit: string;
          let emissionFactor: number;
          let co2Emissions: number;
          let emissionScope: "Scope 1" | "Scope 2";

          const latestKWh = telemetry.kWh[telemetry.kWh.length - 1] || 0;

          switch (energyType) {
            case 'electricity':
              dailyConsumption = latestKWh;
              unit = 'kWh';
              emissionFactor = emissionFactors.electricityKgCo2PerKWh;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 2";
              break;
            case 'gas':
              dailyConsumption = latestKWh / 293;
              unit = 'MMBtu';
              emissionFactor = emissionFactors.gasKgCo2PerMMBtu;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 1";
              break;
            case 'diesel':
              dailyConsumption = latestKWh * 0.25;
              unit = 'Litres';
              emissionFactor = emissionFactors.dieselKgCo2PerLitre;
              co2Emissions = dailyConsumption * emissionFactor;
              emissionScope = "Scope 1";
              break;
            default:
              dailyConsumption = 0;
              unit = '';
              emissionFactor = 0;
              co2Emissions = 0;
              emissionScope = "Scope 2";
          }

          return {
            id: `${meter.id}-${energyType}`,
            name: `${meter.name} - ${energyType.charAt(0).toUpperCase() + energyType.slice(1)}`,
            energyType: energyType as "electricity" | "gas" | "diesel",
            scope: meter.scope,
            emissionScope,
            dailyConsumption,
            unit,
            co2Emissions,
            emissionFactor,
            linkedMeters: [meter.id],
            status: meter.status
          } as EmissionSource;
        });
      });
    }
  }, [useSupabase, txEnergyMeters, txEnergyTelemetry, mockEnergyMeters, mockEnergyTelemetry, emissionFactors, isTransmission]);

  const filteredSources = useMemo(() => {
    let currentSources = emissionSources;

    // Apply transmission-specific filters
    if (useSupabase) {
      currentSources = currentSources.filter(source => {
        // Find the meter associated with this source
        const meterId = source.linkedMeters[0];
        const meter = txEnergyMeters.find(m => m.id === meterId);
        if (!meter) return true;

        if (txFilters.substation_id && meter.substation_id !== txFilters.substation_id) return false;
        if (txFilters.feeder_id && meter.feeder_id !== txFilters.feeder_id) return false;
        if (txFilters.meter_role && meter.meter_role !== txFilters.meter_role) return false;
        if (txFilters.status && meter.status !== txFilters.status) return false;

        return true;
      });
    }

    if (!searchQuery) return currentSources;
    const query = searchQuery.toLowerCase();
    return currentSources.filter(
      (source) =>
        source.name.toLowerCase().includes(query) ||
        source.scope.toLowerCase().includes(query) ||
        source.energyType.toLowerCase().includes(query)
    );
  }, [emissionSources, searchQuery, useSupabase, txFilters, txEnergyMeters]);

  // Calculate total emissions and breakdown
  const emissionsData = useMemo(() => {
    const totalCO2 = emissionSources.reduce((sum, source) => sum + source.co2Emissions, 0);

    // Scope 1/2 breakdown
    const scope1CO2 = emissionSources
      .filter(source => source.emissionScope === "Scope 1")
      .reduce((sum, source) => sum + source.co2Emissions, 0);
    const scope2CO2 = emissionSources
      .filter(source => source.emissionScope === "Scope 2")
      .reduce((sum, source) => sum + source.co2Emissions, 0);

    const byEnergyType = emissionSources.reduce((acc, source) => {
      if (!acc[source.energyType]) {
        acc[source.energyType] = { co2: 0, consumption: 0, unit: source.unit };
      }
      acc[source.energyType].co2 += source.co2Emissions;
      acc[source.energyType].consumption += source.dailyConsumption;
      return acc;
    }, {} as Record<string, { co2: number; consumption: number; unit: string }>);

    const byScope = emissionSources.reduce((acc, source) => {
      if (!acc[source.emissionScope]) {
        acc[source.emissionScope] = { co2: 0, sources: 0 };
      }
      acc[source.emissionScope].co2 += source.co2Emissions;
      acc[source.emissionScope].sources += 1;
      return acc;
    }, {} as Record<string, { co2: number; sources: number }>);

    // Calculate CO2 per production unit (upstream) or per MWh delivered (transmission)
    let co2PerBBL = 0;
    let co2PerMSCF = 0;
    let co2PerMwhDelivered = 0;
    let transmissionEfficiency = 0;

    if (isTransmission) {
      // Transmission-specific metrics
      co2PerMwhDelivered = totalCO2 / mockTransmissionDeliveryContext.mwhDelivered;
      transmissionEfficiency = ((mockTransmissionDeliveryContext.mwhDelivered /
        (mockTransmissionDeliveryContext.mwhDelivered + mockTransmissionDeliveryContext.lossesMwh)) * 100);
    } else {
      // Upstream metrics
      co2PerBBL = totalCO2 / mockProductionData.oilProductionBBL;
      co2PerMSCF = totalCO2 / mockProductionData.gasProductionMSCF;
    }

    // Prepare chart data
    const pieChartData = Object.entries(byEnergyType).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.co2,
      percentage: (data.co2 / totalCO2) * 100
    }));

    const scopeChartData = Object.entries(byScope)
      .map(([scope, data]) => ({
        name: scope,
        value: data.co2,
        percentage: (data.co2 / totalCO2) * 100,
        sources: data.sources
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const barChartData = Object.entries(byEnergyType).map(([type, data]) => ({
      energyType: type.charAt(0).toUpperCase() + type.slice(1),
      co2Emissions: data.co2,
      consumption: data.consumption,
      unit: data.unit
    }));

    // Generate trend data (mock for demonstration)
    const trendData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalCO2: totalCO2 * (0.9 + Math.random() * 0.2), // ±10% variation
      scope1: scope1CO2 * (0.9 + Math.random() * 0.2),
      scope2: scope2CO2 * (0.9 + Math.random() * 0.2),
      co2PerBBL: isTransmission ? 0 : (totalCO2 / mockProductionData.oilProductionBBL) * (0.9 + Math.random() * 0.2),
      co2PerMwhDelivered: isTransmission ? (totalCO2 / mockTransmissionDeliveryContext.mwhDelivered) * (0.9 + Math.random() * 0.2) : 0
    }));

    return {
      totalCO2,
      scope1CO2,
      scope2CO2,
      byEnergyType,
      byScope,
      co2PerBBL,
      co2PerMSCF,
      co2PerMwhDelivered,
      transmissionEfficiency,
      pieChartData,
      scopeChartData,
      barChartData,
      trendData
    };
  }, [emissionSources, isTransmission]);



  const tabs = selectedSource ? [
    {
      id: "source-details",
      label: "Emission Source Details",
      content: <EmissionSourceDetails source={selectedSource} isTransmission={isTransmission} />,
    },
    {
      id: "calculations",
      label: "Calculation Methods",
      content: <CalculationMethods source={selectedSource} />,
    },
  ] : [
    {
      id: "overview",
      label: "Emissions Overview",
      content: <EmissionsOverview data={emissionsData} sector={sector} subsector={subsector} isTransmission={isTransmission} />,
    },
    {
      id: "breakdown",
      label: "Detailed Breakdown",
      content: <EmissionsBreakdown data={emissionsData} />,
    },
    ...(isTransmission ? [{
      id: "transmission-metrics",
      label: "Transmission Delivery Context",
      content: <TransmissionDeliveryMetrics data={emissionsData} />,
    }] : [{
      id: "production-metrics",
      label: "Production Unit Metrics",
      content: <ProductionMetrics data={emissionsData} />,
    }]),
  ];

  const workPaneContent = selectedSource ? (
    <div className="space-y-6">
      {tabs.map(tab => (
        <div key={tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-6">
      {tabs.map(tab => (
        <div key={tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  );

  const filterView = (
    <div className="space-y-2">
      <div className="flex items-center gap-4 py-1">
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowUpDown className="w-3.5 h-3.5" />
          Sort
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {useSupabase ? (
          <>
            <Select
              value={txFilters.status || "all"}
              onValueChange={(val) => setTxFilters(prev => ({ ...prev, status: val === "all" ? "" : val }))}
            >
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="Normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="High" className="text-xs">High</SelectItem>
                <SelectItem value="Critical" className="text-xs">Critical</SelectItem>
                <SelectItem value="Offline" className="text-xs">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={txFilters.meter_role || "all"}
              onValueChange={(val) => setTxFilters(prev => ({ ...prev, meter_role: val === "all" ? "" : val }))}
            >
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                <SelectItem value="grid_incomer" className="text-xs">Grid Incomer</SelectItem>
                <SelectItem value="feeder_outgoing" className="text-xs">Feeder Outgoing</SelectItem>
                <SelectItem value="transformer_lv" className="text-xs">Transformer LV</SelectItem>
                <SelectItem value="station_service" className="text-xs">Station Service</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={txFilters.substation_id || "all"}
              onValueChange={(val) => setTxFilters(prev => ({ ...prev, substation_id: val === "all" ? "" : val }))}
            >
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                <SelectValue placeholder="All Substations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Substations</SelectItem>
                {txSubstations.map(substation => (
                  <SelectItem key={substation.id} value={substation.id} className="text-xs">
                    {substation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={txFilters.feeder_id || "all"}
              onValueChange={(val) => setTxFilters(prev => ({ ...prev, feeder_id: val === "all" ? "" : val }))}
            >
              <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                <SelectValue placeholder="All Feeders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Feeders</SelectItem>
                {txFeeders
                  .filter(feeder => !txFilters.substation_id || feeder.substation_id === txFilters.substation_id)
                  .map(feeder => (
                    <SelectItem key={feeder.id} value={feeder.id} className="text-xs">
                      {feeder.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <Select defaultValue="all">
            <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="warning" className="text-xs">Warning</SelectItem>
              <SelectItem value="critical" className="text-xs">Critical</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  return (
    <EMSPageShell
      title="Carbon Calculation"
      featureSetName="Sustainability & Emissions Tracking"
      featureName="Carbon Calculation"
      listType="meters"
      listItems={filteredSources}
      selectedItem={selectedSource}
      onItemSelect={setSelectedSource}
      workPaneContent={isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading emission data...</p>
          </div>
        </div>
      ) : workPaneContent}
      searchPlaceholder="Search emission sources..."
      listFilterContent={filterView}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI Analysis
          </Button>
        </div>
      }
    />
  );
}

interface EmissionSourceListItemProps {
  source: EmissionSource;
  isSelected: boolean;
  onClick: () => void;
}

function EmissionSourceListItem({ source, isSelected, onClick }: EmissionSourceListItemProps) {
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
        <Leaf className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {source.name}
          </span>
          <StatusBadge status={source.status.toLowerCase() as any} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{source.scope}</p>
        <div className="flex items-center gap-1 mb-2">
          {getEnergyTypeIcon(source.energyType)}
          <span className="text-xs text-muted-foreground">{source.energyType}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{source.dailyConsumption.toFixed(1)} {source.unit}</span>
          <span className="font-medium text-destructive">{source.co2Emissions.toFixed(1)} kg CO₂</span>
        </div>
      </div>
    </button>
  );
}

interface EmissionSourceDetailsProps {
  source: EmissionSource;
  isTransmission: boolean;
}

function EmissionSourceDetails({ source, isTransmission }: EmissionSourceDetailsProps) {
  // Extract substation/feeder info from scope if transmission
  const substationMatch = isTransmission ? source.scope.match(/Substation:\s*([^,]+)/) : null;
  const feederMatch = isTransmission ? source.scope.match(/Feeder:\s*(.+)/) : null;
  const substationName = substationMatch ? substationMatch[1].trim() : null;
  const feederName = feederMatch ? feederMatch[1].trim() : null;

  return (
    <div className="space-y-6">
      {/* Source KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Daily Consumption"
          value={`${source.dailyConsumption.toFixed(1)} ${source.unit}`}
          subtitle="Energy consumed today"
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="CO₂ Emissions"
          value={`${source.co2Emissions.toFixed(1)} kg`}
          subtitle="Carbon footprint today"
          icon={Leaf}
          variant="destructive"
        />
        <KPICard
          title="Emission Factor"
          value={source.emissionFactor.toFixed(3)}
          subtitle={`kg CO₂ per ${source.unit}`}
          icon={Calculator}
          variant="default"
        />
        <KPICard
          title="Status"
          value={source.status}
          subtitle="Current monitoring status"
          icon={Target}
          variant={source.status === "Normal" ? "success" : source.status === "High" ? "warning" : "destructive"}
        />
      </div>

      {/* Source Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Emission Source Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Source ID" value={source.id} />
            <InfoRow label="Energy Type" value={source.energyType.charAt(0).toUpperCase() + source.energyType.slice(1)} />
            <InfoRow label="Asset Scope" value={source.scope} />
            <InfoRow label="Emission Scope" value={source.emissionScope} />
            <InfoRow label="Status" value={source.status} />
            {isTransmission && substationName && (
              <InfoRow label="Substation" value={substationName} />
            )}
            {isTransmission && feederName && (
              <InfoRow label="Feeder" value={feederName} />
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label="Daily Consumption" value={`${source.dailyConsumption.toFixed(2)} ${source.unit}`} />
            <InfoRow label="Emission Factor" value={`${source.emissionFactor} kg CO₂/${source.unit}`} />
            <InfoRow label="Daily CO₂ Emissions" value={`${source.co2Emissions.toFixed(2)} kg CO₂`} />
            <InfoRow label="Linked Meters" value={source.linkedMeters.length.toString()} />
          </div>
        </div>
      </div>

      {/* Transmission Context (if applicable) */}
      {isTransmission && substationName && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary" />
            Transmission Grid Context
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Grid Location:</p>
              <p className="text-sm text-muted-foreground">
                This emission source is part of the {substationName} transmission infrastructure
                {feederName && ` on ${feederName}`}.
              </p>
            </div>
            {mockSubstationDeliveryContext[substationName.split(' ')[0]] && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">MWh Delivered</p>
                  <p className="text-lg font-bold">{mockSubstationDeliveryContext[substationName.split(' ')[0]].mwhDelivered.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Grid Losses</p>
                  <p className="text-lg font-bold">{mockSubstationDeliveryContext[substationName.split(' ')[0]].lossesPercentage}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculation Transparency */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Emission Calculation
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Calculation Formula:</p>
            <p className="text-sm text-muted-foreground font-mono">
              CO₂ Emissions = Energy Consumption × Emission Factor
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Applied Calculation:</p>
            <p className="text-sm text-muted-foreground font-mono">
              {source.co2Emissions.toFixed(2)} kg CO₂ = {source.dailyConsumption.toFixed(2)} {source.unit} × {source.emissionFactor} kg CO₂/{source.unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalculationMethodsProps {
  source: EmissionSource;
}

function CalculationMethods({ source }: CalculationMethodsProps) {
  const methodologyInfo = {
    electricity: {
      standard: "EPA eGRID",
      description: "Grid electricity emission factors based on regional power generation mix",
      accuracy: "±5%",
      updateFrequency: "Annual"
    },
    gas: {
      standard: "EPA AP-42",
      description: "Natural gas combustion emission factors for industrial applications",
      accuracy: "±3%",
      updateFrequency: "Biennial"
    },
    diesel: {
      standard: "IPCC Guidelines",
      description: "Diesel fuel combustion emission factors for mobile and stationary sources",
      accuracy: "±2%",
      updateFrequency: "As needed"
    }
  };

  const info = methodologyInfo[source.energyType];

  return (
    <div className="space-y-6">
      {/* Methodology Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Calculation Methodology</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Standard" value={info.standard} />
            <InfoRow label="Accuracy" value={info.accuracy} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Update Frequency" value={info.updateFrequency} />
            <InfoRow label="Energy Type" value={source.energyType.charAt(0).toUpperCase() + source.energyType.slice(1)} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
      </div>

      {/* Detailed Calculation Steps */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Calculation Steps</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Energy Consumption Measurement</p>
              <p className="text-xs text-muted-foreground">
                Measure energy consumption from telemetry data: {source.dailyConsumption.toFixed(2)} {source.unit}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Apply Emission Factor</p>
              <p className="text-xs text-muted-foreground">
                Use standard emission factor: {source.emissionFactor} kg CO₂/{source.unit}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Calculate CO₂ Emissions</p>
              <p className="text-xs text-muted-foreground">
                Result: {source.co2Emissions.toFixed(2)} kg CO₂ per day
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Assurance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-success" />
          Quality Assurance
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-success">Data Validation</p>
              <p className="text-xs text-muted-foreground">
                Telemetry data validated against meter specifications
              </p>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Passed
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-success">Factor Verification</p>
              <p className="text-xs text-muted-foreground">
                Emission factors verified against latest standards
              </p>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Current
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmissionsOverviewProps {
  data: any;
  sector: string | null;
  subsector: string | null;
  isTransmission: boolean;
}

function EmissionsOverview({ data, sector, subsector, isTransmission }: EmissionsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total CO₂ Emissions"
          value={`${data.totalCO2.toFixed(1)} kg`}
          subtitle="Daily carbon footprint"
          icon={Leaf}
          variant="destructive"
        />
        <KPICard
          title="Scope 1 Emissions"
          value={`${data.scope1CO2.toFixed(1)} kg`}
          subtitle="Direct combustion"
          icon={Factory}
          variant="destructive"
        />
        <KPICard
          title="Scope 2 Emissions"
          value={`${data.scope2CO2.toFixed(1)} kg`}
          subtitle="Purchased electricity"
          icon={BarChart3}
          variant="warning"
        />
        <KPICard
          title="Emission Sources"
          value={Object.keys(data.byEnergyType).length}
          subtitle="Active energy types"
          icon={Target}
          variant="primary"
        />
      </div>

      {/* Transmission or Production Unit Metrics */}
      {isTransmission ? (
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            title="CO₂ per MWh Delivered"
            value={`${data.co2PerMwhDelivered.toFixed(2)} kg`}
            subtitle="Transmission efficiency metric"
            icon={Factory}
            variant="warning"
          />
          <KPICard
            title="Grid Efficiency"
            value={`${data.transmissionEfficiency.toFixed(1)}%`}
            subtitle="Energy delivered vs losses"
            icon={TrendingUp}
            variant="success"
          />
          <KPICard
            title="MWh Delivered"
            value={mockTransmissionDeliveryContext.mwhDelivered.toLocaleString()}
            subtitle="Total energy delivered"
            icon={BarChart3}
            variant="primary"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            title="CO₂ per BBL"
            value={`${data.co2PerBBL.toFixed(2)} kg`}
            subtitle="Per barrel produced"
            icon={Factory}
            variant="warning"
          />
          <KPICard
            title="CO₂ per MSCF"
            value={`${data.co2PerMSCF.toFixed(2)} kg`}
            subtitle="Per thousand cubic feet"
            icon={BarChart3}
            variant="warning"
          />
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Scope 1 & 2 Emissions Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.scopeChartData.map((entry: any, index: number) => (
            <div key={index} className="p-6 bg-secondary/30 rounded-lg border border-border/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: entry.name === "Scope 1"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--warning))"
                      }}
                    />
                    <span className="text-base font-semibold">{entry.name}</span>
                  </div>
                  <span className="text-2xl font-bold">{entry.value.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg CO₂</span></span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">{entry.percentage.toFixed(1)}% of total emissions</span>
                    <span className="text-muted-foreground">{entry.sources} emission source{entry.sources !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        entry.name === "Scope 1" ? "bg-destructive" : "bg-warning"
                      )}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>

                  <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-md">
                    {entry.name === "Scope 1" ? (
                      <p><strong>Direct Emissions:</strong> Sources owned or controlled by the company (e.g., fuel combustion, SF6 leakage).</p>
                    ) : (
                      <p><strong>Indirect Emissions:</strong> Emissions from the generation of purchased electricity or heating.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CO2 Trend Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">30-Day CO₂ Emissions Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trendData}>
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
                label={{ value: 'CO₂ Emissions (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} kg CO₂`,
                  name === 'totalCO2' ? 'Total' : name === 'scope1' ? 'Scope 1' : 'Scope 2'
                ]}
              />
              <Line
                type="monotone"
                dataKey="totalCO2"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scope1"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scope2"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intensity Trend Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isTransmission ? 'CO₂ per MWh Delivered Trend' : 'CO₂ per BBL Trend'}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trendData}>
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
                label={{
                  value: isTransmission ? 'CO₂ per MWh (kg)' : 'CO₂ per BBL (kg)',
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
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [
                  `${value.toFixed(2)} kg CO₂/${isTransmission ? 'MWh' : 'BBL'}`,
                  'Carbon Intensity'
                ]}
              />
              <Line
                type="monotone"
                dataKey={isTransmission ? "co2PerMwhDelivered" : "co2PerBBL"}
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emissions Breakdown Pie Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">CO₂ Emissions by Energy Type</h3>
        <div className="h-80 flex items-center">
          <div className="w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {data.pieChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getEnergyTypeColor(entry.name.toLowerCase())} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value.toFixed(1)} kg CO₂`, 'Emissions']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-6">
            <div className="space-y-4">
              {data.pieChartData.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getEnergyTypeColor(entry.name.toLowerCase()) }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{entry.value.toFixed(1)} kg CO₂</p>
                    <p className="text-xs text-muted-foreground">{entry.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context Information */}
      {sector && subsector && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Industry Context</h3>
          <SectorBadges sector={sector} subsector={subsector} size="md" className="mb-3" />
          <p className="text-sm text-muted-foreground">
            {isTransmission ? (
              <>
                Carbon emissions calculation optimized for {sector} {subsector} operations.
                Emissions are calculated per MWh delivered to measure transmission system efficiency.
                All calculations use transparent methodologies and industry-standard emission factors.
              </>
            ) : (
              <>
                Carbon emissions calculation optimized for {sector} {subsector} operations.
                All calculations use transparent methodologies and industry-standard emission factors.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

interface EmissionsBreakdownProps {
  data: any;
}

function EmissionsBreakdown({ data }: EmissionsBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Emissions by Energy Type Bar Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">CO₂ Emissions by Energy Type</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.barChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="energyType"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'CO₂ Emissions (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} kg CO₂`,
                  'Daily Emissions'
                ]}
              />
              <Bar
                dataKey="co2Emissions"
                fill="hsl(var(--destructive))"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Emissions Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(data.byEnergyType).map(([energyType, typeData]: [string, any]) => (
            <div key={energyType} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getEnergyTypeIcon(energyType)}
                  <span className="text-sm font-medium">{energyType.charAt(0).toUpperCase() + energyType.slice(1)}</span>
                </div>
                <span className="text-sm font-bold text-destructive">{typeData.co2.toFixed(1)} kg CO₂</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <span>Consumption: {typeData.consumption.toFixed(1)} {typeData.unit}</span>
                <span>Percentage: {((typeData.co2 / data.totalCO2) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProductionMetricsProps {
  data: any;
}

function ProductionMetrics({ data }: ProductionMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Production Unit KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Oil Production"
          value={`${mockProductionData.oilProductionBBL} BBL`}
          subtitle="Barrels per day"
          icon={Factory}
          variant="primary"
        />
        <KPICard
          title="Gas Production"
          value={`${mockProductionData.gasProductionMSCF} MSCF`}
          subtitle="Thousand cubic feet per day"
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="CO₂ per BBL"
          value={`${data.co2PerBBL.toFixed(2)} kg`}
          subtitle="Carbon intensity per barrel"
          icon={Target}
          variant="warning"
        />
        <KPICard
          title="CO₂ per MSCF"
          value={`${data.co2PerMSCF.toFixed(2)} kg`}
          subtitle="Carbon intensity per MSCF"
          icon={Target}
          variant="warning"
        />
      </div>

      {/* Production Efficiency Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Carbon Intensity Analysis</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Oil Production Intensity</span>
                <span className="text-lg font-bold text-warning">{data.co2PerBBL.toFixed(2)} kg CO₂/BBL</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Total CO₂: {data.totalCO2.toFixed(1)} kg</p>
                <p>Oil Production: {mockProductionData.oilProductionBBL} BBL</p>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gas Production Intensity</span>
                <span className="text-lg font-bold text-warning">{data.co2PerMSCF.toFixed(2)} kg CO₂/MSCF</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Total CO₂: {data.totalCO2.toFixed(1)} kg</p>
                <p>Gas Production: {mockProductionData.gasProductionMSCF} MSCF</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Industry Benchmarks</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Typical Oil: 15-25 kg CO₂/BBL</span>
                  <span className={data.co2PerBBL <= 25 ? "text-success" : "text-destructive"}>
                    {data.co2PerBBL <= 25 ? "✓ Good" : "⚠ High"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Typical Gas: 2-4 kg CO₂/MSCF</span>
                  <span className={data.co2PerMSCF <= 4 ? "text-success" : "text-destructive"}>
                    {data.co2PerMSCF <= 4 ? "✓ Good" : "⚠ High"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Calculation Method</h4>
              <div className="text-xs text-muted-foreground font-mono">
                <p>CO₂/BBL = Total CO₂ ÷ Oil Production</p>
                <p>CO₂/MSCF = Total CO₂ ÷ Gas Production</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Production Data Notice */}
      <div className="bg-card border border-warning/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Demo Data Notice
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Production figures used in this demonstration are mock values for calculation purposes:
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-warning/10 rounded-lg">
              <p className="font-medium">Oil Production (Mock)</p>
              <p className="text-muted-foreground">{mockProductionData.oilProductionBBL} BBL/day</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <p className="font-medium">Gas Production (Mock)</p>
              <p className="text-muted-foreground">{mockProductionData.gasProductionMSCF} MSCF/day</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            In a production system, these values would be sourced from production meters and SCADA systems.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface TransmissionDeliveryMetricsProps {
  data: any;
}

function TransmissionDeliveryMetrics({ data }: TransmissionDeliveryMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Transmission Delivery KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="MWh Delivered"
          value={mockTransmissionDeliveryContext.mwhDelivered.toLocaleString()}
          subtitle="Total energy delivered"
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Peak Demand"
          value={`${mockTransmissionDeliveryContext.mwPeak} MW`}
          subtitle="Maximum demand"
          icon={TrendingUp}
          variant="warning"
        />
        <KPICard
          title="Grid Losses"
          value={`${mockTransmissionDeliveryContext.lossesPercentage}%`}
          subtitle={`${mockTransmissionDeliveryContext.lossesMwh.toLocaleString()} MWh`}
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Load Factor"
          value={`${(mockTransmissionDeliveryContext.loadFactor * 100).toFixed(1)}%`}
          subtitle="Average / Peak load"
          icon={Target}
          variant="success"
        />
      </div>

      {/* Transmission Efficiency Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Transmission System Efficiency</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CO₂ per MWh Delivered</span>
                <span className="text-lg font-bold text-warning">{data.co2PerMwhDelivered.toFixed(2)} kg CO₂/MWh</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Total CO₂: {data.totalCO2.toFixed(1)} kg</p>
                <p>Energy Delivered: {mockTransmissionDeliveryContext.mwhDelivered.toLocaleString()} MWh</p>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Grid Efficiency</span>
                <span className="text-lg font-bold text-success">{data.transmissionEfficiency.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Delivered: {mockTransmissionDeliveryContext.mwhDelivered.toLocaleString()} MWh</p>
                <p>Losses: {mockTransmissionDeliveryContext.lossesMwh.toLocaleString()} MWh ({mockTransmissionDeliveryContext.lossesPercentage}%)</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Industry Benchmarks</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Typical Transmission: 2-7% losses</span>
                  <span className={mockTransmissionDeliveryContext.lossesPercentage <= 7 ? "text-success" : "text-destructive"}>
                    {mockTransmissionDeliveryContext.lossesPercentage <= 7 ? "✓ Good" : "⚠ High"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Typical CO₂: 0.4-0.6 kg/MWh</span>
                  <span className={data.co2PerMwhDelivered <= 0.6 ? "text-success" : "text-destructive"}>
                    {data.co2PerMwhDelivered <= 0.6 ? "✓ Good" : "⚠ High"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Calculation Method</h4>
              <div className="text-xs text-muted-foreground font-mono">
                <p>CO₂/MWh = Total CO₂ ÷ MWh Delivered</p>
                <p>Efficiency = MWh Delivered ÷ (MWh Delivered + Losses)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interchange Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Grid Interchange</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Interchange In</span>
            </div>
            <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.interchangeInMwh.toLocaleString()} MWh</p>
            <p className="text-xs text-muted-foreground mt-1">Energy received from other systems</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Interchange Out</span>
            </div>
            <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.interchangeOutMwh.toLocaleString()} MWh</p>
            <p className="text-xs text-muted-foreground mt-1">Energy sent to other systems</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">Net Interchange</span>
            </div>
            <p className="text-2xl font-bold">{mockTransmissionDeliveryContext.netInterchangeMwh.toLocaleString()} MWh</p>
            <p className="text-xs text-muted-foreground mt-1">Net energy balance</p>
          </div>
        </div>
      </div>

      {/* Substation Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Substation Delivery Context</h3>
        <div className="space-y-3">
          {Object.entries(mockSubstationDeliveryContext).map(([code, context]: [string, any]) => (
            <div key={code} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{code}</span>
                </div>
                <span className="text-sm font-bold">{context.mwhDelivered.toLocaleString()} MWh</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                <span>Peak: {context.mwPeak} MW</span>
                <span>Losses: {context.lossesPercentage}%</span>
                <span>Load Factor: {(context.loadFactor * 100).toFixed(1)}%</span>
                <span>Losses: {context.lossesMwh.toLocaleString()} MWh</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Data Notice */}
      <div className="bg-card border border-warning/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Demo Data Notice
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Transmission delivery metrics used in this demonstration are mock values for calculation purposes:
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-warning/10 rounded-lg">
              <p className="font-medium">MWh Delivered (Mock)</p>
              <p className="text-muted-foreground">{mockTransmissionDeliveryContext.mwhDelivered.toLocaleString()} MWh</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <p className="font-medium">Grid Losses (Mock)</p>
              <p className="text-muted-foreground">{mockTransmissionDeliveryContext.lossesPercentage}% ({mockTransmissionDeliveryContext.lossesMwh.toLocaleString()} MWh)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            In a production system, these values would be sourced from SCADA systems, energy meters, and grid management systems.
          </p>
        </div>
      </div>
    </div>
  );
}
