import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/shared/DataTable';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Plus,
  BarChart3,
  Medal,
  Award,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceBenchmark, BenchmarkEntity, BenchmarkMetric } from '@/types/performance';
import { safeToFixed, isNonEmptyArray, safeReplace } from '@/lib/safeDataAccess';

interface BenchmarkComparisonTableProps {
  benchmarks: PerformanceBenchmark[];
  onCreateBenchmark?: (criteria: BenchmarkCriteria) => void;
  className?: string;
}

interface BenchmarkCriteria {
  name: string;
  type: 'site_comparison' | 'asset_comparison' | 'historical_comparison';
  entities: string[];
  metrics: string[];
}

interface EnhancedBenchmarkEntity extends BenchmarkEntity {
  metrics: BenchmarkMetric[];
  performance_tier: 'top' | 'average' | 'underperformer';
  benchmark_score: number;
}

/**
 * Benchmark Comparison Table Component
 * 
 * Displays asset/site rankings with percentile information.
 * Shows top performers, average performers, and underperformers.
 * Adds custom benchmark group creation interface.
 * 
 * Requirements: 7.2, 7.3, 7.6
 */
export function BenchmarkComparisonTable({
  benchmarks,
  onCreateBenchmark,
  className
}: BenchmarkComparisonTableProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBenchmarkCriteria, setNewBenchmarkCriteria] = useState<BenchmarkCriteria>({
    name: '',
    type: 'site_comparison',
    entities: [],
    metrics: []
  });

  // Get the selected benchmark data
  const currentBenchmark = useMemo(() => {
    return benchmarks.find(b => b.id === selectedBenchmark) || benchmarks[0];
  }, [benchmarks, selectedBenchmark]);

  // Process benchmark data for display
  const processedEntities = useMemo((): EnhancedBenchmarkEntity[] => {
    if (!currentBenchmark || !isNonEmptyArray(currentBenchmark.entities)) return [];

    return currentBenchmark.entities.map(entity => {
      // Calculate benchmark score (average of all metrics)
      const entityMetrics = isNonEmptyArray(currentBenchmark.metrics) 
        ? currentBenchmark.metrics.filter(m => 
            // Assuming metrics are associated with entities by some logic
            true // For now, include all metrics
          )
        : [];

      const benchmarkScore = entityMetrics.length > 0 
        ? entityMetrics.reduce((sum, metric) => sum + (metric?.metric_value ?? 0), 0) / entityMetrics.length
        : 0;

      // Determine performance tier based on percentile
      const percentile = entity?.percentile ?? 0;
      let performance_tier: 'top' | 'average' | 'underperformer';
      if (percentile >= 80) {
        performance_tier = 'top';
      } else if (percentile >= 40) {
        performance_tier = 'average';
      } else {
        performance_tier = 'underperformer';
      }

      return {
        ...entity,
        metrics: entityMetrics,
        performance_tier,
        benchmark_score: benchmarkScore
      };
    }).sort((a, b) => (a?.rank ?? 0) - (b?.rank ?? 0));
  }, [currentBenchmark]);

  // Get performance tier info
  const getPerformanceTierInfo = (tier: 'top' | 'average' | 'underperformer') => {
    switch (tier) {
      case 'top':
        return {
          label: 'Top Performer',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          variant: 'default' as const,
          icon: Trophy
        };
      case 'average':
        return {
          label: 'Average Performer',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          variant: 'secondary' as const,
          icon: Target
        };
      case 'underperformer':
        return {
          label: 'Underperformer',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          variant: 'destructive' as const,
          icon: TrendingDown
        };
    }
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  // Handle benchmark creation
  const handleCreateBenchmark = () => {
    if (onCreateBenchmark && newBenchmarkCriteria.name.trim()) {
      onCreateBenchmark(newBenchmarkCriteria);
      setShowCreateForm(false);
      setNewBenchmarkCriteria({
        name: '',
        type: 'site_comparison',
        entities: [],
        metrics: []
      });
    }
  };

  // Define table columns
  const columns: Column<EnhancedBenchmarkEntity>[] = [
    {
      key: 'rank',
      label: 'Rank',
      width: '80px',
      render: (value) => (
        <div className="flex items-center justify-center">
          {getRankIcon(value)}
        </div>
      )
    },
    {
      key: 'entity_name',
      label: 'Entity',
      className: 'font-medium',
      render: (value, entity) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {entity.entity_type}
          </div>
        </div>
      )
    },
    {
      key: 'performance_tier',
      label: 'Performance Tier',
      render: (value, entity) => {
        const tierInfo = getPerformanceTierInfo(value);
        const Icon = tierInfo.icon;
        return (
          <Badge variant={tierInfo.variant} className="flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {tierInfo.label}
          </Badge>
        );
      }
    },
    {
      key: 'benchmark_score',
      label: 'Score',
      render: (value) => (
        <div className="text-center">
          <div className="font-semibold">{safeToFixed(value, 1)}</div>
          <div className="text-xs text-muted-foreground">avg</div>
        </div>
      )
    },
    {
      key: 'percentile',
      label: 'Percentile',
      render: (value) => (
        <div className="text-center">
          <div className="font-semibold">{safeToFixed(value, 0)}th</div>
          <div className="w-16 bg-secondary rounded-full h-1 mt-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${value ?? 0}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'metrics',
      label: 'Key Metrics',
      render: (_, entity) => (
        <div className="space-y-1">
          {isNonEmptyArray(entity.metrics) && entity.metrics.slice(0, 2).map((metric, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{metric?.metric_name ?? 'Unknown'}:</span>
              <span className="font-medium">{safeToFixed(metric?.metric_value, 1)}</span>
            </div>
          ))}
          {entity.metrics.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{entity.metrics.length - 2} more
            </div>
          )}
        </div>
      )
    }
  ];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedEntities.length === 0) return null;

    const topPerformers = processedEntities.filter(e => e?.performance_tier === 'top').length;
    const averagePerformers = processedEntities.filter(e => e?.performance_tier === 'average').length;
    const underperformers = processedEntities.filter(e => e?.performance_tier === 'underperformer').length;
    
    const avgScore = processedEntities.reduce((sum, e) => sum + (e?.benchmark_score ?? 0), 0) / processedEntities.length;
    const topScore = Math.max(...processedEntities.map(e => e?.benchmark_score ?? 0));
    const bottomScore = Math.min(...processedEntities.map(e => e?.benchmark_score ?? 0));

    return {
      topPerformers,
      averagePerformers,
      underperformers,
      avgScore,
      topScore,
      bottomScore
    };
  }, [processedEntities]);

  return (
    <div className={cn("benchmark-comparison-table space-y-4", className)}>
      {/* Header and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Benchmark Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              {benchmarks.length > 1 && (
                <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select benchmark..." />
                  </SelectTrigger>
                  <SelectContent>
                    {benchmarks.map(benchmark => (
                      <SelectItem key={benchmark.id} value={benchmark.id}>
                        {benchmark.benchmark_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {onCreateBenchmark && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Benchmark
                </Button>
              )}
            </div>
          </div>

          {currentBenchmark && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Type: {safeReplace(currentBenchmark.benchmark_type, /_/g, ' ')}</span>
              <span>Entities: {currentBenchmark.entities?.length ?? 0}</span>
              <span>Created: {new Date(currentBenchmark.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </CardHeader>

        {/* Create Benchmark Form */}
        {showCreateForm && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Benchmark Name</Label>
                  <Input
                    value={newBenchmarkCriteria.name}
                    onChange={(e) => setNewBenchmarkCriteria(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter benchmark name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Comparison Type</Label>
                  <Select
                    value={newBenchmarkCriteria.type}
                    onValueChange={(value: any) => setNewBenchmarkCriteria(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="site_comparison">Site Comparison</SelectItem>
                      <SelectItem value="asset_comparison">Asset Comparison</SelectItem>
                      <SelectItem value="historical_comparison">Historical Comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreateBenchmark}
                  disabled={!newBenchmarkCriteria.name.trim()}
                >
                  Create Benchmark
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <Trophy className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">{summaryStats.topPerformers}</div>
            <div className="text-xs text-muted-foreground">Top Performers</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Target className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-yellow-600">{summaryStats.averagePerformers}</div>
            <div className="text-xs text-muted-foreground">Average</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-red-600">{summaryStats.underperformers}</div>
            <div className="text-xs text-muted-foreground">Underperformers</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-lg font-bold">{safeToFixed(summaryStats.avgScore, 1)}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-lg font-bold text-green-600">{safeToFixed(summaryStats.topScore, 1)}</div>
            <div className="text-xs text-muted-foreground">Best Score</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-lg font-bold text-red-600">{safeToFixed(summaryStats.bottomScore, 1)}</div>
            <div className="text-xs text-muted-foreground">Lowest Score</div>
          </div>
        </div>
      )}

      {/* Benchmark Table */}
      {currentBenchmark ? (
        <DataTable
          columns={columns}
          data={processedEntities}
          className="benchmark-data-table"
          emptyState={
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <div className="text-muted-foreground mb-2">No benchmark data available</div>
              <div className="text-sm text-muted-foreground">
                Create a benchmark to compare performance across entities
              </div>
            </div>
          }
        />
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <div className="text-muted-foreground mb-2">No benchmarks available</div>
            <div className="text-sm text-muted-foreground mb-4">
              Create your first benchmark to start comparing performance
            </div>
            {onCreateBenchmark && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Benchmark
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Distribution */}
      {processedEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['top', 'average', 'underperformer'].map(tier => {
                const entities = processedEntities.filter(e => e?.performance_tier === tier);
                const percentage = (entities.length / processedEntities.length) * 100;
                const tierInfo = getPerformanceTierInfo(tier as any);
                const Icon = tierInfo.icon;

                return (
                  <div key={tier} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32">
                      <Icon className={cn("h-4 w-4", tierInfo.color)} />
                      <span className="text-sm font-medium">{tierInfo.label}</span>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full transition-all", tierInfo.bgColor)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium">{entities.length}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({safeToFixed(percentage, 0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}