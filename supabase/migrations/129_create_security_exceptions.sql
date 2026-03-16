-- Migration: Create security exceptions and waivers table
-- Description: Exception and waiver management with approval workflow and expiration tracking
-- Requirements: 4.4

-- Create enum for exception status
CREATE TYPE exception_status AS ENUM (
  'pending',
  'under-review',
  'approved',
  'denied',
  'active',
  'expired',
  'revoked',
  'closed'
);

-- Create enum for exception type
CREATE TYPE exception_type AS ENUM (
  'policy-exception',
  'control-exception',
  'compliance-waiver',
  'temporary-deviation',
  'permanent-exception',
  'risk-acceptance'
);

-- Create enum for risk level
CREATE TYPE risk_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'negligible'
);

-- Create security_exceptions table
CREATE TABLE security_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Exception identification
  exception_id VARCHAR(100) NOT NULL, -- e.g., 'EXC-2024-001', 'WAIV-TRANS-001'
  exception_name TEXT NOT NULL,
  exception_type exception_type NOT NULL,
  
  -- What is being excepted
  policy_id UUID REFERENCES security_policies(id) ON DELETE SET NULL,
  control_id UUID REFERENCES security_controls(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
  standard_id UUID REFERENCES compliance_standards(id) ON DELETE SET NULL,
  
  -- Scope of exception
  scope VARCHAR(100) NOT NULL, -- 'site', 'zone', 'asset', 'system', 'user'
  applies_to_sites UUID[], -- Array of site IDs
  applies_to_zones TEXT[], -- Array of security zone IDs
  applies_to_assets UUID[], -- Array of asset IDs
  applies_to_users UUID[], -- Array of user IDs
  
  -- Request details
  requested_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  business_justification TEXT NOT NULL,
  technical_justification TEXT,
  alternative_controls TEXT,
  
  -- Risk assessment
  risk_level risk_level NOT NULL,
  risk_description TEXT NOT NULL,
  risk_mitigation_measures TEXT[],
  residual_risk_level risk_level,
  residual_risk_description TEXT,
  
  -- Approval workflow
  status exception_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  review_date TIMESTAMPTZ,
  review_comments TEXT,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,
  approval_conditions TEXT[],
  denial_reason TEXT,
  
  -- Validity period
  effective_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  auto_expire BOOLEAN DEFAULT true,
  extension_allowed BOOLEAN DEFAULT false,
  max_extensions INTEGER DEFAULT 0,
  extensions_used INTEGER DEFAULT 0,
  
  -- Monitoring and compliance
  requires_monitoring BOOLEAN DEFAULT true,
  monitoring_frequency_days INTEGER DEFAULT 30,
  last_monitored TIMESTAMPTZ,
  next_monitoring_date TIMESTAMPTZ,
  compliance_status VARCHAR(50) DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'non-compliant', 'at-risk', 'unknown')),
  
  -- Compensating controls
  compensating_controls_required BOOLEAN DEFAULT false,
  compensating_controls TEXT[],
  compensating_controls_implemented BOOLEAN DEFAULT false,
  compensating_controls_verified BOOLEAN DEFAULT false,
  
  -- Revocation
  revoked BOOLEAN DEFAULT false,
  revoked_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  revocation_date TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Audit trail
  audit_log JSONB DEFAULT '[]',
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_exception_id_per_tenant UNIQUE (tenant_id, exception_id),
  CONSTRAINT valid_dates CHECK (
    expiration_date IS NULL OR effective_date IS NULL OR expiration_date > effective_date
  ),
  CONSTRAINT valid_extensions CHECK (extensions_used <= max_extensions),
  CONSTRAINT exception_target_required CHECK (
    policy_id IS NOT NULL OR 
    control_id IS NOT NULL OR 
    requirement_id IS NOT NULL OR 
    standard_id IS NOT NULL
  )
);

