-- Migration: Create security policies table
-- Description: Security policy management with versioning and approval workflow
-- Requirements: 4.3

-- Create enum for policy status
CREATE TYPE security_policy_status AS ENUM (
  'draft',
  'review',
  'approved',
  'active',
  'archived',
  'superseded'
);

-- Create enum for policy scope
CREATE TYPE policy_scope AS ENUM (
  'enterprise',
  'transmission',
  'site-specific',
  'zone-specific',
  'asset-specific'
);

-- Create enum for policy enforcement level
CREATE TYPE policy_enforcement_level AS ENUM (
  'mandatory',
  'recommended',
  'optional',
  'informational'
);

-- Create security_policies table
CREATE TABLE security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy identification
  policy_id VARCHAR(100) NOT NULL, -- e.g., 'POL-SEC-001', 'POL-TRANS-AC-001'
  policy_name TEXT NOT NULL,
  policy_description TEXT,
  policy_type VARCHAR(100) NOT NULL, -- 'Access Control', 'Data Protection', 'Incident Response', etc.
  
  -- Versioning
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  version_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_version_id UUID REFERENCES security_policies(id) ON DELETE SET NULL,
  superseded_by_id UUID REFERENCES security_policies(id) ON DELETE SET NULL,
  
  -- Status and lifecycle
  status security_policy_status NOT NULL DEFAULT 'draft',
  effective_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  review_frequency_months INTEGER DEFAULT 12,
  
  -- Scope and applicability
  scope policy_scope NOT NULL DEFAULT 'transmission',
  enforcement_level policy_enforcement_level NOT NULL DEFAULT 'mandatory',
  applies_to_sites UUID[], -- Array of site IDs
  applies_to_zones TEXT[], -- Array of security zone types
  applies_to_roles TEXT[], -- Array of user roles
  applies_to_asset_types TEXT[], -- Array of transmission asset types
  
  -- Policy content
  policy_statement TEXT NOT NULL,
  purpose TEXT,
  objectives TEXT[],
  requirements TEXT[],
  procedures TEXT,
  exceptions_allowed BOOLEAN DEFAULT false,
  exception_criteria TEXT,
  
  -- Compliance and standards
  related_standards UUID[], -- Array of compliance_standards IDs
  related_controls UUID[], -- Array of security_controls IDs
  regulatory_requirements TEXT[],
  
  -- Approval workflow
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  review_date_actual TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Ownership and responsibility
  policy_owner VARCHAR(255) NOT NULL,
  policy_owner_role VARCHAR(100),
  responsible_parties TEXT[],
  
  -- Documentation
  document_url TEXT,
  document_version VARCHAR(50),
  related_documents TEXT[],
  training_required BOOLEAN DEFAULT false,
  training_materials TEXT[],
  
  -- Compliance tracking
  compliance_mandatory BOOLEAN DEFAULT true,
  compliance_tracking_enabled BOOLEAN DEFAULT true,
  last_compliance_check TIMESTAMPTZ,
  compliance_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (compliance_rate >= 0 AND compliance_rate <= 100),
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_policy_id_per_tenant UNIQUE (tenant_id, policy_id, version),
  CONSTRAINT valid_review_frequency CHECK (review_frequency_months > 0),
  CONSTRAINT valid_compliance_rate CHECK (compliance_rate >= 0 AND compliance_rate <= 100),
  CONSTRAINT valid_dates CHECK (
    (effective_date IS NULL OR expiration_date IS NULL OR expiration_date > effective_date) AND
    (effective_date IS NULL OR review_date IS NULL OR review_date >= effective_date)
  )
);

-- Create policy_versions table (version history)
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
  
  -- Version details
  version VARCHAR(50) NOT NULL,
  version_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  version_type VARCHAR(50) NOT NULL CHECK (version_type IN ('major', 'minor', 'patch', 'emergency')),
  
  -- Changes
  change_summary TEXT NOT NULL,
  changes_made TEXT[],
  reason_for_change TEXT,
  
  -- Snapshot of policy content at this version
  policy_content JSONB NOT NULL,
  
  -- Version metadata
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_policy_version UNIQUE (policy_id, version)
);

