-- Extend security audit logging for comprehensive logging and configuration change tracking
-- Requirements: 6.1, 6.2

-- Add new event types for comprehensive logging
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'file_access';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'file_modification';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'network_access';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'protocol_communication';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'backup_operation';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'restore_operation';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'maintenance_action';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'emergency_action';

-- Create configuration_changes table for detailed change tracking
CREATE TABLE configuration_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Change identification
  change_type TEXT NOT NULL, -- 'asset_config', 'network_config', 'security_policy', 'user_settings', 'system_config'
  component_type TEXT NOT NULL, -- 'protection_relay', 'rtu', 'scada_node', 'gateway', 'firewall', etc.
  component_id TEXT NOT NULL,
  component_name TEXT,
  
  -- Asset context (for transmission equipment)
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  zone_id TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Change details
  configuration_path TEXT NOT NULL, -- Path/location of the configuration
  parameter_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  
  -- Change metadata
  change_method TEXT, -- 'manual', 'automated', 'script', 'api', 'emergency'
  change_source TEXT, -- 'hmi', 'engineering_station', 'remote_access', 'maintenance_tool'
  protocol_used TEXT, -- IEC61850, DNP3, etc.
  
  -- Approval and validation
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approval_timestamp TIMESTAMPTZ,
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'failed', 'bypassed'
  validation_errors TEXT[],
  
  -- Impact assessment
  safety_impact TEXT, -- 'none', 'low', 'medium', 'high', 'critical'
  operational_impact TEXT, -- 'none', 'low', 'medium', 'high', 'critical'
  security_impact TEXT, -- 'none', 'low', 'medium', 'high', 'critical'
  affected_systems TEXT[],
  
  -- Rollback information
  rollback_possible BOOLEAN DEFAULT true,
  rollback_procedure TEXT,
  rollback_executed BOOLEAN DEFAULT false,
  rollback_timestamp TIMESTAMPTZ,
  rollback_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- User and timing
  changed_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  change_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Audit correlation
  audit_log_id UUID REFERENCES security_audit_log(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_change_timestamp CHECK (change_timestamp <= now() + INTERVAL '1 hour'),
  CONSTRAINT valid_approval_logic CHECK (
    (requires_approval = false) OR 
    (requires_approval = true AND approved_by IS NOT NULL AND approval_timestamp IS NOT NULL)
  )
);

-- Create log_correlation_rules table for automatic log correlation
CREATE TABLE log_correlation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Correlation criteria
  event_pattern JSONB NOT NULL, -- Pattern to match events for correlation
  time_window_minutes INTEGER NOT NULL DEFAULT 5,
  correlation_key TEXT NOT NULL, -- Field to use for correlation (e.g., 'asset_id', 'user_id')
  
  -- Rule configuration
  minimum_events INTEGER DEFAULT 2,
  maximum_events INTEGER DEFAULT 100,
  severity_threshold audit_severity DEFAULT 'warning',
  
  -- Actions
  create_incident BOOLEAN DEFAULT false,
  escalate_severity BOOLEAN DEFAULT false,
  notify_users UUID[] DEFAULT '{}',
  
  -- Rule status
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  
  created_by UUID NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_correlation_rule_name UNIQUE (tenant_id, name),
  CONSTRAINT valid_time_window CHECK (time_window_minutes > 0 AND time_window_minutes <= 1440),
  CONSTRAINT valid_event_counts CHECK (minimum_events > 0 AND maximum_events >= minimum_events)
);

-- Create audit_log_aggregations table for performance optimization
CREATE TABLE audit_log_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Aggregation period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  aggregation_type TEXT NOT NULL, -- 'hourly', 'daily', 'weekly'
  
  -- Aggregated metrics
  total_events INTEGER NOT NULL DEFAULT 0,
  events_by_type JSONB DEFAULT '{}',
  events_by_severity JSONB DEFAULT '{}',
  events_by_outcome JSONB DEFAULT '{}',
  unique_users INTEGER DEFAULT 0,
  unique_assets INTEGER DEFAULT 0,
  
  -- Risk metrics
  high_risk_events INTEGER DEFAULT 0,
  failed_authentications INTEGER DEFAULT 0,
  policy_violations INTEGER DEFAULT 0,
  configuration_changes INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_processing_time_ms NUMERIC(10,2),
  max_processing_time_ms NUMERIC(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_aggregation_period CHECK (period_end > period_start),
  CONSTRAINT unique_aggregation_period UNIQUE (tenant_id, period_start, period_end, aggregation_type)
);

