-- Seed data for EMS Power Transmission - Analytics Extensions
-- Creates KPI snapshots, benchmarks, demand windows, recommendations, and anomalies
-- Uses simple INSERT statements with subqueries
-- Requirements: 9.1, 9.4, 10.2, 11.1

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_meter_count INTEGER;
  v_substation_count INTEGER;
  v_telemetry_count INTEGER;
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
  
  -- Verify meters and topology exist
  SELECT COUNT(*) INTO v_meter_count
  FROM energy_meters m
  INNER JOIN tenants t ON m.org_id = t.id
  WHERE t.name = 'DEWA - Transmission';
  
  IF v_meter_count < 16 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 16 meters, found %. Run 008_energy_monitoring_tx.sql first.', v_meter_count;
  END IF;
  
  SELECT COUNT(*) INTO v_substation_count
  FROM tx_substations s
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission';
  
  IF v_substation_count < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 5 substations, found %. Run 007_energy_tx_foundation.sql first.', v_substation_count;
  END IF;
  
  -- Verify telemetry data exists for KPI calculations
  SELECT COUNT(*) INTO v_telemetry_count
  FROM energy_telemetry t
  INNER JOIN energy_meters m ON t.meter_id = m.id
  INNER JOIN tenants tn ON m.org_id = tn.id
  WHERE tn.name = 'DEWA - Transmission'
    AND t.timestamp >= (now() - interval '7 days');
  
  IF v_telemetry_count < 1000 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 1000 recent telemetry records for KPI calculations, found %. Run 008_energy_monitoring_tx.sql first.', v_telemetry_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant, meters, topology, and telemetry data exist';
END $$;

-- ============================================================================
-- INSERT KPI SNAPSHOTS
-- ============================================================================

-- Insert organizational KPIs
INSERT INTO energy_kpi_snapshots (
  org_id, kpi_code, scope_type, scope_id,
  period_start, period_end, period_grain,
  value, unit, target_value, baseline_value,
  calculation_method, data_quality_score, metadata
)
SELECT 
  t.id,
  v.kpi_code,
  v.scope_type,
  t.id, -- org scope uses tenant id
  v.period_start,
  v.period_end,
  v.period_grain,
  v.value,
  v.unit,
  v.target_value,
  v.baseline_value,
  v.calculation_method,
  v.data_quality_score,
  v.metadata::JSONB
FROM tenants t
CROSS JOIN (VALUES
  ('losses_pct', 'org', (date_trunc('month', now()) - interval '1 month')::DATE, date_trunc('month', now())::DATE, 'month', 2.8, '%', 2.5, 3.2, 'weighted_avg', 0.95, '{"contributing_substations": 5, "total_mwh_delivered": 125000}'),
  ('avg_load_factor', 'org', (date_trunc('month', now()) - interval '1 month')::DATE, date_trunc('month', now())::DATE, 'month', 0.72, 'ratio', 0.75, 0.68, 'weighted_avg', 0.93, '{"peak_mw": 580, "avg_mw": 418}'),
  ('kwh_per_mwh_delivered', 'org', (date_trunc('month', now()) - interval '1 month')::DATE, date_trunc('month', now())::DATE, 'month', 2.4, 'kWh/MWh', 2.2, 2.6, 'sum', 0.94, '{"total_consumption_kwh": 300000, "total_delivered_mwh": 125000}')
) AS v(kpi_code, scope_type, period_start, period_end, period_grain, value, unit, target_value, baseline_value, calculation_method, data_quality_score, metadata)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
ON CONFLICT (kpi_code, scope_type, scope_id, period_start, period_grain) DO NOTHING;
-- Insert substation KPIs
INSERT INTO energy_kpi_snapshots (
  org_id, kpi_code, scope_type, scope_id,
  period_start, period_end, period_grain,
  value, unit, target_value, baseline_value,
  calculation_method, data_quality_score, metadata
)
SELECT 
  t.id,
  v.kpi_code,
  'substation',
  s.id,
  v.period_start,
  v.period_end,
  v.period_grain,
  v.value,
  v.unit,
  v.target_value,
  v.baseline_value,
  v.calculation_method,
  v.data_quality_score,
  v.metadata::JSONB
