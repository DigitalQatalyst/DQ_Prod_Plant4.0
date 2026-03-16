-- Create security zones and conduits tables for IEC 62443 network security modeling
-- Requirements: 3.1

-- Create security_zones table
CREATE TABLE security_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('field', 'control', 'sis', 'dmz', 'corporate', 'substation-control', 'protection-systems', 'scada-network', 'corporate-network', 'field-devices', 'maintenance-network')),
  security_level INTEGER NOT NULL CHECK (security_level BETWEEN 1 AND 4), -- IEC 62443 security level (1-4)
  parent_zone_id UUID REFERENCES security_zones(id) ON DELETE SET NULL,
  description TEXT,
  asset_count INTEGER DEFAULT 0,
  compliance_status TEXT DEFAULT 'partial' CHECK (compliance_status IN ('compliant', 'non-compliant', 'partial')),
  policies JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create security_conduits table
CREATE TABLE security_conduits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_zone_id UUID NOT NULL REFERENCES security_zones(id) ON DELETE CASCADE,
  target_zone_id UUID NOT NULL REFERENCES security_zones(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  policy_compliant BOOLEAN DEFAULT false,
  data_flow_direction TEXT NOT NULL CHECK (data_flow_direction IN ('unidirectional', 'bidirectional')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure source and target zones are different
  CONSTRAINT different_zones CHECK (source_zone_id != target_zone_id)
);

-- Create indexes for common queries
CREATE INDEX idx_security_zones_tenant ON security_zones(tenant_id);
CREATE INDEX idx_security_zones_site ON security_zones(site_id);
CREATE INDEX idx_security_zones_type ON security_zones(zone_type);
CREATE INDEX idx_security_zones_parent ON security_zones(parent_zone_id);
CREATE INDEX idx_security_zones_compliance ON security_zones(compliance_status);

CREATE INDEX idx_security_conduits_tenant ON security_conduits(tenant_id);
CREATE INDEX idx_security_conduits_site ON security_conduits(site_id);
CREATE INDEX idx_security_conduits_source ON security_conduits(source_zone_id);
CREATE INDEX idx_security_conduits_target ON security_conduits(target_zone_id);
CREATE INDEX idx_security_conduits_protocol ON security_conduits(protocol);

-- Enable Row Level Security
-- ALTER TABLE security_zones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE security_conduits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_zones
-- CREATE POLICY "security_zones_tenant_isolation" ON security_zones
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create RLS policies for security_conduits
-- CREATE POLICY "security_conduits_tenant_isolation" ON security_conduits
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_security_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_security_conduits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER security_zones_updated_at
  BEFORE UPDATE ON security_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_security_zones_updated_at();

CREATE TRIGGER security_conduits_updated_at
  BEFORE UPDATE ON security_conduits
  FOR EACH ROW
  EXECUTE FUNCTION update_security_conduits_updated_at();
