-- Create grid_nodes table for transmission network topology nodes
-- Requirements: 4.1

CREATE TABLE grid_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  node_type TEXT NOT NULL,        -- 'substation', 'junction', 'plant'
  voltage_kv DOUBLE PRECISION,
  region TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_grid_nodes_tenant ON grid_nodes(tenant_id);