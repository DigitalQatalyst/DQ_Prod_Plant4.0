# APM Power Transmission - API Query Contracts

## Overview

This document defines the API query contracts for the APM Power Transmission system. All queries use Supabase client with TypeScript interfaces for type safety. The system follows Row-Level Security (RLS) policies to ensure tenant isolation and role-based access control.

## General Patterns

### Query Response Structure

All list queries follow this pattern:

```typescript
interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Error Handling

All queries should handle errors consistently:

```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Query failed:', error);
  throw error;
}
```

### Pagination

All list queries support pagination:

```typescript
interface PaginationParams {
  page?: number;      // Default: 1
  pageSize?: number;  // Default: 20
}
```

## Feature Set 4: Asset Inventory & Criticality

### List Assets

**Hook:** `useAssets(params)`

**Parameters:**
```typescript
interface ListAssetsParams {
  sector?: string;                    // Filter by sector (default: 'power_transmission')
  asset_type?: TransmissionAssetType; // Filter by asset type
  operational_status?: OperationalStatus;
  location?: string;
  search?: string;                    // Text search on name, asset_tag
  page?: number;
  pageSize?: number;
  sortBy?: string;                    // Default: 'name'
  sortOrder?: 'asc' | 'desc';        // Default: 'asc'
}
```

**Response:**
```typescript
interface ListAssetsResponse {
  data: Asset[];
  total: number;
  page: number;
  pageSize: number;
}
```

**Example:**
```typescript
const { data, isLoading, error } = useAssets({
  sector: 'power_transmission',
  asset_type: 'power_transformer',
  operational_status: 'online',
  page: 1,
  pageSize: 20
});
```

### Get Asset Details

**Hook:** `useAsset(assetId)`

**Parameters:**
```typescript
interface GetAssetParams {
  assetId: string;
}
```

**Response:**
```typescript
interface GetAssetResponse {
  asset: Asset;
  parent?: Asset;
  children: Asset[];
  relationships: AssetRelationship[];
  linked_spares: SparePart[];
  lifecycle_events: LifecycleEvent[];
  fmea_entries: FMEAEntry[];
}
```

### List FMEA Entries

**Hook:** `useFMEA(params)`

**Parameters:**
```typescript
interface ListFMEAParams {
  asset_type?: TransmissionAssetType;
  min_rpn?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}
