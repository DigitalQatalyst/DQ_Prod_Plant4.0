import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Gauge,
  Power
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformancePanel } from '@/types/performance';
import { safePercentage, safeToFixed } from '@/lib/safeDataAccess';

interface PerformancePanelCardProps {
  panel: PerformancePanel;
  onSelect?: (panel: PerformancePanel) => void;
  onEdit?: (panel: PerformancePanel) => void;
  className?: string;
}

/**
 * Performance Panel Card Component
 * 
 * Displays OEE metrics with visual indicators and transmission-specific metrics.
 * Shows status badges and action buttons for viewing details and editing.
 * 
 * Requirements: 1.2, 1.3, 2.1, 2.2
 */
export function PerformancePanelCard({
  panel,
  onSelect,
  onEdit,
  className
}: PerformancePanelCardProps) {
  // Determine performance status
  const getPerformanceStatus = (oee: number) => {
    if (oee >= 85) return { label: 'High Performance', variant: 'success' as const };
    if (oee >= 70) return { label: 'Normal Performance', variant: 'warning' as const };
    return { label: 'Low Performance', variant: 'destructive' as const };
  };

  const performanceStatus = getPerformanceStatus(panel.oee_percentage || 0);

  return (
    <Card
      className={cn(
        "performance-panel-card hover:bg-accent/5 transition-colors cursor-pointer border-l-4",
        performanceStatus.variant === 'success' ? 'border-l-green-500' :
          performanceStatus.variant === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500',
        className
      )}
      onClick={() => onSelect?.(panel)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{panel.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{panel.panel_type}</p>

            <div className="flex items-center gap-2 mt-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-wider font-bold py-0.5",
                  performanceStatus.variant === 'success' ? 'text-green-600 border-green-200 bg-green-50' :
                    performanceStatus.variant === 'warning' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                      'text-red-600 border-red-200 bg-red-50'
                )}
              >
                {performanceStatus.label}
              </Badge>
              <Badge
                variant={panel.status === 'active' ? 'default' : 'secondary'}
                className="text-[10px] uppercase tracking-wider font-bold py-0.5"
              >
                {panel.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
            <div className="text-right">
              <div className={cn("text-lg font-bold",
                performanceStatus.variant === 'success' ? 'text-green-600' :
                  performanceStatus.variant === 'warning' ? 'text-yellow-600' : 'text-red-600'
              )}>
                {safePercentage(panel.oee_percentage, 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-medium">OEE</div>
            </div>

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(panel);
                }}
                className="h-7 w-7 p-0 -mr-2"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
