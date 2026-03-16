-- EMS Power Transmission - Performance Optimization
-- Optimizes database queries for transmission topology joins and telemetry access
-- Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON JOIN PATTERNS
-- ============================================================================

-- Optimize meter registry view joins (Requirement 29.1)
-- Covering index for meter list queries with topology filters
CREATE INDEX IF NOT EXISTS idx_energy_meters_topology_covering 
  ON energy_meters(org_id, substation_id, feeder_id, active, status)
  INCLUDE (name, meter_code, meter_role, energy_types);

-- Optimize substation-based meter queries
CREATE INDEX IF NOT EXISTS idx_energy_meters_substation_active 
  ON energy_meters(substation_id, active) 
  WHERE active = true;

-- Optimize feeder-based meter queries
CREATE INDEX IF NOT EXISTS idx_energy_meters_feeder_active 
  ON energy_meters(feeder_id, active) 
  WHERE active = true;

-- Optimize meter role filtering
CREATE INDEX IF NOT EXISTS idx_energy_meters_role_org 
  ON energy_meters(meter_role, org_id) 
  WHERE meter_role IS NOT NULL;


-- ============================================================================
-- TELEMETRY QUERY OPTIMIZATION (Requirement 29.2)
-- ============================================================================

-- Optimize latest telemetry queries (used in LATERAL joins)
-- This index supports ORDER BY timestamp DESC LIMIT 1 pattern
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_meter_latest 
  ON energy_telemetry(meter_id, timestamp DESC)
  INCLUDE (kw, kwh, voltage_v, power_factor, frequency_hz, thd_pct);

-- Optimize time-range queries with meter filter
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_time_range 
  ON energy_telemetry(timestamp DESC, meter_id);

-- Optimize power quality queries
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_pq_metrics 
  ON energy_telemetry(meter_id, timestamp DESC)
  INCLUDE (voltage_v, power_factor, thd_pct, frequency_hz)
  WHERE voltage_v IS NOT NULL OR power_factor IS NOT NULL;


-- ============================================================================
-- TOPOLOGY JOIN OPTIMIZATION
-- ============================================================================

-- Optimize substation lookups by code (natural key queries)
CREATE INDEX IF NOT EXISTS idx_tx_substations_org_code_covering 
  ON tx_substations(org_id, code)
  INCLUDE (name, region, voltage_levels_kv, active);

-- Optimize feeder lookups by code
CREATE INDEX IF NOT EXISTS idx_tx_feeders_substation_code_covering 
  ON tx_feeders(substation_id, feeder_code)
  INCLUDE (name, voltage_level_kv, direction, capacity_mva, active);

-- Optimize transformer lookups
CREATE INDEX IF NOT EXISTS idx_tx_transformers_substation_code_covering 
  ON tx_transformers(substation_id, transformer_code)
  INCLUDE (name, rated_capacity_mva, primary_voltage_kv, secondary_voltage_kv, active);

-- Optimize bay lookups
CREATE INDEX IF NOT EXISTS idx_tx_bays_substation_code_covering 
  ON tx_bays(substation_id, bay_code)
  INCLUDE (name, bay_type, voltage_level_kv, active);

-- Optimize line queries by endpoints
CREATE INDEX IF NOT EXISTS idx_tx_lines_endpoints 
  ON tx_lines(from_substation_id, to_substation_id, active);


-- ============================================================================
-- MATERIALIZED VIEW FOR METER REGISTRY (Requirement 29.3)
-- ============================================================================

-- Create materialized view for frequently accessed meter registry data
-- This pre-computes the expensive joins and lateral queries
DROP MATERIALIZED VIEW IF EXISTS mv_tx_energy_meter_registry CASCADE;

