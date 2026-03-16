-- Create lifecycle_states table for asset lifecycle stage definitions
-- Requirements: 1.6, 1.7

CREATE TABLE IF NOT EXISTS lifecycle_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_category TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, asset_category, name),
  UNIQUE(tenant_id, asset_category, order_index)
);

-- Create indexes for common queries
CREATE INDEX idx_lifecycle_states_tenant ON lifecycle_states(tenant_id);
CREATE INDEX idx_lifecycle_states_category ON lifecycle_states(asset_category);
