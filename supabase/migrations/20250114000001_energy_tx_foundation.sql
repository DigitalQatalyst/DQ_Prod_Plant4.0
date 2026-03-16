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
