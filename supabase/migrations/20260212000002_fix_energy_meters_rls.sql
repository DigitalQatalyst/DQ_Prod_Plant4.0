
-- Fix RLS policies for energy meters and related views for anon key access
-- This specifically enables the transmission energy meter registry view to be readable by the frontend

-- Enable RLS on core tables (if not already enabled)
ALTER TABLE IF EXISTS energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS energy_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS power_quality_events ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DO $$ 
BEGIN
  DROP POLICY IF EXISTS energy_meters_anon_access ON energy_meters;
  DROP POLICY IF EXISTS energy_baselines_anon_access ON energy_baselines;
  DROP POLICY IF EXISTS power_quality_events_anon_access ON power_quality_events;
END $$;

-- Create permissive policies for anon role (development)
CREATE POLICY energy_meters_anon_access ON energy_meters FOR SELECT TO anon USING (true);
CREATE POLICY energy_baselines_anon_access ON energy_baselines FOR SELECT TO anon USING (true);
CREATE POLICY power_quality_events_anon_access ON power_quality_events FOR SELECT TO anon USING (true);

-- Grant select permissions explicitly to anon
GRANT SELECT ON energy_meters TO anon;
GRANT SELECT ON energy_baselines TO anon;
GRANT SELECT ON power_quality_events TO anon;

-- Also grant access to the views
GRANT SELECT ON v_tx_energy_meter_registry TO anon;

COMMENT ON POLICY energy_meters_anon_access ON energy_meters IS 'Development policy - allows anon read access for energy monitoring.';
