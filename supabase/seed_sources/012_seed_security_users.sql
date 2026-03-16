-- =============================================================================
-- SEED DATA: Security Users and Roles
-- Description: Seed data for security users with transmission-specific roles
-- Requirements: 2.1, 8.2
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID
DO $$
DECLARE
  v_dewa_tenant_id UUID;
BEGIN
  SELECT id INTO v_dewa_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_dewa_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- =============================================================================
  -- SECURITY USERS
  -- =============================================================================
  
  -- Administrator - Full system access
  INSERT INTO security_users (
    id, tenant_id, username, email, full_name, role, status,
    last_login, failed_login_attempts, mfa_enabled,
    access_zones, permissions,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'ahmed.almansouri',
    'ahmed.almansouri@dewa.gov.ae',
    'Ahmed Al Mansouri',
    'administrator',
    'active',
    NOW() - INTERVAL '2 hours',
    0,
    true,
    ARRAY['all-zones', 'substation-control', 'protection-systems', 'scada-network', 'corporate-network'],
    ARRAY['user-management', 'policy-management', 'system-configuration', 'audit-access', 'emergency-override'],
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '2 hours'
  ),
  
  -- Supervisor - Oversight and approval authority
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'fatima.alzahra',
    'fatima.alzahra@dewa.gov.ae',
    'Fatima Al Zahra',
    'supervisor',
    'active',
    NOW() - INTERVAL '5 hours',
    0,
    true,
    ARRAY['substation-control', 'protection-systems', 'scada-network'],
    ARRAY['approve-access', 'review-incidents', 'manage-policies', 'view-audit-logs'],
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '5 hours'
  ),
  
  -- Engineer - Technical operations
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'mohammed.binrashid',
    'mohammed.binrashid@dewa.gov.ae',
    'Mohammed bin Rashid',
    'engineer',
    'active',
    NOW() - INTERVAL '1 hour',
    0,
    true,
    ARRAY['substation-control', 'protection-systems', 'field-devices'],
    ARRAY['configure-devices', 'manage-certificates', 'troubleshoot-systems', 'view-telemetry'],
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '1 hour'
  ),
  
  -- Engineer - Network security specialist
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'sarah.alnuaimi',
    'sarah.alnuaimi@dewa.gov.ae',
    'Sarah Al Nuaimi',
    'engineer',
    'active',
    NOW() - INTERVAL '3 hours',
    0,
    true,
    ARRAY['scada-network', 'dmz', 'corporate-network'],
    ARRAY['configure-firewalls', 'manage-zones', 'monitor-traffic', 'incident-response'],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '3 hours'
  ),
  
  -- Operator - Day-to-day monitoring
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'khalid.almarri',
    'khalid.almarri@dewa.gov.ae',
    'Khalid Al Marri',
    'operator',
    'active',
    NOW() - INTERVAL '30 minutes',
    0,
    false,
    ARRAY['substation-control', 'scada-network'],
    ARRAY['view-dashboards', 'acknowledge-alerts', 'view-assets'],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 minutes'
  ),
  
  -- Operator - Control center operator
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'mariam.alkhan',
    'mariam.alkhan@dewa.gov.ae',
    'Mariam Al Khan',
    'operator',
    'active',
    NOW() - INTERVAL '4 hours',
    0,
    false,
    ARRAY['scada-network', 'substation-control'],
    ARRAY['view-dashboards', 'acknowledge-alerts', 'view-telemetry'],
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '4 hours'
  ),
  
  -- Auditor - Compliance and audit
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'abdullah.alshamsi',
    'abdullah.alshamsi@dewa.gov.ae',
    'Abdullah Al Shamsi',
    'auditor',
    'active',
    NOW() - INTERVAL '1 day',
    0,
    true,
    ARRAY['all-zones'],
    ARRAY['view-audit-logs', 'export-reports', 'view-compliance', 'view-policies'],
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '1 day'
  ),
  
  -- Engineer - Protection systems specialist
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'omar.alfalasi',
    'omar.alfalasi@dewa.gov.ae',
    'Omar Al Falasi',
    'engineer',
    'active',
    NOW() - INTERVAL '6 hours',
    0,
    true,
    ARRAY['protection-systems', 'substation-control'],
    ARRAY['configure-relays', 'manage-iec61850', 'troubleshoot-protection', 'view-events'],
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '6 hours'
  ),
  
  -- Operator - Field technician
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'layla.almheiri',
    'layla.almheiri@dewa.gov.ae',
    'Layla Al Mheiri',
    'operator',
    'active',
    NOW() - INTERVAL '8 hours',
    0,
    false,
    ARRAY['field-devices', 'substation-control'],
    ARRAY['view-assets', 'view-telemetry', 'acknowledge-alerts'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '8 hours'
  ),
  
  -- Suspended user - Security violation
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'hamad.suspended',
    'hamad.suspended@dewa.gov.ae',
    'Hamad Al Suspended',
    'operator',
    'suspended',
    NOW() - INTERVAL '15 days',
    5,
    false,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '100 days',
    NOW() - INTERVAL '15 days'
  ),
  
  -- Inactive user - Left organization
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'rashid.inactive',
    'rashid.inactive@dewa.gov.ae',
    'Rashid Al Inactive',
    'engineer',
    'inactive',
    NOW() - INTERVAL '90 days',
    0,
    false,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '365 days',
    NOW() - INTERVAL '90 days'
  ),
  
  -- System user for automated events
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'system.service',
    'system@dewa.gov.ae',
    'System Service',
    'administrator',
    'active',
    NOW(),
    0,
    false,
    ARRAY['all-zones'],
    ARRAY['audit-access'],
    NOW() - INTERVAL '365 days',
    NOW()
  );

END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify security users count
-- SELECT COUNT(*) as user_count FROM security_users;

-- Verify role distribution
-- SELECT role, COUNT(*) as count FROM security_users GROUP BY role ORDER BY role;

-- Verify status distribution
-- SELECT status, COUNT(*) as count FROM security_users GROUP BY status ORDER BY status;

-- Verify MFA enabled users
-- SELECT COUNT(*) as mfa_enabled_count FROM security_users WHERE mfa_enabled = true;
