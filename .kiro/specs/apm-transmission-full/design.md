# Design Document: APM Power Transmission

## Overview

This design document specifies the implementation of the Asset Performance Management (APM) system for Power Transmission infrastructure. The system provides comprehensive monitoring, diagnostics, predictive maintenance, and performance optimization capabilities for transmission assets including transformers, circuit breakers, transmission lines, substations, and protection equipment.

The implementation follows a phased rollout across five feature sets, building incrementally from foundational asset inventory through advanced predictive capabilities. The system uses Supabase as the single source of truth, with PostgreSQL for relational data, hypertables for time-series telemetry, and Row-Level Security (RLS) for access control.

### Key Design Principles

1. **Sector-Agnostic Foundation**: Core schema structures support multiple sectors while allowing transmission-specific extensions
2. **Incremental Delivery**: Each feature set delivers end-to-end value (Data → API → UI → Tests) before proceeding
3. **Natural Key Idempotency**: All migrations and seeds use natural keys for safe re-execution
4. **nLVE UI Pattern**: Consistent Navigate → List → View → Edit interaction model across all pages
5. **Performance by Design**: Appropriate indexes, hypertable partitioning, and query optimization from the start
6. **Type Safety**: Strongly-typed TypeScript interfaces for all data contracts

### Feature Set Rollout Sequence

The implementation follows this dependency-driven sequence:

1. **FS4: Asset Inventory & Criticality** - Foundation for all other features
2. **FS1: Asset Health & Diagnostics** - Depends on asset registry and telemetry parameters
3. **FS3: Asset Performance & Utilisation** - Depends on assets, telemetry, and downtime tracking
4. **FS2: Predictive & Prescriptive Maintenance** - Depends on health, performance, and FMEA data
5. **FS5: Alerts, Reports & Visualisation** - Capstone integrating all previous feature sets

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    Plant4.0 Platform                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Energy     │  │  Automation  │  │   Security   │    │
│  │ Management   │  │   Control    │  │  Compliance  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │     APM Power Transmission (This System)          │    │
│  │                                                     │    │
│  │  FS4: Inventory  FS1: Health  FS3: Performance    │    │
│  │  FS2: Predictive  FS5: Alerts & Reports           │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │              Supabase Backend                      │    │
│  │  PostgreSQL + Hypertables + RLS + Real-time       │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```


### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  React Components (nLVE Pattern) + TypeScript + Tailwind   │
│  - Asset Lists & Views  - Health Dashboards                 │
│  - Alert Management     - Report Builder                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  React Hooks + Query Contracts + State Management           │
│  - useAssets()  - useTelemetry()  - useAlerts()            │
│  - Type-safe API calls with RLS awareness                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  Supabase Client + PostgreSQL + TimescaleDB                 │
│  - Relational Tables (assets, FMEA, spares)                 │
│  - Hypertables (telemetry_data)                             │
│  - Computed Views (health_scores, reliability_metrics)      │
│  - RLS Policies (sector + role-based access)                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript 5, Tailwind CSS, shadcn/ui components
- **State Management**: React Context + Custom Hooks
- **Backend**: Supabase (PostgreSQL 15 + PostgREST + Realtime)
- **Time-Series**: TimescaleDB extension for telemetry hypertables
- **Security**: Row-Level Security (RLS) + JWT-based authentication
- **Testing**: Vitest for unit tests, property-based testing for correctness

## Components and Interfaces

### Core Domain Entities

#### Asset

The central entity representing physical transmission equipment.

```typescript
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

export type OperationalStatus = "online" | "offline" | "maintenance" | "pending";
export type CriticalityTier = "Critical" | "Important" | "Standard";
export type LifecycleStage = 
  | "design" 
  | "procure" 
  | "install" 
  | "commission" 
  | "operate" 
  | "maintain" 
  | "refurbish" 
  | "retire";

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
```


#### Asset Relationship

Represents connections and dependencies between assets.

```typescript
export type RelationType = "connected_to" | "feeds_to" | "protects" | "in_bay";

export interface AssetRelationship {
  id: string;
  from_asset_id: string;
  to_asset_id: string;
  relation_type: RelationType;
  metadata?: Record<string, unknown>;
  created_at: string;
}
```

#### Telemetry Parameter

Defines measurable parameters for asset monitoring.

```typescript
export type ParameterRole = "health_driver" | "diagnostic" | "context";

export interface TelemetryParameter {
  id: string;
  name: string;
  parameter_type: string; // e.g., "temperature", "pressure", "current"
  unit: string;
  parameter_role: ParameterRole;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
  description?: string;
  created_at: string;
}

export interface AssetParameterMap {
  id: string;
  asset_type: TransmissionAssetType;
  parameter_id: string;
  is_required: boolean;
  sampling_interval_seconds?: number;
}
```

#### Telemetry Data

Time-series sensor readings from assets.

```typescript
export type TelemetryStatus = "Normal" | "Warning" | "Critical";

export interface TelemetryDataPoint {
  timestamp: string;
  asset_id: string;
  parameter_id: string;
  value: number;
  unit: string;
  status: TelemetryStatus;
  quality_score?: number;
}
```

#### Health Model and Score

Defines how asset health is computed.

```typescript
export interface HealthModel {
  id: string;
  asset_type: TransmissionAssetType;
  model_version: string;
  parameter_weights: Record<string, number>; // parameter_id -> weight
  computation_method: string;
  created_at: string;
}

export interface HealthScore {
  id: string;
  asset_id: string;
  score: number; // 0-100
  computed_at: string;
  model_version: string;
  component_breakdown: Record<string, number>;
}
```

#### Diagnostic Event

Represents detected anomalies and faults.

```typescript
export type DiagnosticEventType = 
  | "thermal" 
  | "electrical" 
  | "mechanical" 
  | "insulation" 
  | "comms";

export type EventState = "open" | "ack" | "closed";

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
}
```


#### FMEA Entry

Failure Mode and Effects Analysis library.

```typescript
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
```

#### Downtime Event

Records asset unavailability periods.

```typescript
export type DowntimeEventType = 
  | "planned_maintenance" 
  | "unplanned_failure" 
  | "forced_outage" 
  | "testing";

export type OutageScope = "bay" | "line" | "transformer" | "substation";

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
```

#### Reliability Metrics

Computed reliability statistics.

```typescript
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
```

#### Failure Prediction

AI-driven failure forecasts.

```typescript
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PredictionHorizon = 7 | 30 | 90;

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
```

#### Maintenance Recommendation

Prescriptive maintenance actions.

```typescript
export type RecommendationType = 
  | "inspection" 
  | "repair" 
  | "replacement" 
  | "calibration" 
  | "cleaning";

