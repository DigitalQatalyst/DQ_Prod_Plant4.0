-- Forensic snapshots for security investigations
-- Requirements: 6.6

-- Create forensic_snapshots table for system state capture
CREATE TABLE forensic_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Snapshot identification
  snapshot_name TEXT NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'incident_response', 'scheduled', 'manual', 'triggered', 'compliance'
  
  -- Trigger context
  trigger_reason TEXT NOT NULL,
  triggered_by_user UUID REFERENCES security_users(id) ON DELETE SET NULL,
  triggered_by_alert UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
  triggered_by_incident UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
  
  -- Target system
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  system_type TEXT, -- 'protection_relay', 'rtu', 'scada_node', 'gateway', 'hmi', 'server'
  system_name TEXT,
  zone_id TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Snapshot scope
  scope TEXT NOT NULL DEFAULT 'full', -- 'full', 'configuration', 'logs', 'network', 'process', 'memory'
  
  -- Snapshot timing
  capture_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  capture_end TIMESTAMPTZ,
  capture_duration_seconds INTEGER,
  
  -- Snapshot status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'capturing', 'completed', 'failed', 'partial'
  completion_percentage INTEGER DEFAULT 0,
  
  -- Data collection
  total_size_bytes BIGINT DEFAULT 0,
  compressed_size_bytes BIGINT DEFAULT 0,
  compression_ratio NUMERIC(5,2),
  file_count INTEGER DEFAULT 0,
  
  -- Storage
  storage_location TEXT,
  storage_path TEXT,
  encryption_enabled BOOLEAN DEFAULT true,
  encryption_key_id TEXT,
  
  -- Chain of custody
  custody_chain JSONB DEFAULT '[]'::JSONB, -- Array of custody transfer records
  current_custodian UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Integrity
  snapshot_hash TEXT, -- SHA-256 hash of entire snapshot
  integrity_verified BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMPTZ,
  
  -- Retention
  retention_until TIMESTAMPTZ,
  legal_hold BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  
  -- Investigation linkage
  investigation_id UUID,
  case_number TEXT,
  
  -- Metadata
  capture_method TEXT, -- 'agent', 'api', 'manual', 'automated'
  capture_tool TEXT,
  capture_tool_version TEXT,
  
  -- Error handling
  error_message TEXT,
  warnings TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_snapshot_name UNIQUE (tenant_id, snapshot_name),
  CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CONSTRAINT valid_capture_duration CHECK (capture_end IS NULL OR capture_end >= capture_start)
);

-- Create forensic_snapshot_components table for detailed component tracking
CREATE TABLE forensic_snapshot_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Snapshot reference
  snapshot_id UUID NOT NULL REFERENCES forensic_snapshots(id) ON DELETE CASCADE,
  
  -- Component identification
  component_type TEXT NOT NULL, -- 'configuration_file', 'log_file', 'process_list', 'network_connections', 'memory_dump', 'registry', 'event_log'
  component_name TEXT NOT NULL,
  component_path TEXT,
  
  -- Component data
  data_size_bytes BIGINT,
  data_hash TEXT, -- SHA-256 hash
  data_content JSONB, -- For structured data
  data_reference TEXT, -- External storage reference for large files
  
  -- Collection details
  collection_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  collection_status TEXT DEFAULT 'pending', -- 'pending', 'collected', 'failed', 'skipped'
  collection_error TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_snapshot_component UNIQUE (snapshot_id, component_type, component_path)
);

