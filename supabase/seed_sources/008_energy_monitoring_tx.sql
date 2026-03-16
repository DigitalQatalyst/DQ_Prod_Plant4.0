-- Seed data for EMS Power Transmission - Energy Monitoring
-- Creates energy meters, telemetry, baselines, PQ limits, PQ events, and submeters
-- Uses CTE pattern with preconditions, idempotent upserts, and postchecks
-- Requirements: 2.1, 4.1, 6.3, 7.1

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_substation_count INTEGER;
  v_feeder_count INTEGER;
  v_transformer_count INTEGER;
BEGIN
  -- Verify transmission tenant exists
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Tenant "DEWA - Transmission" does not exist. Run 001_transmission_tenant.sql first.';
  END IF;
  
  -- Verify topology data exists
  SELECT COUNT(*) INTO v_substation_count
  FROM tx_substations s
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission';
  
  IF v_substation_count < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 5 substations, found %. Run 007_energy_tx_foundation.sql first.', v_substation_count;
  END IF;
  
  SELECT COUNT(*) INTO v_feeder_count
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission';
  
  IF v_feeder_count < 10 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 10 feeders, found %. Run 007_energy_tx_foundation.sql first.', v_feeder_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant and topology data exist';
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- 1) Get tenant UUID and topology lookups
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),

substations_lookup AS (
  SELECT s.id, s.code, s.name
  FROM tx_substations s
  INNER JOIN tenant t ON s.org_id = t.id
),

feeders_lookup AS (
  SELECT f.id, f.feeder_code, f.name, f.substation_id, s.code as substation_code
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  INNER JOIN tenant t ON s.org_id = t.id
),

transformers_lookup AS (
  SELECT tr.id, tr.transformer_code, tr.name, tr.substation_id, s.code as substation_code
  FROM tx_transformers tr
  INNER JOIN tx_substations s ON tr.substation_id = s.id
  INNER JOIN tenant t ON s.org_id = t.id
),

bays_lookup AS (
  SELECT b.id, b.bay_code, b.name, b.substation_id, s.code as substation_code
  FROM tx_bays b
  INNER JOIN tx_substations s ON b.substation_id = s.id
  INNER JOIN tenant t ON s.org_id = t.id
),

