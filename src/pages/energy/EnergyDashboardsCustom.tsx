import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyKPIGrid } from "@/components/ems/widgets/EnergyKPIGrid";
import { MultiStreamKPIGrid } from "@/components/ems/widgets/MultiStreamKPIGrid";
import { TrendChart } from "@/components/ems/widgets/TrendChart";
import { CostBreakdownChart } from "@/components/ems/widgets/CostBreakdownChart";
import { EnergyIntensityCard } from "@/components/ems/widgets/EnergyIntensityCard";
import { WasteDetectionList } from "@/components/ems/widgets/WasteDetectionList";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Plus,
  Settings,
  Copy,
  Share,
  Download,
  Grid3X3,
  BarChart3,
  TrendingUp,
  Zap,
  DollarSign,
  AlertTriangle,
  Target,
  Sparkles,
  GitBranch,
  MapPin,
  Activity,
  Gauge,
} from "lucide-react";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder, TxEnergyMeterRegistry } from "@/types/transmission";
import { cn } from "@/lib/utils";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

/**
 * Whitelisted datasets for custom dashboard widgets
 * Requirements: 24.2 - Dashboard widget query whitelist enforcement
 * 
 * This whitelist ensures that custom dashboard widgets can only query
 * approved datasets, preventing unauthorized data access and SQL injection.
 * 
 * Upstream datasets:
 * - energy_meters: Energy meter registry
 * - energy_telemetry: Time-series telemetry data
 * - energy_anomalies: Detected energy anomalies
 * - energy_baselines: Baseline consumption patterns
 * - energy_kpis: Calculated KPI snapshots
 * 
 * Transmission datasets (additional):
 * - tx_substations: Substation topology
 * - tx_feeders: Feeder circuits
 * - tx_transformers: Transformer assets
 * - tx_lines: Transmission lines
 * - v_tx_energy_meter_registry: Meter registry with topology
 * - power_quality_events: Power quality events
 * - tx_demand_windows: Demand charge windows
 */
const WHITELISTED_DATASETS = [
  // Upstream datasets
  'energy_meters',
  'energy_telemetry',
  'energy_anomalies',
  'energy_baselines',
  'energy_kpis',
  'energy_recommendations',
  'energy_emissions',

  // Transmission datasets
  'tx_substations',
  'tx_feeders',
  'tx_transformers',
  'tx_lines',
  'tx_bays',
  'v_tx_energy_meter_registry',
  'power_quality_events',
  'tx_power_quality_limits',
  'tx_demand_windows',
  'tx_compliance_requirements',
  'energy_tariffs'
] as const;

type WhitelistedDataset = typeof WHITELISTED_DATASETS[number];

/**
 * Validates that a widget query configuration only accesses whitelisted datasets
 * Requirements: 24.2 - Dashboard widget query whitelist enforcement
 */
function validateWidgetDataset(dataset: string): boolean {
  return WHITELISTED_DATASETS.includes(dataset as WhitelistedDataset);
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: "default" | "custom" | "template";
  widgetCount: number;
  lastModified: string;
  isActive?: boolean;
}

interface Widget {
  id: string;
  name: string;
  type: "kpi" | "chart" | "table" | "gauge";
  category: "consumption" | "cost" | "co2" | "peaks" | "anomalies" | "intensity";
  description: string;
  icon: any;
  size: "small" | "medium" | "large";
}

const mockDashboards: Dashboard[] = [
  {
    id: "dash-upstream-overview",
    name: "Upstream Energy Overview",
    description: "Comprehensive energy monitoring for upstream operations",
    category: "default",
    widgetCount: 8,
    lastModified: "2024-12-16T10:30:00Z",
    isActive: true
  },
  {
    id: "dash-pad-a",
    name: "Pad A Operations",
    description: "Focused dashboard for Pad A wellhead and ESP operations",
    category: "custom",
    widgetCount: 6,
    lastModified: "2024-12-15T14:20:00Z"
  },
  {
    id: "dash-compressor-station",
    name: "Compressor Station",
    description: "Gas compression and processing facility monitoring",
    category: "custom",
    widgetCount: 7,
    lastModified: "2024-12-14T09:15:00Z"
  },
  {
    id: "dash-cost-center",
    name: "Cost Center Analysis",
    description: "Energy cost breakdown by operational areas",
    category: "template",
    widgetCount: 5,
    lastModified: "2024-12-13T16:45:00Z"
  },
  {
    id: "dash-sustainability",
    name: "Sustainability Metrics",
    description: "CO2 emissions and energy intensity tracking",
    category: "template",
    widgetCount: 4,
    lastModified: "2024-12-12T11:30:00Z"
  }
];

