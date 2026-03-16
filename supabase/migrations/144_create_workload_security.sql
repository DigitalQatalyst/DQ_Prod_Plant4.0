-- Workload security and platform hardening for transmission systems
-- Requirements: 7.4

-- Create workload_security table for platform hardening configurations
CREATE TABLE workload_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Workload identification
  workload_name TEXT NOT NULL,
  workload_type TEXT NOT NULL, -- 'application', 'database', 'web_server', 'api_service', 'scada_interface', 'data_processor'
  workload_description TEXT,
  
  -- Deployment details
  deployment_environment TEXT NOT NULL, -- 'production', 'staging', 'development', 'test', 'disaster_recovery'
  deployment_platform TEXT NOT NULL, -- 'kubernetes', 'docker', 'vm', 'bare_metal', 'serverless'
  deployment_location TEXT, -- Data center or cloud region
  
  -- Workload status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'deprecated'
  health_status TEXT DEFAULT 'healthy', -- 'healthy', 'degraded', 'critical', 'offline'
  
  -- Security baseline
  security_baseline_id TEXT NOT NULL,
  baseline_version TEXT NOT NULL,
  baseline_compliance_status TEXT DEFAULT 'unknown', -- 'compliant', 'non_compliant', 'partial', 'unknown'
  baseline_compliance_score INTEGER DEFAULT 0, -- 0-100
  last_baseline_assessment TIMESTAMPTZ,
  
  -- Hardening configuration
  hardening_level TEXT NOT NULL DEFAULT 'standard', -- 'minimal', 'standard', 'enhanced', 'maximum'
  hardening_profile TEXT, -- 'cis_benchmark', 'stig', 'nist_800_53', 'iec_62443'
  hardening_applied BOOLEAN DEFAULT false,
  hardening_date TIMESTAMPTZ,
  
  -- Operating system hardening
  os_type TEXT, -- 'linux', 'windows', 'unix', 'rtos'
  os_version TEXT,
  os_hardening_enabled BOOLEAN DEFAULT false,
  os_hardening_controls TEXT[], -- Specific OS hardening controls applied
  
  -- Network hardening
  network_isolation_enabled BOOLEAN DEFAULT false,
  network_segmentation TEXT,
  hardening_standards TEXT[], -- 'CIS', 'DISA-STIG', 'NIST', 'IEC-62443'
  
  -- Security controls
  firewall_enabled BOOLEAN DEFAULT true,
  firewall_rules_count INTEGER DEFAULT 0,
  antivirus_enabled BOOLEAN DEFAULT true,
  antivirus_updated BOOLEAN DEFAULT false,
  antivirus_last_scan TIMESTAMPTZ,
  
  -- Access controls
  ssh_enabled BOOLEAN DEFAULT false,
  ssh_key_only BOOLEAN DEFAULT true,
  rdp_enabled BOOLEAN DEFAULT false,
  privileged_access_restricted BOOLEAN DEFAULT true,
  
  -- Network security
  network_segmentation_enabled BOOLEAN DEFAULT true,
  allowed_inbound_ports INTEGER[],
  allowed_outbound_ports INTEGER[],
  network_encryption_enabled BOOLEAN DEFAULT true,
  
  -- Patch management
  patch_level TEXT DEFAULT 'unknown', -- 'current', 'outdated', 'critical_missing', 'unknown'
  last_patched_date DATE,
  pending_patches_count INTEGER DEFAULT 0,
  critical_patches_pending INTEGER DEFAULT 0,
  auto_patching_enabled BOOLEAN DEFAULT false,
  
  -- Vulnerability status
  vulnerability_scan_enabled BOOLEAN DEFAULT true,
  last_vulnerability_scan TIMESTAMPTZ,
  critical_vulnerabilities INTEGER DEFAULT 0,
  high_vulnerabilities INTEGER DEFAULT 0,
  medium_vulnerabilities INTEGER DEFAULT 0,
  low_vulnerabilities INTEGER DEFAULT 0,
  
  -- Configuration management
  configuration_management_enabled BOOLEAN DEFAULT true,
  configuration_drift_detected BOOLEAN DEFAULT false,
  last_configuration_check TIMESTAMPTZ,
  
  -- Logging and monitoring
  logging_enabled BOOLEAN DEFAULT true,
  log_forwarding_enabled BOOLEAN DEFAULT true,
  log_destination TEXT,
  monitoring_agent_installed BOOLEAN DEFAULT false,
  monitoring_agent_version TEXT,
  
  -- Compliance and audit
  compliance_frameworks TEXT[], -- 'IEC-62443', 'NERC-CIP', 'ISO-27001', 'NIST-CSF'
  last_audit_date DATE,
  next_audit_date DATE,
  audit_findings_count INTEGER DEFAULT 0,
  
  -- Responsible parties
  owner_user_id TEXT,
  security_contact TEXT,
  technical_contact TEXT,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workload_security_tenant_workload_unique UNIQUE (tenant_id, workload_name, deployment_environment),
  CONSTRAINT workload_security_compliance_score_range CHECK (baseline_compliance_score >= 0 AND baseline_compliance_score <= 100),
  CONSTRAINT workload_security_firewall_rules_positive CHECK (firewall_rules_count >= 0),
  CONSTRAINT workload_security_vulnerabilities_positive CHECK (
    critical_vulnerabilities >= 0 AND
    high_vulnerabilities >= 0 AND
    medium_vulnerabilities >= 0 AND
    low_vulnerabilities >= 0
  ),
  CONSTRAINT workload_security_patches_positive CHECK (
    pending_patches_count >= 0 AND
    critical_patches_pending >= 0
  )
);

-- Create indexes for performance
CREATE INDEX idx_workload_security_tenant ON workload_security(tenant_id);
CREATE INDEX idx_workload_security_type ON workload_security(workload_type);
CREATE INDEX idx_workload_security_environment ON workload_security(deployment_environment);
CREATE INDEX idx_workload_security_status ON workload_security(status);
CREATE INDEX idx_workload_security_health ON workload_security(health_status);
CREATE INDEX idx_workload_security_compliance ON workload_security(baseline_compliance_status);
CREATE INDEX idx_workload_security_hardening ON workload_security(hardening_level);
CREATE INDEX idx_workload_security_patch_level ON workload_security(patch_level);

-- Enable Row Level Security
ALTER TABLE workload_security ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access workload security data for their tenant
CREATE POLICY workload_security_tenant_isolation ON workload_security
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Create updated_at trigger
CREATE TRIGGER update_workload_security_updated_at
  BEFORE UPDATE ON workload_security
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE workload_security IS 'Platform workload security and hardening configurations for transmission systems';
COMMENT ON COLUMN workload_security.workload_type IS 'Type of workload: application, database, web_server, api_service, scada_interface, data_processor';
COMMENT ON COLUMN workload_security.deployment_environment IS 'Deployment environment: production, staging, development, test, disaster_recovery';
COMMENT ON COLUMN workload_security.deployment_platform IS 'Deployment platform: kubernetes, docker, vm, bare_metal, serverless';
COMMENT ON COLUMN workload_security.hardening_level IS 'Security hardening level: minimal, standard, enhanced, maximum';
COMMENT ON COLUMN workload_security.hardening_profile IS 'Hardening profile standard: cis_benchmark, stig, nist_800_53, iec_62443';
COMMENT ON COLUMN workload_security.baseline_compliance_score IS 'Security baseline compliance score (0-100)';
COMMENT ON COLUMN workload_security.patch_level IS 'Patch status: current, outdated, critical_missing, unknown';