-- 2) Upsert energy meters with topology bindings
upsert_meters AS (
  INSERT INTO energy_meters (
    org_id, name, meter_code, status, energy_types, meter_role,
    substation_id, feeder_id, bay_id, transformer_id,
    meter_type, scope, location, active
  )
  SELECT 
    tenant.id,
    v.name,
    v.meter_code,
    v.status::meter_status_type,
    v.energy_types::energy_type[],
    v.meter_role::meter_role_type,
    CASE WHEN v.substation_code IS NOT NULL THEN sub.id ELSE NULL END,
    CASE WHEN v.feeder_code IS NOT NULL THEN fdr.id ELSE NULL END,
    CASE WHEN v.bay_code IS NOT NULL THEN bay.id ELSE NULL END,
    CASE WHEN v.transformer_code IS NOT NULL THEN tr.id ELSE NULL END,
    v.meter_type,
    v.scope,
    v.location,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- Grid incomer meters (require substation_id)
    ('Dubai Main Grid Incomer', 'MTR-DXB-MAIN-IN', 'Normal', ARRAY['electricity'], 'grid_incomer', 'SS-DXB-MAIN', NULL, NULL, NULL, 'main', 'substation', 'Dubai Main Substation - Incomer Bay', true),
    ('Jebel Ali Grid Incomer', 'MTR-JA-MAIN-IN', 'Normal', ARRAY['electricity'], 'grid_incomer', 'SS-JA-MAIN', NULL, NULL, NULL, 'main', 'substation', 'Jebel Ali Main Substation - Incomer Bay', true),
    ('Al Aweer Grid Incomer', 'MTR-AW-MAIN-IN', 'Normal', ARRAY['electricity'], 'grid_incomer', 'SS-AW-MAIN', NULL, NULL, NULL, 'main', 'substation', 'Al Aweer Main Substation - Incomer Bay', true),
    
    -- Feeder outgoing meters (require feeder_id)
    ('Dubai Main Feeder OUT-01', 'MTR-DXB-FDR-OUT-01', 'Normal', ARRAY['electricity'], 'feeder_outgoing', 'SS-DXB-MAIN', 'FDR-OUT-01', NULL, NULL, 'main', 'feeder', 'Dubai Main - Outgoing Feeder 1', true),
    ('Dubai Main Feeder OUT-02', 'MTR-DXB-FDR-OUT-02', 'Normal', ARRAY['electricity'], 'feeder_outgoing', 'SS-DXB-MAIN', 'FDR-OUT-02', NULL, NULL, 'main', 'feeder', 'Dubai Main - Outgoing Feeder 2', true),
    ('Jebel Ali Feeder OUT-01', 'MTR-JA-FDR-OUT-01', 'Normal', ARRAY['electricity'], 'feeder_outgoing', 'SS-JA-MAIN', 'FDR-OUT-01', NULL, NULL, 'main', 'feeder', 'Jebel Ali - Outgoing Feeder 1', true),
    ('Al Aweer Feeder OUT-01', 'MTR-AW-FDR-OUT-01', 'High', ARRAY['electricity'], 'feeder_outgoing', 'SS-AW-MAIN', 'FDR-OUT-01', NULL, NULL, 'main', 'feeder', 'Al Aweer - Outgoing Feeder 1', true),
    ('Al Aweer Feeder OUT-02', 'MTR-AW-FDR-OUT-02', 'Normal', ARRAY['electricity'], 'feeder_outgoing', 'SS-AW-MAIN', 'FDR-OUT-02', NULL, NULL, 'main', 'feeder', 'Al Aweer - Outgoing Feeder 2', true),
    ('Dubai South Feeder OUT-01', 'MTR-DXB-S-FDR-OUT-01', 'Normal', ARRAY['electricity'], 'feeder_outgoing', 'SS-DXB-SOUTH', 'FDR-OUT-01', NULL, NULL, 'main', 'feeder', 'Dubai South - Outgoing Feeder 1', true),
    
    -- Transformer LV meters (require transformer_id)
    ('Dubai Main T1 LV Side', 'MTR-DXB-T1-LV', 'Normal', ARRAY['electricity'], 'transformer_lv', 'SS-DXB-MAIN', NULL, NULL, 'T1', 'main', 'transformer', 'Dubai Main - Transformer T1 Low Voltage', true),
    ('Dubai Main T2 LV Side', 'MTR-DXB-T2-LV', 'Normal', ARRAY['electricity'], 'transformer_lv', 'SS-DXB-MAIN', NULL, NULL, 'T2', 'main', 'transformer', 'Dubai Main - Transformer T2 Low Voltage', true),
    ('Jebel Ali T1 LV Side', 'MTR-JA-T1-LV', 'Normal', ARRAY['electricity'], 'transformer_lv', 'SS-JA-MAIN', NULL, NULL, 'T1', 'main', 'transformer', 'Jebel Ali - Transformer T1 Low Voltage', true),
    
    -- Station service meters (require substation_id)
    ('Dubai Main Station Service', 'MTR-DXB-MAIN-SS', 'Normal', ARRAY['electricity'], 'station_service', 'SS-DXB-MAIN', NULL, NULL, NULL, 'main', 'substation', 'Dubai Main - Station Service Load', true),
    ('Jebel Ali Station Service', 'MTR-JA-MAIN-SS', 'Normal', ARRAY['electricity'], 'station_service', 'SS-JA-MAIN', NULL, NULL, NULL, 'main', 'substation', 'Jebel Ali - Station Service Load', true),
    
    -- Bay metering (require bay_id)
    ('Dubai Main Bay-01 Meter', 'MTR-DXB-BAY-01', 'Normal', ARRAY['electricity'], 'bay_metering', 'SS-DXB-MAIN', NULL, 'BAY-01', NULL, 'main', 'bay', 'Dubai Main - Line Bay 1', true),
    ('Dubai Main Bay-T1 Meter', 'MTR-DXB-BAY-T1', 'Normal', ARRAY['electricity'], 'bay_metering', 'SS-DXB-MAIN', NULL, 'BAY-T1', NULL, 'main', 'bay', 'Dubai Main - Transformer Bay T1', true)
  ) AS v(
    name, meter_code, status, energy_types, meter_role,
    substation_code, feeder_code, bay_code, transformer_code,
    meter_type, scope, location, active
  )
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  LEFT JOIN feeders_lookup fdr ON fdr.substation_code = v.substation_code AND fdr.feeder_code = v.feeder_code
  LEFT JOIN bays_lookup bay ON bay.substation_code = v.substation_code AND bay.bay_code = v.bay_code
  LEFT JOIN transformers_lookup tr ON tr.substation_code = v.substation_code AND tr.transformer_code = v.transformer_code
  ON CONFLICT (org_id, meter_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    energy_types = EXCLUDED.energy_types,
    meter_role = EXCLUDED.meter_role,
    substation_id = EXCLUDED.substation_id,
    feeder_id = EXCLUDED.feeder_id,
    bay_id = EXCLUDED.bay_id,
    transformer_id = EXCLUDED.transformer_id,
    meter_type = EXCLUDED.meter_type,
    scope = EXCLUDED.scope,
    location = EXCLUDED.location,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, meter_code, name
),

