-- =============================================================================
-- SEED DATA: Massive Expanded Application Security & Encryption Management
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_admin_id UUID;
    v_kms_key_id UUID;
    v_idx INTEGER;
    v_inner_idx INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Get admin user
    SELECT id INTO v_user_admin_id FROM security_users WHERE email = 'admin@dewa.gov.ae' LIMIT 1;
    
    IF v_user_admin_id IS NULL THEN
        INSERT INTO security_users (tenant_id, username, email, full_name, role, status)
        VALUES (v_tenant_id, 'admin', 'admin@dewa.gov.ae', 'System Administrator', 'administrator', 'active')
        RETURNING id INTO v_user_admin_id;
    END IF;

    ---------------------------------------------------------------------------
    -- 1. ENCRYPTION KEY MANAGEMENT (Expanded)
    ---------------------------------------------------------------------------
    -- Insert several KMS keys
    FOR v_idx IN 1..5 LOOP
        INSERT INTO encryption_keys (
            tenant_id, key_name, key_id, key_type, algorithm, key_size_bits, 
            purpose, status, storage_location, storage_provider, key_material_reference,
            rotation_required, rotation_period_days, rotation_date, 
            next_rotation_date, owner_id
        ) VALUES (
            v_tenant_id,
            'KMS-HV-ZONE-' || v_idx,
            'ext-key-' || v_idx || '-' || gen_random_uuid(),
            'symmetric',
            'AES-256',
            256,
            'data_encryption',
            'active',
            'kms',
            'azure_key_vault',
            'vault://hv-zone-' || v_idx,
            true, 90, NOW() - INTERVAL '30 days',
            (CURRENT_DATE + 60), v_user_admin_id
        ) RETURNING id INTO v_kms_key_id;

        -- Add key usage logs (using actual table name key_usage_audit)
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'key_usage_audit') THEN
            FOR v_inner_idx IN 1..10 LOOP
                INSERT INTO key_usage_audit (
                    tenant_id, key_id, key_name, operation_type, operation_status,
                    user_id, source_ip, application_name
                ) VALUES (
                    v_tenant_id, v_kms_key_id, 'KMS-HV-ZONE-' || v_idx,
                    CASE (v_inner_idx % 3)
                        WHEN 0 THEN 'encrypt'
                        WHEN 1 THEN 'decrypt'
                        ELSE 'rotate'
                    END,
                    'success',
                    v_user_admin_id,
                    ('10.150.' || (v_idx % 255) || '.' || v_inner_idx)::inet,
                    'app-grid-monitor-' || (v_idx % 3)
                );
            END LOOP;
        END IF;
    END LOOP;

    ---------------------------------------------------------------------------
    -- 2. APPLICATION SECURITY (Volume Enhanced)
    ---------------------------------------------------------------------------
    -- Add 20 application security scan records
    FOR v_idx IN 1..20 LOOP
        INSERT INTO application_security_scans (
            id, tenant_id, application_name, application_type, deployment_environment,
            scan_id, scan_type, scan_tool, scan_status,
            total_findings, critical_findings, high_findings, medium_findings, low_findings,
            scan_completed_at, scan_report_url, findings_resolved
        ) VALUES (
            gen_random_uuid(), v_tenant_id,
            (ARRAY['SCADA Web Portal', 'Grid Telemetry API', 'Field Maintenance App', 'Ops Dashboard', 'Asset Registry', 'Historian Sync Service'])[floor(random() * 6 + 1)],
            'web_application', 'production',
            'APP-TX-' || (1000 + v_idx),
            (ARRAY['sast', 'dast', 'container_scan', 'dependency_scan'])[floor(random() * 4 + 1)],
            (ARRAY['sonarqube', 'snyk', 'checkmarx'])[floor(random() * 3 + 1)],
            'completed',
            floor(random() * 10 + 5), floor(random() * 2),
            floor(random() * 3), floor(random() * 5), floor(random() * 5),
            NOW() - (INTERVAL '1 day' * v_idx),
            'https://security-reports.local/scan/' || v_idx,
            floor(random() * 5)
        );
    END LOOP;

    ---------------------------------------------------------------------------
    -- 3. AUDIT LOGS (Massive Volume for Search/Filter)
    ---------------------------------------------------------------------------
    -- Generate 50 audit logs
    FOR v_idx IN 1..50 LOOP
        INSERT INTO security_audit_log (
            tenant_id, user_id, username, event_type, event_category, event_name,
            target_type, target_id, outcome, severity,
            action_performed, source_ip, user_agent, event_timestamp
        ) VALUES (
            v_tenant_id, v_user_admin_id, 'admin',
            (ARRAY['authentication', 'data_access', 'configuration_change', 'policy_change', 'key_operation'])[floor(random() * 5 + 1)]::audit_event_type,
            (ARRAY['identity', 'access', 'data', 'system', 'compliance'])[floor(random() * 5 + 1)],
            'Generic Audit Event',
            (ARRAY['user', 'asset', 'policy', 'encryption_key', 'site'])[floor(random() * 5 + 1)],
            gen_random_uuid()::TEXT,
            (ARRAY['success', 'failure', 'denied'])[floor(random() * 3 + 1)]::audit_outcome,
            (ARRAY['info', 'warning', 'high', 'critical'])[floor(random() * 4 + 1)]::audit_severity,
            'Automated seed event processing, iteration: ' || v_idx,
            ('10.0.' || floor(random() * 255) || '.' || floor(random() * 255))::inet,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GridBrowser/1.0',
            NOW() - (random() * INTERVAL '30 days')
        );
    END LOOP;

END $$;

COMMIT;
