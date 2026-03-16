-- Process Automation: Simulations migration
CREATE TABLE pa_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('workflow', 'trigger', 'sequence', 'control_rule', 'control_model', 'action_binding', 'alarm_rule')),
  target_id UUID NOT NULL,
  input_parameters JSONB NOT NULL,
  expected_outcome TEXT,
  actual_outcome TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_pa_simulations_tenant ON pa_simulations(tenant_id);
CREATE INDEX idx_pa_simulations_type ON pa_simulations(tenant_id, simulation_type);
CREATE INDEX idx_pa_simulations_status ON pa_simulations(tenant_id, status);