-- 3) Lookup meters for telemetry and other data (use upserted meters)
meters_lookup AS (
  SELECT id, meter_code, name FROM upsert_meters
  UNION ALL
  SELECT m.id, m.meter_code, m.name
  FROM energy_meters m
  INNER JOIN tenant t ON m.org_id = t.id
  WHERE m.meter_code IN (
    'MTR-DXB-MAIN-IN', 'MTR-JA-MAIN-IN', 'MTR-AW-MAIN-IN',
    'MTR-DXB-FDR-OUT-01', 'MTR-DXB-FDR-OUT-02', 'MTR-JA-FDR-OUT-01',
    'MTR-AW-FDR-OUT-01', 'MTR-AW-FDR-OUT-02', 'MTR-DXB-S-FDR-OUT-01',
    'MTR-DXB-T1-LV', 'MTR-DXB-T2-LV', 'MTR-JA-T1-LV',
    'MTR-DXB-MAIN-SS', 'MTR-JA-MAIN-SS',
    'MTR-DXB-BAY-01', 'MTR-DXB-BAY-T1'
  )
  AND NOT EXISTS (SELECT 1 FROM upsert_meters um WHERE um.meter_code = m.meter_code)
),

-- 4) Upsert power quality limits for voltage levels
upsert_pq_limits AS (
  INSERT INTO tx_power_quality_limits (
    org_id, voltage_level_kv, limit_type, severity,
    min_value, max_value, duration_threshold_ms,
    standard_reference, description, active
  )
  SELECT 
    tenant.id,
    v.voltage_level_kv,
    v.limit_type,
    v.severity,
    v.min_value,
    v.max_value,
    v.duration_threshold_ms,
    v.standard_reference,
    v.description,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- 400kV limits
    (400, 'voltage_sag', 'Low', 0.90, 0.95, 100, 'IEEE 1159', '400kV voltage sag: 90-95% of nominal', true),
    (400, 'voltage_sag', 'Medium', 0.80, 0.90, 100, 'IEEE 1159', '400kV voltage sag: 80-90% of nominal', true),
    (400, 'voltage_sag', 'High', 0.70, 0.80, 100, 'IEEE 1159', '400kV voltage sag: 70-80% of nominal', true),
    (400, 'voltage_sag', 'Critical', 0.00, 0.70, 100, 'IEEE 1159', '400kV voltage sag: below 70% of nominal', true),
    (400, 'voltage_swell', 'Low', 1.05, 1.10, 100, 'IEEE 1159', '400kV voltage swell: 105-110% of nominal', true),
    (400, 'voltage_swell', 'Medium', 1.10, 1.15, 100, 'IEEE 1159', '400kV voltage swell: 110-115% of nominal', true),
    (400, 'voltage_swell', 'High', 1.15, 1.20, 100, 'IEEE 1159', '400kV voltage swell: 115-120% of nominal', true),
    (400, 'voltage_swell', 'Critical', 1.20, 2.00, 100, 'IEEE 1159', '400kV voltage swell: above 120% of nominal', true),
    (400, 'thd_voltage', 'Low', 2.0, 3.0, 1000, 'IEEE 519', '400kV THD voltage: 2-3%', true),
    (400, 'thd_voltage', 'Medium', 3.0, 5.0, 1000, 'IEEE 519', '400kV THD voltage: 3-5%', true),
    (400, 'thd_voltage', 'High', 5.0, 8.0, 1000, 'IEEE 519', '400kV THD voltage: 5-8%', true),
    (400, 'thd_voltage', 'Critical', 8.0, 100.0, 1000, 'IEEE 519', '400kV THD voltage: above 8%', true),
    (400, 'frequency_deviation', 'Low', 49.8, 50.2, 500, 'Grid Code', '400kV frequency: 49.8-50.2 Hz', true),
    (400, 'frequency_deviation', 'Medium', 49.5, 49.8, 500, 'Grid Code', '400kV frequency: 49.5-49.8 Hz or 50.2-50.5 Hz', true),
    (400, 'frequency_deviation', 'High', 49.0, 49.5, 500, 'Grid Code', '400kV frequency: 49.0-49.5 Hz or 50.5-51.0 Hz', true),
    (400, 'frequency_deviation', 'Critical', 47.0, 49.0, 500, 'Grid Code', '400kV frequency: below 49.0 Hz or above 51.0 Hz', true),
    
    -- 220kV limits
    (220, 'voltage_sag', 'Low', 0.90, 0.95, 100, 'IEEE 1159', '220kV voltage sag: 90-95% of nominal', true),
    (220, 'voltage_sag', 'Medium', 0.80, 0.90, 100, 'IEEE 1159', '220kV voltage sag: 80-90% of nominal', true),
    (220, 'voltage_sag', 'High', 0.70, 0.80, 100, 'IEEE 1159', '220kV voltage sag: 70-80% of nominal', true),
    (220, 'voltage_sag', 'Critical', 0.00, 0.70, 100, 'IEEE 1159', '220kV voltage sag: below 70% of nominal', true),
    (220, 'voltage_swell', 'Low', 1.05, 1.10, 100, 'IEEE 1159', '220kV voltage swell: 105-110% of nominal', true),
    (220, 'voltage_swell', 'Medium', 1.10, 1.15, 100, 'IEEE 1159', '220kV voltage swell: 110-115% of nominal', true),
    (220, 'voltage_swell', 'High', 1.15, 1.20, 100, 'IEEE 1159', '220kV voltage swell: 115-120% of nominal', true),
    (220, 'voltage_swell', 'Critical', 1.20, 2.00, 100, 'IEEE 1159', '220kV voltage swell: above 120% of nominal', true),
    (220, 'thd_voltage', 'Low', 2.0, 3.0, 1000, 'IEEE 519', '220kV THD voltage: 2-3%', true),
    (220, 'thd_voltage', 'Medium', 3.0, 5.0, 1000, 'IEEE 519', '220kV THD voltage: 3-5%', true),
    (220, 'thd_voltage', 'High', 5.0, 8.0, 1000, 'IEEE 519', '220kV THD voltage: 5-8%', true),
    (220, 'thd_voltage', 'Critical', 8.0, 100.0, 1000, 'IEEE 519', '220kV THD voltage: above 8%', true),
    
    -- 132kV limits
    (132, 'voltage_sag', 'Low', 0.90, 0.95, 100, 'IEEE 1159', '132kV voltage sag: 90-95% of nominal', true),
    (132, 'voltage_sag', 'Medium', 0.80, 0.90, 100, 'IEEE 1159', '132kV voltage sag: 80-90% of nominal', true),
    (132, 'voltage_sag', 'High', 0.70, 0.80, 100, 'IEEE 1159', '132kV voltage sag: 70-80% of nominal', true),
    (132, 'voltage_sag', 'Critical', 0.00, 0.70, 100, 'IEEE 1159', '132kV voltage sag: below 70% of nominal', true),
    (132, 'voltage_swell', 'Low', 1.05, 1.10, 100, 'IEEE 1159', '132kV voltage swell: 105-110% of nominal', true),
    (132, 'voltage_swell', 'Medium', 1.10, 1.15, 100, 'IEEE 1159', '132kV voltage swell: 110-115% of nominal', true),
    (132, 'voltage_swell', 'High', 1.15, 1.20, 100, 'IEEE 1159', '132kV voltage swell: 115-120% of nominal', true),
    (132, 'voltage_swell', 'Critical', 1.20, 2.00, 100, 'IEEE 1159', '132kV voltage swell: above 120% of nominal', true),
    (132, 'thd_voltage', 'Low', 2.5, 4.0, 1000, 'IEEE 519', '132kV THD voltage: 2.5-4%', true),
    (132, 'thd_voltage', 'Medium', 4.0, 6.0, 1000, 'IEEE 519', '132kV THD voltage: 4-6%', true),
    (132, 'thd_voltage', 'High', 6.0, 8.0, 1000, 'IEEE 519', '132kV THD voltage: 6-8%', true),
    (132, 'thd_voltage', 'Critical', 8.0, 100.0, 1000, 'IEEE 519', '132kV THD voltage: above 8%', true),
    (132, 'power_factor', 'Low', 0.85, 0.90, 5000, 'Grid Code', '132kV power factor: 0.85-0.90', true),
    (132, 'power_factor', 'Medium', 0.80, 0.85, 5000, 'Grid Code', '132kV power factor: 0.80-0.85', true),
    (132, 'power_factor', 'High', 0.70, 0.80, 5000, 'Grid Code', '132kV power factor: 0.70-0.80', true),
    (132, 'power_factor', 'Critical', 0.00, 0.70, 5000, 'Grid Code', '132kV power factor: below 0.70', true)
  ) AS v(
    voltage_level_kv, limit_type, severity,
    min_value, max_value, duration_threshold_ms,
    standard_reference, description, active
  )
  ON CONFLICT (org_id, voltage_level_kv, limit_type, severity)
  DO UPDATE SET
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    duration_threshold_ms = EXCLUDED.duration_threshold_ms,
    standard_reference = EXCLUDED.standard_reference,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, voltage_level_kv, limit_type, severity
),

