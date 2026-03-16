-- Enhanced log retention and management system
-- Requirements: 6.4

-- Create log_archival_jobs table for automated archival management
CREATE TABLE log_archival_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Job identification
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'archive', 'purge', 'export', 'compress'
  
  -- Job configuration
  retention_policy_id UUID NOT NULL REFERENCES audit_retention_policies(id) ON DELETE CASCADE,
  schedule_cron TEXT NOT NULL, -- Cron expression for scheduling
  
  -- Job criteria
  date_threshold TIMESTAMPTZ,
  record_count_threshold INTEGER,
  size_threshold_mb INTEGER,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed', 'paused'
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  
  -- Job results
  records_processed INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  records_purged INTEGER DEFAULT 0,
  size_processed_mb NUMERIC(10,2) DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Performance tracking
  execution_time_seconds INTEGER,
  
  created_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_archival_job_name UNIQUE (tenant_id, job_name),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT valid_thresholds CHECK (
    date_threshold IS NOT NULL OR 
    record_count_threshold IS NOT NULL OR 
    size_threshold_mb IS NOT NULL
  )
);

-- Create log_storage_locations table for managing different storage tiers
CREATE TABLE log_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Storage identification
  name TEXT NOT NULL,
  storage_type TEXT NOT NULL, -- 'hot', 'warm', 'cold', 'archive', 'glacier'
  
  -- Storage configuration
  storage_path TEXT NOT NULL,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  
  -- Capacity and limits
  max_size_gb NUMERIC(10,2),
  current_size_gb NUMERIC(10,2) DEFAULT 0,
  max_retention_days INTEGER,
  
  -- Access configuration
  access_tier TEXT DEFAULT 'standard', -- 'instant', 'standard', 'bulk'
  read_only BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'full', 'readonly', 'offline'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_storage_location_name UNIQUE (tenant_id, name),
  CONSTRAINT valid_storage_size CHECK (current_size_gb >= 0 AND (max_size_gb IS NULL OR current_size_gb <= max_size_gb))
);

-- Create archived_audit_logs table for long-term storage
CREATE TABLE archived_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Original log reference
  original_log_id UUID NOT NULL,
  
  -- Archive metadata
  storage_location_id UUID NOT NULL REFERENCES log_storage_locations(id) ON DELETE RESTRICT,
  archive_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  
  -- Compressed log data
  log_data JSONB NOT NULL,
  compressed_size_bytes INTEGER,
  original_size_bytes INTEGER,
  compression_ratio NUMERIC(5,2),
  
  -- Retrieval tracking
  retrieval_count INTEGER DEFAULT 0,
  last_retrieved TIMESTAMPTZ,
  
  -- Retention
  retention_until TIMESTAMPTZ NOT NULL,
  purge_eligible BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_compression_ratio CHECK (compression_ratio >= 0 AND compression_ratio <= 1),
  CONSTRAINT valid_retention_date CHECK (retention_until > archive_timestamp)
);

-- Create indexes for performance
CREATE INDEX idx_log_archival_jobs_tenant ON log_archival_jobs(tenant_id);
CREATE INDEX idx_log_archival_jobs_status ON log_archival_jobs(status, next_run);
CREATE INDEX idx_log_archival_jobs_policy ON log_archival_jobs(retention_policy_id);

CREATE INDEX idx_log_storage_locations_tenant ON log_storage_locations(tenant_id);
CREATE INDEX idx_log_storage_locations_type ON log_storage_locations(storage_type, status);

CREATE INDEX idx_archived_audit_logs_tenant ON archived_audit_logs(tenant_id);
CREATE INDEX idx_archived_audit_logs_original ON archived_audit_logs(original_log_id);
CREATE INDEX idx_archived_audit_logs_storage ON archived_audit_logs(storage_location_id);
CREATE INDEX idx_archived_audit_logs_retention ON archived_audit_logs(retention_until, purge_eligible);
CREATE INDEX idx_archived_audit_logs_timestamp ON archived_audit_logs(archive_timestamp DESC);

-- Create updated_at triggers
CREATE TRIGGER update_log_archival_jobs_updated_at 
  BEFORE UPDATE ON log_archival_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_log_storage_locations_updated_at 
  BEFORE UPDATE ON log_storage_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for automated log archival
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
  p_tenant_id UUID,
  p_retention_policy_id UUID,
  p_storage_location_id UUID,
  p_archived_by UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  log_record RECORD;
  retention_days INTEGER;
