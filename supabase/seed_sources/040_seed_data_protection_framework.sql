-- =============================================================================
-- SEED DATA: Data Protection Framework
-- =============================================================================

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

    -- 1. DATA CLASSIFICATION CATALOG
    INSERT INTO data_classification_catalog (
        tenant_id, asset_name, asset_type, data_classification, data_category,
        description, sensitivity_level, contains_pii, contains_credentials,
        contains_grid_topology, encryption_status, backup_status, compliance_status
    ) VALUES
    (v_tenant_id, 'Critical Infrastructure Data', 'database', 'restricted', 'grid_topology',
     'Information that could compromise electrical grid security if leaked.', 5, false, false, true, 'encrypted', 'backed_up', 'compliant'),
    (v_tenant_id, 'Employee Personal Records', 'database', 'confidential', 'personal',
     'Employee and customer personal information subject to PDPL.', 4, true, false, false, 'encrypted', 'backed_up', 'compliant'),
    (v_tenant_id, 'Operational Maintenance Logs', 'file_system', 'internal', 'operational',
     'Routine business communications and maintenance logs.', 2, false, false, false, 'unencrypted', 'backed_up', 'partial'),
    (v_tenant_id, 'Public Grid Status Report', 'report', 'public', 'operational',
     'Information released for public consumption regarding grid health.', 1, false, false, false, 'unencrypted', 'not_backed_up', 'compliant')
    ON CONFLICT (tenant_id, asset_name, asset_type) DO NOTHING;

    -- 2. DATA PROTECTION POLICIES
    INSERT INTO data_protection_policies (
        tenant_id, policy_name, policy_description, data_classification, data_category,
        status, encryption_required, encryption_at_rest, encryption_in_transit,
        access_control_required, mfa_required, access_logging_required
    ) VALUES
    (v_tenant_id, 'Grid Data Handling Policy', 'Rules for managing CII data across all substations.', 'restricted', 'grid_topology',
     'active', true, true, true, true, true, true),
    (v_tenant_id, 'Personal Data Privacy Policy', 'Compliance with UAE Personal Data Protection Law (PDPL).', 'confidential', 'personal',
     'active', true, true, true, true, false, true)
    ON CONFLICT (tenant_id, policy_name, policy_version) DO NOTHING;

END $$;

COMMIT;
