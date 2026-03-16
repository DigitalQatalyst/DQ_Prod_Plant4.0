-- =============================================================================
-- SEED DATA: Expanded Security Data (Volume Enhanced)
-- Description: Adds comprehensive and diverse security data for Power Transmission demo
-- Covers: Posture, Control Coverage, Risks, Vendor Security, IAM, Secrets, etc.
-- =============================================================================

BEGIN;

-- Capture tenant ID and other references
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_admin_id UUID;
    v_site_id UUID;
    v_assessment_id UUID;
    v_iec_std_id UUID;
    v_nerc_std_id UUID;
    v_standard_id UUID;
    v_j_count INTEGER;
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Get admin user for 'created_by' fields, or create a placeholder
    SELECT id INTO v_user_admin_id FROM security_users WHERE email = 'admin@dewa.gov.ae' LIMIT 1;
    
    IF v_user_admin_id IS NULL THEN
        INSERT INTO security_users (tenant_id, username, email, full_name, role, status)
        VALUES (v_tenant_id, 'admin', 'admin@dewa.gov.ae', 'System Administrator', 'administrator', 'active')
        RETURNING id INTO v_user_admin_id;
    END IF;

    -- Get standard IDs
    SELECT id INTO v_iec_std_id FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_nerc_std_id FROM compliance_standards WHERE name = 'NERC CIP' AND tenant_id = v_tenant_id LIMIT 1;


    ---------------------------------------------------------------------------
    -- 1. POSTURE BY SITE/FACILITY (Adding ~10 more sites)
    ---------------------------------------------------------------------------
    -- We will insert multiple sites directly
    INSERT INTO sites (id, tenant_id, name, region, geo_lat, geo_lng, site_type) VALUES
    (gen_random_uuid(), v_tenant_id, 'Al Quoz Substation 132kV', 'Al Quoz', 25.1554, 55.2544, 'substation'),
    (gen_random_uuid(), v_tenant_id, 'Warsan Grid Station 400kV', 'Warsan', 25.1654, 55.4044, 'substation'),
    (gen_random_uuid(), v_tenant_id, 'Satwa Distribution Hub', 'Satwa', 25.2254, 55.2744, 'distribution'),
    (gen_random_uuid(), v_tenant_id, 'Hatta Mountain Relay', 'Hatta', 24.8054, 56.1244, 'switching-station'),
    (gen_random_uuid(), v_tenant_id, 'Palm Jumeirah Substation', 'Palm Jumeirah', 25.1154, 55.1344, 'substation'),
    (gen_random_uuid(), v_tenant_id, 'Jebel Ali Solar Park Control', 'Jebel Ali', 24.9554, 55.2044, 'control-center'),
    (gen_random_uuid(), v_tenant_id, 'Business Bay Grid Station', 'Business Bay', 25.1854, 55.2644, 'substation'),
    (gen_random_uuid(), v_tenant_id, 'Silicon Oasis Switching', 'Silicon Oasis', 25.1254, 55.3744, 'switching-station'),
    (gen_random_uuid(), v_tenant_id, 'Marina South Substation', 'Dubai Marina', 25.0754, 55.1344, 'substation'),
    (gen_random_uuid(), v_tenant_id, 'Investment Park Hub', 'DIP', 24.9854, 55.1744, 'distribution')
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Add zones for these new sites (randomized compliance)
    FOR v_site_id IN SELECT id FROM sites WHERE tenant_id = v_tenant_id AND name NOT IN ('Dubai Main Substation', 'Jebel Ali Grid Station') LOOP
        INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
        (gen_random_uuid(), v_tenant_id, v_site_id, 'Control Room Zone', 'control', 3, (ARRAY['compliant', 'partial', 'non-compliant'])[floor(random() * 3 + 1)]),
        (gen_random_uuid(), v_tenant_id, v_site_id, 'Field Device Network', 'field-devices', 2, (ARRAY['compliant', 'partial'])[floor(random() * 2 + 1)]);
    END LOOP;

    ---------------------------------------------------------------------------
    -- 2. CONTROL COVERAGE VIEW (Adding assessments)
    ---------------------------------------------------------------------------
    -- Add a few more assessments for different sites
    FOR i IN 1..15 LOOP
        SELECT id INTO v_site_id FROM sites WHERE tenant_id = v_tenant_id ORDER BY random() LIMIT 1;
        
        -- Select standard type
        IF random() > 0.5 THEN
            v_standard_id := v_iec_std_id;
            INSERT INTO control_coverage_assessments (
                id, tenant_id, site_id, assessment_name, assessment_type, standard_name, 
                coverage_score, effectiveness_score, maturity_level, status, compliance_status,
                assessment_date
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_site_id, 
                'Annual Audit ' || i || ' - IEC 62443',
                'iec-62443',
                'IEC 62443-3-3',
                0, -- Will be updated by trigger
                0, -- Will be updated by trigger
                floor(random() * 3 + 2),
                'completed',
                'partial',
                NOW() - (INTERVAL '1 month' * i)
            ) RETURNING id INTO v_assessment_id;

            -- Add 10-15 details for IEC 62443
            FOR j IN 1..(floor(random() * 6 + 10)) LOOP
                INSERT INTO control_coverage_details (
                    assessment_id, tenant_id, control_id, control_name, control_description,
                    control_category, implementation_status, effectiveness, gap_severity,
                    remediation_status
                ) VALUES (
                    v_assessment_id, v_tenant_id,
                    'IEC-62443-4-2-CR-' || j || '.' || i,
                    (ARRAY['Device Identification', 'Authorization Enforcement', 'Communication Integrity', 'Network Segmentation', 'Security Monitoring', 'Resource Availability', 'Data Confidentiality'])[floor(random() * 7 + 1)],
                    'Description for control ' || j,
                    (ARRAY['access-control', 'network-security', 'monitoring', 'data-protection'])[floor(random() * 4 + 1)],
                    (ARRAY['implemented', 'partial', 'not-implemented'])[floor(random() * 3 + 1)],
                    (ARRAY['effective', 'partially-effective', 'ineffective'])[floor(random() * 3 + 1)],
                    (ARRAY['none', 'low', 'medium', 'high', 'critical'])[floor(random() * 5 + 1)],
                    (ARRAY['not-started', 'in-progress', 'completed'])[floor(random() * 3 + 1)]
                );
            END LOOP;
        ELSE
            v_standard_id := v_nerc_std_id;
            INSERT INTO control_coverage_assessments (
                id, tenant_id, site_id, assessment_name, assessment_type, standard_name, 
                coverage_score, effectiveness_score, maturity_level, status, compliance_status,
                assessment_date
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_site_id, 
                'Compliance Review ' || i || ' - NERC CIP',
                'nerc-cip',
                'NERC CIP Version 6',
                0, -- Will be updated by trigger
                0, -- Will be updated by trigger
                floor(random() * 3 + 2),
                'completed',
                'compliant',
                NOW() - (INTERVAL '1 month' * i)
            ) RETURNING id INTO v_assessment_id;

            -- Add 10-15 details for NERC CIP
            FOR j IN 1..(floor(random() * 6 + 10)) LOOP
                INSERT INTO control_coverage_details (
                    assessment_id, tenant_id, control_id, control_name, control_description,
                    control_category, implementation_status, effectiveness, gap_severity,
                    remediation_status
                ) VALUES (
                    v_assessment_id, v_tenant_id,
                    'CIP-00' || j || '-6-R' || i,
                    (ARRAY['BES Cyber System Categorization', 'Security Management Controls', 'Personnel & Training', 'Electronic Security Perimeters', 'Physical Security of BES Cyber Systems', 'System Security Management', 'Incident Reporting and Response Planning', 'Configuration Change Management'])[floor(random() * 8 + 1)],
                    'NERC CIP Requirement description ' || j,
                    (ARRAY['access-control', 'network-security', 'monitoring', 'physical-security'])[floor(random() * 4 + 1)],
                    (ARRAY['implemented', 'partial', 'not-implemented'])[floor(random() * 3 + 1)],
                    (ARRAY['effective', 'partially-effective', 'ineffective'])[floor(random() * 3 + 1)],
                    (ARRAY['none', 'low', 'medium', 'high', 'critical'])[floor(random() * 5 + 1)],
                    (ARRAY['not-started', 'in-progress', 'completed'])[floor(random() * 3 + 1)]
                );
            END LOOP;
        END IF;
    END LOOP;

    ---------------------------------------------------------------------------
    -- 2.1 RISK AND COMPLIANCE SUMMARIES (Historical Trends - 12 months)
    ---------------------------------------------------------------------------
    FOR i IN 1..12 LOOP
        v_assessment_id := gen_random_uuid();
        INSERT INTO risk_compliance_summaries (
            id, tenant_id, summary_name, summary_date,
            reporting_period_start, reporting_period_end, summary_type,
            total_risks, critical_risks, high_risks, medium_risks, low_risks,
            overall_risk_score, overall_compliance_score, status,
            total_assets, secure_assets, vulnerable_assets, critical_assets,
            total_standards, compliant_standards,
            iec_62443_score, nerc_cip_score,
            mitigated_risks, accepted_risks, inherent_risk_score, residual_risk_score,
            executive_summary, key_findings, recommendations
        ) VALUES (
            v_assessment_id, v_tenant_id, 
            'Monthly Summary - ' || to_char(NOW() - (INTERVAL '1 month' * i), 'Month YYYY'),
            NOW() - (INTERVAL '1 month' * i),
            (NOW() - (INTERVAL '1 month' * (i + 1)))::DATE,
            (NOW() - (INTERVAL '1 month' * i))::DATE,
            'monthly',
            floor(random() * 20 + 30), -- 30-50 total
            floor(random() * 3),       -- 0-3 critical
            floor(random() * 5 + 5),   -- 5-10 high
            floor(random() * 10 + 10), -- 10-20 medium
            floor(random() * 10),      -- 0-10 low
            floor(random() * 40 + 20), -- 20-60 score
            floor(random() * 20 + 75), -- 75-95 score
            'approved',
            floor(random() * 200 + 800), -- Total Assets (800-1000)
            floor(random() * 100 + 700), -- Secure Assets (700-800)
            floor(random() * 50 + 50),   -- Vulnerable
            floor(random() * 30 + 10),   -- Critical Assets
            floor(random() * 2 + 3),     -- Total Standards (3-5)
            floor(random() * 2 + 2),     -- Compliant Standards (2-4)
            floor(random() * 15 + 80),   -- IEC score
            floor(random() * 10 + 85),   -- NERC score
            floor(random() * 20 + 10), -- mitigated
            floor(random() * 5),       -- accepted
            65.0, 42.0,                -- scores
            'Assessment for ' || to_char(NOW() - (INTERVAL '1 month' * i), 'Month YYYY') || ' shows continued stability.',
            ARRAY['Critical vulnerabilities addressed', 'New EDR sensors deployed', 'Compliance standards met'],
            ARRAY['Expand monitoring to secondary sites', 'Schedule quarterly tabletop exercise', 'Rotate administrative keys']
        );

        -- Add standard statuses for each summary to populate alignment charts
        INSERT INTO compliance_standard_status (
            summary_id, tenant_id, standard_name, standard_type, 
            compliance_status, compliance_score, total_requirements, met_requirements
        ) VALUES 
        (v_assessment_id, v_tenant_id, 'IEC 62443', 'iec-62443', 'partial', 88.0, 100, 88),
        (v_assessment_id, v_tenant_id, 'NERC CIP', 'nerc-cip', 'compliant', 92.0, 50, 46),
        (v_assessment_id, v_tenant_id, 'NIST CSF', 'nist', 'partial', 85.0, 80, 68),
        (v_assessment_id, v_tenant_id, 'ISO 27001', 'iso-27001', 'partial', 72.0, 114, 82);
    END LOOP;

    ---------------------------------------------------------------------------
    -- 3. RISK AND COMPLIANCE SUMMARY (Adding ~10 more risks)
    ---------------------------------------------------------------------------
    INSERT INTO security_risks (
        tenant_id, risk_id, risk_name, risk_description, risk_category, 
        inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, 
        treatment_strategy, status, treatment_owner
    ) VALUES
    (v_tenant_id, 'RISK-TX-006', 'Supply Chain Compromise - Solar Controllers', 'Backdoored firmware in solar inverter controllers.', 'third-party', 'low', 'major', 'low', 'moderate', 'mitigate', 'monitoring', 'Vendor Mgmt'),
    (v_tenant_id, 'RISK-TX-007', 'Cloud SCADA Data Leakage', 'Misconfigured bucket for historian backup.', 'cyber-attack', 'medium', 'moderate', 'low', 'minor', 'mitigate', 'closed', 'Cloud Ops'),
    (v_tenant_id, 'RISK-TX-008', 'Physical Access to Remote Substations', 'Unauthorized physical entry to unmanned substations.', 'physical-security', 'medium', 'major', 'low', 'major', 'mitigate', 'monitoring', 'Physical Security'),
    (v_tenant_id, 'RISK-TX-009', 'Legacy Windows XP Workstations', 'Unpatched legacy HMI stations in Grid Station A.', 'system-vulnerability', 'high', 'moderate', 'medium', 'moderate', 'mitigate', 'monitoring', 'IT Ops'),
    (v_tenant_id, 'RISK-TX-010', 'Default Credentials on Switches', 'New batch of industrial switches deployed with default admin/admin.', 'configuration-error', 'high', 'major', 'low', 'major', 'mitigate', 'identified', 'Network Team'),
    (v_tenant_id, 'RISK-TX-011', 'Wireless Interference on Sensors', 'Jamming attacks on wireless sensor networks.', 'physical-security', 'low', 'minor', 'low', 'minor', 'accept', 'accepted', 'Ops Team'),
    (v_tenant_id, 'RISK-TX-012', 'Insider Data Exfiltration', 'Disgruntled employee downloading schematics.', 'insider-threat', 'low', 'major', 'low', 'moderate', 'monitor', 'mitigating', 'HR/Security'),
    (v_tenant_id, 'RISK-TX-013', 'GPS Spoofing on Phasor Units', 'Timing attacks affecting PMU synchronization.', 'cyber-attack', 'low', 'catastrophic', 'low', 'major', 'transfer', 'monitoring', 'Grid Ops'),
    (v_tenant_id, 'RISK-TX-014', 'Ransomware via Engineering Laptop', 'Contractor laptop bridging airgap.', 'cyber-attack', 'medium', 'catastrophic', 'low', 'major', 'mitigate', 'monitoring', 'IT Security'),
    (v_tenant_id, 'RISK-TX-015', 'API Key Exposure in Code', 'Hardcoded keys in SCADA automation scripts.', 'cyber-attack', 'high', 'major', 'low', 'major', 'mitigate', 'mitigating', 'DevSecOps');

    ---------------------------------------------------------------------------
    -- 4. VENDOR/ADVISOR SECURITY SUMMARY (Adding ~8 more vendors)
    ---------------------------------------------------------------------------
    INSERT INTO vendor_security_assessments (
        tenant_id, vendor_name, vendor_type, system_name, system_criticality,
        overall_security_score, risk_score, trust_level, status, assessment_type
    ) VALUES
    (v_tenant_id, 'Siemens Energy', 'equipment-manufacturer', 'SICAM PAS', 'production-critical', 92.5, 15.0, 'trusted', 'approved', 'periodic'),
    (v_tenant_id, 'Hitachi Energy', 'system-integrator', 'MicroSCADA X', 'safety-critical', 88.0, 22.0, 'trusted', 'approved', 'periodic'),
    (v_tenant_id, 'Schweitzer Engineering', 'equipment-manufacturer', 'SEL-3530 RTAC', 'high', 95.0, 5.0, 'trusted', 'approved', 'periodic'),
    (v_tenant_id, 'Generic IoT Vendor', 'other', 'Smart Sensor Hub', 'low', 45.0, 85.0, 'untrusted', 'rejected', 'initial'),
    (v_tenant_id, 'Cisco Systems', 'equipment-manufacturer', 'IE-4000 Switches', 'high', 96.0, 4.0, 'trusted', 'approved', 'periodic'),
    (v_tenant_id, 'Fortinet', 'equipment-manufacturer', 'FortiGate OT', 'high', 94.0, 6.0, 'trusted', 'approved', 'periodic'),
    (v_tenant_id, 'Local Cabling Co', 'service-provider', 'Fiber Maintenance', 'low', 60.0, 40.0, 'conditional', 'approved', 'initial'),
    (v_tenant_id, 'Global Analytics Inc', 'software-provider', 'Predictive Maintenance AI', 'medium', 75.0, 25.0, 'conditional', 'in-progress', 'initial'),
    (v_tenant_id, 'Legacy RTU Maker', 'equipment-manufacturer', 'Series 9000', 'production-critical', 55.0, 60.0, 'restricted', 'approved', 'audit'),
    (v_tenant_id, 'Cloud SCADA Solutions', 'software-provider', 'CloudHistorian', 'medium', 82.0, 18.0, 'trusted', 'approved', 'periodic');

    ---------------------------------------------------------------------------
    -- 5. ACCESS POLICIES (Adding ~8 more policies)
    ---------------------------------------------------------------------------
    INSERT INTO access_policies (
        tenant_id, name, description, policy_type, status, priority, applies_to
    ) VALUES
    (v_tenant_id, 'Engineering Remote Access', 'Remote access for engineers.', 'role-based', 'active', 20, ARRAY['role:engineer']),
    (v_tenant_id, 'Vendor Maintenance Window', 'Restricted time window.', 'time-based', 'active', 50, ARRAY['group:vendors']),
    (v_tenant_id, 'Emergency SCADA Override', 'Break-glass for operators.', 'role-based', 'draft', 10, ARRAY['role:operator']),
    (v_tenant_id, 'AuditReadOnly', 'Read access for auditors.', 'role-based', 'active', 100, ARRAY['role:auditor']),
    (v_tenant_id, 'Deny External IPs', 'Geo-blocking policy.', 'zone-based', 'active', 1, ARRAY['location:external']),
    (v_tenant_id, 'Substation-A Local Only', 'Restrict control to local HMI.', 'asset-based', 'active', 30, ARRAY['asset:sub-a']),
    (v_tenant_id, 'Firmware Update Restriction', 'Only seniors can flash firmware.', 'role-based', 'active', 25, ARRAY['role:junior']),
    (v_tenant_id, 'Midnight Maintenance', 'Auto-approve maintenance 12-4AM.', 'time-based', 'inactive', 60, ARRAY['group:maintenance']);

    ---------------------------------------------------------------------------
    -- 6. PRIVILEGED ACCESS SESSIONS (Adding ~10 more sessions)
    ---------------------------------------------------------------------------
    INSERT INTO privileged_access_sessions (
        tenant_id, user_id, session_type, target_resource_type, target_resource_id,
        requested_by, status, requested_start, requested_end, request_reason
    ) VALUES
    (v_tenant_id, v_user_admin_id, 'maintenance', 'scada-system', 'SCADA-CORE-01', v_user_admin_id, 'approved', NOW(), NOW() + INTERVAL '2 hours', 'Emergency patch'),
    (v_tenant_id, v_user_admin_id, 'emergency', 'protection-relay', 'RELAY-Sub-A-01', v_user_admin_id, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'Trip diagnosis'),
    (v_tenant_id, v_user_admin_id, 'administrative', 'firewall', 'FW-CORE-01', v_user_admin_id, 'denied', NOW(), NOW() + INTERVAL '1 hour', 'No ticket'),
    (v_tenant_id, v_user_admin_id, 'maintenance', 'rtu', 'RTU-West-02', v_user_admin_id, 'pending', NOW() + INTERVAL '1 day', NOW() + INTERVAL '26 hours', 'Planned upgrade'),
    (v_tenant_id, v_user_admin_id, 'administrative', 'switch', 'SW-Main-01', v_user_admin_id, 'active', NOW(), NOW() + INTERVAL '4 hours', 'VLAN config'),
    (v_tenant_id, v_user_admin_id, 'emergency', 'hmi', 'HMI-Control-03', v_user_admin_id, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '40 hours', 'Screen freeze fix'),
    (v_tenant_id, v_user_admin_id, 'maintenance', 'gateway', 'GW-North-01', v_user_admin_id, 'expired', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Unused session'),
    (v_tenant_id, v_user_admin_id, 'administrative', 'historian', 'HIST-01', v_user_admin_id, 'completed', NOW() - INTERVAL '1 week', NOW() - INTERVAL '6 days', 'Audit export'),
    (v_tenant_id, v_user_admin_id, 'emergency', 'relay', 'RELAY-Feeder-05', v_user_admin_id, 'approved', NOW(), NOW() + INTERVAL '30 minutes', 'Urgent setting change');

    ---------------------------------------------------------------------------
    -- 7. DIRECTORY AND SSO (Adding ~8 integrations)
    ---------------------------------------------------------------------------
    INSERT INTO directory_integrations (
        tenant_id, name, type, status, domain, server_url, synced_users
    ) VALUES
    (v_tenant_id, 'Corporate Okta', 'openid-connect', 'active', 'okta.dewa.gov.ae', 'https://dewa.okta.com', 4500),
    (v_tenant_id, 'Legacy OT LDAP', 'ldap', 'active', 'ot.local', 'ldap://10.20.1.5', 120),
    (v_tenant_id, 'Azure AD Engineering', 'azure-ad', 'active', 'eng.dewa.gov.ae', 'https://login.microsoft.com', 850),
    (v_tenant_id, 'Contractor Portal', 'saml', 'inactive', 'contractors.feed', 'https://idp.contractor.com', 0),
    (v_tenant_id, 'Physical Security AD', 'active-directory', 'active', 'phys-sec.local', 'ldap://10.50.1.5', 300),
    (v_tenant_id, 'Legacy Radius', 'radius', 'inactive', 'radius.local', 'radius://10.10.1.10', 50),
    (v_tenant_id, 'Substation Local Auth', 'local-db', 'active', 'local', 'localhost', 15),
    (v_tenant_id, 'Cloud Ops Identity', 'google-oauth', 'testing', 'gcp.ops', 'https://accounts.google.com', 10);

    ---------------------------------------------------------------------------
    -- 8. SERVICE PRINCIPALS (Adding ~8)
    ---------------------------------------------------------------------------
    INSERT INTO service_principals (
        tenant_id, name, principal_type, client_id, status, description, client_secret_hash
    ) VALUES
    (v_tenant_id, 'Backup-Agent-01', 'service', 'svc_backup_01', 'active', 'Nightly SCADA backups', 'hash_backup_01'),
    (v_tenant_id, 'SIEM-Forwarder', 'application', 'app_siem_fwd', 'active', 'Log forwarding', 'hash_siem_fwd'),
    (v_tenant_id, 'Patch-Manager-Bot', 'service', 'svc_patch_mgr', 'active', 'Automated patching pulse', 'hash_patch_bot'),
    (v_tenant_id, 'Asset-Discovery-Scanner', 'device', 'dev_scanner_01', 'active', 'Passive network scanner', 'hash_scanner_01'),
    (v_tenant_id, 'Compliance-Reporter', 'application', 'app_comp_rpt', 'active', 'Generates monthly PDFs', 'hash_comp_rpt'),
    (v_tenant_id, 'Legacy-Bridge', 'service', 'svc_legacy_01', 'revoked', 'Bridge for Series 9000 RTUs', 'hash_legacy_01'),
    (v_tenant_id, 'Test-Runner-CI', 'application', 'app_ci_runner', 'archived', 'CI/CD pipeline', 'hash_ci_runner'),
    (v_tenant_id, 'Ext-Audit-Collector', 'service', 'svc_ext_audit', 'active', 'External auditor read-only access', 'hash_audit_01');

    ---------------------------------------------------------------------------
    -- 9. API KEYS (Adding ~8 key records)
    ---------------------------------------------------------------------------
    INSERT INTO api_keys (
        tenant_id, name, description, key_prefix, status, usage_count, key_hash
    ) VALUES
    (v_tenant_id, 'Ext-Monitor', 'External compliance dashboard', 'dk_live', 'active', 15000, 'hash_live_01'),
    (v_tenant_id, 'Dev-Test', 'Developer testing', 'dk_test', 'archived', 50, 'hash_test_01'),
    (v_tenant_id, 'Mobile-App-Gateway', 'Field engineer app', 'dk_mob', 'active', 2300, 'hash_mob_01'),
    (v_tenant_id, 'Grafana-Datasource', 'Visualization backend', 'dk_vis', 'active', 55000, 'hash_vis_01'),
    (v_tenant_id, 'Alert-Webhook', 'PagerDuty integration', 'dk_alert', 'active', 120, 'hash_alert_01'),
    (v_tenant_id, 'Legacy-Script-Key', 'Old py scripts', 'dk_old', 'revoked', 5000, 'hash_old_01'),
    (v_tenant_id, 'Temp-Vendor-Key', 'Siemens upload', 'dk_vnd', 'expired', 10, 'hash_vnd_01'),
    (v_tenant_id, 'Grid-Model-Sync', 'Sync topology', 'dk_sync', 'active', 800, 'hash_sync_01');

    ---------------------------------------------------------------------------
    -- 10. SECRETS (Adding ~10 entries)
    ---------------------------------------------------------------------------
    INSERT INTO secrets_certificates (
        tenant_id, name, description, secret_type, certificate_type, status, 
        valid_until, rotation_interval_days, encryption_key_id
    ) VALUES
    (v_tenant_id, 'SCADA-Web-SSL', 'HMI Web SSL', 'certificate', 'web_server', 'active', NOW() + INTERVAL '1 year', 365, 'kms-key-01'),
    (v_tenant_id, 'Relay-Sign-Key', 'Config signing', 'private_key', NULL, 'active', NOW() + INTERVAL '2 years', 730, 'kms-key-01'),
    (v_tenant_id, 'Legacy-Token', 'RTU Auth', 'token', NULL, 'pending_rotation', NOW() + INTERVAL '5 days', 90, 'kms-key-01'),
    (v_tenant_id, 'Root-CA-Cert', 'Internal Root CA', 'certificate', 'ca_root', 'active', NOW() + INTERVAL '10 years', 3650, 'kms-key-01'),
    (v_tenant_id, 'Intermediate-CA', 'Issuing CA', 'certificate', 'ca_intermediate', 'active', NOW() + INTERVAL '5 years', 1825, 'kms-key-01'),
    (v_tenant_id, 'DNP3-Shared-Key', 'Link encryption', 'shared_secret', NULL, 'active', NOW() + INTERVAL '6 months', 180, 'kms-key-01'),
    (v_tenant_id, 'Database-Admin-Pwd', 'PGSQL Admin', 'password', NULL, 'active', NOW() + INTERVAL '30 days', 90, 'kms-key-01'),
    (v_tenant_id, 'WiFi-PSK', 'Substation WiFi', 'password', NULL, 'active', NOW() + INTERVAL '90 days', 90, 'kms-key-01'),
    (v_tenant_id, 'AWS-S3-Key', 'Backup storage', 'api_key', NULL, 'active', NOW() + INTERVAL '1 year', 365, 'kms-key-01'),
    (v_tenant_id, 'Code-Sign-Cert-2026', 'App binaries', 'certificate', 'code_signing', 'active', NOW() + INTERVAL '3 years', 1095, 'kms-key-01');

END $$;

COMMIT;
