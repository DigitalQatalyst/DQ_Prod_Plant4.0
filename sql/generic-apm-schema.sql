-- ============================================================================
-- Generic APM (Asset Performance Management) Database Schema
-- Domain-Independent Asset Performance Management System
-- ============================================================================
-- This schema provides a comprehensive asset performance management system
-- that can be applied across various industries including manufacturing,
-- utilities, transportation, healthcare, and infrastructure management.
-- Designed to integrate with EMS (Energy Management System) for holistic
-- operational intelligence.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================================
-- Custom Types and Enums
-- ============================================================================

-- Asset categories for broad classification
CREATE TYPE asset_category AS ENUM (
    'rotating_equipment',
    'static_equipment',
    'electrical_equipment',
    'instrumentation',
    'control_systems',
    'hvac_systems',
    'safety_systems',
    'infrastructure',
    'vehicles',
    'it_equipment',
    'other'
);

-- Asset criticality levels
CREATE TYPE asset_criticality AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'non_critical'
);

-- Asset operational status
CREATE TYPE asset_status AS ENUM (
    'operational',
    'standby',
    'maintenance',
    'offline',
    'decommissioned',
    'unknown'
);

-- Asset health conditions
CREATE TYPE asset_health AS ENUM (
    'excellent',
    'good',
    'fair',
    'poor',
    'critical',
    'unknown'
);

-- Maintenance types
CREATE TYPE maintenance_type AS ENUM (
    'preventive',
    'predictive',
    'corrective',
    'emergency',
    'condition_based',
    'reliability_centered',
    'shutdown',
    'inspection'
);

-- Maintenance status
CREATE TYPE maintenance_status AS ENUM (
    'planned',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'deferred',
    'overdue'
);

-- Work order priorities
CREATE TYPE work_order_priority AS ENUM (
    'emergency',
    'urgent',
    'high',
    'medium',
    'low',
    'routine'
);

-- Work order status
CREATE TYPE work_order_status AS ENUM (
    'created',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled',
    'closed'
);

-- Failure modes
CREATE TYPE failure_mode AS ENUM (
    'wear',
    'fatigue',
    'corrosion',
    'erosion',
    'overheating',
    'vibration',
    'misalignment',
    'contamination',
    'electrical_fault',
    'software_fault',
    'human_error',
    'design_flaw',
    'manufacturing_defect',
    'other'
);

-- Failure severity
CREATE TYPE failure_severity AS ENUM (
    'catastrophic',
    'critical',
    'major',
    'minor',
    'negligible'
);

-- Condition monitoring techniques
CREATE TYPE monitoring_technique AS ENUM (
    'vibration_analysis',
    'thermal_imaging',
    'oil_analysis',
    'ultrasonic_testing',
    'electrical_signature',
    'performance_monitoring',
    'visual_inspection',
    'acoustic_emission',
    'motor_current_analysis',
    'process_parameters',
    'other'
);

-- Alert severity levels
CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'alarm',
    'critical',
    'emergency'
);

-- Alert status
CREATE TYPE alert_status AS ENUM (
    'active',
    'acknowledged',
    'resolved',
    'suppressed',
    'escalated'
);

-- Spare parts categories
CREATE TYPE spare_part_category AS ENUM (
    'consumable',
    'repairable',
    'rotable',
    'insurance',
    'critical',
    'standard',
    'obsolete'
);

-- Inventory transaction types
CREATE TYPE inventory_transaction_type AS ENUM (
    'receipt',
    'issue',
    'return',
    'transfer',
    'adjustment',
    'scrap',
    'reservation',
    'unreservation'
);

-- Performance indicator types
CREATE TYPE kpi_type AS ENUM (
    'availability',
    'reliability',
    'maintainability',
    'efficiency',
    'utilization',
    'cost',
    'safety',
    'environmental',
    'quality'
);

-- Risk levels
CREATE TYPE risk_level AS ENUM (
    'very_low',
    'low',
    'medium',
    'high',
    'very_high'
);

-- ============================================================================
-- Core Asset Management Tables
-- ============================================================================

-- Asset hierarchy and master data
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_asset_id UUID REFERENCES assets(id),
    site_id UUID, -- Reference to EMS sites table
    location VARCHAR(255),
    asset_category asset_category NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    installation_date DATE,
    commissioning_date DATE,
    warranty_expiry_date DATE,
    expected_life_years INTEGER,
    criticality asset_criticality DEFAULT 'medium',
    status asset_status DEFAULT 'operational',
    health asset_health DEFAULT 'unknown',
    replacement_cost DECIMAL(15,2),
    book_value DECIMAL(15,2),
    depreciation_method VARCHAR(100),
    technical_specifications JSONB DEFAULT '{}',
    operating_parameters JSONB DEFAULT '{}',
    safety_requirements JSONB DEFAULT '{}',
    environmental_conditions JSONB DEFAULT '{}',
    documentation_links TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Asset performance metrics (TimescaleDB Hypertable)
