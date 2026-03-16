-- ============================================================================
-- Seed: 103_pa_control_models
-- Feature: Process Automation - Integrate & Model
-- Description: Seed data for pa_control_models table
-- Requirements: AC 2.2.1-2.2.7
-- ============================================================================

-- Create 8 control models with state machines for breakers, transformers, generators, etc.
-- Uses CTE pattern to reference tenant and sites dynamically

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
),
dubai_main AS (
  SELECT id FROM sites WHERE name = 'Dubai Main Substation' LIMIT 1
),
jebel_ali AS (
  SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' LIMIT 1
),
al_aweer AS (
  SELECT id FROM sites WHERE name = 'Al Aweer Regional Hub' LIMIT 1
)
INSERT INTO pa_control_models (
  tenant_id,
  site_id,
  name,
  description,
  equipment_type,
  current_state,
  states,
  transitions,
  is_active,
  created_by,
  updated_by
)
SELECT
  tenant.id,
  v.site_id,
  v.name,
  v.description,
  v.equipment_type,
  v.current_state,
  v.states::jsonb,
  v.transitions::jsonb,
  v.is_active,
  'system',
  'system'
FROM tenant
CROSS JOIN (VALUES
  -- Circuit Breaker Control Model
  (
    (SELECT id FROM dubai_main),
    'Circuit Breaker Control',
    'State machine for circuit breaker control operations',
    'breaker',
    'tripped',
    '[
      {"name": "open", "display_name": "Open", "description": "Breaker is open", "color": "#ef4444", "is_safe_state": true},
      {"name": "closed", "display_name": "Closed", "description": "Breaker is closed", "color": "#22c55e", "is_safe_state": false},
      {"name": "tripped", "display_name": "Tripped", "description": "Breaker has tripped", "color": "#f59e0b", "is_safe_state": true},
      {"name": "maintenance", "display_name": "Maintenance", "description": "Breaker in maintenance mode", "color": "#6b7280", "is_safe_state": true}
    ]',
    '[
      {"from_state": "open", "to_state": "closed", "trigger": "close_command", "conditions": ["voltage_ok", "no_fault"], "actions": ["close_breaker", "log_event"], "requires_approval": false},
      {"from_state": "closed", "to_state": "open", "trigger": "open_command", "conditions": [], "actions": ["open_breaker", "log_event"], "requires_approval": false},
      {"from_state": "closed", "to_state": "tripped", "trigger": "fault_detected", "conditions": ["overcurrent", "fault_present"], "actions": ["trip_breaker", "raise_alarm", "log_event"], "requires_approval": false},
      {"from_state": "tripped", "to_state": "open", "trigger": "reset_command", "conditions": ["fault_cleared"], "actions": ["reset_breaker", "log_event"], "requires_approval": true},
      {"from_state": "open", "to_state": "maintenance", "trigger": "maintenance_mode", "conditions": [], "actions": ["lock_breaker", "notify_operators"], "requires_approval": true},
      {"from_state": "maintenance", "to_state": "open", "trigger": "exit_maintenance", "conditions": ["maintenance_complete"], "actions": ["unlock_breaker", "notify_operators"], "requires_approval": true}
    ]',
    true
  ),
  
  -- Transformer Control Model
  (
    (SELECT id FROM dubai_main),
    'Transformer Load Control',
    'State machine for transformer load management',
    'transformer',
    'normal',
    '[
      {"name": "offline", "display_name": "Offline", "description": "Transformer is offline", "color": "#6b7280", "is_safe_state": true},
      {"name": "normal", "display_name": "Normal", "description": "Normal operation", "color": "#22c55e", "is_safe_state": false},
      {"name": "overload", "display_name": "Overload", "description": "Transformer is overloaded", "color": "#f59e0b", "is_safe_state": false},
      {"name": "critical", "display_name": "Critical", "description": "Critical overload condition", "color": "#ef4444", "is_safe_state": false},
      {"name": "cooling", "display_name": "Cooling", "description": "Cooling down after overload", "color": "#3b82f6", "is_safe_state": false}
    ]',
    '[
      {"from_state": "offline", "to_state": "normal", "trigger": "energize", "conditions": ["voltage_ok", "oil_temp_ok"], "actions": ["energize_transformer", "log_event"], "requires_approval": true},
      {"from_state": "normal", "to_state": "overload", "trigger": "load_threshold_exceeded", "conditions": ["load_gt_80_percent"], "actions": ["raise_warning", "log_event"], "requires_approval": false},
      {"from_state": "overload", "to_state": "critical", "trigger": "critical_threshold_exceeded", "conditions": ["load_gt_95_percent"], "actions": ["raise_alarm", "notify_operators"], "requires_approval": false},
      {"from_state": "critical", "to_state": "cooling", "trigger": "load_reduced", "conditions": ["load_lt_80_percent"], "actions": ["clear_alarm", "log_event"], "requires_approval": false},
      {"from_state": "cooling", "to_state": "normal", "trigger": "temp_normalized", "conditions": ["oil_temp_ok"], "actions": ["clear_warning", "log_event"], "requires_approval": false},
      {"from_state": "overload", "to_state": "normal", "trigger": "load_normalized", "conditions": ["load_lt_70_percent"], "actions": ["clear_warning", "log_event"], "requires_approval": false}
    ]',
    true
  ),
  
  -- Generator Control Model
  (
    (SELECT id FROM jebel_ali),
    'Generator Start-Stop Control',
    'State machine for generator startup and shutdown sequences',
    'generator',
    'running',
    '[
      {"name": "stopped", "display_name": "Stopped", "description": "Generator is stopped", "color": "#6b7280", "is_safe_state": true},
      {"name": "starting", "display_name": "Starting", "description": "Generator is starting up", "color": "#3b82f6", "is_safe_state": false},
      {"name": "running", "display_name": "Running", "description": "Generator is running", "color": "#22c55e", "is_safe_state": false},
      {"name": "stopping", "display_name": "Stopping", "description": "Generator is shutting down", "color": "#f59e0b", "is_safe_state": false},
      {"name": "fault", "display_name": "Fault", "description": "Generator fault condition", "color": "#ef4444", "is_safe_state": true}
    ]',
    '[
      {"from_state": "stopped", "to_state": "starting", "trigger": "start_command", "conditions": ["fuel_ok", "oil_pressure_ok"], "actions": ["engage_starter", "log_event"], "requires_approval": false},
      {"from_state": "starting", "to_state": "running", "trigger": "speed_reached", "conditions": ["rpm_gt_threshold", "voltage_stable"], "actions": ["sync_to_grid", "log_event"], "requires_approval": false},
      {"from_state": "running", "to_state": "stopping", "trigger": "stop_command", "conditions": [], "actions": ["reduce_load", "log_event"], "requires_approval": false},
      {"from_state": "stopping", "to_state": "stopped", "trigger": "speed_zero", "conditions": ["rpm_eq_zero"], "actions": ["disengage_fuel", "log_event"], "requires_approval": false},
      {"from_state": "running", "to_state": "fault", "trigger": "fault_detected", "conditions": ["fault_present"], "actions": ["emergency_stop", "raise_alarm"], "requires_approval": false},
      {"from_state": "fault", "to_state": "stopped", "trigger": "fault_cleared", "conditions": ["fault_resolved"], "actions": ["reset_fault", "log_event"], "requires_approval": true}
    ]',
    true
  ),
  
  -- Capacitor Bank Control Model
  (
    (SELECT id FROM jebel_ali),
    'Capacitor Bank Switching',
    'State machine for reactive power compensation',
    'capacitor_bank',
    'disconnected',
    '[
      {"name": "disconnected", "display_name": "Disconnected", "description": "Capacitor bank is disconnected", "color": "#6b7280", "is_safe_state": true},
      {"name": "connected", "display_name": "Connected", "description": "Capacitor bank is connected", "color": "#22c55e", "is_safe_state": false},
      {"name": "switching", "display_name": "Switching", "description": "Switching in progress", "color": "#3b82f6", "is_safe_state": false}
    ]',
    '[
      {"from_state": "disconnected", "to_state": "switching", "trigger": "connect_command", "conditions": ["voltage_ok", "no_harmonics"], "actions": ["pre_charge", "log_event"], "requires_approval": false},
      {"from_state": "switching", "to_state": "connected", "trigger": "switch_complete", "conditions": ["charge_complete"], "actions": ["close_switch", "log_event"], "requires_approval": false},
      {"from_state": "connected", "to_state": "disconnected", "trigger": "disconnect_command", "conditions": [], "actions": ["open_switch", "discharge", "log_event"], "requires_approval": false}
    ]',
    false
  ),
  
  -- Voltage Regulator Control Model
  (
    (SELECT id FROM al_aweer),
    'Voltage Regulator Control',
    'State machine for automatic voltage regulation',
    'voltage_regulator',
    'auto',
    '[
      {"name": "manual", "display_name": "Manual", "description": "Manual control mode", "color": "#6b7280", "is_safe_state": false},
      {"name": "auto", "display_name": "Auto", "description": "Automatic regulation mode", "color": "#22c55e", "is_safe_state": false},
      {"name": "bypass", "display_name": "Bypass", "description": "Regulator bypassed", "color": "#f59e0b", "is_safe_state": true}
    ]',
    '[
      {"from_state": "manual", "to_state": "auto", "trigger": "enable_auto", "conditions": ["voltage_stable"], "actions": ["enable_regulation", "log_event"], "requires_approval": false},
      {"from_state": "auto", "to_state": "manual", "trigger": "disable_auto", "conditions": [], "actions": ["disable_regulation", "log_event"], "requires_approval": true},
      {"from_state": "auto", "to_state": "bypass", "trigger": "fault_detected", "conditions": ["regulator_fault"], "actions": ["bypass_regulator", "raise_alarm"], "requires_approval": false},
      {"from_state": "bypass", "to_state": "manual", "trigger": "fault_cleared", "conditions": ["fault_resolved"], "actions": ["restore_regulator", "log_event"], "requires_approval": true}
    ]',
    true
  ),
  
  -- Load Transfer Switch Control Model
  (
    (SELECT id FROM al_aweer),
    'Load Transfer Switch',
    'State machine for automatic transfer switch operations',
    'transfer_switch',
    'source_a',
    '[
      {"name": "source_a", "display_name": "Source A", "description": "Load on source A", "color": "#22c55e", "is_safe_state": false},
      {"name": "source_b", "display_name": "Source B", "description": "Load on source B", "color": "#22c55e", "is_safe_state": false},
      {"name": "transferring", "display_name": "Transferring", "description": "Transfer in progress", "color": "#3b82f6", "is_safe_state": false},
      {"name": "isolated", "display_name": "Isolated", "description": "Load isolated from both sources", "color": "#ef4444", "is_safe_state": true}
    ]',
    '[
      {"from_state": "source_a", "to_state": "transferring", "trigger": "source_a_fault", "conditions": ["source_b_ok"], "actions": ["open_source_a", "log_event"], "requires_approval": false},
      {"from_state": "transferring", "to_state": "source_b", "trigger": "transfer_complete", "conditions": ["source_b_synced"], "actions": ["close_source_b", "log_event"], "requires_approval": false},
      {"from_state": "source_b", "to_state": "transferring", "trigger": "source_b_fault", "conditions": ["source_a_ok"], "actions": ["open_source_b", "log_event"], "requires_approval": false},
      {"from_state": "transferring", "to_state": "source_a", "trigger": "transfer_complete", "conditions": ["source_a_synced"], "actions": ["close_source_a", "log_event"], "requires_approval": false},
      {"from_state": "source_a", "to_state": "isolated", "trigger": "emergency_isolate", "conditions": [], "actions": ["open_all_sources", "raise_alarm"], "requires_approval": true},
      {"from_state": "source_b", "to_state": "isolated", "trigger": "emergency_isolate", "conditions": [], "actions": ["open_all_sources", "raise_alarm"], "requires_approval": true}
    ]',
    true
  ),
  
  -- Bus Coupler Control Model
  (
    (SELECT id FROM dubai_main),
    'Bus Coupler Control',
    'State machine for bus coupler operations',
    'bus_coupler',
    'open',
    '[
      {"name": "open", "display_name": "Open", "description": "Bus coupler is open", "color": "#ef4444", "is_safe_state": true},
      {"name": "closed", "display_name": "Closed", "description": "Bus coupler is closed", "color": "#22c55e", "is_safe_state": false}
    ]',
    '[
      {"from_state": "open", "to_state": "closed", "trigger": "close_command", "conditions": ["voltage_match", "phase_match", "no_fault"], "actions": ["sync_buses", "close_coupler", "log_event"], "requires_approval": true},
      {"from_state": "closed", "to_state": "open", "trigger": "open_command", "conditions": [], "actions": ["open_coupler", "log_event"], "requires_approval": false}
    ]',
    true
  ),
  
  -- Protection Relay Control Model
  (
    (SELECT id FROM jebel_ali),
    'Protection Relay Control',
    'State machine for protection relay operations',
    'protection_relay',
    'armed',
    '[
      {"name": "disabled", "display_name": "Disabled", "description": "Protection disabled", "color": "#6b7280", "is_safe_state": true},
      {"name": "armed", "display_name": "Armed", "description": "Protection armed and monitoring", "color": "#22c55e", "is_safe_state": false},
      {"name": "triggered", "display_name": "Triggered", "description": "Protection has triggered", "color": "#ef4444", "is_safe_state": true},
      {"name": "testing", "display_name": "Testing", "description": "Relay in test mode", "color": "#3b82f6", "is_safe_state": true}
    ]',
    '[
      {"from_state": "disabled", "to_state": "armed", "trigger": "enable_protection", "conditions": ["system_ok"], "actions": ["arm_relay", "log_event"], "requires_approval": true},
      {"from_state": "armed", "to_state": "triggered", "trigger": "fault_detected", "conditions": ["fault_threshold_exceeded"], "actions": ["trip_breaker", "raise_alarm", "log_event"], "requires_approval": false},
      {"from_state": "triggered", "to_state": "armed", "trigger": "reset_relay", "conditions": ["fault_cleared"], "actions": ["reset_protection", "log_event"], "requires_approval": true},
      {"from_state": "armed", "to_state": "testing", "trigger": "enter_test_mode", "conditions": [], "actions": ["disable_trip", "log_event"], "requires_approval": true},
      {"from_state": "testing", "to_state": "armed", "trigger": "exit_test_mode", "conditions": ["test_complete"], "actions": ["enable_trip", "log_event"], "requires_approval": true},
      {"from_state": "armed", "to_state": "disabled", "trigger": "disable_protection", "conditions": [], "actions": ["disarm_relay", "log_event"], "requires_approval": true}
    ]',
    true
  )
) AS v(site_id, name, description, equipment_type, current_state, states, transitions, is_active)
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;

-- Verify seed data
SELECT 
  COUNT(*) as total_control_models,
  COUNT(DISTINCT equipment_type) as equipment_types,
  COUNT(DISTINCT site_id) as sites_with_models
FROM pa_control_models
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1);