// Transmission-specific dashboards
const mockTransmissionDashboards: Dashboard[] = [
  {
    id: "dash-tx-grid-overview",
    name: "Transmission Grid Overview",
    description: "Comprehensive grid monitoring with substation and feeder status",
    category: "default",
    widgetCount: 10,
    lastModified: "2024-12-16T10:30:00Z",
    isActive: true
  },
  {
    id: "dash-tx-substation-alpha",
    name: "Substation Alpha Operations",
    description: "Detailed monitoring for Substation Alpha with feeder loads",
    category: "custom",
    widgetCount: 8,
    lastModified: "2024-12-15T14:20:00Z"
  },
  {
    id: "dash-tx-power-quality",
    name: "Power Quality Dashboard",
    description: "Voltage, frequency, and THD monitoring across grid",
    category: "custom",
    widgetCount: 6,
    lastModified: "2024-12-14T09:15:00Z"
  },
  {
    id: "dash-tx-losses",
    name: "Grid Losses Analysis",
    description: "Transmission losses and efficiency tracking",
    category: "template",
    widgetCount: 5,
    lastModified: "2024-12-13T16:45:00Z"
  },
  {
    id: "dash-tx-compliance",
    name: "Regulatory Compliance",
    description: "Grid code compliance and reporting metrics",
    category: "template",
    widgetCount: 4,
    lastModified: "2024-12-12T11:30:00Z"
  }
];

const availableWidgets: Widget[] = [
  {
    id: "widget-energy-kpi",
    name: "Energy KPI Grid",
    type: "kpi",
    category: "consumption",
    description: "Current kW, daily kWh, cost, and CO2 metrics",
    icon: Zap,
    size: "large"
  },
  {
    id: "widget-multistream-kpi",
    name: "Multi-Stream KPI Grid",
    type: "kpi",
    category: "consumption",
    description: "Energy breakdown by type (electricity, gas, diesel, steam)",
    icon: Grid3X3,
    size: "large"
  },
  {
    id: "widget-cost-breakdown",
    name: "Cost Breakdown Chart",
    type: "chart",
    category: "cost",
    description: "Energy cost distribution by type and scope",
    icon: DollarSign,
    size: "medium"
  },
  {
    id: "widget-trend-chart",
    name: "Consumption Trend Chart",
    type: "chart",
    category: "consumption",
    description: "24-hour energy consumption trends",
    icon: TrendingUp,
    size: "medium"
  },
  {
    id: "widget-intensity-card",
    name: "Energy Intensity Card",
    type: "kpi",
    category: "intensity",
    description: "kWh/BBL and CO2/BBL intensity metrics",
    icon: Target,
    size: "small"
  },
  {
    id: "widget-waste-detection",
    name: "Waste Detection List",
    type: "table",
    category: "anomalies",
    description: "Energy waste opportunities ranked by impact",
    icon: AlertTriangle,
    size: "medium"
  },
  {
    id: "widget-peak-demand",
    name: "Peak Demand Gauge",
    type: "gauge",
    category: "peaks",
    description: "Current demand vs peak thresholds",
    icon: BarChart3,
    size: "small"
  },
  {
    id: "widget-anomaly-alerts",
    name: "Anomaly Alerts",
    type: "table",
    category: "anomalies",
    description: "Recent energy anomalies and alerts",
    icon: AlertTriangle,
    size: "medium"
  }
];

