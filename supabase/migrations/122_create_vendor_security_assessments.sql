-- Migration: Create vendor security assessments table
-- Description: Tracks third-party vendor and system security assessments
-- Requirements: 1.5

-- Create vendor security assessments table
CREATE TABLE IF NOT EXISTS vendor_security_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Vendor information
  vendor_name VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(100),
  vendor_type VARCHAR(100) NOT NULL CHECK (vendor_type IN ('equipment-manufacturer', 'software-provider', 'service-provider', 'system-integrator', 'consultant', 'other')),
  vendor_contact_name VARCHAR(255),
  vendor_contact_email VARCHAR(255),
  vendor_contact_phone VARCHAR(50),
  
  -- System/Product information
  system_name VARCHAR(255) NOT NULL,
  system_version VARCHAR(100),
  system_type VARCHAR(100) CHECK (system_type IN ('scada', 'ems', 'dms', 'protection-relay', 'rtu', 'ied', 'gateway', 'application', 'service', 'other')),
  system_criticality VARCHAR(50) NOT NULL CHECK (system_criticality IN ('safety-critical', 'production-critical', 'high', 'medium', 'low')),
  
  -- Assessment metadata
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('initial', 'periodic', 'renewal', 'incident-driven', 'audit')),
  assessor VARCHAR(255),
  assessment_method VARCHAR(100) CHECK (assessment_method IN ('questionnaire', 'on-site-audit', 'documentation-review', 'penetration-test', 'combined')),
  
  -- Security scoring
  overall_security_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (overall_security_score >= 0 AND overall_security_score <= 100),
  risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (risk_score >= 0 AND risk_score <= 100),
  trust_level VARCHAR(50) CHECK (trust_level IN ('trusted', 'conditional', 'restricted', 'untrusted')),
  
  -- Assessment categories
  authentication_score DECIMAL(5,2) DEFAULT 0.00 CHECK (authentication_score >= 0 AND authentication_score <= 100),
  authorization_score DECIMAL(5,2) DEFAULT 0.00 CHECK (authorization_score >= 0 AND authorization_score <= 100),
  encryption_score DECIMAL(5,2) DEFAULT 0.00 CHECK (encryption_score >= 0 AND encryption_score <= 100),
  patch_management_score DECIMAL(5,2) DEFAULT 0.00 CHECK (patch_management_score >= 0 AND patch_management_score <= 100),
  incident_response_score DECIMAL(5,2) DEFAULT 0.00 CHECK (incident_response_score >= 0 AND incident_response_score <= 100),
  data_protection_score DECIMAL(5,2) DEFAULT 0.00 CHECK (data_protection_score >= 0 AND data_protection_score <= 100),
  
  -- Compliance and certifications
  certifications TEXT[],
  compliance_standards TEXT[],
  iec_62443_certified BOOLEAN DEFAULT FALSE,
  iec_62443_level INTEGER CHECK (iec_62443_level >= 0 AND iec_62443_level <= 4),
  
  -- Vulnerabilities and risks
  known_vulnerabilities INTEGER DEFAULT 0,
  critical_vulnerabilities INTEGER DEFAULT 0,
  high_vulnerabilities INTEGER DEFAULT 0,
  medium_vulnerabilities INTEGER DEFAULT 0,
  low_vulnerabilities INTEGER DEFAULT 0,
  
  -- Risk findings
  critical_findings INTEGER DEFAULT 0,
  high_findings INTEGER DEFAULT 0,
  medium_findings INTEGER DEFAULT 0,
  low_findings INTEGER DEFAULT 0,
  findings_summary TEXT,
  
  -- Recommendations
  recommendations TEXT[],
  required_actions TEXT[],
  remediation_plan TEXT,
  remediation_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Contract and SLA
  contract_start_date TIMESTAMP WITH TIME ZONE,
  contract_end_date TIMESTAMP WITH TIME ZONE,
  sla_requirements TEXT,
  security_requirements TEXT,
  
  -- Status and approval
  status VARCHAR(50) NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'approved', 'rejected', 'expired')),
  approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'conditional', 'rejected')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Review schedule
  next_assessment_date TIMESTAMP WITH TIME ZONE,
  assessment_frequency VARCHAR(50) CHECK (assessment_frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual', 'biennial')),
  
  -- Metadata
  notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create vendor security findings table (detailed findings)
CREATE TABLE IF NOT EXISTS vendor_security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES vendor_security_assessments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Finding identification
  finding_id VARCHAR(100),
  finding_title VARCHAR(255) NOT NULL,
  finding_description TEXT NOT NULL,
  finding_category VARCHAR(100) NOT NULL CHECK (finding_category IN ('authentication', 'authorization', 'encryption', 'patch-management', 'configuration', 'network-security', 'data-protection', 'incident-response', 'other')),
  
  -- Severity and risk
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  risk_level VARCHAR(50) CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
  likelihood VARCHAR(50) CHECK (likelihood IN ('very-high', 'high', 'medium', 'low', 'very-low')),
  impact VARCHAR(50) CHECK (impact IN ('very-high', 'high', 'medium', 'low', 'very-low')),
  
  -- Evidence and validation
  evidence TEXT,
  affected_components TEXT[],
  cve_ids TEXT[],
  
  -- Remediation
  remediation_recommendation TEXT NOT NULL,
  remediation_priority VARCHAR(50) CHECK (remediation_priority IN ('immediate', 'high', 'medium', 'low')),
  remediation_status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (remediation_status IN ('open', 'in-progress', 'resolved', 'accepted', 'deferred')),
  remediation_owner VARCHAR(255),
  remediation_due_date TIMESTAMP WITH TIME ZONE,
  remediation_completed_date TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  verification_method VARCHAR(100),
  verified_by VARCHAR(255),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create vendor contact history table
CREATE TABLE IF NOT EXISTS vendor_contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES vendor_security_assessments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Contact information
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN ('email', 'phone', 'meeting', 'incident', 'audit', 'other')),
  contact_subject VARCHAR(255) NOT NULL,
  contact_summary TEXT,
  
  -- Participants
  internal_participants TEXT[],
  vendor_participants TEXT[],
  
  -- Follow-up
  action_items TEXT[],
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vendor_security_assessments_tenant ON vendor_security_assessments(tenant_id);
CREATE INDEX idx_vendor_security_assessments_vendor ON vendor_security_assessments(vendor_name);
CREATE INDEX idx_vendor_security_assessments_system ON vendor_security_assessments(system_name);
CREATE INDEX idx_vendor_security_assessments_date ON vendor_security_assessments(assessment_date DESC);
CREATE INDEX idx_vendor_security_assessments_status ON vendor_security_assessments(status);
CREATE INDEX idx_vendor_security_assessments_criticality ON vendor_security_assessments(system_criticality);
CREATE INDEX idx_vendor_security_assessments_score ON vendor_security_assessments(overall_security_score);
CREATE INDEX idx_vendor_security_assessments_next_assessment ON vendor_security_assessments(next_assessment_date);

