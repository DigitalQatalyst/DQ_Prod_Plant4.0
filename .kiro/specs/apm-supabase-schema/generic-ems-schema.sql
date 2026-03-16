-- =============================================================================
-- Generic Energy Management System (EMS) Supabase Schema
-- =============================================================================
-- This schema provides a domain-independent energy management system that can
-- be applied across various industries including manufacturing, commercial
-- buildings, data centers, healthcare facilities, and industrial operations.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- =============================================================================
-- Custom Types and Enums
-- =============================================================================

-- Energy types supported by the system
CREATE TYPE energy_type AS ENUM (
    'electricity',
    'natural_gas',
    'propane',
    'diesel',
    'gasoline',
    'fuel_oil',
    'steam',
    'compressed_air',
    'chilled_water',
    'hot_water',
    'solar',
    'wind',
    'biomass',
    'other'
);

-- Meter status levels
CREATE TYPE meter_status AS ENUM (
    'normal',
    'warning',
    'critical',
    'offline',
    'maintenance'
);

-- Power quality event types
CREATE TYPE power_quality_event AS ENUM (
    'voltage_sag',
    'voltage_swell',
    'power_outage',
    'frequency_deviation',
    'harmonic_distortion',
    'power_factor_low',
    'phase_imbalance'
);

-- Energy anomaly types
CREATE TYPE anomaly_type AS ENUM (
    'consumption_spike',
    'baseline_drift',
    'power_quality_issue',
    'standby_waste',
    'efficiency_degradation',
    'demand_peak',
    'load_imbalance'
);

-- Severity levels
CREATE TYPE severity_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Controllable load types (generic categories)
CREATE TYPE load_type AS ENUM (
    'hvac',
    'lighting',
    'motor_drive',
    'pump',
    'compressor',
    'fan',
    'conveyor',
    'process_equipment',
    'it_equipment',
    'refrigeration',
    'heating',
    'ventilation',
    'other'
);

-- Load control status
CREATE TYPE load_control_status AS ENUM (
    'available',
    'controlled',
    'unavailable',
    'maintenance'
);

-- Generation asset types
CREATE TYPE generation_type AS ENUM (
    'diesel_generator',
    'gas_generator',
    'solar_pv',
    'wind_turbine',
    'battery_storage',
    'ups',
    'fuel_cell',
    'micro_turbine',
    'cogeneration',
    'other'
);

-- Generation status
CREATE TYPE generation_status AS ENUM (
    'online',
    'offline',
    'standby',
    'maintenance',
    'fault'
);

-- Demand response event types
CREATE TYPE dr_event_type AS ENUM (
    'peak_shaving',
    'load_shifting',
    'emergency_response',
    'economic_dispatch',
    'grid_support'
);

-- Demand response status
CREATE TYPE dr_status AS ENUM (
    'scheduled',
    'active',
    'completed',
    'cancelled',
    'failed'
);

-- Report frequencies
CREATE TYPE report_frequency AS ENUM (
    'real_time',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'annually'
);

-- Report categories
CREATE TYPE report_category AS ENUM (
    'energy_consumption',
    'cost_analysis',
    'emissions',
    'efficiency',
    'compliance',
    'maintenance',
    'forecasting'
);

-- Export job status
CREATE TYPE export_status AS ENUM (
    'queued',
    'processing',
    'completed',
    'failed',
    'expired'
);

-- Export formats
CREATE TYPE export_format AS ENUM (
    'csv',
    'xlsx',
    'pdf',
    'json',
    'xml'
);

-- Asset operating modes
CREATE TYPE operating_mode AS ENUM (
    'off',
    'standby',
    'low',
    'normal',
    'high',
    'maximum',
    'maintenance'
);

-- Risk levels
CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- =============================================================================
-- Core Energy Management Tables
-- =============================================================================

-- Organizations/Facilities - Multi-tenant support
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    address TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency_code VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites/Buildings within organizations
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    site_type VARCHAR(100), -- 'manufacturing', 'office', 'warehouse', etc.
    address TEXT,
    area_sqft DECIMAL(12,2),
    operating_hours_per_day DECIMAL(4,2) DEFAULT 24,
    timezone VARCHAR(100),
    weather_station_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Meters - Main measurement points