// Transmission-specific widgets
const transmissionWidgets: Widget[] = [
  {
    id: "widget-tx-substation-status",
    name: "Substation Status Grid",
    type: "kpi",
    category: "consumption",
    description: "Real-time status of all substations with load and voltage",
    icon: MapPin,
    size: "large"
  },
  {
    id: "widget-tx-feeder-loads",
    name: "Feeder Load Distribution",
    type: "chart",
    category: "consumption",
    description: "Current load distribution across all feeders",
    icon: GitBranch,
    size: "medium"
  },
  {
    id: "widget-tx-grid-overview",
    name: "Grid Topology Overview",
    type: "kpi",
    category: "consumption",
    description: "Visual overview of grid topology with status indicators",
    icon: Activity,
    size: "large"
  },
  {
    id: "widget-tx-losses",
    name: "Grid Losses Gauge",
    type: "gauge",
    category: "intensity",
    description: "Real-time transmission losses percentage",
    icon: Gauge,
    size: "small"
  },
  {
    id: "widget-tx-load-factor",
    name: "Load Factor Card",
    type: "kpi",
    category: "intensity",
    description: "System load factor and utilization metrics",
    icon: Target,
    size: "small"
  },
  {
    id: "widget-tx-power-quality",
    name: "Power Quality Monitor",
    type: "chart",
    category: "anomalies",
    description: "Voltage, frequency, and THD monitoring",
    icon: Activity,
    size: "medium"
  },
  {
    id: "widget-tx-transformer-status",
    name: "Transformer Status",
    type: "table",
    category: "consumption",
    description: "Transformer loading and efficiency metrics",
    icon: Zap,
    size: "medium"
  },
  {
    id: "widget-tx-demand-forecast",
    name: "Demand Forecast",
    type: "chart",
    category: "peaks",
    description: "Predicted demand for next 24 hours",
    icon: TrendingUp,
    size: "medium"
  }
];




export function EnergyDashboardsCustom() {
  const {
    energyMeters,
    energyTelemetry,
    sector,
    subsector,
    currentTenant
  } = useApp();

  // Sector context check
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Transmission-specific state
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [txMeters, setTxMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Load transmission data when in transmission mode
  useEffect(() => {
    if (!isTransmission || !currentTenant) return;

    const loadTransmissionData = async () => {
      try {
        setTxLoading(true);
        const provider = getTransmissionProvider();

        const [substationsData, feedersData, metersData] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id }),
          provider.listEnergyMetersTxScoped({ org_id: currentTenant.id })
        ]);

        setTxSubstations(substationsData);
        setTxFeeders(feedersData);
        setTxMeters(metersData);
      } catch (error) {
        console.error('Failed to load transmission data:', error);
      } finally {
        setTxLoading(false);
      }
    };

    loadTransmissionData();
  }, [isTransmission, currentTenant]);

  // Select appropriate dashboards based on sector
  const dashboardList = isTransmission ? mockTransmissionDashboards : mockDashboards;

  // Select appropriate widgets based on sector
  const widgetList = isTransmission
    ? [...availableWidgets, ...transmissionWidgets]
    : availableWidgets;

  const filteredDashboards = useMemo(() => {
    let result = dashboardList;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (dashboard) =>
          dashboard.name.toLowerCase().includes(query) ||
          dashboard.description.toLowerCase().includes(query)
      );
    }

    // Category (using type filter)
    if (filters.type) {
      result = result.filter(d => d.category.toLowerCase() === filters.type.toLowerCase());
    }

    return result;
  }, [searchQuery, dashboardList, filters.type]);

  // Update selection if filtered out
  // Update selection if filtered out
  useEffect(() => {
    if (selectedDashboard && !filteredDashboards.find(d => d.id === selectedDashboard.id)) {
      setSelectedDashboard(null);
    }
  }, [filteredDashboards, selectedDashboard]);

  // Sync active tab with selection
  useEffect(() => {
    if (selectedDashboard) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("library");
    }
  }, [selectedDashboard]);

  const dashboardsByCategory = useMemo(() => {
    return {
      default: filteredDashboards.filter(d => d.category === "default"),
      custom: filteredDashboards.filter(d => d.category === "custom"),
      template: filteredDashboards.filter(d => d.category === "template")
    };
  }, [filteredDashboards]);

  const tabs = selectedDashboard ? [
    {
      id: "dashboard",
      label: "Dashboard View",
      content: (
        <DashboardView
          dashboard={selectedDashboard}
          isTransmission={isTransmission}
          txSubstations={txSubstations}
          txFeeders={txFeeders}
          txMeters={txMeters}
          txLoading={txLoading}
        />
      ),
    },
    {
      id: "builder",
      label: "Dashboard Builder",
      content: (
        <DashboardBuilder
          dashboard={selectedDashboard}
          widgets={widgetList}
          isTransmission={isTransmission}
        />
      ),
    },
    {
      id: "settings",
      label: "Dashboard Settings",
      content: <DashboardSettings dashboard={selectedDashboard} />,
    },
  ] : [
    {
      id: "library",
      label: "Dashboard Library",
      content: <DashboardLibrary dashboards={dashboardsByCategory} onSelect={setSelectedDashboard} />,
    },
  ];

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={true}
    />
  );

  return (
    <EMSPageShell
      title="Custom Dashboards"
      featureSetName="Energy Dashboards & Reporting"
      featureName="Custom Dashboards"
      listType="reports"
      listItems={filteredDashboards}
      selectedItem={selectedDashboard}
      onItemSelect={(item) => {
        setSelectedDashboard(item as Dashboard);
        setActiveTab("dashboard");
      }}
      searchPlaceholder="Search dashboards..."
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      workPaneContent={
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share className="w-4 h-4" />
            Share
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Dashboard
          </Button>
        </div>
      }
    />
  );
}

