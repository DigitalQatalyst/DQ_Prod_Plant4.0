-- Create grid_lines table for transmission lines connecting nodes
-- Requirements: 4.2

CREATE TABLE grid_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  from_node_id UUID NOT NULL REFERENCES grid_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES grid_nodes(id) ON DELETE CASCADE,
  voltage_kv DOUBLE PRECISION,
  length_km DOUBLE PRECISION,
  status TEXT DEFAULT 'active',   -- 'active', 'maintenance', 'offline'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_grid_lines_tenant ON grid_lines(tenant_id);
CREATE INDEX idx_grid_lines_from ON grid_lines(from_node_id);
CREATE INDEX idx_grid_lines_to ON grid_lines(to_node_id);