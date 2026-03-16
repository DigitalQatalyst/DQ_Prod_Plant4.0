-- Seed: 114_pa_audit_logs
-- Description: Audit history for Process Automation operations
-- AC: 2.13.1-2.13.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
)
INSERT INTO pa_audit_logs (
  tenant_id,
  event_type,
  record_type,
  record_id,
  user_name,
  changes_before,
  changes_after,
  execution_result
)
SELECT
  tenant.id,
  v.event_type,
  v.record_type,
  gen_random_uuid(), -- Symbolic for seed
  v.user_name,
  v.changes_before::jsonb,
  v.changes_after::jsonb,
  v.execution_result
FROM tenant
CROSS JOIN (VALUES
  ('create', 'workflow', 'System Admin', NULL, '{"name": "Shutdown Sequence", "steps": []}', NULL),
  ('execute', 'trigger', 'Auto-System', NULL, NULL, 'Success: Breaker isolated'),
  ('update', 'tag_mapping', 'Field Tech', '{"scaling": 1.0}', '{"scaling": 1.05}', NULL),
  ('approve', 'version', 'Manager', '{"status": "pending"}', '{"status": "approved"}', NULL),
  ('login', 'user', 'Operator A', NULL, NULL, 'Success'),
  ('logout', 'user', 'Operator A', NULL, NULL, 'Success'),
  ('create', 'trigger', 'Engineer B', NULL, '{"name": "New Safety Trigger"}', NULL),
  ('delete', 'alarm_rule', 'Admin', '{"name": "Old Rule"}', NULL, NULL),
  ('execute', 'workflow', 'Scheduler', NULL, NULL, 'Failed: Timeout'),
  ('update', 'control_model', 'System', '{"state": "running"}', '{"state": "stopped"}', 'Success'),
  ('alert', 'system', 'Monitor', NULL, '{"level": "warning"}', NULL),
  ('sync', 'edge_node', 'Gateway_01', NULL, NULL, 'Synced 50 tags'),
  ('approve', 'workflow', 'Safety Officer', '{"status": "pending"}', '{"status": "rejected"}', NULL),
  ('create', 'simulation', 'Tester', NULL, '{"type": "stress_test"}', NULL),
  ('execute', 'action', 'Auto-Breaker', NULL, NULL, 'Success: Open'),
  ('config', 'tenant', 'Admin', '{"theme": "light"}', '{"theme": "dark"}', NULL),
  ('update', 'user_role', 'Super Admin', '{"role": "viewer"}', '{"role": "editor"}', NULL),
  ('import', 'tag_mapping', 'Data Engineer', NULL, '{"count": 100}', 'Success'),
  ('export', 'audit_log', 'Auditor', NULL, NULL, 'Exported 500 records'),
  ('execute', 'sequence', 'PLC', NULL, NULL, 'Completed in 50ms'),
  ('error', 'system', 'Gateway_02', NULL, NULL, 'Connection Lost'),
  ('recover', 'system', 'Gateway_02', NULL, NULL, 'Reconnected')
) AS v(event_type, record_type, user_name, changes_before, changes_after, execution_result);

COMMIT;
