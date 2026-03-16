-- ============================================================================
-- Allow Anonymous Read Access for Development
-- ============================================================================
-- This migration adds policies to allow anonymous (unauthenticated) users
-- to read data from all tables. This is for development purposes only.
--
-- WARNING: This should only be used in development/testing environments.
-- For production, remove these policies and require authentication.
-- ============================================================================

BEGIN;

-- Core tables
DROP POLICY IF EXISTS "Allow anon read on tenants" ON tenants;
CREATE POLICY "Allow anon read on tenants"
  ON tenants FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on sites" ON sites;
CREATE POLICY "Allow anon read on sites"
  ON sites FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on asset_types" ON asset_types;
CREATE POLICY "Allow anon read on asset_types"
  ON asset_types FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on assets" ON assets;
CREATE POLICY "Allow anon read on assets"
  ON assets FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on alerts" ON alerts;
CREATE POLICY "Allow anon read on alerts"
  ON alerts FOR SELECT
  TO anon
  USING (true);

-- Telemetry tables
DROP POLICY IF EXISTS "Allow anon read on tags" ON tags;
CREATE POLICY "Allow anon read on tags"
  ON tags FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on telemetry_points" ON telemetry_points;
CREATE POLICY "Allow anon read on telemetry_points"
  ON telemetry_points FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on telemetry_parameters" ON telemetry_parameters;
CREATE POLICY "Allow anon read on telemetry_parameters"
  ON telemetry_parameters FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on telemetry_data" ON telemetry_data;
CREATE POLICY "Allow anon read on telemetry_data"
  ON telemetry_data FOR SELECT
  TO anon
  USING (true);

-- Grid topology tables
DROP POLICY IF EXISTS "Allow anon read on grid_nodes" ON grid_nodes;
CREATE POLICY "Allow anon read on grid_nodes"
  ON grid_nodes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on grid_lines" ON grid_lines;
CREATE POLICY "Allow anon read on grid_lines"
  ON grid_lines FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on grid_asset_links" ON grid_asset_links;
CREATE POLICY "Allow anon read on grid_asset_links"
  ON grid_asset_links FOR SELECT
  TO anon
  USING (true);

-- Operational data
DROP POLICY IF EXISTS "Allow anon read on operational_data" ON operational_data;
CREATE POLICY "Allow anon read on operational_data"
  ON operational_data FOR SELECT
  TO anon
  USING (true);

-- FS4: Asset Inventory & Criticality
DROP POLICY IF EXISTS "Allow anon read on asset_relationships" ON asset_relationships;
CREATE POLICY "Allow anon read on asset_relationships"
  ON asset_relationships FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on asset_lifecycle_events" ON asset_lifecycle_events;
CREATE POLICY "Allow anon read on asset_lifecycle_events"
  ON asset_lifecycle_events FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on asset_criticality_model" ON asset_criticality_model;
CREATE POLICY "Allow anon read on asset_criticality_model"
  ON asset_criticality_model FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on fmea_entries" ON fmea_entries;
CREATE POLICY "Allow anon read on fmea_entries"
  ON fmea_entries FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on spare_parts" ON spare_parts;
CREATE POLICY "Allow anon read on spare_parts"
  ON spare_parts FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on asset_spare_parts" ON asset_spare_parts;
CREATE POLICY "Allow anon read on asset_spare_parts"
  ON asset_spare_parts FOR SELECT
  TO anon
  USING (true);

-- FS1: Health & Diagnostics
DROP POLICY IF EXISTS "Allow anon read on asset_parameter_map" ON asset_parameter_map;
CREATE POLICY "Allow anon read on asset_parameter_map"
  ON asset_parameter_map FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on health_models" ON health_models;
CREATE POLICY "Allow anon read on health_models"
  ON health_models FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on health_scores" ON health_scores;
CREATE POLICY "Allow anon read on health_scores"
  ON health_scores FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on diagnostic_events" ON diagnostic_events;
CREATE POLICY "Allow anon read on diagnostic_events"
  ON diagnostic_events FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on downtime_events" ON downtime_events;
CREATE POLICY "Allow anon read on downtime_events"
  ON downtime_events FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on rca_records" ON rca_records;
CREATE POLICY "Allow anon read on rca_records"
  ON rca_records FOR SELECT
  TO anon
  USING (true);

-- FS3: Performance & Utilisation
DROP POLICY IF EXISTS "Allow anon read on reliability_metrics" ON reliability_metrics;
CREATE POLICY "Allow anon read on reliability_metrics"
  ON reliability_metrics FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on utilisation_metrics" ON utilisation_metrics;
CREATE POLICY "Allow anon read on utilisation_metrics"
  ON utilisation_metrics FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on performance_deviations" ON performance_deviations;
CREATE POLICY "Allow anon read on performance_deviations"
  ON performance_deviations FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on performance_benchmarks" ON performance_benchmarks;
CREATE POLICY "Allow anon read on performance_benchmarks"
  ON performance_benchmarks FOR SELECT
  TO anon
  USING (true);

-- FS2: Predictive & Prescriptive Maintenance
DROP POLICY IF EXISTS "Allow anon read on failure_predictions" ON failure_predictions;
CREATE POLICY "Allow anon read on failure_predictions"
  ON failure_predictions FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on cbm_triggers" ON cbm_triggers;
CREATE POLICY "Allow anon read on cbm_triggers"
  ON cbm_triggers FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on maintenance_recommendations" ON maintenance_recommendations;
CREATE POLICY "Allow anon read on maintenance_recommendations"
  ON maintenance_recommendations FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on risk_scoring_model" ON risk_scoring_model;
CREATE POLICY "Allow anon read on risk_scoring_model"
  ON risk_scoring_model FOR SELECT
  TO anon
  USING (true);

-- FS5: Alerts, Reports & Visualisation
DROP POLICY IF EXISTS "Allow anon read on apm_alerts" ON apm_alerts;
CREATE POLICY "Allow anon read on apm_alerts"
  ON apm_alerts FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on apm_alert_history" ON apm_alert_history;
CREATE POLICY "Allow anon read on apm_alert_history"
  ON apm_alert_history FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on dashboards" ON dashboards;
CREATE POLICY "Allow anon read on dashboards"
  ON dashboards FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "Allow anon read on dashboard_widgets"
  ON dashboard_widgets FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on report_runs" ON report_runs;
CREATE POLICY "Allow anon read on report_runs"
  ON report_runs FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on export_jobs" ON export_jobs;
CREATE POLICY "Allow anon read on export_jobs"
  ON export_jobs FOR SELECT
  TO anon
  USING (true);

COMMIT;

-- ============================================================================
-- Anonymous Read Access Enabled for Development
-- ============================================================================
