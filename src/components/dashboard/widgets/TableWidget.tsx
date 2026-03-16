import React, { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Widget } from "@/types/dashboard";
import { BaseWidget, createWidgetError, createWidgetEmpty, BaseWidgetProps } from "./BaseWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { getWidgetData, TableWidgetData, WidgetConfigError } from "@/lib/widgetDataResolvers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableWidgetProps extends BaseWidgetProps {
  tenantId: string;
}

/**
 * Table Widget Component
 * Displays tabular data with sortable columns
 * 
 * Requirements: 7.2, 12.4, 14.4
 */
function TableWidgetInternal({ widget, tenantId, onAction, className }: TableWidgetProps) {
  // State for sorting - must be at the top before any conditional returns
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch widget data
  let data: TableWidgetData | null = null;
  let error = null;

  try {
    const result = getWidgetData(widget, tenantId);
    if (result && 'rows' in result && 'columns' in result) {
      data = result as TableWidgetData;
    }
  } catch (err) {
    if (err instanceof WidgetConfigError) {
      error = createWidgetError("config_error", err.message);
    } else {
      error = createWidgetError("data_error", err instanceof Error ? err.message : "Failed to load widget data");
    }
  }

  // Initialize sort state after data is available
  React.useEffect(() => {
    if (data?.defaultSort) {
      setSortColumn(data.defaultSort.column);
      setSortOrder(data.defaultSort.order);
    }
  }, [data]);

  // Handle error state
  if (error) {
    return <BaseWidget widget={widget} error={error} onAction={onAction} className={className} />;
  }

  // Handle empty state
  if (!data || data.rows.length === 0) {
    return (
      <BaseWidget
        widget={widget}
        empty={createWidgetEmpty("No data available", "The table is currently empty")}
        onAction={onAction}
        className={className}
      />
    );
  }

  // Handle column sort
  const handleSort = (columnKey: string, sortable: boolean) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      // Toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(columnKey);
      setSortOrder("asc");
    }
  };

  // Sort rows based on current sort state
  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === "asc" ? comparison : -comparison;
      }

      // Number comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Default comparison
      return sortOrder === "asc" 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data.rows, sortColumn, sortOrder]);

  // Format cell value for display
  const formatCellValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    // Handle numbers with formatting
    if (typeof value === "number") {
      // Check if it's a percentage or decimal
      if (value < 1 && value > 0) {
        return value.toFixed(2);
      }
      return value.toLocaleString();
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string, sortable: boolean) => {
    if (!sortable) return null;

    if (sortColumn === columnKey) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }

    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  // Render table content
  return (
    <BaseWidget widget={widget} onAction={onAction} className={className}>
      <div className="rounded-md border">
        <Table aria-label={`${widget.title} data table`}>
          <TableHeader>
            <TableRow>
              {data.columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.key, column.sortable)}
                      aria-label={`Sort by ${column.label}${sortColumn === column.key ? `, currently sorted ${sortOrder === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                    >
                      <span>{column.label}</span>
                      {renderSortIcon(column.key, column.sortable)}
                    </Button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {data.columns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(row[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Row count info */}
      <div className="mt-4 pt-4 border-t" role="status">
        <p className="text-xs text-muted-foreground text-center">
          {sortedRows.length} {sortedRows.length === 1 ? "row" : "rows"}
        </p>
      </div>
    </BaseWidget>
  );
}

/**
 * Table Widget wrapped in error boundary
 */
export function TableWidget(props: TableWidgetProps) {
  return (
    <WidgetErrorBoundary widgetId={props.widget.id} widgetTitle={props.widget.title}>
      <TableWidgetInternal {...props} />
    </WidgetErrorBoundary>
  );
}
