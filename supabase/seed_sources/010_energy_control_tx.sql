-- Seed data for EMS Power Transmission - Control Extensions
-- Creates sample controllable loads, DR events, asset modes, control integrations, and efficiency curves
-- Uses CTE pattern with preconditions, idempotent upserts, and postchecks
-- Requirements: 13.1, 14.1, 16.1, 17.1

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
  
  RAISE NOTICE 'Preconditions passed: tenant (%), substations (%), feeders (%)', v_tenant_count, v_substation_count, v_feeder_count;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- 1) Get tenant UUID
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),

-- 2) Lookup substations
substations_lookup AS (
  SELECT s.id, s.code, s.name
  FROM tx_substations s
  INNER JOIN tenant t ON s.org_id = t.id
  WHERE s.code IN (
    'SS-DXB-MAIN',
    'SS-JA-MAIN',
    'SS-AW-MAIN',
    'SS-DXB-SOUTH'
  )
),

-- 3) Lookup feeders
feeders_lookup AS (
  SELECT f.id, f.feeder_code, f.name, s.code as substation_code
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  INNER JOIN tenant t ON s.org_id = t.id
  WHERE f.feeder_code IN (
    'FDR-OUT-01',
    'FDR-OUT-02',
    'FDR-IN-01'
  )
),

-- 4) Upsert controllable loads using natural key (org_id, load_code)
upsert_controllable_loads AS (
  INSERT INTO controllable_loads (
    org_id, load_code, name, description,
    substation_id, feeder_id,
    load_type, load_capacity_kw, min_load_kw, max_load_kw,
    controllable, control_method,
    current_mode, priority, shed_group,
    available_modes, status, active
  )
  SELECT 
    tenant.id,
    v.load_code,
    v.name,
    v.description,
    sub.id,
    fdr.id,
    v.load_type,
    v.load_capacity_kw,
    v.min_load_kw,
    v.max_load_kw,
    v.controllable,
    v.control_method,
    v.current_mode,
    v.priority,
    v.shed_group,
    v.available_modes,
    v.status,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- Transformer tap changers at Dubai Main
    ('LOAD-DXB-TAP-T1', 'Transformer T1 Tap Changer', 'Automatic tap changer for voltage regulation', 'SS-DXB-MAIN', NULL, 'transformer_tap', 50.0, 0.0, 100.0, true, 'scada', 'normal', 10, 'voltage_control', ARRAY['normal', 'reduced', 'off'], 'active', true),
    ('LOAD-DXB-TAP-T2', 'Transformer T2 Tap Changer', 'Automatic tap changer for voltage regulation', 'SS-DXB-MAIN', NULL, 'transformer_tap', 50.0, 0.0, 100.0, true, 'scada', 'normal', 10, 'voltage_control', ARRAY['normal', 'reduced', 'off'], 'active', true),
    
    -- Capacitor banks for reactive power compensation
    ('LOAD-DXB-CAP-01', 'Capacitor Bank 1 - 50 MVAR', 'Switched capacitor bank for power factor correction', 'SS-DXB-MAIN', 'FDR-OUT-01', 'capacitor_bank', 200.0, 0.0, 200.0, true, 'scada', 'normal', 20, 'reactive_power', ARRAY['on', 'off'], 'active', true),
    ('LOAD-DXB-CAP-02', 'Capacitor Bank 2 - 30 MVAR', 'Switched capacitor bank for power factor correction', 'SS-DXB-MAIN', 'FDR-OUT-02', 'capacitor_bank', 120.0, 0.0, 120.0, true, 'scada', 'normal', 20, 'reactive_power', ARRAY['on', 'off'], 'active', true),
    
    -- HVAC loads at substations
    ('LOAD-DXB-HVAC-01', 'Control Room HVAC', 'Air conditioning for control room', 'SS-DXB-MAIN', NULL, 'hvac', 150.0, 50.0, 150.0, true, 'bacnet', 'normal', 40, 'comfort', ARRAY['normal', 'reduced', 'standby'], 'active', true),
    ('LOAD-JA-HVAC-01', 'Control Room HVAC', 'Air conditioning for control room', 'SS-JA-MAIN', NULL, 'hvac', 180.0, 60.0, 180.0, true, 'bacnet', 'normal', 40, 'comfort', ARRAY['normal', 'reduced', 'standby'], 'active', true),
    
    -- Cooling pumps for transformers
    ('LOAD-DXB-PUMP-T1', 'Transformer T1 Cooling Pump', 'Oil cooling pump for transformer', 'SS-DXB-MAIN', NULL, 'pump', 75.0, 30.0, 75.0, true, 'modbus', 'normal', 15, 'cooling', ARRAY['normal', 'reduced', 'standby'], 'active', true),
    ('LOAD-JA-PUMP-T1', 'Transformer T1 Cooling Pump', 'Oil cooling pump for transformer', 'SS-JA-MAIN', NULL, 'pump', 90.0, 35.0, 90.0, true, 'modbus', 'normal', 15, 'cooling', ARRAY['normal', 'reduced', 'standby'], 'active', true),
    
    -- Lighting loads
    ('LOAD-DXB-LIGHT-01', 'Substation Lighting', 'Outdoor and indoor lighting', 'SS-DXB-MAIN', NULL, 'lighting', 30.0, 10.0, 30.0, true, 'manual', 'normal', 60, 'lighting', ARRAY['full', 'reduced', 'emergency', 'off'], 'active', true),
    ('LOAD-AW-LIGHT-01', 'Substation Lighting', 'Outdoor and indoor lighting', 'SS-AW-MAIN', NULL, 'lighting', 25.0, 8.0, 25.0, true, 'manual', 'normal', 60, 'lighting', ARRAY['full', 'reduced', 'emergency', 'off'], 'active', true),
    
    -- Battery storage systems
    ('LOAD-DXB-BESS-01', 'Battery Energy Storage System', '5 MWh battery storage for grid support', 'SS-DXB-MAIN', 'FDR-OUT-01', 'battery_storage', 2000.0, -2000.0, 2000.0, true, 'api', 'standby', 5, 'energy_storage', ARRAY['charging', 'discharging', 'standby', 'off'], 'active', true),
    
    -- EV chargers
    ('LOAD-DXB-EV-01', 'EV Charging Station', 'Electric vehicle charging for fleet', 'SS-DXB-MAIN', NULL, 'ev_charger', 100.0, 0.0, 100.0, true, 'api', 'normal', 70, 'ev_charging', ARRAY['full_power', 'reduced_power', 'off'], 'active', true)
  ) AS v(load_code, name, description, substation_code, feeder_code, load_type, load_capacity_kw, min_load_kw, max_load_kw, controllable, control_method, current_mode, priority, shed_group, available_modes, status, active)
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  LEFT JOIN feeders_lookup fdr ON fdr.feeder_code = v.feeder_code AND fdr.substation_code = v.substation_code
  ON CONFLICT (org_id, load_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    substation_id = EXCLUDED.substation_id,
    feeder_id = EXCLUDED.feeder_id,
    load_type = EXCLUDED.load_type,
    load_capacity_kw = EXCLUDED.load_capacity_kw,
    min_load_kw = EXCLUDED.min_load_kw,
    max_load_kw = EXCLUDED.max_load_kw,
    controllable = EXCLUDED.controllable,
    control_method = EXCLUDED.control_method,
    current_mode = EXCLUDED.current_mode,
    priority = EXCLUDED.priority,
    shed_group = EXCLUDED.shed_group,
    available_modes = EXCLUDED.available_modes,
    status = EXCLUDED.status,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, load_code, name
),

