import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import {
  Activity,
  Zap,
  AlertTriangle,
  TrendingDown,
  Gauge,
  Shield,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformancePanel, PerformanceTrend } from '@/types/performance';
import { safePercentage, safeToFixed, safeNumber } from '@/lib/safeDataAccess';

interface PerformanceMetricsDashboardProps {
  panels: PerformancePanel[];
  trends: PerformanceTrend[];
  className?: string;
}

/**
 * Performance Metrics Dashboard Component
 * 
 * Displays KPI summary tiles (Average OEE, System Availability, Active Constraints, Total Losses).
 * Adds trend charts for OEE and loss trends with responsive grid layout.
 * 
 * Requirements: 1.2, 6.1, 6.2
 */
export function PerformanceMetricsDashboard({
  panels,
  trends,
  className
}: PerformanceMetricsDashboardProps) {

  // Calculate aggregate metrics from panels
  const calculateAverageOEE = (panels: PerformancePanel[]): number => {
    if (panels.length === 0) return 0;
    const total = panels.reduce((sum, panel) => sum + (panel.oee_percentage || 0), 0);
    return total / panels.length;
  };

  const calculateSystemAvailability = (panels: PerformancePanel[]): number => {
    if (panels.length === 0) return 0;
    const total = panels.reduce((sum, panel) => sum + (panel.availability_percentage || 0), 0);
    return total / panels.length;
  };

  const countActiveConstraints = (panels: PerformancePanel[]): number => {
    return panels.filter(panel =>
      (panel.line_loading && panel.line_loading > 80) ||
      (panel.transformer_loading && panel.transformer_loading > 80)
    ).length;
  };

  const calculateTotalLosses = (panels: PerformancePanel[]): number => {
    return panels.reduce((sum, panel) =>
      sum + (panel.transmission_losses || 0), 0
    );
  };

  // Calculate trend metrics
  const getOEETrend = (trends: PerformanceTrend[]): { value: string; direction: 'up' | 'down' | 'neutral' } => {
    if (!trends || !Array.isArray(trends) || trends.length === 0) return { value: '0%', direction: 'neutral' };

    const oeeTrends = trends.filter(t => t.metric_name === 'oee').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (oeeTrends.length < 2) return { value: '0%', direction: 'neutral' };

    const latest = oeeTrends[oeeTrends.length - 1];
    const previous = oeeTrends[oeeTrends.length - 2];
    const change = ((latest.metric_value - previous.metric_value) / previous.metric_value) * 100;

    return {
      value: safePercentage(Math.abs(change), 1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const getLossTrend = (trends: PerformanceTrend[]): { value: string; direction: 'up' | 'down' | 'neutral' } => {
    if (!trends || !Array.isArray(trends) || trends.length === 0) return { value: '0%', direction: 'neutral' };

    const lossTrends = trends.filter(t => t.metric_name === 'losses').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (lossTrends.length < 2) return { value: '0%', direction: 'neutral' };

    const latest = lossTrends[lossTrends.length - 1];
    const previous = lossTrends[lossTrends.length - 2];
    const change = ((latest.metric_value - previous.metric_value) / previous.metric_value) * 100;

    return {
      value: safePercentage(Math.abs(change), 1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  // Simple trend chart component
  const TrendChart: React.FC<{
    title: string;
    data: PerformanceTrend[];
    timeRange: string;
    color?: string;
  }> = ({ title, data, timeRange, color = 'primary' }) => {
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate simple trend line points
    const maxValue = Math.max(...sortedData.map(d => d.metric_value));
    const minValue = Math.min(...sortedData.map(d => d.metric_value));
    const range = maxValue - minValue || 1;

    const points = sortedData.map((point, index) => {
      const x = (index / (sortedData.length - 1)) * 100;
      const y = 100 - ((point.metric_value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-xs text-muted-foreground">Last {timeRange}</div>
        </CardHeader>
        <CardContent>
          <div className="h-24 w-full relative">
            {sortedData.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={points}
                  className={cn(
                    color === 'primary' && 'text-primary',
                    color === 'success' && 'text-green-500',
                    color === 'warning' && 'text-yellow-500',
                    color === 'destructive' && 'text-red-500'
                  )}
                />
                {/* Data points */}
                {sortedData.map((point, index) => {
                  const x = (index / (sortedData.length - 1)) * 100;
                  const y = 100 - ((point.metric_value - minValue) / range) * 100;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill="currentColor"
                      className={cn(
                        color === 'primary' && 'text-primary',
                        color === 'success' && 'text-green-500',
                        color === 'warning' && 'text-yellow-500',
                        color === 'destructive' && 'text-red-500'
                      )}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No trend data available
              </div>
            )}
          </div>
          {sortedData.length > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{safeToFixed(minValue, 1)}</span>
              <span>{safeToFixed(maxValue, 1)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculate metrics
  const averageOEE = calculateAverageOEE(panels);
  const systemAvailability = calculateSystemAvailability(panels);
  const activeConstraints = countActiveConstraints(panels);
  const totalLosses = calculateTotalLosses(panels);

  const oeeTrend = getOEETrend(trends);
  const lossTrend = getLossTrend(trends);

  return (
    <div className={cn("performance-dashboard space-y-6", className)}>
      {/* KPI Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Average OEE"
          value={safeToFixed(averageOEE, 1)}
          unit="%"
          icon={Gauge}
          variant={averageOEE >= 85 ? "success" : averageOEE >= 70 ? "warning" : "destructive"}
          trend={oeeTrend.direction}
          trendValue={oeeTrend.value}
        />

        <KPICard
          title="System Availability"
          value={safeToFixed(systemAvailability, 1)}
          unit="%"
          icon={Shield}
          variant={systemAvailability >= 99.5 ? "success" : systemAvailability >= 95 ? "warning" : "destructive"}
        />

        <KPICard
          title="Active Constraints"
          value={activeConstraints}
          unit=""
          icon={AlertTriangle}
          variant={activeConstraints === 0 ? "success" : activeConstraints <= 2 ? "warning" : "destructive"}
        />

        <KPICard
          title="Total Losses"
          value={safeToFixed(totalLosses, 2)}
          unit="MWh"
          icon={TrendingDown}
          variant="destructive"
          trend={lossTrend.direction === 'down' ? 'up' : lossTrend.direction === 'up' ? 'down' : 'neutral'}
          trendValue={lossTrend.value}
        />
      </div>

      {/* Trend Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="OEE Trend"
          data={trends.filter(t => t.metric_name === 'oee')}
          timeRange="7 days"
          color="primary"
        />

        <TrendChart
          title="Loss Trend"
          data={trends.filter(t => t.metric_name === 'losses')}
          timeRange="7 days"
          color="destructive"
        />
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Excellent (≥85%)</span>
                <span className="font-medium text-green-600">
                  {panels.filter(p => p.oee_percentage >= 85).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Good (70-84%)</span>
                <span className="font-medium text-yellow-600">
                  {panels.filter(p => p.oee_percentage >= 70 && p.oee_percentage < 85).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Poor (&lt;70%)</span>
                <span className="font-medium text-red-600">
                  {panels.filter(p => p.oee_percentage < 70).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Loading Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Critical (≥95%)</span>
                <span className="font-medium text-red-600">
                  {panels.filter(p =>
                    (p.line_loading && p.line_loading >= 95) ||
                    (p.transformer_loading && p.transformer_loading >= 95)
                  ).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High (80-94%)</span>
                <span className="font-medium text-yellow-600">
                  {panels.filter(p =>
                    (p.line_loading && p.line_loading >= 80 && p.line_loading < 95) ||
                    (p.transformer_loading && p.transformer_loading >= 80 && p.transformer_loading < 95)
                  ).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Normal (&lt;80%)</span>
                <span className="font-medium text-green-600">
                  {panels.filter(p =>
                    (!p.line_loading || p.line_loading < 80) &&
                    (!p.transformer_loading || p.transformer_loading < 80)
                  ).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-green-600">
                  {panels.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-medium text-yellow-600">
                  {panels.filter(p => p.status === 'maintenance').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inactive</span>
                <span className="font-medium text-red-600">
                  {panels.filter(p => p.status === 'inactive').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}