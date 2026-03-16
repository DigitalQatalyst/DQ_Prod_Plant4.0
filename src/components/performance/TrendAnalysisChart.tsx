import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
  Minus,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceTrend } from '@/types/performance';
import { isNonEmptyArray, safeToFixed } from '@/lib/safeDataAccess';

interface TrendAnalysisChartProps {
  trends: PerformanceTrend[];
  title?: string;
  className?: string;
  height?: number;
  showControls?: boolean;
  defaultMetrics?: string[];
  defaultTimePeriod?: '1d' | '7d' | '30d' | '90d' | '1y';
}

interface MetricConfig {
  name: string;
  label: string;
  color: string;
  visible: boolean;
  unit?: string;
}

interface MovingAveragePoint {
  timestamp: string;
  value: number;
  originalValue: number;
}

/**
 * Trend Analysis Chart Component
 * 
 * Displays performance metrics over selectable time periods.
 * Supports multiple metric overlay for correlation analysis.
 * Adds moving average lines and change detection indicators.
 * 
 * Requirements: 6.1, 6.2, 6.5
 */
export function TrendAnalysisChart({
  trends,
  title = 'Performance Trends',
  className,
  height = 300,
  showControls = true,
  defaultMetrics = [],
  defaultTimePeriod = '30d'
}: TrendAnalysisChartProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(defaultTimePeriod);
  const [metricConfigs, setMetricConfigs] = useState<Record<string, MetricConfig>>({});
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  // Helper functions wrapped in useCallback to ensure they're available before useMemo
  const getMetricLabel = useCallback((metric: string): string => {
    const labels: Record<string, string> = {
      'oee': 'OEE',
      'oee_percentage': 'OEE',
      'availability': 'Availability',
      'availability_percentage': 'Availability',
      'performance': 'Performance',
      'performance_percentage': 'Performance',
      'quality': 'Quality',
      'quality_percentage': 'Quality',
      'losses': 'Transmission Losses',
      'transmission_losses': 'Transmission Losses',
      'line_loading': 'Line Loading',
      'transformer_loading': 'Transformer Loading',
      'saidi': 'SAIDI',
      'saifi': 'SAIFI'
    };
    return labels[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const getMetricUnit = useCallback((metric: string): string => {
    const units: Record<string, string> = {
      'oee': '%',
      'oee_percentage': '%',
      'availability': '%',
      'availability_percentage': '%',
      'performance': '%',
      'performance_percentage': '%',
      'quality': '%',
      'quality_percentage': '%',
      'losses': '%',
      'transmission_losses': '%',
      'line_loading': '%',
      'transformer_loading': '%',
      'saidi': 'min',
      'saifi': 'count'
    };
    return units[metric] || '';
  }, []);

  const getMetricColor = useCallback((index: number): string => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
      '#84cc16', // lime
      '#ec4899', // pink
      '#6b7280'  // gray
    ];
    return colors[index % colors.length];
  }, []);

  // Time period options
  const timePeriods = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  // Filter trends by time period
  const filteredTrends = useMemo(() => {
    // Handle undefined or empty trends array
    if (!isNonEmptyArray(trends)) {
      return [];
    }

    const now = new Date();
    let startDate: Date;

    switch (selectedTimePeriod) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return trends.filter(trend => {
      // Add null check for timestamp
      if (!trend?.timestamp) return false;
      return new Date(trend.timestamp) >= startDate;
    });
  }, [trends, selectedTimePeriod]);

  // Get unique metrics and initialize configs
  const availableMetrics = useMemo(() => {
    // Handle empty filtered trends
    if (!isNonEmptyArray(filteredTrends)) {
      return [];
    }

    const metrics = [...new Set(filteredTrends.map(t => t?.metric_name).filter(Boolean))];

    // Initialize metric configs if not already done
    const newConfigs = { ...metricConfigs };
    metrics.forEach((metric, index) => {
      if (!newConfigs[metric]) {
        // If defaultMetrics is empty, show all metrics. Otherwise, only show metrics in defaultMetrics
        const shouldBeVisible = defaultMetrics.length === 0 || defaultMetrics.includes(metric);
        newConfigs[metric] = {
          name: metric,
          label: getMetricLabel(metric),
          color: getMetricColor(index),
          visible: shouldBeVisible,
          unit: getMetricUnit(metric)
        };
      }
    });

    if (Object.keys(newConfigs).length !== Object.keys(metricConfigs).length) {
      setMetricConfigs(newConfigs);
    }

    return metrics;
  }, [filteredTrends, metricConfigs, defaultMetrics, getMetricLabel, getMetricColor, getMetricUnit]);

  // Calculate moving average
  const calculateMovingAverage = (data: PerformanceTrend[], windowSize: number = 5): MovingAveragePoint[] => {
    // Handle undefined or empty data
    if (!isNonEmptyArray(data)) {
      return [];
    }

    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const result: MovingAveragePoint[] = [];

    for (let i = 0; i < sortedData.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(sortedData.length, i + Math.ceil(windowSize / 2));
      const window = sortedData.slice(start, end);
      const average = window.reduce((sum, point) => sum + (point?.metric_value ?? 0), 0) / window.length;

      result.push({
        timestamp: sortedData[i].timestamp,
        value: average,
        originalValue: sortedData[i]?.metric_value ?? 0
      });
    }

    return result;
  };

  // Group trends by metric
  const trendsByMetric = useMemo(() => {
    const grouped: Record<string, PerformanceTrend[]> = {};

    // Handle undefined or empty filtered trends
    if (!isNonEmptyArray(filteredTrends)) {
      return grouped;
    }

    filteredTrends.forEach(trend => {
      // Add null check for metric_name
      if (!trend?.metric_name) return;

      if (!grouped[trend.metric_name]) {
        grouped[trend.metric_name] = [];
      }
      grouped[trend.metric_name].push(trend);
    });
    return grouped;
  }, [filteredTrends]);

  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    const visibleMetrics = availableMetrics.filter(metric => metricConfigs[metric]?.visible);
    if (visibleMetrics.length === 0) return null;

    // Get all timestamps with null checks
    const allTimestamps = [...new Set(filteredTrends.map(t => t?.timestamp).filter(Boolean))].sort();
    if (allTimestamps.length === 0) return null;

    // Calculate value ranges for each metric
    const metricRanges: Record<string, { min: number; max: number }> = {};
    visibleMetrics.forEach(metric => {
      const values = trendsByMetric[metric]?.map(t => t?.metric_value).filter(v => typeof v === 'number') || [];
      if (values.length > 0) {
        metricRanges[metric] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return {
      timestamps: allTimestamps,
      metricRanges,
      visibleMetrics
    };
  }, [availableMetrics, metricConfigs, filteredTrends, trendsByMetric]);

  // Toggle metric visibility
  const toggleMetricVisibility = (metric: string) => {
    setMetricConfigs(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        visible: !prev[metric]?.visible
      }
    }));
  };

  // Detect significant changes
  const detectSignificantChanges = (data: PerformanceTrend[]): Array<{ timestamp: string; change: number; type: 'increase' | 'decrease' }> => {
    // Handle undefined or empty data
    if (!isNonEmptyArray(data)) {
      return [];
    }

    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const changes: Array<{ timestamp: string; change: number; type: 'increase' | 'decrease' }> = [];

    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];

      // Add null checks for metric values
      if (!current?.metric_value || !previous?.metric_value || previous.metric_value === 0) continue;

      const change = ((current.metric_value - previous.metric_value) / previous.metric_value) * 100;

      if (Math.abs(change) > 10) { // Significant change threshold
        changes.push({
          timestamp: current.timestamp,
          change: Math.abs(change),
          type: change > 0 ? 'increase' : 'decrease'
        });
      }
    }

    return changes;
  };

  if (!chartData || chartData.visibleMetrics.length === 0) {
    return (
      <Card className={cn("trend-analysis-chart", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <div className="text-muted-foreground mb-2">No trend data available</div>
            <div className="text-sm text-muted-foreground">
              Select metrics to display or adjust the time period
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("trend-analysis-chart", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {timePeriods.find(p => p.value === selectedTimePeriod)?.label}
          </Badge>
        </div>

        {showControls && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Time Period Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Period:</span>
              <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Moving Average Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className="h-8 px-2"
            >
              <Activity className="h-3 w-3 mr-1" />
              Moving Avg
            </Button>

            {/* Metric Toggles */}
            <div className="flex flex-wrap gap-1">
              {availableMetrics.map(metric => {
                const config = metricConfigs[metric];
                if (!config) return null;

                return (
                  <Button
                    key={metric}
                    variant={config.visible ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMetricVisibility(metric)}
                    className="h-7 px-2 text-xs"
                    style={config.visible ? { backgroundColor: config.color, borderColor: config.color } : undefined}
                  >
                    {config.visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Simple SVG Chart */}
        <div className="relative" style={{ height }}>
          <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="80" height="30" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="800" height="300" fill="url(#grid)" />

            {/* Render trend lines for each visible metric */}
            {chartData.visibleMetrics.map(metric => {
              const config = metricConfigs[metric];
              const data = trendsByMetric[metric] || [];
              const range = chartData.metricRanges[metric];

              if (!config || !range || data.length === 0) return null;

              const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              // Calculate points for the line
              const points = sortedData.map((point, index) => {
                const x = (index / (sortedData.length - 1)) * 800;
                const y = 300 - ((point.metric_value - range.min) / (range.max - range.min || 1)) * 300;
                return `${x},${y}`;
              }).join(' ');

              // Calculate moving average if enabled
              const movingAvgPoints = showMovingAverage ? calculateMovingAverage(sortedData).map((point, index) => {
                const x = (index / (sortedData.length - 1)) * 800;
                const y = 300 - ((point.value - range.min) / (range.max - range.min || 1)) * 300;
                return `${x},${y}`;
              }).join(' ') : '';

              return (
                <g key={metric}>
                  {/* Main trend line */}
                  <polyline
                    fill="none"
                    stroke={config.color}
                    strokeWidth="2"
                    points={points}
                    opacity="0.8"
                  />

                  {/* Moving average line */}
                  {showMovingAverage && movingAvgPoints && (
                    <polyline
                      fill="none"
                      stroke={config.color}
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      points={movingAvgPoints}
                      opacity="0.6"
                    />
                  )}

                  {/* Data points */}
                  {sortedData.map((point, index) => {
                    const x = (index / (sortedData.length - 1)) * 800;
                    const y = 300 - ((point.metric_value - range.min) / (range.max - range.min || 1)) * 300;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={config.color}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
            {chartData.visibleMetrics.map(metric => {
              const config = metricConfigs[metric];
              if (!config) return null;

              const data = trendsByMetric[metric] || [];
              const latestValue = data.length > 0 ? data[data.length - 1]?.metric_value ?? 0 : 0;
              const changes = detectSignificantChanges(data);
              const hasSignificantChange = changes.length > 0;

              return (
                <div key={metric} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="font-medium">{config.label}</span>
                  <span className="text-muted-foreground">
                    {safeToFixed(latestValue, 1)}{config.unit}
                  </span>
                  {hasSignificantChange && (
                    <div className="flex items-center gap-1">
                      {changes[changes.length - 1].type === 'increase' ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">
                        {safeToFixed(changes[changes.length - 1].change, 1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
          {chartData.visibleMetrics.slice(0, 4).map(metric => {
            const config = metricConfigs[metric];
            const data = trendsByMetric[metric] || [];

            if (!config || data.length === 0) return null;

            const values = data.map(d => d?.metric_value).filter(v => typeof v === 'number') as number[];
            if (values.length === 0) return null;

            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);

            return (
              <div key={metric} className="text-center p-2 bg-secondary/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">{config.label}</div>
                <div className="text-sm font-semibold">
                  Avg: {safeToFixed(avg, 1)}{config.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  {safeToFixed(min, 1)} - {safeToFixed(max, 1)}{config.unit}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}