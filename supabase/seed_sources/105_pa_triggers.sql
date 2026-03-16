-- Seed Data: pa_triggers
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.4.1-2.4.7
-- Description: Seed triggers with various types and priorities

-- Get DEWA tenant ID and action binding IDs for reference
DO $$
DECLARE
  v_tenant_id UUID;
  v_ab_open_breaker UUID;
  v_ab_close_breaker UUID;
  v_ab_load_shedding UUID;
  v_ab_voltage_adjust UUID;
  v_ab_notification UUID;
  v_ab_emergency_shutdown UUID;
  v_ab_isolate_section UUID;
  v_ab_backup_power UUID;
  v_ab_raise_alarm UUID;
  v_ab_optimize_flow UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;

  -- Get action binding IDs using names that match 009_pa_action_bindings.sql
  SELECT id INTO v_ab_open_breaker FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Open Circuit Breaker' LIMIT 1;

  SELECT id INTO v_ab_close_breaker FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Close Circuit Breaker' LIMIT 1;

  SELECT id INTO v_ab_load_shedding FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Execute Load Shedding' LIMIT 1;

  SELECT id INTO v_ab_voltage_adjust FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Adjust Transformer Tap' LIMIT 1;

  SELECT id INTO v_ab_notification FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Send Operator Alert' LIMIT 1;

  SELECT id INTO v_ab_emergency_shutdown FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Emergency Generator Shutdown' LIMIT 1;

  SELECT id INTO v_ab_isolate_section FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Isolate Faulted Section' LIMIT 1;

  SELECT id INTO v_ab_backup_power FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Activate Backup Power' LIMIT 1;

  SELECT id INTO v_ab_raise_alarm FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Raise Critical Alarm' LIMIT 1;

  SELECT id INTO v_ab_optimize_flow FROM pa_action_bindings
  WHERE tenant_id = v_tenant_id AND name = 'Optimize Power Flow' LIMIT 1;

  -- Insert triggers with correct action_binding_ids referencing real bindings
  INSERT INTO pa_triggers (
    id, tenant_id, name, description, trigger_type, condition_expression,
    evaluation_interval, action_binding_ids, priority, enabled, tags,
    created_by, updated_by
  ) VALUES
  (
    gen_random_uuid(),
    v_tenant_id,
    'Overvoltage Protection',
    'Trigger when line voltage exceeds safe operating limits',
    'threshold',
    'tag:line_voltage_kv > 145',
    10, -- Check every 10 seconds
    ARRAY[v_ab_open_breaker, v_ab_raise_alarm, v_ab_notification]::UUID[],
    'critical',
    true,
    '["protection", "voltage", "safety"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Undervoltage Alert',
    'Alert when voltage drops below operational threshold',
    'threshold',
    'tag:line_voltage_kv < 125',
    15,
    ARRAY[v_ab_voltage_adjust, v_ab_notification]::UUID[],
    'high',
    true,
    '["voltage", "quality", "alert"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Overcurrent Protection',
    'Emergency shutdown on excessive current draw',
    'threshold',
    'tag:line_current_a > 800 AND duration > 5',
    5, -- Check every 5 seconds
    ARRAY[v_ab_open_breaker, v_ab_load_shedding, v_ab_raise_alarm]::UUID[],
    'critical',
    true,
    '["protection", "current", "safety"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Load Imbalance Detection',
    'Detect and respond to phase load imbalance',
    'pattern',
    'abs(tag:phase_a_current - tag:phase_b_current) > 50 OR abs(tag:phase_b_current - tag:phase_c_current) > 50',
    30,
    ARRAY[v_ab_load_shedding, v_ab_notification]::UUID[],
    'high',
    true,
    '["balance", "load", "quality"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Frequency Deviation Alert',
    'Monitor grid frequency and alert on deviation',
    'threshold',
    'abs(tag:grid_frequency_hz - 50.0) > 0.5',
    5,
    ARRAY[v_ab_notification, v_ab_raise_alarm]::UUID[],
    'medium',
    false,
    '["frequency", "grid", "quality"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Transformer Overheating',
    'Emergency action when transformer temperature is critical',
    'threshold',
    'tag:transformer_temp_c > 95',
    10,
    ARRAY[v_ab_open_breaker, v_ab_emergency_shutdown, v_ab_raise_alarm]::UUID[],
    'critical',
    true,
    '["temperature", "transformer", "safety"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Breaker Status Change',
    'Log and notify on breaker state changes',
    'change',
    'tag:breaker_status changed',
    NULL, -- Event-driven, no interval
    ARRAY[v_ab_notification, v_ab_close_breaker]::UUID[],
    'low',
    true,
    '["breaker", "status", "monitoring"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Daily Maintenance Check',
    'Scheduled daily system verification',
    'schedule',
    'time = "06:00:00" AND day_of_week IN (1,2,3,4,5)',
    NULL, -- Schedule-based
    ARRAY[v_ab_notification]::UUID[],
    'low',
    true,
    '["maintenance", "schedule", "daily"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Power Factor Correction',
    'Trigger power factor correction when lagging',
    'threshold',
    'tag:power_factor < 0.90',
    60,
    ARRAY[v_ab_voltage_adjust, v_ab_optimize_flow]::UUID[],
    'medium',
    true,
    '["power-factor", "quality", "efficiency"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Manual Emergency Stop',
    'Manual trigger for emergency shutdown',
    'manual',
    'user_action = "emergency_stop"',
    NULL,
    ARRAY[v_ab_open_breaker, v_ab_emergency_shutdown, v_ab_load_shedding, v_ab_isolate_section]::UUID[],
    'critical',
    false, -- Disabled by default for safety
    '["manual", "emergency", "safety"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Grid Fault Detection',
    'Detect and isolate faulted grid sections automatically',
    'pattern',
    'tag:fault_current_a > 1200 AND tag:protection_relay_status = "tripped"',
    5,
    ARRAY[v_ab_isolate_section, v_ab_backup_power, v_ab_raise_alarm]::UUID[],
    'critical',
    true,
    '["fault", "grid", "protection"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Peak Load Optimization',
    'Optimize power flow during peak demand periods',
    'schedule',
    'time BETWEEN "17:00:00" AND "22:00:00" AND tag:total_load_mw > 850',
    300,
    ARRAY[v_ab_optimize_flow, v_ab_load_shedding]::UUID[],
    'medium',
    true,
    '["optimization", "load", "efficiency"]'::jsonb,
    'system',
    'system'
  );

  RAISE NOTICE 'Successfully seeded % triggers for tenant %', 12, v_tenant_id;

END $$;
