-- Encryption key management for transmission data protection
-- Requirements: 7.2

-- Create encryption_keys table for key lifecycle management
CREATE TABLE encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Key identification
  key_name TEXT NOT NULL,
  key_alias TEXT, -- User-friendly alias
  key_id TEXT NOT NULL, -- External key management system ID
  key_type TEXT NOT NULL, -- 'symmetric', 'asymmetric', 'master', 'data_encryption', 'key_encryption'
  
  -- Key algorithm
  algorithm TEXT NOT NULL, -- 'AES-256', 'RSA-2048', 'RSA-4096', 'ChaCha20', 'ECC-P256'
  key_size_bits INTEGER NOT NULL,
  
  -- Key purpose
  purpose TEXT NOT NULL, -- 'data_encryption', 'backup_encryption', 'communication', 'signing', 'authentication'
  usage_scope TEXT[], -- 'telemetry', 'configuration', 'logs', 'credentials', 'grid_topology'
  
  -- Key status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'rotating', 'deprecated', 'compromised', 'destroyed'
  
  -- Key lifecycle
  creation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  activation_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  rotation_date TIMESTAMPTZ,
  destruction_date TIMESTAMPTZ,
  
  -- Rotation policy
  rotation_required BOOLEAN DEFAULT true,
  rotation_period_days INTEGER DEFAULT 90,
  next_rotation_date DATE,
  auto_rotation_enabled BOOLEAN DEFAULT false,
  
  -- Key storage
  storage_location TEXT NOT NULL, -- 'hsm', 'kms', 'vault', 'local_encrypted'
  storage_provider TEXT, -- 'aws_kms', 'azure_key_vault', 'hashicorp_vault', 'thales_hsm'
  storage_region TEXT,
  
  -- Key material (encrypted reference, never plaintext)
  key_material_reference TEXT NOT NULL, -- Reference to external key store
  key_material_encrypted BOOLEAN DEFAULT true,
  
  -- Access control
  access_policy_id UUID REFERENCES access_policies(id) ON DELETE SET NULL,
  minimum_role_required TEXT DEFAULT 'administrator',
  requires_approval BOOLEAN DEFAULT true,
  
  -- Usage tracking
  usage_count BIGINT DEFAULT 0,
  last_used_timestamp TIMESTAMPTZ,
  last_used_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Associated resources
  protected_assets TEXT[], -- Asset IDs using this key
  protected_data_types TEXT[],
  
  -- Compliance
  compliance_requirements TEXT[], -- 'NERC-CIP', 'IEC-62443', 'FIPS-140-2', 'FIPS-140-3'
  fips_validated BOOLEAN DEFAULT false,
  certification_level TEXT, -- 'FIPS-140-2-Level-2', 'Common-Criteria-EAL4'
  
  -- Backup and recovery
  backup_key_exists BOOLEAN DEFAULT false,
  backup_key_location TEXT,
  escrow_enabled BOOLEAN DEFAULT false,
  escrow_location TEXT,
  
  -- Audit and monitoring
  audit_logging_enabled BOOLEAN DEFAULT true,
  monitoring_enabled BOOLEAN DEFAULT true,
  alert_on_usage BOOLEAN DEFAULT false,
  
  -- Key hierarchy
  parent_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
  is_master_key BOOLEAN DEFAULT false,
  derived_keys_count INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  owner_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  technical_contact_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Security events
  compromise_suspected BOOLEAN DEFAULT false,
  compromise_date TIMESTAMPTZ,
  compromise_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_key_name UNIQUE (tenant_id, key_name),
  CONSTRAINT unique_key_id UNIQUE (tenant_id, key_id),
  CONSTRAINT valid_key_size CHECK (key_size_bits > 0),
  CONSTRAINT valid_rotation_period CHECK (rotation_period_days IS NULL OR rotation_period_days > 0),
  CONSTRAINT valid_lifecycle_dates CHECK (
    (expiration_date IS NULL OR expiration_date > activation_date) AND
    (destruction_date IS NULL OR destruction_date >= expiration_date)
  )
);

