-- Create access policies and permissions for zone-based access control
-- Requirements: 2.2, 2.3

-- Create enum for policy types
CREATE TYPE policy_type AS ENUM (
  'zone-based',
  'role-based',
  'asset-based',
  'time-based'
);

-- Create enum for policy status
CREATE TYPE policy_status AS ENUM (
  'active',
  'inactive',
  'draft'
);

-- Create enum for access actions
CREATE TYPE access_action AS ENUM (
  'read',
  'write',
  'execute',
  'delete',
  'admin'
);

-- Create enum for access effect
CREATE TYPE access_effect AS ENUM (
  'allow',
  'deny'
);

-- Create access_policies table
CREATE TABLE access_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  policy_type policy_type NOT NULL DEFAULT 'role-based',
  status policy_status NOT NULL DEFAULT 'draft',
  priority INTEGER DEFAULT 100, -- Lower number = higher priority
  applies_to TEXT[] DEFAULT '{}', -- user IDs, role names, or zone IDs
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_policy_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 1000)
);

-- Create access_rules table (rules within policies)
CREATE TABLE access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES access_policies(id) ON DELETE CASCADE,
  rule_order INTEGER NOT NULL DEFAULT 1,
  
  -- Rule conditions
  resource_type TEXT, -- 'zone', 'asset', 'system', 'data'
  resource_id TEXT,   -- specific resource identifier
  resource_pattern TEXT, -- pattern matching for resources
  
  -- Access control
  actions access_action[] DEFAULT '{}',
  effect access_effect NOT NULL DEFAULT 'allow',
  
  -- Time-based conditions
  time_start TIME,
  time_end TIME,
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  
  -- Zone-based conditions (for transmission networks)
  zone_types TEXT[], -- 'substation-control', 'protection-systems', etc.
  security_levels INTEGER[], -- IEC 62443 security levels 1-4
  
  -- Additional conditions
  conditions JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_rule_order CHECK (rule_order > 0),
  CONSTRAINT valid_time_range CHECK (
    (time_start IS NULL AND time_end IS NULL) OR 
    (time_start IS NOT NULL AND time_end IS NOT NULL)
  ),
  CONSTRAINT valid_days_of_week CHECK (
    days_of_week IS NULL OR 
    array_length(days_of_week, 1) > 0
  ),
  CONSTRAINT valid_security_levels CHECK (
    security_levels IS NULL OR
    array_length(security_levels, 1) > 0
  )
);

-- Create privileged_access_sessions table for critical asset access
CREATE TABLE privileged_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  
  -- Session details
  session_type TEXT NOT NULL, -- 'emergency', 'maintenance', 'administrative'
  target_resource_type TEXT NOT NULL, -- 'protection-relay', 'scada-system', 'breaker-control'
  target_resource_id TEXT NOT NULL,
  
  -- Access control
  requested_actions TEXT[] DEFAULT '{}',
  approved_actions TEXT[] DEFAULT '{}',
  
  -- Approval workflow
  requested_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  request_reason TEXT NOT NULL,
  approval_reason TEXT,
  
  -- Session lifecycle
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'active', 'completed', 'denied', 'expired'
  requested_start TIMESTAMPTZ NOT NULL,
  requested_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Emergency access
  is_emergency BOOLEAN DEFAULT false,
  emergency_justification TEXT,
  
  -- Audit trail
  session_log JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_session_time CHECK (requested_end > requested_start),
  CONSTRAINT valid_actual_time CHECK (
    actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start
  ),
  CONSTRAINT emergency_requires_justification CHECK (
    NOT is_emergency OR emergency_justification IS NOT NULL
  )
);

-- Create indexes for performance optimization
CREATE INDEX idx_access_policies_tenant ON access_policies(tenant_id);
CREATE INDEX idx_access_policies_status ON access_policies(status);
CREATE INDEX idx_access_policies_type ON access_policies(policy_type);
CREATE INDEX idx_access_policies_priority ON access_policies(priority);

CREATE INDEX idx_access_rules_tenant ON access_rules(tenant_id);
CREATE INDEX idx_access_rules_policy ON access_rules(policy_id);
CREATE INDEX idx_access_rules_order ON access_rules(policy_id, rule_order);
CREATE INDEX idx_access_rules_resource ON access_rules(resource_type, resource_id);

CREATE INDEX idx_privileged_sessions_tenant ON privileged_access_sessions(tenant_id);
CREATE INDEX idx_privileged_sessions_user ON privileged_access_sessions(user_id);
CREATE INDEX idx_privileged_sessions_status ON privileged_access_sessions(status);
CREATE INDEX idx_privileged_sessions_resource ON privileged_access_sessions(target_resource_type, target_resource_id);
CREATE INDEX idx_privileged_sessions_time ON privileged_access_sessions(requested_start, requested_end);

-- Enable Row Level Security
-- ALTER TABLE access_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE privileged_access_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_policies
-- CREATE POLICY "access_policies_tenant_isolation" ON access_policies
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "access_policies_read_access" ON access_policies
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- CREATE POLICY "access_policies_write_access" ON access_policies
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator')
--   );

-- CREATE POLICY "access_policies_update_access" ON access_policies
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator')
--   );

-- RLS policies for access_rules
-- CREATE POLICY "access_rules_tenant_isolation" ON access_rules
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "access_rules_read_access" ON access_rules
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- CREATE POLICY "access_rules_write_access" ON access_rules
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator')
--   );

-- RLS policies for privileged_access_sessions
-- CREATE POLICY "privileged_sessions_tenant_isolation" ON privileged_access_sessions
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "privileged_sessions_read_access" ON privileged_access_sessions
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor') OR
--       user_id = current_setting('app.user_id')::uuid OR
--       requested_by = current_setting('app.user_id')::uuid
--     )
--   );

-- CREATE POLICY "privileged_sessions_request_access" ON privileged_access_sessions
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     requested_by = current_setting('app.user_id')::uuid
--   );

-- CREATE POLICY "privileged_sessions_approval_access" ON privileged_access_sessions
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- Create updated_at triggers
CREATE TRIGGER update_access_policies_updated_at 
  BEFORE UPDATE ON access_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_rules_updated_at 
  BEFORE UPDATE ON access_rules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privileged_sessions_updated_at 
  BEFORE UPDATE ON privileged_access_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();