-- Create policy_acknowledgments table (user acknowledgments)
CREATE TABLE policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  
  -- Acknowledgment details
  policy_version VARCHAR(50) NOT NULL,
  acknowledged_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledgment_method VARCHAR(100), -- 'electronic', 'training', 'manual'
  
  -- Training completion (if required)
  training_completed BOOLEAN DEFAULT false,
  training_completion_date TIMESTAMPTZ,
  training_score DECIMAL(5,2),
  
  -- Compliance
  compliant BOOLEAN DEFAULT true,
  compliance_notes TEXT,
  last_compliance_check TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_user_policy_acknowledgment UNIQUE (policy_id, user_id, policy_version)
);

-- Create policy_violations table (policy violation tracking)
CREATE TABLE policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
  
  -- Violation details
  violation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_by VARCHAR(255),
  detection_method VARCHAR(100), -- 'automated', 'audit', 'report', 'incident'
  
  -- Violator information
  violator_user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  violator_name VARCHAR(255),
  violator_role VARCHAR(100),
  
  -- Violation specifics
  violation_type VARCHAR(100) NOT NULL,
  violation_description TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- Impact
  impact_description TEXT,
  affected_systems TEXT[],
  affected_assets UUID[], -- Array of asset IDs
  
  -- Response and remediation
  response_actions TEXT[],
  remediation_plan TEXT,
  remediation_status VARCHAR(50) DEFAULT 'open' CHECK (remediation_status IN ('open', 'in-progress', 'resolved', 'closed', 'waived')),
  remediation_date TIMESTAMPTZ,
  
  -- Investigation
  investigation_required BOOLEAN DEFAULT false,
  investigation_notes TEXT,
  root_cause TEXT,
  
  -- Disciplinary action
  disciplinary_action_taken BOOLEAN DEFAULT false,
  disciplinary_action_description TEXT,
  
  -- Related incidents
  related_incident_id UUID,
  related_alert_id UUID,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_policies_tenant ON security_policies(tenant_id);
CREATE INDEX idx_security_policies_policy_id ON security_policies(policy_id);
CREATE INDEX idx_security_policies_status ON security_policies(status);
CREATE INDEX idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_scope ON security_policies(scope);
CREATE INDEX idx_security_policies_effective_date ON security_policies(effective_date);
CREATE INDEX idx_security_policies_review_date ON security_policies(review_date);
CREATE INDEX idx_security_policies_expiration_date ON security_policies(expiration_date);

CREATE INDEX idx_policy_versions_tenant ON policy_versions(tenant_id);
CREATE INDEX idx_policy_versions_policy ON policy_versions(policy_id);
CREATE INDEX idx_policy_versions_version ON policy_versions(version);
CREATE INDEX idx_policy_versions_date ON policy_versions(version_date DESC);

CREATE INDEX idx_policy_acknowledgments_tenant ON policy_acknowledgments(tenant_id);
CREATE INDEX idx_policy_acknowledgments_policy ON policy_acknowledgments(policy_id);
CREATE INDEX idx_policy_acknowledgments_user ON policy_acknowledgments(user_id);
CREATE INDEX idx_policy_acknowledgments_date ON policy_acknowledgments(acknowledged_date DESC);
CREATE INDEX idx_policy_acknowledgments_compliant ON policy_acknowledgments(compliant);

CREATE INDEX idx_policy_violations_tenant ON policy_violations(tenant_id);
CREATE INDEX idx_policy_violations_policy ON policy_violations(policy_id);
CREATE INDEX idx_policy_violations_user ON policy_violations(violator_user_id);
CREATE INDEX idx_policy_violations_date ON policy_violations(violation_date DESC);
CREATE INDEX idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX idx_policy_violations_status ON policy_violations(remediation_status);

