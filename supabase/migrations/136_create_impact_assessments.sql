-- Create impact_assessments table for grid topology blast radius analysis
-- Requirements: 5.7, 10.3 - Implement cascading impact calculation with grid integration

-- Create enum types for impact assessment
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_severity') THEN
        CREATE TYPE impact_severity AS ENUM (
            'catastrophic',
            'major',
            'moderate',
            'minor',
            'negligible'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_category') THEN
        CREATE TYPE impact_category AS ENUM (
            'operational',
            'safety',
            'financial',
            'regulatory',
            'reputational',
            'environmental'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
        CREATE TYPE assessment_status AS ENUM (
            'draft',
            'in-progress',
            'completed',
            'reviewed',
            'approved'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cascade_type') THEN
        CREATE TYPE cascade_type AS ENUM (
            'electrical',
            'communication',
            'control',
            'protection',
            'operational'
        );
    END IF;
END $$;
-- Create impact assessments table
CREATE TABLE impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Assessment identification
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL, -- 'incident', 'alert', 'scenario', 'planned-outage'
    
    -- Source references
    incident_id UUID REFERENCES incident_cases(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES security_alerts(id) ON DELETE CASCADE,
    
    -- Assessment scope
    primary_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    primary_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    primary_grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
    primary_grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
    
    -- Impact classification
    overall_severity impact_severity NOT NULL DEFAULT 'moderate',
    impact_categories impact_category[] DEFAULT '{}',
    
    -- Grid topology analysis
    blast_radius_km DECIMAL(10,3),
    affected_voltage_levels TEXT[],
    cascade_potential BOOLEAN DEFAULT false,
    isolation_possible BOOLEAN DEFAULT true,
    backup_paths_available BOOLEAN DEFAULT false,
    
    -- Affected infrastructure
    affected_sites UUID[] DEFAULT '{}',
    affected_assets UUID[] DEFAULT '{}',
    affected_grid_nodes UUID[] DEFAULT '{}',
    affected_grid_lines UUID[] DEFAULT '{}',
    
    -- Impact metrics
    customers_affected INTEGER DEFAULT 0,
    mw_at_risk DECIMAL(10,3) DEFAULT 0,
    estimated_outage_duration_hours DECIMAL(8,2),
    estimated_recovery_time_hours DECIMAL(8,2),
    
    -- Financial impact
    estimated_cost_usd DECIMAL(15,2),
    revenue_loss_usd DECIMAL(15,2),
    regulatory_fines_usd DECIMAL(15,2),
    
    -- Safety and environmental impact
    safety_risk_level INTEGER CHECK (safety_risk_level >= 1 AND safety_risk_level <= 5),
    environmental_impact TEXT,
    public_safety_concern BOOLEAN DEFAULT false,
    
    -- Assessment details
    assessment_methodology TEXT,
    assumptions TEXT[],
    limitations TEXT[],
    confidence_level DECIMAL(5,4) DEFAULT 0.7,
    
    -- Timeline and status
    status assessment_status NOT NULL DEFAULT 'draft',
    assessed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    assessment_date TIMESTAMPTZ DEFAULT now(),
    review_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    
    -- Mitigation and response
    mitigation_strategies TEXT[],
    contingency_plans TEXT[],
    recovery_procedures TEXT[],
    
    -- Documentation
    supporting_documents TEXT[],
    analysis_notes TEXT,
    lessons_learned TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create cascade analysis table for detailed cascade modeling
CREATE TABLE cascade_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES impact_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Cascade step identification
    cascade_step INTEGER NOT NULL,
    cascade_type cascade_type NOT NULL,
    
    -- Source and target
    source_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
    source_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
    source_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    target_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
    target_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
    target_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    -- Cascade characteristics
    propagation_time_seconds INTEGER,
    probability DECIMAL(5,4), -- 0.0 to 1.0
    trigger_threshold DECIMAL(10,3),
    
    -- Impact details
    load_shed_mw DECIMAL(10,3),
    customers_lost INTEGER,
    voltage_impact DECIMAL(8,4),
    frequency_impact DECIMAL(8,4),
    
    -- Mitigation factors
    protection_systems TEXT[],
    automatic_controls TEXT[],
    operator_actions TEXT[],
    
    -- Analysis metadata
    analysis_method TEXT, -- 'power-flow', 'contingency', 'dynamic', 'historical'
    confidence_score DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Create impact scenarios table for pre-defined scenarios
CREATE TABLE impact_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Scenario identification
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL, -- 'cyber-attack', 'equipment-failure', 'natural-disaster', 'human-error'
    
    -- Scenario parameters
    trigger_conditions JSONB DEFAULT '{}',
    affected_components JSONB DEFAULT '{}',
    
    -- Pre-calculated impacts
    baseline_assessment_id UUID REFERENCES impact_assessments(id) ON DELETE SET NULL,
    worst_case_customers INTEGER,
    worst_case_mw DECIMAL(10,3),
    worst_case_duration_hours DECIMAL(8,2),
    
    -- Scenario metadata
    probability_annual DECIMAL(8,6), -- Annual probability of occurrence
    historical_occurrences INTEGER DEFAULT 0,
    last_occurrence TIMESTAMPTZ,
    
    -- Response planning
    response_playbook_id UUID REFERENCES response_playbooks(id) ON DELETE SET NULL,
    emergency_procedures TEXT[],
    stakeholder_notifications TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create indexes for performance
CREATE INDEX idx_impact_assessments_tenant ON impact_assessments(tenant_id);
CREATE INDEX idx_impact_assessments_incident ON impact_assessments(incident_id);
CREATE INDEX idx_impact_assessments_alert ON impact_assessments(alert_id);
CREATE INDEX idx_impact_assessments_site ON impact_assessments(primary_site_id);
CREATE INDEX idx_impact_assessments_asset ON impact_assessments(primary_asset_id);
CREATE INDEX idx_impact_assessments_grid_node ON impact_assessments(primary_grid_node_id);
CREATE INDEX idx_impact_assessments_grid_line ON impact_assessments(primary_grid_line_id);
CREATE INDEX idx_impact_assessments_severity ON impact_assessments(overall_severity);
CREATE INDEX idx_impact_assessments_status ON impact_assessments(status);
CREATE INDEX idx_impact_assessments_date ON impact_assessments(assessment_date DESC);

CREATE INDEX idx_cascade_analysis_assessment ON cascade_analysis(assessment_id);
CREATE INDEX idx_cascade_analysis_step ON cascade_analysis(cascade_step);
CREATE INDEX idx_cascade_analysis_type ON cascade_analysis(cascade_type);
CREATE INDEX idx_cascade_analysis_source_node ON cascade_analysis(source_node_id);
CREATE INDEX idx_cascade_analysis_target_node ON cascade_analysis(target_node_id);

CREATE INDEX idx_impact_scenarios_tenant ON impact_scenarios(tenant_id);
CREATE INDEX idx_impact_scenarios_type ON impact_scenarios(scenario_type);
CREATE INDEX idx_impact_scenarios_active ON impact_scenarios(is_active);
CREATE INDEX idx_impact_scenarios_playbook ON impact_scenarios(response_playbook_id);
-- Create function to calculate blast radius using grid topology
CREATE OR REPLACE FUNCTION calculate_blast_radius(
    start_node_id UUID DEFAULT NULL,
    start_line_id UUID DEFAULT NULL,
    max_hops INTEGER DEFAULT 3
)
RETURNS TABLE(
    affected_nodes UUID[],
    affected_lines UUID[],
    affected_assets UUID[],
    blast_radius_km DECIMAL,
    estimated_customers INTEGER,
    estimated_mw DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE grid_traversal AS (
        -- Base case: starting node or line
        SELECT 
            CASE WHEN start_node_id IS NOT NULL THEN start_node_id ELSE gl.from_node_id END as node_id,
            CASE WHEN start_line_id IS NOT NULL THEN start_line_id ELSE NULL::UUID END as line_id,
            0 as hop_count,
            ARRAY[CASE WHEN start_node_id IS NOT NULL THEN start_node_id ELSE gl.from_node_id END] as path_nodes
        FROM grid_lines gl
        WHERE (start_line_id IS NOT NULL AND gl.id = start_line_id)
           OR (start_node_id IS NOT NULL)
        
        UNION ALL
        
        -- Recursive case: traverse connected nodes and lines
        SELECT 
            CASE 
                WHEN gl.from_node_id = gt.node_id THEN gl.to_node_id
                ELSE gl.from_node_id
            END as node_id,
            gl.id as line_id,
            gt.hop_count + 1,
            gt.path_nodes || CASE 
                WHEN gl.from_node_id = gt.node_id THEN gl.to_node_id
                ELSE gl.from_node_id
            END
        FROM grid_traversal gt
        JOIN grid_lines gl ON (gl.from_node_id = gt.node_id OR gl.to_node_id = gt.node_id)
        WHERE gt.hop_count < max_hops
          AND NOT (CASE 
                WHEN gl.from_node_id = gt.node_id THEN gl.to_node_id
                ELSE gl.from_node_id
            END = ANY(gt.path_nodes)) -- Avoid cycles
    ),
    affected_infrastructure AS (
        SELECT 
            ARRAY_AGG(DISTINCT gt.node_id) as nodes,
            ARRAY_AGG(DISTINCT gt.line_id) FILTER (WHERE gt.line_id IS NOT NULL) as lines
        FROM grid_traversal gt
    ),
    connected_assets AS (
        SELECT ARRAY_AGG(DISTINCT gal.asset_id) as assets
        FROM affected_infrastructure ai
        CROSS JOIN UNNEST(ai.nodes) as node_id
        JOIN grid_asset_links gal ON gal.grid_node_id = node_id
    ),
    impact_calculation AS (
        SELECT 
            -- Calculate blast radius as max distance between affected nodes
            COALESCE(MAX(ST_Distance(gn1.location::geometry, gn2.location::geometry)) / 1000, 0) as radius_km,
            -- Estimate customers (simplified calculation)
            SUM(COALESCE(gn.estimated_customers, 0)) as total_customers,
            -- Estimate MW capacity
            SUM(COALESCE(a.rated_capacity_mw, 0)) as total_mw
        FROM affected_infrastructure ai
        CROSS JOIN UNNEST(ai.nodes) as node_id1
        CROSS JOIN UNNEST(ai.nodes) as node_id2
        JOIN grid_nodes gn1 ON gn1.id = node_id1
        JOIN grid_nodes gn2 ON gn2.id = node_id2
        CROSS JOIN UNNEST(ai.nodes) as calc_node_id
        JOIN grid_nodes gn ON gn.id = calc_node_id
        LEFT JOIN connected_assets ca ON true
        LEFT JOIN UNNEST(ca.assets) as asset_id ON true
        LEFT JOIN assets a ON a.id = asset_id
    )
    SELECT 
        ai.nodes,
        ai.lines,
        ca.assets,
        ic.radius_km,
        ic.total_customers::INTEGER,
        ic.total_mw
    FROM affected_infrastructure ai
    CROSS JOIN connected_assets ca
    CROSS JOIN impact_calculation ic;
END;
$$ LANGUAGE plpgsql;
-- Create function to auto-populate impact assessment from grid analysis
CREATE OR REPLACE FUNCTION populate_impact_assessment_from_grid(assessment_id UUID)
RETURNS VOID AS $$
DECLARE
        assessment_record RECORD;
        blast_result RECORD;
BEGIN
        -- Get assessment details
        SELECT * INTO assessment_record
        FROM impact_assessments
        WHERE id = assessment_id;
        
        -- Calculate blast radius
        SELECT * INTO blast_result
        FROM calculate_blast_radius(
            assessment_record.primary_grid_node_id,
            assessment_record.primary_grid_line_id,
            3 -- max hops
        );
        
        -- Update assessment with calculated values
        UPDATE impact_assessments
        SET 
            blast_radius_km = blast_result.blast_radius_km,
            affected_grid_nodes = blast_result.affected_nodes,
            affected_grid_lines = blast_result.affected_lines,
            affected_assets = blast_result.affected_assets,
            customers_affected = blast_result.estimated_customers,
            mw_at_risk = blast_result.estimated_mw,
            updated_at = now()
        WHERE id = assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate impact when grid references are added
CREATE OR REPLACE FUNCTION auto_calculate_impact_assessment()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate when grid node or line is specified
    IF (NEW.primary_grid_node_id IS NOT NULL OR NEW.primary_grid_line_id IS NOT NULL) AND
       (OLD.primary_grid_node_id IS NULL OR OLD.primary_grid_line_id IS NULL OR
        NEW.primary_grid_node_id != OLD.primary_grid_node_id OR 
        NEW.primary_grid_line_id != OLD.primary_grid_line_id) THEN
        
        PERFORM populate_impact_assessment_from_grid(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER impact_assessments_auto_calculate
    AFTER UPDATE ON impact_assessments
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_impact_assessment();
-- Create update triggers
CREATE OR REPLACE FUNCTION update_impact_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Auto-set review and approval timestamps
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'reviewed' THEN
                IF NEW.review_date IS NULL THEN
                    NEW.review_date = now();
                END IF;
            WHEN 'approved' THEN
                IF NEW.approval_date IS NULL THEN
                    NEW.approval_date = now();
                END IF;
            ELSE
                -- No action needed for other statuses
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER impact_assessments_updated_at
    BEFORE UPDATE ON impact_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_assessments_updated_at();

CREATE TRIGGER impact_scenarios_updated_at
    BEFORE UPDATE ON impact_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_assessments_updated_at();
-- Create views for impact analysis dashboard
CREATE OR REPLACE VIEW impact_assessment_summary AS
SELECT 
    ia.tenant_id,
    ia.assessment_type,
    ia.overall_severity,
    COUNT(*) as total_assessments,
    AVG(ia.customers_affected) as avg_customers_affected,
    AVG(ia.mw_at_risk) as avg_mw_at_risk,
    AVG(ia.estimated_cost_usd) as avg_estimated_cost,
    COUNT(*) FILTER (WHERE ia.cascade_potential = true) as cascade_risk_assessments,
    COUNT(*) FILTER (WHERE ia.public_safety_concern = true) as safety_concern_assessments,
    COUNT(*) FILTER (WHERE ia.status = 'completed') as completed_assessments,
    COUNT(*) FILTER (WHERE ia.status = 'approved') as approved_assessments
FROM impact_assessments ia
WHERE ia.assessment_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY ia.tenant_id, ia.assessment_type, ia.overall_severity;

CREATE OR REPLACE VIEW cascade_risk_analysis AS
SELECT 
    ca.tenant_id,
    ca.cascade_type,
    COUNT(*) as total_cascade_steps,
    AVG(ca.probability) as avg_cascade_probability,
    SUM(ca.load_shed_mw) as total_potential_load_shed,
    SUM(ca.customers_lost) as total_potential_customers_lost,
    COUNT(DISTINCT ca.assessment_id) as assessments_with_cascades,
    AVG(ca.confidence_score) as avg_confidence_score
FROM cascade_analysis ca
JOIN impact_assessments ia ON ca.assessment_id = ia.id
WHERE ia.assessment_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY ca.tenant_id, ca.cascade_type;

-- Enable RLS (commented out as per plan)
-- ALTER TABLE impact_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cascade_analysis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE impact_scenarios ENABLE ROW LEVEL SECURITY;



