-- Migration: Create security risks (risk register) table
-- Description: Security risk register with categorization, assessment, and mitigation tracking
-- Requirements: 4.6

-- Create enum for risk status
CREATE TYPE security_risk_status AS ENUM (
  'identified',
  'assessed',
  'mitigating',
  'monitoring',
  'accepted',
  'transferred',
  'closed'
);

-- Create enum for risk category
CREATE TYPE security_risk_category AS ENUM (
  'cyber-attack',
  'insider-threat',
  'system-vulnerability',
  'configuration-error',
  'physical-security',
  'third-party',
  'compliance',
  'operational',
  'natural-disaster',
  'human-error'
);

-- Create enum for risk treatment strategy
CREATE TYPE risk_treatment_strategy AS ENUM (
  'mitigate',
  'accept',
  'transfer',
  'avoid',
  'monitor'
);

-- Create security_risks table
CREATE TABLE security_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Risk identification
  risk_id VARCHAR(100) NOT NULL, -- e.g., 'RISK-TRANS-2024-001', 'RISK-CYBER-001'
  risk_name TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  risk_category security_risk_category NOT NULL,
  risk_subcategory VARCHAR(100),
  
  -- Transmission-specific context
  threat_scenario TEXT, -- Specific threat scenario for transmission (e.g., 'IEC 61850 GOOSE message manipulation')
  threat_actor VARCHAR(100), -- 'nation-state', 'insider', 'hacktivist', 'criminal', 'accidental'
  attack_vector TEXT[],
  affected_asset_types TEXT[], -- 'transformer', 'circuit-breaker', 'protection-relay', 'rtu', 'scada-node'
  affected_protocols TEXT[], -- 'IEC-61850', 'DNP3', 'IEC-60870-5-104'
  
  -- Scope and impact
  applies_to_sites UUID[], -- Array of site IDs
  applies_to_zones TEXT[], -- Array of security zone types
  applies_to_assets UUID[], -- Array of specific asset IDs
  
  -- Risk assessment - Inherent (before controls)
  inherent_likelihood VARCHAR(50) NOT NULL CHECK (inherent_likelihood IN ('very-low', 'low', 'medium', 'high', 'very-high')),
  inherent_impact VARCHAR(50) NOT NULL CHECK (inherent_impact IN ('negligible', 'minor', 'moderate', 'major', 'catastrophic')),
  inherent_risk_score DECIMAL(5,2) NOT NULL CHECK (inherent_risk_score >= 0 AND inherent_risk_score <= 100),
  inherent_risk_level risk_level NOT NULL,
  
  -- Risk assessment - Residual (after controls)
  residual_likelihood VARCHAR(50) CHECK (residual_likelihood IN ('very-low', 'low', 'medium', 'high', 'very-high')),
  residual_impact VARCHAR(50) CHECK (residual_impact IN ('negligible', 'minor', 'moderate', 'major', 'catastrophic')),
  residual_risk_score DECIMAL(5,2) CHECK (residual_risk_score >= 0 AND residual_risk_score <= 100),
  residual_risk_level risk_level,
  
  -- Impact analysis
  safety_impact BOOLEAN DEFAULT false,
  safety_impact_description TEXT,
  operational_impact_description TEXT,
  financial_impact_estimate DECIMAL(15,2),
  regulatory_impact_description TEXT,
  reputational_impact_description TEXT,
  
  -- Transmission-specific impacts
  grid_stability_impact BOOLEAN DEFAULT false,
  customer_impact_estimate INTEGER, -- Number of customers potentially affected
  mw_at_risk DECIMAL(10,2), -- Megawatts at risk
  recovery_time_estimate_hours DECIMAL(8,2),
  
  -- Existing controls
  existing_controls UUID[], -- Array of security_controls IDs
  control_effectiveness VARCHAR(50) CHECK (control_effectiveness IN ('effective', 'partially-effective', 'ineffective', 'none')),
  control_gaps TEXT[],
  
  -- Risk treatment
  treatment_strategy risk_treatment_strategy NOT NULL DEFAULT 'mitigate',
  treatment_plan TEXT,
  treatment_owner VARCHAR(255),
  treatment_owner_role VARCHAR(100),
  treatment_budget DECIMAL(15,2),
  treatment_priority VARCHAR(50) CHECK (treatment_priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Status and tracking
  status security_risk_status NOT NULL DEFAULT 'identified',
  identified_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  identified_by VARCHAR(255),
  last_assessment_date TIMESTAMPTZ,
  next_assessment_date TIMESTAMPTZ,
  assessment_frequency_months INTEGER DEFAULT 6,
  
  -- Risk acceptance (if treatment strategy is 'accept')
  risk_accepted BOOLEAN DEFAULT false,
  accepted_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  acceptance_date TIMESTAMPTZ,
  acceptance_justification TEXT,
  acceptance_expiration TIMESTAMPTZ,
  
  -- Risk transfer (if treatment strategy is 'transfer')
  risk_transferred BOOLEAN DEFAULT false,
  transferred_to VARCHAR(255), -- Insurance company, third party, etc.
  transfer_mechanism TEXT, -- 'insurance', 'contract', 'outsourcing'
  transfer_date TIMESTAMPTZ,
  
  -- Monitoring
  requires_monitoring BOOLEAN DEFAULT true,
  monitoring_frequency_days INTEGER DEFAULT 30,
  last_monitored TIMESTAMPTZ,
  next_monitoring_date TIMESTAMPTZ,
  monitoring_kpis TEXT[],
  
  -- Related records
  related_incidents UUID[], -- Array of incident_cases IDs
  related_vulnerabilities UUID[], -- Array of vulnerability IDs
  related_compliance_requirements UUID[], -- Array of compliance_requirements IDs
  
  -- Closure
  closed_date TIMESTAMPTZ,
  closed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  closure_reason TEXT,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_risk_id_per_tenant UNIQUE (tenant_id, risk_id),
  CONSTRAINT valid_inherent_risk_score CHECK (inherent_risk_score >= 0 AND inherent_risk_score <= 100),
  CONSTRAINT valid_residual_risk_score CHECK (residual_risk_score IS NULL OR (residual_risk_score >= 0 AND residual_risk_score <= 100)),
  CONSTRAINT valid_assessment_frequency CHECK (assessment_frequency_months > 0),
  CONSTRAINT acceptance_requires_justification CHECK (
    NOT risk_accepted OR acceptance_justification IS NOT NULL
  ),
  CONSTRAINT transfer_requires_details CHECK (
    NOT risk_transferred OR (transferred_to IS NOT NULL AND transfer_mechanism IS NOT NULL)
  )
);

