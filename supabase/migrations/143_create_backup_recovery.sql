-- Backup and recovery configuration for transmission data
-- Requirements: 7.3

-- Create backup_policies table for backup configuration
CREATE TABLE backup_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy identification
  policy_name TEXT NOT NULL,
  policy_description TEXT,
  policy_version TEXT DEFAULT '1.0',
  
  -- Policy status
  status TEXT NOT NULL DEFAULT 'active',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Backup scope
  backup_scope TEXT NOT NULL,
  backup_type TEXT NOT NULL,
  
  -- Target resources
  target_asset_types TEXT[],
  target_sites TEXT[],
  target_databases TEXT[],
  target_tables TEXT[],
  target_file_paths TEXT[],
  
  -- Backup schedule
  schedule_enabled BOOLEAN DEFAULT true,
  schedule_frequency TEXT NOT NULL,
  schedule_cron TEXT,
  schedule_time TIME,
  schedule_day_of_week INTEGER,
  schedule_day_of_month INTEGER,
  
  -- Backup window
  backup_window_start TIME,
  backup_window_end TIME,
  allow_outside_window BOOLEAN DEFAULT false,
  
  -- Retention policy
  retention_period_days INTEGER NOT NULL DEFAULT 30,
  retention_count INTEGER,
  long_term_retention_enabled BOOLEAN DEFAULT false,
  long_term_retention_days INTEGER,
  
  -- Storage configuration
  storage_location TEXT NOT NULL,
  storage_provider TEXT,
  storage_path TEXT NOT NULL,
  storage_region TEXT,
  
  -- Encryption
  encryption_enabled BOOLEAN DEFAULT true,
  encryption_algorithm TEXT DEFAULT 'AES-256',
  encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
  
  -- Compression
  compression_enabled BOOLEAN DEFAULT true,
  compression_algorithm TEXT DEFAULT 'gzip',
  compression_level INTEGER DEFAULT 6,
  
  -- Verification
  verification_enabled BOOLEAN DEFAULT true,
  verification_method TEXT DEFAULT 'checksum',
  verification_frequency TEXT DEFAULT 'every_backup',
  
  -- Performance
  bandwidth_limit_mbps INTEGER,
  parallel_streams INTEGER DEFAULT 1,
  max_backup_duration_hours INTEGER DEFAULT 4,
  
  -- Notification
  notification_enabled BOOLEAN DEFAULT true,
  notification_on_success BOOLEAN DEFAULT false,
  notification_on_failure BOOLEAN DEFAULT true,
  notification_recipients TEXT[],
  
  -- Compliance
  compliance_requirements TEXT[],
  regulatory_retention_required BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  last_reviewed_date DATE,
  next_review_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_backup_policy_name UNIQUE (tenant_id, policy_name),
  CONSTRAINT valid_retention CHECK (retention_period_days > 0)
);

-- Create backup_jobs table for tracking backup executions
CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Policy reference
  policy_id UUID NOT NULL REFERENCES backup_policies(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  
  -- Job identification
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  
  -- Job timing
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  
  -- Backup details
  backup_scope TEXT NOT NULL,
  backup_type TEXT NOT NULL,
  backup_method TEXT,
  
  -- Data volume
  source_size_bytes BIGINT DEFAULT 0,
  backup_size_bytes BIGINT DEFAULT 0,
  compression_ratio NUMERIC(5,2),
  files_backed_up INTEGER DEFAULT 0,
  records_backed_up BIGINT DEFAULT 0,
  
  -- Storage
  storage_location TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  backup_file_name TEXT,
  
  -- Verification
  verification_performed BOOLEAN DEFAULT false,
  verification_passed BOOLEAN DEFAULT false,
  verification_timestamp TIMESTAMPTZ,
  checksum TEXT,
  
  -- Performance metrics
  throughput_mbps NUMERIC(10,2),
  cpu_usage_percent NUMERIC(5,2),
  memory_usage_mb INTEGER,
  network_usage_mb INTEGER,
  
  -- Execution details
  initiated_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  executed_by_system TEXT,
  backup_agent_version TEXT,
  
  -- Error handling
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  error_messages TEXT[],
  warnings TEXT[],
  
  -- Dependencies
  parent_backup_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  
  -- Retention
  retention_until DATE,
  deletion_scheduled BOOLEAN DEFAULT false,
  scheduled_deletion_date DATE,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CONSTRAINT valid_duration CHECK (actual_end IS NULL OR actual_end >= actual_start)
);

