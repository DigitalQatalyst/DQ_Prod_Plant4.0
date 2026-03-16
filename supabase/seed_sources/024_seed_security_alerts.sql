-- Seed data for security_alerts
-- Requirements: 1.1, 1.2, 9.1

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_dubai_site_id UUID;
    v_jebel_site_id UUID;
    v_aweer_site_id UUID;
    v_mohammed_user_id UUID;
    v_sarah_user_id UUID;
    v_fatima_user_id UUID;
    v_omar_user_id UUID;
    v_transformer_asset_id UUID;
    v_breaker_asset_id UUID;
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    -- Get sites
    SELECT id INTO v_dubai_site_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id;
    SELECT id INTO v_jebel_site_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id;
    SELECT id INTO v_aweer_site_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id;
    
    -- Get users
    SELECT id INTO v_mohammed_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id;
    SELECT id INTO v_sarah_user_id FROM security_users WHERE username = 'sarah.alnuaimi' AND tenant_id = v_tenant_id;
    SELECT id INTO v_fatima_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id;
    SELECT id INTO v_omar_user_id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = v_tenant_id;
    
    -- Get assets
    SELECT id INTO v_transformer_asset_id FROM assets WHERE name = 'Jebel Ali T1 Main Transformer' AND site_id = v_jebel_site_id;
    SELECT id INTO v_breaker_asset_id FROM assets WHERE name = 'Jebel Ali 400kV Incomer CB' AND site_id = v_jebel_site_id;

    -- Insert Alerts
    INSERT INTO security_alerts (
        tenant_id, site_id, asset_id, title, description, severity, status, 
        category, detected_by, assigned_to, is_safety_critical, recommended_actions
    ) VALUES
    (
        v_tenant_id, v_jebel_site_id, v_transformer_asset_id, 
        'Unauthorized PLC Configuration Change', 
        'Attempted modification of PLC logic detected from an unauthorized engineering workstation.',
        'critical', 'new', 'access', 'OT-IDS-System', v_mohammed_user_id, true,
        ARRAY['Isolate workstation', 'Verify PLC logic hash', 'Check audit logs']
    ),
    (
        v_tenant_id, v_jebel_site_id, v_breaker_asset_id,
        'Malicious Network Traffic Detected',
        'Command injection attempt targeting circuit breaker control protocol detected on the local bus.',
        'high', 'acknowledged', 'network', 'Firewall-DPI', v_sarah_user_id, true,
        ARRAY['Check firewall rules', 'Enable aggressive packet filtering', 'Monitor asset telemetry']
    ),
    (
        v_tenant_id, v_dubai_site_id, NULL,
        'Brute Force Attempt on HMI',
        'Multiple failed login attempts detected on the Dubai Main Substation HMI interface from internal subnet.',
        'high', 'in-progress', 'access', 'LDAP-Auth-Monitor', v_fatima_user_id, false,
        ARRAY['Lock account', 'Verify source IP', 'Update HMI password policy']
    ),
    (
        v_tenant_id, v_aweer_site_id, NULL,
        'Insecure Protocol Usage',
        'Unencrypted Telnet traffic detected between regional hub and field gateway.',
        'medium', 'new', 'network', 'Network-Scanner', v_omar_user_id, false,
        ARRAY['Disable Telnet', 'Enable SSH', 'Update communication policies']
    ),
    (
        v_tenant_id, v_jebel_site_id, NULL,
        'Security Policy Violation',
        'Removable media (USB) detected on a restricted engineering station.',
        'low', 'new', 'policy', 'Endpoint-Security-Agent', v_mohammed_user_id, false,
        ARRAY['Confiscate media', 'Scan for malware', 'Review personnel security training']
    );

END $$;

COMMIT;
