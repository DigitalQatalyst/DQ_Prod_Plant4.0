-- Create asset_types table for asset classification
-- Requirements: 3.3

CREATE TABLE asset_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,             -- 'TRANSFORMER', 'BREAKER', etc.
  name TEXT NOT NULL,
  category TEXT,
  properties_schema JSONB,        -- Optional JSON schema for properties
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Create indexes for common queries
CREATE INDEX idx_asset_types_tenant ON asset_types(tenant_id);
CREATE INDEX idx_asset_types_code ON asset_types(code);