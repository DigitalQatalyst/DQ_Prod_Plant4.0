-- Application security scanning and vulnerability management for transmission systems
-- Requirements: 7.5

-- Create application_security_scans table for security scan results and tracking
CREATE TABLE application_security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Application identification
  application_name TEXT NOT NULL,
  application_type TEXT NOT NULL, -- 'web_application', 'api_service', 'mobile_app', 'desktop_app', 'scada_hmi', 'data_analytics'
  application_description TEXT,
  application_version TEXT,
  
  -- Application details
  deployment_environment TEXT NOT NULL, -- 'production', 'staging', 'development', 'test'
  deployment_url TEXT,
  repository_url TEXT,
  
  -- Scan information
  scan_id TEXT NOT NULL,
  scan_type TEXT NOT NULL, -- 'sast', 'dast', 'sca', 'container_scan', 'dependency_scan', 'penetration_test'
  scan_tool TEXT NOT NULL, -- 'sonarqube', 'snyk', 'checkmarx', 'veracode', 'owasp_zap', 'burp_suite'
  scan_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  
  -- Scan execution
  scan_started_at TIMESTAMPTZ,
  scan_completed_at TIMESTAMPTZ,
  scan_duration_seconds INTEGER,
  scan_triggered_by TEXT, -- 'scheduled', 'manual', 'ci_cd_pipeline', 'pre_deployment'
  
  -- Scan results summary
  total_findings INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  high_findings INTEGER DEFAULT 0,
  medium_findings INTEGER DEFAULT 0,
  low_findings INTEGER DEFAULT 0,
  info_findings INTEGER DEFAULT 0,
  
  -- Security score
  security_score INTEGER, -- 0-100, higher is better
  security_grade TEXT, -- 'A', 'B', 'C', 'D', 'F'
  previous_security_score INTEGER,
  score_trend TEXT, -- 'improving', 'stable', 'declining'
  
  -- Vulnerability categories
  injection_vulnerabilities INTEGER DEFAULT 0,
  authentication_vulnerabilities INTEGER DEFAULT 0,
  authorization_vulnerabilities INTEGER DEFAULT 0,
  cryptography_vulnerabilities INTEGER DEFAULT 0,
  configuration_vulnerabilities INTEGER DEFAULT 0,
  dependency_vulnerabilities INTEGER DEFAULT 0,
  
  -- Compliance findings
  owasp_top_10_violations INTEGER DEFAULT 0,
  cwe_top_25_violations INTEGER DEFAULT 0,
  pci_dss_violations INTEGER DEFAULT 0,
  hipaa_violations INTEGER DEFAULT 0,
  
  -- Code quality metrics
  lines_of_code INTEGER,
  code_coverage_percent NUMERIC(5,2),
  technical_debt_hours INTEGER,
  code_smells INTEGER DEFAULT 0,
  
  -- Remediation status
  findings_resolved INTEGER DEFAULT 0,
  findings_in_progress INTEGER DEFAULT 0,
  findings_open INTEGER DEFAULT 0,
  findings_accepted_risk INTEGER DEFAULT 0,
  findings_false_positive INTEGER DEFAULT 0,
  
  -- Risk assessment
  overall_risk_level TEXT DEFAULT 'unknown', -- 'critical', 'high', 'medium', 'low', 'minimal', 'unknown'
  exploitability_score NUMERIC(3,1), -- 0.0-10.0
  impact_score NUMERIC(3,1), -- 0.0-10.0
  
  -- Scan configuration
  scan_scope TEXT, -- 'full', 'incremental', 'targeted'
  scan_depth TEXT, -- 'shallow', 'standard', 'deep'
  scan_configuration JSONB, -- Scan-specific configuration
  
  -- Findings details
  findings_summary JSONB, -- Summary of key findings
  scan_report_url TEXT,
  scan_report_path TEXT,
  
  -- Responsible parties
  application_owner TEXT,
  security_contact TEXT,
  development_team TEXT,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT application_security_scans_tenant_scan_unique UNIQUE (tenant_id, scan_id),
  CONSTRAINT application_security_scans_security_score_range CHECK (security_score >= 0 AND security_score <= 100),
  CONSTRAINT application_security_scans_findings_positive CHECK (
    total_findings >= 0 AND
    critical_findings >= 0 AND
    high_findings >= 0 AND
    medium_findings >= 0 AND
    low_findings >= 0 AND
    info_findings >= 0
  ),
  CONSTRAINT application_security_scans_exploitability_range CHECK (exploitability_score >= 0.0 AND exploitability_score <= 10.0),
  CONSTRAINT application_security_scans_impact_range CHECK (impact_score >= 0.0 AND impact_score <= 10.0),
  CONSTRAINT application_security_scans_coverage_range CHECK (code_coverage_percent >= 0.0 AND code_coverage_percent <= 100.0)
);

-- Create indexes for performance
CREATE INDEX idx_application_security_scans_tenant ON application_security_scans(tenant_id);
CREATE INDEX idx_application_security_scans_app_name ON application_security_scans(application_name);
CREATE INDEX idx_application_security_scans_app_type ON application_security_scans(application_type);
CREATE INDEX idx_application_security_scans_environment ON application_security_scans(deployment_environment);
CREATE INDEX idx_application_security_scans_scan_type ON application_security_scans(scan_type);
CREATE INDEX idx_application_security_scans_scan_status ON application_security_scans(scan_status);
CREATE INDEX idx_application_security_scans_risk_level ON application_security_scans(overall_risk_level);
CREATE INDEX idx_application_security_scans_security_grade ON application_security_scans(security_grade);
CREATE INDEX idx_application_security_scans_completed_at ON application_security_scans(scan_completed_at);

-- Enable Row Level Security
-- ALTER TABLE application_security_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access application security scans for their tenant
CREATE POLICY application_security_scans_tenant_isolation ON application_security_scans
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Create updated_at trigger
CREATE TRIGGER update_application_security_scans_updated_at
  BEFORE UPDATE ON application_security_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE application_security_scans IS 'Application security scan results and vulnerability tracking for transmission systems';
COMMENT ON COLUMN application_security_scans.application_type IS 'Type of application: web_application, api_service, mobile_app, desktop_app, scada_hmi, data_analytics';
COMMENT ON COLUMN application_security_scans.scan_type IS 'Type of security scan: sast, dast, sca, container_scan, dependency_scan, penetration_test';
COMMENT ON COLUMN application_security_scans.scan_tool IS 'Security scanning tool used: sonarqube, snyk, checkmarx, veracode, owasp_zap, burp_suite';
COMMENT ON COLUMN application_security_scans.security_score IS 'Overall security score (0-100, higher is better)';
COMMENT ON COLUMN application_security_scans.security_grade IS 'Security grade: A, B, C, D, F';
COMMENT ON COLUMN application_security_scans.overall_risk_level IS 'Overall risk level: critical, high, medium, low, minimal, unknown';
