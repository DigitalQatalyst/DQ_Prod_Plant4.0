-- Migration: Create compliance standards table
-- Description: Tracks compliance with IEC 62443, NERC CIP, and other transmission security standards
-- Requirements: 4.1

-- Create enum for compliance status
CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non-compliant',
  'in-progress',
  'not-applicable'
);

-- Create enum for standard category
CREATE TYPE standard_category AS ENUM (
  'cybersecurity',
  'operational',
  'safety',
  'environmental',
  'regulatory'
);

-- Create compliance_standards table
CREATE TABLE compliance_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Standard identification
  name VARCHAR(100) NOT NULL, -- e.g., 'IEC 62443', 'NERC CIP', 'ISO 27001'
  full_name TEXT NOT NULL,
  version VARCHAR(50),
  category standard_category NOT NULL DEFAULT 'cybersecurity',
  
  -- Compliance tracking
  status compliance_status NOT NULL DEFAULT 'in-progress',
  compliance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  
  -- Requirements tracking
  total_requirements INTEGER DEFAULT 0,
  met_requirements INTEGER DEFAULT 0,
  partial_requirements INTEGER DEFAULT 0,
  unmet_requirements INTEGER DEFAULT 0,
  not_applicable_requirements INTEGER DEFAULT 0,
  
  -- Assessment information
  last_assessment_date TIMESTAMPTZ,
  last_assessment_by VARCHAR(255),
  next_audit_date TIMESTAMPTZ,
  audit_frequency_months INTEGER DEFAULT 12,
  
  -- Scope and applicability
  applies_to_sites UUID[], -- Array of site IDs
  applies_to_zones TEXT[], -- Array of security zone types
  mandatory BOOLEAN DEFAULT true,
  
  -- Documentation
  description TEXT,
  regulatory_body VARCHAR(255),
  standard_url TEXT,
  documentation_links TEXT[],
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_standard_per_tenant UNIQUE (tenant_id, name, version),
  CONSTRAINT valid_compliance_score CHECK (compliance_score >= 0 AND compliance_score <= 100),
  CONSTRAINT valid_audit_frequency CHECK (audit_frequency_months > 0)
);

-- Create compliance_requirements table (individual requirements within standards)
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES compliance_standards(id) ON DELETE CASCADE,
  
  -- Requirement identification
  requirement_id VARCHAR(100) NOT NULL, -- e.g., 'IEC-62443-2-1-4.2.3.1', 'CIP-007-6-R1'
  requirement_name TEXT NOT NULL,
  requirement_description TEXT,
  requirement_section VARCHAR(100),
  
  -- Compliance status
  status compliance_status NOT NULL DEFAULT 'in-progress',
  implementation_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (implementation_percentage >= 0 AND implementation_percentage <= 100),
  
  -- Priority and risk
  priority VARCHAR(50) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  risk_if_not_met VARCHAR(50) CHECK (risk_if_not_met IN ('critical', 'high', 'medium', 'low')),
  
  -- Implementation details
  implementation_approach TEXT,
  responsible_party VARCHAR(255),
  target_completion_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  
  -- Evidence and validation
  evidence_required TEXT[],
  evidence_provided TEXT[],
  validation_method VARCHAR(255),
  last_validated TIMESTAMPTZ,
  validated_by VARCHAR(255),
  
  -- Gap analysis
  gap_description TEXT,
  remediation_plan TEXT,
  remediation_status VARCHAR(50) CHECK (remediation_status IN ('not-started', 'in-progress', 'completed', 'deferred', 'not-applicable')),
  
  -- Related controls
  related_controls UUID[], -- References to security_controls table
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_requirement_per_standard UNIQUE (standard_id, requirement_id)
);

-- Create compliance_evidence table (evidence artifacts for requirements)
CREATE TABLE compliance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  
  -- Evidence details
  evidence_type VARCHAR(100) NOT NULL, -- 'document', 'screenshot', 'log', 'report', 'certificate'
  evidence_name TEXT NOT NULL,
  evidence_description TEXT,
  
  -- Storage
  file_path TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_hash VARCHAR(255),
  
  -- Validation
  collected_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_by VARCHAR(255),
  validated BOOLEAN DEFAULT false,
  validated_date TIMESTAMPTZ,
  validated_by VARCHAR(255),
  
  -- Retention
  retention_required BOOLEAN DEFAULT true,
  retention_period_months INTEGER DEFAULT 36,
  expiration_date TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_compliance_standards_tenant ON compliance_standards(tenant_id);
CREATE INDEX idx_compliance_standards_status ON compliance_standards(status);
CREATE INDEX idx_compliance_standards_category ON compliance_standards(category);
CREATE INDEX idx_compliance_standards_name ON compliance_standards(name);
CREATE INDEX idx_compliance_standards_next_audit ON compliance_standards(next_audit_date);