-- 5) Upsert energy baselines for key meters
upsert_baselines AS (
  INSERT INTO energy_baselines (
    meter_id, baseline_name, baseline_type,
    baseline_period_start, baseline_period_end,
    baseline_value, baseline_unit,
    baseline_kwh_per_mwh_delivered, baseline_kwh_per_mw_peak,
    baseline_method, confidence_level, active
  )
  SELECT 
    m.id,
    v.baseline_name,
    v.baseline_type,
    v.baseline_period_start,
    v.baseline_period_end,
    v.baseline_value,
    v.baseline_unit,
    v.baseline_kwh_per_mwh_delivered,
    v.baseline_kwh_per_mw_peak,
    v.baseline_method,
    v.confidence_level,
    v.active
  FROM meters_lookup m
  CROSS JOIN (VALUES
    -- Grid incomer baselines
    ('MTR-DXB-MAIN-IN', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 85000.0, 'kWh/day', 2.5, 180.0, 'regression', 0.95, true),
    ('MTR-JA-MAIN-IN', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 95000.0, 'kWh/day', 2.3, 175.0, 'regression', 0.93, true),
    ('MTR-AW-MAIN-IN', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 65000.0, 'kWh/day', 2.8, 190.0, 'seasonal', 0.90, true),
    
    -- Feeder baselines
    ('MTR-DXB-FDR-OUT-01', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 28000.0, 'kWh/day', NULL, NULL, 'regression', 0.92, true),
    ('MTR-DXB-FDR-OUT-02', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 26000.0, 'kWh/day', NULL, NULL, 'regression', 0.91, true),
    ('MTR-JA-FDR-OUT-01', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 42000.0, 'kWh/day', NULL, NULL, 'seasonal', 0.89, true),
    ('MTR-AW-FDR-OUT-01', 'Q4 2024 Baseline', 'historical', '2024-10-01'::DATE, '2024-12-31'::DATE, 22000.0, 'kWh/day', NULL, NULL, 'rolling', 0.88, true),
    
    -- Transformer baselines
    ('MTR-DXB-T1-LV', 'Q4 2024 Baseline', 'engineered', '2024-10-01'::DATE, '2024-12-31'::DATE, 42000.0, 'kWh/day', NULL, NULL, 'regression', 0.94, true),
    ('MTR-DXB-T2-LV', 'Q4 2024 Baseline', 'engineered', '2024-10-01'::DATE, '2024-12-31'::DATE, 41000.0, 'kWh/day', NULL, NULL, 'regression', 0.93, true)
  ) AS v(
    meter_code, baseline_name, baseline_type,
    baseline_period_start, baseline_period_end,
    baseline_value, baseline_unit,
    baseline_kwh_per_mwh_delivered, baseline_kwh_per_mw_peak,
    baseline_method, confidence_level, active
  )
  WHERE m.meter_code = v.meter_code
  RETURNING id, meter_id
),

