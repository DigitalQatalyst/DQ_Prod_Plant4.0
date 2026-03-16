-- Migration: Create risk and compliance summaries table
-- Description: Aggregates risk and compliance data for reporting and trend tracking
-- Requirements: 1.4

-- Create risk and compliance summaries table
CREATE TABLE IF NOT EXISTS risk_compliance_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Summary metadata
  summary_name VARCHAR(255) NOT NULL,
  summary_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reporting_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  reporting_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  summary_type VARCHAR(50) NOT NULL CHECK (summary_type IN ('monthly', 'quarterly', 'annual', 'ad-hoc')),
  
  -- Risk metrics
  total_risks INTEGER NOT NULL DEFAULT 0,
  critical_risks INTEGER NOT NULL DEFAULT 0,
  high_risks INTEGER NOT NULL DEFAULT 0,
  medium_risks INTEGER NOT NULL DEFAULT 0,
  low_risks INTEGER NOT NULL DEFAULT 0,
  mitigated_risks INTEGER NOT NULL DEFAULT 0,
  accepted_risks INTEGER NOT NULL DEFAULT 0,
  
  -- Risk scoring
  overall_risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  inherent_risk_score DECIMAL(5,2) DEFAULT 0.00 CHECK (inherent_risk_score >= 0 AND inherent_risk_score <= 100),
  residual_risk_score DECIMAL(5,2) DEFAULT 0.00 CHECK (residual_risk_score >= 0 AND residual_risk_score <= 100),
  risk_appetite_threshold DECIMAL(5,2) DEFAULT 50.00,
  risk_tolerance_exceeded BOOLEAN DEFAULT FALSE,
  
  -- Compliance metrics
  total_standards INTEGER NOT NULL DEFAULT 0,
  compliant_standards INTEGER NOT NULL DEFAULT 0,
  partial_compliant_standards INTEGER NOT NULL DEFAULT 0,
  non_compliant_standards INTEGER NOT NULL DEFAULT 0,
  
  -- Compliance scoring
  overall_compliance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (overall_compliance_score >= 0 AND overall_compliance_score <= 100),
  iec_62443_score DECIMAL(5,2) DEFAULT 0.00 CHECK (iec_62443_score >= 0 AND iec_62443_score <= 100),
  nerc_cip_score DECIMAL(5,2) DEFAULT 0.00 CHECK (nerc_cip_score >= 0 AND nerc_cip_score <= 100),
  
  -- Control metrics
  total_controls INTEGER NOT NULL DEFAULT 0,
  implemented_controls INTEGER NOT NULL DEFAULT 0,
  partial_controls INTEGER NOT NULL DEFAULT 0,
  not_implemented_controls INTEGER NOT NULL DEFAULT 0,
  control_effectiveness_score DECIMAL(5,2) DEFAULT 0.00 CHECK (control_effectiveness_score >= 0 AND control_effectiveness_score <= 100),
  
  -- Incident and alert metrics
  total_incidents INTEGER DEFAULT 0,
  critical_incidents INTEGER DEFAULT 0,
  resolved_incidents INTEGER DEFAULT 0,
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  
  -- Asset security metrics
  total_assets INTEGER DEFAULT 0,
  critical_assets INTEGER DEFAULT 0,
  vulnerable_assets INTEGER DEFAULT 0,
  secure_assets INTEGER DEFAULT 0,
  
  -- Trend indicators
  risk_trend VARCHAR(50) CHECK (risk_trend IN ('improving', 'stable', 'degrading', 'unknown')),
  compliance_trend VARCHAR(50) CHECK (compliance_trend IN ('improving', 'stable', 'degrading', 'unknown')),
  security_posture_trend VARCHAR(50) CHECK (security_posture_trend IN ('improving', 'stable', 'degrading', 'unknown')),
  
  -- Executive summary
  executive_summary TEXT,
  key_findings TEXT[],
  recommendations TEXT[],
  action_items TEXT[],
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in-review', 'approved', 'published', 'archived')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create risk compliance trend data table (for historical tracking)
CREATE TABLE IF NOT EXISTS risk_compliance_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Trend metadata
  trend_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('risk', 'compliance', 'security', 'incident', 'control')),
  
  -- Metric values
  metric_value DECIMAL(10,2) NOT NULL,
  metric_target DECIMAL(10,2),
  metric_threshold DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) CHECK (status IN ('on-target', 'at-risk', 'off-target', 'unknown')),
  
  -- Context
  context JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance standard status table
