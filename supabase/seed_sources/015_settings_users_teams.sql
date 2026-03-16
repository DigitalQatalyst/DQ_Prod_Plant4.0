BEGIN;

-- Precondition: Ensure tenant exists
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: No tenants found';
  END IF;
END $$;

-- 1) Seed Responsibility Labels
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO responsibility_labels (tenant_id, code, name)
SELECT 
  t.id,
  v.code,
  v.name
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('ASSET_OWNER', 'Asset Owner'),
  ('SYSTEM_ADMIN', 'System Administrator'),
  ('MAINTENANCE_LEAD', 'Maintenance Lead'),
  ('RELIABILITY_ENG', 'Reliability Engineer'),
  ('OPERATIONS_SPEC', 'Operations Specialist'),
  ('SECURITY_OFFICER', 'Security Officer'),
  ('ENERGY_TRADER', 'Energy Trader'),
  ('FIELD_TECH', 'Field Technician')
) AS v(code, name)
ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name;

-- 2) Seed Teams
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO teams (tenant_id, name, on_call_label)
SELECT 
  t.id,
  v.name,
  v.on_call
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('North Operations', 'Ops On-Call'),
  ('Reliability Squad', 'Reliability Pager'),
  ('Cyber Incident Response', 'SOC Level 1'),
  ('Maintenance Team A', 'Field Support North'),
  ('Energy Desk', NULL)
) AS v(name, on_call)
ON CONFLICT (tenant_id, name) DO UPDATE SET on_call_label = EXCLUDED.on_call_label
RETURNING id, name;

-- 3) Seed User Profiles
-- Since we don't have auth.users in local reset usually without actual login, 
-- we'll generate UUIDs for a few demo users. In a real system these would link to auth.users.
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO user_profiles (user_id, tenant_id, display_name, persona_label, preferences)
SELECT 
  gen_random_uuid(), -- Demo users get random UUIDs for now
  t.id,
  v.name,
  v.persona,
  jsonb_build_object('theme', 'dark', 'notifications', 'all')
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('Ahmed Mansour', 'Operations Manager'),
  ('Sarah Chen', 'Reliability Engineer'),
  ('John Miller', 'Security Analyst'),
  ('Elena Rodriguez', 'Energy Trader'),
  ('Marcus Vane', 'Executive'),
  ('Fatima Al-Sayed', 'Maintenance Supervisor'),
  ('David Kim', 'Field Technician'),
  ('Priya Sharma', 'Asset Strategist')
) AS v(name, persona)
ON CONFLICT (user_id) DO NOTHING; -- Gen random UUIDs won't conflict, but for safety

-- 4) Seed Team Memberships
-- We'll link users to teams. Since we generated random UUIDs above, 
-- we'll do a simple cross-join mapping for the demo.
WITH users AS (
  SELECT user_id, display_name FROM user_profiles
),
teams_data AS (
  SELECT id as team_id, name as team_name FROM teams
)
INSERT INTO team_memberships (team_id, user_id, role)
SELECT 
  td.team_id,
  u.user_id,
  CASE WHEN u.display_name IN ('Ahmed Mansour', 'Sarah Chen', 'John Miller') THEN 'lead' ELSE 'member' END
FROM users u
CROSS JOIN teams_data td
WHERE 
  (u.display_name = 'Ahmed Mansour' AND td.team_name = 'North Operations') OR
  (u.display_name = 'Sarah Chen' AND td.team_name = 'Reliability Squad') OR
  (u.display_name = 'John Miller' AND td.team_name = 'Cyber Incident Response') OR
  (u.display_name = 'Fatima Al-Sayed' AND td.team_name = 'Maintenance Team A') OR
  (u.display_name = 'David Kim' AND td.team_name = 'Maintenance Team A') OR
  (u.display_name = 'Elena Rodriguez' AND td.team_name = 'Energy Desk');

-- Post-seed validation
DO $$
DECLARE
  v_user_count INTEGER;
  v_team_count INTEGER;
  v_membership_count INTEGER;
  v_label_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM user_profiles;
  SELECT COUNT(*) INTO v_team_count FROM teams;
  SELECT COUNT(*) INTO v_membership_count FROM team_memberships;
  SELECT COUNT(*) INTO v_label_count FROM responsibility_labels;
  
  IF v_user_count < 8 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 8 user_profiles, got %', v_user_count;
  END IF;
  
  IF v_team_count < 3 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 3 teams, got %', v_team_count;
  END IF;
  
  IF v_membership_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 memberships, got %', v_membership_count;
  END IF;

  IF v_label_count < 8 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 8 responsibility labels, got %', v_label_count;
  END IF;
END $$;

COMMIT;
