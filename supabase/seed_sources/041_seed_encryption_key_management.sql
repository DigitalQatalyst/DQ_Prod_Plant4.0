-- =============================================================================
-- SEED DATA: Encryption Key Management
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_admin_id UUID;
    v_key_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    SELECT id INTO v_admin_id FROM security_users WHERE role = 'administrator' AND tenant_id = v_tenant_id LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- 1. ENCRYPTION KEYS
    INSERT INTO encryption_keys (
        tenant_id, key_name, key_id, key_type, algorithm, key_size_bits,
        purpose, status, storage_location, storage_provider, key_material_reference,
        auto_rotation_enabled, rotation_period_days, next_rotation_date,
        rotation_date, owner_id
    ) VALUES
    (v_tenant_id, 'Grid-Transmission-Master-AES', 'ext_key_001', 'master', 'AES-256', 256,
     'data_encryption', 'active', 'hsm', 'thales_hsm', 'hsm://keys/master',
     true, 90, CURRENT_DATE + 80, NOW() - INTERVAL '10 days', v_admin_id)
    RETURNING id INTO v_key_id;

    INSERT INTO encryption_keys (
        tenant_id, key_name, key_id, key_type, algorithm, key_size_bits,
        purpose, status, storage_location, storage_provider, key_material_reference,
        auto_rotation_enabled, owner_id
    ) VALUES
    (v_tenant_id, 'Substation-A-Config-Key', 'ext_key_002', 'data_encryption', 'RSA-2048', 2048,
     'communication', 'active', 'vault', 'hashicorp_vault', 'vault://keys/sub-a',
     false, v_admin_id)
    ON CONFLICT (tenant_id, key_name) DO NOTHING;

    -- 2. ROTATION HISTORY (only if master key was newly inserted)
    IF v_key_id IS NOT NULL THEN
        INSERT INTO key_rotation_history (
            tenant_id, key_id, rotation_type, rotation_reason,
            old_key_id, new_key_id, rotation_status,
            initiated_by
        ) VALUES
        (v_tenant_id, v_key_id, 'scheduled', 'Routine 90-day rotation',
         'ext_key_000', 'ext_key_001', 'completed',
         v_admin_id);
    END IF;

END $$;

COMMIT;

