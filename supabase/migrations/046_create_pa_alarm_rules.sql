-- Migration: Create pa_alarm_rules table
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.5.1-2.5.7
-- Description: Alarm rules table with severity levels and routing configurations

CREATE TABLE IF NOT EXISTS pa_alarm_rules (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core Fields
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alarm_type VARCHAR(50) NOT NULL CHECK (alarm_type IN ('equipment', 'process', 'safety', 'environmental', 'quality')),
  
  -- Condition Configuration
  condition_expression TEXT NOT NULL, -- e.g., "tag:temperature > 80 OR tag:pressure < 10"
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- Routing Configuration
  routing_destinations JSONB NOT NULL DEFAULT '[]', -- Array of {type: 'email'|'sms'|'webhook', destination: string}
  escalation_rules JSONB DEFAULT '{}', -- {timeout: number, escalate_to: string[]}
  
  -- Acknowledgment Configuration
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT false,
  auto_clear BOOLEAN NOT NULL DEFAULT false,
  clear_condition_expression TEXT, -- Optional condition for auto-clearing
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  tags JSONB DEFAULT '[]',
  custom_properties JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT unique_alarm_rule_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT check_auto_clear_has_condition CHECK (
    auto_clear = false OR clear_condition_expression IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_pa_alarm_rules_tenant_id ON pa_alarm_rules(tenant_id);
CREATE INDEX idx_pa_alarm_rules_alarm_type ON pa_alarm_rules(alarm_type);
CREATE INDEX idx_pa_alarm_rules_severity ON pa_alarm_rules(severity);
CREATE INDEX idx_pa_alarm_rules_enabled ON pa_alarm_rules(enabled);
CREATE INDEX idx_pa_alarm_rules_tags ON pa_alarm_rules USING GIN(tags);
CREATE INDEX idx_pa_alarm_rules_routing_destinations ON pa_alarm_rules USING GIN(routing_destinations);
CREATE INDEX idx_pa_alarm_rules_created_at ON pa_alarm_rules(created_at DESC);

-- Comments
COMMENT ON TABLE pa_alarm_rules IS 'Process Automation alarm rules for monitoring and alerting';
COMMENT ON COLUMN pa_alarm_rules.id IS 'Unique identifier for the alarm rule';
COMMENT ON COLUMN pa_alarm_rules.tenant_id IS 'Reference to the tenant that owns this alarm rule';
COMMENT ON COLUMN pa_alarm_rules.name IS 'Human-readable name for the alarm rule';
COMMENT ON COLUMN pa_alarm_rules.description IS 'Detailed description of the alarm rule purpose';
COMMENT ON COLUMN pa_alarm_rules.alarm_type IS 'Type of alarm: equipment, process, safety, environmental, or quality';
COMMENT ON COLUMN pa_alarm_rules.condition_expression IS 'Boolean expression that determines when alarm fires';
COMMENT ON COLUMN pa_alarm_rules.severity IS 'Alarm severity level: critical, high, medium, low, or info';
COMMENT ON COLUMN pa_alarm_rules.routing_destinations IS 'Array of notification destinations (email, SMS, webhook)';
COMMENT ON COLUMN pa_alarm_rules.escalation_rules IS 'Configuration for alarm escalation behavior';
COMMENT ON COLUMN pa_alarm_rules.requires_acknowledgment IS 'Whether alarm requires manual acknowledgment';
COMMENT ON COLUMN pa_alarm_rules.auto_clear IS 'Whether alarm auto-clears when condition resolves';
COMMENT ON COLUMN pa_alarm_rules.clear_condition_expression IS 'Condition expression for auto-clearing alarm';
COMMENT ON COLUMN pa_alarm_rules.enabled IS 'Whether the alarm rule is currently active';
COMMENT ON COLUMN pa_alarm_rules.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN pa_alarm_rules.custom_properties IS 'Additional metadata as key-value pairs';

-- NO RLS POLICIES (local development only)
-- All tables unrestricted for local development
