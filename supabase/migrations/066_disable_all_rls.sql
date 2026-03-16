-- ============================================================================
-- Disable All Row Level Security (RLS) Policies
-- ============================================================================
-- This migration disables RLS on all tables for development purposes
-- WARNING: This removes all security restrictions - use only in dev environment
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Drop All Policies First
-- ============================================================================

-- Core tables
DROP POLICY IF EXISTS "Allow authenticated read on tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated read on sites" ON sites;
DROP POLICY IF EXISTS "Allow authenticated read on asset_types" ON asset_types;
DROP POLICY IF EXISTS "Allow authenticated read on assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated read on alerts" ON alerts;

-- Telemetry tables
DROP POLICY IF EXISTS "Allow authenticated read on tags" ON tags;
DROP POLICY IF EXISTS "Allow authenticated read on telemetry_points" ON telemetry_points;
DROP POLICY IF EXISTS "Allow authenticated read on telemetry_parameters" ON telemetry_parameters;
DROP POLICY IF EXISTS "Allow authenticated read on telemetry_data" ON telemetry_data;

-- Grid topology tables
DROP POLICY IF EXISTS "Allow authenticated read on grid_nodes" ON grid_nodes;
DROP POLICY IF EXISTS "Allow authenticated read on grid_lines" ON grid_lines;
DROP POLICY IF EXISTS "Allow authenticated read on grid_asset_links" ON grid_asset_links;

-- Operational data
DROP POLICY IF EXISTS "Allow authenticated read on operational_data" ON operational_data;

-- FS4 tables
DROP POLICY IF EXISTS "Allow authenticated read on asset_relationships" ON asset_relationships;
DROP POLICY IF EXISTS "Allow authenticated read on asset_lifecycle_events" ON asset_lifecycle_events;
DROP POLICY IF EXISTS "Allow authenticated read on asset_criticality_model" ON asset_criticality_model;
DROP POLICY IF EXISTS "Allow authenticated read on fmea_entries" ON fmea_entries;
DROP POLICY IF EXISTS "Allow authenticated read on spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated read on asset_spare_parts" ON asset_spare_parts;

-- FS1 tables
DROP POLICY IF EXISTS "Allow authenticated read on asset_parameter_map" ON asset_parameter_map;
DROP POLICY IF EXISTS "Allow authenticated read on health_models" ON health_models;
DROP POLICY IF EXISTS "Allow authenticated read on health_scores" ON health_scores;
DROP POLICY IF EXISTS "Allow authenticated read on diagnostic_events" ON diagnostic_events;
DROP POLICY IF EXISTS "Allow authenticated read on downtime_events" ON downtime_events;
DROP POLICY IF EXISTS "Allow authenticated read on rca_records" ON rca_records;

-- FS3 tables
DROP POLICY IF EXISTS "Allow authenticated read on reliability_metrics" ON reliability_metrics;
DROP POLICY IF EXISTS "Allow authenticated read on utilisation_metrics" ON utilisation_metrics;
DROP POLICY IF EXISTS "Allow authenticated read on performance_deviations" ON performance_deviations;
DROP POLICY IF EXISTS "Allow authenticated read on performance_benchmarks" ON performance_benchmarks;

-- FS2 tables
DROP POLICY IF EXISTS "Allow authenticated read on failure_predictions" ON failure_predictions;
DROP POLICY IF EXISTS "Allow authenticated read on cbm_triggers" ON cbm_triggers;
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_recommendations" ON maintenance_recommendations;
DROP POLICY IF EXISTS "Allow authenticated read on risk_scoring_model" ON risk_scoring_model;

-- FS5 tables
DROP POLICY IF EXISTS "Allow authenticated read on apm_alerts" ON apm_alerts;
DROP POLICY IF EXISTS "Allow authenticated read on apm_alert_history" ON apm_alert_history;
DROP POLICY IF EXISTS "Allow authenticated read on dashboards" ON dashboards;
DROP POLICY IF EXISTS "Allow authenticated read on dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Allow authenticated read on report_runs" ON report_runs;
DROP POLICY IF EXISTS "Allow authenticated read on export_jobs" ON export_jobs;

