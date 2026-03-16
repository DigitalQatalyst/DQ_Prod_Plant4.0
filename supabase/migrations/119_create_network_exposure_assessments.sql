-- Create network exposure assessments table for transmission network security monitoring
-- Requirements: 3.8

CREATE TABLE network_exposure_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES security_zones(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('vulnerability-scan', 'penetration-test', 'configuration-audit', 'network-scan', 'protocol-analysis')),
  exposure_level TEXT NOT NULL CHECK (exposure_level IN ('none', 'low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  findings_count INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  high_findings INTEGER DEFAULT 0,
  medium_findings INTEGER DEFAULT 0,
  low_findings INTEGER DEFAULT 0,
  exposed_services JSONB DEFAULT '[]',
  exposed_ports JSONB DEFAULT '[]',
  vulnerable_protocols JSONB DEFAULT '[]',
  mitigation_status TEXT DEFAULT 'pending' CHECK (mitigation_status IN ('pending', 'in-progress', 'completed', 'accepted-risk')),
  mitigation_recommendations JSONB DEFAULT '[]',
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_assessment_date TIMESTAMPTZ,
  assessor TEXT,
  automated BOOLEAN DEFAULT false,
  findings_summary TEXT,
  detailed_findings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_network_exposure_tenant ON network_exposure_assessments(tenant_id);
CREATE INDEX idx_network_exposure_site ON network_exposure_assessments(site_id);
CREATE INDEX idx_network_exposure_asset ON network_exposure_assessments(asset_id);
CREATE INDEX idx_network_exposure_zone ON network_exposure_assessments(zone_id);
CREATE INDEX idx_network_exposure_type ON network_exposure_assessments(assessment_type);
CREATE INDEX idx_network_exposure_level ON network_exposure_assessments(exposure_level);
CREATE INDEX idx_network_exposure_risk_score ON network_exposure_assessments(risk_score);
CREATE INDEX idx_network_exposure_mitigation ON network_exposure_assessments(mitigation_status);
CREATE INDEX idx_network_exposure_date ON network_exposure_assessments(assessment_date);

-- Enable Row Level Security
-- ALTER TABLE network_exposure_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_exposure_assessments
-- CREATE POLICY "network_exposure_assessments_tenant_isolation" ON network_exposure_assessments
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_network_exposure_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER network_exposure_assessments_updated_at
  BEFORE UPDATE ON network_exposure_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_network_exposure_assessments_updated_at();

-- Create function to automatically calculate findings count
CREATE OR REPLACE FUNCTION calculate_exposure_findings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.findings_count = COALESCE(NEW.critical_findings, 0) + 
                       COALESCE(NEW.high_findings, 0) + 
                       COALESCE(NEW.medium_findings, 0) + 
                       COALESCE(NEW.low_findings, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for findings calculation
CREATE TRIGGER network_exposure_assessments_findings
  BEFORE INSERT OR UPDATE ON network_exposure_assessments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_exposure_findings();
