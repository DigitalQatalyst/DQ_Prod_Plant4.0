-- Create OT asset security table for transmission asset security metadata
-- Requirements: 3.2, 8.3

CREATE TABLE ot_asset_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES security_zones(id) ON DELETE SET NULL,
  criticality TEXT NOT NULL CHECK (criticality IN ('safety-critical', 'production-critical', 'high', 'medium', 'low')),
  security_status TEXT DEFAULT 'at-risk' CHECK (security_status IN ('secure', 'at-risk', 'vulnerable')),
  risk_score INTEGER DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  vulnerability_count INTEGER DEFAULT 0,
  patch_status TEXT DEFAULT 'pending' CHECK (patch_status IN ('up-to-date', 'pending', 'outdated')),
  network_exposure TEXT DEFAULT 'internal' CHECK (network_exposure IN ('internal', 'dmz', 'external')),
  last_security_scan TIMESTAMPTZ,
  firmware_version TEXT,
  manufacturer TEXT,
  model TEXT,
  in_safety_loop BOOLEAN DEFAULT false,
  high_pressure BOOLEAN DEFAULT false,
  open_alerts INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure one security record per asset
  CONSTRAINT unique_asset_security UNIQUE (tenant_id, asset_id)
);

-- Create indexes for common queries
CREATE INDEX idx_ot_asset_security_tenant ON ot_asset_security(tenant_id);
CREATE INDEX idx_ot_asset_security_asset ON ot_asset_security(asset_id);
CREATE INDEX idx_ot_asset_security_zone ON ot_asset_security(zone_id);
CREATE INDEX idx_ot_asset_security_criticality ON ot_asset_security(criticality);
CREATE INDEX idx_ot_asset_security_status ON ot_asset_security(security_status);
CREATE INDEX idx_ot_asset_security_risk_score ON ot_asset_security(risk_score);
CREATE INDEX idx_ot_asset_security_patch_status ON ot_asset_security(patch_status);
CREATE INDEX idx_ot_asset_security_network_exposure ON ot_asset_security(network_exposure);

-- Enable Row Level Security
-- ALTER TABLE ot_asset_security ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ot_asset_security
-- CREATE POLICY "ot_asset_security_tenant_isolation" ON ot_asset_security
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ot_asset_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER ot_asset_security_updated_at
  BEFORE UPDATE ON ot_asset_security
  FOR EACH ROW
  EXECUTE FUNCTION update_ot_asset_security_updated_at();

-- Create function to update zone asset count when OT asset security is added/removed/changed
CREATE OR REPLACE FUNCTION update_zone_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old zone count if zone changed
  IF TG_OP = 'UPDATE' AND OLD.zone_id IS NOT NULL AND OLD.zone_id != NEW.zone_id THEN
    UPDATE security_zones 
    SET asset_count = asset_count - 1 
    WHERE id = OLD.zone_id;
  END IF;
  
  -- Decrement zone count on delete
  IF TG_OP = 'DELETE' AND OLD.zone_id IS NOT NULL THEN
    UPDATE security_zones 
    SET asset_count = asset_count - 1 
    WHERE id = OLD.zone_id;
    RETURN OLD;
  END IF;
  
  -- Increment new zone count
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.zone_id IS NOT NULL THEN
    UPDATE security_zones 
    SET asset_count = asset_count + 1 
    WHERE id = NEW.zone_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for zone asset count
CREATE TRIGGER ot_asset_security_zone_count_insert
  AFTER INSERT ON ot_asset_security
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_asset_count();

CREATE TRIGGER ot_asset_security_zone_count_update
  AFTER UPDATE ON ot_asset_security
  FOR EACH ROW
  WHEN (OLD.zone_id IS DISTINCT FROM NEW.zone_id)
  EXECUTE FUNCTION update_zone_asset_count();

CREATE TRIGGER ot_asset_security_zone_count_delete
  AFTER DELETE ON ot_asset_security
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_asset_count();
