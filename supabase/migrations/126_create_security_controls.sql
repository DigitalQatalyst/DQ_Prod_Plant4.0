-- Migration: Create security controls library table
-- Description: Transmission-specific security control library with effectiveness tracking
-- Requirements: 4.2

-- Create enum for control implementation status
CREATE TYPE control_implementation_status AS ENUM (
  'implemented',
  'partial',
  'not-implemented',
  'not-applicable',
  'planned'
);

-- Create enum for control effectiveness
CREATE TYPE control_effectiveness AS ENUM (
  'effective',
  'partially-effective',
  'ineffective',
  'not-assessed'
);

-- Create enum for control type
CREATE TYPE control_type AS ENUM (
  'preventive',
  'detective',
  'corrective',
  'deterrent',
  'compensating'
);

-- Create security_controls table
CREATE TABLE security_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Control identification
  control_id VARCHAR(100) NOT NULL, -- e.g., 'IEC-62443-3-3-SR-1.1', 'CIP-007-6-R1', 'TRANS-AC-001'
  control_name TEXT NOT NULL,
  control_description TEXT,
  control_type control_type NOT NULL DEFAULT 'preventive',
  
  -- Categorization
  category VARCHAR(100) NOT NULL, -- 'Access Control', 'Network Security', 'Incident Response', etc.
  subcategory VARCHAR(100),
  domain VARCHAR(100), -- 'Identity', 'Network', 'Endpoint', 'Application', 'Data'
  
  -- Standard mappings
  standard_id UUID REFERENCES compliance_standards(id) ON DELETE SET NULL,
  standard_reference VARCHAR(255), -- Reference to specific standard section
  iec_62443_mapping VARCHAR(100), -- IEC 62443 security requirement mapping
  nerc_cip_mapping VARCHAR(100), -- NERC CIP requirement mapping
  nist_csf_mapping VARCHAR(100), -- NIST Cybersecurity Framework mapping
  
  -- Implementation details
  implementation_status control_implementation_status NOT NULL DEFAULT 'not-implemented',
  implementation_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (implementation_percentage >= 0 AND implementation_percentage <= 100),
  implementation_approach TEXT,
  implementation_date TIMESTAMPTZ,
  
  -- Effectiveness tracking
  effectiveness control_effectiveness NOT NULL DEFAULT 'not-assessed',
  effectiveness_score DECIMAL(5,2) DEFAULT 0.00 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  last_assessment_date TIMESTAMPTZ,
  next_assessment_date TIMESTAMPTZ,
  
  -- Transmission-specific attributes
  applies_to_asset_types TEXT[], -- 'transformer', 'circuit-breaker', 'protection-relay', 'rtu', 'scada-node'
  applies_to_zones TEXT[], -- 'substation-control', 'protection-systems', 'scada-network'
  applies_to_protocols TEXT[], -- 'IEC-61850', 'DNP3', 'IEC-60870-5-104'
  criticality VARCHAR(50) CHECK (criticality IN ('safety-critical', 'operational-critical', 'high', 'medium', 'low')),
  
  -- Responsibility and ownership
  responsible_party VARCHAR(255),
  responsible_role VARCHAR(100),
  backup_responsible VARCHAR(255),
  
  -- Evidence and validation
  evidence_required TEXT[],
  evidence_provided TEXT[],
  validation_method VARCHAR(255),
  validation_frequency_days INTEGER DEFAULT 90,
  last_validated TIMESTAMPTZ,
  validated_by VARCHAR(255),
  
  -- Testing requirements
  testing_required BOOLEAN DEFAULT false,
  testing_frequency_days INTEGER,
  last_tested TIMESTAMPTZ,
  next_test_date TIMESTAMPTZ,
  test_results TEXT,
  
  -- Dependencies
  depends_on_controls UUID[], -- Array of control IDs this control depends on
  related_controls UUID[], -- Array of related control IDs
  
  -- Cost and effort
  implementation_cost_estimate DECIMAL(12,2),
  implementation_effort_hours INTEGER,
  annual_maintenance_cost DECIMAL(12,2),
  
  -- Status and tracking
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'superseded')),
  superseded_by UUID REFERENCES security_controls(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_control_id_per_tenant UNIQUE (tenant_id, control_id),
  CONSTRAINT valid_implementation_percentage CHECK (implementation_percentage >= 0 AND implementation_percentage <= 100),
  CONSTRAINT valid_effectiveness_score CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  CONSTRAINT valid_validation_frequency CHECK (validation_frequency_days IS NULL OR validation_frequency_days > 0),
  CONSTRAINT valid_testing_frequency CHECK (testing_frequency_days IS NULL OR testing_frequency_days > 0)
);

