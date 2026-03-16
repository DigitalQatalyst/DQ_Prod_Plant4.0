-- ============================================================================
-- Migration: 043_create_pa_control_models
-- Feature: Process Automation - Integrate & Model
-- Description: Create pa_control_models table for equipment control state machines
-- Requirements: AC 2.2.1-2.2.7
-- ============================================================================

-- Create pa_control_models table
-- Defines state machines for equipment control
CREATE TABLE IF NOT EXISTS pa_control_models (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant isolation
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Site reference
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Model identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Equipment type
  equipment_type VARCHAR(100) NOT NULL, -- e.g., "breaker", "transformer", "generator"
  
  -- State machine
  current_state VARCHAR(100) NOT NULL, -- Current state in the state machine
  states JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of state definitions
  transitions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of valid state transitions
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_control_model_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_pa_control_models_tenant_id ON pa_control_models(tenant_id);
CREATE INDEX idx_pa_control_models_site_id ON pa_control_models(site_id);
CREATE INDEX idx_pa_control_models_equipment_type ON pa_control_models(equipment_type);
CREATE INDEX idx_pa_control_models_is_active ON pa_control_models(is_active);
CREATE INDEX idx_pa_control_models_current_state ON pa_control_models(current_state);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_pa_control_models_states ON pa_control_models USING GIN (states);
CREATE INDEX idx_pa_control_models_transitions ON pa_control_models USING GIN (transitions);

-- Create updated_at trigger
CREATE TRIGGER update_pa_control_models_updated_at
  BEFORE UPDATE ON pa_control_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE pa_control_models IS 'Process Automation: Defines state machines for equipment control';

-- Add column comments
COMMENT ON COLUMN pa_control_models.name IS 'Unique name for this control model';
COMMENT ON COLUMN pa_control_models.equipment_type IS 'Type of equipment (breaker, transformer, generator, etc.)';
COMMENT ON COLUMN pa_control_models.current_state IS 'Current state in the state machine';
COMMENT ON COLUMN pa_control_models.states IS 'JSONB array of state definitions with name, display_name, description, color, is_safe_state';
COMMENT ON COLUMN pa_control_models.transitions IS 'JSONB array of valid state transitions with from_state, to_state, trigger, conditions, actions, requires_approval';
COMMENT ON COLUMN pa_control_models.is_active IS 'Whether this control model is currently active';

-- Example JSONB structure for states:
-- [
--   {
--     "name": "off",
--     "display_name": "Off",
--     "description": "Equipment is off",
--     "color": "#gray",
--     "is_safe_state": true
--   },
--   {
--     "name": "on",
--     "display_name": "On",
--     "description": "Equipment is on",
--     "color": "#green",
--     "is_safe_state": false
--   }
-- ]

-- Example JSONB structure for transitions:
-- [
--   {
--     "from_state": "off",
--     "to_state": "on",
--     "trigger": "start_command",
--     "conditions": ["voltage_ok", "temperature_normal"],
--     "actions": ["close_breaker", "log_event"],
--     "requires_approval": false
--   },
--   {
--     "from_state": "on",
--     "to_state": "off",
--     "trigger": "stop_command",
--     "conditions": [],
--     "actions": ["open_breaker", "log_event"],
--     "requires_approval": true
--   }
-- ]
