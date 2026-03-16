-- FS1: Asset Health & Diagnostics - Seed Script
-- This script populates initial data for health monitoring and diagnostics
-- Requirements: 6.1-6.10, 7.1-7.10, 8.1-8.8, 9.1-9.9, 10.1-10.6, 11.1-11.6
--
-- This seed script is idempotent using natural key upserts (ON CONFLICT ... DO UPDATE).

-- =============================================================================
-- SUBTASK 15.1: Seed asset_parameter_map
-- Requirements: 6.9, 6.10
-- =============================================================================

-- Map transformer parameters to power_transformer asset_type (at least 10)
DO $$
DECLARE
  param_id UUID;
BEGIN
  -- Get parameter IDs and insert mappings
  
  -- Transformer parameters
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'top_oil_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'winding_hot_spot' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'load_current' AND parameter_type = 'current';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, true, 60) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'dga_h2' AND parameter_type = 'concentration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'dga_ch4' AND parameter_type = 'concentration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'dga_c2h2' AND parameter_type = 'concentration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'moisture_ppm' AND parameter_type = 'concentration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'bushing_power_factor' AND parameter_type = 'percentage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 2592000) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'oltc_operations_count' AND parameter_type = 'count';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'vibration' AND parameter_type = 'acceleration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'cooling_fan_status' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('power_transformer', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Circuit Breaker parameters (at least 10)
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'sf6_pressure' AND parameter_type = 'pressure';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, true, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'sf6_density' AND parameter_type = 'density';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, true, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'contact_wear_percent' AND parameter_type = 'percentage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, true, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'operation_count' AND parameter_type = 'count';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, true, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'trip_coil_current' AND parameter_type = 'current';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'mechanism_time' AND parameter_type = 'time';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'partial_discharge' AND parameter_type = 'charge';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 86400) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add ambient temp for breakers
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'ambient_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add humidity for breakers
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'humidity' AND parameter_type = 'percentage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add load current for breakers
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'load_current' AND parameter_type = 'current';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('circuit_breaker', param_id, false, 60) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Transmission Line parameters (at least 10)
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'conductor_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'sag_estimate' AND parameter_type = 'distance';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'wind_speed' AND parameter_type = 'speed';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'current' AND parameter_type = 'current';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, true, 60) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'fault_indicator_status' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'lightning_counter' AND parameter_type = 'count';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add ambient temp for lines
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'ambient_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add humidity for lines
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'humidity' AND parameter_type = 'percentage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add vibration for lines
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'vibration' AND parameter_type = 'acceleration';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add top_oil_temp for lines (ice melting systems)
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'top_oil_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('transmission_line', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Protection Relay parameters (at least 10)
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'trip_events' AND parameter_type = 'count';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, true, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'self_test_status' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, true, 3600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'comms_latency' AND parameter_type = 'time';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'goose_status' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, false, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'time_sync_offset' AND parameter_type = 'time';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add ambient temp for relays
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'ambient_temp' AND parameter_type = 'temperature';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add humidity for relays
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'humidity' AND parameter_type = 'percentage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add dc_bus_voltage for relays
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'dc_bus_voltage' AND parameter_type = 'voltage';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, true, 300) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add intrusion_door_status for relays
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'intrusion_door_status' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

  -- Add smoke_fire_alarm for relays
  SELECT id INTO param_id FROM telemetry_parameters WHERE name = 'smoke_fire_alarm' AND parameter_type = 'status';
  INSERT INTO asset_parameter_map (asset_type, parameter_id, is_required, sampling_interval_seconds)
  VALUES ('protection_relay', param_id, false, 600) ON CONFLICT (asset_type, parameter_id) DO NOTHING;

END $$;

-- =============================================================================
-- SUBTASK 15.2: Seed health models
-- Requirements: 8.2
-- =============================================================================

