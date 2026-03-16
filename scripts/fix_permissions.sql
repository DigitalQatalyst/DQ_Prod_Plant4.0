
-- Fix permissions for transmission tables
-- Grant usage on schema public to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Drop existing isolation policies that rely on current_setting('app.current_tenant_id')
-- These cause 400 errors when the setting is not present.
DO $$ 
BEGIN
  -- Sustainability policies
  DROP POLICY IF EXISTS emission_factors_tenant_isolation ON emission_factors;
  DROP POLICY IF EXISTS tx_delivery_context_tenant_isolation ON tx_delivery_context;
  DROP POLICY IF EXISTS energy_emissions_snapshots_tenant_isolation ON energy_emissions_snapshots;
  DROP POLICY IF EXISTS tx_renewables_contracts_tenant_isolation ON tx_renewables_contracts;
  DROP POLICY IF EXISTS tx_compliance_requirements_tenant_isolation ON tx_compliance_requirements;
  DROP POLICY IF EXISTS tx_compliance_evidence_tenant_isolation ON tx_compliance_evidence;
  DROP POLICY IF EXISTS report_templates_tenant_isolation ON report_templates;
  DROP POLICY IF EXISTS export_jobs_tenant_isolation ON export_jobs;
  
  -- Topology policies (if they exist from other migrations)
  DROP POLICY IF EXISTS tx_substations_tenant_isolation ON tx_substations;
  DROP POLICY IF EXISTS tx_feeders_tenant_isolation ON tx_feeders;
  DROP POLICY IF EXISTS tx_transformers_tenant_isolation ON tx_transformers;
  DROP POLICY IF EXISTS tx_lines_tenant_isolation ON tx_lines;
  DROP POLICY IF EXISTS energy_meters_tenant_isolation ON energy_meters;
  DROP POLICY IF EXISTS energy_telemetry_tenant_isolation ON energy_telemetry;
  
  -- Previous permissive policies
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_substations;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_feeders;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_transformers;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_lines;
  DROP POLICY IF EXISTS "Allow read access for all" ON energy_meters;
  DROP POLICY IF EXISTS "Allow read access for all" ON energy_telemetry;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_delivery_context;
  DROP POLICY IF EXISTS "Allow read access for all" ON energy_emissions_snapshots;
  DROP POLICY IF EXISTS "Allow read access for all" ON emission_factors;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_renewables_contracts;
  DROP POLICY IF EXISTS "Allow read access for all" ON tx_compliance_requirements;
END $$;

-- Grant SELECT on tables to authenticated and anon users
GRANT SELECT ON TABLE tx_substations TO authenticated, anon;
GRANT SELECT ON TABLE tx_feeders TO authenticated, anon;
GRANT SELECT ON TABLE tx_transformers TO authenticated, anon;
GRANT SELECT ON TABLE tx_bays TO authenticated, anon;
GRANT SELECT ON TABLE tx_lines TO authenticated, anon;
GRANT SELECT ON TABLE energy_meters TO authenticated, anon;
GRANT SELECT ON TABLE energy_telemetry TO authenticated, anon;
GRANT SELECT ON TABLE energy_baselines TO authenticated, anon;
GRANT SELECT ON TABLE power_quality_events TO authenticated, anon;
GRANT SELECT ON TABLE submeters TO authenticated, anon;

-- Sustainability Tables
GRANT SELECT ON TABLE emission_factors TO authenticated, anon;
GRANT SELECT ON TABLE tx_delivery_context TO authenticated, anon;
GRANT SELECT ON TABLE energy_emissions_snapshots TO authenticated, anon;
GRANT SELECT ON TABLE tx_renewables_contracts TO authenticated, anon;
GRANT SELECT ON TABLE tx_compliance_requirements TO authenticated, anon;
GRANT SELECT ON TABLE tx_compliance_evidence TO authenticated, anon;
GRANT SELECT ON TABLE report_templates TO authenticated, anon;
GRANT SELECT ON TABLE export_jobs TO authenticated, anon;

-- Grant access to sequences if any (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Enable RLS on tables
ALTER TABLE tx_substations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tx_feeders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tx_transformers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tx_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE tx_delivery_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_emissions_snapshots ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for both authenticated and anon users
CREATE POLICY "Allow read access for all" ON tx_substations FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON tx_feeders FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON tx_transformers FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON tx_lines FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON energy_meters FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON energy_telemetry FOR SELECT USING (true);

-- Sustainability Table Policies
CREATE POLICY "Allow read access for all" ON tx_delivery_context FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON energy_emissions_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON emission_factors FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON tx_renewables_contracts FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON tx_compliance_requirements FOR SELECT USING (true);

-- Ensure service_role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
