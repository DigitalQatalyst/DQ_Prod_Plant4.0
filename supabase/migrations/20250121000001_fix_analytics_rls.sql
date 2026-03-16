-- Fix RLS policies for analytics tables to work with anon key
-- This allows development access while maintaining tenant isolation structure

-- Drop existing restrictive policies (only if tables exist)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS energy_kpi_snapshots_tenant_isolation ON energy_kpi_snapshots;
  DROP POLICY IF EXISTS energy_benchmarks_tenant_isolation ON energy_benchmarks;
  DROP POLICY IF EXISTS energy_recommendations_tenant_isolation ON energy_recommendations;
  DROP POLICY IF EXISTS tx_demand_windows_tenant_isolation ON tx_demand_windows;
  
  -- Only drop if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'energy_anomalies') THEN
    DROP POLICY IF EXISTS energy_anomalies_tenant_isolation ON energy_anomalies;
  END IF;
END $$;

-- Create permissive policies for anon role (development)
-- In production, these would be replaced with proper tenant isolation

CREATE POLICY energy_kpi_snapshots_anon_access ON energy_kpi_snapshots
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY energy_benchmarks_anon_access ON energy_benchmarks
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY energy_recommendations_anon_access ON energy_recommendations
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY tx_demand_windows_anon_access ON tx_demand_windows
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policy for energy_anomalies only if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'energy_anomalies') THEN
    EXECUTE 'CREATE POLICY energy_anomalies_anon_access ON energy_anomalies FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Grant permissions to anon role (only for existing tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_kpi_snapshots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_benchmarks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_recommendations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_demand_windows TO anon;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'energy_anomalies') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON energy_anomalies TO anon;
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY energy_kpi_snapshots_anon_access ON energy_kpi_snapshots IS 'Development policy - allows anon access. Replace with tenant isolation in production.';
COMMENT ON POLICY energy_benchmarks_anon_access ON energy_benchmarks IS 'Development policy - allows anon access. Replace with tenant isolation in production.';
COMMENT ON POLICY energy_recommendations_anon_access ON energy_recommendations IS 'Development policy - allows anon access. Replace with tenant isolation in production.';
COMMENT ON POLICY tx_demand_windows_anon_access ON tx_demand_windows IS 'Development policy - allows anon access. Replace with tenant isolation in production.';

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'energy_anomalies') THEN
    COMMENT ON POLICY energy_anomalies_anon_access ON energy_anomalies IS 'Development policy - allows anon access. Replace with tenant isolation in production.';
  END IF;
END $$;
