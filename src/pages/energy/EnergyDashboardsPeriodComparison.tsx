import { useState, useEffect, useMemo } from "react";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  MapPin,
  GitBranch,
  Minus
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder } from "@/types/transmission";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

/**
 * EnergyDashboardsPeriodComparison Page
 * Displays period-over-period comparisons for energy metrics
 * Extended with transmission metrics when sector is Power/Transmission
 * 
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6
 */

interface ComparisonPeriod {
  id: string;
  name: string;
  description: string;
  daysInCurrent: number;
  daysInPrevious: number;
}

const comparisonPeriods: ComparisonPeriod[] = [
  {
    id: "today-yesterday",
    name: "Today vs Yesterday",
    description: "Current day compared to previous day",
    daysInCurrent: 1,
    daysInPrevious: 1
  },
  {
    id: "week-lastweek",
    name: "This Week vs Last Week",
    description: "Current week compared to previous week",
    daysInCurrent: 7,
    daysInPrevious: 7
  },
  {
    id: "month-lastmonth",
    name: "This Month vs Last Month",
    description: "Current month compared to previous month",
    daysInCurrent: 30,
    daysInPrevious: 30
  },
  {
    id: "quarter-lastquarter",
    name: "This Quarter vs Last Quarter",
    description: "Current quarter compared to previous quarter",
    daysInCurrent: 90,
    daysInPrevious: 90
  }
];

interface MetricComparison {
  metric: string;
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
  unit: string;
  normalized?: boolean;
}

interface ScopeComparison {
  scopeId: string;
  scopeName: string;
  scopeType: 'substation' | 'feeder' | 'facility' | 'well';
  metrics: MetricComparison[];
}