-- Create control_implementations table (specific implementations of controls)
CREATE TABLE control_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES security_controls(id) ON DELETE CASCADE,
  
  -- Implementation details
  implementation_name TEXT NOT NULL,
  implementation_description TEXT,
  
  -- Scope
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES security_zones(id) ON DELETE CASCADE,
  
  -- Technology and tools
  technology_used TEXT,
  tools_used TEXT[],
  configuration_details JSONB,
  
  -- Status
  status control_implementation_status NOT NULL DEFAULT 'not-implemented',
  effectiveness control_effectiveness NOT NULL DEFAULT 'not-assessed',
  
  -- Dates
  planned_date TIMESTAMPTZ,
  implementation_date TIMESTAMPTZ,
  last_verified TIMESTAMPTZ,
  next_verification TIMESTAMPTZ,
  
  -- Responsible parties
  implemented_by VARCHAR(255),
  verified_by VARCHAR(255),
  
  -- Issues and gaps
  known_issues TEXT[],
  gaps TEXT[],
  remediation_plan TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create control_test_results table (testing and validation results)
CREATE TABLE control_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES security_controls(id) ON DELETE CASCADE,
  implementation_id UUID REFERENCES control_implementations(id) ON DELETE CASCADE,
  
  -- Test details
  test_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  test_type VARCHAR(100) NOT NULL, -- 'automated', 'manual', 'penetration-test', 'audit', 'review'
  test_name TEXT NOT NULL,
  test_description TEXT,
  
  -- Test execution
  tester_name VARCHAR(255),
  test_duration_minutes INTEGER,
  test_methodology TEXT,
  
  -- Results
  result VARCHAR(50) NOT NULL CHECK (result IN ('pass', 'fail', 'partial', 'inconclusive')),
  effectiveness_rating control_effectiveness,
  findings TEXT,
  issues_found TEXT[],
  
  -- Recommendations
  recommendations TEXT[],
  remediation_required BOOLEAN DEFAULT false,
  remediation_priority VARCHAR(50) CHECK (remediation_priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Evidence
  evidence_files TEXT[],
  evidence_notes TEXT,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_controls_tenant ON security_controls(tenant_id);
CREATE INDEX idx_security_controls_control_id ON security_controls(control_id);
CREATE INDEX idx_security_controls_category ON security_controls(category);
CREATE INDEX idx_security_controls_domain ON security_controls(domain);
CREATE INDEX idx_security_controls_standard ON security_controls(standard_id);
CREATE INDEX idx_security_controls_implementation_status ON security_controls(implementation_status);
CREATE INDEX idx_security_controls_effectiveness ON security_controls(effectiveness);
CREATE INDEX idx_security_controls_criticality ON security_controls(criticality);
CREATE INDEX idx_security_controls_status ON security_controls(status);
CREATE INDEX idx_security_controls_next_assessment ON security_controls(next_assessment_date);
CREATE INDEX idx_security_controls_next_test ON security_controls(next_test_date);

CREATE INDEX idx_control_implementations_tenant ON control_implementations(tenant_id);
CREATE INDEX idx_control_implementations_control ON control_implementations(control_id);
CREATE INDEX idx_control_implementations_site ON control_implementations(site_id);
CREATE INDEX idx_control_implementations_asset ON control_implementations(asset_id);
CREATE INDEX idx_control_implementations_zone ON control_implementations(zone_id);
CREATE INDEX idx_control_implementations_status ON control_implementations(status);

CREATE INDEX idx_control_test_results_tenant ON control_test_results(tenant_id);
CREATE INDEX idx_control_test_results_control ON control_test_results(control_id);
CREATE INDEX idx_control_test_results_implementation ON control_test_results(implementation_id);
CREATE INDEX idx_control_test_results_date ON control_test_results(test_date DESC);
CREATE INDEX idx_control_test_results_result ON control_test_results(result);
CREATE INDEX idx_control_test_results_follow_up ON control_test_results(follow_up_required, follow_up_completed);

-- Enable Row Level Security
-- ALTER TABLE security_controls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE control_implementations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE control_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_controls
-- CREATE POLICY "security_controls_tenant_isolation" ON security_controls
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "security_controls_read_access" ON security_controls
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "security_controls_write_access" ON security_controls
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor')
--   );

