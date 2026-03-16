-- Seed data for grid_asset_links (asset-to-topology relationships)
-- This creates links between assets and grid nodes/lines for Transmission UI
-- Uses clean CTE pattern with WHERE NOT EXISTS for idempotency (no unique constraint)
-- Seeds now hard-fail with meaningful messages if preconditions are unmet.

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count int;
  v_assets int;
  v_nodes int;
  v_lines int;
BEGIN
  -- 1) Verify tenant exists exactly
  SELECT count(*) INTO v_tenant_count
  FROM tenants
  WHERE name='DEWA - Transmission'
    AND sector='power'
    AND subsector='transmission'
    AND scenario_tag='power_transmission_demo_v1';
  
  IF v_tenant_count <> 1 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED (006_grid_asset_links): expected exactly 1 DEWA tenant, found %', v_tenant_count;
  END IF;

  -- 2) Verify assets exist (at least 15)
  SELECT count(*) INTO v_assets
  FROM assets a
  JOIN tenants t ON t.id=a.tenant_id
  WHERE t.name='DEWA - Transmission'
    AND t.sector='power'
    AND t.subsector='transmission'
    AND t.scenario_tag='power_transmission_demo_v1';
  
  IF v_assets < 15 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED (006_grid_asset_links): expected >=15 assets, found %. Run 003_assets.sql first.', v_assets;
  END IF;

  -- 3) Verify grid_nodes exist (at least 5)
  SELECT count(*) INTO v_nodes
  FROM grid_nodes n
  JOIN tenants t ON t.id=n.tenant_id
  WHERE t.name='DEWA - Transmission'
    AND t.sector='power'
    AND t.subsector='transmission'
    AND t.scenario_tag='power_transmission_demo_v1';
  
  IF v_nodes < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED (006_grid_asset_links): expected >=5 grid_nodes, found %. Run 002_grid_topology.sql first.', v_nodes;
  END IF;

  -- 4) Verify grid_lines exist (at least 6)
  SELECT count(*) INTO v_lines
  FROM grid_lines l
  JOIN tenants t ON t.id=l.tenant_id
  WHERE t.name='DEWA - Transmission'
    AND t.sector='power'
    AND t.subsector='transmission'
    AND t.scenario_tag='power_transmission_demo_v1';
  
  IF v_lines < 6 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED (006_grid_asset_links): expected >=6 grid_lines, found %. Run 002_grid_topology.sql first.', v_lines;
  END IF;

  RAISE NOTICE 'Preconditions passed: tenant=1, assets=%, nodes=%, lines=%', v_assets, v_nodes, v_lines;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

WITH tenant AS (
  SELECT id
  FROM tenants
  WHERE name='DEWA - Transmission'
    AND sector='power'
    AND subsector='transmission'
    AND scenario_tag='power_transmission_demo_v1'
  LIMIT 1
),
mapping AS (
  SELECT * FROM (VALUES
    -- Node links (15 assets)
    ('Dubai T1 Main Transformer',      'Dubai Main Substation',    NULL),
    ('Dubai T2 Backup Transformer',    'Dubai Main Substation',    NULL),
    ('Dubai 400kV Incomer CB',         'Dubai Main Substation',    NULL),
    ('Dubai 132kV Feeder CB',          'Dubai Main Substation',    NULL),
    ('Dubai 400kV Bay 1',              'Dubai Main Substation',    NULL),
    ('Dubai Main Feeder Meter',        'Dubai Main Substation',    NULL),
    ('Jebel Ali T1 Main Transformer',  'Jebel Ali Main Substation', NULL),
    ('Jebel Ali 400kV Incomer CB',     'Jebel Ali Main Substation', NULL),
    ('Jebel Ali 132kV Feeder CB',      'Jebel Ali Main Substation', NULL),
    ('Jebel Ali 400kV Bay 1',          'Jebel Ali Main Substation', NULL),
    ('Jebel Ali Import Meter',         'Jebel Ali Main Substation', NULL),
    ('Al Aweer T1 Main Transformer',   'Al Aweer Main Substation',  NULL),
    ('Al Aweer 220kV Incomer CB',      'Al Aweer Main Substation',  NULL),
    ('Al Aweer 220kV Bay 1',           'Al Aweer Main Substation',  NULL),
    ('Al Aweer Regional Meter',        'Al Aweer Main Substation',  NULL),
    -- Optional: demonstrate "assets on a line" (3 line links)
    ('Dubai 400kV Incomer CB',         NULL, 'Dubai-Jebel Ali Direct'),
    ('Jebel Ali 400kV Incomer CB',     NULL, 'Central-Jebel Ali Main Line'),
    ('Al Aweer 220kV Incomer CB',      NULL, 'Central-Al Aweer Main Line')
  ) AS v(asset_name, node_name, line_name)
),
resolved AS (
  SELECT
    a.id AS asset_id,
    n.id AS node_id,
    l.id AS line_id
  FROM tenant
  JOIN mapping m ON TRUE
  JOIN assets a
    ON a.tenant_id = tenant.id
    AND a.name = m.asset_name
  LEFT JOIN grid_nodes n
    ON n.tenant_id = tenant.id
    AND m.node_name IS NOT NULL
    AND n.name = m.node_name
  LEFT JOIN grid_lines l
    ON l.tenant_id = tenant.id
    AND m.line_name IS NOT NULL
    AND l.name = m.line_name
  WHERE (n.id IS NOT NULL OR l.id IS NOT NULL)
),
ins AS (
  INSERT INTO grid_asset_links (asset_id, node_id, line_id)
  SELECT r.asset_id, r.node_id, r.line_id
  FROM resolved r
  WHERE NOT EXISTS (
    SELECT 1
    FROM grid_asset_links gal
    WHERE gal.asset_id = r.asset_id
      AND ((r.node_id IS NOT NULL AND gal.node_id = r.node_id)
        OR (r.line_id IS NOT NULL AND gal.line_id = r.line_id))
  )
  RETURNING id
)
SELECT count(*) AS inserted_links FROM ins;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  c int;
BEGIN
  SELECT count(*) INTO c
  FROM grid_asset_links gal
  JOIN assets a ON a.id = gal.asset_id
  JOIN tenants t ON t.id = a.tenant_id
  WHERE t.name='DEWA - Transmission'
    AND t.sector='power'
    AND t.subsector='transmission'
    AND t.scenario_tag='power_transmission_demo_v1';
  
  IF c < 15 THEN
    RAISE EXCEPTION 'SEED 006_grid_asset_links FAILED: expected >=15 links for DEWA tenant, found %', c;
  END IF;
  
  RAISE NOTICE 'Seed 006_grid_asset_links OK: links=%', c;
END $$;

COMMIT;
