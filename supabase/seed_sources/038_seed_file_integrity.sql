-- =============================================================================
-- SEED DATA: File Integrity Monitoring
-- Description: Seed data for file_integrity_monitors, file_integrity_violations, file_integrity_baselines
-- Requirements: 6.5
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_engineer_user_id UUID;
  v_protection_user_id UUID;
  v_supervisor_user_id UUID;
  v_site_main_id UUID;
  v_site_jebel_id UUID;
  v_site_aweer_id UUID;
  v_asset_relay_id UUID;
  v_monitor_id_1 UUID;
  v_monitor_id_2 UUID;
  v_monitor_id_3 UUID;
  v_monitor_id_4 UUID;
  v_monitor_id_5 UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;
  
  -- Get security users
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_protection_user_id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Get sites
  SELECT id INTO v_site_main_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_jebel_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_site_aweer_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;
  
  -- Try to get an asset for reference
  SELECT id INTO v_asset_relay_id FROM assets WHERE name LIKE '%SEL-411L%' AND tenant_id = v_tenant_id LIMIT 1;

  -- =============================================================================
  -- FILE INTEGRITY MONITORS
  -- =============================================================================
  
  v_monitor_id_1 := gen_random_uuid();
  v_monitor_id_2 := gen_random_uuid();
  v_monitor_id_3 := gen_random_uuid();
  v_monitor_id_4 := gen_random_uuid();
  v_monitor_id_5 := gen_random_uuid();
  
  INSERT INTO file_integrity_monitors (
    id, tenant_id,
    monitor_name, description,
    asset_id, system_type, system_name, zone_id, site_id,
    file_path, file_type,
    baseline_hash, baseline_size_bytes, baseline_timestamp, baseline_version,
    current_hash, current_size_bytes, last_checked, integrity_status,
    check_frequency_minutes, alert_on_change, auto_restore,
    criticality, safety_related, monitoring_enabled,
    created_by
  ) VALUES
  -- Protection Relay Configuration (Safety Critical)
  (
    v_monitor_id_1, v_tenant_id,
    'SEL-411L Main Line Protection Config', 'Main line differential relay protection settings - IEC 61850 configuration',
    v_asset_relay_id, 'protection_relay', 'SEL-411L-DMS-01', 'protection-systems', v_site_main_id,
    '/protection/sel411l/DMS01.icd', 'configuration',
    'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab', 245760, NOW() - INTERVAL '30 days', '3.2.1',
    'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab', 245760, NOW() - INTERVAL '15 minutes', 'intact',
    15, true, false,
    'safety-critical', true, true,
    v_protection_user_id
  ),
  -- RTU Firmware (High Criticality)
  (
    v_monitor_id_2, v_tenant_id,
    'ABB RTU560 Jebel Ali Firmware', 'RTU firmware binary for SCADA communications',
    NULL, 'rtu', 'ABB-RTU560-JA-01', 'scada-network', v_site_jebel_id,
    '/firmware/rtu560/JA01_v5.2.1.bin', 'firmware',
    'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd', 8388608, NOW() - INTERVAL '6 hours', '5.2.1',
    'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd', 8388608, NOW() - INTERVAL '30 minutes', 'intact',
    60, true, false,
    'high', false, true,
    v_admin_user_id
  ),
  -- SCADA HMI Application (Modified - Violation)
  (
    v_monitor_id_3, v_tenant_id,
    'SCADA HMI Display Configuration', 'HMI display template and alarm configuration files',
    NULL, 'hmi', 'HMI-AWR-01', 'scada-network', v_site_aweer_id,
    '/hmi/config/displays.xml', 'configuration',
    'c9f4d6e0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5', 524288, NOW() - INTERVAL '15 days', '2.1.0',
    'd0a5e7f1b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6', 532480, NOW() - INTERVAL '1 hour', 'modified',
    30, true, false,
    'medium', false, true,
    v_engineer_user_id
  ),
  -- IEC 61850 Certificate (High Criticality)
  (
    v_monitor_id_4, v_tenant_id,
    'IEC 61850 GOOSE Publisher Certificate', 'X.509 certificate for GOOSE message authentication',
    NULL, 'protection_relay', 'SEL-451-DMS-01', 'protection-systems', v_site_main_id,
    '/certs/goose/SEL451_DMS01.pem', 'certificate',
    'e1b6c8d0a2f4e6a8c0b2d4f6a8c0e2d4f6a8b0c2e4d6f8a0b2c4d6e8f0a2b4c6', 4096, NOW() - INTERVAL '60 days', '1.0',
    'e1b6c8d0a2f4e6a8c0b2d4f6a8c0e2d4f6a8b0c2e4d6f8a0b2c4d6e8f0a2b4c6', 4096, NOW() - INTERVAL '45 minutes', 'intact',
    60, true, false,
    'high', true, true,
    v_protection_user_id
  ),
  -- DNP3 Authentication Key (Safety Critical)
  (
    v_monitor_id_5, v_tenant_id,
    'DNP3 Secure Authentication Key', 'DNP3 SA symmetric key for RTU authentication',
    NULL, 'rtu', 'ABB-RTU560-DMS-01', 'scada-network', v_site_main_id,
    '/keys/dnp3/RTU560_DMS01.key', 'key',
    'f2c7d9e1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7', 256, NOW() - INTERVAL '90 days', '1.2',
    'f2c7d9e1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7', 256, NOW() - INTERVAL '20 minutes', 'intact',
    30, true, false,
    'safety-critical', true, true,
    v_admin_user_id
  );

  -- =============================================================================
  -- FILE INTEGRITY VIOLATIONS
  -- =============================================================================
  
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
  -- Active violation on HMI config
  (
    v_tenant_id, v_monitor_id_3,
    'unauthorized_modification', NOW() - INTERVAL '1 hour',
    'c9f4d6e0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5',
    'd0a5e7f1b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6',
    524288, 532480,
    'HMI display configuration file modified - size increased by 8KB, possible unauthorized display additions',
    'moderate',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
    'investigating', v_supervisor_user_id, 'Investigating whether this was an authorized maintenance change', NULL,
    true, false,
    65, 'low', 'medium', 'medium'
  ),
  -- Resolved violation - authorized change
  (
    v_tenant_id, v_monitor_id_2,
    'hash_mismatch', NOW() - INTERVAL '6 hours',
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd',
    8388608, 8388608,
    'RTU firmware updated from v5.1.8 to v5.2.1 - authorized security patch',
    'major',
    NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '6 hours',
    'authorized', v_admin_user_id, 'Confirmed authorized firmware update per change request CR-2024-156', NOW() - INTERVAL '5 hours',
    true, false,
    30, 'medium', 'medium', 'high'
  ),
  -- Historical resolved violation
  (
    v_tenant_id, v_monitor_id_1,
    'unauthorized_modification', NOW() - INTERVAL '7 days',
    'prev123hash456prev789hash012prev345hash678prev901hash234prev567hash890',
    'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab',
    245760, 245760,
    'Protection relay settings modified - pickup current adjusted from 0.3pu to 0.25pu',
    'minor',
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days',
    'authorized', v_protection_user_id, 'Authorized change per engineering study TR-2024-015. New baseline established.', NOW() - INTERVAL '6 days',
    true, false,
    50, 'high', 'low', 'low'
  );

  -- =============================================================================
  -- FILE INTEGRITY BASELINES
  -- =============================================================================
  
  INSERT INTO file_integrity_baselines (
    tenant_id, monitor_id,
    version_number, version_label,
    file_hash, file_size_bytes, file_content_sample,
    created_by, change_reason, approved_by,
    is_active, is_approved
  ) VALUES
  -- Protection relay baseline versions
  (
    v_tenant_id, v_monitor_id_1,
    1, 'Initial Commissioning',
    'initial123hash456initial789hash012initial345hash678initial901hash234ini',
    245760, '<?xml version="1.0"?><SCL><!-- SEL-411L Initial Configuration -->',
    v_protection_user_id, 'Initial commissioning of protection relay', v_supervisor_user_id,
    false, true
  ),
  (
    v_tenant_id, v_monitor_id_1,
    2, 'Pickup Current Adjustment v1',
    'prev123hash456prev789hash012prev345hash678prev901hash234prev567hash890',
    245760, '<?xml version="1.0"?><SCL><!-- SEL-411L Config v2 - 0.3pu pickup -->',
    v_engineer_user_id, 'Adjusted pickup current to 0.3pu per study TR-2024-010', v_supervisor_user_id,
    false, true
  ),
  (
    v_tenant_id, v_monitor_id_1,
    3, 'Current Active - Enhanced Sensitivity',
    'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab',
    245760, '<?xml version="1.0"?><SCL><!-- SEL-411L Config v3 - 0.25pu pickup -->',
    v_protection_user_id, 'Enhanced sensitivity for transformer protection per TR-2024-015', v_supervisor_user_id,
    true, true
  ),
  -- RTU firmware baselines
  (
    v_tenant_id, v_monitor_id_2,
    1, 'Firmware v5.1.8',
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    8388608, NULL,
    v_admin_user_id, 'Original firmware version from vendor', v_admin_user_id,
    false, true
  ),
  (
    v_tenant_id, v_monitor_id_2,
    2, 'Firmware v5.2.1 - Security Patch',
    'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd',
    8388608, NULL,
    v_admin_user_id, 'Security patch for CVE-2024-12345', v_admin_user_id,
    true, true
  );

  -- =============================================================================
  -- FILE INTEGRITY CHECK HISTORY (Sample recent checks)
  -- =============================================================================
  
  INSERT INTO file_integrity_check_history (
    tenant_id, monitor_id,
    check_timestamp, check_result,
    file_hash, file_size_bytes, file_exists,
    check_duration_ms
  ) VALUES
  -- Recent checks for protection relay
  (v_tenant_id, v_monitor_id_1, NOW() - INTERVAL '15 minutes', 'pass', 'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab', 245760, true, 125),
  (v_tenant_id, v_monitor_id_1, NOW() - INTERVAL '30 minutes', 'pass', 'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab', 245760, true, 132),
  (v_tenant_id, v_monitor_id_1, NOW() - INTERVAL '45 minutes', 'pass', 'a7f2b4c8e9d1f3a5b6c7d8e9f0a1b2c3d4e5f6789012345678901234567890ab', 245760, true, 118),
  -- Recent checks for RTU
  (v_tenant_id, v_monitor_id_2, NOW() - INTERVAL '30 minutes', 'pass', 'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd', 8388608, true, 856),
  (v_tenant_id, v_monitor_id_2, NOW() - INTERVAL '90 minutes', 'pass', 'b8e3c5d9f0a2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8901234567890abcd', 8388608, true, 912),
  -- Failed check for HMI
  (v_tenant_id, v_monitor_id_3, NOW() - INTERVAL '1 hour', 'fail', 'd0a5e7f1b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6', 532480, true, 245),
  (v_tenant_id, v_monitor_id_3, NOW() - INTERVAL '90 minutes', 'pass', 'c9f4d6e0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5', 524288, true, 238);

END $$;

COMMIT;