-- CREATE POLICY "security_controls_update_access" ON security_controls
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- RLS policies for control_implementations
-- CREATE POLICY "control_implementations_tenant_isolation" ON control_implementations
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_implementations_read_access" ON control_implementations
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "control_implementations_write_access" ON control_implementations
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- RLS policies for control_test_results
-- CREATE POLICY "control_test_results_tenant_isolation" ON control_test_results
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "control_test_results_read_access" ON control_test_results
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid
--   );

-- CREATE POLICY "control_test_results_write_access" ON control_test_results
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer', 'auditor')
--   );

-- Create function to update control effectiveness from test results
CREATE OR REPLACE FUNCTION update_control_effectiveness_from_tests()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the control's effectiveness based on latest test results
  UPDATE security_controls
  SET
    effectiveness = (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE result = 'fail') > 0 THEN 'ineffective'::control_effectiveness
        WHEN COUNT(*) FILTER (WHERE result = 'partial') > 0 THEN 'partially-effective'::control_effectiveness
        WHEN COUNT(*) FILTER (WHERE result = 'pass') = COUNT(*) THEN 'effective'::control_effectiveness
        ELSE 'not-assessed'::control_effectiveness
      END
      FROM control_test_results
      WHERE control_id = NEW.control_id
      AND test_date >= now() - INTERVAL '90 days'
    ),
    effectiveness_score = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE result = 'pass') * 100.0 +
           COUNT(*) FILTER (WHERE result = 'partial') * 50.0) /
          COUNT(*),
          2
        )
      END
      FROM control_test_results
      WHERE control_id = NEW.control_id
      AND test_date >= now() - INTERVAL '90 days'
    ),
    last_tested = NEW.test_date,
    updated_at = now()
  WHERE id = NEW.control_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update effectiveness from test results
CREATE TRIGGER trigger_update_control_effectiveness_from_tests
AFTER INSERT OR UPDATE ON control_test_results
FOR EACH ROW
EXECUTE FUNCTION update_control_effectiveness_from_tests();

-- Create updated_at triggers
CREATE TRIGGER update_security_controls_updated_at 
  BEFORE UPDATE ON security_controls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_implementations_updated_at 
  BEFORE UPDATE ON control_implementations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_test_results_updated_at 
  BEFORE UPDATE ON control_test_results 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE security_controls IS 'Security control library with transmission-specific controls and effectiveness tracking';
COMMENT ON TABLE control_implementations IS 'Specific implementations of security controls at sites, assets, or zones';
COMMENT ON TABLE control_test_results IS 'Testing and validation results for security controls';
COMMENT ON COLUMN security_controls.effectiveness_score IS 'Control effectiveness percentage (0-100) based on recent test results';
COMMENT ON COLUMN security_controls.iec_62443_mapping IS 'Mapping to IEC 62443 security requirements for power systems';
COMMENT ON COLUMN security_controls.nerc_cip_mapping IS 'Mapping to NERC CIP requirements for bulk electric systems';