-- Create risk_assessments table (assessment history)
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES security_risks(id) ON DELETE CASCADE,
  
  -- Assessment details
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessment_type VARCHAR(100) NOT NULL, -- 'initial', 'periodic', 'triggered', 'post-incident', 'audit'
  assessor_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  assessor_name VARCHAR(255),
  assessment_method VARCHAR(100), -- 'qualitative', 'quantitative', 'semi-quantitative'
  
  -- Assessment results
  likelihood VARCHAR(50) NOT NULL CHECK (likelihood IN ('very-low', 'low', 'medium', 'high', 'very-high')),
  impact VARCHAR(50) NOT NULL CHECK (impact IN ('negligible', 'minor', 'moderate', 'major', 'catastrophic')),
  risk_score DECIMAL(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level risk_level NOT NULL,
  
  -- Changes from previous assessment
  likelihood_changed BOOLEAN DEFAULT false,
  impact_changed BOOLEAN DEFAULT false,
  risk_trend VARCHAR(50) CHECK (risk_trend IN ('increasing', 'stable', 'decreasing')),
  
  -- Findings and recommendations
  findings TEXT,
  control_effectiveness_assessment TEXT,
  recommendations TEXT[],
  action_items TEXT[],
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create risk_mitigation_actions table (mitigation actions and tracking)
CREATE TABLE risk_mitigation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES security_risks(id) ON DELETE CASCADE,
  
  -- Action details
  action_name TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- 'implement-control', 'enhance-control', 'process-change', 'training', 'technology'
  
  -- Implementation
  responsible_party VARCHAR(255) NOT NULL,
  responsible_role VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'deferred', 'cancelled')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Timeline
  planned_start_date TIMESTAMPTZ,
  planned_completion_date TIMESTAMPTZ NOT NULL,
  actual_start_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  
  -- Resources
  estimated_cost DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  estimated_effort_hours INTEGER,
  actual_effort_hours INTEGER,
  
  -- Effectiveness
  expected_risk_reduction DECIMAL(5,2) CHECK (expected_risk_reduction >= 0 AND expected_risk_reduction <= 100),
  actual_risk_reduction DECIMAL(5,2) CHECK (actual_risk_reduction >= 0 AND actual_risk_reduction <= 100),
  effectiveness_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Related controls
  implements_control_id UUID REFERENCES security_controls(id) ON DELETE SET NULL,
  
  -- Dependencies
  depends_on_actions UUID[], -- Array of other mitigation action IDs
  blocks_actions UUID[], -- Array of actions blocked by this one
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (
    (planned_start_date IS NULL OR planned_completion_date IS NULL OR planned_completion_date >= planned_start_date) AND
    (actual_start_date IS NULL OR actual_completion_date IS NULL OR actual_completion_date >= actual_start_date)
  )
);

