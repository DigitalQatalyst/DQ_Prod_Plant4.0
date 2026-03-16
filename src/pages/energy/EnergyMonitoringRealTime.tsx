import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadges } from "@/components/shared/SectorBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Leaf,
  Download,
  Sparkles,
  Zap,
} from "lucide-react";
import { getEnergyTypeIcon } from "@/lib/energy-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { UpstreamEnergyMeter } from "@/types/navigation";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxEnergyMeterRegistry, TxSubstation, TxFeeder } from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

export function EnergyMonitoringRealTime() {
  const {
    energyMeters,
    energyTelemetry,
    energyBaselines,
    tariffs,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  // Sector context check
  const isTransmission = sector === 'power' && subsector === 'Transmission';
  const [selectedMeter, setSelectedMeter] = useState<UpstreamEnergyMeter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Unified Filter State
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Transmission-specific state
  const [txMeters, setTxMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [selectedTxMeter, setSelectedTxMeter] = useState<TxEnergyMeterRegistry | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Load transmission data when in transmission mode
  useEffect(() => {
    if (!isTransmission || !currentTenant) return;

    const loadTransmissionData = async () => {
      try {
        setTxLoading(true);
        const provider = getTransmissionProvider();

        const [metersData, substationsData, feedersData] = await Promise.all([
          provider.listEnergyMetersTxScoped({ org_id: currentTenant.id }),
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id })
        ]);

        setTxMeters(metersData);
        setTxSubstations(substationsData);
        setTxFeeders(feedersData);
      } catch (error) {
        console.error('Failed to load transmission data:', error);
      } finally {
        setTxLoading(false);
      }
    };

    loadTransmissionData();
  }, [isTransmission, currentTenant]);

  // Filtered meters logic - different for transmission vs upstream
  const filteredMeters = useMemo(() => {
    if (isTransmission) {
      // Filter transmission meters
      let filtered = txMeters;

      // Apply transmission-specific filters from unified state
      if (filters.substationId) {
        filtered = filtered.filter(m => m.substation_id === filters.substationId);
      }
      if (filters.feederId) {
        filtered = filtered.filter(m => m.feeder_id === filters.feederId);
      }
      if (filters.role) {
        filtered = filtered.filter(m => m.meter_role === filters.role);
      }
      if (filters.status) {
        filtered = filtered.filter(m => m.status === filters.status);
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (meter) =>
            meter.name.toLowerCase().includes(query) ||
            meter.substation_name?.toLowerCase().includes(query) ||
            meter.feeder_name?.toLowerCase().includes(query) ||
            meter.energy_types.some(type => type.toLowerCase().includes(query))
        );
      }

      return filtered;
    } else {
      // Original upstream logic
      let filtered = energyMeters;

      if (filters.status) {
        filtered = filtered.filter(m => m.status.toLowerCase() === filters.status.toLowerCase());
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (meter) =>
            meter.name.toLowerCase().includes(query) ||
            meter.scope.toLowerCase().includes(query) ||
            meter.energyTypes.some(type => type.toLowerCase().includes(query))
        );
      }
      return filtered;
    }
  }, [isTransmission, txMeters, energyMeters, searchQuery, filters]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredMeters.length > 0) {
      const currentSelected = isTransmission ? selectedTxMeter : selectedMeter;
      if (!currentSelected || !filteredMeters.find(m => m.id === currentSelected.id)) {
        handleItemSelect(filteredMeters[0]);
      }
    }
  }, [filteredMeters, isTransmission, selectedTxMeter, selectedMeter]);

  const selectedMeterData = useMemo(() => {
    if (isTransmission) {
      if (!selectedTxMeter) return null;
      const currentKw = selectedTxMeter.current_kw || 0;
      const currentKwh = selectedTxMeter.current_kwh || 0;
      const dailyConsumption = currentKwh;
      const energyCost = dailyConsumption * (tariffs?.electricityUsdPerKWh || 0.1);
      const co2Emissions = dailyConsumption * (emissionFactors?.electricityKgCo2PerKWh || 0.5);
      const baselinePercentage = 0;

      const chartData = Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (11 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        kW: currentKw + (Math.random() - 0.5) * currentKw * 0.1,
        kWh: currentKwh * (i + 1) / 12,
      }));

      return {
        dailyConsumption,
        energyCost,
        co2Emissions,
        baselinePercentage,
        chartData,
        baseline: null
      };
    } else {
      if (!selectedMeter) return null;
      const telemetry = energyTelemetry[selectedMeter.id];
      const baseline = energyBaselines.find(b => b.meterId === selectedMeter.id);
      if (!telemetry || !baseline) return null;
      const latestKWh = telemetry.kWh[telemetry.kWh.length - 1] || 0;
      const dailyConsumption = latestKWh;
      const energyCost = dailyConsumption * tariffs.electricityUsdPerKWh;
      const co2Emissions = dailyConsumption * emissionFactors.electricityKgCo2PerKWh;
      const baselinePercentage = ((dailyConsumption - baseline.baselineKWhPerDay) / baseline.baselineKWhPerDay) * 100;
      const chartData = telemetry.timestamp.slice(-12).map((timestamp, index) => ({
        time: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        kW: telemetry.kW.slice(-12)[index],
        kWh: telemetry.kWh.slice(-12)[index],
      }));
      return {
        dailyConsumption,
        energyCost,
        co2Emissions,
        baselinePercentage,
        chartData,
        baseline
      };
    }
  }, [isTransmission, selectedTxMeter, selectedMeter, energyTelemetry, energyBaselines, tariffs, emissionFactors]);

  const currentSelectedMeter = isTransmission ? selectedTxMeter : selectedMeter;

  const tabs = currentSelectedMeter ? [
    {
      id: "overview",
      label: "Real-time Overview",
      content: isTransmission ?
        <TransmissionMeterOverview meter={selectedTxMeter!} data={selectedMeterData} sector={sector} subsector={subsector} /> :
        <MeterOverview meter={selectedMeter!} data={selectedMeterData} />,
    },
    {
      id: "charts",
      label: "Time-series Charts",
      content: isTransmission ?
        <TransmissionMeterCharts meter={selectedTxMeter!} data={selectedMeterData} /> :
        <MeterCharts meter={selectedMeter!} data={selectedMeterData} />,
    },
    {
      id: "baseline",
      label: "Baseline Comparison",
      content: isTransmission ?
        <TransmissionBaselineComparison meter={selectedTxMeter!} data={selectedMeterData} /> :
        <BaselineComparison meter={selectedMeter!} data={selectedMeterData} />,
    },
  ] : [
    {
      id: "overview",
      label: "Energy Overview",
      content: <EnergyOverview meters={isTransmission ? txMeters : energyMeters} sector={sector} subsector={subsector} />,
    },
  ];

  const handleItemSelect = (item: any) => {
    if (isTransmission) {
      setSelectedTxMeter(item as TxEnergyMeterRegistry);
      setSelectedMeter(null);
    } else {
      setSelectedMeter(item as UpstreamEnergyMeter);
      setSelectedTxMeter(null);
    }
  };

  return (
    <EMSPageShell
      title="Real-time Consumption"
      featureSetName="Energy Monitoring & Metering"
      featureName="Real-time Consumption"
      listType="meters"
      listItems={filteredMeters}
      selectedItem={currentSelectedMeter}
      onItemSelect={handleItemSelect}
      workPaneContent={<div className="space-y-6">{tabs.map(tab => <div key={tab.id}>{tab.content}</div>)}</div>}
      searchPlaceholder={isTransmission ? "Search transmission meters..." : "Search meters..."}
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showRoleFilter={isTransmission}
          showSubstationFilter={isTransmission}
          showFeederFilter={isTransmission}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI Insights
          </Button>
        </div>
      }
    />
  );
}

