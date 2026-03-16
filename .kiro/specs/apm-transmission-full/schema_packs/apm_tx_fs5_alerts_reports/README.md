# APM Transmission FS5: Alerts, Reports & Visualisation Schema Pack

## Overview

This schema pack implements Feature Set 5 (FS5) for the APM Power Transmission system, providing comprehensive capabilities for real-time alerts, alert history tracking, custom dashboards, automated report generation, and data export functionality.

## Feature Set Components

### 1. Real-Time Alert Generation (Requirements 20.1-20.9)
- Alert creation from telemetry violations, diagnostic events, and failure predictions
- Multi-level severity classification (info, warning, critical, emergency)
- Alert state management (open, acknowledged, closed)
- Source tracking and event linkage

### 2. Alert Timeline and History (Requirements 21.1-21.6)
- Unified timeline view of alerts, diagnostic events, and downtime
- Complete audit trail of alert state transitions
- User action tracking for accountability

### 3. Custom Dashboard Builder (Requirements 22.1-22.7)
- User-defined dashboard configurations
- Multiple widget types (KPI cards, charts, tables, status grids, alert lists)
- Saved query templates and layout persistence
- Dashboard sharing capabilities

### 4. Automated Report Generation (Requirements 23.1-23.7)
- Scheduled report execution
- Multiple report types (reliability, maintenance, health, performance)
- Report run tracking and status monitoring
- Configurable asset scope and output formats

### 5. Data Export Center (Requirements 24.1-24.8)
- Export job management with status tracking
- Multiple format support (CSV, JSON, Excel)
- Asynchronous processing for large exports
- Access control enforcement during exports

## Schema Tables

### alerts
Stores real-time alerts from various sources with severity classification and state management.

**Key Fields:**
- `asset_id`: Reference to the affected asset
- `severity`: Alert severity level (info, warning, critical, emergency)
- `source`: Alert source (telemetry, diagnostic, prediction, manual)
- `state`: Current alert state (open, ack, closed)
- `source_event_id`: Link to originating event

### alert_history
Tracks all state transitions and user actions on alerts for audit purposes.

**Key Fields:**
- `alert_id`: Reference to the alert
- `previous_state`: State before transition
- `new_state`: State after transition
- `changed_by`: User who made the change

### dashboards
Stores custom dashboard definitions with layout configurations.

**Key Fields:**
- `name`: Dashboard name
- `owner`: Dashboard owner/creator
- `layout_config`: JSON configuration for layout

### dashboard_widgets
Stores widget configurations for dashboards.

**Key Fields:**
- `dashboard_id`: Reference to parent dashboard
- `widget_type`: Type of widget (KPI_card, time_series_chart, table, status_grid, alert_list)
- `query_template_ref`: Reference to saved query
- `position`: JSON configuration for widget position
- `config`: JSON configuration for widget settings

### report_runs
Tracks automated report execution history and metadata.

**Key Fields:**
- `report_type`: Type of report (reliability_summary, maintenance_backlog, asset_health_status, performance_benchmarking)
- `status`: Execution status (queued, processing, completed, failed)
- `output_location`: Path to generated report
- `asset_scope`: JSON defining included assets

### export_jobs
Tracks data export jobs with status and output location.

**Key Fields:**
- `user_id`: User who requested the export
- `query_reference`: Reference to data being exported
- `format`: Export format (CSV, JSON, Excel)
- `status`: Job status (queued, processing, completed, failed)

## Dependencies

This schema pack requires the following tables from previous feature sets:
- **FS4**: `assets`, `asset_relationships`
- **FS1**: `diagnostic_events`, `telemetry_data`, `telemetry_parameters`
- **FS2**: `failure_predictions`, `maintenance_recommendations`
- **FS3**: `downtime_events`, `reliability_metrics`

## Execution Instructions

### 1. Run Migration
```bash
psql -h <host> -U <user> -d <database> -f 001_migration.sql
```

### 2. Run Seed Script
```bash
psql -h <host> -U <user> -d <database> -f 002_seed.sql
```

### 3. Run Validation
```bash
psql -h <host> -U <user> -d <database> -f 003_validate.sql
```

## Validation Checks

The validation script performs the following checks:
1. Alert severity and source values are valid
2. Closed alerts have resolution notes
3. Acknowledged alerts have required fields
4. Alert history references valid alerts
5. Dashboard widgets reference valid dashboards
6. Dashboard widget types are valid
7. Report run types and statuses are valid
8. Completed report runs have output locations
9. Export job formats and statuses are valid
10. Completed export jobs have required fields
11. Alerts reference existing assets

All validation queries should return 0 rows for a successful validation.

## Idempotency

All scripts in this schema pack are idempotent and can be safely executed multiple times:
- Migration uses `IF NOT EXISTS` clauses
- Seed script uses placeholder logic (to be implemented with actual data)
- Validation script only reads data

## Notes

- The seed script currently contains placeholders and will be populated with actual sample data during implementation
- Alert deduplication logic (Requirement 20.9) will be implemented at the application layer
- Dashboard sharing permissions will be enforced through RLS policies
- Export jobs will process asynchronously for large datasets (Requirement 24.8)
