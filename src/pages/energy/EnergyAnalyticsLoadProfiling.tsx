import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadges } from "@/components/shared/SectorBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Plus,
  Download,
  Sparkles,
  Calendar,
  AlertTriangle,
  Zap,
  Settings,
} from "lucide-react";
import { getEnergyTypeIcon } from "@/lib/energy-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import { getAnalyticsProvider } from "@/lib/data/providers/AnalyticsProvider";
import type { TxSubstation, TxFeeder, TxEnergyMeterRegistry } from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface LoadProfile {
  id: string;
  name: string;
  scope: string;
  facilityType: "wellpad" | "compressor" | "utilities" | "substation" | "feeder";
  peakDemandKW: number;
  loadFactor: number;
  status: "Normal" | "High" | "Critical";
  linkedMeters: string[];
  timeRange?: string;
  currentKW?: number;
  // Transmission-specific fields
  substationName?: string;
  feederName?: string;
  voltageLevel?: number;
  demandWindow?: string;
}

interface DemandWindow {
  id: string;
  window_name: string;
  start_time: string;
  end_time: string;
  demand_charge_rate: number;
  days_of_week: number[];
  season?: string;
}

export function EnergyAnalyticsLoadProfiling() {
  const {
    energyMeters,
    energyTelemetry,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedProfile, setSelectedProfile] = useState<LoadProfile | null>(null);
  const [activeTab, setActiveTab] = useState("load-curve");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterval, setSelectedInterval] = useState<"15min" | "hourly" | "daily">("hourly");
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
  const [transmissionMeters, setTransmissionMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [demandWindows, setDemandWindows] = useState<DemandWindow[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if this is transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Load transmission data when in transmission context
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionData();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionData = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    try {
      const transmissionProvider = getTransmissionProvider();
      const analyticsProvider = getAnalyticsProvider();

      // Load substations
      const substationsData = await transmissionProvider.listTxSubstations({
        org_id: currentTenant.id,
        active: true
      });
      setSubstations(substationsData);

      // Load feeders
      const feedersData = await transmissionProvider.listTxFeeders({
        active: true
      });
      setFeeders(feedersData);

      // Load transmission meters
      const metersData = await transmissionProvider.listEnergyMetersTxScoped({
        org_id: currentTenant.id,
        active: true
      });
      setTransmissionMeters(metersData);

      // Mock demand windows data (would come from tx_demand_windows table)
      setDemandWindows([
        {
          id: "1",
          window_name: "peak",
          start_time: "06:00",
          end_time: "22:00",
          demand_charge_rate: 15.50,
          days_of_week: [1, 2, 3, 4, 5],
          season: "summer"
        },
        {
          id: "2",
          window_name: "off_peak",
          start_time: "22:00",
          end_time: "06:00",
          demand_charge_rate: 8.25,
          days_of_week: [1, 2, 3, 4, 5, 6, 7]
        }
      ]);

    } catch (error) {
      console.error('Failed to load transmission data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate load profiles from energy meters (upstream) or transmission topology (transmission)
  const loadProfiles: LoadProfile[] = useMemo(() => {
    if (isTransmission) {
      // Generate transmission load profiles by substation and feeder
      const profiles: LoadProfile[] = [];

      // Create substation-level profiles
      substations.forEach(substation => {
        const substationMeters = transmissionMeters.filter(m => m.substation_id === substation.id);
        if (substationMeters.length === 0) return;

        const totalCurrentKW = substationMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);
        const avgCurrentKW = totalCurrentKW / substationMeters.length;
        const peakDemandKW = totalCurrentKW * 1.2; // Estimate peak as 120% of current
        const loadFactor = (avgCurrentKW / peakDemandKW) * 100;

        // Determine status based on utilization
        let status: "Normal" | "High" | "Critical" = "Normal";
        if (loadFactor > 85) status = "Critical";
        else if (loadFactor > 70) status = "High";

        profiles.push({
          id: substation.id,
          name: `${substation.name} Substation`,
          scope: substation.name,
          facilityType: "substation",
          peakDemandKW,
          loadFactor,
          status,
          linkedMeters: substationMeters.map(m => m.id),
          timeRange: "24 hours",
          currentKW: totalCurrentKW,
          substationName: substation.name,
          voltageLevel: substation.voltage_levels_kv?.[0] || undefined
        });
      });

      // Create feeder-level profiles
      feeders.forEach(feeder => {
        const feederMeters = transmissionMeters.filter(m => m.feeder_id === feeder.id);
        if (feederMeters.length === 0) return;

        const totalCurrentKW = feederMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);
        const avgCurrentKW = totalCurrentKW / feederMeters.length;
        const peakDemandKW = totalCurrentKW * 1.15; // Feeder peak estimate
        const loadFactor = (avgCurrentKW / peakDemandKW) * 100;

        let status: "Normal" | "High" | "Critical" = "Normal";
        if (loadFactor > 80) status = "Critical";
        else if (loadFactor > 65) status = "High";

        const substation = substations.find(s => s.id === feeder.substation_id);

        profiles.push({
          id: feeder.id,
          name: `${feeder.name} Feeder`,
          scope: `${substation?.name || 'Unknown'} - ${feeder.name}`,
          facilityType: "feeder",
          peakDemandKW,
          loadFactor,
          status,
          linkedMeters: feederMeters.map(m => m.id),
          timeRange: "24 hours",
          currentKW: totalCurrentKW,
          substationName: substation?.name,
          feederName: feeder.name,
          voltageLevel: feeder.voltage_level_kv || undefined,
          demandWindow: "peak" // Default to peak window
        });
      });

      return profiles;
    } else {
      // Original upstream logic
      return energyMeters.map(meter => {
        const telemetry = energyTelemetry[meter.id];
        const peakDemandKW = telemetry ? Math.max(...telemetry.kW) : meter.currentKW;
        const avgDemandKW = telemetry ? telemetry.kW.reduce((sum, kw) => sum + kw, 0) / telemetry.kW.length : meter.currentKW;
        const loadFactor = (avgDemandKW / peakDemandKW) * 100;

        let facilityType: "wellpad" | "compressor" | "utilities";
        if (meter.scope.includes("Pad")) facilityType = "wellpad";
        else if (meter.scope.includes("Compressor")) facilityType = "compressor";
        else facilityType = "utilities";

        return {
          id: meter.id,
          name: `${meter.scope} Load Profile`,
          scope: meter.scope,
          facilityType,
          peakDemandKW,
          loadFactor,
          status: meter.status,
          linkedMeters: [meter.id],
          timeRange: "24 hours",
          currentKW: meter.currentKW
        };
      });
    }
  }, [isTransmission, energyMeters, energyTelemetry, substations, feeders, transmissionMeters]);

  const filteredProfiles = useMemo(() => {
    let result = loadProfiles;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.scope.toLowerCase().includes(query) ||
          profile.substationName?.toLowerCase().includes(query) ||
          profile.feederName?.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (filters.status) {
      result = result.filter(p => p.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Transmission-specific filters
    if (isTransmission) {
      if (filters.substationId) {
        result = result.filter(profile =>
          profile.facilityType === "substation" ? profile.id === filters.substationId :
            profile.substationName === substations.find(s => s.id === filters.substationId)?.name
        );
      }

      if (filters.feederId) {
        result = result.filter(profile =>
          profile.facilityType === "feeder" ? profile.id === filters.feederId :
            profile.feederName === feeders.find(f => f.id === filters.feederId)?.name
        );
      }
    }

    return result;
  }, [loadProfiles, searchQuery, isTransmission, filters.status, filters.substationId, filters.feederId, substations, feeders]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredProfiles.length > 0 && (!selectedProfile || !filteredProfiles.find(p => p.id === selectedProfile.id))) {
      setSelectedProfile(filteredProfiles[0]);
    }
  }, [filteredProfiles, selectedProfile]);

  const selectedProfileData = useMemo(() => {
    if (!selectedProfile) return null;

    // For transmission profiles, generate synthetic data based on demand windows
    if (isTransmission && (selectedProfile.facilityType === "substation" || selectedProfile.facilityType === "feeder")) {
      // Generate 24-hour load curve with demand window context
      const loadCurveData = Array.from({ length: 24 }, (_, hour) => {
        const timestamp = new Date();
        timestamp.setHours(hour, 0, 0, 0);

        // Determine if this hour is in peak period based on demand windows
        const isPeakPeriod = demandWindows.some(window => {
          if (window.window_name === "peak") {
            const startHour = parseInt(window.start_time.split(':')[0]);
            const endHour = parseInt(window.end_time.split(':')[0]);
            return hour >= startHour && hour < endHour;
          }
          return false;
        });

        // Generate load based on typical transmission patterns
        let baseLoad = selectedProfile.peakDemandKW * 0.6; // 60% base load

        // Add daily variation
        if (hour >= 6 && hour <= 10) baseLoad *= 1.3; // Morning peak
        else if (hour >= 17 && hour <= 21) baseLoad *= 1.4; // Evening peak
        else if (hour >= 22 || hour <= 5) baseLoad *= 0.7; // Night valley

        // Add some randomness
        const variation = 0.9 + Math.random() * 0.2;
        const kW = baseLoad * variation;

        return {
          time: timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          hour,
          kW,
          isPeakPeriod,
          peakIndicator: isPeakPeriod ? kW : null,
          demandCharge: isPeakPeriod ? kW * 15.50 : kW * 8.25 // Sample demand charges
        };
      });

      // Generate forecast data with transmission-specific patterns
      const forecastData = loadCurveData.map((point) => {
        const tomorrowTimestamp = new Date();
        tomorrowTimestamp.setDate(tomorrowTimestamp.getDate() + 1);
        tomorrowTimestamp.setHours(point.hour, 0, 0, 0);

        // Transmission forecast typically more stable than upstream
        const forecastVariation = 0.98 + Math.random() * 0.04; // ±2% variation
        const forecastKW = point.kW * forecastVariation;

        return {
          time: tomorrowTimestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          hour: tomorrowTimestamp.getHours(),
          actualKW: point.kW,
          forecastKW,
          confidence: 90 + Math.random() * 8, // 90-98% confidence for transmission
          demandWindow: point.isPeakPeriod ? "peak" : "off_peak"
        };
      });

      // Calculate transmission-specific metrics
      const peakPeriods = loadCurveData.filter(d => d.isPeakPeriod);
      const peakAvgKW = peakPeriods.length > 0 ? (peakPeriods.reduce((sum, d) => sum + d.kW, 0) / peakPeriods.length) : 0;
      const offPeakPeriods = loadCurveData.filter(d => !d.isPeakPeriod);
      const offPeakAvgKW = offPeakPeriods.length > 0 ? (offPeakPeriods.reduce((sum, d) => sum + d.kW, 0) / offPeakPeriods.length) : 0;

      // Calculate demand charges
      const peakDemandCharge = peakPeriods.length > 0 ? (Math.max(...peakPeriods.map(d => d.kW)) * 15.50) : 0;
      const totalDemandCost = loadCurveData.reduce((sum, d) => sum + (d.demandCharge || 0), 0);

      return {
        loadCurveData,
        forecastData,
        peakAvgKW,
        offPeakAvgKW,
        peakPeriods: peakPeriods.length,
        peakDemandCharge,
        totalDemandCost,
        demandWindows
      };
    }

    // Original upstream logic for non-transmission profiles
    const telemetry = energyTelemetry[selectedProfile.id];
    if (!telemetry) return null;

    // Prepare 24-hour load curve data
    const loadCurveData = telemetry.timestamp.map((timestamp, index) => {
      const hour = new Date(timestamp).getHours();
      const kW = telemetry.kW[index];

      // Determine if this is a peak period (typically 6 AM - 10 PM for industrial)
      const isPeakPeriod = hour >= 6 && hour <= 22;

      return {
        time: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        hour,
        kW,
        isPeakPeriod,
        peakIndicator: isPeakPeriod ? kW : null
      };
    });

    // Generate tomorrow's forecast (mock offset values)
    const forecastData = telemetry.timestamp.map((timestamp, index) => {
      const tomorrowTimestamp = new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000);
      const baseKW = telemetry.kW[index];
      // Add some variation for forecast (±5-10%)
      const forecastVariation = 0.95 + Math.random() * 0.1;
      const forecastKW = baseKW * forecastVariation;

      return {
        time: tomorrowTimestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        hour: tomorrowTimestamp.getHours(),
        actualKW: baseKW,
        forecastKW,
        confidence: 85 + Math.random() * 10 // 85-95% confidence
      };
    });

    // Calculate peak periods
    const peakPeriods = loadCurveData.filter(d => d.isPeakPeriod);
    const peakAvgKW = peakPeriods.length > 0 ? (peakPeriods.reduce((sum, d) => sum + d.kW, 0) / peakPeriods.length) : 0;
    const offPeakPeriods = loadCurveData.filter(d => !d.isPeakPeriod);
    const offPeakAvgKW = offPeakPeriods.length > 0 ? (offPeakPeriods.reduce((sum, d) => sum + d.kW, 0) / offPeakPeriods.length) : 0;

    return {
      loadCurveData,
      forecastData,
      peakAvgKW,
      offPeakAvgKW,
      peakPeriods: peakPeriods.length
    };
  }, [selectedProfile, energyTelemetry, isTransmission, demandWindows]);

  const renderWorkPaneContent = () => {
    if (!selectedProfile) {
      return <LoadProfilingOverview profiles={filteredProfiles} sector={sector} subsector={subsector} isTransmission={isTransmission} />;
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="load-curve">24-Hour Load Curve</TabsTrigger>
          <TabsTrigger value="forecast">Tomorrow's Forecast</TabsTrigger>
          <TabsTrigger value="analytics">Load Analytics</TabsTrigger>
          {isTransmission && <TabsTrigger value="demand-windows">Demand Windows</TabsTrigger>}
        </TabsList>

        <TabsContent value="load-curve" className="space-y-4">
          <LoadCurveView profile={selectedProfile} data={selectedProfileData} isTransmission={isTransmission} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <ForecastView profile={selectedProfile} data={selectedProfileData} isTransmission={isTransmission} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <LoadAnalyticsView profile={selectedProfile} data={selectedProfileData} isTransmission={isTransmission} />
        </TabsContent>

        {isTransmission && (
          <TabsContent value="demand-windows" className="space-y-4">
            <DemandWindowsView profile={selectedProfile} data={selectedProfileData} demandWindows={demandWindows} />
          </TabsContent>
        )}
      </Tabs>
    );
  };

  const filterView = (
    <div className="space-y-4">
      <EnergyListFilter
        filters={filters}
        onFiltersChange={setFilters}
        showTypeFilter={false}
        showRoleFilter={isTransmission}
        showSubstationFilter={isTransmission}
        showFeederFilter={isTransmission}
      />
      <div className="px-2 pb-2">
        <label className="text-xs text-muted-foreground mb-1 block">Analysis Interval</label>
        <Select value={selectedInterval} onValueChange={setSelectedInterval as any}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15min">15-min</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <EMSPageShell
      title="Load Profiling"
      featureSetName="Energy Analytics & Optimisation"
      featureName="Load Profiling"
      listType="profiles"
      listItems={filteredProfiles}
      selectedItem={selectedProfile}
      onItemSelect={(item) => {
        setSelectedProfile(item as LoadProfile);
        setActiveTab("load-curve");
      }}

      workPaneContent={renderWorkPaneContent()}
      searchPlaceholder={isTransmission ? "Search substations, feeders, profiles..." : "Search load profiles..."}
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            AI Forecast
          </Button>
          {isTransmission && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Demand Windows
            </Button>
          )}
        </div>
      }
    />
  );
}