```

**Response:**
```typescript
interface ListFMEAResponse {
  data: FMEAEntry[];
  total: number;
  page: number;
  pageSize: number;
}
```

### List Spare Parts

**Hook:** `useSpareParts(params)`

**Parameters:**
```typescript
interface ListSparePartsParams {
  asset_type?: TransmissionAssetType;
  asset_id?: string;
  is_critical?: boolean;
  low_stock?: boolean;  // on_hand_quantity <= reorder_point
  page?: number;
  pageSize?: number;
}
```

## Feature Set 1: Asset Health & Diagnostics

### Get Latest Telemetry

**Hook:** `useLatestTelemetry(assetId, parameterIds?)`

**Parameters:**
```typescript
interface GetLatestTelemetryParams {
  asset_id: string;
  parameter_ids?: string[];  // If omitted, returns all mapped parameters
}
```

**Response:**
```typescript
interface GetLatestTelemetryResponse {
  asset_id: string;
  readings: Array<{
    parameter_id: string;
    parameter_name: string;
    value: number;
    unit: string;
    status: TelemetryStatus;  // 'Normal' | 'Warning' | 'Critical'
    timestamp: string;
  }>;
}
```

### Get Telemetry Time Series

**Hook:** `useTelemetrySeries(params)`

**Parameters:**
```typescript
interface GetTelemetrySeriesParams {
  asset_id: string;
  parameter_ids: string[];
  from: string;              // ISO timestamp
  to: string;                // ISO timestamp
  interval?: string;         // e.g., '1 hour', '15 minutes'
}
```

**Response:**
```typescript
interface GetTelemetrySeriesResponse {
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
```

### Get Health Score

**Hook:** `useHealthScore(assetId, asOf?)`

**Parameters:**
```typescript
interface GetHealthScoreParams {
  asset_id: string;
  as_of?: string;  // ISO timestamp, defaults to latest
}
```

**Response:**
```typescript
interface GetHealthScoreResponse {
  asset_id: string;
  score: number;              // 0-100
  computed_at: string;
  model_version: string;
  breakdown: Array<{
    parameter_name: string;
    contribution: number;
    current_value: number;
    status: TelemetryStatus;
  }>;
}
```

### List Diagnostic Events

**Hook:** `useDiagnosticEvents(params)`

**Parameters:**
```typescript
interface ListDiagnosticEventsParams {
  asset_id?: string;
  asset_type?: TransmissionAssetType;
  event_type?: DiagnosticEventType;
  state?: EventState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

**Response:**
```typescript
interface ListDiagnosticEventsResponse {
  data: DiagnosticEvent[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Acknowledge Diagnostic Event

**Mutation:** `useAcknowledgeDiagnosticEvent()`

**Parameters:**
```typescript
interface AcknowledgeDiagnosticEventParams {
  event_id: string;
  acknowledged_by: string;
}
```

**Authorization:** Requires `operations_engineer` or higher role

### Close Diagnostic Event

**Mutation:** `useCloseDiagnosticEvent()`

**Parameters:**
```typescript
interface CloseDiagnosticEventParams {
  event_id: string;
  closed_by: string;
  resolution_notes: string;  // Required
}
```

**Authorization:** Requires `reliability_engineer` or higher role

### List RCA Records

**Hook:** `useRCARecords(params)`

**Parameters:**
```typescript
interface ListRCARecordsParams {
  asset_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

## Feature Set 3: Asset Performance & Utilisation

### List Downtime Events

**Hook:** `useDowntimeEvents(params)`

**Parameters:**
```typescript
interface ListDowntimeEventsParams {
  asset_id?: string;
  event_type?: DowntimeEventType;
  outage_scope?: OutageScope;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

### Get Reliability Metrics

**Hook:** `useReliabilityMetrics(params)`

**Parameters:**
```typescript
interface GetReliabilityMetricsParams {
  asset_id: string;
  period_start: string;
  period_end: string;
}
```

**Response:**
```typescript
interface GetReliabilityMetricsResponse {
  asset_id: string;
  period_start: string;
  period_end: string;
  mtbf_hours: number;
  mttr_hours: number;
  availability_percent: number;
  failure_count: number;
  total_downtime_minutes: number;
}
```

### Get Utilisation Metrics

**Hook:** `useUtilisationMetrics(params)`

**Parameters:**
```typescript
interface GetUtilisationMetricsParams {
  asset_id: string;
  from?: string;
  to?: string;
}
```

**Response:**
```typescript
interface GetUtilisationMetricsResponse {
  asset_id: string;
  load_factor: number;
  peak_current: number;
  thermal_headroom?: number;  // For transformers/lines
  switching_cycles?: number;  // For breakers
}
```

### List Performance Benchmarks

**Hook:** `usePerformanceBenchmarks(params)`

**Parameters:**
```typescript
interface ListPerformanceBenchmarksParams {
  asset_type?: TransmissionAssetType;
  sector?: string;
}
```

### List Performance Deviations

**Hook:** `usePerformanceDeviations(params)`

**Parameters:**
```typescript
interface ListPerformanceDeviationsParams {
  asset_type?: TransmissionAssetType;
  min_magnitude?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

## Feature Set 2: Predictive & Prescriptive Maintenance

### Get Failure Predictions

**Hook:** `useFailurePredictions(params)`

**Parameters:**
```typescript
interface GetFailurePredictionsParams {
  asset_id?: string;
  risk_level?: RiskLevel;
  time_horizon?: PredictionHorizon;  // 7, 30, or 90 days
  page?: number;
  pageSize?: number;
}
```

**Response:**
```typescript
interface ListFailurePredictionsResponse {
  data: FailurePrediction[];
  total: number;
  page: number;
  pageSize: number;
}
```

### List CBM Triggers

**Hook:** `useCBMTriggers(params)`

**Parameters:**
```typescript
interface ListCBMTriggersParams {
  asset_type?: TransmissionAssetType;
  parameter_id?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}
```

### List Maintenance Recommendations

**Hook:** `useMaintenanceRecommendations(params)`

**Parameters:**
```typescript
interface ListMaintenanceRecommendationsParams {
  asset_id?: string;
  status?: 'open' | 'scheduled' | 'completed' | 'cancelled';
  min_priority?: number;
  due_before?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'priority_score' | 'due_date';
  sortOrder?: 'asc' | 'desc';
}
```

### Acknowledge Recommendation

**Mutation:** `useAcknowledgeRecommendation()`

**Parameters:**
```typescript
interface AcknowledgeRecommendationParams {
  recommendation_id: string;
  acknowledged_by: string;
}
```

**Authorization:** Requires `maintenance_planner` or higher role

### Schedule Recommendation

**Mutation:** `useScheduleRecommendation()`

**Parameters:**
```typescript
interface ScheduleRecommendationParams {
  recommendation_id: string;
  scheduled_date: string;
  assigned_to?: string;
}
```

**Authorization:** Requires `maintenance_planner` or higher role

### Close Recommendation

**Mutation:** `useCloseRecommendation()`

**Parameters:**
```typescript
interface CloseRecommendationParams {
  recommendation_id: string;
  closed_by: string;
  completion_notes: string;  // Required
}
```

**Authorization:** Requires `maintenance_planner` or higher role

## Feature Set 5: Alerts, Reports & Visualisation

### List Alerts

**Hook:** `useAlerts(params)`

**Parameters:**
```typescript
interface ListAlertsParams {
  asset_id?: string;
  severity?: AlertSeverity;
  state?: EventState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

### Acknowledge Alert

**Mutation:** `useAcknowledgeAlert()`

**Parameters:**
```typescript
interface AcknowledgeAlertParams {
  alert_id: string;
  acknowledged_by: string;
}
```

**Authorization:** Requires `operations_engineer` or higher role

### Close Alert

**Mutation:** `useCloseAlert()`

**Parameters:**
```typescript
interface CloseAlertParams {
  alert_id: string;
  closed_by: string;
  resolution_notes: string;  // Required
}
```

**Authorization:** Requires `operations_engineer` or higher role

### Get Alert Timeline

**Hook:** `useAlertTimeline(params)`

**Parameters:**
```typescript
interface GetAlertTimelineParams {
  asset_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

**Response:**
```typescript
interface GetAlertTimelineResponse {
  data: Array<{
    id: string;
    type: 'alert' | 'diagnostic_event' | 'downtime_event';
    timestamp: string;
    severity?: AlertSeverity;
    title: string;
    description?: string;
    asset_id: string;
    asset_name: string;
    state: EventState;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

### List Dashboards

**Hook:** `useDashboards()`

**Response:**
```typescript
interface ListDashboardsResponse {
  data: Dashboard[];
  total: number;
}
```

### Get Dashboard

**Hook:** `useDashboard(dashboardId)`

**Parameters:**
```typescript
interface GetDashboardParams {
  dashboard_id: string;
}
```

**Response:**
```typescript
interface GetDashboardResponse {
  dashboard: Dashboard;
  widgets: DashboardWidget[];
}
```

### Create/Update Dashboard

**Mutation:** `useSaveDashboard()`

**Parameters:**
```typescript
interface SaveDashboardParams {
  id?: string;  // Omit for create
  name: string;
  description?: string;
  layout_config: Record<string, unknown>;
  widgets: Array<{
    widget_type: string;
    query_template_ref: string;
    position: Record<string, unknown>;
    config: Record<string, unknown>;
  }>;
}
```

**Authorization:** User can only create/update their own dashboards

### List Report Runs

**Hook:** `useReportRuns(params)`

**Parameters:**
```typescript
interface ListReportRunsParams {
  report_type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
```

### Generate Report

**Mutation:** `useGenerateReport()`

**Parameters:**
```typescript
interface GenerateReportParams {
  report_type: 'reliability_summary' | 'maintenance_backlog' | 'asset_health_status' | 'performance_benchmarking';
  asset_scope: Record<string, unknown>;
  format: 'PDF' | 'CSV';
}
```

**Authorization:** Requires `reliability_engineer` or higher role

### List Export Jobs

**Hook:** `useExportJobs()`

**Response:**
```typescript
interface ListExportJobsResponse {
  data: ExportJob[];
  total: number;
}
```

### Create Export Job

**Mutation:** `useCreateExport()`

**Parameters:**
```typescript
interface CreateExportParams {
  query_reference: string;
  format: 'CSV' | 'JSON' | 'Excel';
  filters?: Record<string, unknown>;
}
```

**Authorization:** User can only export data they have permission to read

## Performance Considerations

### Caching

- Health scores are cached with 5-minute TTL
- Asset lists are cached with 1-minute TTL
- Telemetry queries use database-level caching

### Pagination

- Default page size: 20
- Maximum page size: 100
- Always use pagination for list queries

### Query Optimization

- Use appropriate indexes (see schema documentation)
- Limit telemetry queries to necessary time ranges
- Use aggregation intervals for large time ranges
- Leverage hypertable partitioning for telemetry data

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User lacks required role |
| 404 | Not Found | Resource does not exist |
| 422 | Validation Error | Invalid parameters |
| 500 | Server Error | Contact administrator |

## Rate Limiting

- API queries are subject to Supabase rate limits
- Recommended: Implement client-side debouncing for search inputs
- Use pagination to avoid large result sets
