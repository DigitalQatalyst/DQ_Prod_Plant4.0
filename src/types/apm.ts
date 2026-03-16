/**
 * APM Power Transmission Types
 * 
 * TypeScript type definitions for the Asset Performance Management (APM) system
 * for Power Transmission infrastructure. Includes types for assets, telemetry,
 * health monitoring, diagnostics, performance tracking, predictive maintenance,
 * and alerting.
 * 
 * Feature Sets:
 * - FS4: Asset Inventory & Criticality
 * - FS1: Asset Health & Diagnostics
 * - FS3: Asset Performance & Utilisation
 * - FS2: Predictive & Prescriptive Maintenance
 * - FS5: Alerts, Reports & Visualisation
 */

// =============================================================================
// FS4: Asset Inventory & Criticality Types
// =============================================================================

/**
 * Transmission asset types supported by the APM system
 */
export type TransmissionAssetType =
  | "power_transformer"
  | "circuit_breaker"
  | "disconnect_switch"
  | "busbar"
  | "transmission_line"
  | "line_terminal"
  | "substation_bay"
  | "protection_relay"
  | "ct"
  | "vt"
  | "surge_arrester"
  | "reactor"
  | "capacitor_bank"
  | "station_battery"
  | "charger"
  | "scada_rtu"
  | "plc_ied"
  | "meter";

/**
 * Operational status of an asset
 */
export type OperationalStatus = "online" | "offline" | "maintenance" | "pending";

/**
 * Asset criticality classification
 */
export type CriticalityTier = "Critical" | "Important" | "Standard";

/**
 * Asset lifecycle stages
 */
export type LifecycleStage =
  | "design"
  | "procure"
  | "install"
  | "commission"
  | "operate"
  | "maintain"
  | "refurbish"
  | "retire";

/**
 * Asset relationship types
 */
export type RelationType = "connected_to" | "feeds_to" | "protects" | "in_bay";

/**
 * Core asset entity representing transmission equipment
 */