-- Create exception_reviews table (review history)
CREATE TABLE exception_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exception_id UUID NOT NULL REFERENCES security_exceptions(id) ON DELETE CASCADE,
  
  -- Review details
  review_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_type VARCHAR(100) NOT NULL, -- 'initial', 'periodic', 'renewal', 'incident-triggered', 'audit'
  reviewer_id UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  reviewer_role VARCHAR(100),
  
  -- Review findings
  findings TEXT NOT NULL,
  risk_assessment_current BOOLEAN DEFAULT true,
  compensating_controls_effective BOOLEAN,
  compliance_maintained BOOLEAN DEFAULT true,
  
  -- Recommendations
  recommendation VARCHAR(100) NOT NULL CHECK (recommendation IN ('continue', 'modify', 'revoke', 'extend', 'escalate')),
  recommendation_details TEXT,
  action_items TEXT[],
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create exception_extensions table (extension requests and approvals)
CREATE TABLE exception_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exception_id UUID NOT NULL REFERENCES security_exceptions(id) ON DELETE CASCADE,
  
  -- Extension request
  requested_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  extension_reason TEXT NOT NULL,
  requested_new_expiration TIMESTAMPTZ NOT NULL,
  
  -- Approval
  status exception_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,
  approved_new_expiration TIMESTAMPTZ,
  approval_conditions TEXT[],
  denial_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create exception_incidents table (incidents related to exceptions)
CREATE TABLE exception_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exception_id UUID NOT NULL REFERENCES security_exceptions(id) ON DELETE CASCADE,
  
  -- Incident details
  incident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  incident_type VARCHAR(100) NOT NULL, -- 'security-event', 'policy-violation', 'control-failure', 'audit-finding'
  incident_description TEXT NOT NULL,
  severity risk_level NOT NULL,
  
  -- Impact
  impact_description TEXT,
  affected_systems TEXT[],
  affected_assets UUID[],
  
  -- Response
  response_actions TEXT[],
  remediation_required BOOLEAN DEFAULT false,
  remediation_plan TEXT,
  remediation_status VARCHAR(50) DEFAULT 'open' CHECK (remediation_status IN ('open', 'in-progress', 'completed', 'closed')),
  
  -- Exception review triggered
  exception_review_triggered BOOLEAN DEFAULT false,
  exception_revoked BOOLEAN DEFAULT false,
  
  -- Related records
  related_incident_case_id UUID,
  related_alert_id UUID,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_exceptions_tenant ON security_exceptions(tenant_id);
CREATE INDEX idx_security_exceptions_exception_id ON security_exceptions(exception_id);
CREATE INDEX idx_security_exceptions_type ON security_exceptions(exception_type);
CREATE INDEX idx_security_exceptions_status ON security_exceptions(status);
CREATE INDEX idx_security_exceptions_risk_level ON security_exceptions(risk_level);
CREATE INDEX idx_security_exceptions_requested_by ON security_exceptions(requested_by);
CREATE INDEX idx_security_exceptions_approved_by ON security_exceptions(approved_by);
CREATE INDEX idx_security_exceptions_effective_date ON security_exceptions(effective_date);
CREATE INDEX idx_security_exceptions_expiration_date ON security_exceptions(expiration_date);
CREATE INDEX idx_security_exceptions_next_monitoring ON security_exceptions(next_monitoring_date);
CREATE INDEX idx_security_exceptions_policy ON security_exceptions(policy_id);
CREATE INDEX idx_security_exceptions_control ON security_exceptions(control_id);
CREATE INDEX idx_security_exceptions_requirement ON security_exceptions(requirement_id);

CREATE INDEX idx_exception_reviews_tenant ON exception_reviews(tenant_id);
CREATE INDEX idx_exception_reviews_exception ON exception_reviews(exception_id);
CREATE INDEX idx_exception_reviews_date ON exception_reviews(review_date DESC);
CREATE INDEX idx_exception_reviews_reviewer ON exception_reviews(reviewer_id);
CREATE INDEX idx_exception_reviews_recommendation ON exception_reviews(recommendation);

CREATE INDEX idx_exception_extensions_tenant ON exception_extensions(tenant_id);
CREATE INDEX idx_exception_extensions_exception ON exception_extensions(exception_id);
CREATE INDEX idx_exception_extensions_status ON exception_extensions(status);
CREATE INDEX idx_exception_extensions_requested_by ON exception_extensions(requested_by);

