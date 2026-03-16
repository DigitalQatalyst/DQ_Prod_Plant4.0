-- =============================================================================
-- SEED DATA: Threat Intelligence
-- Description: Seed data for threat feeds, indicators, matches, and campaigns
-- Requirements: 5.6
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_ics_cert_feed_id UUID;
    v_dragos_feed_id UUID;
    v_mandiant_feed_id UUID;
    v_emerging_feed_id UUID;
    v_nesa_feed_id UUID;
    v_internal_feed_id UUID;
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Clear existing threat intelligence data for this tenant
    DELETE FROM threat_intelligence_matches WHERE tenant_id = v_tenant_id;
    DELETE FROM threat_intelligence_indicators WHERE tenant_id = v_tenant_id;
    DELETE FROM threat_campaigns WHERE tenant_id = v_tenant_id;
    DELETE FROM threat_intelligence_feeds WHERE tenant_id = v_tenant_id;

-- =============================================================================
-- THREAT FEEDS
-- =============================================================================

INSERT INTO threat_intelligence_feeds (
  id, tenant_id, name, description, provider, feed_type,
  update_frequency_hours, status, transmission_specific,
  total_indicators, active_indicators, created_at, updated_at
) VALUES 
(
  gen_random_uuid(),
  v_tenant_id,
  'ICS-CERT Advisories',
  'Official alerts and advisories from CISA ICS-CERT',
  'CISA',
  'government',
  24,
  'active',
  true,
  1250, 45,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'Dragos WorldView',
  'Industrial cybersecurity threat intelligence feed',
  'Dragos',
  'commercial',
  4,
  'active',
  true,
  5600, 120,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'Mandiant OT Threat Feed',
  'Operational Technology specific threat indicators',
  'Mandiant',
  'commercial',
  12,
  'active',
  true,
  3400, 85,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'Emerging Threats Open',
  'Open source network threat intelligence',
  'Proofpoint',
  'open-source',
  1,
  'active',
  false,
  15000, 450,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'NESA Cyber Threat Feed',
  'UAE National Electronic Security Authority threat intelligence for critical infrastructure',
  'NESA',
  'government',
  12,
  'active',
  true,
  850, 32,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'DEWA Internal Threat Intel',
  'Internal threat intelligence gathered from DEWA security operations',
  'DEWA SOC',
  'internal',
  1,
  'active',
  true,
  420, 18,
  NOW(), NOW()
);

-- Get feed IDs for referencing in indicators
SELECT id INTO v_ics_cert_feed_id FROM threat_intelligence_feeds WHERE name = 'ICS-CERT Advisories' AND tenant_id = v_tenant_id LIMIT 1;
SELECT id INTO v_dragos_feed_id FROM threat_intelligence_feeds WHERE name = 'Dragos WorldView' AND tenant_id = v_tenant_id LIMIT 1;
SELECT id INTO v_mandiant_feed_id FROM threat_intelligence_feeds WHERE name = 'Mandiant OT Threat Feed' AND tenant_id = v_tenant_id LIMIT 1;
SELECT id INTO v_emerging_feed_id FROM threat_intelligence_feeds WHERE name = 'Emerging Threats Open' AND tenant_id = v_tenant_id LIMIT 1;
SELECT id INTO v_nesa_feed_id FROM threat_intelligence_feeds WHERE name = 'NESA Cyber Threat Feed' AND tenant_id = v_tenant_id LIMIT 1;
SELECT id INTO v_internal_feed_id FROM threat_intelligence_feeds WHERE name = 'DEWA Internal Threat Intel' AND tenant_id = v_tenant_id LIMIT 1;

-- =============================================================================
-- THREAT CAMPAIGNS
-- =============================================================================

