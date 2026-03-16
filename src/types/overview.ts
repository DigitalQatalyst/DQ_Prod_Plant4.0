// Re-export types from dashboard-alert-system
export type { Alert, AlertSeverity, AlertStatus } from "./alert";
export type { Dashboard, Widget, WidgetType, WidgetConfig, DashboardScope } from "./dashboard";
export type { FeatureAreaId } from "./dashboard";

// Overview-specific types
export type Severity = "critical" | "warning" | "info";
export type TriageState = "new" | "acknowledged" | "in-progress" | "resolved";
export type WorkItemType = "task" | "maintenance" | "investigation" | "planning" | "topology" | "admin" | "reporting" | "config" | "compliance" | "security" | "data_quality" | "meeting" | "test";
export type WorkItemStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ExceptionStatus = "new" | "investigating" | "resolved" | "archived";

export interface OverviewDashboard {
  id: string;
  tenantId: string;
  name: string;
  presetType?: string;
  isDefault: boolean;
  scopeDefaults?: Record<string, any>;
  createdAt: string;
}

export interface DashboardWidgetPlacement {
  id: string;
  dashboardId: string;
  widgetId: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, any>;
}

export interface OverviewException {
  id: string;
  tenantId: string;
  exceptionType: string;
  severity: Severity;
  title: string;
  description?: string;
  ownerTeamId?: string;
  dueDate?: string;
  status: ExceptionStatus;
  sourceRef?: Record<string, any>;
  createdAt: string;
}

export interface PlatformHealthCheck {
  id: string;
  tenantId: string;
  checkKey: string;
  name: string;
  description?: string;
  enabled: boolean;
  params?: Record<string, any>;
  createdAt: string;
}

export interface PlatformHealthFinding {
  id: string;
  tenantId: string;
  checkKey: string;
  severity: Severity;
  status: "open" | "resolved";
  firstSeen: string;
  lastSeen: string;
  details?: Record<string, any>;
  resolvedAt?: string;
}

export type DataFreshnessStatus = "fresh" | "stale" | "critical";

export interface DataStreamStatus {
  tenantId: string;
  siteId: string;
  streamId?: string | null;
  lastTelemetryAt?: string | null;
  stalenessMinutes?: number | null;
  status: DataFreshnessStatus;
}

export interface WorkItem {
  id: string;
  tenantId: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority?: "critical" | "high" | "medium" | "low" | "info";
  assignedToUserId?: string;
  dueAt?: string;
  sourceFeatureArea: string;
  sourceTable?: string;
  sourceId?: string;
  deeplinkPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface AdvisorCard {
  id: string;
  tenantId: string;
  cardKey: string;
  title: string;
  severity: Severity;
  rationale?: string;
  recommendedAction?: string;
  deeplinkPath?: string;
  params?: Record<string, any>;
  createdAt: string;
}

export interface DashboardKPIs {
  activeAlertsCount: number;
  openWorkItemsCount: number;
  integrationHealthScore: number;
  dataFreshnessScore: number;
  platformHealthScore: number;
}
