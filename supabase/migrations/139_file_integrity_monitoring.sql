-- File integrity monitoring for transmission systems
-- Requirements: 6.5

-- Create file_integrity_monitors table for tracking monitored files
CREATE TABLE file_integrity_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monitor identification
  monitor_name TEXT NOT NULL,
  description TEXT,
  
  -- Target system
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL, -- 'protection_relay', 'rtu', 'scada_node', 'gateway', 'hmi', 'engineering_station'
  system_name TEXT NOT NULL,
  zone_id TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- File/configuration path
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'configuration', 'firmware', 'logic', 'parameter', 'certificate', 'key', 'script'
  
  -- Baseline information
  baseline_hash TEXT NOT NULL, -- SHA-256 hash of the file
  baseline_size_bytes INTEGER NOT NULL,
  baseline_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  baseline_version TEXT,
  
  -- Current state
  current_hash TEXT,
  current_size_bytes INTEGER,
  last_checked TIMESTAMPTZ,
  integrity_status TEXT DEFAULT 'unknown', -- 'intact', 'modified', 'missing', 'unknown', 'error'
  
  -- Monitoring configuration
  check_frequency_minutes INTEGER DEFAULT 60,
  alert_on_change BOOLEAN DEFAULT true,
  auto_restore BOOLEAN DEFAULT false,
  
  -- Criticality
  criticality TEXT DEFAULT 'medium', -- 'safety-critical', 'high', 'medium', 'low'
  safety_related BOOLEAN DEFAULT false,
  
  -- Status
  monitoring_enabled BOOLEAN DEFAULT true,
  last_alert_timestamp TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_monitor_file_path UNIQUE (tenant_id, asset_id, file_path),
  CONSTRAINT valid_check_frequency CHECK (check_frequency_minutes > 0 AND check_frequency_minutes <= 1440)
);

-- Create file_integrity_violations table for tracking detected changes
CREATE TABLE file_integrity_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monitor reference
  monitor_id UUID NOT NULL REFERENCES file_integrity_monitors(id) ON DELETE CASCADE,
  
  -- Violation details
  violation_type TEXT NOT NULL, -- 'unauthorized_modification', 'unexpected_deletion', 'hash_mismatch', 'size_change', 'permission_change'
  detected_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- File state at detection
  expected_hash TEXT NOT NULL,
  actual_hash TEXT,
  expected_size_bytes INTEGER NOT NULL,
  actual_size_bytes INTEGER,
  
  -- Change details
  change_description TEXT,
  change_magnitude TEXT, -- 'minor', 'moderate', 'major', 'critical'
  
  -- Context
  last_known_good_timestamp TIMESTAMPTZ,
  potential_change_window_start TIMESTAMPTZ,
  potential_change_window_end TIMESTAMPTZ,
  
  -- Investigation
  investigation_status TEXT DEFAULT 'new', -- 'new', 'investigating', 'authorized', 'unauthorized', 'false_positive', 'resolved'
  investigated_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  investigation_notes TEXT,
  resolution_timestamp TIMESTAMPTZ,
  
  -- Response actions
  alert_generated BOOLEAN DEFAULT false,
  incident_created BOOLEAN DEFAULT false,
  incident_id UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
  auto_restore_attempted BOOLEAN DEFAULT false,
  restore_successful BOOLEAN,
  
  -- Risk assessment
  risk_score INTEGER DEFAULT 50, -- 0-100
  safety_impact TEXT DEFAULT 'unknown', -- 'none', 'low', 'medium', 'high', 'critical', 'unknown'
  operational_impact TEXT DEFAULT 'unknown',
  security_impact TEXT DEFAULT 'unknown',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Create file_integrity_baselines table for version control
CREATE TABLE file_integrity_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monitor reference
  monitor_id UUID NOT NULL REFERENCES file_integrity_monitors(id) ON DELETE CASCADE,
  
  -- Baseline version
  version_number INTEGER NOT NULL,
  version_label TEXT,
  
  -- File snapshot
  file_hash TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_content_sample TEXT, -- First 1KB for quick reference
  
  -- Metadata
  created_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  change_reason TEXT,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_baseline_version UNIQUE (monitor_id, version_number)
);

-- Create file_integrity_check_history table for audit trail
CREATE TABLE file_integrity_check_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monitor reference
  monitor_id UUID NOT NULL REFERENCES file_integrity_monitors(id) ON DELETE CASCADE,
  
  -- Check details
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_result TEXT NOT NULL, -- 'pass', 'fail', 'error', 'skipped'
  
  -- File state
  file_hash TEXT,
  file_size_bytes INTEGER,
  file_exists BOOLEAN,
  
  -- Performance
  check_duration_ms INTEGER,
  
  -- Error handling
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_file_integrity_monitors_tenant ON file_integrity_monitors(tenant_id);
CREATE INDEX idx_file_integrity_monitors_asset ON file_integrity_monitors(asset_id);
CREATE INDEX idx_file_integrity_monitors_status ON file_integrity_monitors(monitoring_enabled, integrity_status);
CREATE INDEX idx_file_integrity_monitors_criticality ON file_integrity_monitors(criticality, safety_related);
CREATE INDEX idx_file_integrity_monitors_last_checked ON file_integrity_monitors(last_checked);

