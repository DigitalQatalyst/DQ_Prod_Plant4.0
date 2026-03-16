-- Seed data for missing security features
-- Context: Power - Transmission Security (DEWA)

BEGIN;

-- Capture or Create tenant ID
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- 0. Get or Create Tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1' LIMIT 1;
    
    -- Fallback to name search if tag search fails
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    END IF;

    -- Create if completely missing
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, sector, subsector, scenario_tag)
        VALUES ('DEWA - Transmission', 'power', 'transmission', 'power_transmission_demo_v1')
        RETURNING id INTO v_tenant_id;
        RAISE NOTICE 'Created new tenant with ID: %', v_tenant_id;
    END IF;

    -- 1. Directory Integrations
    INSERT INTO directory_integrations (tenant_id, name, type, status, domain, server_url, port, use_ssl, base_dn, synced_users, synced_groups, attribute_mapping, role_mapping)
    VALUES 
    (v_tenant_id, 'DEWA Azure AD', 'azure-ad', 'active', 'dewa.gov.ae', 'https://login.microsoftonline.com/dewa.onmicrosoft.com', 443, true, 'dc=dewa,dc=gov,dc=ae', 1250, 45, 
     '{"email": "mail", "groups": "memberOf", "username": "userPrincipalName", "firstName": "givenName", "lastName": "sn"}',
     '{"CN=Trans-Operators,OU=Groups,DC=dewa": "operator", "CN=Trans-Engineers,OU=Groups,DC=dewa": "engineer", "CN=Trans-Admins,OU=Groups,DC=dewa": "administrator"}'),
    (v_tenant_id, 'Local LDAP Directory', 'ldap', 'inactive', 'internal.local', 'ldap://10.0.5.10', 389, false, 'ou=transmission,dc=internal,dc=local', 0, 0, '{}', '{}')
    ON CONFLICT DO NOTHING;

    -- 2. MFA Rules
    INSERT INTO mfa_rules (tenant_id, name, description, status, priority, conditions, requirements, enforcement, created_by)
    VALUES 
    (v_tenant_id, 'Critical Operations MFA', 'Require MFA for all critical transmission operations', 'active', 1, 
     '{"userRoles": ["operator", "engineer"], "resourceTypes": ["transmission-control", "scada-command"]}',
     '{"mfaMethods": ["totp", "hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 15, "sessionTimeout": 30, "maxConcurrentSessions": 2}',
     'strict', 'security-admin@dewa.gov.ae'),
    (v_tenant_id, 'Administrative Access MFA', 'Enhanced MFA for administrative functions', 'active', 2,
     '{"userRoles": ["administrator", "security-admin"], "resourceTypes": ["system-config", "security-settings"]}',
     '{"mfaMethods": ["totp", "hardware-token"], "mfaRequired": true, "requireReauth": true, "reauthInterval": 30, "sessionTimeout": 60, "maxConcurrentSessions": 1}',
     'strict', 'security-admin@dewa.gov.ae')
     ON CONFLICT DO NOTHING;

    -- 3. Session Rules
    INSERT INTO session_rules (tenant_id, name, description, status, session_type, max_duration, idle_timeout, max_concurrent_sessions, allowed_locations, allowed_ip_ranges, device_restrictions, active_sessions)
    VALUES 
    (v_tenant_id, 'Interactive User Sessions', 'Standard rules for interactive access', 'active', 'interactive', 480, 30, 3, 
     ARRAY['Dubai Operations Center', 'Jebel Ali Control Room'], ARRAY['192.168.1.0/24', '10.0.0.0/16'],
     '{"allowMobile": true, "allowDesktop": true, "requireRegistration": true, "requireEncryption": true}', 45),
    (v_tenant_id, 'API Access Sessions', 'Rules for programmatic API access', 'active', 'api', 60, 15, 10,
     ARRAY['Internal VLAN'], ARRAY['192.168.100.0/24'],
     '{"allowMobile": false, "allowDesktop": true, "requireRegistration": false, "requireEncryption": true}', 12)
     ON CONFLICT DO NOTHING;

    -- 4. Endpoint Baselines
    INSERT INTO endpoint_baselines (tenant_id, name, description, asset_type, category, baseline_version, status, compliance_score, total_endpoints, compliant_endpoints, deviating_endpoints, critical_deviations, high_deviations, approved_by, approved_at)
    VALUES 
    (v_tenant_id, 'Protection Relay Security Baseline', 'Security hardening for protection relays', 'protection-relay', 'security', 'v1.2.0', 'compliant', 96, 45, 43, 2, 0, 1, 'Chief Security Officer', now() - interval '30 days'),
    (v_tenant_id, 'RTU Configuration Baseline', 'Standard configuration for Remote Terminal Units', 'rtu', 'configuration', 'v2.1.5', 'deviation-detected', 82, 30, 24, 6, 1, 2, 'Grid Operations Manager', now() - interval '15 days'),
    (v_tenant_id, 'SCADA Node Network Baseline', 'Network hardening for SCADA nodes', 'scada-node', 'network', 'v1.0.3', 'non-compliant', 65, 12, 8, 4, 2, 1, 'Security Manager', now() - interval '45 days')
    ON CONFLICT DO NOTHING;

    -- 5. Transmission SOAR Actions
    INSERT INTO transmission_soar_actions (id, tenant_id, name, description, type, target_type, requires_approval, approval_level, is_critical, execution_count, last_executed)
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, 'Isolate Compromised Substation', 'Automatically isolate a substation from the grid', 'isolate-substation', 'substation', true, 'supervisor', true, 3, now() - interval '10 days'),
    ('550e8400-e29b-41d4-a716-446655440002', v_tenant_id, 'Disconnect Transmission Line', 'Emergency disconnection of transmission line', 'disconnect-line', 'transmission-line', true, 'manager', true, 1, now() - interval '20 days'),
    ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, 'Block SCADA Access', 'Block unauthorized SCADA system access', 'block-scada-access', 'scada-system', false, 'operator', false, 12, now() - interval '2 days'),
    ('550e8400-e29b-41d4-a716-446655440004', v_tenant_id, 'Disable Protection Relay', 'Temporarily disable compromised protection relay', 'disable-relay', 'protection-relay', true, 'supervisor', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440005', v_tenant_id, 'Emergency System Shutdown', 'Controlled shutdown during major incident', 'emergency-shutdown', 'substation', true, 'manager', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, 'Backup System Configuration', 'Create emergency backup of configurations', 'backup-configuration', 'scada-system', false, 'operator', false, 25, now() - interval '1 day'),
    ('550e8400-e29b-41d4-a716-446655440007', v_tenant_id, 'Reset Communication Link', 'Reset compromised communication links', 'reset-communication', 'communication-link', false, 'operator', false, 8, now() - interval '5 days')
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        target_type = EXCLUDED.target_type,
        requires_approval = EXCLUDED.requires_approval,
        approval_level = EXCLUDED.approval_level,
        is_critical = EXCLUDED.is_critical;

    -- 6. SOAR Action Executions
    -- Clean and re-seed executions to avoid complex conflict handling on non-PK
    DELETE FROM soar_action_executions WHERE tenant_id = v_tenant_id;

    INSERT INTO soar_action_executions (action_id, tenant_id, executed_by, target, result, details)
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, NULL, 'Substation-A', 'success', 'Successfully isolated Substation-A following detected anomaly'),
    ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, NULL, 'SCADA-North-01', 'success', 'Blocked IP range 192.168.45.0/24'),
    ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, NULL, 'All Protection Nodes', 'success', 'Scheduled configuration backup completed');

END $$;

COMMIT;