-- 5) Lookup controllable loads for asset modes (from upserted loads + existing)
loads_lookup AS (
  SELECT id, load_code, name FROM upsert_controllable_loads
  WHERE load_code IN (
    'LOAD-DXB-HVAC-01',
    'LOAD-JA-HVAC-01',
    'LOAD-DXB-PUMP-T1',
    'LOAD-JA-PUMP-T1',
    'LOAD-DXB-LIGHT-01',
    'LOAD-DXB-BESS-01',
    'LOAD-DXB-EV-01'
  )
  UNION ALL
  SELECT l.id, l.load_code, l.name
  FROM controllable_loads l
  INNER JOIN tenant t ON l.org_id = t.id
  WHERE l.load_code IN (
    'LOAD-DXB-HVAC-01',
    'LOAD-JA-HVAC-01',
    'LOAD-DXB-PUMP-T1',
    'LOAD-JA-PUMP-T1',
    'LOAD-DXB-LIGHT-01',
    'LOAD-DXB-BESS-01',
    'LOAD-DXB-EV-01'
  )
),

-- 6) Upsert asset modes using natural key (load_id, mode_code)
upsert_asset_modes AS (
  INSERT INTO asset_modes (
    org_id, load_id, mode_code, mode_name, description,
    power_consumption_kw, min_power_kw, max_power_kw,
    min_duration_minutes, transition_time_seconds,
    mode_type, efficiency_rating, comfort_impact, process_impact,
    default_mode, active
  )
  SELECT 
    tenant.id,
    load.id,
    v.mode_code,
    v.mode_name,
    v.description,
    v.power_consumption_kw,
    v.min_power_kw,
    v.max_power_kw,
    v.min_duration_minutes,
    v.transition_time_seconds,
    v.mode_type,
    v.efficiency_rating,
    v.comfort_impact,
    v.process_impact,
    v.default_mode,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- HVAC modes for DXB
    ('LOAD-DXB-HVAC-01', 'MODE-NORMAL', 'Normal Cooling', 'Full cooling capacity', 150.0, 140.0, 150.0, 15, 60, 'normal', 85.0, 'none', 'none', true, true),
    ('LOAD-DXB-HVAC-01', 'MODE-REDUCED', 'Reduced Cooling', 'Reduced cooling for demand response', 90.0, 80.0, 100.0, 30, 120, 'reduced', 80.0, 'minimal', 'none', false, true),
    ('LOAD-DXB-HVAC-01', 'MODE-STANDBY', 'Standby Mode', 'Minimum operation to maintain equipment', 30.0, 20.0, 40.0, 60, 180, 'standby', 60.0, 'moderate', 'none', false, true),
    
    -- HVAC modes for JA
    ('LOAD-JA-HVAC-01', 'MODE-NORMAL', 'Normal Cooling', 'Full cooling capacity', 180.0, 170.0, 180.0, 15, 60, 'normal', 85.0, 'none', 'none', true, true),
    ('LOAD-JA-HVAC-01', 'MODE-REDUCED', 'Reduced Cooling', 'Reduced cooling for demand response', 110.0, 100.0, 120.0, 30, 120, 'reduced', 80.0, 'minimal', 'none', false, true),
    ('LOAD-JA-HVAC-01', 'MODE-STANDBY', 'Standby Mode', 'Minimum operation to maintain equipment', 35.0, 25.0, 45.0, 60, 180, 'standby', 60.0, 'moderate', 'none', false, true),
    
    -- Pump modes for DXB
    ('LOAD-DXB-PUMP-T1', 'MODE-NORMAL', 'Normal Operation', 'Full flow rate', 75.0, 70.0, 75.0, 30, 30, 'normal', 90.0, 'none', 'none', true, true),
    ('LOAD-DXB-PUMP-T1', 'MODE-REDUCED', 'Reduced Flow', 'Reduced flow for demand response', 45.0, 40.0, 50.0, 60, 60, 'reduced', 85.0, 'none', 'minimal', false, true),
    ('LOAD-DXB-PUMP-T1', 'MODE-STANDBY', 'Standby Mode', 'Minimum circulation', 20.0, 15.0, 25.0, 120, 120, 'standby', 70.0, 'none', 'moderate', false, true),
    
    -- Pump modes for JA
    ('LOAD-JA-PUMP-T1', 'MODE-NORMAL', 'Normal Operation', 'Full flow rate', 90.0, 85.0, 90.0, 30, 30, 'normal', 90.0, 'none', 'none', true, true),
    ('LOAD-JA-PUMP-T1', 'MODE-REDUCED', 'Reduced Flow', 'Reduced flow for demand response', 55.0, 50.0, 60.0, 60, 60, 'reduced', 85.0, 'none', 'minimal', false, true),
    ('LOAD-JA-PUMP-T1', 'MODE-STANDBY', 'Standby Mode', 'Minimum circulation', 25.0, 20.0, 30.0, 120, 120, 'standby', 70.0, 'none', 'moderate', false, true),
    
    -- Lighting modes
    ('LOAD-DXB-LIGHT-01', 'MODE-FULL', 'Full Lighting', 'All lights at full brightness', 30.0, 28.0, 30.0, 0, 5, 'normal', 95.0, 'none', 'none', true, true),
    ('LOAD-DXB-LIGHT-01', 'MODE-REDUCED', 'Reduced Lighting', '50% brightness', 15.0, 14.0, 16.0, 0, 5, 'reduced', 90.0, 'minimal', 'none', false, true),
    ('LOAD-DXB-LIGHT-01', 'MODE-EMERGENCY', 'Emergency Lighting', 'Emergency lights only', 8.0, 7.0, 9.0, 0, 5, 'emergency', 85.0, 'significant', 'none', false, true),
    ('LOAD-DXB-LIGHT-01', 'MODE-OFF', 'Lights Off', 'All lights off', 0.0, 0.0, 0.0, 0, 5, 'off', 0.0, 'significant', 'none', false, true),
    
    -- Battery storage modes
    ('LOAD-DXB-BESS-01', 'MODE-CHARGING', 'Charging Mode', 'Charging from grid', 2000.0, 1500.0, 2000.0, 60, 30, 'normal', 95.0, 'none', 'none', false, true),
    ('LOAD-DXB-BESS-01', 'MODE-DISCHARGING', 'Discharging Mode', 'Discharging to grid', 2000.0, 1500.0, 2000.0, 60, 30, 'peak_shaving', 92.0, 'none', 'none', false, true),
    ('LOAD-DXB-BESS-01', 'MODE-STANDBY', 'Standby Mode', 'Ready to charge or discharge', 10.0, 5.0, 15.0, 0, 10, 'standby', 98.0, 'none', 'none', true, true),
    ('LOAD-DXB-BESS-01', 'MODE-OFF', 'System Off', 'Battery system offline', 0.0, 0.0, 0.0, 0, 60, 'off', 0.0, 'none', 'none', false, true),
    
    -- EV charger modes
    ('LOAD-DXB-EV-01', 'MODE-FULL', 'Full Power Charging', 'Maximum charging rate', 100.0, 90.0, 100.0, 30, 10, 'normal', 92.0, 'none', 'none', true, true),
    ('LOAD-DXB-EV-01', 'MODE-REDUCED', 'Reduced Power Charging', 'Reduced charging for demand response', 50.0, 40.0, 60.0, 60, 10, 'reduced', 90.0, 'none', 'minimal', false, true),
    ('LOAD-DXB-EV-01', 'MODE-OFF', 'Charging Off', 'No charging', 0.0, 0.0, 0.0, 0, 5, 'off', 0.0, 'none', 'moderate', false, true)
  ) AS v(load_code, mode_code, mode_name, description, power_consumption_kw, min_power_kw, max_power_kw, min_duration_minutes, transition_time_seconds, mode_type, efficiency_rating, comfort_impact, process_impact, default_mode, active)
  INNER JOIN loads_lookup load ON load.load_code = v.load_code
  ON CONFLICT (load_id, mode_code)
  DO UPDATE SET
    mode_name = EXCLUDED.mode_name,
    description = EXCLUDED.description,
    power_consumption_kw = EXCLUDED.power_consumption_kw,
    min_power_kw = EXCLUDED.min_power_kw,
    max_power_kw = EXCLUDED.max_power_kw,
    min_duration_minutes = EXCLUDED.min_duration_minutes,
    transition_time_seconds = EXCLUDED.transition_time_seconds,
    mode_type = EXCLUDED.mode_type,
    efficiency_rating = EXCLUDED.efficiency_rating,
    comfort_impact = EXCLUDED.comfort_impact,
    process_impact = EXCLUDED.process_impact,
    default_mode = EXCLUDED.default_mode,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, mode_code, mode_name
),

