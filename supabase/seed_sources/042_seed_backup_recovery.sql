-- =============================================================================
-- SEED DATA: Backup and Recovery
-- Description: Seed data for backup policies, jobs, and restore points
-- Requirements: 7.3
-- =============================================================================

BEGIN;

-- =============================================================================
-- STORAGE LOCATIONS
-- =============================================================================

INSERT INTO backup_storage_locations (
  id, tenant_id, location_name, location_type,
  storage_provider, storage_path, storage_region,
  total_capacity_gb, used_capacity_gb, available_capacity_gb,
  status, health_status,
  read_throughput_mbps, write_throughput_mbps, latency_ms,
  last_health_check, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'local', 'Disk',
  'On-Prem Storage Gateway', '/mnt/backups/scada', 'Primary DC',
  10240, 4520, 5720,
  'active', 'healthy',
  850, 420, 1.2,
  NOW(), NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'network', 'NAS',
  'Dell PowerScale', '\\\\nas-01\\configs', 'Secondary DC',
  20480, 12500, 7980,
  'active', 'healthy',
  450, 280, 5.5,
  NOW(), NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'cloud', 'Object Storage',
  'AWS S3 (Region B)', 's3://dewa-backups/archive', 'me-central-1',
  102400, 15300, 87100,
  'active', 'healthy',
  120, 85, 45.0,
  NOW(), NOW(), NOW()
);

-- =============================================================================
-- BACKUP POLICIES
-- =============================================================================

INSERT INTO backup_policies (
  id, tenant_id, policy_name, policy_description, status,
  backup_scope, backup_type,
  schedule_frequency, schedule_time, retention_period_days,
  storage_location, storage_path,
  encryption_enabled, compression_enabled,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Critical SCADA Daily Full',
  'Daily full backup of critical SCADA databases',
  'active',
  'full', 'database',
  'daily', '02:00:00', 30,
  'local', '/mnt/backups/scada',
  true, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Weekly Configuration Snapshot',
  'Weekly snapshot of all device configurations',
  'active',
  'full', 'configuration',
  'weekly', '03:00:00', 90,
  'network', '\\\\nas-01\\configs',
  true, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Hourly Incremental Database Backup',
  'Incremental backups every hour for operational databases',
  'active',
  'incremental', 'database',
  'hourly', NULL, 7,
  'local', '/mnt/backups/incremental',
  true, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Real-time Configuration Sync',
  'Continuous synchronization of critical configurations',
  'active',
  'differential', 'configuration',
  'continuous', NULL, 14,
  'network', '\\\\nas-02\\realtime',
  true, false,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Monthly Archive Backup',
  'Monthly full backup for long-term archival',
  'active',
  'full', 'archive',
  'monthly', '01:00:00', 2555,
  'cloud', 's3://dewa-backups/archive',
  true, true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Development Environment Backup',
  'Weekly backup of development and test environments',
  'active',
  'full', 'database',
  'weekly', '04:00:00', 14,
  'local', '/mnt/backups/dev',
  false, true,
  NOW(), NOW()
);

-- =============================================================================
-- BACKUP JOBS
-- =============================================================================

-- Recent daily backups (last 7 days)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_' || to_char(CURRENT_DATE - (seq || ' days')::interval, 'YYYYMMDD'),
  'scheduled',
  (CURRENT_DATE - (seq || ' days')::interval) + '02:00:00'::time,
  (CURRENT_DATE - (seq || ' days')::interval) + '02:00:00'::time,
  (CURRENT_DATE - (seq || ' days')::interval) + '02:15:00'::time,
  900,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  5368709120 + (random() * 1073741824)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 6) AS seq
WHERE bp.policy_name = 'Critical SCADA Daily Full';

-- Hourly incremental backups (last 24 hours)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_' || to_char(NOW() - (seq || ' hours')::interval, 'YYYYMMDD_HH24'),
  'scheduled',
  NOW() - (seq || ' hours')::interval,
  NOW() - (seq || ' hours')::interval,
  NOW() - (seq || ' hours')::interval + '5 minutes'::interval,
  300,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  524288000 + (random() * 104857600)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 23) AS seq
WHERE bp.policy_name = 'Hourly Incremental Database Backup';

-- Weekly configuration backups (last 4 weeks)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_week_' || seq,
  'scheduled',
  CURRENT_DATE - (seq * 7 || ' days')::interval + '03:00:00'::time,
  CURRENT_DATE - (seq * 7 || ' days')::interval + '03:00:00'::time,
  CURRENT_DATE - (seq * 7 || ' days')::interval + '03:20:00'::time,
  1200,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  2147483648 + (random() * 536870912)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 3) AS seq
WHERE bp.policy_name = 'Weekly Configuration Snapshot';

-- Real-time Configuration Sync (last 5 jobs)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_sync_' || seq,
  'scheduled',
  NOW() - (seq * 4 || ' hours')::interval,
  NOW() - (seq * 4 || ' hours')::interval,
  NOW() - (seq * 4 || ' hours')::interval + '2 minutes'::interval,
  120,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  104857600 + (random() * 52428800)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 4) AS seq
WHERE bp.policy_name = 'Real-time Configuration Sync';

