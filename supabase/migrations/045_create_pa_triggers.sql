-- Migration: Create pa_triggers table
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.4.1-2.4.7
-- Description: Triggers table with condition expressions and action binding references

CREATE TABLE IF NOT EXISTS pa_triggers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core Fields
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('threshold', 'change', 'pattern', 'schedule', 'manual')),
  
  -- Condition Configuration
  condition_expression TEXT NOT NULL, -- e.g., "tag:voltage > 240 AND tag:current > 50"
  evaluation_interval INTEGER, -- in seconds, null for event-driven triggers
  
  -- Action Bindings
  action_binding_ids UUID[] NOT NULL DEFAULT '{}', -- References pa_action_bindings
  
  -- Priority and Status
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
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
  CONSTRAINT unique_trigger_name_per_tenant UNIQUE (tenant_id, name)
);

-- Indexes for performance
CREATE INDEX idx_pa_triggers_tenant_id ON pa_triggers(tenant_id);
CREATE INDEX idx_pa_triggers_trigger_type ON pa_triggers(trigger_type);
CREATE INDEX idx_pa_triggers_enabled ON pa_triggers(enabled);
CREATE INDEX idx_pa_triggers_priority ON pa_triggers(priority);
CREATE INDEX idx_pa_triggers_action_binding_ids ON pa_triggers USING GIN(action_binding_ids);
CREATE INDEX idx_pa_triggers_tags ON pa_triggers USING GIN(tags);
CREATE INDEX idx_pa_triggers_created_at ON pa_triggers(created_at DESC);

-- Comments
COMMENT ON TABLE pa_triggers IS 'Process Automation triggers for conditional automation';
COMMENT ON COLUMN pa_triggers.id IS 'Unique identifier for the trigger';
COMMENT ON COLUMN pa_triggers.tenant_id IS 'Reference to the tenant that owns this trigger';
COMMENT ON COLUMN pa_triggers.name IS 'Human-readable name for the trigger';
COMMENT ON COLUMN pa_triggers.description IS 'Detailed description of the trigger purpose';
COMMENT ON COLUMN pa_triggers.trigger_type IS 'Type of trigger: threshold, change, pattern, schedule, or manual';
COMMENT ON COLUMN pa_triggers.condition_expression IS 'Boolean expression that determines when trigger fires';
COMMENT ON COLUMN pa_triggers.evaluation_interval IS 'How often to evaluate condition (seconds), null for event-driven';
COMMENT ON COLUMN pa_triggers.action_binding_ids IS 'Array of action binding IDs to execute when triggered';
COMMENT ON COLUMN pa_triggers.priority IS 'Execution priority: critical, high, medium, or low';
COMMENT ON COLUMN pa_triggers.enabled IS 'Whether the trigger is currently active';
COMMENT ON COLUMN pa_triggers.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN pa_triggers.custom_properties IS 'Additional metadata as key-value pairs';

-- NO RLS POLICIES (local development only)
-- All tables unrestricted for local development
