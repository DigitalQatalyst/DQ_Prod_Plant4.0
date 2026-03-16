import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sun,
  Zap,
  Battery,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Power,
  Gauge,
  Activity,
  BarChart3,
  Leaf,
  Plus,
  Wrench,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
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

interface RenewableAsset {
  id: string;
  name: string;
  type: "solar" | "wind" | "battery" | "hybrid";
  status: "online" | "offline" | "maintenance" | "not_configured";
  capacityKW: number;
  currentOutputKW: number;
  dailyGenerationKWh: number;
  efficiency: number;
  location: string;
  installDate?: string;
  lastMaintenance?: string;
  // Transmission-specific fields
  substationId?: string;
  substationName?: string;
  feederName?: string;
  contractType?: "ppa" | "rec" | "vppa" | "green_tariff" | "on_site_generation";
  contractName?: string;
  contractEndDate?: string;
  recEligible?: boolean;
  totalRecsIssued?: number;
}

interface RenewableMetrics {
  totalCapacityKW: number;
  totalGenerationKWh: number;
  totalConsumptionKWh: number;
  renewablePercentage: number;
  co2Avoided: number;
  costSavings: number;
}

// Mock renewable assets data - Upstream
const mockUpstreamRenewableAssets: RenewableAsset[] = [
  {
    id: "solar-01",
    name: "Wellhead Solar Array",
    type: "solar",
    status: "online",
    capacityKW: 50,
    currentOutputKW: 35.2,
    dailyGenerationKWh: 280,
    efficiency: 85,
    location: "Wellhead WH-01",
    installDate: "2023-06-15",
    lastMaintenance: "2024-11-15"
  },
  {
    id: "solar-02",
    name: "Compressor Station Solar",
    type: "solar",
    status: "online",
    capacityKW: 75,
    currentOutputKW: 52.8,
    dailyGenerationKWh: 420,
    efficiency: 88,
    location: "Gas Compressor GC-11",
    installDate: "2023-08-20",
    lastMaintenance: "2024-10-20"
  },
  {
    id: "battery-01",
    name: "Energy Storage System",
    type: "battery",
    status: "online",
    capacityKW: 100,
    currentOutputKW: -25.5, // Negative indicates charging
    dailyGenerationKWh: 150, // Discharge capacity
    efficiency: 92,
    location: "Central Battery Bank",
    installDate: "2023-09-10",
    lastMaintenance: "2024-12-01"
  },
  {
    id: "hybrid-01",
    name: "Solar-Genset Hybrid",
    type: "hybrid",
    status: "not_configured",
    capacityKW: 200,
    currentOutputKW: 0,
    dailyGenerationKWh: 0,
    efficiency: 0,
    location: "Remote Pad A",
    installDate: undefined,
    lastMaintenance: undefined
  }
];

