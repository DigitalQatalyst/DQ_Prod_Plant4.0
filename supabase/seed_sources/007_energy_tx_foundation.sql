-- Seed data for EMS Power Transmission - Foundation Topology
-- Creates sample substations, bays, feeders, transformers, and transmission lines
-- Uses CTE pattern with preconditions, idempotent upserts, and postchecks
-- Requirements: 1.7, 1.8, 30.2, 30.3, 30.4

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
BEGIN
  -- Verify transmission tenant exists
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
  
  RAISE NOTICE 'Preconditions passed: tenant exists';
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

-- 2) Upsert substations using natural key (org_id, code)
upsert_substations AS (
  INSERT INTO tx_substations (org_id, code, name, region, voltage_levels_kv, active)
  SELECT 
    tenant.id,
    v.code,
    v.name,
    v.region,
    v.voltage_levels_kv,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    ('SS-DXB-MAIN', 'Dubai Main Substation', 'Dubai', ARRAY[400, 132], true),
    ('SS-JA-MAIN', 'Jebel Ali Main Substation', 'Jebel Ali', ARRAY[400, 220], true),
    ('SS-AW-MAIN', 'Al Aweer Main Substation', 'Al Aweer', ARRAY[220, 132], true),
    ('SS-DXB-SOUTH', 'Dubai South Substation', 'Dubai', ARRAY[132, 33], true),
    ('SS-CENTRAL', 'Central Grid Hub', 'Central Dubai', ARRAY[400], true)
  ) AS v(code, name, region, voltage_levels_kv, active)
  ON CONFLICT (org_id, code)
  DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    voltage_levels_kv = EXCLUDED.voltage_levels_kv,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, code, name
),

-- 3) Force dependency: lookup substations from upsert + existing
substations_lookup AS (
  SELECT id, code, name FROM upsert_substations
  UNION ALL
  SELECT s.id, s.code, s.name
  FROM tx_substations s
  INNER JOIN tenant t ON s.org_id = t.id
  WHERE s.code IN (
    'SS-DXB-MAIN',
    'SS-JA-MAIN',
    'SS-AW-MAIN',
    'SS-DXB-SOUTH',
    'SS-CENTRAL'
  )
),

