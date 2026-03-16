export type FeatureAreaId = 
  | "overview" 
  | "assets" 
  | "security" 
  | "energy" 
  | "automation" 
  | "optimization" 
  | "monitoring" 
  | "settings";

export type WidgetType = 
  | "kpi" 
  | "timeseries" 
  | "table" 
  | "list" 
  | "statusBoard" 
  | "custom";

export interface DashboardScope {
  tenantId?: string;
  siteId?: string;
  streamId?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  featureArea: FeatureAreaId | "cross";
  scope?: DashboardScope;
  widgetIds: string[];
  isGlobal?: boolean;
}

export interface WidgetConfig {
  // Generic config that can be extended by specific widget types
  metricKeys?: string[];
  filters?: Record<string, any>;
  timeRange?: { start: string; end: string };
  displayLimit?: number;
  visualization?: string;
  [key: string]: any; // Allow arbitrary config properties
}

export interface Widget {
  id: string;
  type: WidgetType;
  featureArea: FeatureAreaId | "cross";
  title: string;
  description?: string;
  config: WidgetConfig;
}
