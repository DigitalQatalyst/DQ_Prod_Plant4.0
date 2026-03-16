-- Create security_alerts table for cybersecurity specific alerts
-- Requirements: 1.1, 1.2, 9.1

-- Create enum types for security alerts if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_alert_severity') THEN
        CREATE TYPE security_alert_severity AS ENUM (
            'critical',
            'high',
            'medium',
            'low',
            'info'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_alert_status') THEN
        CREATE TYPE security_alert_status AS ENUM (
            'new',
            'acknowledged',
            'in-progress',
            'investigating',
            'resolved',
            'closed'
        );
    END IF;
END $$;

CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    severity security_alert_severity NOT NULL DEFAULT 'medium',
    status security_alert_status NOT NULL DEFAULT 'new',
    
    category TEXT, -- e.g., 'network', 'access', 'malware', 'policy'
    detected_by TEXT, -- tool or system name
    assigned_to UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    is_safety_critical BOOLEAN DEFAULT false,
    recommended_actions TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_security_alerts_tenant ON security_alerts(tenant_id);
CREATE INDEX idx_security_alerts_site ON security_alerts(site_id);
CREATE INDEX idx_security_alerts_asset ON security_alerts(asset_id);
CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- Enable RLS (Commented out as per plan)
-- ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Create update trigger
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_alerts_updated_at
    BEFORE UPDATE ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_security_alerts_updated_at();