-- 6) Insert power quality events (some resolved, some unresolved)
upsert_pq_events AS (
  INSERT INTO power_quality_events (
    meter_id, event_type, timestamp, duration_ms, magnitude,
    severity, description, resolved, resolved_at, resolution_notes
  )
  SELECT 
    m.id,
    v.event_type,
    v.timestamp,
    v.duration_ms,
    v.magnitude,
    v.severity,
    v.description,
    v.resolved,
    v.resolved_at,
    v.resolution_notes
  FROM meters_lookup m
  CROSS JOIN (VALUES
    -- Resolved events
    ('MTR-DXB-MAIN-IN', 'voltage_sag', (now() - interval '25 days')::TIMESTAMPTZ, 150, 0.88, 'Medium', 'Voltage sag detected during grid switching', true, (now() - interval '24 days')::TIMESTAMPTZ, 'Confirmed as planned switching operation'),
    ('MTR-JA-MAIN-IN', 'thd_high', (now() - interval '20 days')::TIMESTAMPTZ, 5000, 6.2, 'High', 'High THD detected on incomer', true, (now() - interval '19 days')::TIMESTAMPTZ, 'Harmonic filter installed and THD reduced'),
    ('MTR-AW-MAIN-IN', 'frequency_deviation', (now() - interval '15 days')::TIMESTAMPTZ, 800, 49.7, 'Medium', 'Frequency deviation during load shedding', true, (now() - interval '15 days')::TIMESTAMPTZ, 'Grid frequency stabilized after load shedding'),
    ('MTR-DXB-FDR-OUT-01', 'voltage_swell', (now() - interval '12 days')::TIMESTAMPTZ, 200, 1.08, 'Low', 'Minor voltage swell on feeder', true, (now() - interval '11 days')::TIMESTAMPTZ, 'Tap changer adjusted'),
    ('MTR-DXB-T1-LV', 'pf_low', (now() - interval '10 days')::TIMESTAMPTZ, 15000, 0.82, 'Medium', 'Low power factor on transformer LV side', true, (now() - interval '9 days')::TIMESTAMPTZ, 'Capacitor bank switched in'),
    
    -- Unresolved events (recent)
    ('MTR-AW-FDR-OUT-01', 'voltage_sag', (now() - interval '3 days')::TIMESTAMPTZ, 180, 0.85, 'Medium', 'Voltage sag on Al Aweer feeder - under investigation', false, NULL, NULL),
    ('MTR-JA-FDR-OUT-01', 'thd_high', (now() - interval '2 days')::TIMESTAMPTZ, 8000, 5.8, 'Medium', 'Elevated THD on Jebel Ali feeder', false, NULL, NULL),
    ('MTR-DXB-MAIN-IN', 'frequency_deviation', (now() - interval '1 day')::TIMESTAMPTZ, 600, 49.85, 'Low', 'Minor frequency deviation', false, NULL, NULL),
    ('MTR-DXB-FDR-OUT-02', 'voltage_sag', (now() - interval '6 hours')::TIMESTAMPTZ, 120, 0.92, 'Low', 'Brief voltage sag - monitoring', false, NULL, NULL),
    ('MTR-JA-MAIN-IN', 'voltage_swell', (now() - interval '2 hours')::TIMESTAMPTZ, 250, 1.12, 'Medium', 'Voltage swell on Jebel Ali incomer - requires attention', false, NULL, NULL)
  ) AS v(
    meter_code, event_type, timestamp, duration_ms, magnitude,
    severity, description, resolved, resolved_at, resolution_notes
  )
  WHERE m.meter_code = v.meter_code
  ON CONFLICT DO NOTHING
  RETURNING id, meter_id, event_type
),