INSERT INTO threat_campaigns (
  id, tenant_id, name, description, threat_actor, 
  motivation, targeted_sectors, targeted_technologies,
  transmission_targeting, confidence_level, is_active,
  analyst_assessment, recommendations, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  v_tenant_id,
  'Operation GridLock',
  'Coordinated campaign targeting high-voltage transmission substations in the Middle East region',
  'APT33',
  ARRAY['sabotage', 'espionage'],
  ARRAY['energy', 'utilities'],
  ARRAY['SCADA', 'Siemens SIPROTEC'],
  true,
  'high',
  true,
  'High probability of targeted phishing campaigns against engineering staff followed by lateral movement to OT networks.',
  ARRAY['Block known IoCs', 'Isolate engineering workstations', 'Monitor for unusual RDP activity'],
  NOW() - INTERVAL '30 days', NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'VoltTyphoon Surveillance',
  'Stealthy living-off-the-land techniques targeting critical infrastructure for long-term espionage',
  'Volt Typhoon',
  ARRAY['espionage', 'pre-positioning'],
  ARRAY['critical-infrastructure', 'communications', 'energy'],
  ARRAY['Fortinet', 'Cisco'],
  true,
  'high',
  true,
  'Actors using legitimate admin tools to evade detection. Focus on edge devices and router compromise.',
  ARRAY['Audit edge device configurations', 'Monitor for unusual PowerShell usage', 'Review access logs for off-hours activity'],
  NOW() - INTERVAL '60 days', NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'TRITON 2.0 Evolution',
  'Advanced industrial safety system targeting campaign similar to TRITON/TRISIS',
  'TEMP.Veles',
  ARRAY['sabotage'],
  ARRAY['energy', 'petrochemical'],
  ARRAY['Triconex', 'Safety Instrumented Systems'],
  true,
  'medium',
  true,
  'Sophisticated threat actor with capability to compromise safety systems. Evidence suggests development of new framework.',
  ARRAY['Enhanced monitoring of safety systems', 'Implement security updates for Triconex', 'Network segmentation review'],
  NOW() - INTERVAL '45 days', NOW()
),
(
  gen_random_uuid(),
  v_tenant_id,
  'Industroyer2 Variant',
  'Malware variant designed to disrupt electrical substations using IEC protocols',
  'Sandworm',
  ARRAY['sabotage', 'disruption'],
  ARRAY['energy'],
  ARRAY['IEC 60870-5-104', 'IEC 61850'],
  true,
  'high',
  false,
  'Previously active campaign now dormant. Malware samples analyzed show capability for protocol-specific attacks.',
  ARRAY['Protocol anomaly detection', 'IEC protocol filtering', 'Network segmentation enforcement'],
  NOW() - INTERVAL '180 days', NOW() - INTERVAL '90 days'
),
(
  gen_random_uuid(),
  v_tenant_id,
  'LockBit Ransomware - Energy Sector',
  'LockBit ransomware group actively targeting energy sector with double extortion tactics',
  'LockBit',
  ARRAY['financial-gain'],
  ARRAY['energy', 'utilities', 'manufacturing'],
  ARRAY['Windows', 'VMware ESXi'],
  false,
  'high',
  true,
  'Financially motivated group with proven ability to compromise enterprise networks and access OT zones.',
  ARRAY['Network segmentation validation', 'Backup verification', 'Incident response readiness'],
  NOW() - INTERVAL '15 days', NOW()
);

-- =============================================================================
-- THREAT INDICATORS
-- =============================================================================