CREATE TABLE IF NOT EXISTS compliance_standard_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES risk_compliance_summaries(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Standard information
  standard_name VARCHAR(255) NOT NULL,
  standard_version VARCHAR(50),
  standard_type VARCHAR(50) NOT NULL CHECK (standard_type IN ('iec-62443', 'nerc-cip', 'nist', 'iso-27001', 'other')),
  
  -- Compliance status
  compliance_status VARCHAR(50) NOT NULL CHECK (compliance_status IN ('compliant', 'partial', 'non-compliant', 'not-assessed')),
  compliance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  
  -- Requirements
  total_requirements INTEGER NOT NULL DEFAULT 0,
  met_requirements INTEGER NOT NULL DEFAULT 0,
  partial_requirements INTEGER NOT NULL DEFAULT 0,
  unmet_requirements INTEGER NOT NULL DEFAULT 0,
  
  -- Assessment
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  next_assessment_date TIMESTAMP WITH TIME ZONE,
  assessor VARCHAR(255),
  
  -- Gaps and remediation
  critical_gaps INTEGER DEFAULT 0,
  high_gaps INTEGER DEFAULT 0,
  gap_summary TEXT,
  remediation_plan TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_risk_compliance_summaries_tenant ON risk_compliance_summaries(tenant_id);
CREATE INDEX idx_risk_compliance_summaries_site ON risk_compliance_summaries(site_id);
CREATE INDEX idx_risk_compliance_summaries_date ON risk_compliance_summaries(summary_date DESC);
CREATE INDEX idx_risk_compliance_summaries_period ON risk_compliance_summaries(reporting_period_start, reporting_period_end);
CREATE INDEX idx_risk_compliance_summaries_type ON risk_compliance_summaries(summary_type);
CREATE INDEX idx_risk_compliance_summaries_status ON risk_compliance_summaries(status);

CREATE INDEX idx_risk_compliance_trends_tenant ON risk_compliance_trends(tenant_id);
CREATE INDEX idx_risk_compliance_trends_site ON risk_compliance_trends(site_id);
CREATE INDEX idx_risk_compliance_trends_date ON risk_compliance_trends(trend_date DESC);
CREATE INDEX idx_risk_compliance_trends_metric ON risk_compliance_trends(metric_name);
CREATE INDEX idx_risk_compliance_trends_category ON risk_compliance_trends(metric_category);

CREATE INDEX idx_compliance_standard_status_summary ON compliance_standard_status(summary_id);
CREATE INDEX idx_compliance_standard_status_tenant ON compliance_standard_status(tenant_id);
CREATE INDEX idx_compliance_standard_status_type ON compliance_standard_status(standard_type);
CREATE INDEX idx_compliance_standard_status_status ON compliance_standard_status(compliance_status);

-- Enable Row Level Security
-- ALTER TABLE risk_compliance_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE risk_compliance_trends ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compliance_standard_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for risk_compliance_summaries
-- CREATE POLICY "risk_compliance_summaries_tenant_isolation" ON risk_compliance_summaries
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_summaries_select" ON risk_compliance_summaries
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_summaries_insert" ON risk_compliance_summaries
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_summaries_update" ON risk_compliance_summaries
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_summaries_delete" ON risk_compliance_summaries
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policies for risk_compliance_trends
-- CREATE POLICY "risk_compliance_trends_tenant_isolation" ON risk_compliance_trends
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_trends_select" ON risk_compliance_trends
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "risk_compliance_trends_insert" ON risk_compliance_trends
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policies for compliance_standard_status
-- CREATE POLICY "compliance_standard_status_tenant_isolation" ON compliance_standard_status
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_standard_status_select" ON compliance_standard_status
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_standard_status_insert" ON compliance_standard_status
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_standard_status_update" ON compliance_standard_status
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_standard_status_delete" ON compliance_standard_status
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create function to calculate trend indicators
CREATE OR REPLACE FUNCTION calculate_trend_indicator(
  current_value DECIMAL,
  previous_value DECIMAL,
  improvement_threshold DECIMAL DEFAULT 5.0
)
RETURNS VARCHAR AS $$
BEGIN
  IF previous_value IS NULL OR previous_value = 0 THEN
    RETURN 'unknown';
  END IF;
  
  DECLARE
    change_percent DECIMAL;
  BEGIN
    change_percent := ((current_value - previous_value) / previous_value) * 100;
    
    IF change_percent > improvement_threshold THEN
      RETURN 'improving';
    ELSIF change_percent < -improvement_threshold THEN
      RETURN 'degrading';
    ELSE
      RETURN 'stable';
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_risk_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_risk_compliance_summaries_updated_at
BEFORE UPDATE ON risk_compliance_summaries
FOR EACH ROW
EXECUTE FUNCTION update_risk_compliance_updated_at();

CREATE TRIGGER trigger_compliance_standard_status_updated_at
BEFORE UPDATE ON compliance_standard_status
FOR EACH ROW
EXECUTE FUNCTION update_risk_compliance_updated_at();

-- Add comments for documentation
COMMENT ON TABLE risk_compliance_summaries IS 'Aggregated risk and compliance summaries for reporting and trend analysis';
COMMENT ON TABLE risk_compliance_trends IS 'Historical trend data for risk and compliance metrics';
COMMENT ON TABLE compliance_standard_status IS 'Compliance status for individual security standards';
COMMENT ON COLUMN risk_compliance_summaries.overall_risk_score IS 'Aggregated risk score across all identified risks (0-100, higher is worse)';
COMMENT ON COLUMN risk_compliance_summaries.overall_compliance_score IS 'Aggregated compliance score across all applicable standards (0-100, higher is better)';
COMMENT ON COLUMN risk_compliance_summaries.inherent_risk_score IS 'Risk score before controls are applied';
COMMENT ON COLUMN risk_compliance_summaries.residual_risk_score IS 'Risk score after controls are applied';
