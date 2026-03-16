import React, { useState } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformancePanel } from '@/types/performance';
import { safePercentage } from '@/lib/safeDataAccess';

interface PerformanceTableProps {
  panels: PerformancePanel[];
  onRowClick?: (panel: PerformancePanel) => void;
  onEdit?: (panel: PerformancePanel) => void;
  onExport?: (selectedPanels: PerformancePanel[]) => void;
  onCreateCIProject?: (selectedPanels: PerformancePanel[]) => void;
  loading?: boolean;
  className?: string;
}

/**
 * Performance Table Component
 * 
 * Displays performance panels in sortable, paginated table.
 * Adds bulk action support (export, create CI project).
 * Implements column customization and responsive design.
 * 
 * Requirements: 1.1, 1.6, 8.1, 10.3
 */
export function PerformanceTable({
  panels,
  onRowClick,
  onEdit,
  onExport,
  onCreateCIProject,
  loading = false,
  className
}: PerformanceTableProps) {
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PerformancePanel;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Handle row selection
  const handleSelectPanel = (panelId: string, checked: boolean) => {
    setSelectedPanels(prev =>
      checked
        ? [...prev, panelId]
        : prev.filter(id => id !== panelId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedPanels(checked ? panels.map(p => p.id) : []);
  };

  // Handle sorting
  const handleSort = (key: keyof PerformancePanel) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort panels
  const sortedPanels = React.useMemo(() => {
    if (!sortConfig) return panels;

    return [...panels].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [panels, sortConfig]);

  // Get selected panel objects
  const selectedPanelObjects = panels.filter(p => selectedPanels.includes(p.id));

  // Helper functions
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return 'text-green-600';
    if (oee >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value?: number | null) => {
    return (value !== undefined && value !== null) ? safePercentage(value, 1) : 'N/A';
  };

  // Sortable header component
  const SortableHeader: React.FC<{
    label: string;
    sortKey: keyof PerformancePanel;
    className?: string;
  }> = ({ label, sortKey, className }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors",
        className
      )}
    >
      {label}
      {sortConfig?.key === sortKey ? (
        sortConfig.direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  // Define table columns
  const columns: Column<PerformancePanel>[] = [
    {
      key: 'select',
      label: '',
      width: '40px',
      render: (_, panel) => (
        <Checkbox
          checked={selectedPanels.includes(panel.id)}
          onCheckedChange={(checked) => handleSelectPanel(panel.id, !!checked)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      key: 'name',
      label: 'Panel Name',
      className: 'font-medium',
      render: (value, panel) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground">
            {panel.panel_type} • {panel.site_id ? 'Site Level' : 'System Level'}
          </div>
        </div>
      )
    },
    {
      key: 'oee_percentage',
      label: 'OEE',
      render: (value, panel) => (
        <div className="space-y-1">
          <div className={cn("font-semibold", getOEEColor(value))}>
            {formatPercentage(value)}
          </div>
          <Progress value={value} className="h-1 w-16" />
        </div>
      )
    },
    {
      key: 'availability_percentage',
      label: 'Availability',
      render: (value) => (
        <span className="text-muted-foreground">
          {formatPercentage(value)}
        </span>
      )
    },
    {
      key: 'performance_percentage',
      label: 'Performance',
      render: (value) => (
        <span className="text-muted-foreground">
          {formatPercentage(value)}
        </span>
      )
    },
    {
      key: 'quality_percentage',
      label: 'Quality',
      render: (value) => (
        <span className="text-muted-foreground">
          {formatPercentage(value)}
        </span>
      )
    },
    {
      key: 'line_loading',
      label: 'Loading',
      render: (value, panel) => {
        const loading = value || panel.transformer_loading;
        if (!loading) return <span className="text-muted-foreground">N/A</span>;

        const color = loading >= 95 ? 'text-red-600' :
          loading >= 80 ? 'text-yellow-600' : 'text-green-600';

        return (
          <span className={cn("font-medium", color)}>
            {formatPercentage(loading)}
          </span>
        );
      }
    },
    {
      key: 'transmission_losses',
      label: 'Losses',
      render: (value) => (
        <span className={cn(
          "font-medium",
          value && value > 5 ? 'text-red-600' :
            value && value > 2 ? 'text-yellow-600' : 'text-green-600'
        )}>
          {formatPercentage(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      className: 'text-muted-foreground',
      render: (value) => (
        <span className="text-xs">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (_, panel) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRowClick?.(panel)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(panel)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport?.([panel])}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            {onCreateCIProject && (
              <DropdownMenuItem onClick={() => onCreateCIProject([panel])}>
                <Plus className="h-4 w-4 mr-2" />
                Create CI Project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Update column headers to be sortable where appropriate
  const sortableColumns = columns.map(col => {
    if (['name', 'oee_percentage', 'availability_percentage', 'performance_percentage', 'quality_percentage', 'last_updated'].includes(col.key)) {
      return {
        ...col,
        label: (
          <SortableHeader
            label={typeof col.label === 'string' ? col.label : col.key}
            sortKey={col.key as keyof PerformancePanel}
          />
        )
      };
    }
    return col;
  });

  return (
    <div className={cn("performance-table space-y-4", className)}>
      {/* Bulk Actions Bar */}
      {selectedPanels.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedPanels.length === panels.length}
              indeterminate={selectedPanels.length > 0 && selectedPanels.length < panels.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedPanels.length} of {panels.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(selectedPanelObjects)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedPanels.length})
              </Button>
            )}

            {onCreateCIProject && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onCreateCIProject(selectedPanelObjects)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create CI Project
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPanels([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={sortableColumns}
        data={sortedPanels}
        onRowClick={onRowClick}
        loading={loading}
        className="performance-data-table"
        emptyState={
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">No performance panels found</div>
            <div className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new performance panel
            </div>
          </div>
        }
      />

      {/* Table Footer with Summary */}
      {panels.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <div>
            Showing {sortedPanels.length} performance panels
          </div>
          <div className="flex items-center gap-4">
            <span>
              Avg OEE: {safePercentage(panels.reduce((sum, p) => sum + (p.oee_percentage || 0), 0) / panels.length, 1)}
            </span>
            <span>
              Active: {panels.filter(p => p.status === 'active').length}
            </span>
            <span>
              Constraints: {panels.filter(p =>
                (p.line_loading && p.line_loading > 80) ||
                (p.transformer_loading && p.transformer_loading > 80)
              ).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}