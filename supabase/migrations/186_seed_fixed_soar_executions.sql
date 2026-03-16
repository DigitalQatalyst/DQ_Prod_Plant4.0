-- Re-seed soar_action_executions with correct UUID references
-- Context: Power - Transmission Security (DEWA)

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_operator_id UUID;
    v_supervisor_id UUID;
    v_engineer_id UUID;
    v_action_isolate UUID := '550e8400-e29b-41d4-a716-446655440001';
    v_action_block UUID := '550e8400-e29b-41d4-a716-446655440003';
    v_action_backup UUID := '550e8400-e29b-41d4-a716-446655440006';
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
        -- Get some users to link
        SELECT id INTO v_operator_id FROM security_users WHERE tenant_id = v_tenant_id AND role = 'operator' LIMIT 1;
        SELECT id INTO v_supervisor_id FROM security_users WHERE tenant_id = v_tenant_id AND role = 'supervisor' LIMIT 1;
        SELECT id INTO v_engineer_id FROM security_users WHERE tenant_id = v_tenant_id AND role = 'engineer' LIMIT 1;

        -- Fallback to any user if specific roles not found
        IF v_operator_id IS NULL THEN SELECT id INTO v_operator_id FROM security_users WHERE tenant_id = v_tenant_id LIMIT 1; END IF;
        IF v_supervisor_id IS NULL THEN v_supervisor_id := v_operator_id; END IF;
        IF v_engineer_id IS NULL THEN v_engineer_id := v_operator_id; END IF;

        -- Clean existing
        DELETE FROM soar_action_executions WHERE tenant_id = v_tenant_id;

        -- Insert with UUIDs
        INSERT INTO soar_action_executions (action_id, tenant_id, executed_by, approved_by, approved_at, target, result, details, executed_at)
        VALUES 
        (v_action_isolate, v_tenant_id, v_operator_id, v_supervisor_id, now() - interval '10 days' + interval '5 minutes', 'Substation-A', 'success', 'Successfully isolated Substation-A following detected anomaly', now() - interval '10 days'),
        (v_action_block, v_tenant_id, v_engineer_id, NULL, NULL, 'SCADA-North-01', 'success', 'Blocked IP range 192.168.45.0/24', now() - interval '2 days'),
        (v_action_backup, v_tenant_id, v_operator_id, NULL, NULL, 'All Protection Nodes', 'success', 'Scheduled configuration backup completed', now() - interval '1 day');
    END IF;
END $$;

COMMIT;
