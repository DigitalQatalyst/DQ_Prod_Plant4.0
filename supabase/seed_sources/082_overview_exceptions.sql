BEGIN;

-- Precondition: Ensure tenant and teams exist
DO $$
DECLARE
  v_tenant_id UUID;
  v_team_count INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  SELECT COUNT(*) INTO v_team_count FROM teams;
  
  IF v_tenant_id IS NULL OR v_team_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants or teams found';
  END IF;
END $$;

-- Seed Overview Exceptions
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
),
team_lookup AS (
  SELECT id, name FROM teams
)
INSERT INTO overview_exceptions (tenant_id, exception_type, severity, title, description, owner_team_id, due_date, status, source_ref)
SELECT 
  t.id,
  v.type,
  v.severity,
  v.title,
  v.description,
  tl.id,
  v.due,
  v.status,
  v.ref
FROM tenant_lookup t
LEFT JOIN team_lookup tl ON tl.name = 'North Operations' -- Default owner
CROSS JOIN (VALUES
  ('maintenance', 'critical', 'Delayed Annual Maintenance - Substation A', 'The mandatory annual inspection for Dubai Main Substation is 45 days overdue.', 'Maintenance Team A', (CURRENT_DATE + INTERVAL '7 days')::date, 'new', '{"asset_id": "dummy"}'::jsonb),
  ('configuration', 'warning', 'Invalid Stream Policy Mismatch', 'Multiple default streams detected for Pilot Program in Jebel Ali.', 'Reliability Squad', (CURRENT_DATE + INTERVAL '2 days')::date, 'investigating', '{"stream_id": "pilot"}'::jsonb),
  ('connectivity', 'info', 'Intermittent Link Stutter', 'Slight latency increase in AL Aweer regional hub gateway.', 'Cyber Incident Response', (CURRENT_DATE + INTERVAL '14 days')::date, 'resolved', '{"gateway_id": "gw-001"}'::jsonb),
  ('security', 'critical', 'Unauthorized Service Account Access', 'Detected multiple failed login attempts from a service account in SNR region.', 'Cyber Incident Response', CURRENT_DATE, 'new', '{"account": "svc-api-01"}'::jsonb),
  ('data_quality', 'warning', 'Negative Frequency Values Detected', 'Sensor SNR-661 reported negative frequency values for 12 consecutive samples.', 'Reliability Squad', (CURRENT_DATE + INTERVAL '1 day')::date, 'investigating', '{"sensor_id": "snr-661"}'::jsonb)
) AS v(type, severity, title, description, team_name, due, status, ref)
-- Overwrite the team_lookup if a specific team name was provided in values (though currently we just use one for demo simplicity)
ON CONFLICT DO NOTHING; -- No natural key in table currently, so we don't upsert by name to avoid issues

-- Post-seed validation
DO $$
DECLARE
  v_exception_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_exception_count FROM overview_exceptions;
  
  IF v_exception_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 exceptions, got %', v_exception_count;
  END IF;
END $$;

COMMIT;
