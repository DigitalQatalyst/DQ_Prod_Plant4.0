-- Supabase Database Schema for Operational Excellence
-- This schema supports multi-tenant operational excellence data across Performance, 
-- Lean Execution (SIM), Continuous Improvement (CI), and AI-Assisted Optimisation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE severity_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE status_level AS ENUM ('good', 'warning', 'critical');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE issue_status AS ENUM ('open', 'in-progress', 'resolved');
CREATE TYPE sim_status AS ENUM ('on-track', 'at-risk', 'behind');
CREATE TYPE ci_stage AS ENUM ('backlog', 'analysis', 'implementation', 'validation', 'verified');
CREATE TYPE countermeasure_status AS ENUM ('planned', 'in-progress', 'completed');
CREATE TYPE optimisation_status AS ENUM ('new', 'under-review', 'approved', 'rejected', 'implemented');

-- Tenants table (assuming multi-tenant architecture)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Panels
CREATE TABLE performance_panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    oee DECIMAL(5,2) CHECK (oee >= 0 AND oee <= 100),
    availability DECIMAL(5,2) CHECK (availability >= 0 AND availability <= 100),
    performance DECIMAL(5,2) CHECK (performance >= 0 AND performance <= 100),
    quality DECIMAL(5,2) CHECK (quality >= 0 AND quality <= 100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sector VARCHAR(100),
    subsector VARCHAR(100),
    -- Sector-specific fields (nullable for cross-sector compatibility)
    well_uptime DECIMAL(5,2),
    planned_production DECIMAL(10,2),
    actual_production DECIMAL(10,2),
    energy_per_barrel DECIMAL(8,2),
    flow_assurance_status VARCHAR(20),
    deferment_hours DECIMAL(6,2),
    line_loading DECIMAL(5,2),
    transformer_loading DECIMAL(5,2),
    transmission_losses DECIMAL(5,2),
    saidi DECIMAL(8,2),
    saifi DECIMAL(8,2),
    trip_count INTEGER,
    changeover_efficiency DECIMAL(5,2),
    packaging_yield DECIMAL(5,2),
    batch_yield DECIMAL(5,2),
    scrap_rate DECIMAL(5,2),
    micro_stop_frequency DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Losses
CREATE TABLE performance_losses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_panel_id UUID NOT NULL REFERENCES performance_panels(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    frequency INTEGER NOT NULL CHECK (frequency >= 0),
    impact_percentage DECIMAL(5,2) NOT NULL CHECK (impact_percentage >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Bottlenecks
CREATE TABLE performance_bottlenecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_panel_id UUID NOT NULL REFERENCES performance_panels(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    constraint_description TEXT NOT NULL,
    severity severity_level NOT NULL,
    impact_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SIM Boards (Shift Information Management)
CREATE TABLE sim_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    shift_name VARCHAR(50) NOT NULL,
    shift_date DATE NOT NULL,
    status sim_status NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    -- Sector-specific fields
    field_name VARCHAR(255),
    pad_name VARCHAR(255),
    well_count INTEGER,
    active_wells INTEGER,
    barrel_at_risk DECIMAL(10,2),
    mcf_at_risk DECIMAL(10,2),
    separator_status VARCHAR(20),
    trunkline_status VARCHAR(20),
    pressure_reading DECIMAL(8,2),
    temperature_reading DECIMAL(6,2),
    flow_rate DECIMAL(10,2),
    control_center VARCHAR(255),
    system_loading DECIMAL(5,2),
    outage_count INTEGER,
    switching_orders_count INTEGER,
    high_impact_events INTEGER,
    system_status VARCHAR(20),
    grid_stability DECIMAL(5,2),
    voltage_profile VARCHAR(20),
    line_name VARCHAR(255),
    current_sku VARCHAR(100),
    hourly_target INTEGER,
    hourly_actual INTEGER,
    blocking_events INTEGER,
    starving_events INTEGER,
    changeover_status VARCHAR(20),
    material_shortages INTEGER,
    cip_status VARCHAR(20),
    quality_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SIM Metrics
CREATE TABLE sim_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sim_board_id UUID NOT NULL REFERENCES sim_boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    actual_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status status_level NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sim_board_id UUID REFERENCES sim_boards(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority priority_level NOT NULL,
    status issue_status NOT NULL,
    assignee VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CI Projects (Continuous Improvement)
CREATE TABLE ci_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    stage ci_stage NOT NULL,
    priority priority_level NOT NULL,
    owner VARCHAR(255) NOT NULL,
    target_kpi VARCHAR(255) NOT NULL,
    target_improvement VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    project_type VARCHAR(100),
    description TEXT,
    start_date DATE,
    end_date DATE,
    completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Root Causes
CREATE TABLE root_causes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ci_project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB, -- Array of evidence strings
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countermeasures
CREATE TABLE countermeasures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ci_project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
    root_cause_id UUID REFERENCES root_causes(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status countermeasure_status NOT NULL,
    owner VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimisation Opportunities
CREATE TABLE optimisation_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    rank_priority INTEGER NOT NULL CHECK (rank_priority > 0),
    category VARCHAR(100) NOT NULL,
    potential_impact TEXT NOT NULL,
    confidence_percentage DECIMAL(5,2) NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    status optimisation_status NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimisation_opportunity_id UUID NOT NULL REFERENCES optimisation_opportunities(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    confidence_percentage DECIMAL(5,2) NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    estimated_impact TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbooks
CREATE TABLE playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    applicability_percentage DECIMAL(5,2) NOT NULL CHECK (applicability_percentage >= 0 AND applicability_percentage <= 100),
    content JSONB, -- Structured playbook content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenarios
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimisation_opportunity_id UUID NOT NULL REFERENCES optimisation_opportunities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL, -- Scenario parameters as JSON
    projected_outcome TEXT NOT NULL,
    confidence_percentage DECIMAL(5,2) NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sectors (reference data)
CREATE TABLE sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subsectors JSONB, -- Array of subsector names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_performance_panels_tenant_id ON performance_panels(tenant_id);
CREATE INDEX idx_performance_panels_asset_id ON performance_panels(asset_id);
CREATE INDEX idx_performance_panels_sector ON performance_panels(sector, subsector);
CREATE INDEX idx_performance_panels_last_updated ON performance_panels(last_updated);

CREATE INDEX idx_performance_losses_panel_id ON performance_losses(performance_panel_id);
CREATE INDEX idx_performance_bottlenecks_panel_id ON performance_bottlenecks(performance_panel_id);

CREATE INDEX idx_sim_boards_tenant_id ON sim_boards(tenant_id);
CREATE INDEX idx_sim_boards_site_id ON sim_boards(site_id);
CREATE INDEX idx_sim_boards_date ON sim_boards(shift_date);
CREATE INDEX idx_sim_boards_sector ON sim_boards(sector, subsector);

CREATE INDEX idx_sim_metrics_board_id ON sim_metrics(sim_board_id);

CREATE INDEX idx_issues_tenant_id ON issues(tenant_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_assignee ON issues(assignee);

CREATE INDEX idx_ci_projects_tenant_id ON ci_projects(tenant_id);
CREATE INDEX idx_ci_projects_stage ON ci_projects(stage);
CREATE INDEX idx_ci_projects_owner ON ci_projects(owner);
CREATE INDEX idx_ci_projects_sector ON ci_projects(sector, subsector);

CREATE INDEX idx_root_causes_project_id ON root_causes(ci_project_id);
CREATE INDEX idx_countermeasures_project_id ON countermeasures(ci_project_id);
CREATE INDEX idx_countermeasures_due_date ON countermeasures(due_date);

CREATE INDEX idx_optimisation_opportunities_tenant_id ON optimisation_opportunities(tenant_id);
CREATE INDEX idx_optimisation_opportunities_rank ON optimisation_opportunities(rank_priority);
CREATE INDEX idx_optimisation_opportunities_status ON optimisation_opportunities(status);
CREATE INDEX idx_optimisation_opportunities_sector ON optimisation_opportunities(sector, subsector);

CREATE INDEX idx_recommendations_opportunity_id ON recommendations(optimisation_opportunity_id);
CREATE INDEX idx_scenarios_opportunity_id ON scenarios(optimisation_opportunity_id);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_panels_updated_at BEFORE UPDATE ON performance_panels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_losses_updated_at BEFORE UPDATE ON performance_losses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_bottlenecks_updated_at BEFORE UPDATE ON performance_bottlenecks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sim_boards_updated_at BEFORE UPDATE ON sim_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sim_metrics_updated_at BEFORE UPDATE ON sim_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ci_projects_updated_at BEFORE UPDATE ON ci_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_root_causes_updated_at BEFORE UPDATE ON root_causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countermeasures_updated_at BEFORE UPDATE ON countermeasures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_optimisation_opportunities_updated_at BEFORE UPDATE ON optimisation_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for multi-tenant data isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE countermeasures ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimisation_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your authentication setup)
-- These assume you have a current_tenant_id() function that returns the current user's tenant ID

-- CREATE POLICY "Users can only see their tenant's data" ON performance_panels
--     FOR ALL USING (tenant_id = current_tenant_id());

-- CREATE POLICY "Users can only see their tenant's data" ON sim_boards
--     FOR ALL USING (tenant_id = current_tenant_id());

-- CREATE POLICY "Users can only see their tenant's data" ON issues
--     FOR ALL USING (tenant_id = current_tenant_id());

-- CREATE POLICY "Users can only see their tenant's data" ON ci_projects
--     FOR ALL USING (tenant_id = current_tenant_id());

-- CREATE POLICY "Users can only see their tenant's data" ON optimisation_opportunities
--     FOR ALL USING (tenant_id = current_tenant_id());

-- Comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant organizations using the operational excellence platform';
COMMENT ON TABLE sites IS 'Physical sites/facilities within each tenant organization';
COMMENT ON TABLE assets IS 'Equipment and assets at each site';
COMMENT ON TABLE performance_panels IS 'OEE and performance monitoring data for assets';
COMMENT ON TABLE performance_losses IS 'Production losses categorized by type and impact';
COMMENT ON TABLE performance_bottlenecks IS 'Identified bottlenecks constraining performance';
COMMENT ON TABLE sim_boards IS 'Shift Information Management boards for operational workflows';
COMMENT ON TABLE sim_metrics IS 'Key performance metrics tracked during shifts';
COMMENT ON TABLE issues IS 'Operational issues and problems requiring resolution';
COMMENT ON TABLE ci_projects IS 'Continuous improvement projects and initiatives';
COMMENT ON TABLE root_causes IS 'Root cause analysis results for CI projects';
COMMENT ON TABLE countermeasures IS 'Corrective actions and countermeasures';
COMMENT ON TABLE optimisation_opportunities IS 'AI-identified optimization opportunities';
COMMENT ON TABLE recommendations IS 'AI-generated recommendations for optimization';
COMMENT ON TABLE playbooks IS 'Best practice playbooks and guides';
COMMENT ON TABLE scenarios IS 'Optimization scenario simulations and projections';
COMMENT ON TABLE sectors IS 'Industry sectors and subsectors reference data';