CREATE INDEX idx_vendor_security_findings_assessment ON vendor_security_findings(assessment_id);
CREATE INDEX idx_vendor_security_findings_tenant ON vendor_security_findings(tenant_id);
CREATE INDEX idx_vendor_security_findings_severity ON vendor_security_findings(severity);
CREATE INDEX idx_vendor_security_findings_status ON vendor_security_findings(remediation_status);
CREATE INDEX idx_vendor_security_findings_category ON vendor_security_findings(finding_category);

CREATE INDEX idx_vendor_contact_history_assessment ON vendor_contact_history(assessment_id);
CREATE INDEX idx_vendor_contact_history_tenant ON vendor_contact_history(tenant_id);
CREATE INDEX idx_vendor_contact_history_date ON vendor_contact_history(contact_date DESC);
CREATE INDEX idx_vendor_contact_history_type ON vendor_contact_history(contact_type);

-- Enable Row Level Security
-- ALTER TABLE vendor_security_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendor_security_findings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendor_contact_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_security_assessments
-- CREATE POLICY "vendor_security_assessments_tenant_isolation" ON vendor_security_assessments
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_assessments_select" ON vendor_security_assessments
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_assessments_insert" ON vendor_security_assessments
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_assessments_update" ON vendor_security_assessments
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_assessments_delete" ON vendor_security_assessments
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policies for vendor_security_findings
-- CREATE POLICY "vendor_security_findings_tenant_isolation" ON vendor_security_findings
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_findings_select" ON vendor_security_findings
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_findings_insert" ON vendor_security_findings
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_findings_update" ON vendor_security_findings
--   FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_security_findings_delete" ON vendor_security_findings
--   FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policies for vendor_contact_history
-- CREATE POLICY "vendor_contact_history_tenant_isolation" ON vendor_contact_history
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_contact_history_select" ON vendor_contact_history
--   FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "vendor_contact_history_insert" ON vendor_contact_history
--   FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create function to update vendor assessment scores
CREATE OR REPLACE FUNCTION update_vendor_assessment_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the assessment's finding counts and overall score
  UPDATE vendor_security_assessments
  SET
    critical_findings = (
      SELECT COUNT(*) FROM vendor_security_findings 
      WHERE assessment_id = NEW.assessment_id 
      AND severity = 'critical'
      AND remediation_status NOT IN ('resolved', 'accepted')
    ),
    high_findings = (
      SELECT COUNT(*) FROM vendor_security_findings 
      WHERE assessment_id = NEW.assessment_id 
      AND severity = 'high'
      AND remediation_status NOT IN ('resolved', 'accepted')
    ),
    medium_findings = (
      SELECT COUNT(*) FROM vendor_security_findings 
      WHERE assessment_id = NEW.assessment_id 
      AND severity = 'medium'
      AND remediation_status NOT IN ('resolved', 'accepted')
    ),
    low_findings = (
      SELECT COUNT(*) FROM vendor_security_findings 
      WHERE assessment_id = NEW.assessment_id 
      AND severity = 'low'
      AND remediation_status NOT IN ('resolved', 'accepted')
    ),
    updated_at = NOW()
  WHERE id = NEW.assessment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update scores on finding changes