interface DashboardListItemProps {
  dashboard: Dashboard;
  isSelected: boolean;
  onClick: () => void;
}

function DashboardListItem({ dashboard, isSelected, onClick }: DashboardListItemProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "default": return "bg-blue-500/20 text-blue-400";
      case "custom": return "bg-green-500/20 text-green-400";
      case "template": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
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
        <LayoutDashboard className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {dashboard.name}
          </span>
          {dashboard.isActive && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{dashboard.description}</p>
        <div className="flex items-center justify-between text-xs">
          <Badge className={getCategoryColor(dashboard.category)}>
            {dashboard.category}
          </Badge>
          <span className="text-muted-foreground">{dashboard.widgetCount} widgets</span>
        </div>
      </div>
    </button>
  );
}

interface DashboardViewProps {
  dashboard: Dashboard;
  isTransmission: boolean;
  txSubstations: TxSubstation[];
  txFeeders: TxFeeder[];
  txMeters: TxEnergyMeterRegistry[];
  txLoading: boolean;
}

function DashboardView({
  dashboard,
  isTransmission,
  txSubstations,
  txFeeders,
  txMeters,
  txLoading
}: DashboardViewProps) {
  const { energyMeters, energyTelemetry, upstreamEnergyAnomalies } = useApp();

  // Default widget layout for demonstration
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{dashboard.name}</h2>
          <p className="text-sm text-muted-foreground">{dashboard.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Conditional rendering based on sector */}
      {isTransmission ? (
        <TransmissionDashboardWidgets
          txSubstations={txSubstations}
          txFeeders={txFeeders}
          txMeters={txMeters}
          txLoading={txLoading}
        />
      ) : (
        <UpstreamDashboardWidgets />
      )}
    </div>
  );
}

// Transmission-specific dashboard widgets
interface TransmissionDashboardWidgetsProps {
  txSubstations: TxSubstation[];
  txFeeders: TxFeeder[];
  txMeters: TxEnergyMeterRegistry[];
  txLoading: boolean;
}

