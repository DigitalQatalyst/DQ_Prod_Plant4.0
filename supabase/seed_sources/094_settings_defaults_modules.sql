BEGIN;

-- Precondition: Ensure tenant and streams exist
DO $$
DECLARE
  v_tenant_id UUID;
  v_stream_count INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  SELECT COUNT(*) INTO v_stream_count FROM streams;
  
  IF v_tenant_id IS NULL OR v_stream_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants or streams found';
  END IF;
END $$;

-- 1) Seed Tenant Units
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO tenant_units (tenant_id, unit_system)
SELECT 
  t.id,
  jsonb_build_object(
    'temperature', 'C',
    'power', 'MW',
    'pressure', 'bar',
    'frequency', 'Hz',
    'date_format', 'DD-MM-YYYY',
    'currency', 'AED'
  )
FROM tenant_lookup t
ON CONFLICT (tenant_id) DO UPDATE SET unit_system = EXCLUDED.unit_system;

-- 2) Seed Module Toggles
-- Matrix: 8 features x 3 streams = 24 toggles
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
),
streams_data AS (
  SELECT id, code FROM streams
),
feature_areas AS (
  SELECT unnest(ARRAY[
    'Asset Catalog', 
    'Connectivity', 
    'Topology', 
    'Overview', 
    'Settings', 
    'Cybersecurity', 
    'Reliability', 
    'Energy'
  ]) AS area
)
INSERT INTO module_toggles (tenant_id, stream_id, feature_area, enabled, readiness_state)
SELECT 
  t.id,
  s.id,
  f.area,
  CASE 
    WHEN s.code = 'MAIN' THEN true
    WHEN s.code = 'PILOT' THEN true
    WHEN s.code = 'RND' AND f.area IN ('Cybersecurity', 'Energy') THEN false
    ELSE true
  END,
  CASE 
    WHEN s.code = 'MAIN' THEN 'GA'
    WHEN s.code = 'PILOT' THEN 'Beta'
    ELSE 'Alpha'
  END
FROM tenant_lookup t
CROSS JOIN streams_data s
CROSS JOIN feature_areas f
ON CONFLICT (tenant_id, stream_id, feature_area) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  readiness_state = EXCLUDED.readiness_state;

-- Post-seed validation
DO $$
DECLARE
  v_unit_count INTEGER;
  v_toggle_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unit_count FROM tenant_units;
  SELECT COUNT(*) INTO v_toggle_count FROM module_toggles;
  
  IF v_unit_count < 1 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 1 tenant_units, got %', v_unit_count;
  END IF;
  
  IF v_toggle_count < 20 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 20 module_toggles, got %', v_toggle_count;
  END IF;
END $$;

COMMIT;
