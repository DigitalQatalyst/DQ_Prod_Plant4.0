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
),

-- Upsert tenant_profile
profile_upsert AS (
  INSERT INTO tenant_profile (tenant_id, logo_url, region, timezone, currency_code, regulatory_profile)
  SELECT 
    t.id,
    NULL,
    'North America',
    'America/New_York',
    'USD',
    '{"standards": ["NERC CIP", "IEEE 1547"]}'::jsonb
  FROM tenant_lookup t
  ON CONFLICT (tenant_id) DO UPDATE
  SET region = EXCLUDED.region,
      timezone = EXCLUDED.timezone,
      currency_code = EXCLUDED.currency_code
  RETURNING *
),

-- Upsert streams
stream_upsert AS (
  INSERT INTO streams (tenant_id, code, name, kind, status, is_default)
  SELECT t.id, code, name, kind, status, is_default
  FROM tenant_lookup t
  CROSS JOIN (VALUES
    ('MAIN', 'Main Production', 'production', 'active', true),
    ('PILOT', 'Pilot Program', 'pilot', 'active', false),
    ('RND', 'Research & Development', 'research', 'active', false)
  ) AS s(code, name, kind, status, is_default)
  ON CONFLICT (tenant_id, code) DO UPDATE
  SET name = EXCLUDED.name,
      kind = EXCLUDED.kind,
      status = EXCLUDED.status,
      is_default = EXCLUDED.is_default
  RETURNING *
),

-- Upsert programs
program_upsert AS (
  INSERT INTO programs (tenant_id, name, description, status)
  SELECT t.id, name, description, status
  FROM tenant_lookup t
  CROSS JOIN (VALUES
    ('Grid Modernization', 'Modernize transmission grid infrastructure', 'active'),
    ('Renewable Integration', 'Integrate renewable energy sources', 'active'),
    ('Asset Reliability', 'Improve asset reliability and uptime', 'active'),
    ('Cybersecurity Enhancement', 'Enhance cybersecurity posture', 'planned')
  ) AS p(name, description, status)
  ON CONFLICT (tenant_id, name) DO UPDATE
  SET description = EXCLUDED.description,
      status = EXCLUDED.status
  RETURNING *
)

SELECT 'Tenant profile, streams, and programs seeded' AS result;

-- Post-seed validation
DO $$
DECLARE
  v_profile_count INTEGER;
  v_stream_count INTEGER;
  v_program_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM tenant_profile;
  SELECT COUNT(*) INTO v_stream_count FROM streams;
  SELECT COUNT(*) INTO v_program_count FROM programs;
  
  IF v_profile_count < 1 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 1 tenant_profile, got %', v_profile_count;
  END IF;
  
  IF v_stream_count < 3 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 3 streams, got %', v_stream_count;
  END IF;
  
  IF v_program_count < 2 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 2 programs, got %', v_program_count;
  END IF;
END $$;

COMMIT;