-- Create backup_restore_points table for tracking restore points
CREATE TABLE backup_restore_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Restore point identification
  restore_point_name TEXT NOT NULL,
  restore_point_type TEXT NOT NULL,
  
  -- Backup reference
  primary_backup_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
  dependent_backup_ids UUID[],
  
  -- Restore point timing
  backup_timestamp TIMESTAMPTZ NOT NULL,
  restore_point_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Data coverage
  data_scope TEXT NOT NULL,
  included_assets TEXT[],
  included_databases TEXT[],
  included_tables TEXT[],
  
  -- Restore capability
  restore_tested BOOLEAN DEFAULT false,
  last_restore_test TIMESTAMPTZ,
  restore_test_passed BOOLEAN,
  estimated_restore_time_hours NUMERIC(5,2),
  
  -- Data integrity
  integrity_verified BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMPTZ,
  integrity_status TEXT,
  
  -- Retention
  retention_until DATE NOT NULL,
  long_term_archive BOOLEAN DEFAULT false,
  legal_hold BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  
  -- Compliance
  compliance_requirements TEXT[],
  audit_trail_complete BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_restore_point_name UNIQUE (tenant_id, restore_point_name)
);

-- Create backup_restore_jobs table to track restore operations
CREATE TABLE backup_restore_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Restore identification
  restore_name TEXT NOT NULL,
  restore_type TEXT NOT NULL,
  restore_reason TEXT NOT NULL,
  
  -- Source backup
  restore_point_id UUID NOT NULL REFERENCES backup_restore_points(id) ON DELETE CASCADE,
  backup_job_ids UUID[] NOT NULL,
  
  -- Target
  restore_target TEXT NOT NULL,
  target_location TEXT,
  target_database TEXT,
  target_path TEXT,
  
  -- Restore scope
  restore_scope TEXT NOT NULL,
  selected_assets TEXT[],
  selected_tables TEXT[],
  selected_files TEXT[],
  
  -- Timing
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending',
  approver_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_timestamp TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Data volume
  data_size_bytes BIGINT DEFAULT 0,
  files_restored INTEGER DEFAULT 0,
  records_restored BIGINT DEFAULT 0,
  
  -- Verification
  verification_performed BOOLEAN DEFAULT false,
  verification_passed BOOLEAN DEFAULT false,
  verification_notes TEXT,
  
  -- Performance
  throughput_mbps NUMERIC(10,2),
  
  -- Execution details
  initiated_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  executed_by_system TEXT,
  
  -- Error handling
  error_count INTEGER DEFAULT 0,
  error_messages TEXT[],
  warnings TEXT[],
  
  -- Rollback capability
  rollback_possible BOOLEAN DEFAULT true,
  rollback_performed BOOLEAN DEFAULT false,
  rollback_timestamp TIMESTAMPTZ,
  
  -- Impact assessment
  downtime_required BOOLEAN DEFAULT false,
  estimated_downtime_hours NUMERIC(5,2),
  actual_downtime_hours NUMERIC(5,2),
  affected_systems TEXT[],
  
  -- Incident linkage
  incident_id UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Create backup_verification_tests table
CREATE TABLE backup_verification_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Test identification
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL,
  
  -- Test target
  restore_point_id UUID NOT NULL REFERENCES backup_restore_points(id) ON DELETE CASCADE,
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,
  
  -- Test execution
  test_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  test_end TIMESTAMPTZ,
  test_duration_seconds INTEGER,
  
  -- Test status
  status TEXT NOT NULL DEFAULT 'running',
  
  -- Test environment
  test_environment TEXT NOT NULL,
  test_location TEXT,
  
  -- Test scope
  test_scope TEXT NOT NULL,
  tested_assets TEXT[],
  tested_tables TEXT[],
  
  -- Test results
  restore_successful BOOLEAN DEFAULT false,
  data_integrity_verified BOOLEAN DEFAULT false,
  performance_acceptable BOOLEAN DEFAULT false,
  
  -- Performance metrics
  restore_time_seconds INTEGER,
  data_restored_gb NUMERIC(10,2),
  restore_throughput_mbps NUMERIC(10,2),
  
  -- Issues found
  issues_found INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  issue_descriptions TEXT[],
  
  -- Recommendations
  recommendations TEXT[],
  
  -- Test details
  test_procedure TEXT,
  test_results_summary TEXT,
  
  -- Executed by
  executed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create backup_storage_locations table