interface LoadCurveViewProps {
  profile: LoadProfile;
  data: any;
  isTransmission: boolean;
}

function LoadCurveView({ profile, data, isTransmission }: LoadCurveViewProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No load curve data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Peak Demand"
          value={`${profile.peakDemandKW.toFixed(1)} kW`}
          subtitle={isTransmission ? "Maximum grid load" : "Maximum load today"}
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Load Factor"
          value={`${profile.loadFactor.toFixed(1)}%`}
          subtitle="Efficiency metric"
          icon={Target}
          variant="default"
        />
        <KPICard
          title="Peak Period Avg"
          value={`${data.peakAvgKW.toFixed(1)} kW`}
          subtitle={isTransmission ? "Peak window average" : "6 AM - 10 PM average"}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Off-Peak Avg"
          value={`${data.offPeakAvgKW.toFixed(1)} kW`}
          subtitle={isTransmission ? "Off-peak window average" : "10 PM - 6 AM average"}
          icon={Activity}
          variant="success"
        />
      </div>

      {/* Transmission-specific KPIs */}
      {isTransmission && data.peakDemandCharge && (
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            title="Peak Demand Charge"
            value={`$${data.peakDemandCharge.toFixed(2)}`}
            subtitle="Monthly peak charge"
            icon={Zap}
            variant="warning"
          />
          <KPICard
            title="Voltage Level"
            value={`${profile.voltageLevel || 'N/A'} kV`}
            subtitle={profile.facilityType === 'substation' ? 'Primary voltage' : 'Feeder voltage'}
            icon={Activity}
            variant="default"
          />
          <KPICard
            title="Linked Meters"
            value={profile.linkedMeters.length}
            subtitle="Monitoring points"
            icon={BarChart3}
            variant="success"
          />
        </div>
      )}

      {/* 24-Hour Load Curve */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isTransmission ? "24-Hour Load Curve with Demand Windows" : "24-Hour Load Curve with Peak Periods"}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.loadCurveData}>
              <defs>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
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
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} kW`,
                  name === 'kW' ? 'Load' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="kW"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#loadGradient)"
              />
              <Area
                type="monotone"
                dataKey="peakIndicator"
                stroke="hsl(var(--warning))"
                strokeWidth={3}
                fill="url(#peakGradient)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Load Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>{isTransmission ? "Peak Demand Windows" : "Peak Periods (6 AM - 10 PM)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ForecastViewProps {
  profile: LoadProfile;
  data: any;
  isTransmission: boolean;
}

function ForecastView({ profile, data, isTransmission }: ForecastViewProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No forecast data available</p>
      </div>
    );
  }

  const avgConfidence = data.forecastData.reduce((sum: number, d: any) => sum + d.confidence, 0) / data.forecastData.length;
  const forecastPeak = Math.max(...data.forecastData.map((d: any) => d.forecastKW));
  const actualPeak = Math.max(...data.forecastData.map((d: any) => d.actualKW));
  const peakVariation = actualPeak !== 0 ? ((forecastPeak - actualPeak) / actualPeak) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Forecast KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Forecast Confidence"
          value={`${avgConfidence.toFixed(1)}%`}
          subtitle="Model accuracy"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="Tomorrow's Peak"
          value={`${forecastPeak.toFixed(1)} kW`}
          subtitle="Predicted maximum"
          icon={TrendingUp}
          variant="default"
          trend={peakVariation > 0 ? "up" : "down"}
          trendValue={`${Math.abs(peakVariation).toFixed(1)}%`}
        />
        <KPICard
          title="Forecast Model"
          value={isTransmission ? "Grid-ML" : "AI-ML"}
          subtitle={isTransmission ? "Transmission analysis" : "Time series analysis"}
          icon={Sparkles}
          variant="success"
        />
        <KPICard
          title="Update Frequency"
          value={isTransmission ? "30 min" : "Hourly"}
          subtitle="Next: 15 min"
          icon={Calendar}
          variant="warning"
        />
      </div>

      {/* Transmission-specific forecast metrics */}
      {isTransmission && (
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            title="Grid Stability"
            value="98.5%"
            subtitle="Forecast reliability"
            icon={Zap}
            variant="success"
          />
          <KPICard
            title="Demand Window Impact"
            value={`$${((forecastPeak * 15.50) - (actualPeak * 15.50)).toFixed(2)}`}
            subtitle="Cost difference vs today"
            icon={TrendingUp}
            variant={peakVariation > 0 ? "warning" : "success"}
          />
        </div>
      )}

      {/* Forecast Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tomorrow's Load Forecast</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
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
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} kW`,
                  name === 'actualKW' ? 'Today (Actual)' : name === 'forecastKW' ? 'Tomorrow (Forecast)' : name
                ]}
              />
              <Line
                type="monotone"
                dataKey="actualKW"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecastKW"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-muted-foreground rounded-full"></div>
            <span>Today (Actual)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Tomorrow (Forecast)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadAnalyticsViewProps {
  profile: LoadProfile;
  data: any;
  isTransmission: boolean;
}

