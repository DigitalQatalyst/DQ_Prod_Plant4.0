BEGIN;

-- Precondition: Ensure tenant exists
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: No tenants found';
  END IF;
END $$;

-- 1) Seed Platform Health Checks
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO platform_health_checks (tenant_id, check_key, name, description, enabled, params)
SELECT 
  t.id,
  v.check_key,
  v.name,
  v.description,
  true,
  v.params
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('rest_connectivity', 'Rest Connectivity', 'Verifies reachability of external REST endpoints', '{"endpoints": ["SAP", "ServiceNow"]}'::jsonb),
  ('telemetry_freshness', 'Telemetry Freshness', 'Checks for stale data points in the last 15 mins', '{"threshold_mins": 15}'::jsonb),
  ('database_storage', 'Database Storage', 'Monitors disk usage and partition health', '{"warning_pct": 85}'::jsonb),
  ('auth_health', 'Auth Service Health', 'Verifies identity provider responsiveness', '{}'::jsonb),
  ('stream_latency', 'Stream Latency', 'Measures end-to-end processing delay', '{"max_latency_ms": 2000}'::jsonb),
  ('rls_integrity', 'RLS Policy Integrity', 'Audit of tenant isolation constraints', '{}'::jsonb)
) AS v(check_key, name, description, params)
ON CONFLICT (tenant_id, check_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  params = EXCLUDED.params;

-- 2) Seed Platform Health Findings
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO platform_health_findings (tenant_id, check_key, severity, status, first_seen, last_seen, details, resolved_at)
SELECT 
  t.id,
  v.check_key,
  v.severity,
  v.status,
  v.first_seen,
  v.last_seen,
  v.details,
  v.resolved_at
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('rest_connectivity', 'warning', 'open', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '5 minutes', '{"title": "SAP PM Endpoint Latency", "latency_ms": 5400}'::jsonb, NULL),
  ('telemetry_freshness', 'critical', 'open', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '1 minute', '{"title": "Site C Telemetry Stalled", "stale_sites": ["dubai-substation-main"]}'::jsonb, NULL),
  ('database_storage', 'info', 'resolved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', '{"title": "Table Bloat Warning"}'::jsonb, NOW() - INTERVAL '1 day'),
  ('stream_latency', 'warning', 'open', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes', '{"title": "Processing Pipeline Congestion", "queue_depth": 14000}'::jsonb, NULL),
  ('auth_health', 'info', 'resolved', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', '{"title": "Routine Auth Bypass Audit"}'::jsonb, NOW() - INTERVAL '2 days')
) AS v(check_key, severity, status, first_seen, last_seen, details, resolved_at)
ON CONFLICT DO NOTHING;

-- Post-seed validation
DO $$
DECLARE
  v_check_count INTEGER;
  v_finding_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_check_count FROM platform_health_checks;
  SELECT COUNT(*) INTO v_finding_count FROM platform_health_findings;
  
  IF v_check_count < 6 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 6 health checks, got %', v_check_count;
  END IF;
  
  IF v_finding_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 health findings, got %', v_finding_count;
  END IF;
END $$;

COMMIT;
