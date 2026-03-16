-- Create comprehensive security audit logging system
-- Requirements: 2.5, 6.1

-- Create enum for audit event types
CREATE TYPE audit_event_type AS ENUM (
  'authentication',
  'authorization',
  'data_access',
  'data_modification',
  'configuration_change',
  'system_access',
  'privilege_escalation',
  'security_violation',
  'policy_change',
  'certificate_operation',
  'key_operation',
  'session_management',
  'alert_generation',
  'incident_creation',
  'compliance_check'
);

-- Create enum for audit severity levels
CREATE TYPE audit_severity AS ENUM (
  'info',
  'warning',
  'high',
  'critical'
);

-- Create enum for audit outcomes
CREATE TYPE audit_outcome AS ENUM (
  'success',
  'failure',
  'partial',
  'denied',
  'error'
);

-- Create security_audit_log table
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Event identification
  event_type audit_event_type NOT NULL,
  event_category TEXT NOT NULL, -- 'identity', 'access', 'data', 'system', 'compliance'
  event_name TEXT NOT NULL,
  event_description TEXT,
  
  -- Event outcome
  outcome audit_outcome NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'info',
  
  -- Actor information
  user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  username TEXT,
  user_role TEXT,
  session_id TEXT,
  
  -- Source information
  source_ip INET,
  source_hostname TEXT,
  user_agent TEXT,
  
  -- Target/Resource information
  target_type TEXT, -- 'user', 'policy', 'asset', 'zone', 'certificate', etc.
  target_id TEXT,
  target_name TEXT,
  
  -- Transmission-specific context
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  zone_id TEXT,
  protocol TEXT, -- IEC61850, DNP3, etc.
  system_component TEXT, -- 'scada', 'protection-relay', 'rtu', etc.
  
  -- Event details
  action_performed TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  additional_data JSONB DEFAULT '{}',
  
  -- Risk and compliance
  risk_score INTEGER, -- 0-100
  compliance_impact TEXT[],
  requires_investigation BOOLEAN DEFAULT false,
  
  -- Timing
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_timestamp TIMESTAMPTZ DEFAULT now(),
  
  -- Correlation
  correlation_id TEXT, -- For grouping related events
  parent_event_id UUID REFERENCES security_audit_log(id) ON DELETE SET NULL,
  
  -- Retention and archival
  retention_category TEXT DEFAULT 'standard', -- 'standard', 'extended', 'permanent'
  archived BOOLEAN DEFAULT false,
  archive_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_risk_score CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
  CONSTRAINT valid_event_timestamp CHECK (event_timestamp <= now() + INTERVAL '1 hour')
);

-- Create audit_retention_policies table
CREATE TABLE audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Retention rules
  event_types audit_event_type[],
  event_categories TEXT[],
  severity_levels audit_severity[],
  
  -- Retention periods (in days)
  retention_period_days INTEGER NOT NULL,
  archive_after_days INTEGER,
  
  -- Compliance requirements
  compliance_standards TEXT[], -- 'IEC62443', 'NERC-CIP', etc.
  legal_hold BOOLEAN DEFAULT false,
  
  -- Policy status
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- Lower number = higher priority
  
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_retention_policy_name UNIQUE (tenant_id, name),
  CONSTRAINT valid_retention_period CHECK (retention_period_days > 0),
  CONSTRAINT valid_archive_period CHECK (
    archive_after_days IS NULL OR 
    (archive_after_days > 0 AND archive_after_days < retention_period_days)
  ),
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 1000)
);

-- Create audit_search_queries table for saved searches
CREATE TABLE audit_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Query metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Search criteria
  query_filters JSONB NOT NULL,
  time_range_hours INTEGER,
  
  -- User and sharing
  created_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  shared_with_roles transmission_role[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_search_query_name UNIQUE (tenant_id, created_by, name),
  CONSTRAINT valid_usage_count_search CHECK (usage_count >= 0)
);

-- Create audit_export_requests table for audit data exports
CREATE TABLE audit_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Export details
  export_name TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'json', 'pdf'
  
  -- Export criteria
  date_from TIMESTAMPTZ NOT NULL,
  date_to TIMESTAMPTZ NOT NULL,
  filters JSONB DEFAULT '{}',
  
  -- Request details
  requested_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  request_reason TEXT NOT NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Export status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'failed', 'denied'
  file_path TEXT,
  file_size_bytes BIGINT,
  record_count INTEGER,
  
  -- Security
  encryption_key_id TEXT,
  access_expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_export_date_range CHECK (date_to > date_from),
  CONSTRAINT valid_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT valid_record_count CHECK (record_count IS NULL OR record_count >= 0),
  CONSTRAINT valid_download_count CHECK (download_count >= 0)
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_audit_log_tenant ON security_audit_log(tenant_id);
CREATE INDEX idx_security_audit_log_timestamp ON security_audit_log(event_timestamp DESC);
CREATE INDEX idx_security_audit_log_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX idx_security_audit_log_outcome ON security_audit_log(outcome);
CREATE INDEX idx_security_audit_log_target ON security_audit_log(target_type, target_id);
CREATE INDEX idx_security_audit_log_asset ON security_audit_log(asset_id);
CREATE INDEX idx_security_audit_log_correlation ON security_audit_log(correlation_id);
CREATE INDEX idx_security_audit_log_investigation ON security_audit_log(requires_investigation) WHERE requires_investigation = true;
CREATE INDEX idx_security_audit_log_archived ON security_audit_log(archived, retention_category);

