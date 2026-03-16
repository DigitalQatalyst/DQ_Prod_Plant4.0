-- Seed 014: Asset Audit Log
-- Insert sample audit history for assets
-- Requirements: 9.1, 9.3, 9.4

-- Precondition: Check if transmission tenant exists
WITH tenant_check AS (
  SELECT id as tenant_id 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Get some assets
target_assets AS (
  SELECT id, tenant_id, name
  FROM assets
  WHERE tenant_id = (SELECT tenant_id FROM tenant_check)
  LIMIT 5
),
-- Generate audit entries
audit_data AS (
  -- Creation logs for all sample assets
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'create' as action,
    '{"name", "type", "site"}'::text[] as changed_fields,
    null::jsonb as old_values,
    jsonb_build_object('name', ta.name, 'status', 'online') as new_values,
    'Initial asset registration' as details,
    now() - interval '30 days' as performed_at
  FROM target_assets ta
  
  UNION ALL
  
  -- Some status updates
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'status_change' as action,
    '{"status"}'::text[] as changed_fields,
    jsonb_build_object('status', 'offline') as old_values,
    jsonb_build_object('status', 'online') as new_values,
    'Routine maintenance completed' as details,
    now() - interval '10 days' as performed_at
  FROM (SELECT * FROM target_assets LIMIT 2) ta
  
  UNION ALL
  
  -- Criticality updates
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'update' as action,
    '{"criticality"}'::text[] as changed_fields,
    jsonb_build_object('criticality', 'medium') as old_values,
    jsonb_build_object('criticality', 'high') as new_values,
    'Risk assessment update' as details,
    now() - interval '5 days' as performed_at
  FROM (SELECT * FROM target_assets OFFSET 2 LIMIT 2) ta
)
INSERT INTO asset_audit_log (tenant_id, asset_id, action, changed_fields, old_values, new_values, details, performed_at)
SELECT tenant_id, asset_id, action, changed_fields, old_values, new_values, details, performed_at
FROM audit_data
-- Audit logs should be purely additive, but to prevent duplicate seed runs from exploding size, we can check existence
WHERE NOT EXISTS (
  SELECT 1 FROM asset_audit_log existing 
  WHERE existing.asset_id = audit_data.asset_id 
  AND existing.action = audit_data.action 
  AND existing.performed_at = audit_data.performed_at
);

-- Post-seed validation
DO $$
DECLARE
  audit_count INTEGER;
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Transmission tenant not found for audit log seed';
  END IF;
  
  SELECT COUNT(*) INTO audit_count
  FROM asset_audit_log
  WHERE tenant_id = tenant_uuid;
  
  IF audit_count < 5 THEN
    RAISE NOTICE 'Asset audit log seed might have been skipped or resulted in too few records (count: %)', audit_count;
  ELSE
    RAISE NOTICE 'Asset audit log seed completed: % records', audit_count;
  END IF;
END $$;
