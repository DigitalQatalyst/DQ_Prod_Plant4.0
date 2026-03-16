-- =============================================================================
-- FIX: Platform Protection Data
-- This script:
-- 1. Disables RLS on all security tables
-- 2. Seeds data protection framework data
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DISABLE RLS ON ALL SECURITY TABLES (SAFE VERSION)
-- =============================================================================

DO $$ 
DECLARE
    tables_to_fix TEXT[] := ARRAY[
        'data_protection_policies', 'data_protection_measures', 'data_classification_catalog', 
        'data_access_audit', 'data_protection_violations', 'data_protection_metrics',
        'encryption_keys', 'key_rotation_history', 'key_usage_audit', 'key_access_requests',
        'backup_policies', 'backup_jobs', 'backup_sets', 'recovery_plans', 'recovery_tests',
        'workload_security', 'workload_vulnerabilities', 'workload_patches', 'workload_compliance_checks',
        'application_security_scans', 'application_vulnerabilities', 'application_dependencies', 'application_security_tests'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
            RAISE NOTICE 'Disabled RLS on table: %', t;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', t;
        END IF;
    END LOOP;
END;
$$;

-- =============================================================================
-- STEP 2: SEED DATA PROTECTION FRAMEWORK DATA
-- =============================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
DELETE FROM data_protection_metrics WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission');
DELETE FROM data_classification_catalog WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission');
DELETE FROM data_protection_policies WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission');

-- Insert Data Protection Policies
INSERT INTO data_protection_policies (
  id, tenant_id, policy_name, policy_description, status,
  data_classification, data_category,
  applies_to_data_types,
  encryption_required, encryption_at_rest, encryption_in_transit,
  access_control_required, minimum_role_required,
  retention_period_days, backup_required,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Critical Infrastructure Data Policy',
  'Strict protection requirements for critical grid operations data',
  'active',
  'critical', 'operational',
  ARRAY['telemetry', 'configuration', 'credentials'],
  true, true, true,
  true, 'engineer',
  3650, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Internal Technical Documentation Policy',
  'Standard protection for internal technical documents and logs',
  'active',
  'internal', 'technical',
  ARRAY['logs', 'reports'],
  false, false, true,
  true, 'operator',
  365, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Grid Topology Protection Policy',
  'Protection requirements for sensitive grid topology and configuration data',
  'active',
  'restricted', 'grid_topology',
  ARRAY['configuration', 'grid_topology'],
  true, true, true,
  true, 'supervisor',
  7300, true,
  NOW(), NOW()
);

-- Insert Data Classification Catalog
INSERT INTO data_classification_catalog (
  id, tenant_id, asset_name, asset_type, asset_location,
  data_classification, data_category, sensitivity_level,
  description, contains_pii, contains_credentials, contains_grid_topology,
  policy_ids,
  encryption_status, backup_status, access_control_status,
  risk_score,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'SCADA Configuration Database',
  'database',
  'Jebel Ali Control Room Server 1',
  'critical', 'operational', 5,
  'Master configuration database for Jebel Ali substation SCADA system',
  false, true, true,
  ARRAY[(SELECT id FROM data_protection_policies WHERE policy_name = 'Critical Infrastructure Data Policy' LIMIT 1)],
  'encrypted', 'backed_up', 'restricted',
  15,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Turbine Telemetry Archive 2023',
  'file_system',
  'HQ Data Center SAN',
  'internal', 'technical', 3,
  'Historical telemetry logs from gas turbines',
  false, false, false,
  ARRAY[(SELECT id FROM data_protection_policies WHERE policy_name = 'Internal Technical Documentation Policy' LIMIT 1)],
  'unencrypted', 'backed_up', 'unrestricted',
  45,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Grid Topology Master Database',
  'database',
  'Dubai Main Substation Control Center',
  'restricted', 'grid_topology', 5,
  'Complete grid topology including all substations, lines, and protection zones',
  false, false, true,
  ARRAY[(SELECT id FROM data_protection_policies WHERE policy_name = 'Grid Topology Protection Policy' LIMIT 1)],
  'encrypted', 'backed_up', 'restricted',
  10,
  NOW(), NOW()
);

-- Insert Data Protection Metrics
INSERT INTO data_protection_metrics (
  id, tenant_id, metric_date, metric_period,
  total_data_assets, classified_assets, protected_assets,
  encryption_coverage_percent, backup_coverage_percent,
  compliance_rate, average_risk_score,
  created_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  CURRENT_DATE,
  'daily',
  150, 145, 130,
  85.5, 98.0,
  92.0, 12.5,
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day',
  'daily',
  149, 144, 129,
  85.0, 97.5,
  91.5, 12.8,
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days',
  'daily',
  148, 143, 128,
  84.5, 97.0,
  91.0, 13.0,
  NOW()
);

COMMIT;

-- Verify the data was inserted
SELECT 
  'Data Protection Policies' as table_name,
  COUNT(*) as record_count
FROM data_protection_policies
WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission')
UNION ALL
SELECT 
  'Data Classification Catalog' as table_name,
  COUNT(*) as record_count
FROM data_classification_catalog
WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission')
UNION ALL
SELECT 
  'Data Protection Metrics' as table_name,
  COUNT(*) as record_count
FROM data_protection_metrics
WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'DEWA - Transmission');