-- IP Address Indicators (10+)
INSERT INTO threat_intelligence_indicators (
  id, tenant_id, feed_id, indicator_value, indicator_type,
  threat_name, threat_actor, confidence, relevance,
  transmission_relevance_score,
  targets_ot_systems, targets_scada, targets_protocols,
  description, mitigation_strategies, is_active, created_at, updated_at
) VALUES
(
  gen_random_uuid(), v_tenant_id, v_mandiant_feed_id,
  '185.192.17.15', 'ioc-ip',
  'GridLock C2 Node', 'APT33', 'high', 'critical', 95,
  true, true, ARRAY['IEC-60870-5-104', 'DNP3']::transmission_protocol[],
  'Command and control server observed communicating with compromised RTUs using encapsulated traffic.',
  ARRAY['Block IP at perimeter firewall', 'Investigate internal hosts for prior connections'],
  true, NOW() - INTERVAL '5 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  '203.0.113.45', 'ioc-ip',
  'VoltTyphoon C2 Infrastructure', 'Volt Typhoon', 'high', 'high', 88,
  false, true, ARRAY[]::transmission_protocol[],
  'Known command and control infrastructure for VoltTyphoon campaigns targeting critical infrastructure.',
  ARRAY['Block at border gateway', 'Review firewall logs for connections'],
  true, NOW() - INTERVAL '15 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  '198.51.100.92', 'ioc-ip',
  'TRITON Staging Server', 'TEMP.Veles', 'high', 'critical', 97,
  true, true, ARRAY[]::transmission_protocol[],
  'Identified as staging server for TRITON malware variants targeting safety systems.',
  ARRAY['Block immediately', 'Search for beaconing behavior', 'Inspect safety system connections'],
  true, NOW() - INTERVAL '8 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_nesa_feed_id,
  '192.0.2.178', 'ioc-ip',
  'Scanning Activity - UAE Critical Infrastructure', 'Unknown', 'medium', 'high', 72,
  true, true, ARRAY['IEC-61850']::transmission_protocol[],
  'Source of widespread scanning targeting UAE energy sector OT networks.',
  ARRAY['Block at perimeter', 'Enhanced IDS rules'],
  true, NOW() - INTERVAL '3 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_internal_feed_id,
  '10.45.12.88', 'ioc-ip',
  'Internal Suspected Compromised Host', 'Unknown', 'medium', 'high', 85,
  true, true, ARRAY['DNP3', 'Modbus-TCP']::transmission_protocol[],
  'Internal engineering workstation showing suspicious outbound connections to known bad infrastructure.',
  ARRAY['Isolate for forensics', 'Credential review', 'Reimaging required'],
  true, NOW() - INTERVAL '1 day', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_emerging_feed_id,
  '104.244.72.35', 'ioc-ip',
  'Phishing Infrastructure', 'Unknown', 'low', 'medium', 35,
  false, false, ARRAY[]::transmission_protocol[],
  'IP hosting phishing pages impersonating energy sector vendors.',
  ARRAY['Block at email gateway', 'DNS filtering'],
  true, NOW() - INTERVAL '10 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  '91.240.118.164', 'ioc-ip',
  'Sandworm C2', 'Sandworm', 'high', 'critical', 94,
  true, true, ARRAY['IEC-60870-5-104']::transmission_protocol[],
  'Active C2 server for Industroyer2 variant operations.',
  ARRAY['Block at all perimeter points', 'Threat hunt for indicators'],
  true, NOW() - INTERVAL '6 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_mandiant_feed_id,
  '45.129.56.200', 'ioc-ip',
  'APT Activity - Middle East', 'APT34', 'high', 'high', 78,
  false, true, ARRAY[]::transmission_protocol[],
  'Infrastructure associated with APT34 targeting Middle East energy organizations.',
  ARRAY['Perimeter blocking', 'Proxy filtering'],
  true, NOW() - INTERVAL '20 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  '167.71.13.44', 'ioc-ip',
  'Exploitware Distribution', 'Unknown', 'medium', 'medium', 55,
  false, false, ARRAY[]::transmission_protocol[],
  'Server distributing ICS exploitation tools and frameworks.',
  ARRAY['Block downloads', 'Monitor for file hashes'],
  true, NOW() - INTERVAL '12 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_nesa_feed_id,
  '217.12.201.90', 'ioc-ip',
  'UAE Targeted Reconnaissance', 'Unknown', 'medium', 'high', 68,
  true, false, ARRAY[]::transmission_protocol[],
  'Source of targeted reconnaissance against UAE critical national infrastructure.',
  ARRAY['Block and monitor', 'Share with national CERT'],
  true, NOW() - INTERVAL '4 days', NOW()
),

