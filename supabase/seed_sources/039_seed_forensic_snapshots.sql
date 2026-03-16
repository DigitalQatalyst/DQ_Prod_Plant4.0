-- =============================================================================
-- SEED DATA: Forensic Snapshots
-- Description: Seed data for forensic_snapshots, forensic_snapshot_components, forensic_analysis_sessions, forensic_evidence_items
-- Requirements: 6.6
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_engineer_user_id UUID;
  v_supervisor_user_id UUID;
  v_protection_user_id UUID;
  v_auditor_user_id UUID;
  v_site_main_id UUID;
  v_site_jebel_id UUID;
  v_site_aweer_id UUID;
  v_asset_relay_id UUID;
  v_alert_id UUID;
  v_incident_id UUID;
  v_snapshot_id_1 UUID;
  v_snapshot_id_2 UUID;
  v_snapshot_id_3 UUID;
  v_snapshot_id_4 UUID;
  v_component_id_1 UUID;
  v_session_id_1 UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;
  
  -- Get security users
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_protection_user_id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_auditor_user_id FROM security_users WHERE username = 'abdullah.alshamsi' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Get sites
  SELECT id INTO v_site_main_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_jebel_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_aweer_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Try to get existing references (optional)
  SELECT id INTO v_alert_id FROM security_alerts WHERE tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_incident_id FROM incident_cases WHERE tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_relay_id FROM assets WHERE name LIKE '%SEL-411L%' AND tenant_id = v_tenant_id LIMIT 1;

  -- =============================================================================
  -- FORENSIC SNAPSHOTS
  -- =============================================================================
  
  v_snapshot_id_1 := gen_random_uuid();
  v_snapshot_id_2 := gen_random_uuid();
  v_snapshot_id_3 := gen_random_uuid();
  v_snapshot_id_4 := gen_random_uuid();
  
  INSERT INTO forensic_snapshots (
    id, tenant_id,
    snapshot_name, snapshot_type,
    trigger_reason, triggered_by_user, triggered_by_alert, triggered_by_incident,
    asset_id, system_type, system_name, zone_id, site_id,
    scope,
    capture_start, capture_end, capture_duration_seconds,
    status, completion_percentage,
    total_size_bytes, compressed_size_bytes, compression_ratio, file_count,
    storage_location, storage_path, encryption_enabled,
    custody_chain, current_custodian,
    snapshot_hash, integrity_verified, last_integrity_check,
    retention_until, legal_hold, legal_hold_reason,
    case_number,
    capture_method, capture_tool, capture_tool_version
  ) VALUES
  -- Completed incident response snapshot
  (
    v_snapshot_id_1, v_tenant_id,
    'INC-2024-001-Response-Snapshot', 'incident_response',
    'Unauthorized access attempt to protection relay zone - automated capture triggered',
    v_admin_user_id, v_alert_id, v_incident_id,
    v_asset_relay_id, 'protection_relay', 'SEL-411L-DMS-01', 'protection-systems', v_site_main_id,
    'full',
    NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 45 minutes', 900,
    'completed', 100,
    157286400, 62914560, 0.40, 245,
    'secure_archive', '/forensics/2024/INC-2024-001/snapshot-001.zip', true,
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '4 hours', 'custodian_id', v_admin_user_id, 'action', 'created', 'notes', 'Automated incident response capture'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '3 hours', 'custodian_id', v_supervisor_user_id, 'action', 'transferred', 'notes', 'Transferred to security team lead for analysis')
    ),
    v_supervisor_user_id,
    'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    true, NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '3 years', true, 'Security incident under investigation - legal hold per security policy',
    'INC-2024-001',
    'agent', 'TransmissionForensicAgent', '2.1.0'
  ),
  -- Scheduled compliance snapshot
  (
    v_snapshot_id_2, v_tenant_id,
    'Weekly-Compliance-2024-W03', 'scheduled',
    'Weekly scheduled compliance snapshot for NERC CIP audit trail',
    NULL, NULL, NULL,
    NULL, 'scada_node', 'SCADA-Central', 'scada-network', v_site_aweer_id,
    'configuration',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 30 minutes', 1800,
    'completed', 100,
    52428800, 20971520, 0.40, 156,
    'compliance_archive', '/forensics/compliance/2024-W03/snapshot.zip', true,
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '1 day', 'custodian_id', NULL, 'action', 'created', 'notes', 'Automated weekly compliance capture')
    ),
    v_auditor_user_id,
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    true, NOW() - INTERVAL '20 hours',
    NOW() + INTERVAL '7 years', false, NULL,
    'COMP-2024-W03',
    'automated', 'ComplianceSnapshotEngine', '1.5.2'
  ),
  -- Manual investigation snapshot (in progress)
  (
    v_snapshot_id_3, v_tenant_id,
    'Manual-Investigation-RTU560', 'manual',
    'Manual capture for RTU firmware analysis after security patch deployment',
    v_engineer_user_id, NULL, NULL,
    NULL, 'rtu', 'ABB-RTU560-JA-01', 'scada-network', v_site_jebel_id,
    'full',
    NOW() - INTERVAL '30 minutes', NULL, NULL,
    'capturing', 65,
    0, 0, NULL, 0,
    NULL, NULL, true,
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '30 minutes', 'custodian_id', v_engineer_user_id, 'action', 'created', 'notes', 'Manual capture initiated for post-patch verification')
    ),
    v_engineer_user_id,
    NULL, false, NULL,
    NOW() + INTERVAL '1 year', false, NULL,
    NULL,
    'manual', 'TransmissionForensicAgent', '2.1.0'
  ),
  -- Triggered protection event snapshot
  (
    v_snapshot_id_4, v_tenant_id,
    'Protection-Trip-Event-2024-01-15', 'triggered',
    'Automatic snapshot triggered by protection relay trip event',
    NULL, NULL, NULL,
    v_asset_relay_id, 'protection_relay', 'SEL-351S-JA-02', 'protection-systems', v_site_jebel_id,
    'logs',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 50 minutes', 600,
    'completed', 100,
    31457280, 12582912, 0.40, 89,
    'secure_archive', '/forensics/protection/2024-01-15/trip-event.zip', true,
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '6 hours', 'custodian_id', NULL, 'action', 'created', 'notes', 'Automated capture on protection trip event')
    ),
    v_protection_user_id,
    'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    true, NOW() - INTERVAL '5 hours',
    NOW() + INTERVAL '5 years', false, NULL,
    NULL,
    'agent', 'ProtectionEventCapture', '1.2.0'
  );

  -- =============================================================================
  -- FORENSIC SNAPSHOT COMPONENTS
  -- =============================================================================
  
  v_component_id_1 := gen_random_uuid();
  
  INSERT INTO forensic_snapshot_components (
    id, tenant_id, snapshot_id,
    component_type, component_name, component_path,
    data_size_bytes, data_hash, data_content, data_reference,
    collection_timestamp, collection_status, metadata
  ) VALUES
  -- Components for incident response snapshot
  (
    v_component_id_1, v_tenant_id, v_snapshot_id_1,
    'configuration_file', 'Protection Relay ICD', '/protection/sel411l/DMS01.icd',
    245760, 'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab',
    NULL, '/forensics/2024/INC-2024-001/components/DMS01.icd',
    NOW() - INTERVAL '3 hours 55 minutes', 'collected',
    '{"vendor": "SEL", "model": "411L", "iec61850_version": "2.1"}'
  ),
  (
    gen_random_uuid(), v_tenant_id, v_snapshot_id_1,
    'log_file', 'Security Event Log', '/var/log/security.log',
    1048576, 'c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    NULL, '/forensics/2024/INC-2024-001/components/security.log',
    NOW() - INTERVAL '3 hours 52 minutes', 'collected',
    '{"log_type": "security", "retention_days": 90}'
  ),
  (
    gen_random_uuid(), v_tenant_id, v_snapshot_id_1,
    'network_connections', 'Active Connections', '/proc/net/tcp',
    8192, 'd5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
    '{"connections": [{"local": "10.0.40.10:102", "remote": "10.0.50.22:54321", "state": "ESTABLISHED", "protocol": "MMS"}]}',
    NULL,
    NOW() - INTERVAL '3 hours 50 minutes', 'collected',
    '{"capture_method": "netstat"}'
  ),
  (
    gen_random_uuid(), v_tenant_id, v_snapshot_id_1,
    'process_list', 'Running Processes', '/proc',
    16384, 'e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
    '{"processes": [{"pid": 1234, "name": "relay_controller", "user": "system", "cpu": 2.5}, {"pid": 5678, "name": "goose_publisher", "user": "protection", "cpu": 1.2}]}',
    NULL,
    NOW() - INTERVAL '3 hours 48 minutes', 'collected',
    '{"capture_method": "ps"}'
  ),
  -- Components for compliance snapshot
  (
    gen_random_uuid(), v_tenant_id, v_snapshot_id_2,
    'configuration_file', 'SCADA Configuration', '/scada/config/master.cfg',
    524288, 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    NULL, '/forensics/compliance/2024-W03/components/master.cfg',
    NOW() - INTERVAL '23 hours 45 minutes', 'collected',
    '{"scada_version": "5.2", "config_version": "2024.01.15"}'
  ),
  -- Components for protection trip snapshot
  (
    gen_random_uuid(), v_tenant_id, v_snapshot_id_4,
    'event_log', 'Protection Event Records', '/protection/events/SEL351S_JA02.evl',
    2097152, 'a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
    NULL, '/forensics/protection/2024-01-15/components/events.evl',
    NOW() - INTERVAL '5 hours 55 minutes', 'collected',
    '{"event_count": 1247, "trip_events": 3}'
  );

  -- =============================================================================
  -- FORENSIC ANALYSIS SESSIONS
  -- =============================================================================
  
  v_session_id_1 := gen_random_uuid();
  
  INSERT INTO forensic_analysis_sessions (
    id, tenant_id,
    session_name, snapshot_id,
    analyst_id, analyst_role,
    session_start, session_end,
    analysis_type, analysis_tools,
    findings, indicators_of_compromise, timeline_events,
    summary, root_cause, recommendations,
    status, accessed_components
  ) VALUES
  -- Active analysis session
  (
    v_session_id_1, v_tenant_id,
    'INC-2024-001 Root Cause Analysis', v_snapshot_id_1,
    v_supervisor_user_id, 'supervisor',
    NOW() - INTERVAL '2 hours', NULL,
    'root_cause', ARRAY['log_analyzer', 'network_forensics', 'config_compare'],
    jsonb_build_array(
      jsonb_build_object('id', 'F001', 'severity', 'high', 'description', 'Unauthorized MMS connection from engineering workstation outside maintenance window', 'timestamp', NOW() - INTERVAL '4 hours 15 minutes'),
      jsonb_build_object('id', 'F002', 'severity', 'medium', 'description', 'Multiple configuration read attempts prior to connection block', 'timestamp', NOW() - INTERVAL '4 hours 12 minutes')
    ),
    jsonb_build_array(
      jsonb_build_object('type', 'ip_address', 'value', '10.0.50.99', 'description', 'Unauthorized workstation IP'),
      jsonb_build_object('type', 'user_agent', 'value', 'IEC61850Client/1.0', 'description', 'Non-standard MMS client')
    ),
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '4 hours 20 minutes', 'event', 'Initial connection attempt from 10.0.50.99'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '4 hours 15 minutes', 'event', 'MMS associate request received'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '4 hours 14 minutes', 'event', 'Connection blocked by zone firewall'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '4 hours', 'event', 'Forensic snapshot triggered')
    ),
    'Investigation ongoing - initial findings suggest unauthorized access attempt from unregistered engineering workstation',
    NULL,
    NULL,
    'active',
    ARRAY[v_component_id_1]
  ),
  -- Completed analysis session
  (
    gen_random_uuid(), v_tenant_id,
    'Protection Trip Event Analysis', v_snapshot_id_4,
    v_protection_user_id, 'engineer',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours',
    'timeline', ARRAY['event_log_analyzer', 'oscillography_viewer'],
    jsonb_build_array(
      jsonb_build_object('id', 'F001', 'severity', 'info', 'description', 'Protection trip operated correctly for phase-to-ground fault', 'timestamp', NOW() - INTERVAL '6 hours 5 minutes')
    ),
    '[]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('timestamp', NOW() - INTERVAL '6 hours 5 minutes', 'event', 'Fault detection by SEL-351S zone 1'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '6 hours 5 minutes' + INTERVAL '50 milliseconds', 'event', 'Zone 1 trip initiated'),
      jsonb_build_object('timestamp', NOW() - INTERVAL '6 hours 5 minutes' + INTERVAL '65 milliseconds', 'event', 'Breaker opened successfully')
    ),
    'Protection relay operated correctly for phase A-G fault at 15% of line length. Trip time of 65ms within specification.',
    'Phase A-G fault due to insulator flashover during sandstorm conditions',
    ARRAY['Increase insulator cleaning frequency during sandstorm season', 'Review protection coordination settings for zone 1'],
    'completed',
    NULL
  );

  -- =============================================================================
  -- FORENSIC EVIDENCE ITEMS
  -- =============================================================================
  
  INSERT INTO forensic_evidence_items (
    tenant_id,
    evidence_number, evidence_type,
    snapshot_id, component_id,
    description, significance,
    evidence_data, evidence_hash,
    timestamp_of_evidence, related_events,
    collected_by, custody_log,
    admissible, legal_hold,
    analysis_session_id
  ) VALUES
  -- Evidence from incident investigation
  (
    v_tenant_id,
    'EV-INC-2024-001-001', 'network_packet',
    v_snapshot_id_1, NULL,
    'Captured MMS associate request packet from unauthorized source',
    'critical',
    '{"src_ip": "10.0.50.99", "dst_ip": "10.0.40.10", "dst_port": 102, "protocol": "MMS", "mms_service": "associate", "timestamp": "2024-01-15T10:15:32.456Z"}',
    'packet_hash_001abc',
    NOW() - INTERVAL '4 hours 15 minutes',
    ARRAY['connection_attempt', 'firewall_block'],
    v_supervisor_user_id,
    jsonb_build_array(jsonb_build_object('timestamp', NOW() - INTERVAL '3 hours', 'action', 'collected', 'by', 'supervisor')),
    true, true,
    v_session_id_1
  ),
  (
    v_tenant_id,
    'EV-INC-2024-001-002', 'log_entry',
    v_snapshot_id_1, NULL,
    'Firewall log entry showing connection block',
    'high',
    '{"log_time": "2024-01-15T10:15:33.102Z", "action": "DENY", "rule": "156", "src": "10.0.50.99", "dst": "10.0.40.10:102", "reason": "Unauthorized source"}',
    'log_hash_002def',
    NOW() - INTERVAL '4 hours 14 minutes',
    ARRAY['firewall_deny'],
    v_supervisor_user_id,
    jsonb_build_array(jsonb_build_object('timestamp', NOW() - INTERVAL '3 hours', 'action', 'collected', 'by', 'supervisor')),
    true, true,
    v_session_id_1
  );

  -- =============================================================================
  -- FORENSIC SNAPSHOT REQUESTS
  -- =============================================================================
  
  INSERT INTO forensic_snapshot_requests (
    tenant_id,
    request_type, priority,
    target_asset_id, target_system_type, target_scope,
    requested_by, request_reason, request_timestamp,
    requires_approval, approved_by, approval_timestamp, approval_notes,
    status, snapshot_id, execution_timestamp
  ) VALUES
  -- Completed request
  (
    v_tenant_id,
    'immediate', 'critical',
    v_asset_relay_id, 'protection_relay', 'full',
    v_admin_user_id, 'Security alert triggered - capture system state for investigation',
    NOW() - INTERVAL '4 hours 5 minutes',
    false, NULL, NULL, NULL,
    'completed', v_snapshot_id_1, NOW() - INTERVAL '4 hours'
  ),
  -- Pending request
  (
    v_tenant_id,
    'scheduled', 'medium',
    NULL, 'rtu', 'configuration',
    v_engineer_user_id, 'Monthly RTU configuration audit snapshot',
    NOW() - INTERVAL '1 hour',
    true, NULL, NULL, NULL,
    'pending', NULL, NULL
  ),
  -- Recurring request
  (
    v_tenant_id,
    'recurring', 'low',
    NULL, 'scada_node', 'configuration',
    v_admin_user_id, 'Weekly compliance snapshot for audit trail',
    NOW() - INTERVAL '7 days',
    false, NULL, NULL, NULL,
    'approved', NULL, NULL
  );

END $$;

COMMIT;
