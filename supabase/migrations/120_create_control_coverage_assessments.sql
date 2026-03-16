-- Migration: Create control coverage assessments table
-- Description: Tracks IEC 62443 and NERC CIP control implementation and coverage
-- Requirements: 1.3

-- Create control coverage assessments table
CREATE TABLE IF NOT EXISTS control_coverage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Assessment metadata
  assessment_name VARCHAR(255) NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assessor VARCHAR(255),
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('iec-62443', 'nerc-cip', 'combined', 'custom')),
  
  -- Standard information
  standard_name VARCHAR(255) NOT NULL,
  standard_version VARCHAR(50),
  
  -- Coverage metrics
  total_controls INTEGER NOT NULL DEFAULT 0,
  implemented_controls INTEGER NOT NULL DEFAULT 0,
  partial_controls INTEGER NOT NULL DEFAULT 0,
  not_implemented_controls INTEGER NOT NULL DEFAULT 0,
  not_applicable_controls INTEGER NOT NULL DEFAULT 0,
  
  -- Scoring
  coverage_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (coverage_score >= 0 AND coverage_score <= 100),
  effectiveness_score DECIMAL(5,2) DEFAULT 0.00 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  maturity_level INTEGER CHECK (maturity_level >= 0 AND maturity_level <= 5),
  
  -- Status and compliance
  status VARCHAR(50) NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'approved', 'expired')),
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'non-compliant' CHECK (compliance_status IN ('compliant', 'partial', 'non-compliant', 'not-assessed')),
  
  -- Gap analysis
  critical_gaps INTEGER DEFAULT 0,
  high_gaps INTEGER DEFAULT 0,
  medium_gaps INTEGER DEFAULT 0,
  low_gaps INTEGER DEFAULT 0,
  gap_summary TEXT,
  
  -- Remediation
  remediation_plan TEXT,
  target_completion_date TIMESTAMP WITH TIME ZONE,
  next_assessment_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create control coverage details table (individual controls)
