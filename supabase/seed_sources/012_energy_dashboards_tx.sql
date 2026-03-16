-- Seed data for EMS Power Transmission - Dashboards and Reporting
-- Creates dashboard definitions, energy tariffs, and export job examples
-- Uses CTE pattern with preconditions, idempotent upserts, and postchecks
-- Requirements: 23.1, 24.1, 25.1

-- Transaction handled by CLI

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_substation_count INTEGER;
  v_feeder_count INTEGER;
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
  
  -- Verify substations exist
  SELECT COUNT(*) INTO v_substation_count
  FROM tx_substations s
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_substation_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No substations found. Run 007_energy_tx_foundation.sql first.';
  END IF;
  
  -- Verify feeders exist
  SELECT COUNT(*) INTO v_feeder_count
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_feeder_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No feeders found. Run 007_energy_tx_foundation.sql first.';
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant exists, % substations, % feeders', v_substation_count, v_feeder_count;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- 1) Get tenant UUID and topology references
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
  SELECT f.id, f.feeder_code, f.name, f.substation_id
  FROM tx_feeders f
  INNER JOIN substations_lookup s ON f.substation_id = s.id
),

-- 2) Upsert energy tariffs using natural key (org_id, tariff_code)
upsert_energy_tariffs AS (
  INSERT INTO energy_tariffs (
    org_id,
    tariff_code,
    tariff_name,
    description,
    tariff_type,
    rate_structure,
    utility_name,
    utility_account_number,
    service_territory,
    applies_to_scope,
    scope_id,
    voltage_level_kv,
    energy_rate_per_kwh,
    demand_rate_per_kw,
    fixed_charge_per_month,
    tou_rates,
    demand_window_minutes,
    demand_ratchet_enabled,
    demand_ratchet_percentage,
    demand_ratchet_months,
    seasonal_rates_enabled,
    seasonal_rates,
    effective_date,
    expiry_date,
    active,
    default_tariff,
    additional_charges
  )
  SELECT 
    tenant.id,
    v.tariff_code,
    v.tariff_name,
    v.description,
    v.tariff_type,
    v.rate_structure,
    v.utility_name,
    v.utility_account_number,
    v.service_territory,
    v.applies_to_scope,
    v.scope_id::UUID,
    v.voltage_level_kv,
    v.energy_rate_per_kwh,
    v.demand_rate_per_kw,
    v.fixed_charge_per_month,
    v.tou_rates::JSONB,
    v.demand_window_minutes,
    v.demand_ratchet_enabled,
    v.demand_ratchet_percentage,
    v.demand_ratchet_months,
    v.seasonal_rates_enabled,
    v.seasonal_rates::JSONB,
    v.effective_date,
    v.expiry_date,
    v.active,
    v.default_tariff,
    v.additional_charges::JSONB
  FROM tenant
  CROSS JOIN (VALUES
    -- Org-wide default transmission tariff
    ('TX-STANDARD-2024', 'Standard Transmission Tariff 2024', 'Default transmission tariff for DEWA grid', 'transmission', 'demand_charge', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, NULL, 0.085000, 45.00, 2500.00, '{}', 15, true, 80.0, 12, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, true, '{"transmission_charge": 5.50, "system_use_charge": 3.25, "regulatory_fee": 0.75}'::TEXT),
    
    -- High voltage transmission tariff (400kV)
    ('TX-HV-400KV-2024', 'High Voltage 400kV Tariff 2024', 'Transmission tariff for 400kV substations', 'transmission', 'demand_charge', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, 400, 0.075000, 38.00, 5000.00, '{}', 15, true, 85.0, 12, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"transmission_charge": 4.50, "system_use_charge": 2.75, "regulatory_fee": 0.50}'::TEXT),
    
    -- Medium voltage transmission tariff (220kV)
    ('TX-MV-220KV-2024', 'Medium Voltage 220kV Tariff 2024', 'Transmission tariff for 220kV substations', 'transmission', 'demand_charge', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, 220, 0.080000, 42.00, 3500.00, '{}', 15, true, 80.0, 12, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"transmission_charge": 5.00, "system_use_charge": 3.00, "regulatory_fee": 0.65}'::TEXT),
    
    -- Low voltage transmission tariff (132kV)
    ('TX-LV-132KV-2024', 'Low Voltage 132kV Tariff 2024', 'Transmission tariff for 132kV substations', 'transmission', 'demand_charge', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, 132, 0.090000, 48.00, 2000.00, '{}', 15, true, 75.0, 12, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"transmission_charge": 5.75, "system_use_charge": 3.50, "regulatory_fee": 0.85}'::TEXT),
    
    -- Time-of-use tariff with peak/off-peak rates
    ('TX-TOU-2024', 'Time-of-Use Transmission Tariff 2024', 'TOU tariff with peak and off-peak rates', 'transmission', 'time_of_use', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, NULL, NULL, 40.00, 2500.00, '{"peak": {"rate_per_kwh": 0.120, "hours": "07:00-23:00", "days": "Mon-Fri"}, "off_peak": {"rate_per_kwh": 0.055, "hours": "23:00-07:00", "days": "All"}, "weekend": {"rate_per_kwh": 0.065, "hours": "All", "days": "Sat-Sun"}}'::TEXT, 15, true, 80.0, 12, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"transmission_charge": 5.50, "system_use_charge": 3.25}'::TEXT),
    
    -- Seasonal tariff with summer/winter rates
    ('TX-SEASONAL-2024', 'Seasonal Transmission Tariff 2024', 'Seasonal tariff with summer and winter rates', 'transmission', 'demand_charge', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, NULL, 0.085000, 45.00, 2500.00, '{}', 15, true, 80.0, 12, true, '{"summer": {"months": [5,6,7,8,9,10], "energy_multiplier": 1.15, "demand_multiplier": 1.20}, "winter": {"months": [11,12,1,2,3,4], "energy_multiplier": 0.95, "demand_multiplier": 0.90}}'::TEXT, '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"transmission_charge": 5.50, "system_use_charge": 3.25, "regulatory_fee": 0.75}'::TEXT),
    
    -- Ancillary services tariff
    ('TX-ANCILLARY-2024', 'Ancillary Services Tariff 2024', 'Tariff for ancillary grid services', 'ancillary_services', 'flat', 'DEWA', 'TX-ACC-001', 'Dubai', 'org', NULL, NULL, 0.015000, 5.00, 500.00, '{}', NULL, false, NULL, NULL, false, '{}', '2024-01-01'::DATE, '2024-12-31'::DATE, true, false, '{"frequency_regulation": 2.50, "voltage_support": 1.75, "black_start": 0.50}'::TEXT)
  ) AS v(
    tariff_code,
    tariff_name,
    description,
    tariff_type,
    rate_structure,
    utility_name,
    utility_account_number,
    service_territory,
    applies_to_scope,
    scope_id,
    voltage_level_kv,
    energy_rate_per_kwh,
    demand_rate_per_kw,
    fixed_charge_per_month,
    tou_rates,
    demand_window_minutes,
    demand_ratchet_enabled,
    demand_ratchet_percentage,
    demand_ratchet_months,
    seasonal_rates_enabled,
    seasonal_rates,
    effective_date,
    expiry_date,
    active,
    default_tariff,
    additional_charges
  )
  ON CONFLICT (org_id, tariff_code) 
  DO UPDATE SET
    tariff_name = EXCLUDED.tariff_name,
    description = EXCLUDED.description,
    tariff_type = EXCLUDED.tariff_type,
    rate_structure = EXCLUDED.rate_structure,
    utility_name = EXCLUDED.utility_name,
    voltage_level_kv = EXCLUDED.voltage_level_kv,
    energy_rate_per_kwh = EXCLUDED.energy_rate_per_kwh,
    demand_rate_per_kw = EXCLUDED.demand_rate_per_kw,
    fixed_charge_per_month = EXCLUDED.fixed_charge_per_month,
    tou_rates = EXCLUDED.tou_rates,
    demand_window_minutes = EXCLUDED.demand_window_minutes,
    demand_ratchet_enabled = EXCLUDED.demand_ratchet_enabled,
    demand_ratchet_percentage = EXCLUDED.demand_ratchet_percentage,
    seasonal_rates_enabled = EXCLUDED.seasonal_rates_enabled,
    seasonal_rates = EXCLUDED.seasonal_rates,
    active = EXCLUDED.active,
    default_tariff = EXCLUDED.default_tariff,
    additional_charges = EXCLUDED.additional_charges,
    updated_at = now()
  RETURNING id
),

