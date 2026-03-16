-- Seed data for Discovery & Onboarding
-- Requirements: 9.1, 9.3, 9.4
-- Creates: 3 discovery jobs, 3 discovery agents, 6 candidate assets, 2 asset imports

BEGIN;

-- Precondition: Verify tenant exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Transmission tenant does not exist. Run 001_transmission_tenant.sql first.';
  END IF;
END $$;

-- Precondition: Verify asset_types exist
DO $$
DECLARE
  asset_type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO asset_type_count
  FROM asset_types at
  JOIN tenants t ON at.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1'
    AND at.code IN ('TRANSFORMER', 'BREAKER', 'BAY', 'METER');
  
  IF asset_type_count < 4 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 4 asset types, found %. Run 003_assets.sql first.', asset_type_count;
  END IF;
END $$;

-- Upsert discovery jobs using CTE pattern
WITH tenant AS (
  SELECT id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
),
upsert_discovery_jobs AS (
  INSERT INTO discovery_jobs (tenant_id, name, type, scope, status, found_count, last_run_at, description)
  SELECT 
    tenant.id,
    v.name,
    v.type,
    v.scope::JSONB,
    v.status,
    v.found_count,
    v.last_run_at,
    v.description
  FROM tenant
  CROSS JOIN (VALUES
    (
      'Network Scan - Substation A',
      'network',
      '{"ipRange": "10.20.30.0/24"}',
      'completed',
      4,
      now() - interval '2 hours',
      'Automated network discovery of substation A equipment'
    ),
    (
      'Topology Discovery - Grid Lines',
      'topology',
      '{"nodeIds": ["node-1", "node-2", "node-3"]}',
      'running',
      0,
      now() - interval '30 minutes',
      'Discovering assets along grid topology paths'
    ),
    (
      'Geographic Survey - Al Aweer Region',
      'geographic',
      '{"geoArea": {"lat": 25.1234, "lng": 55.4567, "radiusKm": 10}}',
      'failed',
      0,
      now() - interval '1 day',
      'Geographic discovery in Al Aweer region'
    )
  ) AS v(name, type, scope, status, found_count, last_run_at, description)
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    scope = EXCLUDED.scope,
    status = EXCLUDED.status,
    found_count = EXCLUDED.found_count,
    last_run_at = EXCLUDED.last_run_at,
    description = EXCLUDED.description
  RETURNING id, name
),
-- Upsert discovery agents
upsert_discovery_agents AS (
  INSERT INTO discovery_agents (tenant_id, name, type, protocols, status, assigned_scopes, last_run, description)
  SELECT 
    tenant.id,
    v.name,
    v.type,
    v.protocols,
    v.status,
    v.assigned_scopes::JSONB,
    v.last_run,
    v.description
  FROM tenant
  CROSS JOIN (VALUES
    (
      'IED Gateway 01',
      'ied_gateway',
      ARRAY['IEC61850', 'DNP3'],
      'active',
      '[{"ipRange": "10.20.30.0/24"}]',
      now() - interval '1 hour',
      'Primary IED gateway for substation equipment'
    ),
    (
      'SCADA Bridge 01',
      'scada_bridge',
      ARRAY['DNP3', 'Modbus-TCP'],
      'active',
      '[{"nodeIds": ["node-1", "node-2"]}]',
      now() - interval '3 hours',
      'SCADA system integration bridge'
    ),
    (
      'RTU Collector 01',
      'rtu_collector',
      ARRAY['DNP3', 'IEC61850', 'OPC-UA'],
      'inactive',
      '[]',
      now() - interval '2 days',
      'Remote terminal unit data collector'
    )
  ) AS v(name, type, protocols, status, assigned_scopes, last_run, description)
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    protocols = EXCLUDED.protocols,
    status = EXCLUDED.status,
    assigned_scopes = EXCLUDED.assigned_scopes,
    last_run = EXCLUDED.last_run,
    description = EXCLUDED.description
  RETURNING id, name
),
-- Get discovery job IDs for candidate assets
discovery_job_lookup AS (
  SELECT id, name FROM upsert_discovery_jobs
  UNION ALL
  SELECT dj.id, dj.name
  FROM discovery_jobs dj
  JOIN tenant ON dj.tenant_id = tenant.id
  WHERE dj.name IN ('Network Scan - Substation A', 'Topology Discovery - Grid Lines', 'Geographic Survey - Al Aweer Region')
),
-- Get asset type IDs for candidate assets
asset_type_lookup AS (
  SELECT at.id, at.code
  FROM asset_types at
  JOIN tenant ON at.tenant_id = tenant.id
  WHERE at.code IN ('TRANSFORMER', 'BREAKER', 'BAY', 'METER')
),
-- Get existing asset IDs for merge candidates
existing_asset_lookup AS (
  SELECT a.id, a.name
  FROM assets a
  JOIN tenant ON a.tenant_id = tenant.id
  LIMIT 2
),
-- Upsert candidate assets
upsert_candidate_assets AS (
  INSERT INTO candidate_assets (
    tenant_id, 
    discovery_job_id, 
    suggested_name, 
    suggested_type_id, 
    suggested_hierarchy,
    matched_existing_asset_id,
    confidence, 
    status, 
    raw_data
  )
  SELECT 
    tenant.id,
    djl.id,
    v.suggested_name,
    atl.id,
    v.suggested_hierarchy::JSONB,
    CASE WHEN v.has_match THEN eal.id ELSE NULL END,
    v.confidence,
    v.status,
    v.raw_data::JSONB
  FROM tenant
  CROSS JOIN (VALUES
    (
      'Network Scan - Substation A',
      'Transformer T-401',
      'TRANSFORMER',
      '{"site": "Dubai Main Substation", "bay": "Bay 4"}',
      false,
      0.95,
      'pending',
      '{"ip": "10.20.30.101", "protocol": "IEC61850", "manufacturer": "ABB"}'
    ),
    (
      'Network Scan - Substation A',
      'Breaker CB-402',
      'BREAKER',
      '{"site": "Dubai Main Substation", "bay": "Bay 4"}',
      false,
      0.92,
      'pending',
      '{"ip": "10.20.30.102", "protocol": "DNP3", "manufacturer": "Siemens"}'
    ),
    (
      'Network Scan - Substation A',
      'Meter M-403',
      'METER',
      '{"site": "Dubai Main Substation", "bay": "Bay 4"}',
      false,
      0.88,
      'pending',
      '{"ip": "10.20.30.103", "protocol": "Modbus-TCP", "manufacturer": "Schneider"}'
    ),
    (
      'Network Scan - Substation A',
      'Bay Controller BC-404',
      'BAY',
      '{"site": "Dubai Main Substation", "bay": "Bay 4"}',
      false,
      0.85,
      'approved',
      '{"ip": "10.20.30.104", "protocol": "IEC61850", "manufacturer": "GE"}'
    ),
    (
      'Network Scan - Substation A',
      'Existing Transformer Update',
      'TRANSFORMER',
      '{"site": "Jebel Ali Grid Station"}',
      true,
      0.78,
      'approved',
      '{"ip": "10.20.30.105", "protocol": "IEC61850", "updated_properties": {"capacity_mva": 150}}'
    ),
    (
      'Geographic Survey - Al Aweer Region',
      'Unknown Device X',
      'METER',
      '{"site": "Unknown", "location": "Al Aweer"}',
      false,
      0.45,
      'rejected',
      '{"ip": "10.20.30.200", "protocol": "Unknown", "reason": "Low confidence, unrecognized protocol"}'
    )
  ) AS v(job_name, suggested_name, asset_type_code, suggested_hierarchy, has_match, confidence, status, raw_data)
  JOIN discovery_job_lookup djl ON djl.name = v.job_name
  JOIN asset_type_lookup atl ON atl.code = v.asset_type_code
  LEFT JOIN LATERAL (
    SELECT id FROM existing_asset_lookup LIMIT 1 OFFSET (CASE WHEN v.has_match THEN 0 ELSE 1 END)
  ) eal ON v.has_match
  WHERE NOT EXISTS (
    SELECT 1 FROM candidate_assets ca
    WHERE ca.tenant_id = tenant.id
      AND ca.discovery_job_id = djl.id
      AND ca.suggested_name = v.suggested_name
  )
  RETURNING id
),
-- Upsert asset imports
upsert_asset_imports AS (
  INSERT INTO asset_imports (tenant_id, name, status, source_type, record_count, imported_count, errors, completed_at)
  SELECT 
    tenant.id,
    v.name,
    v.status,
    v.source_type,
    v.record_count,
    v.imported_count,
    v.errors::JSONB,
    v.completed_at
  FROM tenant
  CROSS JOIN (VALUES
    (
      'Q4 2024 Asset Inventory Import',
      'completed',
      'excel',
      125,
      125,
      NULL,
      now() - interval '5 days'
    ),
    (
      'Legacy System Migration - Batch 1',
      'failed',
      'csv',
      450,
      0,
      '[{"row": 15, "field": "asset_type_id", "message": "Invalid asset type code: UNKNOWN"}, {"row": 23, "field": "site_id", "message": "Site not found: Old Site Name"}]',
      now() - interval '2 days'
    )
  ) AS v(name, status, source_type, record_count, imported_count, errors, completed_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM asset_imports ai
    WHERE ai.tenant_id = tenant.id
      AND ai.name = v.name
  )
  RETURNING id
)
SELECT 
  (SELECT COUNT(*) FROM upsert_discovery_jobs) as jobs,
  (SELECT COUNT(*) FROM upsert_discovery_agents) as agents,
  (SELECT COUNT(*) FROM upsert_candidate_assets) as candidates,
  (SELECT COUNT(*) FROM upsert_asset_imports) as imports;