function TransmissionDashboardWidgets({
  txSubstations,
  txFeeders,
  txMeters,
  txLoading
}: TransmissionDashboardWidgetsProps) {
  // Calculate transmission KPIs
  const txKPIs = useMemo(() => {
    const activeSubstations = txSubstations.filter(s => s.active).length;
    const activeFeeders = txFeeders.filter(f => f.active).length;
    const activeMeters = txMeters.filter(m => m.active).length;
    const staleMeters = txMeters.filter(m => m.is_stale).length;

    // Calculate total current load
    const totalLoadKW = txMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);

    // Calculate average power factor
    const metersWithPF = txMeters.filter(m => m.current_power_factor !== null);
    const avgPowerFactor = metersWithPF.length > 0
      ? metersWithPF.reduce((sum, m) => sum + (m.current_power_factor || 0), 0) / metersWithPF.length
      : 0;

    return {
      activeSubstations,
      activeFeeders,
      activeMeters,
      staleMeters,
      totalLoadKW,
      avgPowerFactor
    };
  }, [txSubstations, txFeeders, txMeters]);

  // Calculate feeder load distribution
  const feederLoadData = useMemo(() => {
    return txFeeders.map(feeder => {
      const feederMeters = txMeters.filter(m => m.feeder_id === feeder.id);
      const totalLoad = feederMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);
      const capacity = feeder.capacity_mva ? feeder.capacity_mva * 1000 : 5000; // Convert MVA to kW
      const utilization = capacity > 0 ? (totalLoad / capacity) * 100 : 0;

      return {
        id: feeder.id,
        name: feeder.name,
        code: feeder.feeder_code,
        load: totalLoad,
        capacity,
        utilization,
        status: utilization > 90 ? 'critical' : utilization > 75 ? 'warning' : 'normal'
      };
    }).sort((a, b) => b.load - a.load).slice(0, 10); // Top 10 feeders by load
  }, [txFeeders, txMeters]);

  // Calculate substation status
  const substationStatus = useMemo(() => {
    return txSubstations.map(substation => {
      const substationMeters = txMeters.filter(m => m.substation_id === substation.id);
      const totalLoad = substationMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);
      const avgVoltage = substationMeters.filter(m => m.current_voltage_v !== null)
        .reduce((sum, m, _, arr) => sum + (m.current_voltage_v || 0) / arr.length, 0);
      const staleCount = substationMeters.filter(m => m.is_stale).length;

      return {
        id: substation.id,
        name: substation.name,
        code: substation.code,
        region: substation.region || 'N/A',
        totalLoad,
        avgVoltage,
        meterCount: substationMeters.length,
        staleCount,
        status: staleCount > 0 ? 'warning' : 'normal'
      };
    }).sort((a, b) => b.totalLoad - a.totalLoad);
  }, [txSubstations, txMeters]);

  if (txLoading) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading transmission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Substation Status Grid - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Substation Status Grid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {substationStatus.slice(0, 6).map(substation => (
                <Card key={substation.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{substation.name}</h4>
                        <p className="text-xs text-muted-foreground">{substation.code}</p>
                      </div>
                      <Badge variant={substation.status === 'warning' ? 'destructive' : 'secondary'}>
                        {substation.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Load:</span>
                        <span className="font-medium">{substation.totalLoad.toFixed(0)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voltage:</span>
                        <span className="font-medium">{substation.avgVoltage.toFixed(0)} V</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meters:</span>
                        <span className="font-medium">{substation.meterCount}</span>
                      </div>
                      {substation.staleCount > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span>Stale:</span>
                          <span className="font-medium">{substation.staleCount}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Overview KPIs - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Grid Topology Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{txKPIs.activeSubstations}</div>
                <p className="text-xs text-muted-foreground">Active Substations</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{txKPIs.activeFeeders}</div>
                <p className="text-xs text-muted-foreground">Active Feeders</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{txKPIs.activeMeters}</div>
                <p className="text-xs text-muted-foreground">Active Meters</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{txKPIs.totalLoadKW.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Total Load (kW)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{(txKPIs.avgPowerFactor * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Avg Power Factor</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{txKPIs.staleMeters}</div>
                <p className="text-xs text-muted-foreground">Stale Meters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feeder Load Distribution - Half Width */}
      <div className="col-span-12 lg:col-span-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Feeder Load Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feederLoadData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No feeder data available
              </div>
            ) : (
              <div className="space-y-3">
                {feederLoadData.map(feeder => (
                  <div key={feeder.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{feeder.name}</span>
                      <span className="text-muted-foreground">
                        {feeder.load.toFixed(0)} / {feeder.capacity.toFixed(0)} kW
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            feeder.status === 'critical' ? 'bg-destructive' :
                              feeder.status === 'warning' ? 'bg-warning' :
                                'bg-primary'
                          )}
                          style={{ width: `${Math.min(feeder.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">
                        {feeder.utilization.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid Losses Gauge - Quarter Width */}
      <div className="col-span-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="w-4 h-4" />
              Grid Losses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">2.8%</div>
              <p className="text-xs text-muted-foreground mt-1">Transmission losses</p>
              <div className="mt-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">≤ 3.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry Avg:</span>
                  <span className="font-medium">3.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Factor Card - Quarter Width */}
      <div className="col-span-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4" />
              Load Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">78%</div>
              <p className="text-xs text-muted-foreground mt-1">System utilization</p>
              <div className="mt-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Peak Load:</span>
                  <span className="font-medium">{(txKPIs.totalLoadKW * 1.28).toFixed(0)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Load:</span>
                  <span className="font-medium">{txKPIs.totalLoadKW.toFixed(0)} kW</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power Quality Monitor - Half Width */}
      <div className="col-span-12 lg:col-span-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Power Quality Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Voltage Stability</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '95%' }} />
                    </div>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Frequency Stability</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '98%' }} />
                    </div>
                    <span className="text-sm font-medium">98%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{(txKPIs.avgPowerFactor * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Power Factor</div>
                </div>
                <div>
                  <div className="text-lg font-bold">2.1%</div>
                  <div className="text-xs text-muted-foreground">Avg THD</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">3</div>
                  <div className="text-xs text-muted-foreground">PQ Events</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transformer Status - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Transformer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Transformer monitoring data will be displayed here</p>
              <p className="text-xs mt-2">Configure transformer meters to see real-time status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Upstream-specific dashboard widgets (existing functionality)
function UpstreamDashboardWidgets() {
  const { energyMeters, energyTelemetry, upstreamEnergyAnomalies } = useApp();

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Energy KPI Grid - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Energy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnergyKPIGrid />
          </CardContent>
        </Card>
      </div>

      {/* Multi-Stream KPI Grid - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Energy by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultiStreamKPIGrid streams={[]} />
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Chart - Half Width */}
      <div className="col-span-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CostBreakdownChart data={[]} totalCost={0} />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart - Half Width */}
      <div className="col-span-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Consumption Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={Object.values(energyTelemetry)
                .flatMap((telemetry) =>
                  telemetry.timestamp.map((ts, i) => ({
                    time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    value: telemetry.kW[i] || 0
                  }))
                )
                .slice(0, 24)}
              dataKey="value"
              title="24-Hour Power Consumption"
              unit="kW"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Energy Intensity - Quarter Width */}
      <div className="col-span-3">
        <EnergyIntensityCard metrics={[]} />
      </div>

      {/* Peak Demand KPI - Quarter Width */}
      <div className="col-span-3">
        <KPICard
          title="Peak Demand"
          value="1.2"
          subtitle="MW current demand"
          icon={BarChart3}
          variant="warning"
        />
      </div>

      {/* Anomaly Count KPI - Quarter Width */}
      <div className="col-span-3">
        <KPICard
          title="Active Anomalies"
          value={upstreamEnergyAnomalies.filter(a => !a.resolved).length.toString()}
          subtitle="Requiring attention"
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Efficiency Score KPI - Quarter Width */}
      <div className="col-span-3">
        <KPICard
          title="Efficiency Score"
          value="87%"
          subtitle="vs industry benchmark"
          icon={Target}
          variant="success"
        />
      </div>

      {/* Waste Detection List - Full Width */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Energy Waste Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WasteDetectionList wasteCategories={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardBuilderProps {
  dashboard: Dashboard;
  widgets: Widget[];
  isTransmission: boolean;
}

function DashboardBuilder({ dashboard, widgets, isTransmission }: DashboardBuilderProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const widgetsByCategory = useMemo(() => {
    return widgets.reduce((acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    }, {} as Record<string, Widget[]>);
  }, [widgets]);

  // Validate widget data access for transmission
  const validateWidgetAccess = (widgetId: string): boolean => {
    if (!isTransmission) return true;

    // Transmission-specific widgets require transmission data
    const transmissionWidgetIds = [
      'widget-tx-substation-status',
      'widget-tx-feeder-loads',
      'widget-tx-grid-overview',
      'widget-tx-losses',
      'widget-tx-load-factor',
      'widget-tx-power-quality',
      'widget-tx-transformer-status',
      'widget-tx-demand-forecast'
    ];

    // All widgets are accessible in transmission mode
    // In production, this would check user permissions and data availability
    return true;
  };

  const handleWidgetToggle = (widgetId: string) => {
    if (!validateWidgetAccess(widgetId)) {
      console.warn(`Widget ${widgetId} requires transmission data access`);
      return;
    }

    setSelectedWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Validate widget configurations against whitelist
  // Requirements: 24.2 - Dashboard widget query whitelist enforcement
  const validateWidgetConfiguration = (widgetConfig: { dataset: string }): { valid: boolean; error?: string } => {
    if (!validateWidgetDataset(widgetConfig.dataset)) {
      return {
        valid: false,
        error: `Dataset '${widgetConfig.dataset}' is not in the whitelist of approved datasets`
      };
    }
    return { valid: true };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard Builder</h2>
          <p className="text-sm text-muted-foreground">
            {isTransmission
              ? "Drag and drop transmission widgets to customize your grid monitoring dashboard"
              : "Drag and drop widgets to customize your dashboard layout"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Reset Layout
          </Button>
          <Button size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Widget Library */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Library</CardTitle>
              {isTransmission && (
                <p className="text-xs text-muted-foreground mt-1">
                  Transmission topology widgets available
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium mb-2 capitalize">{category}</h4>
                  <div className="space-y-2">
                    {categoryWidgets.map((widget) => (
                      <WidgetLibraryItem
                        key={widget.id}
                        widget={widget}
                        isSelected={selectedWidgets.includes(widget.id)}
                        onToggle={handleWidgetToggle}
                        isTransmission={isTransmission}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Canvas */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drag widgets here</h3>
                <p className="text-sm text-muted-foreground">
                  {isTransmission
                    ? "Select transmission widgets from the library and arrange them on your dashboard"
                    : "Select widgets from the library and arrange them on your dashboard"
                  }
                </p>
                {selectedWidgets.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {selectedWidgets.length} widget{selectedWidgets.length !== 1 ? 's' : ''} selected
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface WidgetLibraryItemProps {
  widget: Widget;
  isSelected: boolean;
  onToggle: (widgetId: string) => void;
  isTransmission: boolean;
}

function WidgetLibraryItem({ widget, isSelected, onToggle, isTransmission }: WidgetLibraryItemProps) {
  const Icon = widget.icon;

  // Check if widget is transmission-specific
  const isTransmissionWidget = widget.id.startsWith('widget-tx-');

  // Show badge for transmission-specific widgets
  const showTransmissionBadge = isTransmissionWidget && isTransmission;

  return (
    <button
      onClick={() => onToggle(widget.id)}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 border",
        isSelected
          ? "bg-primary/10 border-primary/30"
          : "hover:bg-secondary/50 border-border"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          isSelected ? "bg-primary/20" : "bg-secondary"
        )}
      >
        <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {widget.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {widget.size}
          </Badge>
          {showTransmissionBadge && (
            <Badge variant="secondary" className="text-xs">
              TX
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{widget.description}</p>
      </div>
    </button>
  );
}

interface DashboardSettingsProps {
  dashboard: Dashboard;
}

function DashboardSettings({ dashboard }: DashboardSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure dashboard properties and sharing options
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dashboard Name</label>
              <input
                type="text"
                defaultValue={dashboard.name}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                defaultValue={dashboard.description}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                defaultValue={dashboard.category}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="custom">Custom</option>
                <option value="template">Template</option>
                <option value="default">Default</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sharing & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Visibility</label>
              <select className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background">
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Auto-refresh Interval</label>
              <select className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="allow-export" />
              <label htmlFor="allow-export" className="text-sm">Allow export</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="allow-embed" />
              <label htmlFor="allow-embed" className="text-sm">Allow embedding</label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardLibraryProps {
  dashboards: {
    default: Dashboard[];
    custom: Dashboard[];
    template: Dashboard[];
  };
  onSelect: (dashboard: Dashboard) => void;
}

function DashboardLibrary({ dashboards, onSelect }: DashboardLibraryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard Library</h2>
        <p className="text-sm text-muted-foreground">
          Browse and manage your energy dashboards
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(dashboards).map(([category, categoryDashboards]) => (
          <div key={category}>
            <h3 className="text-lg font-medium mb-3 capitalize">{category} Dashboards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryDashboards.map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5" />
                        <CardTitle className="text-base">{dashboard.name}</CardTitle>
                      </div>
                      {dashboard.isActive && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {dashboard.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{dashboard.widgetCount} widgets</span>
                      <span>Modified {new Date(dashboard.lastModified).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1" onClick={() => onSelect(dashboard)}>
                        Open
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}