CREATE TRIGGER trigger_update_vendor_assessment_scores
AFTER INSERT OR UPDATE OR DELETE ON vendor_security_findings
FOR EACH ROW
EXECUTE FUNCTION update_vendor_assessment_scores();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_vendor_security_assessments_updated_at
BEFORE UPDATE ON vendor_security_assessments
FOR EACH ROW
EXECUTE FUNCTION update_vendor_security_updated_at();

CREATE TRIGGER trigger_vendor_security_findings_updated_at
BEFORE UPDATE ON vendor_security_findings
FOR EACH ROW
EXECUTE FUNCTION update_vendor_security_updated_at();

-- Add comments for documentation
COMMENT ON TABLE vendor_security_assessments IS 'Security assessments for third-party vendors and systems';
COMMENT ON TABLE vendor_security_findings IS 'Detailed security findings from vendor assessments';
COMMENT ON TABLE vendor_contact_history IS 'Communication history with vendors regarding security matters';
COMMENT ON COLUMN vendor_security_assessments.overall_security_score IS 'Overall security score for the vendor/system (0-100, higher is better)';
COMMENT ON COLUMN vendor_security_assessments.risk_score IS 'Risk score associated with the vendor/system (0-100, higher is worse)';
COMMENT ON COLUMN vendor_security_assessments.trust_level IS 'Trust level assigned to the vendor based on assessment results';
