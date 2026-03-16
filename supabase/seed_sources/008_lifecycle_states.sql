-- Seed data for lifecycle states (asset lifecycle stage definitions)
-- Requirements: 1.7, 9.1, 9.3, 9.4
-- Creates 15 lifecycle states: 5 states × 3 categories (electrical, protection, measurement)

BEGIN;

-- Precondition: Verify tenant exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
  ) THEN
    RAISE EXCEPTION 'Precondition failed: Transmission tenant does not exist';
  END IF;
END $$;

-- Upsert lifecycle states using CTE pattern
WITH tenant AS (
  SELECT id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
),
upsert_lifecycle_states AS (
  INSERT INTO lifecycle_states (tenant_id, asset_category, name, order_index, description)
  SELECT 
    tenant.id,
    v.asset_category,
    v.name,
    v.order_index,
    v.description
  FROM tenant
  CROSS JOIN (VALUES
    -- Electrical category (transformers, breakers, switchgear)
    ('electrical', 'Commissioning', 1, 'Asset is being installed and tested before service'),
    ('electrical', 'In Service', 2, 'Asset is operational and actively in use'),
    ('electrical', 'Standby', 3, 'Asset is available but not currently in active use'),
    ('electrical', 'Outage', 4, 'Asset is temporarily out of service for maintenance or repair'),
    ('electrical', 'Decommissioned', 5, 'Asset has been permanently removed from service'),
    
    -- Protection category (relays, protection systems)
    ('protection', 'Commissioning', 1, 'Protection system is being configured and tested'),
    ('protection', 'In Service', 2, 'Protection system is active and monitoring'),
    ('protection', 'Standby', 3, 'Protection system is configured but not actively monitoring'),
    ('protection', 'Outage', 4, 'Protection system is offline for maintenance or upgrade'),
    ('protection', 'Decommissioned', 5, 'Protection system has been retired'),
    
    -- Measurement category (meters, sensors, CTs, PTs)
    ('measurement', 'Commissioning', 1, 'Measurement device is being calibrated and installed'),
    ('measurement', 'In Service', 2, 'Measurement device is actively collecting data'),
    ('measurement', 'Standby', 3, 'Measurement device is installed but not actively used'),
    ('measurement', 'Outage', 4, 'Measurement device is offline for calibration or repair'),
    ('measurement', 'Decommissioned', 5, 'Measurement device has been removed from service')
  ) AS v(asset_category, name, order_index, description)
  ON CONFLICT (tenant_id, asset_category, name)
  DO UPDATE SET
    order_index = EXCLUDED.order_index,
    description = EXCLUDED.description
  RETURNING id
)
SELECT COUNT(*) FROM upsert_lifecycle_states;

-- Post-seed validation: Ensure minimum count
DO $$
DECLARE
  lifecycle_state_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lifecycle_state_count
  FROM lifecycle_states ls
  JOIN tenants t ON ls.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  IF lifecycle_state_count < 15 THEN
    RAISE EXCEPTION 'Post-seed validation failed: Expected >= 15 lifecycle states, found %', lifecycle_state_count;
  END IF;
END $$;

COMMIT;
