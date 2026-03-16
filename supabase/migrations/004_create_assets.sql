-- Create assets table for physical/logical assets
-- Requirements: 3.4

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  asset_type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'online',   -- 'online', 'offline', 'maintenance'
  criticality TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_type ON assets(asset_type_id);
CREATE INDEX idx_assets_parent ON assets(parent_asset_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_criticality ON assets(criticality);