CREATE TABLE energy_meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    meter_type VARCHAR(100) NOT NULL, -- 'main', 'submeter', 'check_meter'
    scope VARCHAR(255), -- 'building', 'floor', 'department', 'process_line'
    energy_types energy_type[] NOT NULL DEFAULT '{}',
    linked_assets UUID[] DEFAULT '{}',
    current_demand DECIMAL(12,4) DEFAULT 0,
    current_demand_unit VARCHAR(50) DEFAULT 'kW',
    status meter_status DEFAULT 'normal',
    location VARCHAR(255),
    installation_date DATE,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    communication_protocol VARCHAR(100),
    meter_constant DECIMAL(10,4) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Submeters - Individual equipment/area monitoring
CREATE TABLE submeters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_meter_id UUID REFERENCES energy_meters(id),
    site_id UUID NOT NULL REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    equipment_id UUID, -- Reference to monitored equipment
    energy_type energy_type NOT NULL,
    status meter_status DEFAULT 'normal',
    current_value DECIMAL(12,4) DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    installation_date DATE,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Energy Telemetry Data (TimescaleDB Hypertable)
CREATE TABLE energy_telemetry (
    id UUID DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES energy_meters(id),
    timestamp TIMESTAMPTZ NOT NULL,
    energy_consumed DECIMAL(15,4), -- Cumulative energy (kWh, therms, etc.)
    demand DECIMAL(12,4), -- Instantaneous demand (kW, BTU/hr, etc.)
    energy_unit VARCHAR(50) DEFAULT 'kWh',
    demand_unit VARCHAR(50) DEFAULT 'kW',
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    power_factor DECIMAL(4,3),
    frequency DECIMAL(5,2),
    temperature DECIMAL(6,2), -- Ambient or equipment temperature
    humidity DECIMAL(5,2), -- Relative humidity percentage
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    data_source VARCHAR(100), -- 'meter', 'sensor', 'calculated', 'estimated'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('energy_telemetry', 'timestamp');

-- Power Quality Monitoring
CREATE TABLE power_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES energy_meters(id),
    timestamp TIMESTAMPTZ NOT NULL,
    power_factor DECIMAL(4,3),
    thd_voltage_pct DECIMAL(5,2), -- Total Harmonic Distortion - Voltage
    thd_current_pct DECIMAL(5,2), -- Total Harmonic Distortion - Current
    voltage_l1 DECIMAL(8,2),
    voltage_l2 DECIMAL(8,2),
    voltage_l3 DECIMAL(8,2),
    current_l1 DECIMAL(8,2),
    current_l2 DECIMAL(8,2),
    current_l3 DECIMAL(8,2),
    frequency DECIMAL(5,2),
    voltage_imbalance_pct DECIMAL(5,2),
    current_imbalance_pct DECIMAL(5,2),
    power_factor_history DECIMAL(4,3)[] DEFAULT '{}',
    thd_history DECIMAL(5,2)[] DEFAULT '{}',
    voltage_history DECIMAL(8,2)[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Power Quality Events
CREATE TABLE power_quality_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES energy_meters(id),
    event_type power_quality_event NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    duration_ms INTEGER,
    magnitude DECIMAL(8,2),
    pre_event_value DECIMAL(8,2),
    post_event_value DECIMAL(8,2),
    affected_phases VARCHAR(10), -- 'L1', 'L2', 'L3', 'L1,L2', etc.
    severity severity_level DEFAULT 'low',
    description TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Anomalies
CREATE TABLE energy_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES energy_meters(id),
    timestamp TIMESTAMPTZ NOT NULL,
    anomaly_type anomaly_type NOT NULL,
    magnitude_pct DECIMAL(5,2) NOT NULL,
    severity severity_level NOT NULL,
    description TEXT,
    baseline_value DECIMAL(12,4),
    actual_value DECIMAL(12,4),
    deviation_value DECIMAL(12,4),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    estimated_cost_impact DECIMAL(12,2),
    root_cause TEXT,
    corrective_actions TEXT,
    detection_method VARCHAR(100), -- 'statistical', 'ml_model', 'rule_based'
    confidence_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Baselines
CREATE TABLE energy_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES energy_meters(id),
    baseline_name VARCHAR(255) NOT NULL,
    baseline_type VARCHAR(100), -- 'historical', 'engineered', 'regression'
    baseline_period_start DATE NOT NULL,
    baseline_period_end DATE NOT NULL,
    baseline_value DECIMAL(15,4) NOT NULL,
    baseline_unit VARCHAR(50) NOT NULL,
    normalization_factors JSONB DEFAULT '{}', -- weather, occupancy, production
    calculation_method TEXT,
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    r_squared DECIMAL(4,3), -- For regression baselines
    cv_rmse DECIMAL(5,2), -- Coefficient of Variation of Root Mean Square Error
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controllable Loads for Demand Response
CREATE TABLE controllable_loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    equipment_id UUID,
    load_type load_type NOT NULL,
    control_priority INTEGER NOT NULL, -- 1 = highest priority
    min_off_duration_min INTEGER NOT NULL,
    max_control_duration_min INTEGER NOT NULL,
    rated_capacity DECIMAL(10,2) NOT NULL,
    current_demand DECIMAL(10,2) DEFAULT 0,
    demand_unit VARCHAR(50) DEFAULT 'kW',
    status load_control_status DEFAULT 'available',
    control_method VARCHAR(100), -- 'on_off', 'modulation', 'setpoint_adjustment'
    last_controlled_at TIMESTAMPTZ,
    total_control_hours DECIMAL(8,2) DEFAULT 0,
    annual_control_limit_hours DECIMAL(8,2),
    comfort_constraints JSONB DEFAULT '{}',
    operational_constraints JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Assets
CREATE TABLE generation_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    generation_type generation_type NOT NULL,
    rated_capacity DECIMAL(12,2) NOT NULL,
    capacity_unit VARCHAR(50) DEFAULT 'kW',
    status generation_status DEFAULT 'offline',
    current_output DECIMAL(12,2) DEFAULT 0,
    efficiency_pct DECIMAL(5,2),
    fuel_type energy_type,
    fuel_consumption_rate DECIMAL(10,4),
    fuel_consumption_unit VARCHAR(50),
    emissions_factor DECIMAL(8,4), -- kg CO2 per unit
    installation_date DATE,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    maintenance_due_date DATE,
    last_maintenance_date DATE,
    runtime_hours DECIMAL(12,2) DEFAULT 0,
    starts_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demand Response Events
CREATE TABLE demand_response_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    event_name VARCHAR(255),
    event_type dr_event_type NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    requested_reduction DECIMAL(10,2) NOT NULL,
    actual_reduction DECIMAL(10,2),
    reduction_unit VARCHAR(50) DEFAULT 'kW',
    status dr_status DEFAULT 'scheduled',
    participating_loads UUID[] DEFAULT '{}',
    baseline_demand DECIMAL(10,2),
    cost_savings DECIMAL(10,2),
    incentive_payment DECIMAL(10,2),
    performance_score DECIMAL(3,2),
    weather_conditions JSONB DEFAULT '{}',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Tariffs and Pricing
CREATE TABLE energy_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tariff_name VARCHAR(255) NOT NULL,
    energy_type energy_type NOT NULL,
    utility_provider VARCHAR(255),
    tariff_structure VARCHAR(100), -- 'flat', 'tiered', 'time_of_use', 'real_time'
    base_rate DECIMAL(10,6) NOT NULL,
    rate_unit VARCHAR(50) NOT NULL, -- 'per_kWh', 'per_therm', etc.
    demand_charge DECIMAL(8,4),
    demand_charge_unit VARCHAR(50),
    time_of_use_rates JSONB DEFAULT '{}',
    seasonal_rates JSONB DEFAULT '{}',
    tier_rates JSONB DEFAULT '{}',
    fixed_charges JSONB DEFAULT '{}',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    currency_code VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emission Factors
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factor_name VARCHAR(255) NOT NULL,
    energy_type energy_type NOT NULL,
    scope INTEGER, -- 1, 2, or 3 for GHG Protocol scopes
    emission_type VARCHAR(100) DEFAULT 'CO2', -- CO2, CH4, N2O, etc.
    factor_value DECIMAL(12,6) NOT NULL,
    factor_unit VARCHAR(100) NOT NULL, -- 'kg_CO2_per_kWh', 'kg_CO2_per_therm'
    region VARCHAR(255),
    grid_subregion VARCHAR(255),
    data_source VARCHAR(255),
    data_year INTEGER,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production/Activity Context (for normalization)
CREATE TABLE activity_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    timestamp TIMESTAMPTZ NOT NULL,
    activity_type VARCHAR(100), -- 'production', 'occupancy', 'degree_days'
    activity_value DECIMAL(15,4),
    activity_unit VARCHAR(50),
    weather_temperature DECIMAL(6,2),
    weather_humidity DECIMAL(5,2),
    occupancy_count INTEGER,
    occupancy_percentage DECIMAL(5,2),
    production_rate DECIMAL(12,4),
    production_unit VARCHAR(50),
    operating_schedule JSONB DEFAULT '{}',
    special_events TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Operating Modes
CREATE TABLE equipment_modes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    site_id UUID NOT NULL REFERENCES sites(id),
    current_mode operating_mode DEFAULT 'normal',
    available_modes JSONB NOT NULL, -- Array of mode configurations
    last_mode_change TIMESTAMPTZ,
    operating_hours DECIMAL(12,2) DEFAULT 0,
    next_maintenance_hours DECIMAL(12,2),
    efficiency_rating DECIMAL(5,2),
    energy_star_rating INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mode Recommendations
CREATE TABLE mode_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_mode_id UUID NOT NULL REFERENCES equipment_modes(id),
    recommended_mode operating_mode NOT NULL,
    rationale TEXT NOT NULL,
    expected_savings DECIMAL(10,2),
    expected_savings_unit VARCHAR(50) DEFAULT 'USD',
    risk_assessment TEXT,
    priority priority_level DEFAULT 'medium',
    implementation_timeframe VARCHAR(255),
    valid_until TIMESTAMPTZ,
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMPTZ,
    actual_savings DECIMAL(10,2),
    recommendation_source VARCHAR(100), -- 'ai_model', 'rule_engine', 'manual'
    confidence_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Efficiency Curves
CREATE TABLE efficiency_curves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    site_id UUID NOT NULL REFERENCES sites(id),
    design_capacity DECIMAL(12,2) NOT NULL,
    design_capacity_unit VARCHAR(50) NOT NULL,
    best_efficiency_point JSONB NOT NULL, -- {load_pct, efficiency_pct, power_consumption}
    current_operating_point JSONB NOT NULL,
    curve_data JSONB NOT NULL, -- Array of efficiency curve points
    curve_type VARCHAR(100), -- 'manufacturer', 'measured', 'modeled'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Efficiency Recommendations
CREATE TABLE efficiency_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    efficiency_curve_id UUID NOT NULL REFERENCES efficiency_curves(id),
    recommendation_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_operating_point JSONB NOT NULL,
    expected_efficiency_gain DECIMAL(5,2) NOT NULL,
    estimated_annual_savings DECIMAL(12,2),
    implementation_cost DECIMAL(12,2),
    payback_period_months DECIMAL(6,2),
    implementation_notes TEXT,
    priority priority_level DEFAULT 'medium',
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMPTZ,
    actual_efficiency_gain DECIMAL(5,2),
    actual_annual_savings DECIMAL(12,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Benchmarks
CREATE TABLE energy_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_name VARCHAR(255) NOT NULL,
    industry_sector VARCHAR(255),
    building_type VARCHAR(255),
    equipment_type VARCHAR(100),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_unit VARCHAR(100) NOT NULL,
    benchmark_type VARCHAR(100), -- 'industry_average', 'best_practice', 'regulatory'
    percentile_10 DECIMAL(15,6),
    percentile_25 DECIMAL(15,6),
    percentile_50 DECIMAL(15,6),
    percentile_75 DECIMAL(15,6),
    percentile_90 DECIMAL(15,6),
    data_source VARCHAR(255),
    data_year INTEGER,
    sample_size INTEGER,
    geographic_scope VARCHAR(255),
    effective_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency report_frequency NOT NULL,
    category report_category NOT NULL,
    template_config JSONB NOT NULL,
    data_filters JSONB DEFAULT '{}',
    visualization_config JSONB DEFAULT '{}',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    recipients TEXT[] DEFAULT '{}',
    delivery_method VARCHAR(100) DEFAULT 'email',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Export Jobs
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    job_name VARCHAR(255),
    dataset_type VARCHAR(255) NOT NULL,
    export_format export_format NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL,
    status export_status DEFAULT 'queued',
    completed_at TIMESTAMPTZ,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    download_url VARCHAR(500),
    expires_at TIMESTAMPTZ,
    data_filters JSONB DEFAULT '{}',
    date_range JSONB DEFAULT '{}',
    error_message TEXT,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    requested_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes for Performance Optimization
-- =============================================================================

-- Organizations and Sites
CREATE INDEX idx_sites_organization_id ON sites(organization_id);
CREATE INDEX idx_sites_site_type ON sites(site_type);

-- Energy Meters
CREATE INDEX idx_energy_meters_site_id ON energy_meters(site_id);
CREATE INDEX idx_energy_meters_status ON energy_meters(status);
CREATE INDEX idx_energy_meters_meter_type ON energy_meters(meter_type);
CREATE INDEX idx_energy_meters_energy_types ON energy_meters USING GIN(energy_types);

-- Submeters
CREATE INDEX idx_submeters_site_id ON submeters(site_id);
CREATE INDEX idx_submeters_parent_meter_id ON submeters(parent_meter_id);
CREATE INDEX idx_submeters_equipment_id ON submeters(equipment_id);
CREATE INDEX idx_submeters_energy_type ON submeters(energy_type);

-- Energy Telemetry (TimescaleDB optimized)
CREATE INDEX idx_energy_telemetry_meter_timestamp ON energy_telemetry(meter_id, timestamp DESC);
CREATE INDEX idx_energy_telemetry_timestamp ON energy_telemetry(timestamp DESC);
CREATE INDEX idx_energy_telemetry_data_source ON energy_telemetry(data_source);

-- Power Quality
CREATE INDEX idx_power_quality_meter_timestamp ON power_quality(meter_id, timestamp DESC);
CREATE INDEX idx_power_quality_events_meter_type ON power_quality_events(meter_id, event_type);
CREATE INDEX idx_power_quality_events_severity ON power_quality_events(severity);

-- Energy Anomalies
CREATE INDEX idx_energy_anomalies_meter_timestamp ON energy_anomalies(meter_id, timestamp DESC);
CREATE INDEX idx_energy_anomalies_severity ON energy_anomalies(severity);
CREATE INDEX idx_energy_anomalies_resolved ON energy_anomalies(resolved);
CREATE INDEX idx_energy_anomalies_type ON energy_anomalies(anomaly_type);

-- Controllable Loads
CREATE INDEX idx_controllable_loads_site_id ON controllable_loads(site_id);
CREATE INDEX idx_controllable_loads_equipment_id ON controllable_loads(equipment_id);
CREATE INDEX idx_controllable_loads_priority ON controllable_loads(control_priority);
CREATE INDEX idx_controllable_loads_status ON controllable_loads(status);
CREATE INDEX idx_controllable_loads_type ON controllable_loads(load_type);

-- Generation Assets
CREATE INDEX idx_generation_assets_site_id ON generation_assets(site_id);
CREATE INDEX idx_generation_assets_type ON generation_assets(generation_type);
CREATE INDEX idx_generation_assets_status ON generation_assets(status);

-- Demand Response Events
CREATE INDEX idx_dr_events_site_id ON demand_response_events(site_id);
CREATE INDEX idx_dr_events_scheduled_start ON demand_response_events(scheduled_start DESC);
CREATE INDEX idx_dr_events_status ON demand_response_events(status);
CREATE INDEX idx_dr_events_type ON demand_response_events(event_type);

-- Energy Tariffs
CREATE INDEX idx_energy_tariffs_organization_id ON energy_tariffs(organization_id);
CREATE INDEX idx_energy_tariffs_energy_type ON energy_tariffs(energy_type);
CREATE INDEX idx_energy_tariffs_effective_date ON energy_tariffs(effective_date);

-- Equipment Modes
CREATE INDEX idx_equipment_modes_site_id ON equipment_modes(site_id);
CREATE INDEX idx_equipment_modes_equipment_id ON equipment_modes(equipment_id);
CREATE INDEX idx_equipment_modes_equipment_type ON equipment_modes(equipment_type);

-- Efficiency Curves
CREATE INDEX idx_efficiency_curves_site_id ON efficiency_curves(site_id);
CREATE INDEX idx_efficiency_curves_equipment_id ON efficiency_curves(equipment_id);
CREATE INDEX idx_efficiency_curves_equipment_type ON efficiency_curves(equipment_type);

-- Activity Context
CREATE INDEX idx_activity_context_site_timestamp ON activity_context(site_id, timestamp DESC);
CREATE INDEX idx_activity_context_activity_type ON activity_context(activity_type);

-- =============================================================================
-- Utility Functions
-- =============================================================================

-- Calculate total energy consumption for a meter over a time period
CREATE OR REPLACE FUNCTION calculate_energy_consumption(
    p_meter_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS TABLE (
    total_energy DECIMAL(15,4),
    avg_demand DECIMAL(12,4),
    max_demand DECIMAL(12,4),
    min_demand DECIMAL(12,4),
    energy_unit VARCHAR(50),
    demand_unit VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        MAX(et.energy_consumed) - MIN(et.energy_consumed) as total_energy,
        AVG(et.demand) as avg_demand,
        MAX(et.demand) as max_demand,
        MIN(et.demand) as min_demand,
        MAX(et.energy_unit) as energy_unit,
        MAX(et.demand_unit) as demand_unit
    FROM energy_telemetry et
    WHERE et.meter_id = p_meter_id
    AND et.timestamp BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Get latest telemetry reading for a meter
CREATE OR REPLACE FUNCTION get_latest_telemetry(p_meter_id UUID)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    energy_consumed DECIMAL(15,4),
    demand DECIMAL(12,4),
    voltage DECIMAL(8,2),
    power_factor DECIMAL(4,3),
    energy_unit VARCHAR(50),
    demand_unit VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT et.timestamp, et.energy_consumed, et.demand, et.voltage, et.power_factor,
           et.energy_unit, et.demand_unit
    FROM energy_telemetry et
    WHERE et.meter_id = p_meter_id
    ORDER BY et.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Calculate energy intensity (energy per unit of activity)
CREATE OR REPLACE FUNCTION calculate_energy_intensity(
    p_site_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_activity_type VARCHAR(100) DEFAULT 'production'
) RETURNS TABLE (
    energy_per_unit DECIMAL(12,6),
    total_energy DECIMAL(15,4),
    total_activity DECIMAL(15,4),
    energy_unit VARCHAR(50),
    activity_unit VARCHAR(50)
) AS $$
DECLARE
    v_total_energy DECIMAL(15,4);
    v_total_activity DECIMAL(15,4);
    v_energy_unit VARCHAR(50);
    v_activity_unit VARCHAR(50);
BEGIN
    -- Get total energy consumption for the site
    SELECT SUM(MAX(et.energy_consumed) - MIN(et.energy_consumed))
    INTO v_total_energy
    FROM energy_telemetry et
    JOIN energy_meters em ON et.meter_id = em.id
    WHERE em.site_id = p_site_id
    AND et.timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY et.meter_id;
    
    -- Get total activity
    SELECT 
        SUM(ac.activity_value),
        MAX(ac.activity_unit)
    INTO v_total_activity, v_activity_unit
    FROM activity_context ac
    WHERE ac.site_id = p_site_id
    AND ac.activity_type = p_activity_type
    AND ac.timestamp BETWEEN p_start_date AND p_end_date;
    
    -- Set default energy unit
    v_energy_unit := 'kWh';
    
    RETURN QUERY
    SELECT 
        CASE WHEN v_total_activity > 0 THEN v_total_energy / v_total_activity ELSE NULL END,
        v_total_energy,
        v_total_activity,
        v_energy_unit,
        v_activity_unit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE submeters ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_quality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE controllable_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_response_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE efficiency_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE efficiency_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Basic read policies for authenticated users
CREATE POLICY "Authenticated users can read all data" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_meters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON submeters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON power_quality FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON power_quality_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_anomalies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_baselines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON controllable_loads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON generation_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON demand_response_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_tariffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON emission_factors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON activity_context FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON equipment_modes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON mode_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON efficiency_curves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON efficiency_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON energy_benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON report_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON export_jobs FOR SELECT TO authenticated USING (true);

-- Basic insert policies for authenticated users
CREATE POLICY "Authenticated users can insert data" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_meters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON submeters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_telemetry FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON power_quality FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON power_quality_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_anomalies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_baselines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON controllable_loads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON generation_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON demand_response_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_tariffs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON emission_factors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON activity_context FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON equipment_modes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON mode_recommendations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON efficiency_curves FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON efficiency_recommendations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON energy_benchmarks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON report_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON export_jobs FOR INSERT TO authenticated WITH CHECK (true);

-- Update policies - allow updates for operational data
CREATE POLICY "Users can update operational data" ON energy_meters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON submeters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON energy_anomalies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON energy_baselines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON controllable_loads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON generation_assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON demand_response_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON equipment_modes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON mode_recommendations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON efficiency_curves FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update operational data" ON efficiency_recommendations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update their own records" ON report_templates FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- =============================================================================
-- Sample Data for Testing
-- =============================================================================

-- Sample Organization
INSERT INTO organizations (id, name, industry, timezone, currency_code) VALUES
('org-001', 'Generic Manufacturing Corp', 'Manufacturing', 'America/New_York', 'USD');

-- Sample Site
INSERT INTO sites (id, organization_id, name, site_type, area_sqft, operating_hours_per_day) VALUES
('site-001', 'org-001', 'Main Production Facility', 'manufacturing', 50000, 16);

-- Sample Energy Meters
INSERT INTO energy_meters (id, site_id, name, meter_type, scope, energy_types, current_demand, status) VALUES
('meter-001', 'site-001', 'Main Electrical Meter', 'main', 'building', ARRAY['electricity'], 145.2, 'normal'),
('meter-002', 'site-001', 'HVAC System Meter', 'submeter', 'hvac', ARRAY['electricity'], 67.3, 'normal'),
('meter-003', 'site-001', 'Production Line Meter', 'submeter', 'production', ARRAY['electricity'], 892.7, 'warning');

-- Sample Submeters
INSERT INTO submeters (id, site_id, name, energy_type, status, current_value, unit) VALUES
('submeter-001', 'site-001', 'Motor Drive #1', 'electricity', 'normal', 45.2, 'kW'),
('submeter-002', 'site-001', 'Compressor #1', 'electricity', 'warning', 125.3, 'kW'),
('submeter-003', 'site-001', 'Lighting Circuit A', 'electricity', 'normal', 12.8, 'kW');

-- Sample Energy Tariffs
INSERT INTO energy_tariffs (organization_id, tariff_name, energy_type, base_rate, rate_unit, effective_date) VALUES
('org-001', 'Commercial Electricity Rate', 'electricity', 0.12, 'per_kWh', '2024-01-01'),
('org-001', 'Natural Gas Rate', 'natural_gas', 0.85, 'per_therm', '2024-01-01');

-- Sample Emission Factors
INSERT INTO emission_factors (factor_name, energy_type, factor_value, factor_unit, region, effective_date) VALUES
('Grid Electricity - Northeast', 'electricity', 0.45, 'kg_CO2_per_kWh', 'US-Northeast', '2024-01-01'),
('Natural Gas', 'natural_gas', 5.3, 'kg_CO2_per_therm', 'US', '2024-01-01');

-- Sample Controllable Loads
INSERT INTO controllable_loads (id, site_id, name, load_type, control_priority, min_off_duration_min, max_control_duration_min, rated_capacity, current_demand, status) VALUES
('load-001', 'site-001', 'HVAC System', 'hvac', 3, 15, 120, 67.3, 45.2, 'available'),
('load-002', 'site-001', 'Production Motor #1', 'motor_drive', 1, 5, 30, 125.3, 125.3, 'available'),
('load-003', 'site-001', 'Warehouse Lighting', 'lighting', 5, 60, 240, 12.8, 8.5, 'available');

-- Sample Generation Assets
INSERT INTO generation_assets (id, site_id, name, generation_type, rated_capacity, status, current_output) VALUES
('gen-001', 'site-001', 'Emergency Diesel Generator', 'diesel_generator', 500, 'standby', 0),
('gen-002', 'site-001', 'Rooftop Solar Array', 'solar_pv', 100, 'online', 65.3),
('gen-003', 'site-001', 'UPS System', 'ups', 25, 'online', 12.5);

-- Sample Report Templates
INSERT INTO report_templates (id, organization_id, template_name, description, frequency, category, template_config) VALUES
('rpt-001', 'org-001', 'Daily Energy Summary', 'Daily energy consumption and cost summary', 'daily', 'energy_consumption', '{}'),
('rpt-002', 'org-001', 'Monthly Efficiency Report', 'Monthly equipment efficiency analysis', 'monthly', 'efficiency', '{}'),
('rpt-003', 'org-001', 'Weekly Cost Analysis', 'Weekly energy cost breakdown and trends', 'weekly', 'cost_analysis', '{}');

-- =============================================================================
-- Comments and Documentation
-- =============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations using the EMS system';
COMMENT ON TABLE sites IS 'Physical sites/facilities within organizations';
COMMENT ON TABLE energy_meters IS 'Main energy measurement points for facilities and equipment groups';
COMMENT ON TABLE submeters IS 'Individual equipment/area-level energy monitoring devices';
COMMENT ON TABLE energy_telemetry IS 'Time-series energy consumption data (TimescaleDB hypertable)';
COMMENT ON TABLE power_quality IS 'Electrical power quality metrics and historical data';
COMMENT ON TABLE power_quality_events IS 'Discrete power quality events and disturbances';
COMMENT ON TABLE energy_anomalies IS 'Detected energy consumption anomalies and analysis';
COMMENT ON TABLE energy_baselines IS 'Energy consumption baselines for comparison and M&V';
COMMENT ON TABLE controllable_loads IS 'Loads available for demand response and control';
COMMENT ON TABLE generation_assets IS 'On-site generation and storage assets';
COMMENT ON TABLE demand_response_events IS 'Demand response events and load management activities';
COMMENT ON TABLE energy_tariffs IS 'Energy pricing and tariff structures';
COMMENT ON TABLE emission_factors IS 'Emission factors for carbon footprint calculations';
COMMENT ON TABLE activity_context IS 'Production/occupancy data for energy normalization';
COMMENT ON TABLE equipment_modes IS 'Operating modes for energy-consuming equipment';
COMMENT ON TABLE mode_recommendations IS 'AI-generated recommendations for optimal equipment operation';
COMMENT ON TABLE efficiency_curves IS 'Equipment efficiency curves and performance analysis';
COMMENT ON TABLE efficiency_recommendations IS 'Recommendations for improving equipment efficiency';
COMMENT ON TABLE energy_benchmarks IS 'Industry benchmarks and performance targets';
COMMENT ON TABLE report_templates IS 'Automated report generation templates';
COMMENT ON TABLE export_jobs IS 'Data export job tracking and file management';

-- =============================================================================
-- Schema Complete
-- =============================================================================