-- 4) Upsert bays using natural key (substation_id, bay_code)
upsert_bays AS (
  INSERT INTO tx_bays (substation_id, bay_code, name, bay_type, voltage_level_kv, active)
  SELECT 
    sub.id,
    v.bay_code,
    v.name,
    v.bay_type,
    v.voltage_level_kv,
    v.active
  FROM substations_lookup sub
  CROSS JOIN (VALUES
    ('SS-DXB-MAIN', 'BAY-01', 'Line Bay 1 - 400kV', 'line_bay', 400, true),
    ('SS-DXB-MAIN', 'BAY-02', 'Line Bay 2 - 400kV', 'line_bay', 400, true),
    ('SS-DXB-MAIN', 'BAY-T1', 'Transformer Bay T1', 'transformer_bay', 400, true),
    ('SS-DXB-MAIN', 'BAY-BC', 'Bus Coupler Bay', 'bus_coupler', 400, true),
    ('SS-JA-MAIN', 'BAY-01', 'Line Bay 1 - 400kV', 'line_bay', 400, true),
    ('SS-JA-MAIN', 'BAY-T1', 'Transformer Bay T1', 'transformer_bay', 400, true),
    ('SS-AW-MAIN', 'BAY-01', 'Line Bay 1 - 220kV', 'line_bay', 220, true),
    ('SS-AW-MAIN', 'BAY-T1', 'Transformer Bay T1', 'transformer_bay', 220, true)
  ) AS v(substation_code, bay_code, name, bay_type, voltage_level_kv, active)
  WHERE sub.code = v.substation_code
  ON CONFLICT (substation_id, bay_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    bay_type = EXCLUDED.bay_type,
    voltage_level_kv = EXCLUDED.voltage_level_kv,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, bay_code
),

-- 5) Upsert feeders using natural key (substation_id, feeder_code)
upsert_feeders AS (
  INSERT INTO tx_feeders (substation_id, feeder_code, name, voltage_level_kv, direction, capacity_mva, active)
  SELECT 
    sub.id,
    v.feeder_code,
    v.name,
    v.voltage_level_kv,
    v.direction,
    v.capacity_mva,
    v.active
  FROM substations_lookup sub
  CROSS JOIN (VALUES
    ('SS-DXB-MAIN', 'FDR-IN-01', 'Incomer Feeder 1 - 400kV', 400, 'incomer', 500.0, true),
    ('SS-DXB-MAIN', 'FDR-OUT-01', 'Outgoing Feeder 1 - 132kV', 132, 'outgoer', 150.0, true),
    ('SS-DXB-MAIN', 'FDR-OUT-02', 'Outgoing Feeder 2 - 132kV', 132, 'outgoer', 150.0, true),
    ('SS-JA-MAIN', 'FDR-IN-01', 'Incomer Feeder 1 - 400kV', 400, 'incomer', 600.0, true),
    ('SS-JA-MAIN', 'FDR-OUT-01', 'Outgoing Feeder 1 - 220kV', 220, 'outgoer', 200.0, true),
    ('SS-AW-MAIN', 'FDR-IN-01', 'Incomer Feeder 1 - 220kV', 220, 'incomer', 300.0, true),
    ('SS-AW-MAIN', 'FDR-OUT-01', 'Outgoing Feeder 1 - 132kV', 132, 'outgoer', 100.0, true),
    ('SS-AW-MAIN', 'FDR-OUT-02', 'Outgoing Feeder 2 - 132kV', 132, 'outgoer', 100.0, true),
    ('SS-DXB-SOUTH', 'FDR-IN-01', 'Incomer Feeder 1 - 132kV', 132, 'incomer', 150.0, true),
    ('SS-DXB-SOUTH', 'FDR-OUT-01', 'Outgoing Feeder 1 - 33kV', 33, 'outgoer', 50.0, true)
  ) AS v(substation_code, feeder_code, name, voltage_level_kv, direction, capacity_mva, active)
  WHERE sub.code = v.substation_code
  ON CONFLICT (substation_id, feeder_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    voltage_level_kv = EXCLUDED.voltage_level_kv,
    direction = EXCLUDED.direction,
    capacity_mva = EXCLUDED.capacity_mva,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, feeder_code
),

-- 6) Upsert transformers using natural key (substation_id, transformer_code)
upsert_transformers AS (
  INSERT INTO tx_transformers (
    substation_id, 
    transformer_code, 
    name, 
    primary_voltage_kv, 
    secondary_voltage_kv,
    tertiary_voltage_kv,
    rated_capacity_mva,
    cooling_type,
    tap_changer_type,
    active
  )
  SELECT 
    sub.id,
    v.transformer_code,
    v.name,
    v.primary_voltage_kv,
    v.secondary_voltage_kv,
    v.tertiary_voltage_kv,
    v.rated_capacity_mva,
    v.cooling_type,
    v.tap_changer_type,
    v.active
  FROM substations_lookup sub
  CROSS JOIN (VALUES
    ('SS-DXB-MAIN', 'T1', 'Main Transformer T1', 400, 132, NULL, 500.0, 'ONAF', 'OLTC', true),
    ('SS-DXB-MAIN', 'T2', 'Main Transformer T2', 400, 132, NULL, 500.0, 'ONAF', 'OLTC', true),
    ('SS-JA-MAIN', 'T1', 'Main Transformer T1', 400, 220, 33, 600.0, 'OFAF', 'OLTC', true),
    ('SS-AW-MAIN', 'T1', 'Main Transformer T1', 220, 132, NULL, 300.0, 'ONAN', 'OLTC', true),
    ('SS-AW-MAIN', 'T2', 'Main Transformer T2', 220, 132, NULL, 300.0, 'ONAN', 'OLTC', true),
    ('SS-DXB-SOUTH', 'T1', 'Distribution Transformer T1', 132, 33, NULL, 150.0, 'ONAN', 'DETC', true)
  ) AS v(
    substation_code, 
    transformer_code, 
    name, 
    primary_voltage_kv, 
    secondary_voltage_kv,
    tertiary_voltage_kv,
    rated_capacity_mva,
    cooling_type,
    tap_changer_type,
    active
  )
  WHERE sub.code = v.substation_code
  ON CONFLICT (substation_id, transformer_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    primary_voltage_kv = EXCLUDED.primary_voltage_kv,
    secondary_voltage_kv = EXCLUDED.secondary_voltage_kv,
    tertiary_voltage_kv = EXCLUDED.tertiary_voltage_kv,
    rated_capacity_mva = EXCLUDED.rated_capacity_mva,
    cooling_type = EXCLUDED.cooling_type,
    tap_changer_type = EXCLUDED.tap_changer_type,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, transformer_code
),

-- 7) Upsert transmission lines using natural key (org_id, line_code)
upsert_lines AS (
  INSERT INTO tx_lines (
    org_id,
    line_code,
    name,
    from_substation_id,
    to_substation_id,
    voltage_level_kv,
    length_km,
    conductor_type,
    thermal_rating_mva,
    active
  )
  SELECT 
    tenant.id,
    v.line_code,
    v.name,
    from_sub.id,
    to_sub.id,
    v.voltage_level_kv,
    v.length_km,
    v.conductor_type,
    v.thermal_rating_mva,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    ('LINE-CENTRAL-DXB', 'Central Hub to Dubai Main', 'SS-CENTRAL', 'SS-DXB-MAIN', 400, 12.5, 'ACSR Drake', 1200.0, true),
    ('LINE-CENTRAL-JA', 'Central Hub to Jebel Ali', 'SS-CENTRAL', 'SS-JA-MAIN', 400, 35.8, 'ACSR Drake', 1200.0, true),
    ('LINE-CENTRAL-AW', 'Central Hub to Al Aweer', 'SS-CENTRAL', 'SS-AW-MAIN', 220, 28.3, 'ACSR Cardinal', 600.0, true),
    ('LINE-DXB-SOUTH', 'Dubai Main to Dubai South', 'SS-DXB-MAIN', 'SS-DXB-SOUTH', 132, 8.2, 'ACSR Bluejay', 300.0, true),
    ('LINE-DXB-JA', 'Dubai Main to Jebel Ali Direct', 'SS-DXB-MAIN', 'SS-JA-MAIN', 400, 42.6, 'ACSR Drake', 1200.0, true),
    ('LINE-AW-SOUTH', 'Al Aweer to Dubai South Backup', 'SS-AW-MAIN', 'SS-DXB-SOUTH', 132, 32.7, 'ACSR Bluejay', 300.0, true)
  ) AS v(
    line_code,
    name,
    from_substation_code,
    to_substation_code,
    voltage_level_kv,
    length_km,
    conductor_type,
    thermal_rating_mva,
    active
  )
  INNER JOIN substations_lookup from_sub ON from_sub.code = v.from_substation_code
  INNER JOIN substations_lookup to_sub ON to_sub.code = v.to_substation_code
  ON CONFLICT (org_id, line_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    from_substation_id = EXCLUDED.from_substation_id,
    to_substation_id = EXCLUDED.to_substation_id,
    voltage_level_kv = EXCLUDED.voltage_level_kv,
    length_km = EXCLUDED.length_km,
    conductor_type = EXCLUDED.conductor_type,
    thermal_rating_mva = EXCLUDED.thermal_rating_mva,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, line_code
)

