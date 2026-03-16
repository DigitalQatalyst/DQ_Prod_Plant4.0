-- Create property_sets table for reusable metadata field collections
-- Requirements: 1.4, 1.5

CREATE TABLE IF NOT EXISTS property_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('technical', 'operational', 'safety', 'financial', 'maintenance')),
  fields JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create indexes for common queries
CREATE INDEX idx_property_sets_tenant ON property_sets(tenant_id);
CREATE INDEX idx_property_sets_type ON property_sets(type);