// Mock renewable assets data - Transmission
const mockTransmissionRenewableAssets: RenewableAsset[] = [
  {
    id: "tx-solar-01",
    name: "Substation Solar Farm",
    type: "solar",
    status: "online",
    capacityKW: 5000,
    currentOutputKW: 3850,
    dailyGenerationKWh: 28000,
    efficiency: 89,
    location: "Central Substation",
    substationId: "sub-01",
    substationName: "Central Substation",
    feederName: "Feeder F-101",
    contractType: "ppa",
    contractName: "Solar PPA 2023-2043",
    contractEndDate: "2043-12-31",
    recEligible: true,
    totalRecsIssued: 1250,
    installDate: "2023-01-15",
    lastMaintenance: "2024-11-20"
  },
  {
    id: "tx-wind-01",
    name: "Grid-Connected Wind Farm",
    type: "wind",
    status: "online",
    capacityKW: 10000,
    currentOutputKW: 7200,
    dailyGenerationKWh: 156000,
    efficiency: 92,
    location: "North Substation",
    substationId: "sub-02",
    substationName: "North Substation",
    feederName: "Feeder F-205",
    contractType: "vppa",
    contractName: "Virtual Wind PPA",
    contractEndDate: "2038-06-30",
    recEligible: true,
    totalRecsIssued: 3420,
    installDate: "2022-06-10",
    lastMaintenance: "2024-10-15"
  },
  {
    id: "tx-battery-01",
    name: "Grid-Scale Battery Storage",
    type: "battery",
    status: "online",
    capacityKW: 2000,
    currentOutputKW: -500, // Charging
    dailyGenerationKWh: 8000,
    efficiency: 94,
    location: "East Substation",
    substationId: "sub-03",
    substationName: "East Substation",
    feederName: "Feeder F-312",
    contractType: "on_site_generation",
    contractName: "Battery Storage System",
    recEligible: false,
    totalRecsIssued: 0,
    installDate: "2023-09-01",
    lastMaintenance: "2024-12-05"
  },
  {
    id: "tx-solar-02",
    name: "Community Solar Project",
    type: "solar",
    status: "online",
    capacityKW: 3000,
    currentOutputKW: 2100,
    dailyGenerationKWh: 18000,
    efficiency: 87,
    location: "West Substation",
    substationId: "sub-04",
    substationName: "West Substation",
    feederName: "Feeder F-418",
    contractType: "green_tariff",
    contractName: "Green Tariff Program",
    contractEndDate: "2030-12-31",
    recEligible: true,
    totalRecsIssued: 890,
    installDate: "2023-03-20",
    lastMaintenance: "2024-09-10"
  },
  {
    id: "tx-rec-01",
    name: "Renewable Energy Credits",
    type: "solar",
    status: "online",
    capacityKW: 0, // RECs only, no physical generation
    currentOutputKW: 0,
    dailyGenerationKWh: 5000, // Equivalent generation
    efficiency: 100,
    location: "Virtual - Regional Grid",
    contractType: "rec",
    contractName: "REC Purchase Agreement",
    contractEndDate: "2026-12-31",
    recEligible: true,
    totalRecsIssued: 2100,
    installDate: "2024-01-01"
  }
];