-- Post-seed validation: Ensure minimum counts
DO $$
DECLARE
  job_count INTEGER;
  agent_count INTEGER;
  candidate_count INTEGER;
  import_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM discovery_jobs dj
  JOIN tenants t ON dj.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  SELECT COUNT(*) INTO agent_count
  FROM discovery_agents da
  JOIN tenants t ON da.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  SELECT COUNT(*) INTO candidate_count
  FROM candidate_assets ca
  JOIN tenants t ON ca.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  SELECT COUNT(*) INTO import_count
  FROM asset_imports ai
  JOIN tenants t ON ai.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  IF job_count < 3 THEN
    RAISE EXCEPTION 'SEED 009_discovery_data FAILED: expected >= 3 discovery_jobs, found %', job_count;
  END IF;
  
  IF agent_count < 3 THEN
    RAISE EXCEPTION 'SEED 009_discovery_data FAILED: expected >= 3 discovery_agents, found %', agent_count;
  END IF;
  
  IF candidate_count < 6 THEN
    RAISE EXCEPTION 'SEED 009_discovery_data FAILED: expected >= 6 candidate_assets, found %', candidate_count;
  END IF;
  
  IF import_count < 2 THEN
    RAISE EXCEPTION 'SEED 009_discovery_data FAILED: expected >= 2 asset_imports, found %', import_count;
  END IF;
  
  RAISE NOTICE 'Post-seed validation passed: jobs=%, agents=%, candidates=%, imports=%', job_count, agent_count, candidate_count, import_count;
END $$;

COMMIT;
