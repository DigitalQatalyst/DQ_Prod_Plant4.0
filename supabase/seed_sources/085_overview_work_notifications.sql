BEGIN;

-- Precondition: Ensure tenant and users exist
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_count INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  SELECT COUNT(*) INTO v_user_count FROM user_profiles;
  
  IF v_tenant_id IS NULL OR v_user_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants or users found';
  END IF;
END $$;

-- 1) Seed Work Items
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
),
users AS (
  SELECT user_id, display_name FROM user_profiles
)
INSERT INTO work_items (tenant_id, title, type, status, priority, assigned_to_user_id, due_at, source_feature_area, deeplink_path)
SELECT 
  t.id,
  v.title,
  v.type,
  v.status,
  v.priority,
  u.user_id,
  (NOW() + (v.due_days || ' days')::interval),
  v.area,
  v.path
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('Review Substation A Load Balancing', 'task', 'open', 'high', 'Ahmed Mansour', 2, 'Overview', '/overview/triage'),
  ('Calibrate SNR-661 Frequency Sensor', 'maintenance', 'in_progress', 'medium', 'David Kim', 5, 'Asset Catalog', '/assets/detail/snr-661'),
  ('Analyze Security Threat: Failed Logins', 'investigation', 'open', 'critical', 'John Miller', 1, 'Overview', '/overview/exceptions'),
  ('Renew Grid Modernization Program Scope', 'planning', 'open', 'medium', 'Priya Sharma', 14, 'Settings', '/settings/programs'),
  ('Investigate Topology Gap in Hub North', 'topology', 'completed', 'low', 'Sarah Chen', -1, 'Topology', '/topology/map'),
  ('Approve Integration Token Renewal', 'admin', 'open', 'high', 'Ahmed Mansour', 3, 'Settings', '/settings/integrations'),
  ('Emergency Transformer Oil Flush', 'maintenance', 'in_progress', 'critical', 'Fatima Al-Sayed', 0, 'Asset Catalog', '/assets/portfolio'),
  ('Executive Review: Monthly Performance', 'reporting', 'open', 'medium', 'Marcus Vane', 7, 'Overview', '/overview/executive'),
  ('Review Integration Mapping: OSIsoft PI', 'config', 'open', 'low', 'Ahmed Mansour', 5, 'Settings', '/settings/integrations'),
  ('Update NERC CIP Compliance Docs', 'compliance', 'in_progress', 'high', 'John Miller', 10, 'Overview', '/overview/advisor'),
  ('Sanitize User Access List', 'security', 'open', 'medium', 'John Miller', 3, 'Overview', '/overview/exceptions'),
  ('Audit Hierarchy Paths for Site C', 'data_quality', 'open', 'low', 'Sarah Chen', 12, 'Settings', '/settings/hierarchy'),
  ('Weekly Team Sync: Load Flow', 'meeting', 'open', 'info', 'Ahmed Mansour', 1, 'Overview', '/overview/ops'),
  ('Validate SCADA Bridge Failover', 'test', 'completed', 'high', 'Fatima Al-Sayed', -2, 'Settings', '/settings/integrations'),
  ('Prepare Renewable Source Integration Plan', 'planning', 'in_progress', 'medium', 'Elena Rodriguez', 20, 'Settings', '/settings/programs')
) AS v(title, type, status, priority, user_name, due_days, area, path)
LEFT JOIN users u ON u.display_name = v.user_name
ON CONFLICT DO NOTHING;

-- 2) Seed Notifications
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
),
users AS (
  SELECT user_id, display_name FROM user_profiles
)
INSERT INTO notifications (tenant_id, user_id, type, payload, created_at, read_at)
SELECT 
  t.id,
  u.user_id,
  v.type,
  v.payload,
  (NOW() - (v.age_min || ' minutes')::interval),
  CASE WHEN (v.age_min % 20 = 0) THEN (NOW() - (v.age_min / 2 || ' minutes')::interval) ELSE NULL END
FROM tenant_lookup t
CROSS JOIN users u
CROSS JOIN (VALUES
  ('alert', '{"title": "Alert", "message": "Operational notification", "severity": "info"}'::jsonb, 10),
  ('work_item', '{"title": "Work Item", "message": "Task queued", "priority": "medium"}'::jsonb, 30),
  ('system', '{"title": "System Status", "message": "Services operational", "status": "healthy"}'::jsonb, 60),
  ('health', '{"title": "Health Update", "message": "Telemetry link active", "minutes": 1}'::jsonb, 100)
) AS v(type, payload, age_min)
WHERE 
  (u.display_name = 'Ahmed Mansour' AND v.type IN ('alert', 'work_item', 'system', 'health')) OR
  (u.display_name = 'Sarah Chen' AND v.type IN ('alert', 'work_item', 'system', 'health')) OR
  (u.display_name = 'John Miller' AND v.type IN ('alert', 'work_item', 'system', 'health')) OR
  (u.display_name = 'Elena Rodriguez' AND v.type IN ('alert', 'work_item', 'system')) OR
  (u.display_name = 'Marcus Vane' AND v.type IN ('alert', 'system', 'health')) OR
  (u.display_name = 'Fatima Al-Sayed' AND v.type IN ('alert', 'work_item', 'system', 'health')) OR
  (u.display_name = 'David Kim' AND v.type IN ('alert', 'work_item', 'health')) OR
  (u.display_name = 'Priya Sharma' AND v.type IN ('work_item', 'system', 'health'));

-- Post-seed validation
DO $$
DECLARE
  v_work_count INTEGER;
  v_notif_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_work_count FROM work_items;
  SELECT COUNT(*) INTO v_notif_count FROM notifications;
  
  IF v_work_count < 12 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 12 work_items, got %', v_work_count;
  END IF;
  
  IF v_notif_count < 20 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 20 notifications, got %', v_notif_count;
  END IF;
END $$;

COMMIT;
