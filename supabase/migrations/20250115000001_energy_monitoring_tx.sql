-- EMS Power Transmission - Monitoring Schema Extensions
-- Extends energy_baselines and creates monitoring-specific tables
-- Requirements: 4.1, 4.2, 4.3, 6.3, 6.8

-- ============================================================================
-- EXTEND ENERGY BASELINES FOR TRANSMISSION METRICS
-- ============================================================================

-- Create energy_baselines table if it doesn't exist (from generic EMS schema)
CREATE TABLE IF NOT EXISTS energy_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  baseline_name TEXT NOT NULL,
  baseline_type TEXT,  -- 'historical', 'engineered', 'regression', 'seasonal', 'rolling'
  baseline_period_start DATE NOT NULL,
  baseline_period_end DATE NOT NULL,
  baseline_value DECIMAL(15,4) NOT NULL,
  baseline_unit TEXT NOT NULL,
  normalization_factors JSONB DEFAULT '{}',
  calculation_method TEXT,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  r_squared DECIMAL(4,3),
  cv_rmse DECIMAL(5,2),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add transmission-specific baseline columns
ALTER TABLE energy_baselines 
  ADD COLUMN IF NOT EXISTS baseline_kwh_per_mwh_delivered DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS baseline_kwh_per_mw_peak DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS baseline_method TEXT;  -- 'regression', 'seasonal', 'rolling'

-- Create index on meter_id and active for common queries
CREATE INDEX IF NOT EXISTS idx_energy_baselines_meter ON energy_baselines(meter_id);
CREATE INDEX IF NOT EXISTS idx_energy_baselines_meter_active ON energy_baselines(meter_id, active);
CREATE INDEX IF NOT EXISTS idx_energy_baselines_period ON energy_baselines(baseline_period_start, baseline_period_end);

-- Add exclusion constraint to prevent overlapping baseline periods for the same meter
-- This uses the btree_gist extension for range overlap detection
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint (optional but recommended)
-- This prevents overlapping baseline periods for the same meter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'excl_energy_baselines_meter_period_overlap'
  ) THEN
    ALTER TABLE energy_baselines
      ADD CONSTRAINT excl_energy_baselines_meter_period_overlap
      EXCLUDE USING gist (
        meter_id WITH =,
        daterange(baseline_period_start, baseline_period_end, '[]') WITH &&
      )
      WHERE (active = true);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN energy_baselines.baseline_kwh_per_mwh_delivered IS 'Transmission-specific: baseline consumption per MWh delivered through the grid';
COMMENT ON COLUMN energy_baselines.baseline_kwh_per_mw_peak IS 'Transmission-specific: baseline consumption per MW peak demand';
COMMENT ON COLUMN energy_baselines.baseline_method IS 'Method used for baseline calculation: regression, seasonal, or rolling average';
COMMENT ON CONSTRAINT excl_energy_baselines_meter_period_overlap ON energy_baselines IS 'Prevents overlapping baseline periods for the same active meter';


-- ============================================================================
-- TRANSMISSION METER CHANNELS
-- ============================================================================

-- Create tx_meter_channels table for multi-channel meters
CREATE TABLE IF NOT EXISTS tx_meter_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  channel_number INTEGER NOT NULL,
  channel_name TEXT NOT NULL,
  channel_type TEXT,  -- 'main', 'auxiliary', 'check', 'redundant'
  measurement_type TEXT,  -- 'active_power', 'reactive_power', 'voltage', 'current', 'frequency'
  phase TEXT,  -- 'L1', 'L2', 'L3', 'N', 'L1-L2', 'L2-L3', 'L3-L1', '3-phase'
  unit TEXT,  -- 'kW', 'kVAr', 'V', 'A', 'Hz'
  multiplier DECIMAL(10,4) DEFAULT 1.0,
  offset_value DECIMAL(10,4) DEFAULT 0.0,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (meter_id, channel_number) must be unique
  CONSTRAINT uq_tx_meter_channels_meter_channel UNIQUE (meter_id, channel_number)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_meter_channels_meter ON tx_meter_channels(meter_id);
