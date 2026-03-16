-- =============================================================================
-- SEED DATA: Security Audit Logs and Configuration Changes
-- Description: Seed data for security_audit_log, configuration_changes, log_correlation_rules
-- Requirements: 6.1, 6.2, 6.3
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_supervisor_user_id UUID;
  v_engineer_user_id UUID;
  v_operator_user_id UUID;
  v_auditor_user_id UUID;
  v_system_user_id UUID;
  v_asset_relay_id UUID;
  v_asset_rtu_id UUID;
  v_site_main_id UUID;
  v_site_jebel_id UUID;
  v_site_aweer_id UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;
  
  -- Get security users
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_operator_user_id FROM security_users WHERE username = 'khalid.almarri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_auditor_user_id FROM security_users WHERE username = 'abdullah.alshamsi' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_system_user_id FROM security_users WHERE username = 'system.service' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Use admin as fallback if system user not found
  IF v_system_user_id IS NULL THEN
    v_system_user_id := v_admin_user_id;
  END IF;

  -- Get sites
  SELECT id INTO v_site_main_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_jebel_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_aweer_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Get assets (if they exist)
  SELECT id INTO v_asset_relay_id FROM assets WHERE name LIKE '%SEL-411L%' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_rtu_id FROM assets WHERE name LIKE '%ABB RTU560%' AND tenant_id = v_tenant_id LIMIT 1;

  -- =============================================================================
  -- SECURITY AUDIT LOG ENTRIES
  -- =============================================================================
  
  -- Authentication events
  INSERT INTO security_audit_log (
    tenant_id, event_type, event_category, event_name, event_description,
    outcome, severity, user_id, username, user_role, session_id,
    source_ip, target_type, target_id, action_performed,
    risk_score, event_timestamp, retention_category
  ) VALUES
  -- Successful admin login
  (
    v_tenant_id, 'authentication'::audit_event_type, 'identity', 'User Login', 'Administrator logged in via SCADA console',
    'success'::audit_outcome, 'info'::audit_severity, v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess_001a2b3c',
    '10.0.50.15'::inet, 'session', 'sess_001a2b3c', 'Multi-factor authentication completed',
    15, NOW() - INTERVAL '2 hours', 'standard'
  ),
  -- Engineer login
  (
    v_tenant_id, 'authentication'::audit_event_type, 'identity', 'User Login', 'Engineer authenticated for protection relay maintenance',
    'success'::audit_outcome, 'info'::audit_severity, v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess_002d4e5f',
    '10.0.50.22'::inet, 'session', 'sess_002d4e5f', 'Certificate-based authentication',
    10, NOW() - INTERVAL '1 hour 30 minutes', 'standard'
  ),
  -- Failed login attempt
  (
    v_tenant_id, 'authentication'::audit_event_type, 'identity', 'Failed Login Attempt', 'Invalid credentials for operator account',
    'failure'::audit_outcome, 'warning'::audit_severity, v_operator_user_id, 'khalid.almarri', 'operator', NULL,
    '10.0.50.45'::inet, 'user', 'khalid.almarri', 'Password authentication failed',
    65, NOW() - INTERVAL '45 minutes', 'extended'
  ),
  -- Successful operator login after failure
  (
    v_tenant_id, 'authentication'::audit_event_type, 'identity', 'User Login', 'Operator logged in successfully after password reset',
    'success'::audit_outcome, 'info'::audit_severity, v_operator_user_id, 'khalid.almarri', 'operator', 'sess_003g7h8i',
    '10.0.50.45'::inet, 'session', 'sess_003g7h8i', 'Password authentication successful',
    20, NOW() - INTERVAL '40 minutes', 'standard'
  ),
  
  -- Authorization events
  (
    v_tenant_id, 'authorization'::audit_event_type, 'access', 'Zone Access Granted', 'Engineer granted access to protection systems zone',
    'success'::audit_outcome, 'info'::audit_severity, v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess_002d4e5f',
    '10.0.50.22'::inet, 'zone', 'protection-systems', 'Access granted based on role permissions',
    10, NOW() - INTERVAL '1 hour 25 minutes', 'standard'
  ),
  (
    v_tenant_id, 'authorization'::audit_event_type, 'access', 'Zone Access Denied', 'Operator attempted access to administrative zone',
    'denied'::audit_outcome, 'warning'::audit_severity, v_operator_user_id, 'khalid.almarri', 'operator', 'sess_003g7h8i',
    '10.0.50.45'::inet, 'zone', 'admin-zone', 'Insufficient permissions for zone access',
    70, NOW() - INTERVAL '35 minutes', 'extended'
  ),
  
  -- Configuration change events
  (
    v_tenant_id, 'configuration_change'::audit_event_type, 'system', 'Protection Relay Settings Modified', 'SEL-411L relay pickup current adjusted',
    'success'::audit_outcome, 'warning'::audit_severity, v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess_002d4e5f',
    '10.0.50.22'::inet, 'asset', 'SEL-411L-DMS-01', 'Relay configuration parameter changed via IEC 61850',
    55, NOW() - INTERVAL '1 hour 15 minutes', 'permanent'
  ),
  (
    v_tenant_id, 'configuration_change'::audit_event_type, 'system', 'RTU Firmware Updated', 'ABB RTU560 firmware upgraded to v5.2.1',
    'success'::audit_outcome, 'high'::audit_severity, v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess_001a2b3c',
    '10.0.50.15'::inet, 'asset', 'ABB-RTU560-JA-01', 'Firmware upgrade completed with automatic backup',
    60, NOW() - INTERVAL '6 hours', 'permanent'
  ),
  
  -- System access events
  (
    v_tenant_id, 'system_access'::audit_event_type, 'access', 'Remote Session Started', 'Remote maintenance session initiated to Jebel Ali',
    'success'::audit_outcome, 'warning'::audit_severity, v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess_004j9k0l',
    '10.0.50.22'::inet, 'site', 'jebel-ali-station', 'VPN tunnel established for remote access',
    45, NOW() - INTERVAL '5 hours', 'extended'
  ),
  (
    v_tenant_id, 'system_access'::audit_event_type, 'access', 'SCADA Console Access', 'Operator accessed SCADA HMI workstation',
    'success'::audit_outcome, 'info'::audit_severity, v_operator_user_id, 'khalid.almarri', 'operator', 'sess_003g7h8i',
    '10.0.50.45'::inet, 'asset', 'HMI-AWR-01', 'Console session started',
    15, NOW() - INTERVAL '30 minutes', 'standard'
  ),
  
  -- Data access events
  (
    v_tenant_id, 'data_access'::audit_event_type, 'data', 'Telemetry Data Export', 'Historical telemetry data exported for analysis',
    'success'::audit_outcome, 'info'::audit_severity, v_auditor_user_id, 'abdullah.alshamsi', 'auditor', 'sess_005m1n2o',
    '10.0.60.10'::inet, 'data', 'telemetry-archive', 'Data export request approved and completed',
    25, NOW() - INTERVAL '3 hours', 'standard'
  ),
  (
    v_tenant_id, 'data_access'::audit_event_type, 'data', 'Audit Log Query', 'Compliance audit log search executed',
    'success'::audit_outcome, 'info'::audit_severity, v_auditor_user_id, 'abdullah.alshamsi', 'auditor', 'sess_005m1n2o',
    '10.0.60.10'::inet, 'data', 'audit-logs', 'Query executed for NERC CIP compliance review',
    10, NOW() - INTERVAL '2 hours 30 minutes', 'standard'
  ),
  
  -- Security violation events
  (
    v_tenant_id, 'security_violation'::audit_event_type, 'security', 'Unauthorized Protocol Detected', 'Unknown Modbus traffic detected in IEC 61850 zone',
    'failure'::audit_outcome, 'critical'::audit_severity, v_system_user_id, 'system.service', 'administrator', NULL,
    '10.0.40.100'::inet, 'zone', 'protection-systems', 'Network anomaly detection triggered',
    95, NOW() - INTERVAL '4 hours', 'permanent'
  ),
  (
    v_tenant_id, 'security_violation'::audit_event_type, 'security', 'Failed Configuration Write', 'Blocked attempt to modify relay without authorization',
    'denied'::audit_outcome, 'high'::audit_severity, v_system_user_id, 'system.service', 'administrator', NULL,
    '10.0.40.55'::inet, 'asset', 'SEL-351S-JA-02', 'Write access denied - insufficient permissions',
    85, NOW() - INTERVAL '8 hours', 'permanent'
  ),
  
  -- Policy change events
  (
    v_tenant_id, 'policy_change'::audit_event_type, 'policy', 'Access Policy Updated', 'Remote access policy updated for contractors',
    'success'::audit_outcome, 'warning'::audit_severity, v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess_001a2b3c',
    '10.0.50.15'::inet, 'policy', 'remote-access-policy', 'Policy version 2.1 activated',
    50, NOW() - INTERVAL '1 day', 'permanent'
  ),
  (
    v_tenant_id, 'policy_change'::audit_event_type, 'policy', 'Firewall Rule Added', 'New IEC 61850 MMS rule added to zone firewall',
    'success'::audit_outcome, 'warning'::audit_severity, v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess_001a2b3c',
    '10.0.50.15'::inet, 'firewall', 'zone-fw-protection', 'Rule #156 added for GOOSE traffic',
    55, NOW() - INTERVAL '12 hours', 'permanent'
  ),
  
  -- Session management events
  (
    v_tenant_id, 'session_management'::audit_event_type, 'identity', 'Session Timeout', 'Engineer session terminated due to inactivity',
    'success'::audit_outcome, 'info'::audit_severity, v_engineer_user_id, 'mohammed.binrashid', 'engineer', 'sess_002d4e5f',
    '10.0.50.22'::inet, 'session', 'sess_002d4e5f', 'Session expired after 30 minutes of inactivity',
    10, NOW() - INTERVAL '50 minutes', 'standard'
  ),
  (
    v_tenant_id, 'session_management'::audit_event_type, 'identity', 'User Logout', 'Administrator logged out normally',
    'success'::audit_outcome, 'info'::audit_severity, v_admin_user_id, 'ahmed.almansouri', 'administrator', 'sess_001a2b3c',
    '10.0.50.15'::inet, 'session', 'sess_001a2b3c', 'User-initiated logout',
    5, NOW() - INTERVAL '15 minutes', 'standard'
  ),
  
  -- Compliance check events
  (
    v_tenant_id, 'compliance_check'::audit_event_type, 'compliance', 'Weekly Security Scan', 'Automated compliance scan completed',
    'success'::audit_outcome, 'info'::audit_severity, v_system_user_id, 'system.service', 'administrator', NULL,
    '10.0.60.5'::inet, 'system', 'compliance-engine', 'IEC 62351 compliance score: 92%',
    20, NOW() - INTERVAL '2 days', 'extended'
  ),
  (
    v_tenant_id, 'compliance_check'::audit_event_type, 'compliance', 'Certificate Expiry Warning', 'IEC 61850 client certificate expiring in 30 days',
    'partial'::audit_outcome, 'warning'::audit_severity, v_system_user_id, 'system.service', 'administrator', NULL,
    '10.0.60.5'::inet, 'certificate', 'iec61850-client-cert', 'Certificate renewal required',
    40, NOW() - INTERVAL '1 day', 'extended'
  );

  -- =============================================================================
  -- CONFIGURATION CHANGES
  -- =============================================================================
  
  INSERT INTO configuration_changes (
    tenant_id, change_type, component_type, component_id, component_name,
    asset_id, zone_id, site_id,
    configuration_path, parameter_name, old_value, new_value, change_reason,
    change_method, change_source, protocol_used,
    requires_approval, approved_by, approval_timestamp,
    validation_status, safety_impact, operational_impact, security_impact,
    affected_systems, rollback_possible, changed_by, change_timestamp
  ) VALUES
  -- Protection relay pickup current adjustment
  (
    v_tenant_id, 'asset_config', 'protection_relay', 'SEL-411L-DMS-01', 'SEL-411L Line Differential Relay',
    v_asset_relay_id, 'protection-systems', v_site_main_id,
    '/protection/87L/pickup', 'Line Differential Pickup Current', '"0.3 pu"', '"0.25 pu"',
    'Enhanced sensitivity for transformer protection per engineering study TR-2024-015',
    'manual', 'engineering_station', 'IEC61850',
    true, v_supervisor_user_id, NOW() - INTERVAL '1 hour 20 minutes',
    'validated', 'high', 'low', 'low',
    ARRAY['SEL-411L-DMS-01', 'Line Differential Protection Scheme'],
    true, v_engineer_user_id, NOW() - INTERVAL '1 hour 15 minutes'
  ),
  -- RTU firmware upgrade
  (
    v_tenant_id, 'asset_config', 'rtu', 'ABB-RTU560-JA-01', 'ABB RTU560 Jebel Ali',
    v_asset_rtu_id, 'scada-network', v_site_jebel_id,
    '/firmware/version', 'Firmware Version', '"5.1.8"', '"5.2.1"',
    'Security patch for CVE-2024-12345 vulnerability',
    'automated', 'remote_access', 'DNP3',
    true, v_admin_user_id, NOW() - INTERVAL '6 hours 10 minutes',
    'validated', 'medium', 'medium', 'high',
    ARRAY['ABB-RTU560-JA-01', 'SCADA Master', 'Historian'],
    true, v_admin_user_id, NOW() - INTERVAL '6 hours'
  ),
  -- GOOSE configuration update
  (
    v_tenant_id, 'network_config', 'protection_relay', 'SEL-451-AWR-01', 'SEL-451 Bay Controller',
    NULL, 'protection-systems', v_site_aweer_id,
    '/goose/publisher/dataset1', 'GOOSE Dataset Configuration', 
    '{"appId": "0x0001", "vlanId": 100}', '{"appId": "0x0001", "vlanId": 200, "priority": 4}',
    'VLAN migration for network segmentation project',
    'manual', 'engineering_station', 'IEC61850',
    true, v_supervisor_user_id, NOW() - INTERVAL '3 hours',
    'validated', 'medium', 'low', 'low',
    ARRAY['SEL-451-AWR-01', 'GOOSE Network', 'Bay Control Scheme'],
    true, v_engineer_user_id, NOW() - INTERVAL '2 hours 45 minutes'
  ),
  -- Firewall rule modification
  (
    v_tenant_id, 'security_policy', 'firewall', 'FW-PROT-MAIN-01', 'Protection Zone Firewall',
    NULL, 'dmz', v_site_main_id,
    '/rules/156', 'Firewall Rule 156',
    NULL, '{"action": "allow", "src": "10.0.50.0/24", "dst": "10.0.40.0/24", "port": 102, "protocol": "MMS"}',
    'Enable IEC 61850 MMS traffic for engineering workstations',
    'manual', 'hmi', NULL,
    true, v_admin_user_id, NOW() - INTERVAL '12 hours',
    'validated', 'low', 'low', 'medium',
    ARRAY['Zone Firewall', 'Engineering Workstations', 'Protection Relays'],
    true, v_admin_user_id, NOW() - INTERVAL '12 hours'
  ),
  -- DNP3 polling interval change
  (
    v_tenant_id, 'asset_config', 'rtu', 'ABB-RTU560-DMS-01', 'ABB RTU560 Main Substation',
    NULL, 'scada-network', v_site_main_id,
    '/dnp3/polling/class1', 'Class 1 Polling Interval', '"1000ms"', '"500ms"',
    'Faster polling for improved grid monitoring during peak demand season',
    'automated', 'api', 'DNP3',
    false, NULL, NULL,
    'validated', 'none', 'medium', 'none',
    ARRAY['ABB-RTU560-DMS-01', 'SCADA Master'],
    true, v_operator_user_id, NOW() - INTERVAL '8 hours'
  );

  -- =============================================================================
  -- LOG CORRELATION RULES
  -- =============================================================================
  
  INSERT INTO log_correlation_rules (
    tenant_id, name, description,
    event_pattern, time_window_minutes, correlation_key,
    minimum_events, maximum_events, severity_threshold,
    create_incident, escalate_severity, active, priority,
    created_by
  ) VALUES
  (
    v_tenant_id, 'Brute Force Detection', 'Detect multiple failed authentication attempts from same source',
    '{"event_type": "authentication", "outcome": "failure"}',
    5, 'source_ip',
    3, 20, 'warning'::audit_severity,
    true, true, true, 10,
    v_admin_user_id
  ),
  (
    v_tenant_id, 'Privilege Escalation Pattern', 'Detect rapid privilege changes or access to restricted zones',
    '{"event_type": ["authorization", "privilege_escalation"]}',
    10, 'user_id',
    2, 10, 'warning'::audit_severity,
    true, true, true, 20,
    v_admin_user_id
  ),
  (
    v_tenant_id, 'Configuration Change Cluster', 'Detect multiple configuration changes in short period',
    '{"event_type": "configuration_change"}',
    30, 'asset_id',
    3, 50, 'info'::audit_severity,
    false, true, true, 50,
    v_supervisor_user_id
  ),
  (
    v_tenant_id, 'Protection System Access Pattern', 'Monitor access patterns to protection relay systems',
    '{"zone_id": "protection-systems", "event_category": "access"}',
    60, 'user_id',
    5, 100, 'info'::audit_severity,
    false, false, true, 100,
    v_admin_user_id
  );

  -- =============================================================================
  -- AUDIT LOG AGGREGATIONS (Sample historical data)
  -- =============================================================================
  
  INSERT INTO audit_log_aggregations (
    tenant_id, period_start, period_end, aggregation_type,
    total_events, events_by_type, events_by_severity, events_by_outcome,
    unique_users, unique_assets,
    high_risk_events, failed_authentications, policy_violations, configuration_changes
  ) VALUES
  (
    v_tenant_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'daily',
    245, 
    '{"authentication": 85, "authorization": 42, "configuration_change": 18, "data_access": 35, "system_access": 45, "compliance_check": 20}',
    '{"info": 180, "warning": 45, "high": 15, "critical": 5}',
    '{"success": 220, "failure": 15, "denied": 8, "partial": 2}',
    8, 12,
    20, 8, 3, 18
  ),
  (
    v_tenant_id, NOW() - INTERVAL '1 day', NOW(), 'daily',
    198,
    '{"authentication": 72, "authorization": 38, "configuration_change": 12, "data_access": 28, "system_access": 38, "compliance_check": 10}',
    '{"info": 155, "warning": 32, "high": 8, "critical": 3}',
    '{"success": 182, "failure": 10, "denied": 5, "partial": 1}',
    7, 10,
    11, 5, 2, 12
  );

END $$;

COMMIT;
