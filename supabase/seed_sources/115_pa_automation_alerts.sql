-- Seed data for pa_automation_alerts
-- References Transmission tenant and sites

INSERT INTO pa_automation_alerts (
  tenant_id,
  site_id,
  alert_type,
  severity,
  title,
  message,
  source_entity_type,
  source_entity_id,
  status,
  created_at,
  metadata
)
SELECT
  t.id as tenant_id,
  s.id as site_id,
  a.alert_type,
  a.severity,
  a.title,
  a.message,
  a.source_entity_type,
  (SELECT id FROM pa_workflows WHERE tenant_id = t.id LIMIT 1) as source_entity_id,
  a.status,
  NOW() - (a.days_ago || ' days')::interval as created_at,
  a.metadata
FROM 
  tenants t,
  sites s,
  (VALUES 
    ('trigger_activation', 'info', 'Sequence Triggered', 'Line Maintenance Sequence #402 started automatically.', 'trigger', 'active', 0, '{"trigger_id": "tr-1"}'::jsonb),
    ('workflow_failure', 'critical', 'Critical Workflow Aborted', 'Load shedding workflow failed at Step 3: Timeout waiting for response.', 'workflow', 'active', 1, '{"error": "timeout", "step": 3}'::jsonb),
    ('approval_required', 'warning', 'Approval Pending: V1.2.0', 'Configuration update V1.2.0 requires safety board approval.', 'version', 'active', 2, '{"version": "1.2.0"}'::jsonb),
    ('system_error', 'alarm', 'Controller Connectivity Loss', 'PLC-Transmission-01 is unreachable for over 120 seconds.', 'system', 'acknowledged', 3, '{"plc_id": "plc-01"}'::jsonb),
    ('threshold_breach', 'warning', 'Transformer Temperature High', 'Transformer T-45 temp at 85C (Threshold: 80C).', 'asset', 'resolved', 5, '{"temp": 85, "limit": 80}'::jsonb)
  ) as a(alert_type, severity, title, message, source_entity_type, status, days_ago, metadata)
WHERE t.name = 'DEWA - Transmission' AND s.name = 'Dubai Main Substation'
LIMIT 10;
