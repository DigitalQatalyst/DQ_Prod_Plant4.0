-- Seed data for Power Transmission telemetry and alerts
-- This creates 10 tags, 30 telemetry points and 12 alerts with mixed source_types
-- Uses clean CTE pattern with UUID generation (no explicit string IDs)
-- Seeds now hard-fail with meaningful messages if preconditions are unmet.

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_asset_count INTEGER;
  v_asset_type_count INTEGER;
BEGIN
  -- 1) Verify tenant exists exactly
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Tenant "DEWA - Transmission" (power/transmission/power_transmission_demo_v1) does not exist. Run 001_transmission_tenant.sql first.';
  END IF;
  
  IF v_tenant_count > 1 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Multiple tenants found matching "DEWA - Transmission". Expected exactly 1, found %.', v_tenant_count;
  END IF;

  -- 2) Verify required asset_types exist (TRANSFORMER, BREAKER, BAY, METER)
  SELECT COUNT(*) INTO v_asset_type_count
  FROM asset_types at
  INNER JOIN tenants t ON at.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1'
    AND at.code IN ('TRANSFORMER', 'BREAKER', 'BAY', 'METER');
  
  IF v_asset_type_count < 4 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected 4 asset_types (TRANSFORMER, BREAKER, BAY, METER), found %. Run 003_assets.sql first.', v_asset_type_count;
  END IF;

  -- 3) Verify required assets exist (at least 15)
  SELECT COUNT(*) INTO v_asset_count
  FROM assets a
  INNER JOIN tenants t ON a.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_asset_count < 15 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected at least 15 assets, found %. Run 003_assets.sql first.', v_asset_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, asset_types=%, assets=%', v_asset_type_count, v_asset_count;
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
-- 2) Upsert tags for telemetry communication (join directly to assets by tenant+name)
upsert_tags AS (
  INSERT INTO tags (tenant_id, asset_id, protocol, address, name)
  SELECT 
    tenant.id,
    a.id,
    v.protocol::telemetry_protocol,
    v.address,
    v.name
  FROM tenant
  CROSS JOIN (VALUES
    ('Dubai T1 Main Transformer', 'IEC61850', 'MMXU1.PhV.phsA.cVal.mag.f', 'T1 Primary Voltage A'),
    ('Dubai T1 Main Transformer', 'IEC61850', 'MMXU1.A.phsA.cVal.mag.f', 'T1 Primary Current A'),
    ('Dubai T1 Main Transformer', 'IEC61850', 'STMP1.Tmp.mag.f', 'T1 Oil Temperature'),
    ('Dubai 400kV Incomer CB', 'IEC61850', 'XCBR1.Pos.stVal', 'CB1 Position Status'),
    ('Jebel Ali T1 Main Transformer', 'IEC61850', 'MMXU1.PhV.phsA.cVal.mag.f', 'T1 Primary Voltage'),
    ('Jebel Ali T1 Main Transformer', 'IEC61850', 'MMXU1.A.phsA.cVal.mag.f', 'T1 Primary Current'),
    ('Jebel Ali T1 Main Transformer', 'IEC61850', 'STMP1.Tmp.mag.f', 'T1 Oil Temperature'),
    ('Jebel Ali 400kV Incomer CB', 'IEC61850', 'XCBR1.Pos.stVal', 'CB1 Position Status'),
    ('Al Aweer T1 Main Transformer', 'IEC61850', 'MMXU1.PhV.phsA.cVal.mag.f', 'T1 Primary Voltage'),
    ('Al Aweer T1 Main Transformer', 'IEC61850', 'MMXU1.A.phsA.cVal.mag.f', 'T1 Primary Current')
  ) AS v(asset_name, protocol, address, name)
  INNER JOIN assets a ON a.tenant_id = tenant.id AND a.name = v.asset_name
  ON CONFLICT (tenant_id, asset_id, protocol, address)
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id, asset_id, address
),
-- 3) Upsert telemetry points WITH tags (join directly to assets and tags by tenant+name/address)
upsert_telemetry_with_tag AS (
  INSERT INTO telemetry_points (tenant_id, asset_id, tag_id, metric, unit, limits)
  SELECT 
    tenant.id,
    a.id,
    t.id,
    v.metric,
    v.unit,
    v.limits::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    -- Dubai Main Substation assets telemetry (with tags)
    ('Dubai T1 Main Transformer', 'MMXU1.PhV.phsA.cVal.mag.f', 'voltage_primary', 'kV', '{"min": 360, "max": 440, "warning": 380, "critical": 460}'),
    ('Dubai T1 Main Transformer', 'MMXU1.A.phsA.cVal.mag.f', 'current_primary', 'A', '{"min": 0, "max": 3150, "warning": 2520, "critical": 2993}'),
    ('Dubai T1 Main Transformer', 'STMP1.Tmp.mag.f', 'oil_temperature', '°C', '{"min": 10, "max": 115, "warning": 95, "critical": 105}'),
    ('Dubai 400kV Incomer CB', 'XCBR1.Pos.stVal', 'breaker_status', 'bool', '{"states": ["open", "closed"]}'),
    -- Jebel Ali Grid Station assets telemetry (with tags)
    ('Jebel Ali T1 Main Transformer', 'MMXU1.PhV.phsA.cVal.mag.f', 'voltage_primary', 'kV', '{"min": 360, "max": 440, "warning": 380, "critical": 460}'),
    ('Jebel Ali T1 Main Transformer', 'MMXU1.A.phsA.cVal.mag.f', 'current_primary', 'A', '{"min": 0, "max": 4000, "warning": 3200, "critical": 3800}'),
    ('Jebel Ali T1 Main Transformer', 'STMP1.Tmp.mag.f', 'oil_temperature', '°C', '{"min": 10, "max": 115, "warning": 95, "critical": 105}'),
    ('Jebel Ali 400kV Incomer CB', 'XCBR1.Pos.stVal', 'breaker_status', 'bool', '{"states": ["open", "closed"]}'),
    -- Al Aweer Regional Hub assets telemetry (with tags)
    ('Al Aweer T1 Main Transformer', 'MMXU1.PhV.phsA.cVal.mag.f', 'voltage_primary', 'kV', '{"min": 198, "max": 242, "warning": 209, "critical": 253}'),
    ('Al Aweer T1 Main Transformer', 'MMXU1.A.phsA.cVal.mag.f', 'current_primary', 'A', '{"min": 0, "max": 2000, "warning": 1600, "critical": 1900}')
  ) AS v(asset_name, tag_address, metric, unit, limits)
  INNER JOIN assets a ON a.tenant_id = tenant.id AND a.name = v.asset_name
  INNER JOIN tags t ON t.tenant_id = tenant.id AND t.asset_id = a.id AND t.address = v.tag_address
  ON CONFLICT (tenant_id, asset_id, metric, tag_id) WHERE tag_id IS NOT NULL
  DO UPDATE SET
    unit = EXCLUDED.unit,
    limits = EXCLUDED.limits
  RETURNING id, metric
),
-- 4) Upsert telemetry points WITHOUT tags (join directly to assets by tenant+name)
upsert_telemetry_no_tag AS (
  INSERT INTO telemetry_points (tenant_id, asset_id, tag_id, metric, unit, limits)
  SELECT 
    tenant.id,
    a.id,
    NULL,
    v.metric,
    v.unit,
    v.limits::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('Dubai T1 Main Transformer', 'voltage_secondary', 'kV', '{"min": 118.8, "max": 145.2, "warning": 125.4, "critical": 152.46}'),
    ('Dubai T1 Main Transformer', 'active_power', 'MW', '{"min": 0, "max": 250, "warning": 200, "critical": 238}'),
    ('Dubai T1 Main Transformer', 'transformer_oil_temp_c', '°C', '{"min": 10, "max": 115, "warning": 95, "critical": 105}'),
    ('Dubai T1 Main Transformer', 'transformer_winding_temp_c', '°C', '{"min": 20, "max": 140, "warning": 120, "critical": 130}'),
    ('Dubai T2 Backup Transformer', 'voltage_primary', 'kV', '{"min": 360, "max": 440, "warning": 380, "critical": 460}'),
    ('Dubai T2 Backup Transformer', 'current_primary', 'A', '{"min": 0, "max": 2520, "warning": 2016, "critical": 2394}'),
    ('Dubai T2 Backup Transformer', 'oil_temperature', '°C', '{"min": 10, "max": 115, "warning": 95, "critical": 105}'),
    ('Dubai T2 Backup Transformer', 'transformer_tap_position', 'step', '{"min": -16, "max": 16, "warning": null, "critical": null}'),
    ('Dubai 400kV Incomer CB', 'current', 'A', '{"min": 0, "max": 3150, "warning": 2520, "critical": 2993}'),
    ('Dubai 400kV Incomer CB', 'breaker_sf6_pressure_bar', 'bar', '{"min": 5.5, "max": 7.5, "warning": 6.0, "critical": 5.8}'),
    ('Dubai 400kV Incomer CB', 'breaker_operation_count', 'count', '{"min": 0, "max": 10000, "warning": 8000, "critical": 9500}'),
    ('Dubai 132kV Feeder CB', 'breaker_status', 'bool', '{"states": ["open", "closed"]}'),
    ('Dubai 132kV Feeder CB', 'current', 'A', '{"min": 0, "max": 2000, "warning": 1600, "critical": 1900}'),
    ('Dubai 400kV Bay 1', 'bay_busbar_temp_c', '°C', '{"min": 10, "max": 90, "warning": 70, "critical": 80}'),
    ('Dubai Main Feeder Meter', 'active_energy', 'MWh', '{"min": 0, "max": 999999, "warning": null, "critical": null}'),
    ('Dubai Main Feeder Meter', 'reactive_energy', 'MVArh', '{"min": -50000, "max": 50000, "warning": null, "critical": null}'),
    ('Dubai Main Feeder Meter', 'meter_power_factor', 'pf', '{"min": 0.8, "max": 1.0, "warning": 0.85, "critical": 0.82}'),
    ('Jebel Ali T1 Main Transformer', 'voltage_secondary', 'kV', '{"min": 118.8, "max": 145.2, "warning": 125.4, "critical": 152.46}'),
    ('Jebel Ali T1 Main Transformer', 'active_power', 'MW', '{"min": 0, "max": 300, "warning": 240, "critical": 285}'),
    ('Jebel Ali 400kV Incomer CB', 'current', 'A', '{"min": 0, "max": 4000, "warning": 3200, "critical": 3800}'),
    ('Jebel Ali 132kV Feeder CB', 'breaker_status', 'bool', '{"states": ["open", "closed"]}'),
    ('Jebel Ali 132kV Feeder CB', 'current', 'A', '{"min": 0, "max": 2500, "warning": 2000, "critical": 2375}'),
    ('Jebel Ali 400kV Bay 1', 'line_frequency_hz', 'Hz', '{"min": 49.5, "max": 50.5, "warning": 49.8, "critical": 49.6}'),
    ('Jebel Ali Import Meter', 'active_energy', 'MWh', '{"min": 0, "max": 999999, "warning": null, "critical": null}'),
    ('Jebel Ali Import Meter', 'line_reactive_power_mvar', 'MVAr', '{"min": -100, "max": 100, "warning": null, "critical": null}'),
    ('Al Aweer T1 Main Transformer', 'oil_temperature', '°C', '{"min": 10, "max": 115, "warning": 95, "critical": 105}'),
    ('Al Aweer T1 Main Transformer', 'voltage_secondary', 'kV', '{"min": 118.8, "max": 145.2, "warning": 125.4, "critical": 152.46}'),
    ('Al Aweer 220kV Incomer CB', 'breaker_status', 'bool', '{"states": ["open", "closed"]}'),
    ('Al Aweer 220kV Bay 1', 'line_current_a', 'A', '{"min": 0, "max": 2000, "warning": 1600, "critical": 1900}'),
    ('Al Aweer Regional Meter', 'active_energy', 'MWh', '{"min": 0, "max": 999999, "warning": null, "critical": null}')
  ) AS v(asset_name, metric, unit, limits)
  INNER JOIN assets a ON a.tenant_id = tenant.id AND a.name = v.asset_name
  ON CONFLICT (tenant_id, asset_id, metric) WHERE tag_id IS NULL
  DO UPDATE SET
    unit = EXCLUDED.unit,
    limits = EXCLUDED.limits
  RETURNING id, metric
),
-- 5) Upsert alerts with mixed source_types (join directly to assets/grid_nodes/grid_lines by tenant+name)
upsert_alerts AS (
  INSERT INTO alerts (tenant_id, source_type, source_id, severity, status, title, created_at, payload)
  SELECT 
    tenant.id,
    v.source_type::alert_source_type,
    CASE 
      WHEN v.source_type = 'asset' THEN a.id
      WHEN v.source_type = 'grid_node' THEN gn.id
      WHEN v.source_type = 'grid_line' THEN gl.id
      ELSE NULL
    END,
    v.severity::alert_severity,
    v.status::alert_status,
    v.title,
    v.created_at::timestamptz,
    v.payload::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('asset', 'Dubai T1 Main Transformer', NULL, NULL, 'warning', 'open', 'Transformer T1 Oil Temperature High', '2024-01-07 08:30:00+00', '{"temperature": 98.5, "threshold": 95, "trend": "increasing"}'),
    ('asset', 'Jebel Ali 400kV Incomer CB', NULL, NULL, 'critical', 'acknowledged', 'Circuit Breaker CB1 Maintenance Required', '2024-01-07 06:15:00+00', '{"maintenance_type": "scheduled", "due_date": "2024-01-15", "priority": "high"}'),
    ('grid_line', NULL, 'Dubai-Jebel Ali Direct', NULL, 'warning', 'in-progress', 'Transmission Line Under Maintenance', '2024-01-06 14:20:00+00', '{"maintenance_window": "2024-01-06 to 2024-01-08", "impact": "reduced_capacity"}'),
    ('asset', 'Al Aweer 220kV Bay 1', NULL, NULL, 'critical', 'open', 'Switchgear Bay Offline', '2024-01-07 09:45:00+00', '{"reason": "equipment_failure", "estimated_repair": "4_hours"}'),
    ('grid_node', NULL, NULL, 'Central Grid Hub', 'info', 'closed', 'Load Transfer Completed Successfully', '2024-01-07 07:00:00+00', '{"transferred_load": "85_MW", "from": "node-dubai-main", "to": "node-jebel-ali-main"}'),
    ('security', NULL, NULL, NULL, 'warning', 'open', 'Unauthorized Access Attempt Detected', '2024-01-07 10:15:00+00', '{"source_ip": "10.20.30.100", "target_system": "SCADA", "attempts": 3}'),
    ('asset', 'Dubai T2 Backup Transformer', NULL, NULL, 'info', 'closed', 'Transformer T2 Load Increased', '2024-01-07 05:30:00+00', '{"load_mw": 115.2, "previous_mw": 98.7, "capacity_percent": 72.0}'),
    ('automation', NULL, NULL, NULL, 'warning', 'acknowledged', 'Automatic Load Shedding Activated', '2024-01-07 11:00:00+00', '{"shed_amount": "25_MW", "affected_feeders": ["F1", "F3", "F7"], "duration": "30_minutes"}'),
    ('asset', 'Jebel Ali T1 Main Transformer', NULL, NULL, 'critical', 'open', 'Transformer Overload Condition', '2024-01-07 11:30:00+00', '{"load_percent": 103.2, "rated_capacity": 300, "current_load": 310}'),
    ('grid_line', NULL, 'Central-Al Aweer Main Line', NULL, 'warning', 'open', 'Line Loading Above Normal', '2024-01-07 10:45:00+00', '{"loading_percent": 89.3, "thermal_limit": "220_A", "current_flow": "196_A"}'),
    ('security', NULL, NULL, NULL, 'info', 'closed', 'Firmware Update Completed', '2024-01-07 02:00:00+00', '{"devices_updated": 15, "firmware_version": "v2.2.1", "success_rate": "100%"}'),
    ('automation', NULL, NULL, NULL, 'critical', 'in-progress', 'Protection System Malfunction', '2024-01-07 11:45:00+00', '{"affected_zone": "400kV_bus", "backup_protection": "active", "estimated_fix": "2_hours"}')
  ) AS v(source_type, asset_name, line_name, node_name, severity, status, title, created_at, payload)
  LEFT JOIN assets a ON a.tenant_id = tenant.id AND a.name = v.asset_name
  LEFT JOIN grid_lines gl ON gl.tenant_id = tenant.id AND gl.name = v.line_name
  LEFT JOIN grid_nodes gn ON gn.tenant_id = tenant.id AND gn.name = v.node_name
  ON CONFLICT (tenant_id, title, created_at, source_type, COALESCE(source_id::text, 'NULL'))
  DO UPDATE SET
    severity = EXCLUDED.severity,
    status = EXCLUDED.status,
    payload = EXCLUDED.payload
  RETURNING id, title
)
SELECT COUNT(*) FROM upsert_alerts;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_telemetry_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_telemetry_count
  FROM telemetry_points tp
  INNER JOIN assets a ON a.id = tp.asset_id
  INNER JOIN tenants t ON t.id = a.tenant_id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_telemetry_count < 30 THEN
    RAISE EXCEPTION 'SEED 004_telemetry_alerts.sql FAILED: expected >= 30 telemetry_points for DEWA tenant, found %', v_telemetry_count;
  END IF;
  
  RAISE NOTICE 'Seed 004_telemetry_alerts.sql OK: telemetry_points=%', v_telemetry_count;
END $$;

COMMIT;
