-- Application Security (Scans & Vulnerabilities)
-- Context: Power - Transmission Security (DEWA)
-- Description: Seed data for application-level security assessments

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Application Security Scans
    INSERT INTO application_security_scans (
        tenant_id, application_name, application_type, deployment_environment,
        scan_id, scan_type, scan_tool, scan_status,
        total_findings, critical_findings, high_findings, medium_findings, low_findings,
        scan_completed_at, scan_report_url, findings_resolved, overall_risk_level
    ) VALUES
    (v_tenant_id, 'Grid Monitoring Portal', 'web_application', 'production',
     'APP-SEC-001', 'sast', 'sonarqube', 'completed',
     8, 1, 2, 5, 0,
     NOW() - INTERVAL '5 days', 'https://security-reports.local/scan/001', 3, 'high')
    ON CONFLICT (tenant_id, scan_id) DO NOTHING;

END $$;

COMMIT;