BEGIN
  -- Get retention period from policy
  SELECT retention_days_operational INTO retention_days
  FROM audit_retention_policies
  WHERE id = p_retention_policy_id;
  
  -- Archive eligible logs
  FOR log_record IN 
    SELECT * FROM security_audit_log
    WHERE tenant_id = p_tenant_id
      AND event_timestamp < p_cutoff_date
      AND id NOT IN (SELECT original_log_id FROM archived_audit_logs)
    ORDER BY event_timestamp ASC
    LIMIT 10000 -- Process in batches
  LOOP
    -- Insert into archived logs
    INSERT INTO archived_audit_logs (
      tenant_id,
      original_log_id,
      storage_location_id,
      archived_by,
      log_data,
      original_size_bytes,
      compressed_size_bytes,
      compression_ratio,
      retention_until
    ) VALUES (
      log_record.tenant_id,
      log_record.id,
      p_storage_location_id,
      p_archived_by,
      row_to_json(log_record)::JSONB,
      length(row_to_json(log_record)::TEXT),
      length(row_to_json(log_record)::TEXT) * 0.3, -- Simulated compression
      0.3, -- Simulated compression ratio
      now() + (retention_days || ' days')::INTERVAL
    );
    
    archived_count := archived_count + 1;
  END LOOP;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for purging expired archived logs
CREATE OR REPLACE FUNCTION purge_expired_archived_logs(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  purged_count INTEGER := 0;
BEGIN
  -- Mark logs eligible for purge
  UPDATE archived_audit_logs
  SET purge_eligible = true
  WHERE tenant_id = p_tenant_id
    AND retention_until < now()
    AND purge_eligible = false;
  
  GET DIAGNOSTICS purged_count = ROW_COUNT;
  
  -- Optionally delete immediately (or keep for manual review)
  -- DELETE FROM archived_audit_logs WHERE purge_eligible = true;
  
  RETURN purged_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update storage location size
CREATE OR REPLACE FUNCTION update_storage_location_size()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE log_storage_locations
  SET current_size_gb = (
    SELECT COALESCE(SUM(compressed_size_bytes), 0) / (1024.0 * 1024.0 * 1024.0)
    FROM archived_audit_logs
    WHERE storage_location_id = NEW.storage_location_id
  )
  WHERE id = NEW.storage_location_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_storage_size_on_archive
  AFTER INSERT ON archived_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_location_size();

-- Create function for executing archival jobs
CREATE OR REPLACE FUNCTION execute_archival_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  job_record RECORD;
  archived_count INTEGER;
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  start_time := now();
  
  -- Get job details
  SELECT * INTO job_record
  FROM log_archival_jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archival job not found: %', p_job_id;
  END IF;
  
  -- Update job status to running
  UPDATE log_archival_jobs
  SET status = 'running', last_run = start_time
  WHERE id = p_job_id;
  
  -- Execute based on job type
  CASE job_record.job_type
    WHEN 'archive' THEN
      -- Archive old logs
      SELECT archive_old_audit_logs(
        job_record.tenant_id,
        job_record.retention_policy_id,
        (SELECT id FROM log_storage_locations WHERE tenant_id = job_record.tenant_id AND storage_type = 'archive' LIMIT 1),
        job_record.created_by,
        job_record.date_threshold
      ) INTO archived_count;
      
      UPDATE log_archival_jobs
      SET 
        records_archived = records_archived + archived_count,
        records_processed = records_processed + archived_count
      WHERE id = p_job_id;
      
    WHEN 'purge' THEN
      -- Purge expired logs
      SELECT purge_expired_archived_logs(job_record.tenant_id) INTO archived_count;
      
      UPDATE log_archival_jobs
      SET 
        records_purged = records_purged + archived_count,
        records_processed = records_processed + archived_count
      WHERE id = p_job_id;
      
    ELSE
      RAISE EXCEPTION 'Unsupported job type: %', job_record.job_type;
  END CASE;
  
  end_time := now();
  
  -- Update job status to completed
  UPDATE log_archival_jobs
  SET 
    status = 'completed',
    execution_time_seconds = EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER,
    next_run = start_time + (job_record.schedule_cron || ' days')::INTERVAL, -- Simplified scheduling
    retry_count = 0
  WHERE id = p_job_id;
  
  RETURN true;
  
EXCEPTION WHEN OTHERS THEN
  -- Update job status to failed
  UPDATE log_archival_jobs
  SET 
    status = 'failed',
    error_message = SQLERRM,
    retry_count = retry_count + 1
  WHERE id = p_job_id;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE log_archival_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_archival_jobs_tenant_isolation" ON log_archival_jobs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "log_storage_locations_tenant_isolation" ON log_storage_locations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "archived_audit_logs_tenant_isolation" ON archived_audit_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);