FROM tenants t
INNER JOIN tx_substations s ON s.org_id = t.id
CROSS JOIN (VALUES
  ('SS-DXB-MAIN', 'losses_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 2.5, '%', 2.0, 2.8, 'formula', 0.96, '{"incomer_mwh": 2040, "outgoing_mwh": 1989}'),
  ('SS-JA-MAIN', 'losses_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 2.2, '%', 2.0, 2.5, 'formula', 0.97, '{"incomer_mwh": 2280, "outgoing_mwh": 2230}'),
  ('SS-AW-MAIN', 'losses_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 3.1, '%', 2.5, 3.0, 'formula', 0.94, '{"incomer_mwh": 1560, "outgoing_mwh": 1512}'),
  ('SS-DXB-SOUTH', 'losses_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 1.8, '%', 2.0, 2.2, 'formula', 0.92, '{"incomer_mwh": 408, "outgoing_mwh": 401}'),
  ('SS-DXB-MAIN', 'load_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.74, 'ratio', 0.75, 0.70, 'formula', 0.98, '{"peak_mw": 115, "avg_mw": 85}'),
  ('SS-JA-MAIN', 'load_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.68, 'ratio', 0.75, 0.65, 'formula', 0.97, '{"peak_mw": 140, "avg_mw": 95}'),
  ('SS-AW-MAIN', 'load_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.76, 'ratio', 0.75, 0.72, 'formula', 0.95, '{"peak_mw": 85, "avg_mw": 65}')
) AS v(substation_code, kpi_code, period_start, period_end, period_grain, value, unit, target_value, baseline_value, calculation_method, data_quality_score, metadata)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND s.code = v.substation_code
ON CONFLICT (kpi_code, scope_type, scope_id, period_start, period_grain) DO NOTHING;

-- Insert feeder KPIs
INSERT INTO energy_kpi_snapshots (
  org_id, kpi_code, scope_type, scope_id,
  period_start, period_end, period_grain,
  value, unit, target_value, baseline_value,
  calculation_method, data_quality_score, metadata
)
SELECT 
  t.id,
  v.kpi_code,
  'feeder',
  f.id,
  v.period_start,
  v.period_end,
  v.period_grain,
  v.value,
  v.unit,
  v.target_value,
  v.baseline_value,
  v.calculation_method,
  v.data_quality_score,
  v.metadata::JSONB
FROM tenants t
INNER JOIN tx_substations s ON s.org_id = t.id
INNER JOIN tx_feeders f ON f.substation_id = s.id
CROSS JOIN (VALUES
  ('SS-DXB-MAIN', 'FDR-OUT-01', 'utilization_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 68.5, '%', 75.0, 65.0, 'max', 0.99, '{"peak_mw": 102.8, "capacity_mw": 150}'),
  ('SS-DXB-MAIN', 'FDR-OUT-02', 'utilization_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 72.3, '%', 75.0, 70.0, 'max', 0.98, '{"peak_mw": 108.5, "capacity_mw": 150}'),
  ('SS-JA-MAIN', 'FDR-OUT-01', 'utilization_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 81.2, '%', 80.0, 78.0, 'max', 0.97, '{"peak_mw": 162.4, "capacity_mw": 200}'),
  ('SS-AW-MAIN', 'FDR-OUT-01', 'utilization_pct', (now() - interval '1 day')::DATE, now()::DATE, 'day', 85.6, '%', 80.0, 82.0, 'max', 0.96, '{"peak_mw": 85.6, "capacity_mw": 100}'),
  ('SS-DXB-MAIN', 'FDR-OUT-01', 'avg_power_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.94, 'ratio', 0.95, 0.92, 'avg', 0.99, '{"min_pf": 0.89, "max_pf": 0.97}'),
  ('SS-DXB-MAIN', 'FDR-OUT-02', 'avg_power_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.91, 'ratio', 0.95, 0.90, 'avg', 0.98, '{"min_pf": 0.87, "max_pf": 0.95}'),
  ('SS-JA-MAIN', 'FDR-OUT-01', 'avg_power_factor', (now() - interval '1 day')::DATE, now()::DATE, 'day', 0.96, 'ratio', 0.95, 0.94, 'avg', 0.99, '{"min_pf": 0.92, "max_pf": 0.98}')
) AS v(substation_code, feeder_code, kpi_code, period_start, period_end, period_grain, value, unit, target_value, baseline_value, calculation_method, data_quality_score, metadata)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND s.code = v.substation_code
  AND f.feeder_code = v.feeder_code
ON CONFLICT (kpi_code, scope_type, scope_id, period_start, period_grain) DO NOTHING;

-- Insert meter KPIs
INSERT INTO energy_kpi_snapshots (
  org_id, kpi_code, scope_type, scope_id,
  period_start, period_end, period_grain,
  value, unit, target_value, baseline_value,
  calculation_method, data_quality_score, metadata
)
SELECT 
  t.id,
  v.kpi_code,
  'meter',
  m.id,
  v.period_start,
  v.period_end,
  v.period_grain,
  v.value,
  v.unit,
  v.target_value,
  v.baseline_value,
  v.calculation_method,
  v.data_quality_score,
  v.metadata::JSONB
FROM tenants t
INNER JOIN energy_meters m ON m.org_id = t.id
CROSS JOIN (VALUES
  ('MTR-DXB-MAIN-IN', 'daily_kwh', (now() - interval '1 day')::DATE, now()::DATE, 'day', 84000.0, 'kWh', 85000.0, 82000.0, 'sum', 0.99, '{"hours_with_data": 24}'),
  ('MTR-JA-MAIN-IN', 'daily_kwh', (now() - interval '1 day')::DATE, now()::DATE, 'day', 96500.0, 'kWh', 95000.0, 93000.0, 'sum', 0.98, '{"hours_with_data": 24}'),
  ('MTR-AW-MAIN-IN', 'daily_kwh', (now() - interval '1 day')::DATE, now()::DATE, 'day', 67200.0, 'kWh', 65000.0, 64000.0, 'sum', 0.97, '{"hours_with_data": 24}'),
  ('MTR-DXB-MAIN-IN', 'peak_kw', (now() - interval '1 day')::DATE, now()::DATE, 'day', 4125.0, 'kW', 4000.0, 3800.0, 'max', 0.99, '{"peak_hour": 14}'),
  ('MTR-JA-MAIN-IN', 'peak_kw', (now() - interval '1 day')::DATE, now()::DATE, 'day', 4580.0, 'kW', 4500.0, 4200.0, 'max', 0.98, '{"peak_hour": 13}'),
  ('MTR-AW-MAIN-IN', 'peak_kw', (now() - interval '1 day')::DATE, now()::DATE, 'day', 3220.0, 'kW', 3100.0, 2950.0, 'max', 0.97, '{"peak_hour": 19}')
) AS v(meter_code, kpi_code, period_start, period_end, period_grain, value, unit, target_value, baseline_value, calculation_method, data_quality_score, metadata)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND m.meter_code = v.meter_code
ON CONFLICT (kpi_code, scope_type, scope_id, period_start, period_grain) DO NOTHING;
-- ============================================================================
-- INSERT BENCHMARKS
-- ============================================================================

INSERT INTO energy_benchmarks (
  org_id, benchmark_code, benchmark_name, benchmark_type,
  scope_type, scope_filter, value, unit, percentile,
  source, source_reference, effective_date, expiry_date,
  confidence_level, sample_size, description, methodology, active
)
SELECT 
  t.id,
  v.benchmark_code,
  v.benchmark_name,
  v.benchmark_type,
  v.scope_type,
  v.scope_filter::JSONB,
  v.value,
  v.unit,
  v.percentile,
  v.source,
  v.source_reference,
  v.effective_date,
  v.expiry_date,
  v.confidence_level,
  v.sample_size,
  v.description,
  v.methodology,
  v.active
FROM tenants t
CROSS JOIN (VALUES
  -- Industry benchmarks for transmission losses
  ('tx_losses_industry_avg', 'Transmission Losses - Industry Average', 'industry', 'substation', '{"voltage_level": "132kV-400kV"}', 2.5, '%', 50.0, 'IEEE Standards', 'IEEE Std 1366-2012', '2024-01-01'::DATE, '2025-12-31'::DATE, 0.85, 150, 'Industry average transmission losses for 132-400kV systems', 'Statistical analysis of utility data', true),
  ('tx_losses_industry_p25', 'Transmission Losses - 25th Percentile', 'industry', 'substation', '{"voltage_level": "132kV-400kV"}', 1.8, '%', 25.0, 'IEEE Standards', 'IEEE Std 1366-2012', '2024-01-01'::DATE, '2025-12-31'::DATE, 0.85, 150, 'Best quartile transmission losses for 132-400kV systems', 'Statistical analysis of utility data', true),
  ('tx_losses_industry_p75', 'Transmission Losses - 75th Percentile', 'industry', 'substation', '{"voltage_level": "132kV-400kV"}', 3.2, '%', 75.0, 'IEEE Standards', 'IEEE Std 1366-2012', '2024-01-01'::DATE, '2025-12-31'::DATE, 0.85, 150, 'Third quartile transmission losses for 132-400kV systems', 'Statistical analysis of utility data', true),
  
  -- Load factor benchmarks
  ('load_factor_industry_avg', 'Load Factor - Industry Average', 'industry', 'substation', '{"region": "Middle East", "voltage_level": "132kV-400kV"}', 0.68, 'ratio', 50.0, 'Regional Study', 'MENA Grid Study 2023', '2024-01-01'::DATE, '2025-12-31'::DATE, 0.78, 85, 'Average load factor for transmission substations in MENA region', 'Regional utility benchmarking study', true),
  ('load_factor_best_practice', 'Load Factor - Best Practice', 'target', 'substation', '{"voltage_level": "132kV-400kV"}', 0.75, 'ratio', NULL, 'Engineering Standard', 'Internal Engineering Guidelines', '2024-01-01'::DATE, NULL, 0.95, NULL, 'Target load factor for efficient transmission operations', 'Engineering analysis and best practices', true),
  
  -- Power factor benchmarks
  ('power_factor_regulatory', 'Power Factor - Regulatory Minimum', 'regulatory', 'feeder', '{"voltage_level": "132kV"}', 0.90, 'ratio', NULL, 'Grid Code', 'UAE Grid Code Section 4.2.3', '2024-01-01'::DATE, NULL, 1.0, NULL, 'Minimum power factor requirement for 132kV feeders', 'Regulatory requirement per UAE Grid Code', true),
  ('power_factor_target', 'Power Factor - Operational Target', 'target', 'feeder', '{"voltage_level": "132kV-400kV"}', 0.95, 'ratio', NULL, 'Internal Standard', 'DEWA Operational Guidelines', '2024-01-01'::DATE, NULL, 0.98, NULL, 'Target power factor for optimal transmission efficiency', 'Internal operational guidelines', true),
  
  -- Utilization benchmarks
  ('feeder_utilization_max', 'Feeder Utilization - Maximum Safe', 'target', 'feeder', '{"voltage_level": "132kV-400kV"}', 80.0, '%', NULL, 'Engineering Standard', 'N-1 Security Criteria', '2024-01-01'::DATE, NULL, 0.99, NULL, 'Maximum safe utilization considering N-1 contingency', 'Engineering analysis per N-1 security criteria', true),
  ('feeder_utilization_optimal', 'Feeder Utilization - Optimal Range', 'target', 'feeder', '{"voltage_level": "132kV-400kV"}', 65.0, '%', NULL, 'Engineering Standard', 'Load Flow Studies', '2024-01-01'::DATE, NULL, 0.95, NULL, 'Optimal utilization for efficiency and reliability balance', 'Load flow analysis and optimization studies', true),
  
  -- Historical benchmarks (peer comparison)
  ('tx_efficiency_peer_avg', 'Transmission Efficiency - Peer Average', 'peer', 'org', '{"region": "GCC", "utility_type": "transmission"}', 97.2, '%', 50.0, 'GCC Utilities', 'GCC Transmission Benchmarking 2023', '2024-01-01'::DATE, '2024-12-31'::DATE, 0.82, 12, 'Average transmission efficiency among GCC utilities', 'Peer benchmarking study with regional utilities', true),
  ('kwh_per_mwh_peer_median', 'Station Service Consumption - Peer Median', 'peer', 'org', '{"region": "GCC", "utility_type": "transmission"}', 2.2, 'kWh/MWh', 50.0, 'GCC Utilities', 'GCC Transmission Benchmarking 2023', '2024-01-01'::DATE, '2024-12-31'::DATE, 0.80, 12, 'Median station service consumption per MWh delivered', 'Peer benchmarking study with regional utilities', true),
  
  -- Voltage-specific benchmarks
  ('thd_limit_400kv', 'THD Voltage Limit - 400kV', 'regulatory', 'meter', '{"voltage_level": "400kV"}', 3.0, '%', NULL, 'IEEE Standard', 'IEEE 519-2014', '2024-01-01'::DATE, NULL, 1.0, NULL, 'Maximum THD voltage distortion for 400kV systems', 'IEEE 519 standard for power quality', true),
  ('thd_limit_220kv', 'THD Voltage Limit - 220kV', 'regulatory', 'meter', '{"voltage_level": "220kV"}', 3.0, '%', NULL, 'IEEE Standard', 'IEEE 519-2014', '2024-01-01'::DATE, NULL, 1.0, NULL, 'Maximum THD voltage distortion for 220kV systems', 'IEEE 519 standard for power quality', true),
  ('thd_limit_132kv', 'THD Voltage Limit - 132kV', 'regulatory', 'meter', '{"voltage_level": "132kV"}', 5.0, '%', NULL, 'IEEE Standard', 'IEEE 519-2014', '2024-01-01'::DATE, NULL, 1.0, NULL, 'Maximum THD voltage distortion for 132kV systems', 'IEEE 519 standard for power quality', true),
  
  -- Additional benchmark to meet minimum count
  ('frequency_stability_target', 'Frequency Stability Target', 'target', 'org', '{"system_type": "transmission"}', 50.0, 'Hz', NULL, 'Grid Code', 'UAE Grid Code Section 3.1', '2024-01-01'::DATE, NULL, 1.0, NULL, 'Target frequency for stable transmission operations', 'Grid code requirement for frequency stability', true)
) AS v(
  benchmark_code, benchmark_name, benchmark_type,
  scope_type, scope_filter, value, unit, percentile,
  source, source_reference, effective_date, expiry_date,
  confidence_level, sample_size, description, methodology, active
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
ON CONFLICT (org_id, benchmark_code, effective_date) DO NOTHING;
-- ============================================================================
-- INSERT DEMAND WINDOWS
-- ============================================================================

INSERT INTO tx_demand_windows (
  org_id, utility_name, tariff_code, window_name,
  start_time, end_time, days_of_week, months, season,
  season_start_date, season_end_date,
  demand_charge_rate, demand_charge_unit, minimum_demand_kw,
  ratchet_percentage, ratchet_months, measurement_interval_minutes,
  effective_date, expiry_date, description, tariff_document_reference, active
)
SELECT 
  t.id,
  v.utility_name,
  v.tariff_code,
  v.window_name,
  v.start_time,
  v.end_time,
  v.days_of_week,
  v.months,
  v.season,
  v.season_start_date,
  v.season_end_date,
  v.demand_charge_rate,
  v.demand_charge_unit,
  v.minimum_demand_kw,
  v.ratchet_percentage,
  v.ratchet_months,
  v.measurement_interval_minutes,
  v.effective_date,
  v.expiry_date,
  v.description,
  v.tariff_document_reference,
  v.active
FROM tenants t
CROSS JOIN (VALUES
  -- DEWA Transmission Tariff - Summer Peak
  ('DEWA', 'TX-HV-2024', 'peak', '10:00:00'::TIME, '17:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[5,6,7,8,9,10], 'summer', '2024-05-01'::DATE, '2024-10-31'::DATE, 45.50, 'USD/kW', 1000.0, 85.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Summer peak demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  ('DEWA', 'TX-HV-2024', 'shoulder', '17:00:00'::TIME, '22:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[5,6,7,8,9,10], 'summer', '2024-05-01'::DATE, '2024-10-31'::DATE, 32.75, 'USD/kW', 500.0, 80.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Summer shoulder demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  ('DEWA', 'TX-HV-2024', 'off_peak', '22:00:00'::TIME, '10:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[5,6,7,8,9,10], 'summer', '2024-05-01'::DATE, '2024-10-31'::DATE, 18.25, 'USD/kW', 0.0, 75.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Summer off-peak demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  
  -- DEWA Transmission Tariff - Winter
  ('DEWA', 'TX-HV-2024', 'peak', '18:00:00'::TIME, '22:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[11,12,1,2,3,4], 'winter', '2024-11-01'::DATE, '2025-04-30'::DATE, 38.75, 'USD/kW', 800.0, 85.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Winter peak demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  ('DEWA', 'TX-HV-2024', 'shoulder', '10:00:00'::TIME, '18:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[11,12,1,2,3,4], 'winter', '2024-11-01'::DATE, '2025-04-30'::DATE, 28.50, 'USD/kW', 400.0, 80.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Winter shoulder demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  ('DEWA', 'TX-HV-2024', 'off_peak', '22:00:00'::TIME, '10:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[11,12,1,2,3,4], 'winter', '2024-11-01'::DATE, '2025-04-30'::DATE, 15.75, 'USD/kW', 0.0, 75.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Winter off-peak demand window for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  
  -- Weekend rates (lower)
  ('DEWA', 'TX-HV-2024', 'off_peak', '00:00:00'::TIME, '23:59:59'::TIME, ARRAY[6,7], NULL, NULL, NULL, NULL, 12.50, 'USD/kW', 0.0, 70.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Weekend off-peak rates for transmission customers', 'DEWA Tariff Schedule TX-HV-2024', true),
  
  -- Critical peak events (rare, high rates)
  ('DEWA', 'TX-HV-2024', 'critical_peak', '13:00:00'::TIME, '16:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[6,7,8,9], 'summer', '2024-06-01'::DATE, '2024-09-30'::DATE, 125.00, 'USD/kW', 2000.0, 95.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Critical peak events during extreme summer conditions', 'DEWA Tariff Schedule TX-HV-2024', true),
  
  -- Alternative utility for comparison (ADWEA - Abu Dhabi)
  ('ADWEA', 'TX-EHV-2024', 'peak', '11:00:00'::TIME, '16:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[5,6,7,8,9], 'summer', '2024-05-01'::DATE, '2024-09-30'::DATE, 42.25, 'USD/kW', 1200.0, 80.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'ADWEA summer peak demand window for EHV customers', 'ADWEA Tariff Schedule TX-EHV-2024', true),
  ('ADWEA', 'TX-EHV-2024', 'off_peak', '16:00:00'::TIME, '11:00:00'::TIME, ARRAY[1,2,3,4,5], ARRAY[5,6,7,8,9], 'summer', '2024-05-01'::DATE, '2024-09-30'::DATE, 22.75, 'USD/kW', 200.0, 75.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'ADWEA summer off-peak demand window for EHV customers', 'ADWEA Tariff Schedule TX-EHV-2024', true),
  
  -- Industrial customer tariff (higher voltage, lower rates)
  ('DEWA', 'TX-IND-2024', 'peak', '09:00:00'::TIME, '18:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 35.50, 'USD/kW', 5000.0, 90.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Industrial transmission customer peak demand', 'DEWA Industrial Tariff TX-IND-2024', true),
  ('DEWA', 'TX-IND-2024', 'off_peak', '18:00:00'::TIME, '09:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 18.75, 'USD/kW', 1000.0, 85.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Industrial transmission customer off-peak demand', 'DEWA Industrial Tariff TX-IND-2024', true),
  
  -- Additional demand windows to meet minimum count
  ('DEWA', 'TX-COMM-2024', 'peak', '08:00:00'::TIME, '20:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 52.00, 'USD/kW', 2000.0, 88.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Commercial transmission customer peak demand', 'DEWA Commercial Tariff TX-COMM-2024', true),
  ('DEWA', 'TX-COMM-2024', 'off_peak', '20:00:00'::TIME, '08:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 28.50, 'USD/kW', 500.0, 82.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Commercial transmission customer off-peak demand', 'DEWA Commercial Tariff TX-COMM-2024', true),
  ('DEWA', 'TX-GOVT-2024', 'peak', '07:00:00'::TIME, '15:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 38.25, 'USD/kW', 1500.0, 85.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Government transmission customer peak demand', 'DEWA Government Tariff TX-GOVT-2024', true),
  ('DEWA', 'TX-GOVT-2024', 'off_peak', '15:00:00'::TIME, '07:00:00'::TIME, ARRAY[1,2,3,4,5], NULL, NULL, NULL, NULL, 22.75, 'USD/kW', 300.0, 80.0, 12, 15, '2024-01-01'::DATE, '2024-12-31'::DATE, 'Government transmission customer off-peak demand', 'DEWA Government Tariff TX-GOVT-2024', true)
) AS v(
  utility_name, tariff_code, window_name,
  start_time, end_time, days_of_week, months, season,
  season_start_date, season_end_date,
  demand_charge_rate, demand_charge_unit, minimum_demand_kw,
  ratchet_percentage, ratchet_months, measurement_interval_minutes,
  effective_date, expiry_date, description, tariff_document_reference, active
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
ON CONFLICT (org_id, utility_name, tariff_code, window_name, effective_date) DO NOTHING;
-- ============================================================================
-- INSERT RECOMMENDATIONS
-- ============================================================================

-- Insert substation recommendations
INSERT INTO energy_recommendations (
  org_id, recommendation_type, scope_type, scope_id,
  title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
SELECT 
  t.id,
  v.recommendation_type,
  'substation',
  s.id,
  v.title,
  v.description,
  v.priority,
  v.estimated_savings_kwh,
  v.estimated_savings_cost,
  v.estimated_implementation_cost,
  v.payback_period_months,
  v.confidence_level,
  v.timeframe,
  v.implementation_complexity,
  v.required_resources,
  v.status,
  v.source,
  v.source_reference,
  v.metadata::JSONB
FROM tenants t
INNER JOIN tx_substations s ON s.org_id = t.id
CROSS JOIN (VALUES
  ('SS-AW-MAIN', 'waste', 'Reduce Station Service Load During Off-Peak Hours', 'Al Aweer substation shows elevated station service consumption during off-peak hours (2-6 AM). Implement automated HVAC scheduling and lighting controls to reduce unnecessary consumption.', 'Medium', 12000.0, 2400.0, 15000.0, 6, 0.85, 'short_term', 'Low', 'Electrical technician, HVAC contractor, automation engineer', 'pending', 'system', 'Waste Detection Algorithm v2.1', '{"current_off_peak_kw": 45, "target_off_peak_kw": 32, "affected_systems": ["HVAC", "lighting", "auxiliary_power"]}'),
  ('SS-JA-MAIN', 'efficiency', 'Install Power Factor Correction', 'Jebel Ali substation power factor averaging 0.91, below optimal 0.95 target. Install 15 MVAR capacitor bank to improve power factor and reduce losses.', 'High', 25000.0, 5000.0, 85000.0, 17, 0.88, 'medium_term', 'High', 'Electrical engineer, capacitor bank supplier, installation crew', 'pending', 'system', 'Power Factor Analysis v2.0', '{"current_pf": 0.91, "target_pf": 0.95, "required_mvar": 15, "loss_reduction_pct": 3.2}'),
  ('SS-DXB-MAIN', 'peak_shaving', 'Implement Load Shifting Strategy', 'Dubai Main substation shows sharp peak at 2 PM (4125 kW). Coordinate with large customers to shift 200 kW of non-critical loads to off-peak hours.', 'High', 15000.0, 18000.0, 12000.0, 8, 0.75, 'short_term', 'Medium', 'Load dispatch coordinator, customer account manager, demand response coordinator', 'pending', 'system', 'Peak Demand Analysis v1.5', '{"peak_kw": 4125, "target_reduction_kw": 200, "shiftable_loads": ["industrial_processes", "water_pumping", "cooling_systems"]}'),
  ('SS-CENTRAL', 'ai_optimization', 'Implement Predictive Load Forecasting', 'Central Hub shows suboptimal switching patterns. AI model predicts 8% efficiency improvement through optimized switching sequence based on load forecasts.', 'Medium', 35000.0, 7000.0, 120000.0, 21, 0.73, 'long_term', 'High', 'AI/ML engineer, SCADA specialist, system operator training', 'pending', 'ai_model', 'Load Forecasting ML Model v3.2', '{"model_accuracy": 94.2, "efficiency_improvement_pct": 8.1, "switching_optimization": true, "forecast_horizon_hours": 24}'),
  ('SS-AW-MAIN', 'load_balancing', 'Reconfigure Feeder Connections', 'Al Aweer substation load imbalance between feeders creates 3.1% losses. Reconfigure 3 customer connections from overloaded to underloaded feeder.', 'High', 14000.0, 2800.0, 18000.0, 8, 0.90, 'short_term', 'Medium', 'Protection engineer, field crew, customer notification', 'accepted', 'system', 'Load Flow Analysis v2.3', '{"loss_reduction_pct": 1.3, "customers_to_transfer": 3, "transfer_load_kw": 280, "implementation_date": "2025-02-15"}'),
  ('SS-DXB-MAIN', 'pq_improvement', 'Upgrade Voltage Regulation System', 'Dubai Main substation voltage variations exceed ±2%. Upgrade automatic voltage regulator to maintain voltage within ±1% for improved power quality.', 'Low', 3000.0, 600.0, 65000.0, 130, 0.88, 'long_term', 'High', 'Protection engineer, AVR supplier, system studies', 'pending', 'system', 'Voltage Regulation Study v1.1', '{"current_variation_pct": 2.8, "target_variation_pct": 1.0, "avr_upgrade_required": true}')
) AS v(
  substation_code, recommendation_type, title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND s.code = v.substation_code
ON CONFLICT DO NOTHING;

-- Insert feeder recommendations
INSERT INTO energy_recommendations (
  org_id, recommendation_type, scope_type, scope_id,
  title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
SELECT 
  t.id,
  v.recommendation_type,
  'feeder',
  f.id,
  v.title,
  v.description,
  v.priority,
  v.estimated_savings_kwh,
  v.estimated_savings_cost,
  v.estimated_implementation_cost,
  v.payback_period_months,
  v.confidence_level,
  v.timeframe,
  v.implementation_complexity,
  v.required_resources,
  v.status,
  v.source,
  v.source_reference,
  v.metadata::JSONB
FROM tenants t
INNER JOIN tx_substations s ON s.org_id = t.id
INNER JOIN tx_feeders f ON f.substation_id = s.id
CROSS JOIN (VALUES
  ('SS-AW-MAIN', 'FDR-OUT-01', 'waste', 'Optimize Feeder Load Distribution', 'Al Aweer Feeder OUT-01 shows 85.6% utilization while OUT-02 shows 65% utilization. Redistribute loads to balance utilization and reduce losses.', 'High', 8500.0, 1700.0, 25000.0, 15, 0.78, 'medium_term', 'Medium', 'Protection engineer, field crew, load dispatch coordinator', 'pending', 'system', 'Load Balancing Analysis v1.3', '{"current_util_fdr1": 85.6, "current_util_fdr2": 65.0, "target_util_fdr1": 75.0, "target_util_fdr2": 75.0}'),
  ('SS-JA-MAIN', 'FDR-OUT-01', 'peak_shaving', 'Install Demand Response Controls', 'Jebel Ali Feeder OUT-01 exceeds 80% utilization during peak hours. Install automated demand response controls for 5 largest customers to reduce peak by 150 kW.', 'High', 22000.0, 24000.0, 45000.0, 23, 0.82, 'medium_term', 'High', 'Demand response engineer, communication systems, customer coordination', 'pending', 'system', 'Demand Response Feasibility Study v1.2', '{"peak_util_pct": 81.2, "target_util_pct": 75.0, "dr_customers": 5, "dr_capacity_kw": 150}'),
  ('SS-DXB-MAIN', 'FDR-OUT-02', 'load_balancing', 'Install Automatic Load Transfer Switch', 'Dubai Main Feeder OUT-02 can automatically transfer 50 kW to OUT-01 during peak hours to balance loading and reduce losses.', 'Medium', 8000.0, 1600.0, 28000.0, 21, 0.85, 'medium_term', 'High', 'Protection engineer, ATS supplier, commissioning team', 'pending', 'system', 'Automatic Transfer Analysis v1.0', '{"transfer_capacity_kw": 50, "activation_threshold_pct": 75, "loss_reduction_pct": 0.8}')
) AS v(
  substation_code, feeder_code, recommendation_type, title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND s.code = v.substation_code
  AND f.feeder_code = v.feeder_code
ON CONFLICT DO NOTHING;
-- Insert meter recommendations
INSERT INTO energy_recommendations (
  org_id, recommendation_type, scope_type, scope_id,
  title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
SELECT 
  t.id,
  v.recommendation_type,
  'meter',
  m.id,
  v.title,
  v.description,
  v.priority,
  v.estimated_savings_kwh,
  v.estimated_savings_cost,
  v.estimated_implementation_cost,
  v.payback_period_months,
  v.confidence_level,
  v.timeframe,
  v.implementation_complexity,
  v.required_resources,
  v.status,
  v.source,
  v.source_reference,
  v.metadata::JSONB
FROM tenants t
INNER JOIN energy_meters m ON m.org_id = t.id
CROSS JOIN (VALUES
  ('MTR-DXB-MAIN-IN', 'ai_optimization', 'Anomaly Detection Enhancement', 'Implement advanced anomaly detection for Dubai Main incomer. ML model identifies consumption patterns 15 minutes earlier than current threshold-based system.', 'Low', 5000.0, 1000.0, 35000.0, 42, 0.68, 'long_term', 'Medium', 'Data scientist, metering specialist, IT support', 'pending', 'ai_model', 'Anomaly Detection ML Model v2.1', '{"detection_improvement_minutes": 15, "false_positive_reduction_pct": 35, "model_confidence": 0.89}'),
  ('MTR-JA-FDR-OUT-01', 'pq_improvement', 'Install Harmonic Filter', 'Jebel Ali Feeder OUT-01 shows elevated THD (5.8%). Install 5th and 7th harmonic filter to reduce THD below 3% and improve power quality.', 'Medium', 6000.0, 1200.0, 42000.0, 42, 0.95, 'medium_term', 'High', 'Power quality engineer, filter supplier, testing team', 'pending', 'system', 'Harmonic Analysis Report v1.4', '{"current_thd_pct": 5.8, "target_thd_pct": 2.5, "dominant_harmonics": [5, 7], "filter_rating_mvar": 2.5}')
) AS v(
  meter_code, recommendation_type, title, description, priority,
  estimated_savings_kwh, estimated_savings_cost, estimated_implementation_cost,
  payback_period_months, confidence_level, timeframe, implementation_complexity,
  required_resources, status, source, source_reference, metadata
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND m.meter_code = v.meter_code
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT ANOMALIES
-- ============================================================================

INSERT INTO energy_anomalies (
  meter_id, anomaly_type, timestamp, severity,
  baseline_value, actual_value, magnitude_pct, deviation_value,
  detection_method, confidence_score,
  description, resolved, resolved_at, corrective_actions, metadata
)
SELECT 
  m.id,
  v.anomaly_type::anomaly_type,
  v.timestamp,
  v.severity::severity_level,
  v.baseline_value,
  v.actual_value,
  v.magnitude_pct,
  v.deviation_value,
  v.detection_method,
  v.confidence_score,
  v.description,
  v.resolved,
  v.resolved_at,
  v.corrective_actions,
  v.metadata::JSONB
FROM tenants t
INNER JOIN energy_meters m ON m.org_id = t.id
CROSS JOIN (VALUES
  -- Consumption anomalies (resolved)
  ('MTR-DXB-MAIN-IN', 'consumption_spike', (now() - interval '15 days')::TIMESTAMPTZ, 'Medium', 3500.0, 4200.0, 20.0, 700.0, 'statistical', 0.92, 'Unexpected consumption spike during off-peak hours', true, (now() - interval '14 days')::TIMESTAMPTZ, 'Confirmed as planned maintenance activity requiring additional lighting and equipment', '{"maintenance_activity": true, "duration_hours": 6, "equipment": ["cranes", "floodlights", "welding"]}'),
  ('MTR-JA-MAIN-IN', 'consumption_drop', (now() - interval '12 days')::TIMESTAMPTZ, 'High', 4000.0, 2800.0, -30.0, -1200.0, 'statistical', 0.95, 'Significant consumption drop during peak hours', true, (now() - interval '11 days')::TIMESTAMPTZ, 'Large industrial customer temporary shutdown for equipment upgrade', '{"customer_shutdown": true, "affected_load_mw": 1.2, "planned_duration_days": 3}'),
  ('MTR-AW-FDR-OUT-01', 'pattern_deviation', (now() - interval '8 days')::TIMESTAMPTZ, 'Low', 950.0, 1140.0, 20.0, 190.0, 'statistical', 0.88, 'Consumption above seasonal baseline', true, (now() - interval '7 days')::TIMESTAMPTZ, 'Seasonal adjustment - increased cooling load due to temperature rise', '{"temperature_correlation": true, "cooling_load_increase_pct": 18}'),
  
  -- Power quality anomalies (some resolved, some unresolved)
  ('MTR-DXB-T1-LV', 'efficiency_drop', (now() - interval '6 days')::TIMESTAMPTZ, 'Medium', 0.94, 0.82, -12.8, -0.12, 'rule_based', 0.98, 'Power factor dropped below acceptable threshold', true, (now() - interval '5 days')::TIMESTAMPTZ, 'Capacitor bank automatically switched in, power factor restored', '{"capacitor_bank_action": true, "pf_restored_to": 0.93, "automatic_correction": true}'),
  ('MTR-JA-FDR-OUT-01', 'efficiency_drop', (now() - interval '4 days')::TIMESTAMPTZ, 'High', 3.2, 5.8, 81.3, 2.6, 'rule_based', 0.96, 'THD voltage distortion exceeds IEEE 519 limits', false, NULL, NULL, '{"ieee_519_limit_pct": 5.0, "dominant_harmonics": [5, 7, 11], "source_investigation": "ongoing"}'),
  ('MTR-AW-MAIN-IN', 'efficiency_drop', (now() - interval '3 days')::TIMESTAMPTZ, 'Medium', 132000.0, 128400.0, -2.7, -3600.0, 'statistical', 0.91, 'Voltage below normal operating range', false, NULL, NULL, '{"voltage_level_kv": 132, "normal_range_pct": "±2%", "tap_changer_status": "manual_mode"}'),
  
  -- Load pattern anomalies (unresolved - recent)
  ('MTR-DXB-FDR-OUT-02', 'pattern_deviation', (now() - interval '2 days')::TIMESTAMPTZ, 'Low', 1100.0, 1320.0, 20.0, 220.0, 'ml_model', 0.85, 'Load pattern changed from historical norm', false, NULL, NULL, '{"pattern_change_type": "peak_shift", "new_peak_hour": 16, "historical_peak_hour": 14, "investigation_required": true}'),
  ('MTR-JA-MAIN-IN', 'efficiency_drop', (now() - interval '1 day')::TIMESTAMPTZ, 'Medium', 97.5, 95.8, -1.7, -1.7, 'statistical', 0.89, 'Transmission efficiency showing downward trend', false, NULL, NULL, '{"efficiency_trend_days": 7, "degradation_rate_pct_per_day": 0.24, "potential_causes": ["transformer_aging", "connection_resistance", "load_imbalance"]}'),
  ('MTR-DXB-MAIN-IN', 'pattern_deviation', (now() - interval '8 hours')::TIMESTAMPTZ, 'Low', 3500.0, 3850.0, 10.0, 350.0, 'ml_model', 0.78, 'Consumption pattern deviates from ML model prediction', false, NULL, NULL, '{"ml_model_version": "v2.1", "prediction_confidence": 0.94, "deviation_significance": "moderate", "weather_correlation": false}'),
  
  -- Transmission-specific anomalies
  ('MTR-AW-FDR-OUT-01', 'efficiency_drop', (now() - interval '5 hours')::TIMESTAMPTZ, 'High', 2.8, 4.2, 50.0, 1.4, 'statistical', 0.93, 'Feeder losses significantly above normal', false, NULL, NULL, '{"normal_losses_pct": 2.8, "current_losses_pct": 4.2, "possible_causes": ["conductor_heating", "connection_issues", "load_imbalance"], "investigation_priority": "high"}'),
  ('MTR-DXB-T2-LV', 'consumption_spike', (now() - interval '3 hours')::TIMESTAMPTZ, 'Critical', 1700.0, 2125.0, 25.0, 425.0, 'rule_based', 0.99, 'Transformer loading exceeds safe operating limits', false, NULL, NULL, '{"rated_capacity_mva": 500, "current_loading_pct": 125, "thermal_limit_exceeded": true, "immediate_action_required": true}'),
  ('MTR-JA-MAIN-IN', 'pattern_deviation', (now() - interval '1 hour')::TIMESTAMPTZ, 'Medium', 50.0, 49.75, -0.5, -0.25, 'rule_based', 0.97, 'Grid frequency deviation detected', false, NULL, NULL, '{"frequency_hz": 49.75, "deviation_duration_seconds": 45, "grid_code_limit_hz": 49.8, "system_response": "automatic_load_shedding_armed"}')
) AS v(
  meter_code, anomaly_type, timestamp, severity,
  baseline_value, actual_value, magnitude_pct, deviation_value,
  detection_method, confidence_score, description,
  resolved, resolved_at, corrective_actions, metadata
)
WHERE t.name = 'DEWA - Transmission'
  AND t.sector = 'power'
  AND t.subsector = 'transmission'
  AND t.scenario_tag = 'power_transmission_demo_v1'
  AND m.meter_code = v.meter_code
ON CONFLICT DO NOTHING;
-- ============================================================================
-- POST-SEED VALIDATION (POSTCHECKS)
-- ============================================================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_kpi_count INTEGER;
  v_benchmark_count INTEGER;
  v_demand_window_count INTEGER;
  v_recommendation_count INTEGER;
  v_anomaly_count INTEGER;
  v_unresolved_anomalies INTEGER;
  v_resolved_anomalies INTEGER;
  v_pending_recommendations INTEGER;
  v_accepted_recommendations INTEGER;
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
  SELECT COUNT(*) INTO v_kpi_count
  FROM energy_kpi_snapshots WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_benchmark_count
  FROM energy_benchmarks WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_demand_window_count
  FROM tx_demand_windows WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_recommendation_count
  FROM energy_recommendations WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_anomaly_count
  FROM energy_anomalies a
  INNER JOIN energy_meters m ON a.meter_id = m.id
  WHERE m.org_id = v_tenant_id;
  
  -- Validate expected counts
  IF v_kpi_count < 20 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 20 KPI snapshots, found %', v_kpi_count;
  END IF;
  
  IF v_benchmark_count < 15 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 15 benchmarks, found %', v_benchmark_count;
  END IF;
  
  IF v_demand_window_count < 12 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 12 demand windows, found %', v_demand_window_count;
  END IF;
  
  IF v_recommendation_count < 8 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 8 recommendations, found %', v_recommendation_count;
  END IF;
  
  IF v_anomaly_count < 12 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 12 anomalies, found %', v_anomaly_count;
  END IF;
  
  -- Check business rules and data quality
  SELECT COUNT(*) INTO v_unresolved_anomalies
  FROM energy_anomalies a
  INNER JOIN energy_meters m ON a.meter_id = m.id
  WHERE m.org_id = v_tenant_id AND a.resolved = false;
  
  SELECT COUNT(*) INTO v_resolved_anomalies
  FROM energy_anomalies a
  INNER JOIN energy_meters m ON a.meter_id = m.id
  WHERE m.org_id = v_tenant_id AND a.resolved = true;
  
  IF v_unresolved_anomalies < 5 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 5 unresolved anomalies for realistic scenario, found %', v_unresolved_anomalies;
  END IF;
  
  IF v_resolved_anomalies < 3 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 3 resolved anomalies for historical context, found %', v_resolved_anomalies;
  END IF;
  
  SELECT COUNT(*) INTO v_pending_recommendations
  FROM energy_recommendations WHERE org_id = v_tenant_id AND status = 'pending';
  
  SELECT COUNT(*) INTO v_accepted_recommendations
  FROM energy_recommendations WHERE org_id = v_tenant_id AND status = 'accepted';
  
  IF v_pending_recommendations < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 7 pending recommendations, found %', v_pending_recommendations;
  END IF;
  
  IF v_accepted_recommendations < 1 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 1 accepted recommendation for workflow testing, found %', v_accepted_recommendations;
  END IF;
  
  RAISE NOTICE 'Seed 009_energy_analytics_tx.sql OK: kpis=%, benchmarks=%, demand_windows=%, recommendations=%, anomalies=%', 
    v_kpi_count, v_benchmark_count, v_demand_window_count, v_recommendation_count, v_anomaly_count;
END $$;

COMMIT;