-- Process Automation: Versions migration
CREATE TABLE pa_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('major', 'minor', 'patch')),
  description TEXT NOT NULL,
  affected_components JSONB NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'archived', 'draft')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  UNIQUE(tenant_id, version_number)
);

CREATE INDEX idx_pa_versions_tenant ON pa_versions(tenant_id);
CREATE INDEX idx_pa_versions_approval ON pa_versions(tenant_id, approval_status);