-- Insert health model for power_transformer with parameter weights
INSERT INTO health_models (asset_type, model_version, parameter_weights, computation_method)
VALUES (
  'power_transformer',
  'v1.0',
  '{
    "top_oil_temp": 0.20,
    "winding_hot_spot": 0.25,
    "load_current": 0.10,
    "dga_h2": 0.10,
    "dga_ch4": 0.08,
    "dga_c2h2": 0.12,
    "moisture_ppm": 0.08,
    "bushing_power_factor": 0.05,
    "vibration": 0.02
  }'::jsonb,
  'weighted_average'
)
ON CONFLICT (asset_type, model_version) DO UPDATE
  SET parameter_weights = EXCLUDED.parameter_weights,
      computation_method = EXCLUDED.computation_method;

-- Insert health model for circuit_breaker with parameter weights
INSERT INTO health_models (asset_type, model_version, parameter_weights, computation_method)
VALUES (
  'circuit_breaker',
  'v1.0',
  '{
    "sf6_pressure": 0.25,
    "sf6_density": 0.25,
    "contact_wear_percent": 0.30,
    "operation_count": 0.05,
    "trip_coil_current": 0.08,
    "mechanism_time": 0.05,
    "partial_discharge": 0.02
  }'::jsonb,
  'weighted_average'
)
ON CONFLICT (asset_type, model_version) DO UPDATE
  SET parameter_weights = EXCLUDED.parameter_weights,
      computation_method = EXCLUDED.computation_method;

-- Insert health model for transmission_line with parameter weights
INSERT INTO health_models (asset_type, model_version, parameter_weights, computation_method)
VALUES (
  'transmission_line',
  'v1.0',
  '{
    "conductor_temp": 0.35,
    "current": 0.30,
    "sag_estimate": 0.15,
    "wind_speed": 0.05,
    "fault_indicator_status": 0.10,
    "lightning_counter": 0.05
  }'::jsonb,
  'weighted_average'
)
ON CONFLICT (asset_type, model_version) DO UPDATE
  SET parameter_weights = EXCLUDED.parameter_weights,
      computation_method = EXCLUDED.computation_method;

-- =============================================================================
-- SUBTASK 15.3: Seed sample telemetry data
-- Requirements: 7.10, 30.3
-- =============================================================================

-- Insert telemetry for online assets (last 7 days)
-- Include variety of Normal, Warning, Critical statuses