-- 7) Upsert demand response events using natural key (org_id, event_code)
upsert_demand_response_events AS (
  INSERT INTO demand_response_events (
    org_id, event_code, event_name, description,
    event_window_start, event_window_end,
    target_reduction_kw, actual_reduction_kw, baseline_load_kw,
    participating_loads, participating_load_capacity_kw,
    event_status, performance_percentage,
    estimated_savings_usd, actual_savings_usd,
    event_type, utility_program, trigger_condition
  )
  SELECT 
    tenant.id,
    v.event_code,
    v.event_name,
    v.description,
    v.event_window_start,
    v.event_window_end,
    v.target_reduction_kw,
    v.actual_reduction_kw,
    v.baseline_load_kw,
    ARRAY(
      SELECT l.id FROM controllable_loads l
      INNER JOIN tenant t ON l.org_id = t.id
      WHERE l.load_code = ANY(v.participating_load_codes)
    ),
    v.participating_load_capacity_kw,
    v.event_status,
    v.performance_percentage,
    v.estimated_savings_usd,
    v.actual_savings_usd,
    v.event_type,
    v.utility_program,
    v.trigger_condition
  FROM tenant
  CROSS JOIN (VALUES
    -- Completed DR event from last month
    ('DR-2025-01-15-PEAK', 'Peak Demand Response - Jan 15', 'Demand response during afternoon peak', 
     '2025-01-15 14:00:00+04'::TIMESTAMPTZ, '2025-01-15 17:00:00+04'::TIMESTAMPTZ,
     500.0, 485.0, 2500.0,
     ARRAY['LOAD-DXB-HVAC-01', 'LOAD-JA-HVAC-01', 'LOAD-DXB-EV-01', 'LOAD-DXB-LIGHT-01'],
     460.0, 'completed', 97.0, 1500.0, 1455.0,
     'utility_signal', 'DEWA Peak Demand Program', 'Utility signal received for peak demand reduction'),
    
    -- Completed DR event from 2 weeks ago
    ('DR-2025-01-22-PEAK', 'Peak Demand Response - Jan 22', 'Demand response during afternoon peak',
     '2025-01-22 14:30:00+04'::TIMESTAMPTZ, '2025-01-22 17:30:00+04'::TIMESTAMPTZ,
     600.0, 620.0, 2800.0,
     ARRAY['LOAD-DXB-HVAC-01', 'LOAD-JA-HVAC-01', 'LOAD-DXB-PUMP-T1', 'LOAD-JA-PUMP-T1', 'LOAD-DXB-EV-01'],
     590.0, 'completed', 103.3, 1800.0, 1860.0,
     'utility_signal', 'DEWA Peak Demand Program', 'Utility signal received for peak demand reduction'),
    
    -- Planned DR event for tomorrow
    ('DR-2025-01-23-PEAK', 'Peak Demand Response - Jan 23', 'Scheduled demand response for afternoon peak',
     '2025-01-23 14:00:00+04'::TIMESTAMPTZ, '2025-01-23 17:00:00+04'::TIMESTAMPTZ,
     550.0, NULL, 2600.0,
     ARRAY['LOAD-DXB-HVAC-01', 'LOAD-JA-HVAC-01', 'LOAD-DXB-BESS-01', 'LOAD-DXB-EV-01'],
     2510.0, 'planned', NULL, 1650.0, NULL,
     'automated', 'DEWA Peak Demand Program', 'Forecasted peak demand above threshold'),
    
    -- Planned DR event for next week
    ('DR-2025-01-29-PEAK', 'Peak Demand Response - Jan 29', 'Scheduled demand response for afternoon peak',
     '2025-01-29 13:30:00+04'::TIMESTAMPTZ, '2025-01-29 16:30:00+04'::TIMESTAMPTZ,
     700.0, NULL, 2900.0,
     ARRAY['LOAD-DXB-HVAC-01', 'LOAD-JA-HVAC-01', 'LOAD-DXB-PUMP-T1', 'LOAD-JA-PUMP-T1', 'LOAD-DXB-BESS-01', 'LOAD-DXB-EV-01', 'LOAD-DXB-LIGHT-01'],
     2735.0, 'planned', NULL, 2100.0, NULL,
     'price_response', 'DEWA Peak Demand Program', 'High electricity price forecast'),
    
    -- Cancelled DR event
    ('DR-2025-01-20-CANCELLED', 'Cancelled DR Event - Jan 20', 'DR event cancelled due to weather',
     '2025-01-20 14:00:00+04'::TIMESTAMPTZ, '2025-01-20 17:00:00+04'::TIMESTAMPTZ,
     500.0, NULL, 2500.0,
     ARRAY['LOAD-DXB-HVAC-01', 'LOAD-JA-HVAC-01'],
     330.0, 'cancelled', NULL, 1500.0, NULL,
     'manual', 'DEWA Peak Demand Program', 'Cooler weather reduced demand forecast')
  ) AS v(event_code, event_name, description, event_window_start, event_window_end, target_reduction_kw, actual_reduction_kw, baseline_load_kw, participating_load_codes, participating_load_capacity_kw, event_status, performance_percentage, estimated_savings_usd, actual_savings_usd, event_type, utility_program, trigger_condition)
  ON CONFLICT (org_id, event_code)
  DO UPDATE SET
    event_name = EXCLUDED.event_name,
    description = EXCLUDED.description,
    event_window_start = EXCLUDED.event_window_start,
    event_window_end = EXCLUDED.event_window_end,
    target_reduction_kw = EXCLUDED.target_reduction_kw,
    actual_reduction_kw = EXCLUDED.actual_reduction_kw,
    baseline_load_kw = EXCLUDED.baseline_load_kw,
    participating_loads = EXCLUDED.participating_loads,
    participating_load_capacity_kw = EXCLUDED.participating_load_capacity_kw,
    event_status = EXCLUDED.event_status,
    performance_percentage = EXCLUDED.performance_percentage,
    estimated_savings_usd = EXCLUDED.estimated_savings_usd,
    actual_savings_usd = EXCLUDED.actual_savings_usd,
    event_type = EXCLUDED.event_type,
    utility_program = EXCLUDED.utility_program,
    trigger_condition = EXCLUDED.trigger_condition,
    updated_at = now()
  RETURNING id, event_code, event_name
),