CREATE INDEX IF NOT EXISTS idx_tx_meter_channels_active ON tx_meter_channels(meter_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_meter_channels_type ON tx_meter_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_tx_meter_channels_measurement ON tx_meter_channels(measurement_type);

-- Add comments
COMMENT ON TABLE tx_meter_channels IS 'Multi-channel meter configuration for meters with multiple measurement channels';
COMMENT ON COLUMN tx_meter_channels.channel_number IS 'Physical channel number on the meter device';
COMMENT ON COLUMN tx_meter_channels.multiplier IS 'Multiplier applied to raw channel readings';
COMMENT ON COLUMN tx_meter_channels.offset_value IS 'Offset applied to raw channel readings after multiplication';
COMMENT ON CONSTRAINT uq_tx_meter_channels_meter_channel ON tx_meter_channels IS 'Natural key: channels are unique by (meter_id, channel_number)';


-- ============================================================================
-- TRANSMISSION POWER QUALITY LIMITS
-- ============================================================================

-- Create tx_power_quality_limits table for voltage-level-specific thresholds
CREATE TABLE IF NOT EXISTS tx_power_quality_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  voltage_level_kv INTEGER NOT NULL,
  limit_type TEXT NOT NULL,  -- 'voltage_sag', 'voltage_swell', 'thd_voltage', 'thd_current', 'frequency_deviation', 'power_factor'
  severity TEXT NOT NULL,  -- 'Low', 'Medium', 'High', 'Critical'
  
  -- Threshold values (use appropriate field based on limit_type)
  min_value DECIMAL(12,4),
  max_value DECIMAL(12,4),
  duration_threshold_ms INTEGER,  -- Minimum duration to trigger event
  
  -- Metadata
  standard_reference TEXT,  -- e.g., 'IEEE 1159', 'IEC 61000-4-30', 'Grid Code'
  description TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (org_id, voltage_level_kv, limit_type, severity) must be unique
  CONSTRAINT uq_tx_pq_limits_org_voltage_type_severity UNIQUE (org_id, voltage_level_kv, limit_type, severity)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_pq_limits_org ON tx_power_quality_limits(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_pq_limits_voltage ON tx_power_quality_limits(voltage_level_kv);
CREATE INDEX IF NOT EXISTS idx_tx_pq_limits_type ON tx_power_quality_limits(limit_type);
CREATE INDEX IF NOT EXISTS idx_tx_pq_limits_active ON tx_power_quality_limits(org_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_pq_limits_voltage_type ON tx_power_quality_limits(voltage_level_kv, limit_type, active);

-- Add comments
COMMENT ON TABLE tx_power_quality_limits IS 'Voltage-level-specific power quality thresholds for transmission grid monitoring';
COMMENT ON COLUMN tx_power_quality_limits.voltage_level_kv IS 'Voltage level in kV (e.g., 132, 220, 400)';
COMMENT ON COLUMN tx_power_quality_limits.limit_type IS 'Type of power quality parameter being limited';
COMMENT ON COLUMN tx_power_quality_limits.duration_threshold_ms IS 'Minimum duration in milliseconds for event to be triggered';
COMMENT ON COLUMN tx_power_quality_limits.standard_reference IS 'Industry standard or grid code reference for this limit';
COMMENT ON CONSTRAINT uq_tx_pq_limits_org_voltage_type_severity ON tx_power_quality_limits IS 'Natural key: PQ limits are unique by (org_id, voltage_level_kv, limit_type, severity)';


-- ============================================================================
-- POWER QUALITY EVENTS TABLE
-- ============================================================================

-- Create power_quality_events table if it doesn't exist (from generic EMS schema)
CREATE TABLE IF NOT EXISTS power_quality_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'sag', 'swell', 'thd_high', 'frequency_deviation', 'pf_low'
  timestamp TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER,
  magnitude DECIMAL(8,2),
  pre_event_value DECIMAL(8,2),
  post_event_value DECIMAL(8,2),
  affected_phases TEXT,  -- 'L1', 'L2', 'L3', 'L1,L2', etc.
  severity TEXT DEFAULT 'Low',  -- 'Low', 'Medium', 'High', 'Critical'
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add partial index on unresolved power quality events for efficient filtering
CREATE INDEX IF NOT EXISTS idx_power_quality_events_unresolved 
  ON power_quality_events(meter_id, timestamp DESC) 
  WHERE resolved = false;

-- Create index on meter_id for common queries
CREATE INDEX IF NOT EXISTS idx_power_quality_events_meter ON power_quality_events(meter_id);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_power_quality_events_timestamp ON power_quality_events(timestamp DESC);

-- Create index on event_type and severity for filtering
CREATE INDEX IF NOT EXISTS idx_power_quality_events_type_severity ON power_quality_events(event_type, severity);

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_power_quality_events_meter_resolved ON power_quality_events(meter_id, resolved, timestamp DESC);

-- Add check constraint for resolved timestamp
ALTER TABLE power_quality_events
  DROP CONSTRAINT IF EXISTS chk_power_quality_events_resolved_at,
  ADD CONSTRAINT chk_power_quality_events_resolved_at 
    CHECK (resolved = false OR resolved_at IS NOT NULL);

-- Add check constraint for resolution notes when resolved
ALTER TABLE power_quality_events
  DROP CONSTRAINT IF EXISTS chk_power_quality_events_resolution_notes,
  ADD CONSTRAINT chk_power_quality_events_resolution_notes 
    CHECK (resolved = false OR resolution_notes IS NOT NULL);

-- Add comments
COMMENT ON TABLE power_quality_events IS 'Discrete power quality events detected from telemetry monitoring';
COMMENT ON INDEX idx_power_quality_events_unresolved IS 'Partial index for efficient filtering of unresolved PQ events';
COMMENT ON CONSTRAINT chk_power_quality_events_resolved_at ON power_quality_events IS 'Business rule: resolved events must have resolved_at timestamp';
COMMENT ON CONSTRAINT chk_power_quality_events_resolution_notes ON power_quality_events IS 'Business rule: resolved events must have resolution notes';


-- ============================================================================
-- SUBMETERS TABLE
-- ============================================================================

-- Create submeters table for sub-meter hierarchy
CREATE TABLE IF NOT EXISTS submeters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  submeter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5,2),  -- Optional: percentage of parent meter allocated to this submeter
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent self-referencing
  CONSTRAINT chk_submeters_not_self CHECK (parent_meter_id != submeter_id),
  
  -- Unique constraint: a submeter can only have one parent
  CONSTRAINT uq_submeters_submeter UNIQUE (submeter_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submeters_parent ON submeters(parent_meter_id);
CREATE INDEX IF NOT EXISTS idx_submeters_submeter ON submeters(submeter_id);
CREATE INDEX IF NOT EXISTS idx_submeters_parent_active ON submeters(parent_meter_id, active);

-- Add comments
COMMENT ON TABLE submeters IS 'Hierarchical relationship between parent meters and sub-meters';
COMMENT ON COLUMN submeters.allocation_percentage IS 'Optional percentage of parent meter consumption allocated to this submeter';
COMMENT ON CONSTRAINT chk_submeters_not_self ON submeters IS 'Business rule: a meter cannot be its own submeter';
COMMENT ON CONSTRAINT uq_submeters_submeter ON submeters IS 'Business rule: a submeter can only have one parent meter';


-- ============================================================================
-- ENERGY TELEMETRY TABLE
-- ============================================================================

-- Create energy_telemetry table if it doesn't exist (from generic EMS schema)
-- This is a TimescaleDB hypertable for time-series data
CREATE TABLE IF NOT EXISTS energy_telemetry (
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  kw DECIMAL(12,4),
  kwh DECIMAL(15,4),
  kvar DECIMAL(12,4),
  kvarh DECIMAL(15,4),
  voltage_v DECIMAL(8,2),
  current_a DECIMAL(8,2),
  frequency_hz DECIMAL(5,2),
  power_factor DECIMAL(4,3),
  thd_pct DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Primary key on (meter_id, timestamp) for hypertable
  PRIMARY KEY (meter_id, timestamp)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_meter ON energy_telemetry(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_telemetry_timestamp ON energy_telemetry(timestamp DESC);

-- Convert to TimescaleDB hypertable if not already converted
-- This will fail silently if already a hypertable
DO $$
BEGIN
  PERFORM create_hypertable('energy_telemetry', 'timestamp', if_not_exists => TRUE);
EXCEPTION
  WHEN OTHERS THEN
    -- Table might already be a hypertable, ignore error
    NULL;
END $$;

-- Add comments
COMMENT ON TABLE energy_telemetry IS 'Time-series energy telemetry data from meters (TimescaleDB hypertable)';


-- ============================================================================
-- POWER QUALITY TABLE
-- ============================================================================

-- Create power_quality table if it doesn't exist (from generic EMS schema)
CREATE TABLE IF NOT EXISTS power_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  power_factor DECIMAL(4,3),
  thd_voltage_pct DECIMAL(5,2),
  thd_current_pct DECIMAL(5,2),
  voltage_l1 DECIMAL(8,2),
  voltage_l2 DECIMAL(8,2),
  voltage_l3 DECIMAL(8,2),
  current_l1 DECIMAL(8,2),
  current_l2 DECIMAL(8,2),
  current_l3 DECIMAL(8,2),
  frequency DECIMAL(5,2),
  voltage_imbalance_pct DECIMAL(5,2),
  current_imbalance_pct DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_power_quality_meter ON power_quality(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_power_quality_timestamp ON power_quality(timestamp DESC);

-- Add comments
COMMENT ON TABLE power_quality IS 'Detailed power quality measurements from meters';

