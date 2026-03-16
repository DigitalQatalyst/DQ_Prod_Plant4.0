-- =============================================================================
-- SEED DATA: Remote Access Sessions and Network Exposure Assessments
-- Description: Combined seed for migrations 018 and 019
-- Requirements: 3.5, 3.8
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID, site IDs, user IDs, and asset IDs
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
  v_zone_protection_id UUID;
  v_zone_scada_id UUID;
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
  SELECT id INTO v_zone_protection_id FROM security_zones WHERE name = 'Jebel Ali Protection Systems Zone' LIMIT 1;
  SELECT id INTO v_zone_scada_id FROM security_zones WHERE name = 'Control Centre SCADA Network' LIMIT 1;
  
  IF v_dewa_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- Clear existing data
  DELETE FROM remote_access_sessions WHERE tenant_id = v_dewa_tenant_id;
  DELETE FROM network_exposure_assessments WHERE tenant_id = v_dewa_tenant_id;

  -- =============================================================================
  -- REMOTE ACCESS SESSIONS (Migration 018)
  -- =============================================================================
  
  -- Session 1: Active RDP session to SCADA server
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    v_engineer_user_id,
    'mohammed.binrashid',
    'rdp',
    'SCADA-MAIN-01',
    NULL,
    '10.20.30.50',
    '10.20.10.100',
    'active',
    'mfa',
    'authorized',
    NOW() - INTERVAL '1 hour 30 minutes',
    NULL,
    NULL,
    15,
    0,
    0,
    25,
    '[
      {"timestamp": "2024-01-16T09:00:00Z", "action": "session_started", "details": "RDP connection established"},
      {"timestamp": "2024-01-16T09:15:00Z", "action": "command_executed", "command": "systemctl status scada-service"},
      {"timestamp": "2024-01-16T09:30:00Z", "action": "file_accessed", "file": "/var/log/scada/system.log"}
    ]'::JSONB,
    '{"session_id": "rdp-sess-12345", "client_version": "RDP 10.0"}'::JSONB,
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '5 minutes'
  );
  
  -- Session 2: Completed SSH session to protection relay
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    termination_reason, audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    v_engineer_user_id,
    'mohammed.binrashid',
    'ssh',
    'REL-JA-220-03',
    (SELECT id FROM assets WHERE tenant_id = v_dewa_tenant_id LIMIT 1),
    '10.20.30.50',
    '10.20.15.203',
    'terminated',
    'certificate',
    'authorized',
    NOW() - INTERVAL '2 days 10:00:00',
    NOW() - INTERVAL '2 days 11:45:00',
    6300, -- 1 hour 45 minutes
    42,
    3,
    0,
    35,
    'User initiated logout',
    '[
      {"timestamp": "2024-01-14T10:00:00Z", "action": "session_started", "details": "SSH connection with certificate auth"},
      {"timestamp": "2024-01-14T10:15:00Z", "action": "firmware_backup", "details": "Backup created before upgrade"},
      {"timestamp": "2024-01-14T10:30:00Z", "action": "firmware_upload", "details": "New firmware uploaded"},
      {"timestamp": "2024-01-14T11:00:00Z", "action": "settings_verified", "details": "Post-upgrade verification complete"},
      {"timestamp": "2024-01-14T11:45:00Z", "action": "session_ended", "details": "Normal logout"}
    ]'::JSONB,
    '{"session_id": "ssh-sess-67890", "ssh_version": "OpenSSH_8.2"}'::JSONB,
    NOW() - INTERVAL '2 days 10:00:00',
    NOW() - INTERVAL '2 days 11:45:00'
  );
  
  -- Session 3: Failed unauthorized access attempt
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    termination_reason, audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    NULL,
    'unknown',
    'ssh',
    'REL-JA-132-01',
    NULL,
    '192.168.100.50',
    '10.20.15.101',
    'failed',
    'password',
    'unauthorized',
    NOW() - INTERVAL '5 days 03:22:00',
    NOW() - INTERVAL '5 days 03:22:05',
    5,
    0,
    0,
    1,
    95,
    'Authentication failed - unauthorized source IP',
    '[
      {"timestamp": "2024-01-11T03:22:00Z", "action": "connection_attempt", "details": "SSH connection from unauthorized IP"},
      {"timestamp": "2024-01-11T03:22:02Z", "action": "auth_failed", "details": "Invalid credentials"},
      {"timestamp": "2024-01-11T03:22:05Z", "action": "connection_blocked", "details": "IP blocked by firewall"},
      {"timestamp": "2024-01-11T03:22:05Z", "action": "alert_generated", "alert_id": "SEC-ALERT-2024-0123"}
    ]'::JSONB,
    '{"blocked": true, "threat_level": "high"}'::JSONB,
    NOW() - INTERVAL '5 days 03:22:00',
    NOW() - INTERVAL '5 days 03:22:05'
  );
  
  -- Session 4: Active IEC 61850 client session
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    v_engineer_user_id,
    'omar.alfalasi',
    'iec61850-client',
    'IED-JA-01',
    NULL,
    '10.20.30.55',
    '10.20.15.150',
    'active',
    'certificate',
    'authorized',
    NOW() - INTERVAL '45 minutes',
    NULL,
    NULL,
    8,
    0,
    0,
    20,
    '[
      {"timestamp": "2024-01-16T09:15:00Z", "action": "session_started", "details": "IEC 61850 MMS connection"},
      {"timestamp": "2024-01-16T09:20:00Z", "action": "data_read", "details": "Reading protection settings"},
      {"timestamp": "2024-01-16T09:30:00Z", "action": "configuration_viewed", "details": "Viewing relay configuration"}
    ]'::JSONB,
    '{"protocol": "IEC61850-MMS", "ied_model": "REG670"}'::JSONB,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '5 minutes'
  );
  
  -- Session 5: Expired web session
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    termination_reason, audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    v_operator_user_id,
    'khalid.almarri',
    'web',
    'SCADA-WEB-01',
    NULL,
    '10.20.30.45',
    '10.20.10.200',
    'expired',
    'sso',
    'authorized',
    NOW() - INTERVAL '1 day 08:00:00',
    NOW() - INTERVAL '1 day 16:00:00',
    28800, -- 8 hours
    0,
    0,
    0,
    10,
    'Session timeout - 8 hour limit reached',
    '[
      {"timestamp": "2024-01-15T08:00:00Z", "action": "session_started", "details": "Web login via SSO"},
      {"timestamp": "2024-01-15T16:00:00Z", "action": "session_expired", "details": "Maximum session duration reached"}
    ]'::JSONB,
    '{"browser": "Chrome 120", "session_timeout": "8h"}'::JSONB,
    NOW() - INTERVAL '1 day 08:00:00',
    NOW() - INTERVAL '1 day 16:00:00'
  );
  
  -- Session 6: VNC session to HMI workstation
  INSERT INTO remote_access_sessions (
    id, tenant_id, site_id, user_id, username,
    session_type, target_system, target_asset_id,
    source_ip, destination_ip,
    status, authentication_method, authorization_status,
    session_start, session_end, duration_seconds,
    commands_executed, files_transferred, alerts_triggered, risk_score,
    termination_reason, audit_trail, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_al_aweer_site_id,
    v_engineer_user_id,
    'sarah.alnuaimi',
    'vnc',
    'HMI-AA-01',
    NULL,
    '10.20.30.52',
    '10.20.25.100',
    'terminated',
    'password',
    'authorized',
    NOW() - INTERVAL '3 days 14:00:00',
    NOW() - INTERVAL '3 days 15:30:00',
    5400, -- 1.5 hours
    25,
    2,
    0,
    30,
    'User initiated disconnect',
    '[
      {"timestamp": "2024-01-13T14:00:00Z", "action": "session_started", "details": "VNC connection to HMI"},
      {"timestamp": "2024-01-13T14:30:00Z", "action": "screen_shared", "details": "Remote screen control active"},
      {"timestamp": "2024-01-13T15:30:00Z", "action": "session_ended", "details": "Normal disconnect"}
    ]'::JSONB,
    '{"vnc_version": "RealVNC 6.0", "encryption": "AES-256"}'::JSONB,
    NOW() - INTERVAL '3 days 14:00:00',
    NOW() - INTERVAL '3 days 15:30:00'
  );

  -- Additional Sessions (7-15)
  INSERT INTO remote_access_sessions (tenant_id, site_id, user_id, username, session_type, target_system, source_ip, destination_ip, status, authentication_method, authorization_status, session_start, duration_seconds, risk_score)
  VALUES
  (v_dewa_tenant_id, v_control_centre_site_id, v_admin_user_id, 'ahmed.almansouri', 'ssh', 'CORE-SW-01', '10.20.30.10', '10.20.10.1', 'active', 'mfa', 'authorized', NOW() - INTERVAL '20 minutes', NULL, 5),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_supervisor_user_id, 'fatima.alzahra', 'web', 'DASHBOARD-JA', '10.20.30.15', '10.20.15.10', 'active', 'sso', 'authorized', NOW() - INTERVAL '45 minutes', NULL, 10),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_operator_user_id, 'khalid.almarri', 'rdp', 'OP-WS-AA-01', '10.20.30.20', '10.20.25.50', 'active', 'password', 'authorized', NOW() - INTERVAL '10 minutes', NULL, 15),
  (v_dewa_tenant_id, v_control_centre_site_id, NULL, 'anonymous', 'ssh', 'SCADA-SRV-02', '192.168.1.100', '10.20.10.101', 'failed', 'password', 'unauthorized', NOW() - INTERVAL '2 hours', 5, 90),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_engineer_user_id, 'mohammed.binrashid', 'ssh', 'RELAY-JA-05', '10.20.30.50', '10.20.15.105', 'terminated', 'certificate', 'authorized', NOW() - INTERVAL '4 hours', 3600, 20),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_engineer_user_id, 'omar.alfalasi', 'iec61850-client', 'IED-AA-12', '10.20.30.55', '10.20.25.112', 'active', 'certificate', 'authorized', NOW() - INTERVAL '30 minutes', NULL, 12),
  (v_dewa_tenant_id, v_control_centre_site_id, v_operator_user_id, 'sarah.alnuaimi', 'web', 'CONFIG-TOOL', '10.20.30.52', '10.20.10.250', 'expired', 'sso', 'authorized', NOW() - INTERVAL '10 hours', 28800, 8),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_admin_user_id, 'ahmed.almansouri', 'rdp', 'ADMIN-WS-JA', '10.20.30.10', '10.20.15.20', 'terminated', 'mfa', 'authorized', NOW() - INTERVAL '1 day', 7200, 5),
  (v_dewa_tenant_id, v_al_aweer_site_id, NULL, 'external-vendor', 'ssh', 'GATEWAY-AA', '45.67.89.12', '10.20.25.1', 'active', 'mfa', 'authorized', NOW() - INTERVAL '1 hour', NULL, 30);

  -- Additional Sessions (16-25)
  INSERT INTO remote_access_sessions (tenant_id, site_id, user_id, username, session_type, target_system, source_ip, destination_ip, status, authentication_method, authorization_status, session_start, duration_seconds, risk_score)
  VALUES
  (v_dewa_tenant_id, v_control_centre_site_id, v_engineer_user_id, 'mohammed.binrashid', 'ssh', 'FW-CORE-01', '10.20.30.50', '10.20.10.5', 'active', 'certificate', 'authorized', NOW() - INTERVAL '5 minutes', NULL, 10),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_operator_user_id, 'khalid.almarri', 'web', 'HMI-JA-04', '10.20.30.45', '10.20.15.40', 'active', 'sso', 'authorized', NOW() - INTERVAL '15 minutes', NULL, 12),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_supervisor_user_id, 'fatima.alzahra', 'vnc', 'WS-AA-09', '10.20.30.15', '10.20.25.109', 'terminated', 'password', 'authorized', NOW() - INTERVAL '5 hours', 1800, 25),
  (v_dewa_tenant_id, v_control_centre_site_id, NULL, 'brute-force-bot', 'ssh', 'SCADA-MAIN-01', '185.123.45.6', '10.20.10.100', 'failed', 'password', 'unauthorized', NOW() - INTERVAL '3 hours', 1, 98),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_engineer_user_id, 'omar.alfalasi', 'rdp', 'ENG-WS-JA-02', '10.20.30.55', '10.20.15.62', 'active', 'mfa', 'authorized', NOW() - INTERVAL '25 minutes', NULL, 18),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_operator_user_id, 'khalid.almarri', 'web', 'SCADA-AA-WEB', '10.20.30.45', '10.20.25.200', 'expired', 'sso', 'authorized', NOW() - INTERVAL '12 hours', 3600, 5),
  (v_dewa_tenant_id, v_control_centre_site_id, v_admin_user_id, 'ahmed.almansouri', 'ssh', 'LOG-SRV', '10.20.30.10', '10.20.10.15', 'terminated', 'mfa', 'authorized', NOW() - INTERVAL '2 days', 5400, 3),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_engineer_user_id, 'mohammed.binrashid', 'iec61850-client', 'IED-JA-22', '10.20.30.50', '10.20.15.122', 'active', 'certificate', 'authorized', NOW() - INTERVAL '10 minutes', NULL, 14),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_engineer_user_id, 'sarah.alnuaimi', 'rdp', 'HMI-AA-02', '10.20.30.52', '10.20.25.102', 'active', 'mfa', 'authorized', NOW() - INTERVAL '40 minutes', NULL, 20),
  (v_dewa_tenant_id, v_control_centre_site_id, v_engineer_user_id, 'omar.alfalasi', 'ssh', 'APP-SRV-01', '10.20.30.55', '10.20.10.20', 'terminated', 'certificate', 'authorized', NOW() - INTERVAL '6 hours', 7200, 15);

  -- Additional Sessions (26-30)
  INSERT INTO remote_access_sessions (tenant_id, site_id, user_id, username, session_type, target_system, source_ip, destination_ip, status, authentication_method, authorization_status, session_start, duration_seconds, risk_score)
  VALUES
  (v_dewa_tenant_id, v_jebel_ali_site_id, NULL, 'unauthorized-user', 'ssh', 'RTU-JA-01', '172.16.0.50', '10.20.15.201', 'failed', 'password', 'unauthorized', NOW() - INTERVAL '1 hour', 2, 95),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_operator_user_id, 'khalid.almarri', 'web', 'METER-AA-GW', '10.20.30.45', '10.20.25.50', 'active', 'sso', 'authorized', NOW() - INTERVAL '5 minutes', NULL, 10),
  (v_dewa_tenant_id, v_control_centre_site_id, v_supervisor_user_id, 'fatima.alzahra', 'rdp', 'MGMT-SRV', '10.20.30.15', '10.20.10.50', 'active', 'mfa', 'authorized', NOW() - INTERVAL '15 minutes', NULL, 22),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_engineer_user_id, 'mohammed.binrashid', 'ssh', 'CORE-RTR-JA', '10.20.30.50', '10.20.15.1', 'terminated', 'certificate', 'authorized', NOW() - INTERVAL '8 hours', 1200, 10),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_admin_user_id, 'ahmed.almansouri', 'ssh', 'GATEWAY-AA', '10.20.30.10', '10.20.25.1', 'active', 'mfa', 'authorized', NOW() - INTERVAL '30 minutes', NULL, 5);

  
  -- =============================================================================
  -- NETWORK EXPOSURE ASSESSMENTS (Migration 019)
  -- =============================================================================
  
  -- Assessment 1: Vulnerability scan of SCADA network
  INSERT INTO network_exposure_assessments (
    id, tenant_id, site_id, asset_id, zone_id,
    assessment_type, exposure_level, risk_score,
    findings_count, critical_findings, high_findings, medium_findings, low_findings,
    exposed_services, exposed_ports, vulnerable_protocols,
    mitigation_status, mitigation_recommendations,
    assessment_date, next_assessment_date, assessor, automated,
    findings_summary, detailed_findings, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_control_centre_site_id,
    NULL,
    v_zone_scada_id,
    'vulnerability-scan',
    'medium',
    55,
    12, 0, 3, 7, 2,
    '[
      {"service": "DNP3", "port": 20000, "version": "IEEE 1815-2012"},
      {"service": "IEC 61850 MMS", "port": 102, "version": "Edition 2"},
      {"service": "HTTPS", "port": 443, "version": "TLS 1.2"}
    ]'::JSONB,
    '[20000, 102, 443, 502, 8080]'::JSONB,
    '[
      {"protocol": "MODBUS", "vulnerability": "No authentication", "severity": "high"},
      {"protocol": "SNMP", "vulnerability": "SNMPv2c in use", "severity": "medium"}
    ]'::JSONB,
    'in-progress',
    '[
      {"priority": "high", "recommendation": "Upgrade MODBUS to MODBUS/TCP with authentication"},
      {"priority": "medium", "recommendation": "Migrate from SNMPv2c to SNMPv3"},
      {"priority": "medium", "recommendation": "Update TLS to version 1.3"}
    ]'::JSONB,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '75 days', -- Quarterly scans
    'Sarah Al Nuaimi',
    true,
    'Automated vulnerability scan identified 12 findings across SCADA network. No critical vulnerabilities found. Three high-priority findings related to legacy protocol security.',
    '{
      "scan_duration_minutes": 45,
      "assets_scanned": 28,
      "scan_tool": "Nessus Professional",
      "scan_policy": "ICS/SCADA Security Audit"
    }'::JSONB,
    '{"scan_id": "SCAN-2024-0156", "compliance_frameworks": ["IEC 62443", "NERC CIP"]}'::JSONB,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '10 days'
  );
  
  -- Assessment 2: Penetration test of protection systems zone
  INSERT INTO network_exposure_assessments (
    id, tenant_id, site_id, asset_id, zone_id,
    assessment_type, exposure_level, risk_score,
    findings_count, critical_findings, high_findings, medium_findings, low_findings,
    exposed_services, exposed_ports, vulnerable_protocols,
    mitigation_status, mitigation_recommendations,
    assessment_date, next_assessment_date, assessor, automated,
    findings_summary, detailed_findings, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    NULL,
    v_zone_protection_id,
    'penetration-test',
    'low',
    25,
    5, 0, 0, 3, 2,
    '[
      {"service": "IEC 61850 MMS", "port": 102, "version": "Edition 2.1", "authentication": "certificate-based"}
    ]'::JSONB,
    '[102]'::JSONB,
    '[]'::JSONB,
    'completed',
    '[
      {"priority": "medium", "recommendation": "Implement network segmentation for individual relay groups"},
      {"priority": "low", "recommendation": "Enable additional logging for MMS operations"}
    ]'::JSONB,
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '320 days', -- Annual penetration tests
    'External Security Firm - CyberOT Solutions',
    false,
    'Comprehensive penetration test of protection systems zone. Strong security posture confirmed. No critical or high-risk findings. Zone demonstrates IEC 62443 SL4 compliance.',
    '{
      "test_duration_days": 3,
      "test_methodology": "PTES",
      "attack_vectors_tested": ["network", "physical", "social_engineering"],
      "successful_exploits": 0
    }'::JSONB,
    '{"report_id": "PENTEST-2024-JA-001", "certification": "IEC 62443 SL4"}'::JSONB,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '40 days'
  );
  
  -- Assessment 3: Configuration audit of specific asset
  INSERT INTO network_exposure_assessments (
    id, tenant_id, site_id, asset_id, zone_id,
    assessment_type, exposure_level, risk_score,
    findings_count, critical_findings, high_findings, medium_findings, low_findings,
    exposed_services, exposed_ports, vulnerable_protocols,
    mitigation_status, mitigation_recommendations,
    assessment_date, next_assessment_date, assessor, automated,
    findings_summary, detailed_findings, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    (SELECT id FROM assets WHERE tenant_id = v_dewa_tenant_id LIMIT 1),
    v_zone_protection_id,
    'configuration-audit',
    'high',
    72,
    8, 1, 2, 4, 1,
    '[
      {"service": "Telnet", "port": 23, "status": "enabled"},
      {"service": "HTTP", "port": 80, "status": "enabled"},
      {"service": "SSH", "port": 22, "status": "enabled"}
    ]'::JSONB,
    '[23, 80, 22, 102]'::JSONB,
    '[
      {"protocol": "Telnet", "vulnerability": "Unencrypted management protocol", "severity": "critical"},
      {"protocol": "HTTP", "vulnerability": "Unencrypted web interface", "severity": "high"}
    ]'::JSONB,
    'pending',
    '[
      {"priority": "critical", "recommendation": "Disable Telnet immediately, use SSH only"},
      {"priority": "high", "recommendation": "Disable HTTP, enable HTTPS with strong cipher suites"},
      {"priority": "medium", "recommendation": "Implement certificate-based SSH authentication"},
      {"priority": "medium", "recommendation": "Enable SNMP v3 for monitoring"}
    ]'::JSONB,
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '83 days', -- Quarterly audits
    'Mohammed bin Rashid',
    false,
    'Configuration audit revealed critical security gaps in legacy protection relay. Telnet and HTTP services enabled, creating significant security exposure. Immediate remediation required.',
    '{
      "device_model": "SEL-351",
      "firmware_version": "R114-V0-Z001-D20110209",
      "last_config_change": "2023-08-15",
      "compliance_status": "non-compliant"
    }'::JSONB,
    '{"audit_id": "CFG-AUDIT-2024-0089", "remediation_deadline": "2024-02-01"}'::JSONB,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
  );
  
  -- Assessment 4: Network scan of field devices zone
  INSERT INTO network_exposure_assessments (
    id, tenant_id, site_id, asset_id, zone_id,
    assessment_type, exposure_level, risk_score,
    findings_count, critical_findings, high_findings, medium_findings, low_findings,
    exposed_services, exposed_ports, vulnerable_protocols,
    mitigation_status, mitigation_recommendations,
    assessment_date, next_assessment_date, assessor, automated,
    findings_summary, detailed_findings, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_al_aweer_site_id,
    NULL,
    (SELECT id FROM security_zones WHERE name = 'Al Aweer Field Devices Zone' LIMIT 1),
    'network-scan',
    'medium',
    48,
    15, 0, 2, 9, 4,
    '[
      {"service": "MODBUS/TCP", "port": 502, "devices": 12},
      {"service": "DNP3", "port": 20000, "devices": 8},
      {"service": "HTTP", "port": 80, "devices": 5}
    ]'::JSONB,
    '[502, 20000, 80, 161, 8080]'::JSONB,
    '[
      {"protocol": "MODBUS", "vulnerability": "No encryption", "severity": "high"},
      {"protocol": "SNMP", "vulnerability": "Community strings in use", "severity": "medium"}
    ]'::JSONB,
    'in-progress',
    '[
      {"priority": "high", "recommendation": "Implement VPN for MODBUS communications"},
      {"priority": "medium", "recommendation": "Upgrade to DNP3 Secure Authentication"},
      {"priority": "medium", "recommendation": "Disable HTTP on field devices, use HTTPS"}
    ]'::JSONB,
    NOW() - INTERVAL '20 days',
    NOW() + INTERVAL '70 days',
    'Automated Scanner',
    true,
    'Network scan of field devices zone identified 15 findings. Two high-priority issues related to unencrypted industrial protocols. Mitigation plan in progress.',
    '{
      "devices_discovered": 25,
      "scan_duration_minutes": 30,
      "scan_tool": "Nmap + NSE Scripts",
      "network_range": "10.20.25.0/24"
    }'::JSONB,
    '{"scan_id": "NETSCAN-2024-0234", "zone_type": "field-devices"}'::JSONB,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days'
  );
  
  -- Assessment 5: Protocol analysis of IEC 61850 traffic
  INSERT INTO network_exposure_assessments (
    id, tenant_id, site_id, asset_id, zone_id,
    assessment_type, exposure_level, risk_score,
    findings_count, critical_findings, high_findings, medium_findings, low_findings,
    exposed_services, exposed_ports, vulnerable_protocols,
    mitigation_status, mitigation_recommendations,
    assessment_date, next_assessment_date, assessor, automated,
    findings_summary, detailed_findings, metadata,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_dewa_tenant_id,
    v_jebel_ali_site_id,
    NULL,
    v_zone_protection_id,
    'protocol-analysis',
    'low',
    18,
    3, 0, 0, 2, 1,
    '[
      {"service": "IEC 61850 MMS", "port": 102, "encryption": "TLS 1.2"},
      {"service": "IEC 61850 GOOSE", "multicast": "01-0C-CD-01-00-00"}
    ]'::JSONB,
    '[102]'::JSONB,
    '[]'::JSONB,
    'completed',
    '[
      {"priority": "medium", "recommendation": "Implement GOOSE message authentication per IEC 62351"},
      {"priority": "low", "recommendation": "Enable MMS operation logging for forensics"}
    ]'::JSONB,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '150 days', -- Semi-annual protocol analysis
    'Omar Al Falasi',
    false,
    'Deep packet inspection of IEC 61850 traffic shows proper implementation of security features. MMS communications properly encrypted. GOOSE messages lack authentication (common for legacy deployments).',
    '{
      "capture_duration_hours": 24,
      "packets_analyzed": 1250000,
      "analysis_tool": "Wireshark + IEC 61850 Dissector",
      "protocols_detected": ["MMS", "GOOSE", "SV"]
    }'::JSONB,
    '{"analysis_id": "PROTO-2024-IEC61850-001", "standard_compliance": "IEC 61850-8-1"}'::JSONB,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '25 days'
  );

  -- Additional Assessments (6-15)
  INSERT INTO network_exposure_assessments (tenant_id, site_id, zone_id, assessment_type, exposure_level, risk_score, findings_count, mitigation_status, assessment_date, assessor, automated)
  VALUES
  (v_dewa_tenant_id, v_control_centre_site_id, v_zone_scada_id, 'vulnerability-scan', 'low', 22, 4, 'completed', NOW() - INTERVAL '5 days', 'System Auditor', true),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_zone_protection_id, 'penetration-test', 'medium', 45, 8, 'in-progress', NOW() - INTERVAL '12 days', 'External Team', false),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_zone_scada_id, 'configuration-audit', 'high', 78, 15, 'pending', NOW() - INTERVAL '2 days', 'Compliance Officer', false),
  (v_dewa_tenant_id, v_control_centre_site_id, v_zone_scada_id, 'network-scan', 'medium', 52, 10, 'in-progress', NOW() - INTERVAL '20 days', 'Automated Tool', true),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_zone_protection_id, 'protocol-analysis', 'low', 15, 2, 'completed', NOW() - INTERVAL '45 days', 'Security Analyst', false),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_zone_protection_id, 'vulnerability-scan', 'critical', 92, 25, 'pending', NOW() - INTERVAL '1 day', 'Emergency Response Taskforce', true),
  (v_dewa_tenant_id, v_control_centre_site_id, v_zone_scada_id, 'penetration-test', 'low', 30, 5, 'completed', NOW() - INTERVAL '90 days', 'Red Team', false),
  (v_dewa_tenant_id, v_jebel_ali_site_id, v_zone_scada_id, 'configuration-audit', 'medium', 40, 6, 'in-progress', NOW() - INTERVAL '15 days', 'Internal Audit', false),
  (v_dewa_tenant_id, v_al_aweer_site_id, v_zone_scada_id, 'network-scan', 'low', 25, 3, 'completed', NOW() - INTERVAL '60 days', 'Nessus', true),
  (v_dewa_tenant_id, v_control_centre_site_id, v_zone_protection_id, 'protocol-analysis', 'medium', 55, 12, 'in-progress', NOW() - INTERVAL '30 days', 'Protocol Expert', false);


END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify remote access sessions
-- SELECT COUNT(*) as session_count FROM remote_access_sessions;

-- Verify session status distribution
-- SELECT status, COUNT(*) as count FROM remote_access_sessions GROUP BY status;

-- Verify session types
-- SELECT session_type, COUNT(*) as count FROM remote_access_sessions GROUP BY session_type;

-- Verify network exposure assessments
-- SELECT COUNT(*) as assessment_count FROM network_exposure_assessments;

-- Verify assessment types
-- SELECT assessment_type, COUNT(*) as count FROM network_exposure_assessments GROUP BY assessment_type;

-- Verify exposure levels
-- SELECT exposure_level, COUNT(*) as count FROM network_exposure_assessments GROUP BY exposure_level;
