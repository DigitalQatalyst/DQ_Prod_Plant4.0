-- Create energy alerts schema for transmission EMS
-- Requirements: 8.1, 8.2, 8.4, 8.5

-- Create enum types for energy anomalies (if not exists)
DO $$ BEGIN
  CREATE TYPE anomaly_type AS ENUM (
    'consumption_spike',
    'consumption_drop', 
    'efficiency_drop',
    'pattern_deviation'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- If type already existed, make sure we add these new values
ALTER TYPE anomaly_type ADD VALUE IF NOT EXISTS 'consumption_spike';
ALTER TYPE anomaly_type ADD VALUE IF NOT EXISTS 'consumption_drop';
ALTER TYPE anomaly_type ADD VALUE IF NOT EXISTS 'efficiency_drop';
ALTER TYPE anomaly_type ADD VALUE IF NOT EXISTS 'pattern_deviation';

DO $$ BEGIN
  CREATE TYPE severity_level AS ENUM (
    'Low',
    'Medium',
    'High',
    'Critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create energy_anomalies table if it doesn't exist
CREATE TABLE IF NOT EXISTS energy_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES energy_meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  anomaly_type anomaly_type NOT NULL,
  magnitude_pct DECIMAL(5,2) NOT NULL,
  severity severity_level NOT NULL,
  description TEXT,
  baseline_value DECIMAL(12,4),
  actual_value DECIMAL(12,4),
  deviation_value DECIMAL(12,4),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  estimated_cost_impact DECIMAL(12,2),
  root_cause TEXT,
  corrective_actions TEXT,
  detection_method VARCHAR(100), -- 'statistical', 'ml_model', 'rule_based'
  confidence_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Check constraints
  CONSTRAINT ck_energy_anomalies_resolved_at CHECK (resolved = false OR resolved_at IS NOT NULL),
  CONSTRAINT ck_energy_anomalies_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- Create indexes for energy_anomalies
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_meter_timestamp ON energy_anomalies(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_severity ON energy_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_resolved ON energy_anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_type ON energy_anomalies(anomaly_type);

-- Enable RLS for energy_anomalies
ALTER TABLE energy_anomalies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for energy_anomalies
CREATE POLICY energy_anomalies_tenant_isolation ON energy_anomalies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM energy_meters em 
      WHERE em.id = energy_anomalies.meter_id 
      AND em.org_id = current_setting('app.current_tenant_id')::UUID
    )
  );

-- Grant permissions for energy_anomalies
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_anomalies TO authenticated;

-- Create enum types for energy alerts
CREATE TYPE energy_alert_source_type AS ENUM (
  'anomaly',
  'pq_event'
);

CREATE TYPE energy_alert_state AS ENUM (
  'open',
  'acked', 
  'closed'
);

CREATE TYPE energy_alert_severity AS ENUM (
  'Low',
  'Medium',
  'High',
  'Critical'
);

-- Create energy_alerts table
CREATE TABLE IF NOT EXISTS energy_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type energy_alert_source_type NOT NULL,
  source_id UUID NOT NULL,
  alert_state energy_alert_state NOT NULL DEFAULT 'open',
  severity energy_alert_severity NOT NULL,
  assigned_to UUID,
  ack_at TIMESTAMPTZ,
  close_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Natural key constraint (source_type, source_id) must be unique
  CONSTRAINT uk_energy_alerts_source UNIQUE (source_type, source_id),
  
  -- Check constraints for timestamp ordering
  CONSTRAINT ck_energy_alerts_ack_after_created CHECK (ack_at IS NULL OR ack_at >= created_at),
  CONSTRAINT ck_energy_alerts_close_after_ack CHECK (close_at IS NULL OR ack_at IS NULL OR close_at >= ack_at),
  CONSTRAINT ck_energy_alerts_close_after_created CHECK (close_at IS NULL OR close_at >= created_at)
);

-- Create energy_alert_activity table for audit trail
CREATE TABLE IF NOT EXISTS energy_alert_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES energy_alerts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'created', 'acknowledged', 'assigned', 'note_added', 'closed'
  user_id UUID,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_energy_alerts_org_id ON energy_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_alerts_state ON energy_alerts(alert_state);