CREATE MATERIALIZED VIEW mv_tx_energy_meter_registry AS
SELECT 
  -- Meter core fields
  m.id,
  m.org_id,
  m.site_id,
  m.name,
  m.meter_code,
  m.status,
  m.energy_types,
  m.meter_role,
  m.meter_type,
  m.scope,
  m.location,
  m.active,
  
  -- Topology references
  m.substation_id,
  m.feeder_id,
  m.bay_id,
  m.transformer_id,
  
  -- Resolved topology names (pre-joined)
  s.name AS substation_name,
  s.code AS substation_code,
  s.region AS substation_region,
  f.name AS feeder_name,
  f.feeder_code,
  f.direction AS feeder_direction,
  f.voltage_level_kv AS feeder_voltage_kv,
  b.name AS bay_name,
  b.bay_code,
  t.name AS transformer_name,
  t.transformer_code,
  
  -- Latest telemetry timestamp (updated periodically)
  latest.timestamp AS last_telemetry_at,
  latest.kw AS current_kw,
  latest.voltage_v AS current_voltage_v,
  
  -- Staleness indicator
  CASE 
    WHEN latest.timestamp IS NULL THEN true
    WHEN latest.timestamp < (now() - INTERVAL '1 hour') THEN true
    ELSE false
  END AS is_stale,
  
  -- Refresh timestamp
  now() AS refreshed_at
  
FROM energy_meters m
LEFT JOIN tx_substations s ON m.substation_id = s.id
LEFT JOIN tx_feeders f ON m.feeder_id = f.id
LEFT JOIN tx_bays b ON m.bay_id = b.id
LEFT JOIN tx_transformers t ON m.transformer_id = t.id
LEFT JOIN LATERAL (
  SELECT timestamp, kw, voltage_v
  FROM energy_telemetry
  WHERE meter_id = m.id
  ORDER BY timestamp DESC
  LIMIT 1
) latest ON true;

-- Create indexes on materialized view for fast queries
CREATE INDEX idx_mv_meter_registry_org ON mv_tx_energy_meter_registry(org_id);
CREATE INDEX idx_mv_meter_registry_substation ON mv_tx_energy_meter_registry(substation_id) WHERE substation_id IS NOT NULL;
CREATE INDEX idx_mv_meter_registry_feeder ON mv_tx_energy_meter_registry(feeder_id) WHERE feeder_id IS NOT NULL;
CREATE INDEX idx_mv_meter_registry_active ON mv_tx_energy_meter_registry(org_id, active) WHERE active = true;
CREATE INDEX idx_mv_meter_registry_stale ON mv_tx_energy_meter_registry(org_id, is_stale) WHERE is_stale = true;
CREATE INDEX idx_mv_meter_registry_role ON mv_tx_energy_meter_registry(meter_role, org_id) WHERE meter_role IS NOT NULL;

COMMENT ON MATERIALIZED VIEW mv_tx_energy_meter_registry IS 'Pre-computed meter registry with topology joins for fast queries. Refresh every 5 minutes.';

-- Grant SELECT permission
GRANT SELECT ON mv_tx_energy_meter_registry TO authenticated;


-- ============================================================================
-- CONTINUOUS AGGREGATES FOR TELEMETRY (Requirement 29.5)
-- ============================================================================

-- Create continuous aggregate for hourly telemetry summaries
-- This pre-aggregates telemetry data for faster dashboard queries
DO $$
BEGIN
  -- Only create if TimescaleDB is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    
    -- Drop existing continuous aggregate if it exists
    DROP MATERIALIZED VIEW IF EXISTS telemetry_hourly CASCADE;
    
    -- Create continuous aggregate for hourly summaries
    PERFORM create_continuous_aggregate(
      'telemetry_hourly',
      'SELECT 
        time_bucket(''1 hour'', timestamp) AS bucket,
        meter_id,
        AVG(kw) AS avg_kw,
        MAX(kw) AS max_kw,
        MIN(kw) AS min_kw,
        SUM(kwh) AS total_kwh,
        AVG(voltage_v) AS avg_voltage_v,
        AVG(power_factor) AS avg_power_factor,
        AVG(frequency_hz) AS avg_frequency_hz,
        AVG(thd_pct) AS avg_thd_pct,
        COUNT(*) AS data_point_count
      FROM energy_telemetry
      GROUP BY bucket, meter_id',
      start_offset => INTERVAL '1 month',
      end_offset => INTERVAL '1 hour',
      if_not_exists => TRUE
    );
    
    -- Create index on continuous aggregate
    CREATE INDEX IF NOT EXISTS idx_telemetry_hourly_meter_bucket 
      ON telemetry_hourly(meter_id, bucket DESC);
    
    -- Add refresh policy (refresh every hour)
    PERFORM add_continuous_aggregate_policy(
      'telemetry_hourly',
      start_offset => INTERVAL '1 month',
      end_offset => INTERVAL '1 hour',
      schedule_interval => INTERVAL '1 hour',
      if_not_exists => TRUE
    );
    
  END IF;