-- Domain Indicators (8+)
(
  gen_random_uuid(), v_tenant_id, v_emerging_feed_id,
  'suspicious-domain.xyz', 'ioc-domain',
  'Generic Malware C2', 'Unknown', 'low', 'low', 20,
  false, false, ARRAY[]::transmission_protocol[],
  'Domain associated with commodity malware.',
  ARRAY['Block DNS resolution'],
  true, NOW() - INTERVAL '2 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_mandiant_feed_id,
  'scada-update-center.net', 'ioc-domain',
  'Fake SCADA Update Site', 'APT33', 'high', 'critical', 92,
  true, true, ARRAY[]::transmission_protocol[],
  'Typosquatting domain hosting trojanized SCADA software updates.',
  ARRAY['Block at DNS and proxy', 'User awareness campaign'],
  true, NOW() - INTERVAL '7 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  'siemens-firmware-srv.com', 'ioc-domain',
  'Malicious Firmware Distribution', 'Unknown', 'high', 'critical', 90,
  true, false, ARRAY[]::transmission_protocol[],
  'Fake domain distributing backdoored firmware for Siemens devices.',
  ARRAY['DNS blocking', 'Verify all firmware sources'],
  true, NOW() - INTERVAL '9 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  'energy-sector-news.org', 'ioc-domain',
  'Watering Hole Site', 'APT34', 'medium', 'high', 65,
  false, false, ARRAY[]::transmission_protocol[],
  'Compromised legitimate-looking news site serving exploits to energy sector visitors.',
  ARRAY['Block access', 'Enhanced endpoint protection'],
  true, NOW() - INTERVAL '14 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_internal_feed_id,
  'update-checker-service.online', 'ioc-domain',
  'Internal Phishing Campaign', 'Unknown', 'medium', 'medium', 58,
  false, false, ARRAY[]::transmission_protocol[],
  'Domain used in recent phishing campaign targeting DEWA employees.',
  ARRAY['Email filtering', 'Security awareness'],
  true, NOW() - INTERVAL '5 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_nesa_feed_id,
  'uae-gov-services.net', 'ioc-domain',
  'Government Impersonation', 'Unknown', 'high', 'high', 73,
  false, false, ARRAY[]::transmission_protocol[],
  'Phishing domain impersonating UAE government services.',
  ARRAY['DNS block', 'Report to authorities'],
  true, NOW() - INTERVAL '11 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_emerging_feed_id,
  'analytics-tracking.top', 'ioc-domain',
  'Data Exfiltration', 'Unknown', 'low', 'medium', 40,
  false, false, ARRAY[]::transmission_protocol[],
  'Domain used for data exfiltration via DNS tunneling.',
  ARRAY['DNS monitoring', 'Block resolution'],
  true, NOW() - INTERVAL '18 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  'iec-protocol-tools.com', 'ioc-domain',
  'Malicious Tool Distribution', 'Unknown', 'medium', 'high', 76,
  true, true, ARRAY['IEC-61850', 'IEC-60870-5-104']::transmission_protocol[],
  'Site distributing modified IEC protocol tools with backdoors.',
  ARRAY['Block downloads', 'Software source verification'],
  true, NOW() - INTERVAL '13 days', NOW()
),