-- Drop write policies from migration 019
DROP POLICY IF EXISTS "Allow service role write on tenants" ON tenants;
DROP POLICY IF EXISTS "Allow service role write on sites" ON sites;
DROP POLICY IF EXISTS "Allow service role write on asset_types" ON asset_types;
DROP POLICY IF EXISTS "Allow service role write on assets" ON assets;
DROP POLICY IF EXISTS "Allow service role write on alerts" ON alerts;
DROP POLICY IF EXISTS "Allow service role write on tags" ON tags;
DROP POLICY IF EXISTS "Allow service role write on telemetry_points" ON telemetry_points;
DROP POLICY IF EXISTS "Allow service role write on telemetry_parameters" ON telemetry_parameters;
DROP POLICY IF EXISTS "Allow service role write on telemetry_data" ON telemetry_data;
DROP POLICY IF EXISTS "Allow service role write on grid_nodes" ON grid_nodes;
DROP POLICY IF EXISTS "Allow service role write on grid_lines" ON grid_lines;
DROP POLICY IF EXISTS "Allow service role write on grid_asset_links" ON grid_asset_links;
DROP POLICY IF EXISTS "Allow service role write on operational_data" ON operational_data;
DROP POLICY IF EXISTS "Allow service role write on asset_relationships" ON asset_relationships;
DROP POLICY IF EXISTS "Allow service role write on asset_lifecycle_events" ON asset_lifecycle_events;
DROP POLICY IF EXISTS "Allow service role write on asset_criticality_model" ON asset_criticality_model;
DROP POLICY IF EXISTS "Allow service role write on fmea_entries" ON fmea_entries;
DROP POLICY IF EXISTS "Allow service role write on spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow service role write on asset_spare_parts" ON asset_spare_parts;
DROP POLICY IF EXISTS "Allow service role write on asset_parameter_map" ON asset_parameter_map;
DROP POLICY IF EXISTS "Allow service role write on health_models" ON health_models;
DROP POLICY IF EXISTS "Allow service role write on health_scores" ON health_scores;
DROP POLICY IF EXISTS "Allow service role write on diagnostic_events" ON diagnostic_events;
DROP POLICY IF EXISTS "Allow service role write on downtime_events" ON downtime_events;
DROP POLICY IF EXISTS "Allow service role write on rca_records" ON rca_records;
DROP POLICY IF EXISTS "Allow service role write on reliability_metrics" ON reliability_metrics;
DROP POLICY IF EXISTS "Allow service role write on utilisation_metrics" ON utilisation_metrics;
DROP POLICY IF EXISTS "Allow service role write on performance_deviations" ON performance_deviations;
DROP POLICY IF EXISTS "Allow service role write on performance_benchmarks" ON performance_benchmarks;
DROP POLICY IF EXISTS "Allow service role write on failure_predictions" ON failure_predictions;
DROP POLICY IF EXISTS "Allow service role write on cbm_triggers" ON cbm_triggers;
DROP POLICY IF EXISTS "Allow service role write on maintenance_recommendations" ON maintenance_recommendations;
DROP POLICY IF EXISTS "Allow service role write on risk_scoring_model" ON risk_scoring_model;
DROP POLICY IF EXISTS "Allow service role write on apm_alerts" ON apm_alerts;
DROP POLICY IF EXISTS "Allow service role write on apm_alert_history" ON apm_alert_history;
DROP POLICY IF EXISTS "Allow service role write on dashboards" ON dashboards;
DROP POLICY IF EXISTS "Allow service role write on dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Allow service role write on report_runs" ON report_runs;
DROP POLICY IF EXISTS "Allow service role write on export_jobs" ON export_jobs;