CREATE INDEX IF NOT EXISTS idx_energy_alerts_severity ON energy_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_energy_alerts_assigned_to ON energy_alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_energy_alerts_created_at ON energy_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_alerts_sla_due_at ON energy_alerts(sla_due_at) WHERE sla_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_alerts_source ON energy_alerts(source_type, source_id);

-- Index for filtering open alerts (requirement 8.4)
CREATE INDEX IF NOT EXISTS idx_energy_alerts_open ON energy_alerts(alert_state) WHERE alert_state = 'open';

-- Indexes for energy_alert_activity
CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_alert_id ON energy_alert_activity(alert_id);
CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_created_at ON energy_alert_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_user_id ON energy_alert_activity(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_energy_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_energy_alerts_updated_at
  BEFORE UPDATE ON energy_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_alerts_updated_at();

-- Create trigger to log activity when alerts are modified
CREATE OR REPLACE FUNCTION log_energy_alert_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO energy_alert_activity (alert_id, activity_type, new_value)
    VALUES (NEW.id, 'created', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  
  -- Log updates
  IF TG_OP = 'UPDATE' THEN
    -- Log acknowledgment
    IF OLD.alert_state != NEW.alert_state AND NEW.alert_state = 'acked' THEN
      INSERT INTO energy_alert_activity (alert_id, activity_type, old_value, new_value)
      VALUES (NEW.id, 'acknowledged', 
              jsonb_build_object('alert_state', OLD.alert_state, 'ack_at', OLD.ack_at),
              jsonb_build_object('alert_state', NEW.alert_state, 'ack_at', NEW.ack_at));
    END IF;
    
    -- Log closure
    IF OLD.alert_state != NEW.alert_state AND NEW.alert_state = 'closed' THEN
      INSERT INTO energy_alert_activity (alert_id, activity_type, old_value, new_value)
      VALUES (NEW.id, 'closed',
              jsonb_build_object('alert_state', OLD.alert_state, 'close_at', OLD.close_at),
              jsonb_build_object('alert_state', NEW.alert_state, 'close_at', NEW.close_at));
    END IF;
    
    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO energy_alert_activity (alert_id, activity_type, old_value, new_value)
      VALUES (NEW.id, 'assigned',
              jsonb_build_object('assigned_to', OLD.assigned_to),
              jsonb_build_object('assigned_to', NEW.assigned_to));
    END IF;
    
    -- Log notes changes
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO energy_alert_activity (alert_id, activity_type, old_value, new_value)
      VALUES (NEW.id, 'note_added',
              jsonb_build_object('notes', OLD.notes),
              jsonb_build_object('notes', NEW.notes));
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_energy_alert_activity
  AFTER INSERT OR UPDATE ON energy_alerts
  FOR EACH ROW
  EXECUTE FUNCTION log_energy_alert_activity();

-- Enable Row Level Security
ALTER TABLE energy_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_alert_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for energy_alerts
CREATE POLICY energy_alerts_tenant_isolation ON energy_alerts
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for energy_alert_activity  
CREATE POLICY energy_alert_activity_tenant_isolation ON energy_alert_activity
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM energy_alerts ea 
      WHERE ea.id = energy_alert_activity.alert_id 
      AND ea.org_id = current_setting('app.current_tenant_id')::UUID
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_alerts TO authenticated;
GRANT SELECT, INSERT ON energy_alert_activity TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE energy_alerts IS 'Energy alerts for anomalies and power quality events with state tracking';
COMMENT ON TABLE energy_alert_activity IS 'Audit trail for energy alert state changes and activities';
COMMENT ON CONSTRAINT uk_energy_alerts_source ON energy_alerts IS 'Natural key: each source can only have one alert';
COMMENT ON CONSTRAINT ck_energy_alerts_ack_after_created ON energy_alerts IS 'Acknowledgment timestamp must be after creation';
COMMENT ON CONSTRAINT ck_energy_alerts_close_after_ack ON energy_alerts IS 'Close timestamp must be after acknowledgment';
COMMENT ON CONSTRAINT ck_energy_alerts_close_after_created ON energy_alerts IS 'Close timestamp must be after creation';