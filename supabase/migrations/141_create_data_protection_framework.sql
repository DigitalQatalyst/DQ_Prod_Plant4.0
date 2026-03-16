-- Data protection framework for transmission data
-- Requirements: 7.1

-- Create data_protection_policies table for data classification and protection rules
CREATE TABLE data_protection_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy identification
  policy_name TEXT NOT NULL,
  policy_description TEXT,
  policy_version TEXT DEFAULT '1.0',
  
  -- Policy status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'inactive', 'archived'
  effective_date DATE,
  expiration_date DATE,
  
  -- Data classification
  data_classification TEXT NOT NULL, -- 'public', 'internal', 'confidential', 'restricted', 'critical'
  data_category TEXT NOT NULL, -- 'operational', 'customer', 'financial', 'technical', 'personal', 'grid_topology'
  
  -- Applicable scope
  applies_to_asset_types TEXT[], -- Transmission asset types
  applies_to_sites TEXT[], -- Site IDs or site types
  applies_to_zones TEXT[], -- Security zone IDs
  applies_to_data_types TEXT[], -- 'telemetry', 'configuration', 'logs', 'reports', 'credentials'
  
  -- Protection requirements
  encryption_required BOOLEAN DEFAULT false,
  encryption_algorithm TEXT, -- 'AES-256', 'RSA-2048', 'ChaCha20'
  encryption_at_rest BOOLEAN DEFAULT false,
  encryption_in_transit BOOLEAN DEFAULT false,
  
  -- Access controls
  access_control_required BOOLEAN DEFAULT true,
  minimum_role_required TEXT, -- 'operator', 'engineer', 'supervisor', 'administrator'
  mfa_required BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT false,
  
  -- Data handling
  retention_period_days INTEGER,
  backup_required BOOLEAN DEFAULT true,
  backup_frequency TEXT, -- 'hourly', 'daily', 'weekly', 'monthly'
  backup_retention_days INTEGER,
  
  -- Compliance requirements
  regulatory_requirements TEXT[], -- 'NERC-CIP', 'IEC-62443', 'GDPR', 'ISO-27001'
  compliance_notes TEXT,
  
  -- Data lifecycle
  archival_required BOOLEAN DEFAULT false,
  archival_after_days INTEGER,
  deletion_required BOOLEAN DEFAULT false,
  deletion_after_days INTEGER,
  secure_deletion_method TEXT, -- 'overwrite', 'crypto_erase', 'physical_destruction'
  
  -- Monitoring and auditing
  access_logging_required BOOLEAN DEFAULT true,
  change_logging_required BOOLEAN DEFAULT true,
  anomaly_detection_enabled BOOLEAN DEFAULT false,
  
  -- Data transfer restrictions
  export_allowed BOOLEAN DEFAULT true,
  export_approval_required BOOLEAN DEFAULT false,
  cross_border_transfer_allowed BOOLEAN DEFAULT false,
  allowed_destinations TEXT[],
  
  -- Incident response
  breach_notification_required BOOLEAN DEFAULT true,
  breach_notification_timeframe_hours INTEGER DEFAULT 24,
  
  -- Policy management
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,
  last_reviewed_date DATE,
  next_review_date DATE,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_policy_name UNIQUE (tenant_id, policy_name, policy_version),
  CONSTRAINT valid_dates CHECK (expiration_date IS NULL OR expiration_date > effective_date),
  CONSTRAINT valid_retention CHECK (retention_period_days IS NULL OR retention_period_days > 0),
  CONSTRAINT valid_archival CHECK (archival_after_days IS NULL OR archival_after_days > 0),
  CONSTRAINT valid_deletion CHECK (deletion_after_days IS NULL OR deletion_after_days > 0)
);

