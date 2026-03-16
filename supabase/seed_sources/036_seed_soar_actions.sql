-- Seed data for transmission_soar_actions
-- Description: Security Orchestration, Automation and Response actions for OT security
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

    -- Clear existing SOAR actions for this tenant
    DELETE FROM transmission_soar_actions WHERE tenant_id = v_tenant_id;

    -- Insert SOAR Actions
    INSERT INTO transmission_soar_actions (
        tenant_id, name, description, type, target_type, 
        requires_approval, approval_level, is_critical, 
        execution_count, last_executed
    ) VALUES
    -- Asset Isolation Actions
    (
        v_tenant_id,
        'Isolate SCADA Server',
        'Immediately disconnect SCADA server from all network segments and disable all external connectivity.',
        'isolate-asset',
        'scada-server',
        true,
        'security-manager',
        true,
        3,
        NOW() - INTERVAL '15 days'
    ),
    (
        v_tenant_id,
        'Quarantine HMI Workstation',
        'Isolate compromised HMI workstation by disabling network port and revoking access credentials.',
        'isolate-asset',
        'hmi-workstation',
        true,
        'incident-commander',
        true,
        8,
        NOW() - INTERVAL '5 days'
    ),
    (
        v_tenant_id,
        'Disconnect RTU from Network',
        'Remove RTU from communication network to prevent further compromise or unauthorized control.',
        'isolate-asset',
        'rtu',
        true,
        'operations-manager',
        true,
        2,
        NOW() - INTERVAL '45 days'
    ),
    (
        v_tenant_id,
        'Disable Protection Relay Communications',
        'Disable network communications on protection relay while maintaining local protection functions.',
        'isolate-asset',
        'protection-relay',
        true,
        'protection-engineer',
        true,
        1,
        NOW() - INTERVAL '60 days'
    ),
    (
        v_tenant_id,
        'Isolate Engineering Workstation',
        'Network isolation of engineering workstation suspected of malware infection.',
        'isolate-asset',
        'engineering-station',
        false,
        'security-analyst',
        false,
        12,
        NOW() - INTERVAL '8 days'
    ),

    -- Network Blocking Actions
    (
        v_tenant_id,
        'Block Malicious IP Address',
        'Add suspected malicious IP address to firewall blacklist across all perimeter devices.',
        'block-ip',
        'firewall',
        false,
        'security-analyst',
        false,
        45,
        NOW() - INTERVAL '2 days'
    ),
    (
        v_tenant_id,
        'Block C2 Domain',
        'Add command and control domain to DNS blacklist and proxy block list.',
        'block-ip',
        'firewall',
        false,
        'security-analyst',
        false,
        18,
        NOW() - INTERVAL '10 days'
    ),
    (
        v_tenant_id,
        'Block Unauthorized Protocol',
        'Configure firewall to drop all traffic using unauthorized industrial protocol on OT network.',
        'block-ip',
        'firewall',
        true,
        'network-engineer',
        false,
        6,
        NOW() - INTERVAL '30 days'
    ),
    (
        v_tenant_id,
        'Enable Geo-Blocking',
        'Activate geographic IP blocking for countries outside operational regions.',
        'block-ip',
        'firewall',
        false,
        'network-engineer',
        false,
        3,
        NOW() - INTERVAL '90 days'
    ),

    -- Credential Management Actions
    (
        v_tenant_id,
        'Disable Compromised User Account',
        'Immediately disable user account suspected of compromise across all systems.',
        'disable-credentials',
        'active-directory',
        false,
        'security-analyst',
        false,
        22,
        NOW() - INTERVAL '4 days'
    ),
    (
        v_tenant_id,
        'Revoke Service Account Permissions',
        'Remove all permissions from service account showing suspicious activity.',
        'disable-credentials',
        'authentication-server',
        true,
        'security-manager',
        true,
        7,
        NOW() - INTERVAL '20 days'
    ),
    (
        v_tenant_id,
        'Force Password Reset - All Users',
        'Trigger organization-wide password reset for all user accounts.',
        'disable-credentials',
        'active-directory',
        true,
        'ciso',
        true,
        1,
        NOW() - INTERVAL '120 days'
    ),
    (
        v_tenant_id,
        'Disable API Key',
        'Revoke API key showing signs of unauthorized use or exposure.',
        'disable-credentials',
        'api-gateway',
        false,
        'security-analyst',
        false,
        9,
        NOW() - INTERVAL '15 days'
    ),

    -- Alerting Actions
    (
        v_tenant_id,
        'Send Critical Alert to SOC',
        'Immediately notify Security Operations Center of critical security incident.',
        'send-alert',
        'siem',
        false,
        NULL,
        false,
        156,
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id,
        'Escalate to Incident Commander',
        'Auto-escalate high-severity incident to designated incident commander via multiple channels.',
        'send-alert',
        'incident-management',
        false,
        NULL,
        false,
        34,
        NOW() - INTERVAL '3 days'
    ),
    (
        v_tenant_id,
        'Notify Grid Operations',
        'Alert grid operations team of cybersecurity event affecting operational systems.',
        'send-alert',
        'control-center',
        false,
        NULL,
        true,
        28,
        NOW() - INTERVAL '5 days'
    ),
    (
        v_tenant_id,
        'Trigger Emergency Paging',
        'Activate emergency paging system for critical infrastructure incidents.',
        'send-alert',
        'notification-system',
        true,
        'operations-manager',
        true,
        4,
        NOW() - INTERVAL '30 days'
    ),

    -- Ticketing Actions
    (
        v_tenant_id,
        'Create Security Incident Ticket',
        'Automatically create incident ticket in ticketing system with pre-populated threat details.',
        'create-ticket',
        'ticketing-system',
        false,
        NULL,
        false,
        87,
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id,
        'Create Change Request for Remediation',
        'Generate change request ticket for security patch or configuration remediation.',
        'create-ticket',
        'change-management',
        false,
        NULL,
        false,
        52,
        NOW() - INTERVAL '6 days'
    ),

    -- Scanning Actions
    (
        v_tenant_id,
        'Run Vulnerability Scan',
        'Execute targeted vulnerability scan on specified asset or network segment.',
        'run-scan',
        'vulnerability-scanner',
        false,
        'security-analyst',
        false,
        145,
        NOW() - INTERVAL '2 days'
    ),
    (
        v_tenant_id,
        'Initiate Malware Scan',
        'Trigger full antivirus/antimalware scan on suspected compromised endpoint.',
        'run-scan',
        'antivirus-server',
        false,
        NULL,
        false,
        67,
        NOW() - INTERVAL '3 days'
    ),
    (
        v_tenant_id,
        'Scan for IOCs',
        'Search entire OT network for indicators of compromise from threat intelligence feeds.',
        'run-scan',
        'edr-platform',
        false,
        'threat-hunter',
        false,
        23,
        NOW() - INTERVAL '7 days'
    ),

    -- Log Collection Actions
    (
        v_tenant_id,
        'Collect System Logs',
        'Gather and centralize system logs from target asset for forensic analysis.',
        'collect-logs',
        'log-collector',
        false,
        NULL,
        false,
        234,
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id,
        'Capture Network Traffic',
        'Initiate packet capture on specified network segment for threat analysis.',
        'collect-logs',
        'packet-capture',
        true,
        'network-engineer',
        false,
        18,
        NOW() - INTERVAL '8 days'
    ),
    (
        v_tenant_id,
        'Export Audit Logs',
        'Extract and preserve audit logs from critical systems for compliance and investigation.',
        'collect-logs',
        'audit-system',
        false,
        NULL,
        false,
        98,
        NOW() - INTERVAL '4 days'
    ),

    -- Configuration Backup Actions
    (
        v_tenant_id,
        'Backup IED Configuration',
        'Create configuration backup of intelligent electronic device before remediation.',
        'backup-config',
        'protection-relay',
        false,
        NULL,
        false,
        45,
        NOW() - INTERVAL '10 days'
    ),
    (
        v_tenant_id,
        'Backup Firewall Rules',
        'Save current firewall configuration before implementing emergency rule changes.',
        'backup-config',
        'firewall',
        false,
        NULL,
        true,
        34,
        NOW() - INTERVAL '5 days'
    ),
    (
        v_tenant_id,
        'Snapshot SCADA Database',
        'Create point-in-time snapshot of SCADA database for recovery purposes.',
        'backup-config',
        'scada-server',
        false,
        'backup-administrator',
        true,
        67,
        NOW() - INTERVAL '3 days'
    ),

    -- File Quarantine Actions
    (
        v_tenant_id,
        'Quarantine Malicious File',
        'Isolate and quarantine suspected malware sample for analysis.',
        'quarantine-file',
        'file-system',
        false,
        NULL,
        false,
        42,
        NOW() - INTERVAL '6 days'
    ),
    (
        v_tenant_id,
        'Delete Malicious Script',
        'Remove confirmed malicious script from infected system.',
        'quarantine-file',
        'file-system',
        true,
        'incident-responder',
        false,
        15,
        NOW() - INTERVAL '12 days'
    );

END $$;

COMMIT;