-- 7) Insert submeters with parent-child relationships
upsert_submeters AS (
  INSERT INTO submeters (
    parent_meter_id, submeter_id, allocation_percentage, active
  )
  SELECT 
    parent.id,
    child.id,
    v.allocation_percentage,
    v.active
  FROM (VALUES
    -- Dubai Main grid incomer has feeder outgoing meters as submeters
    ('MTR-DXB-MAIN-IN', 'MTR-DXB-FDR-OUT-01', 35.0, true),
    ('MTR-DXB-MAIN-IN', 'MTR-DXB-FDR-OUT-02', 32.0, true),
    ('MTR-DXB-MAIN-IN', 'MTR-DXB-MAIN-SS', 3.0, true),
    
    -- Jebel Ali grid incomer has feeder outgoing meters as submeters
    ('MTR-JA-MAIN-IN', 'MTR-JA-FDR-OUT-01', 45.0, true),
    ('MTR-JA-MAIN-IN', 'MTR-JA-MAIN-SS', 2.5, true),
    
    -- Al Aweer grid incomer has feeder outgoing meters as submeters
    ('MTR-AW-MAIN-IN', 'MTR-AW-FDR-OUT-01', 38.0, true),
    ('MTR-AW-MAIN-IN', 'MTR-AW-FDR-OUT-02', 36.0, true)
  ) AS v(parent_code, child_code, allocation_percentage, active)
  INNER JOIN meters_lookup parent ON parent.meter_code = v.parent_code
  INNER JOIN meters_lookup child ON child.meter_code = v.child_code
  ON CONFLICT (submeter_id)
  DO UPDATE SET
    parent_meter_id = EXCLUDED.parent_meter_id,
    allocation_percentage = EXCLUDED.allocation_percentage,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, parent_meter_id, submeter_id
)

-- Return counts for verification
SELECT 
  (SELECT COUNT(*) FROM upsert_meters) as meters_count,
  (SELECT COUNT(*) FROM upsert_pq_limits) as pq_limits_count,
  (SELECT COUNT(*) FROM upsert_baselines) as baselines_count,
  (SELECT COUNT(*) FROM upsert_pq_events) as pq_events_count,
  (SELECT COUNT(*) FROM upsert_submeters) as submeters_count;


-- ============================================================================
-- GENERATE TELEMETRY DATA FOR LAST 30 DAYS
-- This is done outside the main CTE to avoid complexity
-- ============================================================================

-- Generate hourly telemetry data for the last 30 days for all meters
DO $$
DECLARE
  v_meter RECORD;
  v_timestamp TIMESTAMPTZ;
  v_day_offset INTEGER;
  v_hour INTEGER;
  v_base_kw DECIMAL;
  v_kw DECIMAL;
  v_kwh DECIMAL;
  v_voltage DECIMAL;
  v_pf DECIMAL;
  v_thd DECIMAL;