-- 3) Upsert dashboard definitions using natural key (org_id, dashboard_code)
upsert_dashboard_definitions AS (
  INSERT INTO dashboard_definitions (
    org_id,
    dashboard_code,
    name,
    description,
    dashboard_type,
    category,
    config,
    version,
    owner_id,
    public_dashboard,
    active,
    published
  )
  SELECT 
    tenant.id,
    v.dashboard_code,
    v.name,
    v.description,
    v.dashboard_type,
    v.category,
    v.config::JSONB,
    v.version,
    v.owner_id::UUID,
    v.public_dashboard,
    v.active,
    v.published
  FROM tenant
  CROSS JOIN (VALUES
    -- System dashboard: Transmission Grid Overview
    ('TX-GRID-OVERVIEW', 'Transmission Grid Overview', 'Real-time overview of transmission grid performance and status', 'system', 'transmission', 
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Total Grid Load", "query_config": {"dataset": "energy_telemetry", "aggregation": "sum_kw"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Grid Losses %", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"kpi_code": "grid_losses_pct"}}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "System Load Factor", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"kpi_code": "load_factor"}}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w4", "widget_type": "kpi_tile", "title": "Active Alerts", "query_config": {"dataset": "energy_alerts", "filters": {"alert_state": "open"}}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w5", "widget_type": "trend_chart", "title": "24h Load Profile", "query_config": {"dataset": "energy_telemetry", "aggregation": "hourly_avg_kw"}, "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
       {"widget_id": "w6", "widget_type": "table", "title": "Substation Status", "query_config": {"dataset": "v_tx_energy_meter_registry", "filters": {"meter_role": "grid_incomer"}}, "position": {"x": 6, "y": 2, "w": 6, "h": 4}}
     ], "layout": "grid", "refresh_interval": 60}'::TEXT, 
     1, NULL, true, true, true),
    
    -- System dashboard: Power Quality Monitoring
    ('TX-POWER-QUALITY', 'Power Quality Monitoring', 'Real-time power quality metrics and events across the grid', 'system', 'transmission',
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Avg Voltage (kV)", "query_config": {"dataset": "energy_telemetry", "aggregation": "avg_voltage"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Avg Power Factor", "query_config": {"dataset": "energy_telemetry", "aggregation": "avg_pf"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "Avg THD %", "query_config": {"dataset": "energy_telemetry", "aggregation": "avg_thd"}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w4", "widget_type": "kpi_tile", "title": "Open PQ Events", "query_config": {"dataset": "power_quality_events", "filters": {"resolved": false}}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w5", "widget_type": "trend_chart", "title": "Voltage Trends", "query_config": {"dataset": "energy_telemetry", "aggregation": "hourly_avg_voltage"}, "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
       {"widget_id": "w6", "widget_type": "table", "title": "Recent PQ Events", "query_config": {"dataset": "power_quality_events", "filters": {"resolved": false}}, "position": {"x": 6, "y": 2, "w": 6, "h": 4}}
     ], "layout": "grid", "refresh_interval": 30}'::TEXT,
     1, NULL, true, true, true),
    
    -- System dashboard: Energy Cost Analysis
    ('TX-COST-ANALYSIS', 'Energy Cost Analysis', 'Transmission cost breakdown and optimization opportunities', 'system', 'financial',
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Monthly Energy Cost", "query_config": {"dataset": "energy_tariffs", "aggregation": "total_energy_cost"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Monthly Demand Cost", "query_config": {"dataset": "energy_tariffs", "aggregation": "total_demand_cost"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "Cost per MWh", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"kpi_code": "cost_per_mwh"}}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w4", "widget_type": "kpi_tile", "title": "Potential Savings", "query_config": {"dataset": "energy_recommendations", "aggregation": "sum_estimated_savings"}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w5", "widget_type": "trend_chart", "title": "Cost Trends", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"kpi_code": "total_cost"}}, "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
       {"widget_id": "w6", "widget_type": "table", "title": "Cost by Substation", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"scope_type": "substation"}}, "position": {"x": 6, "y": 2, "w": 6, "h": 4}}
     ], "layout": "grid", "refresh_interval": 300}'::TEXT,
     1, NULL, true, true, true),
    
    -- System dashboard: Sustainability Metrics
    ('TX-SUSTAINABILITY', 'Sustainability Metrics', 'Carbon emissions, renewable energy, and ESG performance', 'system', 'sustainability',
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Monthly CO2e (tonnes)", "query_config": {"dataset": "energy_emissions_snapshots", "aggregation": "sum_co2e_kg"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Renewable %", "query_config": {"dataset": "tx_renewables_contracts", "aggregation": "renewable_percentage"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "Energy Intensity", "query_config": {"dataset": "tx_delivery_context", "aggregation": "kg_co2e_per_mwh"}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w4", "widget_type": "kpi_tile", "title": "Grid Losses %", "query_config": {"dataset": "tx_delivery_context", "aggregation": "losses_percentage"}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w5", "widget_type": "trend_chart", "title": "Emissions Trends", "query_config": {"dataset": "energy_emissions_snapshots", "aggregation": "monthly_co2e"}, "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
       {"widget_id": "w6", "widget_type": "table", "title": "Renewable Assets", "query_config": {"dataset": "generation_assets", "filters": {"asset_type": ["solar", "wind"]}}, "position": {"x": 6, "y": 2, "w": 6, "h": 4}}
     ], "layout": "grid", "refresh_interval": 300}'::TEXT,
     1, NULL, true, true, true),
    
    -- Template dashboard: Custom Substation Dashboard
    ('TX-SUBSTATION-TEMPLATE', 'Substation Performance Template', 'Template for creating custom substation dashboards', 'template', 'transmission',
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Substation Load", "query_config": {"dataset": "energy_telemetry", "filters": {"substation_id": "$SUBSTATION_ID"}}, "position": {"x": 0, "y": 0, "w": 4, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Feeder Count", "query_config": {"dataset": "tx_feeders", "filters": {"substation_id": "$SUBSTATION_ID"}}, "position": {"x": 4, "y": 0, "w": 4, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "Active Alerts", "query_config": {"dataset": "energy_alerts", "filters": {"substation_id": "$SUBSTATION_ID"}}, "position": {"x": 8, "y": 0, "w": 4, "h": 2}},
       {"widget_id": "w4", "widget_type": "trend_chart", "title": "Load Profile", "query_config": {"dataset": "energy_telemetry", "filters": {"substation_id": "$SUBSTATION_ID"}}, "position": {"x": 0, "y": 2, "w": 12, "h": 4}},
       {"widget_id": "w5", "widget_type": "table", "title": "Feeder Status", "query_config": {"dataset": "v_tx_energy_meter_registry", "filters": {"substation_id": "$SUBSTATION_ID"}}, "position": {"x": 0, "y": 6, "w": 12, "h": 4}}
     ], "layout": "grid", "refresh_interval": 60}'::TEXT,
     1, NULL, false, true, true),
    
    -- Template dashboard: Feeder Analysis Template
    ('TX-FEEDER-TEMPLATE', 'Feeder Analysis Template', 'Template for creating custom feeder analysis dashboards', 'template', 'transmission',
     '{"widgets": [
       {"widget_id": "w1", "widget_type": "kpi_tile", "title": "Feeder Load", "query_config": {"dataset": "energy_telemetry", "filters": {"feeder_id": "$FEEDER_ID"}}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w2", "widget_type": "kpi_tile", "title": "Load Factor", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"feeder_id": "$FEEDER_ID", "kpi_code": "load_factor"}}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w3", "widget_type": "kpi_tile", "title": "Power Factor", "query_config": {"dataset": "energy_telemetry", "filters": {"feeder_id": "$FEEDER_ID"}}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w4", "widget_type": "kpi_tile", "title": "Utilization %", "query_config": {"dataset": "energy_kpi_snapshots", "filters": {"feeder_id": "$FEEDER_ID", "kpi_code": "utilization_pct"}}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
       {"widget_id": "w5", "widget_type": "trend_chart", "title": "24h Load Profile", "query_config": {"dataset": "energy_telemetry", "filters": {"feeder_id": "$FEEDER_ID"}}, "position": {"x": 0, "y": 2, "w": 12, "h": 4}}
     ], "layout": "grid", "refresh_interval": 60}'::TEXT,
     1, NULL, false, true, true)
  ) AS v(
    dashboard_code,
    name,
    description,
    dashboard_type,
    category,
    config,
    version,
    owner_id,
    public_dashboard,
    active,
    published
  )
  ON CONFLICT (org_id, dashboard_code) 
  DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    dashboard_type = EXCLUDED.dashboard_type,
    category = EXCLUDED.category,
    config = EXCLUDED.config,
    version = EXCLUDED.version,
    public_dashboard = EXCLUDED.public_dashboard,
    active = EXCLUDED.active,
    published = EXCLUDED.published,
    updated_at = now()
  RETURNING id
),

