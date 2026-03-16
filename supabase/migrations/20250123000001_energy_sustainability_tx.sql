-- EMS Power Transmission - Sustainability Schema Extensions
-- Creates sustainability tables for emissions, renewables, compliance, and ESG reporting
-- Requirements: 18.1, 19.1, 20.1, 21.1, 22.1

-- ============================================================================
-- EMISSION FACTORS TABLE
-- ============================================================================

-- Create emission_factors table for CO2e conversion factors
CREATE TABLE IF NOT EXISTS emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  factor_code TEXT NOT NULL,  -- Natural key: unique identifier within org
  factor_name TEXT NOT NULL,
  description TEXT,
  
  -- Factor scope
  energy_type TEXT NOT NULL,  -- 'electricity', 'gas', 'diesel', 'steam', 'coal', 'biomass'
  scope TEXT NOT NULL,  -- 'scope1', 'scope2', 'scope3' (GHG Protocol scopes)
  region TEXT,  -- Geographic region for grid electricity factors
  
  -- Factor values
  kg_co2e_per_kwh DECIMAL(10,6) NOT NULL,  -- Primary factor value
  kg_co2_per_kwh DECIMAL(10,6),  -- CO2 only (without equivalents)
  kg_ch4_per_kwh DECIMAL(10,6),  -- Methane emissions
  kg_n2o_per_kwh DECIMAL(10,6),  -- Nitrous oxide emissions
  
  -- Temporal validity
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Source and methodology
  source TEXT NOT NULL,  -- 'EPA', 'IEA', 'Grid Operator', 'Supplier', 'Custom Calculation'
  source_reference TEXT,  -- Specific document or standard reference
  methodology TEXT,  -- Calculation methodology description
  uncertainty_percentage DECIMAL(5,2),  -- Uncertainty in factor value
  
  -- Status
  active BOOLEAN DEFAULT true,
  default_factor BOOLEAN DEFAULT false,  -- Is this the default factor for this energy type
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_emission_factors_org_code UNIQUE (org_id, factor_code),
  
  -- Check constraints
  CONSTRAINT chk_emission_factors_kg_co2e CHECK (kg_co2e_per_kwh >= 0),
  CONSTRAINT chk_emission_factors_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_emission_factors_uncertainty CHECK (uncertainty_percentage IS NULL OR uncertainty_percentage >= 0),
  CONSTRAINT chk_emission_factors_energy_type CHECK (energy_type IN ('electricity', 'gas', 'diesel', 'steam', 'coal', 'biomass', 'fuel_oil', 'propane')),
  CONSTRAINT chk_emission_factors_scope CHECK (scope IN ('scope1', 'scope2', 'scope3'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emission_factors_org ON emission_factors(org_id);
CREATE INDEX IF NOT EXISTS idx_emission_factors_energy_type ON emission_factors(energy_type);
CREATE INDEX IF NOT EXISTS idx_emission_factors_scope ON emission_factors(scope);
CREATE INDEX IF NOT EXISTS idx_emission_factors_effective ON emission_factors(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_emission_factors_active ON emission_factors(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_emission_factors_default ON emission_factors(org_id, energy_type) WHERE default_factor = true;
CREATE INDEX IF NOT EXISTS idx_emission_factors_region ON emission_factors(region) WHERE region IS NOT NULL;

-- Composite index for factor lookup
CREATE INDEX IF NOT EXISTS idx_emission_factors_lookup 
  ON emission_factors(org_id, energy_type, effective_date DESC) 
  WHERE active = true;

-- Enable RLS
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY emission_factors_tenant_isolation ON emission_factors
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON emission_factors TO authenticated;

-- Add comments
COMMENT ON TABLE emission_factors IS 'CO2e emission factors for calculating carbon emissions from energy consumption';
COMMENT ON COLUMN emission_factors.kg_co2e_per_kwh IS 'Primary emission factor in kg CO2 equivalent per kWh';
COMMENT ON COLUMN emission_factors.scope IS 'GHG Protocol scope (scope1=direct, scope2=indirect from purchased energy, scope3=other indirect)';
COMMENT ON COLUMN emission_factors.default_factor IS 'Whether this is the default factor to use for this energy type';
COMMENT ON CONSTRAINT uq_emission_factors_org_code ON emission_factors IS 'Natural key: emission factors are unique by (org_id, factor_code)';


-- ============================================================================
-- TX DELIVERY CONTEXT TABLE
-- ============================================================================

-- Create tx_delivery_context table for transmission grid delivery metrics
CREATE TABLE IF NOT EXISTS tx_delivery_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Scope
  scope_type TEXT NOT NULL,  -- 'org', 'substation', 'feeder'
  scope_id UUID NOT NULL,  -- References the entity
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_grain TEXT NOT NULL,  -- 'hour', 'day', 'week', 'month', 'quarter', 'year'
  
  -- Delivery metrics
  mwh_delivered DECIMAL(15,4) NOT NULL,  -- Total energy delivered
  mw_peak DECIMAL(12,4),  -- Peak demand during period
  losses_mwh DECIMAL(15,4),  -- Total losses
  losses_percentage DECIMAL(5,2),  -- Losses as percentage of delivered
  
  -- Interchange metrics
  interchange_in_mwh DECIMAL(15,4),  -- Energy received from other systems
  interchange_out_mwh DECIMAL(15,4),  -- Energy sent to other systems
  net_interchange_mwh DECIMAL(15,4),  -- Net interchange (in - out)
  
  -- Load characteristics
  load_factor DECIMAL(5,4),  -- Average load / peak load
  avg_load_mw DECIMAL(12,4),  -- Average load during period
  
  -- Data quality
  data_completeness_pct DECIMAL(5,2),  -- Percentage of expected data points received
  calculation_method TEXT,  -- How metrics were calculated
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_tx_delivery_context_natural_key UNIQUE (scope_type, scope_id, period_start, period_grain),
  
  -- Check constraints
  CONSTRAINT chk_tx_delivery_context_period CHECK (period_end > period_start),
  CONSTRAINT chk_tx_delivery_context_mwh_delivered CHECK (mwh_delivered >= 0),
  CONSTRAINT chk_tx_delivery_context_losses CHECK (losses_mwh IS NULL OR losses_mwh >= 0),
  CONSTRAINT chk_tx_delivery_context_losses_pct CHECK (losses_percentage IS NULL OR (losses_percentage >= 0 AND losses_percentage <= 100)),
  CONSTRAINT chk_tx_delivery_context_load_factor CHECK (load_factor IS NULL OR (load_factor >= 0 AND load_factor <= 1)),
  CONSTRAINT chk_tx_delivery_context_completeness CHECK (data_completeness_pct IS NULL OR (data_completeness_pct >= 0 AND data_completeness_pct <= 100)),
  CONSTRAINT chk_tx_delivery_context_scope_type CHECK (scope_type IN ('org', 'substation', 'feeder')),
  CONSTRAINT chk_tx_delivery_context_period_grain CHECK (period_grain IN ('hour', 'day', 'week', 'month', 'quarter', 'year'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_org ON tx_delivery_context(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_scope ON tx_delivery_context(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_period ON tx_delivery_context(period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_grain ON tx_delivery_context(period_grain, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_org_scope ON tx_delivery_context(org_id, scope_type, scope_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tx_delivery_context_lookup 
  ON tx_delivery_context(org_id, scope_type, scope_id, period_start DESC);

-- Enable RLS
ALTER TABLE tx_delivery_context ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_delivery_context_tenant_isolation ON tx_delivery_context
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_delivery_context TO authenticated;

-- Add comments
COMMENT ON TABLE tx_delivery_context IS 'Transmission grid delivery metrics for energy intensity calculations';
COMMENT ON COLUMN tx_delivery_context.mwh_delivered IS 'Total energy delivered to customers/downstream systems';
COMMENT ON COLUMN tx_delivery_context.losses_percentage IS 'Transmission losses as percentage of delivered energy';
COMMENT ON COLUMN tx_delivery_context.load_factor IS 'Ratio of average load to peak load (0 to 1)';
COMMENT ON CONSTRAINT uq_tx_delivery_context_natural_key ON tx_delivery_context IS 'Natural key: delivery context is unique by (scope_type, scope_id, period_start, period_grain)';


-- ============================================================================
-- ENERGY EMISSIONS SNAPSHOTS TABLE
-- ============================================================================

-- Create energy_emissions_snapshots table for computed emissions
CREATE TABLE IF NOT EXISTS energy_emissions_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Scope
  scope_type TEXT NOT NULL,  -- 'org', 'substation', 'feeder', 'meter'
  scope_id UUID NOT NULL,  -- References the entity
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_grain TEXT NOT NULL,  -- 'day', 'week', 'month', 'quarter', 'year'
  
  -- Emission factor used
  factor_id UUID NOT NULL REFERENCES emission_factors(id) ON DELETE RESTRICT,
  
  -- Energy consumption
  energy_kwh DECIMAL(15,4) NOT NULL,
  energy_type TEXT NOT NULL,  -- 'electricity', 'gas', 'diesel', 'steam'
  
  -- Emissions calculated
  co2e_kg DECIMAL(15,4) NOT NULL,  -- Total CO2 equivalent emissions
  co2_kg DECIMAL(15,4),  -- CO2 only
  ch4_kg DECIMAL(15,4),  -- Methane
  n2o_kg DECIMAL(15,4),  -- Nitrous oxide
  
  -- GHG Protocol scope
  ghg_scope TEXT NOT NULL,  -- 'scope1', 'scope2', 'scope3'
  
  -- Intensity metrics (for transmission)
  co2e_per_mwh_delivered DECIMAL(10,4),  -- kg CO2e per MWh delivered (transmission efficiency)
  
  -- Data quality
  calculation_method TEXT,  -- How emissions were calculated
  data_quality_score DECIMAL(3,2),  -- 0.0 to 1.0
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_energy_emissions_snapshots_natural_key UNIQUE (scope_type, scope_id, period_start, period_grain, factor_id),
  
  -- Check constraints
  CONSTRAINT chk_energy_emissions_snapshots_period CHECK (period_end > period_start),
  CONSTRAINT chk_energy_emissions_snapshots_energy CHECK (energy_kwh >= 0),
  CONSTRAINT chk_energy_emissions_snapshots_co2e CHECK (co2e_kg >= 0),
  CONSTRAINT chk_energy_emissions_snapshots_data_quality CHECK (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 1)),
  CONSTRAINT chk_energy_emissions_snapshots_scope_type CHECK (scope_type IN ('org', 'substation', 'feeder', 'meter')),
  CONSTRAINT chk_energy_emissions_snapshots_period_grain CHECK (period_grain IN ('day', 'week', 'month', 'quarter', 'year')),
  CONSTRAINT chk_energy_emissions_snapshots_energy_type CHECK (energy_type IN ('electricity', 'gas', 'diesel', 'steam', 'coal', 'biomass', 'fuel_oil', 'propane')),
  CONSTRAINT chk_energy_emissions_snapshots_ghg_scope CHECK (ghg_scope IN ('scope1', 'scope2', 'scope3'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_org ON energy_emissions_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_scope ON energy_emissions_snapshots(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_period ON energy_emissions_snapshots(period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_factor ON energy_emissions_snapshots(factor_id);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_energy_type ON energy_emissions_snapshots(energy_type);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_ghg_scope ON energy_emissions_snapshots(ghg_scope);
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_grain ON energy_emissions_snapshots(period_grain, period_start DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_energy_emissions_snapshots_lookup 
  ON energy_emissions_snapshots(org_id, scope_type, scope_id, period_start DESC);

-- Enable RLS
ALTER TABLE energy_emissions_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY energy_emissions_snapshots_tenant_isolation ON energy_emissions_snapshots
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_emissions_snapshots TO authenticated;

-- Add comments
COMMENT ON TABLE energy_emissions_snapshots IS 'Computed carbon emissions snapshots by scope and time period';
COMMENT ON COLUMN energy_emissions_snapshots.co2e_kg IS 'Total CO2 equivalent emissions in kilograms';
COMMENT ON COLUMN energy_emissions_snapshots.co2e_per_mwh_delivered IS 'Transmission efficiency metric: kg CO2e per MWh delivered';
COMMENT ON COLUMN energy_emissions_snapshots.ghg_scope IS 'GHG Protocol scope classification';
COMMENT ON CONSTRAINT uq_energy_emissions_snapshots_natural_key ON energy_emissions_snapshots IS 'Natural key: emissions snapshots are unique by (scope_type, scope_id, period_start, period_grain, factor_id)';


-- ============================================================================
-- TX RENEWABLES CONTRACTS TABLE
-- ============================================================================

-- Create tx_renewables_contracts table for renewable energy tracking
CREATE TABLE IF NOT EXISTS tx_renewables_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_code TEXT NOT NULL,  -- Natural key
  contract_name TEXT NOT NULL,
  description TEXT,
  
  -- Contract type
  contract_type TEXT NOT NULL,  -- 'ppa', 'rec', 'vppa', 'green_tariff', 'on_site_generation'
  renewable_type TEXT NOT NULL,  -- 'solar', 'wind', 'hydro', 'biomass', 'geothermal'
  
  -- Contract parties
  supplier_name TEXT,
  supplier_id TEXT,  -- External supplier identifier
  
  -- Contract terms
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  
  -- Capacity and generation
  contracted_capacity_mw DECIMAL(10,4),
  annual_generation_mwh DECIMAL(15,4),  -- Expected annual generation
  
  -- Pricing
  price_per_mwh DECIMAL(10,2),
  price_escalation_pct DECIMAL(5,2),  -- Annual price escalation percentage
  currency TEXT DEFAULT 'USD',
  
  -- Location
  generation_site_name TEXT,
  generation_site_location TEXT,
  substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL,  -- Point of interconnection
  
  -- Certification
  rec_eligible BOOLEAN DEFAULT false,
  certification_standard TEXT,  -- 'Green-e', 'I-REC', 'TIGR', etc.
  certification_id TEXT,
  
  -- Tracking
  total_generation_mwh DECIMAL(15,4) DEFAULT 0,  -- Cumulative generation to date
  total_recs_issued INTEGER DEFAULT 0,
  last_generation_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'pending', 'expired', 'terminated'
  termination_reason TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_tx_renewables_contracts_org_code UNIQUE (org_id, contract_code),
  
  -- Check constraints
  CONSTRAINT chk_tx_renewables_contracts_dates CHECK (contract_end_date IS NULL OR contract_end_date > contract_start_date),
  CONSTRAINT chk_tx_renewables_contracts_capacity CHECK (contracted_capacity_mw IS NULL OR contracted_capacity_mw > 0),
  CONSTRAINT chk_tx_renewables_contracts_generation CHECK (annual_generation_mwh IS NULL OR annual_generation_mwh >= 0),
  CONSTRAINT chk_tx_renewables_contracts_price CHECK (price_per_mwh IS NULL OR price_per_mwh >= 0),
  CONSTRAINT chk_tx_renewables_contracts_escalation CHECK (price_escalation_pct IS NULL OR price_escalation_pct >= -100),
  CONSTRAINT chk_tx_renewables_contracts_type CHECK (contract_type IN ('ppa', 'rec', 'vppa', 'green_tariff', 'on_site_generation')),
  CONSTRAINT chk_tx_renewables_contracts_renewable_type CHECK (renewable_type IN ('solar', 'wind', 'hydro', 'biomass', 'geothermal', 'tidal', 'wave')),
  CONSTRAINT chk_tx_renewables_contracts_status CHECK (status IN ('active', 'pending', 'expired', 'terminated'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_org ON tx_renewables_contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_type ON tx_renewables_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_renewable_type ON tx_renewables_contracts(renewable_type);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_status ON tx_renewables_contracts(status);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_substation ON tx_renewables_contracts(substation_id);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_start_date ON tx_renewables_contracts(contract_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_end_date ON tx_renewables_contracts(contract_end_date) WHERE contract_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_renewables_contracts_active ON tx_renewables_contracts(org_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE tx_renewables_contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_renewables_contracts_tenant_isolation ON tx_renewables_contracts
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_renewables_contracts TO authenticated;

-- Add comments
COMMENT ON TABLE tx_renewables_contracts IS 'Renewable energy contracts including PPAs, RECs, and on-site generation';
COMMENT ON COLUMN tx_renewables_contracts.contract_type IS 'Type of renewable energy contract (PPA, REC, VPPA, green tariff, on-site generation)';
COMMENT ON COLUMN tx_renewables_contracts.rec_eligible IS 'Whether the contract generates Renewable Energy Credits';
COMMENT ON COLUMN tx_renewables_contracts.total_recs_issued IS 'Cumulative count of RECs issued under this contract';
COMMENT ON CONSTRAINT uq_tx_renewables_contracts_org_code ON tx_renewables_contracts IS 'Natural key: renewable contracts are unique by (org_id, contract_code)';


-- ============================================================================
-- TX COMPLIANCE REQUIREMENTS TABLE
-- ============================================================================

-- Create tx_compliance_requirements table for regulatory compliance
CREATE TABLE IF NOT EXISTS tx_compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_code TEXT NOT NULL,  -- Natural key
  requirement_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Regulatory context
  standard_reference TEXT NOT NULL,  -- 'ISO 50001', 'NERC CIP', 'EPA GHG Reporting', etc.
  regulatory_body TEXT,  -- 'EPA', 'NERC', 'State PUC', 'ISO', etc.
  jurisdiction TEXT,  -- Geographic or organizational jurisdiction
  
  -- Requirement details
  requirement_type TEXT NOT NULL,  -- 'reporting', 'operational', 'documentation', 'audit', 'certification'
  compliance_category TEXT,  -- 'emissions', 'energy_efficiency', 'renewable_energy', 'reliability', 'security'
  
  -- Dates and frequency
  effective_date DATE NOT NULL,
  expiry_date DATE,
  review_frequency_days INTEGER,  -- How often requirement must be reviewed
  next_review_date DATE,
  
  -- Evidence requirements
  evidence_required BOOLEAN DEFAULT true,
  evidence_types TEXT[],  -- Array of required evidence types
  evidence_retention_years INTEGER,
  
  -- Applicability
  applies_to_scope TEXT,  -- 'org', 'substation', 'feeder', 'all_transmission'
  scope_filter JSONB DEFAULT '{}',  -- Filters for applicability (voltage_level, region, etc.)
  
  -- Status
  compliance_status TEXT DEFAULT 'pending',  -- 'compliant', 'non_compliant', 'pending', 'not_applicable'
  last_assessment_date DATE,
  next_assessment_date DATE,
  
  -- Responsible parties
  responsible_role TEXT,  -- Role responsible for compliance
  assigned_to UUID,  -- User assigned to manage this requirement
  
  -- Penalties and risks
  penalty_description TEXT,
  risk_level TEXT DEFAULT 'Medium',  -- 'Low', 'Medium', 'High', 'Critical'
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_tx_compliance_requirements_org_code UNIQUE (org_id, requirement_code),
  
  -- Check constraints
  CONSTRAINT chk_tx_compliance_requirements_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_tx_compliance_requirements_review_freq CHECK (review_frequency_days IS NULL OR review_frequency_days > 0),
  CONSTRAINT chk_tx_compliance_requirements_retention CHECK (evidence_retention_years IS NULL OR evidence_retention_years > 0),
  CONSTRAINT chk_tx_compliance_requirements_type CHECK (requirement_type IN ('reporting', 'operational', 'documentation', 'audit', 'certification', 'training')),
  CONSTRAINT chk_tx_compliance_requirements_category CHECK (compliance_category IN ('emissions', 'energy_efficiency', 'renewable_energy', 'reliability', 'security', 'safety', 'environmental')),
  CONSTRAINT chk_tx_compliance_requirements_status CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'not_applicable')),
  CONSTRAINT chk_tx_compliance_requirements_risk CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_tx_compliance_requirements_scope CHECK (applies_to_scope IN ('org', 'substation', 'feeder', 'all_transmission'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_org ON tx_compliance_requirements(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_standard ON tx_compliance_requirements(standard_reference);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_type ON tx_compliance_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_category ON tx_compliance_requirements(compliance_category);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_status ON tx_compliance_requirements(compliance_status);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_risk ON tx_compliance_requirements(risk_level);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_effective ON tx_compliance_requirements(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_next_review ON tx_compliance_requirements(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_assigned ON tx_compliance_requirements(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_compliance_requirements_org_status ON tx_compliance_requirements(org_id, compliance_status);

-- Enable RLS
ALTER TABLE tx_compliance_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_compliance_requirements_tenant_isolation ON tx_compliance_requirements
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_compliance_requirements TO authenticated;

-- Add comments
COMMENT ON TABLE tx_compliance_requirements IS 'Regulatory compliance requirements and tracking for transmission operations';
COMMENT ON COLUMN tx_compliance_requirements.standard_reference IS 'Reference to regulatory standard (ISO 50001, NERC CIP, EPA GHG Reporting, etc.)';
COMMENT ON COLUMN tx_compliance_requirements.evidence_types IS 'Array of required evidence types (reports, certifications, audits, etc.)';
COMMENT ON COLUMN tx_compliance_requirements.scope_filter IS 'JSON filters defining requirement applicability (voltage_level, region, etc.)';
COMMENT ON CONSTRAINT uq_tx_compliance_requirements_org_code ON tx_compliance_requirements IS 'Natural key: compliance requirements are unique by (org_id, requirement_code)';


-- ============================================================================
-- TX COMPLIANCE EVIDENCE TABLE
-- ============================================================================

-- Create tx_compliance_evidence table for supporting documentation
CREATE TABLE IF NOT EXISTS tx_compliance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES tx_compliance_requirements(id) ON DELETE CASCADE,
  
  -- Evidence details
  evidence_type TEXT NOT NULL,  -- 'report', 'certificate', 'audit', 'measurement', 'document', 'system_data'
  evidence_title TEXT NOT NULL,
  description TEXT,
  
  -- Document reference
  document_url TEXT,  -- URL to stored document
  document_hash TEXT,  -- Hash for integrity verification
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- System data reference
  data_source TEXT,  -- 'energy_emissions_snapshots', 'energy_kpi_snapshots', 'export_jobs', etc.
  data_reference_id UUID,  -- Reference to system data record
  data_query TEXT,  -- Query used to generate evidence
  
  -- Temporal validity
  evidence_date DATE NOT NULL,
  valid_from DATE,
  valid_until DATE,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'superseded', 'expired', 'rejected'
  superseded_by UUID REFERENCES tx_compliance_evidence(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Check constraints
  CONSTRAINT chk_tx_compliance_evidence_dates CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CONSTRAINT chk_tx_compliance_evidence_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  CONSTRAINT chk_tx_compliance_evidence_type CHECK (evidence_type IN ('report', 'certificate', 'audit', 'measurement', 'document', 'system_data', 'photo', 'video')),
  CONSTRAINT chk_tx_compliance_evidence_status CHECK (status IN ('active', 'superseded', 'expired', 'rejected'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_org ON tx_compliance_evidence(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_requirement ON tx_compliance_evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_type ON tx_compliance_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_date ON tx_compliance_evidence(evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_status ON tx_compliance_evidence(status);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_verified ON tx_compliance_evidence(verified);
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_data_source ON tx_compliance_evidence(data_source) WHERE data_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_data_ref ON tx_compliance_evidence(data_reference_id) WHERE data_reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_compliance_evidence_org_req ON tx_compliance_evidence(org_id, requirement_id);

-- Enable RLS
ALTER TABLE tx_compliance_evidence ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_compliance_evidence_tenant_isolation ON tx_compliance_evidence
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_compliance_evidence TO authenticated;

-- Add comments
COMMENT ON TABLE tx_compliance_evidence IS 'Supporting evidence and documentation for compliance requirements';
COMMENT ON COLUMN tx_compliance_evidence.document_hash IS 'Hash of document for integrity verification';
COMMENT ON COLUMN tx_compliance_evidence.data_source IS 'System table that generated this evidence (for system-generated evidence)';
COMMENT ON COLUMN tx_compliance_evidence.data_reference_id IS 'Reference to specific record in data_source table';


-- ============================================================================
-- REPORT TEMPLATES TABLE
-- ============================================================================

-- Create report_templates table for ESG reporting
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_code TEXT NOT NULL,  -- Natural key
  template_name TEXT NOT NULL,
  description TEXT,
  
  -- Template type
  report_type TEXT NOT NULL,  -- 'esg', 'emissions', 'energy_efficiency', 'renewable_energy', 'compliance', 'custom'
  report_category TEXT,  -- 'sustainability', 'regulatory', 'operational', 'financial'
  
  -- Template definition
  template_version INTEGER DEFAULT 1,
  data_sources TEXT[] NOT NULL,  -- Array of table names used in report
  query_definitions JSONB NOT NULL,  -- JSON defining queries for each section
  calculation_formulas JSONB DEFAULT '{}',  -- JSON defining calculations
  
  -- Output configuration
  output_format TEXT[] DEFAULT ARRAY['pdf'],  -- 'pdf', 'excel', 'csv', 'json'
  sections JSONB NOT NULL,  -- JSON defining report sections and layout
  
  -- Scheduling
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_frequency TEXT,  -- 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  schedule_day_of_week INTEGER,  -- 1-7 for weekly
  schedule_day_of_month INTEGER,  -- 1-31 for monthly
  schedule_month INTEGER,  -- 1-12 for annually
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  
  -- Access control
  public_template BOOLEAN DEFAULT false,  -- Available to all users in org
  owner_id UUID,  -- User who created the template
  shared_with UUID[],  -- Array of user IDs with access
  
  -- Status
  active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  superseded_by UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_report_templates_org_code UNIQUE (org_id, template_code),
  
  -- Check constraints
  CONSTRAINT chk_report_templates_version CHECK (template_version > 0),
  CONSTRAINT chk_report_templates_schedule_dow CHECK (schedule_day_of_week IS NULL OR (schedule_day_of_week >= 1 AND schedule_day_of_week <= 7)),
  CONSTRAINT chk_report_templates_schedule_dom CHECK (schedule_day_of_month IS NULL OR (schedule_day_of_month >= 1 AND schedule_day_of_month <= 31)),
  CONSTRAINT chk_report_templates_schedule_month CHECK (schedule_month IS NULL OR (schedule_month >= 1 AND schedule_month <= 12)),
  CONSTRAINT chk_report_templates_type CHECK (report_type IN ('esg', 'emissions', 'energy_efficiency', 'renewable_energy', 'compliance', 'custom', 'audit')),
  CONSTRAINT chk_report_templates_category CHECK (report_category IN ('sustainability', 'regulatory', 'operational', 'financial', 'technical')),
  CONSTRAINT chk_report_templates_frequency CHECK (schedule_frequency IS NULL OR schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(report_category);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_published ON report_templates(org_id, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_owner ON report_templates(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_templates_schedule ON report_templates(next_generation_at) WHERE schedule_enabled = true AND active = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_public ON report_templates(org_id) WHERE public_template = true;

-- GIN index for shared_with array
CREATE INDEX IF NOT EXISTS idx_report_templates_shared_gin ON report_templates USING GIN (shared_with);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY report_templates_tenant_isolation ON report_templates
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON report_templates TO authenticated;

-- Add comments
COMMENT ON TABLE report_templates IS 'Report template definitions for ESG and compliance reporting';
COMMENT ON COLUMN report_templates.data_sources IS 'Array of table names that provide data for this report';
COMMENT ON COLUMN report_templates.query_definitions IS 'JSON defining queries for each report section';
COMMENT ON COLUMN report_templates.sections IS 'JSON defining report sections, layout, and formatting';
COMMENT ON COLUMN report_templates.shared_with IS 'Array of user UUIDs who have access to this template';
COMMENT ON CONSTRAINT uq_report_templates_org_code ON report_templates IS 'Natural key: report templates are unique by (org_id, template_code)';


-- ============================================================================
-- EXPORT JOBS TABLE
-- ============================================================================

-- Create export_jobs table for tracking report generation
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL,  -- 'report', 'data_export', 'audit_export', 'compliance_package'
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  
  -- Export parameters
  export_format TEXT NOT NULL,  -- 'pdf', 'excel', 'csv', 'json'
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB DEFAULT '{}',  -- Additional filters applied to export
  
  -- Status tracking
  status TEXT DEFAULT 'pending',  -- 'pending', 'queued', 'running', 'completed', 'failed', 'cancelled'
  progress_percentage INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timing
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- When the download link expires
  
  -- Output
  output_file_url TEXT,
  output_file_name TEXT,
  output_file_size_bytes BIGINT,
  row_count INTEGER,  -- Number of rows/records in export
  
  -- Metadata
  generation_metadata JSONB DEFAULT '{}',  -- Template version, data sources, etc.
  requested_by UUID,  -- User who requested the export
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Check constraints
  CONSTRAINT chk_export_jobs_date_range CHECK (date_range_end IS NULL OR date_range_end >= date_range_start),
  CONSTRAINT chk_export_jobs_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT chk_export_jobs_retry CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT chk_export_jobs_file_size CHECK (output_file_size_bytes IS NULL OR output_file_size_bytes > 0),
  CONSTRAINT chk_export_jobs_row_count CHECK (row_count IS NULL OR row_count >= 0),
  CONSTRAINT chk_export_jobs_timing CHECK (
    (started_at IS NULL OR started_at >= queued_at) AND
    (completed_at IS NULL OR completed_at >= started_at)
  ),
  CONSTRAINT chk_export_jobs_type CHECK (job_type IN ('report', 'data_export', 'audit_export', 'compliance_package', 'dashboard_export')),
  CONSTRAINT chk_export_jobs_format CHECK (export_format IN ('pdf', 'excel', 'csv', 'json', 'xml')),
  CONSTRAINT chk_export_jobs_status CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'))
);

-- Ensure all columns exist (table may have been created by an earlier migration with a simpler schema)
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS export_format TEXT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS date_range_start TIMESTAMPTZ;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS date_range_end TIMESTAMPTZ;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '{}';
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS output_file_url TEXT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS output_file_name TEXT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS output_file_size_bytes BIGINT;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS row_count INTEGER;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE export_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_export_jobs_org ON export_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_template ON export_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_type ON export_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_export_jobs_requested_by ON export_jobs(requested_by);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created ON export_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_completed ON export_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_export_jobs_expires ON export_jobs(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_export_jobs_org_status ON export_jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_pending ON export_jobs(created_at) WHERE status IN ('pending', 'queued');

-- Enable RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY export_jobs_tenant_isolation ON export_jobs
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON export_jobs TO authenticated;

-- Add comments
COMMENT ON TABLE export_jobs IS 'Export job tracking for reports and data exports';
COMMENT ON COLUMN export_jobs.status IS 'Job status: pending → queued → running → completed/failed/cancelled';
COMMENT ON COLUMN export_jobs.expires_at IS 'When the download link expires (typically 7-30 days after completion)';
COMMENT ON COLUMN export_jobs.generation_metadata IS 'Metadata about report generation (template version, data sources, etc.)';
-- COMMENT ON CONSTRAINT chk_export_jobs_timing ON export_jobs IS 'Ensures timestamps are monotonically increasing';


-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Add updated_at triggers for all tables
CREATE TRIGGER tr_emission_factors_updated_at
  BEFORE UPDATE ON emission_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_delivery_context_updated_at
  BEFORE UPDATE ON tx_delivery_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_energy_emissions_snapshots_updated_at
  BEFORE UPDATE ON energy_emissions_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_renewables_contracts_updated_at
  BEFORE UPDATE ON tx_renewables_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_compliance_requirements_updated_at
  BEFORE UPDATE ON tx_compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_compliance_evidence_updated_at
  BEFORE UPDATE ON tx_compliance_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_export_jobs_updated_at
  BEFORE UPDATE ON export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate energy intensity (kg CO2e per MWh delivered)
CREATE OR REPLACE FUNCTION fn_calculate_energy_intensity(
  p_org_id UUID,
  p_scope_type TEXT,
  p_scope_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  co2e_per_mwh_delivered DECIMAL(10,4),
  total_co2e_kg DECIMAL(15,4),
  total_mwh_delivered DECIMAL(15,4),
  losses_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN dc.mwh_delivered > 0 THEN (es.total_co2e_kg / dc.mwh_delivered)
      ELSE NULL
    END as co2e_per_mwh_delivered,
    es.total_co2e_kg,
    dc.mwh_delivered as total_mwh_delivered,
    dc.losses_percentage
  FROM (
    SELECT 
      SUM(co2e_kg) as total_co2e_kg
    FROM energy_emissions_snapshots
    WHERE org_id = p_org_id
      AND scope_type = p_scope_type
      AND scope_id = p_scope_id
      AND period_start >= p_period_start
      AND period_end <= p_period_end
  ) es
  CROSS JOIN (
    SELECT 
      SUM(mwh_delivered) as mwh_delivered,
      AVG(losses_percentage) as losses_percentage
    FROM tx_delivery_context
    WHERE org_id = p_org_id
      AND scope_type = p_scope_type
      AND scope_id = p_scope_id
      AND period_start >= p_period_start
      AND period_end <= p_period_end
  ) dc;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_energy_intensity(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates energy intensity (kg CO2e per MWh delivered) for transmission operations';


-- Function to get active emission factor for a given date and energy type
CREATE OR REPLACE FUNCTION fn_get_emission_factor(
  p_org_id UUID,
  p_energy_type TEXT,
  p_date DATE
)
RETURNS TABLE (
  factor_id UUID,
  kg_co2e_per_kwh DECIMAL(10,6),
  factor_code TEXT,
  ghg_scope TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.id as factor_id,
    ef.kg_co2e_per_kwh,
    ef.factor_code,
    ef.scope as ghg_scope
  FROM emission_factors ef
  WHERE ef.org_id = p_org_id
    AND ef.energy_type = p_energy_type
    AND ef.effective_date <= p_date
    AND (ef.expiry_date IS NULL OR ef.expiry_date > p_date)
    AND ef.active = true
  ORDER BY 
    ef.default_factor DESC,  -- Prefer default factor
    ef.effective_date DESC   -- Then most recent
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_emission_factor(UUID, TEXT, DATE) IS 'Returns the active emission factor for a given energy type and date';


-- Function to calculate renewable energy percentage
CREATE OR REPLACE FUNCTION fn_calculate_renewable_percentage(
  p_org_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  renewable_percentage DECIMAL(5,2),
  renewable_mwh DECIMAL(15,4),
  total_consumption_mwh DECIMAL(15,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN total_consumption > 0 THEN (renewable_generation / total_consumption * 100)
      ELSE 0
    END as renewable_percentage,
    renewable_generation as renewable_mwh,
    total_consumption as total_consumption_mwh
  FROM (
    SELECT 
      COALESCE(SUM(CASE WHEN rc.renewable_type IS NOT NULL THEN ga.current_output_kw * EXTRACT(EPOCH FROM (p_period_end - p_period_start)) / 3600000 ELSE 0 END), 0) as renewable_generation,
      COALESCE(SUM(dc.mwh_delivered), 0) as total_consumption
    FROM tx_delivery_context dc
    LEFT JOIN generation_assets ga ON ga.org_id = dc.org_id
    LEFT JOIN tx_renewables_contracts rc ON rc.org_id = ga.org_id AND rc.status = 'active'
    WHERE dc.org_id = p_org_id
      AND dc.period_start >= p_period_start
      AND dc.period_end <= p_period_end
  ) calc;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_renewable_percentage(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates renewable energy percentage for a given period';