-- File Hash Indicators (5+)
(
  gen_random_uuid(), v_tenant_id, v_mandiant_feed_id,
  'update_firmware_siemens_v4.exe', 'ioc-hash',
  'Trojanized Firmware Updater', 'APT33', 'high', 'high', 85,
  true, true, ARRAY[]::transmission_protocol[],
  'Malicious executable masquerading as legitimate firmware update utility for SIPROTEC 5 relays.',
  ARRAY['Block file execution hash', 'Verify digital signatures on all firmware updates'],
  true, NOW() - INTERVAL '7 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  'a3f5b21c8d4e9f7a1b2c3d4e5f6a7b8c', 'ioc-hash',
  'Industroyer2 Sample', 'Sandworm', 'high', 'critical', 98,
  true, true, ARRAY['IEC-60870-5-104']::transmission_protocol[],
  'SHA256 hash of confirmed Industroyer2 malware variant.',
  ARRAY['Block hash', 'Full network scan', 'Enhanced monitoring'],
  true, NOW() - INTERVAL '25 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', 'ioc-hash',
  'TRITON Payload', 'TEMP.Veles', 'high', 'critical', 99,
  true, true, ARRAY[]::transmission_protocol[],
  'Known TRITON malware payload targeting Triconex safety controllers.',
  ARRAY['Immediate blocking', 'Safety system forensics'],
  true, NOW() - INTERVAL '40 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_nesa_feed_id,
  'f7e8d9c0b1a2938475a6b5c4d3e2f10a', 'ioc-hash',
  'LockBit Ransomware Variant', 'LockBit', 'high', 'high', 62,
  false, false, ARRAY[]::transmission_protocol[],
  'Recent LockBit ransomware variant hash identified in UAE incidents.',
  ARRAY['Antivirus update', 'Endpoint detection'],
  true, NOW() - INTERVAL '15 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_internal_feed_id,
  'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', 'ioc-hash',
  'Internal Phishing Document', 'Unknown', 'medium', 'medium', 48,
  false, false, ARRAY[]::transmission_protocol[],
  'Malicious Word document from internal phishing campaign.',
  ARRAY['Email filtering', 'User education'],
  true, NOW() - INTERVAL '8 days', NOW()
),

-- Attack Pattern Indicators (7+)
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  'cmd.exe /c "net user Admin /add"', 'attack-pattern',
  'VoltTyphoon Persistence', 'Volt Typhoon', 'medium', 'high', 75,
  false, true, ARRAY[]::transmission_protocol[],
  'Behavioral indicator of attempted persistence creation on HMI servers.',
  ARRAY['Monitor process creation logs', 'Restrict execution of cmd.exe for standard users'],
  true, NOW() - INTERVAL '15 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  'Rapid GOOSE message flooding', 'attack-pattern',
  'IEC 61850 GOOSE Flood Attack', 'Unknown', 'high', 'critical', 93,
  true, true, ARRAY['IEC-61850']::transmission_protocol[],
  'Attack pattern: flooding substation LAN with GOOSE messages to disrupt communications.',
  ARRAY['GOOSE message rate limiting', 'Network monitoring', 'Protocol filtering'],
  true, NOW() - INTERVAL '10 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_mandiant_feed_id,
  'Modbus function code 17 abuse', 'attack-pattern',
  'Modbus Protocol Manipulation', 'APT33', 'high', 'critical', 88,
  true, true, ARRAY['Modbus-TCP']::transmission_protocol[],
  'Abuse of Modbus diagnostic function codes for reconnaissance and manipulation.',
  ARRAY['Modbus function code filtering', 'Enhanced logging'],
  true, NOW() - INTERVAL '12 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_ics_cert_feed_id,
  'DNP3 unsolicited response injection', 'attack-pattern',
  'DNP3 Protocol Attack', 'Unknown', 'medium', 'high', 82,
  true, true, ARRAY['DNP3']::transmission_protocol[],
  'Injection of unsolicited DNP3 responses to manipulate RTU behavior.',
  ARRAY['DNP3 response validation', 'Communication authentication'],
  true, NOW() - INTERVAL '18 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_dragos_feed_id,
  'Rapid credential spraying against SCADA', 'attack-pattern',
  'SCADA Password Spraying', 'Multiple', 'medium', 'high', 71,
  false, true, ARRAY[]::transmission_protocol[],
  'Password spraying attacks targeting common SCADA default credentials.',
  ARRAY['Account lockout policies', 'Login monitoring', 'Default password changes'],
  true, NOW() - INTERVAL '22 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_nesa_feed_id,
  'Time synchronization manipulation', 'attack-pattern',
  'NTP Attack Pattern', 'Unknown', 'medium', 'high', 79,
  true, true, ARRAY[]::transmission_protocol[],
  'Manipulation of time synchronization to disrupt sequence of events recording.',
  ARRAY['NTP authentication', 'Multiple time sources', 'Drift monitoring'],
  true, NOW() - INTERVAL '16 days', NOW()
),
(
  gen_random_uuid(), v_tenant_id, v_internal_feed_id,
  'Off-hours engineering access', 'attack-pattern',
  'Suspicious Access Pattern', 'Unknown', 'low', 'medium', 52,
  false, true, ARRAY[]::transmission_protocol[],
  'Pattern of engineering access during unusual hours from unexpected locations.',
  ARRAY['Access time restrictions', 'Behavioral analytics', 'User verification'],
  true, NOW() - INTERVAL '6 days', NOW()
);

