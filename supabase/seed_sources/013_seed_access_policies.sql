-- =============================================================================
-- SEED DATA: Access Policies and Permissions
-- Description: Seed data for zone-based access control policies and privileged access
-- Requirements: 2.2, 2.3
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID and user IDs
DO $$
DECLARE
  v_dewa_tenant_id UUID;
  v_admin_user_id UUID;
  v_supervisor_user_id UUID;
  v_engineer_user_id UUID;
  v_operator_user_id UUID;
BEGIN
  SELECT id INTO v_dewa_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' LIMIT 1;
  SELECT id INTO v_operator_user_id FROM security_users WHERE username = 'khalid.almarri' LIMIT 1;
  
  IF v_dewa_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- =============================================================================
  -- ACCESS POLICIES
  -- =============================================================================
  
  -- Policy 1: Protection Systems Access Control
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by, approved_by, approved_at,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Protection Systems Access Control',
    'Restricts access to protection relay systems and IEC 61850 devices to authorized engineers only',
    'zone-based',
    'active',
    10,
    ARRAY['engineer', 'administrator'],
    v_admin_user_id,
    v_supervisor_user_id,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days'
  );
  
  -- Add rules for Protection Systems policy
  INSERT INTO access_rules (
    tenant_id, policy_id, rule_order,
    resource_type, resource_pattern,
    actions, effect,
    zone_types, security_levels,
    created_at, updated_at
  ) VALUES
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'Protection Systems Access Control' LIMIT 1),
    1,
    'zone',
    'protection-systems',
    ARRAY['read', 'write', 'execute']::access_action[],
    'allow',
    ARRAY['protection-systems'],
    ARRAY[3, 4],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'Protection Systems Access Control' LIMIT 1),
    2,
    'asset',
    'protection-relay-*',
    ARRAY['read', 'write']::access_action[],
    'allow',
    ARRAY['protection-systems'],
    ARRAY[3, 4],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days'
  );
  
  -- Policy 2: SCADA Network Monitoring
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by, approved_by, approved_at,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'SCADA Network Monitoring',
    'Allows operators to monitor SCADA systems with read-only access',
    'role-based',
    'active',
    50,
    ARRAY['operator', 'engineer', 'supervisor', 'administrator'],
    v_admin_user_id,
    v_supervisor_user_id,
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '100 days',
    NOW() - INTERVAL '80 days'
  );
  
  -- Add rules for SCADA Monitoring policy
  INSERT INTO access_rules (
    tenant_id, policy_id, rule_order,
    resource_type, resource_pattern,
    actions, effect,
    zone_types, security_levels,
    created_at, updated_at
  ) VALUES
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'SCADA Network Monitoring' LIMIT 1),
    1,
    'zone',
    'scada-network',
    ARRAY['read']::access_action[],
    'allow',
    ARRAY['scada-network', 'substation-control'],
    ARRAY[2, 3],
    NOW() - INTERVAL '100 days',
    NOW() - INTERVAL '80 days'
  );
  
  -- Policy 3: Business Hours Access Restriction
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by, approved_by, approved_at,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Business Hours Access Restriction',
    'Restricts non-emergency configuration changes to business hours',
    'time-based',
    'active',
    20,
    ARRAY['engineer'],
    v_admin_user_id,
    v_supervisor_user_id,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '45 days'
  );
  
  -- Add rules for Business Hours policy
  INSERT INTO access_rules (
    tenant_id, policy_id, rule_order,
    resource_type, resource_pattern,
    actions, effect,
    time_start, time_end, days_of_week,
    zone_types,
    created_at, updated_at
  ) VALUES
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'Business Hours Access Restriction' LIMIT 1),
    1,
    'system',
    'configuration-*',
    ARRAY['write', 'execute']::access_action[],
    'allow',
    '07:00:00'::TIME,
    '18:00:00'::TIME,
    ARRAY[1, 2, 3, 4, 5], -- Monday to Friday
    ARRAY['substation-control', 'protection-systems'],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '45 days'
  );
  
  -- Policy 4: Critical Asset Protection
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by, approved_by, approved_at,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Critical Asset Protection',
    'Requires supervisor approval for access to safety-critical assets',
    'asset-based',
    'active',
    5,
    ARRAY['engineer', 'administrator'],
    v_admin_user_id,
    v_supervisor_user_id,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- Add rules for Critical Asset policy
  INSERT INTO access_rules (
    tenant_id, policy_id, rule_order,
    resource_type, resource_pattern,
    actions, effect,
    security_levels,
    conditions,
    created_at, updated_at
  ) VALUES
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'Critical Asset Protection' LIMIT 1),
    1,
    'asset',
    'safety-critical-*',
    ARRAY['write', 'execute', 'admin']::access_action[],
    'allow',
    ARRAY[4],
    '{"requires_approval": true, "approval_roles": ["supervisor", "administrator"]}'::JSONB,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- Policy 5: Auditor Read-Only Access
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by, approved_by, approved_at,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Auditor Read-Only Access',
    'Grants auditors read-only access to all zones for compliance monitoring',
    'role-based',
    'active',
    100,
    ARRAY['auditor'],
    v_admin_user_id,
    v_supervisor_user_id,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '120 days'
  );
  
  -- Add rules for Auditor policy
  INSERT INTO access_rules (
    tenant_id, policy_id, rule_order,
    resource_type, resource_pattern,
    actions, effect,
    zone_types,
    created_at, updated_at
  ) VALUES
  (
    v_dewa_tenant_id,
    (SELECT id FROM access_policies WHERE name = 'Auditor Read-Only Access' LIMIT 1),
    1,
    'zone',
    '*',
    ARRAY['read']::access_action[],
    'allow',
    ARRAY['substation-control', 'protection-systems', 'scada-network', 'corporate-network', 'field-devices'],
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '120 days'
  );
  
  -- Policy 6: DMZ Access Control (Draft)
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority,
    applies_to, created_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'DMZ Access Control',
    'Controls access to DMZ zone for external integrations',
    'zone-based',
    'draft',
    30,
    ARRAY['engineer', 'administrator'],
    v_admin_user_id,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '5 days'
  );
  
  -- =============================================================================
  -- PRIVILEGED ACCESS SESSIONS
  -- =============================================================================
  
  -- Session 1: Emergency breaker control access (completed)
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions, approved_actions,
    requested_by, approved_by,
    request_reason, approval_reason,
    status,
    requested_start, requested_end,
    actual_start, actual_end,
    is_emergency, emergency_justification,
    session_log,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_engineer_user_id,
    'emergency',
    'breaker-control',
    'BRK-JA-132-01',
    ARRAY['execute', 'admin'],
    ARRAY['execute', 'admin'],
    v_engineer_user_id,
    v_supervisor_user_id,
    'Emergency grid stabilization required due to frequency deviation',
    'Approved for emergency grid stabilization. Incident #INC-2024-0045',
    'completed',
    NOW() - INTERVAL '5 days 15:30:00',
    NOW() - INTERVAL '5 days 14:30:00',
    NOW() - INTERVAL '5 days 15:25:00',
    NOW() - INTERVAL '5 days 15:08:00',
    true,
    'Grid frequency dropped to 49.7 Hz. Immediate load shedding required to prevent cascade failure.',
    '[
      {"timestamp": "2024-01-10T14:35:00Z", "action": "session_started", "user": "mohammed.binrashid"},
      {"timestamp": "2024-01-10T14:36:00Z", "action": "breaker_opened", "breaker": "BRK-JA-132-01"},
      {"timestamp": "2024-01-10T14:45:00Z", "action": "load_shed", "amount_mw": 50},
      {"timestamp": "2024-01-10T14:52:00Z", "action": "session_completed", "outcome": "success"}
    ]'::JSONB,
    NOW() - INTERVAL '5 days 14:30:00',
    NOW() - INTERVAL '5 days 14:52:00'
  );
  
  -- Session 2: Protection relay configuration (active)
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions, approved_actions,
    requested_by, approved_by,
    request_reason, approval_reason,
    status,
    requested_start, requested_end,
    actual_start,
    is_emergency,
    session_log,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_engineer_user_id,
    'maintenance',
    'protection-relay',
    'REL-AA-220-03',
    ARRAY['read', 'write', 'execute'],
    ARRAY['read', 'write', 'execute'],
    v_engineer_user_id,
    v_supervisor_user_id,
    'Scheduled firmware upgrade and settings verification for REG670 relay',
    'Approved for planned maintenance window',
    'active',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes',
    false,
    '[
      {"timestamp": "2024-01-15T08:15:00Z", "action": "session_started", "user": "mohammed.binrashid"},
      {"timestamp": "2024-01-15T08:30:00Z", "action": "firmware_backup", "version": "2.2.5"},
      {"timestamp": "2024-01-15T09:00:00Z", "action": "firmware_upload", "version": "2.3.1"}
    ]'::JSONB,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes'
  );
  
  -- Session 3: SCADA system administrative access (approved, not started)
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions, approved_actions,
    requested_by, approved_by,
    request_reason, approval_reason,
    status,
    requested_start, requested_end,
    is_emergency,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_engineer_user_id,
    'administrative',
    'scada-system',
    'SCADA-MAIN-01',
    ARRAY['admin', 'write'],
    ARRAY['admin', 'write'],
    v_engineer_user_id,
    v_supervisor_user_id,
    'Database maintenance and performance optimization',
    'Approved for off-peak hours maintenance',
    'approved',
    NOW() + INTERVAL '1 day 22:00:00',
    NOW() + INTERVAL '2 days 02:00:00',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours'
  );
  
  -- Session 4: Pending approval for substation access
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions,
    requested_by,
    request_reason,
    status,
    requested_start, requested_end,
    is_emergency,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_engineer_user_id,
    'maintenance',
    'substation-control',
    'SUB-JA-132KV',
    ARRAY['read', 'write'],
    v_engineer_user_id,
    'Quarterly security assessment and configuration audit',
    'pending',
    NOW() + INTERVAL '3 days 08:00:00',
    NOW() + INTERVAL '3 days 17:00:00',
    false,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  );
  
  -- Session 5: Denied emergency access (insufficient justification)
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions,
    requested_by, approved_by,
    request_reason, approval_reason,
    status,
    requested_start, requested_end,
    is_emergency, emergency_justification,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_operator_user_id,
    'emergency',
    'protection-relay',
    'REL-CC-400-01',
    ARRAY['write', 'execute'],
    v_operator_user_id,
    v_supervisor_user_id,
    'Need to adjust relay settings',
    'Denied - insufficient emergency justification. Standard change request process required.',
    'denied',
    NOW() - INTERVAL '3 days 11:00:00',
    NOW() - INTERVAL '3 days 10:00:00',
    true,
    'Settings adjustment needed',
    NOW() - INTERVAL '3 days 10:00:00',
    NOW() - INTERVAL '3 days 10:15:00'
  );
  
  -- Session 6: Expired session (not used)
  INSERT INTO privileged_access_sessions (
    id, tenant_id, user_id,
    session_type, target_resource_type, target_resource_id,
    requested_actions, approved_actions,
    requested_by, approved_by,
    request_reason, approval_reason,
    status,
    requested_start, requested_end,
    is_emergency,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_engineer_user_id,
    'maintenance',
    'rtu',
    'RTU-JA-01',
    ARRAY['read', 'write'],
    ARRAY['read', 'write'],
    v_engineer_user_id,
    v_supervisor_user_id,
    'RTU firmware update',
    'Approved for maintenance window',
    'expired',
    NOW() - INTERVAL '7 days 23:00:00',
    NOW() - INTERVAL '7 days 20:00:00',
    false,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days 23:00:00'
  );

END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify access policies count
-- SELECT COUNT(*) as policy_count FROM access_policies;

-- Verify policy status distribution
-- SELECT status, COUNT(*) as count FROM access_policies GROUP BY status;

-- Verify access rules count
-- SELECT COUNT(*) as rule_count FROM access_rules;

-- Verify privileged sessions count
-- SELECT COUNT(*) as session_count FROM privileged_access_sessions;

-- Verify session status distribution
-- SELECT status, COUNT(*) as count FROM privileged_access_sessions GROUP BY status;