CREATE TABLE backup_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Location identification
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL,
  
  -- Storage details
  storage_provider TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_region TEXT,
  
  -- Capacity
  total_capacity_gb NUMERIC(12,2),
  used_capacity_gb NUMERIC(12,2) DEFAULT 0,
  available_capacity_gb NUMERIC(12,2),
  capacity_threshold_percent INTEGER DEFAULT 80,
  
  -- Status
  status TEXT DEFAULT 'active',
  health_status TEXT DEFAULT 'healthy',
  
  -- Access
  access_method TEXT,
  access_credentials_id TEXT,
  
  -- Performance
  read_throughput_mbps NUMERIC(10,2),
  write_throughput_mbps NUMERIC(10,2),
  latency_ms NUMERIC(8,2),
  
  -- Monitoring
  last_health_check TIMESTAMPTZ,
  monitoring_enabled BOOLEAN DEFAULT true,
  
  -- Retention
  default_retention_days INTEGER DEFAULT 30,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_location_name UNIQUE (tenant_id, location_name)
);

-- Create indexes for performance
CREATE INDEX idx_backup_policies_tenant ON backup_policies(tenant_id);
CREATE INDEX idx_backup_policies_status ON backup_policies(status);
CREATE INDEX idx_backup_policies_schedule ON backup_policies(schedule_enabled) WHERE schedule_enabled = true;

CREATE INDEX idx_backup_jobs_tenant ON backup_jobs(tenant_id);
CREATE INDEX idx_backup_jobs_policy ON backup_jobs(policy_id);
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_start ON backup_jobs(actual_start DESC);
CREATE INDEX idx_backup_jobs_retention ON backup_jobs(retention_until);

CREATE INDEX idx_backup_restore_points_tenant ON backup_restore_points(tenant_id);
CREATE INDEX idx_backup_restore_points_backup ON backup_restore_points(primary_backup_id);
CREATE INDEX idx_backup_restore_points_timestamp ON backup_restore_points(restore_point_timestamp DESC);
CREATE INDEX idx_backup_restore_points_retention ON backup_restore_points(retention_until);
CREATE INDEX idx_backup_restore_points_legal_hold ON backup_restore_points(legal_hold) WHERE legal_hold = true;

CREATE INDEX idx_backup_restore_jobs_tenant ON backup_restore_jobs(tenant_id);
CREATE INDEX idx_backup_restore_jobs_restore_point ON backup_restore_jobs(restore_point_id);
CREATE INDEX idx_backup_restore_jobs_status ON backup_restore_jobs(status);
CREATE INDEX idx_backup_restore_jobs_start ON backup_restore_jobs(actual_start DESC);
CREATE INDEX idx_backup_restore_jobs_approval ON backup_restore_jobs(approval_status) WHERE approval_status = 'pending';

CREATE INDEX idx_backup_verification_tests_tenant ON backup_verification_tests(tenant_id);
CREATE INDEX idx_backup_verification_tests_restore_point ON backup_verification_tests(restore_point_id);
CREATE INDEX idx_backup_verification_tests_status ON backup_verification_tests(status);
CREATE INDEX idx_backup_verification_tests_start ON backup_verification_tests(test_start DESC);

CREATE INDEX idx_backup_storage_locations_tenant ON backup_storage_locations(tenant_id);
CREATE INDEX idx_backup_storage_locations_status ON backup_storage_locations(status);
CREATE INDEX idx_backup_storage_locations_health ON backup_storage_locations(health_status);

-- Create updated_at triggers
CREATE TRIGGER update_backup_policies_updated_at 
  BEFORE UPDATE ON backup_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_jobs_updated_at 
  BEFORE UPDATE ON backup_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_restore_points_updated_at 
  BEFORE UPDATE ON backup_restore_points 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_restore_jobs_updated_at 
  BEFORE UPDATE ON backup_restore_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_verification_tests_updated_at 
  BEFORE UPDATE ON backup_verification_tests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_storage_locations_updated_at 
  BEFORE UPDATE ON backup_storage_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for initiating backup job
