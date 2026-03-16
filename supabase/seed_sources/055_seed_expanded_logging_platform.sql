-- =============================================================================
-- SEED DATA: Massive Expanded Logging & Platform Protection Data
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
  v_site_main_id UUID;
  v_site_jebel_id UUID;
  v_site_aweer_id UUID;
  v_asset_transformer_id UUID;
  v_asset_breaker_id UUID;
  v_asset_relay_id UUID;
  v_asset_rtu_id UUID;
  v_asset_hmi_id UUID;
  v_monitor_id_linux_bin UUID;
  v_monitor_id_scada_cfg UUID;
  v_monitor_id_firmware UUID;
  v_monitor_id_os_kernel UUID;
  v_monitor_id_net_config UUID;
  v_snapshot_id_exploit UUID;
  v_snapshot_id_recon UUID;
  v_snapshot_id_maintenance UUID;
  v_snapshot_id_phys_breach UUID;
  v_policy_db_id UUID;
  v_policy_conf_id UUID;
  v_policy_arc_id UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  -- Get security users
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_operator_user_id FROM security_users WHERE username = 'khalid.almarri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_auditor_user_id FROM security_users WHERE username = 'abdullah.alshamsi' AND tenant_id = v_tenant_id LIMIT 1;

  -- Get sites
  SELECT id INTO v_site_main_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_jebel_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_aweer_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Get assets
  SELECT a.id INTO v_asset_transformer_id FROM assets a JOIN asset_types at ON a.asset_type_id = at.id WHERE at.code = 'TRANSFORMER' AND a.tenant_id = v_tenant_id LIMIT 1;
  SELECT a.id INTO v_asset_breaker_id FROM assets a JOIN asset_types at ON a.asset_type_id = at.id WHERE at.code = 'BREAKER' AND a.tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_relay_id FROM assets WHERE name LIKE '%SEL-411L%' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_rtu_id FROM assets WHERE name LIKE '%ABB RTU560%' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_hmi_id FROM assets WHERE name LIKE '%SCADA HMI%' AND tenant_id = v_tenant_id LIMIT 1;

  -- 1. CONFIGURATION & ASSET CHANGE HISTORY (20 records)
  INSERT INTO configuration_changes (
    tenant_id, change_type, component_type, component_id, component_name,
    asset_id, zone_id, site_id, configuration_path, parameter_name, 
    old_value, new_value, change_reason, change_method, change_source, 
    validation_status, safety_impact, operational_impact, security_impact,
    changed_by, change_timestamp
  ) VALUES
  -- Substation Main
  (v_tenant_id, 'asset_config', 'transformer', 'PLC-DMS-TRAFO', 'Main Transformer PLC Controller', v_asset_transformer_id, 'substation-automation', v_site_main_id, '/cooling/control', 'Threshold Temp', '"85C"', '"80C"', 'Seasonal load adjustment', 'manual', 'hmi', 'validated', 'medium', 'medium', 'low', v_operator_user_id, NOW() - INTERVAL '3 days'),
  (v_tenant_id, 'asset_config', 'protection_relay', 'SIS-DMS-RELAY', 'Line Safety Protection SIS', v_asset_relay_id, 'protection-systems', v_site_main_id, '/protection/settings', 'Overcurrent Trip', '"1.2A"', '"1.1A"', 'Protection sensitivity optimization', 'manual', 'engineering_station', 'failed', 'high', 'low', 'low', v_engineer_user_id, NOW() - INTERVAL '2 days'),
  (v_tenant_id, 'system_config', 'hmi', 'HMI-DMS-01', 'Master SCADA HMI', v_asset_hmi_id, 'control-center', v_site_main_id, '/ui/config', 'Refresh Rate', '"1s"', '"500ms"', 'Real-time visibility improvement', 'automated', 'config_manager', 'validated', 'low', 'low', 'low', v_admin_user_id, NOW() - INTERVAL '12 hours'),
  (v_tenant_id, 'security_policy', 'firewall', 'FW-DMS-CORE', 'Site Edge Firewall PLC-Proxy', NULL, 'management-zone', v_site_main_id, '/rules/egress', 'Allow HTTP', '"true"', '"false"', 'Closing unnecessary ports per audit', 'manual', 'console', 'validated', 'none', 'low', 'medium', v_admin_user_id, NOW() - INTERVAL '4 days'),
  (v_tenant_id, 'asset_config', 'circuit_breaker', 'CB-JA-01', '400kV Breaker Controller', v_asset_breaker_id, 'hv-switchyard', v_site_jebel_id, '/logic', 'Reclose Delay', '"500ms"', '"750ms"', 'Transient fault mitigation', 'manual', 'engineering_station', 'pending', 'high', 'low', 'low', v_engineer_user_id, NOW() - INTERVAL '5 days'),
  (v_tenant_id, 'asset_config', 'rtu', 'RTU-JA-X1', 'ABB RTU Data Hub', v_asset_rtu_id, 'scada-network', v_site_jebel_id, '/polling/cycle', 'Modbus Interval', '"200ms"', '"100ms"', 'Increasing telemetry frequency', 'manual', 'hmi', 'validated', 'medium', 'low', 'low', v_operator_user_id, NOW() - INTERVAL '1 day'),
  (v_tenant_id, 'system_config', 'gateway', 'GW-JA-02', 'Communication SIS Gateway', NULL, 'scada-network', v_site_jebel_id, '/protocol/dnp3', 'Auth Mode', '"none"', '"secure"', 'Security hardening - enabling SAVA', 'manual', 'engineering_station', 'validated', 'low', 'medium', 'high', v_admin_user_id, NOW() - INTERVAL '6 hours'),
  (v_tenant_id, 'asset_config', 'bay_controller', 'BC-AWR-04', 'DCS Bay Control Unit 4', NULL, 'substation-automation', v_site_aweer_id, '/interlock/logic', 'Busbar Check', '"disabled"', '"enabled"', 'Correcting safety logic bypass', 'manual', 'engineering_station', 'failed', 'high', 'medium', 'low', v_engineer_user_id, NOW() - INTERVAL '15 hours'),
  (v_tenant_id, 'security_policy', 'ids', 'IDS-AWR-01', 'Intrusion Detection Hub', NULL, 'management-zone', v_site_aweer_id, '/sensitivity', 'Level', '"medium"', '"high"', 'Heightened alert state per threat intel', 'manual', 'console', 'validated', 'none', 'low', 'medium', v_supervisor_user_id, NOW() - INTERVAL '2 hours'),
  (v_tenant_id, 'system_config', 'ntp', 'NTP-MASTER-01', 'Network Time Master', NULL, 'management-zone', v_site_main_id, '/sync/source', 'GPS', '"Primary"', '"Secondary"', 'Main GPS antenna maintenance', 'automated', 'config_manager', 'validated', 'medium', 'high', 'low', v_admin_user_id, NOW() - INTERVAL '1 day'),
  (v_tenant_id, 'asset_config', 'meter', 'MTR-JA-77', 'Rev Revenue PLC Meter', NULL, 'metering-zone', v_site_jebel_id, '/scaling', 'CT Ratio', '"1000:5"', '"1200:5"', 'Transformer CT upgrade adjustment', 'manual', 'hmi', 'validated', 'low', 'high', 'low', v_engineer_user_id, NOW() - INTERVAL '8 days'),
  (v_tenant_id, 'security_policy', 'siem', 'SIEM-PROD-01', 'Production SCADA SIEM', NULL, 'management-zone', v_site_main_id, '/storage/retention', 'Live window', '"30 days"', '"90 days"', 'Log retention policy update', 'manual', 'console', 'validated', 'none', 'low', 'medium', v_admin_user_id, NOW() - INTERVAL '3 hours'),
  (v_tenant_id, 'asset_config', 'ups', 'UPS-DMS-B1', 'Station Battery Safety Hub', NULL, 'aux-systems', v_site_main_id, '/test/schedule', 'Freq', '"monthly"', '"weekly"', 'Improving battery health monitoring', 'manual', 'hmi', 'validated', 'high', 'low', 'low', v_operator_user_id, NOW() - INTERVAL '6 days'),
  (v_tenant_id, 'system_config', 'logger', 'LOG-JA-01', 'RTU Sequence of Events Logger', NULL, 'substation-automation', v_site_jebel_id, '/filtering/debounce', 'Timer', '"5ms"', '"10ms"', 'Reducing ghost trips in SOE', 'manual', 'engineering_station', 'validated', 'medium', 'low', 'low', v_engineer_user_id, NOW() - INTERVAL '2 days'),
  (v_tenant_id, 'security_policy', 'av', 'AV-SERVER-JA', 'Antivirus Master SIS', NULL, 'management-zone', v_site_jebel_id, '/scans/deep', 'Status', '"disabled"', '"enabled"', 'Weekly deep scan enablement', 'automated', 'policy_server', 'validated', 'none', 'low', 'medium', v_admin_user_id, NOW() - INTERVAL '1 day'),
  -- Extra records to reach 20
  (v_tenant_id, 'asset_config', 'plc', 'PLC-JA-VALVE', 'Fuel Valve PLC Controller', NULL, 'process-zone', v_site_jebel_id, '/limit/switch', 'Upper Bound', '"95%"', '"90%"', 'Safety margin increase', 'manual', 'hmi', 'validated', 'high', 'low', 'low', v_engineer_user_id, NOW() - INTERVAL '7 days'),
  (v_tenant_id, 'system_config', 'dcs', 'DCS-AWR-CORE', 'Main Hub DCS Cluster', NULL, 'control-center', v_site_aweer_id, '/cluster/priority', 'Primary', '"Node1"', '"Node2"', 'Node1 patch preparation', 'manual', 'engineering_station', 'validated', 'low', 'high', 'low', v_admin_user_id, NOW() - INTERVAL '4 hours'),
  (v_tenant_id, 'security_policy', 'nac', 'NAC-DMS-S1', 'Site Network Access Control', NULL, 'management-zone', v_site_main_id, '/allowlist', 'New Engineering Laptop', '"none"', '"approved"', 'Onboarding new field equipment', 'manual', 'console', 'validated', 'low', 'low', 'high', v_supervisor_user_id, NOW() - INTERVAL '1 hour'),
  (v_tenant_id, 'asset_config', 'rtu', 'RTU-AWR-02', 'Regional RTU Hub 2', NULL, 'scada-network', v_site_aweer_id, '/clock/sync', 'Source', '"Internal"', '"NTP"', 'Enabling network time sync', 'automated', 'config_manager', 'failed', 'medium', 'low', 'low', v_engineer_user_id, NOW() - INTERVAL '1 day'),
  (v_tenant_id, 'security_policy', 'backup', 'BKP-MASTER-JA', 'Backup Master Policy', NULL, 'management-zone', v_site_jebel_id, '/enc/key', 'Rotation', '"365d"', '"90d"', 'Hardening key rotation policy', 'manual', 'console', 'validated', 'none', 'low', 'high', v_admin_user_id, NOW() - INTERVAL '2 hours');

  -- 2. LOG RETENTION & EXPORT SETTINGS (Diverse set)
  INSERT INTO audit_retention_policies (
    tenant_id, name, description, retention_period_days, archive_after_days, compliance_standards, active, priority, created_by
  ) VALUES
  (v_tenant_id, 'Critical SCADA Controls', 'Retention for all logic and parameter changes on high-criticality assets', 3650, 365, ARRAY['NERC-CIP', 'ISO-27001'], true, 10, v_supervisor_user_id),
  (v_tenant_id, 'Security Access Logs', 'Authentication and authorization attempts across all management consoles', 1825, 180, ARRAY['NIST-800-53', 'UAE-IA'], true, 20, v_admin_user_id),
  (v_tenant_id, 'IoT Sensor Telemetry', 'Lower priority heartbeats and status updates from remote sensors', 90, 30, ARRAY['Operational'], true, 100, v_admin_user_id),
  (v_tenant_id, 'Regional Hub Forensic Archive', 'Extended storage for all audit events at hub sites', 3650, 730, ARRAY['UAE-SEC'], true, 15, v_supervisor_user_id),
  (v_tenant_id, 'Transient Data Sync Logs', 'Short term logs for protocol synchronization and debugging', 30, 7, ARRAY['GDPR'], true, 200, v_engineer_user_id);

  INSERT INTO audit_export_requests (
    tenant_id, export_name, request_reason, filters, date_from, date_to, 
    export_format, requested_by, status, completed_at
  ) VALUES
  (v_tenant_id, 'Annual External Audit 2024', 'Required for NERC-CIP V6 compliance submission', '{"compliance": "nerc-cip"}'::jsonb, NOW() - INTERVAL '365 days', NOW(), 'pdf', v_auditor_user_id, 'completed', NOW() - INTERVAL '2 days'),
  (v_tenant_id, 'Incident IR-2024-09 Logs', 'Forensic investigation for unauthorized substation access', '{"incident_id": "IR-2024-09"}'::jsonb, NOW() - INTERVAL '7 days', NOW(), 'json', v_admin_user_id, 'completed', NOW() - INTERVAL '4 hours'),
  (v_tenant_id, 'Monthly Config Change Summary', 'Engineering review of all site modifications', '{"event_type": "config_change"}'::jsonb, NOW() - INTERVAL '30 days', NOW(), 'csv', v_engineer_user_id, 'pending', NULL),
  (v_tenant_id, 'Aweer Site Security Audit', 'Spot check of access control logs at Aweer', '{"site": "Al Aweer"}'::jsonb, NOW() - INTERVAL '14 days', NOW(), 'pdf', v_auditor_user_id, 'failed', NULL),
  (v_tenant_id, 'Global User activity - Q1', 'HR/Security periodic review', '{"category": "user_activity"}'::jsonb, '2024-01-01', '2024-03-31', 'csv', v_supervisor_user_id, 'completed', '2024-04-02'),
  (v_tenant_id, 'Siemens Relay Calibration History', 'Maintenance verification', '{"asset_type": "relay"}'::jsonb, NOW() - INTERVAL '2 years', NOW(), 'json', v_operator_user_id, 'pending', NULL),
  (v_tenant_id, 'Firewall Egress Violations', 'Security posture assessment', '{"rule": "deny"}'::jsonb, NOW() - INTERVAL '24 hours', NOW(), 'csv', v_admin_user_id, 'completed', NOW() - INTERVAL '5 minutes'),
  (v_tenant_id, 'Backup Verification Report', 'Compliance check for recovery capabilities', '{"type": "backup"}'::jsonb, NOW() - INTERVAL '90 days', NOW(), 'pdf', v_auditor_user_id, 'failed', NULL);

  -- 3. FILE & CONFIG INTEGRITY MONITORING (10 monitors)
  v_monitor_id_linux_bin := gen_random_uuid();
  v_monitor_id_scada_cfg := gen_random_uuid();
  v_monitor_id_firmware := gen_random_uuid();
  v_monitor_id_os_kernel := gen_random_uuid();
  v_monitor_id_net_config := gen_random_uuid();

  INSERT INTO file_integrity_monitors (
    id, tenant_id, monitor_name, description, system_type, system_name, site_id,
    file_path, file_type, baseline_hash, baseline_size_bytes, baseline_timestamp, baseline_version,
    current_hash, current_size_bytes, last_checked, integrity_status, 
    check_frequency_minutes, alert_on_change, auto_restore, criticality, safety_related, monitoring_enabled, created_by
  ) VALUES
  (v_monitor_id_linux_bin, v_tenant_id, 'SCADA Master systemctl', 'Core service management binary', 'scada_node', 'SCADA-DMS-01', v_site_main_id, '/usr/bin/systemctl', 'binary', 'a7f2...', 245760, NOW() - INTERVAL '30 days', '3.2.1', 'a7f2...', 245760, NOW() - INTERVAL '15 minutes', 'intact', 60, true, false, 'high', false, true, v_admin_user_id),
  (v_monitor_id_scada_cfg, v_tenant_id, 'HMI Display Templates', 'Critical alarm display XML files', 'hmi', 'HMI-JA-MASTER', v_site_jebel_id, '/hmi/config/alarms.xml', 'configuration', 'b8e3...', 10240, NOW() - INTERVAL '10 days', 'v2.0', 'c5a1...', 11200, NOW() - INTERVAL '5 minutes', 'modified', 15, true, false, 'critical', true, true, v_engineer_user_id),
  (v_monitor_id_firmware, v_tenant_id, 'SEL Relay Firmware Image', 'Immutable protection firmware', 'protection_relay', 'SEL-411L-DMS', v_site_main_id, '/firmware/active.bin', 'firmware', 'd9f0...', 8388608, NOW() - INTERVAL '90 days', '5.1.2', 'd9f0...', 8388608, NOW() - INTERVAL '1 hour', 'intact', 1440, true, true, 'safety-critical', true, true, v_supervisor_user_id),
  (v_monitor_id_os_kernel, v_tenant_id, 'RTU Kernel Module - DNP3', 'Protocol stack low-level driver', 'rtu', 'RTU-AWR-CORE', v_site_aweer_id, '/lib/modules/dnp3.ko', 'binary', 'e8b2...', 512000, NOW() - INTERVAL '15 days', '1.0.4', 'e8b2...', 512000, NOW() - INTERVAL '30 minutes', 'intact', 30, true, false, 'high', false, true, v_admin_user_id),
  (v_monitor_id_net_config, v_tenant_id, 'Edge Switch Running Config', 'VLAN and trunking configuration', 'switch', 'SW-CORE-JA', v_site_jebel_id, '/mnt/config/running', 'configuration', 'f7c1...', 4096, NOW() - INTERVAL '2 days', 'rev_a', 'f7c1...', 4096, NOW() - INTERVAL '10 minutes', 'intact', 15, true, false, 'medium', false, true, v_engineer_user_id),
  (gen_random_uuid(), v_tenant_id, 'IDS Signatures DB', 'Threat detection patterns', 'ids', 'IDS-AWR-01', v_site_aweer_id, '/var/lib/signatures.db', 'database', '1122...', 20480000, NOW() - INTERVAL '1 day', '2024.01.10', '3344...', 20600000, NOW() - INTERVAL '12 hours', 'modified', 720, false, false, 'low', false, true, v_admin_user_id),
  (gen_random_uuid(), v_tenant_id, 'Admin Keys Keyring', 'Trusted public keys for SSH', 'server', 'DH-DMS-LOGS', v_site_main_id, '/etc/ssh/trusted', 'configuration', '5566...', 1024, NOW() - INTERVAL '3 months', 'init', '5566...', 1024, NOW() - INTERVAL '1 hour', 'intact', 60, true, true, 'high', false, true, v_admin_user_id),
  (gen_random_uuid(), v_tenant_id, 'UPS Logic Script', 'Auto-shutdown priority manager', 'aux_system', 'UPS-JA-01', v_site_jebel_id, '/scripts/shutdown.py', 'script', '7788...', 4096, NOW() - INTERVAL '20 days', 'v1.1', '7788...', 4096, NOW() - INTERVAL '4 hours', 'intact', 120, true, false, 'medium', true, true, v_operator_user_id),
  (gen_random_uuid(), v_tenant_id, 'Network Map Topology', 'LLDP cached topology file', 'server', 'MAP-DMS-01', v_site_main_id, '/var/net/map.json', 'configuration', '9900...', 150000, NOW() - INTERVAL '5 days', 'live', 'aabb...', 151000, NOW() - INTERVAL '1 minute', 'modified', 10, false, false, 'low', false, true, v_engineer_user_id),
  (gen_random_uuid(), v_tenant_id, 'Certificate Trust Store', 'Root CA certificates for internal TLS', 'ca_server', 'CA-ROOT-01', v_site_main_id, '/etc/ssl/trust.jks', 'binary', 'ccdd...', 50000, NOW() - INTERVAL '1 year', '2023_trust', 'ccdd...', 50000, NOW() - INTERVAL '24 hours', 'intact', 1440, true, false, 'high', false, true, v_admin_user_id);

  INSERT INTO file_integrity_violations (
    tenant_id, monitor_id,
    violation_type, detected_timestamp,
    expected_hash, actual_hash, expected_size_bytes, actual_size_bytes,
    change_description, change_magnitude,
    last_known_good_timestamp, potential_change_window_start, potential_change_window_end,
    investigation_status, investigated_by, investigation_notes, resolution_timestamp,
    alert_generated, incident_created,
    risk_score, safety_impact, operational_impact, security_impact
  ) VALUES
  (v_tenant_id, v_monitor_id_scada_cfg, 'unauthorized_modification', NOW() - INTERVAL '5 minutes', 'b8e3...', 'c5a1...', 10240, 11200, 'Alarm XML content mismatch', 'major', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '4 minutes', 'investigating', v_supervisor_user_id, 'Investigating display additions', NULL, true, true, 92, 'high', 'medium', 'medium'),
  (v_tenant_id, v_monitor_id_linux_bin, 'permission_change', NOW() - INTERVAL '2 days', 'a7f2...', 'a7f2...', 245760, 245760, 'World writeable bit set', 'minor', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'resolved', v_admin_user_id, 'Auto-fixed by policy', NOW() - INTERVAL '1 day', true, false, 45, 'low', 'low', 'medium'),
  (v_tenant_id, v_monitor_id_firmware, 'hash_mismatch', NOW() - INTERVAL '6 hours', 'prev_hash', 'd9f0...', 8388608, 8388608, 'Firmware update mismatch', 'major', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', 'authorized', v_supervisor_user_id, 'Authorized patch', NOW() - INTERVAL '5 hours', true, false, 0, 'medium', 'medium', 'high');

  -- 4. FORENSIC SNAPSHOTS (8 snapshots)
  v_snapshot_id_exploit := gen_random_uuid();
  v_snapshot_id_recon := gen_random_uuid();
  v_snapshot_id_maintenance := gen_random_uuid();
  v_snapshot_id_phys_breach := gen_random_uuid();

  INSERT INTO forensic_snapshots (
    id, tenant_id, snapshot_name, snapshot_type, trigger_reason, system_type, system_name, site_id, 
    scope, capture_start, capture_end, capture_duration_seconds, status, completion_percentage,
    total_size_bytes, compressed_size_bytes, compression_ratio, encryption_enabled, storage_location, storage_path, 
    integrity_verified, last_integrity_check, custody_chain
  ) VALUES
  (v_snapshot_id_exploit, v_tenant_id, 'Exploit-AWR-HMI', 'incident_response', 'Remote shell exploit on port 8080', 'hmi', 'HMI-AWR-02', v_site_aweer_id, 'full', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '12 minutes', 720, 'completed', 100, 2147483648, 536870912, 0.25, true, 'secure_archive', '/forensics/exp-001.zip', true, NOW() - INTERVAL '1 hour', jsonb_build_array(jsonb_build_object('ts', NOW(), 'action', 'baseline'))),
  (v_snapshot_id_recon, v_tenant_id, 'Network-Scan-DMS-Master', 'incident_response', 'Horizontal scanning detected from unidentified node', 'scada_node', 'SCADA-DMS-X', v_site_main_id, 'memory_only', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 50 minutes', 600, 'completed', 100, 524288000, 104857600, 0.2, true, 'secure_archive', '/forensics/recon-04.zip', true, NOW() - INTERVAL '30 minutes', jsonb_build_array(jsonb_build_object('ts', NOW(), 'action', 'acquired'))),
  (v_snapshot_id_maintenance, v_tenant_id, 'Post-Patch-JA-RTU', 'scheduled', 'Baseline capture after Q1 security firmware upgrade', 'rtu', 'RTU-JA-01', v_site_jebel_id, 'full', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 3600, 'completed', 100, 256000000, 128000000, 0.5, true, 'cold_storage', '/backups/firmware/ja-v2-baseline.zip', true, NOW() - INTERVAL '12 hours', NULL),
  (v_snapshot_id_phys_breach, v_tenant_id, 'Phys-Entry-JA-ServerRoom', 'triggered', 'Door sensor alert + console logon', 'gateway', 'GW-JA-02', v_site_jebel_id, 'full', NOW() - INTERVAL '6 hours', NULL, NULL, 'capturing', 65, NULL, NULL, NULL, true, 'temporary', '/tmp/phys-breach.zip', false, NULL, NULL),
  (gen_random_uuid(), v_tenant_id, 'API-Audit-Global', 'triggered', 'Excessive credential pivoting on integration hub', 'server', 'API-HUB-01', v_site_main_id, 'logs_only', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours', 3600, 'completed', 100, 1073741824, 214748364, 0.2, true, 'secure_archive', '/forensics/api-audit.zip', true, NOW() - INTERVAL '1 hour', NULL),
  (gen_random_uuid(), v_tenant_id, 'Random-Validation-AWR', 'scheduled', 'Monthly random forensic readiness check', 'protection_relay', 'SEL-AWR-99', v_site_aweer_id, 'full', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '2 hours', 7200, 'completed', 100, 157286400, 62914560, 0.4, true, 'secure_archive', '/forensics/random-99.zip', true, NOW() - INTERVAL '10 days', NULL),
  (gen_random_uuid(), v_tenant_id, 'Failed-Logon-Storm', 'incident_response', 'Brute force attempt on SSH interface', 'scada_node', 'LOG-DMS-04', v_site_main_id, 'memory_only', NOW() - INTERVAL '15 minutes', NULL, NULL, 'pending', 0, NULL, NULL, NULL, true, 'queued', NULL, false, NULL, NULL),
  (gen_random_uuid(), v_tenant_id, 'VPN-Tunnel-Exit', 'triggered', 'Anomalous egress volume from VPN concentrator', 'gateway', 'VPN-GW-MAIN', v_site_main_id, 'network_dump', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes', 1200, 'failed', 45, 0, 0, 0, false, 'failed_jobs', NULL, false, NULL, NULL);

  INSERT INTO forensic_evidence_items (
    tenant_id, snapshot_id, evidence_number, evidence_type, description, significance, timestamp_of_evidence, collected_by
  ) VALUES
  (v_tenant_id, v_snapshot_id_exploit, 'EV-001', 'network_packet', 'Malware delivery via HTTP port 8080', 'critical', NOW() - INTERVAL '2 days', v_admin_user_id),
  (v_tenant_id, v_snapshot_id_exploit, 'EV-002', 'disk_forensics', 'Shell executable dropped in /tmp', 'high', NOW() - INTERVAL '2 days', v_admin_user_id),
  (v_tenant_id, v_snapshot_id_recon, 'EV-R-01', 'process_list', 'Nmap process found running as root', 'critical', NOW() - INTERVAL '4 hours', v_supervisor_user_id),
  (v_tenant_id, v_snapshot_id_phys_breach, 'EV-P-01', 'system_log', 'Console login by j.smith - user is on vacation', 'high', NOW() - INTERVAL '6 hours', v_admin_user_id),
  (v_tenant_id, v_snapshot_id_phys_breach, 'EV-P-02', 'video_clip', 'CCTV Frame at 14:02:11 showing shadow near rack 4', 'medium', NOW() - INTERVAL '6 hours', v_supervisor_user_id);

  -- 5. BACKUP & RECOVERY CONFIGURATION (6 policies, 10 jobs)
  v_policy_db_id := gen_random_uuid();
  v_policy_conf_id := gen_random_uuid();
  v_policy_arc_id := gen_random_uuid();

  INSERT INTO backup_policies (
    id, tenant_id, policy_name, policy_description, status, backup_scope, backup_type, 
    schedule_frequency, schedule_time, retention_period_days, storage_location, storage_path, 
    encryption_enabled, compression_enabled, created_at, updated_at
  ) VALUES
  (v_policy_db_id, v_tenant_id, 'Core SCADA DB Sync', 'Real-time database mirroring for primary transmission hub', 'active', 'full', 'database', 'daily', '02:00:00', 365, 'local', '/mnt/backups/scada', true, true, NOW(), NOW()),
  (v_policy_conf_id, v_tenant_id, 'Relay Config Archive', 'Weekly binary snapshot of all protection settings', 'active', 'incremental', 'configuration', 'weekly', '03:00:00', 3650, 'cloud', 's3://dewa-sec/relays', true, false, NOW(), NOW()),
  (v_policy_arc_id, v_tenant_id, 'Regulatory Log Archive', 'Legal archive for audit compliance', 'active', 'full', 'archive', 'monthly', '01:00:00', 2555, 'network', '//nas-01/logs', true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, 'HMI Template Mirror', 'Quick-restore templates for substation HMIs', 'active', 'full', 'configuration', 'weekly', '04:00:00', 90, 'local', '/local/mirror', true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, 'Development Sandbox Backup', 'Weekly wipe/restore points for testing', 'paused', 'full', 'database', 'weekly', NULL, 14, 'local', '/dev/backups', false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, 'Critical Site OS Images', 'Bare metal recovery images for site servers', 'active', 'full', 'image', 'monthly', '00:00:00', 730, 'network', '//nas-secure/images', true, true, NOW(), NOW());

  INSERT INTO backup_jobs (
    id, tenant_id, policy_id, policy_name, job_name, job_type, 
    scheduled_start, actual_start, actual_end, duration_seconds, 
    status, completion_percentage, 
    backup_scope, backup_type, storage_location, storage_path, 
    backup_size_bytes, verification_performed, verification_passed,
    created_at, updated_at
  ) VALUES
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Daily_Sync_20240410', 'scheduled', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours', 3600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 10737418240, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Daily_Sync_20240411', 'scheduled', NOW() - INTERVAL '34 hours', NOW() - INTERVAL '34 hours', NOW() - INTERVAL '33 hours', 3600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 10837418240, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_conf_id, 'Relay Config Archive', 'Weekly_Conf_01', 'scheduled', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '30 minutes', 1800, 'completed', 100, 'incremental', 'configuration', 'cloud', 's3://dewa-sec/relays', 52428800, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Manual_Fix_X', 'manual', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '50 minutes', 600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 5000000, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_arc_id, 'Regulatory Log Archive', 'Month_End_Log_Archive', 'scheduled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 86400, 'completed', 100, 'full', 'archive', 'network', '//nas-01/logs', 536870912000, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Daily_Sync_Fail', 'scheduled', NOW() - INTERVAL '58 hours', NOW() - INTERVAL '58 hours', NULL, NULL, 'failed', 45, 'full', 'database', 'local', '/mnt/backups/scada', 0, true, false, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_conf_id, 'Relay Config Archive', 'In_Progress_Job', 'scheduled', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes', NULL, NULL, 'running', 12, 'incremental', 'configuration', 'cloud', 's3://dewa-sec/relays', 0, false, false, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Daily_Sync_20240409', 'scheduled', NOW() - INTERVAL '82 hours', NOW() - INTERVAL '82 hours', NOW() - INTERVAL '81 hours', 3600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 10637418240, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Daily_Sync_20240408', 'scheduled', NOW() - INTERVAL '106 hours', NOW() - INTERVAL '106 hours', NOW() - INTERVAL '105 hours', 3600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 10537418240, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_policy_db_id, 'Core SCADA DB Sync', 'Night_Fix_Z', 'manual', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 3600, 'completed', 100, 'full', 'database', 'local', '/mnt/backups/scada', 107374, true, true, NOW(), NOW());

  -- 6. WORKLOAD SECURITY AND HARDENING (15 workloads)
  INSERT INTO workload_security (
    tenant_id, workload_name, workload_type, workload_description, deployment_environment, deployment_platform,
    status, health_status, baseline_compliance_score, hardening_level, os_type, os_version, critical_vulnerabilities,
    baseline_compliance_status, hardening_applied, os_hardening_enabled, firewall_enabled, antivirus_enabled,
    deployment_location, security_baseline_id, baseline_version, last_baseline_assessment,
    hardening_profile, hardening_date, hardening_standards, ssh_enabled, ssh_key_only, rdp_enabled,
    privileged_access_restricted, network_segmentation_enabled, patch_level, last_patched_date,
    pending_patches_count, critical_patches_pending, auto_patching_enabled, vulnerability_scan_enabled,
    last_vulnerability_scan, high_vulnerabilities, medium_vulnerabilities, low_vulnerabilities,
    configuration_management_enabled, configuration_drift_detected, last_configuration_check,
    logging_enabled, log_forwarding_enabled, monitoring_agent_installed, monitoring_agent_version,
    compliance_frameworks, last_audit_date, next_audit_date, audit_findings_count,
    security_contact, technical_contact, tags
  ) VALUES
  (v_tenant_id, 'Jebel Ali Site Gateway PLC-1', 'gateway', 'Primary IoT bridge for Jebel Ali Station protocol translation', 'production', 'edge', 'active', 'healthy', 98, 'maximum', 'linux', 'Yoctu 4.0', 0, 'compliant', true, true, true, true, 'Jebel Ali Grid Station', 'IEC-62443-GW-001', '1.0', NOW() - INTERVAL '1 day', 'iec_62443', NOW() - INTERVAL '30 days', ARRAY['IEC-62443'], true, true, false, true, true, 'current', NOW() - INTERVAL '5 days', 0, 0, true, true, NOW() - INTERVAL '1 day', 0, 0, 0, true, false, NOW() - INTERVAL '6 hours', true, true, true, '1.2.3', ARRAY['IEC-62443'], CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '90 days', 0, 'security@dewa.ae', 'admin@dewa.ae', ARRAY['gateway', 'edge']),
  (v_tenant_id, 'SCADA Master DMS-1', 'scada_interface', 'Primary SCADA master for Dubai Main Substation', 'production', 'vm', 'active', 'healthy', 92, 'enhanced', 'linux', 'RHEL 8.6', 0, 'compliant', true, true, true, true, 'Dubai Control Center', 'IEC-62443-SCADA-02', '2.1', NOW() - INTERVAL '2 days', 'cis_benchmark', NOW() - INTERVAL '40 days', ARRAY['IEC-62443', 'NIST-800-82'], true, true, false, true, true, 'current', NOW() - INTERVAL '2 days', 0, 0, true, true, NOW() - INTERVAL '2 days', 0, 2, 5, true, false, NOW() - INTERVAL '12 hours', true, true, true, '3.2.1', ARRAY['NERC-CIP'], CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days', 0, 'security@dewa.ae', 'scada-admin@dewa.ae', ARRAY['critical', 'scada']),
  (v_tenant_id, 'Aweer Data Hub PLC-Hub', 'data_processor', 'Telemetry aggregation for Al Aweer Regional Hub', 'production', 'kubernetes', 'active', 'degraded', 72, 'standard', 'linux', 'Alpine 3.18', 2, 'non_compliant', false, true, true, true, 'Al Aweer Hub', 'BASE-APP-01', '1.0', NOW() - INTERVAL '5 days', 'default', NULL, ARRAY['ISO-27001'], true, false, false, true, true, 'behind', NOW() - INTERVAL '45 days', 5, 2, false, true, NOW() - INTERVAL '5 days', 4, 10, 20, true, true, NOW() - INTERVAL '24 hours', true, true, true, 'k8s-v1.27', ARRAY['ISO-27001'], CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '60 days', 12, 'security@dewa.ae', 'infra@dewa.ae', ARRAY['kubernetes', 'aggregator']),
  (v_tenant_id, 'Legacy SIS Bridge - JA', 'gateway', 'Serial-to-Ethernet bridge for legacy COMTRADE files', 'production', 'embedded', 'active', 'critical', 45, 'medium', 'embedded', 'VxWorks 6.9', 5, 'non_compliant', false, false, false, false, 'Jebel Ali Grid Station', 'LEGACY-01', 'v1', NOW() - INTERVAL '30 days', 'none', NULL, ARRAY['None'], false, false, false, false, false, 'outdated', NOW() - INTERVAL '500 days', 25, 5, false, false, NULL, 12, 45, 100, false, true, NOW() - INTERVAL '1 year', true, false, false, 'v0.9-legacy', ARRAY['Risk-Accepted'], CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '1 day', 45, 'security@dewa.ae', 'manual-op@dewa.ae', ARRAY['legacy', 'risky']),
  (v_tenant_id, 'HMI Web Dev Hub', 'web_server', 'Frontend development environment for new grid interface', 'development', 'vm', 'active', 'healthy', 85, 'standard', 'linux', 'Ubuntu 22.04', 0, 'compliant', true, true, true, false, 'Dev-Cloud-01', 'DEV-STD-01', '3.0', NOW() - INTERVAL '1 hour', 'dev_loose', NOW() - INTERVAL '5 days', ARRAY['Internal'], true, true, true, true, false, 'latest', NOW() - INTERVAL '2 days', 0, 0, true, true, NOW() - INTERVAL '1 hour', 0, 0, 5, true, false, NOW() - INTERVAL '10 minutes', true, true, true, '2.0-dev', ARRAY['Internal'], NULL, NULL, 0, 'dev-lead@dewa.ae', 'dev-op@dewa.ae', ARRAY['dev', 'ui']),
  (v_tenant_id, 'Historian Main DB', 'database', 'Long-term storage for all grid metrics', 'production', 'vm', 'active', 'healthy', 95, 'enhanced', 'linux', 'Ubuntu 20.04', 0, 'compliant', true, true, true, true, 'Dubai Control Center', 'DB-SEC-01', '1.0', NOW(), 'db_standard', NOW(), ARRAY['ISO-27001'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 0, 0, true, false, NOW(), true, true, true, 'v12', ARRAY['ISO-27001'], NOW(), NOW(), 0, 'sec@dewa.ae', 'db@dewa.ae', ARRAY['storage']),
  (v_tenant_id, 'Protocol SIS Analyzer AWR', 'api_service', 'Real-time protocol safety analyzer', 'production', 'vm', 'active', 'healthy', 90, 'enhanced', 'linux', 'Debian 12', 0, 'compliant', true, true, true, true, 'Al Aweer Hub', 'API-SEC-01', '1.1', NOW(), 'api_standard', NOW(), ARRAY['IEC-62443'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 1, 2, true, false, NOW(), true, true, true, 'v2', ARRAY['IEC-62443'], NOW(), NOW(), 0, 'sec@dewa.ae', 'api@dewa.ae', ARRAY['security']),
  (v_tenant_id, 'Substation Laptop PLC-Ops', 'scada_interface', 'Field engineering maintenance laptop', 'test', 'bare_metal', 'active', 'healthy', 88, 'standard', 'windows', 'Win 11', 0, 'compliant', true, true, true, true, 'Field Operations', 'WIN-STD-01', '1.0', NOW(), 'laptop_std', NOW(), ARRAY['Corporate'], true, false, true, true, false, 'latest', NOW(), 0, 0, true, true, NOW(), 0, 0, 10, true, true, NOW(), true, true, true, '1.0', ARRAY['Corporate'], NOW(), NOW(), 0, 'sec@dewa.ae', 'field@dewa.ae', ARRAY['field']),
  (v_tenant_id, 'Backup Master JA SIS', 'data_processor', 'Master backup controller for Jebel Ali', 'production', 'vm', 'active', 'healthy', 94, 'enhanced', 'linux', 'RHEL 9', 0, 'compliant', true, true, true, true, 'Jebel Ali Station', 'SRV-SEC-01', '1.0', NOW(), 'srv_standard', NOW(), ARRAY['ISO-27001'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 0, 0, true, false, NOW(), true, true, true, 'v3', ARRAY['Backup-Standard'], NOW(), NOW(), 0, 'sec@dewa.ae', 'bkp@dewa.ae', ARRAY['infrastructure']),
  (v_tenant_id, 'IDS Sensor Zone 4 PLC', 'gateway', 'Intrusion detection sensor for switchyard', 'production', 'edge', 'active', 'healthy', 99, 'maximum', 'linux', 'Yoctu 3.1', 0, 'compliant', true, true, true, true, 'Dubai Substation', 'IDS-STD-01', '2.0', NOW(), 'edge_std', NOW(), ARRAY['IEC-62443'], false, false, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 0, 0, true, false, NOW(), true, true, true, 'v1.1', ARRAY['IEC-62443'], NOW(), NOW(), 0, 'sec@dewa.ae', 'ids@dewa.ae', ARRAY['security', 'sensor']),
  (v_tenant_id, 'Engineering WS 09 DCS', 'scada_interface', 'Engineering workstation for protection logic', 'production', 'vm', 'active', 'healthy', 87, 'standard', 'windows', 'Win 10', 0, 'compliant', true, true, true, true, 'Al Aweer Hub', 'WS-STD-01', '1.0', NOW(), 'ws_standard', NOW(), ARRAY['Industrial'], true, false, true, true, false, 'latest', NOW(), 2, 0, true, true, NOW(), 0, 3, 12, true, true, NOW(), true, true, true, '1.2', ARRAY['Industrial'], NOW(), NOW(), 1, 'sec@dewa.ae', 'ws@dewa.ae', ARRAY['engineering']),
  (v_tenant_id, 'Auth Proxy DMS SIS', 'api_service', 'Authentication proxy for critical systems', 'production', 'vm', 'active', 'healthy', 93, 'enhanced', 'linux', 'Debian 11', 0, 'compliant', true, true, true, true, 'Dubai Control Center', 'PROXY-01', '1.0', NOW(), 'proxy_std', NOW(), ARRAY['ISO-27001'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 0, 0, true, false, NOW(), true, true, true, 'v1.1', ARRAY['ISO-27001'], NOW(), NOW(), 0, 'sec@dewa.ae', 'auth@dewa.ae', ARRAY['security', 'proxy']),
  (v_tenant_id, 'Metering Gateway JA PLC', 'gateway', 'Secure gateway for revenue meters', 'production', 'edge', 'active', 'healthy', 91, 'standard', 'linux', 'Alpine 3.19', 0, 'compliant', true, true, true, true, 'Jebel Ali Station', 'GTW-STD-01', '1.0', NOW(), 'edge_std', NOW(), ARRAY['Industrial'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 4, 15, true, false, NOW(), true, true, true, 'v0.9', ARRAY['Industrial'], NOW(), NOW(), 0, 'sec@dewa.ae', 'mtr@dewa.ae', ARRAY['metering', 'gateway']),
  (v_tenant_id, 'HMI Slave JA-2 Master', 'web_server', 'Secondary HMI display node', 'production', 'vm', 'active', 'healthy', 89, 'standard', 'linux', 'Ubuntu 22.04', 0, 'compliant', true, true, true, true, 'Jebel Ali Station', 'HMI-STD-01', '2.0', NOW(), 'hmi_standard', NOW(), ARRAY['NIST-800-82'], true, true, false, true, true, 'latest', NOW(), 1, 0, true, true, NOW(), 0, 1, 3, true, false, NOW(), true, true, true, 'v2.1', ARRAY['NIST-800-82'], NOW(), NOW(), 0, 'sec@dewa.ae', 'hmi@dewa.ae', ARRAY['scada', 'ui']),
  (v_tenant_id, 'Patch Staging Server Safety', 'server', 'Local staging for Windows/Linux updates', 'staging', 'vm', 'active', 'healthy', 90, 'standard', 'linux', 'RHEL 8', 0, 'compliant', true, true, true, true, 'Dubai Control Center', 'SRV-STD-01', '1.0', NOW(), 'srv_standard', NOW(), ARRAY['Corporate'], true, true, false, true, true, 'current', NOW(), 0, 0, true, true, NOW(), 0, 0, 2, true, false, NOW(), true, true, true, 'v1.0', ARRAY['Corporate'], NOW(), NOW(), 0, 'sec@dewa.ae', 'adm@dewa.ae', ARRAY['infrastructure', 'staging']);

END $$;

COMMIT;