export interface Asset {
  id: string;
  sector: "power_transmission";
  name: string;
  asset_type: TransmissionAssetType;
  asset_tag?: string;
  location: string;
  voltage_kv?: number;
  commissioning_date?: string;
  operational_status: OperationalStatus;
  criticality: CriticalityTier;
  lifecycle_stage: LifecycleStage;
  parent_asset_id?: string | null;
  substation_id?: string | null;
  bay_code?: string | null;
  owner_org_unit?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Relationship between assets (connections, dependencies)
 */
export interface AssetRelationship {
  id: string;
  from_asset_id: string;
  to_asset_id: string;
  relation_type: RelationType;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Asset lifecycle event tracking
 */
export interface LifecycleEvent {
  id: string;
  asset_id: string;
  stage: LifecycleStage;
  occurred_at: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

/**
 * Asset criticality scoring model
 */
export interface CriticalityModel {
  id: string;
  sector: string;
  safety_weight: number;
  production_weight: number;
  environmental_weight: number;
  detectability_weight: number;
  created_at: string;
}

/**
 * FMEA (Failure Mode and Effects Analysis) entry
 */
export interface FMEAEntry {
  id: string;
  asset_type: TransmissionAssetType;
  failure_mode: string;
  failure_cause?: string;
  failure_effect?: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // severity × occurrence × detection
  recommended_actions?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Spare part definition
 */
export interface SparePart {
  id: string;
  part_number: string;
  description: string;
  applicable_asset_types?: TransmissionAssetType[];
  lead_time_days?: number;
  on_hand_quantity?: number;
  reorder_point?: number;
  unit_cost?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Linkage between spare parts and assets
 */
export interface AssetSparePart {
  id: string;
  asset_id?: string;
  asset_type?: TransmissionAssetType;
  spare_part_id: string;
  quantity_required: number;
  is_critical: boolean;
  created_at: string;
}

// =============================================================================
// FS1: Asset Health & Diagnostics Types
// =============================================================================

/**
 * Parameter role classification
 */
export type ParameterRole = "health_driver" | "diagnostic" | "context";

/**
 * Telemetry status classification
 */
export type TelemetryStatus = "Normal" | "Warning" | "Critical";

/**
 * Telemetry parameter definition
 */
export interface TelemetryParameter {
  id: string;
  name: string;
  parameter_type: string;
  unit: string;
  parameter_role: ParameterRole;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
  description?: string;
  created_at: string;
}

/**
 * Mapping of parameters to asset types
 */
export interface AssetParameterMap {
  id: string;
  asset_type: TransmissionAssetType;
  parameter_id: string;
  is_required: boolean;
  sampling_interval_seconds?: number;
  created_at: string;
}

/**
 * Time-series telemetry data point
 */
export interface TelemetryDataPoint {
  timestamp: string;
  asset_id: string;
  parameter_id: string;
  value: number;
  unit: string;
  status: TelemetryStatus;
  quality_score?: number;
}

/**
 * Health scoring model for asset types
 */
export interface HealthModel {
  id: string;
  asset_type: TransmissionAssetType;
  model_version: string;
  parameter_weights: Record<string, number>;
  computation_method: string;
  created_at: string;
}

/**
 * Computed health score for an asset
 */
export interface HealthScore {
  id: string;
  asset_id: string;
  score: number; // 0-100
  computed_at: string;
  model_version: string;
  component_breakdown: Record<string, number>;
}

/**
 * Diagnostic event types
 */
export type DiagnosticEventType =
  | "thermal"
  | "electrical"
  | "mechanical"
  | "insulation"
  | "comms";

/**
 * Event state
 */
export type EventState = "open" | "ack" | "closed";

/**
 * Diagnostic event (anomaly or fault detection)
 */
export interface DiagnosticEvent {
  id: string;
  asset_id: string;
  event_type: DiagnosticEventType;
  title: string;
  description?: string;
  confidence: number; // 0-100
  detected_at: string;
  state: EventState;
  acknowledged_by?: string;
  acknowledged_at?: string;
  closed_by?: string;
  closed_at?: string;
  resolution_notes?: string;
  telemetry_window_start?: string;
  telemetry_window_end?: string;
  created_at: string;
}

/**
 * Root Cause Analysis record
 */
export interface RCARecord {
  id: string;
  event_id: string;
  root_cause: string;
  contributing_factors?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  created_by?: string;
  created_at: string;
}

// =============================================================================
// FS3: Asset Performance & Utilisation Types
// =============================================================================

/**
 * Downtime event types
 */
export type DowntimeEventType =
  | "planned_maintenance"
  | "unplanned_failure"
  | "forced_outage"
  | "testing";

/**
 * Outage scope
 */
export type OutageScope = "bay" | "line" | "transformer" | "substation";

/**
 * Downtime event tracking
 */
export interface DowntimeEvent {
  id: string;
  asset_id: string;
  event_type: DowntimeEventType;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  grid_impact_mw?: number;
  protection_trip_code?: string;
  outage_scope?: OutageScope;
  description?: string;
  rca_id?: string;
  created_at: string;
}

/**
 * Reliability metrics (MTBF, MTTR, Availability)
 */
export interface ReliabilityMetrics {
  id: string;
  asset_id: string;
  period_start: string;
  period_end: string;
  mtbf_hours?: number;
  mttr_hours?: number;
  availability_percent: number;
  failure_count: number;
  total_downtime_minutes: number;
  computed_at: string;
}

/**
 * Asset utilisation metrics
 */
export interface UtilisationMetrics {
  id: string;
  asset_id: string;
  period_start: string;
  period_end: string;
  load_factor?: number;
  peak_current?: number;
  thermal_headroom?: number;
  switching_cycles?: number;
  computed_at: string;
}

/**
 * Performance benchmark definition
 */
export interface PerformanceBenchmark {
  id: string;
  asset_type: TransmissionAssetType;
  sector: string;
  availability_target?: number;
  load_factor_target?: number;
  mtbf_target?: number;
  created_at: string;
}

/**
 * Performance deviation record
 */
export interface PerformanceDeviation {
  id: string;
  asset_id: string;
  deviation_type: string;
  magnitude: number;
  detected_at: string;
  telemetry_window_start?: string;
  telemetry_window_end?: string;
  benchmark_reference?: string;
  created_at: string;
}

// =============================================================================
// FS2: Predictive & Prescriptive Maintenance Types
// =============================================================================

/**
 * Risk level classification
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Prediction time horizon
 */
export type PredictionHorizon = 7 | 30 | 90;

/**
 * Failure prediction
 */
export interface FailurePrediction {
  id: string;
  asset_id: string;
  prediction_date: string;
  failure_probability: number; // 0-100
  confidence: number; // 0-100
  time_horizon_days: PredictionHorizon;
  risk_level: RiskLevel;
  rul_days?: number;
  contributing_factors?: string[];
  created_at: string;
}

/**
 * CBM trigger condition operators
 */
export type ConditionOperator =
  | "greater_than"
  | "less_than"
  | "equals"
  | "rate_of_change_exceeds";

/**
 * Condition-Based Maintenance trigger
 */
export interface CBMTrigger {
  id: string;
  name: string;
  parameter_id: string;
  condition_operator: ConditionOperator;
  threshold_value: number;
  recommended_action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Maintenance recommendation types
 */
export type RecommendationType =
  | "inspection"
  | "repair"
  | "replacement"
  | "calibration"
  | "cleaning";

/**
 * Maintenance recommendation status
 */
export type RecommendationStatus = "open" | "scheduled" | "completed" | "cancelled";

/**
 * Maintenance recommendation
 */
export interface MaintenanceRecommendation {
  id: string;
  asset_id: string;
  recommendation_type: RecommendationType;
  description: string;
  priority_score: number; // 0-100
  due_date?: string;
  required_spares?: string[];
  source_trigger_id?: string;
  status: RecommendationStatus;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Risk scoring model
 */
export interface RiskScoringModel {
  id: string;
  sector: string;
  criticality_weight: number;
  health_weight: number;
  failure_probability_weight: number;
  performance_deviation_weight: number;
  created_at: string;
}

// =============================================================================
// FS5: Alerts, Reports & Visualisation Types
// =============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "critical" | "emergency";

/**
 * Alert source
 */
export type AlertSource = "telemetry" | "diagnostic" | "prediction" | "manual";

/**
 * Alert entity
 */
export interface Alert {
  id: string;
  asset_id: string;
  alert_type: string;
  severity: AlertSeverity;
  source: AlertSource;
  message: string;
  detected_at: string;
  state: EventState;
  acknowledged_by?: string;
  acknowledged_at?: string;
  closed_by?: string;
  closed_at?: string;
  resolution_notes?: string;
  source_event_id?: string;
  created_at: string;
}

/**
 * Alert state transition history
 */
export interface AlertHistory {
  id: string;
  alert_id: string;
  previous_state: EventState;
  new_state: EventState;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

/**
 * Dashboard widget types
 */
export type WidgetType =
  | "KPI_card"
  | "time_series_chart"
  | "table"
  | "status_grid"
  | "alert_list";

/**
 * Dashboard definition
 */
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  owner: string;
  layout_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Dashboard widget
 */
export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  query_template_ref: string;
  position: Record<string, unknown>;
  config: Record<string, unknown>;
  created_at: string;
}

/**
 * Report types
 */
export type ReportType =
  | "reliability_summary"
  | "maintenance_backlog"
  | "asset_health_status"
  | "performance_benchmarking";

/**
 * Report execution status
 */
export type ReportStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Report run record
 */
export interface ReportRun {
  id: string;
  report_type: ReportType;
  execution_time: string;
  status: ReportStatus;
  output_location?: string;
  asset_scope?: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

/**
 * Export formats
 */
export type ExportFormat = "CSV" | "JSON" | "Excel";

/**
 * Export job status
 */
export type ExportJobStatus = "queued" | "processing" | "completed" | "failed";

/**
 * Export job
 */
export interface ExportJob {
  id: string;
  user_id: string;
  query_reference: string;
  format: ExportFormat;
  status: ExportJobStatus;
  output_location?: string;
  created_at: string;
  completed_at?: string;
}

// =============================================================================
// API Query Contract Types
// =============================================================================

/**
 * Asset list query parameters
 */
export interface ListAssetsParams {
  sector?: string;
  asset_type?: TransmissionAssetType;
  operational_status?: OperationalStatus;
  location?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Asset list response
 */
export interface ListAssetsResponse {
  data: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Spare part with linkage information (quantity, criticality)
 */
export interface SparePartWithLinkage extends SparePart {
  quantity_required?: number;
  is_critical?: boolean;
}

/**
 * Asset detail response with relationships
 */
export interface GetAssetResponse {
  asset: Asset;
  parent?: Asset;
  children: Asset[];
  relationships: AssetRelationship[];
  linked_spares: SparePartWithLinkage[];
  lifecycle_events: LifecycleEvent[];
  fmea_entries: FMEAEntry[];
}

/**
 * Asset upsert parameters
 */
export interface UpsertAssetParams {
  sector: "power_transmission";
  name: string;
  asset_type: TransmissionAssetType;
  asset_tag?: string;
  location: string;
  voltage_kv?: number;
  commissioning_date?: string;
  operational_status: OperationalStatus;
  criticality: CriticalityTier;
  lifecycle_stage: LifecycleStage;
  parent_asset_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Latest telemetry query parameters
 */
export interface GetLatestTelemetryParams {
  asset_id: string;
  parameter_ids?: string[];
}

/**
 * Latest telemetry response
 */
export interface GetLatestTelemetryResponse {
  asset_id: string;
  readings: Array<{
    parameter_id: string;
    parameter_name: string;
    value: number;
    unit: string;
    status: TelemetryStatus;
    timestamp: string;
  }>;
}

/**
 * Telemetry time series query parameters
 */
export interface GetTelemetrySeriesParams {
  asset_id: string;
  parameter_ids: string[];
  from: string;
  to: string;
  interval?: string;
}

/**
 * Telemetry time series response
 */
export interface GetTelemetrySeriesResponse {
  asset_id: string;
  series: Array<{
    parameter_id: string;
    parameter_name: string;
    unit: string;
    datapoints: Array<{
      timestamp: string;
      value: number;
      status: TelemetryStatus;
    }>;
  }>;
}

/**
 * Health score query parameters
 */
export interface GetHealthScoreParams {
  asset_id: string;
  as_of?: string;
}

/**
 * Health score response
 */
export interface GetHealthScoreResponse {
  asset_id: string;
  score: number;
  computed_at: string;
  model_version: string;
  breakdown: Array<{
    parameter_name: string;
    contribution: number;
    current_value: number;
    status: TelemetryStatus;
  }>;
}

/**
 * Diagnostic events list parameters
 */
export interface ListDiagnosticEventsParams {
  asset_id?: string;
  asset_type?: TransmissionAssetType;
  event_type?: DiagnosticEventType;
  state?: EventState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Acknowledge diagnostic event parameters
 */
export interface AcknowledgeDiagnosticEventParams {
  event_id: string;
  acknowledged_by: string;
}

/**
 * Close diagnostic event parameters
 */
export interface CloseDiagnosticEventParams {
  event_id: string;
  closed_by: string;
  resolution_notes: string;
}

/**
 * Downtime events list parameters
 */
export interface ListDowntimeEventsParams {
  asset_id?: string;
  event_type?: DowntimeEventType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Reliability metrics query parameters
 */
export interface GetReliabilityMetricsParams {
  asset_id: string;
  period_start: string;
  period_end: string;
}

/**
 * Reliability metrics response
 */
export interface GetReliabilityMetricsResponse {
  asset_id: string;
  period_start: string;
  period_end: string;
  mtbf_hours: number;
  mttr_hours: number;
  availability_percent: number;
  failure_count: number;
  total_downtime_minutes: number;
}

/**
 * Failure prediction query parameters
 */
export interface GetFailurePredictionParams {
  asset_id: string;
  horizon?: PredictionHorizon;
}

/**
 * Maintenance recommendations list parameters
 */
export interface ListRecommendationsParams {
  asset_id?: string;
  status?: RecommendationStatus;
  min_priority?: number;
  due_before?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Create work order from recommendation parameters
 */
export interface CreateWorkOrderFromRecommendationParams {
  recommendation_id: string;
  scheduled_date: string;
  assigned_to?: string;
}

/**
 * Alerts list parameters
 */
export interface ListAlertsParams {
  asset_id?: string;
  severity?: AlertSeverity;
  state?: EventState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Acknowledge alert parameters
 */
export interface AcknowledgeAlertParams {
  alert_id: string;
  acknowledged_by: string;
}

/**
 * Close alert parameters
 */
export interface CloseAlertParams {
  alert_id: string;
  closed_by: string;
  resolution_notes: string;
}

/**
 * Timeline event type (union of alerts, diagnostic events, downtime events)
 */
export interface TimelineEvent {
  id: string;
  event_type: "alert" | "diagnostic" | "downtime";
  asset_id: string;
  timestamp: string;
  title: string;
  severity?: AlertSeverity;
  state?: EventState;
  details: Alert | DiagnosticEvent | DowntimeEvent;
}

/**
 * Alert timeline query parameters
 */
export interface ListAlertTimelineParams {
  asset_id?: string;
  event_type?: "alert" | "diagnostic" | "downtime";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dashboard list parameters
 */
export interface ListDashboardsParams {
  owner?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dashboard with widgets response
 */
export interface DashboardWithWidgets {
  dashboard: Dashboard;
  widgets: DashboardWidget[];
}

/**
 * Create/Update dashboard parameters
 */
export interface UpsertDashboardParams {
  id?: string;
  name: string;
  description?: string;
  owner: string;
  layout_config: Record<string, unknown>;
  widgets?: Array<{
    widget_type: WidgetType;
    query_template_ref: string;
    position: Record<string, unknown>;
    config: Record<string, unknown>;
  }>;
}

/**
 * Report runs list parameters
 */
export interface ListReportRunsParams {
  report_type?: ReportType;
  created_by?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Generate report parameters
 */
export interface GenerateReportParams {
  report_type: ReportType;
  asset_scope?: Record<string, unknown>;
  created_by: string;
}

/**
 * Export jobs list parameters
 */
export interface ListExportJobsParams {
  user_id?: string;
  status?: ExportJobStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Create export job parameters
 */
export interface CreateExportJobParams {
  user_id: string;
  query_reference: string;
  format: ExportFormat;
}
