-- Seed data for linear asset issues
-- This creates 4 issues (one per type) linked to existing grid lines
-- Uses CTE pattern with precondition checks and idempotent upserts

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_line_count INTEGER;
BEGIN
  -- 1) Verify tenant exists
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

  -- 2) Verify grid lines exist (count >= 4)
  SELECT COUNT(*) INTO v_line_count
  FROM grid_lines gl
  INNER JOIN tenants t ON gl.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_line_count < 4 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 4 grid_lines for DEWA tenant, found %. Run 002_grid_topology.sql first.', v_line_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, grid_lines=%', v_line_count;
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
-- 2) Lookup grid lines by name
lines_lookup AS (
  SELECT gl.id, gl.name
  FROM grid_lines gl
  INNER JOIN tenant t ON gl.tenant_id = t.id
  WHERE gl.name IN (
    'Central-Jebel Ali Main Line',
    'Dubai Main-South Feeder',
    'Al Aweer-Dubai Backup',
    'Dubai-Jebel Ali Direct'
  )
),
-- 3) Insert linear asset issues (one per type) - idempotent via DELETE + INSERT
delete_existing AS (
  DELETE FROM linear_asset_issues
  WHERE tenant_id IN (SELECT id FROM tenant)
  RETURNING id
),
insert_issues AS (
  INSERT INTO linear_asset_issues (tenant_id, grid_line_id, type, description, severity, created_at, resolved_at)
  SELECT 
    tenant.id,
    line.id,
    v.type,
    v.description,
    v.severity,
    v.created_at,
    v.resolved_at
  FROM tenant
  CROSS JOIN (VALUES
    ('Central-Jebel Ali Main Line', 'thermal_overload', 'Conductor temperature exceeding 85°C during peak load hours. Requires load balancing or conductor upgrade.', 'high', NOW() - INTERVAL '3 days', NULL),
    ('Dubai Main-South Feeder', 'protection_fault', 'Distance protection relay Zone 2 tripped unexpectedly. Requires relay settings review and coordination study.', 'critical', NOW() - INTERVAL '1 day', NULL),
    ('Al Aweer-Dubai Backup', 'insulator_damage', 'Visual inspection revealed cracked porcelain insulators at tower 47. Replacement scheduled for next maintenance window.', 'medium', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
    ('Dubai-Jebel Ali Direct', 'conductor_sag', 'Conductor sag exceeds clearance limits by 0.8m at midspan. Requires tension adjustment or tower height increase.', 'high', NOW() - INTERVAL '5 days', NULL)
  ) AS v(line_name, type, description, severity, created_at, resolved_at)
  INNER JOIN lines_lookup line ON line.name = v.line_name
  RETURNING id, type
)
SELECT COUNT(*) FROM insert_issues;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_issue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_issue_count
  FROM linear_asset_issues lai
  INNER JOIN tenants t ON t.id = lai.tenant_id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_issue_count < 4 THEN
    RAISE EXCEPTION 'SEED 010_linear_asset_issues.sql FAILED: expected >= 4 linear_asset_issues for DEWA tenant, found %', v_issue_count;
  END IF;
  
  RAISE NOTICE 'Seed 010_linear_asset_issues.sql OK: linear_asset_issues=%', v_issue_count;
END $$;

COMMIT;
