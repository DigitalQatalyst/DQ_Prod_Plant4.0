-- =============================================================================
-- SEED DATA: Diverse Security Posture (Sites, Zones, Assets, Alerts)
-- Description: Adds a diverse set of security data for Power Transmission demo
-- =============================================================================

BEGIN;

-- Get DEWA tenant ID
DO $$
DECLARE
  v_tenant_id UUID;
  v_mirdif_site_id UUID;
  v_jumeirah_site_id UUID;
  v_dubai_south_site_id UUID;
  v_ras_al_khor_site_id UUID;
  v_occ_north_site_id UUID;
  v_zone_id UUID;
  v_asset_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;

  -- 1. ADD DIVERSE SITES
  INSERT INTO sites (id, tenant_id, name, region, geo_lat, geo_lng, site_type) VALUES
  (gen_random_uuid(), v_tenant_id, 'Mirdif Switching Station', 'Mirdif', 25.2154, 55.4244, 'switching-station'),
  (gen_random_uuid(), v_tenant_id, 'Jumeirah Grid Station', 'Jumeirah', 25.1264, 55.2044, 'substation'),
  (gen_random_uuid(), v_tenant_id, 'Dubai South Distribution Center', 'Dubai South', 24.8954, 55.1244, 'distribution'),
  (gen_random_uuid(), v_tenant_id, 'Ras Al Khor Regional Hub', 'Ras Al Khor', 25.1854, 55.3544, 'transmission'),
  (gen_random_uuid(), v_tenant_id, 'Operational Control Center - North', 'Deira', 25.2654, 55.3044, 'control-center')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- Get the IDs of the newly inserted sites
  SELECT id INTO v_mirdif_site_id FROM sites WHERE name = 'Mirdif Switching Station' AND tenant_id = v_tenant_id;
  SELECT id INTO v_jumeirah_site_id FROM sites WHERE name = 'Jumeirah Grid Station' AND tenant_id = v_tenant_id;
  SELECT id INTO v_dubai_south_site_id FROM sites WHERE name = 'Dubai South Distribution Center' AND tenant_id = v_tenant_id;
  SELECT id INTO v_ras_al_khor_site_id FROM sites WHERE name = 'Ras Al Khor Regional Hub' AND tenant_id = v_tenant_id;
  SELECT id INTO v_occ_north_site_id FROM sites WHERE name = 'Operational Control Center - North' AND tenant_id = v_tenant_id;

  -- 2. ADD SECURITY ZONES
  -- Mirdif (Compliant)
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_mirdif_site_id, 'Mirdif Bus Control Zone', 'substation-control', 3, 'compliant'),
  (gen_random_uuid(), v_tenant_id, v_mirdif_site_id, 'Mirdif Telemetry Zone', 'scada-network', 2, 'compliant');

  -- Jumeirah (Non-Compliant)
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_jumeirah_site_id, 'Jumeirah Main Protection Zone', 'protection-systems', 4, 'non-compliant'),
  (gen_random_uuid(), v_tenant_id, v_jumeirah_site_id, 'Jumeirah Local HMI Zone', 'substation-control', 2, 'partial');

  -- Dubai South (Partial)
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_dubai_south_site_id, 'Dubai South Distribution Grid', 'field-devices', 2, 'partial'),
  (gen_random_uuid(), v_tenant_id, v_dubai_south_site_id, 'Dubai South Gateway Zone', 'dmz', 3, 'compliant');

  -- Ras Al Khor (Compliant)
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_ras_al_khor_site_id, 'Ras Al Khor Regional SCADA', 'scada-network', 3, 'compliant');

  -- OCC North (Non-Compliant)
  INSERT INTO security_zones (id, tenant_id, site_id, name, zone_type, security_level, compliance_status) VALUES
  (gen_random_uuid(), v_tenant_id, v_occ_north_site_id, 'OCC North Operations Zone', 'control', 4, 'non-compliant'),
  (gen_random_uuid(), v_tenant_id, v_occ_north_site_id, 'OCC North External Interconnect', 'dmz', 2, 'non-compliant');

  -- 3. ADD OT ASSET SECURITY RECORDS
  -- Link random assets from existing assets table to these zones
  FOR v_zone_id IN SELECT id FROM security_zones WHERE site_id IN (v_mirdif_site_id, v_jumeirah_site_id, v_dubai_south_site_id, v_ras_al_khor_site_id, v_occ_north_site_id) LOOP
    FOR v_asset_id IN SELECT id FROM assets WHERE tenant_id = v_tenant_id ORDER BY RANDOM() LIMIT 5 LOOP
      INSERT INTO ot_asset_security (
        id, tenant_id, asset_id, zone_id, criticality, security_status, risk_score,
        vulnerability_count, patch_status, network_exposure, last_security_scan,
        manufacturer, model, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_tenant_id, v_asset_id, v_zone_id,
        (ARRAY['safety-critical', 'production-critical', 'high', 'medium', 'low'])[floor(random() * 5 + 1)],
        (ARRAY['secure', 'at-risk', 'vulnerable'])[floor(random() * 3 + 1)],
        floor(random() * 100)::INTEGER,
        floor(random() * 8)::INTEGER,
        (ARRAY['up-to-date', 'pending', 'outdated'])[floor(random() * 3 + 1)],
        (ARRAY['internal', 'dmz', 'external'])[floor(random() * 3 + 1)],
        NOW() - (random() * INTERVAL '60 days'),
        'System Manufacturer', 'Model-X', NOW(), NOW()
      ) ON CONFLICT (tenant_id, asset_id) DO UPDATE SET
        zone_id = EXCLUDED.zone_id,
        security_status = EXCLUDED.security_status,
        risk_score = EXCLUDED.risk_score;
    END LOOP;
  END LOOP;

  -- 4. ADD SECURITY ALERTS
  INSERT INTO security_alerts (id, tenant_id, site_id, title, description, severity, status, category, created_at) VALUES
  (gen_random_uuid(), v_tenant_id, v_jumeirah_site_id, 'Unauthorized PLC Access', 'Multiple failed login attempts on Jumeirah Protection Relay', 'critical', 'new', 'access_control', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), v_tenant_id, v_jumeirah_site_id, 'Firmware Vulnerability Detected', 'Known vulnerability CVE-2023-XXXX on Siemens S7-1500', 'high', 'new', 'vulnerability', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), v_tenant_id, v_occ_north_site_id, 'Anomalous Network Traffic', 'High frequency communication detected between DMZ and Control Room', 'critical', 'acknowledged', 'anomaly', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), v_tenant_id, v_occ_north_site_id, 'Privilege Escalation Attempt', 'Unauthorized user attempted to gain administrative access to OCC SCADA Server', 'high', 'new', 'access_control', NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), v_tenant_id, v_mirdif_site_id, 'Brute Force Attempt', 'Repeated failed SSH attempts detected on Gateway', 'medium', 'new', 'access_control', NOW() - INTERVAL '10 minutes'),
  (gen_random_uuid(), v_tenant_id, v_dubai_south_site_id, 'Encryption Protocol Violation', 'Unencrypted Modbus traffic detected on field VLAN', 'high', 'new', 'protocol_violation', NOW() - INTERVAL '20 minutes'),
  (gen_random_uuid(), v_tenant_id, v_ras_al_khor_site_id, 'Lateral Movement Detected', 'Suspicious internal traffic pattern detected from non-critical workstation to SCADA backup server', 'critical', 'new', 'network_security', NOW() - INTERVAL '15 minutes'),
  (gen_random_uuid(), v_tenant_id, v_ras_al_khor_site_id, 'Certificate Expiration Warning', 'SCADA Master trust certificate expiring in less than 7 days', 'medium', 'in-progress', 'policy_violation', NOW() - INTERVAL '30 minutes');

END $$;

COMMIT;
