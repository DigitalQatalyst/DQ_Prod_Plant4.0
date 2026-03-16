BEGIN;

-- Precondition: Ensure tenant exists
DO $$
DECLARE
  v_tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tenant_count FROM tenants;
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants found';
  END IF;
END $$;

-- Lookup CTE
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)

-- Upsert overview_dashboards
INSERT INTO overview_dashboards (tenant_id, name, preset_type, is_default, scope_defaults)
SELECT 
  t.id,
  v.name,
  v.preset,
  v.is_default,
  v.scope
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('Operational Overview', 'ops', true, '{"view": "grid", "refresh": 30}'::jsonb),
  ('Asset Reliability', 'reliability', false, '{"view": "list", "refresh": 300}'::jsonb),
  ('Security Posture', 'security', false, '{"view": "map", "refresh": 60}'::jsonb),
  ('Energy & Performance', 'energy', false, '{"view": "analytics", "refresh": 120}'::jsonb),
  ('Executive Summary', 'executive', false, '{"view": "summary", "refresh": 600}'::jsonb)
) AS v(name, preset, is_default, scope)
ON CONFLICT (tenant_id, name) DO UPDATE
SET preset_type = EXCLUDED.preset_type,
    is_default = EXCLUDED.is_default,
    scope_defaults = EXCLUDED.scope_defaults;

-- Post-seed validation
DO $$
DECLARE
  v_dashboard_count INTEGER;
  v_default_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_dashboard_count FROM overview_dashboards;
  SELECT COUNT(*) INTO v_default_count FROM overview_dashboards WHERE is_default = true;
  
  IF v_dashboard_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 dashboards, got %', v_dashboard_count;
  END IF;
  
  IF v_default_count <> 1 THEN
    RAISE EXCEPTION 'Validation failed: Expected exactly 1 default dashboard, got %', v_default_count;
  END IF;
END $$;

COMMIT;
