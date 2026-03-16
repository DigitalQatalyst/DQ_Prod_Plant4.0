-- Create streams table
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE UNIQUE INDEX idx_streams_tenant_default 
  ON streams(tenant_id) WHERE is_default = true;

-- Create module_toggles table
CREATE TABLE module_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  feature_area TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  readiness_state TEXT,
  UNIQUE(tenant_id, stream_id, feature_area)
);

CREATE INDEX idx_module_toggles_tenant_stream 
  ON module_toggles(tenant_id, stream_id);

-- Create scope_defaults table
CREATE TABLE scope_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  default_site_ids UUID[],
  default_stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  default_dashboard_id UUID,
  UNIQUE(tenant_id, principal_type, principal_id)
);

CREATE INDEX idx_scope_defaults_tenant_principal 
  ON scope_defaults(tenant_id, principal_type, principal_id);