-- 8) Upsert control integrations using natural key (org_id, integration_code)
upsert_tx_control_integrations AS (
  INSERT INTO tx_control_integrations (
    org_id, integration_code, system_name, description,
    system_type, protocol, protocol_version,
    endpoint_host, endpoint_port,
    connectivity_status, last_sync_at, last_successful_sync_at,
    sync_interval_seconds, data_point_count,
    substation_id, read_only, auto_sync, active
  )
  SELECT 
    tenant.id,
    v.integration_code,
    v.system_name,
    v.description,
    v.system_type,
    v.protocol,
    v.protocol_version,
    v.endpoint_host,
    v.endpoint_port,
    v.connectivity_status,
    v.last_sync_at,
    v.last_successful_sync_at,
    v.sync_interval_seconds,
    v.data_point_count,
    sub.id,
    v.read_only,
    v.auto_sync,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- SCADA systems
    ('INT-SCADA-DXB', 'SCADA System - Dubai Main', 'Primary SCADA system for Dubai Main substation',
     'scada', 'iec61850', '2.0', 'scada-dxb.dewa.local', 102,
     'connected', now() - interval '5 minutes', now() - interval '5 minutes',
     60, 450, 'SS-DXB-MAIN', false, true, true),
    
    ('INT-SCADA-JA', 'SCADA System - Jebel Ali', 'Primary SCADA system for Jebel Ali substation',
     'scada', 'iec61850', '2.0', 'scada-ja.dewa.local', 102,
     'connected', now() - interval '3 minutes', now() - interval '3 minutes',
     60, 520, 'SS-JA-MAIN', false, true, true),
    
    ('INT-SCADA-AW', 'SCADA System - Al Aweer', 'Primary SCADA system for Al Aweer substation',
     'scada', 'dnp3', '3.0', 'scada-aw.dewa.local', 20000,
     'connected', now() - interval '2 minutes', now() - interval '2 minutes',
     60, 380, 'SS-AW-MAIN', false, true, true),
    
    -- EMS integration
    ('INT-EMS-CENTRAL', 'Central EMS', 'Central Energy Management System for grid operations',
     'ems', 'opcua', '1.04', 'ems-central.dewa.local', 4840,
     'connected', now() - interval '1 minute', now() - interval '1 minute',
     30, 1250, NULL, true, true, true),
    
    -- DERMS integration
    ('INT-DERMS-MAIN', 'DERMS Platform', 'Distributed Energy Resource Management System',
     'derms', 'rest_api', '2.0', 'derms.dewa.local', 443,
     'connected', now() - interval '10 minutes', now() - interval '10 minutes',
     300, 85, NULL, false, true, true),
    
    -- BMS for control rooms
    ('INT-BMS-DXB', 'Building Management System - Dubai', 'BMS for Dubai Main control building',
     'bms', 'bacnet', 'IP', 'bms-dxb.dewa.local', 47808,
     'connected', now() - interval '15 minutes', now() - interval '15 minutes',
     120, 65, 'SS-DXB-MAIN', false, true, true),
    
    -- Historian for data archival
    ('INT-HISTORIAN', 'PI Historian', 'OSIsoft PI Historian for long-term data storage',
     'historian', 'opcua', '1.04', 'historian.dewa.local', 5450,
     'connected', now() - interval '8 minutes', now() - interval '8 minutes',
     60, 2500, NULL, true, true, true)
  ) AS v(integration_code, system_name, description, system_type, protocol, protocol_version, endpoint_host, endpoint_port, connectivity_status, last_sync_at, last_successful_sync_at, sync_interval_seconds, data_point_count, substation_code, read_only, auto_sync, active)
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  ON CONFLICT (org_id, integration_code)
  DO UPDATE SET
    system_name = EXCLUDED.system_name,
    description = EXCLUDED.description,
    system_type = EXCLUDED.system_type,
    protocol = EXCLUDED.protocol,
    protocol_version = EXCLUDED.protocol_version,
    endpoint_host = EXCLUDED.endpoint_host,
    endpoint_port = EXCLUDED.endpoint_port,
    connectivity_status = EXCLUDED.connectivity_status,
    last_sync_at = EXCLUDED.last_sync_at,
    last_successful_sync_at = EXCLUDED.last_successful_sync_at,
    sync_interval_seconds = EXCLUDED.sync_interval_seconds,
    data_point_count = EXCLUDED.data_point_count,
    substation_id = EXCLUDED.substation_id,
    read_only = EXCLUDED.read_only,
    auto_sync = EXCLUDED.auto_sync,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, integration_code, system_name
),

