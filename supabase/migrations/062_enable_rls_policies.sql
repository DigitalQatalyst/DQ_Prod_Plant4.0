-- ============================================================================
-- Enable Row Level Security (RLS) Policies for APM Transmission
-- ============================================================================
-- This migration enables RLS on all APM tables and creates appropriate
-- read and write policies based on user roles and authentication status.
--
-- Requirements: 25.1-25.8
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Enable RLS on Core Tables
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Enable RLS on Telemetry Tables
-- ============================================================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Enable RLS on Grid Topology Tables
-- ============================================================================

ALTER TABLE grid_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_asset_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Enable RLS on Operational Data
-- ============================================================================

ALTER TABLE operational_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Enable RLS on FS4: Asset Inventory & Criticality Tables
-- ============================================================================

ALTER TABLE asset_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_criticality_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_spare_parts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Enable RLS on FS1: Health & Diagnostics Tables
-- ============================================================================

ALTER TABLE asset_parameter_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rca_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Enable RLS on FS3: Performance & Utilisation Tables
-- ============================================================================

ALTER TABLE reliability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Enable RLS on FS2: Predictive & Prescriptive Maintenance Tables
-- ============================================================================

ALTER TABLE failure_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbm_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scoring_model ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. Enable RLS on FS5: Alerts, Reports & Visualisation Tables
-- ============================================================================

ALTER TABLE apm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE apm_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. Create Read Policies (Authenticated Users)
-- ============================================================================
-- Requirements: 25.2, 25.3
-- All authenticated users can read data