-- Drop anon read policies from migration 021
DROP POLICY IF EXISTS "Allow anon read on tenants" ON tenants;
DROP POLICY IF EXISTS "Allow anon read on sites" ON sites;
DROP POLICY IF EXISTS "Allow anon read on asset_types" ON asset_types;
DROP POLICY IF EXISTS "Allow anon read on assets" ON assets;
DROP POLICY IF EXISTS "Allow anon read on alerts" ON alerts;
DROP POLICY IF EXISTS "Allow anon read on tags" ON tags;
DROP POLICY IF EXISTS "Allow anon read on telemetry_points" ON telemetry_points;
DROP POLICY IF EXISTS "Allow anon read on telemetry_parameters" ON telemetry_parameters;
DROP POLICY IF EXISTS "Allow anon read on telemetry_data" ON telemetry_data;
DROP POLICY IF EXISTS "Allow anon read on grid_nodes" ON grid_nodes;
DROP POLICY IF EXISTS "Allow anon read on grid_lines" ON grid_lines;
DROP POLICY IF EXISTS "Allow anon read on grid_asset_links" ON grid_asset_links;
DROP POLICY IF EXISTS "Allow anon read on operational_data" ON operational_data;
DROP POLICY IF EXISTS "Allow anon read on asset_relationships" ON asset_relationships;
DROP POLICY IF EXISTS "Allow anon read on asset_lifecycle_events" ON asset_lifecycle_events;
DROP POLICY IF EXISTS "Allow anon read on asset_criticality_model" ON asset_criticality_model;
DROP POLICY IF EXISTS "Allow anon read on fmea_entries" ON fmea_entries;
DROP POLICY IF EXISTS "Allow anon read on spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow anon read on asset_spare_parts" ON asset_spare_parts;
DROP POLICY IF EXISTS "Allow anon read on asset_parameter_map" ON asset_parameter_map;
DROP POLICY IF EXISTS "Allow anon read on health_models" ON health_models;
DROP POLICY IF EXISTS "Allow anon read on health_scores" ON health_scores;
DROP POLICY IF EXISTS "Allow anon read on diagnostic_events" ON diagnostic_events;
DROP POLICY IF EXISTS "Allow anon read on downtime_events" ON downtime_events;
DROP POLICY IF EXISTS "Allow anon read on rca_records" ON rca_records;
DROP POLICY IF EXISTS "Allow anon read on reliability_metrics" ON reliability_metrics;
DROP POLICY IF EXISTS "Allow anon read on utilisation_metrics" ON utilisation_metrics;
DROP POLICY IF EXISTS "Allow anon read on performance_deviations" ON performance_deviations;
DROP POLICY IF EXISTS "Allow anon read on performance_benchmarks" ON performance_benchmarks;
DROP POLICY IF EXISTS "Allow anon read on failure_predictions" ON failure_predictions;
DROP POLICY IF EXISTS "Allow anon read on cbm_triggers" ON cbm_triggers;
DROP POLICY IF EXISTS "Allow anon read on maintenance_recommendations" ON maintenance_recommendations;
DROP POLICY IF EXISTS "Allow anon read on risk_scoring_model" ON risk_scoring_model;
DROP POLICY IF EXISTS "Allow anon read on apm_alerts" ON apm_alerts;
DROP POLICY IF EXISTS "Allow anon read on apm_alert_history" ON apm_alert_history;
DROP POLICY IF EXISTS "Allow anon read on dashboards" ON dashboards;
DROP POLICY IF EXISTS "Allow anon read on dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Allow anon read on report_runs" ON report_runs;
DROP POLICY IF EXISTS "Allow anon read on export_jobs" ON export_jobs;

-- Drop audit log policies from migration 020
DROP POLICY IF EXISTS "Allow service role read on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow service role write on audit_logs" ON audit_logs;

-- ============================================================================
-- 2. Disable RLS on Core Tables
-- ============================================================================

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Disable RLS on Telemetry Tables
-- ============================================================================

ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_parameters DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Disable RLS on Grid Topology Tables
-- ============================================================================

ALTER TABLE grid_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_asset_links DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Disable RLS on Operational Data
-- ============================================================================

ALTER TABLE operational_data DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Disable RLS on FS4: Asset Inventory & Criticality Tables
-- ============================================================================

ALTER TABLE asset_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_criticality_model DISABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_spare_parts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Disable RLS on FS1: Health & Diagnostics Tables
-- ============================================================================

ALTER TABLE asset_parameter_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE rca_records DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Disable RLS on FS3: Performance & Utilisation Tables
-- ============================================================================

ALTER TABLE reliability_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE utilisation_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_deviations DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. Disable RLS on FS2: Predictive & Prescriptive Maintenance Tables
-- ============================================================================

ALTER TABLE failure_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbm_triggers DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scoring_model DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. Disable RLS on FS5: Alerts, Reports & Visualisation Tables
-- ============================================================================

ALTER TABLE apm_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE apm_alert_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. Disable RLS on Audit Logs
-- ============================================================================

ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- All RLS Policies Disabled
-- ============================================================================
-- All tables now have unrestricted access
-- Use only in development environment
-- ============================================================================
