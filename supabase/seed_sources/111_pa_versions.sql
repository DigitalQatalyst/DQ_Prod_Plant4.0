-- Seed: 111_pa_versions
-- Description: Version control history for Process Automation
-- AC: 2.10.1-2.10.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
)
INSERT INTO pa_versions (
  tenant_id,
  version_number,
  change_type,
  description,
  affected_components,
  approval_status,
  created_by,
  approved_by,
  approved_at
)
SELECT
  tenant.id,
  v.version_number,
  v.change_type,
  v.description,
  v.affected_components::jsonb,
  v.approval_status,
  v.created_by,
  NULLIF(v.approved_by, ''),
  NULLIF(v.approved_at, '')::TIMESTAMPTZ
FROM tenant
CROSS JOIN (VALUES
  (
    '1.0.0',
    'major',
    'Initial baseline for Transmission automation system',
    '{"workflows": ["all"], "triggers": ["all"], "control_rules": ["all"]}',
    'approved',
    'Admin',
    'Chief Engineer',
    '2025-06-15T09:00:00Z'
  ),
  (
    '1.1.0',
    'minor',
    'Updated Emergency Load Shedding logic',
    '{"workflows": ["Emergency Load Shedding"]}',
    'approved',
    'System Engineer',
    'Operations Manager',
    '2025-09-20T14:30:00Z'
  ),
  (
    '1.1.1',
    'patch',
    'Fix for voltage stabilization threshold',
    '{"control_rules": ["Voltage Limit Rule"]}',
    'approved',
    'Field Tech',
    'Lead Engineer',
    '2025-10-05T11:00:00Z'
  ),
  (
    '2.0.0-rc1',
    'major',
    'New Grid Balancing feature set',
    '{"workflows": ["Dynamic Load Balancing"], "triggers": ["Frequency Drop Trigger"]}',
    'pending',
    'Lead Architect',
    '',
    ''
  ),
  (
    '2.0.0-beta1',
    'major',
    'Early beta for Grid Balancing',
    '{"workflows": ["Dynamic Load Balancing"]}',
    'rejected',
    'QA Lead',
    '',
    ''
  ),
  (
    '1.2.0',
    'minor',
    'Security Hardening Patch',
    '{"triggers": ["Security Violation Lockdown"], "control_rules": ["Security Rule"]}',
    'approved',
    'Security Officer',
    'CISO',
    '2025-11-18T08:45:00Z'
  ),
  (
    '1.0.1',
    'patch',
    'Hotfix for sensor drift',
    '{"tag_mappings": ["Temp Sensors"]}',
    'approved',
    'Field Engineer',
    'Operations Manager',
    '2025-07-03T16:00:00Z'
  ),
  (
    '0.9.0',
    'major',
    'Pre-release MVP',
    '{"all": true}',
    'archived',
    'Founder',
    '',
    ''
  ),
  (
    '2.1.0-draft',
    'minor',
    'Proposed AI Optimization module',
    '{"simulations": ["AI Models"]}',
    'draft',
    'Data Scientist',
    '',
    ''
  )
) AS v(version_number, change_type, description, affected_components, approval_status, created_by, approved_by, approved_at)
ON CONFLICT (tenant_id, version_number) DO UPDATE
  SET approved_by = EXCLUDED.approved_by,
      approved_at = EXCLUDED.approved_at;

COMMIT;