DO $$
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
  relay1_id UUID;
  relay2_id UUID;
  
  -- Parameter IDs
  top_oil_temp_id UUID;
  winding_hot_spot_id UUID;
  load_current_id UUID;
  dga_h2_id UUID;
  dga_ch4_id UUID;
  dga_c2h2_id UUID;
  moisture_ppm_id UUID;
  vibration_id UUID;
  
  sf6_pressure_id UUID;
  sf6_density_id UUID;
  contact_wear_id UUID;
  operation_count_id UUID;
  trip_coil_current_id UUID;
  
  conductor_temp_id UUID;
  current_id UUID;
  wind_speed_id UUID;
  
  trip_events_id UUID;
  self_test_status_id UUID;
  comms_latency_id UUID;
  time_sync_offset_id UUID;
  
  day_offset INTEGER;
  hour_offset INTEGER;
  v_ts TIMESTAMPTZ;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO line_n02_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N02';
  SELECT id INTO relay1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-001';
  SELECT id INTO relay2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-002';
  
  -- Get parameter IDs
  SELECT id INTO top_oil_temp_id FROM telemetry_parameters WHERE name = 'top_oil_temp' AND parameter_type = 'temperature';
  SELECT id INTO winding_hot_spot_id FROM telemetry_parameters WHERE name = 'winding_hot_spot' AND parameter_type = 'temperature';
  SELECT id INTO load_current_id FROM telemetry_parameters WHERE name = 'load_current' AND parameter_type = 'current';
  SELECT id INTO dga_h2_id FROM telemetry_parameters WHERE name = 'dga_h2' AND parameter_type = 'concentration';
  SELECT id INTO dga_ch4_id FROM telemetry_parameters WHERE name = 'dga_ch4' AND parameter_type = 'concentration';
  SELECT id INTO dga_c2h2_id FROM telemetry_parameters WHERE name = 'dga_c2h2' AND parameter_type = 'concentration';
  SELECT id INTO moisture_ppm_id FROM telemetry_parameters WHERE name = 'moisture_ppm' AND parameter_type = 'concentration';
  SELECT id INTO vibration_id FROM telemetry_parameters WHERE name = 'vibration' AND parameter_type = 'acceleration';
  
  SELECT id INTO sf6_pressure_id FROM telemetry_parameters WHERE name = 'sf6_pressure' AND parameter_type = 'pressure';
  SELECT id INTO sf6_density_id FROM telemetry_parameters WHERE name = 'sf6_density' AND parameter_type = 'density';
  SELECT id INTO contact_wear_id FROM telemetry_parameters WHERE name = 'contact_wear_percent' AND parameter_type = 'percentage';
  SELECT id INTO operation_count_id FROM telemetry_parameters WHERE name = 'operation_count' AND parameter_type = 'count';
  SELECT id INTO trip_coil_current_id FROM telemetry_parameters WHERE name = 'trip_coil_current' AND parameter_type = 'current';
  
  SELECT id INTO conductor_temp_id FROM telemetry_parameters WHERE name = 'conductor_temp' AND parameter_type = 'temperature';
  SELECT id INTO current_id FROM telemetry_parameters WHERE name = 'current' AND parameter_type = 'current';
  SELECT id INTO wind_speed_id FROM telemetry_parameters WHERE name = 'wind_speed' AND parameter_type = 'speed';
  
  SELECT id INTO trip_events_id FROM telemetry_parameters WHERE name = 'trip_events' AND parameter_type = 'count';
  SELECT id INTO self_test_status_id FROM telemetry_parameters WHERE name = 'self_test_status' AND parameter_type = 'status';
  SELECT id INTO comms_latency_id FROM telemetry_parameters WHERE name = 'comms_latency' AND parameter_type = 'time';
  SELECT id INTO time_sync_offset_id FROM telemetry_parameters WHERE name = 'time_sync_offset' AND parameter_type = 'time';

  -- Seed telemetry for TX-001 (online, mostly Normal with some Warning)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      -- Top oil temp: Normal range with occasional warning
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, tx1_id, top_oil_temp_id, 70 + (RANDOM() * 20), 'Â°C', 95 + (RANDOM() * 5));
      
      -- Winding hot spot: Normal
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, tx1_id, winding_hot_spot_id, 85 + (RANDOM() * 15), 'Â°C', 95 + (RANDOM() * 5));
      
      -- Load current: Normal
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, tx1_id, load_current_id, 800 + (RANDOM() * 400), 'A', 98 + (RANDOM() * 2));
    END LOOP;
  END LOOP;
  
  -- DGA readings for TX-001 (daily samples, Warning levels)
  FOR day_offset IN 0..6 LOOP
    v_ts := NOW() - (day_offset || ' days')::INTERVAL;
    
    INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
    VALUES (v_ts, tx1_id, dga_h2_id, 80 + (RANDOM() * 40), 'ppm', 90 + (RANDOM() * 10));
    
    INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
    VALUES (v_ts, tx1_id, dga_ch4_id, 90 + (RANDOM() * 50), 'ppm', 90 + (RANDOM() * 10));
    
    INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
    VALUES (v_ts, tx1_id, dga_c2h2_id, 25 + (RANDOM() * 20), 'ppm', 90 + (RANDOM() * 10));
    
    INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
    VALUES (v_ts, tx1_id, moisture_ppm_id, 20 + (RANDOM() * 15), 'ppm', 90 + (RANDOM() * 10));
  END LOOP;
  
  -- Vibration for TX-001 (5-minute samples)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, tx1_id, vibration_id, 4 + (RANDOM() * 3), 'mm/s', 95 + (RANDOM() * 5));
    END LOOP;
  END LOOP;
  
  -- Seed telemetry for CB-101 (online, Normal with one Critical reading)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      -- SF6 pressure: Critical on day 2
      IF day_offset = 2 THEN
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, cb101_id, sf6_pressure_id, 4.3 + (RANDOM() * 0.3), 'bar', 95 + (RANDOM() * 5));
      ELSE
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, cb101_id, sf6_pressure_id, 5.5 + (RANDOM() * 0.5), 'bar', 95 + (RANDOM() * 5));
      END IF;
      
      -- SF6 density: Normal
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb101_id, sf6_density_id, 42 + (RANDOM() * 3), 'kg/mÂ³', 95 + (RANDOM() * 5));
      
      -- Contact wear: Warning level
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb101_id, contact_wear_id, 65 + (RANDOM() * 10), '%', 90 + (RANDOM() * 10));
      
      -- Operation count: incrementing
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb101_id, operation_count_id, 1250 + day_offset, 'ops', 100);
    END LOOP;
  END LOOP;
  
  -- Trip coil current for CB-101 (daily test)
  FOR day_offset IN 0..6 LOOP
    v_ts := NOW() - (day_offset || ' days')::INTERVAL;
    
    INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
    VALUES (v_ts, cb101_id, trip_coil_current_id, 4.5 + (RANDOM() * 1.0), 'A', 95 + (RANDOM() * 5));
  END LOOP;

  -- Seed telemetry for CB-102 (online, Normal)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb102_id, sf6_pressure_id, 5.8 + (RANDOM() * 0.4), 'bar', 95 + (RANDOM() * 5));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb102_id, sf6_density_id, 44 + (RANDOM() * 2), 'kg/mÂ³', 95 + (RANDOM() * 5));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb102_id, contact_wear_id, 45 + (RANDOM() * 10), '%', 90 + (RANDOM() * 10));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, cb102_id, operation_count_id, 980 + day_offset, 'ops', 100);
    END LOOP;
  END LOOP;
  
  -- Seed telemetry for LINE-N01 (online, Warning on conductor temp)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      -- Conductor temp: Warning level during peak hours
      IF hour_offset >= 12 AND hour_offset <= 18 THEN
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, line_n01_id, conductor_temp_id, 78 + (RANDOM() * 8), 'Â°C', 95 + (RANDOM() * 5));
      ELSE
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, line_n01_id, conductor_temp_id, 55 + (RANDOM() * 15), 'Â°C', 95 + (RANDOM() * 5));
      END IF;
      
      -- Current: High during peak hours
      IF hour_offset >= 12 AND hour_offset <= 18 THEN
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, line_n01_id, current_id, 1000 + (RANDOM() * 150), 'A', 98 + (RANDOM() * 2));
      ELSE
        INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
        VALUES (v_ts, line_n01_id, current_id, 600 + (RANDOM() * 200), 'A', 98 + (RANDOM() * 2));
      END IF;
      
      -- Wind speed: Normal
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, line_n01_id, wind_speed_id, 3 + (RANDOM() * 7), 'm/s', 90 + (RANDOM() * 10));
    END LOOP;
  END LOOP;
  
  -- Seed telemetry for LINE-N02 (online, Normal)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, line_n02_id, conductor_temp_id, 50 + (RANDOM() * 15), 'Â°C', 95 + (RANDOM() * 5));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, line_n02_id, current_id, 500 + (RANDOM() * 200), 'A', 98 + (RANDOM() * 2));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, line_n02_id, wind_speed_id, 2 + (RANDOM() * 5), 'm/s', 90 + (RANDOM() * 10));
    END LOOP;
  END LOOP;
  
  -- Seed telemetry for RELAY-001 (online, Normal)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay1_id, trip_events_id, 0, 'events', 100);
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay1_id, self_test_status_id, 1, 'bool', 100);
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay1_id, comms_latency_id, 15 + (RANDOM() * 20), 'ms', 95 + (RANDOM() * 5));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay1_id, time_sync_offset_id, 2 + (RANDOM() * 5), 'ms', 95 + (RANDOM() * 5));
    END LOOP;
  END LOOP;

  -- Seed telemetry for RELAY-002 (online, Warning on comms latency)
  FOR day_offset IN 0..6 LOOP
    FOR hour_offset IN 0..23 LOOP
      v_ts := NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL;
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay2_id, trip_events_id, 0, 'events', 100);
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay2_id, self_test_status_id, 1, 'bool', 100);
      
      -- Comms latency: Warning level
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay2_id, comms_latency_id, 95 + (RANDOM() * 20), 'ms', 85 + (RANDOM() * 10));
      
      INSERT INTO telemetry_data (timestamp, asset_id, parameter_id, value, unit, quality_score)
      VALUES (v_ts, relay2_id, time_sync_offset_id, 3 + (RANDOM() * 4), 'ms', 95 + (RANDOM() * 5));
    END LOOP;
  END LOOP;

