-- Quick fix to disable RLS on all new security tables
-- Run this directly in Supabase SQL Editor

-- Disable RLS on data protection tables
ALTER TABLE IF EXISTS data_protection_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_protection_measures DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_classification_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_access_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_protection_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_protection_metrics DISABLE ROW LEVEL SECURITY;

-- Disable RLS on encryption key management tables
ALTER TABLE IF EXISTS encryption_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS key_rotation_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS key_usage_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS key_access_requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on backup recovery tables
ALTER TABLE IF EXISTS backup_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recovery_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recovery_tests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on workload security tables
ALTER TABLE IF EXISTS workload_security DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workload_vulnerabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workload_patches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workload_compliance_checks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on application security tables
ALTER TABLE IF EXISTS application_security_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_vulnerabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_security_tests DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies
DROP POLICY IF EXISTS "data_protection_policies_tenant_isolation" ON data_protection_policies;
DROP POLICY IF EXISTS "data_protection_measures_tenant_isolation" ON data_protection_measures;
DROP POLICY IF EXISTS "data_classification_catalog_tenant_isolation" ON data_classification_catalog;
DROP POLICY IF EXISTS "data_access_audit_tenant_isolation" ON data_access_audit;
DROP POLICY IF EXISTS "data_protection_violations_tenant_isolation" ON data_protection_violations;
DROP POLICY IF EXISTS "data_protection_metrics_tenant_isolation" ON data_protection_metrics;

DROP POLICY IF EXISTS "encryption_keys_tenant_isolation" ON encryption_keys;
DROP POLICY IF EXISTS "key_rotation_history_tenant_isolation" ON key_rotation_history;
DROP POLICY IF EXISTS "key_usage_audit_tenant_isolation" ON key_usage_audit;
DROP POLICY IF EXISTS "key_access_requests_tenant_isolation" ON key_access_requests;

DROP POLICY IF EXISTS "backup_policies_tenant_isolation" ON backup_policies;
DROP POLICY IF EXISTS "backup_jobs_tenant_isolation" ON backup_jobs;
DROP POLICY IF EXISTS "backup_sets_tenant_isolation" ON backup_sets;
DROP POLICY IF EXISTS "recovery_plans_tenant_isolation" ON recovery_plans;
DROP POLICY IF EXISTS "recovery_tests_tenant_isolation" ON recovery_tests;

DROP POLICY IF EXISTS "workload_security_tenant_isolation" ON workload_security;
DROP POLICY IF EXISTS "workload_vulnerabilities_tenant_isolation" ON workload_vulnerabilities;
DROP POLICY IF EXISTS "workload_patches_tenant_isolation" ON workload_patches;
DROP POLICY IF EXISTS "workload_compliance_checks_tenant_isolation" ON workload_compliance_checks;

DROP POLICY IF EXISTS "application_security_scans_tenant_isolation" ON application_security_scans;
DROP POLICY IF EXISTS "application_vulnerabilities_tenant_isolation" ON application_vulnerabilities;
DROP POLICY IF EXISTS "application_dependencies_tenant_isolation" ON application_dependencies;
DROP POLICY IF EXISTS "application_security_tests_tenant_isolation" ON application_security_tests;