-- 4) Upsert export job examples
upsert_export_jobs AS (
  INSERT INTO export_jobs (
    org_id,
    job_type,
    template_id,
    dashboard_id,
    export_format,
    date_range_start,
    date_range_end,
    filters,
    status,
    progress_percentage,
    queued_at,
    started_at,
    completed_at,
    expires_at,
    output_file_url,
    output_file_name,
    output_file_size_bytes,
    row_count,
    generation_metadata,
    requested_by
  )
  SELECT 
    tenant.id,
    v.job_type,
    v.template_id::UUID,
    v.dashboard_id::UUID,
    v.export_format,
    v.date_range_start,
    v.date_range_end,
    v.filters::JSONB,
    v.status,
    v.progress_percentage,
    v.queued_at,
    v.started_at,
    v.completed_at,
    v.expires_at,
    v.output_file_url,
    v.output_file_name,
    v.output_file_size_bytes,
    v.row_count,
    v.generation_metadata::JSONB,
    v.requested_by::UUID
  FROM tenant
  CROSS JOIN (VALUES
    -- Completed monthly energy report export
    ('report', NULL, NULL, 'pdf', (now() - interval '1 month')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"report_type": "monthly_energy", "include_charts": true}'::TEXT, 'completed', 100, (now() - interval '2 hours')::TIMESTAMPTZ, (now() - interval '2 hours')::TIMESTAMPTZ, (now() - interval '1 hour 45 minutes')::TIMESTAMPTZ, (now() + interval '30 days')::TIMESTAMPTZ, 'https://storage.example.com/exports/monthly-energy-2024-12.pdf', 'monthly-energy-2024-12.pdf', 2457600, 1250, '{"template_version": "1.0", "data_sources": ["energy_telemetry", "energy_kpi_snapshots"], "generation_time_seconds": 15}'::TEXT, NULL),
    
    -- Completed telemetry data export
    ('data_export', NULL, NULL, 'csv', (now() - interval '7 days')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"dataset": "energy_telemetry", "substations": ["all"]}'::TEXT, 'completed', 100, (now() - interval '1 day')::TIMESTAMPTZ, (now() - interval '1 day')::TIMESTAMPTZ, (now() - interval '23 hours')::TIMESTAMPTZ, (now() + interval '7 days')::TIMESTAMPTZ, 'https://storage.example.com/exports/telemetry-export-2024-12-20.csv', 'telemetry-export-2024-12-20.csv', 15728640, 50000, '{"data_sources": ["energy_telemetry"], "generation_time_seconds": 45}'::TEXT, NULL),
    
    -- Completed audit export
    ('audit_export', NULL, NULL, 'excel', (now() - interval '3 months')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"include_alerts": true, "include_anomalies": true, "include_pq_events": true}'::TEXT, 'completed', 100, (now() - interval '3 days')::TIMESTAMPTZ, (now() - interval '3 days')::TIMESTAMPTZ, (now() - interval '2 days 23 hours')::TIMESTAMPTZ, (now() + interval '90 days')::TIMESTAMPTZ, 'https://storage.example.com/exports/audit-q4-2024.xlsx', 'audit-q4-2024.xlsx', 5242880, 3500, '{"template_version": "2.0", "data_sources": ["energy_alerts", "energy_anomalies", "power_quality_events"], "generation_time_seconds": 120}'::TEXT, NULL),
    
    -- Completed compliance package export
    ('compliance_package', NULL, NULL, 'pdf', (now() - interval '1 year')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"compliance_standards": ["ISO50001", "IEC61850"], "include_evidence": true}'::TEXT, 'completed', 100, (now() - interval '5 days')::TIMESTAMPTZ, (now() - interval '5 days')::TIMESTAMPTZ, (now() - interval '4 days 22 hours')::TIMESTAMPTZ, (now() + interval '365 days')::TIMESTAMPTZ, 'https://storage.example.com/exports/compliance-package-2024.pdf', 'compliance-package-2024.pdf', 10485760, 850, '{"template_version": "1.5", "data_sources": ["tx_compliance_requirements", "tx_compliance_evidence"], "generation_time_seconds": 180}'::TEXT, NULL),
    
    -- Running dashboard export
    ('dashboard_export', NULL, NULL, 'pdf', (now() - interval '24 hours')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"dashboard_code": "TX-GRID-OVERVIEW"}'::TEXT, 'running', 65, (now() - interval '5 minutes')::TIMESTAMPTZ, (now() - interval '4 minutes')::TIMESTAMPTZ, NULL, NULL, NULL, NULL, NULL, NULL, '{"template_version": "1.0", "data_sources": ["energy_telemetry", "energy_kpi_snapshots"]}'::TEXT, NULL),
    
    -- Pending cost analysis export
    ('data_export', NULL, NULL, 'excel', (now() - interval '1 month')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"dataset": "energy_tariffs", "include_cost_breakdown": true}'::TEXT, 'pending', 0, (now() - interval '2 minutes')::TIMESTAMPTZ, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"data_sources": ["energy_tariffs", "energy_kpi_snapshots"]}'::TEXT, NULL),
    
    -- Failed export (for testing error handling)
    ('report', NULL, NULL, 'pdf', (now() - interval '1 week')::TIMESTAMPTZ, now()::TIMESTAMPTZ, '{"report_type": "weekly_summary"}'::TEXT, 'failed', 35, (now() - interval '6 hours')::TIMESTAMPTZ, (now() - interval '6 hours')::TIMESTAMPTZ, NULL, NULL, NULL, NULL, NULL, NULL, '{"error": "Database connection timeout", "retry_count": 3}'::TEXT, NULL)
  ) AS v(
    job_type,
    template_id,
    dashboard_id,
    export_format,
    date_range_start,
    date_range_end,
    filters,
    status,
    progress_percentage,
    queued_at,
    started_at,
    completed_at,
    expires_at,
    output_file_url,
    output_file_name,
    output_file_size_bytes,
    row_count,
    generation_metadata,
    requested_by
  )
  -- Note: No natural key for export_jobs, so we insert without conflict handling
  -- This allows multiple exports with same parameters
  RETURNING id
),

