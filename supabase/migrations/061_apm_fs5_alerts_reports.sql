-- ============================================================================
-- APM Transmission FS5: Alerts, Reports & Visualisation - Migration Script
-- ============================================================================
-- Feature Set: FS5 - Alerts, Reports & Visualisation
-- Purpose: Create schema for real-time alerts, alert history, custom dashboards,
--          automated reports, and data export capabilities
-- Requirements: 20.1-20.9, 21.1-21.6, 22.1-22.7, 23.1-23.7, 24.1-24.8
-- Dependencies: Requires FS1, FS2, FS3, FS4 tables (assets, diagnostic_events,
--               failure_predictions, telemetry_data)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: apm_alerts
-- Purpose: Store real-time APM alerts from telemetry violations, diagnostic events,
--          and failure predictions
-- Requirements: 20.1-20.9
-- Note: Renamed from 'alerts' to 'apm_alerts' to avoid conflict with existing alerts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS apm_alerts (
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
  
  -- Constraints
  CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  CHECK (source IN ('telemetry', 'diagnostic', 'prediction', 'manual')),
  CHECK (state IN ('open', 'ack', 'closed'))
);

-- Indexes for alert queries
CREATE INDEX IF NOT EXISTS idx_apm_alerts_asset_detected
  ON apm_alerts(asset_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_apm_alerts_severity_state_detected
  ON apm_alerts(severity, state, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_apm_alerts_state_detected
  ON apm_alerts(state, detected_at DESC);

COMMENT ON TABLE apm_alerts IS 'Real-time APM alerts from telemetry violations, diagnostic events, and failure predictions';
COMMENT ON COLUMN apm_alerts.severity IS 'Alert severity: info, warning, critical, emergency';
COMMENT ON COLUMN apm_alerts.source IS 'Alert source: telemetry, diagnostic, prediction, manual';
COMMENT ON COLUMN apm_alerts.state IS 'Alert state: open, ack (acknowledged), closed';

-- ============================================================================
-- Table: apm_alert_history
-- Purpose: Track APM alert state transitions and user actions for audit trail
-- Requirements: 21.4, 21.5, 21.6
-- ============================================================================

CREATE TABLE IF NOT EXISTS apm_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES apm_alerts(id) ON DELETE CASCADE,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  -- Constraints
  CHECK (previous_state IN ('open', 'ack', 'closed')),
  CHECK (new_state IN ('open', 'ack', 'closed'))
);

-- Index for alert history queries
CREATE INDEX IF NOT EXISTS idx_apm_alert_history_alert_changed
  ON apm_alert_history(alert_id, changed_at DESC);

COMMENT ON TABLE apm_alert_history IS 'Audit trail of APM alert state transitions and user actions';

-- ============================================================================
-- Table: dashboards
-- Purpose: Store custom dashboard definitions with layout configurations
-- Requirements: 22.1, 22.5
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  layout_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_dashboards_owner
  ON dashboards(owner);

COMMENT ON TABLE dashboards IS 'Custom dashboard definitions with saved layouts';
COMMENT ON COLUMN dashboards.layout_config IS 'JSON configuration for dashboard layout and settings';

-- ============================================================================
-- Table: dashboard_widgets
-- Purpose: Store widget configurations for dashboards
-- Requirements: 22.2, 22.4
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  query_template_ref TEXT,
  position JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (widget_type IN ('KPI_card', 'time_series_chart', 'table', 'status_grid', 'alert_list'))
);

-- Index for widget queries
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard
  ON dashboard_widgets(dashboard_id);

COMMENT ON TABLE dashboard_widgets IS 'Widget configurations for custom dashboards';
COMMENT ON COLUMN dashboard_widgets.widget_type IS 'Widget type: KPI_card, time_series_chart, table, status_grid, alert_list';
COMMENT ON COLUMN dashboard_widgets.query_template_ref IS 'Reference to saved query template';
COMMENT ON COLUMN dashboard_widgets.position IS 'JSON configuration for widget position and size';
COMMENT ON COLUMN dashboard_widgets.config IS 'JSON configuration for widget-specific settings';

-- ============================================================================
-- Table: report_runs
-- Purpose: Track automated report execution history
-- Requirements: 23.1, 23.3, 23.4
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'queued',
  output_location TEXT,
  asset_scope JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (report_type IN ('reliability_summary', 'maintenance_backlog', 'asset_health_status', 'performance_benchmarking')),
  CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

-- Index for report run queries
CREATE INDEX IF NOT EXISTS idx_report_runs_created_by_execution
  ON report_runs(created_by, execution_time DESC);

CREATE INDEX IF NOT EXISTS idx_report_runs_type_execution
  ON report_runs(report_type, execution_time DESC);

COMMENT ON TABLE report_runs IS 'Automated report execution history and metadata';
COMMENT ON COLUMN report_runs.report_type IS 'Report type: reliability_summary, maintenance_backlog, asset_health_status, performance_benchmarking';
COMMENT ON COLUMN report_runs.status IS 'Execution status: queued, processing, completed, failed';
COMMENT ON COLUMN report_runs.asset_scope IS 'JSON configuration defining which assets are included in the report';

-- ============================================================================
-- Table: export_jobs
-- Purpose: Track data export jobs with status and output location
-- Requirements: 24.2, 24.3, 24.4, 24.5
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query_reference TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  output_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (format IN ('CSV', 'JSON', 'Excel')),
  CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

-- Index for export job queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_created
  ON export_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_jobs_status
  ON export_jobs(status, created_at DESC);

COMMENT ON TABLE export_jobs IS 'Data export job tracking with status and output location';
COMMENT ON COLUMN export_jobs.format IS 'Export format: CSV, JSON, Excel';
COMMENT ON COLUMN export_jobs.status IS 'Job status: queued, processing, completed, failed';
COMMENT ON COLUMN export_jobs.query_reference IS 'Reference to the query or data set being exported';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify all tables were created
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('apm_alerts'),
      ('apm_alert_history'),
      ('dashboards'),
      ('dashboard_widgets'),
      ('report_runs'),
      ('export_jobs')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = expected.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Migration incomplete. Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'FS5 migration completed successfully. All tables created.';
  END IF;
END $$;
