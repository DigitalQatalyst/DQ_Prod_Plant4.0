-- EMS Power Transmission - Control Schema Extensions
-- Creates control tables for controllable loads, DR events, asset modes, and integrations
-- Requirements: 13.1, 14.1, 15.1, 16.1, 17.1

-- ============================================================================
-- CONTROLLABLE LOADS TABLE
-- ============================================================================

-- Create controllable_loads table for equipment that can be remotely controlled
CREATE TABLE IF NOT EXISTS controllable_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  load_code TEXT NOT NULL,  -- Natural key: unique identifier within org
  name TEXT NOT NULL,
  description TEXT,
  
  -- Location and topology
  substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL,
  feeder_id UUID REFERENCES tx_feeders(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  meter_id UUID REFERENCES energy_meters(id) ON DELETE SET NULL,
  
  -- Load characteristics
  load_type TEXT NOT NULL,  -- 'transformer_tap', 'capacitor_bank', 'hvac', 'pump', 'compressor', 'lighting', 'process_load'
  load_capacity_kw DECIMAL(10,2) NOT NULL,
  min_load_kw DECIMAL(10,2) DEFAULT 0,
  max_load_kw DECIMAL(10,2),
  
  -- Control configuration
  controllable BOOLEAN DEFAULT true,
  control_method TEXT,  -- 'scada', 'modbus', 'bacnet', 'manual', 'api'
  control_endpoint TEXT,  -- Connection details for control system
  
  -- Current state
  current_mode TEXT,
  current_load_kw DECIMAL(10,2),
  last_mode_change_at TIMESTAMPTZ,
  last_control_command_at TIMESTAMPTZ,
  
  -- Control constraints
  min_off_time_minutes INTEGER DEFAULT 0,  -- Minimum time load must stay off
  min_on_time_minutes INTEGER DEFAULT 0,   -- Minimum time load must stay on
  max_cycles_per_day INTEGER,              -- Maximum number of on/off cycles per day
  priority INTEGER DEFAULT 50,             -- Priority for load shedding (1=highest, 100=lowest)
  shed_group TEXT,                         -- Group identifier for coordinated shedding
  
  -- Operational constraints
  operational_constraints JSONB DEFAULT '{}',  -- Additional constraints (temperature limits, process requirements, etc.)
  available_modes TEXT[] DEFAULT ARRAY[]::TEXT[],  -- List of available operational modes
  
  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'inactive', 'maintenance', 'fault'
  status_reason TEXT,
  active BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_controllable_loads_org_code UNIQUE (org_id, load_code),
  
  -- Check constraints
  CONSTRAINT chk_controllable_loads_capacity CHECK (load_capacity_kw > 0),
  CONSTRAINT chk_controllable_loads_min_max CHECK (min_load_kw <= max_load_kw),
  CONSTRAINT chk_controllable_loads_current_load CHECK (current_load_kw IS NULL OR current_load_kw >= 0),
  CONSTRAINT chk_controllable_loads_priority CHECK (priority >= 1 AND priority <= 100),
  CONSTRAINT chk_controllable_loads_type CHECK (load_type IN ('transformer_tap', 'capacitor_bank', 'hvac', 'pump', 'compressor', 'lighting', 'process_load', 'battery_storage', 'ev_charger')),
  CONSTRAINT chk_controllable_loads_status CHECK (status IN ('active', 'inactive', 'maintenance', 'fault')),
  CONSTRAINT chk_controllable_loads_control_method CHECK (control_method IS NULL OR control_method IN ('scada', 'modbus', 'bacnet', 'manual', 'api', 'iec61850', 'dnp3'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_controllable_loads_org ON controllable_loads(org_id);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_substation ON controllable_loads(substation_id);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_feeder ON controllable_loads(feeder_id);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_asset ON controllable_loads(asset_id);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_meter ON controllable_loads(meter_id);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_type ON controllable_loads(load_type);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_status ON controllable_loads(status);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_controllable ON controllable_loads(org_id, controllable) WHERE controllable = true;
CREATE INDEX IF NOT EXISTS idx_controllable_loads_priority ON controllable_loads(priority, load_capacity_kw DESC);
CREATE INDEX IF NOT EXISTS idx_controllable_loads_shed_group ON controllable_loads(shed_group) WHERE shed_group IS NOT NULL;

-- Enable RLS
ALTER TABLE controllable_loads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY controllable_loads_tenant_isolation ON controllable_loads
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON controllable_loads TO authenticated;

-- Add comments
COMMENT ON TABLE controllable_loads IS 'Registry of controllable equipment for demand response and load management';
COMMENT ON COLUMN controllable_loads.load_code IS 'Natural key: unique identifier within organization';
COMMENT ON COLUMN controllable_loads.priority IS 'Priority for load shedding (1=highest priority to keep on, 100=lowest)';
COMMENT ON COLUMN controllable_loads.shed_group IS 'Group identifier for coordinated load shedding';
COMMENT ON COLUMN controllable_loads.operational_constraints IS 'JSON object with additional constraints (temperature limits, process requirements, etc.)';


-- ============================================================================
-- GENERATION ASSETS TABLE
-- ============================================================================

-- Create generation_assets table for on-site generation
CREATE TABLE IF NOT EXISTS generation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,  -- Natural key
  name TEXT NOT NULL,
  description TEXT,
  
  -- Location and topology
  substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL,
  feeder_id UUID REFERENCES tx_feeders(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  meter_id UUID REFERENCES energy_meters(id) ON DELETE SET NULL,
  
  -- Generation characteristics
  generation_type TEXT NOT NULL,  -- 'solar', 'wind', 'diesel_generator', 'gas_turbine', 'battery_storage', 'fuel_cell'
  fuel_type TEXT,  -- 'diesel', 'natural_gas', 'solar', 'wind', 'battery', 'hydrogen'
  rated_capacity_kw DECIMAL(10,2) NOT NULL,
  min_output_kw DECIMAL(10,2) DEFAULT 0,
  max_output_kw DECIMAL(10,2),
  
  -- Current state
  current_output_kw DECIMAL(10,2),
  operational_status TEXT DEFAULT 'offline',  -- 'online', 'offline', 'standby', 'maintenance', 'fault'
  last_start_at TIMESTAMPTZ,
  last_stop_at TIMESTAMPTZ,
  
  -- Operational parameters
  startup_time_minutes INTEGER,
  shutdown_time_minutes INTEGER,
  min_run_time_minutes INTEGER,
  max_run_time_hours INTEGER,
  
  -- Renewable energy tracking
  renewable BOOLEAN DEFAULT false,
  renewable_percentage DECIMAL(5,2) DEFAULT 0,  -- For hybrid systems
  ppa_contract_id TEXT,  -- Reference to PPA contract
  rec_eligible BOOLEAN DEFAULT false,  -- Eligible for Renewable Energy Credits
  
  -- Emissions
  emission_factor_kg_co2_per_kwh DECIMAL(8,6),
  
  -- Status
  active BOOLEAN DEFAULT true,
  commissioned_date DATE,
  decommissioned_date DATE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_generation_assets_org_code UNIQUE (org_id, asset_code),
  
  -- Check constraints
  CONSTRAINT chk_generation_assets_capacity CHECK (rated_capacity_kw > 0),
  CONSTRAINT chk_generation_assets_min_max CHECK (min_output_kw <= max_output_kw),
  CONSTRAINT chk_generation_assets_current_output CHECK (current_output_kw IS NULL OR current_output_kw >= 0),
  CONSTRAINT chk_generation_assets_renewable_pct CHECK (renewable_percentage >= 0 AND renewable_percentage <= 100),
  CONSTRAINT chk_generation_assets_type CHECK (generation_type IN ('solar', 'wind', 'diesel_generator', 'gas_turbine', 'battery_storage', 'fuel_cell', 'hydro', 'biomass')),
  CONSTRAINT chk_generation_assets_status CHECK (operational_status IN ('online', 'offline', 'standby', 'maintenance', 'fault')),
  CONSTRAINT chk_generation_assets_dates CHECK (decommissioned_date IS NULL OR decommissioned_date >= commissioned_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generation_assets_org ON generation_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_generation_assets_substation ON generation_assets(substation_id);
CREATE INDEX IF NOT EXISTS idx_generation_assets_feeder ON generation_assets(feeder_id);
CREATE INDEX IF NOT EXISTS idx_generation_assets_site ON generation_assets(site_id);
CREATE INDEX IF NOT EXISTS idx_generation_assets_type ON generation_assets(generation_type);
CREATE INDEX IF NOT EXISTS idx_generation_assets_status ON generation_assets(operational_status);
CREATE INDEX IF NOT EXISTS idx_generation_assets_renewable ON generation_assets(org_id, renewable) WHERE renewable = true;
CREATE INDEX IF NOT EXISTS idx_generation_assets_active ON generation_assets(org_id, active) WHERE active = true;

-- Enable RLS
ALTER TABLE generation_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY generation_assets_tenant_isolation ON generation_assets
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON generation_assets TO authenticated;

-- Add comments
COMMENT ON TABLE generation_assets IS 'On-site generation assets including renewables and backup generators';
COMMENT ON COLUMN generation_assets.renewable_percentage IS 'Percentage of renewable energy for hybrid systems (0-100)';
COMMENT ON COLUMN generation_assets.rec_eligible IS 'Whether the asset is eligible for Renewable Energy Credits';


-- ============================================================================
-- DEMAND RESPONSE EVENTS TABLE
-- ============================================================================

-- Create demand_response_events table for DR event management
CREATE TABLE IF NOT EXISTS demand_response_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,  -- Natural key
  event_name TEXT NOT NULL,
  description TEXT,
  
  -- Event timing
  event_window_start TIMESTAMPTZ NOT NULL,
  event_window_end TIMESTAMPTZ NOT NULL,
  notification_time TIMESTAMPTZ,  -- When participants were notified
  
  -- Load reduction targets
  target_reduction_kw DECIMAL(10,2) NOT NULL,
  actual_reduction_kw DECIMAL(10,2),
  baseline_load_kw DECIMAL(10,2),  -- Baseline load before DR event
  
  -- Participating loads
  participating_loads UUID[] DEFAULT ARRAY[]::UUID[],  -- Array of controllable_load IDs
  participating_load_capacity_kw DECIMAL(10,2),  -- Total capacity of participating loads
  
  -- Event status
  event_status TEXT DEFAULT 'planned',  -- 'planned', 'active', 'completed', 'cancelled'
  cancellation_reason TEXT,
  
  -- Performance tracking
  performance_percentage DECIMAL(5,2),  -- Actual vs target reduction percentage
  estimated_savings_usd DECIMAL(10,2),
  actual_savings_usd DECIMAL(10,2),
  
  -- Event metadata
  event_type TEXT DEFAULT 'manual',  -- 'manual', 'automated', 'utility_signal', 'price_response'
  utility_program TEXT,  -- Name of utility DR program
  trigger_condition TEXT,  -- What triggered the event
  
  -- Responsible parties
  created_by UUID,  -- User who created the event
  approved_by UUID,  -- User who approved the event
  executed_by UUID,  -- User who executed the event
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_demand_response_events_org_code UNIQUE (org_id, event_code),
  
  -- Check constraints
  CONSTRAINT chk_demand_response_events_window CHECK (event_window_end > event_window_start),
  CONSTRAINT chk_demand_response_events_target CHECK (target_reduction_kw > 0),
  CONSTRAINT chk_demand_response_events_actual CHECK (actual_reduction_kw IS NULL OR actual_reduction_kw >= 0),
  CONSTRAINT chk_demand_response_events_performance CHECK (performance_percentage IS NULL OR performance_percentage >= 0),
  CONSTRAINT chk_demand_response_events_status CHECK (event_status IN ('planned', 'active', 'completed', 'cancelled')),
  CONSTRAINT chk_demand_response_events_type CHECK (event_type IN ('manual', 'automated', 'utility_signal', 'price_response'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demand_response_events_org ON demand_response_events(org_id);
CREATE INDEX IF NOT EXISTS idx_demand_response_events_status ON demand_response_events(event_status);
CREATE INDEX IF NOT EXISTS idx_demand_response_events_window_start ON demand_response_events(event_window_start DESC);
CREATE INDEX IF NOT EXISTS idx_demand_response_events_window_end ON demand_response_events(event_window_end DESC);
CREATE INDEX IF NOT EXISTS idx_demand_response_events_org_status ON demand_response_events(org_id, event_status);
CREATE INDEX IF NOT EXISTS idx_demand_response_events_created_by ON demand_response_events(created_by);

-- GIN index for participating_loads array
CREATE INDEX IF NOT EXISTS idx_demand_response_events_loads_gin ON demand_response_events USING GIN (participating_loads);

-- Enable RLS
ALTER TABLE demand_response_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY demand_response_events_tenant_isolation ON demand_response_events
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON demand_response_events TO authenticated;

-- Add comments
COMMENT ON TABLE demand_response_events IS 'Demand response events for coordinated load reduction during peak periods';
COMMENT ON COLUMN demand_response_events.participating_loads IS 'Array of controllable_load UUIDs participating in the event';
COMMENT ON COLUMN demand_response_events.performance_percentage IS 'Actual reduction as percentage of target (actual/target * 100)';


-- ============================================================================
-- ASSET MODES TABLE
-- ============================================================================

-- Create asset_modes table for operational mode definitions
CREATE TABLE IF NOT EXISTS asset_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES controllable_loads(id) ON DELETE CASCADE,
  mode_code TEXT NOT NULL,  -- Natural key within load
  mode_name TEXT NOT NULL,
  description TEXT,
  
  -- Power consumption
  power_consumption_kw DECIMAL(10,2) NOT NULL,
  min_power_kw DECIMAL(10,2),
  max_power_kw DECIMAL(10,2),
  
  -- Operational constraints
  min_duration_minutes INTEGER,  -- Minimum time in this mode
  max_duration_minutes INTEGER,  -- Maximum time in this mode
  transition_time_seconds INTEGER DEFAULT 0,  -- Time to transition to this mode
  
  -- Mode characteristics
  mode_type TEXT DEFAULT 'normal',  -- 'normal', 'reduced', 'standby', 'off', 'peak_shaving', 'emergency'
  efficiency_rating DECIMAL(5,2),  -- Efficiency percentage (0-100)
  comfort_impact TEXT,  -- 'none', 'minimal', 'moderate', 'significant'
  process_impact TEXT,  -- 'none', 'minimal', 'moderate', 'significant'
  
  -- Availability
  available_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],  -- Days when mode is available
  available_hours_start TIME,  -- Start of availability window
  available_hours_end TIME,    -- End of availability window
  
  -- Status
  active BOOLEAN DEFAULT true,
  default_mode BOOLEAN DEFAULT false,  -- Is this the default/normal operating mode
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_asset_modes_load_code UNIQUE (load_id, mode_code),
  
  -- Check constraints
  CONSTRAINT chk_asset_modes_power CHECK (power_consumption_kw >= 0),
  CONSTRAINT chk_asset_modes_min_max_power CHECK (min_power_kw IS NULL OR max_power_kw IS NULL OR min_power_kw <= max_power_kw),
  CONSTRAINT chk_asset_modes_duration CHECK (min_duration_minutes IS NULL OR max_duration_minutes IS NULL OR min_duration_minutes <= max_duration_minutes),
  CONSTRAINT chk_asset_modes_efficiency CHECK (efficiency_rating IS NULL OR (efficiency_rating >= 0 AND efficiency_rating <= 100)),
  CONSTRAINT chk_asset_modes_type CHECK (mode_type IN ('normal', 'reduced', 'standby', 'off', 'peak_shaving', 'emergency')),
  CONSTRAINT chk_asset_modes_comfort_impact CHECK (comfort_impact IS NULL OR comfort_impact IN ('none', 'minimal', 'moderate', 'significant')),
  CONSTRAINT chk_asset_modes_process_impact CHECK (process_impact IS NULL OR process_impact IN ('none', 'minimal', 'moderate', 'significant'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_modes_org ON asset_modes(org_id);
CREATE INDEX IF NOT EXISTS idx_asset_modes_load ON asset_modes(load_id);
CREATE INDEX IF NOT EXISTS idx_asset_modes_type ON asset_modes(mode_type);
CREATE INDEX IF NOT EXISTS idx_asset_modes_active ON asset_modes(load_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_asset_modes_default ON asset_modes(load_id) WHERE default_mode = true;

-- Enable RLS
ALTER TABLE asset_modes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY asset_modes_tenant_isolation ON asset_modes
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON asset_modes TO authenticated;

-- Add comments
COMMENT ON TABLE asset_modes IS 'Operational mode definitions for controllable loads';
COMMENT ON COLUMN asset_modes.mode_code IS 'Natural key: unique identifier within load';
COMMENT ON COLUMN asset_modes.default_mode IS 'Whether this is the default/normal operating mode for the load';
COMMENT ON COLUMN asset_modes.comfort_impact IS 'Impact on occupant comfort (for HVAC and lighting loads)';
COMMENT ON COLUMN asset_modes.process_impact IS 'Impact on process operations (for industrial loads)';


-- ============================================================================
-- MODE RECOMMENDATIONS TABLE
-- ============================================================================

-- Create mode_recommendations table for mode change recommendations
CREATE TABLE IF NOT EXISTS mode_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES controllable_loads(id) ON DELETE CASCADE,
  recommended_mode_id UUID NOT NULL REFERENCES asset_modes(id) ON DELETE CASCADE,
  
  -- Recommendation details
  recommendation_reason TEXT NOT NULL,  -- 'peak_shaving', 'cost_optimization', 'demand_response', 'efficiency_improvement', 'emergency'
  priority TEXT DEFAULT 'Medium',  -- 'Low', 'Medium', 'High', 'Critical'
  
  -- Impact estimates
  estimated_energy_savings_kwh DECIMAL(10,2),
  estimated_cost_savings_usd DECIMAL(8,2),
  estimated_demand_reduction_kw DECIMAL(10,2),
  confidence_level DECIMAL(3,2),  -- 0.0 to 1.0
  
  -- Timing
  recommended_start_time TIMESTAMPTZ NOT NULL,
  recommended_end_time TIMESTAMPTZ,
  recommended_duration_minutes INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'implemented', 'expired'
  status_reason TEXT,
  implemented_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Results tracking
  actual_energy_savings_kwh DECIMAL(10,2),
  actual_cost_savings_usd DECIMAL(8,2),
  actual_demand_reduction_kw DECIMAL(10,2),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Check constraints
  CONSTRAINT chk_mode_recommendations_timing CHECK (recommended_end_time IS NULL OR recommended_end_time > recommended_start_time),
  CONSTRAINT chk_mode_recommendations_confidence CHECK (confidence_level IS NULL OR (confidence_level >= 0 AND confidence_level <= 1)),
  CONSTRAINT chk_mode_recommendations_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_mode_recommendations_status CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented', 'expired')),
  CONSTRAINT chk_mode_recommendations_reason CHECK (recommendation_reason IN ('peak_shaving', 'cost_optimization', 'demand_response', 'efficiency_improvement', 'emergency', 'load_balancing'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_org ON mode_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_load ON mode_recommendations(load_id);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_mode ON mode_recommendations(recommended_mode_id);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_status ON mode_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_priority ON mode_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_start_time ON mode_recommendations(recommended_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_org_status ON mode_recommendations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_mode_recommendations_pending ON mode_recommendations(load_id, recommended_start_time) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE mode_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY mode_recommendations_tenant_isolation ON mode_recommendations
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON mode_recommendations TO authenticated;

-- Add comments
COMMENT ON TABLE mode_recommendations IS 'Mode change recommendations for controllable loads with impact estimates';
COMMENT ON COLUMN mode_recommendations.recommendation_reason IS 'Reason for the mode change recommendation';
COMMENT ON COLUMN mode_recommendations.confidence_level IS 'Confidence in impact estimates from 0.0 to 1.0';


-- ============================================================================
-- EFFICIENCY CURVES TABLE
-- ============================================================================

-- Create efficiency_curves table for equipment efficiency curves
CREATE TABLE IF NOT EXISTS efficiency_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  curve_code TEXT NOT NULL,  -- Natural key
  curve_name TEXT NOT NULL,
  description TEXT,
  
  -- Applicable equipment
  equipment_type TEXT NOT NULL,  -- 'transformer', 'motor', 'pump', 'compressor', 'chiller', 'boiler'
  equipment_id UUID,  -- Reference to specific equipment (controllable_load, generation_asset, etc.)
  
  -- Curve definition
  load_points DECIMAL(5,2)[] NOT NULL,  -- Array of load percentages (0-100)
  efficiency_points DECIMAL(5,2)[] NOT NULL,  -- Array of efficiency percentages (0-100)
  
  -- Curve metadata
  curve_type TEXT DEFAULT 'measured',  -- 'measured', 'manufacturer', 'calculated', 'industry_standard'
  source TEXT,  -- Source of the curve data
  measurement_date DATE,
  rated_capacity_kw DECIMAL(10,2),
  rated_voltage_kv DECIMAL(8,2),
  
  -- Operating conditions
  ambient_temperature_c DECIMAL(5,2),  -- Temperature at which curve was measured
  operating_conditions JSONB DEFAULT '{}',  -- Additional conditions (humidity, altitude, etc.)
  
  -- Status
  active BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_efficiency_curves_org_code UNIQUE (org_id, curve_code),
  
  -- Check constraints
  CONSTRAINT chk_efficiency_curves_arrays_length CHECK (array_length(load_points, 1) = array_length(efficiency_points, 1)),
  CONSTRAINT chk_efficiency_curves_arrays_not_empty CHECK (array_length(load_points, 1) >= 2),
  CONSTRAINT chk_efficiency_curves_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_efficiency_curves_equipment_type CHECK (equipment_type IN ('transformer', 'motor', 'pump', 'compressor', 'chiller', 'boiler', 'generator', 'inverter')),
  CONSTRAINT chk_efficiency_curves_type CHECK (curve_type IN ('measured', 'manufacturer', 'calculated', 'industry_standard'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_efficiency_curves_org ON efficiency_curves(org_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_curves_equipment_type ON efficiency_curves(equipment_type);
CREATE INDEX IF NOT EXISTS idx_efficiency_curves_equipment_id ON efficiency_curves(equipment_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_curves_active ON efficiency_curves(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_efficiency_curves_effective ON efficiency_curves(effective_date DESC);

-- Enable RLS
ALTER TABLE efficiency_curves ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY efficiency_curves_tenant_isolation ON efficiency_curves
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON efficiency_curves TO authenticated;

-- Add comments
COMMENT ON TABLE efficiency_curves IS 'Equipment efficiency curves for performance benchmarking and optimization';
COMMENT ON COLUMN efficiency_curves.load_points IS 'Array of load percentages (0-100) defining curve points';
COMMENT ON COLUMN efficiency_curves.efficiency_points IS 'Array of efficiency percentages (0-100) corresponding to load points';
COMMENT ON CONSTRAINT chk_efficiency_curves_arrays_length ON efficiency_curves IS 'Load points and efficiency points arrays must have the same length';



-- ============================================================================
-- TX CONTROL INTEGRATIONS TABLE
-- ============================================================================

-- Create tx_control_integrations table for external control system integrations
CREATE TABLE IF NOT EXISTS tx_control_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_code TEXT NOT NULL,  -- Natural key
  system_name TEXT NOT NULL,
  description TEXT,
  
  -- System type and protocol
  system_type TEXT NOT NULL,  -- 'scada', 'ems', 'derms', 'bms', 'plc', 'dcs'
  protocol TEXT NOT NULL,  -- 'iec61850', 'dnp3', 'modbus_tcp', 'opcua', 'bacnet', 'mqtt', 'rest_api'
  protocol_version TEXT,
  
  -- Connection details
  endpoint_url TEXT,
  endpoint_host TEXT,
  endpoint_port INTEGER,
  connection_string TEXT,  -- Encrypted connection string
  authentication_method TEXT,  -- 'none', 'basic', 'token', 'certificate', 'oauth2'
  
  -- Status and monitoring
  connectivity_status TEXT DEFAULT 'disconnected',  -- 'connected', 'disconnected', 'error', 'maintenance'
  last_sync_at TIMESTAMPTZ,
  last_successful_sync_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  sync_interval_seconds INTEGER DEFAULT 60,
  
  -- Data mapping
  data_point_count INTEGER DEFAULT 0,
  data_mapping JSONB DEFAULT '{}',  -- Mapping between system tags and internal entities
  
  -- Scope
  substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Configuration
  read_only BOOLEAN DEFAULT true,  -- Whether system can write commands
  auto_sync BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Status
  active BOOLEAN DEFAULT true,
  commissioned_date DATE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_tx_control_integrations_org_code UNIQUE (org_id, integration_code),
  
  -- Check constraints
  CONSTRAINT chk_tx_control_integrations_system_type CHECK (system_type IN ('scada', 'ems', 'derms', 'bms', 'plc', 'dcs', 'historian')),
  CONSTRAINT chk_tx_control_integrations_protocol CHECK (protocol IN ('iec61850', 'dnp3', 'modbus_tcp', 'opcua', 'bacnet', 'mqtt', 'rest_api', 'soap')),
  CONSTRAINT chk_tx_control_integrations_status CHECK (connectivity_status IN ('connected', 'disconnected', 'error', 'maintenance')),
  CONSTRAINT chk_tx_control_integrations_auth CHECK (authentication_method IN ('none', 'basic', 'token', 'certificate', 'oauth2', 'api_key')),
  CONSTRAINT chk_tx_control_integrations_port CHECK (endpoint_port IS NULL OR (endpoint_port > 0 AND endpoint_port <= 65535))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_org ON tx_control_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_system_type ON tx_control_integrations(system_type);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_protocol ON tx_control_integrations(protocol);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_status ON tx_control_integrations(connectivity_status);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_substation ON tx_control_integrations(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_site ON tx_control_integrations(site_id);
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_active ON tx_control_integrations(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_tx_control_integrations_auto_sync ON tx_control_integrations(org_id) WHERE auto_sync = true AND active = true;

-- Enable RLS
ALTER TABLE tx_control_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_control_integrations_tenant_isolation ON tx_control_integrations
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_control_integrations TO authenticated;

-- Add comments
COMMENT ON TABLE tx_control_integrations IS 'External control system integrations (SCADA, EMS, DERMS) with connectivity monitoring';
COMMENT ON COLUMN tx_control_integrations.protocol IS 'Communication protocol (IEC 61850, DNP3, Modbus TCP, OPC UA, BACnet, MQTT, REST API)';
COMMENT ON COLUMN tx_control_integrations.read_only IS 'Whether the integration can only read data or can also write control commands';
COMMENT ON COLUMN tx_control_integrations.data_mapping IS 'JSON mapping between external system tags and internal entities';


-- ============================================================================
-- TX LOAD SHEDDING PLANS TABLE
-- ============================================================================

-- Create tx_load_shedding_plans table for load shedding plan definitions
CREATE TABLE IF NOT EXISTS tx_load_shedding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,  -- Natural key
  plan_name TEXT NOT NULL,
  description TEXT,
  
  -- Plan scope
  substation_id UUID REFERENCES tx_substations(id) ON DELETE CASCADE,
  feeder_id UUID REFERENCES tx_feeders(id) ON DELETE SET NULL,
  
  -- Trigger conditions
  trigger_type TEXT NOT NULL,  -- 'manual', 'overload', 'voltage_deviation', 'frequency_deviation', 'utility_signal', 'price_threshold'
  trigger_threshold DECIMAL(10,2),  -- Threshold value that triggers the plan
  trigger_unit TEXT,  -- Unit for threshold (kW, kV, Hz, USD/kWh)
  
  -- Shedding stages
  stages JSONB NOT NULL,  -- Array of shedding stages with load groups and shed amounts
  total_shed_capacity_kw DECIMAL(10,2) NOT NULL,
  
  -- Constraints
  max_shed_duration_minutes INTEGER,
  min_restore_interval_minutes INTEGER DEFAULT 15,
  max_cycles_per_day INTEGER DEFAULT 3,
  
  -- Execution tracking
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  last_execution_result TEXT,  -- 'success', 'partial', 'failed'
  
  -- Approval and authorization
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID,
  approval_date DATE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  plan_version INTEGER DEFAULT 1,
  superseded_by UUID REFERENCES tx_load_shedding_plans(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_tx_load_shedding_plans_org_code UNIQUE (org_id, plan_code),
  
  -- Check constraints
  CONSTRAINT chk_tx_load_shedding_plans_capacity CHECK (total_shed_capacity_kw > 0),
  CONSTRAINT chk_tx_load_shedding_plans_trigger_type CHECK (trigger_type IN ('manual', 'overload', 'voltage_deviation', 'frequency_deviation', 'utility_signal', 'price_threshold', 'emergency')),
  CONSTRAINT chk_tx_load_shedding_plans_result CHECK (last_execution_result IS NULL OR last_execution_result IN ('success', 'partial', 'failed')),
  CONSTRAINT chk_tx_load_shedding_plans_version CHECK (plan_version > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_org ON tx_load_shedding_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_substation ON tx_load_shedding_plans(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_feeder ON tx_load_shedding_plans(feeder_id);
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_trigger_type ON tx_load_shedding_plans(trigger_type);
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_active ON tx_load_shedding_plans(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_tx_load_shedding_plans_approved ON tx_load_shedding_plans(org_id) WHERE approved_by IS NOT NULL;

-- Enable RLS
ALTER TABLE tx_load_shedding_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_load_shedding_plans_tenant_isolation ON tx_load_shedding_plans
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_load_shedding_plans TO authenticated;

-- Add comments
COMMENT ON TABLE tx_load_shedding_plans IS 'Load shedding plan definitions with stages and trigger conditions';
COMMENT ON COLUMN tx_load_shedding_plans.stages IS 'JSON array of shedding stages with load groups, priorities, and shed amounts';
COMMENT ON COLUMN tx_load_shedding_plans.trigger_type IS 'Condition that triggers the load shedding plan';
COMMENT ON COLUMN tx_load_shedding_plans.superseded_by IS 'Reference to newer version of this plan if superseded';



-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Add updated_at triggers for all tables
CREATE TRIGGER tr_controllable_loads_updated_at
  BEFORE UPDATE ON controllable_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_generation_assets_updated_at
  BEFORE UPDATE ON generation_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_demand_response_events_updated_at
  BEFORE UPDATE ON demand_response_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_asset_modes_updated_at
  BEFORE UPDATE ON asset_modes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_mode_recommendations_updated_at
  BEFORE UPDATE ON mode_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_efficiency_curves_updated_at
  BEFORE UPDATE ON efficiency_curves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_control_integrations_updated_at
  BEFORE UPDATE ON tx_control_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_load_shedding_plans_updated_at
  BEFORE UPDATE ON tx_load_shedding_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to validate DR event participating loads
CREATE OR REPLACE FUNCTION validate_dr_event_loads(
  p_org_id UUID,
  p_load_ids UUID[]
)
RETURNS TABLE (
  valid BOOLEAN,
  total_capacity_kw DECIMAL(10,2),
  invalid_load_ids UUID[]
) AS $$
DECLARE
  v_valid_count INTEGER;
  v_total_count INTEGER;
BEGIN
  v_total_count := array_length(p_load_ids, 1);
  
  -- Check how many loads exist and are controllable
  SELECT COUNT(*), COALESCE(SUM(load_capacity_kw), 0)
  INTO v_valid_count, total_capacity_kw
  FROM controllable_loads
  WHERE id = ANY(p_load_ids)
    AND org_id = p_org_id
    AND controllable = true
    AND active = true;
  
  -- Determine if all loads are valid
  valid := (v_valid_count = v_total_count);
  
  -- Find invalid load IDs
  SELECT array_agg(load_id)
  INTO invalid_load_ids
  FROM unnest(p_load_ids) AS load_id
  WHERE load_id NOT IN (
    SELECT id FROM controllable_loads
    WHERE org_id = p_org_id AND controllable = true AND active = true
  );
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_dr_event_loads(UUID, UUID[]) IS 'Validates that all participating loads exist, are controllable, and calculates total capacity';
