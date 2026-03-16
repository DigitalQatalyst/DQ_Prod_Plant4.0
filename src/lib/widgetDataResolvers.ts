import { Widget, WidgetConfig } from "@/types/dashboard";
import { alerts, incidents } from "@/data/alertData";
import { assetsByTenant, siteSummary } from "@/data/mockData";

/**
 * Error types for widget data resolution
 */
export class WidgetConfigError extends Error {
  constructor(message: string, public widgetId: string, public widgetType: string) {
    super(message);
    this.name = "WidgetConfigError";
  }
}

/**
 * Validate required config properties for a widget
 * Throws WidgetConfigError if validation fails
 */
function validateConfig(
  widget: Widget,
  requiredProps: string[]
): void {
  const missingProps = requiredProps.filter(
    (prop) => widget.config[prop] === undefined
  );

  if (missingProps.length > 0) {
    throw new WidgetConfigError(
      `Missing required config properties: ${missingProps.join(", ")}`,
      widget.id,
      widget.type
    );
  }
}

/**
 * KPI Widget Data Structure
 */
export interface KPIWidgetData {
  value: number;
  label: string;
  unit?: string;
  trend?: string;
  trendLabel?: string;
}

/**
 * Resolve data for KPI widgets
 * KPI widgets display a single numeric value with optional trend indicator
 */
export function resolveKPIWidget(
  widget: Widget,
  tenantId: string
): KPIWidgetData {
  // KPI widgets should have a value in their config or a metricKey to resolve
  const { value, unit, trend, trendLabel, metricKey } = widget.config;

  let resolvedValue = value;

  // If value is not provided, try to resolve via metricKey
  if (resolvedValue === undefined && metricKey) {
    switch (metricKey) {
      case "totalAssets":
        resolvedValue = (assetsByTenant[tenantId] || []).length;
        break;
      case "activeAlerts":
      case "alertCount":
        resolvedValue = alerts.filter(a => a.tenantId === tenantId && (a as any).status !== 'resolved').length;
        break;
      case "energyToday":
        // Mock energy value
        resolvedValue = 12450;
        break;
      case "securityScore":
        resolvedValue = 85;
        break;
      case "systemHealth":
        resolvedValue = 98;
        break;
      default:
        resolvedValue = 0;
    }
  }

  if (resolvedValue === undefined) {
    throw new WidgetConfigError(
      "KPI widget requires 'value' or 'metricKey' in config",
      widget.id,
      widget.type
    );
  }

  return {
    value: resolvedValue as number,
    label: widget.title,
    unit: unit as string | undefined,
    trend: trend as string | undefined,
    trendLabel: trendLabel as string | undefined
  };
}


/**
 * Status Board Widget Data Structure
 */
export interface StatusBoardWidgetData {
  categories: Array<{
    label: string;
    count: number;
    status: string;
  }>;
}

/**
 * Resolve data for Status Board widgets
 * Status Board widgets display counts grouped by category (e.g., severity, status)
 */
export function resolveStatusBoardWidget(
  widget: Widget,
  tenantId: string
): StatusBoardWidgetData {
  const { groupBy, statuses, dataSource, showCounts = true } = widget.config;

  // Validate required config
  if (!dataSource) {
    throw new WidgetConfigError(
      "Status Board widget requires 'dataSource' in config",
      widget.id,
      widget.type
    );
  }

  // Get data based on data source and apply tenant filtering
  let data: any[] = [];

  switch (dataSource) {
    case "alerts":
      data = alerts.filter((alert) => alert.tenantId === tenantId);
      break;
    case "assets":
      data = assetsByTenant[tenantId] || [];
      break;
    case "incidents":
      data = incidents.filter((incident) => incident.tenantId === tenantId);
      break;
    case "securityPolicies":
    case "firewallRules":
    case "systemComponents":
      // Mock data for other sources - in real system would fetch from appropriate source
      data = [];
      break;
    default:
      data = [];
  }

  // Group data by the specified field
  const categories: Array<{ label: string; count: number; status: string }> = [];

  if (groupBy === "severity" && dataSource === "alerts") {
    const severities = statuses || ["critical", "warning", "info"];
    severities.forEach((severity) => {
      const count = data.filter((item) => item.severity === severity).length;
      categories.push({
        label: severity.charAt(0).toUpperCase() + severity.slice(1),
        count,
        status: severity
      });
    });
  } else if (groupBy === "status") {
    const statusList = statuses || ["online", "offline", "maintenance", "pending"];
    statusList.forEach((status) => {
      const count = data.filter((item) => item.status === status).length;
      categories.push({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        status
      });
    });
  } else if (groupBy === "featureArea" && dataSource === "alerts") {
    // Group by feature area
    const featureAreas = new Set(data.map((item) => item.featureArea));
    featureAreas.forEach((area) => {
      const count = data.filter((item) => item.featureArea === area).length;
      categories.push({
        label: area.charAt(0).toUpperCase() + area.slice(1),
        count,
        status: area
      });
    });
  } else if (groupBy === "complianceStatus") {
    // Mock compliance data
    const complianceStatuses = statuses || ["compliant", "non-compliant", "pending-review"];
    complianceStatuses.forEach((status) => {
      categories.push({
        label: status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        count: 0, // Mock data
        status
      });
    });
  }

  return { categories };
}

/**
 * List Widget Data Structure
 */
export interface ListWidgetData {
  items: Array<Record<string, any>>;
  columns: string[];
  totalCount: number;
}

/**
 * Resolve data for List widgets
 * List widgets display a scrollable list of items with configurable columns
 */
