-- EMS Power Transmission - Views and Helper Functions
-- Creates meter registry view and helper functions for telemetry and consumption
-- Requirements: 1.6, 2.5

-- ============================================================================
-- ENERGY TELEMETRY TABLE (if not exists)
-- ============================================================================

-- Create energy_telemetry table as TimescaleDB hypertable
CREATE TABLE IF NOT EXISTS energy_telemetry (
  id UUID DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Energy and power measurements
  kwh DECIMAL(15,4),  -- Cumulative energy consumption
  kw DECIMAL(12,4),   -- Instantaneous power demand
  
  -- Electrical parameters
  voltage_v DECIMAL(8,2),
  current_a DECIMAL(8,2),
  power_factor DECIMAL(4,3),
  frequency_hz DECIMAL(5,2),
  thd_pct DECIMAL(5,2),  -- Total Harmonic Distortion
  
  -- Multi-phase measurements (for 3-phase systems)
  voltage_l1_v DECIMAL(8,2),
  voltage_l2_v DECIMAL(8,2),
  voltage_l3_v DECIMAL(8,2),
  current_l1_a DECIMAL(8,2),
  current_l2_a DECIMAL(8,2),
  current_l3_a DECIMAL(8,2),
  
  -- Data quality and metadata
  quality_score DECIMAL(3,2) DEFAULT 1.0,
  data_source TEXT,  -- 'meter', 'sensor', 'calculated', 'estimated'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Composite primary key for hypertable
  PRIMARY KEY (meter_id, timestamp)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_meter_time ON energy_telemetry(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_timestamp ON energy_telemetry(timestamp DESC);

-- Convert to TimescaleDB hypertable (idempotent - only creates if not already a hypertable)
-- Note: This requires TimescaleDB extension to be enabled
-- If TimescaleDB is not available, the table will work as a regular PostgreSQL table
DO $$
BEGIN
  -- Check if TimescaleDB extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Check if table is already a hypertable
    IF NOT EXISTS (
      SELECT 1 FROM timescaledb_information.hypertables 
      WHERE hypertable_name = 'energy_telemetry'
    ) THEN
      PERFORM create_hypertable('energy_telemetry', 'timestamp', 
        chunk_time_interval => INTERVAL '7 days',
        if_not_exists => TRUE
      );
    END IF;
  END IF;
END $$;

COMMENT ON TABLE energy_telemetry IS 'Time-series telemetry data from energy meters (TimescaleDB hypertable)';


-- ============================================================================
-- VIEW: v_tx_energy_meter_registry
-- ============================================================================

-- Drop view if exists to allow recreation
DROP VIEW IF EXISTS v_tx_energy_meter_registry;

-- Create comprehensive meter registry view joining meters with topology and latest telemetry
CREATE VIEW v_tx_energy_meter_registry AS
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
  
  -- Topology references (IDs)
  m.substation_id,
  m.feeder_id,
  m.bay_id,
  m.transformer_id,
  
  -- Resolved topology names
  s.name AS substation_name,
  s.code AS substation_code,
  s.region AS substation_region,
  f.name AS feeder_name,
  f.feeder_code,
  f.direction AS feeder_direction,
  f.voltage_level_kv AS feeder_voltage_kv,
  b.name AS bay_name,
  b.bay_code,
  b.bay_type,
  t.name AS transformer_name,
  t.transformer_code,
  t.rated_capacity_mva AS transformer_capacity_mva,
  
  -- Latest telemetry information
  latest.timestamp AS last_telemetry_at,
  latest.kw AS current_kw,
  latest.kwh AS current_kwh,
  latest.voltage_v AS current_voltage_v,
  latest.power_factor AS current_power_factor,
  latest.frequency_hz AS current_frequency_hz,
  latest.thd_pct AS current_thd_pct,
  
  -- Staleness indicator (telemetry older than 1 hour)
  CASE 
    WHEN latest.timestamp IS NULL THEN true
    WHEN latest.timestamp < (now() - INTERVAL '1 hour') THEN true
    ELSE false
  END AS is_stale,
  
  -- Metadata
  m.created_at,
  m.updated_at
  
FROM energy_meters m

-- Left join to substations
LEFT JOIN tx_substations s ON m.substation_id = s.id

-- Left join to feeders
LEFT JOIN tx_feeders f ON m.feeder_id = f.id

-- Left join to bays
LEFT JOIN tx_bays b ON m.bay_id = b.id

-- Left join to transformers
LEFT JOIN tx_transformers t ON m.transformer_id = t.id

-- Left join lateral to get latest telemetry for each meter
LEFT JOIN LATERAL (
  SELECT 
    timestamp,
    kw,
    kwh,
    voltage_v,
    power_factor,
    frequency_hz,
    thd_pct
  FROM energy_telemetry
  WHERE meter_id = m.id
  ORDER BY timestamp DESC
  LIMIT 1
) latest ON true;

COMMENT ON VIEW v_tx_energy_meter_registry IS 'Comprehensive meter registry view with resolved topology names and latest telemetry';


-- ============================================================================
-- FUNCTION: fn_tx_latest_meter_snapshot
-- ============================================================================

-- Drop function if exists to allow recreation
DROP FUNCTION IF EXISTS fn_tx_latest_meter_snapshot(UUID);

-- Create function to get latest telemetry snapshot with power quality summary
CREATE OR REPLACE FUNCTION fn_tx_latest_meter_snapshot(p_meter_id UUID)
RETURNS TABLE (
  meter_id UUID,
  meter_name TEXT,
  telemetry_timestamp TIMESTAMPTZ,
  kw DECIMAL(12,4),
  kwh DECIMAL(15,4),
  voltage_v DECIMAL(8,2),
  current_a DECIMAL(8,2),
  power_factor DECIMAL(4,3),
  frequency_hz DECIMAL(5,2),
  thd_pct DECIMAL(5,2),
  voltage_l1_v DECIMAL(8,2),
  voltage_l2_v DECIMAL(8,2),
  voltage_l3_v DECIMAL(8,2),
  current_l1_a DECIMAL(8,2),
  current_l2_a DECIMAL(8,2),
  current_l3_a DECIMAL(8,2),
  data_source TEXT,
  quality_score DECIMAL(3,2),
  -- Power quality summary
  pq_avg_power_factor DECIMAL(4,3),
  pq_avg_thd DECIMAL(5,2),
  pq_min_voltage DECIMAL(8,2),
  pq_max_voltage DECIMAL(8,2),
  pq_avg_frequency DECIMAL(5,2)
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Latest telemetry point
    t.meter_id,
    m.name AS meter_name,
    t.timestamp AS telemetry_timestamp,
    t.kw,
    t.kwh,
    t.voltage_v,
    t.current_a,
    t.power_factor,
    t.frequency_hz,
    t.thd_pct,
    t.voltage_l1_v,
    t.voltage_l2_v,
    t.voltage_l3_v,
    t.current_l1_a,
    t.current_l2_a,
    t.current_l3_a,
    t.data_source,
    t.quality_score,
    
    -- Power quality summary from last 24 hours
    pq.avg_power_factor AS pq_avg_power_factor,
    pq.avg_thd AS pq_avg_thd,
    pq.min_voltage AS pq_min_voltage,
    pq.max_voltage AS pq_max_voltage,
    pq.avg_frequency AS pq_avg_frequency
    
  FROM energy_telemetry t
  INNER JOIN energy_meters m ON t.meter_id = m.id
  
  -- Cross join to power quality summary (last 24 hours)
  CROSS JOIN LATERAL (
    SELECT 
      AVG(power_factor) AS avg_power_factor,
      AVG(thd_pct) AS avg_thd,
      MIN(voltage_v) AS min_voltage,
      MAX(voltage_v) AS max_voltage,
      AVG(frequency_hz) AS avg_frequency
    FROM energy_telemetry
    WHERE meter_id = p_meter_id
      AND timestamp >= (now() - INTERVAL '24 hours')
      AND timestamp <= now()
  ) pq
  
  WHERE t.meter_id = p_meter_id
  ORDER BY t.timestamp DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION fn_tx_latest_meter_snapshot(UUID) IS 'Returns latest telemetry point with 24-hour power quality summary for a meter';


-- ============================================================================
-- FUNCTION: fn_calculate_energy_consumption
-- ============================================================================

-- Drop function if exists to allow recreation
DROP FUNCTION IF EXISTS fn_calculate_energy_consumption(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- Create function to calculate total energy consumption for a meter within a time window
CREATE OR REPLACE FUNCTION fn_calculate_energy_consumption(
  p_meter_id UUID,
  p_start_ts TIMESTAMPTZ,
  p_end_ts TIMESTAMPTZ
)
RETURNS TABLE (
  meter_id UUID,
  meter_name TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_kwh DECIMAL(15,4),
  avg_kw DECIMAL(12,4),
  max_kw DECIMAL(12,4),
  min_kw DECIMAL(12,4),
  data_point_count BIGINT,
  avg_power_factor DECIMAL(4,3),
  avg_voltage_v DECIMAL(8,2),
  avg_frequency_hz DECIMAL(5,2)
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Validate inputs
  IF p_start_ts >= p_end_ts THEN
    RAISE EXCEPTION 'start_ts must be before end_ts';
  END IF;
  
  IF p_start_ts > now() THEN
    RAISE EXCEPTION 'start_ts cannot be in the future';
  END IF;
  
  RETURN QUERY
  SELECT 
    p_meter_id AS meter_id,
    m.name AS meter_name,
    p_start_ts AS period_start,
    p_end_ts AS period_end,
    
    -- Calculate total consumption
    -- Use difference between last and first cumulative reading if available
    -- Otherwise sum the instantaneous power readings (approximation)
    COALESCE(
      (MAX(t.kwh) - MIN(t.kwh)),
      (AVG(t.kw) * EXTRACT(EPOCH FROM (p_end_ts - p_start_ts)) / 3600.0)
    )::DECIMAL(15,4) AS total_kwh,
    
    -- Average, max, min power
    AVG(t.kw)::DECIMAL(12,4) AS avg_kw,
    MAX(t.kw)::DECIMAL(12,4) AS max_kw,
    MIN(t.kw)::DECIMAL(12,4) AS min_kw,
    
    -- Data quality metrics
    COUNT(*)::BIGINT AS data_point_count,
    AVG(t.power_factor)::DECIMAL(4,3) AS avg_power_factor,
    AVG(t.voltage_v)::DECIMAL(8,2) AS avg_voltage_v,
    AVG(t.frequency_hz)::DECIMAL(5,2) AS avg_frequency_hz
    
  FROM energy_meters m
  LEFT JOIN energy_telemetry t ON t.meter_id = m.id
    AND t.timestamp >= p_start_ts
    AND t.timestamp <= p_end_ts
  
  WHERE m.id = p_meter_id
  GROUP BY m.id, m.name;
END;
$$;

COMMENT ON FUNCTION fn_calculate_energy_consumption(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates total energy consumption and statistics for a meter within a time window';


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on view to authenticated users
GRANT SELECT ON v_tx_energy_meter_registry TO authenticated;

-- Grant EXECUTE on functions to authenticated users
GRANT EXECUTE ON FUNCTION fn_tx_latest_meter_snapshot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_calculate_energy_consumption(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