CREATE TABLE asset_performance (
    id UUID DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    timestamp TIMESTAMPTZ NOT NULL,
    availability_pct DECIMAL(5,2),
    reliability_score DECIMAL(5,2),
    efficiency_pct DECIMAL(5,2),
    utilization_pct DECIMAL(5,2),
    throughput DECIMAL(15,4),
    throughput_unit VARCHAR(50),
    operating_hours DECIMAL(10,2),
    cycle_count INTEGER,
    energy_consumption DECIMAL(15,4),
    energy_unit VARCHAR(50) DEFAULT 'kWh',
    temperature DECIMAL(8,2),
    pressure DECIMAL(10,4),
    vibration_level DECIMAL(8,4),
    flow_rate DECIMAL(12,4),
    speed_rpm DECIMAL(10,2),
    load_pct DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    performance_index DECIMAL(8,4),
    oee_pct DECIMAL(5,2), -- Overall Equipment Effectiveness
    data_source VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('asset_performance', 'timestamp');

-- Condition monitoring data
CREATE TABLE condition_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    timestamp TIMESTAMPTZ NOT NULL,
    monitoring_technique monitoring_technique NOT NULL,
    measurement_point VARCHAR(255),
    parameter_name VARCHAR(255) NOT NULL,
    measured_value DECIMAL(15,6),
    unit VARCHAR(50),
    alarm_low DECIMAL(15,6),
    warning_low DECIMAL(15,6),
    warning_high DECIMAL(15,6),
    alarm_high DECIMAL(15,6),
    status VARCHAR(50),
    trend VARCHAR(50), -- 'increasing', 'decreasing', 'stable'
    analysis_notes TEXT,
    technician_id UUID,
    equipment_used VARCHAR(255),
    test_conditions JSONB DEFAULT '{}',
    raw_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset failures and incidents
CREATE TABLE asset_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    failure_date TIMESTAMPTZ NOT NULL,
    detection_date TIMESTAMPTZ,
    repair_start_date TIMESTAMPTZ,
    repair_end_date TIMESTAMPTZ,
    failure_mode failure_mode NOT NULL,
    failure_cause TEXT,
    failure_description TEXT NOT NULL,
    severity failure_severity NOT NULL,
    downtime_hours DECIMAL(8,2),
    production_loss DECIMAL(15,2),
    repair_cost DECIMAL(12,2),
    parts_cost DECIMAL(12,2),
    labor_cost DECIMAL(12,2),
    external_service_cost DECIMAL(12,2),
    root_cause_analysis TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    lessons_learned TEXT,
    reported_by UUID,
    assigned_to UUID,
    work_order_id UUID,
    mttr_hours DECIMAL(8,2), -- Mean Time To Repair
    mtbf_hours DECIMAL(10,2), -- Mean Time Between Failures
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance plans and schedules
CREATE TABLE maintenance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    plan_name VARCHAR(255) NOT NULL,
    maintenance_type maintenance_type NOT NULL,
    description TEXT,
    frequency_type VARCHAR(50), -- 'calendar', 'runtime', 'cycle', 'condition'
    frequency_value INTEGER,
    frequency_unit VARCHAR(50), -- 'days', 'weeks', 'months', 'hours', 'cycles'
    duration_hours DECIMAL(6,2),
    required_skills TEXT[],
    required_tools TEXT[],
    safety_requirements TEXT[],
    procedure_steps JSONB DEFAULT '{}',
    spare_parts_list JSONB DEFAULT '{}',
    estimated_cost DECIMAL(12,2),
    active BOOLEAN DEFAULT TRUE,
    next_due_date DATE,
    last_completed_date DATE,
    completion_count INTEGER DEFAULT 0,
    created_by UUID,
    approved_by UUID,
    approval_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work orders for maintenance activities
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(100) UNIQUE NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id),
    maintenance_plan_id UUID REFERENCES maintenance_plans(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    maintenance_type maintenance_type NOT NULL,
    priority work_order_priority DEFAULT 'medium',
    status work_order_status DEFAULT 'created',
    requested_by UUID,
    assigned_to UUID,
    assigned_team VARCHAR(255),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    parts_cost DECIMAL(12,2),
    labor_cost DECIMAL(12,2),
    external_cost DECIMAL(12,2),
    completion_notes TEXT,
    quality_check_passed BOOLEAN,
    safety_incidents INTEGER DEFAULT 0,
    rework_required BOOLEAN DEFAULT FALSE,
    customer_satisfaction_score INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts and notifications
CREATE TABLE asset_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    alert_type VARCHAR(100) NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status DEFAULT 'active',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    triggered_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved_by UUID,
    trigger_value DECIMAL(15,6),
    threshold_value DECIMAL(15,6),
    parameter_name VARCHAR(255),
    monitoring_technique monitoring_technique,
    escalation_level INTEGER DEFAULT 1,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID,
    resolution_notes TEXT,
    false_alarm BOOLEAN DEFAULT FALSE,
    suppressed_until TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spare parts inventory
CREATE TABLE spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    category spare_part_category NOT NULL,
    manufacturer VARCHAR(255),
    supplier VARCHAR(255),
    unit_cost DECIMAL(12,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    lead_time_days INTEGER,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER,
    reorder_point INTEGER,
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    location VARCHAR(255),
    shelf_life_months INTEGER,
    weight_kg DECIMAL(8,3),
    dimensions VARCHAR(100),
    hazardous_material BOOLEAN DEFAULT FALSE,
    storage_requirements TEXT,
    applicable_assets UUID[],
    alternative_parts VARCHAR(100)[],
    obsolete BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spare_part_id UUID NOT NULL REFERENCES spare_parts(id),
    transaction_type inventory_transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    work_order_id UUID REFERENCES work_orders(id),
    asset_id UUID REFERENCES assets(id),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by UUID,
    approved_by UUID,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset reliability analysis
CREATE TABLE reliability_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    mtbf_hours DECIMAL(10,2), -- Mean Time Between Failures
    mttr_hours DECIMAL(8,2), -- Mean Time To Repair
    mttf_hours DECIMAL(10,2), -- Mean Time To Failure
    availability_pct DECIMAL(5,2),
    reliability_pct DECIMAL(5,2),
    maintainability_index DECIMAL(5,2),
    failure_rate DECIMAL(10,6), -- Failures per hour
    repair_rate DECIMAL(10,6), -- Repairs per hour
    total_failures INTEGER,
    total_downtime_hours DECIMAL(10,2),
    total_operating_hours DECIMAL(12,2),
    weibull_beta DECIMAL(8,4), -- Weibull shape parameter
    weibull_eta DECIMAL(10,2), -- Weibull scale parameter
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    analysis_method VARCHAR(100),
    analysis_notes TEXT,
    analyzed_by UUID,
    analysis_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key Performance Indicators (KPIs)
CREATE TABLE asset_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    site_id UUID, -- For site-level KPIs
    kpi_name VARCHAR(255) NOT NULL,
    kpi_type kpi_type NOT NULL,
    measurement_period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_value DECIMAL(15,4),
    actual_value DECIMAL(15,4),
    unit VARCHAR(50),
    variance_pct DECIMAL(5,2),
    performance_rating VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
    benchmark_value DECIMAL(15,4),
    industry_average DECIMAL(15,4),
    calculation_method TEXT,
    data_sources TEXT[],
    notes TEXT,
    calculated_by UUID,
    calculation_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    assessment_name VARCHAR(255) NOT NULL,
    assessment_date DATE NOT NULL,
    assessor_id UUID,
    risk_category VARCHAR(100), -- 'safety', 'environmental', 'operational', 'financial'
    hazard_description TEXT NOT NULL,
    consequence_description TEXT,
    likelihood_score INTEGER CHECK (likelihood_score BETWEEN 1 AND 5),
    consequence_score INTEGER CHECK (consequence_score BETWEEN 1 AND 5),
    risk_score INTEGER GENERATED ALWAYS AS (likelihood_score * consequence_score) STORED,
    risk_level risk_level,
    current_controls TEXT,
    additional_controls_needed TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    action_priority work_order_priority,
    target_completion_date DATE,
    residual_likelihood INTEGER,
    residual_consequence INTEGER,
    residual_risk_score INTEGER GENERATED ALWAYS AS (residual_likelihood * residual_consequence) STORED,
    review_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset lifecycle events
CREATE TABLE asset_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    event_type VARCHAR(100) NOT NULL, -- 'installation', 'commissioning', 'modification', 'overhaul', 'retirement'
    event_date DATE NOT NULL,
    event_description TEXT,
    cost DECIMAL(15,2),
    performed_by VARCHAR(255),
    work_order_id UUID REFERENCES work_orders(id),
    documentation_links TEXT[],
    impact_on_performance TEXT,
    impact_on_reliability TEXT,
    warranty_impact TEXT,
    compliance_requirements TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Asset documentation and files
CREATE TABLE asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- 'manual', 'drawing', 'certificate', 'report', 'photo'
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    version VARCHAR(50),
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID,
    description TEXT,
    tags TEXT[],
    access_level VARCHAR(50) DEFAULT 'internal', -- 'public', 'internal', 'restricted'
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Assets
CREATE INDEX idx_assets_site_id ON assets(site_id);
CREATE INDEX idx_assets_parent_asset_id ON assets(parent_asset_id);
CREATE INDEX idx_assets_category ON assets(asset_category);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_health ON assets(health);
CREATE INDEX idx_assets_asset_tag ON assets(asset_tag);

-- Asset Performance (TimescaleDB optimized)
CREATE INDEX idx_asset_performance_asset_timestamp ON asset_performance(asset_id, timestamp DESC);
CREATE INDEX idx_asset_performance_timestamp ON asset_performance(timestamp DESC);

-- Condition Monitoring
CREATE INDEX idx_condition_monitoring_asset_timestamp ON condition_monitoring(asset_id, timestamp DESC);
CREATE INDEX idx_condition_monitoring_technique ON condition_monitoring(monitoring_technique);
CREATE INDEX idx_condition_monitoring_parameter ON condition_monitoring(parameter_name);

-- Asset Failures
CREATE INDEX idx_asset_failures_asset_id ON asset_failures(asset_id);
CREATE INDEX idx_asset_failures_failure_date ON asset_failures(failure_date DESC);
CREATE INDEX idx_asset_failures_severity ON asset_failures(severity);
CREATE INDEX idx_asset_failures_failure_mode ON asset_failures(failure_mode);

-- Maintenance Plans
CREATE INDEX idx_maintenance_plans_asset_id ON maintenance_plans(asset_id);
CREATE INDEX idx_maintenance_plans_type ON maintenance_plans(maintenance_type);
CREATE INDEX idx_maintenance_plans_next_due ON maintenance_plans(next_due_date);
CREATE INDEX idx_maintenance_plans_active ON maintenance_plans(active);

-- Work Orders
CREATE INDEX idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX idx_work_orders_scheduled_start ON work_orders(scheduled_start);
CREATE INDEX idx_work_orders_maintenance_plan ON work_orders(maintenance_plan_id);

-- Asset Alerts
CREATE INDEX idx_asset_alerts_asset_id ON asset_alerts(asset_id);
CREATE INDEX idx_asset_alerts_severity ON asset_alerts(severity);
CREATE INDEX idx_asset_alerts_status ON asset_alerts(status);
CREATE INDEX idx_asset_alerts_triggered_at ON asset_alerts(triggered_at DESC);

-- Spare Parts
CREATE INDEX idx_spare_parts_part_number ON spare_parts(part_number);
CREATE INDEX idx_spare_parts_category ON spare_parts(category);
CREATE INDEX idx_spare_parts_current_stock ON spare_parts(current_stock);
CREATE INDEX idx_spare_parts_reorder_point ON spare_parts(reorder_point);
CREATE INDEX idx_spare_parts_applicable_assets ON spare_parts USING GIN(applicable_assets);

-- Inventory Transactions
CREATE INDEX idx_inventory_transactions_spare_part ON inventory_transactions(spare_part_id);
CREATE INDEX idx_inventory_transactions_work_order ON inventory_transactions(work_order_id);
CREATE INDEX idx_inventory_transactions_asset ON inventory_transactions(asset_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date DESC);

-- KPIs
CREATE INDEX idx_asset_kpis_asset_id ON asset_kpis(asset_id);
CREATE INDEX idx_asset_kpis_site_id ON asset_kpis(site_id);
CREATE INDEX idx_asset_kpis_type ON asset_kpis(kpi_type);
CREATE INDEX idx_asset_kpis_period ON asset_kpis(period_start, period_end);

-- Risk Assessments
CREATE INDEX idx_risk_assessments_asset_id ON risk_assessments(asset_id);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_assessment_date ON risk_assessments(assessment_date DESC);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Calculate asset availability
CREATE OR REPLACE FUNCTION calculate_asset_availability(
    p_asset_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_hours DECIMAL(10,2);
    v_downtime_hours DECIMAL(10,2);
    v_availability DECIMAL(5,2);
BEGIN
    -- Calculate total hours in period
    v_total_hours := EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 3600;
    
    -- Calculate total downtime hours
    SELECT COALESCE(SUM(downtime_hours), 0)
    INTO v_downtime_hours
    FROM asset_failures
    WHERE asset_id = p_asset_id
    AND failure_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate availability percentage
    IF v_total_hours > 0 THEN
        v_availability := ((v_total_hours - v_downtime_hours) / v_total_hours) * 100;
    ELSE
        v_availability := 0;
    END IF;
    
    RETURN ROUND(v_availability, 2);
END;
$$ LANGUAGE plpgsql;

-- Calculate MTBF (Mean Time Between Failures)
CREATE OR REPLACE FUNCTION calculate_mtbf(
    p_asset_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_operating_hours DECIMAL(12,2);
    v_failure_count INTEGER;
    v_mtbf DECIMAL(10,2);
BEGIN
    -- Get total operating hours from performance data
    SELECT COALESCE(SUM(operating_hours), 0)
    INTO v_operating_hours
    FROM asset_performance
    WHERE asset_id = p_asset_id
    AND timestamp BETWEEN p_start_date AND p_end_date;
    
    -- Count failures in period
    SELECT COUNT(*)
    INTO v_failure_count
    FROM asset_failures
    WHERE asset_id = p_asset_id
    AND failure_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate MTBF
    IF v_failure_count > 0 THEN
        v_mtbf := v_operating_hours / v_failure_count;
    ELSE
        v_mtbf := NULL; -- No failures, MTBF is undefined
    END IF;
    
    RETURN v_mtbf;
END;
$$ LANGUAGE plpgsql;

-- Calculate MTTR (Mean Time To Repair)
CREATE OR REPLACE FUNCTION calculate_mttr(
    p_asset_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS DECIMAL(8,2) AS $$
DECLARE
    v_mttr DECIMAL(8,2);
BEGIN
    SELECT AVG(downtime_hours)
    INTO v_mttr
    FROM asset_failures
    WHERE asset_id = p_asset_id
    AND failure_date BETWEEN p_start_date AND p_end_date
    AND downtime_hours IS NOT NULL;
    
    RETURN ROUND(v_mttr, 2);
END;
$$ LANGUAGE plpgsql;

-- Get asset health score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_asset_health_score(p_asset_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_health_score DECIMAL(5,2) := 100;
    v_recent_failures INTEGER;
    v_overdue_maintenance INTEGER;
    v_critical_alerts INTEGER;
    v_condition_score DECIMAL(5,2);
BEGIN
    -- Check recent failures (last 30 days)
    SELECT COUNT(*)
    INTO v_recent_failures
    FROM asset_failures
    WHERE asset_id = p_asset_id
    AND failure_date > NOW() - INTERVAL '30 days';
    
    -- Check overdue maintenance
    SELECT COUNT(*)
    INTO v_overdue_maintenance
    FROM maintenance_plans
    WHERE asset_id = p_asset_id
    AND active = TRUE
    AND next_due_date < CURRENT_DATE;
    
    -- Check critical alerts
    SELECT COUNT(*)
    INTO v_critical_alerts
    FROM asset_alerts
    WHERE asset_id = p_asset_id
    AND severity IN ('critical', 'emergency')
    AND status = 'active';
    
    -- Get average condition monitoring score
    SELECT AVG(
        CASE 
            WHEN measured_value BETWEEN warning_low AND warning_high THEN 100
            WHEN measured_value BETWEEN alarm_low AND warning_low 
                 OR measured_value BETWEEN warning_high AND alarm_high THEN 70
            ELSE 30
        END
    )
    INTO v_condition_score
    FROM condition_monitoring
    WHERE asset_id = p_asset_id
    AND timestamp > NOW() - INTERVAL '7 days'
    AND alarm_low IS NOT NULL AND alarm_high IS NOT NULL;
    
    -- Apply penalties
    v_health_score := v_health_score - (v_recent_failures * 10);
    v_health_score := v_health_score - (v_overdue_maintenance * 15);
    v_health_score := v_health_score - (v_critical_alerts * 20);
    
    -- Factor in condition monitoring score
    IF v_condition_score IS NOT NULL THEN
        v_health_score := (v_health_score + v_condition_score) / 2;
    END IF;
    
    -- Ensure score is between 0 and 100
    v_health_score := GREATEST(0, LEAST(100, v_health_score));
    
    RETURN ROUND(v_health_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Update asset health based on calculated score
CREATE OR REPLACE FUNCTION update_asset_health(p_asset_id UUID)
RETURNS VOID AS $$
DECLARE
    v_health_score DECIMAL(5,2);
    v_health_status asset_health;
BEGIN
    -- Calculate health score
    v_health_score := calculate_asset_health_score(p_asset_id);
    
    -- Determine health status
    IF v_health_score >= 90 THEN
        v_health_status := 'excellent';
    ELSIF v_health_score >= 75 THEN
        v_health_status := 'good';
    ELSIF v_health_score >= 60 THEN
        v_health_status := 'fair';
    ELSIF v_health_score >= 40 THEN
        v_health_status := 'poor';
    ELSE
        v_health_status := 'critical';
    END IF;
    
    -- Update asset health
    UPDATE assets
    SET health = v_health_status,
        updated_at = NOW()
    WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reliability_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;

-- Basic read policies for authenticated users
CREATE POLICY "Authenticated users can read assets" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset performance" ON asset_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read condition monitoring" ON condition_monitoring FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset failures" ON asset_failures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read maintenance plans" ON maintenance_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read work orders" ON work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset alerts" ON asset_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read spare parts" ON spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read inventory transactions" ON inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reliability analysis" ON reliability_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset KPIs" ON asset_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read risk assessments" ON risk_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lifecycle events" ON asset_lifecycle_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset documents" ON asset_documents FOR SELECT TO authenticated USING (true);

-- Basic insert policies for authenticated users
CREATE POLICY "Authenticated users can insert assets" ON assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert asset performance" ON asset_performance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert condition monitoring" ON condition_monitoring FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert asset failures" ON asset_failures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert maintenance plans" ON maintenance_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert work orders" ON work_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert asset alerts" ON asset_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert spare parts" ON spare_parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert inventory transactions" ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert reliability analysis" ON reliability_analysis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert asset KPIs" ON asset_kpis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert risk assessments" ON risk_assessments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert lifecycle events" ON asset_lifecycle_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert asset documents" ON asset_documents FOR INSERT TO authenticated WITH CHECK (true);

-- Update policies for operational data
CREATE POLICY "Users can update assets" ON assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update asset failures" ON asset_failures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update maintenance plans" ON maintenance_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update work orders" ON work_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update asset alerts" ON asset_alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update spare parts" ON spare_parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can update risk assessments" ON risk_assessments FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- Triggers for Automated Updates
-- ============================================================================

-- Update asset health when failures are recorded
CREATE OR REPLACE FUNCTION trigger_update_asset_health()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_asset_health(NEW.asset_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_health_on_failure
    AFTER INSERT OR UPDATE ON asset_failures
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_asset_health();

-- Update spare parts available stock when transactions occur
CREATE OR REPLACE FUNCTION trigger_update_spare_parts_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE spare_parts
        SET current_stock = current_stock + 
            CASE 
                WHEN NEW.transaction_type IN ('receipt', 'return', 'adjustment') THEN NEW.quantity
                WHEN NEW.transaction_type IN ('issue', 'scrap', 'transfer') THEN -NEW.quantity
                ELSE 0
            END,
        reserved_stock = reserved_stock +
            CASE 
                WHEN NEW.transaction_type = 'reservation' THEN NEW.quantity
                WHEN NEW.transaction_type = 'unreservation' THEN -NEW.quantity
                ELSE 0
            END,
        updated_at = NOW()
        WHERE id = NEW.spare_part_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spare_parts_stock
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_spare_parts_stock();

-- Auto-generate work orders from maintenance plans
CREATE OR REPLACE FUNCTION trigger_generate_work_orders()
RETURNS TRIGGER AS $$
DECLARE
    v_work_order_number VARCHAR(100);
BEGIN
    -- Generate work order number
    v_work_order_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('work_order_seq')::TEXT, 4, '0');
    
    -- Create work order if maintenance plan is due
    IF NEW.next_due_date <= CURRENT_DATE AND NEW.active = TRUE THEN
        INSERT INTO work_orders (
            work_order_number,
            asset_id,
            maintenance_plan_id,
            title,
            description,
            maintenance_type,
            priority,
            estimated_hours,
            estimated_cost
        ) VALUES (
            v_work_order_number,
            NEW.asset_id,
            NEW.id,
            'Scheduled: ' || NEW.plan_name,
            NEW.description,
            NEW.maintenance_type,
            CASE NEW.maintenance_type
                WHEN 'emergency' THEN 'emergency'
                WHEN 'corrective' THEN 'urgent'
                ELSE 'medium'
            END,
            NEW.duration_hours,
            NEW.estimated_cost
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for work order numbering
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1;

CREATE TRIGGER generate_work_orders_from_plans
    AFTER UPDATE ON maintenance_plans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_work_orders();

-- ============================================================================
-- Sample Data for Testing
-- ============================================================================

-- Sample Assets
INSERT INTO assets (id, asset_tag, asset_name, asset_category, asset_type, criticality, status, health) VALUES
('asset-001', 'PUMP-001', 'Main Circulation Pump', 'rotating_equipment', 'centrifugal_pump', 'critical', 'operational', 'good'),
('asset-002', 'MOTOR-001', 'Production Line Motor', 'electrical_equipment', 'induction_motor', 'high', 'operational', 'fair'),
('asset-003', 'COMP-001', 'Air Compressor Unit', 'rotating_equipment', 'screw_compressor', 'medium', 'operational', 'excellent'),
('asset-004', 'HVAC-001', 'Main HVAC System', 'hvac_systems', 'air_handler', 'high', 'operational', 'good'),
('asset-005', 'CONV-001', 'Production Conveyor', 'static_equipment', 'belt_conveyor', 'medium', 'maintenance', 'poor');

-- Sample Maintenance Plans
INSERT INTO maintenance_plans (id, asset_id, plan_name, maintenance_type, frequency_type, frequency_value, frequency_unit, duration_hours, next_due_date) VALUES
('plan-001', 'asset-001', 'Pump Quarterly Inspection', 'preventive', 'calendar', 3, 'months', 4, '2024-03-15'),
('plan-002', 'asset-002', 'Motor Annual Overhaul', 'preventive', 'calendar', 12, 'months', 16, '2024-06-01'),
('plan-003', 'asset-003', 'Compressor Oil Change', 'preventive', 'runtime', 2000, 'hours', 2, '2024-02-20'),
('plan-004', 'asset-004', 'HVAC Filter Replacement', 'preventive', 'calendar', 1, 'months', 1, '2024-02-01'),
('plan-005', 'asset-005', 'Conveyor Belt Inspection', 'condition_based', 'calendar', 2, 'weeks', 3, '2024-02-10');

-- Sample Work Orders
INSERT INTO work_orders (id, work_order_number, asset_id, maintenance_plan_id, title, maintenance_type, priority, status, estimated_hours, actual_hours) VALUES
('wo-001', 'WO-20240115-0001', 'asset-001', 'plan-001', 'Pump Bearing Replacement', 'corrective', 'high', 'completed', 6, 7.5),
('wo-002', 'WO-20240116-0002', 'asset-003', 'plan-003', 'Compressor Oil Change', 'preventive', 'medium', 'in_progress', 2, NULL),
('wo-003', 'WO-20240117-0003', 'asset-005', 'plan-005', 'Conveyor Belt Tension Adjustment', 'condition_based', 'medium', 'scheduled', 3, NULL);

-- Sample Asset Failures
INSERT INTO asset_failures (id, asset_id, failure_date, failure_mode, failure_description, severity, downtime_hours, repair_cost) VALUES
('fail-001', 'asset-001', '2024-01-10 14:30:00', 'wear', 'Bearing failure causing excessive vibration', 'major', 8.5, 2500.00),
('fail-002', 'asset-002', '2024-01-05 09:15:00', 'electrical_fault', 'Motor winding insulation breakdown', 'critical', 24.0, 8500.00),
('fail-003', 'asset-005', '2023-12-28 16:45:00', 'wear', 'Conveyor belt stretching and slippage', 'minor', 2.0, 450.00);

-- Sample Spare Parts
INSERT INTO spare_parts (id, part_number, part_name, category, current_stock, minimum_stock, reorder_point, unit_cost, applicable_assets) VALUES
('part-001', 'BRG-6308-2RS', 'Deep Groove Ball Bearing 6308-2RS', 'repairable', 5, 2, 3, 45.50, ARRAY['asset-001']),
('part-002', 'BELT-B75', 'V-Belt B75 Industrial Grade', 'consumable', 8, 3, 5, 28.75, ARRAY['asset-005']),
('part-003', 'FILT-AF450', 'Air Filter 450mm x 300mm', 'consumable', 12, 6, 8, 15.25, ARRAY['asset-004']),
('part-004', 'OIL-SAE30', 'Compressor Oil SAE 30 (5L)', 'consumable', 15, 5, 8, 65.00, ARRAY['asset-003']);

-- Sample Asset Alerts
INSERT INTO asset_alerts (id, asset_id, alert_type, severity, title, description, triggered_at, status) VALUES
('alert-001', 'asset-002', 'vibration_high', 'warning', 'High Vibration Detected', 'Motor vibration levels exceed normal operating range', '2024-01-18 10:30:00', 'active'),
('alert-002', 'asset-001', 'temperature_high', 'alarm', 'Pump Temperature Alert', 'Bearing temperature approaching critical threshold', '2024-01-18 14:15:00', 'acknowledged'),
('alert-003', 'asset-004', 'filter_clogged', 'warning', 'HVAC Filter Replacement Due', 'Air filter differential pressure indicates replacement needed', '2024-01-17 08:00:00', 'active');

-- Sample KPIs
INSERT INTO asset_kpis (id, asset_id, kpi_name, kpi_type, measurement_period, period_start, period_end, target_value, actual_value, unit) VALUES
('kpi-001', 'asset-001', 'Pump Availability', 'availability', 'monthly', '2024-01-01', '2024-01-31', 95.0, 92.5, 'percent'),
('kpi-002', 'asset-002', 'Motor Efficiency', 'efficiency', 'monthly', '2024-01-01', '2024-01-31', 88.0, 85.2, 'percent'),
('kpi-003', 'asset-003', 'Compressor Utilization', 'utilization', 'monthly', '2024-01-01', '2024-01-31', 75.0, 78.3, 'percent'),
('kpi-004', NULL, 'Overall Equipment Effectiveness', 'efficiency', 'monthly', '2024-01-01', '2024-01-31', 85.0, 82.1, 'percent');

-- Sample Risk Assessments
INSERT INTO risk_assessments (id, asset_id, assessment_name, assessment_date, risk_category, hazard_description, likelihood_score, consequence_score, risk_level) VALUES
('risk-001', 'asset-001', 'Pump Failure Risk Assessment', '2024-01-15', 'operational', 'Potential pump failure due to bearing wear', 3, 4, 'high'),
('risk-002', 'asset-002', 'Motor Safety Risk Assessment', '2024-01-10', 'safety', 'Risk of electrical shock during maintenance', 2, 5, 'high'),
('risk-003', 'asset-005', 'Conveyor Operational Risk', '2024-01-12', 'operational', 'Production disruption due to belt failure', 4, 3, 'high');

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Asset summary view with key metrics
CREATE VIEW asset_summary AS
SELECT 
    a.id,
    a.asset_tag,
    a.asset_name,
    a.asset_category,
    a.criticality,
    a.status,
    a.health,
    COUNT(DISTINCT mp.id) as maintenance_plans_count,
    COUNT(DISTINCT wo.id) as active_work_orders,
    COUNT(DISTINCT af.id) as failure_count_ytd,
    COUNT(DISTINCT aa.id) as active_alerts,
    COALESCE(ra.avg_risk_score, 0) as avg_risk_score
FROM assets a
LEFT JOIN maintenance_plans mp ON a.id = mp.asset_id AND mp.active = TRUE
LEFT JOIN work_orders wo ON a.id = wo.asset_id AND wo.status IN ('created', 'assigned', 'in_progress')
LEFT JOIN asset_failures af ON a.id = af.asset_id AND af.failure_date >= DATE_TRUNC('year', CURRENT_DATE)
LEFT JOIN asset_alerts aa ON a.id = aa.asset_id AND aa.status = 'active'
LEFT JOIN (
    SELECT asset_id, AVG(risk_score) as avg_risk_score
    FROM risk_assessments
    WHERE status = 'active'
    GROUP BY asset_id
) ra ON a.id = ra.asset_id
GROUP BY a.id, a.asset_tag, a.asset_name, a.asset_category, a.criticality, a.status, a.health, ra.avg_risk_score;

-- Overdue maintenance view
CREATE VIEW overdue_maintenance AS
SELECT 
    mp.id as maintenance_plan_id,
    mp.plan_name,
    a.asset_tag,
    a.asset_name,
    mp.maintenance_type,
    mp.next_due_date,
    CURRENT_DATE - mp.next_due_date as days_overdue,
    mp.estimated_cost,
    a.criticality
FROM maintenance_plans mp
JOIN assets a ON mp.asset_id = a.id
WHERE mp.active = TRUE
AND mp.next_due_date < CURRENT_DATE
ORDER BY a.criticality DESC, days_overdue DESC;

-- Critical alerts view
CREATE VIEW critical_alerts AS
SELECT 
    aa.id,
    aa.asset_id,
    a.asset_tag,
    a.asset_name,
    aa.alert_type,
    aa.severity,
    aa.title,
    aa.triggered_at,
    aa.status,
    EXTRACT(EPOCH FROM (NOW() - aa.triggered_at))/3600 as hours_active
FROM asset_alerts aa
JOIN assets a ON aa.asset_id = a.id
WHERE aa.severity IN ('critical', 'emergency')
AND aa.status = 'active'
ORDER BY aa.triggered_at DESC;

-- Spare parts reorder view
CREATE VIEW spare_parts_reorder AS
SELECT 
    sp.id,
    sp.part_number,
    sp.part_name,
    sp.current_stock,
    sp.reorder_point,
    sp.minimum_stock,
    sp.reorder_point - sp.current_stock as shortage_quantity,
    sp.unit_cost,
    sp.lead_time_days,
    sp.supplier
FROM spare_parts sp
WHERE sp.current_stock <= sp.reorder_point
AND sp.obsolete = FALSE
ORDER BY (sp.reorder_point - sp.current_stock) DESC;

-- Asset performance trends view
CREATE VIEW asset_performance_trends AS
SELECT 
    ap.asset_id,
    a.asset_tag,
    a.asset_name,
    DATE_TRUNC('day', ap.timestamp) as performance_date,
    AVG(ap.availability_pct) as avg_availability,
    AVG(ap.efficiency_pct) as avg_efficiency,
    AVG(ap.utilization_pct) as avg_utilization,
    AVG(ap.oee_pct) as avg_oee,
    MAX(ap.energy_consumption) as total_energy_consumption
FROM asset_performance ap
JOIN assets a ON ap.asset_id = a.id
WHERE ap.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ap.asset_id, a.asset_tag, a.asset_name, DATE_TRUNC('day', ap.timestamp)
ORDER BY ap.asset_id, performance_date DESC;

-- ============================================================================
-- Comments and Documentation
-- ============================================================================

COMMENT ON TABLE assets IS 'Master asset registry with hierarchy and key attributes';
COMMENT ON TABLE asset_performance IS 'Time-series asset performance metrics (TimescaleDB hypertable)';
COMMENT ON TABLE condition_monitoring IS 'Condition monitoring measurements and analysis results';
COMMENT ON TABLE asset_failures IS 'Asset failure incidents with root cause analysis';
COMMENT ON TABLE maintenance_plans IS 'Preventive and predictive maintenance schedules';
COMMENT ON TABLE work_orders IS 'Maintenance work orders and execution tracking';
COMMENT ON TABLE asset_alerts IS 'Real-time alerts and notifications for asset conditions';
COMMENT ON TABLE spare_parts IS 'Spare parts inventory and stock management';
COMMENT ON TABLE inventory_transactions IS 'Spare parts inventory movement tracking';
COMMENT ON TABLE reliability_analysis IS 'Statistical reliability analysis results (MTBF, MTTR, etc.)';
COMMENT ON TABLE asset_kpis IS 'Key Performance Indicators for assets and sites';
COMMENT ON TABLE risk_assessments IS 'Asset risk assessments and mitigation strategies';
COMMENT ON TABLE asset_lifecycle_events IS 'Major asset lifecycle events and modifications';
COMMENT ON TABLE asset_documents IS 'Asset documentation and file management';

COMMENT ON VIEW asset_summary IS 'Comprehensive asset overview with key metrics';
COMMENT ON VIEW overdue_maintenance IS 'Maintenance activities past their due dates';
COMMENT ON VIEW critical_alerts IS 'Active critical and emergency alerts requiring attention';
COMMENT ON VIEW spare_parts_reorder IS 'Spare parts requiring reordering based on stock levels';
COMMENT ON VIEW asset_performance_trends IS 'Daily asset performance trends for the last 30 days';

-- ============================================================================
-- Schema Complete
-- ============================================================================

-- Final verification queries
SELECT 'APM Schema deployment completed successfully' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'asset%' OR table_name LIKE 'maintenance%' OR table_name LIKE 'work%' OR table_name LIKE 'spare%' OR table_name LIKE 'inventory%' OR table_name LIKE 'reliability%' OR table_name LIKE 'risk%';
SELECT COUNT(*) as total_functions FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'calculate%';
SELECT COUNT(*) as total_views FROM information_schema.views WHERE table_schema = 'public';