-- Core tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Allow authenticated read on tenants'
  ) THEN
    CREATE POLICY "Allow authenticated read on tenants"
      ON tenants FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'Allow authenticated read on sites'
  ) THEN
    CREATE POLICY "Allow authenticated read on sites"
      ON sites FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_types' AND policyname = 'Allow authenticated read on asset_types'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_types"
      ON asset_types FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Allow authenticated read on assets'
  ) THEN
    CREATE POLICY "Allow authenticated read on assets"
      ON assets FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Allow authenticated read on alerts'
  ) THEN
    CREATE POLICY "Allow authenticated read on alerts"
      ON alerts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Telemetry tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Allow authenticated read on tags'
  ) THEN
    CREATE POLICY "Allow authenticated read on tags"
      ON tags FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_points' AND policyname = 'Allow authenticated read on telemetry_points'
  ) THEN
    CREATE POLICY "Allow authenticated read on telemetry_points"
      ON telemetry_points FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_parameters' AND policyname = 'Allow authenticated read on telemetry_parameters'
  ) THEN
    CREATE POLICY "Allow authenticated read on telemetry_parameters"
      ON telemetry_parameters FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_data' AND policyname = 'Allow authenticated read on telemetry_data'
  ) THEN
    CREATE POLICY "Allow authenticated read on telemetry_data"
      ON telemetry_data FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Grid topology tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grid_nodes' AND policyname = 'Allow authenticated read on grid_nodes'
  ) THEN
    CREATE POLICY "Allow authenticated read on grid_nodes"
      ON grid_nodes FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grid_lines' AND policyname = 'Allow authenticated read on grid_lines'
  ) THEN
    CREATE POLICY "Allow authenticated read on grid_lines"
      ON grid_lines FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grid_asset_links' AND policyname = 'Allow authenticated read on grid_asset_links'
  ) THEN
    CREATE POLICY "Allow authenticated read on grid_asset_links"
      ON grid_asset_links FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Operational data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operational_data' AND policyname = 'Allow authenticated read on operational_data'
  ) THEN
    CREATE POLICY "Allow authenticated read on operational_data"
      ON operational_data FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- FS4 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_relationships' AND policyname = 'Allow authenticated read on asset_relationships'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_relationships"
      ON asset_relationships FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_lifecycle_events' AND policyname = 'Allow authenticated read on asset_lifecycle_events'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_lifecycle_events"
      ON asset_lifecycle_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_criticality_model' AND policyname = 'Allow authenticated read on asset_criticality_model'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_criticality_model"
      ON asset_criticality_model FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fmea_entries' AND policyname = 'Allow authenticated read on fmea_entries'
  ) THEN
    CREATE POLICY "Allow authenticated read on fmea_entries"
      ON fmea_entries FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts' AND policyname = 'Allow authenticated read on spare_parts'
  ) THEN
    CREATE POLICY "Allow authenticated read on spare_parts"
      ON spare_parts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_spare_parts' AND policyname = 'Allow authenticated read on asset_spare_parts'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_spare_parts"
      ON asset_spare_parts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- FS1 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_parameter_map' AND policyname = 'Allow authenticated read on asset_parameter_map'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_parameter_map"
      ON asset_parameter_map FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'health_models' AND policyname = 'Allow authenticated read on health_models'
  ) THEN
    CREATE POLICY "Allow authenticated read on health_models"
      ON health_models FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'health_scores' AND policyname = 'Allow authenticated read on health_scores'
  ) THEN
    CREATE POLICY "Allow authenticated read on health_scores"
      ON health_scores FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diagnostic_events' AND policyname = 'Allow authenticated read on diagnostic_events'
  ) THEN
    CREATE POLICY "Allow authenticated read on diagnostic_events"
      ON diagnostic_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'downtime_events' AND policyname = 'Allow authenticated read on downtime_events'
  ) THEN
    CREATE POLICY "Allow authenticated read on downtime_events"
      ON downtime_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rca_records' AND policyname = 'Allow authenticated read on rca_records'
  ) THEN
    CREATE POLICY "Allow authenticated read on rca_records"
      ON rca_records FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- FS3 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reliability_metrics' AND policyname = 'Allow authenticated read on reliability_metrics'
  ) THEN
    CREATE POLICY "Allow authenticated read on reliability_metrics"
      ON reliability_metrics FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'utilisation_metrics' AND policyname = 'Allow authenticated read on utilisation_metrics'
  ) THEN
    CREATE POLICY "Allow authenticated read on utilisation_metrics"
      ON utilisation_metrics FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_deviations' AND policyname = 'Allow authenticated read on performance_deviations'
  ) THEN
    CREATE POLICY "Allow authenticated read on performance_deviations"
      ON performance_deviations FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_benchmarks' AND policyname = 'Allow authenticated read on performance_benchmarks'
  ) THEN
    CREATE POLICY "Allow authenticated read on performance_benchmarks"
      ON performance_benchmarks FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- FS2 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'failure_predictions' AND policyname = 'Allow authenticated read on failure_predictions'
  ) THEN
    CREATE POLICY "Allow authenticated read on failure_predictions"
      ON failure_predictions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cbm_triggers' AND policyname = 'Allow authenticated read on cbm_triggers'
  ) THEN
    CREATE POLICY "Allow authenticated read on cbm_triggers"
      ON cbm_triggers FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_recommendations' AND policyname = 'Allow authenticated read on maintenance_recommendations'
  ) THEN
    CREATE POLICY "Allow authenticated read on maintenance_recommendations"
      ON maintenance_recommendations FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'risk_scoring_model' AND policyname = 'Allow authenticated read on risk_scoring_model'
  ) THEN
    CREATE POLICY "Allow authenticated read on risk_scoring_model"
      ON risk_scoring_model FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- FS5 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apm_alerts' AND policyname = 'Allow authenticated read on apm_alerts'
  ) THEN
    CREATE POLICY "Allow authenticated read on apm_alerts"
      ON apm_alerts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apm_alert_history' AND policyname = 'Allow authenticated read on apm_alert_history'
  ) THEN
    CREATE POLICY "Allow authenticated read on apm_alert_history"
      ON apm_alert_history FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dashboards' AND policyname = 'Allow authenticated read on dashboards'
  ) THEN
    CREATE POLICY "Allow authenticated read on dashboards"
      ON dashboards FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dashboard_widgets' AND policyname = 'Allow authenticated read on dashboard_widgets'
  ) THEN
    CREATE POLICY "Allow authenticated read on dashboard_widgets"
      ON dashboard_widgets FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_runs' AND policyname = 'Allow authenticated read on report_runs'
  ) THEN
    CREATE POLICY "Allow authenticated read on report_runs"
      ON report_runs FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'export_jobs' AND policyname = 'Allow authenticated read on export_jobs'
  ) THEN
    CREATE POLICY "Allow authenticated read on export_jobs"
      ON export_jobs FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- RLS Enabled on All APM Tables
-- ============================================================================
-- Read policies created for authenticated users on all tables
-- Write policies will be created in subsequent subtasks based on role requirements
-- ============================================================================
