import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, EmptyStates } from "@/components/shared";
import { SearchFilterSort } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AssetStatus } from "@/types/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FlaskConical,
  Play,
  BarChart3,
  Target,
  Settings,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Sparkles,
  AlertCircle,
  Pause,
  RotateCcw,
} from "lucide-react";
import { OptimisationSimulation } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";

export function Simulations() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();

  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [searchQuery, setSearchQuery] = useState("");
  const [scenarioTypeFilter, setScenarioTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("confidence");

  // Use selectedAsset from AppContext for Simulation selection
  const selectedScenario = selectedAsset as unknown as OptimisationSimulation | null;

  // Fetch simulations from Supabase
  const {
    data: simulations = [],
    isLoading: simulationsLoading,
    error: simulationsError,
    refetch: refetchSimulations,
  } = useQuery({
    queryKey: ['simulations', "v2", currentTenant.id, statusFilter],
    queryFn: () => provider.listSimulations(currentTenant.id, {
      status: statusFilter && statusFilter !== "all" ? statusFilter as any : undefined,
    }),
    enabled: !!currentTenant.id,
  });

  // Filter and sort simulations based on search query
  const filteredScenarios = useMemo(() => {
    // Apply sector-specific filtering using the hook
    let sims = filterItems(simulations);


    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sims = sims.filter(
        (scenario) =>
          scenario.name.toLowerCase().includes(query) ||
          (scenario.description?.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (scenarioTypeFilter && scenarioTypeFilter !== "all") {
      sims = sims.filter(sim => sim.type === scenarioTypeFilter);
    }

    // Apply sorting
    const sorted = [...sims];
    switch (sortBy) {
      case "confidence":
        return sorted.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }, [searchQuery, simulations, scenarioTypeFilter, sortBy]);

  const stats = useMemo(() => {
    const totalScenarios = filteredScenarios.length;
    const highConfidence = filteredScenarios.filter(s => s.confidence >= 85).length;
    const mediumConfidence = filteredScenarios.filter(s => s.confidence >= 70 && s.confidence < 85).length;
    const avgConfidence = filteredScenarios.length > 0
      ? filteredScenarios.reduce((sum, scenario) => sum + scenario.confidence, 0) / totalScenarios
      : 0;
    return { totalScenarios, highConfidence, mediumConfidence, avgConfidence };
  }, [filteredScenarios]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    // Create sector-specific modal content for simulation creation
    const modalContent = getSectorSpecificModalContent('optimization-scenario', currentSectorName, currentSubsectorName);
    setPopPaneContent(modalContent);
    setIsPopPaneOpen(true);
  };

  const tabs = [
    {
      id: "overview",
      label: "Simulations Overview",
      content: (
        <SimulationsOverview
          stats={stats}
          scenarios={filteredScenarios}
          sector={currentTenant.sector}
        />
      ),
    },
    {
      id: "models",
      label: "Models",
      content: <ComingSoon title="Simulation Models" description="Advanced simulation models and digital twins for optimization testing" />,
    },
    {
      id: "history",
      label: "History",
      content: <ComingSoon title="Simulation History" description="Historical simulation runs and performance analysis" />,
    },
  ];

  const scenarioTabs = selectedScenario
    ? [
      {
        id: "setup",
        label: "Setup",
        content: <SetupTab scenario={selectedScenario} />,
      },
      {
        id: "execution",
        label: "Execution",
        content: <ExecutionTab scenario={selectedScenario} />,
      },
      {
        id: "results",
        label: "Results",
        content: <ResultsTab scenario={selectedScenario} />,
      },
      {
        id: "comparison",
        label: "Comparison",
        content: <ComparisonTab scenario={selectedScenario} scenarios={filteredScenarios} sector={currentTenant.sector} />,
      },
    ]
    : tabs;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="Optimization Simulations"
        subtitle={currentTenant.name}
        count={filteredScenarios.length}
        showFilters={false}
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search simulations..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-2">
                <Select value={scenarioTypeFilter} onValueChange={setScenarioTypeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Scenario Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                    <SelectItem value="what-if">What-If Analysis</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            sortContent={
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confidence">Confidence (High to Low)</SelectItem>
                    <SelectItem value="impact">Impact (High to Low)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {filteredScenarios.map((scenario) => (
          <ScenarioItem
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenario?.id === scenario.id}
            onClick={() => setSelectedAsset(scenario as unknown as any)}
          />
        ))}
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        key={selectedScenario ? `sim-${selectedScenario.id}` : 'sim-overview'}
        title={selectedScenario ? selectedScenario.name : "Optimization Simulations"}
        subtitle={selectedScenario ? `Confidence: ${selectedScenario.confidence}%` : `${filteredScenarios.length} scenarios available`}
        tabs={scenarioTabs}
        defaultTab={selectedScenario ? "setup" : "overview"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              New Simulation
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Assist
            </Button>
          </div>
        }
      />
    </div>
  );
}

function ScenarioItem({
  scenario,
  isSelected,
  onClick,
}: {
  scenario: Scenario;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-success";
    if (confidence >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  const getConfidenceVariant = (confidence: number): AssetStatus => {
    if (confidence >= 85) return "online";
    if (confidence >= 70) return "maintenance";
    return "offline";
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          <StatusBadge
            status={getConfidenceVariant(scenario.confidence)}
            size="sm"
          />
        </div>
        <div className={cn("text-xs font-medium", getConfidenceColor(scenario.confidence))}>
          {scenario.confidence}%
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {scenario.name}
        </h4>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {scenario.projectedOutcome}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Simulation</span>
          <span className="font-medium">Confidence: {scenario.confidence}%</span>
        </div>
      </div>
    </div>
  );
}

function SimulationsOverview({
  stats,
  scenarios,
  sector,
}: {
  stats: { totalScenarios: number; highConfidence: number; mediumConfidence: number; avgConfidence: number };
  scenarios: Scenario[];
  sector?: string;
}) {
  const topScenarios = scenarios
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Scenarios"
          value={stats.totalScenarios.toString()}
          subtitle="Available simulations"
          icon={FlaskConical}
          variant="primary"
        />
        <KPICard
          title="High Confidence"
          value={stats.highConfidence.toString()}
          subtitle="Confidence ≥ 85%"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${((stats.highConfidence / stats.totalScenarios) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Medium Confidence"
          value={stats.mediumConfidence.toString()}
          subtitle="Confidence 70-84%"
          icon={AlertCircle}
          variant="warning"
          trend="neutral"
          trendValue={`${((stats.mediumConfidence / stats.totalScenarios) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          subtitle="Overall reliability"
          icon={Target}
          variant="default"
          trend="up"
          trendValue="+3.2%"
        />
      </div>

      {/* Scenario Comparison Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Scenario Comparison</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Scenario</th>
                {sector?.toLowerCase() === 'power' ? (
                  <>
                    <th>System Condition</th>
                    <th>Control Variables</th>
                    <th>Constraints</th>
                  </>
                ) : (
                  <>
                    <th>Line Speed</th>
                    <th>Quality Threshold</th>
                    <th>Maintenance Interval</th>
                  </>
                )}
                <th>Projected Outcome</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topScenarios.map((scenario) => {
                const params = scenario.parameters as any || {};

                let col1, col2, col3;

                if (sector?.toLowerCase() === 'power') {
                  // Power Sector Mapping
                  if (params.base_loading_pct) col1 = `Loading: ${params.base_loading_pct}%`;
                  else if (params.power_factor_target) col1 = `PF Target: ${params.power_factor_target}`;
                  else if (params.ambient_temp_c) col1 = `Temp: ${params.ambient_temp_c}°C`;
                  else if (params.capex_usd) col1 = `CapEx: $${(params.capex_usd / 1000).toFixed(0)}k`;
                  else col1 = '-';

                  if (params.feeders) col2 = `Feeders: ${Array.isArray(params.feeders) ? params.feeders.length : 1}`;
                  else if (params.capacitor_banks) col2 = `Caps: ${Array.isArray(params.capacitor_banks) ? params.capacitor_banks.length : 1}`;
                  else if (params.solar_radiation_wm2) col2 = `Solar: ${params.solar_radiation_wm2} W/m²`;
                  else if (params.opex_annual_usd) col2 = `OpEx: $${(params.opex_annual_usd / 1000).toFixed(0)}k`;
                  else col2 = '-';

                  if (params.time_horizon) col3 = `Horizon: ${params.time_horizon}`;
                  else if (params.topology) col3 = `Topo: ${params.topology}`;
                  else if (params.wind_speed_ms) col3 = `Wind: ${params.wind_speed_ms} m/s`;
                  else if (params.study_period_years) col3 = `Period: ${params.study_period_years}y`;
                  else col3 = '-';
                } else {
                  // Default (Manufacturing) Mapping
                  col1 = `${params.lineSpeed || 0}%`;
                  col2 = `${params.qualityThreshold || 0}%`;
                  col3 = `${params.maintenanceInterval || 0}h`;
                }

                return (
                  <tr key={scenario.id}>
                    <td className="font-medium">{scenario.name}</td>
                    <td>{col1}</td>
                    <td>{col2}</td>
                    <td>{col3}</td>
                    <td className="text-sm">{scenario.projectedOutcome}</td>
                    <td className="font-medium">{scenario.confidence}%</td>
                    <td>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play className="w-3 h-3" />
                        Run
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Simulation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Simulation</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Line Speed (%)</label>
            <div className="text-2xl font-bold text-primary">100</div>
            <div className="text-xs text-muted-foreground">Current: 95%</div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Quality Threshold (%)</label>
            <div className="text-2xl font-bold text-primary">98.0</div>
            <div className="text-xs text-muted-foreground">Current: 97.6%</div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Maintenance (hours)</label>
            <div className="text-2xl font-bold text-primary">144</div>
            <div className="text-xs text-muted-foreground">Current: 168h</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Play className="w-4 h-4" />
            Run Simulation
          </Button>
          <Button variant="outline">
            Reset Parameters
          </Button>
        </div>
      </div>
    </div>
  );
}

function SetupTab({ scenario }: { scenario: Scenario }) {
  // Add null checks for scenario and parameters
  if (!scenario || !scenario.parameters) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Scenario data not available</p>
        </div>
      </div>
    );
  }

  const parameters = scenario.parameters as any;

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{scenario.name}</h3>
              <StatusBadge
                status={scenario.confidence >= 85 ? "online" :
                  scenario.confidence >= 70 ? "maintenance" : "offline"}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Confidence: {scenario.confidence}%</span>
              <span>·</span>
              <span>Optimization Scenario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Parameters */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Line Speed"
          value={`${parameters.lineSpeed || 0}%`}
          subtitle="Production rate setting"
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Quality Threshold"
          value={`${parameters.qualityThreshold || 0}%`}
          subtitle="Minimum quality standard"
          icon={Target}
          variant="success"
        />
        <KPICard
          title="Maintenance Interval"
          value={`${parameters.maintenanceInterval || 0}h`}
          subtitle="Scheduled maintenance"
          icon={Settings}
          variant="default"
        />
      </div>

      {/* Parameter Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Process Parameters
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Line Speed</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{parameters.lineSpeed || 0}%</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temperature</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">22°C</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pressure</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">2.1 bar</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Feed Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">850 kg/h</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Quality Parameters
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quality Threshold</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{parameters.qualityThreshold || 0}%</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Defect Tolerance</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">0.5%</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Inspection Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">10%</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rework Limit</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">2%</span>
                <Button variant="outline" size="sm">Adjust</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Simulation Configuration</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Runtime Settings</h4>
            <div className="space-y-3">
              <InfoRow label="Simulation Duration" value="24 hours" />
              <InfoRow label="Time Step" value="1 minute" />
              <InfoRow label="Warm-up Period" value="2 hours" />
              <InfoRow label="Random Seed" value="12345" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Output Settings</h4>
            <div className="space-y-3">
              <InfoRow label="Data Collection" value="Every 5 minutes" />
              <InfoRow label="Report Generation" value="Enabled" />
              <InfoRow label="Chart Export" value="PNG, PDF" />
              <InfoRow label="Data Export" value="CSV, Excel" />
            </div>
          </div>
        </div>
      </div>

      {/* Constraints and Assumptions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Constraints & Assumptions</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Operating Constraints</div>
              <div className="text-xs text-muted-foreground mt-1">
                Line speed cannot exceed 110% due to equipment limitations
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Settings className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">Model Assumptions</div>
              <div className="text-xs text-muted-foreground mt-1">
                Assumes stable material quality and consistent operator performance
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">Validation Data</div>
              <div className="text-xs text-muted-foreground mt-1">
                Model validated against 6 months of historical production data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionTab({ scenario }: { scenario: Scenario }) {
  return (
    <div className="space-y-6">
      {/* Execution Status */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Status"
          value="Running"
          subtitle="Simulation state"
          icon={Play}
          variant="success"
        />
        <KPICard
          title="Progress"
          value="67%"
          subtitle="Completion rate"
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Elapsed Time"
          value="16.1h"
          subtitle="Simulated time"
          icon={Clock}
          variant="default"
        />
        <KPICard
          title="Remaining"
          value="7.9h"
          subtitle="Time to completion"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Execution Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Simulation Controls</h3>
        <div className="flex items-center gap-3 mb-6">
          <Button className="gap-2">
            <Pause className="w-4 h-4" />
            Pause
          </Button>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
          <Button variant="outline">
            Stop
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Progress
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Execution Parameters</h4>
            <div className="space-y-3">
              <InfoRow label="Start Time" value="2024-12-16 09:00:00" />
              <InfoRow label="Current Time" value="2024-12-17 01:06:00" />
              <InfoRow label="Simulation Speed" value="1440x (1 min = 1 day)" />
              <InfoRow label="CPU Usage" value="23%" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Performance Metrics</h4>
            <div className="space-y-3">
              <InfoRow label="Events Processed" value="1,247,832" />
              <InfoRow label="Processing Rate" value="2,156 events/sec" />
              <InfoRow label="Memory Usage" value="1.2 GB" />
              <InfoRow label="Disk Usage" value="45 MB" />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Results */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Real-time Results</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Current OEE"
            value="81.3%"
            subtitle="Real-time efficiency"
            icon={TrendingUp}
            variant="success"
            trend="up"
            trendValue="+2.8%"
          />
          <KPICard
            title="Quality Rate"
            value="98.1%"
            subtitle="Current quality"
            icon={Target}
            variant="success"
            trend="up"
            trendValue="+0.5%"
          />
          <KPICard
            title="Throughput"
            value="1,156/h"
            subtitle="Units per hour"
            icon={BarChart3}
            variant="primary"
            trend="up"
            trendValue="+3.2%"
          />
        </div>

        <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Real-time performance chart</p>
            <p className="text-xs text-muted-foreground">Live data visualization coming in Stage 03</p>
          </div>
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Execution Log</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">16:05:23</span>
            <CheckCircle className="w-4 h-4 text-success mt-0.5" />
            <span className="text-muted-foreground">Quality check passed - batch #1247</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">16:04:15</span>
            <Settings className="w-4 h-4 text-primary mt-0.5" />
            <span className="text-muted-foreground">Line speed adjusted to 102% - optimization trigger</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">16:03:42</span>
            <TrendingUp className="w-4 h-4 text-success mt-0.5" />
            <span className="text-muted-foreground">OEE improvement detected - +0.3% over last hour</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">16:02:18</span>
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <span className="text-muted-foreground">Minor deviation in temperature - auto-corrected</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">16:01:05</span>
            <CheckCircle className="w-4 h-4 text-success mt-0.5" />
            <span className="text-muted-foreground">Maintenance window completed - resuming production</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-20">15:58:33</span>
            <Settings className="w-4 h-4 text-primary mt-0.5" />
            <span className="text-muted-foreground">Scheduled maintenance initiated - 2 minute window</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsTab({ scenario }: { scenario: Scenario }) {
  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Final OEE"
          value="81.7%"
          subtitle="Target achieved"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue="+3.2%"
        />
        <KPICard
          title="Quality Rate"
          value="98.3%"
          subtitle="Above threshold"
          icon={Target}
          variant="success"
          trend="up"
          trendValue="+0.7%"
        />
        <KPICard
          title="Throughput"
          value="1,164/h"
          subtitle="Units per hour"
          icon={TrendingUp}
          variant="success"
          trend="up"
          trendValue="+4.1%"
        />
        <KPICard
          title="Efficiency Gain"
          value="+3.2%"
          subtitle="vs baseline"
          icon={BarChart3}
          variant="success"
        />
      </div>

      {/* Performance Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Key Improvements</h4>
            <div className="space-y-3">
              <InfoRow label="OEE Improvement" value="+3.2% (78.5% → 81.7%)" />
              <InfoRow label="Availability" value="+1.1% (94.2% → 95.3%)" />
              <InfoRow label="Performance" value="+1.8% (87.1% → 88.9%)" />
              <InfoRow label="Quality" value="+0.3% (98.0% → 98.3%)" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Operational Metrics</h4>
            <div className="space-y-3">
              <InfoRow label="Cycle Time" value="-2.1% (3.1s → 3.0s)" />
              <InfoRow label="Changeover Time" value="-5.3% (12min → 11.4min)" />
              <InfoRow label="Downtime Events" value="-18% (22 → 18)" />
              <InfoRow label="Energy Efficiency" value="+2.7%" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Production Metrics</h3>
          <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Production trend chart</p>
              <p className="text-xs text-muted-foreground">Interactive charts coming in Stage 03</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quality Analysis</h3>
          <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Quality distribution chart</p>
              <p className="text-xs text-muted-foreground">Interactive charts coming in Stage 03</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">Optimal Performance Window Confirmed</div>
              <div className="text-xs text-muted-foreground mt-1">
                5% speed increase during 10:00-14:00 window achieves target improvement without quality impact
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">Energy Efficiency Bonus</div>
              <div className="text-xs text-muted-foreground mt-1">
                Optimization also resulted in 2.7% energy efficiency improvement beyond expectations
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Temperature Sensitivity</div>
              <div className="text-xs text-muted-foreground mt-1">
                Performance gains are sensitive to ambient temperature - monitoring recommended
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Readiness */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Implementation Readiness</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Validation Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Performance targets achieved</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Quality standards maintained</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Safety constraints respected</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Equipment limits observed</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Next Steps</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">1</div>
                <span>Review results with operations team</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">2</div>
                <span>Plan pilot implementation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">3</div>
                <span>Prepare monitoring systems</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">4</div>
                <span>Schedule implementation window</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTab({ scenario, scenarios, sector }: { scenario: Scenario; scenarios: Scenario[]; sector?: string }) {
  const otherScenarios = scenarios.filter(s => s.id !== scenario.id).slice(0, 3);

  const getDisplayParams = (params: any) => {
    let col1, col2, col3;
    if (sector?.toLowerCase() === 'power') {
      if (params.base_loading_pct) col1 = `Loading: ${params.base_loading_pct}%`;
      else if (params.power_factor_target) col1 = `PF Target: ${params.power_factor_target}`;
      else if (params.ambient_temp_c) col1 = `Temp: ${params.ambient_temp_c}°C`;
      else if (params.capex_usd) col1 = `CapEx: $${(params.capex_usd / 1000).toFixed(0)}k`;
      else col1 = '-';

      if (params.feeders) col2 = `Feeders: ${Array.isArray(params.feeders) ? params.feeders.length : 1}`;
      else if (params.capacitor_banks) col2 = `Caps: ${Array.isArray(params.capacitor_banks) ? params.capacitor_banks.length : 1}`;
      else if (params.solar_radiation_wm2) col2 = `Solar: ${params.solar_radiation_wm2} W/m²`;
      else if (params.opex_annual_usd) col2 = `OpEx: $${(params.opex_annual_usd / 1000).toFixed(0)}k`;
      else col2 = '-';

      if (params.time_horizon) col3 = `Horizon: ${params.time_horizon}`;
      else if (params.topology) col3 = `Topo: ${params.topology}`;
      else if (params.wind_speed_ms) col3 = `Wind: ${params.wind_speed_ms} m/s`;
      else if (params.study_period_years) col3 = `Period: ${params.study_period_years}y`;
      else col3 = '-';
    } else {
      col1 = `${params.lineSpeed || 0}%`;
      col2 = `${params.qualityThreshold || 0}%`;
      col3 = `${params.maintenanceInterval || 0}h`;
    }
    return { col1, col2, col3 };
  };

  const currentParams = getDisplayParams((scenario.parameters as any) || {});

  return (
    <div className="space-y-6">
      {/* Scenario Comparison */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Scenario</th>
                {sector?.toLowerCase() === 'power' ? (
                  <>
                    <th>System Condition</th>
                    <th>Control Variables</th>
                    <th>Constraints</th>
                    <th>Performance Impact</th>
                  </>
                ) : (
                  <>
                    <th>Line Speed</th>
                    <th>Quality</th>
                    <th>Maintenance</th>
                    <th>OEE Result</th>
                  </>
                )}
                <th>Confidence</th>
                <th>Ranking</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-primary/5">
                <td className="font-medium">{scenario.name} (Current)</td>
                <td>{currentParams.col1}</td>
                <td>{currentParams.col2}</td>
                <td>{currentParams.col3}</td>
                <td className="font-medium text-success">
                  {sector?.toLowerCase() === 'power' ? 'Stable' : '81.7%'}
                </td>
                <td>{scenario.confidence}%</td>
                <td className="font-medium text-primary">#1</td>
              </tr>
              {otherScenarios.map((s, index) => {
                const params = getDisplayParams((s.parameters as any) || {});
                return (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{params.col1}</td>
                    <td>{params.col2}</td>
                    <td>{params.col3}</td>
                    <td className="text-muted-foreground">Projected</td>
                    <td>{s.confidence}%</td>
                    <td className="text-muted-foreground">#{index + 2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">OEE Comparison</h3>
          <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">OEE comparison chart</p>
              <p className="text-xs text-muted-foreground">Interactive charts coming in Stage 03</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Risk vs Reward</h3>
          <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Risk-reward scatter plot</p>
              <p className="text-xs text-muted-foreground">Interactive charts coming in Stage 03</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade-off Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Trade-off Analysis</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">Balanced Scenario (Current)</div>
              <div className="text-xs text-muted-foreground mt-1">
                Optimal balance of performance improvement with minimal risk and moderate resource requirements
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <TrendingUp className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Aggressive Scenario</div>
              <div className="text-xs text-muted-foreground mt-1">
                Higher potential gains but increased risk of quality issues and equipment stress
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Settings className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">Conservative Scenario</div>
              <div className="text-xs text-muted-foreground mt-1">
                Lower risk approach with modest improvements and minimal operational changes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium mb-2">Proceed with Balanced Scenario</div>
            <div className="text-sm text-muted-foreground mb-4">
              The current scenario provides the optimal balance of performance improvement, risk management,
              and implementation feasibility. It achieves the target 3.2% OEE improvement while maintaining
              quality standards and respecting equipment constraints.
            </div>
            <div className="flex items-center gap-3">
              <Button className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve for Implementation
              </Button>
              <Button variant="outline">
                Run Additional Scenarios
              </Button>
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

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground mt-4">Coming in Stage 03</p>
    </div>
  );
}