-- Create data_protection_measures table for tracking protection implementation
CREATE TABLE data_protection_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy reference
  policy_id UUID NOT NULL REFERENCES data_protection_policies(id) ON DELETE CASCADE,
  
  -- Measure identification
  measure_name TEXT NOT NULL,
  measure_type TEXT NOT NULL, -- 'encryption', 'access_control', 'backup', 'monitoring', 'deletion', 'anonymization'
  measure_description TEXT,
  
  -- Implementation details
  implementation_status TEXT DEFAULT 'planned', -- 'planned', 'in_progress', 'implemented', 'failed', 'disabled'
  implementation_date DATE,
  
  -- Technical details
  technology_used TEXT, -- Specific technology or tool implementing the measure
  configuration JSONB DEFAULT '{}'::JSONB,
  
  -- Effectiveness
  effectiveness_rating TEXT, -- 'effective', 'partially_effective', 'ineffective', 'not_tested'
  last_tested_date DATE,
  test_results TEXT,
  
  -- Coverage
  coverage_percentage INTEGER DEFAULT 0, -- Percentage of applicable data covered
  assets_covered TEXT[], -- Asset IDs covered by this measure
  data_types_covered TEXT[],
  
  -- Monitoring
  monitoring_enabled BOOLEAN DEFAULT false,
  last_monitoring_check TIMESTAMPTZ,
  monitoring_status TEXT, -- 'healthy', 'degraded', 'failed', 'unknown'
  
  -- Issues and remediation
  known_issues TEXT[],
  remediation_plan TEXT,
  remediation_due_date DATE,
  
  -- Responsible parties
  owner_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  technical_contact_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_coverage CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100)
);

-- Create data_classification_catalog table for data asset inventory
CREATE TABLE data_classification_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Data asset identification
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'database', 'file_system', 'api', 'report', 'backup', 'log'
  asset_location TEXT, -- Physical or logical location
  
  -- Classification
  data_classification TEXT NOT NULL, -- 'public', 'internal', 'confidential', 'restricted', 'critical'
  data_category TEXT NOT NULL,
  sensitivity_level INTEGER DEFAULT 1, -- 1-5 scale
  
  -- Content description
  description TEXT,
  data_elements TEXT[], -- Specific data elements contained
  contains_pii BOOLEAN DEFAULT false,
  contains_credentials BOOLEAN DEFAULT false,
  contains_grid_topology BOOLEAN DEFAULT false,
  
  -- Applicable policies
  policy_ids UUID[], -- References to data_protection_policies
  
  -- Ownership
  data_owner_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  data_steward_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  business_unit TEXT,
  
  -- Technical details
  system_id TEXT, -- System or application hosting the data
  database_name TEXT,
  table_schema TEXT,
  file_path TEXT,
  
  -- Volume and growth
  estimated_size_gb NUMERIC(10,2),
  estimated_record_count BIGINT,
  growth_rate_percent NUMERIC(5,2),
  
  -- Access patterns
  access_frequency TEXT, -- 'real_time', 'frequent', 'occasional', 'rare', 'archived'
  authorized_users_count INTEGER,
  authorized_systems TEXT[],
  
  -- Protection status
  encryption_status TEXT DEFAULT 'unencrypted', -- 'encrypted', 'partially_encrypted', 'unencrypted'
  backup_status TEXT DEFAULT 'not_backed_up', -- 'backed_up', 'partially_backed_up', 'not_backed_up'
  access_control_status TEXT DEFAULT 'unrestricted', -- 'restricted', 'partially_restricted', 'unrestricted'
  
  -- Compliance
  regulatory_requirements TEXT[],
  compliance_status TEXT DEFAULT 'unknown', -- 'compliant', 'non_compliant', 'partial', 'unknown'
  last_compliance_check DATE,
  
  -- Lifecycle
  creation_date DATE,
  last_modified_date DATE,
  retention_until DATE,
  scheduled_deletion_date DATE,
  
  -- Risk assessment
  risk_score INTEGER DEFAULT 0, -- 0-100
  risk_factors TEXT[],
  mitigation_measures TEXT[],
  
  -- Discovery
  discovery_method TEXT, -- 'manual', 'automated_scan', 'data_flow_analysis', 'user_reported'
  discovery_date DATE,
  last_verified_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_data_asset UNIQUE (tenant_id, asset_name, asset_type),
  CONSTRAINT valid_sensitivity CHECK (sensitivity_level >= 1 AND sensitivity_level <= 5),
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Create data_access_audit table for tracking data access
CREATE TABLE data_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Access event
  access_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Data asset accessed
  data_asset_id UUID REFERENCES data_classification_catalog(id) ON DELETE SET NULL,
  data_asset_name TEXT NOT NULL,
  data_classification TEXT,
  
  -- User information
  user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  user_role TEXT,
  
  -- Access details
  access_type TEXT NOT NULL, -- 'read', 'write', 'delete', 'export', 'copy', 'print'
  access_method TEXT, -- 'ui', 'api', 'direct_database', 'file_system', 'backup_restore'
  access_reason TEXT,
  
  -- Context
  source_ip TEXT,
  source_system TEXT,
  session_id TEXT,
  
  -- Authorization
  authorization_status TEXT NOT NULL, -- 'authorized', 'unauthorized', 'denied', 'override'
  authorization_method TEXT, -- 'rbac', 'policy', 'manual_approval', 'emergency_access'
  approver_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Data volume
  records_accessed INTEGER,
  data_size_bytes BIGINT,
  
  -- Anomaly detection
  is_anomalous BOOLEAN DEFAULT false,
  anomaly_score NUMERIC(5,2),
  anomaly_reasons TEXT[],
  
  -- Compliance
  policy_violations TEXT[],
  compliance_flags TEXT[],
  
  -- Response
  alert_generated BOOLEAN DEFAULT false,
  alert_id UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create data_protection_violations table for tracking policy violations
