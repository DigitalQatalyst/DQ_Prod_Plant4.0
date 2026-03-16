-- Create platform_health_checks table
CREATE TABLE platform_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, check_key)
);

CREATE INDEX idx_health_checks_tenant_enabled 
  ON platform_health_checks(tenant_id, enabled);

-- Create platform_health_findings table
CREATE TABLE platform_health_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  details JSONB,
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (tenant_id, check_key) 
    REFERENCES platform_health_checks(tenant_id, check_key) ON DELETE CASCADE
);

CREATE INDEX idx_health_findings_tenant_status_severity 
  ON platform_health_findings(tenant_id, status, severity);
CREATE INDEX idx_health_findings_tenant_check 
  ON platform_health_findings(tenant_id, check_key, status);
