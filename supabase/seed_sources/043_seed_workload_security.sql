-- Workload Security (Hardening & Assessment)
-- Context: Power - Transmission Security (DEWA)
-- Description: Seed data for server and system hardening states

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    SELECT id INTO v_admin_id FROM security_users WHERE role = 'administrator' AND tenant_id = v_tenant_id LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Workload Security Records
    INSERT INTO workload_security (
        tenant_id, workload_name, workload_type, workload_description, deployment_environment, deployment_platform,
        status, health_status, baseline_compliance_score, hardening_level, os_type, os_version, critical_vulnerabilities,
        baseline_compliance_status, hardening_applied, os_hardening_enabled, firewall_enabled, antivirus_enabled,
        deployment_location, security_baseline_id, baseline_version, last_baseline_assessment,
        hardening_profile, hardening_date, hardening_standards, ssh_enabled, ssh_key_only, rdp_enabled,
        privileged_access_restricted, network_segmentation_enabled, patch_level, last_patched_date,
        pending_patches_count, critical_patches_pending, auto_patching_enabled, vulnerability_scan_enabled,
        last_vulnerability_scan, high_vulnerabilities, medium_vulnerabilities, low_vulnerabilities,
        configuration_management_enabled, configuration_drift_detected, last_configuration_check,
        logging_enabled, log_forwarding_enabled, monitoring_agent_installed, monitoring_agent_version,
        compliance_frameworks, last_audit_date, next_audit_date, audit_findings_count,
        security_contact, technical_contact, tags
    ) VALUES
    (v_tenant_id, 'SCADA Master HUB-01', 'server', 'Primary SCADA master for central grid control', 'production', 'vm', 'active', 'healthy', 92, 'enhanced', 'linux', 'RHEL 8.6', 0, 'compliant', true, true, true, true, 'Dubai Control Center', 'IEC-62443-SCADA-02', '2.1', NOW() - INTERVAL '2 days', 'cis_benchmark', NOW() - INTERVAL '40 days', ARRAY['IEC-62443', 'NIST-800-82'], true, true, false, true, true, 'current', NOW() - INTERVAL '2 days', 0, 0, true, true, NOW() - INTERVAL '2 days', 0, 2, 5, true, false, NOW() - INTERVAL '12 hours', true, true, true, '3.2.1', ARRAY['NERC-CIP'], CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days', 0, 'security@dewa.ae', 'scada-admin@dewa.ae', ARRAY['critical', 'scada']);

END $$;

COMMIT;
