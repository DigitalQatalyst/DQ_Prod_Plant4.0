-- =============================================================================
-- SEED DATA: Diversified Security Data (Multi-Domain)
-- Description: Adds a diverse set of security data across posture, controls, risks, 
-- vendors, identity, and secrets for DEWA - Transmission.
-- =============================================================================

BEGIN;

DO $$ 
DECLARE
  v_tenant_id UUID;
  v_site_quoz_id UUID;
  v_site_silicon_id UUID;
  v_site_marina_id UUID;
  v_iec_std_id UUID;
  v_nerc_std_id UUID;
  v_nist_std_id UUID;
  v_user_fatima UUID;
  v_user_ahmed UUID;
  v_user_sarah UUID;
  v_user_mohammed UUID;
  v_vendor_cyberguard_id UUID;
  v_vendor_legacy_id UUID;
  v_control_badge_id UUID;
  v_control_canary_id UUID;
  v_cert_vpn_id UUID;
BEGIN
  -- 1. IDENTIFY EXISTING FUNDAMENTALS
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  SELECT id INTO v_iec_std_id FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_nerc_std_id FROM compliance_standards WHERE name = 'NERC CIP' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_nist_std_id FROM compliance_standards WHERE name = 'NIST CSF' AND tenant_id = v_tenant_id LIMIT 1;

  SELECT id INTO v_user_fatima FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_user_ahmed FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_user_sarah FROM security_users WHERE username = 'sarah.alnuaimi' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_user_mohammed FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;

  -- 2. DIVERSE SITES & ZONES (Posture)
  INSERT INTO sites (id, tenant_id, name, region, geo_lat, geo_lng, site_type) VALUES
  (gen_random_uuid(), v_tenant_id, 'Al Quoz Regional Hub', 'Al Quoz', 25.1311, 55.2311, 'control-center'),
  (gen_random_uuid(), v_tenant_id, 'Silicon Oasis Switching Station', 'DSO', 25.1222, 55.3777, 'switching-station'),
  (gen_random_uuid(), v_tenant_id, 'Dubai Marina Grid Station', 'Marina', 25.0777, 55.1333, 'substation')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  SELECT id INTO v_site_quoz_id FROM sites WHERE name = 'Al Quoz Regional Hub' AND tenant_id = v_tenant_id;
  SELECT id INTO v_site_silicon_id FROM sites WHERE name = 'Silicon Oasis Switching Station' AND tenant_id = v_tenant_id;
  SELECT id INTO v_site_marina_id FROM sites WHERE name = 'Dubai Marina Grid Station' AND tenant_id = v_tenant_id;

  -- Add Diverse Zones
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_site_quoz_id, 'Quoz Core Switch Zone', 'scada-network', 4, 'compliant'),
  (gen_random_uuid(), v_tenant_id, v_site_quoz_id, 'Quoz Maintenance Access', 'dmz', 2, 'partial'),
  (gen_random_uuid(), v_tenant_id, v_site_silicon_id, 'Silicon Smart Grid Interface', 'substation-control', 3, 'non-compliant'),
  (gen_random_uuid(), v_tenant_id, v_site_marina_id, 'Marina Protection Interface', 'protection-systems', 4, 'compliant')
  ON CONFLICT DO NOTHING;

  -- 3. SECURITY CONTROLS (Diversification)
  INSERT INTO security_controls (
    tenant_id, control_id, control_name, control_description, control_type, 
    category, subcategory, domain, standard_id, implementation_status, 
    implementation_percentage, effectiveness, criticality, status
  ) VALUES
  (v_tenant_id, 'TRANS-SEC-001', 'Physical Badge Rotation', 'Mandatory visual inspection and electronic rotation of NFC badges every 6 months.', 'preventive', 'Physical Security', 'Access Control', 'Physical', v_nist_std_id, 'implemented', 100.0, 'effective', 'high', 'active'),
  (v_tenant_id, 'TRANS-IR-003', 'Ransomware Canary Files', 'Deployment of honeyfiles across SCADA HMI workstations to detect early-stage encryption.', 'detective', 'Incident Response', 'Detection', 'Endpoint', v_iec_std_id, 'partial', 40.0, 'partially-effective', 'high', 'active'),
  (v_tenant_id, 'TRANS-CRY-003', 'Post-Quantum Algorithm Pilot', 'Pilot deployment of PQC algorithms for future-proofing critical telemetry.', 'preventive', 'Cryptography', 'Advanced', 'Network', v_nist_std_id, 'not-implemented', 0.0, 'ineffective', 'medium', 'active'),
  (v_tenant_id, 'TRANS-SUP-002', 'Vendor Code Signing Verification', 'Automated validation of 3rd party binary signatures before deployment.', 'preventive', 'Supply Chain', 'Software Integrity', 'Application', v_iec_std_id, 'partial', 65.0, 'effective', 'safety-critical', 'active')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_control_badge_id FROM security_controls WHERE control_id = 'TRANS-SEC-001' AND tenant_id = v_tenant_id;
  SELECT id INTO v_control_canary_id FROM security_controls WHERE control_id = 'TRANS-IR-003' AND tenant_id = v_tenant_id;

  -- Add Implementations
  INSERT INTO control_implementations (
    tenant_id, control_id, implementation_name, implementation_description, site_id, technology_used, status
  ) VALUES
  (v_tenant_id, v_control_badge_id, 'Al Quoz RFID System', 'Integration with HID Global RFID readers.', v_site_quoz_id, 'HID / NFC', 'implemented'),
  (v_tenant_id, v_control_canary_id, 'Canary Deployment Pilot', 'Simulated files on 5 HMIs in Quoz.', v_site_quoz_id, 'Python / HoneyPy', 'partial');

  -- 4. RISK & COMPLIANCE SUMMARIES (Historical Trends)
  INSERT INTO risk_compliance_summaries (
    id, tenant_id, summary_name, summary_date, reporting_period_start, reporting_period_end,
    summary_type, total_risks, critical_risks, high_risks, overall_risk_score, 
    overall_compliance_score, status, 
    total_assets, secure_assets, total_standards, compliant_standards,
    mitigated_risks, accepted_risks, inherent_risk_score, residual_risk_score,
    executive_summary, key_findings, recommendations,
    created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_tenant_id, 'Q2 2023 DEWA Security Summary', 
    NOW() - INTERVAL '270 days', NOW() - INTERVAL '360 days', NOW() - INTERVAL '270 days',
    'quarterly', 50, 5, 15, 55.5, 78.2, 'approved', 
    500, 391, 5, 3,
    25, 5, 75.0, 55.5,
    'Q2 assessment shows steady progress in network segmentation.',
    ARRAY['Implemented Sl-2 controls', 'Reduced shadow IT by 15%'],
    ARRAY['Continue MFA rollout', 'Update password policies'],
    NOW() - INTERVAL '270 days', NOW() - INTERVAL '270 days'
  ),
  (
    gen_random_uuid(), v_tenant_id, 'Q3 2023 DEWA Security Summary', 
    NOW() - INTERVAL '180 days', NOW() - INTERVAL '270 days', NOW() - INTERVAL '180 days',
    'quarterly', 48, 4, 14, 48.0, 82.5, 'approved', 
    550, 453, 5, 4,
    30, 4, 68.0, 48.0,
    'Q3 saw significant improvement in compliance scores.',
    ARRAY['Compliance reached 82%', 'Automated patching deployed'],
    ARRAY['Improve incident response time', 'Conduct deep-dive on SCADA logs'],
    NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'
  );

  -- 5. VENDOR SECURITY (More Vendors)
  INSERT INTO vendor_security_assessments (
    id, tenant_id, vendor_name, vendor_id, vendor_type, system_name, system_type,
    system_criticality, assessment_date, assessment_type, overall_security_score, risk_score, trust_level, status
  ) VALUES
  (gen_random_uuid(), v_tenant_id, 'CyberGuard Solutions', 'CG-001', 'service-provider', 'SOC Managed Services', 'service', 'high', NOW() - INTERVAL '120 days', 'periodic', 91.0, 15.0, 'trusted', 'completed'),
  (gen_random_uuid(), v_tenant_id, 'Azure Cloud (Regional)', 'MS-001', 'service-provider', 'Azure Government Hub', 'application', 'production-critical', NOW() - INTERVAL '200 days', 'periodic', 94.5, 10.0, 'trusted', 'completed'),
  (gen_random_uuid(), v_tenant_id, 'Legacy Controls Inc.', 'LC-088', 'equipment-manufacturer', 'Legacy RTU OS', 'rtu', 'safety-critical', NOW() - INTERVAL '15 days', 'audit', 42.0, 75.0, 'untrusted', 'completed')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_vendor_cyberguard_id FROM vendor_security_assessments WHERE vendor_name = 'CyberGuard Solutions' AND tenant_id = v_tenant_id;
  SELECT id INTO v_vendor_legacy_id FROM vendor_security_assessments WHERE vendor_name = 'Legacy Controls Inc.' AND tenant_id = v_tenant_id;

  -- Add Findings
  INSERT INTO vendor_security_findings (
    id, assessment_id, tenant_id, finding_title, finding_description, finding_category, severity, remediation_recommendation, remediation_status
  ) VALUES
  (gen_random_uuid(), v_vendor_legacy_id, v_tenant_id, 'Unpatched Telnet Service', 'Telnet service running on port 23 without authentication', 'network-security', 'critical', 'Disable Telnet service and use SSH instead', 'open'),
  (gen_random_uuid(), v_vendor_legacy_id, v_tenant_id, 'Hardcoded Admin Credentials', 'Default admin credentials found in configuration files', 'authentication', 'critical', 'Change default credentials and implement secure credential management', 'open'),
  (gen_random_uuid(), v_vendor_cyberguard_id, v_tenant_id, 'Minor Logging Delay', 'Log forwarding has 2-3 second delay during peak hours', 'incident-response', 'low', 'Optimize log forwarding configuration', 'resolved');

  -- Add Contact History
  INSERT INTO vendor_contact_history (
    id, assessment_id, tenant_id, contact_date, contact_type, contact_subject, contact_summary, internal_participants, vendor_participants
  ) VALUES
  (gen_random_uuid(), v_vendor_legacy_id, v_tenant_id, NOW() - INTERVAL '10 days', 'email', 'Telnet Vulnerability Patch Request', 'Requested patch for Telnet vulnerability. No response yet.', ARRAY['Security Team'], ARRAY['Ibrahim Khan']),
  (gen_random_uuid(), v_vendor_legacy_id, v_tenant_id, NOW() - INTERVAL '2 days', 'phone', 'Patch Follow-up', 'Followed up on patch. Vendor claims system is end-of-life.', ARRAY['Security Team'], ARRAY['Ibrahim Khan']);

  -- 6. IDENTITY & ACCESS (Advanced Enforcement)
  -- Access Policies
  INSERT INTO access_policies (
    id, tenant_id, name, description, policy_type, status, priority, applies_to, created_at
  ) VALUES
  (gen_random_uuid(), v_tenant_id, 'Emergency Grid Restoration', 'Critical access override during blackout scenarios.', 'role-based', 'active', 500, ARRAY['operator', 'supervisor'], NOW()),
  (gen_random_uuid(), v_tenant_id, 'Contractor Temporary Access', 'Restricted access for external maintenance crews.', 'time-based', 'active', 150, ARRAY['visitor'], NOW())
  ON CONFLICT DO NOTHING;

  -- MFA Rules
  INSERT INTO mfa_rules (
    tenant_id, name, description, status, priority, conditions, requirements, enforcement, created_by
  ) VALUES
  (
    v_tenant_id, 'Critical Substation MFA', 'Requires hardware key for SL4 zone access.', 'active', 10,
    '{"locations": ["Substation"], "securityLevels": [4]}'::jsonb,
    '{"mfaRequired": true, "mfaMethods": ["hardware-key"], "sessionTimeout": 60}'::jsonb,
    'strict', 'Saeed Al Tayer'
  ),
  (
    v_tenant_id, 'Remote Access Adaptive MFA', 'Biometric challenge for off-site connections.', 'active', 20,
    '{"ipRanges": ["!192.168.0.0/16"]}'::jsonb,
    '{"mfaRequired": true, "mfaMethods": ["biometric"], "sessionTimeout": 240}'::jsonb,
    'strict', 'Saeed Al Tayer'
  );

  -- Session Rules
  INSERT INTO session_rules (
    tenant_id, name, description, status, session_type, max_duration, idle_timeout, max_concurrent_sessions, created_by
  ) VALUES
  (v_tenant_id, 'Standard Operator Session', 'Default limits for control room staff.', 'active', 'interactive', 480, 30, 1, 'Ahmed Al Mansouri'),
  (v_tenant_id, 'Emergency Break-Glass', 'Extended duration for restoration events.', 'active', 'emergency', 1440, 0, 5, 'Ahmed Al Mansouri'),
  (v_tenant_id, 'ReadOnly API Session', 'Short lived tokens for dashboard displays.', 'active', 'api', 60, 10, 50, 'Ahmed Al Mansouri');

  -- API Keys & Service Principals
  INSERT INTO api_keys (
    tenant_id, name, description, key_hash, key_prefix, owner_user_id, status, expires_at, permissions
  ) VALUES
  (v_tenant_id, 'Grafana-Dashboard-Key', 'Read-only key for telemetry visualization.', 'hash_123456789', 'graf_', v_user_ahmed, 'active', NOW() + INTERVAL '90 days', ARRAY['read:telemetry', 'read:alerts']),
  (v_tenant_id, 'Legacy-RTU-Sync-Key', 'Legacy key with elevated permissions.', 'hash_987654321', 'rtu_', v_user_fatima, 'active', NOW() - INTERVAL '5 days', ARRAY['read:all', 'write:all']);

  INSERT INTO service_principals (
    tenant_id, name, description, principal_type, client_id, client_secret_hash, status, permissions
  ) VALUES
  (v_tenant_id, 'SIEM-Forwarder-Service', 'Service for log ingestion to central SIEM.', 'service', 'sp_siem_001', 'hash_siem_001', 'active', ARRAY['logs:read', 'audit:read']),
  (v_tenant_id, 'Asset-Discovery-Engine', 'Scans OT network for new devices.', 'application', 'sp_disc_002', 'hash_disc_002', 'active', ARRAY['assets:read', 'assets:create']);

  -- 7. SECRETS & CERTIFICATES (Diversification)
  INSERT INTO secrets_certificates (
    id, tenant_id, name, description, secret_type, certificate_type, status, valid_from, valid_until, usage_count, zone_ids, encryption_key_id
  ) VALUES
  (gen_random_uuid(), v_tenant_id, 'VPN-Gateway-Secondary-2024', 'Backup VPN tunnel certificate.', 'certificate', 'web_server', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days', 450, ARRAY['dmz'], 'kms-primary'),
  (gen_random_uuid(), v_tenant_id, 'Cloud-Storage-Sync-Key', 'Azure Archive sync credentials.', 'api_key', NULL, 'active', NOW() - INTERVAL '100 days', NOW() + INTERVAL '265 days', 12000, ARRAY['corporate-network'], 'kms-primary'),
  (gen_random_uuid(), v_tenant_id, 'Jump-Host-SSH-Key', 'Root SSH key for maintenance jump host.', 'private_key', NULL, 'active', NOW() - INTERVAL '365 days', NOW() + INTERVAL '365 days', 88, ARRAY['scada-network'], 'kms-primary')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_cert_vpn_id FROM secrets_certificates WHERE name = 'VPN-Gateway-Secondary-2024' AND tenant_id = v_tenant_id;

  -- Certificate Rotation History
  INSERT INTO certificate_rotation_history (
    tenant_id, certificate_id, rotation_type, rotation_reason, rotation_requested_at, rotation_completed_at, requested_by, status
  ) VALUES
  (v_tenant_id, v_cert_vpn_id, 'scheduled', 'Annual security requirement', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', v_user_sarah, 'completed');

END $$;

COMMIT;
