import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, 
  Clock, 
  RotateCcw, 
  Zap,
  AlertTriangle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceLoss } from '@/types/performance';
import { isNonEmptyArray, safeReduce, safeToFixed } from '@/lib/safeDataAccess';

interface LossAnalysisCardProps {
  losses: PerformanceLoss[];
  timePeriod?: 'day' | 'week' | 'month' | 'year';
  className?: string;
}

interface LossAggregation {
  category: string;
  totalDuration: number;
  totalFrequency: number;
  totalImpact: number;
  averageImpact: number;
  losses: PerformanceLoss[];
}

/**
 * Loss Analysis Card Component
 * 
 * Displays loss categories with duration, frequency, and impact.
 * Adds visual indicators for loss severity and type.
 * Shows aggregated totals by category and time period.
 * 
 * Requirements: 3.1, 3.2, 3.5
 */
export function LossAnalysisCard({
  losses,
  timePeriod = 'week',
  className
}: LossAnalysisCardProps) {
  
  // Aggregate losses by category
  const aggregateLossesByCategory = (losses: PerformanceLoss[]): LossAggregation[] => {
    // Early return with empty array if losses is not a valid array
    if (!isNonEmptyArray(losses)) {
      return [];
    }

    const categoryMap = new Map<string, LossAggregation>();

    losses.forEach(loss => {
      // Skip if loss is invalid or missing required properties
      if (!loss || !loss.loss_category) {
        return;
      }

      const category = loss.loss_category;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalDuration: 0,
          totalFrequency: 0,
          totalImpact: 0,
          averageImpact: 0,
          losses: []
        });
      }

      const aggregation = categoryMap.get(category)!;
      aggregation.totalDuration += loss.duration_minutes || 0;
      aggregation.totalFrequency += loss.frequency_count || 0;
      aggregation.totalImpact += loss.impact_percentage || 0;
      aggregation.losses.push(loss);
    });

    // Calculate averages
    categoryMap.forEach(aggregation => {
      aggregation.averageImpact = aggregation.losses.length > 0 
        ? aggregation.totalImpact / aggregation.losses.length 
        : 0;
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.totalImpact - a.totalImpact);
  };

  // Get category display info
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'technical':
        return {
          label: 'Technical Losses',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: Zap,
          description: 'Equipment and system failures'
        };
      case 'non_technical':
        return {
          label: 'Non-Technical Losses',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: AlertTriangle,
          description: 'Operational and procedural issues'
        };
      case 'measurement_error':
        return {
          label: 'Measurement Errors',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: BarChart3,
          description: 'Instrumentation and data quality issues'
        };
      default:
        return {
          label: 'Other Losses',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: TrendingDown,
          description: 'Unclassified losses'
        };
    }
  };

  // Get severity level based on impact
  const getSeverityLevel = (impact: number) => {
    if (impact >= 10) return { level: 'Critical', color: 'text-red-600', variant: 'destructive' as const };
    if (impact >= 5) return { level: 'High', color: 'text-orange-600', variant: 'warning' as const };
    if (impact >= 2) return { level: 'Medium', color: 'text-yellow-600', variant: 'secondary' as const };
    return { level: 'Low', color: 'text-green-600', variant: 'default' as const };
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Format time period label
  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'Current Period';
    }
  };

  const aggregatedLosses = aggregateLossesByCategory(losses);
  
  // Use safe operations for calculations with fallback to 0
  const totalLosses = isNonEmptyArray(losses) ? losses.length : 0;
  const totalDuration = safeReduce<PerformanceLoss, number>(
    losses,
    (sum, loss) => sum + (loss?.duration_minutes || 0),
    0
  );
  const totalImpact = safeReduce<PerformanceLoss, number>(
    losses,
    (sum, loss) => sum + (loss?.impact_percentage || 0),
    0
  );
  const averageImpact = totalLosses > 0 ? totalImpact / totalLosses : 0;

  return (
    <Card className={cn("loss-analysis-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Loss Analysis
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {getTimePeriodLabel(timePeriod)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Events</div>
            <div className="text-lg font-bold">{totalLosses}</div>
          </div>
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Duration</div>
            <div className="text-lg font-bold">{formatDuration(totalDuration)}</div>
          </div>
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Impact</div>
            <div className="text-lg font-bold text-red-600">{safeToFixed(totalImpact, 1)}%</div>
          </div>
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg Impact</div>
            <div className="text-lg font-bold">{safeToFixed(averageImpact, 1)}%</div>
          </div>
        </div>

        {/* Loss Categories */}
        {aggregatedLosses.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Loss Categories</div>
            {aggregatedLosses.map((aggregation) => {
              const categoryInfo = getCategoryInfo(aggregation.category);
              const severity = getSeverityLevel(aggregation.averageImpact);
              const Icon = categoryInfo.icon;

              return (
                <div
                  key={aggregation.category}
                  className={cn(
                    "p-4 rounded-lg border-l-4",
                    categoryInfo.bgColor,
                    categoryInfo.borderColor
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", categoryInfo.color)} />
                      <div>
                        <div className="font-medium">{categoryInfo.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {categoryInfo.description}
                        </div>
                      </div>
                    </div>
                    <Badge variant={severity.variant} className="text-xs">
                      {severity.level}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                        <div className="font-semibold">{formatDuration(aggregation.totalDuration)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Frequency</div>
                        <div className="font-semibold">{aggregation.totalFrequency} events</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                        <div className={cn("font-semibold", severity.color)}>
                          {safeToFixed(aggregation.averageImpact, 1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Impact Level</span>
                      <span className={severity.color}>{safeToFixed(aggregation.averageImpact, 1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(aggregation.averageImpact, 100)} 
                      className="h-2"
                    />
                  </div>

                  {/* Recent Loss Types */}
                  {aggregation.losses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-2">Recent Loss Types:</div>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(aggregation.losses.slice(0, 3).map(l => l.loss_type))].map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                        {aggregation.losses.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{aggregation.losses.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <div className="text-muted-foreground mb-2">No losses recorded</div>
            <div className="text-sm text-muted-foreground">
              No transmission losses found for {getTimePeriodLabel(timePeriod).toLowerCase()}
            </div>
          </div>
        )}

        {/* Loss Distribution Chart (Simple) */}
        {aggregatedLosses.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Impact Distribution</div>
            <div className="space-y-2">
              {aggregatedLosses.map((aggregation) => {
                const categoryInfo = getCategoryInfo(aggregation.category);
                const percentage = totalImpact > 0 ? (aggregation.totalImpact / totalImpact) * 100 : 0;
                
                return (
                  <div key={aggregation.category} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-muted-foreground">
                      {categoryInfo.label.split(' ')[0]}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                    <div className="w-12 text-xs text-right font-medium">
                      {safeToFixed(percentage, 0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}