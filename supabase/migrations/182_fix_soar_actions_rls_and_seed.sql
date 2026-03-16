-- Fix RLS and Seed Data for Transmission SOAR Actions
-- Context: Power - Transmission Security (DEWA)

BEGIN;

-- 1. Disable RLS for SOAR Actions tables (they were missing from 045)
ALTER TABLE transmission_soar_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE soar_action_executions DISABLE ROW LEVEL SECURITY;

-- 2. Seed Data (Idempotent upsert based on 048 seed)
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Transmission SOAR Actions
    INSERT INTO transmission_soar_actions (id, tenant_id, name, description, type, target_type, requires_approval, approval_level, is_critical, execution_count, last_executed)
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, 'Isolate Compromised Substation', 'Automatically isolate a substation from the grid', 'isolate-substation', 'substation', true, 'supervisor', true, 3, now() - interval '10 days'),
    ('550e8400-e29b-41d4-a716-446655440002', v_tenant_id, 'Disconnect Transmission Line', 'Emergency disconnection of transmission line', 'disconnect-line', 'transmission-line', true, 'manager', true, 1, now() - interval '20 days'),
    ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, 'Block SCADA Access', 'Block unauthorized SCADA system access', 'block-scada-access', 'scada-system', false, 'operator', false, 12, now() - interval '2 days'),
    ('550e8400-e29b-41d4-a716-446655440004', v_tenant_id, 'Disable Protection Relay', 'Temporarily disable compromised protection relay', 'disable-relay', 'protection-relay', true, 'supervisor', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440005', v_tenant_id, 'Emergency System Shutdown', 'Controlled shutdown during major incident', 'emergency-shutdown', 'substation', true, 'manager', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, 'Backup System Configuration', 'Create emergency backup of configurations', 'backup-configuration', 'scada-system', false, 'operator', false, 25, now() - interval '1 day'),
    ('550e8400-e29b-41d4-a716-446655440007', v_tenant_id, 'Reset Communication Link', 'Reset compromised communication links', 'reset-communication', 'communication-link', false, 'operator', false, 8, now() - interval '5 days')
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        target_type = EXCLUDED.target_type,
        requires_approval = EXCLUDED.requires_approval,
        approval_level = EXCLUDED.approval_level,
        is_critical = EXCLUDED.is_critical;

    -- SOAR Action Executions
    IF NOT EXISTS (SELECT 1 FROM soar_action_executions WHERE tenant_id = v_tenant_id) THEN
        INSERT INTO soar_action_executions (action_id, tenant_id, executed_by, target, result, details)
        VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, NULL, 'Substation-A', 'success', 'Successfully isolated Substation-A following detected anomaly'),
        ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, NULL, 'SCADA-North-01', 'success', 'Blocked IP range 192.168.45.0/24'),
        ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, NULL, 'All Protection Nodes', 'success', 'Scheduled configuration backup completed');
    END IF;

END $$;

COMMIT;