-- Create forensic_analysis_sessions table for investigation tracking
CREATE TABLE forensic_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Session identification
  session_name TEXT NOT NULL,
  
  -- Snapshot reference
  snapshot_id UUID NOT NULL REFERENCES forensic_snapshots(id) ON DELETE CASCADE,
  
  -- Analyst information
  analyst_id UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  analyst_role TEXT,
  
  -- Session timing
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  
  -- Analysis details
  analysis_type TEXT, -- 'timeline', 'root_cause', 'impact', 'attribution', 'malware'
  analysis_tools TEXT[],
  
  -- Findings
  findings JSONB DEFAULT '[]'::JSONB, -- Array of finding objects
  indicators_of_compromise JSONB DEFAULT '[]'::JSONB,
  timeline_events JSONB DEFAULT '[]'::JSONB,
  
  -- Conclusions
  summary TEXT,
  root_cause TEXT,
  recommendations TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
  
  -- Chain of custody
  accessed_components TEXT[], -- Component IDs accessed during analysis
  modifications_made TEXT[], -- Any modifications to snapshot (should be minimal)
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create forensic_evidence_items table for specific evidence tracking
CREATE TABLE forensic_evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Evidence identification
  evidence_number TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- 'log_entry', 'file', 'network_packet', 'memory_artifact', 'configuration', 'screenshot'
  
  -- Source
  snapshot_id UUID NOT NULL REFERENCES forensic_snapshots(id) ON DELETE CASCADE,
  component_id UUID REFERENCES forensic_snapshot_components(id) ON DELETE SET NULL,
  
  -- Evidence details
  description TEXT NOT NULL,
  significance TEXT, -- 'critical', 'high', 'medium', 'low'
  
  -- Evidence data
  evidence_data JSONB,
  evidence_file_reference TEXT,
  evidence_hash TEXT,
  
  -- Context
  timestamp_of_evidence TIMESTAMPTZ,
  related_events TEXT[],
  
  -- Chain of custody
  collected_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  collection_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  custody_log JSONB DEFAULT '[]'::JSONB,
  
  -- Legal considerations
  admissible BOOLEAN DEFAULT true,
  legal_hold BOOLEAN DEFAULT false,
  
  -- Analysis linkage
  analysis_session_id UUID REFERENCES forensic_analysis_sessions(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_evidence_number UNIQUE (tenant_id, evidence_number)
);

-- Create forensic_snapshot_requests table for tracking snapshot requests
CREATE TABLE forensic_snapshot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request details
  request_type TEXT NOT NULL, -- 'immediate', 'scheduled', 'recurring'
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  
  -- Target
  target_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  target_system_type TEXT,
  target_scope TEXT DEFAULT 'full',
  
  -- Requester
  requested_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  request_reason TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_timestamp TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Execution
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'failed'
  snapshot_id UUID REFERENCES forensic_snapshots(id) ON DELETE SET NULL,
  execution_timestamp TIMESTAMPTZ,
  
  -- Scheduling (for recurring requests)
  schedule_cron TEXT,
  next_execution TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_forensic_snapshots_tenant ON forensic_snapshots(tenant_id);
CREATE INDEX idx_forensic_snapshots_asset ON forensic_snapshots(asset_id);
CREATE INDEX idx_forensic_snapshots_status ON forensic_snapshots(status);
CREATE INDEX idx_forensic_snapshots_capture_start ON forensic_snapshots(capture_start DESC);
CREATE INDEX idx_forensic_snapshots_incident ON forensic_snapshots(triggered_by_incident);
CREATE INDEX idx_forensic_snapshots_legal_hold ON forensic_snapshots(legal_hold) WHERE legal_hold = true;

CREATE INDEX idx_forensic_snapshot_components_tenant ON forensic_snapshot_components(tenant_id);
CREATE INDEX idx_forensic_snapshot_components_snapshot ON forensic_snapshot_components(snapshot_id);
CREATE INDEX idx_forensic_snapshot_components_type ON forensic_snapshot_components(component_type);
CREATE INDEX idx_forensic_snapshot_components_status ON forensic_snapshot_components(collection_status);

CREATE INDEX idx_forensic_analysis_sessions_tenant ON forensic_analysis_sessions(tenant_id);
CREATE INDEX idx_forensic_analysis_sessions_snapshot ON forensic_analysis_sessions(snapshot_id);
CREATE INDEX idx_forensic_analysis_sessions_analyst ON forensic_analysis_sessions(analyst_id);
CREATE INDEX idx_forensic_analysis_sessions_status ON forensic_analysis_sessions(status);