-- Return counts for verification
SELECT 
  (SELECT COUNT(*) FROM upsert_substations) as substations_count,
  (SELECT COUNT(*) FROM upsert_bays) as bays_count,
  (SELECT COUNT(*) FROM upsert_feeders) as feeders_count,
  (SELECT COUNT(*) FROM upsert_transformers) as transformers_count,
  (SELECT COUNT(*) FROM upsert_lines) as lines_count;

-- ============================================================================
-- POST-SEED VALIDATION (POSTCHECKS)
-- Fail loudly if expected counts are not met or integrity is violated
-- ============================================================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_substation_count INTEGER;
  v_bay_count INTEGER;
  v_feeder_count INTEGER;
  v_transformer_count INTEGER;
  v_line_count INTEGER;
  v_orphan_bays INTEGER;
  v_orphan_feeders INTEGER;
  v_orphan_transformers INTEGER;
  v_orphan_lines INTEGER;
  v_duplicate_substations INTEGER;
  v_duplicate_feeders INTEGER;
  v_duplicate_transformers INTEGER;
  v_invalid_lines INTEGER;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  -- Check row counts
  SELECT COUNT(*) INTO v_substation_count
  FROM tx_substations WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_bay_count
  FROM tx_bays b
  INNER JOIN tx_substations s ON b.substation_id = s.id
  WHERE s.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_feeder_count
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  WHERE s.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_transformer_count
  FROM tx_transformers t
  INNER JOIN tx_substations s ON t.substation_id = s.id
  WHERE s.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_line_count
  FROM tx_lines WHERE org_id = v_tenant_id;
  
  -- Validate expected counts
  IF v_substation_count < 5 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 5 substations, found %', v_substation_count;
  END IF;
  
  IF v_bay_count < 8 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 8 bays, found %', v_bay_count;
  END IF;
  
  IF v_feeder_count < 10 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 10 feeders, found %', v_feeder_count;
  END IF;
  
  IF v_transformer_count < 6 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 6 transformers, found %', v_transformer_count;
  END IF;
  
  IF v_line_count < 6 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 6 transmission lines, found %', v_line_count;
  END IF;
  
  -- Check FK integrity (orphaned records)
  SELECT COUNT(*) INTO v_orphan_bays
  FROM tx_bays b
  WHERE NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = b.substation_id);
  
  SELECT COUNT(*) INTO v_orphan_feeders
  FROM tx_feeders f
  WHERE NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = f.substation_id);
  
  SELECT COUNT(*) INTO v_orphan_transformers
  FROM tx_transformers t
  WHERE NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = t.substation_id);
  
  SELECT COUNT(*) INTO v_orphan_lines
  FROM tx_lines l
  WHERE NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = l.from_substation_id)
     OR NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = l.to_substation_id);
  
  IF v_orphan_bays > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned bays (missing substation reference)', v_orphan_bays;
  END IF;
  
  IF v_orphan_feeders > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned feeders (missing substation reference)', v_orphan_feeders;
  END IF;
  
  IF v_orphan_transformers > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned transformers (missing substation reference)', v_orphan_transformers;
  END IF;
  
  IF v_orphan_lines > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned transmission lines (missing substation reference)', v_orphan_lines;
  END IF;
  
  -- Check uniqueness constraints
  SELECT COUNT(*) - COUNT(DISTINCT (org_id, code)) INTO v_duplicate_substations
  FROM tx_substations WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) - COUNT(DISTINCT (substation_id, feeder_code)) INTO v_duplicate_feeders
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  WHERE s.org_id = v_tenant_id;
  
  SELECT COUNT(*) - COUNT(DISTINCT (substation_id, transformer_code)) INTO v_duplicate_transformers
  FROM tx_transformers t
  INNER JOIN tx_substations s ON t.substation_id = s.id
  WHERE s.org_id = v_tenant_id;
  
  IF v_duplicate_substations > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate substations (org_id, code) pairs', v_duplicate_substations;
  END IF;
  
  IF v_duplicate_feeders > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate feeders (substation_id, feeder_code) pairs', v_duplicate_feeders;
  END IF;
  
  IF v_duplicate_transformers > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate transformers (substation_id, transformer_code) pairs', v_duplicate_transformers;
  END IF;
  
  -- Check business rules (transmission lines must connect different substations)
  SELECT COUNT(*) INTO v_invalid_lines
  FROM tx_lines
  WHERE org_id = v_tenant_id
    AND from_substation_id = to_substation_id;
  
  IF v_invalid_lines > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % transmission lines with same from/to substation', v_invalid_lines;
  END IF;
  
  RAISE NOTICE 'Seed 2700_seed_energy_tx_foundation.sql OK: substations=%, bays=%, feeders=%, transformers=%, lines=%', 
    v_substation_count, v_bay_count, v_feeder_count, v_transformer_count, v_line_count;
END $$;

COMMIT;