-- Create indexes for performance
CREATE INDEX idx_configuration_changes_tenant ON configuration_changes(tenant_id);
CREATE INDEX idx_configuration_changes_timestamp ON configuration_changes(change_timestamp DESC);
CREATE INDEX idx_configuration_changes_component ON configuration_changes(component_type, component_id);
CREATE INDEX idx_configuration_changes_asset ON configuration_changes(asset_id);
CREATE INDEX idx_configuration_changes_user ON configuration_changes(changed_by);
CREATE INDEX idx_configuration_changes_approval ON configuration_changes(requires_approval, approved_by);
CREATE INDEX idx_configuration_changes_rollback ON configuration_changes(rollback_possible, rollback_executed);

CREATE INDEX idx_log_correlation_rules_tenant ON log_correlation_rules(tenant_id);
CREATE INDEX idx_log_correlation_rules_active ON log_correlation_rules(active, priority);

CREATE INDEX idx_audit_log_aggregations_tenant ON audit_log_aggregations(tenant_id);
CREATE INDEX idx_audit_log_aggregations_period ON audit_log_aggregations(period_start, period_end);
CREATE INDEX idx_audit_log_aggregations_type ON audit_log_aggregations(aggregation_type);

-- Add new columns to security_audit_log for enhanced correlation
ALTER TABLE security_audit_log 
ADD COLUMN IF NOT EXISTS configuration_change_id UUID REFERENCES configuration_changes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS correlation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'internal'; -- 'public', 'internal', 'confidential', 'restricted'

-- Create indexes for new columns
CREATE INDEX idx_security_audit_log_config_change ON security_audit_log(configuration_change_id);
CREATE INDEX idx_security_audit_log_correlation_score ON security_audit_log(correlation_score) WHERE correlation_score > 0;
CREATE INDEX idx_security_audit_log_classification ON security_audit_log(data_classification);

-- Create function for automatic log correlation
CREATE OR REPLACE FUNCTION correlate_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  correlated_count INTEGER := 0;
  rule_record RECORD;
  correlation_id_val TEXT;
BEGIN
  -- Process each active correlation rule
  FOR rule_record IN 
    SELECT * FROM log_correlation_rules 
    WHERE active = true 
    ORDER BY priority ASC
  LOOP
    -- Generate correlation ID for this batch
    correlation_id_val := 'corr_' || rule_record.id || '_' || extract(epoch from now())::text;
    
    -- Find and correlate matching events
    WITH matching_events AS (
      SELECT id, event_timestamp
      FROM security_audit_log
      WHERE tenant_id = rule_record.tenant_id
        AND correlation_id IS NULL
        AND event_timestamp >= now() - (rule_record.time_window_minutes || ' minutes')::INTERVAL
        AND severity >= rule_record.severity_threshold
        -- Additional pattern matching would be implemented based on event_pattern JSONB
      ORDER BY event_timestamp DESC
      LIMIT rule_record.maximum_events
    ),
    correlated_events AS (
      UPDATE security_audit_log 
      SET 
        correlation_id = correlation_id_val,
        correlation_score = 
          CASE 
            WHEN severity = 'critical' THEN 100
            WHEN severity = 'high' THEN 75
            WHEN severity = 'warning' THEN 50
            ELSE 25
          END
      WHERE id IN (SELECT id FROM matching_events)
      RETURNING 1
    )
    SELECT count(*) INTO correlated_count FROM correlated_events;
    
  END LOOP;
  
  RETURN correlated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for audit log aggregation
CREATE OR REPLACE FUNCTION aggregate_audit_logs(aggregation_period TEXT DEFAULT 'hourly')
RETURNS INTEGER AS $$
DECLARE
  aggregated_count INTEGER := 0;
  tenant_record RECORD;
  period_start_val TIMESTAMPTZ;
  period_end_val TIMESTAMPTZ;