CREATE INDEX idx_file_integrity_violations_tenant ON file_integrity_violations(tenant_id);
CREATE INDEX idx_file_integrity_violations_monitor ON file_integrity_violations(monitor_id);
CREATE INDEX idx_file_integrity_violations_timestamp ON file_integrity_violations(detected_timestamp DESC);
CREATE INDEX idx_file_integrity_violations_status ON file_integrity_violations(investigation_status);
CREATE INDEX idx_file_integrity_violations_risk ON file_integrity_violations(risk_score DESC);

CREATE INDEX idx_file_integrity_baselines_tenant ON file_integrity_baselines(tenant_id);
CREATE INDEX idx_file_integrity_baselines_monitor ON file_integrity_baselines(monitor_id);
CREATE INDEX idx_file_integrity_baselines_active ON file_integrity_baselines(is_active) WHERE is_active = true;

CREATE INDEX idx_file_integrity_check_history_tenant ON file_integrity_check_history(tenant_id);
CREATE INDEX idx_file_integrity_check_history_monitor ON file_integrity_check_history(monitor_id);
CREATE INDEX idx_file_integrity_check_history_timestamp ON file_integrity_check_history(check_timestamp DESC);
CREATE INDEX idx_file_integrity_check_history_result ON file_integrity_check_history(check_result);

-- Create updated_at triggers
CREATE TRIGGER update_file_integrity_monitors_updated_at 
  BEFORE UPDATE ON file_integrity_monitors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_integrity_violations_updated_at 
  BEFORE UPDATE ON file_integrity_violations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for performing integrity check
