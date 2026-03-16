-- Create pa_automation_alerts table for tracking automation events
-- Requirements: AC 2.15.1-2.15.7

CREATE TABLE IF NOT EXISTS pa_automation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('trigger_activation', 'workflow_failure', 'approval_required', 'system_error', 'threshold_breach')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'alarm', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source_entity_type TEXT,
  source_entity_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index for tenant sorting and filtering
CREATE INDEX IF NOT EXISTS idx_pa_alerts_tenant ON pa_automation_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pa_alerts_status ON pa_automation_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pa_alerts_created ON pa_automation_alerts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pa_alerts_severity ON pa_automation_alerts(tenant_id, severity);
