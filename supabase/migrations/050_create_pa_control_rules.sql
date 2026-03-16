-- Migration: Create pa_control_rules table
-- Description: Continuous control logic for maintaining operational parameters
-- AC: 2.9.1-2.9.7

CREATE TABLE pa_control_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('if-then', 'when-then', 'continuous')),
  condition_expression TEXT NOT NULL,
  action_binding_ids UUID[] NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_pa_control_rules_tenant ON pa_control_rules(tenant_id);
CREATE INDEX idx_pa_control_rules_enabled ON pa_control_rules(tenant_id, enabled);

-- Triggers for updated_at
CREATE TRIGGER set_pa_control_rules_updated_at
BEFORE UPDATE ON pa_control_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
