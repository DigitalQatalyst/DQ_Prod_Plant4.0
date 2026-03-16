-- =============================================================================
-- SEED DATA: Log Retention Policies and Search Queries
-- Description: Seed data for audit_retention_policies, audit_search_queries, audit_export_requests
-- Requirements: 6.4
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_supervisor_user_id UUID;
  v_auditor_user_id UUID;
  v_engineer_user_id UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DEWA tenant not found. Please run tenant seed data first.';
  END IF;
  
  -- Get security users
  SELECT id INTO v_admin_user_id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_supervisor_user_id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_auditor_user_id FROM security_users WHERE username = 'abdullah.alshamsi' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_engineer_user_id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = v_tenant_id LIMIT 1;

  -- =============================================================================
  -- AUDIT RETENTION POLICIES
  -- =============================================================================
  
  INSERT INTO audit_retention_policies (
    tenant_id, name, description,
    event_types, event_categories, severity_levels,
    retention_period_days, archive_after_days,
    compliance_standards, legal_hold, active, priority,
    created_by
  ) VALUES
  -- NERC CIP Compliance - 3 Year Retention
  (
    v_tenant_id, 'NERC CIP Compliance Logs', 
    'Retention policy for NERC CIP compliance - authentication, authorization, and security events',
    ARRAY['authentication', 'authorization', 'security_violation', 'privilege_escalation']::audit_event_type[],
    ARRAY['identity', 'access', 'security'],
    ARRAY['warning', 'high', 'critical']::audit_severity[],
    1095, 365,
    ARRAY['NERC-CIP-005', 'NERC-CIP-007', 'NERC-CIP-008'],
    false, true, 10,
    v_admin_user_id
  ),
  -- IEC 62351 Security Events
  (
    v_tenant_id, 'IEC 62351 Security Events',
    'Retention policy for IEC 62351 power system security events including certificate and key operations',
    ARRAY['certificate_operation', 'key_operation', 'authentication', 'data_access']::audit_event_type[],
    ARRAY['security', 'access'],
    ARRAY['info', 'warning', 'high', 'critical']::audit_severity[],
    730, 180,
    ARRAY['IEC-62351', 'IEC-62443'],
    false, true, 20,
    v_admin_user_id
  ),
  -- Configuration Change Audit Trail
  (
    v_tenant_id, 'Configuration Change Audit Trail',
    'Permanent retention for all protection relay and RTU configuration changes',
    ARRAY['configuration_change', 'policy_change']::audit_event_type[],
    ARRAY['system', 'policy'],
    ARRAY['info', 'warning', 'high', 'critical']::audit_severity[],
    2555, 730,
    ARRAY['IEC-62443', 'NERC-CIP-010'],
    false, true, 15,
    v_supervisor_user_id
  ),
  -- Incident Investigation Hold
  (
    v_tenant_id, 'Incident Investigation Hold',
    'Legal hold for logs related to security incident investigations',
    NULL,
    ARRAY['security', 'access', 'identity'],
    ARRAY['high', 'critical']::audit_severity[],
    3650, NULL,
    ARRAY['Legal', 'Regulatory'],
    true, true, 5,
    v_admin_user_id
  ),
  -- Standard Operational Logs
  (
    v_tenant_id, 'Standard Operational Logs',
    'Standard retention for routine operational events and data access',
    ARRAY['data_access', 'system_access', 'session_management']::audit_event_type[],
    ARRAY['data', 'access'],
    ARRAY['info']::audit_severity[],
    90, 30,
    NULL,
    false, true, 100,
    v_supervisor_user_id
  ),
  -- Compliance Audit Trail
  (
    v_tenant_id, 'Compliance Audit Trail',
    'Long-term retention for compliance checks and audit reports',
    ARRAY['compliance_check']::audit_event_type[],
    ARRAY['compliance'],
    ARRAY['info', 'warning', 'high', 'critical']::audit_severity[],
    1825, 365,
    ARRAY['IEC-62443', 'NERC-CIP', 'ISO-27001'],
    false, true, 25,
    v_auditor_user_id
  );

  -- =============================================================================
  -- AUDIT SEARCH QUERIES (Saved Searches)
  -- =============================================================================
  
  INSERT INTO audit_search_queries (
    tenant_id, name, description,
    query_filters, time_range_hours,
    created_by, shared_with_roles, is_public,
    usage_count, last_used
  ) VALUES
  -- Security analyst searches
  (
    v_tenant_id, 'Failed Logins (Last 24h)',
    'Find all failed authentication attempts in the last 24 hours',
    '{"event_type": "authentication", "outcome": "failure"}',
    24,
    v_admin_user_id, ARRAY['administrator', 'supervisor']::transmission_role[], false,
    45, NOW() - INTERVAL '2 hours'
  ),
  (
    v_tenant_id, 'Critical Security Violations',
    'All critical and high severity security violations',
    '{"event_category": "security", "severity": ["high", "critical"]}',
    168,
    v_admin_user_id, ARRAY['administrator', 'supervisor']::transmission_role[], true,
    28, NOW() - INTERVAL '1 day'
  ),
  (
    v_tenant_id, 'Protection Relay Changes',
    'Configuration changes to protection relay devices',
    '{"event_type": "configuration_change", "target_type": "asset", "component_type": "protection_relay"}',
    720,
    v_engineer_user_id, ARRAY['engineer', 'supervisor']::transmission_role[], false,
    15, NOW() - INTERVAL '3 days'
  ),
  (
    v_tenant_id, 'Remote Access Sessions',
    'All remote access and VPN session events',
    '{"event_type": "system_access", "action_performed": {"contains": "remote"}}',
    168,
    v_supervisor_user_id, ARRAY['administrator', 'supervisor', 'auditor']::transmission_role[], true,
    22, NOW() - INTERVAL '12 hours'
  ),
  -- Compliance searches
  (
    v_tenant_id, 'NERC CIP Audit Trail',
    'Events relevant for NERC CIP compliance audits',
    '{"compliance_impact": {"contains": "NERC"}, "severity": ["warning", "high", "critical"]}',
    2160,
    v_auditor_user_id, ARRAY['auditor', 'administrator']::transmission_role[], false,
    8, NOW() - INTERVAL '5 days'
  ),
  (
    v_tenant_id, 'Weekly Compliance Summary',
    'Summary of compliance-related events for weekly reporting',
    '{"event_category": "compliance"}',
    168,
    v_auditor_user_id, ARRAY['auditor']::transmission_role[], false,
    12, NOW() - INTERVAL '7 days'
  ),
  -- Operational searches
  (
    v_tenant_id, 'Zone Access Denied Events',
    'All access denied events by zone',
    '{"event_type": "authorization", "outcome": "denied"}',
    168,
    v_supervisor_user_id, ARRAY['administrator', 'supervisor']::transmission_role[], true,
    18, NOW() - INTERVAL '6 hours'
  );

  -- =============================================================================
  -- AUDIT EXPORT REQUESTS
  -- =============================================================================
  
  INSERT INTO audit_export_requests (
    tenant_id, export_name, request_reason,
    filters, date_from, date_to,
    export_format,
    requested_by, status,
    approved_by,
    file_path, file_size_bytes,
    completed_at
  ) VALUES
  -- Completed exports
  (
    v_tenant_id, 'Q4 2024 NERC CIP Audit Export',
    'Quarterly audit export for NERC CIP compliance review',
    '{"compliance_impact": {"contains": "NERC"}}',
    NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day',
    'csv',
    v_auditor_user_id, 'completed',
    v_admin_user_id,
    '/exports/nerc-cip-q4-2024.zip', 15728640,
    NOW() - INTERVAL '1 day'
  ),
  (
    v_tenant_id, 'Security Incident IR-2024-001 Logs',
    'Forensic export for security incident investigation',
    '{"correlation_id": "IR-2024-001"}',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days',
    'json',
    v_admin_user_id, 'completed',
    v_admin_user_id,
    '/exports/incident-ir-2024-001.json', 2456832,
    NOW() - INTERVAL '4 days'
  ),
  -- Pending export
  (
    v_tenant_id, 'Monthly Configuration Change Report',
    'Monthly export of all configuration changes for engineering review',
    '{"event_type": "configuration_change"}',
    NOW() - INTERVAL '30 days', NOW(),
    'pdf',
    v_engineer_user_id, 'pending',
    NULL,
    NULL, NULL,
    NULL
  );

END $$;

COMMIT;