CREATE TABLE IF NOT EXISTS control_coverage_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES control_coverage_assessments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Control identification
  control_id VARCHAR(100) NOT NULL, -- e.g., IEC-62443-3-3-SR-1.1, CIP-007-6-R1
  control_name VARCHAR(255) NOT NULL,
  control_description TEXT,
  control_category VARCHAR(100),
  
  -- Implementation status
  implementation_status VARCHAR(50) NOT NULL CHECK (implementation_status IN ('implemented', 'partial', 'not-implemented', 'not-applicable')),
  effectiveness VARCHAR(50) CHECK (effectiveness IN ('effective', 'partially-effective', 'ineffective', 'not-assessed')),
  
  -- Evidence and validation
  evidence TEXT[],
  validation_method VARCHAR(100),
  last_validated TIMESTAMP WITH TIME ZONE,
  
  -- Gap information
  gap_severity VARCHAR(50) CHECK (gap_severity IN ('critical', 'high', 'medium', 'low', 'none')),
  gap_description TEXT,
  remediation_action TEXT,
  remediation_owner VARCHAR(255),
  remediation_due_date TIMESTAMP WITH TIME ZONE,
  remediation_status VARCHAR(50) CHECK (remediation_status IN ('not-started', 'in-progress', 'completed', 'deferred')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_control_coverage_assessments_tenant ON control_coverage_assessments(tenant_id);
CREATE INDEX idx_control_coverage_assessments_site ON control_coverage_assessments(site_id);
CREATE INDEX idx_control_coverage_assessments_type ON control_coverage_assessments(assessment_type);
CREATE INDEX idx_control_coverage_assessments_status ON control_coverage_assessments(status);
CREATE INDEX idx_control_coverage_assessments_compliance ON control_coverage_assessments(compliance_status);
CREATE INDEX idx_control_coverage_assessments_date ON control_coverage_assessments(assessment_date DESC);

CREATE INDEX idx_control_coverage_details_assessment ON control_coverage_details(assessment_id);
CREATE INDEX idx_control_coverage_details_tenant ON control_coverage_details(tenant_id);
CREATE INDEX idx_control_coverage_details_control_id ON control_coverage_details(control_id);
CREATE INDEX idx_control_coverage_details_implementation ON control_coverage_details(implementation_status);
CREATE INDEX idx_control_coverage_details_gap_severity ON control_coverage_details(gap_severity);

-- Enable Row Level Security
-- ALTER TABLE control_coverage_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE control_coverage_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for control_coverage_assessments
-- CREATE POLICY "control_coverage_assessments_tenant_isolation" ON control_coverage_assessments
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_assessments_select" ON control_coverage_assessments
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_assessments_insert" ON control_coverage_assessments
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_assessments_update" ON control_coverage_assessments
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_assessments_delete" ON control_coverage_assessments
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policies for control_coverage_details
-- CREATE POLICY "control_coverage_details_tenant_isolation" ON control_coverage_details
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_details_select" ON control_coverage_details
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_details_insert" ON control_coverage_details
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_details_update" ON control_coverage_details
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_coverage_details_delete" ON control_coverage_details
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create function to update coverage scores automatically
CREATE OR REPLACE FUNCTION update_control_coverage_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the assessment's control counts and coverage score
  UPDATE control_coverage_assessments
  SET
    total_controls = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id
    ),
    implemented_controls = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND implementation_status = 'implemented'
    ),
    partial_controls = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND implementation_status = 'partial'
    ),
    not_implemented_controls = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND implementation_status = 'not-implemented'
    ),
    not_applicable_controls = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND implementation_status = 'not-applicable'
    ),
    critical_gaps = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND gap_severity = 'critical'
    ),
    high_gaps = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND gap_severity = 'high'
    ),
    medium_gaps = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND gap_severity = 'medium'
    ),
    low_gaps = (
      SELECT COUNT(*) FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id 
      AND gap_severity = 'low'
    ),
    coverage_score = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE implementation_status = 'implemented') * 100.0 +
           COUNT(*) FILTER (WHERE implementation_status = 'partial') * 50.0) /
          COUNT(*) FILTER (WHERE implementation_status != 'not-applicable'),
          2
        )
      END
      FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id
    ),
    effectiveness_score = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE effectiveness = 'effective') * 100.0 +
           COUNT(*) FILTER (WHERE effectiveness = 'partially-effective') * 50.0) /
          COUNT(*) FILTER (WHERE effectiveness != 'not-assessed'),
          2
        )
      END
      FROM control_coverage_details 
      WHERE assessment_id = NEW.assessment_id
    ),
    updated_at = NOW()
  WHERE id = NEW.assessment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update scores on control detail changes
CREATE TRIGGER trigger_update_control_coverage_scores
AFTER INSERT OR UPDATE OR DELETE ON control_coverage_details
FOR EACH ROW
EXECUTE FUNCTION update_control_coverage_scores();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_control_coverage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_control_coverage_assessments_updated_at
BEFORE UPDATE ON control_coverage_assessments
FOR EACH ROW
EXECUTE FUNCTION update_control_coverage_updated_at();

CREATE TRIGGER trigger_control_coverage_details_updated_at
BEFORE UPDATE ON control_coverage_details
FOR EACH ROW
EXECUTE FUNCTION update_control_coverage_updated_at();

-- Add comments for documentation
COMMENT ON TABLE control_coverage_assessments IS 'Tracks security control coverage assessments for IEC 62443, NERC CIP, and other standards';
COMMENT ON TABLE control_coverage_details IS 'Individual control implementation details for coverage assessments';
COMMENT ON COLUMN control_coverage_assessments.coverage_score IS 'Percentage of applicable controls that are implemented (0-100)';
COMMENT ON COLUMN control_coverage_assessments.effectiveness_score IS 'Percentage of implemented controls that are effective (0-100)';
COMMENT ON COLUMN control_coverage_assessments.maturity_level IS 'Security maturity level (0-5) based on IEC 62443 or similar frameworks';
