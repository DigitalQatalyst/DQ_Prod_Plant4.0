/**
 * Seed Security Identity Data using Supabase Client
 * Populates directory integrations, access policies, sessions, API keys, service principals, and audit logs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate UUID
function generateId(prefix = '') {
    return `${prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

async function seedSecurityIdentityData() {
    console.log('🚀 Starting Security Identity Data Seeding...\n');

    try {
        // 1. Get tenant ID
        console.log('🔍 Finding Power Transmission tenant...');
        const { data: tenants, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name')
            .ilike('name', '%Transmission%')
            .limit(1);

        if (tenantError || !tenants || tenants.length === 0) {
            throw new Error('Power Transmission tenant not found');
        }

        const tenantId = tenants[0].id;
        console.log(`✅ Found tenant: ${tenants[0].name} (${tenantId})\n`);

        // 2. Get user IDs for references
        console.log('🔍 Finding security users...');
        const { data: users } = await supabase
            .from('security_users')
            .select('id, role')
            .eq('tenant_id', tenantId)
            .limit(4);

        const userIds = {
            operator: users?.find(u => u.role === 'operator')?.id || 'user-operator',
            engineer: users?.find(u => u.role === 'engineer')?.id || 'user-engineer',
            supervisor: users?.find(u => u.role === 'supervisor')?.id || 'user-supervisor',
            administrator: users?.find(u => u.role === 'administrator')?.id || 'user-admin'
        };
        console.log(`✅ Found ${users?.length || 0} users\n`);

        // 3. Seed Directory Integrations
        console.log('📁 Seeding Directory Integrations...');
        const { error: dirError } = await supabase
            .from('directory_integrations')
            .upsert([
                {
                    tenant_id: tenantId,
                    name: 'DEWA Azure AD',
                    type: 'azure-ad',
                    status: 'active',
                    description: 'Primary corporate identity provider for DEWA transmission network',
                    domain: 'dewa.gov.ae',
                    server_url: 'https://login.microsoftonline.com/dewa.onmicrosoft.com',
                    port: 443,
                    use_ssl: true,
                    base_dn: 'dc=dewa,dc=gov,dc=ae',
                    synced_users: 1250,
                    synced_groups: 45,
                    attribute_mapping: {
                        email: 'mail',
                        groups: 'memberOf',
                        username: 'userPrincipalName',
                        firstName: 'givenName',
                        lastName: 'sn'
                    },
                    role_mapping: {
                        'CN=Trans-Operators,OU=Groups,DC=dewa': 'operator',
                        'CN=Trans-Engineers,OU=Groups,DC=dewa': 'engineer',
                        'CN=Trans-Admins,OU=Groups,DC=dewa': 'administrator'
                    },
                    error_count: 0,
                    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    tenant_id: tenantId,
                    name: 'SCADA Operations SSO',
                    type: 'saml',
                    status: 'active',
                    description: 'SCADA system single sign-on integration',
                    domain: 'scada.dewa.gov.ae',
                    server_url: 'https://scada.dewa.gov.ae/sso/saml',
                    port: 443,
                    use_ssl: true,
                    base_dn: 'ou=scada,dc=dewa,dc=gov,dc=ae',
                    synced_users: 156,
                    synced_groups: 8,
                    attribute_mapping: {
                        email: 'email',
                        groups: 'groups',
                        username: 'username'
                    },
                    role_mapping: {
                        'SCADA-Operators': 'operator',
                        'SCADA-Engineers': 'engineer'
                    },
                    error_count: 0,
                    last_sync: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
                }
            ], { onConflict: 'tenant_id,name' });

        if (dirError) console.error('⚠️  Directory Integrations error:', dirError.message);
        else console.log('✅ Directory Integrations seeded\n');

        // 4. Seed Access Policies
        console.log('🔐 Seeding Access Policies...');
        const policyIds = {
            operator: generateId('policy-'),
            engineer: generateId('policy-'),
            supervisor: generateId('policy-'),
            admin: generateId('policy-'),
            timeBased: generateId('policy-')
        };

        const { error: policyError } = await supabase
            .from('access_policies')
            .upsert([
                {
                    id: policyIds.operator,
                    tenant_id: tenantId,
                    name: 'Operator Access Policy',
                    description: 'Standard access policy for transmission system operators',
                    policy_type: 'role-based',
                    status: 'active',
                    priority: 100,
                    applies_to: ['operator'],
                    approved_by: 'admin.user',
                    approved_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'admin.user'
                },
                {
                    id: policyIds.engineer,
                    tenant_id: tenantId,
                    name: 'Engineer Access Policy',
                    description: 'Extended access policy for transmission engineers',
                    policy_type: 'role-based',
                    status: 'active',
                    priority: 200,
                    applies_to: ['engineer'],
                    approved_by: 'admin.user',
                    approved_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'admin.user'
                },
                {
                    id: policyIds.supervisor,
                    tenant_id: tenantId,
                    name: 'Supervisor Access Policy',
                    description: 'Supervisor access with critical operation approval capabilities',
                    policy_type: 'role-based',
                    status: 'active',
                    priority: 300,
                    applies_to: ['supervisor'],
                    approved_by: 'admin.user',
                    approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'admin.user'
                },
                {
                    id: policyIds.admin,
                    tenant_id: tenantId,
                    name: 'Administrator Full Access',
                    description: 'Complete system access for transmission network administrators',
                    policy_type: 'role-based',
                    status: 'active',
                    priority: 400,
                    applies_to: ['administrator'],
                    approved_by: 'admin.user',
                    approved_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'admin.user'
                },
                {
                    id: policyIds.timeBased,
                    tenant_id: tenantId,
                    name: 'Business Hours Access Policy',
                    description: 'Time-restricted access policy for non-emergency operations',
                    policy_type: 'time-based',
                    status: 'active',
                    priority: 150,
                    applies_to: ['operator', 'engineer'],
                    approved_by: 'admin.user',
                    approved_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'admin.user'
                }
            ], { onConflict: 'id' });

        if (policyError) console.error('⚠️  Access Policies error:', policyError.message);
        else console.log('✅ Access Policies seeded\n');

        // 5. Seed Access Rules
        console.log('📋 Seeding Access Rules...');
        const { error: rulesError } = await supabase
            .from('access_rules')
            .upsert([
                {
                    id: generateId('rule-'),
                    tenant_id: tenantId,
                    policy_id: policyIds.operator,
                    rule_order: 1,
                    effect: 'allow',
                    actions: ['read', 'execute'],
                    resource_type: 'asset',
                    zone_types: ['level-1', 'level-2'],
                    security_levels: [1, 2],
                    conditions: {}
                },
                {
                    id: generateId('rule-'),
                    tenant_id: tenantId,
                    policy_id: policyIds.engineer,
                    rule_order: 1,
                    effect: 'allow',
                    actions: ['read', 'write', 'execute'],
                    resource_type: 'asset',
                    zone_types: ['level-1', 'level-2', 'level-3'],
                    security_levels: [1, 2, 3],
                    conditions: {}
                },
                {
                    id: generateId('rule-'),
                    tenant_id: tenantId,
                    policy_id: policyIds.timeBased,
                    rule_order: 1,
                    effect: 'allow',
                    actions: ['read', 'write'],
                    time_start: '07:00',
                    time_end: '19:00',
                    conditions: { businessHoursOnly: true, timezone: 'Asia/Dubai' }
                }
            ], { onConflict: 'id' });

        if (rulesError) console.error('⚠️  Access Rules error:', rulesError.message);
        else console.log('✅ Access Rules seeded\n');

        // 6. Seed Privileged Access Sessions
        console.log('🔑 Seeding Privileged Access Sessions...');
        const { error: sessionsError } = await supabase
            .from('privileged_access_sessions')
            .upsert([
                {
                    id: generateId('session-'),
                    tenant_id: tenantId,
                    user_id: userIds.engineer,
                    session_type: 'emergency',
                    target_resource_type: 'substation',
                    target_resource_id: 'sub-jebel-ali-main',
                    requested_actions: ['read', 'write', 'execute'],
                    approved_actions: ['read', 'write'],
                    requested_by: 'sarah.engineer',
                    approved_by: 'mike.supervisor',
                    request_reason: 'Emergency maintenance required for protection relay fault',
                    approval_reason: 'Approved for critical system recovery',
                    status: 'active',
                    requested_start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    requested_end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                    actual_start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    is_emergency: true,
                    emergency_justification: 'Critical protection relay failure - immediate intervention required',
                    session_log: []
                },
                {
                    id: generateId('session-'),
                    tenant_id: tenantId,
                    user_id: userIds.engineer,
                    session_type: 'maintenance',
                    target_resource_type: 'scada-node',
                    target_resource_id: 'scada-dubai-central',
                    requested_actions: ['read', 'write', 'execute'],
                    approved_actions: ['read', 'write', 'execute'],
                    requested_by: 'sarah.engineer',
                    approved_by: 'mike.supervisor',
                    request_reason: 'Scheduled firmware update for SCADA node',
                    approval_reason: 'Approved - maintenance window scheduled',
                    status: 'approved',
                    requested_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    requested_end: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
                    is_emergency: false,
                    session_log: []
                },
                {
                    id: generateId('session-'),
                    tenant_id: tenantId,
                    user_id: userIds.engineer,
                    session_type: 'investigation',
                    target_resource_type: 'transmission-line',
                    target_resource_id: 'line-dubai-abudhabi-132kv',
                    requested_actions: ['read'],
                    approved_actions: ['read'],
                    requested_by: 'john.investigator',
                    approved_by: 'mike.supervisor',
                    request_reason: 'Investigation of power flow anomaly',
                    approval_reason: 'Approved for read-only investigation',
                    status: 'completed',
                    requested_start: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                    requested_end: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
                    actual_start: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                    actual_end: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
                    is_emergency: false,
                    session_log: [{ timestamp: new Date().toISOString(), action: 'viewed_telemetry' }]
                },
                {
                    id: generateId('session-'),
                    tenant_id: tenantId,
                    user_id: userIds.operator,
                    session_type: 'routine',
                    target_resource_type: 'protection-relay',
                    target_resource_id: 'relay-gis-bay-7',
                    requested_actions: ['read', 'execute'],
                    requested_by: 'john.operator',
                    request_reason: 'Routine breaker operation test',
                    status: 'pending',
                    requested_start: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                    requested_end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
                    is_emergency: false,
                    session_log: []
                }
            ], { onConflict: 'id' });

        if (sessionsError) console.error('⚠️  Privileged Sessions error:', sessionsError.message);
        else console.log('✅ Privileged Access Sessions seeded\n');

        // 7. Seed API Keys
        console.log('🔑 Seeding API Keys...');
        const { error: apiKeysError } = await supabase
            .from('api_keys')
            .upsert([
                {
                    tenant_id: tenantId,
                    name: 'SCADA Integration Key',
                    description: 'Primary API key for SCADA system data integration',
                    key_hash: 'scada_' + Math.random().toString(36).substring(2, 50),
                    permissions: ['read:telemetry', 'write:commands', 'read:assets'],
                    scope: 'transmission:scada',
                    owner_user_id: userIds.administrator,
                    status: 'active',
                    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                    last_used: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    usage_count: 25847
                },
                {
                    tenant_id: tenantId,
                    name: 'Monitoring System API',
                    description: 'API key for external monitoring and alerting system',
                    key_hash: 'monitor_' + Math.random().toString(36).substring(2, 50),
                    permissions: ['read:alerts', 'read:telemetry', 'read:assets'],
                    scope: 'transmission:monitoring',
                    owner_user_id: userIds.administrator,
                    status: 'active',
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    last_used: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    usage_count: 18932
                },
                {
                    tenant_id: tenantId,
                    name: 'Reporting Service Key',
                    description: 'API key for automated reporting and analytics service',
                    key_hash: 'report_' + Math.random().toString(36).substring(2, 50),
                    permissions: ['read:telemetry', 'read:assets', 'read:alerts', 'read:logs'],
                    scope: 'transmission:reporting',
                    owner_user_id: userIds.supervisor,
                    status: 'active',
                    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                    last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    usage_count: 5632
                }
            ], { onConflict: 'tenant_id,name' });

        if (apiKeysError) console.error('⚠️  API Keys error:', apiKeysError.message);
        else console.log('✅ API Keys seeded\n');

        // 8. Seed Service Principals
        console.log('👤 Seeding Service Principals...');
        const { error: principalsError } = await supabase
            .from('service_principals')
            .upsert([
                {
                    tenant_id: tenantId,
                    name: 'SCADA Master System',
                    description: 'Service principal for primary SCADA master system authentication',
                    principal_type: 'application',
                    client_id: 'scada-master-' + Math.random().toString(36).substring(2, 18),
                    client_secret_hash: 'secret_' + Math.random().toString(36).substring(2, 50),
                    permissions: ['scada:control', 'asset:read', 'asset:write', 'telemetry:read', 'telemetry:write'],
                    scope: 'transmission:scada:master',
                    owner_user_id: userIds.administrator,
                    status: 'active',
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    last_authenticated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    authentication_count: 48291
                },
                {
                    tenant_id: tenantId,
                    name: 'External Monitoring Service',
                    description: 'Service principal for third-party monitoring platform integration',
                    principal_type: 'service',
                    client_id: 'monitor-svc-' + Math.random().toString(36).substring(2, 18),
                    client_secret_hash: 'secret_' + Math.random().toString(36).substring(2, 50),
                    permissions: ['alert:read', 'telemetry:read', 'asset:read'],
                    scope: 'transmission:monitoring:external',
                    owner_user_id: userIds.supervisor,
                    status: 'active',
                    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                    last_authenticated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    authentication_count: 12458
                }
            ], { onConflict: 'tenant_id,name' });

        if (principalsError) console.error('⚠️  Service Principals error:', principalsError.message);
        else console.log('✅ Service Principals seeded\n');

        // 9. Seed Audit Log Entries
        console.log('📝 Seeding Audit Log Entries...');
        const auditEntries = [
            {
                tenant_id: tenantId,
                event_type: 'authentication',
                event_category: 'user_access',
                event_name: 'User Login',
                event_description: 'Operator successfully authenticated to transmission control system',
                severity: 'info',
                outcome: 'success',
                user_id: userIds.operator,
                username: 'john.operator',
                action_performed: 'login',
                target_type: 'user',
                target_id: userIds.operator,
                source_ip: '192.168.10.45',
                user_agent: 'Mozilla/5.0',
                additional_data: { authMethod: 'azure-ad', mfaUsed: true },
                requires_investigation: false,
                retention_category: 'standard',
                archived: false,
                event_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                processing_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                tenant_id: tenantId,
                event_type: 'policy_change',
                event_category: 'access_control',
                event_name: 'Access Policy Modified',
                event_description: 'Engineer access policy permissions updated',
                severity: 'warning',
                outcome: 'success',
                user_id: userIds.administrator,
                username: 'admin.user',
                action_performed: 'update_policy',
                target_type: 'policy',
                target_id: policyIds.engineer,
                source_ip: '192.168.10.100',
                user_agent: 'Mozilla/5.0',
                additional_data: { changes: { permissions: ['added: write:protection_settings'] } },
                requires_investigation: false,
                retention_category: 'compliance',
                archived: false,
                event_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                processing_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                tenant_id: tenantId,
                event_type: 'authentication',
                event_category: 'security_event',
                event_name: 'Failed Login',
                event_description: 'Multiple failed authentication attempts from external IP',
                severity: 'warning',
                outcome: 'failure',
                username: 'unknown.user',
                action_performed: 'login_attempt',
                target_type: 'user',
                source_ip: '203.45.67.89',
                user_agent: 'curl/7.88.1',
                additional_data: { attempts: 5, reason: 'invalid_credentials' },
                requires_investigation: true,
                retention_category: 'security',
                archived: false,
                event_timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                processing_timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
            },
            {
                tenant_id: tenantId,
                event_type: 'critical_operation',
                event_category: 'system_change',
                event_name: 'Protection Relay Configuration Change',
                event_description: 'Protection settings modified on critical relay',
                severity: 'critical',
                outcome: 'success',
                user_id: userIds.engineer,
                username: 'sarah.engineer',
                action_performed: 'modify_protection_settings',
                target_type: 'asset',
                target_id: 'relay-gis-bay-3',
                source_ip: '192.168.10.58',
                user_agent: 'SCADA-Client/8.2',
                additional_data: { relay: 'GIS-BAY-3', setting: 'overcurrent_pickup', old_value: '1.2A', new_value: '1.5A' },
                requires_investigation: false,
                retention_category: 'critical',
                archived: false,
                event_timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                processing_timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                tenant_id: tenantId,
                event_type: 'privileged_access',
                event_category: 'access_control',
                event_name: 'Privileged Session Requested',
                event_description: 'Engineer requested emergency access to substation',
                severity: 'warning',
                outcome: 'success',
                user_id: userIds.engineer,
                username: 'sarah.engineer',
                action_performed: 'request_privileged_access',
                target_type: 'session',
                target_id: 'session-emergency',
                source_ip: '192.168.10.58',
                user_agent: 'Mozilla/5.0',
                additional_data: { resource: 'sub-jebel-ali-main', reason: 'emergency_maintenance', isEmergency: true },
                requires_investigation: false,
                retention_category: 'compliance',
                archived: false,
                event_timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                processing_timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            }
        ];

        const { error: auditError } = await supabase
            .from('security_audit_log')
            .insert(auditEntries);

        if (auditError) console.error('⚠️  Audit Log error:', auditError.message);
        else console.log('✅ Audit Log Entries seeded\n');

        // 10. Verify all data
        console.log('\n🔍 Verifying seeded data...\n');
        const verifications = [
            { table: 'directory_integrations', name: 'Directory Integrations' },
            { table: 'access_policies', name: 'Access Policies' },
            { table: 'access_rules', name: 'Access Rules' },
            { table: 'privileged_access_sessions', name: 'Privileged Access Sessions' },
            { table: 'api_keys', name: 'API Keys' },
            { table: 'service_principals', name: 'Service Principals' },
            { table: 'security_audit_log', name: 'Audit Log Entries' }
        ];

        for (const verify of verifications) {
            const { count, error: countError } = await supabase
                .from(verify.table)
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (countError) {
                console.log(`❌ ${verify.name}: Error - ${countError.message}`);
            } else {
                console.log(`✅ ${verify.name}: ${count !== null ? count : 0} records`);
            }
        }

        console.log('\n🎉 Security identity data seeding completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open the application');
        console.log('   2. Navigate to Security → Identity & Access pages');
        console.log('   3. Verify data is displayed correctly on all 5 pages');

    } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedSecurityIdentityData();