END ;

-- =============================================================================
-- SUBTASK 15.4: Seed diagnostic events
-- Requirements: 9.1-9.5
-- =============================================================================

-- Insert sample thermal, electrical, mechanical events
-- Include variety of states (open, ack, closed)
-- Link to telemetry windows

DO 
DECLARE
  tx1_id UUID;
  cb101_id UUID;
  line_n01_id UUID;
  relay2_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO relay2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-002';
  
  -- Thermal event on TX-001 (open)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, telemetry_window_start, telemetry_window_end
  )
  VALUES (
    tx1_id, 
    'thermal', 
    'Elevated Winding Temperature Detected',
    'Winding hot spot temperature exceeded warning threshold for sustained period',
    85,
    NOW() - INTERVAL '1 day',
    'open',
    NOW() - INTERVAL '1 day 2 hours',
    NOW() - INTERVAL '1 day'
  );
  
  -- Insulation event on TX-001 (acknowledged)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, acknowledged_by, acknowledged_at,
    telemetry_window_start, telemetry_window_end
  )
  VALUES (
    tx1_id, 
    'insulation', 
    'DGA Gas Levels Trending Upward',
    'Dissolved gas analysis shows increasing H2 and CH4 levels indicating potential insulation degradation',
    78,
    NOW() - INTERVAL '3 days',
    'ack',
    'engineer@example.com',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '3 days'
  );
  
  -- Electrical event on CB-101 (closed with resolution)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, acknowledged_by, acknowledged_at,
    closed_by, closed_at, resolution_notes,
    telemetry_window_start, telemetry_window_end
  )
  VALUES (
    cb101_id, 
    'electrical', 
    'SF6 Pressure Drop Detected',
    'SF6 gas pressure dropped below critical threshold indicating potential leak',
    92,
    NOW() - INTERVAL '5 days',
    'closed',
    'engineer@example.com',
    NOW() - INTERVAL '4 days',
    'technician@example.com',
    NOW() - INTERVAL '1 day',
    'SF6 leak identified and repaired. Seal replacement completed. Pressure restored to normal levels.',
    NOW() - INTERVAL '5 days 6 hours',
    NOW() - INTERVAL '5 days'
  );

  -- Mechanical event on CB-101 (open)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, telemetry_window_start, telemetry_window_end
  )
  VALUES (
    cb101_id, 
    'mechanical', 
    'Contact Wear Approaching Limit',
    'Contact wear percentage has reached 75%, approaching replacement threshold of 85%',
    88,
    NOW() - INTERVAL '12 hours',
    'open',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '12 hours'
  );
  
  -- Thermal event on LINE-N01 (acknowledged)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, acknowledged_by, acknowledged_at,
    telemetry_window_start, telemetry_window_end
  )
  VALUES (
    line_n01_id, 
    'thermal', 
    'Conductor Temperature Warning',
    'Conductor temperature exceeded warning threshold during peak load hours',
    82,
    NOW() - INTERVAL '2 days',
    'ack',
    'operator@example.com',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days 6 hours',
    NOW() - INTERVAL '2 days'
  );
  
  -- Comms event on RELAY-002 (open)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, telemetry_window_start, telemetry_window_end
  )
  VALUES (
    relay2_id, 
    'comms', 
    'Communication Latency Elevated',
    'Communication latency consistently above warning threshold, may impact protection response time',
    75,
    NOW() - INTERVAL '6 hours',
    'open',
    NOW() - INTERVAL '24 hours',
    NOW() - INTERVAL '6 hours'
  );
  
  -- Electrical event on LINE-N01 (closed with resolution)
  INSERT INTO diagnostic_events (
    asset_id, event_type, title, description, confidence, 
    detected_at, state, acknowledged_by, acknowledged_at,
    closed_by, closed_at, resolution_notes,
    telemetry_window_start, telemetry_window_end
  )
  VALUES (
    line_n01_id, 
    'electrical', 
    'Fault Indicator Activation',
    'Line fault indicator activated indicating transient fault event',
    90,
    NOW() - INTERVAL '4 days',
    'closed',
    'operator@example.com',
    NOW() - INTERVAL '4 days',
    'engineer@example.com',
    NOW() - INTERVAL '3 days',
    'Transient fault cleared automatically. Line inspection completed, no damage found. Fault indicator reset.',
    NOW() - INTERVAL '4 days 1 hour',
    NOW() - INTERVAL '4 days'
  );