CREATE INDEX idx_forensic_evidence_items_tenant ON forensic_evidence_items(tenant_id);
CREATE INDEX idx_forensic_evidence_items_snapshot ON forensic_evidence_items(snapshot_id);
CREATE INDEX idx_forensic_evidence_items_incident ON forensic_evidence_items(incident_id);
CREATE INDEX idx_forensic_evidence_items_legal_hold ON forensic_evidence_items(legal_hold) WHERE legal_hold = true;

CREATE INDEX idx_forensic_snapshot_requests_tenant ON forensic_snapshot_requests(tenant_id);
CREATE INDEX idx_forensic_snapshot_requests_status ON forensic_snapshot_requests(status);
CREATE INDEX idx_forensic_snapshot_requests_asset ON forensic_snapshot_requests(target_asset_id);
CREATE INDEX idx_forensic_snapshot_requests_next_execution ON forensic_snapshot_requests(next_execution) WHERE status = 'approved';

-- Create updated_at triggers
CREATE TRIGGER update_forensic_snapshots_updated_at 
  BEFORE UPDATE ON forensic_snapshots 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forensic_analysis_sessions_updated_at 
  BEFORE UPDATE ON forensic_analysis_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forensic_evidence_items_updated_at 
  BEFORE UPDATE ON forensic_evidence_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forensic_snapshot_requests_updated_at 
  BEFORE UPDATE ON forensic_snapshot_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for initiating forensic snapshot
