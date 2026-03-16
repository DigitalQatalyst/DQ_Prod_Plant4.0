import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyKPIGrid } from "@/components/ems/widgets/EnergyKPIGrid";
import { TrendChart } from "@/components/ems/widgets/TrendChart";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Download,
  AlertTriangle,
  Gauge,
  Building2,
} from "lucide-react";
import { getEnergyTypeIcon } from "@/lib/energy-icons";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type {
  TxSubstation,
  TxFeeder,
  TxEnergyMeterRegistry,
  SubmeterWithNames
} from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface Submeter {
  id: string;
  name: string;
  assetId: string;
  energyType: "electricity" | "gas" | "diesel" | "steam";
  status: "Normal" | "High" | "Critical";
  currentValue: number;
  unit: string;
}

interface TxSubmeterHierarchy {
  substation: TxSubstation;
  feeders: Array<{
    feeder: TxFeeder;
    meters: TxEnergyMeterRegistry[];
    submeters: SubmeterWithNames[];
  }>;
}

export function EnergyMonitoringSubMetering() {
  const {
    upstreamSubmeters,
    tariffs,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  // Determine if we're in transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // State for transmission data
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [txMeters, setTxMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [txSubmeters, setTxSubmeters] = useState<SubmeterWithNames[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmeter, setSelectedSubmeter] = useState<Submeter | TxEnergyMeterRegistry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Unified Filter State
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Load transmission data when in transmission context
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionData();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionData = async () => {
    if (!isTransmission) return;

    setLoading(true);
    setError(null);

    try {
      const provider = getTransmissionProvider();

      // Load substations, feeders, meters, and submeters
      const [substations, feeders, meters, submeters] = await Promise.all([
        provider.listTxSubstations({ org_id: currentTenant.id, active: true }),
        provider.listTxFeeders({ active: true }),
        provider.listEnergyMetersTxScoped({ org_id: currentTenant.id, active: true }),
        provider.getSubmeters({ active: true })
      ]);

      setTxSubstations(substations);
      setTxFeeders(feeders);
      setTxMeters(meters);
      setTxSubmeters(submeters);
    } catch (err) {
      console.error('Failed to load transmission data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transmission data');
    } finally {
      setLoading(false);
    }
  };

  // Group submeters by asset (upstream) or by feeder (transmission)
  const submetersByAsset = useMemo(() => {
    if (isTransmission) return new Map<string, Submeter[]>();
    const grouped = new Map<string, Submeter[]>();
    upstreamSubmeters.forEach(submeter => {
      if (!grouped.has(submeter.assetId)) grouped.set(submeter.assetId, []);
      grouped.get(submeter.assetId)!.push(submeter);
    });
    return grouped;
  }, [upstreamSubmeters, isTransmission]);

  const txHierarchy = useMemo((): TxSubmeterHierarchy[] => {
    if (!isTransmission) return [];
    return txSubstations.map(substation => {
      const substationFeeders = txFeeders.filter(f => f.substation_id === substation.id);
      const feedersWithMeters = substationFeeders.map(feeder => {
        const feederMeters = txMeters.filter(m => m.feeder_id === feeder.id);
        const feederSubmeters = txSubmeters.filter(sm => feederMeters.some(m => m.id === sm.parent_meter_id));
        return { feeder, meters: feederMeters, submeters: feederSubmeters };
      });
      return { substation, feeders: feedersWithMeters };
    });
  }, [isTransmission, txSubstations, txFeeders, txMeters, txSubmeters]);

  const costAllocationData = useMemo(() => {
    if (isTransmission) {
      const allocation: any[] = [];
      txHierarchy.forEach(({ substation, feeders }) => {
        feeders.forEach(({ feeder, meters, submeters }) => {
          const totalKW = meters.reduce((sum, meter) => meter.energy_types.includes('electricity') ? sum + (meter.current_kw || 0) : sum, 0);
          allocation.push({
            id: feeder.id,
            name: feeder.name,
            substationName: substation.name,
            totalKW,
            dailyCost: totalKW * 24 * tariffs.electricityUsdPerKWh,
            energyTypes: [...new Set(meters.flatMap(m => m.energy_types))],
            submeterCount: submeters.length
          });
        });
      });
      return allocation.sort((a, b) => b.totalKW - a.totalKW);
    } else {
      const allocation: any[] = [];
      submetersByAsset.forEach((submeters, assetId) => {
        const totalKW = submeters.reduce((sum, sm) => sm.energyType === "electricity" ? sum + sm.currentValue : sum, 0);
        allocation.push({
          assetId,
          totalKW,
          dailyCost: totalKW * 24 * tariffs.electricityUsdPerKWh,
          energyTypes: [...new Set(submeters.map(sm => sm.energyType))],
          submeterCount: submeters.length
        });
      });
      return allocation.sort((a, b) => b.totalKW - a.totalKW);
    }
  }, [isTransmission, submetersByAsset, txHierarchy, tariffs]);

  const topConsumers = useMemo(() => {
    if (isTransmission) return txMeters.filter(meter => meter.energy_types.includes('electricity')).sort((a, b) => (b.current_kw || 0) - (a.current_kw || 0)).slice(0, 5);
    return upstreamSubmeters.filter(sm => sm.energyType === "electricity").sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);
  }, [isTransmission, upstreamSubmeters, txMeters]);

  const listItems = useMemo(() => {
    let items = isTransmission ? txMeters : upstreamSubmeters;
    if (filters.status) {
      items = items.filter(item => (item as any).status.toLowerCase() === filters.status.toLowerCase());
    }
    if (isTransmission) {
      if (filters.role) items = items.filter(item => (item as TxEnergyMeterRegistry).meter_role === filters.role);
      if (filters.substationId) items = items.filter(item => (item as TxEnergyMeterRegistry).substation_id === filters.substationId);
      if (filters.feederId) items = items.filter(item => (item as TxEnergyMeterRegistry).feeder_id === filters.feederId);
    } else {
      if (filters.type) items = items.filter(item => (item as Submeter).energyType === filters.type);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [isTransmission, txMeters, upstreamSubmeters, filters, searchQuery]);

  // Update selection if filtered out
  useEffect(() => {
    if (listItems.length > 0 && (!selectedSubmeter || !listItems.find(i => i.id === selectedSubmeter.id))) {
      setSelectedSubmeter(listItems[0]);
    }
  }, [listItems, selectedSubmeter]);

  const tabs = selectedSubmeter ? [
    {
      id: "overview",
      label: isTransmission ? "Meter Overview" : "Submeter Overview",
      content: isTransmission ? <TxMeterOverview meter={selectedSubmeter as TxEnergyMeterRegistry} /> : <SubmeterOverview submeter={selectedSubmeter as Submeter} />,
    },
    {
      id: "signature",
      label: "Energy Signature",
      content: isTransmission ? <TxEnergySignature meter={selectedSubmeter as TxEnergyMeterRegistry} /> : <EnergySignature submeter={selectedSubmeter as Submeter} />,
    },
    {
      id: "trends",
      label: "Consumption Trends",
      content: isTransmission ? <TxConsumptionTrends meter={selectedSubmeter as TxEnergyMeterRegistry} /> : <ConsumptionTrends submeter={selectedSubmeter as Submeter} />,
    },
  ] : [
    {
      id: "overview",
      label: isTransmission ? "Transmission Sub-metering" : "Sub-metering Overview",
      content: isTransmission ? (
        <TransmissionSubMeteringOverview hierarchy={txHierarchy} topConsumers={topConsumers as TxEnergyMeterRegistry[]} loading={loading} error={error} />
      ) : (
        <SubMeteringOverview costAllocation={costAllocationData} topConsumers={topConsumers as Submeter[]} submetersByAsset={submetersByAsset} />
      ),
    },
  ];

  return (
    <EMSPageShell
      title={isTransmission ? "Sub-metering by Feeder" : "Sub-metering by Asset"}
      featureSetName="Energy Monitoring & Metering"
      featureName="Sub-metering"
      listType={isTransmission ? "meters" : "submeters"}
      listItems={listItems}
      selectedItem={selectedSubmeter}
      onItemSelect={setSelectedSubmeter}
      workPaneContent={<div className="space-y-6">{tabs.map(tab => <div key={tab.id}>{tab.content}</div>)}</div>}
      searchPlaceholder={isTransmission ? "Search meters..." : "Search submeters..."}
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showTypeFilter={!isTransmission}
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
        </div>
      }
    />
  );
}

// Internal Sub-components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SubmeterOverview({ submeter }: { submeter: Submeter }) {
  const { tariffs, emissionFactors } = useApp();
  const dailyConsumption = submeter.currentValue * 24;
  const dailyCost = submeter.energyType === "electricity" ? dailyConsumption * tariffs.electricityUsdPerKWh : 0;
  const dailyEmissions = submeter.energyType === "electricity" ? dailyConsumption * emissionFactors.electricityKgCo2PerKWh : 0;
  return (
    <div className="space-y-6">
      <EnergyKPIGrid currentKW={submeter.currentValue} dailyKWh={dailyConsumption} energyCost={dailyCost} co2Emissions={dailyEmissions} />
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Submeter Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Submeter ID" value={submeter.id} />
            <InfoRow label="Asset ID" value={submeter.assetId} />
            <InfoRow label="Energy Type" value={submeter.energyType} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Status" value={submeter.status} />
            <InfoRow label="Current Reading" value={`${submeter.currentValue} ${submeter.unit}`} />
            <InfoRow label="Daily Estimate" value={`${dailyConsumption.toFixed(1)} ${submeter.unit}h`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnergySignature({ submeter }: { submeter: Submeter }) {
  const signatureData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, value: submeter.currentValue * (1 + Math.sin(i / 24 * 2 * Math.PI) * 0.3 + (Math.random() - 0.5) * 0.1) })), [submeter]);
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">24-Hour Energy Signature</h3>
      <TrendChart data={signatureData} dataKey="value" title={`${submeter.name} - Energy Pattern`} unit={submeter.unit} />
    </div>
  );
}