BEGIN
  -- Loop through each meter
  FOR v_meter IN 
    SELECT m.id, m.meter_code, m.meter_role
    FROM energy_meters m
    INNER JOIN tenants t ON m.org_id = t.id
    WHERE t.name = 'DEWA - Transmission'
      AND m.meter_code IN (
        'MTR-DXB-MAIN-IN', 'MTR-JA-MAIN-IN', 'MTR-AW-MAIN-IN',
        'MTR-DXB-FDR-OUT-01', 'MTR-DXB-FDR-OUT-02', 'MTR-JA-FDR-OUT-01',
        'MTR-AW-FDR-OUT-01', 'MTR-AW-FDR-OUT-02', 'MTR-DXB-S-FDR-OUT-01',
        'MTR-DXB-T1-LV', 'MTR-DXB-T2-LV', 'MTR-JA-T1-LV'
      )
  LOOP
    -- Set base kW based on meter type
    CASE v_meter.meter_code
      WHEN 'MTR-DXB-MAIN-IN' THEN v_base_kw := 3500.0;
      WHEN 'MTR-JA-MAIN-IN' THEN v_base_kw := 4000.0;
      WHEN 'MTR-AW-MAIN-IN' THEN v_base_kw := 2800.0;
      WHEN 'MTR-DXB-FDR-OUT-01' THEN v_base_kw := 1200.0;
      WHEN 'MTR-DXB-FDR-OUT-02' THEN v_base_kw := 1100.0;
      WHEN 'MTR-JA-FDR-OUT-01' THEN v_base_kw := 1800.0;
      WHEN 'MTR-AW-FDR-OUT-01' THEN v_base_kw := 950.0;
      WHEN 'MTR-AW-FDR-OUT-02' THEN v_base_kw := 920.0;
      WHEN 'MTR-DXB-S-FDR-OUT-01' THEN v_base_kw := 680.0;
      WHEN 'MTR-DXB-T1-LV' THEN v_base_kw := 1750.0;
      WHEN 'MTR-DXB-T2-LV' THEN v_base_kw := 1700.0;
      WHEN 'MTR-JA-T1-LV' THEN v_base_kw := 2500.0;
      ELSE v_base_kw := 500.0;
    END CASE;
    
    -- Generate data for last 30 days
    FOR v_day_offset IN 0..29 LOOP
      FOR v_hour IN 0..23 LOOP
        v_timestamp := (now() - (v_day_offset || ' days')::INTERVAL + (v_hour || ' hours')::INTERVAL);
        
        -- Add daily and hourly variation
        -- Peak hours: 10-14 and 18-22 (higher load)
        -- Off-peak hours: 0-6 (lower load)
        IF v_hour BETWEEN 10 AND 14 OR v_hour BETWEEN 18 AND 22 THEN
          v_kw := v_base_kw * (1.0 + random() * 0.15);  -- Peak: +0-15%
        ELSIF v_hour BETWEEN 0 AND 6 THEN
          v_kw := v_base_kw * (0.6 + random() * 0.1);   -- Off-peak: 60-70%
        ELSE
          v_kw := v_base_kw * (0.85 + random() * 0.15); -- Normal: 85-100%
        END IF;
        
        -- Calculate kWh (energy over 1 hour)
        v_kwh := v_kw * 1.0;
        
        -- Voltage varies slightly around nominal (400kV, 220kV, or 132kV)
        CASE 
          WHEN v_meter.meter_role IN ('grid_incomer', 'feeder_outgoing') THEN
            v_voltage := 132000.0 * (0.98 + random() * 0.04);  -- ±2% variation
          ELSE
            v_voltage := 400.0 * (0.98 + random() * 0.04);
        END CASE;
        
        -- Power factor: typically 0.90-0.98
        v_pf := 0.90 + random() * 0.08;
        
        -- THD: typically 1-4%, occasionally higher
        v_thd := 1.0 + random() * 3.0;
        
        -- Insert telemetry record
        INSERT INTO energy_telemetry (
          meter_id, timestamp, kw, kwh, voltage_v, power_factor, thd_pct
        )
        VALUES (
          v_meter.id, v_timestamp, v_kw, v_kwh, v_voltage, v_pf, v_thd
        )
        ON CONFLICT (meter_id, timestamp) DO NOTHING;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generated telemetry for meter: %', v_meter.meter_code;
  END LOOP;
END $$;