-- 9) Upsert efficiency curves using natural key (org_id, curve_code)
upsert_efficiency_curves AS (
  INSERT INTO efficiency_curves (
    org_id, curve_code, curve_name, description,
    equipment_type, load_points, efficiency_points,
    curve_type, source, measurement_date,
    rated_capacity_kw, rated_voltage_kv,
    effective_date, active
  )
  SELECT 
    tenant.id,
    v.curve_code,
    v.curve_name,
    v.description,
    v.equipment_type,
    v.load_points,
    v.efficiency_points,
    v.curve_type,
    v.source,
    v.measurement_date,
    v.rated_capacity_kw,
    v.rated_voltage_kv,
    v.effective_date,
    v.active
  FROM tenant
  CROSS JOIN (VALUES
    -- Transformer efficiency curves
    ('CURVE-TX-400-132-50MVA', 'Transformer 400/132kV 50MVA Efficiency', 'Typical efficiency curve for 400/132kV 50MVA transformer',
     'transformer', 
     ARRAY[10.0, 25.0, 50.0, 75.0, 100.0, 110.0, 120.0]::DECIMAL(5,2)[],
     ARRAY[98.2, 98.8, 99.2, 99.3, 99.2, 99.0, 98.7]::DECIMAL(5,2)[],
     'manufacturer', 'ABB Transformer Datasheet', '2024-01-15'::DATE,
     50000.0, 400.0, '2024-01-01'::DATE, true),
    
    ('CURVE-TX-220-132-30MVA', 'Transformer 220/132kV 30MVA Efficiency', 'Typical efficiency curve for 220/132kV 30MVA transformer',
     'transformer',
     ARRAY[10.0, 25.0, 50.0, 75.0, 100.0, 110.0]::DECIMAL(5,2)[],
     ARRAY[98.0, 98.6, 99.0, 99.1, 99.0, 98.8]::DECIMAL(5,2)[],
     'manufacturer', 'Siemens Transformer Datasheet', '2024-02-10'::DATE,
     30000.0, 220.0, '2024-02-01'::DATE, true),
    
    -- Motor efficiency curves
    ('CURVE-MOTOR-75KW', 'Motor 75kW Efficiency', 'Efficiency curve for 75kW induction motor',
     'motor',
     ARRAY[25.0, 50.0, 75.0, 100.0]::DECIMAL(5,2)[],
     ARRAY[88.5, 91.2, 92.5, 92.0]::DECIMAL(5,2)[],
     'manufacturer', 'WEG Motor Datasheet', '2023-11-20'::DATE,
     75.0, NULL, '2023-11-01'::DATE, true),
    
    ('CURVE-MOTOR-90KW', 'Motor 90kW Efficiency', 'Efficiency curve for 90kW induction motor',
     'motor',
     ARRAY[25.0, 50.0, 75.0, 100.0]::DECIMAL(5,2)[],
     ARRAY[89.0, 91.5, 92.8, 92.3]::DECIMAL(5,2)[],
     'manufacturer', 'WEG Motor Datasheet', '2023-11-20'::DATE,
     90.0, NULL, '2023-11-01'::DATE, true),
    
    -- Pump efficiency curves
    ('CURVE-PUMP-CENTRIFUGAL', 'Centrifugal Pump Efficiency', 'Typical efficiency curve for centrifugal cooling pump',
     'pump',
     ARRAY[20.0, 40.0, 60.0, 80.0, 100.0, 110.0]::DECIMAL(5,2)[],
     ARRAY[65.0, 75.0, 82.0, 85.0, 83.0, 78.0]::DECIMAL(5,2)[],
     'industry_standard', 'Hydraulic Institute Standards', '2024-01-01'::DATE,
     75.0, NULL, '2024-01-01'::DATE, true),
    
    -- Chiller efficiency curves (for HVAC)
    ('CURVE-CHILLER-150KW', 'Chiller 150kW Efficiency', 'Efficiency curve for 150kW air-cooled chiller',
     'chiller',
     ARRAY[25.0, 50.0, 75.0, 100.0]::DECIMAL(5,2)[],
     ARRAY[2.8, 3.2, 3.5, 3.3]::DECIMAL(5,2)[],  -- COP values
     'measured', 'On-site measurement campaign', '2024-03-15'::DATE,
     150.0, NULL, '2024-03-01'::DATE, true),
    
    ('CURVE-CHILLER-180KW', 'Chiller 180kW Efficiency', 'Efficiency curve for 180kW air-cooled chiller',
     'chiller',
     ARRAY[25.0, 50.0, 75.0, 100.0]::DECIMAL(5,2)[],
     ARRAY[2.9, 3.3, 3.6, 3.4]::DECIMAL(5,2)[],  -- COP values
     'measured', 'On-site measurement campaign', '2024-03-15'::DATE,
     180.0, NULL, '2024-03-01'::DATE, true),
    
    -- Inverter efficiency curves (for battery storage)
    ('CURVE-INVERTER-2MW', 'Inverter 2MW Efficiency', 'Efficiency curve for 2MW battery inverter',
     'inverter',
     ARRAY[10.0, 25.0, 50.0, 75.0, 100.0]::DECIMAL(5,2)[],
     ARRAY[95.5, 97.0, 98.0, 98.2, 98.0]::DECIMAL(5,2)[],
     'manufacturer', 'SMA Inverter Datasheet', '2024-04-01'::DATE,
     2000.0, NULL, '2024-04-01'::DATE, true)
  ) AS v(curve_code, curve_name, description, equipment_type, load_points, efficiency_points, curve_type, source, measurement_date, rated_capacity_kw, rated_voltage_kv, effective_date, active)
  ON CONFLICT (org_id, curve_code)
  DO UPDATE SET
    curve_name = EXCLUDED.curve_name,
    description = EXCLUDED.description,
    equipment_type = EXCLUDED.equipment_type,
    load_points = EXCLUDED.load_points,
    efficiency_points = EXCLUDED.efficiency_points,
    curve_type = EXCLUDED.curve_type,
    source = EXCLUDED.source,
    measurement_date = EXCLUDED.measurement_date,
    rated_capacity_kw = EXCLUDED.rated_capacity_kw,
    rated_voltage_kv = EXCLUDED.rated_voltage_kv,
    effective_date = EXCLUDED.effective_date,
    active = EXCLUDED.active,
    updated_at = now()
  RETURNING id, curve_code, curve_name
),

