-- Consolidated Seed for Missing Security Items
-- Targeted Pages: Gateway & Agent, Protocol Policy, IoT Posture, Data Protection
-- Context: Power - Transmission Security (DEWA)

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_site_main_id UUID;
    v_site_jebel_id UUID;
    v_site_aweer_id UUID;
    v_site_ras_id UUID;
    v_zone_field_id UUID;
    v_zone_control_id UUID;
    v_zone_dmz_id UUID;
    v_user_admin_id UUID;
    v_asset_type_gateway UUID;
    v_asset_type_agent UUID;
    v_asset_type_ied UUID;
    v_asset_type_rtu UUID;
    v_asset_type_sensor UUID;
    v_asset_type_actuator UUID;
BEGIN
    -- 1. Get Tenant and Site IDs
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    SELECT id INTO v_site_main_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_site_jebel_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_site_aweer_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_site_ras_id FROM sites WHERE name = 'Ras Al Khor Regional Hub' AND tenant_id = v_tenant_id LIMIT 1;

    -- 2. Ensure Asset Types
    INSERT INTO asset_types (tenant_id, code, name, category) VALUES
    (v_tenant_id, 'GATEWAY', 'Security Gateway', 'network'),
    (v_tenant_id, 'AGENT', 'Security Agent', 'endpoint'),
    (v_tenant_id, 'IED', 'Intelligent Electronic Device', 'protection'),
    (v_tenant_id, 'RTU', 'Remote Terminal Unit', 'control'),
    (v_tenant_id, 'SENSOR', 'Industrial Sensor', 'iot'),
    (v_tenant_id, 'ACTUATOR', 'Industrial Actuator', 'iot')
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;

    -- Look up IDs even if they were already there
    SELECT id INTO v_asset_type_gateway FROM asset_types WHERE code = 'GATEWAY' AND tenant_id = v_tenant_id;
    SELECT id INTO v_asset_type_agent FROM asset_types WHERE code = 'AGENT' AND tenant_id = v_tenant_id;
    SELECT id INTO v_asset_type_ied FROM asset_types WHERE code = 'IED' AND tenant_id = v_tenant_id;
    SELECT id INTO v_asset_type_rtu FROM asset_types WHERE code = 'RTU' AND tenant_id = v_tenant_id;
    SELECT id INTO v_asset_type_sensor FROM asset_types WHERE code = 'SENSOR' AND tenant_id = v_tenant_id;
    SELECT id INTO v_asset_type_actuator FROM asset_types WHERE code = 'ACTUATOR' AND tenant_id = v_tenant_id;

    -- 3. Get Security Zones
    SELECT id INTO v_zone_field_id FROM security_zones WHERE site_id = v_site_main_id AND (name LIKE '%Field%' OR name LIKE '%Device%') LIMIT 1;
    SELECT id INTO v_zone_control_id FROM security_zones WHERE site_id = v_site_main_id AND (name LIKE '%Control%' OR name LIKE '%Operations%') LIMIT 1;
    SELECT id INTO v_zone_dmz_id FROM security_zones WHERE site_id = v_site_main_id AND (name LIKE '%DMZ%' OR name LIKE '%External%') LIMIT 1;

    -- Fallback for zones if not found
    IF v_zone_field_id IS NULL THEN
        INSERT INTO security_zones (tenant_id, site_id, name, zone_type, security_level)
        VALUES (v_tenant_id, v_site_main_id, 'Primary Field Network', 'field-devices', 2)
        RETURNING id INTO v_zone_field_id;
    END IF;

    -- 4. Create Assets for Gateways & Agents
    -- Gateways
    INSERT INTO assets (tenant_id, site_id, asset_type_id, name, status, criticality, properties) VALUES
    (v_tenant_id, v_site_main_id, v_asset_type_gateway, 'DXB-GW-001', 'online', 'critical', '{"type": "gateway", "ip": "10.0.1.10", "firmware": "v3.2.1"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_gateway, 'DXB-GW-002', 'online', 'high', '{"type": "gateway", "ip": "10.0.1.11", "firmware": "v3.2.1"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_gateway, 'DXB-GW-003', 'maintenance', 'medium', '{"type": "gateway", "ip": "10.0.1.12", "firmware": "v3.1.5"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_gateway, 'JA-GW-005', 'online', 'high', '{"type": "gateway", "ip": "10.0.5.10", "firmware": "v3.1.9"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_gateway, 'JA-GW-006', 'online', 'critical', '{"type": "gateway", "ip": "10.0.5.11", "firmware": "v3.1.9"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_gateway, 'JA-GW-007', 'offline', 'low', '{"type": "gateway", "ip": "10.0.5.12", "firmware": "v3.1.0"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_gateway, 'AWR-GW-002', 'maintenance', 'medium', '{"type": "gateway", "ip": "10.0.2.10", "firmware": "v3.2.0"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_gateway, 'AWR-GW-003', 'online', 'high', '{"type": "gateway", "ip": "10.0.2.11", "firmware": "v3.2.0"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_gateway, 'RAS-GW-001', 'online', 'critical', '{"type": "gateway", "ip": "10.10.1.10", "firmware": "v4.0.1"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_gateway, 'RAS-GW-002', 'online', 'high', '{"type": "gateway", "ip": "10.10.1.11", "firmware": "v4.0.1"}');

    -- Agents
    INSERT INTO assets (tenant_id, site_id, asset_type_id, name, status, criticality, properties) VALUES
    (v_tenant_id, v_site_main_id, v_asset_type_agent, 'DXB-AG-001-SCADA', 'online', 'critical', '{"type": "agent", "os": "Linux", "agent_version": "2.4"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_agent, 'DXB-AG-002-HIST', 'online', 'high', '{"type": "agent", "os": "Windows", "agent_version": "2.4"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_agent, 'DXB-AG-003-APP', 'online', 'medium', '{"type": "agent", "os": "Linux", "agent_version": "2.4"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_agent, 'JA-AG-005', 'online', 'high', '{"type": "agent", "os": "Linux", "agent_version": "2.1"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_agent, 'JA-AG-006', 'online', 'critical', '{"type": "agent", "os": "Windows", "agent_version": "2.2"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_agent, 'AWR-AG-002', 'online', 'medium', '{"type": "agent", "os": "Linux", "agent_version": "2.4"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_agent, 'AWR-AG-003', 'maintenance', 'high', '{"type": "agent", "os": "Linux", "agent_version": "2.4"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_agent, 'RAS-AG-001', 'offline', 'low', '{"type": "agent", "os": "Linux", "agent_version": "2.3"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_agent, 'RAS-AG-002', 'online', 'high', '{"type": "agent", "os": "Windows", "agent_version": "2.5"}');

    -- IoT Devices
    INSERT INTO assets (tenant_id, site_id, asset_type_id, name, status, criticality, properties) VALUES
    (v_tenant_id, v_site_main_id, v_asset_type_sensor, 'Main Bus Voltage Sensor', 'online', 'high', '{"category": "iot", "type": "sensor", "protocol": "Modbus"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_sensor, 'DXB-PDC-01', 'online', 'high', '{"category": "iot", "type": "sensor", "protocol": "IEC-61850"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_sensor, 'DXB-PDC-02', 'online', 'high', '{"category": "iot", "type": "sensor", "protocol": "IEC-61850"}'),
    (v_tenant_id, v_site_main_id, v_asset_type_ied, 'Main TR-1 Protection IED', 'online', 'critical', '{"category": "iot", "type": "ied", "protocol": "GOOSE"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_actuator, 'Grid Switch Actuator 05', 'online', 'critical', '{"category": "iot", "type": "actuator", "protocol": "DNP3"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_actuator, 'Grid Switch Actuator 06', 'online', 'critical', '{"category": "iot", "type": "actuator", "protocol": "DNP3"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_actuator, 'JA-BUS-COUPLER-ACT', 'online', 'high', '{"category": "iot", "type": "actuator", "protocol": "Modbus"}'),
    (v_tenant_id, v_site_jebel_id, v_asset_type_ied, 'JA-33KV-FEEDER-IED', 'online', 'high', '{"category": "iot", "type": "ied", "protocol": "MMS"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_rtu, 'RTU-Remote-01', 'online', 'medium', '{"category": "iot", "type": "rtu", "protocol": "IEC-60870"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_rtu, 'RTU-Remote-02', 'online', 'medium', '{"category": "iot", "type": "rtu", "protocol": "IEC-60870"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_rtu, 'RAS-SEC-HUB-RTU', 'maintenance', 'high', '{"category": "iot", "type": "rtu", "protocol": "DNP3"}'),
    (v_tenant_id, v_site_ras_id, v_asset_type_sensor, 'RAS-TEMP-CTRL-01', 'online', 'low', '{"category": "iot", "type": "sensor", "protocol": "Modbus"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_ied, 'AWR-TR-CAP-IED', 'online', 'high', '{"category": "iot", "type": "ied", "protocol": "GOOSE"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_ied, 'AWR-LINE-PROT-01', 'online', 'critical', '{"category": "iot", "type": "ied", "protocol": "IEC-61850"}'),
    (v_tenant_id, v_site_aweer_id, v_asset_type_actuator, 'AWR-ISOLATOR-01', 'online', 'medium', '{"category": "iot", "type": "actuator", "protocol": "DNP3"}');

    -- 5. Link to OT Asset Security
    -- Link all newly created assets
    FOR v_user_admin_id IN 
        SELECT a.id FROM assets a 
        WHERE a.tenant_id = v_tenant_id 
        AND a.asset_type_id IN (v_asset_type_gateway, v_asset_type_agent, v_asset_type_sensor, v_asset_type_actuator, v_asset_type_rtu, v_asset_type_ied)
    LOOP
        INSERT INTO ot_asset_security (
            tenant_id, asset_id, zone_id, criticality, security_status, risk_score, 
            vulnerability_count, patch_status, last_security_scan, manufacturer, model
        ) VALUES (
            v_tenant_id, v_user_admin_id, v_zone_field_id,
            CASE (SELECT criticality FROM assets WHERE id = v_user_admin_id)
                WHEN 'critical' THEN 'production-critical'
                ELSE (SELECT criticality FROM assets WHERE id = v_user_admin_id)
            END,
            (ARRAY['secure', 'at-risk', 'vulnerable'])[floor(random() * 3 + 1)],
            floor(random() * 50)::INTEGER,
            floor(random() * 3)::INTEGER,
            'up-to-date',
            NOW() - INTERVAL '2 days',
            'Grid-Secure-Systems', 'X-Series'
        ) ON CONFLICT (tenant_id, asset_id) DO NOTHING;
    END LOOP;

    -- 6. Expanded Protocol Policies
    INSERT INTO transmission_protocol_policies (
        tenant_id, name, protocol, description, status, version, encryption_required, compliance_status
    ) VALUES
    (v_tenant_id, 'GOOSE Real-time Protection Policy', 'GOOSE', 'Critical protection messaging security profile', 'secure', 'v1.2', true, 'compliant'),
    (v_tenant_id, 'SV Sampled Values Baseline', 'MMS', 'Sampled values communication hardening', 'at-risk', 'v1.0', false, 'partial'),
    (v_tenant_id, 'IEC-61850 MMS Encryption', 'MMS', 'Mandatory TLS for MMS monitoring traffic', 'vulnerable', 'v2.1', true, 'non-compliant'),
    (v_tenant_id, 'DNP3 Secure Authentication SAVA', 'DNP3', 'Secure authentication for DNP3 outstations', 'secure', 'v3.0', true, 'compliant'),
    (v_tenant_id, 'IEC-60870-5-104 Control Policy', 'IEC-60870-5-104', 'Control traffic encryption and integrity requirements', 'secure', 'v2.0', true, 'compliant'),
    (v_tenant_id, 'Modbus-TCP Zone 3 Hardening', 'Modbus-TCP', 'Strict filtering for legacy Modbus traffic', 'at-risk', 'v1.5', false, 'partial'),
    (v_tenant_id, 'OPC-UA Substation Bus Monitoring', 'OPC-UA', 'Secure monitoring access for substation bus components', 'secure', 'v3.0', true, 'compliant'),
    (v_tenant_id, 'MQTT Message Broker Posture', 'MQTT', 'Security profile for high-speed telemetry broker traffic', 'secure', 'v1.1', true, 'compliant');

    -- 7. Expanded Data Protection Policies
    INSERT INTO data_protection_policies (
        tenant_id, policy_name, policy_description, data_classification, data_category,
        status, encryption_required, encryption_at_rest, encryption_in_transit,
        access_control_required, mfa_required, access_logging_required
    ) VALUES
    (v_tenant_id, 'Telemetry Confidentiality Standard', 'Ensuring real-time grid values are encrypted in transit.', 'confidential', 'operational', 'active', true, false, true, true, true, true),
    (v_tenant_id, 'Secondary Substation Drawing Protection', 'Access control for CAD and topology drawings.', 'restricted', 'grid_topology', 'active', true, true, true, true, false, true),
    (v_tenant_id, 'Operational Log Retention Policy', 'Compliance related logging for SOAR actions.', 'internal', 'operational', 'active', false, false, false, true, false, true),
    (v_tenant_id, 'Grid Architecture Access Control', 'Restricting access to substation architecture details.', 'confidential', 'access-control', 'active', true, true, true, true, true, true),
    (v_tenant_id, 'Disaster Recovery Backup Strategy', 'Back-up and recovery requirements for SCADA configs.', 'internal', 'backup', 'active', true, true, false, true, false, true),
    (v_tenant_id, 'PII Protection in Audit Logs', 'Masking sensitive personnel information in system logs.', 'internal', 'retention', 'active', false, true, false, true, false, true),
    (v_tenant_id, 'Vulnerability Assessment Data Policy', 'Storage and access requirements for scan results.', 'restricted', 'encryption', 'active', true, true, true, true, true, true),
    (v_tenant_id, 'Transmission Asset Metadata Standard', 'Protection of asset lifecycle and metadata information.', 'internal', 'encryption', 'active', false, false, false, true, false, true)
    ON CONFLICT (tenant_id, policy_name, policy_version) DO NOTHING;

END $$;

COMMIT;