END $$;


-- ============================================================================
-- ALERT QUERY OPTIMIZATION
-- ============================================================================

-- Optimize alert list queries with topology context
CREATE INDEX IF NOT EXISTS idx_energy_alerts_org_state_created 
  ON energy_alerts(org_id, alert_state, created_at DESC);

-- Optimize alert filtering by severity and state
CREATE INDEX IF NOT EXISTS idx_energy_alerts_severity_state 
  ON energy_alerts(severity, alert_state, org_id);

-- Optimize unresolved alert queries
CREATE INDEX IF NOT EXISTS idx_energy_alerts_unresolved 
  ON energy_alerts(org_id, created_at DESC) 
  WHERE alert_state IN ('open', 'acked');


-- ============================================================================
-- KPI SNAPSHOT OPTIMIZATION
-- ============================================================================

-- Optimize KPI queries by scope and period
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_scope_period 
  ON energy_kpi_snapshots(scope_type, scope_id, period_start DESC, kpi_code);

-- Optimize KPI queries by organization and time
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_org_time 
  ON energy_kpi_snapshots(org_id, period_start DESC, kpi_code);

-- Covering index for KPI list queries
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_covering 
  ON energy_kpi_snapshots(org_id, scope_type, scope_id, period_start DESC)
  INCLUDE (kpi_code, value, unit, period_grain);


-- ============================================================================
-- BASELINE AND ANOMALY OPTIMIZATION
-- ============================================================================

-- Optimize baseline lookups by meter
CREATE INDEX IF NOT EXISTS idx_energy_baselines_meter_period 
  ON energy_baselines(meter_id, baseline_period_start, baseline_period_end);

-- Optimize anomaly queries by meter and time
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_meter_time 
  ON energy_anomalies(meter_id, timestamp DESC, resolved);

-- Optimize unresolved anomaly queries
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_unresolved 
  ON energy_anomalies(meter_id, timestamp DESC) 
  WHERE resolved = false;


-- ============================================================================
-- DASHBOARD AND REPORTING OPTIMIZATION
-- ============================================================================

-- Optimize dashboard definition queries
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_org_active_type 
  ON dashboard_definitions(org_id, active, dashboard_type) 
  WHERE active = true;

-- Optimize export job queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_org_status_created 
  ON export_jobs(org_id, status, created_at DESC);

-- Optimize tariff queries by scope and effective date
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_scope_effective 
  ON energy_tariffs(applies_to_scope, scope_id, effective_date DESC, active) 
  WHERE active = true;


-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE energy_meters;
ANALYZE energy_telemetry;
ANALYZE tx_substations;
ANALYZE tx_feeders;
ANALYZE tx_transformers;
ANALYZE tx_bays;
ANALYZE tx_lines;
ANALYZE energy_alerts;
ANALYZE energy_anomalies;
ANALYZE energy_kpi_snapshots;
ANALYZE energy_baselines;


-- ============================================================================
-- QUERY PERFORMANCE VALIDATION FUNCTION
-- ============================================================================