-- Create risk_monitoring_events table (monitoring events and KPI tracking)
CREATE TABLE risk_monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES security_risks(id) ON DELETE CASCADE,
  
  -- Event details
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type VARCHAR(100) NOT NULL, -- 'routine-check', 'kpi-threshold', 'incident', 'control-failure', 'audit-finding'
  event_description TEXT NOT NULL,
  
  -- Monitoring results
  risk_indicators JSONB, -- KPI values and metrics
  risk_level_current risk_level,
  risk_trend VARCHAR(50) CHECK (risk_trend IN ('increasing', 'stable', 'decreasing')),
  
  -- Findings
  findings TEXT,
  concerns TEXT[],
  positive_developments TEXT[],
  
  -- Actions required
  action_required BOOLEAN DEFAULT false,
  recommended_actions TEXT[],
  escalation_required BOOLEAN DEFAULT false,
  escalated_to VARCHAR(255),
  
  -- Metadata
  monitored_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_risks_tenant ON security_risks(tenant_id);
CREATE INDEX idx_security_risks_risk_id ON security_risks(risk_id);
CREATE INDEX idx_security_risks_category ON security_risks(risk_category);
CREATE INDEX idx_security_risks_status ON security_risks(status);
CREATE INDEX idx_security_risks_inherent_level ON security_risks(inherent_risk_level);
CREATE INDEX idx_security_risks_residual_level ON security_risks(residual_risk_level);
CREATE INDEX idx_security_risks_treatment_strategy ON security_risks(treatment_strategy);
CREATE INDEX idx_security_risks_treatment_priority ON security_risks(treatment_priority);
CREATE INDEX idx_security_risks_next_assessment ON security_risks(next_assessment_date);
CREATE INDEX idx_security_risks_next_monitoring ON security_risks(next_monitoring_date);
CREATE INDEX idx_security_risks_safety_impact ON security_risks(safety_impact);
CREATE INDEX idx_security_risks_grid_stability ON security_risks(grid_stability_impact);

CREATE INDEX idx_risk_assessments_tenant ON risk_assessments(tenant_id);
CREATE INDEX idx_risk_assessments_risk ON risk_assessments(risk_id);
CREATE INDEX idx_risk_assessments_date ON risk_assessments(assessment_date DESC);
CREATE INDEX idx_risk_assessments_assessor ON risk_assessments(assessor_id);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);

CREATE INDEX idx_risk_mitigation_actions_tenant ON risk_mitigation_actions(tenant_id);
CREATE INDEX idx_risk_mitigation_actions_risk ON risk_mitigation_actions(risk_id);
CREATE INDEX idx_risk_mitigation_actions_status ON risk_mitigation_actions(status);
CREATE INDEX idx_risk_mitigation_actions_priority ON risk_mitigation_actions(priority);
CREATE INDEX idx_risk_mitigation_actions_completion_date ON risk_mitigation_actions(planned_completion_date);
CREATE INDEX idx_risk_mitigation_actions_control ON risk_mitigation_actions(implements_control_id);

CREATE INDEX idx_risk_monitoring_events_tenant ON risk_monitoring_events(tenant_id);
CREATE INDEX idx_risk_monitoring_events_risk ON risk_monitoring_events(risk_id);
CREATE INDEX idx_risk_monitoring_events_date ON risk_monitoring_events(event_date DESC);
CREATE INDEX idx_risk_monitoring_events_type ON risk_monitoring_events(event_type);
CREATE INDEX idx_risk_monitoring_events_action_required ON risk_monitoring_events(action_required);