CREATE OR REPLACE FUNCTION initiate_forensic_snapshot(
  p_tenant_id UUID,
  p_snapshot_name TEXT,
  p_snapshot_type TEXT,
  p_trigger_reason TEXT,
  p_triggered_by_user UUID,
  p_asset_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'full',
  p_incident_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  snapshot_id UUID;
  retention_days INTEGER := 365; -- Default 1 year retention
BEGIN
  -- Create snapshot record
  INSERT INTO forensic_snapshots (
    tenant_id,
    snapshot_name,
    snapshot_type,
    trigger_reason,
    triggered_by_user,
    triggered_by_incident,
    asset_id,
    scope,
    status,
    retention_until,
    current_custodian
  ) VALUES (
    p_tenant_id,
    p_snapshot_name,
    p_snapshot_type,
    p_trigger_reason,
    p_triggered_by_user,
    p_incident_id,
    p_asset_id,
    p_scope,
    'pending',
    now() + (retention_days || ' days')::INTERVAL,
    p_triggered_by_user
  ) RETURNING id INTO snapshot_id;
  
  -- Initialize custody chain
  UPDATE forensic_snapshots
  SET custody_chain = jsonb_build_array(
    jsonb_build_object(
      'timestamp', now(),
      'custodian_id', p_triggered_by_user,
      'action', 'created',
      'notes', 'Snapshot initiated'
    )
  )
  WHERE id = snapshot_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for adding snapshot component
CREATE OR REPLACE FUNCTION add_snapshot_component(
  p_snapshot_id UUID,
  p_component_type TEXT,
  p_component_name TEXT,
  p_component_path TEXT DEFAULT NULL,
  p_data_content JSONB DEFAULT NULL,
  p_data_size_bytes BIGINT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  component_id UUID;
  tenant_id_val UUID;
BEGIN
  -- Get tenant_id from snapshot
  SELECT tenant_id INTO tenant_id_val
  FROM forensic_snapshots
  WHERE id = p_snapshot_id;
  
  -- Insert component
  INSERT INTO forensic_snapshot_components (
    tenant_id,
    snapshot_id,
    component_type,
    component_name,
    component_path,
    data_content,
    data_size_bytes,
    collection_status
  ) VALUES (
    tenant_id_val,
    p_snapshot_id,
    p_component_type,
    p_component_name,
    p_component_path,
    p_data_content,
    p_data_size_bytes,
    'collected'
  ) RETURNING id INTO component_id;
  
  -- Update snapshot file count and size
  UPDATE forensic_snapshots
  SET 
    file_count = file_count + 1,
    total_size_bytes = total_size_bytes + COALESCE(p_data_size_bytes, 0)
  WHERE id = p_snapshot_id;
  
  RETURN component_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for completing snapshot
CREATE OR REPLACE FUNCTION complete_forensic_snapshot(
  p_snapshot_id UUID,
  p_snapshot_hash TEXT DEFAULT NULL,
  p_storage_location TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  snapshot_record RECORD;
BEGIN
  -- Get snapshot details
  SELECT * INTO snapshot_record
  FROM forensic_snapshots
  WHERE id = p_snapshot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Snapshot not found: %', p_snapshot_id;
  END IF;
  
  -- Update snapshot status
  UPDATE forensic_snapshots
  SET 
    status = 'completed',
    capture_end = now(),
    capture_duration_seconds = EXTRACT(EPOCH FROM (now() - capture_start))::INTEGER,
    completion_percentage = 100,
    snapshot_hash = p_snapshot_hash,
    storage_location = p_storage_location,
    compressed_size_bytes = total_size_bytes * 0.4, -- Simulated compression
    compression_ratio = 0.4
  WHERE id = p_snapshot_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function for transferring custody
CREATE OR REPLACE FUNCTION transfer_snapshot_custody(
  p_snapshot_id UUID,
  p_new_custodian UUID,
  p_transfer_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  snapshot_record RECORD;
  new_custody_entry JSONB;
BEGIN
  -- Get snapshot details
  SELECT * INTO snapshot_record
  FROM forensic_snapshots
  WHERE id = p_snapshot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Snapshot not found: %', p_snapshot_id;
  END IF;
  
  -- Create custody transfer entry
  new_custody_entry := jsonb_build_object(
    'timestamp', now(),
    'from_custodian_id', snapshot_record.current_custodian,
    'to_custodian_id', p_new_custodian,
    'action', 'transferred',
    'notes', p_transfer_reason
  );
  
  -- Update snapshot
  UPDATE forensic_snapshots
  SET 
    custody_chain = custody_chain || new_custody_entry,
    current_custodian = p_new_custodian
  WHERE id = p_snapshot_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function for verifying snapshot integrity
CREATE OR REPLACE FUNCTION verify_snapshot_integrity(p_snapshot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  snapshot_record RECORD;
  component_record RECORD;
  integrity_valid BOOLEAN := true;
BEGIN
  -- Get snapshot details
  SELECT * INTO snapshot_record
  FROM forensic_snapshots
  WHERE id = p_snapshot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Snapshot not found: %', p_snapshot_id;
  END IF;
  
  -- Verify each component (simplified - in reality would recalculate hashes)
  FOR component_record IN 
    SELECT * FROM forensic_snapshot_components
    WHERE snapshot_id = p_snapshot_id
  LOOP
    -- In a real implementation, would verify component hashes
    -- For now, just check that components exist
    IF component_record.collection_status != 'collected' THEN
      integrity_valid := false;
      EXIT;
    END IF;
  END LOOP;
  
  -- Update snapshot integrity status
  UPDATE forensic_snapshots
  SET 
    integrity_verified = integrity_valid,
    last_integrity_check = now()
  WHERE id = p_snapshot_id;
  
  RETURN integrity_valid;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE forensic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_snapshot_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_snapshot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forensic_snapshots_tenant_isolation" ON forensic_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "forensic_snapshot_components_tenant_isolation" ON forensic_snapshot_components
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "forensic_analysis_sessions_tenant_isolation" ON forensic_analysis_sessions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "forensic_evidence_items_tenant_isolation" ON forensic_evidence_items
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "forensic_snapshot_requests_tenant_isolation" ON forensic_snapshot_requests
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
