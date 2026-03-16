-- Focused Seed Data Expansion (Existing Tables Only)
-- Expands datasets for tables that exist in the current schema
-- Date: 2026-02-11

BEGIN;

-- Capture tenant ID
DO $$
DECLARE
    v_tenant_id UUID;
    v_site_ids UUID[];
    v_zone_ids UUID[];
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant not found. Please run initial seed data first.';
    END IF;

    RAISE NOTICE 'Expanding seed data for tenant: %', v_tenant_id;

    -- ============================================
    -- SECTION 1: SITES & SECURITY POSTURE DATA
    -- ============================================
    
    -- Add 18 additional sites with varied types
    INSERT INTO sites (tenant_id, name, site_type) VALUES
    (v_tenant_id, 'Al Quoz Substation 132kV', 'substation'),
    (v_tenant_id, 'Jebel Ali Switching Station', 'switching-station'),
    (v_tenant_id, 'Dubai Silicon Oasis Substation', 'substation'),
    (v_tenant_id, 'Al Awir Grid Station 400kV', 'substation'),
    (v_tenant_id, 'Business Bay Substation', 'substation'),
    (v_tenant_id, 'Emirates Hills Distribution Center', 'distribution'),
    (v_tenant_id, 'Dubai Marina Switching Hub', 'switching-station'),
    (v_tenant_id, 'Rashidiya Regional Control', 'control-center'),
    (v_tenant_id, 'Deira Substation 132kV', 'substation'),
    (v_tenant_id, 'Expo 2020 Transmission Hub', 'transmission'),
    (v_tenant_id, 'Palm Jumeirah Power Station', 'substation'),
    (v_tenant_id, 'Dubai Investment Park Substation', 'substation'),
    (v_tenant_id, 'Al Barsha Grid Interface', 'switching-station'),
    (v_tenant_id, 'Dubai Creek Switching Point', 'switching-station'),
    (v_tenant_id, 'Dubai South Substation', 'substation'),
    (v_tenant_id, 'Nad Al Sheba Distribution Hub', 'distribution'),
    (v_tenant_id, 'Jumeirah Beach Control Center', 'control-center'),
    (v_tenant_id, 'Dubai Healthcare City Substation', 'substation')
    ON CONFLICT DO NOTHING;

    -- Get all site IDs for the tenant
    SELECT ARRAY_AGG(id) INTO v_site_ids FROM sites WHERE tenant_id = v_tenant_id;

    -- Add 50 security zones across the sites
    FOR i IN 1..50 LOOP
        INSERT INTO security_zones (
            tenant_id, site_id, name, zone_type, security_level,
            compliance_status
        ) VALUES (
            v_tenant_id,
            v_site_ids[1 + (i % array_length(v_site_ids, 1))],
            'Zone-' || LPAD(i::text, 3, '0'),
            CASE (i % 5)
                WHEN 0 THEN 'sis'
                WHEN 1 THEN 'control'
                WHEN 2 THEN 'corporate'
                WHEN 3 THEN 'dmz'
                ELSE 'field'
            END,
            CASE (i % 4)
                WHEN 0 THEN 4
                WHEN 1 THEN 3
                WHEN 2 THEN 2
                ELSE 1
            END,
            CASE (i % 3)
                WHEN 0 THEN 'compliant'
                WHEN 1 THEN 'partial'
                ELSE 'non-compliant'
            END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Get all zone IDs
    SELECT ARRAY_AGG(id) INTO v_zone_ids FROM security_zones WHERE tenant_id = v_tenant_id;

    -- Add 100 OT asset security records (linking to existing assets)
    -- Note: This requires assets to exist first, so we'll skip if no assets are available
    IF EXISTS (SELECT 1 FROM assets WHERE tenant_id = v_tenant_id LIMIT 1) THEN
        FOR i IN 1..100 LOOP
            INSERT INTO ot_asset_security (
                tenant_id, asset_id, zone_id, criticality, security_status, risk_score,
                vulnerability_count, patch_status, network_exposure, firmware_version,
                manufacturer, model, in_safety_loop
            )
            SELECT
                v_tenant_id,
                a.id,
                v_zone_ids[1 + ((i + a_idx) % array_length(v_zone_ids, 1))],
                CASE ((i + a_idx) % 5)
                    WHEN 0 THEN 'safety-critical'
                    WHEN 1 THEN 'production-critical'
                    WHEN 2 THEN 'high'
                    WHEN 3 THEN 'medium'
                    ELSE 'low'
                END,
                CASE ((i + a_idx) % 4)
                    WHEN 0 THEN 'secure'
                    WHEN 1 THEN 'vulnerable'
                    WHEN 2 THEN 'at-risk'
                    ELSE 'at-risk'
                END,
                ((i + a_idx) % 100),
                ((i + a_idx) % 5),
                CASE ((i + a_idx) % 3)
                    WHEN 0 THEN 'up-to-date'
                    WHEN 1 THEN 'pending'
                    ELSE 'outdated'
                END,
                CASE ((i + a_idx) % 3)
                    WHEN 0 THEN 'internal'
                    WHEN 1 THEN 'dmz'
                    ELSE 'internal'
                END,
                'v' || ((i + a_idx) % 5 + 1) || '.' || ((i + a_idx) % 10) || '.' || ((i + a_idx) % 100),
                CASE ((i + a_idx) % 6)
                    WHEN 0 THEN 'Siemens'
                    WHEN 1 THEN 'ABB'
                    WHEN 2 THEN 'Schneider Electric'
                    WHEN 3 THEN 'GE Grid Solutions'
                    WHEN 4 THEN 'Rockwell Automation'
                    ELSE 'Honeywell'
                END,
                'Model-' || ((i + a_idx) % 20 + 1),
                ((i + a_idx) % 10 = 0)
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 as a_idx
                FROM assets
                WHERE tenant_id = v_tenant_id
                LIMIT 100
            ) a
            WHERE a.a_idx = i - 1
            ON CONFLICT (tenant_id, asset_id) DO NOTHING;
        END LOOP;
    END IF;

    -- ============================================
    -- SECTION 2: DIRECTORY & SSO INTEGRATIONS
    -- ============================================

    -- Add 8 more directory integrations
    INSERT INTO directory_integrations (
        tenant_id, name, type, status, domain, server_url, port, use_ssl,
        base_dn, synced_users, synced_groups, attribute_mapping, role_mapping,
        last_sync, error_count
    ) VALUES
    (v_tenant_id, 'Secondary AD - Operations', 'active-directory', 'active', 'operations.dewa.local', 'ldap://10.0.10.100', 389, false, 'dc=operations,dc=dewa,dc=local', 450, 18, '{"email": "mail", "groups": "memberOf", "username": "sAMAccountName", "firstName": "givenName", "lastName": "sn"}'::jsonb, '{"CN=Grid-Operators,OU=Operations": "grid-operator", "CN=Field-Engineers,OU=Operations": "field-engineer"}'::jsonb, now() - interval '2 hours', 0),
    (v_tenant_id, 'AWS SSO Integration', 'saml', 'active', 'dewa.awsapps.com', 'https://portal.sso.ap-south-1.amazonaws.com/saml/assertion', 443, true, NULL, 320, 12, '{"email": "email", "groups": "groups", "username": "username", "firstName": "firstName", "lastName": "lastName"}'::jsonb, '{"cloud-admins": "administrator", "cloud-viewers": "viewer"}'::jsonb, now() - interval '1 hour', 0),
    (v_tenant_id, 'Okta Workforce Identity', 'openid-connect', 'active', 'dewa.okta.com', 'https://dewa.okta.com/oauth2/default', 443, true, NULL, 890, 35, '{"email": "email", "groups": "groups", "username": "preferred_username", "firstName": "given_name", "lastName": "family_name"}'::jsonb, '{"Transmission-Engineers": "engineer", "SCADA-Operators": "operator"}'::jsonb, now() - interval '30 minutes', 0),
    (v_tenant_id, 'Legacy LDAP - Maintenance', 'ldap', 'inactive', 'maint.internal.dewa', 'ldap://10.0.20.50', 636, true, 'ou=maintenance,dc=internal,dc=dewa', 0, 0, '{}'::jsonb, '{}'::jsonb, NULL, 3),
    (v_tenant_id, 'Contractor Portal SSO', 'oauth2', 'testing', 'contractors.dewa.ae', 'https://auth.contractors.dewa.ae/oauth/authorize', 443, true, NULL, 150, 8, '{"email": "email", "username": "sub"}'::jsonb, '{"approved-contractors": "contractor", "security-cleared": "privileged-contractor"}'::jsonb, now() - interval '5 hours', 1),
    (v_tenant_id, 'Azure AD - Corporate', 'azure-ad', 'active', 'dewacorp.onmicrosoft.com', 'https://login.microsoftonline.com/dewacorp.onmicrosoft.com', 443, true, 'dc=dewacorp,dc=onmicrosoft,dc=com', 2100, 67, '{"email": "mail", "groups": "memberOf", "username": "userPrincipalName", "firstName": "givenName", "lastName": "surname"}'::jsonb, '{"Corporate-IT": "it-admin", "Security-Team": "security-analyst"}'::jsonb, now() - interval '15 minutes', 0),
    (v_tenant_id, 'Google Workspace Identity', 'saml', 'pending', 'dewa.ae', 'https://accounts.google.com/o/saml2/idp', 443, true, NULL, 0, 0, '{"email": "email", "username": "email"}'::jsonb, '{}'::jsonb, NULL, 0),
    (v_tenant_id, 'Emergency Backup LDAP', 'ldap', 'active', 'backup.dewa.local', 'ldaps://10.0.30.200', 636, true, 'dc=backup,dc=dewa,dc=local', 1250, 45, '{"email": "mail", "username": "uid", "firstName": "givenName", "lastName": "sn"}'::jsonb, '{"Emergency-Access": "emergency-operator"}'::jsonb, now() - interval '4 hours', 0)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- SECTION 3: MFA & SESSION RULES
    -- ============================================

    -- Add 12 more MFA rules
    INSERT INTO mfa_rules (
        tenant_id, name, description, status, priority, conditions,
        requirements, enforcement, created_by
    ) VALUES
    (v_tenant_id, 'Field Engineer Remote Access', 'MFA for field engineers accessing from remote locations', 'active', 3, '{"userRoles": ["field-engineer"], "accessType": ["remote"], "resourceTypes": ["rtu", "field-device"]}'::jsonb, '{"mfaMethods": ["totp", "sms"], "mfaRequired": true, "requireReauth": false, "sessionTimeout": 120, "maxConcurrentSessions": 3}'::jsonb, 'moderate', 'security-policy-admin@dewa.gov.ae'),
    (v_tenant_id, 'After-Hours Access', 'Enhanced MFA for non-business hours access', 'active', 4, '{"timeRange": ["22:00-06:00"], "userRoles": ["operator", "engineer", "maintenance"]}'::jsonb, '{"mfaMethods": ["totp", "hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 20, "sessionTimeout": 45}'::jsonb, 'strict', 'security-policy-admin@dewa.gov.ae'),
    (v_tenant_id, 'Vendor Contractor Access', 'MFA requirements for external contractors', 'active', 5, '{"userRoles": ["contractor", "vendor"], "resourceTypes": ["any"]}'::jsonb, '{"mfaMethods": ["hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 15, "sessionTimeout": 30, "maxConcurrentSessions": 1}'::jsonb, 'strict', 'security-policy-admin@dewa.gov.ae'),
    (v_tenant_id, 'Read-Only Access Exemption', 'Relaxed MFA for read-only monitoring', 'active', 10, '{"userRoles": ["viewer", "auditor"], "permissions": ["read"]}'::jsonb, '{"mfaMethods": ["totp"], "mfaRequired": false, "sessionTimeout": 480, "maxConcurrentSessions": 5}'::jsonb, 'moderate', 'security-policy-admin@dewa.gov.ae'),
    (v_tenant_id, 'Sensitive Zone Access', 'MFA for safety-critical zone access', 'active', 1, '{"zones": ["safety-system"], "userRoles": ["any"]}'::jsonb, '{"mfaMethods": ["hardware-token", "totp"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 10, "sessionTimeout": 20, "maxConcurrentSessions": 1}'::jsonb, 'strict', 'chief-security-officer@dewa.gov.ae'),
    (v_tenant_id, 'Mobile Device Access', 'MFA for mobile app access', 'active', 6, '{"deviceType": ["mobile"], "userRoles": ["operator", "supervisor"]}'::jsonb, '{"mfaMethods": ["biometric", "totp"], "mfaRequired": true, "requireReauth": false, "sessionTimeout": 60, "maxConcurrentSessions": 2}'::jsonb, 'moderate', 'security-policy-admin@dewa.gov.ae'),
    (v_tenant_id, 'Emergency Override', 'Relaxed MFA during grid emergencies', 'inactive', 15, '{"emergencyMode": true}'::jsonb, '{"mfaMethods": ["totp", "sms"], "mfaRequired": false, "sessionTimeout": 240}'::jsonb, 'audit-only', 'emergency-coordinator@dewa.gov.ae'),
    (v_tenant_id, 'High Risk User Access', 'Enhanced MFA for users with elevated privileges', 'active', 2, '{"userRoles": ["administrator", "security-admin", "privileged-user"], "resourceTypes": ["any"]}'::jsonb, '{"mfaMethods": ["hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 30, "sessionTimeout": 60, "maxConcurrentSessions": 2}'::jsonb, 'strict', 'chief-security-officer@dewa.gov.ae'),
    (v_tenant_id, 'API Access Authentication', 'MFA for programmatic API access', 'active', 7, '{"accessType": ["api"], "userRoles": ["service-account", "integration"]}'::jsonb, '{"mfaMethods": ["api-key", "certificate"], "mfaRequired": true, "tokenLifetime": 3600}'::jsonb, 'strict', 'api-admin@dewa.gov.ae'),
    (v_tenant_id, 'Training Environment Access', 'Relaxed MFA for training systems', 'active', 12, '{"environment": ["training", "sandbox"]}'::jsonb, '{"mfaMethods": ["totp"], "mfaRequired": false, "sessionTimeout": 480}'::jsonb, 'audit-only', 'training-coordinator@dewa.gov.ae'),
    (v_tenant_id, 'Backup Operator Access', 'MFA for backup and recovery operations', 'active', 8, '{"userRoles": ["backup-operator"], "resourceTypes": ["backup-system"]}'::jsonb, '{"mfaMethods": ["totp", "hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 45, "sessionTimeout": 90}'::jsonb, 'moderate', 'backup-admin@dewa.gov.ae'),
    (v_tenant_id, 'Audit Trail Review', 'Audit-only MFA tracking for compliance', 'testing', 14, '{"userRoles": ["auditor"], "resourceTypes": ["audit-log"]}'::jsonb, '{"mfaMethods": ["any"], "mfaRequired": false, "sessionTimeout": 600}'::jsonb, 'audit-only', 'compliance-officer@dewa.gov.ae')
    ON CONFLICT DO NOTHING;

    -- Add 15 session rules
    INSERT INTO session_rules (
        tenant_id, name, description, status, session_type, max_duration,
        idle_timeout, max_concurrent_sessions, allowed_locations, allowed_ip_ranges,
        device_restrictions, active_sessions, enforcement_level
    ) VALUES
    (v_tenant_id, 'Standard Operator Sessions', 'Regular SCADA operator session limits', 'active', 'interactive', 480, 30, 2, ARRAY['Main Control Center', 'Backup Control Center'], ARRAY['192.168.10.0/24', '10.10.0.0/16'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}'::jsonb, 28, 'strict'),
    (v_tenant_id, 'Engineer Diagnostic Sessions', 'Extended sessions for engineering diagnostics', 'active', 'interactive', 720, 60, 3, ARRAY['Engineering Lab', 'Test Facility', 'Remote VPN'], ARRAY['192.168.20.0/24', '10.20.0.0/16'], '{"allowMobile": true, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}'::jsonb, 12, 'moderate'),
    (v_tenant_id, 'Contractor Limited Access', 'Restricted sessions for contractor access', 'active', 'interactive', 240, 15, 1, ARRAY['Contractor Access Zone'], ARRAY['172.16.100.0/24'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true, "requireApproval": true}'::jsonb, 5, 'strict'),
    (v_tenant_id, 'API Service Sessions', 'Automated system integration sessions', 'active', 'api', 120, 30, 50, ARRAY['Data Center'], ARRAY['10.30.0.0/16'], '{"allowMobile": false, "allowDesktop": false, "requireRegistration": false, "requireEncryption": true}'::jsonb, 43, 'moderate'),
    (v_tenant_id, 'Mobile Monitoring Access', 'Mobile app monitoring sessions', 'active', 'mobile', 120, 10, 1, ARRAY['Any'], ARRAY['0.0.0.0/0'], '{"allowMobile": true, "allowDesktop": false, "requireRegistration": true, "requireEncryption": true, "requireBiometric": true}'::jsonb, 18, 'strict'),
    (v_tenant_id, 'Emergency Response Sessions', 'Extended sessions during emergencies', 'active', 'emergency', 1440, 120, 5, ARRAY['Any'], ARRAY['0.0.0.0/0'], '{"allowMobile": true, "allowDesktop": true, "requireRegistration": false, "requireEncryption": true}'::jsonb, 0, 'audit-only'),
    (v_tenant_id, 'Maintenance Window Sessions', 'Scheduled maintenance access windows', 'active', 'maintenance', 360, 45, 4, ARRAY['Maintenance Facility', 'Site Access'], ARRAY['192.168.30.0/24'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}'::jsonb, 7, 'moderate'),
    (v_tenant_id, 'Read-Only Viewer Sessions', 'Extended sessions for monitoring staff', 'active', 'interactive', 600, 90, 5, ARRAY['Control Room', 'Operations Center'], ARRAY['192.168.40.0/24'], '{"allowMobile": true, "allowDesktop": true, "requireRegistration": true, "requireEncryption": false}'::jsonb, 15, 'moderate'),
    (v_tenant_id, 'Training Environment Sessions', 'Training system access sessions', 'active', 'training', 480, 60, 10, ARRAY['Training Center'], ARRAY['192.168.50.0/24'], '{"allowMobile": true, "allowDesktop": true, "requireRegistration": false, "requireEncryption": false}'::jsonb, 8, 'audit-only'),
    (v_tenant_id, 'Privileged Admin Sessions', 'Highly restricted admin access', 'active', 'privileged', 120, 15, 1, ARRAY['Secure Admin Zone'], ARRAY['10.0.1.0/24'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true, "requireHardening": true}'::jsonb, 3, 'strict'),
    (v_tenant_id, 'Audit Review Sessions', 'Compliance audit access sessions', 'active', 'audit', 480, 60, 3, ARRAY['Audit Office', 'Remote Audit'], ARRAY['192.168.60.0/24'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}'::jsonb, 2, 'moderate'),
    (v_tenant_id, 'Backup System Access', 'Backup and recovery system sessions', 'active', 'maintenance', 240, 30, 2, ARRAY['Backup Facility'], ARRAY['10.50.0.0/16'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}'::jsonb, 1, 'strict'),
    (v_tenant_id, 'Reporting Dashboard Sessions', 'Business intelligence dashboard access', 'active', 'interactive', 480, 60, 5, ARRAY['HQ Office', 'Regional Office'], ARRAY['192.168.70.0/24'], '{"allowMobile": true, "allowDesktop": true, "requireRegistration": true, "requireEncryption": false}'::jsonb, 22, 'moderate'),
    (v_tenant_id, 'Guest Observer Sessions', 'Limited guest access for demonstrations', 'inactive', 'guest', 120, 30, 2, ARRAY['Demo Room'], ARRAY['192.168.80.0/24'], '{"allowMobile": false, "allowDesktop": true, "requireRegistration": false, "requireEncryption": false}'::jsonb, 0, 'audit-only'),
    (v_tenant_id, 'Cross-Region Sync Sessions', 'Inter-region data synchronization', 'active', 'api', 1440, 60, 10, ARRAY['Primary DC', 'Secondary DC'], ARRAY['10.100.0.0/16', '10.200.0.0/16'], '{"allowMobile": false, "allowDesktop": false, "requireRegistration": false, "requireEncryption": true}'::jsonb, 4, 'moderate')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- SECTION 4: SECURITY ALERTS
    -- ==========================================​==

    -- Add 40 security alerts with varied severities
    FOR i IN 1..40 LOOP
        INSERT INTO security_alerts (
            tenant_id, site_id, alert_type, severity, status, title, description,
            source_system, detection_method, priority_score
        ) VALUES (
            v_tenant_id,
            v_site_ids[1 + (i % array_length(v_site_ids, 1))],
            CASE (i % 6)
                WHEN 0 THEN 'unauthorized-access'
                WHEN 1 THEN 'anomaly-detected'
                WHEN 2 THEN 'configuration-change'
                WHEN 3 THEN 'vulnerability-found'
                WHEN 4 THEN 'compliance-violation'
                ELSE 'suspicious-traffic'
            END,
            CASE (i % 4)
                WHEN 0 THEN 'critical'
                WHEN 1 THEN 'high'
                WHEN 2 THEN 'medium'
                ELSE 'low'
            END,
            CASE (i % 5)
                WHEN 0 THEN 'new'
                WHEN 1 THEN 'acknowledged'
                WHEN 2 THEN 'in-progress'
                WHEN 3 THEN 'resolved'
                ELSE 'closed'
            END,
            CASE (i % 6)
                WHEN 0 THEN 'Unauthorized access attempt detected'
                WHEN 1 THEN 'Unusual network traffic pattern'
                WHEN 2 THEN 'Unauthorized configuration modification'
                WHEN 3 THEN 'Critical vulnerability CVE-2024-' || (10000 + i)
                WHEN 4 THEN 'IEC 62443 compliance violation'
                ELSE 'Suspicious SCADA protocol usage'
            END,
            'Alert ' || i || ' - ' || CASE (i % 3) WHEN 0 THEN 'Failed authentication from unknown IP' WHEN 1 THEN 'Protocol anomaly in DNP3 traffic' ELSE 'Firmware version mismatch detected' END,
            CASE (i % 4)
                WHEN 0 THEN 'IDS'
                WHEN 1 THEN 'SIEM'
                WHEN 2 THEN 'Asset Scanner'
                ELSE 'Firewall'
            END,
            CASE (i % 3)
                WHEN 0 THEN 'signature-based'
                WHEN 1 THEN 'anomaly-based'
                ELSE 'rule-based'
            END,
            CASE (i % 4) WHEN 0 THEN 95 WHEN 1 THEN 75 WHEN 2 THEN 50 ELSE 25 END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 5: COMPLIANCE & CONTROL COVERAGE
    -- ============================================

    -- Add 4 compliance standards
    INSERT INTO compliance_standards (tenant_id, standard_name, standard_version, description, effective_date, review_frequency, status) VALUES
    (v_tenant_id, 'IEC 62443', 'v4.0', 'Industrial automation and control systems security', '2018-01-01', 365, 'active'),
    (v_tenant_id, 'NERC CIP', 'v7', 'Critical Infrastructure Protection for bulk electric systems', '2020-07-01', 365, 'active'),
    (v_tenant_id, 'IEC 61850-90-5', 'Edition 2.0', 'Security and communication for power utility automation', '2022-01-01', 365, 'active'),
    (v_tenant_id, 'ISO 27001', '2022', 'Information security management systems', '2022-10-01', 365, 'active')
    ON CONFLICT DO NOTHING;

    -- Add 60 security controls across standards
    FOR i IN 1..60 LOOP
        INSERT INTO security_controls (
            tenant_id, standard_id, control_id, control_name, control_description,
            control_category, implementation_status, effectiveness, gap_severity,
            remediation_status, remediation_owner, validation_method
        )
        SELECT
            v_tenant_id,
            cs.id,
            CASE (i % 4)
                WHEN 0 THEN 'IEC-62443-' || (i % 20 + 1)
                WHEN 1 THEN 'CIP-' || LPAD((i % 15 + 1)::text, 3, '0')
                WHEN 2 THEN 'IEC-61850-' || (i % 10 + 1)
                ELSE 'ISO-27001-A.' || (i % 14 + 1)
            END,
            'Control ' || i || ': ' || CASE (i % 5) WHEN 0 THEN 'Access Control' WHEN 1 THEN 'Network Segmentation' WHEN 2 THEN 'Audit Logging' WHEN 3 THEN 'Encryption' ELSE 'Monitoring' END,
            'Security control ' || i || ' description and requirements',
            CASE (i % 6) WHEN 0 THEN 'access-control' WHEN 1 THEN 'network-security' WHEN 2 THEN 'audit-logging' WHEN 3 THEN 'encryption' WHEN 4 THEN 'monitoring' ELSE 'incident-response' END,
            CASE (i % 3) WHEN 0 THEN 'implemented' WHEN 1 THEN 'partial' ELSE 'not-implemented' END,
            CASE (i % 4) WHEN 0 THEN 'effective' WHEN 1 THEN 'partially-effective' WHEN 2 THEN 'ineffective' ELSE 'not-assessed' END,
            CASE (i % 5) WHEN 0 THEN 'none' WHEN 1 THEN 'low' WHEN 2 THEN 'medium' WHEN 3 THEN 'high' ELSE 'critical' END,
            CASE (i % 4) WHEN 0 THEN 'completed' WHEN 1 THEN 'in-progress' WHEN 2 THEN 'planned' ELSE 'not-required' END,
            CASE (i % 3) WHEN 0 THEN 'Security Team' WHEN 1 THEN 'Operations Manager' ELSE 'IT Administrator' END,
            CASE (i % 3) WHEN 0 THEN 'automated-scan' WHEN 1 THEN 'manual-review' ELSE 'penetration-test' END
        FROM compliance_standards cs
        WHERE cs.tenant_id = v_tenant_id
        ORDER BY cs.created_at
        LIMIT 1
        OFFSET (i % 4)
        ON CONFLICT DO NOTHING;
    END LOOP;

    --Add 35 control coverage assessments
    FOR i IN 1..35 LOOP
        INSERT INTO control_coverage_assessments (
            tenant_id, assessment_name, standard_name, standard_version,
            assessment_date, assessor, status, coverage_score, maturity_level
        ) VALUES (
            v_tenant_id,
            'Assessment-' || i || ': ' || CASE (i % 4) WHEN 0 THEN 'IEC 62443' WHEN 1 THEN 'NERC CIP' WHEN 2 THEN 'IEC 61850-90-5' ELSE 'ISO 27001' END || ' Review',
            CASE (i % 4) WHEN 0 THEN 'IEC 62443' WHEN 1 THEN 'NERC CIP' WHEN 2 THEN 'IEC 61850-90-5' ELSE 'ISO 27001' END,
            CASE (i % 4) WHEN 0 THEN 'v4.0' WHEN 1 THEN 'v7' WHEN 2 THEN 'Edition 2.0' ELSE '2022' END,
            now() - ((i * 10) || ' days')::interval,
            CASE (i % 5) WHEN 0 THEN 'Security Team Lead' WHEN 1 THEN 'External Auditor' WHEN 2 THEN 'Compliance Officer' WHEN 3 THEN 'Chief Security Officer' ELSE 'Grid Operations Manager' END,
            CASE (i % 4) WHEN 0 THEN 'completed' WHEN 1 THEN 'in-progress' WHEN 2 THEN 'pending-review' ELSE 'approved' END,
            65 + (i % 30),
            CASE ((65 + (i % 30)) / 20) WHEN 0 THEN 'initial' WHEN 1 THEN 'developing' WHEN 2 THEN 'defined' WHEN 3 THEN 'managed' ELSE 'optimizing' END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 6: RISK & COMPLIANCE SUMMARIES
    -- ============================================

    -- Add 30 risk and compliance summaries
    FOR i IN 1..30 LOOP
        INSERT INTO risk_compliance_summaries (
            tenant_id, site_id, summary_name, compliance_domain, framework,
            maturity_level, compliance_score, risk_score, gap_count,
            critical_findings, high_findings, medium_findings, low_findings,
            last_assessment_date, next_review_date, status
        ) VALUES (
            v_tenant_id,
            v_site_ids[1 + (i % array_length(v_site_ids, 1))],
            'Risk Summary ' || i || ' - ' || CASE (i % 4) WHEN 0 THEN 'OT Security' WHEN 1 THEN 'Access Control' WHEN 2 THEN 'Network Security' ELSE 'Data Protection' END,
            CASE (i % 4) WHEN 0 THEN 'operational-technology' WHEN 1 THEN 'identity-access' WHEN 2 THEN 'network-security' ELSE 'data-protection' END,
            CASE (i % 5) WHEN 0 THEN 'IEC 62443' WHEN 1 THEN 'NERC CIP' WHEN 2 THEN 'ISO 27001' WHEN 3 THEN 'NIST CSF' ELSE 'IEC 61850' END,
            CASE (i % 5) WHEN 0 THEN 'initial' WHEN 1 THEN 'developing' WHEN 2 THEN 'defined' WHEN 3 THEN 'managed' ELSE 'optimizing' END,
            60 + (i % 35),
            40 + (i % 55),
            (i % 20),
            (i % 4),
            (i % 8),
            (i % 12),
            (i % 15),
            now() - ((i * 15) || ' days')::interval,
            now() + ((90 - i) || ' days')::interval,
            CASE (i % 3) WHEN 0 THEN 'current' WHEN 1 THEN 'needs-review' ELSE 'in-remediation' END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 7: VENDOR SECURITY ASSESSMENTS
    -- ============================================

    -- Add 30 vendor security assessments
    FOR i IN 1..30 LOOP
        INSERT INTO vendor_security_assessments (
            tenant_id, vendor_name, vendor_type, assessment_date, assessor,
            overall_score, security_posture,criticality_rating,
            data_access_level, compliance_validated, contract_expires,
            last_audit_date, next_audit_date, status, findings_count
        ) VALUES (
            v_tenant_id,
            CASE (i % 10)
                WHEN 0 THEN 'Siemens Energy'
                WHEN 1 THEN 'ABB Power Systems'
                WHEN 2 THEN 'Schneider Electric'
                WHEN 3 THEN 'GE Grid Solutions'
                WHEN 4 THEN 'Hitachi Energy'
                WHEN 5 THEN 'Emerson Automation'
                WHEN 6 THEN 'SEL Protection Systems'
                WHEN 7 THEN 'Cisco Industrial Networks'
                WHEN 8 THEN 'Fortinet OT Security'
                ELSE 'NovaTech Consulting'
            END || ' - Contract ' || i,
            CASE (i % 6) WHEN 0 THEN 'scada-vendor' WHEN 1 THEN 'relay-manufacturer' WHEN 2 THEN 'network-equipment' WHEN 3 THEN 'cybersecurity-consultant' WHEN 4 THEN 'it-service-provider' ELSE 'maintenance-contractor' END,
            now() - ((i * 20) || ' days')::interval,
            CASE (i % 4) WHEN 0 THEN 'Security Assessment Team' WHEN 1 THEN 'Third-Party Auditor' WHEN 2 THEN 'Procurement Office' ELSE 'Risk Management' END,
            55 + (i % 40),
            CASE ((55 + (i % 40)) / 20) WHEN 0 THEN 'inadequate' WHEN 1 THEN 'developing' WHEN 2 THEN 'adequate' WHEN 3 THEN 'strong' ELSE 'excellent' END,
            CASE (i % 5) WHEN 0 THEN 'mission-critical' WHEN 1 THEN 'high' WHEN 2 THEN 'medium' WHEN 3 THEN 'low' ELSE 'minimal' END,
            CASE (i % 4) WHEN 0 THEN 'full-scada-access' WHEN 1 THEN 'network-level' WHEN 2 THEN 'monitoring-only' ELSE 'no-network-access' END,
            (i % 2 = 0),
            now() + ((365 + i * 30) || ' days')::interval,
            now() - ((i * 30) || ' days')::interval,
            now() + ((180 - i * 5) || ' days')::interval,
            CASE (i % 4) WHEN 0 THEN 'approved' WHEN 1 THEN 'conditional' WHEN 2 THEN 'under-review' ELSE 'requires-remediation' END,
            (i % 15)
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 8: ACCESS POLICIES & RULES
    -- ============================================

    -- Add 25 access policies
    FOR i IN 1..25 LOOP
        INSERT INTO access_policies (
            tenant_id, name, description, policy_type, priority, status,
            enforcement_mode, applies_to, conditions, created_by, approved_by, approved_at
        ) VALUES (
            v_tenant_id,
            'Policy-' || LPAD(i::text, 3, '0') || ': ' || CASE (i % 5) WHEN 0 THEN 'Zone Access Control' WHEN 1 THEN 'Role-Based Protection' WHEN 2 THEN 'Asset-Level Security' WHEN 3 THEN 'Time-Restricted Access' ELSE 'Emergency Override' END,
            'Policy ' || i || ' - ' || CASE (i % 5) WHEN 0 THEN 'Enforce zone-based access restrictions' WHEN 1 THEN 'Role-based permission enforcement' WHEN 2 THEN 'Asset-specific access control' WHEN 3 THEN 'Time-windowed access permissions' ELSE 'Emergency access procedures' END,
            CASE (i % 5) WHEN 0 THEN 'zone-based' WHEN 1 THEN 'role-based' WHEN 2 THEN 'asset-based' WHEN 3 THEN 'time-based' ELSE 'emergency' END,
            i,
            CASE (i % 4) WHEN 0 THEN 'active' WHEN 1 THEN 'inactive' WHEN 2 THEN 'draft' ELSE 'active' END,
            CASE (i % 3) WHEN 0 THEN 'enforcing' WHEN 1 THEN 'audit-only' ELSE 'disabled' END,
            ARRAY['role:' || CASE (i % 5) WHEN 0 THEN 'operator' WHEN 1 THEN 'engineer' WHEN 2 THEN 'maintenance' WHEN 3 THEN 'supervisor' ELSE 'admin' END, 'zone:Zone-' || LPAD((i % 20)::text, 3, '0')],
            jsonb_build_object('minSecurityLevel', (i % 4), 'requireMFA', (i % 2 = 0), 'allowedHours', '06:00-22:00'),
            'security-admin@dewa.gov.ae',
            CASE WHEN i % 3 != 2 THEN 'chief-security-officer@dewa.gov.ae' ELSE NULL END,
            CASE WHEN i % 3 != 2 THEN now() - ((i * 5) || ' days')::interval ELSE NULL END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Add 50 access rules linked to policies
    FOR i IN 1..50 LOOP
        INSERT INTO access_rules (tenant_id, policy_id, rule_order, resource_type, actions, effect, conditions, time_start, time_end)
        SELECT
            v_tenant_id,
            ap.id,
            (i % 5) + 1,
            CASE (i % 6) WHEN 0 THEN 'scada-system' WHEN 1 THEN 'protection-relay' WHEN 2 THEN 'rtu' WHEN 3 THEN 'hmi' WHEN 4 THEN 'gateway' ELSE 'field-device' END,
            ARRAY[CASE (i % 4) WHEN 0 THEN 'read' WHEN 1 THEN 'write' WHEN 2 THEN 'execute' ELSE 'configure' END, 'monitor'],
            CASE (i % 10) WHEN 0 THEN 'deny' ELSE 'allow' END,
            jsonb_build_object('location', ARRAY['site-' || (i % 5)], 'ipRange', '192.168.' || (i % 255) || '.0/24'),
            CASE WHEN i % 3 = 0 THEN '08:00'::TIME ELSE NULL END,
            CASE WHEN i % 3 = 0 THEN '18:00'::TIME ELSE NULL END
        FROM access_policies ap
        WHERE ap.tenant_id = v_tenant_id
        ORDER BY ap.created_at
        LIMIT 1
        OFFSET (i % 25)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 9: PRIVILEGED ACCESS
    -- ============================================

    -- Add 18 privileged users
    FOR i IN 1..18 LOOP
        INSERT INTO privileged_users (
            tenant_id, user_id, username, email, privilege_level,
            granted_by, granted_at, expires_at, justification,
            mfa_enforced, approval_required, access_count
        ) VALUES (
            v_tenant_id,
            '00000000-0000-0000-0000-' || LPAD(i::text, 12, '0')::uuid,
            'priv_user_' || LPAD(i::text, 3, '0'),
            CASE (i % 6) WHEN 0 THEN 'senior.engineer' || i || '@dewa.gov.ae' WHEN 1 THEN 'grid.supervisor' || i || '@dewa.gov.ae' WHEN 2 THEN 'security.analyst' || i || '@dewa.gov.ae' WHEN 3 THEN 'sys.administrator' || i || '@dewa.gov.ae' WHEN 4 THEN 'audit.manager' || i || '@dewa.gov.ae' ELSE 'operations.lead' || i || '@dewa.gov.ae' END,
            CASE (i % 5) WHEN 0 THEN 'level-1-elevated' WHEN 1 THEN 'level-2-privileged' WHEN 2 THEN 'level-3-administrator' WHEN 3 THEN 'level-4-security-admin' ELSE 'level-5-super-admin' END,
            'chief-security-officer@dewa.gov.ae',
            now() - ((i * 20) || ' days')::interval,
            CASE WHEN i % 4 != 0 THEN now() + ((180 - i * 5) || ' days')::interval ELSE NULL END,
            CASE (i % 5) WHEN 0 THEN 'Advanced troubleshooting and system diagnostics' WHEN 1 THEN 'Grid operations supervision and emergency response' WHEN 2 THEN 'Security monitoring and incident investigation' WHEN 3 THEN 'System administration and configuration management' ELSE 'Compliance auditing and policy enforcement' END,
            true,
            (i % 3 = 0),
            (i * 89) % 500
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Add 25 privilege escalation events
    FOR i IN 1..25 LOOP
        INSERT INTO privilege_escalations (
            tenant_id, user_id, from_role, to_role, escalation_type,
            justification, requested_at, approved_by, approved_at,
            expires_at, status, duration_minutes
        ) VALUES (
            v_tenant_id,
            '00000000-0000-0000-0000-' || LPAD(((i % 18) + 1)::text, 12, '0')::uuid,
            CASE (i % 4) WHEN 0 THEN 'operator' WHEN 1 THEN 'engineer' WHEN 2 THEN 'supervisor' ELSE 'analyst' END,
            CASE (((i % 18) + 1) % 5) WHEN 0 THEN 'level-1-elevated' WHEN 1 THEN 'level-2-privileged' WHEN 2 THEN 'level-3-administrator' WHEN 3 THEN 'level-4-security-admin' ELSE 'level-5-super-admin' END,
            CASE (i % 3) WHEN 0 THEN 'temporary-elevation' WHEN 1 THEN 'emergency-access' ELSE 'scheduled-maintenance' END,
            CASE (i % 5) WHEN 0 THEN 'Emergency grid stabilization required' WHEN 1 THEN 'Critical system configuration update' WHEN 2 THEN 'Security incident investigation' WHEN 3 THEN 'Scheduled maintenance window' ELSE 'Vendor support escalation' END,
            now() - ((i * 8) || ' hours')::interval,
            CASE WHEN i % 4 != 0 THEN 'operations-manager@dewa.gov.ae' ELSE NULL END,
            CASE WHEN i % 4 != 0 THEN now() - ((i * 8 - 1) || ' hours')::interval ELSE NULL END,
            CASE WHEN i % 4 != 0 THEN now() + ((24 - i) || ' hours')::interval ELSE NULL END,
            CASE (i % 5) WHEN 0 THEN 'approved' WHEN 1 THEN 'active' WHEN 2 THEN 'expired' WHEN 3 THEN 'pending' ELSE 'revoked' END,
            CASE (i % 4) WHEN 0 THEN 60 WHEN 1 THEN 240 WHEN 2 THEN 480 ELSE 120 END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 10: SECRETS & CERTIFICATES
    -- ============================================

    -- Add 40 secrets and certificates
    FOR i IN 1..40 LOOP
        INSERT INTO secrets_certificates (
            tenant_id, name, description, secret_type, certificate_type,
            protocol, status, valid_from, valid_until,
            usage_count, rotation_policy, requires_approval, created_by
        ) VALUES (
            v_tenant_id,
            CASE (i % 8) WHEN 0 THEN 'SSL Certificate - ' || CASE (i % 4) WHEN 0 THEN 'SCADA HMI' WHEN 1 THEN 'Gateway' WHEN 2 THEN 'API Server' ELSE 'Web Portal' END || ' ' || i WHEN 1 THEN 'IEC 61850 Certificate - Substation ' || i WHEN 2 THEN 'DNP3 Secure Auth Key - RTU-' || i WHEN 3 THEN 'API Key - Integration-' || i WHEN 4 THEN 'Database Password - ' || CASE (i % 3) WHEN 0 THEN 'PostgreSQL' WHEN 1 THEN 'TimescaleDB' ELSE 'Redis' END || '-' || i WHEN 5 THEN 'Service Principal - ' || CASE (i % 3) WHEN 0 THEN 'Azure' WHEN 1 THEN 'AWS' ELSE 'GCP' END || '-' || i WHEN 6 THEN 'SSH Key - Server-' || i ELSE 'Shared Secret - Protocol-' || i END,
            CASE (i % 8) WHEN 0 THEN 'TLS/SSL certificate for encrypted web and SCADA communications' WHEN 1 THEN 'Digital certificate for IEC 61850 substation automation' WHEN 2 THEN 'Authentication key for DNP3 Secure Authentication' WHEN 3 THEN 'API key for third-party system integration' WHEN 4 THEN 'Database authentication credentials' WHEN 5 THEN 'Cloud service principal for automated operations' WHEN 6 THEN 'SSH authentication key for server access' ELSE 'Shared secret for protocol-level encryption' END,
            CASE (i % 8) WHEN 0 THEN 'certificate' WHEN 1 THEN 'certificate' WHEN 2 THEN 'shared_secret' WHEN 3 THEN 'api_key' WHEN 4 THEN 'password' WHEN 5 THEN 'service_principal' WHEN 6 THEN 'private_key' ELSE 'token' END,
            CASE (i % 8) WHEN 0 THEN 'ssl_tls' WHEN 1 THEN 'iec_61850' ELSE NULL END,
            CASE (i % 8) WHEN 0 THEN 'https' WHEN 1 THEN 'iec61850-mms' WHEN 2 THEN 'dnp3' WHEN 3 THEN 'rest-api' WHEN 6 THEN 'ssh' ELSE NULL END,
            CASE (i % 5) WHEN 0 THEN 'active' WHEN 1 THEN 'active' WHEN 2 THEN 'active' WHEN 3 THEN 'pending_rotation' ELSE 'expired' END,
            now() - ((365 + i * 10) || ' days')::interval,
            now() + ((365 - i * 15) || ' days')::interval,
            (i * 137) % 10000,
            CASE (i % 4) WHEN 0 THEN 'automatic-90-days' WHEN 1 THEN 'manual-annual' WHEN 2 THEN 'automatic-365-days' ELSE 'on-expiry' END,
            (i % 3 = 0),
            'security-admin@dewa.gov.ae'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ============================================
    -- SECTION 11: API KEYS & SERVICE PRINCIPALS
    -- ============================================

    -- Add 30 API keys
    FOR i IN 1..30 LOOP
        INSERT INTO api_keys (
            tenant_id, key_name, description, key_prefix, scope,
            permissions, status, expires_at, usage_count,
            rate_limit, created_by
        ) VALUES (
            v_tenant_id,
            'API-KEY-' || LPAD(i::text, 3, '0') || ': ' || CASE (i % 6) WHEN 0 THEN 'SCADA Integration' WHEN 1 THEN 'Mobile App Backend' WHEN 2 THEN 'Analytics Platform' WHEN 3 THEN 'External Reporting' WHEN 4 THEN 'IoT Device Management' ELSE 'Partner Integration' END,
            CASE (i % 6) WHEN 0 THEN 'API key for SCADA data exchange with external systems' WHEN 1 THEN 'Backend API access for mobile operator applications' WHEN 2 THEN 'Analytics platform data ingestion and query access' WHEN 3 THEN 'External stakeholder reporting and dashboard access' WHEN 4 THEN 'IoT field device provisioning and management' ELSE 'Third-party partner system integration' END,
            'ak_' || substring(md5(i::text), 1, 16),
            CASE (i % 5) WHEN 0 THEN 'read-only' WHEN 1 THEN 'read-write' WHEN 2 THEN 'write-only' WHEN 3 THEN 'admin' ELSE 'custom' END,
            ARRAY[CASE (i % 4) WHEN 0 THEN 'telemetry:read' WHEN 1 THEN 'alerts:write' WHEN 2 THEN 'assets:manage' ELSE 'config:read' END, 'system:health'],
            CASE (i % 5) WHEN 0 THEN 'active' WHEN 1 THEN 'active' WHEN 2 THEN 'active' WHEN 3 THEN 'suspended' ELSE 'expired' END,
            CASE WHEN i % 5 != 4 THEN now() + ((180 + i * 5) || ' days')::interval ELSE now() - ((i * 2) || ' days')::interval END,
            (i * 234) % 50000,
            CASE (i % 4) WHEN 0 THEN 1000 WHEN 1 THEN 5000 WHEN 2 THEN 10000 ELSE 100 END,
            'api-admin@dewa.gov.ae'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Add 20 service principals
    FOR i IN 1..20 LOOP
        INSERT INTO service_principals (
            tenant_id, principal_name, description, principal_type,
            application_id, status, permissions,
            expires_at, auth_count, created_by
        ) VALUES (
            v_tenant_id,
            'SP-' || LPAD(i::text, 3, '0') || ': ' || CASE (i % 5) WHEN 0 THEN 'Azure Functions App' WHEN 1 THEN 'AWS Lambda Integration' WHEN 2 THEN 'GCP Cloud Run Service' WHEN 3 THEN 'Backup Automation' ELSE 'Data Pipeline' END,
            CASE (i % 5) WHEN 0 THEN 'Service principal for Azure serverless function execution' WHEN 1 THEN 'AWS Lambda service identity for automated processing' WHEN 2 THEN 'Google Cloud Run containerized service principal' WHEN 3 THEN 'Automated backup and disaster recovery service' ELSE 'ETL data pipeline service account' END,
            CASE (i % 4) WHEN 0 THEN 'application' WHEN 1 THEN 'managed-identity' WHEN 2 THEN 'service-account' ELSE 'workload-identity' END,
            gen_random_uuid(),
            CASE (i % 4) WHEN 0 THEN 'active' WHEN 1 THEN 'active' WHEN 2 THEN 'disabled' ELSE 'active' END,
            ARRAY[CASE (i % 5) WHEN 0 THEN 'data:read' WHEN 1 THEN 'data:write' WHEN 2 THEN 'compute:execute' WHEN 3 THEN 'backup:manage' ELSE 'pipeline:run' END, 'logs:write'],
            now() + ((365 + i * 15) || ' days')::interval,
            (i * 456) % 100000,
            'devops-admin@dewa.gov.ae'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Comprehensive seed data expansion completed successfully!';
    RAISE NOTICE 'Added records for all 20 tables including newly created tables';
    
END $$;

COMMIT;
