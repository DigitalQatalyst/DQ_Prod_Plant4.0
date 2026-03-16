-- ============================================================================
-- Migration: 044_create_pa_action_bindings
-- Feature: Process Automation - Integrate & Model
-- Description: Create pa_action_bindings table for automation action bindings
-- Requirements: AC 2.3.1-2.3.7
-- ============================================================================

-- Create pa_action_bindings table
-- Binds automation actions to control operations
CREATE TABLE IF NOT EXISTS pa_action_bindings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant isolation
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Site reference
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Action identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Action type
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('control', 'safety', 'maintenance', 'notification', 'custom')),
  
  -- Target system
  target_system VARCHAR(100) NOT NULL, -- System to execute action on
  target_tag VARCHAR(255), -- Tag to control (if applicable)
  
  -- Command
  command TEXT NOT NULL, -- Command to execute
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb, -- JSONB parameters for the action
  
  -- Execution settings
  timeout_seconds INTEGER, -- Timeout for action execution
  retry_count INTEGER DEFAULT 0, -- Number of retries on failure
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_action_binding_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT valid_timeout CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_pa_action_bindings_tenant_id ON pa_action_bindings(tenant_id);
CREATE INDEX idx_pa_action_bindings_site_id ON pa_action_bindings(site_id);
CREATE INDEX idx_pa_action_bindings_action_type ON pa_action_bindings(action_type);
CREATE INDEX idx_pa_action_bindings_target_system ON pa_action_bindings(target_system);
CREATE INDEX idx_pa_action_bindings_is_active ON pa_action_bindings(is_active);

-- Create GIN index for JSONB parameters
CREATE INDEX idx_pa_action_bindings_parameters ON pa_action_bindings USING GIN (parameters);

-- Create updated_at trigger
CREATE TRIGGER update_pa_action_bindings_updated_at
  BEFORE UPDATE ON pa_action_bindings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE pa_action_bindings IS 'Process Automation: Binds automation actions to control operations';

-- Add column comments
COMMENT ON COLUMN pa_action_bindings.name IS 'Unique name for this action binding';
COMMENT ON COLUMN pa_action_bindings.action_type IS 'Type of action: control, safety, maintenance, notification, or custom';
COMMENT ON COLUMN pa_action_bindings.target_system IS 'System to execute action on (SCADA, DCS, PLC, etc.)';
COMMENT ON COLUMN pa_action_bindings.target_tag IS 'Tag to control (if applicable)';
COMMENT ON COLUMN pa_action_bindings.command IS 'Command to execute';
COMMENT ON COLUMN pa_action_bindings.parameters IS 'JSONB parameters for the action';
COMMENT ON COLUMN pa_action_bindings.timeout_seconds IS 'Timeout for action execution in seconds';
COMMENT ON COLUMN pa_action_bindings.retry_count IS 'Number of retries on failure';
COMMENT ON COLUMN pa_action_bindings.is_active IS 'Whether this action binding is currently active';

-- Example JSONB structure for parameters:
-- {
--   "setpoint": 75.0,
--   "ramp_rate": 2.5,
--   "mode": "auto",
--   "priority": "high",
--   "notification_recipients": ["operator@example.com"],
--   "custom_fields": {
--     "field1": "value1",
--     "field2": 123
--   }
-- }