-- =============================================================================
-- THREAT MATCHES (Simulated Detections) - 15+
-- =============================================================================

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for GridLock C2 IP
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Core Firewall',
  NOW() - INTERVAL '1 day', indicator_value, 0.95,
  'investigating', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '185.192.17.15' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for VoltTyphoon C2 IP
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'IDS',
  NOW() - INTERVAL '3 hours', indicator_value, 0.92,
  'contained', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '203.0.113.45' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for TRITON staging server
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Perimeter Firewall',
  NOW() - INTERVAL '6 hours', indicator_value, 0.98,
  'mitigated', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '198.51.100.92' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for internal compromised host
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Internal IDS',
  NOW() - INTERVAL '30 minutes', indicator_value, 0.88,
  'investigating', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '10.45.12.88' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for Sandworm C2
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Threat Intelligence Platform',
  NOW() - INTERVAL '12 hours', indicator_value, 0.96,
  'contained', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '91.240.118.164' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for trojanized firmware file
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'file-hash', 'Antivirus',
  NOW() - INTERVAL '2 days', indicator_value, 0.94,
  'mitigated', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'update_firmware_siemens_v4.exe' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for Industroyer2 hash
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'file-hash', 'EDR Platform',
  NOW() - INTERVAL '5 days', indicator_value, 0.99,
  'mitigated', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'a3f5b21c8d4e9f7a1b2c3d4e5f6a7b8c' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for fake SCADA update domain
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'DNS Logs',
  NOW() - INTERVAL '18 hours', indicator_value, 0.91,
  'investigating', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'scada-update-center.net' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for GOOSE flooding attack pattern
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'behavioral', 'Protocol Analyzer',
  NOW() - INTERVAL '4 hours', indicator_value, 0.87,
  'investigating', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'Rapid GOOSE message flooding' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for Modbus protocol manipulation
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'behavioral', 'SCADA IDS',
  NOW() - INTERVAL '8 hours', indicator_value, 0.85,
  'contained', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'Modbus function code 17 abuse' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for APT34 infrastructure
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Proxy Logs',
  NOW() - INTERVAL '15 hours', indicator_value, 0.79,
  'detected', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '45.129.56.200' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for LockBit ransomware hash
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'file-hash', 'Endpoint Protection',
  NOW() - INTERVAL '10 hours', indicator_value, 0.97,
  'mitigated', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'f7e8d9c0b1a2938475a6b5c4d3e2f10a' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for phishing infrastructure
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Email Gateway',
  NOW() - INTERVAL '1 day', indicator_value, 0.73,
  'mitigated', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = '104.244.72.35' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for malicious firmware distribution domain
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'network-traffic', 'Web Proxy',
  NOW() - INTERVAL '20 hours', indicator_value, 0.89,
  'contained', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'siemens-firmware-srv.com' AND tenant_id = v_tenant_id;

INSERT INTO threat_intelligence_matches (
  id, tenant_id, indicator_id, match_type, match_source,
  match_timestamp, matched_value, match_confidence,
  response_status, created_at, updated_at
)
-- Match for DNP3 attack pattern
SELECT
  gen_random_uuid(), v_tenant_id, id,
  'behavioral', 'OT Network Monitor',
  NOW() - INTERVAL '14 hours', indicator_value, 0.82,
  'investigating', NOW(), NOW()
FROM threat_intelligence_indicators
WHERE indicator_value = 'DNP3 unsolicited response injection' AND tenant_id = v_tenant_id;

END $$;

COMMIT;
