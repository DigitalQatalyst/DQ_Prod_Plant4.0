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

-- Seed Advisor Cards
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO advisor_cards (tenant_id, card_key, title, severity, rationale, recommended_action, deeplink_path, params)
SELECT 
  t.id,
  v.key,
  v.title,
  v.severity,
  v.rationale,
  v.action,
  v.path,
  v.params
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('opt_load_balancing', 'Load Balancing Opportunity', 'info', 'Current load on Substation A is 85% while Substation B is at 30%.', 'Shift 20% load to Substation B to improve stability.', '/topology/map', '{"substation_a": "main", "substation_b": "grid_01"}'::jsonb),
  ('risk_battery_end_of_life', 'Battery Replacement Warning', 'warning', 'UPS battery clusters in Hub North have reached 95% of their rated cycles.', 'Schedule replacement within 30 days to avoid outage risk.', '/assets/detail/ups-hub-n', '{"cycles": 2200, "rated": 2300}'::jsonb),
  ('health_sensor_drift', 'Sensor Drift Detected', 'warning', 'Frequency sensor SNR-661 shows a 0.5Hz deviation from neighbor averages.', 'Perform on-site calibration check.', '/assets/detail/snr-661', '{"deviation": 0.5}'::jsonb),
  ('opt_energy_trader', 'Wholesale Price Spike Forecast', 'info', 'High demand peak expected tomorrow between 2PM-5PM.', 'Optimize storage discharge schedule to maximize revenue.', '/overview/executive', '{"forecast_peak_mw": 1200}'::jsonb),
  ('security_policy_gap', 'Policy Inconsistency', 'critical', 'Default RLS policies for Pilot stream are more permissive than Production.', 'Align Pilot RLS settings with core security standards.', '/settings/modules', '{"stream": "pilot"}'::jsonb),
  ('maint_deferred_risk', 'Deferred Maintenance Backlog', 'warning', '3 critical maintenance tasks for Transformers are overdue by >10 days.', 'Authorize overtime for Maintenance Team A to clear backlog.', '/overview/triage', '{"overdue_count": 3}'::jsonb),
  ('opt_data_compression', 'Storage Optimization', 'info', 'Telemetry tables for Site B can benefit from TimescaleDB compression.', 'Apply compression policy to reduce disk footprint by 40%.', '/settings/integrations', '{"potential_savings_gb": 120}'::jsonb),
  ('health_gateway_firmware', 'Gateway Firmware Update', 'info', 'New firmware version v2.4.1 available for Hub North gateways.', 'Schedule bulk update during off-peak hours.', '/settings/integrations', '{"version": "2.4.1"}'::jsonb),
  ('risk_lone_worker', 'Safety Protocol: Lone Worker', 'info', 'Field Tech David Kim is entering a high-voltage zone alone.', 'Initiate safety check-in timer.', '/overview/ops', '{"user": "David Kim", "zone": "hv_switchyard"}'::jsonb),
  ('admin_integration_fail', 'ServiceNow API Rate Limit', 'warning', 'Ticketing integration reached 90% of hourly rate limit.', 'Adjust sync frequency to 15 minutes.', '/settings/integrations', '{"usage_pct": 90}'::jsonb)
) AS v(key, title, severity, rationale, action, path, params)
ON CONFLICT (tenant_id, card_key) DO UPDATE SET
  title = EXCLUDED.title,
  severity = EXCLUDED.severity,
  rationale = EXCLUDED.rationale,
  recommended_action = EXCLUDED.recommended_action,
  deeplink_path = EXCLUDED.deeplink_path,
  params = EXCLUDED.params;

-- Post-seed validation
DO $$
DECLARE
  v_card_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_card_count FROM advisor_cards;
  
  IF v_card_count < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 advisor_cards, got %', v_card_count;
  END IF;
END $$;

COMMIT;
