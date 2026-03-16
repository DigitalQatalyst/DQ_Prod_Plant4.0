import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { useDataProvider } from "@/hooks/useDataProvider";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LoadingState, useLoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Gauge,
  Activity,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Zap,
  Download,
  Sparkles,
  Filter,
  Calendar,
  Droplets,
  TrendingDown,
  Activity as ActivityIcon,
  CheckCircle,
} from "lucide-react";
import {
  PerformanceMetricsDashboard,
  LossAnalysisCard,
  BottleneckConstraintCard,
  TrendAnalysisChart,
  BenchmarkComparisonTable,
  PerformanceAccessGuard
} from "@/components/performance";
import {
  PerformancePanel,
  PerformanceLoss,
  PerformanceBottleneck,
  PerformanceTrend,
  PerformanceBenchmark
} from "@/types/performance";
import { cn } from "@/lib/utils";
import { ContentErrorHandler, NavigationErrorHandler } from "@/lib/errorHandling";
import { safeToFixed, safePercentage } from "@/lib/safeDataAccess";

export function Performance() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { filterItems } = useSectorContentFilter();
  const { provider } = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("oee");
  const { toast } = useToast();

  // Data state
  const [performancePanels, setPerformancePanels] = useState<PerformancePanel[]>([]);
  const [losses, setLosses] = useState<PerformanceLoss[]>([]);
  const [bottlenecks, setBottlenecks] = useState<PerformanceBottleneck[]>([]);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);

  // Error handling state
  const {
    isLoading: isLoadingData,
    error: dataError,
    startLoading,
    stopLoading,
    setError: setDataError,
    retry: retryLoadData
  } = useLoadingState();

  // Selected Panel (Asset)
  const selectedPanel = selectedAsset as unknown as PerformancePanel | null;

  // Close sidebar on mount
  useEffect(() => {
    setIsPopPaneOpen(false);
    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all performance data
  useEffect(() => {
    const fetchData = async () => {
      startLoading();
      try {
        const [panelsData, lossesData, bottlenecksData] = await Promise.all([
          provider.listPerformancePanels(currentTenant.id),
          provider.listPerformanceLosses(currentTenant.id),
          provider.listPerformanceBottlenecks(currentTenant.id)
        ]);

        setPerformancePanels(panelsData);
        setLosses(lossesData);
        setBottlenecks(bottlenecksData);

        // Fetch multiple trend metrics for the last 30 days
        const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const trendsData = await provider.listPerformanceTrends(currentTenant.id, {
          date_from: dateFrom,
          date_to: new Date().toISOString(),
          metric_names: ["oee_percentage", "availability_percentage", "transmission_losses"]
        });
        setTrends(trendsData);

      } catch (error) {
        setDataError(error instanceof Error ? error : new Error(String(error)));
        console.error("Failed to fetch performance data:", error);
      } finally {
        stopLoading();
      }
    };

    if (currentTenant.id) {
      fetchData();
    }
  }, [currentTenant.id, provider, startLoading, stopLoading, setDataError]);

  // Filter and sort panels based on sector/subsector selection and search query
  const filteredPanels = useMemo(() => {
    try {
      let panels = filterItems(performancePanels);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        panels = panels.filter(
          (panel) =>
            panel.name.toLowerCase().includes(query) ||
            (panel.asset_id || panel.asset || "").toLowerCase().includes(query) ||
            (panel.site || "").toLowerCase().includes(query)
        );
      }

      if (statusFilter && statusFilter !== "all") {
        panels = panels.filter(panel => panel.status === statusFilter);
      }

      // Apply sorting
      const sorted = [...panels];
      switch (sortBy) {
        case "oee":
          return sorted.sort((a, b) => (b.oee_percentage || 0) - (a.oee_percentage || 0));
        case "availability":
          return sorted.sort((a, b) => (b.availability_percentage || 0) - (a.availability_percentage || 0));
        case "name":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
          return sorted;
      }

    } catch (error) {
      return [];
    }
  }, [performancePanels, searchQuery, filterItems, statusFilter, sortBy]);

  const stats = useMemo(() => {
    if (filteredPanels.length === 0) {
      return { avgOEE: 0, avgAvailability: 0, avgPerformance: 0, avgQuality: 0 };
    }

    const avgOEE = filteredPanels.reduce((sum, panel) => sum + (panel.oee_percentage || 0), 0) / filteredPanels.length;
    const avgAvailability = filteredPanels.reduce((sum, panel) => sum + (panel.availability_percentage || 0), 0) / filteredPanels.length;
    const avgPerformance = filteredPanels.reduce((sum, panel) => sum + (panel.performance_percentage || 0), 0) / filteredPanels.length;
    const avgQuality = filteredPanels.reduce((sum, panel) => sum + (panel.quality_percentage || 0), 0) / filteredPanels.length;
    return { avgOEE, avgAvailability, avgPerformance, avgQuality };
  }, [filteredPanels]);

  const handleAssetSelection = (panel: PerformancePanel) => {
    setSelectedAsset(panel as unknown as any);
  };

  const openAIAssist = () => {
    toast({
      title: "AI Assist",
      description: "AI analysis is starting for the selected asset...",
    });
  };

  // Tabs structure
  const fleetTabs = [
    {
      id: "overview",
      label: "Fleet Overview",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Overview Error" description="Unable to load overview." />}>
          <FleetOverview stats={stats} panels={filteredPanels} trends={trends} onPanelSelect={handleAssetSelection} />
        </ErrorBoundary>
      ),
    },
    {
      id: "losses",
      label: "Fleet Losses",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Losses Error" description="Unable to load losses." />}>
          <FleetLossOverview losses={losses} trends={trends} />
        </ErrorBoundary>
      ),
    },
    {
      id: "bottlenecks",
      label: "Bottlenecks",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Bottlenecks Error" description="Unable to load bottlenecks." />}>
          <FleetBottleneckOverview bottlenecks={bottlenecks} />
        </ErrorBoundary>
      ),
    },
    {
      id: "trends",
      label: "Trends",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Trends Error" description="Unable to load trends." />}>
          <PerformanceTrendView panel={null} tenantId={currentTenant.id} />
        </ErrorBoundary>
      ),
    },
    {
      id: "benchmarks",
      label: "Benchmarks",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Benchmarks Error" description="Unable to load benchmarks." />}>
          <PerformanceBenchmarkView panel={null} tenantId={currentTenant.id} />
        </ErrorBoundary>
      ),
    },
  ];

  const assetTabs = selectedPanel ? [
    {
      id: "overview",
      label: "Asset Overview",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Overview Error" description="Unable to load overview." />}>
          <OverviewTab panel={selectedPanel} trends={trends} />
        </ErrorBoundary>
      ),
    },
    {
      id: "losses",
      label: "Loss Analysis",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Losses Error" description="Unable to load losses." />}>
          <AssetLossAnalysis panel={selectedPanel} losses={losses.filter(l => l.asset_id === selectedPanel.id || l.site_id === selectedPanel.site_id)} />
        </ErrorBoundary>
      ),
    },
    {
      id: "bottlenecks",
      label: "Bottlenecks",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Bottlenecks Error" description="Unable to load bottlenecks." />}>
          <AssetBottleneckDetail panel={selectedPanel} bottlenecks={bottlenecks.filter(b => b.asset_id === selectedPanel.id || b.site_id === selectedPanel.site_id)} />
        </ErrorBoundary>
      ),
    },
    {
      id: "trends",
      label: "Trends",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Trends Error" description="Unable to load trends." />}>
          <PerformanceTrendView panel={selectedPanel} tenantId={currentTenant.id} />
        </ErrorBoundary>
      ),
    },
    {
      id: "benchmarks",
      label: "Benchmarks",
      content: (
        <ErrorBoundary fallback={<EmptyStates.Error title="Benchmarks Error" description="Unable to load benchmarks." />}>
          <PerformanceBenchmarkView panel={selectedPanel} tenantId={currentTenant.id} />
        </ErrorBoundary>
      ),
    },
  ] : [];

  const workspaceTabs = selectedPanel ? assetTabs : fleetTabs;

  return (
    <PerformanceAccessGuard feature="Performance Analysis">
      <ErrorBoundary
        onError={(error) => {
          NavigationErrorHandler.handleNavigationFailure(error, "/optimise/performance");
        }}
      >
        <div className="flex w-full h-full overflow-hidden">
          <ErrorAwareListPane
            title="Performance Panels"
            subtitle={currentTenant.name}
            count={dataError ? 0 : filteredPanels.length}
            isLoading={isLoadingData}
            error={dataError}
            onRetry={retryLoadData(() => Promise.resolve())}
            contentType="performance panels"
            showFilters={false}
          >
            <div className="pb-2">
              <SearchFilterSort
                searchPlaceholder="Search assets or sites..."
                onSearchChange={setSearchQuery}
                filterContent={
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        <SelectItem value="oee">OEE (High to Low)</SelectItem>
                        <SelectItem value="availability">Availability (High to Low)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            </div>

            {filteredPanels.length > 0 ? (
              <div className="space-y-3">
                {filteredPanels.map((panel) => (
                  <ListItemVariants.PerformancePanel
                    key={panel.id}
                    panel={panel as any}
                    isSelected={selectedPanel?.id === panel.id}
                    onClick={() => handleAssetSelection(panel)}
                  />
                ))}
              </div>
            ) : (
              <EmptyStates.NoPerformancePanels size="sm" className="py-8" />
            )}
          </ErrorAwareListPane>

          <ErrorAwareWorkPane
            key={selectedPanel ? `asset-${selectedPanel.id}` : 'fleet-view'}
            title={selectedPanel ? selectedPanel.name : "Fleet Performance"}
            subtitle={selectedPanel ? `${selectedPanel.panel_type} panel · ${selectedPanel.status}` : `${filteredPanels.length} assets monitoring`}
            tabs={workspaceTabs}
            defaultTab="overview"
            contentType="performance_analysis"
            actions={
              <div className="flex items-center gap-2">
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
      </ErrorBoundary>
    </PerformanceAccessGuard>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

function FleetOverview({
  stats,
  panels,
  trends,
  onPanelSelect,
}: {
  stats: { avgOEE: number; avgAvailability: number; avgPerformance: number; avgQuality: number };
  panels: PerformancePanel[];
  trends: PerformanceTrend[];
  onPanelSelect?: (panel: PerformancePanel) => void;
}) {
  // Filter trends by metric type for fleet-wide view
  const oeeTrends = useMemo(() => trends.filter(t => t.metric_name === 'oee_percentage'), [trends]);
  const lossTrends = useMemo(() => trends.filter(t => t.metric_name === 'transmission_losses'), [trends]);

  return (
    <div className="space-y-6">
      <PerformanceMetricsDashboard panels={panels} trends={trends} />

      {/* Fleet-Wide Trend Charts */}
      {trends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fleet OEE Trend */}
          {oeeTrends.length > 0 && (
            <TrendAnalysisChart
              trends={oeeTrends}
              title="Fleet OEE Performance Trend"
              defaultTimePeriod="30d"
              height={280}
            />
          )}

          {/* Fleet Loss Trend */}
          {lossTrends.length > 0 && (
            <TrendAnalysisChart
              trends={lossTrends}
              title="Fleet Transmission Losses Trend"
              defaultTimePeriod="30d"
              height={280}
            />
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-3 px-1">Top Performing Assets</h3>
        <DataTable
          columns={TableConfigs.performance.columns}
          data={panels.sort((a, b) => b.oee_percentage - a.oee_percentage).slice(0, 5).map(p => ({
            ...p,
            oee: p.oee_percentage,
            availability: p.availability_percentage,
            performance: p.performance_percentage,
            quality: p.quality_percentage,
            asset: p.asset_id || p.name,
            site: p.site_id || "Main Site",
            lastUpdated: new Date(p.last_updated).toLocaleDateString()
          }))}
          onRowClick={(row) => onPanelSelect?.(row as unknown as PerformancePanel)}
        />
      </div>
    </div>
  );
}

function OverviewTab({ panel, trends }: { panel: PerformancePanel; trends: PerformanceTrend[] }) {
  // Filter trends for this specific panel/asset
  const assetTrends = useMemo(() => {
    if (!panel.asset_id) {
      console.log('[OverviewTab] No asset_id on panel:', panel);
      return [];
    }
    const filtered = trends.filter(t => t.asset_id === panel.asset_id);
    console.log('[OverviewTab] Asset trends for', panel.name, ':', filtered.length, 'trends');
    return filtered;
  }, [trends, panel.asset_id, panel.name]);

  const oeeTrends = useMemo(() => {
    const filtered = assetTrends.filter(t => t.metric_name === 'oee_percentage');
    console.log('[OverviewTab] OEE trends:', filtered.length);
    return filtered;
  }, [assetTrends]);

  const lossTrends = useMemo(() => {
    const filtered = assetTrends.filter(t => t.metric_name === 'transmission_losses');
    console.log('[OverviewTab] Loss trends:', filtered.length);
    return filtered;
  }, [assetTrends]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="OEE Score"
          value={`${safeToFixed(panel.oee_percentage, 1)}%`}
          subtitle="Overall Efficiency"
          icon={Gauge}
          variant={panel.oee_percentage >= 85 ? "success" : panel.oee_percentage >= 70 ? "warning" : "destructive"}
        />
        <KPICard
          title="Availability"
          value={`${safeToFixed(panel.availability_percentage, 1)}%`}
          subtitle="Uptime"
          icon={Activity}
          variant="primary"
        />
        <KPICard
          title="Performance"
          value={`${safeToFixed(panel.performance_percentage, 1)}%`}
          subtitle="Speed"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="Quality"
          value={`${safeToFixed(panel.quality_percentage, 1)}%`}
          subtitle="First Pass Yield"
          icon={Target}
          variant="success"
        />
      </div>

      {/* Trend Charts */}
      {assetTrends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OEE Trend */}
          {oeeTrends.length > 0 && (
            <TrendAnalysisChart
              trends={oeeTrends}
              title="OEE Performance Trend"

              defaultTimePeriod="30d"
              height={250}
            />
          )}

          {/* Loss Trend (for transformers) */}
          {lossTrends.length > 0 && (
            <TrendAnalysisChart
              trends={lossTrends}
              title="Transmission Losses Trend"

              defaultTimePeriod="30d"
              height={250}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-primary" />
            Operational Status
          </h4>
          <div className="space-y-3">
            <InfoRow label="Status" value={<StatusBadge status={panel.status === 'active' ? 'online' : panel.status === 'maintenance' ? 'maintenance' : 'offline'} />} />
            <InfoRow label="Panel Type" value={panel.panel_type?.toUpperCase() || 'N/A'} />
            <InfoRow label="Last Updated" value={new Date(panel.last_updated).toLocaleString()} />
            <InfoRow label="Created At" value={new Date(panel.created_at).toLocaleDateString()} />
          </div>
        </div>

        {/* Sector Specific Metrics */}
        {(panel.line_loading !== undefined || panel.transformer_loading !== undefined || panel.saidi !== undefined) && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Power Sector Metrics
            </h4>
            <div className="space-y-3">
              {panel.line_loading !== undefined && <InfoRow label="Line Loading" value={`${safeToFixed(panel.line_loading, 1)}%`} />}
              {panel.transformer_loading !== undefined && <InfoRow label="Transformer Loading" value={`${safeToFixed(panel.transformer_loading, 1)}%`} />}
              {panel.transmission_losses !== undefined && <InfoRow label="Transmission Losses" value={`${safeToFixed(panel.transmission_losses, 1)}%`} />}
              {panel.saidi !== undefined && <InfoRow label="SAIDI" value={safeToFixed(panel.saidi, 2)} />}
              {panel.trip_count !== undefined && <InfoRow label="Trip Count" value={panel.trip_count.toString()} />}
            </div>
          </div>
        )}

        {/* Upstream Specific Placeholder (If we had these in the type) */}
        {/* Note: Extended properties from any type in case they are there but not in interface */}
        {(panel as any).well_uptime !== undefined && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-primary" />
              Upstream Metrics
            </h4>
            <div className="space-y-3">
              <InfoRow label="Well Uptime" value={`${safeToFixed((panel as any).well_uptime, 1)}%`} />
              <InfoRow label="Production Rate" value={`${(panel as any).production_rate || 0} bpd`} />
              <InfoRow label="Water Cut" value={`${(panel as any).water_cut || 0}%`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FleetLossOverview({ losses, trends }: { losses: PerformanceLoss[]; trends: PerformanceTrend[] }) {
  const stats = useMemo(() => {
    const totalDuration = losses.reduce((sum, l) => sum + l.duration_minutes, 0);
    const totalImpact = losses.reduce((sum, l) => sum + l.impact_percentage, 0);
    const avgImpact = losses.length > 0 ? totalImpact / losses.length : 0;
    return { totalDuration, totalImpact, avgImpact };
  }, [losses]);

  // Filter loss trends
  const lossTrends = useMemo(() => trends.filter(t => t.metric_name === 'transmission_losses'), [trends]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Loss Time" value={`${stats.totalDuration} min`} subtitle="Fleet total" icon={Clock} variant="warning" />
        <KPICard title="Total Impact" value={`${safeToFixed(stats.totalImpact, 1)}%`} subtitle="Capacity loss" icon={TrendingDown} variant="destructive" />
        <KPICard title="Avg Impact" value={`${safeToFixed(stats.avgImpact, 1)}%`} subtitle="Per event" icon={AlertTriangle} variant="warning" />
        <KPICard title="Loss Events" value={losses.length.toString()} subtitle="Total recorded" icon={ActivityIcon} variant="primary" />
      </div>

      {/* Fleet Loss Trend Chart */}
      {lossTrends.length > 0 && (
        <TrendAnalysisChart
          trends={lossTrends}
          title="Fleet Transmission Losses Trend"
          defaultTimePeriod="30d"
          height={280}
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        {['technical', 'non_technical', 'measurement_error'].map(category => {
          const catLosses = losses.filter(l => l.loss_category === category);
          return (
            <LossAnalysisCard
              key={category}
              category={category as any}
              duration={catLosses.reduce((sum, l) => sum + l.duration_minutes, 0)}
              frequency={catLosses.length}
              impact={catLosses.length > 0 ? catLosses.reduce((sum, l) => sum + l.impact_percentage, 0) / catLosses.length : 0}
            />
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Critical Loss Events</h4>
        <DataTable
          columns={[
            { key: "description", label: "Description" },
            { key: "loss_category", label: "Category" },
            { key: "impact", label: "Impact (%)" },
            { key: "duration", label: "Duration (min)" },
            { key: "date", label: "Date" },
          ]}
          data={losses.sort((a, b) => b.impact_percentage - a.impact_percentage).slice(0, 10).map(l => ({
            id: l.id,
            description: l.description,
            loss_category: l.loss_category.replace('_', ' '),
            impact: safeToFixed(l.impact_percentage, 1),
            duration: l.duration_minutes,
            date: new Date(l.occurred_at).toLocaleDateString()
          }))}
        />
      </div>
    </div>
  );
}

function AssetLossAnalysis({ panel, losses }: { panel: PerformancePanel, losses: PerformanceLoss[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Loss Distribution</h4>
          <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Pareto Chart Visualization</p>
              <p className="text-xs text-muted-foreground">Coming in Stage 03</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Loss Summary</h4>
          <div className="space-y-4">
            {['technical', 'non_technical', 'measurement_error'].map(cat => {
              const catLosses = losses.filter(l => l.loss_category === cat);
              const impact = catLosses.reduce((sum, l) => sum + l.impact_percentage, 0);
              return (
                <div key={cat} className="p-4 bg-secondary/10 rounded-lg flex justify-between items-center">
                  <span className="capitalize">{cat.replace('_', ' ')}</span>
                  <span className="font-bold text-destructive">{safeToFixed(impact, 1)}% impact</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Event Log</h4>
        <DataTable
          columns={[
            { key: "type", label: "Loss Type" },
            { key: "desc", label: "Description" },
            { key: "impact", label: "Impact" },
            { key: "duration", label: "Duration" },
            { key: "date", label: "Occurred At" },
          ]}
          data={losses.map(l => ({
            id: l.id,
            type: l.loss_type,
            desc: l.description,
            impact: `${safeToFixed(l.impact_percentage, 1)}%`,
            duration: `${l.duration_minutes} min`,
            date: new Date(l.occurred_at).toLocaleString()
          }))}
        />
      </div>
    </div>
  );
}

function FleetBottleneckOverview({ bottlenecks }: { bottlenecks: PerformanceBottleneck[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Active Constraints" value={bottlenecks.filter(b => b.status === 'active').length.toString()} subtitle="Current bottlenecks" icon={AlertTriangle} variant="destructive" />
        <KPICard title="Avg Loading" value={`${safeToFixed(bottlenecks.reduce((sum, b) => sum + (b.loading_percentage || 0), 0) / (bottlenecks.length || 1), 1)}%`} subtitle="Fleet average" icon={Zap} variant="warning" />
        <KPICard title="High Severity" value={bottlenecks.filter(b => b.severity === 'high').length.toString()} subtitle="Critical alerts" icon={AlertTriangle} variant="destructive" />
        <KPICard title="Monitoring" value={bottlenecks.filter(b => b.status === 'monitoring').length.toString()} subtitle="Under watch" icon={ActivityIcon} variant="primary" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Constraint Distribution</h4>
          {['thermal', 'voltage', 'stability', 'operational'].map(type => {
            const count = bottlenecks.filter(b => b.constraint_type === type).length;
            return (
              <div key={type} className="flex justify-between items-center py-2 border-b border-border last:border-0 capitalize">
                <span>{type}</span>
                <span className="font-medium">{count} active</span>
              </div>
            );
          })}
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Critical Constraints</h4>
          <div className="space-y-3">
            {bottlenecks.filter(b => b.severity === 'high').slice(0, 5).map(b => (
              <div key={b.id} className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium">{b.description}</div>
                  <div className="text-xs text-muted-foreground">{b.constraint_type.toUpperCase()}</div>
                </div>
                <StatusBadge status="offline" size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetBottleneckDetail({ panel, bottlenecks }: { panel: PerformancePanel, bottlenecks: PerformanceBottleneck[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {bottlenecks.map(b => (
          <BottleneckConstraintCard key={b.id} bottleneck={b} />
        ))}
        {bottlenecks.length === 0 && (
          <div className="col-span-3 py-12 text-center bg-card border border-border border-dashed rounded-lg">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">No active bottlenecks identified for this asset.</p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Historical Constraints</h4>
        <DataTable
          columns={[
            { key: "desc", label: "Description" },
            { key: "type", label: "Type" },
            { key: "severity", label: "Severity" },
            { key: "loading", label: "Loading" },
            { key: "status", label: "Status" },
          ]}
          data={bottlenecks.map(b => ({
            id: b.id,
            desc: b.description,
            type: b.constraint_type,
            severity: b.severity.toUpperCase(),
            loading: `${safeToFixed(b.loading_percentage || 0, 1)}%`,
            status: <StatusBadge status={b.status === 'active' ? 'offline' : b.status === 'monitoring' ? 'maintenance' : 'online'} />
          }))}
        />
      </div>
    </div>
  );
}

function PerformanceTrendView({ panel, tenantId }: { panel: PerformancePanel | null, tenantId: string }) {
  const { provider } = useDataProvider();
  const [metric, setMetric] = useState("oee_percentage");
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const data = await provider.listPerformanceTrends(tenantId, {
          date_from: dateFrom,
          date_to: new Date().toISOString(),
          metric_names: [metric],
          asset_ids: panel ? [panel.id] : undefined
        });
        setTrends(data);
      } catch (error) {
        console.error("Trends fetch failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrends();
  }, [tenantId, panel, metric, provider]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="bg-transparent border-none text-sm font-medium focus:ring-0"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="oee_percentage">OEE Percentage</option>
            <option value="availability_percentage">Availability</option>
            <option value="performance_percentage">Performance</option>
            <option value="quality_percentage">Quality</option>
            <option value="line_loading">Line Loading (Power)</option>
            <option value="transmission_losses">Transmission Losses (Power)</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Last 30 Days
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <TrendAnalysisChart
          trends={trends}
          metric={metric}
          timePeriod="30d"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Statistical Summary</h4>
          <div className="space-y-3">
            <InfoRow label="Average Value" value={`${safeToFixed(trends.reduce((sum, t) => sum + t.metric_value, 0) / (trends.length || 1), 1)}%`} />
            <InfoRow label="Peak Value" value={`${safeToFixed(Math.max(...trends.map(t => t.metric_value), 0), 1)}%`} />
            <InfoRow label="Min Value" value={`${safeToFixed(Math.min(...trends.map(t => t.metric_value), Infinity) === Infinity ? 0 : Math.min(...trends.map(t => t.metric_value)), 1)}%`} />
            <InfoRow label="Volatility" value={trends.length > 5 ? "Medium" : "Low"} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Metric Correlations</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>OEE vs Availability</span>
              <span className="text-success font-medium">0.89 (Strong)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Performance vs Quality</span>
              <span className="text-info font-medium">0.64 (Moderate)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>OEE vs Losses</span>
              <span className="text-destructive font-medium">-0.72 (Inverse)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceBenchmarkView({ panel, tenantId }: { panel: PerformancePanel | null, tenantId: string }) {
  const { provider } = useDataProvider();
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([]);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const data = await provider.listPerformanceBenchmarks(tenantId);
        setBenchmarks(data);
      } catch (error) {
        console.error("Benchmarks fetch failed", error);
      }
    };
    fetchBenchmarks();
  }, [tenantId, provider]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-primary mb-1">92th</div>
          <div className="text-sm font-medium">Global Percentile</div>
          <div className="text-xs text-muted-foreground mt-2 px-4">Selected asset is performing in the top 10% of similar industry units.</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-success mb-1">+4.2%</div>
          <div className="text-sm font-medium">vs Site Average</div>
          <div className="text-xs text-muted-foreground mt-2 px-4">Efficiency is significantly higher than the fleet baseline.</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-warning mb-1">-1.5%</div>
          <div className="text-sm font-medium">vs Target (95%)</div>
          <div className="text-xs text-muted-foreground mt-2 px-4">Marginally below the world-class OEE target.</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Asset Comparison Table</h4>
        <BenchmarkComparisonTable benchmarks={benchmarks} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between py-1", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}