function ConsumptionTrends({ submeter }: { submeter: Submeter }) {
  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ time: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }), value: submeter.currentValue * 24 * (0.9 + Math.random() * 0.2) })), [submeter]);
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">7-Day Consumption Trend</h3>
      <TrendChart data={trendData} dataKey="value" title={`${submeter.name} - Weekly Trend`} unit={`${submeter.unit}h/day`} />
    </div>
  );
}

function SubMeteringOverview({ costAllocation, topConsumers, submetersByAsset }: any) {
  const totalDailyCost = costAllocation.reduce((sum: number, item: any) => sum + item.dailyCost, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Submeters" value={[...submetersByAsset.values()].flat().length} icon={Gauge} variant="primary" />
        <KPICard title="Monitored Assets" value={submetersByAsset.size} icon={Activity} variant="default" />
        <KPICard title="Daily Cost" value={`$${totalDailyCost.toFixed(0)}`} icon={DollarSign} variant="success" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Consumers</h3>
        {topConsumers.map((sm: any, i: number) => (
          <div key={sm.id} className="flex justify-between items-center p-3 mb-2 bg-secondary/20 rounded">
            <span>{i + 1}. {sm.name}</span>
            <span className="font-bold">{sm.currentValue} {sm.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TxMeterOverview({ meter }: { meter: TxEnergyMeterRegistry }) {
  const { tariffs, emissionFactors } = useApp();
  const dailyConsumption = (meter.current_kw || 0) * 24;
  const dailyCost = dailyConsumption * tariffs.electricityUsdPerKWh;
  const dailyEmissions = dailyConsumption * emissionFactors.electricityKgCo2PerKWh;
  return (
    <div className="space-y-6">
      <EnergyKPIGrid currentKW={meter.current_kw || 0} dailyKWh={dailyConsumption} energyCost={dailyCost} co2Emissions={dailyEmissions} />
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Meter Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Meter ID" value={meter.id} />
            <InfoRow label="Substation" value={meter.substation_name || 'N/A'} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Status" value={meter.status} />
            <InfoRow label="Current Reading" value={`${meter.current_kw || 0} kW`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TxEnergySignature({ meter }: { meter: TxEnergyMeterRegistry }) {
  const signatureData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, value: (meter.current_kw || 0) * (1 + Math.sin(i / 24 * 2 * Math.PI) * 0.2 + (Math.random() - 0.5) * 0.1) })), [meter]);
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">24-Hour Transmission Signature</h3>
      <TrendChart data={signatureData} dataKey="value" title={`${meter.name} - Pattern`} unit="kW" />
    </div>
  );
}

function TxConsumptionTrends({ meter }: { meter: TxEnergyMeterRegistry }) {
  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ time: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }), value: (meter.current_kw || 0) * 24 * (0.95 + Math.random() * 0.1) })), [meter]);
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Weekly Consumption Trend</h3>
      <TrendChart data={trendData} dataKey="value" title={`${meter.name} - Trend`} unit="kWh/day" />
    </div>
  );
}

function TransmissionSubMeteringOverview({ hierarchy, topConsumers, loading, error }: any) {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Substations" value={hierarchy.length} icon={Building2} variant="primary" />
        <KPICard title="Total Feeders" value={hierarchy.reduce((sum: number, h: any) => sum + h.feeders.length, 0)} icon={Zap} variant="default" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Transmission Consumers</h3>
        {topConsumers.map((m: any, i: number) => (
          <div key={m.id} className="flex justify-between items-center p-3 mb-2 bg-secondary/20 rounded">
            <span>{i + 1}. {m.name}</span>
            <span className="font-bold">{(m.current_kw || 0).toFixed(1)} kW</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnergyMonitoringSubMetering;