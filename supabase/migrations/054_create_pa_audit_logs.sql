-- Process Automation: Audit Logs migration
CREATE TABLE pa_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout', 'alert', 'sync', 'config', 'import', 'export', 'error', 'recover')),
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  changes_before JSONB,
  changes_after JSONB,
  execution_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pa_audit_logs_tenant ON pa_audit_logs(tenant_id);
CREATE INDEX idx_pa_audit_logs_record ON pa_audit_logs(tenant_id, record_type, record_id);
CREATE INDEX idx_pa_audit_logs_event ON pa_audit_logs(tenant_id, event_type);
CREATE INDEX idx_pa_audit_logs_created ON pa_audit_logs(tenant_id, created_at DESC);