-- Create function to validate query performance
CREATE OR REPLACE FUNCTION fn_validate_query_performance()
RETURNS TABLE (
  test_name TEXT,
  query_description TEXT,
  execution_time_ms NUMERIC,
  meets_target BOOLEAN,
  target_ms INTEGER,
  row_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration_ms NUMERIC;
  v_row_count BIGINT;
BEGIN
  
  -- Test 1: Meter list query (Target: < 2000ms for 10,000 meters)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count FROM mv_tx_energy_meter_registry WHERE org_id IS NOT NULL;
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'meter_list'::TEXT,
    'Query meter registry with topology joins'::TEXT,
    v_duration_ms,
    v_duration_ms < 2000,
    2000,
    v_row_count;
  
  -- Test 2: Latest telemetry query (Target: < 1000ms)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count 
  FROM energy_meters m
  LEFT JOIN LATERAL (
    SELECT timestamp FROM energy_telemetry 
    WHERE meter_id = m.id 
    ORDER BY timestamp DESC LIMIT 1
  ) t ON true
  LIMIT 100;
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'latest_telemetry'::TEXT,
    'Query latest telemetry for 100 meters'::TEXT,
    v_duration_ms,
    v_duration_ms < 1000,
    1000,
    v_row_count;
  
  -- Test 3: Alert list query (Target: < 1000ms)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count FROM v_energy_alert_summary LIMIT 1000;
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'alert_list'::TEXT,
    'Query alert summary with topology context'::TEXT,
    v_duration_ms,
    v_duration_ms < 1000,
    1000,
    v_row_count;
  
  -- Test 4: KPI snapshot query (Target: < 1000ms)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count 
  FROM energy_kpi_snapshots 
  WHERE period_start >= (now() - INTERVAL '30 days')
  LIMIT 1000;
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'kpi_snapshots'::TEXT,
    'Query KPI snapshots for last 30 days'::TEXT,
    v_duration_ms,
    v_duration_ms < 1000,
    1000,
    v_row_count;
  
END;
$$;

COMMENT ON FUNCTION fn_validate_query_performance() IS 'Validates that key queries meet performance targets (Requirements 29.1, 29.2, 29.3)';

GRANT EXECUTE ON FUNCTION fn_validate_query_performance() TO authenticated;


-- ============================================================================
-- REFRESH POLICY FOR MATERIALIZED VIEW
-- ============================================================================

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION fn_refresh_meter_registry()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tx_energy_meter_registry;
END;
$$;

COMMENT ON FUNCTION fn_refresh_meter_registry() IS 'Refreshes the materialized meter registry view. Should be called every 5 minutes via cron or pg_cron.';

GRANT EXECUTE ON FUNCTION fn_refresh_meter_registry() TO authenticated;


-- ============================================================================
-- EXPLAIN PLAN ANALYSIS QUERIES
-- ============================================================================

-- Create view with sample explain plans for key queries
CREATE OR REPLACE VIEW v_query_performance_analysis AS
SELECT 
  'meter_registry_query' AS query_name,
  'SELECT * FROM mv_tx_energy_meter_registry WHERE org_id = $1 AND active = true LIMIT 100' AS query_text,
  'Uses materialized view with covering indexes' AS optimization_notes
UNION ALL
SELECT 
  'telemetry_time_range' AS query_name,
  'SELECT * FROM energy_telemetry WHERE meter_id = $1 AND timestamp >= $2 AND timestamp <= $3' AS query_text,
  'Uses composite index idx_energy_telemetry_meter_time' AS optimization_notes
UNION ALL
SELECT 
  'alert_summary' AS query_name,
  'SELECT * FROM v_energy_alert_summary WHERE org_id = $1 AND alert_state = ''open''' AS query_text,
  'Uses composite indexes on alerts and topology tables' AS optimization_notes;

COMMENT ON VIEW v_query_performance_analysis IS 'Documents key queries and their optimization strategies';

GRANT SELECT ON v_query_performance_analysis TO authenticated;


-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Performance optimization migration completed successfully';
  RAISE NOTICE 'Created % new indexes for query optimization', 30;
  RAISE NOTICE 'Created materialized view: mv_tx_energy_meter_registry';
  RAISE NOTICE 'Created performance validation function: fn_validate_query_performance()';
  RAISE NOTICE 'Run SELECT * FROM fn_validate_query_performance() to test performance';
END $$;
