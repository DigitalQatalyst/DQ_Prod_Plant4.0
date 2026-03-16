-- =============================================================================
-- DISABLE RLS FOR ALL SECURITY TABLES
-- Description: Disable Row Level Security for all security-related tables for development/testing
-- Note: This should be removed or replaced with proper RLS in production
-- =============================================================================

-- Core Security Tables (012-024)
ALTER TABLE security_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE secrets_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_conduits DISABLE ROW LEVEL SECURITY;
ALTER TABLE ot_asset_security DISABLE ROW LEVEL SECURITY;
ALTER TABLE remote_access_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE network_exposure_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE control_coverage_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_compliance_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_security_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts DISABLE ROW LEVEL SECURITY;

-- Compliance and Governance Tables (025-029)
ALTER TABLE compliance_standards DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_controls DISABLE ROW LEVEL SECURITY;
ALTER TABLE control_implementations DISABLE ROW LEVEL SECURITY;
ALTER TABLE control_test_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exception_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE exception_extensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exception_incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_risks DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_mitigation_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_monitoring_events DISABLE ROW LEVEL SECURITY;

-- Threat Monitoring and Incident Response Tables (031-035)
ALTER TABLE incident_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_alert_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_baselines DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE response_playbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence_indicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE threat_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE impact_assessments DISABLE ROW LEVEL SECURITY;

-- Logging and Forensics Tables (036-039)
ALTER TABLE log_archival_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_storage_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE archived_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_monitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_baselines DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_integrity_check_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_snapshot_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_analysis_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_evidence_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_snapshot_requests DISABLE ROW LEVEL SECURITY;

-- Platform and Data Protection Tables (040-044)
ALTER TABLE data_protection_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_protection_measures DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_classification_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_protection_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_protection_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_rotation_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_usage_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_restore_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_restore_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_verification_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_storage_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workload_security DISABLE ROW LEVEL SECURITY;
ALTER TABLE application_security_scans DISABLE ROW LEVEL SECURITY;

-- Additional tables that might exist
DO $$ 
BEGIN
    -- Disable RLS for any additional security tables that might exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_configurations') THEN
        ALTER TABLE security_configurations DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_metrics') THEN
        ALTER TABLE security_metrics DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_dashboards') THEN
        ALTER TABLE security_dashboards DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Log the RLS disable operation
-- Note: Using correct column names from security_audit_log schema
DO $$
BEGIN
    -- Only insert if we have at least one tenant
    IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        INSERT INTO security_audit_log (
            tenant_id,
            event_type,
            event_category,
            event_name,
            outcome,
            severity,
            action_performed,
            additional_data
        ) 
        SELECT 
            id,
            'configuration_change'::audit_event_type,
            'system',
            'RLS Disabled',
            'success'::audit_outcome,
            'warning'::audit_severity,
            'Disabled RLS for all security tables for development/testing',
            '{"scope": "all_security_tables", "reason": "development"}'::jsonb
        FROM tenants
        LIMIT 1;
    END IF;
END $$;