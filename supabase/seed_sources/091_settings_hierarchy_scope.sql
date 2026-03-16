BEGIN;

-- Precondition: Ensure sites exist
DO $$
DECLARE
  v_site_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_site_count FROM sites;
  IF v_site_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No sites found';
  END IF;
END $$;

-- 1) Seed Site Hierarchy Nodes
-- We use a CTE pattern to build a small tree for each site
WITH site_lookup AS (
  SELECT id, name, tenant_id FROM sites
),
root_nodes AS (
  INSERT INTO site_hierarchy_nodes (tenant_id, site_id, parent_id, node_type, name, path, metadata)
  SELECT 
    s.tenant_id,
    s.id,
    NULL,
    'area',
    'Switchyard ' || s.name,
    'switchyard',
    jsonb_build_object('description', 'High voltage outdoor switchyard')
  FROM site_lookup s
  ON CONFLICT (tenant_id, site_id, path) DO UPDATE SET name = EXCLUDED.name
  RETURNING id, site_id, tenant_id, path
),
level1_nodes AS (
  INSERT INTO site_hierarchy_nodes (tenant_id, site_id, parent_id, node_type, name, path, metadata)
  SELECT 
    r.tenant_id,
    r.site_id,
    r.id,
    'unit',
    CASE 
      WHEN i = 1 THEN '400kV Busbar Section'
      WHEN i = 2 THEN '132kV Busbar Section'
      ELSE 'Auxiliary Systems'
    END,
    r.path || '.busbar_' || i,
    jsonb_build_object('voltage_level', CASE WHEN i = 1 THEN '400kV' ELSE '132kV' END)
  FROM root_nodes r
  CROSS JOIN (SELECT generate_series(1, 2) AS i) s
  ON CONFLICT (tenant_id, site_id, path) DO UPDATE SET name = EXCLUDED.name
  RETURNING id, site_id, tenant_id, path
),
level2_nodes AS (
  INSERT INTO site_hierarchy_nodes (tenant_id, site_id, parent_id, node_type, name, path, metadata)
  SELECT 
    l.tenant_id,
    l.site_id,
    l.id,
    'unit',
    'Bay ' || j,
    l.path || '.bay_' || j,
    jsonb_build_object('bay_type', 'line_bay')
  FROM level1_nodes l
  CROSS JOIN (SELECT generate_series(1, 3) AS j) s
  ON CONFLICT (tenant_id, site_id, path) DO UPDATE SET name = EXCLUDED.name
  RETURNING id, site_id, tenant_id, path
)
SELECT 'Hierarchy nodes seeded' AS result;

-- 2) Seed Scope Defaults
-- We create defaults for standard roles
WITH tenant_info AS (
  SELECT id FROM tenants LIMIT 1
),
default_stream AS (
  SELECT id FROM streams WHERE is_default = true LIMIT 1
),
sites_array AS (
  SELECT array_agg(id) as ids FROM sites
)
INSERT INTO scope_defaults (tenant_id, principal_type, principal_id, default_site_ids, default_stream_id)
SELECT 
  t.id,
  'role',
  p.role_key,
  s.ids,
  ds.id
FROM tenant_info t
CROSS JOIN sites_array s
CROSS JOIN default_stream ds
CROSS JOIN (VALUES
  ('ops_manager'),
  ('reliability_engineer'),
  ('security_analyst'),
  ('executive'),
  ('energy_trader')
) AS p(role_key)
ON CONFLICT (tenant_id, principal_type, principal_id) DO UPDATE
SET default_site_ids = EXCLUDED.default_site_ids,
    default_stream_id = EXCLUDED.default_stream_id;

-- Post-seed validation
DO $$
DECLARE
  v_node_count INTEGER;
  v_scope_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_node_count FROM site_hierarchy_nodes;
  SELECT COUNT(*) INTO v_scope_count FROM scope_defaults;
  
  IF v_node_count < 20 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 20 hierarchy nodes, got %', v_node_count;
  END IF;
  
  IF v_scope_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 scope defaults, got %', v_scope_count;
  END IF;
END $$;

COMMIT;