-- Create key_rotation_history table for tracking key rotations
CREATE TABLE key_rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Key reference
  key_id UUID NOT NULL REFERENCES encryption_keys(id) ON DELETE CASCADE,
  
  -- Rotation details
  rotation_type TEXT NOT NULL, -- 'scheduled', 'manual', 'emergency', 'compromise_response', 'policy_change'
  rotation_reason TEXT,
  
  -- Old key details
  old_key_id TEXT NOT NULL,
  old_key_status TEXT,
  old_key_deactivated_at TIMESTAMPTZ,
  
  -- New key details
  new_key_id TEXT NOT NULL,
  new_key_activation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Rotation process
  rotation_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotation_end TIMESTAMPTZ,
  rotation_duration_seconds INTEGER,
  rotation_status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'rolled_back'
  
  -- Impact assessment
  affected_assets_count INTEGER DEFAULT 0,
  affected_data_volume_gb NUMERIC(10,2),
  re_encryption_required BOOLEAN DEFAULT true,
  re_encryption_completed BOOLEAN DEFAULT false,
  
  -- Execution details
  initiated_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  executed_by_system TEXT, -- System or service that performed rotation
  
  -- Validation
  validation_performed BOOLEAN DEFAULT false,
  validation_passed BOOLEAN DEFAULT false,
  validation_notes TEXT,
  
  -- Rollback capability
  rollback_possible BOOLEAN DEFAULT true,
  rollback_window_hours INTEGER DEFAULT 24,
  rollback_deadline TIMESTAMPTZ,
  
  -- Issues and resolution
  issues_encountered TEXT[],
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create key_usage_audit table for tracking key operations
CREATE TABLE key_usage_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Key reference
  key_id UUID NOT NULL REFERENCES encryption_keys(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  
  -- Usage event
  usage_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  operation_type TEXT NOT NULL, -- 'encrypt', 'decrypt', 'sign', 'verify', 'generate', 'export', 'import', 'rotate', 'destroy'
  
  -- User context
  user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  username TEXT,
  user_role TEXT,
  
  -- System context
  system_id TEXT,
  application_name TEXT,
  service_name TEXT,
  
  -- Operation details
  operation_status TEXT NOT NULL, -- 'success', 'failed', 'denied', 'partial'
  operation_duration_ms INTEGER,
  
  -- Data context
  data_type TEXT, -- Type of data being encrypted/decrypted
  data_size_bytes BIGINT,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  -- Authorization
  authorization_method TEXT, -- 'rbac', 'policy', 'manual_approval', 'api_key'
  authorization_status TEXT, -- 'authorized', 'unauthorized', 'override'
  approver_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Network context
  source_ip TEXT,
  source_location TEXT,
  
  -- Anomaly detection
  is_anomalous BOOLEAN DEFAULT false,
  anomaly_score NUMERIC(5,2),
  anomaly_reasons TEXT[],
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  
  -- Alert generation
  alert_generated BOOLEAN DEFAULT false,
  alert_id UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create key_access_requests table for approval workflow
CREATE TABLE key_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request details
  request_type TEXT NOT NULL, -- 'access', 'export', 'rotation', 'destruction', 'recovery'
  priority TEXT DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
  
  -- Key reference
  key_id UUID NOT NULL REFERENCES encryption_keys(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  
  -- Requester
  requester_id UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  requester_role TEXT,
  request_reason TEXT NOT NULL,
  business_justification TEXT,
  
  -- Request timing
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  required_by_date TIMESTAMPTZ,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approver_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_timestamp TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Access grant
  access_granted BOOLEAN DEFAULT false,
  access_start TIMESTAMPTZ,
  access_end TIMESTAMPTZ,
  access_duration_hours INTEGER,
  
  -- Usage tracking
  access_used BOOLEAN DEFAULT false,
  usage_timestamp TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Audit trail
  audit_log_entries TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create key_compliance_checks table for compliance validation
CREATE TABLE key_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Check identification
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'rotation_compliance', 'strength_validation', 'usage_audit', 'access_control', 'storage_security'
  
  -- Key reference
  key_id UUID REFERENCES encryption_keys(id) ON DELETE CASCADE,
  
  -- Check execution
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_status TEXT NOT NULL, -- 'passed', 'failed', 'warning', 'not_applicable'
  
  -- Check results
  compliance_score INTEGER, -- 0-100
  findings TEXT[],
  violations TEXT[],
  recommendations TEXT[],
  
  -- Compliance standards
  standard_reference TEXT, -- 'NERC-CIP-007', 'IEC-62443-3-3', 'NIST-SP-800-57'
  requirement_reference TEXT,
  
  -- Remediation
  remediation_required BOOLEAN DEFAULT false,
  remediation_priority TEXT, -- 'critical', 'high', 'medium', 'low'
  remediation_deadline DATE,
  remediation_status TEXT, -- 'pending', 'in_progress', 'completed', 'deferred'
  
  -- Automated checks
  automated_check BOOLEAN DEFAULT true,
  check_frequency TEXT, -- 'continuous', 'daily', 'weekly', 'monthly'
  next_check_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create key_backup_records table for key backup tracking
CREATE TABLE key_backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Backup identification
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL, -- 'full', 'incremental', 'differential', 'escrow'
  
  -- Key reference
  key_id UUID NOT NULL REFERENCES encryption_keys(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  
  -- Backup details
  backup_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  backup_location TEXT NOT NULL,
  backup_storage_provider TEXT,
  
  -- Backup encryption
  backup_encrypted BOOLEAN DEFAULT true,
  backup_encryption_algorithm TEXT,
  backup_encryption_key_id TEXT,
  
  -- Backup integrity
  backup_hash TEXT, -- SHA-256 hash
  integrity_verified BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMPTZ,
  
  -- Backup size
  backup_size_bytes BIGINT,
  
  -- Retention
  retention_period_days INTEGER DEFAULT 2555, -- 7 years default
  retention_until DATE,
  deletion_scheduled BOOLEAN DEFAULT false,
  scheduled_deletion_date DATE,
  
  -- Recovery testing
  recovery_tested BOOLEAN DEFAULT false,
  last_recovery_test TIMESTAMPTZ,
  recovery_test_passed BOOLEAN,
  
  -- Access control
  access_restricted BOOLEAN DEFAULT true,
  authorized_users UUID[],
  requires_multi_party_access BOOLEAN DEFAULT true,
  
  -- Compliance
  compliance_requirements TEXT[],
  legal_hold BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_backup_name UNIQUE (tenant_id, backup_name)
);

-- Create indexes for performance
CREATE INDEX idx_encryption_keys_tenant ON encryption_keys(tenant_id);
CREATE INDEX idx_encryption_keys_status ON encryption_keys(status);
CREATE INDEX idx_encryption_keys_type ON encryption_keys(key_type);
CREATE INDEX idx_encryption_keys_expiration ON encryption_keys(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_encryption_keys_rotation ON encryption_keys(next_rotation_date) WHERE next_rotation_date IS NOT NULL;
CREATE INDEX idx_encryption_keys_compromised ON encryption_keys(compromise_suspected) WHERE compromise_suspected = true;

CREATE INDEX idx_key_rotation_history_tenant ON key_rotation_history(tenant_id);
CREATE INDEX idx_key_rotation_history_key ON key_rotation_history(key_id);
CREATE INDEX idx_key_rotation_history_status ON key_rotation_history(rotation_status);
CREATE INDEX idx_key_rotation_history_start ON key_rotation_history(rotation_start DESC);

CREATE INDEX idx_key_usage_audit_tenant ON key_usage_audit(tenant_id);
CREATE INDEX idx_key_usage_audit_key ON key_usage_audit(key_id);
CREATE INDEX idx_key_usage_audit_timestamp ON key_usage_audit(usage_timestamp DESC);
CREATE INDEX idx_key_usage_audit_user ON key_usage_audit(user_id);
CREATE INDEX idx_key_usage_audit_operation ON key_usage_audit(operation_type);
CREATE INDEX idx_key_usage_audit_anomalous ON key_usage_audit(is_anomalous) WHERE is_anomalous = true;

CREATE INDEX idx_key_access_requests_tenant ON key_access_requests(tenant_id);
CREATE INDEX idx_key_access_requests_key ON key_access_requests(key_id);
CREATE INDEX idx_key_access_requests_status ON key_access_requests(approval_status);
CREATE INDEX idx_key_access_requests_requester ON key_access_requests(requester_id);
CREATE INDEX idx_key_access_requests_pending ON key_access_requests(approval_status) WHERE approval_status = 'pending';

CREATE INDEX idx_key_compliance_checks_tenant ON key_compliance_checks(tenant_id);
CREATE INDEX idx_key_compliance_checks_key ON key_compliance_checks(key_id);
CREATE INDEX idx_key_compliance_checks_status ON key_compliance_checks(check_status);
CREATE INDEX idx_key_compliance_checks_timestamp ON key_compliance_checks(check_timestamp DESC);

CREATE INDEX idx_key_backup_records_tenant ON key_backup_records(tenant_id);
CREATE INDEX idx_key_backup_records_key ON key_backup_records(key_id);
CREATE INDEX idx_key_backup_records_timestamp ON key_backup_records(backup_timestamp DESC);
CREATE INDEX idx_key_backup_records_retention ON key_backup_records(retention_until);

-- Create updated_at triggers
CREATE TRIGGER update_encryption_keys_updated_at 
  BEFORE UPDATE ON encryption_keys 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_rotation_history_updated_at 
  BEFORE UPDATE ON key_rotation_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_access_requests_updated_at 
  BEFORE UPDATE ON key_access_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_backup_records_updated_at 
  BEFORE UPDATE ON key_backup_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for initiating key rotation
CREATE OR REPLACE FUNCTION initiate_key_rotation(
  p_key_id UUID,
  p_rotation_type TEXT,
  p_rotation_reason TEXT,
  p_initiated_by UUID
)
RETURNS UUID AS $$
DECLARE
  rotation_id UUID;
  key_record RECORD;
  new_key_id_val TEXT;
BEGIN
  -- Get current key details
  SELECT * INTO key_record
  FROM encryption_keys
  WHERE id = p_key_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Key not found: %', p_key_id;
  END IF;
  
  -- Generate new key ID (in reality, would call external KMS)
  new_key_id_val := 'key_' || gen_random_uuid()::TEXT;
  
  -- Create rotation history record
  INSERT INTO key_rotation_history (
    tenant_id,
    key_id,
    rotation_type,
    rotation_reason,
    old_key_id,
    old_key_status,
    new_key_id,
    initiated_by,
    rotation_status
  ) VALUES (
    key_record.tenant_id,
    p_key_id,
    p_rotation_type,
    p_rotation_reason,
    key_record.key_id,
    key_record.status,
    new_key_id_val,
    p_initiated_by,
    'in_progress'
  ) RETURNING id INTO rotation_id;
  
  -- Update key status
  UPDATE encryption_keys
  SET 
    status = 'rotating',
    rotation_date = now()
  WHERE id = p_key_id;
  
  RETURN rotation_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for completing key rotation
CREATE OR REPLACE FUNCTION complete_key_rotation(
  p_rotation_id UUID,
  p_new_key_id TEXT,
  p_rotation_status TEXT DEFAULT 'completed'
)
RETURNS BOOLEAN AS $$
DECLARE
  rotation_record RECORD;
BEGIN
  -- Get rotation details
  SELECT * INTO rotation_record
  FROM key_rotation_history
  WHERE id = p_rotation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rotation record not found: %', p_rotation_id;
  END IF;
  
  -- Update rotation history
  UPDATE key_rotation_history
  SET 
    rotation_end = now(),
    rotation_duration_seconds = EXTRACT(EPOCH FROM (now() - rotation_start))::INTEGER,
    rotation_status = p_rotation_status,
    new_key_id = p_new_key_id
  WHERE id = p_rotation_id;
  
  -- Update key record if successful
  IF p_rotation_status = 'completed' THEN
    UPDATE encryption_keys
    SET 
      status = 'active',
      key_id = p_new_key_id,
      next_rotation_date = CURRENT_DATE + rotation_period_days
    WHERE id = rotation_record.key_id;
  ELSE
    -- Rollback to previous status if failed
    UPDATE encryption_keys
    SET status = 'active'
    WHERE id = rotation_record.key_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function for logging key usage
CREATE OR REPLACE FUNCTION log_key_usage(
  p_tenant_id UUID,
  p_key_id UUID,
  p_user_id UUID,
  p_operation_type TEXT,
  p_operation_status TEXT
)
RETURNS UUID AS $$
DECLARE
  usage_log_id UUID;
  key_record RECORD;
  user_record RECORD;
BEGIN
  -- Get key details
  SELECT * INTO key_record
  FROM encryption_keys
  WHERE id = p_key_id;
  
  -- Get user details
  SELECT * INTO user_record
  FROM security_users
  WHERE id = p_user_id;
  
  -- Insert usage log
  INSERT INTO key_usage_audit (
    tenant_id,
    key_id,
    key_name,
    user_id,
    username,
    user_role,
    operation_type,
    operation_status
  ) VALUES (
    p_tenant_id,
    p_key_id,
    key_record.key_name,
    p_user_id,
    user_record.username,
    user_record.role,
    p_operation_type,
    p_operation_status
  ) RETURNING id INTO usage_log_id;
  
  -- Update key usage count
  UPDATE encryption_keys
  SET 
    usage_count = usage_count + 1,
    last_used_timestamp = now(),
    last_used_by = p_user_id
  WHERE id = p_key_id;
  
  RETURN usage_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for checking key compliance
CREATE OR REPLACE FUNCTION check_key_compliance(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  key_record RECORD;
  check_count INTEGER := 0;
  compliance_status TEXT;
  findings TEXT[];
BEGIN
  -- Check all active keys
  FOR key_record IN 
    SELECT * FROM encryption_keys
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
  LOOP
    findings := ARRAY[]::TEXT[];
    compliance_status := 'passed';
    
    -- Check rotation compliance
    IF key_record.rotation_required AND key_record.next_rotation_date < CURRENT_DATE THEN
      findings := array_append(findings, 'Key rotation overdue');
      compliance_status := 'failed';
    END IF;
    
    -- Check key strength
    IF key_record.algorithm = 'AES-256' AND key_record.key_size_bits < 256 THEN
      findings := array_append(findings, 'Insufficient key size for algorithm');
      compliance_status := 'failed';
    END IF;
    
    -- Check expiration
    IF key_record.expiration_date IS NOT NULL AND key_record.expiration_date < now() THEN
      findings := array_append(findings, 'Key expired');
      compliance_status := 'failed';
    END IF;
    
    -- Insert compliance check record
    INSERT INTO key_compliance_checks (
      tenant_id,
      check_name,
      check_type,
      key_id,
      check_status,
      findings,
      automated_check
    ) VALUES (
      p_tenant_id,
      'Automated Key Compliance Check',
      'rotation_compliance',
      key_record.id,
      compliance_status,
      findings,
      true
    );
    
    check_count := check_count + 1;
  END LOOP;
  
  RETURN check_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
-- ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE key_rotation_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE key_usage_audit ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE key_access_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE key_compliance_checks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE key_backup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encryption_keys_tenant_isolation" ON encryption_keys
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "key_rotation_history_tenant_isolation" ON key_rotation_history
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "key_usage_audit_tenant_isolation" ON key_usage_audit
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "key_access_requests_tenant_isolation" ON key_access_requests
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "key_compliance_checks_tenant_isolation" ON key_compliance_checks
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "key_backup_records_tenant_isolation" ON key_backup_records
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