CREATE OR REPLACE FUNCTION initiate_backup_job(
  p_policy_id UUID,
  p_job_type TEXT,
  p_initiated_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
  policy_record RECORD;
  job_name_val TEXT;
BEGIN
  -- Get policy details
  SELECT * INTO policy_record
  FROM backup_policies
  WHERE id = p_policy_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup policy not found: %', p_policy_id;
  END IF;
  
  -- Generate job name
  job_name_val := policy_record.policy_name || '_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  
  -- Create backup job
  INSERT INTO backup_jobs (
    tenant_id,
    policy_id,
    policy_name,
    job_name,
    job_type,
    backup_scope,
    backup_type,
    storage_location,
    storage_path,
    scheduled_start,
    status,
    initiated_by
  ) VALUES (
    policy_record.tenant_id,
    p_policy_id,
    policy_record.policy_name,
    job_name_val,
    p_job_type,
    policy_record.backup_scope,
    policy_record.backup_type,
    policy_record.storage_location,
    policy_record.storage_path,
    now(),
    'pending',
    p_initiated_by
  ) RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for completing backup job
CREATE OR REPLACE FUNCTION complete_backup_job(
  p_job_id UUID,
  p_status TEXT,
  p_backup_size_bytes BIGINT DEFAULT NULL,
  p_checksum TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  job_record RECORD;
  retention_date DATE;
BEGIN
  -- Get job details
  SELECT * INTO job_record
  FROM backup_jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup job not found: %', p_job_id;
  END IF;
  
  -- Calculate retention date
  SELECT CURRENT_DATE + retention_period_days INTO retention_date
  FROM backup_policies
  WHERE id = job_record.policy_id;
  
  -- Update job
  UPDATE backup_jobs
  SET 
    status = p_status,
    actual_end = now(),
    duration_seconds = EXTRACT(EPOCH FROM (now() - actual_start))::INTEGER,
    completion_percentage = CASE WHEN p_status = 'completed' THEN 100 ELSE completion_percentage END,
    backup_size_bytes = COALESCE(p_backup_size_bytes, backup_size_bytes),
    checksum = COALESCE(p_checksum, checksum),
    retention_until = retention_date
  WHERE id = p_job_id;
  
  -- Create restore point if successful
  IF p_status = 'completed' THEN
    INSERT INTO backup_restore_points (
      tenant_id,
      restore_point_name,
      restore_point_type,
      primary_backup_id,
      backup_timestamp,
      restore_point_timestamp,
      data_scope,
      retention_until
    ) VALUES (
      job_record.tenant_id,
      job_record.job_name || '_restore_point',
      'full',
      p_job_id,
      now(),
      now(),
      'complete',
      retention_date
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function for initiating restore job
CREATE OR REPLACE FUNCTION initiate_restore_job(
  p_tenant_id UUID,
  p_restore_point_id UUID,
  p_restore_type TEXT,
  p_restore_reason TEXT,
  p_initiated_by UUID
)
RETURNS UUID AS $$
DECLARE
  restore_job_id UUID;
  restore_point_record RECORD;
BEGIN
  -- Get restore point details
  SELECT * INTO restore_point_record
  FROM backup_restore_points
  WHERE id = p_restore_point_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restore point not found: %', p_restore_point_id;
  END IF;
  
  -- Create restore job
  INSERT INTO backup_restore_jobs (
    tenant_id,
    restore_name,
    restore_type,
    restore_reason,
    restore_point_id,
    backup_job_ids,
    restore_target,
    restore_scope,
    status,
    initiated_by
  ) VALUES (
    p_tenant_id,
    'restore_' || to_char(now(), 'YYYYMMDD_HH24MISS'),
    p_restore_type,
    p_restore_reason,
    p_restore_point_id,
    ARRAY[restore_point_record.primary_backup_id],
    'original_location',
    'complete',
    'pending',
    p_initiated_by
  ) RETURNING id INTO restore_job_id;
  
  RETURN restore_job_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
-- ALTER TABLE backup_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backup_restore_points ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backup_restore_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backup_verification_tests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backup_storage_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_policies_tenant_isolation" ON backup_policies
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "backup_jobs_tenant_isolation" ON backup_jobs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "backup_restore_points_tenant_isolation" ON backup_restore_points
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "backup_restore_jobs_tenant_isolation" ON backup_restore_jobs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "backup_verification_tests_tenant_isolation" ON backup_verification_tests
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "backup_storage_locations_tenant_isolation" ON backup_storage_locations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