CREATE TABLE data_protection_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Violation identification
  violation_type TEXT NOT NULL, -- 'unauthorized_access', 'policy_breach', 'encryption_failure', 'retention_violation', 'export_violation'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  
  -- Affected resources
  policy_id UUID REFERENCES data_protection_policies(id) ON DELETE SET NULL,
  data_asset_id UUID REFERENCES data_classification_catalog(id) ON DELETE SET NULL,
  affected_data_classification TEXT,
  
  -- Violation details
  description TEXT NOT NULL,
  violation_timestamp TIMESTAMPTZ NOT NULL,
  detection_method TEXT, -- 'automated_monitoring', 'audit', 'user_report', 'incident_investigation'
  
  -- User involvement
  user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  user_action TEXT,
  
  -- Impact assessment
  impact_level TEXT, -- 'critical', 'high', 'medium', 'low', 'negligible'
  records_affected INTEGER,
  data_exposed BOOLEAN DEFAULT false,
  
  -- Response
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'remediated', 'closed', 'false_positive'
  assigned_to UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Remediation
  remediation_actions TEXT[],
  remediation_timestamp TIMESTAMPTZ,
  remediation_notes TEXT,
  
  -- Incident linkage
  incident_id UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
  alert_id UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
  
  -- Compliance reporting
  regulatory_notification_required BOOLEAN DEFAULT false,
  regulatory_notification_sent BOOLEAN DEFAULT false,
  notification_timestamp TIMESTAMPTZ,
  
  -- Lessons learned
  root_cause TEXT,
  preventive_measures TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create data_protection_metrics table for tracking protection effectiveness
CREATE TABLE data_protection_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Metric period
  metric_date DATE NOT NULL,
  metric_period TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
  
  -- Coverage metrics
  total_data_assets INTEGER DEFAULT 0,
  classified_assets INTEGER DEFAULT 0,
  protected_assets INTEGER DEFAULT 0,
  encryption_coverage_percent NUMERIC(5,2) DEFAULT 0,
  backup_coverage_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Access metrics
  total_access_events INTEGER DEFAULT 0,
  authorized_access_events INTEGER DEFAULT 0,
  unauthorized_access_attempts INTEGER DEFAULT 0,
  anomalous_access_events INTEGER DEFAULT 0,
  
  -- Violation metrics
  total_violations INTEGER DEFAULT 0,
  critical_violations INTEGER DEFAULT 0,
  high_violations INTEGER DEFAULT 0,
  medium_violations INTEGER DEFAULT 0,
  low_violations INTEGER DEFAULT 0,
  
  -- Policy metrics
  active_policies INTEGER DEFAULT 0,
  policy_compliance_rate NUMERIC(5,2) DEFAULT 0,
  policies_due_review INTEGER DEFAULT 0,
  
  -- Protection measure metrics
  implemented_measures INTEGER DEFAULT 0,
  effective_measures INTEGER DEFAULT 0,
  failed_measures INTEGER DEFAULT 0,
  measures_needing_attention INTEGER DEFAULT 0,
  
  -- Risk metrics
  high_risk_assets INTEGER DEFAULT 0,
  medium_risk_assets INTEGER DEFAULT 0,
  low_risk_assets INTEGER DEFAULT 0,
  average_risk_score NUMERIC(5,2) DEFAULT 0,
  
  -- Compliance metrics
  compliant_assets INTEGER DEFAULT 0,
  non_compliant_assets INTEGER DEFAULT 0,
  compliance_rate NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_metric_date UNIQUE (tenant_id, metric_date, metric_period)
);