-- ============================================================================
-- POST-SEED VALIDATION (POSTCHECKS)
-- Fail loudly if expected counts are not met or integrity is violated
-- ============================================================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_meter_count INTEGER;
  v_pq_limits_count INTEGER;
  v_baseline_count INTEGER;
  v_pq_event_count INTEGER;
  v_submeter_count INTEGER;
  v_telemetry_count INTEGER;
  v_orphan_meters INTEGER;
  v_orphan_submeters INTEGER;
  v_invalid_meter_roles INTEGER;
  v_baseline_overlaps INTEGER;
  v_unresolved_pq_count INTEGER;
  v_resolved_pq_count INTEGER;
  v_meters_with_telemetry INTEGER;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  -- Check row counts
  SELECT COUNT(*) INTO v_meter_count
  FROM energy_meters WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_pq_limits_count
  FROM tx_power_quality_limits WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_baseline_count
  FROM energy_baselines b
  INNER JOIN energy_meters m ON b.meter_id = m.id
  WHERE m.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_pq_event_count
  FROM power_quality_events pq
  INNER JOIN energy_meters m ON pq.meter_id = m.id
  WHERE m.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_submeter_count
  FROM submeters s
  INNER JOIN energy_meters m ON s.parent_meter_id = m.id
  WHERE m.org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_telemetry_count
  FROM energy_telemetry t
  INNER JOIN energy_meters m ON t.meter_id = m.id
  WHERE m.org_id = v_tenant_id;
  
  -- Validate expected counts
  IF v_meter_count < 16 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 16 meters, found %', v_meter_count;
  END IF;
  
  IF v_pq_limits_count < 40 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 40 PQ limits (3 voltage levels × multiple types), found %', v_pq_limits_count;
  END IF;
  
  IF v_baseline_count < 9 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 9 baselines, found %', v_baseline_count;
  END IF;
  
  IF v_pq_event_count < 10 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 10 PQ events, found %', v_pq_event_count;
  END IF;
  
  IF v_submeter_count < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 7 submeter relationships, found %', v_submeter_count;
  END IF;
  
  IF v_telemetry_count < 8000 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 8000 telemetry records (12 meters × 30 days × 24 hours), found %', v_telemetry_count;
  END IF;
  
  -- Check FK integrity (orphaned records)
  SELECT COUNT(*) INTO v_orphan_meters
  FROM energy_meters m
  WHERE m.org_id = v_tenant_id
    AND (
      (m.substation_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = m.substation_id))
      OR (m.feeder_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tx_feeders f WHERE f.id = m.feeder_id))
      OR (m.bay_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tx_bays b WHERE b.id = m.bay_id))
      OR (m.transformer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tx_transformers t WHERE t.id = m.transformer_id))
    );
  
  IF v_orphan_meters > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % meters with invalid topology references', v_orphan_meters;
  END IF;
  
  SELECT COUNT(*) INTO v_orphan_submeters
  FROM submeters s
  WHERE NOT EXISTS (SELECT 1 FROM energy_meters m WHERE m.id = s.parent_meter_id)
     OR NOT EXISTS (SELECT 1 FROM energy_meters m WHERE m.id = s.submeter_id);
  
  IF v_orphan_submeters > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % submeters with invalid meter references', v_orphan_submeters;
  END IF;
  
  -- Check business rules: meter role topology requirements
  SELECT COUNT(*) INTO v_invalid_meter_roles
  FROM energy_meters m
  WHERE m.org_id = v_tenant_id
    AND (
      (m.meter_role = 'grid_incomer' AND m.substation_id IS NULL)
      OR (m.meter_role = 'feeder_outgoing' AND m.feeder_id IS NULL)
      OR (m.meter_role = 'transformer_lv' AND m.transformer_id IS NULL)
      OR (m.meter_role = 'station_service' AND m.substation_id IS NULL)
      OR (m.meter_role = 'bay_metering' AND m.bay_id IS NULL)
    );
  
  IF v_invalid_meter_roles > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % meters with invalid role-topology combinations', v_invalid_meter_roles;
  END IF;
  
  -- Check baseline overlaps (should be prevented by exclusion constraint)
  SELECT COUNT(*) INTO v_baseline_overlaps
  FROM energy_baselines b1
  INNER JOIN energy_baselines b2 ON b1.meter_id = b2.meter_id AND b1.id != b2.id
  INNER JOIN energy_meters m ON b1.meter_id = m.id
  WHERE m.org_id = v_tenant_id
    AND b1.active = true
    AND b2.active = true
    AND daterange(b1.baseline_period_start, b1.baseline_period_end, '[]') 
        && daterange(b2.baseline_period_start, b2.baseline_period_end, '[]');
  
  IF v_baseline_overlaps > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % overlapping baseline periods', v_baseline_overlaps;
  END IF;
  
  -- Check PQ event resolution consistency
  SELECT COUNT(*) INTO v_unresolved_pq_count
  FROM power_quality_events pq
  INNER JOIN energy_meters m ON pq.meter_id = m.id
  WHERE m.org_id = v_tenant_id
    AND pq.resolved = false;
  
  SELECT COUNT(*) INTO v_resolved_pq_count
  FROM power_quality_events pq
  INNER JOIN energy_meters m ON pq.meter_id = m.id
  WHERE m.org_id = v_tenant_id
    AND pq.resolved = true;
  
  IF v_unresolved_pq_count < 3 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 3 unresolved PQ events, found %', v_unresolved_pq_count;
  END IF;
  
  IF v_resolved_pq_count < 3 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 3 resolved PQ events, found %', v_resolved_pq_count;
  END IF;
  
  -- Check that all meters have telemetry data
  SELECT COUNT(DISTINCT m.id) INTO v_meters_with_telemetry
  FROM energy_meters m
  INNER JOIN energy_telemetry t ON m.id = t.meter_id
  WHERE m.org_id = v_tenant_id
    AND m.meter_code IN (
      'MTR-DXB-MAIN-IN', 'MTR-JA-MAIN-IN', 'MTR-AW-MAIN-IN',
      'MTR-DXB-FDR-OUT-01', 'MTR-DXB-FDR-OUT-02', 'MTR-JA-FDR-OUT-01',
      'MTR-AW-FDR-OUT-01', 'MTR-AW-FDR-OUT-02', 'MTR-DXB-S-FDR-OUT-01',
      'MTR-DXB-T1-LV', 'MTR-DXB-T2-LV', 'MTR-JA-T1-LV'
    );
  
  IF v_meters_with_telemetry < 12 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected 12 meters with telemetry, found %', v_meters_with_telemetry;
  END IF;
  
  RAISE NOTICE 'Seed 008_energy_monitoring_tx.sql OK: meters=%, pq_limits=%, baselines=%, pq_events=%, submeters=%, telemetry=%', 
    v_meter_count, v_pq_limits_count, v_baseline_count, v_pq_event_count, v_submeter_count, v_telemetry_count;
END $$;

COMMIT;

