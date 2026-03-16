-- Field Gateways (Transmission Grid)
-- Context: Power - Transmission Security (DEWA)
-- Description: Seed data for secure field gateways and communications

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

    -- Field Gateways (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'field_gateways') THEN
        INSERT INTO field_gateways (
            tenant_id, name, site_id, status, ip_address, firmware_version, 
            last_heartbeat, security_status, active_alerts_count, location_description
        ) VALUES
        (v_tenant_id, 'GW-AWR-01', (SELECT id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1), 'active', '10.20.1.10', 'v2.4.5', NOW() - INTERVAL '2 minutes', 'secure', 0, 'Basement Comms Room, Rack A4'),
        (v_tenant_id, 'GW-JA-02', (SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1), 'active', '10.30.5.22', 'v2.4.5', NOW() - INTERVAL '5 minutes', 'at-risk', 2, 'Main Lobby, Security Kiosk');
    ELSE
        RAISE NOTICE 'Table field_gateways does not exist, skipping seed.';
    END IF;

END $$;

COMMIT;
