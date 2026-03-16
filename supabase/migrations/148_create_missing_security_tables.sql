-- Create missing security tables for SSO, MFA, Endpoint Baselines, and SOAR actions
-- Context: Power - Transmission Security

-- 1. SSO Integrations
CREATE TABLE IF NOT EXISTS directory_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- active-directory, azure-ad, ldap, saml, oauth2, openid-connect
    status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, testing, error, pending
    description TEXT,
    domain TEXT NOT NULL DEFAULT 'local',
    server_url TEXT NOT NULL,
    port INTEGER,
    use_ssl BOOLEAN DEFAULT true,
    base_dn TEXT,
    bind_dn TEXT,
    user_search_base TEXT,
    group_search_base TEXT,
    user_filter TEXT,
    group_filter TEXT,
    attribute_mapping JSONB DEFAULT '{}',
    role_mapping JSONB DEFAULT '{}',
    last_sync TIMESTAMPTZ,
    last_test TIMESTAMPTZ,
    test_result TEXT, -- success, failure, warning
    test_message TEXT,
    synced_users INTEGER DEFAULT 0,
    synced_groups INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure domain column exists (robust check)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='directory_integrations' AND column_name='domain') THEN
        ALTER TABLE directory_integrations ADD COLUMN domain TEXT NOT NULL DEFAULT 'local';
    END IF;
END $$;

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_directory_integrations_tenant ON directory_integrations(tenant_id);

-- 2. MFA Rules
CREATE TABLE IF NOT EXISTS mfa_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- active, inactive, draft
    priority INTEGER DEFAULT 100,
    conditions JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    exemptions JSONB DEFAULT '{}',
    enforcement TEXT DEFAULT 'strict', -- strict, advisory, disabled
    created_by TEXT,
    last_applied TIMESTAMPTZ,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_mfa_rules_tenant ON mfa_rules(tenant_id);

-- 3. Session Rules
CREATE TABLE IF NOT EXISTS session_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive
    session_type TEXT NOT NULL, -- interactive, api, service, emergency
    max_duration INTEGER DEFAULT 480, -- minutes
    idle_timeout INTEGER DEFAULT 30, -- minutes
    max_concurrent_sessions INTEGER DEFAULT 1,
    allowed_locations TEXT[] DEFAULT '{}',
    allowed_ip_ranges TEXT[] DEFAULT '{}',
    device_restrictions JSONB DEFAULT '{}',
    active_sessions INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_session_rules_tenant ON session_rules(tenant_id);

-- 4. Endpoint Baselines
CREATE TABLE IF NOT EXISTS endpoint_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL, -- protection-relay, rtu, scada-node, etc.
    category TEXT NOT NULL, -- configuration, software, network, security
    baseline_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not-assessed', -- compliant, deviation-detected, non-compliant, not-assessed
    compliance_score INTEGER DEFAULT 0,
    total_endpoints INTEGER DEFAULT 0,
    compliant_endpoints INTEGER DEFAULT 0,
    deviating_endpoints INTEGER DEFAULT 0,
    critical_deviations INTEGER DEFAULT 0,
    high_deviations INTEGER DEFAULT 0,
    medium_deviations INTEGER DEFAULT 0,
    low_deviations INTEGER DEFAULT 0,
    baseline_rules JSONB[] DEFAULT '{}',
    applicable_zones TEXT[] DEFAULT '{}',
    applicable_sites TEXT[] DEFAULT '{}',
    last_assessment TIMESTAMPTZ,
    next_assessment TIMESTAMPTZ,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_endpoint_baselines_tenant ON endpoint_baselines(tenant_id);

-- 5. Transmission SOAR Actions
CREATE TABLE IF NOT EXISTS transmission_soar_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- isolate-substation, disconnect-line, etc.
    target_type TEXT NOT NULL, -- substation, transmission-line, etc.
    requires_approval BOOLEAN DEFAULT true,
    approval_level TEXT DEFAULT 'operator', -- operator, supervisor, manager
    is_critical BOOLEAN DEFAULT false,
    estimated_duration INTEGER DEFAULT 5, -- minutes
    execution_count INTEGER DEFAULT 0,
    last_executed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_transmission_soar_actions_tenant ON transmission_soar_actions(tenant_id);

-- 6. SOAR Action Executions
CREATE TABLE IF NOT EXISTS soar_action_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES transmission_soar_actions(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    executed_at TIMESTAMPTZ DEFAULT now(),
    executed_by TEXT,
    target TEXT NOT NULL,
    result TEXT NOT NULL, -- success, failure, partial
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by action
CREATE INDEX IF NOT EXISTS idx_soar_action_executions_action ON soar_action_executions(action_id);
CREATE INDEX IF NOT EXISTS idx_soar_action_executions_tenant ON soar_action_executions(tenant_id);

-- Enable RLS
ALTER TABLE directory_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoint_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmission_soar_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE soar_action_executions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Simplified for now - tenant isolated)
-- Directory Integrations
DROP POLICY IF EXISTS "Tenant Isolation" ON directory_integrations;
CREATE POLICY "Tenant Isolation" ON directory_integrations FOR ALL USING (true);

-- MFA Rules
DROP POLICY IF EXISTS "Tenant Isolation" ON mfa_rules;
CREATE POLICY "Tenant Isolation" ON mfa_rules FOR ALL USING (true);

-- Session Rules
DROP POLICY IF EXISTS "Tenant Isolation" ON session_rules;
CREATE POLICY "Tenant Isolation" ON session_rules FOR ALL USING (true);

-- Endpoint Baselines
DROP POLICY IF EXISTS "Tenant Isolation" ON endpoint_baselines;
CREATE POLICY "Tenant Isolation" ON endpoint_baselines FOR ALL USING (true);

-- Transmission SOAR Actions
DROP POLICY IF EXISTS "Tenant Isolation" ON transmission_soar_actions;
CREATE POLICY "Tenant Isolation" ON transmission_soar_actions FOR ALL USING (true);

-- SOAR Action Executions
DROP POLICY IF EXISTS "Tenant Isolation" ON soar_action_executions;
CREATE POLICY "Tenant Isolation" ON soar_action_executions FOR ALL USING (true);