CREATE INDEX idx_compliance_requirements_tenant ON compliance_requirements(tenant_id);
CREATE INDEX idx_compliance_requirements_standard ON compliance_requirements(standard_id);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);
CREATE INDEX idx_compliance_requirements_priority ON compliance_requirements(priority);
CREATE INDEX idx_compliance_requirements_requirement_id ON compliance_requirements(requirement_id);
CREATE INDEX idx_compliance_requirements_target_date ON compliance_requirements(target_completion_date);

CREATE INDEX idx_compliance_evidence_tenant ON compliance_evidence(tenant_id);
CREATE INDEX idx_compliance_evidence_requirement ON compliance_evidence(requirement_id);
CREATE INDEX idx_compliance_evidence_type ON compliance_evidence(evidence_type);
CREATE INDEX idx_compliance_evidence_validated ON compliance_evidence(validated);
CREATE INDEX idx_compliance_evidence_expiration ON compliance_evidence(expiration_date);

-- Enable Row Level Security
-- ALTER TABLE compliance_standards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance_standards
-- CREATE POLICY "compliance_standards_tenant_isolation" ON compliance_standards
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_standards_read_access" ON compliance_standards
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "compliance_standards_write_access" ON compliance_standards
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- CREATE POLICY "compliance_standards_update_access" ON compliance_standards
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- RLS policies for compliance_requirements
-- CREATE POLICY "compliance_requirements_tenant_isolation" ON compliance_requirements
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_requirements_read_access" ON compliance_requirements
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "compliance_requirements_write_access" ON compliance_requirements
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- RLS policies for compliance_evidence
-- CREATE POLICY "compliance_evidence_tenant_isolation" ON compliance_evidence
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "compliance_evidence_read_access" ON compliance_evidence
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "compliance_evidence_write_access" ON compliance_evidence
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer', 'auditor')
--   );

-- Create function to update compliance scores automatically
CREATE OR REPLACE FUNCTION update_compliance_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the standard's requirement counts and compliance score
  UPDATE compliance_standards
  SET
    total_requirements = (
      SELECT COUNT(*) FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id
    ),
    met_requirements = (
      SELECT COUNT(*) FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id 
      AND status = 'compliant'
    ),
    partial_requirements = (
      SELECT COUNT(*) FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id 
      AND status = 'in-progress'
    ),
    unmet_requirements = (
      SELECT COUNT(*) FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id 
      AND status = 'non-compliant'
    ),
    not_applicable_requirements = (
      SELECT COUNT(*) FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id 
      AND status = 'not-applicable'
    ),
    compliance_score = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE status = 'compliant') * 100.0 +
           COUNT(*) FILTER (WHERE status = 'in-progress') * 
           COALESCE(AVG(implementation_percentage) FILTER (WHERE status = 'in-progress'), 0)) /
          COUNT(*) FILTER (WHERE status != 'not-applicable'),
          2
        )
      END
      FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id
    ),
    status = (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE status = 'non-compliant') > 0 THEN 'non-compliant'::compliance_status
        WHEN COUNT(*) FILTER (WHERE status = 'in-progress') > 0 THEN 'in-progress'::compliance_status
        WHEN COUNT(*) FILTER (WHERE status != 'not-applicable') = COUNT(*) FILTER (WHERE status = 'compliant') THEN 'compliant'::compliance_status
        ELSE 'in-progress'::compliance_status
      END
      FROM compliance_requirements 
      WHERE standard_id = NEW.standard_id
    ),
    updated_at = now()
  WHERE id = NEW.standard_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update scores on requirement changes
CREATE TRIGGER trigger_update_compliance_scores
AFTER INSERT OR UPDATE OR DELETE ON compliance_requirements
FOR EACH ROW
EXECUTE FUNCTION update_compliance_scores();

-- Create updated_at triggers
CREATE TRIGGER update_compliance_standards_updated_at 
  BEFORE UPDATE ON compliance_standards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at 
  BEFORE UPDATE ON compliance_requirements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_evidence_updated_at 
  BEFORE UPDATE ON compliance_evidence 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE compliance_standards IS 'Tracks compliance with security standards (IEC 62443, NERC CIP, ISO 27001, etc.) for power transmission';
COMMENT ON TABLE compliance_requirements IS 'Individual requirements within compliance standards with implementation tracking';
COMMENT ON TABLE compliance_evidence IS 'Evidence artifacts supporting compliance requirement fulfillment';
COMMENT ON COLUMN compliance_standards.compliance_score IS 'Overall compliance percentage (0-100) calculated from requirement statuses';
COMMENT ON COLUMN compliance_requirements.implementation_percentage IS 'Percentage of requirement implementation (0-100) for in-progress items';
