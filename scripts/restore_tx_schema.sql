-- RESTORE TRANSMISSION SCHEMA
-- This script consolidates the transmission system migrations.
-- Run this in your Supabase SQL Editor or via psql to restore missing tables.

-- FROM: 20250114000001_energy_tx_foundation.sql
-- EMS Power Transmission - Foundation Schema
-- Creates transmission topology tables and constraints
-- Requirements: 1.1, 1.2, 1.3, 1.4

-- ============================================================================
-- TRANSMISSION SUBSTATIONS
-- ============================================================================

-- Create tx_substations table with natural key (org_id, code)
CREATE TABLE IF NOT EXISTS tx_substations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  voltage_levels_kv INTEGER[],
  geo JSONB,  -- GeoJSON for location data
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (org_id, code) must be unique
  CONSTRAINT uq_tx_substations_org_code UNIQUE (org_id, code)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_substations_org ON tx_substations(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_substations_active ON tx_substations(org_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_substations_region ON tx_substations(org_id, region);

-- Add comment for documentation
COMMENT ON TABLE tx_substations IS 'Transmission substations - facilities where voltage is transformed and power is switched';
COMMENT ON CONSTRAINT uq_tx_substations_org_code ON tx_substations IS 'Natural key: substations are unique by (org_id, code)';


-- ============================================================================
-- TRANSMISSION BAYS
-- ============================================================================

-- Create tx_bays table
CREATE TABLE IF NOT EXISTS tx_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  substation_id UUID NOT NULL REFERENCES tx_substations(id) ON DELETE CASCADE,
  bay_code TEXT NOT NULL,
  name TEXT NOT NULL,
  bay_type TEXT,  -- 'line_bay', 'transformer_bay', 'bus_coupler', 'reactor_bay'
  voltage_level_kv INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (substation_id, bay_code) must be unique
  CONSTRAINT uq_tx_bays_substation_code UNIQUE (substation_id, bay_code)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_bays_substation ON tx_bays(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_bays_active ON tx_bays(substation_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_bays_type ON tx_bays(bay_type);

-- Add comment for documentation
COMMENT ON TABLE tx_bays IS 'Transmission bays - physical sections within substations containing equipment for specific functions';
COMMENT ON CONSTRAINT uq_tx_bays_substation_code ON tx_bays IS 'Natural key: bays are unique by (substation_id, bay_code)';


-- ============================================================================
-- TRANSMISSION FEEDERS
-- ============================================================================

-- Create tx_feeders table with natural key (substation_id, feeder_code)
CREATE TABLE IF NOT EXISTS tx_feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  substation_id UUID NOT NULL REFERENCES tx_substations(id) ON DELETE CASCADE,
  feeder_code TEXT NOT NULL,
  name TEXT NOT NULL,
  voltage_level_kv INTEGER,
  direction TEXT,  -- 'incomer', 'outgoer'
  utility_ref TEXT,  -- External utility reference
  capacity_mva DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (substation_id, feeder_code) must be unique
  CONSTRAINT uq_tx_feeders_substation_code UNIQUE (substation_id, feeder_code)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_feeders_substation ON tx_feeders(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_feeders_active ON tx_feeders(substation_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_feeders_direction ON tx_feeders(direction);
CREATE INDEX IF NOT EXISTS idx_tx_feeders_voltage ON tx_feeders(voltage_level_kv);

-- Add comment for documentation
COMMENT ON TABLE tx_feeders IS 'Transmission feeders - circuits that deliver power from substations';
COMMENT ON CONSTRAINT uq_tx_feeders_substation_code ON tx_feeders IS 'Natural key: feeders are unique by (substation_id, feeder_code)';


-- ============================================================================
-- TRANSMISSION TRANSFORMERS
-- ============================================================================

-- Create tx_transformers table with natural key (substation_id, transformer_code)
CREATE TABLE IF NOT EXISTS tx_transformers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  substation_id UUID NOT NULL REFERENCES tx_substations(id) ON DELETE CASCADE,
  transformer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  primary_voltage_kv INTEGER,
  secondary_voltage_kv INTEGER,
  tertiary_voltage_kv INTEGER,
  rated_capacity_mva DECIMAL(10,2),
  cooling_type TEXT,  -- 'ONAN', 'ONAF', 'OFAF', 'ODAF'
  tap_changer_type TEXT,  -- 'OLTC', 'DETC', 'none'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (substation_id, transformer_code) must be unique
  CONSTRAINT uq_tx_transformers_substation_code UNIQUE (substation_id, transformer_code)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_transformers_substation ON tx_transformers(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_transformers_active ON tx_transformers(substation_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_transformers_primary_voltage ON tx_transformers(primary_voltage_kv);
CREATE INDEX IF NOT EXISTS idx_tx_transformers_capacity ON tx_transformers(rated_capacity_mva);

-- Add comment for documentation
COMMENT ON TABLE tx_transformers IS 'Transmission transformers - equipment that transforms voltage levels';
COMMENT ON CONSTRAINT uq_tx_transformers_substation_code ON tx_transformers IS 'Natural key: transformers are unique by (substation_id, transformer_code)';


-- ============================================================================
-- TRANSMISSION LINES
-- ============================================================================

-- Create tx_lines table
CREATE TABLE IF NOT EXISTS tx_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  line_code TEXT NOT NULL,
  name TEXT NOT NULL,
  from_substation_id UUID NOT NULL REFERENCES tx_substations(id) ON DELETE RESTRICT,
  to_substation_id UUID NOT NULL REFERENCES tx_substations(id) ON DELETE RESTRICT,
  voltage_level_kv INTEGER,
  length_km DECIMAL(10,2),
  conductor_type TEXT,
  thermal_rating_mva DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (org_id, line_code) must be unique
  CONSTRAINT uq_tx_lines_org_code UNIQUE (org_id, line_code),
  
  -- Check constraint: from and to substations must be different
  CONSTRAINT chk_tx_lines_different_substations CHECK (from_substation_id != to_substation_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_lines_org ON tx_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_lines_from_substation ON tx_lines(from_substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_lines_to_substation ON tx_lines(to_substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_lines_active ON tx_lines(org_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_lines_voltage ON tx_lines(voltage_level_kv);

-- Add comment for documentation
COMMENT ON TABLE tx_lines IS 'Transmission lines - high-voltage lines connecting substations';
COMMENT ON CONSTRAINT uq_tx_lines_org_code ON tx_lines IS 'Natural key: transmission lines are unique by (org_id, line_code)';
COMMENT ON CONSTRAINT chk_tx_lines_different_substations ON tx_lines IS 'Business rule: transmission line endpoints must be different substations';



-- FROM: 20250114000002_extend_energy_meters_tx.sql
-- EMS Power Transmission - Energy Meters with Topology Bindings
-- Extends energy_meters table with transmission topology foreign keys and meter roles
-- Requirements: 1.5, 2.1, 2.2, 2.3

-- ============================================================================
-- METER ROLE ENUM TYPE
-- ============================================================================

-- Create meter_role enum type for transmission meters
DO $$ BEGIN
  CREATE TYPE meter_role_type AS ENUM (
    'grid_incomer',        -- Meter at grid connection point (requires substation_id)
    'feeder_outgoing',     -- Meter on outgoing feeder (requires feeder_id)
    'transformer_lv',      -- Meter on transformer low-voltage side (requires transformer_id)
    'station_service',     -- Meter for substation auxiliary services (requires substation_id)
    'line_monitoring',     -- Meter monitoring transmission line (optional topology)
    'bay_metering'         -- Meter within a specific bay (requires bay_id)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE meter_role_type IS 'Meter roles defining the function and required topology bindings for transmission meters';


-- ============================================================================
-- METER STATUS ENUM TYPE
-- ============================================================================

-- Create meter_status enum type
DO $$ BEGIN
  CREATE TYPE meter_status_type AS ENUM (
    'Normal',
    'High',
    'Critical',
    'Offline',
    'Maintenance'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE meter_status_type IS 'Operational status of energy meters';


-- ============================================================================
-- ENERGY TYPE ENUM TYPE
-- ============================================================================

-- Create energy_type enum type
DO $$ BEGIN
  CREATE TYPE energy_type AS ENUM (
    'electricity',
    'gas',
    'diesel',
    'steam',
    'water',
    'compressed_air'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE energy_type IS 'Types of energy that can be measured by meters';


-- ============================================================================
-- ENERGY METERS TABLE
-- ============================================================================

-- Create energy_meters table with transmission topology bindings
CREATE TABLE IF NOT EXISTS energy_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Basic meter information
  name TEXT NOT NULL,
  meter_code TEXT,  -- Optional external meter code/identifier
  status meter_status_type DEFAULT 'Normal',
  energy_types energy_type[] NOT NULL DEFAULT ARRAY['electricity']::energy_type[],
  
  -- Transmission topology bindings (nullable - not all meters are topology-bound)
  substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL,
  feeder_id UUID REFERENCES tx_feeders(id) ON DELETE SET NULL,
  bay_id UUID REFERENCES tx_bays(id) ON DELETE SET NULL,
  transformer_id UUID REFERENCES tx_transformers(id) ON DELETE SET NULL,
  
  -- Meter role defines the function and required topology
  meter_role meter_role_type,
  
  -- Technical specifications
  meter_type TEXT,  -- 'main', 'submeter', 'check_meter'
  scope TEXT,  -- 'building', 'floor', 'department', 'process_line', 'substation', 'feeder'
  location TEXT,
  installation_date DATE,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  communication_protocol TEXT,
  meter_constant DECIMAL(10,4) DEFAULT 1.0,
  
  -- Operational data
  current_demand_kw DECIMAL(12,4),
  rated_capacity_kw DECIMAL(12,4),
  
  -- Metadata and audit
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Natural key constraint: (org_id, meter_code) should be unique when meter_code is provided
  CONSTRAINT uq_energy_meters_org_code UNIQUE NULLS NOT DISTINCT (org_id, meter_code),
  
  -- Check constraints for role-based topology requirements
  -- grid_incomer role requires substation_id
  CONSTRAINT chk_meter_role_grid_incomer 
    CHECK (meter_role != 'grid_incomer' OR substation_id IS NOT NULL),
  
  -- feeder_outgoing role requires feeder_id
  CONSTRAINT chk_meter_role_feeder_outgoing 
    CHECK (meter_role != 'feeder_outgoing' OR feeder_id IS NOT NULL),
  
  -- transformer_lv role requires transformer_id
  CONSTRAINT chk_meter_role_transformer_lv 
    CHECK (meter_role != 'transformer_lv' OR transformer_id IS NOT NULL),
  
  -- station_service role requires substation_id
  CONSTRAINT chk_meter_role_station_service 
    CHECK (meter_role != 'station_service' OR substation_id IS NOT NULL),
  
  -- bay_metering role requires bay_id
  CONSTRAINT chk_meter_role_bay_metering 
    CHECK (meter_role != 'bay_metering' OR bay_id IS NOT NULL)
);


-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_meters_org ON energy_meters(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_meters_site ON energy_meters(site_id);
CREATE INDEX IF NOT EXISTS idx_energy_meters_status ON energy_meters(org_id, status);
CREATE INDEX IF NOT EXISTS idx_energy_meters_active ON energy_meters(org_id, active);

-- Indexes on transmission topology foreign keys for efficient joins
CREATE INDEX IF NOT EXISTS idx_energy_meters_substation ON energy_meters(substation_id) WHERE substation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_meters_feeder ON energy_meters(feeder_id) WHERE feeder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_meters_bay ON energy_meters(bay_id) WHERE bay_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_meters_transformer ON energy_meters(transformer_id) WHERE transformer_id IS NOT NULL;

-- Index on meter_role for filtering by role
CREATE INDEX IF NOT EXISTS idx_energy_meters_role ON energy_meters(meter_role) WHERE meter_role IS NOT NULL;

-- Composite index for common topology + status queries
CREATE INDEX IF NOT EXISTS idx_energy_meters_substation_status ON energy_meters(substation_id, status) WHERE substation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_meters_feeder_status ON energy_meters(feeder_id, status) WHERE feeder_id IS NOT NULL;

-- Index for energy_types array queries (GIN index for array containment)
CREATE INDEX IF NOT EXISTS idx_energy_meters_energy_types ON energy_meters USING GIN(energy_types);


-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE energy_meters IS 'Energy meters with transmission topology bindings for grid-aware monitoring';
COMMENT ON COLUMN energy_meters.meter_role IS 'Defines the meter function and required topology bindings';
COMMENT ON COLUMN energy_meters.substation_id IS 'Link to substation (required for grid_incomer and station_service roles)';
COMMENT ON COLUMN energy_meters.feeder_id IS 'Link to feeder (required for feeder_outgoing role)';
COMMENT ON COLUMN energy_meters.bay_id IS 'Link to bay (required for bay_metering role)';
COMMENT ON COLUMN energy_meters.transformer_id IS 'Link to transformer (required for transformer_lv role)';
COMMENT ON COLUMN energy_meters.energy_types IS 'Array of energy types measured by this meter';

COMMENT ON CONSTRAINT uq_energy_meters_org_code ON energy_meters IS 'Natural key: meters are unique by (org_id, meter_code) when meter_code is provided';
COMMENT ON CONSTRAINT chk_meter_role_grid_incomer ON energy_meters IS 'Business rule: grid_incomer meters must have substation_id';
COMMENT ON CONSTRAINT chk_meter_role_feeder_outgoing ON energy_meters IS 'Business rule: feeder_outgoing meters must have feeder_id';
COMMENT ON CONSTRAINT chk_meter_role_transformer_lv ON energy_meters IS 'Business rule: transformer_lv meters must have transformer_id';
COMMENT ON CONSTRAINT chk_meter_role_station_service ON energy_meters IS 'Business rule: station_service meters must have substation_id';
COMMENT ON CONSTRAINT chk_meter_role_bay_metering ON energy_meters IS 'Business rule: bay_metering meters must have bay_id';



-- FROM: 20250114000003_tx_views_and_functions.sql
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