-- ============================================================================
-- POSTCHECK VALIDATIONS
-- Verify data integrity after seeding
-- ============================================================================
postcheck_validations AS (
  SELECT 
    (SELECT COUNT(*) FROM upsert_energy_tariffs) as tariff_count,
    (SELECT COUNT(*) FROM upsert_dashboard_definitions) as dashboard_count,
    (SELECT COUNT(*) FROM upsert_export_jobs) as export_job_count
)

-- Final SELECT to display results
SELECT 
  'Dashboards seed completed' as status,
  tariff_count || ' tariffs seeded' as tariffs,
  dashboard_count || ' dashboards seeded' as dashboards,
  export_job_count || ' export jobs seeded' as export_jobs
FROM postcheck_validations;

-- ============================================================================
-- ADDITIONAL POSTCHECK ASSERTIONS
-- ============================================================================
DO $$
DECLARE
  v_tariff_count INTEGER;
  v_dashboard_count INTEGER;
  v_export_job_count INTEGER;
  v_default_tariff_count INTEGER;
  v_public_dashboard_count INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_tariff_count
  FROM energy_tariffs et
  INNER JOIN tenants t ON et.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  SELECT COUNT(*) INTO v_dashboard_count
  FROM dashboard_definitions dd
  INNER JOIN tenants t ON dd.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  SELECT COUNT(*) INTO v_export_job_count
  FROM export_jobs ej
  INNER JOIN tenants t ON ej.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  -- Verify at least expected counts
  IF v_tariff_count < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected at least 7 tariffs, found %', v_tariff_count;
  END IF;
  
  IF v_dashboard_count < 6 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected at least 6 dashboards, found %', v_dashboard_count;
  END IF;
  
  IF v_export_job_count < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected at least 7 export jobs, found %', v_export_job_count;
  END IF;
  
  -- Verify default tariff exists
  SELECT COUNT(*) INTO v_default_tariff_count
  FROM energy_tariffs et
  INNER JOIN tenants t ON et.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1'
    AND et.default_tariff = true
    AND et.active = true;
  
  IF v_default_tariff_count = 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: No default tariff found';
  END IF;
  
  -- Verify public dashboards exist
  SELECT COUNT(*) INTO v_public_dashboard_count
  FROM dashboard_definitions dd
  INNER JOIN tenants t ON dd.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1'
    AND dd.public_dashboard = true
    AND dd.published = true;
  
  IF v_public_dashboard_count = 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: No public dashboards found';
  END IF;
  
  -- Verify tariff natural key uniqueness
  IF EXISTS (
    SELECT org_id, tariff_code, COUNT(*)
    FROM energy_tariffs
    GROUP BY org_id, tariff_code
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Duplicate tariff natural keys found';
  END IF;
  
  -- Verify dashboard natural key uniqueness
  IF EXISTS (
    SELECT org_id, dashboard_code, COUNT(*)
    FROM dashboard_definitions
    GROUP BY org_id, dashboard_code
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Duplicate dashboard natural keys found';
  END IF;
  
  -- Verify tariff date validity
  IF EXISTS (
    SELECT id FROM energy_tariffs
    WHERE expiry_date IS NOT NULL AND expiry_date <= effective_date
  ) THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Invalid tariff date ranges found';
  END IF;
  
  -- Verify export job status validity
  IF EXISTS (
    SELECT id FROM export_jobs
    WHERE status NOT IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Invalid export job status found';
  END IF;
  
  RAISE NOTICE 'All postchecks passed: % tariffs, % dashboards, % export jobs', 
    v_tariff_count, v_dashboard_count, v_export_job_count;
  RAISE NOTICE 'Default tariffs: %, Public dashboards: %', 
    v_default_tariff_count, v_public_dashboard_count;
END $$;

-- Transaction handled by CLI
