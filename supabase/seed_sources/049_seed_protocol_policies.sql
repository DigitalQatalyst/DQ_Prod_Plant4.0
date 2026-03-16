-- Protocol Security Policies
-- Context: Power - Transmission Security (DEWA)
-- Description: Define protocol-specific security requirements

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_standard_iec UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Get standard ID
    SELECT id INTO v_standard_iec FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = v_tenant_id LIMIT 1;

    -- Protocol Policies (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transmission_protocol_policies') THEN
        INSERT INTO transmission_protocol_policies (
            tenant_id, name, protocol, description, status,
            version, encryption_required, created_at, updated_at
        ) VALUES
        (v_tenant_id, 'DNP3 Secure Authentication SAVA', 'DNP3', 'Enforce secure authentication for DNP3', 'secure', 'v1.0', true, NOW(), NOW()),
        (v_tenant_id, 'Modbus/TCP Hardening', 'Modbus-TCP', 'Restrict Modbus commands and monitor for baseline deviations', 'at-risk', 'v1.1', false, NOW(), NOW()),
        (v_tenant_id, 'IEC 61850 MMS Protection', 'IEC-61850', 'Protect MMS communication for substation automation', 'secure', 'v2.0', true, NOW(), NOW()),
        (v_tenant_id, 'OPC UA Security Profile', 'OPC-UA', 'Enforce high security profile for OPC UA', 'secure', 'v3.0', true, NOW(), NOW());
    ELSE
        RAISE NOTICE 'Table transmission_protocol_policies does not exist, skipping seed.';
    END IF;

END $$;

COMMIT;
