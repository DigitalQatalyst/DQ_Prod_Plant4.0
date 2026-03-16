-- =============================================================================
-- SEED DATA: Security Infrastructure (Audit Log, Zones, OT Asset Security)
-- Description: Combined seed for migrations 015, 016, 017
-- Requirements: 2.5, 3.1, 3.2, 6.1, 8.3
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID, site IDs, and user IDs
DO $$
DECLARE
  v_dewa_tenant_id UUID;
  v_jebel_ali_site_id UUID;
  v_control_centre_site_id UUID;
  v_al_aweer_site_id UUID;
  v_admin_user_id UUID;
  v_supervisor_user_id UUID;
  v_engineer_user_id UUID;
  v_operator_user_id UUID;
  v_asset_id UUID;
BEGIN
  SELECT id INTO v_dewa_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  SELECT id INTO v_jebel_ali_site_id FROM sites WHERE name = 'Jebel Ali Grid Station' LIMIT 1;
  SELECT id INTO v_control_centre_site_id FROM sites WHERE name = 'Dubai Main Substation' LIMIT 1;
  SELECT id INTO v_al_aweer_site_id FROM sites WHERE name = 'Al Aweer Regional Hub' LIMIT 1;
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' LIMIT 1;
  SELECT id INTO v_operator_user_id FROM security_users WHERE username = 'khalid.almarri' LIMIT 1;
  
  IF v_dewa_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- =============================================================================
  -- SECURITY ZONES (Migration 016)
  -- =============================================================================
  
  -- Zone 1: Jebel Ali - Protection Systems Zone
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    'Jebel Ali Protection Systems Zone',
    'protection-systems',
    4, -- IEC 62443 SL4
    NULL,
    'High-security zone for protection relays and safety-critical systems at Jebel Ali',
    0, -- Will be updated by triggers
    'compliant',
    '[
      {"name": "No external access", "enforced": true},
      {"name": "Certificate-based authentication required", "enforced": true},
      {"name": "All traffic logged", "enforced": true}
    ]'::JSONB,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- Zone 2: Jebel Ali - Substation Control Zone
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    'Jebel Ali Substation Control Zone',
    'substation-control',
    3, -- IEC 62443 SL3
    NULL,
    'Control zone for substation automation and monitoring systems',
    0,
    'compliant',
    '[
      {"name": "Role-based access control", "enforced": true},
      {"name": "MFA for administrative access", "enforced": true}
    ]'::JSONB,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- Zone 3: Control Centre - SCADA Network Zone
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    'Control Centre SCADA Network',
    'scada-network',
    3, -- IEC 62443 SL3
    NULL,
    'Primary SCADA network for transmission grid monitoring and control',
    0,
    'compliant',
    '[
      {"name": "Network segmentation enforced", "enforced": true},
      {"name": "Encrypted communications", "enforced": true},
      {"name": "Intrusion detection active", "enforced": true}
    ]'::JSONB,
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '15 days'
  );
  
  -- Zone 4: Control Centre - DMZ
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    'Control Centre DMZ',
    'dmz',
    2, -- IEC 62443 SL2
    NULL,
    'Demilitarized zone for external integrations and data exchange',
    0,
    'partial',
    '[
      {"name": "Firewall rules enforced", "enforced": true},
      {"name": "Data diode for critical data", "enforced": false}
    ]'::JSONB,
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '10 days'
  );
  
  -- Zone 5: Al Aweer - Field Devices Zone
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_al_aweer_site_id,
    'Al Aweer Field Devices Zone',
    'field-devices',
    2, -- IEC 62443 SL2
    NULL,
    'Zone for field instrumentation and remote terminal units',
    0,
    'partial',
    '[
      {"name": "Physical access controls", "enforced": true},
      {"name": "Encrypted protocols preferred", "enforced": false}
    ]'::JSONB,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '20 days'
  );
  
  -- Zone 6: Corporate Network (Organization-wide)
  INSERT INTO security_zones (
    id, tenant_id, site_id, name, zone_type, security_level,
    parent_zone_id, description, asset_count, compliance_status, policies,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    NULL, -- Organization-wide
    'DEWA Corporate Network',
    'corporate-network',
    1, -- IEC 62443 SL1
    NULL,
    'Corporate IT network for business applications and office systems',
    0,
    'compliant',
    '[
      {"name": "Standard IT security policies", "enforced": true},
      {"name": "No direct OT access", "enforced": true}
    ]'::JSONB,
    NOW() - INTERVAL '365 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- =============================================================================
  -- SECURITY CONDUITS (Migration 016)
  -- =============================================================================
  
  -- Conduit 1: SCADA to Protection Systems
  INSERT INTO security_conduits (
    id, tenant_id, site_id, name,
    source_zone_id, target_zone_id,
    protocol, encrypted, policy_compliant, data_flow_direction,
    description,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    'SCADA-to-Protection-IEC61850',
    (SELECT id FROM security_zones WHERE name = 'Jebel Ali Substation Control Zone' LIMIT 1),
    (SELECT id FROM security_zones WHERE name = 'Jebel Ali Protection Systems Zone' LIMIT 1),
    'IEC61850',
    true,
    true,
    'bidirectional',
    'IEC 61850 MMS communication between SCADA and protection relays',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- Conduit 2: Control Centre to Substation
  INSERT INTO security_conduits (
    id, tenant_id, site_id, name,
    source_zone_id, target_zone_id,
    protocol, encrypted, policy_compliant, data_flow_direction,
    description,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    'ControlCentre-to-Substation-DNP3',
    (SELECT id FROM security_zones WHERE name = 'Control Centre SCADA Network' LIMIT 1),
    (SELECT id FROM security_zones WHERE name = 'Jebel Ali Substation Control Zone' LIMIT 1),
    'DNP3-TLS',
    true,
    true,
    'bidirectional',
    'Secure DNP3 communication from control centre to substations',
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '15 days'
  );
  
  -- Conduit 3: DMZ to SCADA (Data Diode)
  INSERT INTO security_conduits (
    id, tenant_id, site_id, name,
    source_zone_id, target_zone_id,
    protocol, encrypted, policy_compliant, data_flow_direction,
    description,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    'SCADA-to-DMZ-DataDiode',
    (SELECT id FROM security_zones WHERE name = 'Control Centre SCADA Network' LIMIT 1),
    (SELECT id FROM security_zones WHERE name = 'Control Centre DMZ' LIMIT 1),
    'OPC-UA',
    true,
    true,
    'unidirectional',
    'One-way data flow from SCADA to DMZ via data diode',
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '10 days'
  );
  
  -- Conduit 4: Field Devices to Substation
  INSERT INTO security_conduits (
    id, tenant_id, site_id, name,
    source_zone_id, target_zone_id,
    protocol, encrypted, policy_compliant, data_flow_direction,
    description,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_al_aweer_site_id,
    'FieldDevices-to-Substation-MODBUS',
    (SELECT id FROM security_zones WHERE name = 'Al Aweer Field Devices Zone' LIMIT 1),
    (SELECT id FROM security_zones WHERE name = 'Jebel Ali Substation Control Zone' LIMIT 1),
    'MODBUS-TCP',
    false,
    false,
    'bidirectional',
    'MODBUS TCP communication from field RTUs to substation gateway',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '20 days'
  );
  
  -- =============================================================================
  -- OT ASSET SECURITY (Migration 017)
  -- =============================================================================
  
  -- Get some asset IDs for seeding
  FOR v_asset_id IN 
    SELECT id FROM assets WHERE tenant_id = v_dewa_tenant_id LIMIT 20
  LOOP
    INSERT INTO ot_asset_security (
      id, tenant_id, asset_id, zone_id,
      criticality, security_status, risk_score,
      vulnerability_count, patch_status, network_exposure,
      last_security_scan, firmware_version, manufacturer, model,
      in_safety_loop, high_pressure, open_alerts, metadata,
      created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(),
      v_dewa_tenant_id,
      v_asset_id,
      (SELECT id FROM security_zones ORDER BY RANDOM() LIMIT 1),
      (ARRAY['safety-critical', 'production-critical', 'high', 'medium', 'low'])[floor(random() * 5 + 1)],
      (ARRAY['secure', 'at-risk', 'vulnerable'])[floor(random() * 3 + 1)],
      floor(random() * 100)::INTEGER,
      floor(random() * 10)::INTEGER,
      (ARRAY['up-to-date', 'pending', 'outdated'])[floor(random() * 3 + 1)],
      (ARRAY['internal', 'dmz', 'external'])[floor(random() * 3 + 1)],
      NOW() - (random() * INTERVAL '30 days'),
      '2.' || floor(random() * 10)::TEXT || '.' || floor(random() * 10)::TEXT,
      (ARRAY['ABB', 'Siemens', 'GE', 'Schneider Electric', 'SEL'])[floor(random() * 5 + 1)],
      'Model-' || floor(random() * 1000)::TEXT,
      random() > 0.8,
      random() > 0.9,
      floor(random() * 5)::INTEGER,
      '{}'::JSONB,
      NOW() - (random() * INTERVAL '180 days'),
      NOW() - (random() * INTERVAL '30 days')
    );
  END LOOP;
  
  -- =============================================================================
  -- SECURITY AUDIT LOG (Migration 015)
  -- =============================================================================
  
  -- Sample audit log entries for various event types
  
  -- Authentication events
  INSERT INTO security_audit_log (
    tenant_id, event_type, event_category, event_name, event_description,
    outcome, severity,
    user_id, username, user_role, session_id,
    source_ip, source_hostname,
    target_type, target_id, target_name,
    action_performed, risk_score,
    event_timestamp, correlation_id,
    created_at
  ) VALUES
  (
    v_dewa_tenant_id, 'authentication', 'identity', 'User Login Success',
    'User successfully authenticated via SSO',
    'success', 'info',
    v_operator_user_id, 'khalid.almarri', 'operator', 'sess-' || gen_random_uuid()::TEXT,
    '10.20.30.45'::INET, 'workstation-ops-12',
    'user', v_operator_user_id::TEXT, 'khalid.almarri',
    'login', 10,
    NOW() - INTERVAL '2 hours', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '2 hours'
  ),
  (
    v_dewa_tenant_id, 'authentication', 'identity', 'Failed Login Attempt',
    'Failed login attempt - invalid credentials',
    'failure', 'warning',
    NULL, 'unknown.user', NULL, NULL,
    '192.168.1.100'::INET, 'unknown',
    'user', 'unknown', 'unknown.user',
    'login_attempt', 60,
    NOW() - INTERVAL '5 hours', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '5 hours'
  ),
  
  -- Configuration change events
  (
    v_dewa_tenant_id, 'configuration_change', 'system', 'Protection Relay Settings Modified',
    'Protection relay settings updated during maintenance',
    'success', 'high',
    v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess-' || gen_random_uuid()::TEXT,
    '10.20.30.50'::INET, 'engineering-ws-03',
    'asset', 'REL-JA-220-01', 'Protection Relay JA-220-01',
    'modify_settings', 75,
    NOW() - INTERVAL '1 day', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '1 day'
  ),
  
  -- Security violation events
  (
    v_dewa_tenant_id, 'security_violation', 'access', 'Unauthorized Zone Access Attempt',
    'User attempted to access protection systems zone without authorization',
    'denied', 'critical',
    v_operator_user_id, 'khalid.almarri', 'operator', 'sess-' || gen_random_uuid()::TEXT,
    '10.20.30.45'::INET, 'workstation-ops-12',
    'zone', (SELECT id::TEXT FROM security_zones WHERE name = 'Jebel Ali Protection Systems Zone' LIMIT 1), 'Protection Systems Zone',
    'access_attempt', 95,
    NOW() - INTERVAL '3 days', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '3 days'
  ),
  
  -- Certificate operations
  (
    v_dewa_tenant_id, 'certificate_operation', 'security', 'Certificate Rotation Completed',
    'IEC 61850 server certificate successfully rotated',
    'success', 'info',
    v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess-' || gen_random_uuid()::TEXT,
    '10.20.30.10'::INET, 'admin-ws-01',
    'certificate', 'IEC61850-Server-JebelAli-2024', 'IEC61850 Server Certificate',
    'rotate_certificate', 20,
    NOW() - INTERVAL '180 days', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '180 days'
  ),
  
  -- Data access events
  (
    v_dewa_tenant_id, 'data_access', 'data', 'Sensitive Data Export',
    'Security audit log data exported for compliance review',
    'success', 'warning',
    v_supervisor_user_id, 'fatima.alzahra', 'supervisor', 'sess-' || gen_random_uuid()::TEXT,
    '10.20.30.20'::INET, 'supervisor-ws-01',
    'audit_log', 'export-' || gen_random_uuid()::TEXT, 'Audit Log Export',
    'export_data', 40,
    NOW() - INTERVAL '7 days', 'corr-' || gen_random_uuid()::TEXT,
    NOW() - INTERVAL '7 days'
  );
  
  -- =============================================================================
  -- AUDIT RETENTION POLICIES (Migration 015)
  -- =============================================================================
  
  INSERT INTO audit_retention_policies (
    id, tenant_id, name, description,
    event_types, event_categories, severity_levels,
    retention_period_days, archive_after_days,
    compliance_standards, legal_hold, active, priority,
    created_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Critical Security Events Retention',
    'Extended retention for critical security events per NERC CIP requirements',
    ARRAY['security_violation', 'privilege_escalation']::audit_event_type[],
    ARRAY['security', 'access'],
    ARRAY['critical', 'high']::audit_severity[],
    2555, -- 7 years
    365, -- Archive after 1 year
    ARRAY['NERC-CIP', 'IEC-62443'],
    false,
    true,
    10,
    v_admin_user_id,
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '200 days'
  ),
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Standard Audit Log Retention',
    'Standard retention for general audit events',
    NULL, -- All event types
    ARRAY['identity', 'data', 'system'],
    NULL, -- All severities
    1095, -- 3 years
    180, -- Archive after 6 months
    ARRAY['ISO-27001'],
    false,
    true,
    100,
    v_admin_user_id,
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '200 days'
  );

END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify security zones
-- SELECT COUNT(*) as zone_count FROM security_zones;

-- Verify security conduits
-- SELECT COUNT(*) as conduit_count FROM security_conduits;

-- Verify OT asset security records
-- SELECT COUNT(*) as ot_security_count FROM ot_asset_security;

-- Verify audit log entries
-- SELECT COUNT(*) as audit_log_count FROM security_audit_log;

-- Verify retention policies
-- SELECT COUNT(*) as retention_policy_count FROM audit_retention_policies;
