import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { PowerQualityCard } from "@/components/ems/widgets/PowerQualityCard";
import { TrendChart } from "@/components/ems/widgets/TrendChart";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Download,
  Shield,
  Gauge,
  Building2,
  Cable,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type {
  TxPowerQualityLimit,
  PowerQualityEvent,
  TxSubstation,
  TxFeeder,
  TxEnergyMeterRegistry
} from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface PowerQualityMeter {
  id: string;
  name: string;
  scope: string;
  status: "Normal" | "High" | "Critical";
  powerFactor: number;
  thdPct: number;
  voltageV: number;
  frequencyHz: number;
  sagEventsCount: number;
  swellEventsCount: number;
  // Transmission-specific fields
  substationName?: string;
  feederName?: string;
  voltageLevel?: number;
  meterRole?: string;
  // History fields for trends
  timestamp: string[];
  powerFactorHistory: number[];
  thdHistory: number[];
  voltageHistory: number[];
}

interface TransmissionPowerQualityData {
  substations: TxSubstation[];
  feeders: TxFeeder[];
  meters: TxEnergyMeterRegistry[];
  pqLimits: TxPowerQualityLimit[];
  pqEvents: PowerQualityEvent[];
}

export function EnergyMonitoringPowerQuality() {
  const {
    energyMeters,
    upstreamPowerQuality,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedMeter, setSelectedMeter] = useState<PowerQualityMeter | null>(null);
  const [selectedSubstation, setSelectedSubstation] = useState<string>("all");
  const [selectedFeeder, setSelectedFeeder] = useState<string>("all");
  const [transmissionData, setTransmissionData] = useState<TransmissionPowerQualityData>({
    substations: [],
    feeders: [],
    meters: [],
    pqLimits: [],
    pqEvents: []
  });

  // Check if we're in transmission mode
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Load transmission-specific data when in transmission mode
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionData();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionData = async () => {
    try {
      const provider = getTransmissionProvider();

      // Load substations, feeders, meters, PQ limits, and events in parallel
      const [substations, meters, pqLimits, pqEvents] = await Promise.all([
        provider.listTxSubstations({ org_id: currentTenant?.id, active: true }),
        provider.listEnergyMetersTxScoped({ org_id: currentTenant?.id, active: true }),
        provider.getPowerQualityLimits({ org_id: currentTenant?.id, active: true }),
        provider.getPowerQualityEvents({ org_id: currentTenant?.id })
      ]);

      // Load feeders for selected substation or all feeders
      const feeders = selectedSubstation && selectedSubstation !== 'all'
        ? await provider.listTxFeeders({ substation_id: selectedSubstation, active: true })
        : await provider.listTxFeeders({ org_id: currentTenant?.id, active: true });

      setTransmissionData({
        substations,
        feeders,
        meters,
        pqLimits,
        pqEvents
      });
    } catch (error) {
      console.error('Failed to load transmission data:', error);
    }
  };

  // Reload feeders when substation changes
  useEffect(() => {
    if (isTransmission && selectedSubstation && selectedSubstation !== 'all') {
      loadFeedersForSubstation();
    }
  }, [selectedSubstation]);

  const loadFeedersForSubstation = async () => {
    try {
      const provider = getTransmissionProvider();
      const feeders = await provider.listTxFeeders({
        substation_id: selectedSubstation,
        active: true
      });

      setTransmissionData(prev => ({
        ...prev,
        feeders
      }));
    } catch (error) {
      console.error('Failed to load feeders:', error);
    }
  };

  // Convert energy meters to power quality meters with PQ data
  const powerQualityMeters = useMemo(() => {
    if (isTransmission) {
      // Use transmission meters with topology context
      return transmissionData.meters.map(meter => {
        // Favor registry data if mock data is not available (common for live transmission meters)
        const pqData = upstreamPowerQuality[meter.id] || {
          powerFactor: meter.current_power_factor ?? 0.992,
          thdPct: meter.current_thd_pct ?? 1.4,
          voltageV: meter.current_voltage_v ?? (meter.feeder_voltage_kv ? meter.feeder_voltage_kv * 1000 : 400000),
          frequencyHz: meter.current_frequency_hz ?? 50.0,
          sagEventsCount: 0,
          swellEventsCount: 0,
          timestamp: [new Date().toISOString()],
          powerFactorHistory: [meter.current_power_factor ?? 0.992],
          thdHistory: [meter.current_thd_pct ?? 1.4],
          voltageHistory: [meter.current_voltage_v ?? 400000]
        };

        // Get PQ events for this meter
        const meterEvents = transmissionData.pqEvents.filter(event => event.meter_id === meter.id);
        const sagEvents = meterEvents.filter(e => e.event_type === 'sag').length;
        const swellEvents = meterEvents.filter(e => e.event_type === 'swell').length;

        // Determine status based on power quality parameters and voltage-level thresholds
        let status: "Normal" | "High" | "Critical" = "Normal";

        // Get voltage-level-specific thresholds
        const voltageLevel = meter.feeder_voltage_kv || 400; // Default to 400kV if not specified
        const pqLimits = transmissionData.pqLimits.filter(limit =>
          limit.voltage_level_kv === voltageLevel
        );

        // Check against transmission-specific thresholds
        const pfLimit = pqLimits.find(l => l.limit_type === 'power_factor');
        const thdLimit = pqLimits.find(l => l.limit_type === 'thd_voltage');

        if (pfLimit && pqData.powerFactor < (pfLimit.min_value || 0.85)) {
          status = pfLimit.severity === 'Critical' ? "Critical" : "High";
        }
        if (thdLimit && pqData.thdPct > (thdLimit.max_value || 8)) {
          status = thdLimit.severity === 'Critical' ? "Critical" : "High";
        }
        if (sagEvents > 5 || swellEvents > 3) {
          status = "Critical";
        } else if (sagEvents > 2 || swellEvents > 1) {
          status = "High";
        }

        return {
          id: meter.id,
          name: meter.name,
          scope: `${meter.substation_name || 'Unknown'} - ${meter.feeder_name || 'Unknown'}`,
          status,
          powerFactor: pqData.powerFactor,
          thdPct: pqData.thdPct,
          voltageV: pqData.voltageV,
          frequencyHz: pqData.frequencyHz,
          sagEventsCount: sagEvents,
          swellEventsCount: swellEvents,
          substationName: meter.substation_name,
          feederName: meter.feeder_name,
          voltageLevel: meter.feeder_voltage_kv,
          meterRole: meter.meter_role,
          timestamp: pqData.timestamp || [new Date().toISOString()],
          powerFactorHistory: pqData.powerFactorHistory || [pqData.powerFactor],
          thdHistory: pqData.thdHistory || [pqData.thdPct],
          voltageHistory: pqData.voltageHistory || [pqData.voltageV]
        };
      }).filter(Boolean) as PowerQualityMeter[];
    } else {
      // Use existing upstream logic
      return energyMeters.map(meter => {
        const pqData = upstreamPowerQuality[meter.id];
        if (!pqData) return null;

        // Determine status based on power quality parameters
        let status: "Normal" | "High" | "Critical" = "Normal";
        if (pqData.powerFactor < 0.85 || pqData.thdPct > 8 || pqData.sagEventsCount > 5 || pqData.swellEventsCount > 3) {
          status = "Critical";
        } else if (pqData.powerFactor < 0.90 || pqData.thdPct > 5 || pqData.sagEventsCount > 2 || pqData.swellEventsCount > 1) {
          status = "High";
        }

        return {
          id: meter.id,
          name: meter.name,
          scope: meter.scope,
          status,
          powerFactor: pqData.powerFactor,
          thdPct: pqData.thdPct,
          voltageV: pqData.voltageV,
          frequencyHz: pqData.frequencyHz,
          sagEventsCount: pqData.sagEventsCount,
          swellEventsCount: pqData.swellEventsCount,
          timestamp: pqData.timestamp || [new Date().toISOString()],
          powerFactorHistory: pqData.powerFactorHistory || [pqData.powerFactor],
          thdHistory: pqData.thdHistory || [pqData.thdPct],
          voltageHistory: pqData.voltageHistory || [pqData.voltageV]
        };
      }).filter(Boolean) as PowerQualityMeter[];
    }
  }, [energyMeters, upstreamPowerQuality, isTransmission, transmissionData]);

  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMeters = useMemo(() => {
    let meters = powerQualityMeters;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      meters = meters.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.scope.toLowerCase().includes(q) ||
        m.substationName?.toLowerCase().includes(q) ||
        m.feederName?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      meters = meters.filter(m => m.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (isTransmission) {
      if (filters.role) {
        meters = meters.filter(m => m.meterRole === filters.role);
      }
      if (filters.substationId) {
        meters = meters.filter(m =>
          transmissionData.meters.find(tm => tm.id === m.id && tm.substation_id === filters.substationId)
        );
      }
      if (filters.feederId) {
        meters = meters.filter(m =>
          transmissionData.meters.find(tm => tm.id === m.id && tm.feeder_id === filters.feederId)
        );
      }
    }

    return meters;
  }, [powerQualityMeters, searchQuery, filters, isTransmission, transmissionData.meters]);

  const listFilterContent = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={false}
      showRoleFilter={isTransmission}
      showSubstationFilter={isTransmission}
      showFeederFilter={isTransmission}
    />
  );

  const tabs = selectedMeter ? [
    {
      id: "overview",
      label: "Power Quality Overview",
      content: <PowerQualityOverview
        meter={selectedMeter}
        isTransmission={isTransmission}
        pqLimits={transmissionData.pqLimits}
      />,
    },
    {
      id: "trends",
      label: "Quality Trends",
      content: <QualityTrends meter={selectedMeter} />,
    },
    {
      id: "events",
      label: "PQ Events",
      content: <PowerQualityEvents
        meter={selectedMeter}
        isTransmission={isTransmission}
        pqEvents={transmissionData.pqEvents}
        pqLimits={transmissionData.pqLimits}
      />,
    },
    {
      id: "risks",
      label: "Equipment Risks",
      content: <EquipmentRisks meter={selectedMeter} isTransmission={isTransmission} />,
    },
  ] : [
    {
      id: "overview",
      label: "Power Quality Overview",
      content: <PowerQualitySystemOverview
        meters={filteredMeters}
        isTransmission={isTransmission}
        pqLimits={transmissionData.pqLimits}
      />,
    },
  ];

  return (
    <EMSPageShell
      title="Power Quality Monitoring"
      featureSetName="Energy Monitoring & Metering"
      featureName="Power Quality"
      listType="meters"
      listItems={filteredMeters}
      selectedItem={selectedMeter}
      onItemSelect={setSelectedMeter}
      workPaneContent={
        <div className="space-y-6">
          {tabs.map(tab => (
            <div key={tab.id}>
              {tab.content}
            </div>
          ))}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      }
      onSearch={setSearchQuery}
      listFilterContent={listFilterContent}
    />
  );
}

