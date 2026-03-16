-- Seed: 112_pa_approvals
-- Description: Approval records for safety-critical automation records
-- AC: 2.11.1-2.11.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
),
record_wf1 AS (
  SELECT id FROM pa_workflows WHERE name = 'Substation Startup Sequence' LIMIT 1
),
record_wf2 AS (
  SELECT id FROM pa_workflows WHERE name = 'Line Isolation for Maintenance' LIMIT 1
)
INSERT INTO pa_approvals (
  tenant_id,
  record_type,
  record_id,
  approver_list,
  status,
  requested_by,
  reviewed_by,
  reviewed_at
)
SELECT
  tenant.id,
  v.record_type,
  v.record_id,
  v.approver_list,
  v.status,
  v.requested_by,
  v.reviewed_by,
  v.reviewed_at
FROM tenant
CROSS JOIN (
  SELECT 'workflow' as record_type, id as record_id, ARRAY['Manager', 'Safety Officer']::TEXT[] as approver_list, 'approved' as status, 'Engineer A' as requested_by, 'Manager Admin' as reviewed_by, NOW() - INTERVAL '2 days' as reviewed_at FROM record_wf1
  UNION ALL
  SELECT 'workflow' as record_type, id as record_id, ARRAY['Senior Dispatcher', 'Site Manager']::TEXT[] as approver_list, 'pending' as status, 'Field Tech B' as requested_by, NULL as reviewed_by, NULL as reviewed_at FROM record_wf2
  UNION ALL
  SELECT 'trigger' as record_type, gen_random_uuid(), ARRAY['Safety Officer']::TEXT[], 'rejected', 'Operator C', 'Safety Compliance', NOW() - INTERVAL '1 day'
  UNION ALL
  SELECT 'control_rule' as record_type, gen_random_uuid(), ARRAY['Chief Engineer', 'Plant Manager']::TEXT[], 'approved', 'Senior Engineer D', 'Chief Engineer', NOW() - INTERVAL '3 days'
  UNION ALL
  SELECT 'sequence' as record_type, gen_random_uuid(), ARRAY['Ops Manager']::TEXT[], 'pending', 'Automation Lead', NULL, NULL
  UNION ALL
  SELECT 'action_binding' as record_type, gen_random_uuid(), ARRAY['Safety Officer']::TEXT[], 'approved', 'Safety Team', 'Safety Officer', NOW() - INTERVAL '12 hours'
  UNION ALL
  SELECT 'alarm_rule' as record_type, gen_random_uuid(), ARRAY['Control Room Sup']::TEXT[], 'pending', 'Operator A', NULL, NULL
  UNION ALL
  SELECT 'version' as record_type, gen_random_uuid(), ARRAY['CTO', 'VP Operations']::TEXT[], 'rejected', 'Release Manager', 'Operations VP', NOW() - INTERVAL '4 days'
  UNION ALL
  SELECT 'workflow' as record_type, gen_random_uuid(), ARRAY['Site Manager']::TEXT[], 'draft', 'Intern', NULL, NULL
) AS v
ON CONFLICT (tenant_id, record_type, record_id) DO NOTHING;

COMMIT;