-- ============================================================================
-- POSTCHECKS - Validate data integrity
-- ============================================================================
postchecks AS (
  SELECT
    -- Count inserted/updated records
    (SELECT COUNT(*) FROM upsert_controllable_loads) as controllable_loads_count,
    (SELECT COUNT(*) FROM upsert_asset_modes) as asset_modes_count,
    (SELECT COUNT(*) FROM upsert_demand_response_events) as dr_events_count,
    (SELECT COUNT(*) FROM upsert_tx_control_integrations) as integrations_count,
    (SELECT COUNT(*) FROM upsert_efficiency_curves) as efficiency_curves_count,
    
    -- Validate foreign key integrity
    (SELECT COUNT(*) FROM controllable_loads cl
     INNER JOIN tenant t ON cl.org_id = t.id
     WHERE cl.substation_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM tx_substations WHERE id = cl.substation_id)) as orphan_loads_substation,
    
    (SELECT COUNT(*) FROM controllable_loads cl
     INNER JOIN tenant t ON cl.org_id = t.id
     WHERE cl.feeder_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM tx_feeders WHERE id = cl.feeder_id)) as orphan_loads_feeder,
    
    (SELECT COUNT(*) FROM asset_modes am
     INNER JOIN tenant t ON am.org_id = t.id
     WHERE NOT EXISTS (SELECT 1 FROM controllable_loads WHERE id = am.load_id)) as orphan_modes,
    
    -- Validate natural key uniqueness
    (SELECT COUNT(*) - COUNT(DISTINCT (org_id, load_code)) 
     FROM controllable_loads cl
     INNER JOIN tenant t ON cl.org_id = t.id) as duplicate_load_codes,
    
    (SELECT COUNT(*) - COUNT(DISTINCT (load_id, mode_code))
     FROM asset_modes am
     INNER JOIN tenant t ON am.org_id = t.id) as duplicate_mode_codes,
    
    (SELECT COUNT(*) - COUNT(DISTINCT (org_id, event_code))
     FROM demand_response_events dre
     INNER JOIN tenant t ON dre.org_id = t.id) as duplicate_event_codes,
    
    (SELECT COUNT(*) - COUNT(DISTINCT (org_id, integration_code))
     FROM tx_control_integrations tci
     INNER JOIN tenant t ON tci.org_id = t.id) as duplicate_integration_codes,
    
    (SELECT COUNT(*) - COUNT(DISTINCT (org_id, curve_code))
     FROM efficiency_curves ec
     INNER JOIN tenant t ON ec.org_id = t.id) as duplicate_curve_codes,
    
    -- Validate business rules
    (SELECT COUNT(*) FROM controllable_loads cl
     INNER JOIN tenant t ON cl.org_id = t.id
     WHERE cl.load_capacity_kw <= 0) as invalid_capacity,
    
    (SELECT COUNT(*) FROM asset_modes am
     INNER JOIN tenant t ON am.org_id = t.id
     WHERE am.power_consumption_kw < 0 AND am.mode_type != 'charging') as invalid_power_consumption,
    
    (SELECT COUNT(*) FROM demand_response_events dre
     INNER JOIN tenant t ON dre.org_id = t.id
     WHERE dre.event_window_end <= dre.event_window_start) as invalid_event_windows,
    
    (SELECT COUNT(*) FROM efficiency_curves ec
     INNER JOIN tenant t ON ec.org_id = t.id
     WHERE array_length(ec.load_points, 1) != array_length(ec.efficiency_points, 1)) as mismatched_curve_arrays
)

