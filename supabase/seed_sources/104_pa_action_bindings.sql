-- ============================================================================
-- Seed: 104_pa_action_bindings
-- Feature: Process Automation - Integrate & Model
-- Description: Seed data for pa_action_bindings table
-- Requirements: AC 2.3.1-2.3.7
-- ============================================================================

-- Create 12 action bindings for control, safety, and maintenance operations
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
INSERT INTO pa_action_bindings (
  tenant_id,
  site_id,
  name,
  description,
  action_type,
  target_system,
  target_tag,
  command,
  parameters,
  timeout_seconds,
  retry_count,
  is_active,
  created_by,
  updated_by
)
SELECT
  tenant.id,
  v.site_id,
  v.name,
  v.description,
  v.action_type,
  v.target_system,
  v.target_tag,
  v.command,
  v.parameters::jsonb,
  v.timeout_seconds,
  v.retry_count,
  v.is_active,
  'system',
  'system'
FROM tenant
CROSS JOIN (VALUES
  -- Control Actions - Dubai Main Substation
  (
    (SELECT id FROM dubai_main),
    'Close Circuit Breaker',
    'Close circuit breaker after safety checks',
    'control',
    'SCADA',
    'breaker_01_status',
    'CLOSE_BREAKER',
    '{"breaker_id": "BKR-01", "pre_checks": ["voltage_ok", "no_fault"], "post_checks": ["status_closed"], "ramp_time_ms": 500}',
    30,
    2,
    false
  ),
  (
    (SELECT id FROM dubai_main),
    'Open Circuit Breaker',
    'Open circuit breaker for isolation',
    'control',
    'SCADA',
    'breaker_01_status',
    'OPEN_BREAKER',
    '{"breaker_id": "BKR-01", "pre_checks": [], "post_checks": ["status_open"], "ramp_time_ms": 300}',
    30,
    2,
    true
  ),
  (
    (SELECT id FROM dubai_main),
    'Adjust Transformer Tap',
    'Adjust transformer tap position for voltage regulation',
    'control',
    'DCS',
    'transformer_1_voltage_secondary',
    'SET_TAP_POSITION',
    '{"transformer_id": "T1", "tap_range": {"min": 1, "max": 16}, "step_delay_ms": 1000, "target_voltage_kv": 132.0}',
    60,
    1,
    true
  ),
  
  -- Safety Actions - Jebel Ali Grid Station
  (
    (SELECT id FROM jebel_ali),
    'Emergency Generator Shutdown',
    'Emergency shutdown of generator',
    'safety',
    'PLC',
    'generator_1_status',
    'EMERGENCY_STOP',
    '{"generator_id": "GEN-1", "shutdown_sequence": ["reduce_load", "trip_breaker", "stop_fuel", "engage_brake"], "notification_recipients": ["ops@dewa.ae", "safety@dewa.ae"]}',
    45,
    0,
    true
  ),
  (
    (SELECT id FROM jebel_ali),
    'Isolate Faulted Section',
    'Isolate faulted section of the grid',
    'safety',
    'SCADA',
    NULL,
    'ISOLATE_SECTION',
    '{"section_id": "SEC-A", "breakers_to_open": ["BKR-10", "BKR-11", "BKR-12"], "alarm_priority": "critical"}',
    60,
    0,
    true
  ),
  (
    (SELECT id FROM jebel_ali),
    'Activate Backup Power',
    'Switch to backup power source',
    'safety',
    'SCADA',
    NULL,
    'ACTIVATE_BACKUP',
    '{"backup_source": "diesel_gen", "transfer_mode": "automatic", "sync_timeout_s": 30}',
    90,
    1,
    true
  ),
  
  -- Maintenance Actions - Al Aweer Regional Hub
  (
    (SELECT id FROM al_aweer),
    'Schedule Preventive Maintenance',
    'Schedule preventive maintenance for equipment',
    'maintenance',
    'CMMS',
    NULL,
    'CREATE_WORK_ORDER',
    '{"equipment_type": "transformer", "maintenance_type": "preventive", "priority": "medium", "estimated_duration_hours": 4, "required_parts": ["oil_filter", "gasket_kit"]}',
    120,
    1,
    false
  ),
  (
    (SELECT id FROM al_aweer),
    'Log Equipment Reading',
    'Log equipment reading for maintenance tracking',
    'maintenance',
    'SCADA',
    NULL,
    'LOG_READING',
    '{"reading_type": "oil_temperature", "log_interval_minutes": 15, "storage_location": "timeseries_db"}',
    10,
    3,
    true
  ),
  
  -- Notification Actions - Multiple Sites
  (
    (SELECT id FROM dubai_main),
    'Send Operator Alert',
    'Send alert notification to operators',
    'notification',
    'NOTIFICATION_SERVICE',
    NULL,
    'SEND_ALERT',
    '{"channels": ["email", "sms"], "recipients": ["operator1@dewa.ae", "operator2@dewa.ae"], "severity": "high", "include_telemetry": true}',
    15,
    2,
    true
  ),
  (
    (SELECT id FROM jebel_ali),
    'Raise Critical Alarm',
    'Raise critical alarm in control room',
    'notification',
    'ALARM_SYSTEM',
    NULL,
    'RAISE_ALARM',
    '{"alarm_type": "critical", "sound_pattern": "continuous", "visual_indicator": "red_flash", "auto_acknowledge": false}',
    5,
    0,
    true
  ),
  
  -- Custom Actions
  (
    (SELECT id FROM al_aweer),
    'Execute Load Shedding',
    'Execute load shedding procedure during peak demand',
    'custom',
    'SCADA',
    NULL,
    'LOAD_SHEDDING',
    '{"shedding_blocks": ["BLOCK-1", "BLOCK-2"], "shed_percentage": 15, "restore_delay_minutes": 30, "priority_feeders": ["FEED-A", "FEED-B"]}',
    180,
    0,
    true
  ),
  (
    (SELECT id FROM jebel_ali),
    'Optimize Power Flow',
    'Optimize power flow across transmission lines',
    'custom',
    'EMS',
    NULL,
    'OPTIMIZE_FLOW',
    '{"optimization_algorithm": "linear_programming", "constraints": {"max_line_loading": 0.95, "min_voltage": 0.95, "max_voltage": 1.05}, "objective": "minimize_losses"}',
    300,
    1,
    true
  )
) AS v(site_id, name, description, action_type, target_system, target_tag, command, parameters, timeout_seconds, retry_count, is_active)
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;

-- Verify seed data
SELECT 
  COUNT(*) as total_action_bindings,
  COUNT(DISTINCT action_type) as action_types,
  COUNT(DISTINCT target_system) as target_systems,
  COUNT(DISTINCT site_id) as sites_with_actions
FROM pa_action_bindings
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1);
