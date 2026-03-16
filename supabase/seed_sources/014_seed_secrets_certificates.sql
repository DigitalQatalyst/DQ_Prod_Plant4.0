-- =============================================================================
-- SEED DATA: Secrets and Certificates Management
-- Description: Seed data for certificates, API keys, and service principals
-- Requirements: 2.8
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID and user IDs
DO $$
DECLARE
  v_dewa_tenant_id UUID;
  v_admin_user_id UUID;
  v_engineer_user_id UUID;
BEGIN
  SELECT id INTO v_dewa_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' LIMIT 1;
  
  IF v_dewa_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- =============================================================================
  -- SECRETS AND CERTIFICATES
  -- =============================================================================
  
  -- Certificate 1: IEC 61850 Server Certificate (Active)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type, certificate_type,
    encrypted_value, encryption_key_id,
    subject_dn, issuer_dn, serial_number, fingerprint_sha256,
    status, created_date, valid_from, valid_until,
    last_rotated, rotation_interval_days,
    usage_count, last_used, used_by_systems,
    protocol, asset_ids, zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'IEC61850-Server-JebelAli-2024',
    'IEC 61850 MMS server certificate for Jebel Ali substation',
    'certificate',
    'iec61850_server',
    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURYVENDQWtXZ0F3SUJBZ0lVRXhh...', -- Base64 encoded cert
    'kms-key-prod-001',
    'CN=iec61850-server.jebel-ali.dewa.gov.ae,OU=Substations,O=DEWA,C=AE',
    'CN=DEWA Root CA,OU=IT Security,O=DEWA,C=AE',
    '4A:3B:2C:1D:5E:6F:7A:8B',
    'E3:B0:C4:42:98:FC:1C:14:9A:FB:F4:C8:99:6F:B9:24:27:AE:41:E4:64:9B:93:4C:A4:95:99:1B:78:52:B8:55',
    'active',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    NOW() + INTERVAL '545 days', -- 2 years total
    NOW() - INTERVAL '180 days',
    730, -- 2 years
    1247,
    NOW() - INTERVAL '2 hours',
    ARRAY['IED-JA-01', 'IED-JA-02', 'IED-JA-03'],
    'IEC61850',
    ARRAY[]::TEXT[], -- Will be populated with actual asset IDs
    ARRAY['protection-systems', 'substation-control'],
    ARRAY['engineer', 'administrator']::transmission_role[],
    true,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '2 hours'
  );
  
  -- Certificate 2: DNP3 TLS Certificate (Active)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type, certificate_type,
    encrypted_value, encryption_key_id,
    subject_dn, issuer_dn, serial_number, fingerprint_sha256,
    status, created_date, valid_from, valid_until,
    rotation_interval_days,
    usage_count, last_used, used_by_systems,
    protocol, zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'DNP3-TLS-SCADA-Main-2024',
    'DNP3 Secure Authentication TLS certificate for main SCADA system',
    'certificate',
    'dnp3_tls',
    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURaVENDQWsyZ0F3SUJBZ0lVQmx...',
    'kms-key-prod-001',
    'CN=dnp3-scada.control-center.dewa.gov.ae,OU=SCADA,O=DEWA,C=AE',
    'CN=DEWA Root CA,OU=IT Security,O=DEWA,C=AE',
    '7C:8D:9E:0F:1A:2B:3C:4D',
    'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90',
    'active',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days',
    NOW() + INTERVAL '275 days', -- 1 year total
    365,
    3421,
    NOW() - INTERVAL '15 minutes',
    ARRAY['SCADA-MAIN-01', 'RTU-01', 'RTU-02', 'RTU-03'],
    'DNP3',
    ARRAY['scada-network', 'substation-control'],
    ARRAY['engineer', 'administrator']::transmission_role[],
    true,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '15 minutes'
  );
  
  -- Certificate 3: SCADA Web Server Certificate (Pending Rotation)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type, certificate_type,
    encrypted_value, encryption_key_id,
    subject_dn, issuer_dn, serial_number, fingerprint_sha256,
    status, created_date, valid_from, valid_until,
    last_rotated, rotation_interval_days,
    usage_count, last_used, used_by_systems,
    protocol, zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'SCADA-WebServer-2023',
    'Web server TLS certificate for SCADA HMI access',
    'certificate',
    'web_server',
    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURhVENDQWxHZ0F3SUJBZ0lVQ2x...',
    'kms-key-prod-001',
    'CN=scada.dewa.gov.ae,OU=Operations,O=DEWA,C=AE',
    'CN=DEWA Root CA,OU=IT Security,O=DEWA,C=AE',
    '9F:0E:1D:2C:3B:4A:5E:6D',
    'F1:E2:D3:C4:B5:A6:97:88:79:6A:5B:4C:3D:2E:1F:00:F1:E2:D3:C4:B5:A6:97:88:79:6A:5B:4C:3D:2E:1F:00',
    'pending_rotation',
    NOW() - INTERVAL '350 days',
    NOW() - INTERVAL '350 days',
    NOW() + INTERVAL '15 days', -- Expiring soon
    NOW() - INTERVAL '350 days',
    365,
    15234,
    NOW() - INTERVAL '5 minutes',
    ARRAY['SCADA-WEB-01', 'SCADA-WEB-02'],
    'HTTPS',
    ARRAY['scada-network', 'dmz'],
    ARRAY['operator', 'engineer', 'supervisor', 'administrator']::transmission_role[],
    true,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '350 days',
    NOW() - INTERVAL '1 day'
  );
  
  -- Certificate 4: Root CA Certificate (Active)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type, certificate_type,
    encrypted_value, encryption_key_id,
    subject_dn, issuer_dn, serial_number, fingerprint_sha256,
    status, created_date, valid_from, valid_until,
    rotation_interval_days,
    usage_count, used_by_systems,
    zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'DEWA-Root-CA-2022',
    'DEWA Root Certificate Authority for OT infrastructure',
    'certificate',
    'ca_root',
    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVBVENDQXVtZ0F3SUJBZ0lVRGx...',
    'kms-key-prod-001',
    'CN=DEWA Root CA,OU=IT Security,O=DEWA,C=AE',
    'CN=DEWA Root CA,OU=IT Security,O=DEWA,C=AE', -- Self-signed
    '01:02:03:04:05:06:07:08',
    '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF',
    'active',
    NOW() - INTERVAL '730 days',
    NOW() - INTERVAL '730 days',
    NOW() + INTERVAL '2920 days', -- 10 years total
    3650, -- 10 years
    0,
    ARRAY['All OT Systems'],
    ARRAY['all-zones'],
    ARRAY['administrator']::transmission_role[],
    true,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '730 days',
    NOW() - INTERVAL '730 days'
  );
  
  -- Secret 1: SCADA Database Password (Active)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type,
    encrypted_value, encryption_key_id,
    status, created_date, valid_from, valid_until,
    last_rotated, rotation_interval_days,
    usage_count, last_used, used_by_systems,
    zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'SCADA-DB-Admin-Password',
    'Administrative password for SCADA database',
    'password',
    'ZW5jcnlwdGVkX3Bhc3N3b3JkX2hhc2hfaGVyZQ==', -- Encrypted password
    'kms-key-prod-001',
    'active',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '45 days', -- 90 day rotation
    NOW() - INTERVAL '45 days',
    90,
    234,
    NOW() - INTERVAL '1 hour',
    ARRAY['SCADA-MAIN-01'],
    ARRAY['scada-network'],
    ARRAY['administrator']::transmission_role[],
    true,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '1 hour'
  );
  
  -- Secret 2: API Key for External Integration (Active)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description,
    secret_type,
    encrypted_value, encryption_key_id,
    status, created_date, valid_from, valid_until,
    rotation_interval_days,
    usage_count, last_used, used_by_systems,
    zone_ids,
    access_roles, requires_approval,
    created_by, approved_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Weather-API-Key',
    'API key for weather service integration',
    'api_key',
    'ZW5jcnlwdGVkX2FwaV9rZXlfaGVyZQ==',
    'kms-key-prod-001',
    'active',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days',
    NOW() + INTERVAL '245 days', -- 1 year total
    365,
    5678,
    NOW() - INTERVAL '30 minutes',
    ARRAY['SCADA-MAIN-01', 'EMS-01'],
    ARRAY['dmz', 'corporate-network'],
    ARRAY['engineer', 'administrator']::transmission_role[],
    false,
    v_admin_user_id,
    v_admin_user_id,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '30 minutes'
  );
  
  -- =============================================================================
  -- CERTIFICATE ROTATION HISTORY
  -- =============================================================================
  
  -- Rotation 1: Completed rotation for IEC 61850 certificate
  INSERT INTO certificate_rotation_history (
    id, tenant_id, certificate_id,
    rotation_type, old_fingerprint, new_fingerprint, rotation_reason,
    rotation_requested_at, rotation_completed_at,
    requested_by, completed_by,
    status,
    affected_systems, rollback_plan,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    (SELECT id FROM secrets_certificates WHERE name = 'IEC61850-Server-JebelAli-2024' LIMIT 1),
    'scheduled',
    'D2:C1:B0:A9:87:65:43:21:FE:DC:BA:98:76:54:32:10:D2:C1:B0:A9:87:65:43:21:FE:DC:BA:98:76:54:32:10',
    'E3:B0:C4:42:98:FC:1C:14:9A:FB:F4:C8:99:6F:B9:24:27:AE:41:E4:64:9B:93:4C:A4:95:99:1B:78:52:B8:55',
    'Scheduled 2-year certificate rotation',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '179 days',
    v_admin_user_id,
    v_engineer_user_id,
    'completed',
    ARRAY['IED-JA-01', 'IED-JA-02', 'IED-JA-03'],
    'Rollback procedure: Restore previous certificate from backup, restart IED services',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '179 days'
  );
  
  -- Rotation 2: Pending rotation for SCADA web server
  INSERT INTO certificate_rotation_history (
    id, tenant_id, certificate_id,
    rotation_type, old_fingerprint, rotation_reason,
    rotation_requested_at,
    requested_by,
    status,
    affected_systems, rollback_plan,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    (SELECT id FROM secrets_certificates WHERE name = 'SCADA-WebServer-2023' LIMIT 1),
    'scheduled',
    'F1:E2:D3:C4:B5:A6:97:88:79:6A:5B:4C:3D:2E:1F:00:F1:E2:D3:C4:B5:A6:97:88:79:6A:5B:4C:3D:2E:1F:00',
    'Certificate expiring in 15 days - scheduled renewal',
    NOW() - INTERVAL '1 day',
    v_admin_user_id,
    'pending',
    ARRAY['SCADA-WEB-01', 'SCADA-WEB-02'],
    'Rollback procedure: Revert to previous certificate, update load balancer configuration',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );
  
  -- =============================================================================
  -- API KEYS
  -- =============================================================================
  
  -- API Key 1: SCADA Integration Service
  INSERT INTO api_keys (
    id, tenant_id, name, description,
    key_hash, key_prefix,
    owner_user_id,
    permissions, allowed_ips, rate_limit_per_hour,
    status, expires_at,
    last_used, usage_count,
    allowed_protocols, allowed_asset_types, allowed_zones,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'SCADA-Integration-Service-Key',
    'API key for SCADA data integration service',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ3K3a', -- Bcrypt hash
    'dewa_sk_',
    v_engineer_user_id,
    ARRAY['read:telemetry', 'read:assets', 'write:alerts'],
    ARRAY['10.20.30.0/24', '10.20.31.0/24']::INET[],
    5000,
    'active',
    NOW() + INTERVAL '180 days',
    NOW() - INTERVAL '10 minutes',
    12456,
    ARRAY['IEC61850', 'DNP3', 'MODBUS'],
    ARRAY['transformer', 'breaker', 'rtu', 'ied'],
    ARRAY['scada-network', 'substation-control'],
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '10 minutes'
  );
  
  -- API Key 2: Mobile App Access
  INSERT INTO api_keys (
    id, tenant_id, name, description,
    key_hash, key_prefix,
    owner_user_id,
    permissions, rate_limit_per_hour,
    status, expires_at,
    last_used, usage_count,
    allowed_zones,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Mobile-App-Operator-Key',
    'API key for mobile operator application',
    '$2b$12$XQv4d2zrCXWIylf1MIBlDPZa7UuyNRKsriO9/MfxZ6HzaqmMiK4L4',
    'dewa_mob_',
    v_engineer_user_id,
    ARRAY['read:dashboards', 'read:alerts', 'write:alert-ack'],
    1000,
    'active',
    NOW() + INTERVAL '90 days',
    NOW() - INTERVAL '2 hours',
    3421,
    ARRAY['scada-network'],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 hours'
  );
  
  -- API Key 3: Expired key
  INSERT INTO api_keys (
    id, tenant_id, name, description,
    key_hash, key_prefix,
    owner_user_id,
    permissions, rate_limit_per_hour,
    status, expires_at,
    last_used, usage_count,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Legacy-Integration-Key',
    'Deprecated API key for legacy system',
    '$2b$12$YRw5e3AsD YXJzmg2NJCmEQab8VvzOSLtsjP0/NgYa7IabqnNjL5M5',
    'dewa_leg_',
    v_engineer_user_id,
    ARRAY['read:telemetry'],
    500,
    'expired',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '35 days',
    8234,
    NOW() - INTERVAL '400 days',
    NOW() - INTERVAL '30 days'
  );
  
  -- =============================================================================
  -- SERVICE PRINCIPALS
  -- =============================================================================
  
  -- Service Principal 1: SCADA Data Collector
  INSERT INTO service_principals (
    id, tenant_id, name, description, principal_type,
    client_id, client_secret_hash, certificate_id,
    roles, permissions, scopes,
    allowed_source_ips, allowed_protocols,
    status, expires_at,
    last_authenticated, authentication_count,
    associated_systems, zone_access,
    created_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'SCADA-Data-Collector-Service',
    'Service principal for automated SCADA data collection',
    'service',
    'sp-scada-collector-001',
    '$2b$12$ZSx6f4BtEZYKang3OKDnFRbc9WwaPTMutkQ1/OhZb8JbcroPkM6N6',
    (SELECT id FROM secrets_certificates WHERE name = 'DNP3-TLS-SCADA-Main-2024' LIMIT 1),
    ARRAY['engineer']::transmission_role[],
    ARRAY['read:telemetry', 'read:assets', 'write:telemetry'],
    ARRAY['telemetry.read', 'telemetry.write', 'assets.read'],
    ARRAY['10.20.30.50', '10.20.30.51']::INET[],
    ARRAY['DNP3', 'MODBUS', 'IEC60870-5-104'],
    'active',
    NOW() + INTERVAL '365 days',
    NOW() - INTERVAL '5 minutes',
    45678,
    ARRAY['SCADA-MAIN-01', 'RTU-01', 'RTU-02', 'RTU-03'],
    ARRAY['scada-network', 'substation-control', 'field-devices'],
    v_admin_user_id,
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '5 minutes'
  );
  
  -- Service Principal 2: Backup Service
  INSERT INTO service_principals (
    id, tenant_id, name, description, principal_type,
    client_id, client_secret_hash,
    roles, permissions, scopes,
    allowed_source_ips,
    status,
    last_authenticated, authentication_count,
    associated_systems, zone_access,
    created_by,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    'Backup-Service-Principal',
    'Service principal for automated backup operations',
    'application',
    'sp-backup-service-001',
    '$2b$12$ATy7g5CuFZZLboh4PLEoGScd0XxbQUNvulR2/PiAc9KcdspQlN7O7',
    ARRAY['administrator']::transmission_role[],
    ARRAY['read:all', 'backup:create'],
    ARRAY['backup.create', 'backup.read'],
    ARRAY['10.20.40.10']::INET[],
    'active',
    NOW() - INTERVAL '12 hours',
    1234,
    ARRAY['SCADA-MAIN-01', 'SCADA-DB-01'],
    ARRAY['scada-network'],
    v_admin_user_id,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '12 hours'
  );

END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify secrets and certificates count
-- SELECT COUNT(*) as cert_count FROM secrets_certificates;

-- Verify certificate types
-- SELECT secret_type, COUNT(*) as count FROM secrets_certificates GROUP BY secret_type;

-- Verify certificate status
-- SELECT status, COUNT(*) as count FROM secrets_certificates GROUP BY status;

-- Verify rotation history
-- SELECT COUNT(*) as rotation_count FROM certificate_rotation_history;

-- Verify API keys
-- SELECT COUNT(*) as api_key_count FROM api_keys;

-- Verify service principals
-- SELECT COUNT(*) as sp_count FROM service_principals;
