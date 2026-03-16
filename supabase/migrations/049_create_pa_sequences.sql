-- Migration: Create pa_sequences table
-- Description: Detailed step-by-step procedures with precise timing
-- AC: 2.8.1-2.8.7

CREATE TABLE pa_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('sequential', 'parallel', 'conditional')),
  total_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'draft', 'testing')),
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_pa_sequences_tenant ON pa_sequences(tenant_id);
CREATE INDEX idx_pa_sequences_mode ON pa_sequences(tenant_id, execution_mode);

-- Triggers for updated_at
CREATE TRIGGER set_pa_sequences_updated_at
BEFORE UPDATE ON pa_sequences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
