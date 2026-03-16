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
