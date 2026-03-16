-- Process Automation: Approvals migration
CREATE TABLE pa_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  approver_list TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE(tenant_id, record_type, record_id)
);

CREATE INDEX idx_pa_approvals_tenant ON pa_approvals(tenant_id);
CREATE INDEX idx_pa_approvals_status ON pa_approvals(tenant_id, status);
