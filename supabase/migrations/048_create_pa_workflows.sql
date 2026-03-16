-- Migration: Create pa_workflows table
-- Description: Multi-step automated procedures
-- AC: 2.7.1-2.7.8

CREATE TABLE pa_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  execution_status TEXT NOT NULL DEFAULT 'idle' CHECK (execution_status IN ('idle', 'running', 'paused', 'completed', 'failed', 'draft')),
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_pa_workflows_tenant ON pa_workflows(tenant_id);
CREATE INDEX idx_pa_workflows_status ON pa_workflows(tenant_id, execution_status);

-- Triggers for updated_at
CREATE TRIGGER set_pa_workflows_updated_at
BEFORE UPDATE ON pa_workflows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
