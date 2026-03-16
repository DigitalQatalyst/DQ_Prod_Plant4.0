import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, EmptyStates } from "./EmptyState";

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

/**
 * Standardized data table component for consistent table styling across all Optimise features
 * Provides consistent styling, interaction patterns, and empty states
 * 
 * Requirements: 6.1, 6.2, 6.3 - Template reuse and UI consistency
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className,
  emptyState,
  loading = false,
  striped = false,
  hoverable = true,
}: DataTableProps<T>) {
  // Show loading state
  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no data
  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        {emptyState || (
          <EmptyStates.NoData 
            size="sm"
            className="py-8"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <table className="w-full">
        <thead className="bg-secondary/30">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  column.className
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              className={cn(
                "transition-colors duration-200",
                onRowClick && "cursor-pointer",
                hoverable && "hover:bg-secondary/20",
                striped && index % 2 === 1 && "bg-secondary/10"
              )}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-sm",
                    column.className
                  )}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : item[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pre-configured table configurations for common data types
 */
export const TableConfigs = {
  /**
   * Standard configuration for alert/issue tables
   */
  alerts: {
    columns: [
      { key: 'title', label: 'Issue', className: 'font-medium' },
      { key: 'category', label: 'Category', className: 'text-muted-foreground' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'assignee', label: 'Assignee', className: 'text-muted-foreground' },
      { key: 'createdAt', label: 'Created', className: 'text-muted-foreground' },
    ] as Column[],
  },

  /**
   * Standard configuration for action/task tables
   */
  actions: {
    columns: [
      { key: 'title', label: 'Action', className: 'font-medium' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignee', label: 'Assignee', className: 'text-muted-foreground' },
      { key: 'dueDate', label: 'Due Date', className: 'text-muted-foreground' },
      { key: 'status', label: 'Status' },
    ] as Column[],
  },

  /**
   * Standard configuration for performance/metrics tables
   */
  performance: {
    columns: [
      { key: 'asset', label: 'Asset', className: 'font-medium' },
      { key: 'site', label: 'Site', className: 'text-muted-foreground' },
      { key: 'oee', label: 'OEE', className: 'font-semibold' },
      { key: 'availability', label: 'Availability', className: 'text-muted-foreground' },
      { key: 'performance', label: 'Performance', className: 'text-muted-foreground' },
      { key: 'quality', label: 'Quality', className: 'text-muted-foreground' },
      { key: 'lastUpdated', label: 'Last Updated', className: 'text-muted-foreground' },
    ] as Column[],
  },

  /**
   * Standard configuration for project tables
   */
  projects: {
    columns: [
      { key: 'title', label: 'Project', className: 'font-medium' },
      { key: 'stage', label: 'Stage' },
      { key: 'priority', label: 'Priority' },
      { key: 'owner', label: 'Owner', className: 'text-muted-foreground' },
      { key: 'targetKPI', label: 'Target KPI', className: 'text-muted-foreground' },
      { key: 'targetImprovement', label: 'Improvement', className: 'font-semibold text-success' },
    ] as Column[],
  },

  /**
   * Standard configuration for SIM board tables
   */
  simBoards: {
    columns: [
      { key: 'name', label: 'Board Name', className: 'font-medium' },
      { key: 'shift', label: 'Shift', className: 'text-muted-foreground' },
      { key: 'date', label: 'Date', className: 'text-muted-foreground' },
      { key: 'status', label: 'Status' },
    ] as Column[],
  },

  /**
   * Standard configuration for event/timeline tables
   */
  events: {
    columns: [
      { key: 'time', label: 'Time', className: 'font-medium' },
      { key: 'type', label: 'Type', className: 'text-muted-foreground capitalize' },
      { key: 'description', label: 'Description' },
      { key: 'impact', label: 'Impact' },
      { key: 'status', label: 'Status' },
    ] as Column[],
  },
};