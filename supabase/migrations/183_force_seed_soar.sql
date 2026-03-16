-- Force Seed SOAR Actions and Ensure Tenant Exists
-- Context: Power - Transmission Security (DEWA)
-- This migration ensures the tenant exists before seeding, handling cases where 001 seed might not have run.

BEGIN;

-- 1. Ensure Tenant Exists (Idempotent)
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Try to find existing tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1' LIMIT 1;

    -- If not found, create it
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, sector, subsector, scenario_tag)
        VALUES ('DEWA - Transmission', 'power', 'transmission', 'power_transmission_demo_v1')
        RETURNING id INTO v_tenant_id;
        RAISE NOTICE 'Created new tenant with ID: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'Found existing tenant with ID: %', v_tenant_id;
    END IF;

    -- 2. Seed Transmission SOAR Actions (Upsert)
    INSERT INTO transmission_soar_actions (id, tenant_id, name, description, type, target_type, requires_approval, approval_level, is_critical, execution_count, last_executed)
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, 'Isolate Compromised Substation', 'Automatically isolate a substation from the grid', 'isolate-substation', 'substation', true, 'supervisor', true, 3, now() - interval '10 days'),
    ('550e8400-e29b-41d4-a716-446655440002', v_tenant_id, 'Disconnect Transmission Line', 'Emergency disconnection of transmission line', 'disconnect-line', 'transmission-line', true, 'manager', true, 1, now() - interval '20 days'),
    ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, 'Block SCADA Access', 'Block unauthorized SCADA system access', 'block-scada-access', 'scada-system', false, 'operator', false, 12, now() - interval '2 days'),
    ('550e8400-e29b-41d4-a716-446655440004', v_tenant_id, 'Disable Protection Relay', 'Temporarily disable compromised protection relay', 'disable-relay', 'protection-relay', true, 'supervisor', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440005', v_tenant_id, 'Emergency System Shutdown', 'Controlled shutdown during major incident', 'emergency-shutdown', 'substation', true, 'manager', true, 0, NULL),
    ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, 'Backup System Configuration', 'Create emergency backup of configurations', 'backup', 'scada-system', false, 'operator', false, 25, now() - interval '1 day'),
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

    -- 3. Seed SOAR Action Executions
    -- Clean up existing executions for this tenant to avoid duplicates if ID isn't PK
    DELETE FROM soar_action_executions WHERE tenant_id = v_tenant_id;

    INSERT INTO soar_action_executions (action_id, tenant_id, executed_by, target, result, details)
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', v_tenant_id, NULL, 'Substation-A', 'success', 'Successfully isolated Substation-A following detected anomaly'),
    ('550e8400-e29b-41d4-a716-446655440003', v_tenant_id, NULL, 'SCADA-North-01', 'success', 'Blocked IP range 192.168.45.0/24'),
    ('550e8400-e29b-41d4-a716-446655440006', v_tenant_id, NULL, 'All Protection Nodes', 'success', 'Scheduled configuration backup completed');

END $$;

-- 4. Ensure RLS is Disabled (Redundant but safe)
ALTER TABLE transmission_soar_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE soar_action_executions DISABLE ROW LEVEL SECURITY;

COMMIT;