function LoadAnalyticsView({ profile, data, isTransmission }: LoadAnalyticsViewProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const peakToOffPeakRatio = data.offPeakAvgKW !== 0 ? data.peakAvgKW / data.offPeakAvgKW : 0;
  const demandVariability = data.offPeakAvgKW !== 0 ? ((profile.peakDemandKW - data.offPeakAvgKW) / data.offPeakAvgKW * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Load Profile Analytics</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label={isTransmission ? "Asset Type" : "Facility Type"} value={profile.facilityType.charAt(0).toUpperCase() + profile.facilityType.slice(1)} />
            <InfoRow label="Peak Demand" value={`${profile.peakDemandKW.toFixed(1)} kW`} />
            <InfoRow label="Load Factor" value={`${profile.loadFactor.toFixed(1)}%`} />
            <InfoRow label={isTransmission ? "Peak Windows" : "Peak Periods"} value={`${data.peakPeriods} hours/day`} />
            {isTransmission && profile.voltageLevel && (
              <InfoRow label="Voltage Level" value={`${profile.voltageLevel} kV`} />
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label="Peak/Off-Peak Ratio" value={`${peakToOffPeakRatio.toFixed(2)}:1`} />
            <InfoRow label="Demand Variability" value={`${demandVariability.toFixed(1)}%`} />
            <InfoRow label="Linked Meters" value={profile.linkedMeters.length.toString()} />
            <InfoRow label="Status" value={profile.status} />
            {isTransmission && (
              <InfoRow label="Grid Context" value={profile.substationName ? `${profile.substationName}${profile.feederName ? ` - ${profile.feederName}` : ''}` : 'N/A'} />
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Load Factor Analysis
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">Current Load Factor</p>
              <p className="text-xs text-muted-foreground">
                {profile.loadFactor >= (isTransmission ? 75 : 70) ? "Excellent efficiency" :
                  profile.loadFactor >= (isTransmission ? 60 : 50) ? "Good efficiency" :
                    "Room for improvement"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{profile.loadFactor.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Target: {isTransmission ? "75%" : "70%"}+
              </p>
            </div>
          </div>

          {profile.loadFactor < (isTransmission ? 75 : 70) && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Optimization Opportunity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isTransmission
                    ? "Load factor below 75% indicates potential for grid optimization and demand management."
                    : "Load factor below 70% indicates potential for demand management and efficiency improvements."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-success" />
          {isTransmission ? "Grid Optimization Recommendations" : "AI Recommendations"}
        </h3>
        <div className="space-y-3">
          {isTransmission ? (
            <>
              <RecommendationItem num={1} title="Demand Window Optimization" desc="Shift non-critical loads outside peak demand windows" />
              <RecommendationItem num={2} title="Feeder Load Balancing" desc="Balance loads across feeders to improve utilization" />
              <RecommendationItem num={3} title="Grid Demand Response" desc="Participate in utility demand response programs" />
            </>
          ) : (
            <>
              <RecommendationItem num={1} title="Peak Shaving Opportunity" desc="Consider load shifting during peak hours (6 AM - 10 PM)" />
              <RecommendationItem num={2} title="Demand Response Program" desc="Enroll in utility demand response for cost savings" />
              <RecommendationItem num={3} title="Equipment Scheduling" desc="Optimize non-critical equipment operation timing" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationItem({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
        {num}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

interface DemandWindowsViewProps {
  profile: LoadProfile;
  data: any;
  demandWindows: DemandWindow[];
}

function DemandWindowsView({ profile, data, demandWindows }: DemandWindowsViewProps) {
  if (!data || !demandWindows.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No demand window data available</p>
      </div>
    );
  }

  const peakWindow = demandWindows.find(w => w.window_name === "peak");
  const offPeakWindow = demandWindows.find(w => w.window_name === "off_peak");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Peak Window Rate"
          value={`$${peakWindow?.demand_charge_rate.toFixed(2) || '0.00'}/kW`}
          subtitle="Peak demand charge"
          icon={Zap}
          variant="warning"
        />
        <KPICard
          title="Off-Peak Rate"
          value={`$${offPeakWindow?.demand_charge_rate.toFixed(2) || '0.00'}/kW`}
          subtitle="Off-peak demand charge"
          icon={Clock}
          variant="success"
        />
        <KPICard
          title="Monthly Peak Charge"
          value={`$${data.peakDemandCharge?.toFixed(2) || '0.00'}`}
          subtitle="Based on current peak"
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Potential Savings"
          value={`$${((data.peakDemandCharge || 0) * 0.15).toFixed(2)}`}
          subtitle="15% optimization target"
          icon={Target}
          variant="success"
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Demand Window Configuration</h3>
        <div className="space-y-4">
          {demandWindows.map((window) => (
            <div key={window.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  window.window_name === "peak" ? "bg-warning" : "bg-success"
                )} />
                <div>
                  <p className="text-sm font-medium capitalize">{window.window_name.replace('_', ' ')} Window</p>
                  <p className="text-xs text-muted-foreground">
                    {window.start_time} - {window.end_time}
                    {window.season && ` (${window.season})`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${window.demand_charge_rate.toFixed(2)}/kW</p>
                <p className="text-xs text-muted-foreground">
                  {window.days_of_week.length === 7 ? "All days" :
                    window.days_of_week.length === 5 ? "Weekdays" :
                      `${window.days_of_week.length} days/week`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Load Profile with Demand Windows</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.loadCurveData}>
              <defs>
                <linearGradient id="peakWindowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="offPeakGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                formatter={(value: any) => [`${value.toFixed(1)} kW`, 'Load']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area type="monotone" dataKey="peakIndicator" stroke="hsl(var(--warning))" strokeWidth={0} fill="url(#peakWindowGradient)" connectNulls={false} />
              <Area type="monotone" dataKey="kW" stroke="hsl(var(--primary))" strokeWidth={3} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Load Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>Peak Window ({peakWindow?.start_time} - {peakWindow?.end_time})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Off-Peak Window</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-success" />
          Demand Window Optimization
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-semibold text-sm">1</div>
            <div>
              <p className="text-sm font-medium">Load Shifting Opportunity</p>
              <p className="text-xs text-muted-foreground">Shift {((data.peakAvgKW - data.offPeakAvgKW) * 0.3).toFixed(1)} kW from peak to off-peak windows</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-semibold text-sm">2</div>
            <div>
              <p className="text-sm font-medium">Peak Demand Reduction</p>
              <p className="text-xs text-muted-foreground">Target 10% peak reduction could save ${((data.peakDemandCharge || 0) * 0.1).toFixed(2)}/month</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-semibold text-sm">3</div>
            <div>
              <p className="text-sm font-medium">Demand Response Participation</p>
              <p className="text-xs text-muted-foreground">Enroll in utility DR programs for additional ${(data.peakDemandCharge * 0.05).toFixed(2)}/month credits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadProfilingOverview({ profiles, sector, subsector, isTransmission }: LoadProfilingOverviewProps) {
  const totalPeakDemand = profiles.reduce((sum, profile) => sum + profile.peakDemandKW, 0);
  const avgLoadFactor = profiles.length > 0 ? profiles.reduce((sum, profile) => sum + profile.loadFactor, 0) / profiles.length : 0;
  const highEfficiencyProfiles = profiles.filter(profile => profile.loadFactor >= (isTransmission ? 75 : 70)).length;
  const criticalProfiles = profiles.filter(profile => profile.status === "Critical").length;

  const substationProfiles = profiles.filter(p => p.facilityType === "substation").length;
  const feederProfiles = profiles.filter(p => p.facilityType === "feeder").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Profiles" value={profiles.length} subtitle={isTransmission ? "Grid monitoring points" : "Load monitoring points"} icon={BarChart3} variant="primary" />
        <KPICard title="Total Peak Demand" value={`${totalPeakDemand.toFixed(1)} kW`} subtitle={isTransmission ? "Combined grid peak" : "Combined maximum load"} icon={TrendingUp} variant="default" />
        <KPICard title="Avg Load Factor" value={`${avgLoadFactor.toFixed(1)}%`} subtitle={isTransmission ? "Grid efficiency" : "System efficiency"} icon={Target} variant="success" />
        <KPICard title="High Efficiency" value={highEfficiencyProfiles} subtitle={`${profiles.length > 0 ? Math.round((highEfficiencyProfiles / profiles.length) * 100) : 0}% of profiles`} icon={Activity} variant={highEfficiencyProfiles === profiles.length ? "success" : "warning"} />
      </div>

      {isTransmission && (
        <div className="grid grid-cols-3 gap-4">
          <KPICard title="Substation Profiles" value={substationProfiles} subtitle="High-level aggregation" icon={Zap} variant="primary" />
          <KPICard title="Feeder Profiles" value={feederProfiles} subtitle="Circuit-level detail" icon={Activity} variant="default" />
          <KPICard title="Critical Assets" value={criticalProfiles} subtitle="Requiring attention" icon={AlertTriangle} variant={criticalProfiles > 0 ? "warning" : "success"} />
        </div>
      )}

      {sector && subsector && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{isTransmission ? "Transmission Grid Context" : "Industry Context"}</h3>
          <SectorBadges sector={sector} subsector={subsector} size="md" className="mb-3" />
          <p className="text-sm text-muted-foreground">
            {isTransmission
              ? "Load profiling optimized for Power Transmission grid operations. Analyze substation and feeder load patterns with utility-specific demand windows and tariff structures."
              : `Load profiling optimized for ${sector} ${subsector} operations. Select a load profile from the list to view detailed 24-hour curves, forecasting, and analytics.`
            }
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{isTransmission ? "Transmission Load Profiling Features" : "Load Profiling Features"}</h3>
        <div className="space-y-3">
          <FeatureItem num={1} title={isTransmission ? "Grid Load Curves" : "24-Hour Load Curves"} desc={isTransmission ? "Visualize substation and feeder demand patterns with utility demand windows" : "Visualize demand patterns with peak period highlights"} />
          <FeatureItem num={2} title={isTransmission ? "Grid-Aware Forecasting" : "AI-Powered Forecasting"} desc={isTransmission ? "Predict grid load with transmission-specific models and confidence intervals" : "Predict tomorrow's load with confidence intervals"} />
          <FeatureItem num={3} title={isTransmission ? "Demand Window Analysis" : "Load Factor Analysis"} desc={isTransmission ? "Optimize demand charges with utility-specific window configurations" : "Identify efficiency opportunities and optimization potential"} />
          {isTransmission && (
            <FeatureItem num={4} title="Grid Optimization" desc="Transmission-specific recommendations for load balancing and demand response" />
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">{num}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
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

interface LoadProfilingOverviewProps {
  profiles: LoadProfile[];
  sector: string | null;
  subsector: string | null;
  isTransmission: boolean;
}

export { EnergyAnalyticsLoadProfiling as default };