-- Enable Row Level Security
-- ALTER TABLE security_risks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE risk_mitigation_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE risk_monitoring_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_risks
-- CREATE POLICY "security_risks_tenant_isolation" ON security_risks
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "security_risks_read_access" ON security_risks
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "security_risks_write_access" ON security_risks
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- CREATE POLICY "security_risks_update_access" ON security_risks
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- Create function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_likelihood VARCHAR(50),
  p_impact VARCHAR(50)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_likelihood_score DECIMAL(5,2);
  v_impact_score DECIMAL(5,2);
BEGIN
  -- Convert likelihood to score (0-5)
  v_likelihood_score := CASE p_likelihood
    WHEN 'very-low' THEN 1
    WHEN 'low' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'high' THEN 4
    WHEN 'very-high' THEN 5
    ELSE 0
  END;
  
  -- Convert impact to score (0-5)
  v_impact_score := CASE p_impact
    WHEN 'negligible' THEN 1
    WHEN 'minor' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'major' THEN 4
    WHEN 'catastrophic' THEN 5
    ELSE 0
  END;
  
  -- Calculate risk score (0-100)
  RETURN ROUND((v_likelihood_score * v_impact_score * 4), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to determine risk level from score
CREATE OR REPLACE FUNCTION determine_risk_level(
  p_risk_score DECIMAL(5,2)
) RETURNS risk_level AS $$
BEGIN
  RETURN CASE
    WHEN p_risk_score >= 80 THEN 'critical'::risk_level
    WHEN p_risk_score >= 60 THEN 'high'::risk_level
    WHEN p_risk_score >= 40 THEN 'medium'::risk_level
    WHEN p_risk_score >= 20 THEN 'low'::risk_level
    ELSE 'negligible'::risk_level
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-calculate risk scores
CREATE OR REPLACE FUNCTION auto_calculate_risk_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate inherent risk
  NEW.inherent_risk_score := calculate_risk_score(NEW.inherent_likelihood, NEW.inherent_impact);
  NEW.inherent_risk_level := determine_risk_level(NEW.inherent_risk_score);
  
  -- Calculate residual risk if provided
  IF NEW.residual_likelihood IS NOT NULL AND NEW.residual_impact IS NOT NULL THEN
    NEW.residual_risk_score := calculate_risk_score(NEW.residual_likelihood, NEW.residual_impact);
    NEW.residual_risk_level := determine_risk_level(NEW.residual_risk_score);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate risk scores
CREATE TRIGGER trigger_auto_calculate_risk_scores
BEFORE INSERT OR UPDATE ON security_risks
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_risk_scores();

-- Create updated_at triggers
CREATE TRIGGER update_security_risks_updated_at 
  BEFORE UPDATE ON security_risks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at 
  BEFORE UPDATE ON risk_assessments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_mitigation_actions_updated_at 
  BEFORE UPDATE ON risk_mitigation_actions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_monitoring_events_updated_at 
  BEFORE UPDATE ON risk_monitoring_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE security_risks IS 'Security risk register with transmission-specific risk categorization and mitigation tracking';
COMMENT ON TABLE risk_assessments IS 'Risk assessment history with likelihood, impact, and risk score tracking';
COMMENT ON TABLE risk_mitigation_actions IS 'Risk mitigation actions with implementation tracking and effectiveness measurement';
COMMENT ON TABLE risk_monitoring_events IS 'Risk monitoring events and KPI tracking for ongoing risk management';
COMMENT ON COLUMN security_risks.inherent_risk_score IS 'Risk score before controls (0-100) calculated from likelihood and impact';
COMMENT ON COLUMN security_risks.residual_risk_score IS 'Risk score after controls (0-100) calculated from likelihood and impact';
COMMENT ON COLUMN security_risks.grid_stability_impact IS 'Whether this risk could impact grid stability or cause cascading failures';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculates risk score (0-100) from likelihood and impact ratings';
COMMENT ON FUNCTION determine_risk_level IS 'Determines risk level (critical/high/medium/low/negligible) from risk score';
