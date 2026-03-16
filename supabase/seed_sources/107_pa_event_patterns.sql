-- Seed Data: pa_event_patterns
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.6.1-2.6.7
-- Description: Seed event patterns for complex event processing and anomaly detection

-- Get DEWA tenant ID
DO $$
DECLARE
  v_tenant_id UUID;
  v_trigger_overvoltage UUID;
BEGIN
  -- Get DEWA tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  -- Get a trigger ID for reference (optional)
  SELECT id INTO v_trigger_overvoltage FROM pa_triggers 
  WHERE tenant_id = v_tenant_id AND name = 'Overvoltage Protection' LIMIT 1;

  -- Insert event patterns
  INSERT INTO pa_event_patterns (
    id, tenant_id, name, description, pattern_type, match_conditions,
    time_window, detection_threshold, confidence_level, action_on_match,
    trigger_id, enabled, tags, created_by, updated_by
  ) VALUES
  (
    gen_random_uuid(),
    v_tenant_id,
    'Voltage Surge Sequence',
    'Detect sequence of voltage surges indicating grid instability',
    'sequence',
    '{
      "events": [
        {"type": "voltage_spike", "threshold": 140, "within": "5m"},
        {"type": "voltage_spike", "threshold": 140, "within": "10m"},
        {"type": "voltage_spike", "threshold": 140, "within": "15m"}
      ],
      "min_occurrences": 3
    }'::jsonb,
    900, -- 15 minutes
    140.0,
    0.85,
    'trigger',
    v_trigger_overvoltage,
    true,
    '["voltage", "surge", "grid-stability"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Load Rising Trend',
    'Detect sustained upward load trend that may require capacity planning',
    'trend',
    '{
      "direction": "increasing",
      "duration_minutes": 60,
      "rate_of_change": 10,
      "parameter": "load_mw"
    }'::jsonb,
    3600, -- 1 hour
    10.0,
    0.90,
    'alert',
    NULL,
    true,
    '["load", "trend", "capacity"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Frequency Oscillation',
    'Detect grid frequency oscillations indicating instability',
    'oscillation',
    '{
      "parameter": "grid_frequency_hz",
      "frequency_minutes": 5,
      "amplitude_hz": 0.3,
      "min_cycles": 3
    }'::jsonb,
    1800, -- 30 minutes
    0.3,
    0.80,
    'alert',
    NULL,
    true,
    '["frequency", "oscillation", "stability"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Load-Voltage Correlation',
    'Detect abnormal correlation between load and voltage',
    'correlation',
    '{
      "parameters": ["load_mw", "voltage_kv"],
      "expected_correlation": -0.7,
      "deviation_threshold": 0.3,
      "sample_size": 20
    }'::jsonb,
    3600, -- 1 hour
    0.3,
    0.85,
    'alert',
    NULL,
    false,
    '["correlation", "load", "voltage"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Temperature Anomaly',
    'Detect unusual temperature patterns using statistical analysis',
    'anomaly',
    '{
      "parameter": "transformer_temp_c",
      "method": "statistical",
      "sensitivity": "medium",
      "baseline_days": 7,
      "std_dev_threshold": 2.5
    }'::jsonb,
    86400, -- 24 hours
    2.5,
    0.80,
    'alert',
    NULL,
    true,
    '["temperature", "anomaly", "transformer"]'::jsonb,
    'system',
    'system'
  ),
  (
    gen_random_uuid(),
    v_tenant_id,
    'Current Anomaly Detection',
    'Detect unusual current draw patterns that may indicate equipment issues',
    'anomaly',
    '{
      "parameter": "line_current_a",
      "method": "machine_learning",
      "model": "isolation_forest",
      "contamination": 0.1,
      "feature_window": 60
    }'::jsonb,
    7200, -- 2 hours
    0.1,
    0.75,
    'log',
    NULL,
    true,
    '["current", "anomaly", "equipment"]'::jsonb,
    'system',
    'system'
  );

  RAISE NOTICE 'Successfully seeded % event patterns for tenant %', 6, v_tenant_id;
  
END $$;
