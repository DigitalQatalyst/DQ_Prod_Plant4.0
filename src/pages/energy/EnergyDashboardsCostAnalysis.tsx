import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadges } from "@/components/shared/SectorBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Plus,
  Download,
  Sparkles,
  AlertTriangle,
  Calendar,
  Factory,
} from "lucide-react";
import { getEnergyTypeIcon, getEnergyTypeColor } from "@/lib/energy-icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface CostCenter {
  id: string;
  name: string;
  scope: string;
  totalDailyCost: number;
  energyBreakdown: {
    electricity: { cost: number; consumption: number; unit: string };
    gas: { cost: number; consumption: number; unit: string };
    diesel: { cost: number; consumption: number; unit: string };
  };
  linkedMeters: string[];
  status: "Normal" | "High" | "Critical";
}

// Mock production data for cost per unit calculations
const mockProductionData = {
  oilProductionBBL: 1250, // barrels per day
  gasProductionMSCF: 850, // thousand standard cubic feet per day
};

import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

export function EnergyDashboardsCostAnalysis() {
  const {
    energyMeters,
    energyTelemetry,
    tariffs,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Determine if we're in transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Generate cost centers from energy meters
  const costCenters: CostCenter[] = useMemo(() => {
    const centerMap = new Map<string, CostCenter>();

    energyMeters.forEach(meter => {
      const telemetry = energyTelemetry[meter.id];
      if (!telemetry) return;

      const latestKWh = telemetry.kWh[telemetry.kWh.length - 1] || 0;

      // Calculate costs by energy type
      const energyBreakdown = {
        electricity: { cost: 0, consumption: 0, unit: 'kWh' },
        gas: { cost: 0, consumption: 0, unit: 'MMBtu' },
        diesel: { cost: 0, consumption: 0, unit: 'Litres' }
      };

      let totalMeterCost = 0;

      meter.energyTypes.forEach(energyType => {
        switch (energyType) {
          case 'electricity':
            energyBreakdown.electricity.consumption = latestKWh;
            energyBreakdown.electricity.cost = latestKWh * tariffs.electricityUsdPerKWh;
            totalMeterCost += energyBreakdown.electricity.cost;
            break;
          case 'gas':
            // Convert kWh to MMBtu (1 MMBtu ≈ 293 kWh)
            const gasMMBtu = latestKWh / 293;
            energyBreakdown.gas.consumption = gasMMBtu;
            energyBreakdown.gas.cost = gasMMBtu * tariffs.gasUsdPerMMBtu;
            totalMeterCost += energyBreakdown.gas.cost;
            break;
          case 'diesel':
            // Estimate diesel consumption (rough approximation)
            const dieselLitres = latestKWh * 0.25;
            energyBreakdown.diesel.consumption = dieselLitres;
            energyBreakdown.diesel.cost = dieselLitres * tariffs.dieselUsdPerLitre;
            totalMeterCost += energyBreakdown.diesel.cost;
            break;
        }
      });

      // Group by scope (cost center)
      const costCenterId = meter.scope.replace(/\s+/g, '-').toLowerCase();
      if (centerMap.has(costCenterId)) {
        const existing = centerMap.get(costCenterId)!;
        existing.totalDailyCost += totalMeterCost;
        existing.linkedMeters.push(meter.id);

        // Aggregate energy breakdown
        Object.keys(energyBreakdown).forEach(energyType => {
          const key = energyType as keyof typeof energyBreakdown;
          existing.energyBreakdown[key].cost += energyBreakdown[key].cost;
          existing.energyBreakdown[key].consumption += energyBreakdown[key].consumption;
        });
      } else {
        centerMap.set(costCenterId, {
          id: costCenterId,
          name: `${meter.scope} Cost Center`,
          scope: meter.scope,
          totalDailyCost: totalMeterCost,
          energyBreakdown: { ...energyBreakdown },
          linkedMeters: [meter.id],
          status: meter.status
        });
      }
    });

    return Array.from(centerMap.values());
  }, [energyMeters, energyTelemetry, tariffs, isTransmission]);

  // Handle case where no data is available
  const hasData = costCenters.length > 0;

  const filteredCostCenters = useMemo(() => {
    let result = costCenters;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (center) =>
          center.name.toLowerCase().includes(query) ||
          center.scope.toLowerCase().includes(query)
      );
    }

    // Filter by Energy Type
    if (filters.type) {
      result = result.filter(center =>
        center.energyBreakdown[filters.type as keyof typeof center.energyBreakdown]?.cost > 0
      );
    }

    // Filter by Status
    if (filters.status) {
      result = result.filter(center => center.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Note: Transmission filters (Substation/Feeder) are harder here because 
    // CostCenters are aggregated over meters which might belong to different feeders.
    // However, if we assume scopes roughly align with topology, we could filter.
    // For now, let's keep it simple.

    return result;
  }, [costCenters, searchQuery, filters.type, filters.status]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredCostCenters.length > 0 && (!selectedCostCenter || !filteredCostCenters.find(c => c.id === selectedCostCenter.id))) {
      setSelectedCostCenter(filteredCostCenters[0]);
    }
  }, [filteredCostCenters, selectedCostCenter]);

  // Sync active tab with selection
  useEffect(() => {
    if (selectedCostCenter) {
      if (["overview", "analysis", "top-drivers"].includes(activeTab)) {
        setActiveTab("cost-details");
      }
    } else {
      if (["cost-details", "breakdown"].includes(activeTab)) {
        setActiveTab("overview");
      }
    }
  }, [selectedCostCenter, activeTab]);

  // Calculate overall cost analytics
  const costAnalytics = useMemo(() => {
    const totalDailyCost = costCenters.reduce((sum, center) => sum + center.totalDailyCost, 0);

    // Aggregate by energy type across all cost centers
    const totalByEnergyType = costCenters.reduce((acc, center) => {
      Object.entries(center.energyBreakdown).forEach(([energyType, data]) => {
        if (!acc[energyType]) {
          acc[energyType] = { cost: 0, consumption: 0, unit: data.unit };
        }
        acc[energyType].cost += data.cost;
        acc[energyType].consumption += data.consumption;
      });
      return acc;
    }, {} as Record<string, { cost: number; consumption: number; unit: string }>);

    // Calculate cost per production unit
    const costPerBBL = totalDailyCost / mockProductionData.oilProductionBBL;
    const costPerMSCF = totalDailyCost / mockProductionData.gasProductionMSCF;

    // Identify top 3 cost-driving centers
    const topCostCenters = [...costCenters]
      .sort((a, b) => b.totalDailyCost - a.totalDailyCost)
      .slice(0, 3);

    // Prepare chart data
    const pieChartData = Object.entries(totalByEnergyType)
      .filter(([_, data]) => data.cost > 0)
      .map(([type, data]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: data.cost,
        percentage: (data.cost / totalDailyCost) * 100
      }));

    const barChartData = costCenters.map(center => ({
      name: center.scope,
      totalCost: center.totalDailyCost,
      electricity: center.energyBreakdown.electricity.cost,
      gas: center.energyBreakdown.gas.cost,
      diesel: center.energyBreakdown.diesel.cost
    }));

    return {
      totalDailyCost,
      totalByEnergyType,
      costPerBBL,
      costPerMSCF,
      topCostCenters,
      pieChartData,
      barChartData
    };
  }, [costCenters]);





  const tabs = selectedCostCenter ? [
    {
      id: "cost-details",
      label: "Cost Center Details",
      content: <CostCenterDetails costCenter={selectedCostCenter} />,
    },
    {
      id: "breakdown",
      label: "Energy Breakdown",
      content: <EnergyBreakdown costCenter={selectedCostCenter} />,
    },
  ] : [
    {
      id: "overview",
      label: "Cost Overview",
      content: <CostOverview data={costAnalytics} sector={sector} subsector={subsector} />,
    },
    {
      id: "analysis",
      label: "Cost Analysis",
      content: <CostAnalysis data={costAnalytics} />,
    },
    {
      id: "top-drivers",
      label: "Top Cost Drivers",
      content: <TopCostDrivers data={costAnalytics} />,
    },
  ];

  const workPaneContent = (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className={cn("grid w-full", selectedCostCenter ? "grid-cols-2" : "grid-cols-3")}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={true}
    />
  );

  return (
    <EMSPageShell
      title="Cost Analysis"
      featureSetName="Energy Dashboards & Reporting"
      featureName="Cost Analysis"
      listType="meters"
      listItems={filteredCostCenters}
      selectedItem={selectedCostCenter}
      onItemSelect={(item) => {
        setSelectedCostCenter(item as CostCenter);
        setActiveTab("cost-details");
      }}
      searchPlaceholder="Search cost centers..."
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      workPaneContent={workPaneContent}
      sector={sector || undefined}
      subsector={subsector || undefined}
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
interface CostCenterListItemProps {
  costCenter: CostCenter;
  isSelected: boolean;
  onClick: () => void;
}

function CostCenterListItem({ costCenter, isSelected, onClick }: CostCenterListItemProps) {
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
        <DollarSign className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {costCenter.name}
          </span>
          <StatusBadge status={costCenter.status.toLowerCase() as any} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{costCenter.scope}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{costCenter.linkedMeters.length} meters</span>
          <span className="font-medium text-warning">${costCenter.totalDailyCost.toFixed(2)}/day</span>
        </div>
      </div>
    </button>
  );
}