-- Output postcheck results
SELECT 
  'Controllable Loads' as entity,
  controllable_loads_count as inserted_count,
  CASE 
    WHEN controllable_loads_count >= 12 THEN '✓ PASS'
    ELSE '✗ FAIL: Expected at least 12 loads'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Asset Modes' as entity,
  asset_modes_count as inserted_count,
  CASE 
    WHEN asset_modes_count >= 24 THEN '✓ PASS'
    ELSE '✗ FAIL: Expected at least 24 modes'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'DR Events' as entity,
  dr_events_count as inserted_count,
  CASE 
    WHEN dr_events_count >= 5 THEN '✓ PASS'
    ELSE '✗ FAIL: Expected at least 5 events'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Control Integrations' as entity,
  integrations_count as inserted_count,
  CASE 
    WHEN integrations_count >= 7 THEN '✓ PASS'
    ELSE '✗ FAIL: Expected at least 7 integrations'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Efficiency Curves' as entity,
  efficiency_curves_count as inserted_count,
  CASE 
    WHEN efficiency_curves_count >= 8 THEN '✓ PASS'
    ELSE '✗ FAIL: Expected at least 8 curves'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'FK Integrity - Loads→Substations' as entity,
  orphan_loads_substation as error_count,
  CASE 
    WHEN orphan_loads_substation = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Orphaned load records found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'FK Integrity - Loads→Feeders' as entity,
  orphan_loads_feeder as error_count,
  CASE 
    WHEN orphan_loads_feeder = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Orphaned load records found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'FK Integrity - Modes→Loads' as entity,
  orphan_modes as error_count,
  CASE 
    WHEN orphan_modes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Orphaned mode records found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Natural Key Uniqueness - Loads' as entity,
  duplicate_load_codes as error_count,
  CASE 
    WHEN duplicate_load_codes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate load codes found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Natural Key Uniqueness - Modes' as entity,
  duplicate_mode_codes as error_count,
  CASE 
    WHEN duplicate_mode_codes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate mode codes found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Natural Key Uniqueness - Events' as entity,
  duplicate_event_codes as error_count,
  CASE 
    WHEN duplicate_event_codes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate event codes found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Natural Key Uniqueness - Integrations' as entity,
  duplicate_integration_codes as error_count,
  CASE 
    WHEN duplicate_integration_codes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate integration codes found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Natural Key Uniqueness - Curves' as entity,
  duplicate_curve_codes as error_count,
  CASE 
    WHEN duplicate_curve_codes = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate curve codes found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Business Rule - Load Capacity' as entity,
  invalid_capacity as error_count,
  CASE 
    WHEN invalid_capacity = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Loads with invalid capacity found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Business Rule - Power Consumption' as entity,
  invalid_power_consumption as error_count,
  CASE 
    WHEN invalid_power_consumption = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Modes with invalid power consumption found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Business Rule - Event Windows' as entity,
  invalid_event_windows as error_count,
  CASE 
    WHEN invalid_event_windows = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Events with invalid time windows found'
  END as status
FROM postchecks
UNION ALL
SELECT 
  'Business Rule - Curve Arrays' as entity,
  mismatched_curve_arrays as error_count,
  CASE 
    WHEN mismatched_curve_arrays = 0 THEN '✓ PASS'
    ELSE '✗ FAIL: Curves with mismatched array lengths found'
  END as status
FROM postchecks;

COMMIT;
