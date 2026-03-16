-- Seed Data: pa_alarm_rules
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.5.1-2.5.7
-- Description: Seed alarm rules with routing and escalation configurations

-- Get DEWA tenant ID
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;

  -- Insert alarm rules
  INSERT INTO pa_alarm_rules (
    id, tenant_id, name, description, alarm_type, condition_expression, severity,
    routing_destinations, escalation_rules, requires_acknowledgment, auto_clear,
    clear_condition_expression, enabled, tags, created_by, updated_by
  ) VALUES
  (
    gen_random_uuid(),
    v_tenant_id,
    'Critical Equipment Failure',
    'Alert on critical equipment failure requiring immediate attention',
    'equipment',
    'tag:equipment_status = "failed" AND tag:equipment_criticality = "critical"',
    'critical',
    '[
      {"type": "email", "destination": "ops-team@dewa.ae"},
      {"type": "sms", "destination": "+971501234567"},
      {"type": "webhook", "destination": "https://alert.dewa.ae/api/critical"}
    ]'::jsonb,
    '{
      "timeout": 300,
      "escalate_to": ["ops-manager@dewa.ae", "director@dewa.ae"]
    }'::jsonb,
    true, -- Requires acknowledgment
    false,
    NULL,
    true,
    '["equipment", "critical", "failure"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Safety System Alarm',
    'Safety system violation requiring immediate action',
    'safety',
    'tag:safety_status = "alarm" OR tag:personnel_in_danger = true',
    'critical',
    '[
      {"type": "email", "destination": "safety-team@dewa.ae"},
      {"type": "sms", "destination": "+971501234568"},
      {"type": "webhook", "destination": "https://alert.dewa.ae/api/safety"}
    ]'::jsonb,
    '{
      "timeout": 60,
      "escalate_to": ["safety-manager@dewa.ae", "ceo@dewa.ae"]
    }'::jsonb,
    true,
    false,
    NULL,
    true,
    '["safety", "critical", "emergency"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Process Deviation High',
    'Process parameter deviation from setpoint - high severity',
    'process',
    'abs(tag:process_value - tag:setpoint) > tag:high_limit',
    'high',
    '[
      {"type": "email", "destination": "process-team@dewa.ae"},
      {"type": "webhook", "destination": "https://alert.dewa.ae/api/process"}
    ]'::jsonb,
    '{
      "timeout": 600,
      "escalate_to": ["process-manager@dewa.ae"]
    }'::jsonb,
    true,
    true, -- Auto-clear when condition resolves
    'abs(tag:process_value - tag:setpoint) <= tag:normal_limit',
    true,
    '["process", "deviation", "control"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Environmental Compliance',
    'Environmental parameter exceeds regulatory limits',
    'environmental',
    'tag:emissions_ppm > 100 OR tag:noise_level_db > 85',
    'high',
    '[
      {"type": "email", "destination": "env-team@dewa.ae"},
      {"type": "webhook", "destination": "https://alert.dewa.ae/api/environmental"}
    ]'::jsonb,
    '{
      "timeout": 1800,
      "escalate_to": ["env-manager@dewa.ae", "compliance@dewa.ae"]
    }'::jsonb,
    true,
    true,
    'tag:emissions_ppm <= 90 AND tag:noise_level_db <= 80',
    true,
    '["environmental", "compliance", "regulatory"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Quality Degradation',
    'Product or service quality metrics below acceptable standards',
    'quality',
    'tag:power_quality_index < 0.95 OR tag:voltage_thd > 5.0',
    'medium',
    '[
      {"type": "email", "destination": "quality-team@dewa.ae"}
    ]'::jsonb,
    '{
      "timeout": 3600,
      "escalate_to": ["quality-manager@dewa.ae"]
    }'::jsonb,
    false, -- Does not require acknowledgment
    true,
    'tag:power_quality_index >= 0.98 AND tag:voltage_thd <= 3.0',
    false,
    '["quality", "performance", "monitoring"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Equipment Maintenance Due',
    'Scheduled equipment maintenance is due',
    'equipment',
    'tag:maintenance_due_days <= 7 AND tag:equipment_status = "running"',
    'medium',
    '[
      {"type": "email", "destination": "maintenance-team@dewa.ae"}
    ]'::jsonb,
    '{}',
    false,
    true,
    'tag:maintenance_completed = true',
    true,
    '["maintenance", "equipment", "preventive"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Process Warning',
    'Process parameter approaching limits - warning level',
    'process',
    'abs(tag:process_value - tag:setpoint) > tag:warning_limit',
    'low',
    '[
      {"type": "email", "destination": "operators@dewa.ae"}
    ]'::jsonb,
    '{}',
    false,
    true,
    'abs(tag:process_value - tag:setpoint) <= tag:normal_limit',
    true,
    '["process", "warning", "monitoring"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'System Information',
    'General system information and status updates',
    'equipment',
    'tag:system_event_type = "info"',
    'info',
    '[
      {"type": "webhook", "destination": "https://alert.dewa.ae/api/info"}
    ]'::jsonb,
    '{}',
    false,
    true,
    'tag:system_event_acknowledged = true',
    true,
    '["information", "system", "monitoring"]'::jsonb,
    'system',
    'system'
  );

  RAISE NOTICE 'Successfully seeded % alarm rules for tenant %', 8, v_tenant_id;
  
END $$;