export interface MaintenanceRecommendation {
  id: string;
  asset_id: string;
  recommendation_type: RecommendationType;
  description: string;
  priority_score: number; // 0-100
  due_date?: string;
  required_spares?: string[]; // spare_part_ids
  source_trigger_id?: string; // CBM trigger or prediction
  status: "open" | "scheduled" | "completed" | "cancelled";
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}
```

#### Alert

Real-time notifications for critical conditions.

```typescript
export type AlertSeverity = "info" | "warning" | "critical" | "emergency";
export type AlertSource = "telemetry" | "diagnostic" | "prediction" | "manual";

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
}
```


### API Query Contracts

### Navigation Integration

The APM transmission features integrate into the existing Monitor section rather than creating a separate navigation area. The features extend the existing Monitor feature sets:

- **Asset Inventory & Criticality** → Enhanced with transmission-specific asset types and parameters
- **Asset Health & Diagnostics** → Enhanced with transmission telemetry parameters and diagnostic events  
- **Asset Performance & Utilisation** → Enhanced with transmission-specific downtime and reliability metrics
- **Predictive & Prescriptive Maintenance** → Enhanced with transmission failure modes and CBM triggers
- **Alerts, Reports & Visualisation** → Enhanced with transmission-specific alert types and reports

All page paths follow the pattern `/monitor/{feature-set}/{feature}` instead of creating a separate APM TX section.

#### Asset Queries

```typescript
// List assets with filtering and pagination
interface ListAssetsParams {
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

interface ListAssetsResponse {
  data: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

// Get single asset with relationships
interface GetAssetResponse {
  asset: Asset;
  parent?: Asset;
  children: Asset[];
  relationships: AssetRelationship[];
  linked_spares: SparePart[];
  lifecycle_events: LifecycleEvent[];
  fmea_entries: FMEAEntry[];
}

// Upsert asset (natural key: sector + name + location OR asset_tag)
interface UpsertAssetParams {
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
```

#### Telemetry Queries

```typescript
// Get latest telemetry for an asset
interface GetLatestTelemetryParams {
  asset_id: string;
  parameter_ids?: string[];
}

interface GetLatestTelemetryResponse {
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

// Get telemetry time series
interface GetTelemetrySeriesParams {
  asset_id: string;
  parameter_ids: string[];
  from: string;
  to: string;
  interval?: string; // e.g., "1 hour", "15 minutes"
}

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

#### Health Queries

```typescript
// Get health score for an asset
interface GetHealthScoreParams {
  asset_id: string;
  as_of?: string;
}

interface GetHealthScoreResponse {
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
```

#### Diagnostic Queries

```typescript
// List diagnostic events
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

// Acknowledge diagnostic event
interface AcknowledgeDiagnosticEventParams {
  event_id: string;
  acknowledged_by: string;
}

// Close diagnostic event
interface CloseDiagnosticEventParams {
  event_id: string;
  closed_by: string;
  resolution_notes: string;
}
```

#### Downtime and Reliability Queries

```typescript
// List downtime events
interface ListDowntimeEventsParams {
  asset_id?: string;
  event_type?: DowntimeEventType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// Get reliability metrics
interface GetReliabilityMetricsParams {
  asset_id: string;
  period_start: string;
  period_end: string;
}

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

#### Prediction and Recommendation Queries

```typescript
// Get failure prediction
interface GetFailurePredictionParams {
  asset_id: string;
  horizon?: PredictionHorizon;
}

// List maintenance recommendations
interface ListRecommendationsParams {
  asset_id?: string;
  status?: string;
  min_priority?: number;
  due_before?: string;
  page?: number;
  pageSize?: number;
}

// Create work order from recommendation
interface CreateWorkOrderFromRecommendationParams {
  recommendation_id: string;
  scheduled_date: string;
  assigned_to?: string;
}
```

#### Alert Queries

```typescript
// List alerts
interface ListAlertsParams {
  asset_id?: string;
  severity?: AlertSeverity;
  state?: EventState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// Acknowledge alert
interface AcknowledgeAlertParams {
  alert_id: string;
  acknowledged_by: string;
}

// Close alert
interface CloseAlertParams {
  alert_id: string;
  closed_by: string;
  resolution_notes: string;
}
```


## Data Models

### Database Schema Overview

The APM system extends the baseline Supabase schema with transmission-specific enhancements while maintaining sector-agnostic reusability.

#### Schema Organization by Feature Set

**FS4: Asset Inventory & Criticality**
- `assets` (extended with transmission columns)
- `asset_relationships`
- `asset_lifecycle_events`
- `asset_criticality_model`
- `fmea_entries` (extended)
- `spare_parts`
- `asset_spare_parts`

**FS1: Asset Health & Diagnostics**
- `telemetry_parameters` (extended)
- `asset_parameter_map`
- `telemetry_data` (hypertable)
- `health_models`
- `health_scores`
- `diagnostic_events`
- `rca_records`

**FS3: Asset Performance & Utilisation**
- `downtime_events` (extended)
- `reliability_metrics`
- `utilisation_metrics`
- `performance_deviations`
- `performance_benchmarks`

**FS2: Predictive & Prescriptive Maintenance**
- `failure_predictions`
- `cbm_triggers`
- `maintenance_recommendations`
- `risk_scoring_model`

**FS5: Alerts, Reports & Visualisation**
- `alerts`
- `alert_history`
- `dashboards`
- `dashboard_widgets`
- `report_runs`
- `export_jobs`

### Key Schema Extensions

#### Assets Table Extensions

```sql
-- Extend existing assets table
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'power_transmission',
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS substation_id UUID,
  ADD COLUMN IF NOT EXISTS bay_code TEXT,
  ADD COLUMN IF NOT EXISTS voltage_kv NUMERIC,
  ADD COLUMN IF NOT EXISTS commissioning_date DATE,
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT,
  ADD COLUMN IF NOT EXISTS owner_org_unit TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_sector_type 
  ON assets(sector, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_sector_status 
  ON assets(sector, operational_status);
CREATE INDEX IF NOT EXISTS idx_assets_parent 
  ON assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_location 
  ON assets(location);

-- Check constraint for lifecycle stages
ALTER TABLE assets
  ADD CONSTRAINT chk_lifecycle_stage
  CHECK (lifecycle_stage IN (
    'design', 'procure', 'install', 'commission',
    'operate', 'maintain', 'refurbish', 'retire'
  ));
```

#### Asset Type Enum Extension

```sql
-- Extend asset_type enum with transmission types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'power_transformer' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'power_transformer';
    ALTER TYPE asset_type ADD VALUE 'circuit_breaker';
    ALTER TYPE asset_type ADD VALUE 'disconnect_switch';
    ALTER TYPE asset_type ADD VALUE 'busbar';
    ALTER TYPE asset_type ADD VALUE 'transmission_line';
    ALTER TYPE asset_type ADD VALUE 'line_terminal';
    ALTER TYPE asset_type ADD VALUE 'substation_bay';
    ALTER TYPE asset_type ADD VALUE 'protection_relay';
    ALTER TYPE asset_type ADD VALUE 'ct';
    ALTER TYPE asset_type ADD VALUE 'vt';
    ALTER TYPE asset_type ADD VALUE 'surge_arrester';
    ALTER TYPE asset_type ADD VALUE 'reactor';
    ALTER TYPE asset_type ADD VALUE 'capacitor_bank';
    ALTER TYPE asset_type ADD VALUE 'station_battery';
    ALTER TYPE asset_type ADD VALUE 'charger';
    ALTER TYPE asset_type ADD VALUE 'scada_rtu';
    ALTER TYPE asset_type ADD VALUE 'plc_ied';
    ALTER TYPE asset_type ADD VALUE 'meter';
  END IF;
END $$;
```

#### Asset Relationships Table

```sql
CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  to_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_asset_id, to_asset_id, relation_type),
  CHECK (relation_type IN ('connected_to', 'feeds_to', 'protects', 'in_bay'))
);

CREATE INDEX IF NOT EXISTS idx_asset_rel_from 
  ON asset_relationships(from_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_rel_to 
  ON asset_relationships(to_asset_id);
```

#### Telemetry Parameters Extension

```sql
-- Extend telemetry_parameters table
ALTER TABLE telemetry_parameters
  ADD COLUMN IF NOT EXISTS parameter_role TEXT DEFAULT 'diagnostic',
  ADD COLUMN IF NOT EXISTS warning_min NUMERIC,
  ADD COLUMN IF NOT EXISTS warning_max NUMERIC,
  ADD COLUMN IF NOT EXISTS critical_min NUMERIC,
  ADD COLUMN IF NOT EXISTS critical_max NUMERIC;

-- Add check constraint for parameter_role
ALTER TABLE telemetry_parameters
  ADD CONSTRAINT chk_parameter_role
  CHECK (parameter_role IN ('health_driver', 'diagnostic', 'context'));

-- Index for parameter lookups
CREATE INDEX IF NOT EXISTS idx_telemetry_params_type_name
  ON telemetry_parameters(parameter_type, name);
```

#### Asset Parameter Mapping

```sql
CREATE TABLE IF NOT EXISTS asset_parameter_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  parameter_id UUID NOT NULL REFERENCES telemetry_parameters(id),
  is_required BOOLEAN DEFAULT false,
  sampling_interval_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_type, parameter_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_param_map_type
  ON asset_parameter_map(asset_type);
```

#### Telemetry Data Hypertable

```sql
-- Ensure TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- telemetry_data is already a hypertable in baseline
-- Add indexes for transmission queries
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_param_time
  ON telemetry_data(asset_id, parameter_id, timestamp DESC);
```

#### Health Models and Scores

```sql
CREATE TABLE IF NOT EXISTS health_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  model_version TEXT NOT NULL,
  parameter_weights JSONB NOT NULL,
  computation_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_type, model_version)
);

CREATE TABLE IF NOT EXISTS health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_version TEXT NOT NULL,
  component_breakdown JSONB,
  PRIMARY KEY (asset_id, computed_at)
);

CREATE INDEX IF NOT EXISTS idx_health_scores_asset_time
  ON health_scores(asset_id, computed_at DESC);
```

#### Diagnostic Events

```sql
CREATE TABLE IF NOT EXISTS diagnostic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state TEXT NOT NULL DEFAULT 'open',
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  telemetry_window_start TIMESTAMPTZ,
  telemetry_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (event_type IN ('thermal', 'electrical', 'mechanical', 'insulation', 'comms')),
  CHECK (state IN ('open', 'ack', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_events_asset
  ON diagnostic_events(asset_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_events_state
  ON diagnostic_events(state, detected_at DESC);
```

#### Downtime Events Extension

```sql
-- Extend downtime_events table
ALTER TABLE downtime_events
  ADD COLUMN IF NOT EXISTS grid_impact_mw NUMERIC,
  ADD COLUMN IF NOT EXISTS protection_trip_code TEXT,
  ADD COLUMN IF NOT EXISTS outage_scope TEXT;

-- Add check constraint for outage_scope
ALTER TABLE downtime_events
  ADD CONSTRAINT chk_outage_scope
  CHECK (outage_scope IN ('bay', 'line', 'transformer', 'substation'));

-- Ensure duration consistency
ALTER TABLE downtime_events
  ADD CONSTRAINT chk_downtime_duration
  CHECK (
    (end_time IS NULL AND duration_minutes IS NULL) OR
    (end_time IS NOT NULL AND start_time < end_time)
  );
```


#### Failure Predictions

```sql
CREATE TABLE IF NOT EXISTS failure_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  prediction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_probability NUMERIC NOT NULL CHECK (failure_probability >= 0 AND failure_probability <= 100),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  time_horizon_days INTEGER NOT NULL CHECK (time_horizon_days IN (7, 30, 90)),
  risk_level TEXT NOT NULL,
  rul_days INTEGER,
  contributing_factors TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_failure_predictions_asset
  ON failure_predictions(asset_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_failure_predictions_risk
  ON failure_predictions(risk_level, prediction_date DESC);
```

#### CBM Triggers

```sql
CREATE TABLE IF NOT EXISTS cbm_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parameter_id UUID NOT NULL REFERENCES telemetry_parameters(id),
  condition_operator TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  recommended_action TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (condition_operator IN ('greater_than', 'less_than', 'equals', 'rate_of_change_exceeds'))
);

CREATE INDEX IF NOT EXISTS idx_cbm_triggers_parameter
  ON cbm_triggers(parameter_id) WHERE is_active = true;
```

#### Maintenance Recommendations

```sql
CREATE TABLE IF NOT EXISTS maintenance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority_score NUMERIC NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
  due_date DATE,
  required_spares UUID[],
  source_trigger_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (recommendation_type IN ('inspection', 'repair', 'replacement', 'calibration', 'cleaning')),
  CHECK (status IN ('open', 'scheduled', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_maintenance_recs_asset
  ON maintenance_recommendations(asset_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_recs_status
  ON maintenance_recommendations(status, due_date);
```

#### Alerts

```sql
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state TEXT NOT NULL DEFAULT 'open',
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  source_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  CHECK (source IN ('telemetry', 'diagnostic', 'prediction', 'manual')),
  CHECK (state IN ('open', 'ack', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_asset
  ON alerts(asset_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity_state
  ON alerts(severity, state, detected_at DESC);
```

#### Alert History

```sql
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert
  ON alert_history(alert_id, changed_at DESC);
```

### Row-Level Security (RLS) Policies

#### Asset Access Policies

```sql
-- Enable RLS on assets table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Read policy: authenticated users can read transmission assets
CREATE POLICY assets_read_policy ON assets
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    sector = 'power_transmission'
  );

-- Write policy: only authorized roles can modify
CREATE POLICY assets_write_policy ON assets
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('apm_admin', 'reliability_engineer') AND
    sector = 'power_transmission'
  );
```

#### Telemetry Access Policies

```sql
-- Enable RLS on telemetry_data
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;

-- Read policy: authenticated users can read telemetry
CREATE POLICY telemetry_read_policy ON telemetry_data
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    asset_id IN (
      SELECT id FROM assets WHERE sector = 'power_transmission'
    )
  );

-- Write policy: system and authorized roles only
CREATE POLICY telemetry_write_policy ON telemetry_data
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('system', 'apm_admin', 'data_ingestion')
  );
```

#### Event and Alert Policies

```sql
-- Diagnostic events: read for all, write for operations roles
ALTER TABLE diagnostic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_events_read_policy ON diagnostic_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY diagnostic_events_write_policy ON diagnostic_events
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('apm_admin', 'operations_engineer', 'reliability_engineer')
  );

-- Similar policies for alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_read_policy ON alerts
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY alerts_write_policy ON alerts
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('apm_admin', 'operations_engineer')
  );
```

### Migration and Seed Pack Structure

Each feature set follows this structure:

```
.kiro/specs/apm-transmission-full/
└── schema_packs/
    ├── apm_tx_fs4_inventory_criticality/
    │   ├── 001_migration.sql
    │   ├── 002_seed.sql
    │   └── 003_validate.sql
    ├── apm_tx_fs1_health_diagnostics/
    │   ├── 001_migration.sql
    │   ├── 002_seed.sql
    │   └── 003_validate.sql
    ├── apm_tx_fs3_performance_utilisation/
    │   ├── 001_migration.sql
    │   ├── 002_seed.sql
    │   └── 003_validate.sql
    ├── apm_tx_fs2_predictive_prescriptive/
    │   ├── 001_migration.sql
    │   ├── 002_seed.sql
    │   └── 003_validate.sql
    └── apm_tx_fs5_alerts_reports/
        ├── 001_migration.sql
        ├── 002_seed.sql
        └── 003_validate.sql
```

#### Migration Script Pattern

```sql
-- 001_migration.sql example
-- Preconditions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    RAISE EXCEPTION 'TimescaleDB extension required';
  END IF;
END $$;

-- Idempotent table creation
CREATE TABLE IF NOT EXISTS asset_relationships (
  -- columns...
);

-- Idempotent enum extension
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'power_transformer'
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'power_transformer';
  END IF;
END $$;

-- Idempotent column addition
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS voltage_kv NUMERIC;

-- Idempotent index creation
CREATE INDEX IF NOT EXISTS idx_assets_sector_type
  ON assets(sector, asset_type);
```

#### Seed Script Pattern

```sql
-- 002_seed.sql example
-- Use natural key upserts (INSERT ... ON CONFLICT)

-- Seed transmission parameters
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role)
VALUES 
  ('top_oil_temp', 'temperature', '°C', 'health_driver'),
  ('winding_hot_spot', 'temperature', '°C', 'health_driver'),
  ('sf6_pressure', 'pressure', 'bar', 'health_driver')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role;

-- Seed assets with natural key
INSERT INTO assets (sector, name, asset_type, location, asset_tag)
VALUES
  ('power_transmission', 'TX-001', 'power_transformer', 'Substation A', 'TX-001')
ON CONFLICT (sector, name, location) DO UPDATE
  SET asset_type = EXCLUDED.asset_type,
      asset_tag = EXCLUDED.asset_tag;
```

#### Validation Script Pattern

```sql
-- 003_validate.sql example
-- All checks should return zero rows on success

-- Check for duplicate natural keys
SELECT sector, name, location, COUNT(*)
FROM assets
WHERE sector = 'power_transmission'
GROUP BY sector, name, location
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Check for orphan relationships
SELECT ar.id, ar.from_asset_id, ar.to_asset_id
FROM asset_relationships ar
LEFT JOIN assets a1 ON ar.from_asset_id = a1.id
LEFT JOIN assets a2 ON ar.to_asset_id = a2.id
WHERE a1.id IS NULL OR a2.id IS NULL;
-- Expected: 0 rows

-- Check parameter mappings exist
SELECT DISTINCT a.asset_type
FROM assets a
WHERE a.sector = 'power_transmission'
  AND NOT EXISTS (
    SELECT 1 FROM asset_parameter_map apm
    WHERE apm.asset_type = a.asset_type
  );
-- Expected: 0 rows

-- Raise exception if any validation fails
DO $$
DECLARE
  validation_failures INTEGER;
BEGIN
  SELECT COUNT(*) INTO validation_failures
  FROM (
    -- Combine all validation queries
    SELECT 1 FROM assets 
    WHERE sector = 'power_transmission'
    GROUP BY sector, name, location
    HAVING COUNT(*) > 1
  ) failures;
  
  IF validation_failures > 0 THEN
    RAISE EXCEPTION 'Validation failed: % issues found', validation_failures;
  END IF;
END $$;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Testing Approach

This APM system will use property-based testing to validate correctness across the five feature sets. Each property represents a universal rule that must hold for all valid inputs, not just specific examples. The properties are organized by feature set and directly trace back to acceptance criteria in the requirements.

### FS4: Asset Inventory & Criticality Properties

#### Property 1: Asset Hierarchy Acyclicity
*For any* asset with a parent_asset_id, following the parent chain should never return to the original asset (no cycles in hierarchy).

**Validates: Requirements 1.3, 1.4**

#### Property 2: Asset Relationship Referential Integrity
*For any* asset relationship, both from_asset_id and to_asset_id must reference existing assets in the assets table.

**Validates: Requirements 1.8**

#### Property 3: Asset Relationship Uniqueness
*For any* two assets and a relation_type, there should be at most one relationship record with that combination of (from_asset_id, to_asset_id, relation_type).

**Validates: Requirements 1.7**

#### Property 4: FMEA RPN Computation
*For any* FMEA entry, the RPN value must equal severity × occurrence × detection.

**Validates: Requirements 3.4**

#### Property 5: FMEA Value Bounds
*For any* FMEA entry, severity, occurrence, and detection values must be integers between 1 and 10 inclusive.

**Validates: Requirements 3.3**

#### Property 6: Spare Part Quantity Non-Negative
*For any* spare part linkage, the quantity_required must be greater than or equal to zero.

**Validates: Requirements 5.7**

#### Property 7: Lifecycle Stage Validity
*For any* lifecycle event, the stage value must be one of the valid lifecycle stages (design, procure, install, commission, operate, maintain, refurbish, retire).

**Validates: Requirements 4.4**

#### Property 8: Criticality Tier Assignment
*For any* transmission asset, the criticality field must be one of: Critical, Important, or Standard.

**Validates: Requirements 2.1, 2.4**

### FS1: Asset Health & Diagnostics Properties

#### Property 9: Telemetry Status Classification
*For any* telemetry data point with thresholds defined, if the value exceeds critical thresholds, status must be Critical; if it exceeds warning thresholds, status must be Warning; otherwise status must be Normal.

**Validates: Requirements 7.3, 7.4, 7.5**

#### Property 10: Health Score Bounds
*For any* computed health score, the score value must be between 0 and 100 inclusive.

**Validates: Requirements 8.1**

#### Property 11: Diagnostic Event State Transitions
*For any* diagnostic event, valid state transitions are: open → ack → closed, and the state can never transition backwards (closed → ack or ack → open).

**Validates: Requirements 9.4, 9.7, 9.8**

#### Property 12: Diagnostic Event Resolution Notes Required
*For any* diagnostic event in closed state, resolution_notes must be non-null and non-empty.

**Validates: Requirements 9.8**

#### Property 13: RCA Event Linkage Validity
*For any* RCA record, the linked event_id must reference an existing diagnostic_event or downtime_event.

**Validates: Requirements 10.3**

#### Property 14: Parameter Mapping Completeness
*For any* transmission asset_type, there must exist at least 10 parameter mappings in asset_parameter_map.

**Validates: Requirements 6.10**

### FS3: Asset Performance & Utilisation Properties

#### Property 15: Downtime Duration Consistency
*For any* downtime event with both start_time and end_time, the computed duration_minutes must equal the difference between end_time and start_time in minutes.

**Validates: Requirements 12.6**

#### Property 16: Downtime Time Ordering
*For any* downtime event with end_time specified, start_time must be strictly before end_time.

**Validates: Requirements 12.5**

#### Property 17: Downtime Non-Overlap
*For any* asset, no two downtime events should have overlapping time periods.

**Validates: Requirements 12.9**

#### Property 18: MTBF Calculation
*For any* reliability metrics record, MTBF should equal total_uptime_hours / failure_count (when failure_count > 0).

**Validates: Requirements 13.1**

#### Property 19: Availability Calculation
*For any* reliability metrics record, availability_percent should equal (uptime_hours / total_hours) × 100.

**Validates: Requirements 13.3**

#### Property 20: Load Factor Calculation
*For any* utilisation metrics record, load_factor should equal (average_load / rated_capacity) × 100.

**Validates: Requirements 14.2**

#### Property 21: Thermal Headroom Calculation
*For any* utilisation metrics for transformers or lines, thermal_headroom should equal ((rated_capacity - current_load) / rated_capacity) × 100.

**Validates: Requirements 14.3**

#### Property 22: Reliability Period Non-Overlap
*For any* asset, no two reliability_metrics records should have overlapping time periods (period_start to period_end).

**Validates: Requirements 13.6**

### FS2: Predictive & Prescriptive Maintenance Properties

#### Property 23: Failure Probability Bounds
*For any* failure prediction, failure_probability must be between 0 and 100 inclusive.

**Validates: Requirements 16.1**

#### Property 24: Prediction Confidence Bounds
*For any* failure prediction, confidence must be between 0 and 100 inclusive.

**Validates: Requirements 16.1**

#### Property 25: Prediction Horizon Validity
*For any* failure prediction, time_horizon_days must be one of: 7, 30, or 90.

**Validates: Requirements 16.2**

#### Property 26: Risk Level Classification
*For any* failure prediction, risk_level must be one of: low, medium, high, or critical.

**Validates: Requirements 16.3**

#### Property 27: CBM Trigger Condition Operator Validity
*For any* CBM trigger, condition_operator must be one of: greater_than, less_than, equals, or rate_of_change_exceeds.

**Validates: Requirements 17.2**

#### Property 28: Recommendation Priority Score Bounds
*For any* maintenance recommendation, priority_score must be between 0 and 100 inclusive.

**Validates: Requirements 18.3**

#### Property 29: Recommendation Asset Validity
*For any* maintenance recommendation, the asset_id must reference an existing asset.

**Validates: Requirements 18.5**

#### Property 30: Recommendation Spare Parts Validity
*For any* maintenance recommendation with required_spares, all spare part IDs in the array must reference existing spare parts.

**Validates: Requirements 18.5**

#### Property 31: Recommendation Closure Notes Required
*For any* maintenance recommendation in completed or cancelled status, completion_notes must be non-null and non-empty.

**Validates: Requirements 18.8**

### FS5: Alerts, Reports & Visualisation Properties

#### Property 32: Alert Severity Validity
*For any* alert, severity must be one of: info, warning, critical, or emergency.

**Validates: Requirements 20.2**

#### Property 33: Alert Source Validity
*For any* alert, source must be one of: telemetry, diagnostic, prediction, or manual.

**Validates: Requirements 20.1**

#### Property 34: Alert State Transitions
*For any* alert, valid state transitions are: open → ack → closed, and the state can never transition backwards.

**Validates: Requirements 20.4, 20.7, 20.8**

#### Property 35: Alert Closure Notes Required
*For any* alert in closed state, resolution_notes must be non-null and non-empty.

**Validates: Requirements 20.8**

#### Property 36: Alert History State Transition Recording
*For any* alert state change, a corresponding alert_history record must be created with the previous_state, new_state, and changed_by.

**Validates: Requirements 21.5**

#### Property 37: Export Job State Validity
*For any* export job, status must be one of: queued, processing, completed, or failed.

**Validates: Requirements 24.4**

#### Property 38: Dashboard Widget Query Validity
*For any* dashboard with widgets, all widget query references must point to valid, existing query templates.

**Validates: Requirements 22.7**

### Cross-Cutting Properties

#### Property 39: Sector Enforcement for Transmission Assets
*For any* asset with a transmission asset_type (power_transformer, circuit_breaker, etc.), the sector field must equal 'power_transmission'.

**Validates: Requirements 1.2, 25.7**

#### Property 40: Natural Key Uniqueness - Assets
*For any* two assets with the same sector, name, and location, they must be the same asset (same id).

**Validates: Requirements 27.2**

#### Property 41: Natural Key Uniqueness - FMEA
*For any* two FMEA entries with the same asset_type and failure_mode, they must be the same entry (same id).

**Validates: Requirements 3.2**

#### Property 42: Foreign Key Referential Integrity
*For any* record with a foreign key reference (asset_id, parameter_id, etc.), the referenced record must exist in the target table.

**Validates: Requirements 27.3**

#### Property 43: Timestamp Ordering in Time Series
*For any* time series query result (telemetry, events, history), records must be ordered chronologically by timestamp.

**Validates: Requirements 4.6, 7.7, 21.3**

#### Property 44: Pagination Consistency
*For any* paginated query, the union of all pages must equal the complete result set with no duplicates or omissions.

**Validates: Requirements 1.10, 28.6**

#### Property 45: RLS Sector Filtering
*For any* authenticated user querying assets, only assets matching the user's authorized sectors should be returned.

**Validates: Requirements 25.2, 25.5**


## Error Handling

### Error Categories

The APM system handles errors across four main categories:

1. **Validation Errors**: Invalid input data, constraint violations, business rule failures
2. **Authorization Errors**: RLS policy violations, insufficient permissions
3. **System Errors**: Database connectivity, query timeouts, resource exhaustion
4. **Integration Errors**: External system failures, data ingestion issues

### Error Handling Strategy

#### Client-Side Error Handling

```typescript
interface APMError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Example error codes
const ErrorCodes = {
  // Validation
  INVALID_ASSET_TYPE: 'APM_001',
  INVALID_LIFECYCLE_STAGE: 'APM_002',
  DUPLICATE_NATURAL_KEY: 'APM_003',
  FOREIGN_KEY_VIOLATION: 'APM_004',
  CONSTRAINT_VIOLATION: 'APM_005',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'APM_101',
  SECTOR_ACCESS_DENIED: 'APM_102',
  
  // System
  DATABASE_ERROR: 'APM_201',
  QUERY_TIMEOUT: 'APM_202',
  RESOURCE_NOT_FOUND: 'APM_203',
  
  // Integration
  TELEMETRY_INGESTION_FAILED: 'APM_301',
  EXTERNAL_SYSTEM_UNAVAILABLE: 'APM_302',
} as const;

// Error handling hook
function useAPMQuery<T>(queryFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<APMError | null>(null);
  const [loading, setLoading] = useState(false);
  
  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      const apmError = normalizeError(err);
      setError(apmError);
      logError(apmError);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, error, loading, execute };
}
```

#### Server-Side Error Handling

```sql
-- Example: Validation function with error handling
CREATE OR REPLACE FUNCTION validate_asset_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for circular references
  IF EXISTS (
    WITH RECURSIVE hierarchy AS (
      SELECT id, parent_asset_id, 1 as depth
      FROM assets
      WHERE id = NEW.id
      
      UNION ALL
      
      SELECT a.id, a.parent_asset_id, h.depth + 1
      FROM assets a
      JOIN hierarchy h ON a.id = h.parent_asset_id
      WHERE h.depth < 100
    )
    SELECT 1 FROM hierarchy WHERE parent_asset_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Circular reference detected in asset hierarchy'
      USING ERRCODE = 'APM_003',
            HINT = 'Asset cannot be its own ancestor';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_asset_hierarchy
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION validate_asset_hierarchy();
```

### UI Error States

#### Loading State
- Display skeleton loaders for lists and cards
- Show spinner for long-running operations
- Disable interactive elements during mutations

#### Empty State
- Display friendly message when no data exists
- Provide action button to create first record
- Show relevant help text or documentation links

#### Error State
- Display error message with error code
- Provide actionable recovery steps
- Offer retry button for transient failures
- Log errors for debugging

```typescript
// Example error state component
function ErrorState({ error, onRetry }: { error: APMError; onRetry: () => void }) {
  return (
    <div className="error-state">
      <AlertCircle className="error-icon" />
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <p className="error-code">Error Code: {error.code}</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  );
}
```

### Graceful Degradation

- **Telemetry Unavailable**: Show last known values with timestamp
- **Health Score Computation Failed**: Display raw parameter values
- **Prediction Service Down**: Fall back to threshold-based alerts
- **Export Service Busy**: Queue export job for later processing

## Testing Strategy

### Dual Testing Approach

The APM system employs both unit testing and property-based testing as complementary strategies:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

#### Framework Selection

- **Language**: TypeScript
- **Library**: fast-check (https://github.com/dubzzz/fast-check)
- **Minimum Iterations**: 100 runs per property test
- **Seed Management**: Deterministic seeds for reproducibility

#### Property Test Structure

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('APM Transmission - Property Tests', () => {
  describe('FS4: Asset Inventory & Criticality', () => {
    it('Property 1: Asset Hierarchy Acyclicity', () => {
      // Feature: apm-transmission-full, Property 1: Asset Hierarchy Acyclicity
      fc.assert(
        fc.property(
          fc.array(assetArbitrary(), { minLength: 1, maxLength: 50 }),
          (assets) => {
            // Build hierarchy
            const hierarchy = buildHierarchy(assets);
            
            // Check for cycles
            for (const asset of assets) {
              const visited = new Set<string>();
              let current = asset.parent_asset_id;
              
              while (current) {
                if (visited.has(current)) {
                  return false; // Cycle detected
                }
                visited.add(current);
                const parent = assets.find(a => a.id === current);
                current = parent?.parent_asset_id;
              }
            }
            
            return true; // No cycles
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('Property 4: FMEA RPN Computation', () => {
      // Feature: apm-transmission-full, Property 4: FMEA RPN Computation
      fc.assert(
        fc.property(
          fmeaEntryArbitrary(),
          (fmea) => {
            const expectedRPN = fmea.severity * fmea.occurrence * fmea.detection;
            return fmea.rpn === expectedRPN;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('FS1: Asset Health & Diagnostics', () => {
    it('Property 9: Telemetry Status Classification', () => {
      // Feature: apm-transmission-full, Property 9: Telemetry Status Classification
      fc.assert(
        fc.property(
          telemetryDataPointArbitrary(),
          parameterWithThresholdsArbitrary(),
          (dataPoint, parameter) => {
            const status = classifyTelemetryStatus(dataPoint.value, parameter);
            
            if (parameter.critical_max && dataPoint.value > parameter.critical_max) {
              return status === 'Critical';
            }
            if (parameter.critical_min && dataPoint.value < parameter.critical_min) {
              return status === 'Critical';
            }
            if (parameter.warning_max && dataPoint.value > parameter.warning_max) {
              return status === 'Warning';
            }
            if (parameter.warning_min && dataPoint.value < parameter.warning_min) {
              return status === 'Warning';
            }
            return status === 'Normal';
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
```

#### Custom Arbitraries

```typescript
// Asset arbitrary generator
function assetArbitrary(): fc.Arbitrary<Asset> {
  return fc.record({
    id: fc.uuid(),
    sector: fc.constant('power_transmission'),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    asset_type: fc.constantFrom(
      'power_transformer',
      'circuit_breaker',
      'transmission_line',
      'protection_relay'
    ),
    location: fc.string({ minLength: 1, maxLength: 100 }),
    operational_status: fc.constantFrom('online', 'offline', 'maintenance', 'pending'),
    criticality: fc.constantFrom('Critical', 'Important', 'Standard'),
    lifecycle_stage: fc.constantFrom(
      'design', 'procure', 'install', 'commission',
      'operate', 'maintain', 'refurbish', 'retire'
    ),
    parent_asset_id: fc.option(fc.uuid(), { nil: null }),
    voltage_kv: fc.option(fc.double({ min: 0, max: 765 }), { nil: null }),
    metadata: fc.dictionary(fc.string(), fc.anything()),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });
}

// FMEA entry arbitrary generator
function fmeaEntryArbitrary(): fc.Arbitrary<FMEAEntry> {
  return fc.record({
    id: fc.uuid(),
    asset_type: fc.constantFrom('power_transformer', 'circuit_breaker'),
    failure_mode: fc.string({ minLength: 1, maxLength: 100 }),
    severity: fc.integer({ min: 1, max: 10 }),
    occurrence: fc.integer({ min: 1, max: 10 }),
    detection: fc.integer({ min: 1, max: 10 }),
  }).map(entry => ({
    ...entry,
    rpn: entry.severity * entry.occurrence * entry.detection,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

// Telemetry data point arbitrary
function telemetryDataPointArbitrary(): fc.Arbitrary<TelemetryDataPoint> {
  return fc.record({
    timestamp: fc.date().map(d => d.toISOString()),
    asset_id: fc.uuid(),
    parameter_id: fc.uuid(),
    value: fc.double({ min: -100, max: 500 }),
    unit: fc.constantFrom('°C', 'bar', 'A', 'V', '%'),
    quality_score: fc.option(fc.double({ min: 0, max: 1 }), { nil: null }),
  });
}
```

### Unit Testing Strategy

#### Test Organization

```
src/
├── lib/
│   ├── data/
│   │   ├── DataProvider.ts
│   │   └── __tests__/
│   │       ├── DataProvider.test.ts
│   │       ├── asset-queries.test.ts
│   │       └── telemetry-queries.test.ts
│   ├── apm/
│   │   ├── health-scoring.ts
│   │   ├── reliability-metrics.ts
│   │   └── __tests__/
│   │       ├── health-scoring.test.ts
│   │       └── reliability-metrics.test.ts
├── components/
│   ├── apm/
│   │   ├── AssetList.tsx
│   │   ├── HealthScoreCard.tsx
│   │   └── __tests__/
│   │       ├── AssetList.test.tsx
│   │       └── HealthScoreCard.test.tsx
```

#### Unit Test Examples

```typescript
describe('Health Score Calculation', () => {
  it('should compute health score within 0-100 range', () => {
    const telemetry = {
      top_oil_temp: 75,
      winding_hot_spot: 85,
      sf6_pressure: 5.5,
    };
    const model = {
      weights: {
        top_oil_temp: 0.3,
        winding_hot_spot: 0.4,
        sf6_pressure: 0.3,
      },
    };
    
    const score = computeHealthScore(telemetry, model);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  
  it('should handle missing telemetry gracefully', () => {
    const telemetry = {
      top_oil_temp: 75,
      // winding_hot_spot missing
    };
    const model = {
      weights: {
        top_oil_temp: 0.5,
        winding_hot_spot: 0.5,
      },
    };
    
    const score = computeHealthScore(telemetry, model);
    
    expect(score).toBeDefined();
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('Asset List Component', () => {
  it('should display loading state while fetching', () => {
    const { getByTestId } = render(<AssetList loading={true} assets={[]} />);
    expect(getByTestId('loading-skeleton')).toBeInTheDocument();
  });
  
  it('should display empty state when no assets', () => {
    const { getByText } = render(<AssetList loading={false} assets={[]} />);
    expect(getByText(/no assets found/i)).toBeInTheDocument();
  });
  
  it('should render asset list with correct columns', () => {
    const assets = [
      {
        id: '1',
        name: 'TX-001',
        asset_type: 'power_transformer',
        location: 'Substation A',
        operational_status: 'online',
      },
    ];
    
    const { getByText } = render(<AssetList loading={false} assets={assets} />);
    
    expect(getByText('TX-001')).toBeInTheDocument();
    expect(getByText('Substation A')).toBeInTheDocument();
  });
});
```

### Integration Testing

#### Database Integration Tests

```typescript
describe('Asset Queries Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should retrieve assets with relationships', async () => {
    const asset = await getAssetById('test-transformer-1');
    
    expect(asset).toBeDefined();
    expect(asset.relationships).toHaveLength(2);
    expect(asset.children).toHaveLength(0);
  });
  
  it('should enforce RLS policies', async () => {
    const userContext = { sector: 'power_transmission', role: 'viewer' };
    const assets = await listAssets({}, userContext);
    
    // Should only see transmission assets
    expect(assets.every(a => a.sector === 'power_transmission')).toBe(true);
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% line coverage for business logic
- **Property Test Coverage**: All 45 correctness properties implemented
- **Integration Test Coverage**: All API query contracts tested
- **UI Component Coverage**: All nLVE pages tested for loading/empty/error states

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: APM Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run property tests
        run: npm run test:property
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Performance Testing

- **Load Testing**: Simulate 100 concurrent users querying assets and telemetry
- **Query Performance**: Validate 300ms target for asset list queries
- **Telemetry Performance**: Validate acceptable performance for 30-day windows
- **Stress Testing**: Test system behavior under resource constraints


## Adherence to Existing Sector/Subsector Filtering

### Overview

The APM system integrates with the existing tenant-based data isolation system that already provides sector and subsector filtering. The system respects the existing filtering logic without duplicating or overriding it.

### Existing Infrastructure

The APM system leverages the existing Supabase schema structure that already implements tenant-based filtering:

```typescript
// Existing tenant structure (already implemented)
interface Tenant {
  id: string;
  name: string;           // e.g., "DEWA - Transmission"
  sector: string;         // e.g., "power"
  subsector: string;      // e.g., "transmission"
  scenario_tag: string;   // e.g., "power_transmission_demo_v1"
}

// Existing asset structure with tenant relationship (already implemented)
interface ExistingAsset {
  id: string;
  tenant_id: string;      // Links to tenant (filtering already enforced)
  site_id: string;
  asset_type_id: string;
  name: string;
  status: string;         // 'online', 'offline', 'maintenance'
  criticality: string;    // 'low', 'medium', 'high', 'critical'
  parent_asset_id?: string;
  properties: Record<string, unknown>;
}
```

### Integration Strategy

#### 1. Respect Existing Tenant Filtering

All APM queries must use the existing tenant context that is already available:

```typescript
// Use existing tenant context (already available in the system)
const useAPMQueries = () => {
  const { tenantId } = useExistingTenantContext(); // Already implemented
  
  // All APM queries automatically respect tenant isolation
  const getTransmissionAssets = () => {
    return supabase
      .from('assets')
      .select(`
        *,
        asset_types(*),
        sites(*),
        tenants!inner(*)
      `)
      .eq('tenant_id', tenantId); // Existing filtering
  };
  
  return { getTransmissionAssets };
};
```

#### 2. Work with Existing Asset Types

The system maps to existing asset type codes without modification:

```typescript
// Use existing asset type codes (already in database)
const EXISTING_TRANSMISSION_ASSET_TYPES = [
  'TRANSFORMER',  // Power Transformer
  'BREAKER',      // Circuit Breaker  
  'BAY',          // Switchgear Bay
  'METER',        // Energy Meter
] as const;

// Filter by existing asset types
const getTransmissionAssetsByType = async () => {
  return supabase
    .from('assets')
    .select(`
      *,
      asset_types!inner(*)
    `)
    .in('asset_types.code', EXISTING_TRANSMISSION_ASSET_TYPES);
    // tenant_id filtering is already handled by RLS
};
```

#### 3. Leverage Existing Grid Topology

```typescript
// Use existing grid topology (already tenant-filtered)
const getExistingGridTopology = async () => {
  const [nodes, lines] = await Promise.all([
    supabase.from('grid_nodes').select('*'), // Already tenant-filtered
    supabase.from('grid_lines').select(`
      *,
      from_node:grid_nodes!from_node_id(*),
      to_node:grid_nodes!to_node_id(*)
    `) // Already tenant-filtered
  ]);
  
  return { nodes, lines };
};
```

#### 4. Respect Existing Telemetry Structure

```typescript
// Use existing telemetry structure (already tenant-filtered)
const getExistingTelemetryData = async (assetIds: string[]) => {
  return supabase
    .from('telemetry_points')
    .select(`
      *,
      assets!inner(*),
      tags(*)
    `)
    .in('asset_id', assetIds);
    // tenant_id filtering already enforced through asset relationship
};
```

### Implementation Guidelines

#### 1. No New Filtering Logic

- **DO NOT** create new sector/subsector filtering components
- **DO NOT** duplicate existing tenant context logic  
- **DO** use existing tenant context and RLS policies
- **DO** respect existing data isolation boundaries

#### 2. Query Pattern Adherence

```typescript
// CORRECT: Use existing tenant context
const useAssets = () => {
  // Existing tenant context is automatically applied
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => supabase.from('assets').select('*')
    // RLS automatically filters by tenant_id
  });
};

// INCORRECT: Don't add manual tenant filtering
const useAssets = () => {
  const { tenantId } = useContext(); // Don't do this
  return useQuery({
    queryKey: ['assets', tenantId],
    queryFn: () => supabase.from('assets').select('*').eq('tenant_id', tenantId)
    // This duplicates existing RLS logic
  });
};
```

#### 3. Empty State Handling

```typescript
// Handle cases where tenant has no transmission data
const TransmissionDataCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: assets, isLoading } = useAssets();
  
  if (isLoading) return <LoadingState />;
  
  if (!assets || assets.length === 0) {
    return (
      <EmptyState
        title="No Transmission Assets Found"
        description="This organization doesn't have transmission assets configured."
        action={{
          label: "Contact Administrator",
          onClick: () => window.location.href = "mailto:admin@example.com"
        }}
      />
    );
  }
  
  return <>{children}</>;
};
```

### Validation of Existing Data

The APM system should validate that it's working with the expected transmission tenant:

```typescript
// Validate we're working with transmission data
const validateTransmissionTenant = async () => {
  const tenant = await getCurrentTenant(); // Existing function
  
  if (tenant.sector !== 'power' || tenant.subsector !== 'transmission') {
    throw new Error('APM Transmission features require power/transmission sector');
  }
  
  return tenant;
};
```

### Migration Considerations

Since filtering already exists, the APM implementation requires:

1. **No schema changes** for filtering - use existing tenant structure
2. **No new RLS policies** - respect existing policies
3. **No new context providers** - use existing tenant context
4. **Query enhancements only** - add APM-specific queries that respect existing filtering

This approach ensures the APM system integrates seamlessly with the existing filtering infrastructure without duplication or conflicts.