// Re-implement simplified internal components to satisfy usage in EnergyMonitoringRealTime
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function MeterOverview({ meter, data }: { meter: UpstreamEnergyMeter, data: any }) {
  if (!data) return <div className="py-16 text-center text-muted-foreground">No telemetry data available</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Instantaneous Demand" value={`${meter.currentKW.toFixed(1)} kW`} icon={Zap} variant="primary" />
        <KPICard title="Daily Consumption" value={`${data.dailyConsumption.toFixed(0)} kWh`} icon={Activity} variant="default" trend={data.baselinePercentage > 0 ? "up" : "down"} trendValue={`${Math.abs(data.baselinePercentage).toFixed(1)}%`} />
        <KPICard title="Energy Cost Today" value={`$${data.energyCost.toFixed(2)}`} icon={DollarSign} variant="warning" />
        <KPICard title="CO₂ Emissions Today" value={`${data.co2Emissions.toFixed(1)} kg`} icon={Leaf} variant="success" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Meter Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Meter ID" value={meter.id} />
            <InfoRow label="Scope" value={meter.scope} />
            <InfoRow label="Energy Types" value={meter.energyTypes.join(", ")} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Status" value={meter.status} />
            <InfoRow label="Linked Assets" value={`${meter.linkedAssets.length} assets`} />
            <InfoRow label="Current Load" value={`${meter.currentKW.toFixed(1)} kW`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MeterCharts({ meter, data }: { meter: UpstreamEnergyMeter, data: any }) {
  if (!data) return <div className="py-16 text-center text-muted-foreground">No telemetry data available</div>;
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Instantaneous Demand (kW)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="kW" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* kWh Accumulation Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Energy Accumulation (kWh)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="kWh"
                fill="hsl(var(--primary))"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function BaselineComparison({ meter, data }: { meter: UpstreamEnergyMeter, data: any }) {
  if (!data || !data.baseline) return <div className="py-16 text-center text-muted-foreground">No baseline data available</div>;
  const isOverBaseline = data.baselinePercentage > 0;
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Baseline Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.dailyConsumption.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Actual kWh Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{data.baseline.baselineKWhPerDay.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Baseline kWh/Day</p>
          </div>
          <div className="text-center">
            <p className={cn("text-2xl font-bold", isOverBaseline ? "text-destructive" : "text-success")}>
              {Math.abs(data.baselinePercentage).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">{isOverBaseline ? "Over" : "Under"} Baseline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransmissionMeterOverview({ meter, data, sector, subsector }: { meter: TxEnergyMeterRegistry, data: any, sector: string | null, subsector: string | null }) {
  if (!data) return <div className="py-16 text-center text-muted-foreground">No telemetry data available</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Instantaneous Demand" value={`${(meter.current_kw || 0).toFixed(1)} kW`} icon={Zap} variant="primary" />
        <KPICard title="Daily Consumption" value={`${data.dailyConsumption.toFixed(0)} kWh`} icon={Activity} variant="default" />
        <KPICard title="Energy Cost Today" value={`$${data.energyCost.toFixed(2)}`} icon={DollarSign} variant="warning" />
        <KPICard title="CO₂ Emissions Today" value={`${data.co2Emissions.toFixed(1)} kg`} icon={Leaf} variant="success" />
      </div>

      {/* Context Information */}
      {sector && subsector && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Industry Context</h3>
          <SectorBadges sector={sector} subsector={subsector} size="md" className="mb-3" />
          <p className="text-sm text-muted-foreground">
            Energy monitoring optimized for {sector} {subsector} operations.
            Select a meter from the list to view detailed consumption data and analytics.
          </p>
        </div>
      )}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Meter Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Meter ID" value={meter.id} />
            <InfoRow label="Substation" value={meter.substation_name || 'N/A'} />
            <InfoRow label="Feeder" value={meter.feeder_name || 'N/A'} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Meter Role" value={meter.meter_role || 'N/A'} />
            <InfoRow label="Status" value={meter.status} />
            <InfoRow label="Current Load" value={`${(meter.current_kw || 0).toFixed(1)} kW`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TransmissionMeterCharts({ meter, data }: { meter: TxEnergyMeterRegistry, data: any }) {
  if (!data) return <div className="py-16 text-center text-muted-foreground">No telemetry data available</div>;
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Transmission Demand (kW)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="kW" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TransmissionBaselineComparison({ meter, data }: { meter: TxEnergyMeterRegistry, data: any }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      Baseline comparison not yet implemented for transmission context.
    </div>
  );
}

function EnergyOverview({ meters, sector, subsector }: { meters: any[], sector: string | null, subsector: string | null }) {
  const totalKW = meters.reduce((sum, m) => sum + (m.currentKW || m.current_kw || 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Meters" value={meters.length} icon={Activity} variant="primary" />
        <KPICard title="Current Demand" value={`${totalKW.toFixed(1)} kW`} icon={Zap} variant="default" />
        <KPICard title="Online Status" value={meters.length > 0 ? `${Math.round(meters.filter(m => m.status === 'Normal').length / meters.length * 100)}%` : '0%'} icon={Activity} variant="success" />
        <KPICard title="Active Alerts" value={meters.filter(m => m.status === 'Critical').length} icon={AlertTriangle} variant="destructive" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Industry Context</h3>
        <div className="flex gap-2">
          {sector && <Badge variant="secondary">{sector}</Badge>}
          {subsector && <Badge variant="outline">{subsector}</Badge>}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Energy monitoring optimized for {sector} {subsector} operations.</p>
      </div>
    </div>
  );
}

export default EnergyMonitoringRealTime;