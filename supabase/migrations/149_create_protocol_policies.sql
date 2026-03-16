-- Create tables for Transmission Protocol Security
-- Requirements: 5.7, 7.3

-- 1. Protocol Security Policies Table
CREATE TABLE IF NOT EXISTS transmission_protocol_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    protocol TEXT NOT NULL CHECK (protocol IN ('IEC-61850', 'DNP3', 'IEC-60870-5-104', 'Modbus-TCP', 'GOOSE', 'MMS', 'OPC-UA', 'MQTT')),
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('secure', 'at-risk', 'vulnerable', 'deprecated', 'view-only')),
    compliance_status TEXT CHECK (compliance_status IN ('compliant', 'partial', 'non-compliant', 'not-assessed')),
    
    -- Encryption Requirements
    encryption_required BOOLEAN DEFAULT false,
    encryption_strength TEXT CHECK (encryption_strength IN ('strong', 'adequate', 'weak', 'none')),
    encryption_algorithm TEXT,
    key_length INTEGER,
    certificate_required BOOLEAN DEFAULT false,
    mutual_auth_required BOOLEAN DEFAULT false,
    allowed_cipher_suites TEXT[],
    minimum_tls_version TEXT,
    
    -- Scope
    applicable_zones TEXT[],
    applicable_sites TEXT[],
    applicable_asset_types TEXT[],
    
    -- Metrics
    violation_count INTEGER DEFAULT 0,
    compliant_assets INTEGER DEFAULT 0,
    total_assets INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0, -- 0 to 100
    
    -- Metadata
    last_assessment TIMESTAMPTZ,
    next_assessment TIMESTAMPTZ,
    created_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Protocol Violations Table
CREATE TABLE IF NOT EXISTS protocol_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES transmission_protocol_policies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL, -- Logical reference to asset
    asset_name TEXT NOT NULL,
    asset_type TEXT,
    site_id TEXT,
    site_name TEXT,
    zone_id TEXT,
    zone_name TEXT,
    
    violation_type TEXT NOT NULL CHECK (violation_type IN ('encryption-disabled', 'weak-encryption', 'deprecated-version', 'certificate-expired', 'no-authentication', 'weak-cipher', 'protocol-mismatch', 'unauthorized-device')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
    description TEXT,
    
    status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'remediated', 'false-positive')),
    risk_score INTEGER,
    remediation_action TEXT,
    remediation_deadline TIMESTAMPTZ,
    
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    remediated_at TIMESTAMPTZ,
    assigned_to TEXT,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    
    compliance_impact TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Protocol Monitoring Table (for real-time dashboard)
CREATE TABLE IF NOT EXISTS protocol_monitoring_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    protocol TEXT NOT NULL,
    
    total_connections INTEGER DEFAULT 0,
    secure_connections INTEGER DEFAULT 0,
    insecure_connections INTEGER DEFAULT 0,
    encrypted_traffic_percent INTEGER DEFAULT 0,
    
    average_key_length INTEGER,
    certificate_expirations INTEGER DEFAULT 0,
    deprecated_versions INTEGER DEFAULT 0,
    active_violations INTEGER DEFAULT 0,
    
    compliance_score INTEGER DEFAULT 0,
    trend TEXT CHECK (trend IN ('improving', 'stable', 'degrading', 'unknown')),
    
    last_monitored TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_protocol_policies_tenant ON transmission_protocol_policies(tenant_id);
CREATE INDEX idx_protocol_violations_tenant ON protocol_violations(tenant_id);
CREATE INDEX idx_protocol_violations_policy ON protocol_violations(policy_id);
CREATE INDEX idx_protocol_monitoring_tenant ON protocol_monitoring_stats(tenant_id);

-- Add triggers for updated_at
CREATE TRIGGER update_transmission_protocol_policies_updated_at
    BEFORE UPDATE ON transmission_protocol_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocol_violations_updated_at
    BEFORE UPDATE ON protocol_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE transmission_protocol_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_monitoring_stats ENABLE ROW LEVEL SECURITY;

-- Policies for transmission_protocol_policies
CREATE POLICY "Tenant can view their own protocol policies"
    ON transmission_protocol_policies
    FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY "Tenant can manage their own protocol policies"
    ON transmission_protocol_policies
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- Policies for protocol_violations
CREATE POLICY "Tenant can view their own protocol violations"
    ON protocol_violations
    FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY "Tenant can manage their own protocol violations"
    ON protocol_violations
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- Policies for protocol_monitoring_stats
CREATE POLICY "Tenant can view their own protocol stats"
    ON protocol_monitoring_stats
    FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY "Tenant can manage their own protocol stats"
    ON protocol_monitoring_stats
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));