-- Monthly Archive Backup (last 3 months)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_archive_' || seq,
  'scheduled',
  CURRENT_DATE - (seq || ' months')::interval + '01:00:00'::time,
  CURRENT_DATE - (seq || ' months')::interval + '01:00:00'::time,
  CURRENT_DATE - (seq || ' months')::interval + '04:00:00'::time,
  10800,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  107374182400 + (random() * 10737418240)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 2) AS seq
WHERE bp.policy_name = 'Monthly Archive Backup';

-- Development Environment Backup (last 2 weeks)
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  backup_size_bytes,
  verification_performed, verification_passed,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_dev_' || seq,
  'scheduled',
  CURRENT_DATE - (seq * 7 || ' days')::interval + '04:00:00'::time,
  CURRENT_DATE - (seq * 7 || ' days')::interval + '04:00:00'::time,
  CURRENT_DATE - (seq * 7 || ' days')::interval + '05:00:00'::time,
  3600,
  'completed', 100,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  21474836480 + (random() * 5368709120)::bigint,
  true, true,
  NOW(), NOW()
FROM backup_policies bp
CROSS JOIN generate_series(0, 1) AS seq
WHERE bp.policy_name = 'Development Environment Backup';

-- One failed backup for realism
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  error_messages, error_count,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_' || to_char(CURRENT_DATE - '3 days'::interval, 'YYYYMMDD') || '_retry',
  'scheduled',
  (CURRENT_DATE - '3 days'::interval) + '02:00:00'::time,
  (CURRENT_DATE - '3 days'::interval) + '02:00:00'::time,
  (CURRENT_DATE - '3 days'::interval) + '02:05:00'::time,
  300,
  'failed', 45,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  ARRAY['Storage volume full - unable to complete backup'],
  2,
  NOW(), NOW()
FROM backup_policies bp
WHERE bp.policy_name = 'Critical SCADA Daily Full'
LIMIT 1;

-- One running backup
INSERT INTO backup_jobs (
  id, tenant_id, policy_id, policy_name,
  job_name, job_type,
  scheduled_start, actual_start, actual_end, duration_seconds,
  status, completion_percentage,
  backup_scope, backup_type, storage_location, storage_path,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  bp.id,
  bp.policy_name,
  'job_current_' || to_char(NOW(), 'YYYYMMDD_HH24MI'),
  'scheduled',
  NOW() - '10 minutes'::interval,
  NOW() - '10 minutes'::interval,
  NULL,
  NULL,
  'running', 65,
  bp.backup_scope, bp.backup_type, bp.storage_location, bp.storage_path,
  NOW(), NOW()
FROM backup_policies bp
WHERE bp.policy_name = 'Hourly Incremental Database Backup'
LIMIT 1;

-- =============================================================================
-- BACKUP RESTORE POINTS
-- =============================================================================

INSERT INTO backup_restore_points (
  id, tenant_id, restore_point_name,
  restore_point_type,
  primary_backup_id,
  backup_timestamp, restore_point_timestamp,
  data_scope, retention_until,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'SCADA_Restore_Point_' || to_char(bj.actual_end, 'YYYYMMDD'),
  'full',
  bj.id,
  bj.actual_end,
  bj.actual_end,
  'complete',
  bj.actual_end + '30 days'::interval,
  NOW(), NOW()
FROM backup_jobs bj
WHERE bj.policy_name = 'Critical SCADA Daily Full'
  AND bj.status = 'completed'
ORDER BY bj.actual_end DESC
LIMIT 7;

INSERT INTO backup_restore_points (
  id, tenant_id, restore_point_name,
  restore_point_type,
  primary_backup_id,
  backup_timestamp, restore_point_timestamp,
  data_scope, retention_until,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Config_Restore_Point_Weekly_' || seq,
  'full',
  bj.id,
  bj.actual_end,
  bj.actual_end,
  'complete',
  bj.actual_end + '90 days'::interval,
  NOW(), NOW()
FROM backup_jobs bj
CROSS JOIN generate_series(1, 4) AS seq
WHERE bj.policy_name = 'Weekly Configuration Snapshot'
  AND bj.status = 'completed'
ORDER BY bj.actual_end DESC
LIMIT 4;

-- =============================================================================
-- RECOVERY VERIFICATION TESTS
-- =============================================================================

INSERT INTO backup_verification_tests (
  id, tenant_id, test_name, test_type,
  restore_point_id, backup_job_id,
  test_start, test_end, test_duration_seconds,
  status, test_environment, test_scope,
  restore_successful, data_integrity_verified, performance_acceptable,
  issues_found, critical_issues,
  recommendations, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Restore_Validation_' || rp.restore_point_name,
  'full_restore',
  rp.id,
  rp.primary_backup_id,
  NOW() - '1 day'::interval,
  NOW() - '23 hours'::interval,
  3600,
  'passed', 'isolated_vlan', 'full_database',
  true, true, true,
  0, 0,
  ARRAY['Test passed successfully', 'Performance optimal'],
  NOW(), NOW()
FROM backup_restore_points rp
WHERE rp.restore_point_name LIKE 'SCADA%'
LIMIT 3;

-- Mark restore points as tested
UPDATE backup_restore_points
SET 
  restore_tested = true,
  last_restore_test = NOW() - '1 day'::interval,
  restore_test_passed = true
WHERE restore_point_name LIKE 'SCADA%'
AND id IN (SELECT restore_point_id FROM backup_verification_tests);

COMMIT;
