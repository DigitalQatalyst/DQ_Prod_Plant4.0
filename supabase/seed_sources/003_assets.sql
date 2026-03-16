-- Seed data for Power Transmission assets
-- This creates asset types and 15 assets distributed across sites
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
-- 2) Upsert asset types
upsert_asset_types AS (
  INSERT INTO asset_types (tenant_id, code, name, category, properties_schema)
  SELECT 
    tenant.id,
    v.code,
    v.name,
    v.category,
    v.properties_schema::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('TRANSFORMER', 'Power Transformer', 'electrical', '{"voltage_primary": "number", "voltage_secondary": "number", "capacity_mva": "number", "cooling_type": "string"}'),
    ('BREAKER', 'Circuit Breaker', 'protection', '{"rated_voltage": "number", "rated_current": "number", "breaking_capacity": "number", "mechanism_type": "string"}'),
    ('BAY', 'Switchgear Bay', 'switching', '{"voltage_level": "number", "bay_type": "string", "busbar_config": "string"}'),
    ('METER', 'Energy Meter', 'measurement', '{"meter_type": "string", "accuracy_class": "string", "communication_protocol": "string"}')
  ) AS v(code, name, category, properties_schema)
  ON CONFLICT (tenant_id, code)
  DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    properties_schema = EXCLUDED.properties_schema
  RETURNING id, code
),
-- 3) Force dependency: lookup asset_types from upsert_asset_types + existing asset_types
asset_types_lookup AS (
  -- Force dependency: ensures upsert_asset_types executes before assets insert resolves
  SELECT id, code FROM upsert_asset_types
  UNION ALL
  SELECT at.id, at.code
  FROM asset_types at
  INNER JOIN tenant t ON at.tenant_id = t.id
  WHERE at.code IN ('TRANSFORMER', 'BREAKER', 'BAY', 'METER')
),
-- 4) Upsert assets (join to asset_types_lookup to enforce execution order)
upsert_assets AS (
  INSERT INTO assets (tenant_id, site_id, asset_type_id, name, status, criticality, properties)
  SELECT 
    tenant.id,
    s.id,
    at.id,
    v.name,
    v.status,
    v.criticality,
    v.properties::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    -- Dubai Main Substation assets
    ('Dubai Main Substation', 'TRANSFORMER', 'Dubai T1 Main Transformer', 'online', 'critical', '{"type": "transformer", "voltage_primary": 400, "voltage_secondary": 132, "capacity_mva": 250, "cooling_type": "ONAF"}'),
    ('Dubai Main Substation', 'TRANSFORMER', 'Dubai T2 Backup Transformer', 'online', 'high', '{"type": "transformer", "voltage_primary": 400, "voltage_secondary": 132, "capacity_mva": 160, "cooling_type": "ONAF"}'),
    ('Dubai Main Substation', 'BREAKER', 'Dubai 400kV Incomer CB', 'online', 'critical', '{"type": "circuit-breaker", "rated_voltage": 400, "rated_current": 3150, "breaking_capacity": 63, "mechanism_type": "SF6"}'),
    ('Dubai Main Substation', 'BREAKER', 'Dubai 132kV Feeder CB', 'online', 'high', '{"type": "circuit-breaker", "rated_voltage": 132, "rated_current": 2000, "breaking_capacity": 40, "mechanism_type": "SF6"}'),
    ('Dubai Main Substation', 'BAY', 'Dubai 400kV Bay 1', 'online', 'high', '{"type": "bay-controller", "voltage_level": 400, "bay_type": "line", "busbar_config": "double"}'),
    ('Dubai Main Substation', 'METER', 'Dubai Main Feeder Meter', 'online', 'medium', '{"type": "meter", "meter_type": "revenue", "accuracy_class": "0.2S", "communication_protocol": "IEC61850"}'),
    -- Jebel Ali Grid Station assets
    ('Jebel Ali Grid Station', 'TRANSFORMER', 'Jebel Ali T1 Main Transformer', 'online', 'critical', '{"type": "transformer", "voltage_primary": 400, "voltage_secondary": 132, "capacity_mva": 300, "cooling_type": "ONAF"}'),
    ('Jebel Ali Grid Station', 'BREAKER', 'Jebel Ali 400kV Incomer CB', 'maintenance', 'critical', '{"type": "circuit-breaker", "rated_voltage": 400, "rated_current": 4000, "breaking_capacity": 63, "mechanism_type": "SF6"}'),
    ('Jebel Ali Grid Station', 'BREAKER', 'Jebel Ali 132kV Feeder CB', 'online', 'high', '{"type": "circuit-breaker", "rated_voltage": 132, "rated_current": 2500, "breaking_capacity": 40, "mechanism_type": "SF6"}'),
    ('Jebel Ali Grid Station', 'BAY', 'Jebel Ali 400kV Bay 1', 'online', 'high', '{"type": "bay-controller", "voltage_level": 400, "bay_type": "transformer", "busbar_config": "double"}'),
    ('Jebel Ali Grid Station', 'METER', 'Jebel Ali Import Meter', 'online', 'medium', '{"type": "meter", "meter_type": "revenue", "accuracy_class": "0.2S", "communication_protocol": "IEC61850"}'),
    -- Al Aweer Regional Hub assets
    ('Al Aweer Regional Hub', 'TRANSFORMER', 'Al Aweer T1 Main Transformer', 'online', 'high', '{"type": "transformer", "voltage_primary": 220, "voltage_secondary": 132, "capacity_mva": 100, "cooling_type": "ONAN"}'),
    ('Al Aweer Regional Hub', 'BREAKER', 'Al Aweer 220kV Incomer CB', 'online', 'high', '{"type": "circuit-breaker", "rated_voltage": 220, "rated_current": 2000, "breaking_capacity": 40, "mechanism_type": "SF6"}'),
    ('Al Aweer Regional Hub', 'BAY', 'Al Aweer 220kV Bay 1', 'offline', 'medium', '{"type": "bay-controller", "voltage_level": 220, "bay_type": "line", "busbar_config": "single"}'),
    ('Al Aweer Regional Hub', 'METER', 'Al Aweer Regional Meter', 'online', 'low', '{"type": "meter", "meter_type": "check", "accuracy_class": "0.5S", "communication_protocol": "IEC61850"}')
  ) AS v(site_name, asset_type_code, name, status, criticality, properties)
  INNER JOIN sites s ON s.tenant_id = tenant.id AND s.name = v.site_name
  INNER JOIN asset_types_lookup at ON at.code = v.asset_type_code
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    asset_type_id = EXCLUDED.asset_type_id,
    status = EXCLUDED.status,
    criticality = EXCLUDED.criticality,
    properties = EXCLUDED.properties,
    updated_at = now()
  RETURNING id, name
)
SELECT COUNT(*) FROM upsert_assets;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_asset_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_asset_count
  FROM assets a
  INNER JOIN tenants t ON t.id = a.tenant_id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_asset_count < 15 THEN
    RAISE EXCEPTION 'SEED 003_assets.sql FAILED: expected >= 15 assets for DEWA tenant, found %', v_asset_count;
  END IF;
  
  RAISE NOTICE 'Seed 003_assets.sql OK: assets=%', v_asset_count;
END $$;

COMMIT;