function EnergyDashboardsPeriodComparison() {
  const { sector, subsector, currentTenant } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>(comparisonPeriods[0]);

  // Sector context check
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Transmission-specific state
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
        setLoading(true);
        const provider = getTransmissionProvider();

        const [substationsData, feedersData] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id })
        ]);

        setTxSubstations(substationsData);
        setTxFeeders(feedersData);
      } catch (error) {
        console.error('Failed to load transmission data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransmissionData();
  }, [isTransmission, currentTenant]);

  const filteredPeriods = useMemo(() => {
    if (!searchQuery) return comparisonPeriods;
    const query = searchQuery.toLowerCase();
    return comparisonPeriods.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredPeriods.length > 0 && (!selectedPeriod || !filteredPeriods.find(p => p.id === selectedPeriod.id))) {
      setSelectedPeriod(filteredPeriods[0]);
    }
  }, [filteredPeriods, selectedPeriod]);

  // Calculate normalized metrics for different period lengths - Requirement 25.5
  const normalizeMetric = (value: number, periodDays: number): number => {
    // Normalize to per-day basis for fair comparison
    return value / periodDays;
  };

  // Generate transmission metrics comparison - Requirements 25.1, 25.2, 25.3
  const transmissionComparison = useMemo((): ScopeComparison[] => {
    if (!isTransmission) return [];

    const comparisons: ScopeComparison[] = [];

    // Overall grid comparison - Show if no specific substation or feeder selected
    if (!filters.substationId && !filters.feederId) {
      const gridMetrics: MetricComparison[] = [
        {
          metric: 'Total Energy Delivered',
          current: 12500 * selectedPeriod.daysInCurrent, // Mock MWh
          previous: 11800 * selectedPeriod.daysInPrevious,
          variance: 0,
          variancePercent: 0,
          unit: 'MWh',
          normalized: false
        },
        {
          metric: 'Grid Losses',
          current: 3.2,
          previous: 3.5,
          variance: -0.3,
          variancePercent: -8.6,
          unit: '%',
          normalized: false
        },
        {
          metric: 'Load Factor',
          current: 72.5,
          previous: 68.3,
          variance: 4.2,
          variancePercent: 6.1,
          unit: '%',
          normalized: false
        },
        {
          metric: 'System Efficiency',
          current: 96.8,
          previous: 96.5,
          variance: 0.3,
          variancePercent: 0.3,
          unit: '%',
          normalized: false
        },
        {
          metric: 'Peak Demand',
          current: 625,
          previous: 598,
          variance: 27,
          variancePercent: 4.5,
          unit: 'MW',
          normalized: false
        }
      ];

      // Calculate normalized values and variances
      gridMetrics.forEach(metric => {
        if (metric.normalized === false && metric.unit === 'MWh') {
          const currentNorm = normalizeMetric(metric.current, selectedPeriod.daysInCurrent);
          const previousNorm = normalizeMetric(metric.previous, selectedPeriod.daysInPrevious);
          metric.variance = currentNorm - previousNorm;
          metric.variancePercent = ((currentNorm - previousNorm) / previousNorm) * 100;
          metric.normalized = true;
        } else if (metric.variance === 0) {
          metric.variance = metric.current - metric.previous;
          metric.variancePercent = ((metric.current - metric.previous) / metric.previous) * 100;
        }
      });

      comparisons.push({
        scopeId: 'grid',
        scopeName: 'Entire Grid',
        scopeType: 'substation',
        metrics: gridMetrics
      });
    }

    // Substation-level comparison - Requirement 25.2
    if (filters.substationId && !filters.feederId) {
      const substation = txSubstations.find(s => s.id === filters.substationId);
      if (substation) {
        const substationMetrics: MetricComparison[] = [
          {
            metric: 'Energy Throughput',
            current: 2500 * selectedPeriod.daysInCurrent, // Mock MWh
            previous: 2350 * selectedPeriod.daysInPrevious,
            variance: 0,
            variancePercent: 0,
            unit: 'MWh',
            normalized: false
          },
          {
            metric: 'Substation Losses',
            current: 2.8,
            previous: 3.1,
            variance: -0.3,
            variancePercent: -9.7,
            unit: '%',
            normalized: false
          },
          {
            metric: 'Average Load',
            current: 85.5,
            previous: 82.1,
            variance: 3.4,
            variancePercent: 4.1,
            unit: 'MW',
            normalized: false
          },
          {
            metric: 'Transformer Efficiency',
            current: 98.2,
            previous: 98.0,
            variance: 0.2,
            variancePercent: 0.2,
            unit: '%',
            normalized: false
          },
          {
            metric: 'Active Feeders',
            current: txFeeders.filter(f => f.substation_id === filters.substationId && f.active).length,
            previous: txFeeders.filter(f => f.substation_id === filters.substationId && f.active).length,
            variance: 0,
            variancePercent: 0,
            unit: 'count',
            normalized: false
          }
        ];

        // Normalize energy metrics
        substationMetrics.forEach(metric => {
          if (metric.normalized === false && metric.unit === 'MWh') {
            const currentNorm = normalizeMetric(metric.current, selectedPeriod.daysInCurrent);
            const previousNorm = normalizeMetric(metric.previous, selectedPeriod.daysInPrevious);
            metric.variance = currentNorm - previousNorm;
            metric.variancePercent = ((currentNorm - previousNorm) / previousNorm) * 100;
            metric.normalized = true;
          } else if (metric.variance === 0 && metric.unit !== 'count') {
            metric.variance = metric.current - metric.previous;
            metric.variancePercent = metric.previous !== 0
              ? ((metric.current - metric.previous) / metric.previous) * 100
              : 0;
          }
        });

        comparisons.push({
          scopeId: substation.id,
          scopeName: substation.name,
          scopeType: 'substation',
          metrics: substationMetrics
        });
      }
    }

    // Feeder-level comparison - Requirement 25.2
    if (filters.feederId) {
      const feeder = txFeeders.find(f => f.id === filters.feederId);
      if (feeder) {
        const feederMetrics: MetricComparison[] = [
          {
            metric: 'Energy Delivered',
            current: 450 * selectedPeriod.daysInCurrent, // Mock MWh
            previous: 425 * selectedPeriod.daysInPrevious,
            variance: 0,
            variancePercent: 0,
            unit: 'MWh',
            normalized: false
          },
          {
            metric: 'Average Load',
            current: 18.5,
            previous: 17.2,
            variance: 1.3,
            variancePercent: 7.6,
            unit: 'MW',
            normalized: false
          },
          {
            metric: 'Peak Load',
            current: 28.5,
            previous: 26.8,
            variance: 1.7,
            variancePercent: 6.3,
            unit: 'MW',
            normalized: false
          },
          {
            metric: 'Load Factor',
            current: 64.9,
            previous: 64.2,
            variance: 0.7,
            variancePercent: 1.1,
            unit: '%',
            normalized: false
          },
          {
            metric: 'Utilization',
            current: 47.5,
            previous: 44.7,
            variance: 2.8,
            variancePercent: 6.3,
            unit: '%',
            normalized: false
          }
        ];

        // Normalize energy metrics
        feederMetrics.forEach(metric => {
          if (metric.normalized === false && metric.unit === 'MWh') {
            const currentNorm = normalizeMetric(metric.current, selectedPeriod.daysInCurrent);
            const previousNorm = normalizeMetric(metric.previous, selectedPeriod.daysInPrevious);
            metric.variance = currentNorm - previousNorm;
            metric.variancePercent = ((currentNorm - previousNorm) / previousNorm) * 100;
            metric.normalized = true;
          } else if (metric.variance === 0) {
            metric.variance = metric.current - metric.previous;
            metric.variancePercent = ((metric.current - metric.previous) / metric.previous) * 100;
          }
        });

        comparisons.push({
          scopeId: feeder.id,
          scopeName: feeder.name,
          scopeType: 'feeder',
          metrics: feederMetrics
        });
      }
    }

    return comparisons;
  }, [isTransmission, filters.substationId, filters.feederId, selectedPeriod, txSubstations, txFeeders]);

  // Generate upstream comparison (mock data for non-transmission)
  const upstreamComparison = useMemo((): ScopeComparison[] => {
    if (isTransmission) return [];

    return [{
      scopeId: 'facility-1',
      scopeName: 'Main Facility',
      scopeType: 'facility',
      metrics: [
        {
          metric: 'Total Energy Consumption',
          current: 8500 * selectedPeriod.daysInCurrent,
          previous: 8200 * selectedPeriod.daysInPrevious,
          variance: 0,
          variancePercent: 0,
          unit: 'kWh',
          normalized: false
        },
        {
          metric: 'Peak Demand',
          current: 425,
          previous: 410,
          variance: 15,
          variancePercent: 3.7,
          unit: 'kW',
          normalized: false
        },
        {
          metric: 'Power Factor',
          current: 0.92,
          previous: 0.89,
          variance: 0.03,
          variancePercent: 3.4,
          unit: '',
          normalized: false
        }
      ].map(metric => {
        if (metric.normalized === false && (metric.unit === 'kWh' || metric.unit === 'MWh')) {
          const currentNorm = normalizeMetric(metric.current, selectedPeriod.daysInCurrent);
          const previousNorm = normalizeMetric(metric.previous, selectedPeriod.daysInPrevious);
          metric.variance = currentNorm - previousNorm;
          metric.variancePercent = ((currentNorm - previousNorm) / previousNorm) * 100;
          metric.normalized = true;
        } else if (metric.variance === 0) {
          metric.variance = metric.current - metric.previous;
          metric.variancePercent = ((metric.current - metric.previous) / metric.previous) * 100;
        }
        return metric;
      })
    }];
  }, [isTransmission, selectedPeriod]);

  const activeComparison = isTransmission ? transmissionComparison : upstreamComparison;

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
    />
  );

  return (
    <EMSPageShell
      title={isTransmission ? "Transmission Period Comparison" : "Period-over-period Comparison"}
      featureSetName="Energy Dashboards & Reporting"
      featureName="Period Comparison"
      listType="scopes"
      listItems={filteredPeriods}
      selectedItem={selectedPeriod}
      onItemSelect={setSelectedPeriod}
      searchPlaceholder="Search comparison periods..."
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      workPaneContent={
        <div className="space-y-6">
          {/* Period Selection Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <CardTitle>{selectedPeriod.name}</CardTitle>
                </div>
                {selectedPeriod.daysInCurrent !== selectedPeriod.daysInPrevious && (
                  <Badge variant="outline">
                    Normalized for {selectedPeriod.daysInCurrent} vs {selectedPeriod.daysInPrevious} days
                  </Badge>
                )}
              </div>
              <CardDescription>{selectedPeriod.description}</CardDescription>
            </CardHeader>
          </Card>

          {/* Metrics Comparison - Requirements 25.1, 25.3, 25.4 */}
          {activeComparison.map(comparison => (
            <Card key={comparison.scopeId}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {comparison.scopeType === 'substation' && <MapPin className="w-5 h-5" />}
                  {comparison.scopeType === 'feeder' && <GitBranch className="w-5 h-5" />}
                  {comparison.scopeType === 'facility' && <Activity className="w-5 h-5" />}
                  <CardTitle>{comparison.scopeName}</CardTitle>
                </div>
                <CardDescription>
                  Comparing {selectedPeriod.name.toLowerCase()}
                  {selectedPeriod.daysInCurrent !== selectedPeriod.daysInPrevious &&
                    ' (normalized per day)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.metrics.map((metric, idx) => (
                    <MetricComparisonRow
                      key={idx}
                      metric={metric}
                      periodDays={selectedPeriod.daysInCurrent}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty state */}
          {activeComparison.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a scope to view period comparison</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      }
    />
  );
}

/**
 * MetricComparisonRow Component
 * Displays a single metric comparison with variance indicators
 * Requirements: 25.3, 25.4, 25.6
 */
interface MetricComparisonRowProps {
  metric: MetricComparison;
  periodDays: number;
}

function MetricComparisonRow({ metric, periodDays }: MetricComparisonRowProps) {
  const isPositiveGood = !metric.metric.toLowerCase().includes('loss');
  const isImprovement = isPositiveGood
    ? metric.variancePercent > 0
    : metric.variancePercent < 0;

  const formatValue = (value: number, unit: string, normalized: boolean = false): string => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'count') return value.toString();
    if (unit === '') return value.toFixed(2);

    // For normalized values, show per-day
    if (normalized && (unit === 'MWh' || unit === 'kWh')) {
      return `${value.toFixed(1)} ${unit}/day`;
    }

    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium">{metric.metric}</h4>
        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
          <span>Current: {formatValue(
            metric.normalized ? normalizeMetric(metric.current, periodDays) : metric.current,
            metric.unit,
            metric.normalized
          )}</span>
          <span>Previous: {formatValue(
            metric.normalized ? normalizeMetric(metric.previous, periodDays) : metric.previous,
            metric.unit,
            metric.normalized
          )}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-sm font-medium flex items-center gap-1 ${isImprovement ? 'text-green-600' :
              metric.variancePercent === 0 ? 'text-muted-foreground' :
                'text-red-600'
            }`}>
            {metric.variancePercent > 0 && <ArrowUpRight className="w-4 h-4" />}
            {metric.variancePercent < 0 && <ArrowDownRight className="w-4 h-4" />}
            {metric.variancePercent === 0 && <Minus className="w-4 h-4" />}
            {Math.abs(metric.variancePercent).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {metric.variance > 0 ? '+' : ''}{formatValue(
              metric.normalized ? metric.variance : metric.variance,
              metric.unit,
              false
            )}
          </div>
        </div>

        <Badge variant={
          isImprovement ? 'default' :
            metric.variancePercent === 0 ? 'outline' :
              'destructive'
        }>
          {isImprovement ? 'Improved' :
            metric.variancePercent === 0 ? 'Unchanged' :
              'Declined'}
        </Badge>
      </div>
    </div>
  );
}

// Helper function to normalize metrics
function normalizeMetric(value: number, periodDays: number): number {
  return value / periodDays;
}

export { EnergyDashboardsPeriodComparison };