END ;

-- =============================================================================
-- SUBTASK 15.5: Seed RCA records
-- Requirements: 10.1, 10.2
-- =============================================================================

-- Link RCA records to closed diagnostic events

DO 
DECLARE
  cb101_event_id UUID;
  line_n01_event_id UUID;
BEGIN
  -- Get closed diagnostic event IDs
  SELECT id INTO cb101_event_id 
  FROM diagnostic_events 
  WHERE asset_id = (SELECT id FROM assets WHERE asset_tag = 'CB-101')
    AND event_type = 'electrical'
    AND state = 'closed'
  LIMIT 1;
  
  SELECT id INTO line_n01_event_id 
  FROM diagnostic_events 
  WHERE asset_id = (SELECT id FROM assets WHERE asset_tag = 'LINE-N01')
    AND event_type = 'electrical'
    AND state = 'closed'
  LIMIT 1;
  
  -- RCA for CB-101 SF6 leak
  INSERT INTO rca_records (
    event_id, root_cause, contributing_factors, 
    corrective_actions, preventive_actions, created_by
  )
  VALUES (
    cb101_event_id,
    'Degraded seal on SF6 gas compartment due to aging and thermal cycling',
    'Seal material exceeded design life (15 years). Ambient temperature variations accelerated degradation. Insufficient preventive maintenance schedule.',
    'Replaced degraded seal with new high-temperature rated seal. Recharged SF6 gas to rated pressure. Performed leak test to verify integrity.',
    'Update preventive maintenance schedule to include seal inspection every 5 years. Implement SF6 density monitoring with automated alerts. Consider upgrading to newer seal technology on similar vintage breakers.',
    'rca_engineer@example.com'
  );

  -- RCA for LINE-N01 transient fault
  INSERT INTO rca_records (
    event_id, root_cause, contributing_factors, 
    corrective_actions, preventive_actions, created_by
  )
  VALUES (
    line_n01_event_id,
    'Bird contact with energized conductor causing transient ground fault',
    'Inadequate bird deterrent devices on tower structures. Nesting activity observed near line corridor. Recent weather conditions favorable for bird activity.',
    'Fault cleared automatically by protection system. Visual inspection confirmed no equipment damage. Fault indicator reset after verification.',
    'Install additional bird deterrent devices on affected tower structures. Schedule vegetation management to reduce nesting habitat. Review protection settings to ensure optimal coordination for transient faults.',
    'rca_engineer@example.com'
  );

END $$;

-- =============================================================================
-- Seed Script Complete
-- =============================================================================