CREATE OR REPLACE FUNCTION perform_integrity_check(
  p_monitor_id UUID,
  p_current_hash TEXT,
  p_current_size_bytes INTEGER,
  p_file_exists BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
  monitor_record RECORD;
  check_passed BOOLEAN;
  violation_id UUID;
BEGIN
  -- Get monitor details
  SELECT * INTO monitor_record
  FROM file_integrity_monitors
  WHERE id = p_monitor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Monitor not found: %', p_monitor_id;
  END IF;
  
  -- Record check in history
  INSERT INTO file_integrity_check_history (
    tenant_id,
    monitor_id,
    check_result,
    file_hash,
    file_size_bytes,
    file_exists
  ) VALUES (
    monitor_record.tenant_id,
    p_monitor_id,
    CASE 
      WHEN NOT p_file_exists THEN 'fail'
      WHEN p_current_hash = monitor_record.baseline_hash THEN 'pass'
      ELSE 'fail'
    END,
    p_current_hash,
    p_current_size_bytes,
    p_file_exists
  );
  
  -- Check integrity
  IF NOT p_file_exists THEN
    check_passed := false;
    
    -- Create violation for missing file
    INSERT INTO file_integrity_violations (
      tenant_id,
      monitor_id,
      violation_type,
      expected_hash,
      actual_hash,
      expected_size_bytes,
      actual_size_bytes,
      change_description,
      change_magnitude,
      risk_score,
      alert_generated
    ) VALUES (
      monitor_record.tenant_id,
      p_monitor_id,
      'unexpected_deletion',
      monitor_record.baseline_hash,
      NULL,
      monitor_record.baseline_size_bytes,
      NULL,
      'File is missing from monitored location',
      'critical',
      90,
      monitor_record.alert_on_change
    ) RETURNING id INTO violation_id;
    
  ELSIF p_current_hash != monitor_record.baseline_hash THEN
    check_passed := false;
    
    -- Create violation for hash mismatch
    INSERT INTO file_integrity_violations (
      tenant_id,
      monitor_id,
      violation_type,
      expected_hash,
      actual_hash,
      expected_size_bytes,
      actual_size_bytes,
      change_description,
      change_magnitude,
      risk_score,
      alert_generated
    ) VALUES (
      monitor_record.tenant_id,
      p_monitor_id,
      CASE 
        WHEN p_current_size_bytes != monitor_record.baseline_size_bytes THEN 'unauthorized_modification'
        ELSE 'hash_mismatch'
      END,
      monitor_record.baseline_hash,
      p_current_hash,
      monitor_record.baseline_size_bytes,
      p_current_size_bytes,
      'File hash does not match baseline',
      CASE 
        WHEN ABS(p_current_size_bytes - monitor_record.baseline_size_bytes) > monitor_record.baseline_size_bytes * 0.5 THEN 'major'
        WHEN ABS(p_current_size_bytes - monitor_record.baseline_size_bytes) > monitor_record.baseline_size_bytes * 0.1 THEN 'moderate'
        ELSE 'minor'
      END,
      CASE 
        WHEN monitor_record.safety_related THEN 95
        WHEN monitor_record.criticality = 'safety-critical' THEN 90
        WHEN monitor_record.criticality = 'high' THEN 75
        WHEN monitor_record.criticality = 'medium' THEN 50
        ELSE 30
      END,
      monitor_record.alert_on_change
    ) RETURNING id INTO violation_id;
    
  ELSE
    check_passed := true;
  END IF;
  
  -- Update monitor status
  UPDATE file_integrity_monitors
  SET 
    current_hash = p_current_hash,
    current_size_bytes = p_current_size_bytes,
    last_checked = now(),
    integrity_status = CASE 
      WHEN check_passed THEN 'intact'
      WHEN NOT p_file_exists THEN 'missing'
      ELSE 'modified'
    END,
    last_alert_timestamp = CASE 
      WHEN NOT check_passed AND alert_on_change THEN now()
      ELSE last_alert_timestamp
    END
  WHERE id = p_monitor_id;
  
  RETURN check_passed;
END;
$$ LANGUAGE plpgsql;

-- Create function for creating new baseline
CREATE OR REPLACE FUNCTION create_integrity_baseline(
  p_monitor_id UUID,
  p_file_hash TEXT,
  p_file_size_bytes INTEGER,
  p_created_by UUID,
  p_change_reason TEXT DEFAULT NULL,
  p_make_active BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  monitor_record RECORD;
  new_version INTEGER;
  baseline_id UUID;
BEGIN
  -- Get monitor details
  SELECT * INTO monitor_record
  FROM file_integrity_monitors
  WHERE id = p_monitor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Monitor not found: %', p_monitor_id;
  END IF;
  
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version
  FROM file_integrity_baselines
  WHERE monitor_id = p_monitor_id;
  
  -- Create new baseline
  INSERT INTO file_integrity_baselines (
    tenant_id,
    monitor_id,
    version_number,
    file_hash,
    file_size_bytes,
    created_by,
    change_reason,
    is_active
  ) VALUES (
    monitor_record.tenant_id,
    p_monitor_id,
    new_version,
    p_file_hash,
    p_file_size_bytes,
    p_created_by,
    p_change_reason,
    p_make_active
  ) RETURNING id INTO baseline_id;
  
  -- If making active, deactivate other baselines and update monitor
  IF p_make_active THEN
    UPDATE file_integrity_baselines
    SET is_active = false
    WHERE monitor_id = p_monitor_id AND id != baseline_id;
    
    UPDATE file_integrity_monitors
    SET 
      baseline_hash = p_file_hash,
      baseline_size_bytes = p_file_size_bytes,
      baseline_timestamp = now(),
      baseline_version = new_version::TEXT,
      current_hash = p_file_hash,
      current_size_bytes = p_file_size_bytes,
      integrity_status = 'intact'
    WHERE id = p_monitor_id;
  END IF;
  
  RETURN baseline_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic alert generation on violations
CREATE OR REPLACE FUNCTION create_alert_for_integrity_violation()
RETURNS TRIGGER AS $$
DECLARE
  monitor_record RECORD;
BEGIN
  -- Get monitor details
  SELECT fim.*, a.name as asset_name
  INTO monitor_record
  FROM file_integrity_monitors fim
  LEFT JOIN assets a ON fim.asset_id = a.id
  WHERE fim.id = NEW.monitor_id;
  
  -- Create security alert if configured
  IF NEW.alert_generated THEN
    INSERT INTO security_alerts (
      tenant_id,
      severity,
      status,
      title,
      description,
      asset_id,
      detected_by,
      is_safety_critical,
      threat_category,
      metadata
    ) VALUES (
      NEW.tenant_id,
      CASE 
        WHEN NEW.risk_score >= 80 THEN 'critical'::security_alert_severity
        WHEN NEW.risk_score >= 60 THEN 'high'::security_alert_severity
        WHEN NEW.risk_score >= 40 THEN 'medium'::security_alert_severity
        ELSE 'info'::security_alert_severity
      END,
      'new'::security_alert_status,
      'File Integrity Violation: ' || monitor_record.file_path,
      'Unauthorized change detected on ' || monitor_record.system_type || ' ' || monitor_record.system_name || ': ' || NEW.change_description,
      monitor_record.asset_id,
      'file_integrity_monitor',
      monitor_record.safety_related,
      'unauthorized-access', -- Use a valid value from transmission_threat_category
      jsonb_build_object(
        'violation_id', NEW.id,
        'monitor_id', NEW.monitor_id,
        'file_path', monitor_record.file_path,
        'system_name', monitor_record.system_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_integrity_violation_alert_trigger
  AFTER INSERT ON file_integrity_violations
  FOR EACH ROW
  WHEN (NEW.alert_generated = true)
  EXECUTE FUNCTION create_alert_for_integrity_violation();

-- Add RLS policies
ALTER TABLE file_integrity_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_check_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_integrity_monitors_tenant_isolation" ON file_integrity_monitors
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "file_integrity_violations_tenant_isolation" ON file_integrity_violations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "file_integrity_baselines_tenant_isolation" ON file_integrity_baselines
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "file_integrity_check_history_tenant_isolation" ON file_integrity_check_history
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
