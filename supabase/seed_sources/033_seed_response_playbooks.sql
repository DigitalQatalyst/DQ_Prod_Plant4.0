-- Seed data for response_playbooks
-- Requirements: 5.1, 5.2, 8.1

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Clear existing response playbooks for this tenant
    DELETE FROM response_playbooks WHERE tenant_id = v_tenant_id;

    -- Insert Response Playbooks
    INSERT INTO response_playbooks (
        tenant_id, name, description, category, trigger_type, status,
        auto_execute, required_roles, estimated_duration_minutes, execution_count,
        success_rate, applicable_asset_types, applicable_protocols, applicable_threat_categories
    ) VALUES
    -- Containment Playbooks
    (
        v_tenant_id,
        'Emergency Grid Isolation',
        'Immediate isolation of compromised grid section to prevent cascading failures and protect critical infrastructure.',
        'containment',
        'incident-based',
        'active',
        false,
        ARRAY['grid-operator', 'security-manager'],
        15,
        3,
        1.0,
        ARRAY['substation', 'transmission-line'],
        ARRAY['IEC-61850', 'DNP3']::transmission_protocol[],
        ARRAY['protocol-abuse', 'scada-compromise']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Network Segmentation Enforcement',
        'Rapidly enforce strict network segmentation between IT and OT networks during active breach.',
        'containment',
        'incident-based',
        'active',
        false,
        ARRAY['network-engineer', 'security-analyst'],
        10,
        7,
        0.95,
        ARRAY['firewall', 'network-switch'],
        ARRAY['Modbus-TCP', 'IEC-60870-5-104']::transmission_protocol[],
        ARRAY['unauthorized-access', 'unauthorized-access']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Malware Containment - OT Network',
        'Isolate infected OT assets and prevent malware spread across operational network.',
        'containment',
        'alert-based',
        'active',
        false,
        ARRAY['incident-responder', 'ot-engineer'],
        20,
        4,
        0.92,
        ARRAY['hmi-workstation', 'engineering-station'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise', 'protocol-abuse']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'DDoS Traffic Filtering',
        'Activate upstream DDoS mitigation and traffic filtering for SCADA communication channels.',
        'containment',
        'anomaly-based',
        'active',
        true,
        ARRAY['network-engineer'],
        5,
        12,
        0.88,
        ARRAY['communication-gateway', 'router'],
        ARRAY['IEC-60870-5-104']::transmission_protocol[],
        ARRAY['denial-of-service']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Credential Revocation - Emergency',
        'Immediately revoke compromised credentials and force re-authentication across all systems.',
        'containment',
        'incident-based',
        'active',
        false,
        ARRAY['identity-admin', 'security-manager'],
        8,
        15,
        0.97,
        ARRAY['active-directory', 'authentication-server'],
        ARRAY[]::transmission_protocol[],
        ARRAY['unauthorized-access']::transmission_threat_category[]
    ),

    -- Recovery Playbooks
    (
        v_tenant_id,
        'Load Shedding Protocol',
        'Systematic load reduction to maintain grid stability during cyber security incidents affecting generation or transmission.',
        'recovery',
        'anomaly-based',
        'active',
        false,
        ARRAY['load-dispatcher', 'operations-manager'],
        10,
        5,
        0.9,
        ARRAY['load-center', 'distribution-feeder'],
        ARRAY['Modbus-TCP']::transmission_protocol[],
        ARRAY['integrity-violation']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Communication System Recovery',
        'Restore critical communication links and establish backup communication paths during cyber incidents.',
        'recovery',
        'manual',
        'active',
        true,
        ARRAY['telecom-engineer', 'system-operator'],
        20,
        8,
        0.85,
        ARRAY['communication-gateway', 'network-switch'],
        ARRAY['IEC-60870-5-104']::transmission_protocol[],
        ARRAY['data-exfiltration']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'SCADA System Failover',
        'Activate backup SCADA system and transfer supervisory control to redundant infrastructure.',
        'recovery',
        'incident-based',
        'active',
        false,
        ARRAY['scada-engineer', 'operations-manager'],
        30,
        2,
        1.0,
        ARRAY['scada-server', 'backup-system'],
        ARRAY['IEC-61850', 'DNP3', 'Modbus-TCP']::transmission_protocol[],
        ARRAY['scada-compromise']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Database Restoration from Backup',
        'Restore SCADA/EMS databases from verified clean backups after ransomware or corruption.',
        'recovery',
        'incident-based',
        'active',
        false,
        ARRAY['database-admin', 'backup-specialist'],
        45,
        6,
        0.93,
        ARRAY['scada-server', 'database-server'],
        ARRAY[]::transmission_protocol[],
        ARRAY['integrity-violation', 'scada-compromise']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Manual Operations Mode Activation',
        'Transition to manual grid operations when SCADA/EMS systems are compromised.',
        'recovery',
        'incident-based',
        'active',
        false,
        ARRAY['grid-operator', 'shift-supervisor'],
        60,
        1,
        1.0,
        ARRAY['control-center'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise']::transmission_threat_category[]
    ),

    -- Incident Response Playbooks
    (
        v_tenant_id,
        'Protection System Coordination',
        'Reconfigure protection system settings to maintain selectivity and coordination during security incidents.',
        'incident-response',
        'alert-based',
        'active',
        false,
        ARRAY['protection-engineer', 'system-operator'],
        30,
        2,
        1.0,
        ARRAY['protection-relay', 'circuit-breaker'],
        ARRAY['IEC-61850']::transmission_protocol[],
        ARRAY['protocol-abuse']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'SCADA System Compromise Response',
        'Immediate response procedures for SCADA system security breaches including isolation and backup activation.',
        'incident-response',
        'incident-based',
        'active',
        false,
        ARRAY['scada-engineer', 'security-analyst', 'operations-manager'],
        45,
        1,
        1.0,
        ARRAY['scada-server', 'hmi-workstation'],
        ARRAY['Modbus-TCP', 'DNP3']::transmission_protocol[],
        ARRAY['unauthorized-access', 'scada-compromise']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Ransomware Incident Response',
        'Comprehensive response to ransomware attacks including isolation, forensics, and recovery coordination.',
        'incident-response',
        'incident-based',
        'active',
        false,
        ARRAY['incident-responder', 'forensic-analyst', 'legal-counsel'],
        120,
        3,
        0.89,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise', 'integrity-violation']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Insider Threat Investigation',
        'Structured investigation and response procedures for suspected insider threat activities.',
        'incident-response',
        'manual',
        'active',
        false,
        ARRAY['security-analyst', 'hr-manager', 'legal-counsel'],
        240,
        2,
        0.85,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['unauthorized-access', 'data-exfiltration']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'APT Campaign Response',
        'Multi-phase response to advanced persistent threat campaigns targeting critical infrastructure.',
        'incident-response',
        'manual',
        'active',
        false,
        ARRAY['threat-hunter', 'incident-responder', 'executive-management'],
        480,
        1,
        0.80,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise', 'data-exfiltration']::transmission_threat_category[]
    ),

    -- Investigation Playbooks
    (
        v_tenant_id,
        'Network Traffic Analysis',
        'Deep packet inspection and analysis of OT network traffic for threat hunting and forensics.',
        'investigation',
        'manual',
        'active',
        false,
        ARRAY['security-analyst', 'network-engineer'],
        90,
        18,
        0.91,
        ARRAY['network-switch', 'firewall'],
        ARRAY['Modbus-TCP', 'DNP3', 'IEC-61850']::transmission_protocol[],
        ARRAY['data-exfiltration', 'unauthorized-access']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'ICS Security Log Analysis',
        'Centralized analysis of SCADA, RTU, and IED logs to identify security incidents.',
        'investigation',
        'alert-based',
        'active',
        true,
        ARRAY['security-analyst'],
        60,
        45,
        0.87,
        ARRAY['scada-server', 'rtu', 'protection-relay'],
        ARRAY[]::transmission_protocol[],
        ARRAY['unauthorized-access', 'configuration-change']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Forensic Image Acquisition',
        'Capture forensic images of compromised systems for detailed offline analysis.',
        'investigation',
        'incident-based',
        'active',
        false,
        ARRAY['forensic-analyst', 'incident-responder'],
        180,
        8,
        0.96,
        ARRAY['hmi-workstation', 'engineering-station'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise', 'data-exfiltration']::transmission_threat_category[]
    ),

    -- Prevention Playbooks
    (
        v_tenant_id,
        'Proactive Threat Hunting',
        'Scheduled threat hunting exercises across OT network to identify dormant threats.',
        'prevention',
        'manual',
        'active',
        false,
        ARRAY['threat-hunter', 'security-analyst'],
        240,
        12,
        0.75,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise', 'unauthorized-access']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Vulnerability Remediation',
        'Systematic patching and remediation of identified vulnerabilities in OT systems.',
        'prevention',
        'manual',
        'active',
        false,
        ARRAY['patch-coordinator', 'ot-engineer', 'change-manager'],
        360,
        25,
        0.94,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['protocol-abuse']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Security Baseline Hardening',
        'Apply security hardening configurations to OT assets per industry best practices.',
        'prevention',
        'manual',
        'active',
        false,
        ARRAY['security-engineer', 'ot-engineer'],
        120,
        34,
        0.98,
        ARRAY['scada-server', 'hmi-workstation', 'engineering-station'],
        ARRAY[]::transmission_protocol[],
        ARRAY['unauthorized-access']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Incident Response Drill',
        'Regular tabletop and technical drills to validate incident response procedures.',
        'prevention',
        'manual',
        'active',
        false,
        ARRAY['all-roles'],
        120,
        8,
        1.0,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY[]::transmission_threat_category[]
    ),

    -- Draft/Archived Playbooks
    (
        v_tenant_id,
        'Zero-Day Response Framework',
        'Rapid response framework for newly disclosed zero-day vulnerabilities affecting OT systems.',
        'incident-response',
        'alert-based',
        'draft',
        false,
        ARRAY['vulnerability-manager', 'security-architect'],
        60,
        0,
        NULL,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['protocol-abuse']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Supply Chain Attack Response',
        'Response procedures for security incidents originating from compromised supply chain.',
        'incident-response',
        'incident-based',
        'draft',
        false,
        ARRAY['procurement-manager', 'security-manager', 'vendor-liaison'],
        300,
        0,
        NULL,
        ARRAY['all-systems'],
        ARRAY[]::transmission_protocol[],
        ARRAY['scada-compromise']::transmission_threat_category[]
    ),
    (
        v_tenant_id,
        'Legacy System Isolation - Deprecated',
        'Outdated procedure for isolating legacy systems, replaced by Network Segmentation Enforcement.',
        'containment',
        'manual',
        'deprecated',
        false,
        ARRAY['network-engineer'],
        15,
        23,
        0.82,
        ARRAY['legacy-device'],
        ARRAY[]::transmission_protocol[],
        ARRAY[]::transmission_threat_category[]
    );

END $$;

COMMIT;