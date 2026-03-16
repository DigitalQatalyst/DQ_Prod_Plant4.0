import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Thermometer,
  Zap,
  Activity,
  Settings,
  Clock,
  CheckCircle,
  Edit,
  Save,
  X,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceBottleneck } from '@/types/performance';
import { safeToFixed } from '@/lib/safeDataAccess';

interface BottleneckConstraintCardProps {
  bottleneck: PerformanceBottleneck;
  onUpdate?: (bottleneck: PerformanceBottleneck, updates: Partial<PerformanceBottleneck>) => void;
  onResolve?: (bottleneck: PerformanceBottleneck, resolutionNotes: string) => void;
  className?: string;
  editable?: boolean;
}

/**
 * Bottleneck Constraint Card Component
 * 
 * Displays constraint information with severity indicators.
 * Shows affected assets and impact assessment.
 * Adds resolution tracking and status updates.
 * 
 * Requirements: 4.2, 4.3, 4.5
 */
export function BottleneckConstraintCard({
  bottleneck,
  onUpdate,
  onResolve,
  className,
  editable = false
}: BottleneckConstraintCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(bottleneck.resolution_notes || '');

  // Get constraint type info
  const getConstraintTypeInfo = (type: string) => {
    switch (type) {
      case 'thermal':
        return {
          label: 'Thermal Constraint',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: Thermometer,
          description: 'Temperature or thermal loading limits'
        };
      case 'voltage':
        return {
          label: 'Voltage Constraint',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: Zap,
          description: 'Voltage regulation or stability limits'
        };
      case 'stability':
        return {
          label: 'Stability Constraint',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Activity,
          description: 'System stability or dynamic limits'
        };
      case 'operational':
        return {
          label: 'Operational Constraint',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Settings,
          description: 'Operational or procedural limits'
        };
      default:
        return {
          label: 'Other Constraint',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: AlertTriangle,
          description: 'Unclassified constraint'
        };
    }
  };

  // Get severity info
  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          label: 'High',
          color: 'text-red-600',
          variant: 'destructive' as const,
          bgColor: 'bg-red-100',
          priority: 3
        };
      case 'medium':
        return {
          label: 'Medium',
          color: 'text-yellow-600',
          variant: 'warning' as const,
          bgColor: 'bg-yellow-100',
          priority: 2
        };
      case 'low':
        return {
          label: 'Low',
          color: 'text-green-600',
          variant: 'secondary' as const,
          bgColor: 'bg-green-100',
          priority: 1
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600',
          variant: 'outline' as const,
          bgColor: 'bg-gray-100',
          priority: 0
        };
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'text-red-600',
          variant: 'destructive' as const,
          icon: AlertTriangle
        };
      case 'monitoring':
        return {
          label: 'Monitoring',
          color: 'text-yellow-600',
          variant: 'warning' as const,
          icon: BarChart3
        };
      case 'resolved':
        return {
          label: 'Resolved',
          color: 'text-green-600',
          variant: 'default' as const,
          icon: CheckCircle
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600',
          variant: 'outline' as const,
          icon: AlertTriangle
        };
    }
  };

  // Calculate loading percentage if not provided
  const calculateLoadingPercentage = () => {
    if (bottleneck.loading_percentage) return bottleneck.loading_percentage;
    if (bottleneck.current_loading_mw && bottleneck.capacity_limit_mw && bottleneck.capacity_limit_mw > 0) {
      return (bottleneck.current_loading_mw / bottleneck.capacity_limit_mw) * 100;
    }
    return null;
  };

  // Format duration
  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Handle resolution
  const handleResolve = () => {
    if (onResolve && resolutionNotes.trim()) {
      onResolve(bottleneck, resolutionNotes.trim());
      setIsEditing(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: 'active' | 'monitoring' | 'resolved') => {
    if (onUpdate) {
      const updates: Partial<PerformanceBottleneck> = { status: newStatus };
      if (newStatus === 'resolved' && !bottleneck.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
      onUpdate(bottleneck, updates);
    }
  };

  const constraintInfo = getConstraintTypeInfo(bottleneck.constraint_type);
  const severityInfo = getSeverityInfo(bottleneck.severity);
  const statusInfo = getStatusInfo(bottleneck.status);
  const loadingPercentage = calculateLoadingPercentage();
  const Icon = constraintInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={cn("bottleneck-constraint-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", constraintInfo.color)} />
            <div>
              <CardTitle className="text-lg font-semibold">
                {constraintInfo.label}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {constraintInfo.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={severityInfo.variant}>
              {severityInfo.label} Priority
            </Badge>
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Constraint Description */}
        <div className={cn(
          "p-3 rounded-lg border-l-4",
          constraintInfo.bgColor,
          constraintInfo.borderColor
        )}>
          <div className="font-medium mb-1">Description</div>
          <div className="text-sm text-muted-foreground">
            {bottleneck.description ?? 'No description available'}
          </div>
        </div>

        {/* Constraint Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bottleneck.capacity_limit_mw && (
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Capacity Limit</div>
              <div className="text-lg font-bold">{safeToFixed(bottleneck.capacity_limit_mw, 0)} MW</div>
            </div>
          )}

          {bottleneck.current_loading_mw && (
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Current Loading</div>
              <div className="text-lg font-bold">{safeToFixed(bottleneck.current_loading_mw, 0)} MW</div>
            </div>
          )}

          {loadingPercentage && (
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Loading %</div>
              <div className={cn(
                "text-lg font-bold",
                loadingPercentage >= 95 ? 'text-red-600' :
                  loadingPercentage >= 80 ? 'text-yellow-600' : 'text-green-600'
              )}>
                {safeToFixed(loadingPercentage, 1)}%
              </div>
            </div>
          )}

          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Duration</div>
            <div className="text-lg font-bold">{formatDuration(bottleneck.constraint_hours ?? 0)}</div>
          </div>
        </div>

        {/* Loading Progress Bar */}
        {(loadingPercentage !== null && loadingPercentage !== undefined) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loading Level</span>
              <span className={cn(
                "font-medium",
                (loadingPercentage ?? 0) >= 95 ? 'text-red-600' :
                  (loadingPercentage ?? 0) >= 80 ? 'text-yellow-600' : 'text-green-600'
              )}>
                {safeToFixed(loadingPercentage, 1)}%
              </span>
            </div>
            <Progress
              value={Math.min(loadingPercentage, 100)}
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-yellow-600">80%</span>
              <span className="text-red-600">95%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Impact Assessment */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Impact Assessment</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Severity Level</div>
                <div className={cn("font-semibold", severityInfo.color)}>
                  {severityInfo.label} Priority
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Active Since</div>
                <div className="font-semibold">
                  {new Date(bottleneck.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Section */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Resolution Tracking</div>
            {editable && bottleneck.status !== 'resolved' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? 'Cancel' : 'Update'}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Resolution Notes
                </label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter resolution notes or progress updates..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleResolve}
                  disabled={!resolutionNotes.trim()}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Notes
                </Button>

                {bottleneck.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('monitoring')}
                  >
                    Set to Monitoring
                  </Button>
                )}

                {bottleneck.status !== 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={!resolutionNotes.trim()}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {bottleneck.resolution_notes ? (
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Resolution Notes</div>
                  <div className="text-sm">{bottleneck.resolution_notes}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No resolution notes available
                </div>
              )}

              {bottleneck.resolved_at && (
                <div className="text-xs text-muted-foreground">
                  Resolved on: {new Date(bottleneck.resolved_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Actions */}
        {editable && !isEditing && bottleneck.status !== 'resolved' && (
          <div className="flex gap-2 pt-2 border-t">
            {bottleneck.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('monitoring')}
                className="flex-1"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Set to Monitoring
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve Constraint
            </Button>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Created: {new Date(bottleneck.created_at).toLocaleString()} •
          Last updated: {new Date(bottleneck.updated_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}