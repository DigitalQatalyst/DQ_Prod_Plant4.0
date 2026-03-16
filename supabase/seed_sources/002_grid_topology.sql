-- Seed data for Power Transmission grid topology
-- This creates 5 grid nodes and 6 grid lines forming a connected network
-- Uses clean CTE pattern with UUID generation (no explicit string IDs)
-- Seeds now hard-fail with meaningful messages if preconditions are unmet.

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_site_count INTEGER;
BEGIN
  -- 1) Verify tenant exists exactly
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Tenant "DEWA - Transmission" (power/transmission/power_transmission_demo_v1) does not exist. Run 001_transmission_tenant.sql first.';
  END IF;
  
  IF v_tenant_count > 1 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Multiple tenants found matching "DEWA - Transmission". Expected exactly 1, found %.', v_tenant_count;
  END IF;

  -- 2) Verify required sites exist (count = 3)
  SELECT COUNT(*) INTO v_site_count
  FROM sites s
  INNER JOIN tenants t ON s.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1'
    AND s.name IN (
      'Dubai Main Substation',
      'Jebel Ali Grid Station',
      'Al Aweer Regional Hub'
    );
  
  IF v_site_count < 3 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected 3 sites (Dubai Main Substation, Jebel Ali Grid Station, Al Aweer Regional Hub), found %. Run 001_transmission_tenant.sql first.', v_site_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, sites=%', v_site_count;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- 1) Get tenant UUID
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- 2) Upsert grid nodes (join directly to sites by tenant+name)
upsert_nodes AS (
  INSERT INTO grid_nodes (tenant_id, site_id, name, node_type, voltage_kv, region, geo_lat, geo_lng)
  SELECT 
    tenant.id,
    s.id,
    v.name,
    v.node_type,
    v.voltage_kv,
    v.region,
    v.geo_lat,
    v.geo_lng
  FROM tenant
  CROSS JOIN (VALUES
    ('Dubai Main Substation', 'Dubai Main Substation', 'substation', 400.0, 'Dubai', 25.2048, 55.2708),
    ('Dubai South Junction', NULL, 'junction', 132.0, 'Dubai', 25.1500, 55.2500),
    ('Jebel Ali Main Substation', 'Jebel Ali Grid Station', 'substation', 400.0, 'Jebel Ali', 25.0118, 55.1272),
    ('Al Aweer Main Substation', 'Al Aweer Regional Hub', 'substation', 220.0, 'Al Aweer', 25.1584, 55.4444),
    ('Central Grid Hub', NULL, 'junction', 400.0, 'Central Dubai', 25.2500, 55.3500)
  ) AS v(name, site_name, node_type, voltage_kv, region, geo_lat, geo_lng)
  LEFT JOIN sites s ON s.tenant_id = tenant.id AND s.name = v.site_name
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    node_type = EXCLUDED.node_type,
    voltage_kv = EXCLUDED.voltage_kv,
    region = EXCLUDED.region,
    geo_lat = EXCLUDED.geo_lat,
    geo_lng = EXCLUDED.geo_lng
  RETURNING id, name
),
-- 3) Force dependency: lookup nodes from upsert_nodes + existing grid_nodes
nodes_lookup AS (
  -- Force dependency: ensures upsert_nodes executes before this CTE can resolve
  SELECT id, name FROM upsert_nodes
  UNION ALL
  SELECT n.id, n.name
  FROM grid_nodes n
  INNER JOIN tenant t ON n.tenant_id = t.id
  WHERE n.name IN (
    'Dubai Main Substation',
    'Dubai South Junction',
    'Jebel Ali Main Substation',
    'Al Aweer Main Substation',
    'Central Grid Hub'
  )
),
-- 4) Upsert grid lines (join to nodes_lookup to enforce execution order)
upsert_lines AS (
  INSERT INTO grid_lines (tenant_id, name, from_node_id, to_node_id, voltage_kv, length_km, status)
  SELECT 
    tenant.id,
    v.name,
    from_node.id,
    to_node.id,
    v.voltage_kv,
    v.length_km,
    v.status
  FROM tenant
  CROSS JOIN (VALUES
    ('Central-Dubai Main Line', 'Central Grid Hub', 'Dubai Main Substation', 400.0, 12.5, 'active'),
    ('Central-Jebel Ali Main Line', 'Central Grid Hub', 'Jebel Ali Main Substation', 400.0, 35.8, 'active'),
    ('Central-Al Aweer Main Line', 'Central Grid Hub', 'Al Aweer Main Substation', 220.0, 28.3, 'active'),
    ('Dubai Main-South Feeder', 'Dubai Main Substation', 'Dubai South Junction', 132.0, 8.2, 'active'),
    ('Dubai-Jebel Ali Direct', 'Dubai Main Substation', 'Jebel Ali Main Substation', 400.0, 42.6, 'maintenance'),
    ('Al Aweer-Dubai Backup', 'Al Aweer Main Substation', 'Dubai South Junction', 132.0, 32.7, 'active')
  ) AS v(name, from_node_name, to_node_name, voltage_kv, length_km, status)
  INNER JOIN nodes_lookup from_node ON from_node.name = v.from_node_name
  INNER JOIN nodes_lookup to_node ON to_node.name = v.to_node_name
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    from_node_id = EXCLUDED.from_node_id,
    to_node_id = EXCLUDED.to_node_id,
    voltage_kv = EXCLUDED.voltage_kv,
    length_km = EXCLUDED.length_km,
    status = EXCLUDED.status
  RETURNING id, name
)
SELECT COUNT(*) FROM upsert_lines;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_line_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_line_count
  FROM grid_lines gl
  INNER JOIN tenants t ON t.id = gl.tenant_id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_line_count < 6 THEN
    RAISE EXCEPTION 'SEED 002_grid_topology.sql FAILED: expected >= 6 grid_lines for DEWA tenant, found %', v_line_count;
  END IF;
  
  RAISE NOTICE 'Seed 002_grid_topology.sql OK: grid_lines=%', v_line_count;
END $$;

COMMIT;