BEGIN
  -- Determine aggregation period
  CASE aggregation_period
    WHEN 'hourly' THEN
      period_start_val := date_trunc('hour', now() - INTERVAL '1 hour');
      period_end_val := date_trunc('hour', now());
    WHEN 'daily' THEN
      period_start_val := date_trunc('day', now() - INTERVAL '1 day');
      period_end_val := date_trunc('day', now());
    WHEN 'weekly' THEN
      period_start_val := date_trunc('week', now() - INTERVAL '1 week');
      period_end_val := date_trunc('week', now());
    ELSE
      RAISE EXCEPTION 'Invalid aggregation period: %', aggregation_period;
  END CASE;
  
  -- Process each tenant
  FOR tenant_record IN SELECT id FROM tenants LOOP
    INSERT INTO audit_log_aggregations (
      tenant_id,
      period_start,
      period_end,
      aggregation_type,
      total_events,
      events_by_type,
      events_by_severity,
      events_by_outcome,
      unique_users,
      unique_assets,
      high_risk_events,
      failed_authentications,
      policy_violations,
      configuration_changes,
      avg_processing_time_ms,
      max_processing_time_ms
    )
    SELECT 
      tenant_record.id,
      period_start_val,
      period_end_val,
      aggregation_period,
      COUNT(*),
      jsonb_object_agg(event_type, type_count),
      jsonb_object_agg(severity, severity_count),
      jsonb_object_agg(outcome, outcome_count),
      COUNT(DISTINCT user_id),
      COUNT(DISTINCT asset_id),
      COUNT(*) FILTER (WHERE risk_score >= 70),
      COUNT(*) FILTER (WHERE event_type = 'authentication' AND outcome = 'failure'),
      COUNT(*) FILTER (WHERE event_category = 'policy' AND outcome = 'denied'),
      COUNT(*) FILTER (WHERE event_type = 'configuration_change'),
      AVG(processing_time_ms),
      MAX(processing_time_ms)
    FROM (
      SELECT 
        sal.*,
        COUNT(*) OVER (PARTITION BY event_type) as type_count,
        COUNT(*) OVER (PARTITION BY severity) as severity_count,
        COUNT(*) OVER (PARTITION BY outcome) as outcome_count
      FROM security_audit_log sal
      WHERE sal.tenant_id = tenant_record.id
        AND sal.event_timestamp >= period_start_val
        AND sal.event_timestamp < period_end_val
    ) aggregated_data
    GROUP BY tenant_record.id
    ON CONFLICT (tenant_id, period_start, period_end, aggregation_type) 
    DO NOTHING;
    
    GET DIAGNOSTICS aggregated_count = ROW_COUNT;
  END LOOP;
  
  RETURN aggregated_count;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_configuration_changes_updated_at 
  BEFORE UPDATE ON configuration_changes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_log_correlation_rules_updated_at 
  BEFORE UPDATE ON log_correlation_rules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for automatic audit log creation on configuration changes
CREATE OR REPLACE FUNCTION create_audit_log_for_config_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (
    tenant_id,
    event_type,
    event_category,
    event_name,
    event_description,
    outcome,
    severity,
    user_id,
    target_type,
    target_id,
    target_name,
    asset_id,
    zone_id,
    action_performed,
    old_values,
    new_values,
    additional_data,
    configuration_change_id,
    risk_score
  ) VALUES (
    NEW.tenant_id,
    'configuration_change',
    'system',
    'Configuration Modified',
    'Configuration parameter ' || NEW.parameter_name || ' changed on ' || NEW.component_type,
    CASE WHEN NEW.validation_status = 'validated' THEN 'success'::audit_outcome ELSE 'partial'::audit_outcome END,
    CASE 
      WHEN NEW.security_impact = 'critical' THEN 'critical'::audit_severity
      WHEN NEW.security_impact = 'high' THEN 'high'::audit_severity
      WHEN NEW.security_impact = 'medium' THEN 'warning'::audit_severity
      ELSE 'info'::audit_severity
    END,
    NEW.changed_by,
    NEW.component_type,
    NEW.component_id,
    NEW.component_name,
    NEW.asset_id,
    NEW.zone_id,
    'Parameter changed: ' || NEW.parameter_name,
    NEW.old_value,
    NEW.new_value,
    jsonb_build_object(
      'change_method', NEW.change_method,
      'change_source', NEW.change_source,
      'protocol_used', NEW.protocol_used,
      'safety_impact', NEW.safety_impact,
      'operational_impact', NEW.operational_impact
    ),
    NEW.id,
    CASE 
      WHEN NEW.security_impact = 'critical' THEN 90
      WHEN NEW.security_impact = 'high' THEN 70
      WHEN NEW.security_impact = 'medium' THEN 50
      WHEN NEW.security_impact = 'low' THEN 30
      ELSE 10
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER configuration_changes_audit_trigger
  AFTER INSERT ON configuration_changes
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log_for_config_change();