export function EnergySustainabilityRenewables() {
  const {
    energyMeters,
    energyTelemetry,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedAsset, setSelectedAsset] = useState<RenewableAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [enableRenewables, setEnableRenewables] = useState(true);

  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  // Determine if we're in transmission context
  const isTransmission = sector?.toLowerCase() === 'power' && subsector?.toLowerCase() === 'transmission';

  // Select appropriate mock data based on sector
  const mockRenewableAssets = isTransmission ? mockTransmissionRenewableAssets : mockUpstreamRenewableAssets;

  // Calculate total consumption from energy meters
  const totalConsumptionKWh = useMemo(() => {
    return energyMeters.reduce((sum, meter) => {
      const telemetry = energyTelemetry[meter.id];
      return sum + (telemetry?.kWh[telemetry.kWh.length - 1] || 0);
    }, 0);
  }, [energyMeters, energyTelemetry]);

  // Calculate renewable metrics
  const renewableMetrics: RenewableMetrics = useMemo(() => {
    const activeAssets = mockRenewableAssets.filter(asset => asset.status === "online");

    const totalCapacityKW = activeAssets.reduce((sum, asset) => sum + asset.capacityKW, 0);
    const totalGenerationKWh = activeAssets.reduce((sum, asset) => sum + asset.dailyGenerationKWh, 0);

    // Cap renewable contribution at 100% of consumption
    const renewablePercentage = totalConsumptionKWh > 0
      ? Math.min((totalGenerationKWh / totalConsumptionKWh) * 100, 100)
      : 0;

    const co2Avoided = totalGenerationKWh * emissionFactors.electricityKgCo2PerKWh;
    const costSavings = totalGenerationKWh * 0.12; // Mock cost per kWh

    return {
      totalCapacityKW,
      totalGenerationKWh,
      totalConsumptionKWh,
      renewablePercentage,
      co2Avoided,
      costSavings
    };
  }, [totalConsumptionKWh, emissionFactors, mockRenewableAssets]);

  const filteredAssets = useMemo(() => {
    let currentAssets = mockRenewableAssets;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      currentAssets = currentAssets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(q) ||
          asset.type.toLowerCase().includes(q) ||
          asset.location.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      currentAssets = currentAssets.filter(asset => asset.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.type) {
      currentAssets = currentAssets.filter(asset => asset.type.toLowerCase() === filters.type.toLowerCase());
    }

    if (filters.role) {
      currentAssets = currentAssets.filter(asset => asset.contractType === filters.role);
    }

    if (isTransmission) {
      if (filters.substationId) {
        currentAssets = currentAssets.filter(asset => asset.substationId === filters.substationId);
      }
    }

    return currentAssets;
  }, [mockRenewableAssets, searchQuery, isTransmission, filters]);

  // Generate generation vs consumption data
  const generationData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const solarGeneration = hour >= 6 && hour <= 18
        ? Math.sin((hour - 6) * Math.PI / 12) * renewableMetrics.totalGenerationKWh / 10
        : 0;
      const consumption = totalConsumptionKWh / 24 * (0.8 + Math.random() * 0.4);

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        generation: solarGeneration,
        consumption: consumption,
        net: solarGeneration - consumption
      };
    });
  }, [renewableMetrics.totalGenerationKWh, totalConsumptionKWh]);

  const listItems = filteredAssets.map(asset => ({
    id: asset.id,
    name: asset.name,
    subtitle: `${asset.capacityKW} kW • ${asset.location}`,
    status: asset.status,
    metadata: {
      type: asset.type,
      currentOutput: asset.currentOutputKW,
      efficiency: asset.efficiency
    }
  }));

  const workPaneContent = selectedAsset ? (
    <RenewableAssetDetails
      asset={selectedAsset}
      metrics={renewableMetrics}
    />
  ) : (
    <RenewablesOverview
      assets={mockRenewableAssets}
      metrics={renewableMetrics}
      generationData={generationData}
      enableRenewables={enableRenewables}
      onToggleRenewables={setEnableRenewables}
      sector={sector}
      subsector={subsector}
    />
  );

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showRoleFilter={isTransmission}
      showSubstationFilter={isTransmission}
      showFeederFilter={isTransmission}
      showTypeFilter={true}
      roleOptions={[
        { label: "PPA", value: "ppa" },
        { label: "VPPA", value: "vppa" },
        { label: "REC", value: "rec" },
        { label: "Green Tariff", value: "green_tariff" },
        { label: "On-site Gen", value: "on_site_generation" }
      ]}
      typeOptions={[
        { label: "Solar", value: "solar" },
        { label: "Wind", value: "wind" },
        { label: "Battery", value: "battery" },
        { label: "Hybrid", value: "hybrid" }
      ]}
      statusOptions={[
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
        { label: "Maintenance", value: "maintenance" }
      ]}
    />
  );

  return (
    <EMSPageShell
      title="Renewables"
      featureSetName="Sustainability & Emissions Tracking"
      featureName="Renewables"
      listType="meters"
      listItems={listItems}
      selectedItem={selectedAsset}
      onItemSelect={(item) => {
        const asset = mockRenewableAssets.find(a => a.id === item.id);
        setSelectedAsset(asset || null);
      }}
      workPaneContent={workPaneContent}
      searchPlaceholder="Search renewable assets..."
      listFilterContent={filterView}
      actions={
        <div className="flex flex-col gap-2">
          <Button size="sm" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Asset
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

interface RenewableAssetListItemProps {
  asset: RenewableAsset;
  isSelected: boolean;
  onClick: () => void;
}

function RenewableAssetListItem({ asset, isSelected, onClick }: RenewableAssetListItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "solar": return <Sun className="w-4 h-4" />;
      case "wind": return <Activity className="w-4 h-4" />;
      case "battery": return <Battery className="w-4 h-4" />;
      case "hybrid": return <Zap className="w-4 h-4" />;
      default: return <Power className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-success";
      case "offline": return "text-destructive";
      case "maintenance": return "text-warning";
      case "not_configured": return "text-muted-foreground";
      default: return "text-muted-foreground";
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
        {getTypeIcon(asset.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {asset.name}
          </span>
          <StatusBadge status={asset.status} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{asset.location}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{asset.capacityKW} kW capacity</span>
          {asset.status === "online" ? (
            <span className={getStatusColor(asset.status)}>
              {asset.currentOutputKW >= 0 ? '+' : ''}{asset.currentOutputKW.toFixed(1)} kW
            </span>
          ) : (
            <span className={getStatusColor(asset.status)}>
              {asset.status === "not_configured" ? "Not configured" : asset.status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface RenewableAssetDetailsProps {
  asset: RenewableAsset;
  metrics: RenewableMetrics;
}

function RenewableAssetDetails({ asset, metrics }: RenewableAssetDetailsProps) {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'Power' && subsector === 'Transmission';

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "online": return "success";
      case "offline": return "destructive";
      case "maintenance": return "warning";
      case "not_configured": return "default";
      default: return "default";
    }
  };

  // Generate hourly generation data for the asset
  const hourlyData = useMemo(() => {
    if (asset.status !== "online") return [];

    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      let generation = 0;

      if (asset.type === "solar" && hour >= 6 && hour <= 18) {
        generation = Math.sin((hour - 6) * Math.PI / 12) * asset.dailyGenerationKWh / 10;
      } else if (asset.type === "battery") {
        // Battery discharge pattern
        generation = asset.dailyGenerationKWh / 24 * (0.5 + Math.random() * 1);
      } else if (asset.type === "hybrid") {
        generation = asset.dailyGenerationKWh / 24 * (0.8 + Math.random() * 0.4);
      }

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        generation: generation,
        capacity: asset.capacityKW
      };
    });
  }, [asset]);

  if (asset.status === "not_configured") {
    return (
      <div className="space-y-6">
        {/* Not Configured State */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Asset Not Configured</h3>
          <p className="text-muted-foreground mb-6">
            This renewable asset is available but not yet configured for operation.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium">Potential Capacity</p>
              <p className="text-2xl font-bold">{asset.capacityKW} kW</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium">Asset Type</p>
              <p className="text-2xl font-bold capitalize">{asset.type}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground">Enable this renewable asset</span>
            <Switch />
          </div>

          <div className="flex gap-2 justify-center">
            <Button className="gap-2">
              <Wrench className="w-4 h-4" />
              Configure Asset
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Configuration Benefits */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration Benefits</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">CO₂ Reduction</span>
              </div>
              <p className="text-xl font-bold text-success">~{(asset.capacityKW * 8 * 0.5).toFixed(0)} kg/day</p>
              <p className="text-xs text-muted-foreground">Estimated carbon savings</p>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Energy Generation</span>
              </div>
              <p className="text-xl font-bold text-primary">~{(asset.capacityKW * 8).toFixed(0)} kWh/day</p>
              <p className="text-xs text-muted-foreground">Estimated daily generation</p>
            </div>
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium">Cost Savings</span>
              </div>
              <p className="text-xl font-bold text-warning">${(asset.capacityKW * 8 * 0.12).toFixed(0)}/day</p>
              <p className="text-xs text-muted-foreground">Estimated energy cost savings</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asset KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Current Output"
          value={`${asset.currentOutputKW >= 0 ? '+' : ''}${asset.currentOutputKW.toFixed(1)} kW`}
          subtitle={asset.currentOutputKW >= 0 ? "Generating" : "Charging"}
          icon={Power}
          variant={asset.currentOutputKW >= 0 ? "success" : "primary"}
        />
        <KPICard
          title="Capacity"
          value={`${asset.capacityKW} kW`}
          subtitle="Maximum output"
          icon={Gauge}
          variant="primary"
        />
        <KPICard
          title="Daily Generation"
          value={`${asset.dailyGenerationKWh} kWh`}
          subtitle="Today's output"
          icon={Zap}
          variant="success"
        />
        <KPICard
          title="Efficiency"
          value={`${asset.efficiency}%`}
          subtitle="System efficiency"
          icon={TrendingUp}
          variant={asset.efficiency >= 85 ? "success" : asset.efficiency >= 75 ? "warning" : "destructive"}
        />
      </div>

      {/* Asset Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Asset ID" value={asset.id} />
            <InfoRow label="Type" value={asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} />
            <InfoRow label="Location" value={asset.location} />
            <InfoRow label="Status" value={asset.status} />
            {isTransmission && asset.substationName && (
              <InfoRow label="Substation" value={asset.substationName} />
            )}
            {isTransmission && asset.feederName && (
              <InfoRow label="Feeder" value={asset.feederName} />
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label="Capacity" value={`${asset.capacityKW} kW`} />
            <InfoRow label="Current Output" value={`${asset.currentOutputKW.toFixed(1)} kW`} />
            <InfoRow label="Efficiency" value={`${asset.efficiency}%`} />
            <InfoRow label="Install Date" value={asset.installDate || "N/A"} />
            {isTransmission && asset.contractType && (
              <InfoRow label="Contract Type" value={asset.contractType.toUpperCase()} />
            )}
            {isTransmission && asset.recEligible && (
              <InfoRow label="REC Eligible" value="Yes" />
            )}
          </div>
        </div>
      </div>

      {/* Transmission-specific: PPA/REC Contract Information */}
      {isTransmission && asset.contractName && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <InfoRow label="Contract Name" value={asset.contractName} />
              <InfoRow label="Contract Type" value={asset.contractType?.toUpperCase() || "N/A"} />
              {asset.contractEndDate && (
                <InfoRow label="Contract End Date" value={new Date(asset.contractEndDate).toLocaleDateString()} />
              )}
            </div>
            <div className="space-y-3">
              <InfoRow label="REC Eligible" value={asset.recEligible ? "Yes" : "No"} />
              {asset.recEligible && asset.totalRecsIssued !== undefined && (
                <InfoRow label="Total RECs Issued" value={asset.totalRecsIssued.toString()} />
              )}
              {asset.recEligible && (
                <InfoRow
                  label="Estimated Annual RECs"
                  value={Math.floor(asset.dailyGenerationKWh * 365 / 1000).toString()}
                />
              )}
            </div>
          </div>

          {/* Contract Status Indicator */}
          {asset.contractEndDate && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {new Date(asset.contractEndDate) > new Date() ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  )}
                  <span className="text-sm font-medium">
                    {new Date(asset.contractEndDate) > new Date() ? "Contract Active" : "Contract Expired"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(asset.contractEndDate) > new Date()
                    ? `Expires: ${new Date(asset.contractEndDate).toLocaleDateString()}`
                    : `Expired: ${new Date(asset.contractEndDate).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generation Profile */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">24-Hour Generation Profile</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="hour"
                className="text-xs"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'Generation (kW)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} kW`,
                  name === 'generation' ? 'Generation' : 'Capacity'
                ]}
              />
              <Area
                type="monotone"
                dataKey="generation"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="capacity"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacity Factor</span>
              <span className="text-lg font-bold">
                {((asset.dailyGenerationKWh / (asset.capacityKW * 24)) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Actual vs theoretical maximum generation
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CO₂ Avoided</span>
              <span className="text-lg font-bold text-success">
                {(asset.dailyGenerationKWh * 0.5).toFixed(1)} kg
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily carbon emissions avoided
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cost Savings</span>
              <span className="text-lg font-bold text-primary">
                ${(asset.dailyGenerationKWh * 0.12).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily energy cost savings
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Information */}
      {asset.lastMaintenance && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Maintenance Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Last Maintenance</span>
              </div>
              <p className="text-lg font-bold">{new Date(asset.lastMaintenance).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">Preventive maintenance completed</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium">Next Maintenance</span>
              </div>
              <p className="text-lg font-bold">
                {new Date(new Date(asset.lastMaintenance).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">Scheduled maintenance due</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RenewablesOverviewProps {
  assets: RenewableAsset[];
  metrics: RenewableMetrics;
  generationData: any[];
  enableRenewables: boolean;
  onToggleRenewables: (enabled: boolean) => void;
  sector: string | null;
  subsector: string | null;
}

function RenewablesOverview({
  assets,
  metrics,
  generationData,
  enableRenewables,
  onToggleRenewables,
  sector,
  subsector
}: RenewablesOverviewProps) {
  const isTransmission = sector === 'Power' && subsector === 'Transmission';
  const activeAssets = assets.filter(asset => asset.status === "online");
  const notConfiguredAssets = assets.filter(asset => asset.status === "not_configured");

  // Prepare pie chart data
  const contributionData = [
    {
      name: "Renewable",
      value: metrics.renewablePercentage,
      color: "hsl(var(--success))"
    },
    {
      name: "Grid",
      value: 100 - metrics.renewablePercentage,
      color: "hsl(var(--muted))"
    }
  ];

  // Transmission-specific: Group assets by contract type
  const assetsByContractType = isTransmission ? activeAssets.reduce((acc, asset) => {
    const type = asset.contractType || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {} as Record<string, RenewableAsset[]>) : {};

  // Transmission-specific: Calculate total RECs
  const totalRecs = isTransmission ? activeAssets.reduce((sum, asset) =>
    sum + (asset.totalRecsIssued || 0), 0
  ) : 0;

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Renewable Contribution"
          value={`${metrics.renewablePercentage.toFixed(1)}%`}
          subtitle="Of total energy consumption"
          icon={Leaf}
          variant="success"
        />
        <KPICard
          title="Total Generation"
          value={`${metrics.totalGenerationKWh.toFixed(0)} kWh`}
          subtitle="Daily renewable generation"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="CO₂ Avoided"
          value={`${metrics.co2Avoided.toFixed(1)} kg`}
          subtitle="Daily carbon savings"
          icon={Leaf}
          variant="success"
        />
        <KPICard
          title={isTransmission ? "Total RECs Issued" : "Cost Savings"}
          value={isTransmission ? `${totalRecs}` : `$${metrics.costSavings.toFixed(0)}`}
          subtitle={isTransmission ? "Renewable Energy Credits" : "Daily energy cost savings"}
          icon={isTransmission ? CheckCircle : BarChart3}
          variant="primary"
        />
      </div>

      {/* Transmission-specific: Contract Type Breakdown */}
      {isTransmission && Object.keys(assetsByContractType).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Renewable Energy Contracts</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(assetsByContractType).map(([contractType, contractAssets]) => {
              const totalCapacity = contractAssets.reduce((sum, a) => sum + a.capacityKW, 0);
              const totalGeneration = contractAssets.reduce((sum, a) => sum + a.dailyGenerationKWh, 0);
              const contractRecs = contractAssets.reduce((sum, a) => sum + (a.totalRecsIssued || 0), 0);

              return (
                <div key={contractType} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {contractType.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{contractAssets.length} asset{contractAssets.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{totalCapacity.toLocaleString()} kW</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Daily Generation:</span>
                      <span className="font-medium">{totalGeneration.toLocaleString()} kWh</span>
                    </div>
                    {contractRecs > 0 && (
                      <div className="flex justify-between">
                        <span>RECs Issued:</span>
                        <span className="font-medium text-success">{contractRecs.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Renewable Contribution Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Energy Source Breakdown</h3>
        <div className="h-80 flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={contributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Contribution']}
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
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-success" />
                    <span className="text-sm font-medium">Renewable Energy</span>
                  </div>
                  <span className="text-lg font-bold text-success">{metrics.renewablePercentage.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{metrics.totalGenerationKWh.toFixed(0)} kWh daily generation</p>
                  <p>{activeAssets.length} active asset{activeAssets.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/10 border border-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-muted" />
                    <span className="text-sm font-medium">Grid Electricity</span>
                  </div>
                  <span className="text-lg font-bold">{(100 - metrics.renewablePercentage).toFixed(1)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{Math.max(0, metrics.totalConsumptionKWh - metrics.totalGenerationKWh).toFixed(0)} kWh from grid</p>
                  <p>Conventional energy source</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation vs Consumption Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">24-Hour Generation vs Consumption</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generationData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="hour"
                className="text-xs"
                tick={{ fontSize: 10 }}
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
                  name === 'generation' ? 'Generation' : name === 'consumption' ? 'Consumption' : 'Net'
                ]}
              />
              <Area
                type="monotone"
                dataKey="generation"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="consumption"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Status Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Status Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Active Assets</h4>
            {activeAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{asset.currentOutputKW.toFixed(1)} kW</p>
                  <p className="text-xs text-muted-foreground">{asset.capacityKW} kW capacity</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Available for Configuration</h4>
            {notConfiguredAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-muted/10 border border-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-muted-foreground">Not configured</p>
                  <p className="text-xs text-muted-foreground">{asset.capacityKW} kW potential</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Panel */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Solar-Genset Hybrid Integration</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Enable hybrid systems</span>
            <Switch
              checked={enableRenewables}
              onCheckedChange={onToggleRenewables}
            />
          </div>
        </div>

        {enableRenewables ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Hybrid Integration Enabled</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Solar panels can seamlessly integrate with backup generators for continuous power supply.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Solar Priority</p>
                  <p className="text-sm font-bold">Primary</p>
                </div>
                <div className="text-center p-2 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Battery Backup</p>
                  <p className="text-sm font-bold">Secondary</p>
                </div>
                <div className="text-center p-2 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Generator</p>
                  <p className="text-sm font-bold">Tertiary</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/10 border border-muted/30 rounded-lg text-center">
            <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Hybrid integration is disabled. Enable to configure solar-genset hybrid systems.
            </p>
          </div>
        )}
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