-- Composite indexes for common queries
CREATE INDEX idx_audit_log_tenant_timestamp ON security_audit_log(tenant_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_user_timestamp ON security_audit_log(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_type_severity ON security_audit_log(event_type, severity);

CREATE INDEX idx_audit_retention_policies_tenant ON audit_retention_policies(tenant_id);
CREATE INDEX idx_audit_retention_policies_active ON audit_retention_policies(active, priority);

CREATE INDEX idx_audit_search_queries_tenant ON audit_search_queries(tenant_id);
CREATE INDEX idx_audit_search_queries_user ON audit_search_queries(created_by);

CREATE INDEX idx_audit_export_requests_tenant ON audit_export_requests(tenant_id);
CREATE INDEX idx_audit_export_requests_user ON audit_export_requests(requested_by);
CREATE INDEX idx_audit_export_requests_status ON audit_export_requests(status);

-- Enable Row Level Security
-- ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_search_queries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_audit_log
-- CREATE POLICY "security_audit_log_tenant_isolation" ON security_audit_log
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "security_audit_log_read_access" ON security_audit_log
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor') OR
--       (current_setting('app.user_role') = 'engineer' AND severity IN ('warning', 'high', 'critical')) OR
--       (user_id = current_setting('app.user_id')::uuid)
--     )
--   );

-- Audit logs are append-only - no UPDATE or DELETE policies for data integrity
-- CREATE POLICY "security_audit_log_insert_only" ON security_audit_log
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- RLS policies for audit_retention_policies
-- CREATE POLICY "audit_retention_policies_tenant_isolation" ON audit_retention_policies
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "audit_retention_policies_read_access" ON audit_retention_policies
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- CREATE POLICY "audit_retention_policies_write_access" ON audit_retention_policies
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') = 'administrator'
--   );

-- RLS policies for audit_search_queries
-- CREATE POLICY "audit_search_queries_tenant_isolation" ON audit_search_queries
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "audit_search_queries_read_access" ON audit_search_queries
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       created_by = current_setting('app.user_id')::uuid OR
--       is_public = true OR
--       current_setting('app.user_role')::transmission_role = ANY(shared_with_roles) OR
--       current_setting('app.user_role') IN ('administrator', 'supervisor')
--     )
--   );

-- CREATE POLICY "audit_search_queries_owner_write" ON audit_search_queries
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     created_by = current_setting('app.user_id')::uuid
--   );

-- RLS policies for audit_export_requests
-- CREATE POLICY "audit_export_requests_tenant_isolation" ON audit_export_requests
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "audit_export_requests_read_access" ON audit_export_requests
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       requested_by = current_setting('app.user_id')::uuid OR
--       current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--     )
--   );

-- CREATE POLICY "audit_export_requests_create_access" ON audit_export_requests
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     requested_by = current_setting('app.user_id')::uuid
--   );

-- Create updated_at triggers
CREATE TRIGGER update_audit_retention_policies_updated_at 
  BEFORE UPDATE ON audit_retention_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_search_queries_updated_at 
  BEFORE UPDATE ON audit_search_queries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_export_requests_updated_at 
  BEFORE UPDATE ON audit_export_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for automatic audit log cleanup based on retention policies
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  policy_record RECORD;
BEGIN
  -- Process each active retention policy
  FOR policy_record IN 
    SELECT * FROM audit_retention_policies 
    WHERE active = true 
    ORDER BY priority ASC
  LOOP
    -- Archive old records if archive period is set
    IF policy_record.archive_after_days IS NOT NULL THEN
      UPDATE security_audit_log 
      SET archived = true, archive_date = now()
      WHERE tenant_id = policy_record.tenant_id
        AND archived = false
        AND event_timestamp < (now() - (policy_record.archive_after_days || ' days')::INTERVAL)
        AND (
          policy_record.event_types IS NULL OR 
          event_type = ANY(policy_record.event_types)
        )
        AND (
          policy_record.event_categories IS NULL OR 
          event_category = ANY(policy_record.event_categories)
        )
        AND (
          policy_record.severity_levels IS NULL OR 
          severity = ANY(policy_record.severity_levels)
        );
    END IF;
    
    -- Delete records past retention period (only if not on legal hold)
    IF NOT policy_record.legal_hold THEN
      WITH deleted AS (
        DELETE FROM security_audit_log 
        WHERE tenant_id = policy_record.tenant_id
          AND event_timestamp < (now() - (policy_record.retention_period_days || ' days')::INTERVAL)
          AND (
            policy_record.event_types IS NULL OR 
            event_type = ANY(policy_record.event_types)
          )
          AND (
            policy_record.event_categories IS NULL OR 
            event_category = ANY(policy_record.event_categories)
          )
          AND (
            policy_record.severity_levels IS NULL OR 
            severity = ANY(policy_record.severity_levels)
          )
        RETURNING 1
      )
      SELECT count(*) INTO deleted_count FROM deleted;
    END IF;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;