CREATE INDEX idx_exception_incidents_tenant ON exception_incidents(tenant_id);
CREATE INDEX idx_exception_incidents_exception ON exception_incidents(exception_id);
CREATE INDEX idx_exception_incidents_date ON exception_incidents(incident_date DESC);
CREATE INDEX idx_exception_incidents_severity ON exception_incidents(severity);
CREATE INDEX idx_exception_incidents_remediation_status ON exception_incidents(remediation_status);

-- Enable Row Level Security
-- ALTER TABLE security_exceptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exception_reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exception_extensions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exception_incidents ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_exceptions
-- CREATE POLICY "security_exceptions_tenant_isolation" ON security_exceptions
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "security_exceptions_read_access" ON security_exceptions
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor') OR
--       requested_by = current_setting('app.user_id')::uuid
--     )
--   );

-- CREATE POLICY "security_exceptions_write_access" ON security_exceptions
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     requested_by = current_setting('app.user_id')::uuid
--   );

-- CREATE POLICY "security_exceptions_update_access" ON security_exceptions
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor') OR
--       (requested_by = current_setting('app.user_id')::uuid AND status = 'pending')
--     )
--   );

-- RLS policies for exception_reviews
-- CREATE POLICY "exception_reviews_tenant_isolation" ON exception_reviews
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "exception_reviews_read_access" ON exception_reviews
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- CREATE POLICY "exception_reviews_write_access" ON exception_reviews
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- Create function to auto-expire exceptions
CREATE OR REPLACE FUNCTION auto_expire_exceptions()
RETURNS void AS $$
BEGIN
  UPDATE security_exceptions
  SET
    status = 'expired'::exception_status,
    updated_at = now()
  WHERE
    status = 'active'::exception_status AND
    auto_expire = true AND
    expiration_date IS NOT NULL AND
    expiration_date < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to update exception monitoring dates
CREATE OR REPLACE FUNCTION update_exception_monitoring_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.requires_monitoring THEN
    NEW.next_monitoring_date := NEW.last_monitored + (NEW.monitoring_frequency_days || ' days')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update monitoring dates
CREATE TRIGGER trigger_update_exception_monitoring_date
BEFORE UPDATE ON security_exceptions
FOR EACH ROW
WHEN (OLD.last_monitored IS DISTINCT FROM NEW.last_monitored)
EXECUTE FUNCTION update_exception_monitoring_date();

-- Create function to log exception status changes
CREATE OR REPLACE FUNCTION log_exception_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.audit_log := NEW.audit_log || jsonb_build_object(
      'timestamp', now(),
      'action', 'status_change',
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_by', current_setting('app.user_id', true)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log status changes
CREATE TRIGGER trigger_log_exception_status_change
BEFORE UPDATE ON security_exceptions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_exception_status_change();

-- Create updated_at triggers
CREATE TRIGGER update_security_exceptions_updated_at 
  BEFORE UPDATE ON security_exceptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exception_reviews_updated_at 
  BEFORE UPDATE ON exception_reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exception_extensions_updated_at 
  BEFORE UPDATE ON exception_extensions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exception_incidents_updated_at 
  BEFORE UPDATE ON exception_incidents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE security_exceptions IS 'Security policy and control exceptions with approval workflow and expiration tracking';
COMMENT ON TABLE exception_reviews IS 'Periodic reviews of active security exceptions';
COMMENT ON TABLE exception_extensions IS 'Extension requests and approvals for security exceptions';
COMMENT ON TABLE exception_incidents IS 'Security incidents related to active exceptions';
COMMENT ON COLUMN security_exceptions.compensating_controls IS 'Alternative controls implemented to mitigate risk from the exception';
COMMENT ON COLUMN security_exceptions.residual_risk_level IS 'Risk level after compensating controls are applied';
COMMENT ON FUNCTION auto_expire_exceptions() IS 'Automatically expires exceptions that have passed their expiration date';
