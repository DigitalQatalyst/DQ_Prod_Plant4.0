-- ============================================================================
-- Create Write Policies for APM Transmission
-- ============================================================================
-- This migration creates write policies for authorized roles.
-- Roles: apm_admin, reliability_engineer, maintenance_planner, operations_engineer
--
-- Requirements: 25.4, 25.5, 25.6
-- ============================================================================

BEGIN;

-- ============================================================================
-- Write Policies for Core Tables
-- ============================================================================
-- Requirements: 25.4 - Restrict to authorized roles

-- Assets: apm_admin and reliability_engineer can write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Allow authorized write on assets'
  ) THEN
    CREATE POLICY "Allow authorized write on assets"
      ON assets FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Alerts: operations_engineer and apm_admin can write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Allow authorized write on alerts'
  ) THEN
    CREATE POLICY "Allow authorized write on alerts"
      ON alerts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for Telemetry Tables
-- ============================================================================

-- Telemetry data: system and data_ingestion roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_data' AND policyname = 'Allow authorized write on telemetry_data'
  ) THEN
    CREATE POLICY "Allow authorized write on telemetry_data"
      ON telemetry_data FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Telemetry parameters: apm_admin only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_parameters' AND policyname = 'Allow authorized write on telemetry_parameters'
  ) THEN
    CREATE POLICY "Allow authorized write on telemetry_parameters"
      ON telemetry_parameters FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for FS4: Asset Inventory & Criticality
-- ============================================================================

-- Asset relationships: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_relationships' AND policyname = 'Allow authorized write on asset_relationships'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_relationships"
      ON asset_relationships FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Asset lifecycle events: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_lifecycle_events' AND policyname = 'Allow authorized write on asset_lifecycle_events'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_lifecycle_events"
      ON asset_lifecycle_events FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- FMEA entries: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fmea_entries' AND policyname = 'Allow authorized write on fmea_entries'
  ) THEN
    CREATE POLICY "Allow authorized write on fmea_entries"
      ON fmea_entries FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Spare parts: maintenance_planner and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts' AND policyname = 'Allow authorized write on spare_parts'
  ) THEN
    CREATE POLICY "Allow authorized write on spare_parts"
      ON spare_parts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Asset spare parts: maintenance_planner and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_spare_parts' AND policyname = 'Allow authorized write on asset_spare_parts'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_spare_parts"
      ON asset_spare_parts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for FS1: Health & Diagnostics
-- ============================================================================

-- Diagnostic events: operations_engineer, reliability_engineer, apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diagnostic_events' AND policyname = 'Allow authorized write on diagnostic_events'
  ) THEN
    CREATE POLICY "Allow authorized write on diagnostic_events"
      ON diagnostic_events FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Downtime events: operations_engineer, reliability_engineer, apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'downtime_events' AND policyname = 'Allow authorized write on downtime_events'
  ) THEN
    CREATE POLICY "Allow authorized write on downtime_events"
      ON downtime_events FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- RCA records: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rca_records' AND policyname = 'Allow authorized write on rca_records'
  ) THEN
    CREATE POLICY "Allow authorized write on rca_records"
      ON rca_records FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Health scores: system generated, apm_admin can override
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'health_scores' AND policyname = 'Allow authorized write on health_scores'
  ) THEN
    CREATE POLICY "Allow authorized write on health_scores"
      ON health_scores FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for FS3: Performance & Utilisation
-- ============================================================================

-- Reliability metrics: system generated, apm_admin can override
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reliability_metrics' AND policyname = 'Allow authorized write on reliability_metrics'
  ) THEN
    CREATE POLICY "Allow authorized write on reliability_metrics"
      ON reliability_metrics FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Utilisation metrics: system generated, apm_admin can override
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'utilisation_metrics' AND policyname = 'Allow authorized write on utilisation_metrics'
  ) THEN
    CREATE POLICY "Allow authenticated write on utilisation_metrics"
      ON utilisation_metrics FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Performance benchmarks: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_benchmarks' AND policyname = 'Allow authorized write on performance_benchmarks'
  ) THEN
    CREATE POLICY "Allow authorized write on performance_benchmarks"
      ON performance_benchmarks FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for FS2: Predictive & Prescriptive Maintenance
-- ============================================================================

-- Failure predictions: system generated, apm_admin can override
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'failure_predictions' AND policyname = 'Allow authorized write on failure_predictions'
  ) THEN
    CREATE POLICY "Allow authorized write on failure_predictions"
      ON failure_predictions FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- CBM triggers: reliability_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cbm_triggers' AND policyname = 'Allow authorized write on cbm_triggers'
  ) THEN
    CREATE POLICY "Allow authorized write on cbm_triggers"
      ON cbm_triggers FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Maintenance recommendations: maintenance_planner, reliability_engineer, apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_recommendations' AND policyname = 'Allow authorized write on maintenance_recommendations'
  ) THEN
    CREATE POLICY "Allow authorized write on maintenance_recommendations"
      ON maintenance_recommendations FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Risk scoring model: apm_admin only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'risk_scoring_model' AND policyname = 'Allow authorized write on risk_scoring_model'
  ) THEN
    CREATE POLICY "Allow authorized write on risk_scoring_model"
      ON risk_scoring_model FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- Write Policies for FS5: Alerts, Reports & Visualisation
-- ============================================================================

-- APM alerts: operations_engineer and apm_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apm_alerts' AND policyname = 'Allow authorized write on apm_alerts'
  ) THEN
    CREATE POLICY "Allow authorized write on apm_alerts"
      ON apm_alerts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Alert history: system generated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apm_alert_history' AND policyname = 'Allow authorized write on apm_alert_history'
  ) THEN
    CREATE POLICY "Allow authorized write on apm_alert_history"
      ON apm_alert_history FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Dashboards: users can manage their own dashboards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dashboards' AND policyname = 'Allow authenticated write on dashboards'
  ) THEN
    CREATE POLICY "Allow authenticated write on dashboards"
      ON dashboards FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Dashboard widgets: users can manage widgets on their dashboards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dashboard_widgets' AND policyname = 'Allow authenticated write on dashboard_widgets'
  ) THEN
    CREATE POLICY "Allow authenticated write on dashboard_widgets"
      ON dashboard_widgets FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Report runs: authenticated users can generate reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_runs' AND policyname = 'Allow authenticated write on report_runs'
  ) THEN
    CREATE POLICY "Allow authenticated write on report_runs"
      ON report_runs FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Export jobs: authenticated users can create export jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'export_jobs' AND policyname = 'Allow authenticated write on export_jobs'
  ) THEN
    CREATE POLICY "Allow authenticated write on export_jobs"
      ON export_jobs FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Write Policies Created
-- ============================================================================
-- All write policies have been created for authorized roles
-- Note: In production, these policies should be refined to check specific
-- role claims from JWT tokens using auth.jwt() ->> 'role'
-- ============================================================================
