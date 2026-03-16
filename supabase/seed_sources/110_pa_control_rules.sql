-- Seed: 110_pa_control_rules
-- Description: Continuous control logic for Power Transmission
-- AC: 2.9.1-2.9.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
),
action_ids AS (
  SELECT 
    name,
    id
  FROM pa_action_bindings 
  WHERE tenant_id = (SELECT id FROM tenant)
)
INSERT INTO pa_control_rules (
  tenant_id,
  name,
  description,
  rule_type,
  condition_expression,
  action_binding_ids,
  priority,
  enabled
)
SELECT
  tenant.id,
  v.name,
  v.description,
  v.rule_type,
  v.condition_expression,
  COALESCE(
    ARRAY(SELECT id FROM action_ids WHERE name = v.action_name LIMIT 1),
    ARRAY[]::UUID[]
  ),
  v.priority,
  v.enabled
FROM tenant
CROSS JOIN (VALUES
  (
    'Voltage Overflow Protection',
    'Immediately isolate if bus voltage exceeds 110% of nominal',
    'if-then',
    'bus_voltage > 145.2', -- 132kV * 1.1
    'Open Circuit Breaker',
    'critical',
    true
  ),
  (
    'Automatic Tap Adjustment',
    'Adjust transformer taps whenever voltage deviates > 2%',
    'when-then',
    'ABS(secondary_voltage - 132.0) > 2.64',
    'Adjust Transformer Tap',
    'medium',
    true
  ),
  (
    'Underfrequency Load Shedding',
    'Shed load blocks if frequency drops below 48.5Hz',
    'if-then',
    'grid_frequency < 48.5',
    'Execute Load Shedding',
    'high',
    true
  ),
  (
    'Transformer Overload Cooling',
    'Activate cooling fans when transformer load > 85%',
    'continuous',
    'transformer_load_pct > 85',
    'Adjust Transformer Tap', -- Using tap as placeholder if cooling fan action not found
    'medium',
    false
  ),
  (
    'Reactive Power Compensation',
    'Switch capacitor banks based on power factor',
    'continuous',
    'power_factor < 0.92',
    'Optimize Power Flow',
    'low',
    true
  ),
  (
    'Security Violation Lockdown',
    'Isolate grid segment on suspected physical breach',
    'if-then',
    'perimeter_alarm == true AND intrusion_detected == true',
    'Isolate Faulted Section',
    'critical',
    true
  )
) AS v(name, description, rule_type, condition_expression, action_name, priority, enabled)
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;
