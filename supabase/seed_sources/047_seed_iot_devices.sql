-- IoT Security & Device Management
-- Context: Power - Transmission Security (DEWA)
-- Description: Seed data for secure IoT endpoints in the power grid

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

    -- IoT Devices (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'iot_devices') THEN
        INSERT INTO iot_devices (
            tenant_id, device_id, name, type, status, site_id,
            firmware_version, security_score, last_scanned, notes
        ) VALUES
        (v_tenant_id, 'IOT-001-TEMP', 'Transformer B Oil Temp Sensor', 'sensor', 'online', (SELECT id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1), 'v1.2.0', 95, NOW() - INTERVAL '1 hour', 'Secure MQTT communication enabled'),
        (v_tenant_id, 'IOT-002-VIB', 'Breaker X Vibration Monitor', 'sensor', 'online', (SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1), 'v1.1.8', 88, NOW() - INTERVAL '2 hours', 'Requires firmware update next cycle');
    ELSE
        RAISE NOTICE 'Table iot_devices does not exist, skipping seed.';
    END IF;

END $$;

COMMIT;
