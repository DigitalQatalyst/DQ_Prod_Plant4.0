-- Seed 011: Connectivity Data
-- Inserts connection endpoints and stream configs for Cycle 4

-- ============================================================================
-- Preconditions: Verify tenant exists
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_tenant_count INTEGER;
BEGIN
  -- Check tenant exists
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Transmission tenant not found. Run 001_transmission_tenant.sql first.';
  END IF;
  
  -- Get tenant ID for use in seed
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE scenario_tag = 'power_transmission_demo_v1';
  
  RAISE NOTICE 'Preconditions passed. Tenant ID: %', v_tenant_id;
END $$;

-- ============================================================================
-- Seed: Connection Endpoints (6 endpoints: 2 per protocol)
-- ============================================================================

WITH tenant_ref AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE scenario_tag = 'power_transmission_demo_v1'
)
INSERT INTO connection_endpoints (
  tenant_id,
  name,
  protocol,
  address,
  port,
  zone,
  status,
  last_seen,
  description
)
SELECT
  tenant_id,
  name,
  protocol,
  address,
  port,
  zone,
  status,
  last_seen,
  description
FROM tenant_ref, (VALUES
  -- IEC61850 endpoints
  (
    'IED Gateway Primary',
    'IEC61850',
    '10.20.30.100',
    102,
    'OT',
    'up',
    now() - interval '5 minutes',
    'Primary IED gateway for substation protection devices'
  ),
  (
    'IED Gateway Backup',
    'IEC61850',
    '10.20.30.101',
    102,
    'OT',
    'up',
    now() - interval '10 minutes',
    'Backup IED gateway for redundancy'
  ),
  -- DNP3 endpoints
  (
    'SCADA RTU Bridge',
    'DNP3',
    '10.20.40.50',
    20000,
    'OT',
    'up',
    now() - interval '2 minutes',
    'DNP3 bridge to legacy SCADA RTUs'
  ),
  (
    'Field RTU Collector',
    'DNP3',
    '10.20.40.51',
    20000,
    'OT',
    'down',
    now() - interval '2 hours',
    'Field RTU collector for remote substations'
  ),
  -- OPC-UA endpoints
  (
    'HMI Data Server',
    'OPC-UA',
    'opc.tcp://10.20.50.10:4840',
    4840,
    'DMZ',
    'up',
    now() - interval '1 minute',
    'OPC-UA server for HMI integration'
  ),
  (
    'Historian Gateway',
    'OPC-UA',
    'opc.tcp://10.20.50.11:4840',
    4840,
    'IT',
    'up',
    now() - interval '3 minutes',
    'OPC-UA gateway to enterprise historian'
  )
) AS endpoints(name, protocol, address, port, zone, status, last_seen, description)
ON CONFLICT (tenant_id, name) 
DO UPDATE SET
  protocol = EXCLUDED.protocol,
  address = EXCLUDED.address,
  port = EXCLUDED.port,
  zone = EXCLUDED.zone,
  status = EXCLUDED.status,
  last_seen = EXCLUDED.last_seen,
  description = EXCLUDED.description;

-- ============================================================================
-- Seed: Stream Configs (3 configs: one per profile)
-- ============================================================================

WITH tenant_ref AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE scenario_tag = 'power_transmission_demo_v1'
)
INSERT INTO stream_configs (
  tenant_id,
  name,
  polling_interval,
  retention,
  profile,
  asset_types,
  is_sandbox,
  description
)
SELECT
  tenant_id,
  name,
  polling_interval,
  retention,
  profile,
  asset_types,
  is_sandbox,
  description
FROM tenant_ref, (VALUES
  -- High-frequency profile
  (
    'Critical Protection Monitoring',
    1000,
    '7d',
    'high-frequency',
    ARRAY['PROT_RELAY', 'CIRCUIT_BREAKER'],
    false,
    'High-frequency monitoring for critical protection devices (1s polling, 7 day retention)'
  ),
  -- Standard profile
  (
    'Standard Telemetry',
    15000,
    '30d',
    'standard',
    ARRAY['TRANSFORMER', 'VOLTAGE_REGULATOR', 'CAPACITOR_BANK'],
    false,
    'Standard telemetry collection for operational assets (15s polling, 30 day retention)'
  ),
  -- Low-frequency profile
  (
    'Environmental Monitoring',
    300000,
    '90d',
    'low-frequency',
    ARRAY['WEATHER_STATION', 'TEMP_SENSOR'],
    false,
    'Low-frequency environmental data collection (5min polling, 90 day retention)'
  )
) AS configs(name, polling_interval, retention, profile, asset_types, is_sandbox, description)
ON CONFLICT (tenant_id, name)
DO UPDATE SET
  polling_interval = EXCLUDED.polling_interval,
  retention = EXCLUDED.retention,
  profile = EXCLUDED.profile,
  asset_types = EXCLUDED.asset_types,
  is_sandbox = EXCLUDED.is_sandbox,
  description = EXCLUDED.description;

-- ============================================================================
-- Post-Seed Validation
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_endpoint_count INTEGER;
  v_stream_count INTEGER;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE scenario_tag = 'power_transmission_demo_v1';
  
  -- Validate connection endpoints count
  SELECT COUNT(*) INTO v_endpoint_count
  FROM connection_endpoints
  WHERE tenant_id = v_tenant_id;
  
  IF v_endpoint_count < 6 THEN
    RAISE EXCEPTION 'SEED 011_connectivity_data.sql FAILED: expected >= 6 connection_endpoints, found %', v_endpoint_count;
  END IF;
  
  -- Validate stream configs count
  SELECT COUNT(*) INTO v_stream_count
  FROM stream_configs
  WHERE tenant_id = v_tenant_id;
  
  IF v_stream_count < 3 THEN
    RAISE EXCEPTION 'SEED 011_connectivity_data.sql FAILED: expected >= 3 stream_configs, found %', v_stream_count;
  END IF;
  
  RAISE NOTICE 'Seed validation passed: % connection_endpoints, % stream_configs', v_endpoint_count, v_stream_count;
END $$;