-- Create indexes for performance
CREATE INDEX idx_data_protection_policies_tenant ON data_protection_policies(tenant_id);
CREATE INDEX idx_data_protection_policies_status ON data_protection_policies(status);
CREATE INDEX idx_data_protection_policies_classification ON data_protection_policies(data_classification);
CREATE INDEX idx_data_protection_policies_effective_date ON data_protection_policies(effective_date);

CREATE INDEX idx_data_protection_measures_tenant ON data_protection_measures(tenant_id);
CREATE INDEX idx_data_protection_measures_policy ON data_protection_measures(policy_id);
CREATE INDEX idx_data_protection_measures_status ON data_protection_measures(implementation_status);
CREATE INDEX idx_data_protection_measures_effectiveness ON data_protection_measures(effectiveness_rating);

CREATE INDEX idx_data_classification_catalog_tenant ON data_classification_catalog(tenant_id);
CREATE INDEX idx_data_classification_catalog_classification ON data_classification_catalog(data_classification);
CREATE INDEX idx_data_classification_catalog_category ON data_classification_catalog(data_category);
CREATE INDEX idx_data_classification_catalog_owner ON data_classification_catalog(data_owner_id);
CREATE INDEX idx_data_classification_catalog_risk ON data_classification_catalog(risk_score DESC);

CREATE INDEX idx_data_access_audit_tenant ON data_access_audit(tenant_id);
CREATE INDEX idx_data_access_audit_timestamp ON data_access_audit(access_timestamp DESC);
CREATE INDEX idx_data_access_audit_user ON data_access_audit(user_id);
CREATE INDEX idx_data_access_audit_asset ON data_access_audit(data_asset_id);
CREATE INDEX idx_data_access_audit_anomalous ON data_access_audit(is_anomalous) WHERE is_anomalous = true;
CREATE INDEX idx_data_access_audit_unauthorized ON data_access_audit(authorization_status) WHERE authorization_status = 'unauthorized';

CREATE INDEX idx_data_protection_violations_tenant ON data_protection_violations(tenant_id);
CREATE INDEX idx_data_protection_violations_severity ON data_protection_violations(severity);
CREATE INDEX idx_data_protection_violations_status ON data_protection_violations(status);
CREATE INDEX idx_data_protection_violations_timestamp ON data_protection_violations(violation_timestamp DESC);
CREATE INDEX idx_data_protection_violations_policy ON data_protection_violations(policy_id);

CREATE INDEX idx_data_protection_metrics_tenant ON data_protection_metrics(tenant_id);
CREATE INDEX idx_data_protection_metrics_date ON data_protection_metrics(metric_date DESC);

-- Create updated_at triggers
CREATE TRIGGER update_data_protection_policies_updated_at 
  BEFORE UPDATE ON data_protection_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_protection_measures_updated_at 
  BEFORE UPDATE ON data_protection_measures 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_classification_catalog_updated_at 
  BEFORE UPDATE ON data_classification_catalog 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_protection_violations_updated_at 
  BEFORE UPDATE ON data_protection_violations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for calculating data protection metrics
CREATE OR REPLACE FUNCTION calculate_data_protection_metrics(p_tenant_id UUID, p_metric_date DATE)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
  v_total_assets INTEGER;
  v_classified_assets INTEGER;
  v_protected_assets INTEGER;
  v_encrypted_assets INTEGER;
  v_backed_up_assets INTEGER;