interface CostCenterDetailsProps {
  costCenter: CostCenter;
}

function CostCenterDetails({ costCenter }: CostCenterDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Cost Center KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Daily Cost"
          value={`$${costCenter.totalDailyCost.toFixed(2)}`}
          subtitle="Total energy cost today"
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Electricity Cost"
          value={`$${costCenter.energyBreakdown.electricity.cost.toFixed(2)}`}
          subtitle="Electrical energy cost"
          icon={DollarSign}
          variant="warning"
        />
        <KPICard
          title="Gas Cost"
          value={`$${costCenter.energyBreakdown.gas.cost.toFixed(2)}`}
          subtitle="Natural gas cost"
          icon={DollarSign}
          variant="warning"
        />
        <KPICard
          title="Diesel Cost"
          value={`$${costCenter.energyBreakdown.diesel.cost.toFixed(2)}`}
          subtitle="Diesel fuel cost"
          icon={DollarSign}
          variant="warning"
        />
      </div>

      {/* Cost Center Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Center Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Cost Center ID" value={costCenter.id} />
            <InfoRow label="Scope" value={costCenter.scope} />
            <InfoRow label="Status" value={costCenter.status} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Daily Cost" value={`$${costCenter.totalDailyCost.toFixed(2)}`} />
            <InfoRow label="Linked Meters" value={costCenter.linkedMeters.length.toString()} />
            <InfoRow label="Cost Ranking" value="Top 3" />
          </div>
        </div>
      </div>
    </div>
  );
}
interface EnergyBreakdownProps {
  costCenter: CostCenter;
}

function EnergyBreakdown({ costCenter }: EnergyBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Energy Type Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Energy Cost Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(costCenter.energyBreakdown).map(([energyType, data]) => {
            if (data.cost === 0) return null;

            return (
              <div key={energyType} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEnergyTypeIcon(energyType)}
                    <span className="text-sm font-medium">{energyType.charAt(0).toUpperCase() + energyType.slice(1)}</span>
                  </div>
                  <span className="text-sm font-bold text-warning">${data.cost.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <span>Consumption: {data.consumption.toFixed(2)} {data.unit}</span>
                  <span>Percentage: {((data.cost / costCenter.totalDailyCost) * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Calculation Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Calculation Details</h3>
        <div className="space-y-3">
          {Object.entries(costCenter.energyBreakdown).map(([energyType, data]) => {
            if (data.cost === 0) return null;

            let tariffRate: number;
            switch (energyType) {
              case 'electricity':
                tariffRate = 0.12; // $0.12 per kWh
                break;
              case 'gas':
                tariffRate = 4.50; // $4.50 per MMBtu
                break;
              case 'diesel':
                tariffRate = 1.25; // $1.25 per litre
                break;
              default:
                tariffRate = 0;
            }

            return (
              <div key={energyType} className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium mb-1">{energyType.charAt(0).toUpperCase() + energyType.slice(1)} Cost Calculation</p>
                <p className="text-xs text-muted-foreground font-mono">
                  ${data.cost.toFixed(2)} = {data.consumption.toFixed(2)} {data.unit} × ${tariffRate} per {data.unit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CostOverviewProps {
  data: any;
  sector: string | null;
  subsector: string | null;
}

function CostOverview({ data, sector, subsector }: CostOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Daily Cost"
          value={`$${data.totalDailyCost.toFixed(2)}`}
          subtitle="All energy types"
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Cost per BBL"
          value={`$${data.costPerBBL.toFixed(2)}`}
          subtitle="Per barrel produced"
          icon={Factory}
          variant="warning"
        />
        <KPICard
          title="Cost per MSCF"
          value={`$${data.costPerMSCF.toFixed(2)}`}
          subtitle="Per thousand cubic feet"
          icon={BarChart3}
          variant="warning"
        />
        <KPICard
          title="Cost Centers"
          value={data.topCostCenters.length}
          subtitle="Active cost centers"
          icon={Target}
          variant="default"
        />
      </div>

      {/* Cost Distribution Pie Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Cost Distribution by Energy Type</h3>
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
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Daily Cost']}
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
                    <p className="text-sm font-bold">${entry.value.toFixed(2)}</p>
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
            Energy cost analysis optimized for {sector} {subsector} operations.
            All calculations use upstream tariff data for accurate cost projections.
          </p>
        </div>
      )}
    </div>
  );
}
interface CostAnalysisProps {
  data: any;
}

function CostAnalysis({ data }: CostAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* Cost by Cost Center Bar Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Cost by Cost Center</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.barChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'Daily Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === 'totalCost' ? 'Total Cost' : name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Bar
                dataKey="electricity"
                stackId="a"
                fill={getEnergyTypeColor('electricity')}
                name="Electricity"
              />
              <Bar
                dataKey="gas"
                stackId="a"
                fill={getEnergyTypeColor('gas')}
                name="Gas"
              />
              <Bar
                dataKey="diesel"
                stackId="a"
                fill={getEnergyTypeColor('diesel')}
                name="Diesel"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Cost Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Cost Analysis</h3>
        <div className="space-y-3">
          {Object.entries(data.totalByEnergyType).map(([energyType, typeData]: [string, any]) => {
            if (typeData.cost === 0) return null;

            return (
              <div key={energyType} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEnergyTypeIcon(energyType)}
                    <span className="text-sm font-medium">{energyType.charAt(0).toUpperCase() + energyType.slice(1)}</span>
                  </div>
                  <span className="text-sm font-bold text-warning">${typeData.cost.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <span>Consumption: {typeData.consumption.toFixed(1)} {typeData.unit}</span>
                  <span>Percentage: {((typeData.cost / data.totalDailyCost) * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TopCostDriversProps {
  data: any;
}

function TopCostDrivers({ data }: TopCostDriversProps) {
  return (
    <div className="space-y-6">
      {/* Production Unit Costs */}
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
          title="Cost per BBL"
          value={`$${data.costPerBBL.toFixed(2)}`}
          subtitle="Energy cost per barrel"
          icon={Target}
          variant="warning"
        />
        <KPICard
          title="Cost per MSCF"
          value={`$${data.costPerMSCF.toFixed(2)}`}
          subtitle="Energy cost per MSCF"
          icon={Target}
          variant="warning"
        />
      </div>

      {/* Top 3 Cost-Driving Centers */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-warning" />
          Top 3 Cost-Driving Centers
        </h3>
        <div className="space-y-4">
          {data.topCostCenters.map((center: CostCenter, index: number) => (
            <div key={center.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{center.name}</p>
                  <p className="text-xs text-muted-foreground">{center.scope}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-warning">${center.totalDailyCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {((center.totalDailyCost / data.totalDailyCost) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          ))}
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
            Production figures used in cost per unit calculations are mock values for demonstration:
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