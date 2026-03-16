
-- Fix RLS policies for transmission core tables to work with anon key
-- This ensures that the frontend can read topology and telemetry data

-- Enable RLS on core tables (making sure it is enabled)
ALTER TABLE IF EXISTS tx_substations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tx_feeders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tx_transformers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tx_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tx_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS energy_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submeters ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DO $$ 
BEGIN
  DROP POLICY IF EXISTS tx_substations_anon_access ON tx_substations;
  DROP POLICY IF EXISTS tx_feeders_anon_access ON tx_feeders;
  DROP POLICY IF EXISTS tx_transformers_anon_access ON tx_transformers;
  DROP POLICY IF EXISTS tx_bays_anon_access ON tx_bays;
  DROP POLICY IF EXISTS tx_lines_anon_access ON tx_lines;
  DROP POLICY IF EXISTS energy_telemetry_anon_access ON energy_telemetry;
  DROP POLICY IF EXISTS submeters_anon_access ON submeters;
END $$;

-- Create permissive policies for anon role (development)
CREATE POLICY tx_substations_anon_access ON tx_substations FOR SELECT TO anon USING (true);
CREATE POLICY tx_feeders_anon_access ON tx_feeders FOR SELECT TO anon USING (true);
CREATE POLICY tx_transformers_anon_access ON tx_transformers FOR SELECT TO anon USING (true);
CREATE POLICY tx_bays_anon_access ON tx_bays FOR SELECT TO anon USING (true);
CREATE POLICY tx_lines_anon_access ON tx_lines FOR SELECT TO anon USING (true);
CREATE POLICY energy_telemetry_anon_access ON energy_telemetry FOR SELECT TO anon USING (true);
CREATE POLICY submeters_anon_access ON submeters FOR SELECT TO anon USING (true);

-- Grant select permissions explicitly to anon
GRANT SELECT ON tx_substations TO anon;
GRANT SELECT ON tx_feeders TO anon;
GRANT SELECT ON tx_transformers TO anon;
GRANT SELECT ON tx_bays TO anon;
GRANT SELECT ON tx_lines TO anon;
GRANT SELECT ON energy_telemetry TO anon;
GRANT SELECT ON submeters TO anon;

COMMENT ON POLICY tx_substations_anon_access ON tx_substations IS 'Development policy - allows anon read access.';
COMMENT ON POLICY tx_feeders_anon_access ON tx_feeders IS 'Development policy - allows anon read access.';
