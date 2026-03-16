-- Create operational_data table for automation workflows, alarm rules, and CI projects
-- This table stores operational configuration data for the demo

CREATE TABLE IF NOT EXISTS operational_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, data_type, name)
);

-- Create indexes for common queries
CREATE INDEX idx_operational_data_tenant ON operational_data(tenant_id);
CREATE INDEX idx_operational_data_type ON operational_data(data_type);
CREATE INDEX idx_operational_data_status ON operational_data(status);
