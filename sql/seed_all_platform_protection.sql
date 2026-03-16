-- =============================================================================
-- SEED: All Platform Protection Data
-- This script:
-- 1. Disables RLS on all security tables
-- 2. Seeds data for Data Protection, Encryption, Backup, Workload, and App Security
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
        'encryption_keys', 'key_rotation_history', 'key_usage_audit', 'key_access_requests', 'key_compliance_checks',
        'backup_policies', 'backup_jobs', 'backup_sets', 'backup_restore_points', 'backup_restore_jobs', 'backup_verification_tests',
        'workload_security', 'workload_vulnerabilities', 'workload_patches', 'workload_compliance_checks',
        'application_security_scans', 'application_vulnerabilities', 'application_dependencies', 'application_security_tests'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
            RAISE NOTICE 'Disabled RLS on table: %', t;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', t;
        END IF;
    END LOOP;
END;
$$;

-- =============================================================================
-- STEP 2: CLEAR EXISTING DATA FOR DEWA - TRANSMISSION
-- =============================================================================

DO $$
DECLARE
    tenant_uuid UUID;
BEGIN
    SELECT id INTO tenant_uuid FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF tenant_uuid IS NOT NULL THEN
        DELETE FROM application_security_scans WHERE tenant_id = tenant_uuid;
        DELETE FROM workload_security WHERE tenant_id = tenant_uuid;
        DELETE FROM backup_restore_points WHERE tenant_id = tenant_uuid;
        DELETE FROM backup_jobs WHERE tenant_id = tenant_uuid;
        DELETE FROM backup_policies WHERE tenant_id = tenant_uuid;
        DELETE FROM key_compliance_checks WHERE tenant_id = tenant_uuid;
        DELETE FROM key_rotation_history WHERE tenant_id = tenant_uuid;
        DELETE FROM encryption_keys WHERE tenant_id = tenant_uuid;
        DELETE FROM data_protection_metrics WHERE tenant_id = tenant_uuid;
        DELETE FROM data_classification_catalog WHERE tenant_id = tenant_uuid;
        DELETE FROM data_protection_policies WHERE tenant_id = tenant_uuid;
    END IF;
END;
$$;

-- =============================================================================
-- STEP 3: SEED DATA
-- =============================================================================

DO $$
DECLARE
    tid UUID;
BEGIN
    SELECT id INTO tid FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF tid IS NULL THEN
        RAISE EXCEPTION 'Tenant DEWA - Transmission not found';
    END IF;

    -- 3.1 Data Protection Policies
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
      gen_random_uuid(), tid, 'Critical Infrastructure Data Policy', 'Strict protection requirements for critical grid operations data', 'active',
      'critical', 'operational', ARRAY['telemetry', 'configuration', 'credentials'], true, true, true, true, 'engineer', 3650, true, NOW(), NOW()
    ),
    (
      gen_random_uuid(), tid, 'Internal Technical Documentation Policy', 'Standard protection for internal technical documents and logs', 'active',
      'internal', 'technical', ARRAY['logs', 'reports'], false, false, true, true, 'operator', 365, true, NOW(), NOW()
    );

    -- 3.2 Encryption Keys
    INSERT INTO encryption_keys (
      id, tenant_id, key_name, key_id, key_type, algorithm, key_size_bits, purpose, 
      status, creation_date, rotation_required, rotation_period_days, storage_location, 
      key_material_reference, created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(), tid, 'Grid-Master-Key', 'kms-key-001', 'master', 'AES-256', 256, 'data_encryption',
      'active', NOW() - INTERVAL '30 days', true, 90, 'kms', 'urn:kms:grid-master', NOW(), NOW()
    ),
    (
      gen_random_uuid(), tid, 'Telemetry-Encrypt-Key', 'kms-key-002', 'data_encryption', 'AES-256', 256, 'data_encryption',
      'active', NOW() - INTERVAL '15 days', true, 30, 'hsm', 'urn:hsm:telemetry-data', NOW(), NOW()
    );

    -- 3.3 Backup Policies
    INSERT INTO backup_policies (
      id, tenant_id, policy_name, policy_description, status, backup_scope, backup_type,
      schedule_frequency, schedule_cron, retention_period_days, storage_location, storage_path,
      encryption_enabled, created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(), tid, 'Daily Operational Backup', 'Daily incremental backup of SCADA databases', 'active', 'database', 'incremental',
      'daily', '0 2 * * *', 30, 'cloud_storage', 's3://dewa-backups/operational/', true, NOW(), NOW()
    );

    -- 3.4 Backup Jobs
    INSERT INTO backup_jobs (
      id, tenant_id, policy_id, policy_name, job_name, job_type, status, 
      backup_scope, backup_type, storage_location, storage_path, 
      actual_start, actual_end, duration_seconds, backup_size_bytes, 
      verification_passed, created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(), tid, (SELECT id FROM backup_policies WHERE policy_name = 'Daily Operational Backup' LIMIT 1), 
      'Daily Operational Backup', 'Daily_Op_BK_20240122', 'scheduled', 'completed',
      'database', 'incremental', 'cloud_storage', 's3://dewa-backups/operational/',
      NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 45 minutes', 900, 12884901888,
      true, NOW(), NOW()
    );

    -- 3.5 Workload Security
    INSERT INTO workload_security (
      id, tenant_id, workload_name, workload_type, deployment_environment, deployment_platform,
      status, health_status, security_baseline_id, baseline_version, baseline_compliance_status, 
      baseline_compliance_score, hardening_level, os_type, patch_level, 
      critical_vulnerabilities, high_vulnerabilities, created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(), tid, 'SCADA-Primary-Server', 'scada_interface', 'production', 'vm',
      'active', 'healthy', 'bsl-scada-01', 'v2.1', 'compliant', 95, 'enhanced', 'linux', 'current',
      0, 2, NOW(), NOW()
    ),
    (
      gen_random_uuid(), tid, 'Grid-API-Gateway', 'api_service', 'production', 'kubernetes',
      'active', 'healthy', 'bsl-api-01', 'v1.4', 'non_compliant', 78, 'standard', 'linux', 'outdated',
      1, 5, NOW(), NOW()
    );

    -- 3.6 Application Security Scans
    INSERT INTO application_security_scans (
      id, tenant_id, application_name, application_type, deployment_environment, 
      scan_id, scan_type, scan_tool, scan_status, scan_started_at, scan_completed_at,
      total_findings, critical_findings, high_findings, security_score, security_grade,
      overall_risk_level, created_at, updated_at
    ) VALUES
    (
      gen_random_uuid(), tid, 'Operational Dashboard', 'web_application', 'production',
      'scan-app-001', 'sast', 'sonarqube', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours',
      12, 0, 1, 92, 'A', 'low', NOW(), NOW()
    ),
    (
      gen_random_uuid(), tid, 'Substation Control API', 'api_service', 'production',
      'scan-app-002', 'dast', 'owasp_zap', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '47 hours',
      45, 2, 8, 65, 'C', 'high', NOW(), NOW()
    );

    -- 3.7 Data Protection Metrics
    INSERT INTO data_protection_metrics (
      id, tenant_id, metric_date, metric_period,
      total_data_assets, classified_assets, protected_assets,
      encryption_coverage_percent, backup_coverage_percent,
      compliance_rate, average_risk_score,
      created_at
    ) VALUES
    (
      gen_random_uuid(), tid, CURRENT_DATE, 'daily',
      150, 145, 130, 85.5, 98.0, 92.0, 12.5, NOW()
    );
END;
$$;

COMMIT;