BEGIN
  -- Count data assets
  SELECT COUNT(*) INTO v_total_assets
  FROM data_classification_catalog
  WHERE tenant_id = p_tenant_id;
  
  SELECT COUNT(*) INTO v_classified_assets
  FROM data_classification_catalog
  WHERE tenant_id = p_tenant_id
    AND data_classification IS NOT NULL;
  
  SELECT COUNT(*) INTO v_encrypted_assets
  FROM data_classification_catalog
  WHERE tenant_id = p_tenant_id
    AND encryption_status = 'encrypted';
  
  SELECT COUNT(*) INTO v_backed_up_assets
  FROM data_classification_catalog
  WHERE tenant_id = p_tenant_id
    AND backup_status = 'backed_up';
  
  -- Insert or update metrics
  INSERT INTO data_protection_metrics (
    tenant_id,
    metric_date,
    total_data_assets,
    classified_assets,
    encryption_coverage_percent,
    backup_coverage_percent
  ) VALUES (
    p_tenant_id,
    p_metric_date,
    v_total_assets,
    v_classified_assets,
    CASE WHEN v_total_assets > 0 THEN (v_encrypted_assets::NUMERIC / v_total_assets * 100) ELSE 0 END,
    CASE WHEN v_total_assets > 0 THEN (v_backed_up_assets::NUMERIC / v_total_assets * 100) ELSE 0 END
  )
  ON CONFLICT (tenant_id, metric_date, metric_period)
  DO UPDATE SET
    total_data_assets = EXCLUDED.total_data_assets,
    classified_assets = EXCLUDED.classified_assets,
    encryption_coverage_percent = EXCLUDED.encryption_coverage_percent,
    backup_coverage_percent = EXCLUDED.backup_coverage_percent
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for logging data access
CREATE OR REPLACE FUNCTION log_data_access(
  p_tenant_id UUID,
  p_data_asset_id UUID,
  p_user_id UUID,
  p_access_type TEXT,
  p_authorization_status TEXT
)
RETURNS UUID AS $$
DECLARE
  access_log_id UUID;
  asset_record RECORD;
  user_record RECORD;
BEGIN
  -- Get asset details
  SELECT * INTO asset_record
  FROM data_classification_catalog
  WHERE id = p_data_asset_id;
  
  -- Get user details
  SELECT * INTO user_record
  FROM security_users
  WHERE id = p_user_id;
  
  -- Insert access log
  INSERT INTO data_access_audit (
    tenant_id,
    data_asset_id,
    data_asset_name,
    data_classification,
    user_id,
    username,
    user_role,
    access_type,
    authorization_status
  ) VALUES (
    p_tenant_id,
    p_data_asset_id,
    asset_record.asset_name,
    asset_record.data_classification,
    p_user_id,
    user_record.username,
    user_record.role,
    p_access_type,
    p_authorization_status
  ) RETURNING id INTO access_log_id;
  
  -- Check for policy violations if unauthorized
  IF p_authorization_status = 'unauthorized' THEN
    INSERT INTO data_protection_violations (
      tenant_id,
      violation_type,
      severity,
      data_asset_id,
      affected_data_classification,
      description,
      violation_timestamp,
      detection_method,
      user_id
    ) VALUES (
      p_tenant_id,
      'unauthorized_access',
      CASE 
        WHEN asset_record.data_classification IN ('critical', 'restricted') THEN 'critical'
        WHEN asset_record.data_classification = 'confidential' THEN 'high'
        ELSE 'medium'
      END,
      p_data_asset_id,
      asset_record.data_classification,
      'Unauthorized access attempt to ' || asset_record.asset_name,
      now(),
      'automated_monitoring',
      p_user_id
    );
  END IF;
  
  RETURN access_log_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
-- ALTER TABLE data_protection_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_protection_measures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_classification_catalog ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_protection_violations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_protection_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_protection_policies_tenant_isolation" ON data_protection_policies
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "data_protection_measures_tenant_isolation" ON data_protection_measures
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "data_classification_catalog_tenant_isolation" ON data_classification_catalog
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "data_access_audit_tenant_isolation" ON data_access_audit
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "data_protection_violations_tenant_isolation" ON data_protection_violations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "data_protection_metrics_tenant_isolation" ON data_protection_metrics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
