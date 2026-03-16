-- Seed: 113_pa_simulations
-- Description: Simulation records for automation testing
-- AC: 2.12.1-2.12.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
),
target_wf AS (
  SELECT id FROM pa_workflows WHERE name = 'Emergency Load Shedding' LIMIT 1
),
target_tr AS (
  SELECT id FROM pa_triggers WHERE name = 'High Temperature Breaker Trip' LIMIT 1
)
INSERT INTO pa_simulations (
  tenant_id,
  simulation_type,
  target_id,
  input_parameters,
  expected_outcome,
  actual_outcome,
  status,
  duration_seconds
)
SELECT
  tenant.id,
  v.simulation_type,
  v.target_id,
  v.input_parameters::jsonb,
  v.expected_outcome,
  v.actual_outcome,
  v.status,
  v.duration_seconds
FROM tenant
CROSS JOIN (
  SELECT 
    'workflow' as simulation_type, 
    id as target_id, 
    '{"load_drop": "50MW", "priority": "critical"}' as input_parameters,
    'All breakers in Block A trip successfully' as expected_outcome,
    'Block A tripped, Block B notification sent' as actual_outcome,
    'completed' as status,
    15 as duration_seconds 
  FROM target_wf
  UNION ALL
  SELECT 
    'trigger' as simulation_type, 
    id as target_id, 
    '{"temp_reading": 95, "duration": "5s"}' as input_parameters,
    'Trigger fires and initiates safety cooling' as expected_outcome,
    'Trigger fired, cooling started at T+2s' as actual_outcome,
    'completed' as status,
    5 as duration_seconds 
  FROM target_tr
  UNION ALL
  SELECT 
    'sequence' as simulation_type,
    gen_random_uuid(),
    '{"start_delay": 0}' as input_parameters,
    'Sequence completes in <1s' as expected_outcome,
    'Sequence took 1.2s' as actual_outcome,
    'failed' as status,
    2
  UNION ALL
  SELECT
    'control_model' as simulation_type,
    gen_random_uuid(),
    '{"fault_conditions": ["overvoltage"]}' as input_parameters,
    'Transition to Tripped state' as expected_outcome,
    'Transition successful' as actual_outcome,
    'completed' as status,
    4
  UNION ALL
  SELECT 
    'workflow' as simulation_type,
    gen_random_uuid(),
    '{"dry_run": true}' as input_parameters,
    'Steps validated' as expected_outcome,
    'Validation passed' as actual_outcome,
    'completed' as status,
    60
  UNION ALL
  SELECT 
    'trigger' as simulation_type,
    gen_random_uuid(),
    '{"noise_level": 10}' as input_parameters,
    'No false positive trigger' as expected_outcome,
    'Triggered incorrectly' as actual_outcome,
    'failed' as status,
    30
  UNION ALL
  SELECT 
    'action_binding' as simulation_type,
    gen_random_uuid(),
    '{"target_unreachable": true}' as input_parameters,
    'Retry mechanism activates' as expected_outcome,
    'Retried 3 times then failed' as actual_outcome,
    'completed' as status,
    45
  UNION ALL
  SELECT 
    'alarm_rule' as simulation_type,
    gen_random_uuid(),
    '{"severity": "critical"}' as input_parameters,
    'Escalation email sent' as expected_outcome,
    'Email sent to manager' as actual_outcome,
    'completed' as status,
    10
  UNION ALL
  SELECT 
    'workflow' as simulation_type,
    gen_random_uuid(),
    '{"load_profile": "peak"}' as input_parameters,
    'Load shedding optimal' as expected_outcome,
    'Simulation running...' as actual_outcome,
    'running' as status,
    120
  UNION ALL
  SELECT 
    'control_rule' as simulation_type,
    gen_random_uuid(),
    '{"voltage": 135}' as input_parameters,
    'Tap changer activates' as expected_outcome,
    'Pending execution' as actual_outcome,
    'pending' as status,
    0
) AS v;

COMMIT;