-- Enable Row Level Security
-- ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE policy_violations ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_policies
-- CREATE POLICY "security_policies_tenant_isolation" ON security_policies
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "security_policies_read_access" ON security_policies
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "security_policies_write_access" ON security_policies
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- CREATE POLICY "security_policies_update_access" ON security_policies
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- RLS policies for policy_acknowledgments
-- CREATE POLICY "policy_acknowledgments_tenant_isolation" ON policy_acknowledgments
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "policy_acknowledgments_read_access" ON policy_acknowledgments
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor') OR
--       user_id = current_setting('app.user_id')::uuid
--     )
--   );

-- CREATE POLICY "policy_acknowledgments_write_access" ON policy_acknowledgments
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     user_id = current_setting('app.user_id')::uuid
--   );

-- RLS policies for policy_violations
-- CREATE POLICY "policy_violations_tenant_isolation" ON policy_violations
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "policy_violations_read_access" ON policy_violations
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- CREATE POLICY "policy_violations_write_access" ON policy_violations
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- Create function to create policy version on update
CREATE OR REPLACE FUNCTION create_policy_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if policy content changed and status is approved or active
  IF (OLD.status IN ('approved', 'active') AND NEW.status IN ('approved', 'active')) AND
     (OLD.policy_statement != NEW.policy_statement OR 
      OLD.requirements != NEW.requirements OR
      OLD.procedures != NEW.procedures) THEN
    
    INSERT INTO policy_versions (
      tenant_id,
      policy_id,
      version,
      version_date,
      version_type,
      change_summary,
      policy_content,
      created_by,
      approved_by,
      approval_date
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.version,
      NEW.version_date,
      'minor', -- Default to minor, can be updated manually
      'Policy updated',
      jsonb_build_object(
        'policy_statement', NEW.policy_statement,
        'requirements', NEW.requirements,
        'procedures', NEW.procedures,
        'objectives', NEW.objectives
      ),
      NEW.created_by,
      NEW.approved_by,
      NEW.approval_date
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create policy versions
CREATE TRIGGER trigger_create_policy_version
AFTER UPDATE ON security_policies
FOR EACH ROW
EXECUTE FUNCTION create_policy_version();

-- Create function to update policy compliance rate
CREATE OR REPLACE FUNCTION update_policy_compliance_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the policy's compliance rate based on acknowledgments
  UPDATE security_policies
  SET
    compliance_rate = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE compliant = true) * 100.0) / COUNT(*),
          2
        )
      END
      FROM policy_acknowledgments
      WHERE policy_id = NEW.policy_id
      AND policy_version = (SELECT version FROM security_policies WHERE id = NEW.policy_id)
    ),
    last_compliance_check = now(),
    updated_at = now()
  WHERE id = NEW.policy_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update compliance rate
CREATE TRIGGER trigger_update_policy_compliance_rate
AFTER INSERT OR UPDATE ON policy_acknowledgments
FOR EACH ROW
EXECUTE FUNCTION update_policy_compliance_rate();

-- Create updated_at triggers
CREATE TRIGGER update_security_policies_updated_at 
  BEFORE UPDATE ON security_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_acknowledgments_updated_at 
  BEFORE UPDATE ON policy_acknowledgments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_violations_updated_at 
  BEFORE UPDATE ON policy_violations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE security_policies IS 'Security policy management with versioning and approval workflow for transmission operations';
COMMENT ON TABLE policy_versions IS 'Version history for security policies with change tracking';
COMMENT ON TABLE policy_acknowledgments IS 'User acknowledgments and compliance tracking for security policies';
COMMENT ON TABLE policy_violations IS 'Policy violation tracking and remediation management';
COMMENT ON COLUMN security_policies.compliance_rate IS 'Percentage of required users who have acknowledged and are compliant with the policy';
COMMENT ON COLUMN security_policies.enforcement_level IS 'Level of enforcement: mandatory (must comply), recommended (should comply), optional, or informational';