export function resolveListWidget(
  widget: Widget,
  tenantId: string
): ListWidgetData {
  const { dataSource, filters, displayLimit, columns, sortBy, sortOrder } = widget.config;

  // Validate required config
  if (!dataSource) {
    throw new WidgetConfigError(
      "List widget requires 'dataSource' in config",
      widget.id,
      widget.type
    );
  }

  if (!columns || !Array.isArray(columns)) {
    throw new WidgetConfigError(
      "List widget requires 'columns' array in config",
      widget.id,
      widget.type
    );
  }

  // Get data based on data source and apply tenant filtering
  let data: any[] = [];

  switch (dataSource) {
    case "alerts":
      data = alerts.filter((alert) => alert.tenantId === tenantId);
      break;
    case "assets":
      data = assetsByTenant[tenantId] || [];
      break;
    case "incidents":
      data = incidents.filter((incident) => incident.tenantId === tenantId);
      break;
    case "systemEvents":
    case "accessLogs":
    case "maintenanceSchedule":
    case "threats":
    case "dataStreams":
      // Mock data for other sources
      data = [];
      break;
    default:
      data = [];
  }

  // Apply filters if specified
  if (filters) {
    data = data.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          if (!value.includes(item[key])) {
            return false;
          }
        } else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Sort if specified
  if (sortBy) {
    data = [...data].sort((a, b) => {
      const aVal = a[sortBy as string];
      const bVal = b[sortBy as string];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === "asc" ? comparison : -comparison;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      // For dates
      if (sortBy === "createdAt" || sortBy === "updatedAt" || sortBy === "lastSeen") {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }

      return 0;
    });
  }

  const totalCount = data.length;

  // Apply display limit
  if (displayLimit && displayLimit > 0) {
    data = data.slice(0, displayLimit);
  }

  return {
    items: data,
    columns: columns as string[],
    totalCount
  };
}

/**
 * Table Widget Data Structure
 */
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
}

export interface TableWidgetData {
  rows: Array<Record<string, any>>;
  columns: TableColumn[];
  defaultSort?: { column: string; order: "asc" | "desc" };
}

/**
 * Resolve data for Table widgets
 * Table widgets display tabular data with sortable columns
 */
export function resolveTableWidget(
  widget: Widget,
  tenantId: string
): TableWidgetData {
  const { dataSource, columns, defaultSort, displayLimit } = widget.config;

  // Validate required config
  if (!dataSource) {
    throw new WidgetConfigError(
      "Table widget requires 'dataSource' in config",
      widget.id,
      widget.type
    );
  }

  if (!columns || !Array.isArray(columns)) {
    throw new WidgetConfigError(
      "Table widget requires 'columns' array in config",
      widget.id,
      widget.type
    );
  }

  // Get data based on data source and apply tenant filtering
  let data: any[] = [];

  switch (dataSource) {
    case "siteConnectivity": {
      // Mock site connectivity data based on tenant
      const sites = siteSummary[tenantId] || [];
      data = sites.map((site) => ({
        site: site.site,
        totalAssets: site.assetCount,
        onlineAssets: site.onlineCount,
        offlineAssets: site.assetCount - site.onlineCount,
        healthPercentage: Math.round((site.onlineCount / site.assetCount) * 100)
      }));
      break;
    }
    case "vulnerabilities":
      // Mock vulnerability data
      data = [
        { category: "Network", critical: 2, high: 5, medium: 12, low: 8 },
        { category: "Application", critical: 1, high: 3, medium: 7, low: 15 },
        { category: "System", critical: 0, high: 2, medium: 5, low: 10 }
      ];
      break;
    case "assetPerformance":
      // Mock asset performance data
      data = [
        { assetType: "Transformer", count: 12, avgUptime: 99.2, avgEfficiency: 94.5 },
        { assetType: "Generator", count: 5, avgUptime: 97.8, avgEfficiency: 89.3 },
        { assetType: "Meter", count: 145, avgUptime: 99.9, avgEfficiency: 98.1 }
      ];
      break;
    case "energyConsumption": {
      // Mock energy consumption data
      const siteList = siteSummary[tenantId] || [];
      data = siteList.map((site) => ({
        site: site.site,
        today: Math.round(Math.random() * 5000 + 1000),
        yesterday: Math.round(Math.random() * 5000 + 1000),
        change: (Math.random() * 20 - 10).toFixed(1)
      }));
      break;
    }
    case "authLogs":
      // Mock authentication logs
      data = [];
      break;
    default:
      data = [];
  }

  // Apply display limit
  if (displayLimit && displayLimit > 0) {
    data = data.slice(0, displayLimit);
  }

  return {
    rows: data,
    columns: columns as TableColumn[],
    defaultSort: defaultSort as { column: string; order: "asc" | "desc" } | undefined
  };
}

/**
 * Main widget data resolver
 * Routes to type-specific resolvers based on widget type
 * Applies tenant context filtering to all data queries
 */
export function getWidgetData(
  widget: Widget,
  tenantId: string
): KPIWidgetData | StatusBoardWidgetData | ListWidgetData | TableWidgetData | null {
  try {
    switch (widget.type) {
      case "kpi":
        return resolveKPIWidget(widget, tenantId);
      case "statusBoard":
        return resolveStatusBoardWidget(widget, tenantId);
      case "list":
        return resolveListWidget(widget, tenantId);
      case "table":
        return resolveTableWidget(widget, tenantId);
      case "timeseries":
      case "custom":
        // Not implemented yet - return null for now
        return null;
      default:
        throw new WidgetConfigError(
          `Unknown widget type: ${widget.type}`,
          widget.id,
          widget.type
        );
    }
  } catch (error) {
    // Re-throw WidgetConfigError as-is
    if (error instanceof WidgetConfigError) {
      throw error;
    }
    // Wrap other errors
    throw new WidgetConfigError(
      `Error resolving widget data: ${error instanceof Error ? error.message : String(error)}`,
      widget.id,
      widget.type
    );
  }
}