interface PowerQualityOverviewProps {
  meter: PowerQualityMeter;
  isTransmission?: boolean;
  pqLimits?: TxPowerQualityLimit[];
}

function PowerQualityOverview({ meter, isTransmission = false, pqLimits = [] }: PowerQualityOverviewProps) {
  // Use data directly from the meter object which already has PQ metrics
  const pqData = meter;

  // Get voltage-level-specific thresholds for transmission
  const voltageLevel = meter.voltageLevel || 400;
  const voltageLevelLimits = isTransmission
    ? pqLimits.filter(limit => limit.voltage_level_kv === voltageLevel)
    : [];

  return (
    <div className="space-y-6">
      {/* Transmission Context */}
      {isTransmission && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Transmission Context</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <InfoRow label="Substation" value={meter.substationName || 'Unknown'} />
              <InfoRow label="Feeder" value={meter.feederName || 'Unknown'} />
              <InfoRow label="Meter Role" value={meter.meterRole || 'Unknown'} />
            </div>
            <div className="space-y-3">
              <InfoRow label="Voltage Level" value={`${voltageLevel} kV`} />
              <InfoRow label="PQ Standard" value={voltageLevelLimits[0]?.standard_reference || 'IEEE 1159'} />
              <InfoRow label="Active Limits" value={`${voltageLevelLimits.length} configured`} />
            </div>
          </div>
        </div>
      )}

      {/* Voltage-Level Thresholds */}
      {isTransmission && voltageLevelLimits.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Power Quality Limits ({voltageLevel} kV)</h3>
          <div className="space-y-3">
            {voltageLevelLimits.map((limit) => (
              <div key={limit.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium capitalize">{limit.limit_type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">{limit.description || limit.standard_reference}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {limit.min_value !== null && `Min: ${limit.min_value}`}
                      {limit.min_value !== null && limit.max_value !== null && ' | '}
                      {limit.max_value !== null && `Max: ${limit.max_value}`}
                    </span>
                    <Badge variant={
                      limit.severity === 'Critical' ? 'destructive' :
                        limit.severity === 'High' ? 'destructive' :
                          limit.severity === 'Medium' ? 'secondary' : 'outline'
                    }>
                      {limit.severity}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power Quality Cards */}
      <div className="grid grid-cols-2 gap-4">
        <PowerQualityCard
          data={pqData}
          title="Power Quality Metrics"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard
          title="Voltage"
          value={`${pqData.voltageV} V`}
          subtitle={isTransmission ? `${voltageLevel} kV system` : "RMS voltage measurement"}
          icon={Zap}
          variant="default"
        />
        <KPICard
          title="Frequency"
          value={`${pqData.frequencyHz} Hz`}
          subtitle="System frequency"
          icon={Activity}
          variant={Math.abs(pqData.frequencyHz - 60) <= 0.1 ? "success" : "warning"}
        />
      </div>

      {/* Event Counters */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          title="Voltage Sag Events"
          value={meter.sagEventsCount}
          subtitle="Last 24 hours"
          icon={TrendingDown}
          variant={meter.sagEventsCount === 0 ? "success" : meter.sagEventsCount <= 2 ? "warning" : "destructive"}
        />
        <KPICard
          title="Voltage Swell Events"
          value={meter.swellEventsCount}
          subtitle="Last 24 hours"
          icon={TrendingUp}
          variant={meter.swellEventsCount === 0 ? "success" : meter.swellEventsCount <= 1 ? "warning" : "destructive"}
        />
      </div>

      {/* Meter Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Meter Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Meter ID" value={meter.id} />
            <InfoRow label="Location" value={meter.scope} />
            <InfoRow label="Voltage Level" value={`${pqData.voltageV}V`} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Status" value={meter.status} />
            <InfoRow label="Power Factor" value={pqData.powerFactor.toFixed(3)} />
            <InfoRow label="THD" value={`${pqData.thdPct.toFixed(1)}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface QualityTrendsProps {
  meter: PowerQualityMeter;
}

function QualityTrends({ meter }: QualityTrendsProps) {
  const pqData = meter;

  if (!pqData.powerFactorHistory || pqData.powerFactorHistory.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No trend data available</p>
      </div>
    );
  }

  // Prepare trend data
  const trendData = useMemo(() => {
    return pqData.timestamp.map((timestamp, index) => ({
      time: new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      powerFactor: pqData.powerFactorHistory?.[index] || 0,
      thd: pqData.thdHistory?.[index] || 0,
      voltage: pqData.voltageHistory?.[index] || 0
    }));
  }, [pqData]);

  return (
    <div className="space-y-6">
      {/* Power Factor Trend */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Power Factor Trend (24 Hours)</h3>
        <TrendChart
          data={trendData.map(point => ({
            time: point.time,
            value: point.powerFactor
          }))}
          dataKey="value"
          title="Power Factor"
          unit=""
          color="hsl(var(--primary))"
        />
      </div>

      {/* THD Trend */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Total Harmonic Distortion Trend (24 Hours)</h3>
        <TrendChart
          data={trendData.map(point => ({
            time: point.time,
            value: point.thd
          }))}
          dataKey="value"
          title="THD"
          unit="%"
          color="hsl(var(--warning))"
        />
      </div>

      {/* Voltage Trend */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Voltage Trend (24 Hours)</h3>
        <TrendChart
          data={trendData.map(point => ({
            time: point.time,
            value: point.voltage
          }))}
          dataKey="value"
          title="Voltage"
          unit="V"
          color="hsl(var(--success))"
        />
      </div>
    </div>
  );
}

interface PowerQualityEventsProps {
  meter: PowerQualityMeter;
  isTransmission?: boolean;
  pqEvents?: PowerQualityEvent[];
  pqLimits?: TxPowerQualityLimit[];
}

function PowerQualityEvents({ meter, isTransmission = false, pqEvents = [], pqLimits = [] }: PowerQualityEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<PowerQualityEvent | null>(null);

  // Get events for this meter
  const meterEvents = useMemo(() => {
    if (isTransmission) {
      return pqEvents.filter(event => event.meter_id === meter.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      // Generate mock PQ events for upstream
      const eventList = [];

      // Add sag events
      for (let i = 0; i < meter.sagEventsCount; i++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 24));

        eventList.push({
          id: `sag-${i}`,
          type: "Voltage Sag",
          timestamp: timestamp.toISOString(),
          severity: "Medium",
          magnitude: `${(80 + Math.random() * 10).toFixed(1)}%`,
          duration: `${(100 + Math.random() * 500).toFixed(0)}ms`,
          description: "Voltage dropped below 90% of nominal"
        });
      }

      // Add swell events
      for (let i = 0; i < meter.swellEventsCount; i++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 24));

        eventList.push({
          id: `swell-${i}`,
          type: "Voltage Swell",
          timestamp: timestamp.toISOString(),
          severity: "High",
          magnitude: `${(110 + Math.random() * 10).toFixed(1)}%`,
          duration: `${(50 + Math.random() * 200).toFixed(0)}ms`,
          description: "Voltage exceeded 110% of nominal"
        });
      }

      return eventList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }, [meter, isTransmission, pqEvents]);

  const handleResolveEvent = async (event: PowerQualityEvent) => {
    if (!isTransmission) return;

    try {
      const provider = getTransmissionProvider();
      await provider.resolvePQEvent(event.id, "Resolved from power quality monitoring page");

      // Refresh events (in a real app, you'd update the parent component's state)
      console.log('Event resolved:', event.id);
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Total Events"
          value={meterEvents.length}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          variant={meterEvents.length === 0 ? "success" : meterEvents.length <= 3 ? "warning" : "destructive"}
        />
        <KPICard
          title="Sag Events"
          value={meter.sagEventsCount}
          subtitle="Voltage drops"
          icon={TrendingDown}
          variant={meter.sagEventsCount === 0 ? "success" : "warning"}
        />
        <KPICard
          title="Swell Events"
          value={meter.swellEventsCount}
          subtitle="Voltage rises"
          icon={TrendingUp}
          variant={meter.swellEventsCount === 0 ? "success" : "warning"}
        />
      </div>

      {/* Transmission Context */}
      {isTransmission && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Transmission Context</h3>
          <div className="grid grid-cols-3 gap-4">
            <InfoRow label="Substation" value={meter.substationName || 'Unknown'} />
            <InfoRow label="Feeder" value={meter.feederName || 'Unknown'} />
            <InfoRow label="Voltage Level" value={`${meter.voltageLevel || 400} kV`} />
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Power Quality Events</h3>
        {meterEvents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No power quality events in the last 24 hours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meterEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    event.severity === "High" || event.severity === "Critical" ? "bg-destructive" : "bg-warning"
                  )} />
                  <div>
                    <p className="text-sm font-medium">
                      {isTransmission ? event.event_type : event.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isTransmission ? event.description : event.description}
                    </p>
                    {isTransmission && event.affected_phases && (
                      <p className="text-xs text-muted-foreground">
                        Phases: {event.affected_phases}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {isTransmission ?
                        (event.magnitude ? `${event.magnitude}%` : 'N/A') :
                        event.magnitude
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {isTransmission && event.duration_ms && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {event.duration_ms}ms
                      </p>
                    )}
                  </div>
                  {isTransmission && !event.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveEvent(event)}
                    >
                      Resolve
                    </Button>
                  )}
                  {isTransmission && event.resolved && (
                    <Badge variant="outline">Resolved</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EquipmentRisksProps {
  meter: PowerQualityMeter;
  isTransmission?: boolean;
}

function EquipmentRisks({ meter, isTransmission = false }: EquipmentRisksProps) {
  // Generate equipment risk assessments
  const risks = useMemo(() => {
    const riskList = [];

    if (meter.powerFactor < 0.85) {
      if (isTransmission) {
        riskList.push({
          equipment: "Power Transformers",
          risk: "High",
          issue: "Low power factor increases transformer losses and heating",
          recommendation: "Install shunt capacitor banks for reactive power compensation",
          impact: "Reduced transformer life, increased losses, voltage regulation issues"
        });
      } else {
        riskList.push({
          equipment: "ESP Motors",
          risk: "High",
          issue: "Low power factor increases motor heating",
          recommendation: "Install power factor correction capacitors",
          impact: "Reduced motor life, increased energy costs"
        });
      }
    }

    if (meter.thdPct > 8) {
      if (isTransmission) {
        riskList.push({
          equipment: "Protection Relays & SCADA",
          risk: "Critical",
          issue: "High THD can cause protection relay maloperation",
          recommendation: "Install harmonic filters and upgrade to digital relays",
          impact: "False trips, protection system failures, grid instability"
        });
      } else {
        riskList.push({
          equipment: "VFDs & Control Systems",
          risk: "Critical",
          issue: "High THD can damage electronic equipment",
          recommendation: "Install harmonic filters on compressor drives",
          impact: "Equipment failure, production downtime"
        });
      }
    }

    if (meter.sagEventsCount > 2) {
      if (isTransmission) {
        riskList.push({
          equipment: "Substation Control Systems",
          risk: "Medium",
          issue: "Voltage sags cause control system resets and communication failures",
          recommendation: "Install UPS systems for critical control equipment",
          impact: "Loss of monitoring, protection system resets, operational blind spots"
        });
      } else {
        riskList.push({
          equipment: "Wellhead Control Systems",
          risk: "Medium",
          issue: "Voltage sags cause control system resets",
          recommendation: "Install UPS for critical control systems",
          impact: "Well shutdowns, lost production"
        });
      }
    }

    if (meter.swellEventsCount > 1) {
      if (isTransmission) {
        riskList.push({
          equipment: "Electronic Meters & Sensors",
          risk: "Medium",
          issue: "Voltage swells damage sensitive measurement equipment",
          recommendation: "Install surge arresters and voltage regulators",
          impact: "Measurement errors, billing inaccuracies, protection misoperation"
        });
      } else {
        riskList.push({
          equipment: "Instrumentation",
          risk: "Medium",
          issue: "Voltage swells damage sensitive instruments",
          recommendation: "Install surge protection devices",
          impact: "Measurement errors, safety system failures"
        });
      }
    }

    // Add sector-specific equipment risks
    if (isTransmission) {
      if (meter.voltageLevel && meter.voltageLevel >= 400) {
        riskList.push({
          equipment: "EHV Circuit Breakers",
          risk: meter.powerFactor < 0.90 ? "Medium" : "Low",
          issue: "Power quality affects circuit breaker interrupting capability",
          recommendation: "Monitor contact resistance and SF6 gas quality",
          impact: "Reduced interrupting capability, potential arc flash incidents"
        });
      }

      if (meter.substationName?.includes("Generation")) {
        riskList.push({
          equipment: "Generator Step-up Transformers",
          risk: meter.thdPct > 5 ? "High" : "Low",
          issue: "Harmonics cause additional heating in generator transformers",
          recommendation: "Install harmonic monitoring and filtering",
          impact: "Reduced transformer life, forced outages, generation curtailment"
        });
      }
    } else {
      // Add general upstream equipment risks
      if (meter.scope.includes("Compressor")) {
        riskList.push({
          equipment: "Gas Compressor Motors",
          risk: meter.powerFactor < 0.90 ? "Medium" : "Low",
          issue: "Power quality affects compressor efficiency",
          recommendation: "Monitor motor temperature and vibration",
          impact: "Reduced compression efficiency, higher operating costs"
        });
      }
    }

    return riskList;
  }, [meter, isTransmission]);

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Critical Risks"
          value={risks.filter(r => r.risk === "Critical").length}
          subtitle="Immediate attention"
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="High Risks"
          value={risks.filter(r => r.risk === "High").length}
          subtitle="Plan mitigation"
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="Medium Risks"
          value={risks.filter(r => r.risk === "Medium").length}
          subtitle="Monitor closely"
          icon={Shield}
          variant="default"
        />
      </div>

      {/* Risk Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isTransmission ? "Transmission Equipment Risk Assessment" : "Equipment Risk Assessment"}
        </h3>
        {risks.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No significant equipment risks identified</p>
          </div>
        ) : (
          <div className="space-y-4">
            {risks.map((risk, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{risk.equipment}</h4>
                    <p className="text-sm text-muted-foreground">{risk.issue}</p>
                  </div>
                  <Badge variant={
                    risk.risk === "Critical" ? "destructive" :
                      risk.risk === "High" ? "destructive" :
                        risk.risk === "Medium" ? "secondary" : "outline"
                  }>
                    {risk.risk} Risk
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Recommendation: </span>
                    <span className="text-sm">{risk.recommendation}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Potential Impact: </span>
                    <span className="text-sm">{risk.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PowerQualitySystemOverviewProps {
  meters: PowerQualityMeter[];
  isTransmission?: boolean;
  pqLimits?: TxPowerQualityLimit[];
}

function PowerQualitySystemOverview({ meters, isTransmission = false, pqLimits = [] }: PowerQualitySystemOverviewProps) {
  const totalMeters = meters.length;
  const normalMeters = meters.filter(m => m.status === "Normal").length;
  const highMeters = meters.filter(m => m.status === "High").length;
  const criticalMeters = meters.filter(m => m.status === "Critical").length;

  const avgPowerFactor = totalMeters > 0 ? meters.reduce((sum, m) => sum + m.powerFactor, 0) / totalMeters : 0;
  const avgTHD = totalMeters > 0 ? meters.reduce((sum, m) => sum + m.thdPct, 0) / totalMeters : 0;
  const totalEvents = meters.reduce((sum, m) => sum + m.sagEventsCount + m.swellEventsCount, 0);

  // Get voltage level distribution for transmission
  const voltageLevelStats = useMemo(() => {
    if (!isTransmission) return null;

    const levels = new Map<number, number>();
    meters.forEach(meter => {
      const level = meter.voltageLevel || 400;
      levels.set(level, (levels.get(level) || 0) + 1);
    });

    return Array.from(levels.entries()).map(([level, count]) => ({
      level,
      count,
      limits: pqLimits.filter(limit => limit.voltage_level_kv === level).length
    }));
  }, [meters, isTransmission, pqLimits]);

  return (
    <div className="space-y-6">
      {/* System Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Meters"
          value={totalMeters}
          subtitle={isTransmission ? "Transmission meters" : "Power quality monitoring"}
          icon={Gauge}
          variant="primary"
        />
        <KPICard
          title="System Health"
          value={totalMeters > 0 ? `${Math.round((normalMeters / totalMeters) * 100)}%` : "0%"}
          subtitle={`${normalMeters}/${totalMeters} normal`}
          icon={Shield}
          variant={criticalMeters > 0 ? "destructive" : highMeters > 0 ? "warning" : "success"}
        />
        <KPICard
          title="Avg Power Factor"
          value={avgPowerFactor.toFixed(3)}
          subtitle="System efficiency"
          icon={Activity}
          variant={avgPowerFactor >= 0.90 ? "success" : avgPowerFactor >= 0.85 ? "warning" : "destructive"}
        />
        <KPICard
          title="Total PQ Events"
          value={totalEvents}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          variant={totalEvents === 0 ? "success" : totalEvents <= 5 ? "warning" : "destructive"}
        />
      </div>

      {/* Voltage Level Distribution (Transmission only) */}
      {isTransmission && voltageLevelStats && voltageLevelStats.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Voltage Level Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {voltageLevelStats.map(({ level, count, limits }) => (
              <div key={level} className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium">{level} kV</p>
                <p className="text-xs text-muted-foreground">{limits} PQ limits</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meter Status Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isTransmission ? "Power Quality Status by Substation/Feeder" : "Power Quality Status by Location"}
        </h3>
        <div className="space-y-3">
          {meters.map((meter) => (
            <div key={meter.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">{meter.name}</p>
                <p className="text-xs text-muted-foreground">{meter.scope}</p>
                {isTransmission && (
                  <div className="flex items-center gap-2 mt-1">
                    {meter.voltageLevel && (
                      <Badge variant="outline" className="text-xs">
                        {meter.voltageLevel} kV
                      </Badge>
                    )}
                    {meter.meterRole && (
                      <Badge variant="outline" className="text-xs">
                        {meter.meterRole.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs">
                  <p>PF: {meter.powerFactor.toFixed(3)}</p>
                  <p>THD: {meter.thdPct.toFixed(1)}%</p>
                </div>
                <StatusBadge status={meter.status.toLowerCase() as any} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isTransmission ? "Transmission Power Quality Monitoring" : "Power Quality Monitoring"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Select a Meter</p>
              <p className="text-xs text-muted-foreground">
                {isTransmission ?
                  "Choose a transmission meter to view detailed power quality metrics and voltage-level thresholds" :
                  "Choose a meter to view detailed power quality metrics"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Monitor Key Parameters</p>
              <p className="text-xs text-muted-foreground">
                {isTransmission ?
                  "Track power factor, THD, voltage, and frequency against transmission-specific limits" :
                  "Track power factor, THD, voltage, and frequency"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Assess Equipment Risks</p>
              <p className="text-xs text-muted-foreground">
                {isTransmission ?
                  "Review transmission equipment risks and grid stability impacts" :
                  "Review upstream equipment risks and mitigation strategies"
                }
              </p>
            </div>
          </div>
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