-- Seed data for SIM (Shift Intelligence Management) feature set
-- This creates shifts, boards, KPIs, switching orders, outages, issues, and actions for DEWA Transmission tenant
-- Uses clean CTE pattern with UUID generation (no explicit string IDs)
-- Seeds now hard-fail with meaningful messages if preconditions are unmet.
-- LOCAL DATABASE ONLY: This seed should ONLY be run against local Supabase instance

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_site_count INTEGER;
  v_asset_count INTEGER;
  v_node_count INTEGER;
  v_line_count INTEGER;
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

  -- 2) Verify required sites exist (count >= 3)
  SELECT COUNT(*) INTO v_site_count
  FROM sites s
  INNER JOIN tenants t ON s.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_site_count < 3 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 3 sites for DEWA tenant, found %. Run 001_transmission_tenant.sql first.', v_site_count;
  END IF;

  -- 3) Verify assets exist (count >= 10)
  SELECT COUNT(*) INTO v_asset_count
  FROM assets a
  INNER JOIN tenants t ON a.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_asset_count < 10 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 10 assets for DEWA tenant, found %. Run 003_assets.sql first.', v_asset_count;
  END IF;

  -- 4) Verify grid nodes exist (count >= 3)
  SELECT COUNT(*) INTO v_node_count
  FROM grid_nodes gn
  INNER JOIN tenants t ON gn.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_node_count < 3 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 3 grid nodes for DEWA tenant, found %. Run 002_grid_topology.sql first.', v_node_count;
  END IF;

  -- 5) Verify grid lines exist (count >= 3)
  SELECT COUNT(*) INTO v_line_count
  FROM grid_lines gl
  INNER JOIN tenants t ON gl.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_line_count < 3 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 3 grid lines for DEWA tenant, found %. Run 002_grid_topology.sql first.', v_line_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, sites=%, assets=%, nodes=%, lines=%', v_site_count, v_asset_count, v_node_count, v_line_count;
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
-- 2) Get site IDs
sites AS (
  SELECT s.id, s.name
  FROM sites s
  INNER JOIN tenant t ON s.tenant_id = t.id
  LIMIT 3
),
-- 3) Get asset IDs
assets AS (
  SELECT a.id, a.name, a.site_id, ROW_NUMBER() OVER (ORDER BY a.id) as rn
  FROM assets a
  INNER JOIN tenant t ON a.tenant_id = t.id
  LIMIT 15
),
-- 4) Get grid node IDs
grid_nodes_data AS (
  SELECT gn.id, gn.name, gn.site_id, ROW_NUMBER() OVER (ORDER BY gn.id) as rn
  FROM grid_nodes gn
  INNER JOIN tenant t ON gn.tenant_id = t.id
  LIMIT 5
),
-- 5) Get grid line IDs
grid_lines_data AS (
  SELECT gl.id, gl.name, ROW_NUMBER() OVER (ORDER BY gl.id) as rn
  FROM grid_lines gl
  INNER JOIN tenant t ON gl.tenant_id = t.id
  LIMIT 6
),
-- 6) Upsert shifts (6 shifts: 2 days × 3 sites)
upsert_shifts AS (
  INSERT INTO sim_shifts (tenant_id, site_id, shift_start, shift_end, shift_name)
  SELECT 
    t.id,
    s.id,
    v.shift_start,
    v.shift_end,
    v.shift_name
  FROM tenant t
  CROSS JOIN sites s
  CROSS JOIN (VALUES
    (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '6 hours', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '14 hours', 'day'),
    (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '14 hours', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '22 hours', 'evening'),
    (CURRENT_DATE + INTERVAL '6 hours', CURRENT_DATE + INTERVAL '14 hours', 'day'),
    (CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '22 hours', 'evening')
  ) AS v(shift_start, shift_end, shift_name)
  WHERE s.id IN (SELECT id FROM sites LIMIT 3)
  ON CONFLICT (tenant_id, site_id, shift_start)
  DO UPDATE SET
    shift_end = EXCLUDED.shift_end,
    shift_name = EXCLUDED.shift_name,
    updated_at = now()
  RETURNING id, site_id, shift_start, shift_name
),
-- 7) Force dependency: lookup shifts from upsert_shifts + existing sim_shifts
shifts_lookup AS (
  SELECT id, site_id, shift_start, shift_name FROM upsert_shifts
  UNION ALL
  SELECT sh.id, sh.site_id, sh.shift_start, sh.shift_name
  FROM sim_shifts sh
  INNER JOIN tenant t ON sh.tenant_id = t.id
),
-- 8) Upsert SIM boards (6 boards: one per shift)
upsert_boards AS (
  INSERT INTO sim_boards (tenant_id, board_date, site_id, shift_id, board_name, status)
  SELECT 
    t.id,
    sh.shift_start::date,
    sh.site_id,
    sh.id,
    s.name || ' - ' || INITCAP(sh.shift_name) || ' Shift - ' || sh.shift_start::date,
    CASE 
      WHEN (sh.id::text > '8') THEN 'on-track' -- Randomish distribution
      WHEN (sh.id::text > '4') THEN 'at-risk'
      ELSE 'behind'
    END
  FROM tenant t
  CROSS JOIN shifts_lookup sh
  INNER JOIN sites s ON s.id = sh.site_id
  ON CONFLICT (tenant_id, board_date, site_id, shift_id)
  DO UPDATE SET
    board_name = EXCLUDED.board_name,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id, board_name
),
-- 9) Force dependency: lookup boards from upsert_boards + existing sim_boards
boards_lookup AS (
  SELECT id, board_name FROM upsert_boards
  UNION ALL
  SELECT sb.id, sb.board_name
  FROM sim_boards sb
  INNER JOIN tenant t ON sb.tenant_id = t.id
),
-- 10) Upsert SIM KPIs (diversified metrics per board)
upsert_kpis AS (
  INSERT INTO sim_kpis (tenant_id, board_id, kpi_code, kpi_name, target_value, actual_value, unit, status)
  SELECT 
    t.id,
    b.id,
    v.kpi_code,
    v.kpi_name,
    v.target_base * (0.95 + (mod(b.rn * 13, 11) / 100.0)) as target_value,
    CASE 
      WHEN v.kpi_code = 'RELIABILITY' THEN (98.0 + (mod(b.rn * 7 + 3, 20) / 10.0))
      WHEN v.kpi_code = 'SYSTEM_LOAD' THEN (65.0 + (mod(b.rn * 17 + 5, 30)))
      WHEN v.kpi_code = 'ALERT_COUNT' THEN (mod(b.rn * 11 + 2, 12))
      WHEN v.kpi_code = 'OUTAGE_COUNT' THEN (mod(b.rn * 3 + 1, 5))
      WHEN v.kpi_code = 'SWITCH_BACKLOG' THEN (mod(b.rn * 19 + 4, 8))
      ELSE v.actual_base
    END as actual_value,
    v.unit,
    'good' -- will update status below
  FROM tenant t
  CROSS JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM boards_lookup) b
  CROSS JOIN (VALUES
    ('SYSTEM_LOAD', 'System Loading', 85.0, 78.5, '%'),
    ('ALERT_COUNT', 'Active Alerts', 5.0, 8.0, 'count'),
    ('OUTAGE_COUNT', 'Active Outages', 2.0, 1.0, 'count'),
    ('SWITCH_BACKLOG', 'Switching Backlog', 3.0, 4.0, 'count'),
    ('RELIABILITY', 'Reliability Index', 99.5, 99.2, '%')
  ) AS v(kpi_code, kpi_name, target_base, actual_base, unit)
  ON CONFLICT (tenant_id, board_id, kpi_code)
  DO UPDATE SET
    kpi_name = EXCLUDED.kpi_name,
    target_value = EXCLUDED.target_value,
    actual_value = EXCLUDED.actual_value,
    unit = EXCLUDED.unit,
    status = (
      CASE 
        WHEN EXCLUDED.kpi_code = 'RELIABILITY' THEN 
          CASE WHEN EXCLUDED.actual_value >= 99.0 THEN 'good' WHEN EXCLUDED.actual_value >= 98.0 THEN 'warning' ELSE 'critical' END
        WHEN EXCLUDED.kpi_code = 'SYSTEM_LOAD' THEN 
          CASE WHEN EXCLUDED.actual_value <= 80.0 THEN 'good' WHEN EXCLUDED.actual_value <= 90.0 THEN 'warning' ELSE 'critical' END
        WHEN EXCLUDED.kpi_code IN ('ALERT_COUNT', 'OUTAGE_COUNT', 'SWITCH_BACKLOG') THEN 
          CASE WHEN EXCLUDED.actual_value <= 2 THEN 'good' WHEN EXCLUDED.actual_value <= 5 THEN 'warning' ELSE 'critical' END
        ELSE 'good'
      END
    ),
    updated_at = now()
  RETURNING id, kpi_code
),
-- 11) Upsert switching orders (12 orders)
upsert_switching_orders AS (
  INSERT INTO switching_orders (tenant_id, site_id, order_no, description, priority, status, planned_start, planned_end, actual_start, actual_end, assigned_owner, checklist, history)
  SELECT 
    t.id,
    (SELECT id FROM sites WHERE name = v.site_name LIMIT 1),
    v.order_no,
    v.description,
    v.priority,
    v.status,
    v.planned_start,
    v.planned_end,
    v.actual_start,
    v.actual_end,
    v.assigned_owner,
    CASE 
      WHEN v.status = 'completed' THEN 
        jsonb_build_array(
          jsonb_build_object('text', 'Verify system conditions', 'completed', true),
          jsonb_build_object('text', 'Obtain necessary approvals', 'completed', true),
          jsonb_build_object('text', 'Coordinate with control center', 'completed', true),
          jsonb_build_object('text', 'Execute switching sequence', 'completed', true),
          jsonb_build_object('text', 'Verify final system state', 'completed', true)
        )
      WHEN v.status = 'in-progress' THEN 
        jsonb_build_array(
          jsonb_build_object('text', 'Verify system conditions', 'completed', true),
          jsonb_build_object('text', 'Obtain necessary approvals', 'completed', true),
          jsonb_build_object('text', 'Coordinate with control center', 'completed', true),
          jsonb_build_object('text', 'Execute switching sequence', 'completed', false),
          jsonb_build_object('text', 'Verify final system state', 'completed', false)
        )
      ELSE 
        jsonb_build_array(
          jsonb_build_object('text', 'Verify system conditions', 'completed', v.status = 'approved'),
          jsonb_build_object('text', 'Obtain necessary approvals', 'completed', v.status = 'approved'),
          jsonb_build_object('text', 'Coordinate with control center', 'completed', false),
          jsonb_build_object('text', 'Execute switching sequence', 'completed', false),
          jsonb_build_object('text', 'Verify final system state', 'completed', false)
        )
    END,
    (
      SELECT jsonb_agg(h) FROM (
        SELECT jsonb_build_object('event', 'Order created', 'timestamp', CURRENT_TIMESTAMP - interval '2 days', 'user', 'System') as h
        UNION ALL
        SELECT jsonb_build_object('event', 'Order approved', 'timestamp', CURRENT_TIMESTAMP - interval '1 day', 'user', 'Supervisor') WHERE v.status IN ('approved', 'in-progress', 'completed')
        UNION ALL
        SELECT jsonb_build_object('event', 'Execution started', 'timestamp', v.actual_start, 'user', v.assigned_owner) WHERE v.status IN ('in-progress', 'completed')
        UNION ALL
        SELECT jsonb_build_object('event', 'Execution completed', 'timestamp', v.actual_end, 'user', v.assigned_owner) WHERE v.status = 'completed'
      ) q WHERE h IS NOT NULL
    )
  FROM tenant t
  CROSS JOIN (VALUES
    ('SW-2024-001', 'Dubai Main Substation', 'Isolate Dubai T1 for maintenance', 'high', 'completed', CURRENT_TIMESTAMP - interval '2 hours', CURRENT_TIMESTAMP - interval '1 hour', CURRENT_TIMESTAMP - interval '110 minutes', CURRENT_TIMESTAMP - interval '65 minutes', 'Ahmed Al-Rashid'),
    ('SW-2024-002', 'Jebel Ali Grid Station', 'Energize Jebel Ali backup feeder', 'medium', 'in-progress', CURRENT_TIMESTAMP - interval '30 minutes', CURRENT_TIMESTAMP + interval '1 hour', CURRENT_TIMESTAMP - interval '15 minutes', NULL, 'Sarah Mohammed'),
    ('SW-2024-003', 'Al Aweer Regional Hub', 'Test Al Aweer protection relay', 'low', 'pending', CURRENT_TIMESTAMP + interval '1 day', CURRENT_TIMESTAMP + interval '2 days', NULL, NULL, 'Omar Hassan'),
    ('SW-2024-004', 'Dubai Main Substation', 'Switch Dubai Main to backup transformer', 'high', 'approved', CURRENT_TIMESTAMP + interval '4 hours', CURRENT_TIMESTAMP + interval '5 hours', NULL, NULL, 'Fatima Ali'),
    ('SW-2024-005', 'Jebel Ali Grid Station', 'Isolate Central Hub Line 2', 'medium', 'pending', CURRENT_TIMESTAMP + interval '2 days', CURRENT_TIMESTAMP + interval '2 days 2 hours', NULL, NULL, 'Mohammed Khalil'),
    ('SW-2024-006', 'Jebel Ali Grid Station', 'Restore Jebel Ali 400kV incomer', 'high', 'in-progress', CURRENT_TIMESTAMP - interval '1 hour', CURRENT_TIMESTAMP + interval '30 minutes', CURRENT_TIMESTAMP - interval '50 minutes', NULL, 'Aisha Saeed'),
    ('SW-2024-007', 'Dubai Main Substation', 'Emergency isolation Dubai South', 'high', 'completed', CURRENT_TIMESTAMP - interval '5 hours', CURRENT_TIMESTAMP - interval '4 hours', CURRENT_TIMESTAMP - interval '290 minutes', CURRENT_TIMESTAMP - interval '245 minutes', 'Khalid Nasser'),
    ('SW-2024-008', 'Al Aweer Regional Hub', 'Planned outage Al Aweer T1', 'medium', 'approved', CURRENT_TIMESTAMP + interval '6 hours', CURRENT_TIMESTAMP + interval '12 hours', NULL, NULL, 'Mariam Ahmed'),
    ('SW-2024-009', 'Dubai Main Substation', 'Load transfer Dubai to Jebel Ali', 'high', 'pending', CURRENT_TIMESTAMP + interval '12 hours', CURRENT_TIMESTAMP + interval '14 hours', NULL, NULL, 'Hassan Ali'),
    ('SW-2024-010', 'Jebel Ali Grid Station', 'Breaker maintenance Central Hub', 'low', 'cancelled', CURRENT_TIMESTAMP - interval '1 day', CURRENT_TIMESTAMP - interval '1 day', NULL, NULL, 'Noura Rashid'),
    ('SW-2024-011', 'Dubai Main Substation', 'Voltage regulator adjustment', 'medium', 'in-progress', CURRENT_TIMESTAMP - interval '45 minutes', CURRENT_TIMESTAMP + interval '15 minutes', CURRENT_TIMESTAMP - interval '40 minutes', NULL, 'Saif Mohammed'),
    ('SW-2024-012', 'Al Aweer Regional Hub', 'Protection settings update', 'low', 'pending', CURRENT_TIMESTAMP + interval '3 days', CURRENT_TIMESTAMP + interval '3 days 2 hours', NULL, NULL, 'Layla Hassan')
  ) AS v(order_no, site_name, description, priority, status, planned_start, planned_end, actual_start, actual_end, assigned_owner)
  ON CONFLICT (tenant_id, order_no)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    planned_start = EXCLUDED.planned_start,
    planned_end = EXCLUDED.planned_end,
    actual_start = EXCLUDED.actual_start,
    actual_end = EXCLUDED.actual_end,
    assigned_owner = EXCLUDED.assigned_owner,
    checklist = EXCLUDED.checklist,
    history = EXCLUDED.history,
    updated_at = now()
  RETURNING id, order_no
),
-- 12) Force dependency: lookup switching orders
switching_orders_lookup AS (
  SELECT id, order_no FROM upsert_switching_orders
  UNION ALL
  SELECT so.id, so.order_no
  FROM switching_orders so
  INNER JOIN tenant t ON so.tenant_id = t.id
),
-- 13) Upsert switching order impacts (2 per order × 12 orders = 24 impacts)
-- Uses modulo-5 mapping so ALL orders get seq values 1-5 (the only ones in grid_nodes/lines/assets)
upsert_switching_impacts AS (
  INSERT INTO switching_order_impacts (order_id, node_id, line_id, asset_id)
  SELECT
    so.id,
    CASE WHEN imp.impact_type = 'node' THEN gn.id ELSE NULL END,
    CASE WHEN imp.impact_type = 'line' THEN gl.id ELSE NULL END,
    CASE WHEN imp.impact_type = 'asset' THEN a.id  ELSE NULL END
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM switching_orders_lookup
  ) so
  -- Two impacts per order: one primary (seq1), one secondary (seq2), alternating types
  CROSS JOIN LATERAL (
    VALUES
      -- Primary impact: cycle node/line/asset based on rn mod 3
      (CASE (so.rn - 1) % 3
         WHEN 0 THEN 'node'
         WHEN 1 THEN 'line'
         ELSE 'asset'
       END,
       ((so.rn - 1) % 5) + 1),
      -- Secondary impact: next type in cycle
      (CASE so.rn % 3
         WHEN 0 THEN 'node'
         WHEN 1 THEN 'line'
         ELSE 'asset'
       END,
       (so.rn % 5) + 1)
  ) AS imp(impact_type, seq)
  LEFT JOIN grid_nodes_data gn ON gn.rn = imp.seq AND imp.impact_type = 'node'
  LEFT JOIN grid_lines_data gl ON gl.rn = imp.seq AND imp.impact_type = 'line'
  LEFT JOIN assets        a  ON a.rn  = imp.seq AND imp.impact_type = 'asset'
  WHERE (gn.id IS NOT NULL OR gl.id IS NOT NULL OR a.id IS NOT NULL)
  ON CONFLICT DO NOTHING
  RETURNING id
),
-- 14) Upsert outages (6 outages)
upsert_outages AS (
  INSERT INTO outages (tenant_id, site_id, outage_ref, outage_type, status, start_time, estimated_restoration, actual_restoration, impact_level, description)
  SELECT 
    t.id,
    (SELECT id FROM sites WHERE name = v.site_name LIMIT 1),
    v.outage_ref,
    v.outage_type,
    v.status,
    v.start_time,
    v.estimated_restoration,
    v.actual_restoration,
    v.impact_level,
    v.description
  FROM tenant t
  CROSS JOIN (VALUES
    ('OUT-2024-001', 'Dubai Main Substation', 'planned', 'resolved', '2024-01-28 06:00:00+04'::timestamptz, '2024-01-28 18:00:00+04'::timestamptz, '2024-01-28 16:30:00+04'::timestamptz, 'medium', 'Planned maintenance on Dubai T1 transformer'),
    ('OUT-2024-002', 'Jebel Ali Grid Station', 'unplanned', 'active', '2024-01-28 14:30:00+04'::timestamptz, '2024-01-28 20:00:00+04'::timestamptz, NULL, 'high', 'Jebel Ali 400kV breaker trip due to protection fault'),
    ('OUT-2024-003', 'Al Aweer Regional Hub', 'planned', 'scheduled', '2024-01-30 06:00:00+04'::timestamptz, '2024-01-30 18:00:00+04'::timestamptz, NULL, 'low', 'Al Aweer transformer oil sampling and testing'),
    ('OUT-2024-004', 'Dubai Main Substation', 'unplanned', 'resolved', '2024-01-28 11:15:00+04'::timestamptz, '2024-01-28 13:00:00+04'::timestamptz, '2024-01-28 12:45:00+04'::timestamptz, 'medium', 'Dubai South junction communication loss'),
    ('OUT-2024-005', 'Jebel Ali Grid Station', 'planned', 'active', '2024-01-29 08:00:00+04'::timestamptz, '2024-01-29 16:00:00+04'::timestamptz, NULL, 'low', 'Central Hub busbar inspection and cleaning'),
    ('OUT-2024-006', 'Al Aweer Regional Hub', 'unplanned', 'resolved', '2024-01-29 15:45:00+04'::timestamptz, '2024-01-29 17:30:00+04'::timestamptz, '2024-01-29 17:15:00+04'::timestamptz, 'high', 'Al Aweer-Dubai backup line fault due to weather')
  ) AS v(outage_ref, site_name, outage_type, status, start_time, estimated_restoration, actual_restoration, impact_level, description)
  ON CONFLICT (tenant_id, outage_ref)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    outage_type = EXCLUDED.outage_type,
    status = EXCLUDED.status,
    start_time = EXCLUDED.start_time,
    estimated_restoration = EXCLUDED.estimated_restoration,
    actual_restoration = EXCLUDED.actual_restoration,
    impact_level = EXCLUDED.impact_level,
    description = EXCLUDED.description,
    updated_at = now()
  RETURNING id, outage_ref
),
-- 15) Force dependency: lookup outages
outages_lookup AS (
  SELECT id, outage_ref FROM upsert_outages
  UNION ALL
  SELECT o.id, o.outage_ref
  FROM outages o
  INNER JOIN tenant t ON o.tenant_id = t.id
),
-- 16) Upsert outage impacts (2 per outage × 6 outages = 12 impacts)
-- Uses modulo-5 mapping so ALL outages get seq values 1-5
upsert_outage_impacts AS (
  INSERT INTO outage_impacts (outage_id, node_id, line_id, asset_id)
  SELECT
    o.id,
    CASE WHEN imp.impact_type = 'node' THEN gn.id ELSE NULL END,
    CASE WHEN imp.impact_type = 'line' THEN gl.id ELSE NULL END,
    CASE WHEN imp.impact_type = 'asset' THEN a.id  ELSE NULL END
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM outages_lookup
  ) o
  CROSS JOIN LATERAL (
    VALUES
      -- Primary impact: cycle node/line/asset
      (CASE (o.rn - 1) % 3
         WHEN 0 THEN 'node'
         WHEN 1 THEN 'asset'
         ELSE 'line'
       END,
       ((o.rn - 1) % 5) + 1),
      -- Secondary impact: next type
      (CASE o.rn % 3
         WHEN 0 THEN 'line'
         WHEN 1 THEN 'node'
         ELSE 'asset'
       END,
       (o.rn % 5) + 1)
  ) AS imp(impact_type, seq)
  LEFT JOIN grid_nodes_data gn ON gn.rn = imp.seq AND imp.impact_type = 'node'
  LEFT JOIN grid_lines_data gl ON gl.rn = imp.seq AND imp.impact_type = 'line'
  LEFT JOIN assets        a  ON a.rn  = imp.seq AND imp.impact_type = 'asset'
  WHERE (gn.id IS NOT NULL OR gl.id IS NOT NULL OR a.id IS NOT NULL)
  ON CONFLICT DO NOTHING
  RETURNING id
),
-- 17) Upsert SIM issues (15 issues)
upsert_issues AS (
  INSERT INTO sim_issues (tenant_id, site_id, issue_ref, title, description, category, priority, status)
  SELECT 
    t.id,
    (SELECT id FROM sites WHERE name = v.site_name LIMIT 1),
    v.issue_ref,
    v.title,
    v.description,
    v.category,
    v.priority,
    v.status
  FROM tenant t
  CROSS JOIN (VALUES
    ('ISS-2024-001', 'Dubai Main Substation', 'SCADA communication timeout', 'Intermittent communication loss with Dubai Main SCADA', 'communication', 'high', 'in-progress'),
    ('ISS-2024-002', 'Jebel Ali Grid Station', 'Protection relay alarm', 'Jebel Ali T1 differential relay showing spurious alarm', 'protection', 'medium', 'open'),
    ('ISS-2024-003', 'Al Aweer Regional Hub', 'Cooling system noise', 'Al Aweer transformer cooling fans making unusual noise', 'equipment', 'low', 'open'),
    ('ISS-2024-004', 'Dubai Main Substation', 'Meter reading discrepancy', 'Dubai feeder meter showing inconsistent readings', 'measurement', 'medium', 'resolved'),
    ('ISS-2024-005', 'Jebel Ali Grid Station', 'Busbar temperature high', 'Central Hub 400kV busbar temperature above normal', 'thermal', 'high', 'in-progress'),
    ('ISS-2024-006', 'Dubai Main Substation', 'Control room AC failure', 'Dubai Main control room air conditioning not working', 'facility', 'medium', 'resolved'),
    ('ISS-2024-007', 'Jebel Ali Grid Station', 'Backup generator test fail', 'Jebel Ali backup generator failed weekly test', 'backup', 'high', 'open'),
    ('ISS-2024-008', 'Al Aweer Regional Hub', 'Oil leak detected', 'Minor oil leak observed at Al Aweer T1 transformer', 'environmental', 'medium', 'in-progress'),
    ('ISS-2024-009', 'Dubai Main Substation', 'Operator training required', 'New operator needs certification for 400kV operations', 'training', 'low', 'open'),
    ('ISS-2024-010', 'Jebel Ali Grid Station', 'Documentation update needed', 'Single line diagrams need updating after recent changes', 'documentation', 'low', 'open'),
    ('ISS-2024-011', 'Dubai Main Substation', 'Spare parts shortage', 'Running low on 400kV breaker spare contacts', 'inventory', 'medium', 'open'),
    ('ISS-2024-012', 'Jebel Ali Grid Station', 'Weather monitoring offline', 'Central weather station not reporting data', 'monitoring', 'low', 'resolved'),
    ('ISS-2024-013', 'Al Aweer Regional Hub', 'Security system fault', 'Dubai Main perimeter alarm system intermittent', 'security', 'medium', 'in-progress'),
    ('ISS-2024-014', 'Dubai Main Substation', 'Load forecasting error', 'Yesterday load forecast was 15% off actual', 'forecasting', 'low', 'open'),
    ('ISS-2024-015', 'Jebel Ali Grid Station', 'Contractor access delay', 'Maintenance contractor delayed due to permit issues', 'administrative', 'medium', 'resolved')
  ) AS v(issue_ref, site_name, title, description, category, priority, status)
  ON CONFLICT (tenant_id, issue_ref)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id, issue_ref, site_id
),
-- 18) Force dependency: lookup issues
issues_lookup AS (
  SELECT id, issue_ref, site_id FROM upsert_issues
  UNION ALL
  SELECT si.id, si.issue_ref, si.site_id
  FROM sim_issues si
  INNER JOIN tenant t ON si.tenant_id = t.id
),
-- 19) Upsert SIM actions (25 actions)
upsert_actions AS (
  INSERT INTO sim_actions (tenant_id, site_id, action_ref, description, owner, due_date, priority, status)
  SELECT 
    t.id,
    i.site_id,
    v.action_ref,
    v.description,
    v.owner,
    v.due_date,
    v.priority,
    v.status
  FROM tenant t
  CROSS JOIN (VALUES
    ('ACT-2024-001', 'ISS-2024-001', 'Reset SCADA communication link', 'Ahmed Al-Rashid', '2024-01-29 12:00:00+04'::timestamptz, 'high', 'completed'),
    ('ACT-2024-002', 'ISS-2024-002', 'Test protection relay settings', 'Sarah Mohammed', '2024-01-30 10:00:00+04'::timestamptz, 'medium', 'in-progress'),
    ('ACT-2024-003', 'ISS-2024-003', 'Schedule cooling fan replacement', 'Omar Hassan', '2024-02-05 16:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-004', 'ISS-2024-004', 'Calibrate revenue meter', 'Fatima Ali', '2024-01-29 14:00:00+04'::timestamptz, 'medium', 'completed'),
    ('ACT-2024-005', 'ISS-2024-005', 'Inspect busbar connections', 'Mohammed Khalil', '2024-01-29 08:00:00+04'::timestamptz, 'high', 'in-progress'),
    ('ACT-2024-006', 'ISS-2024-006', 'Repair control room AC unit', 'Aisha Saeed', '2024-01-28 18:00:00+04'::timestamptz, 'low', 'completed'),
    ('ACT-2024-007', 'ISS-2024-007', 'Service backup generator', 'Khalid Nasser', '2024-01-31 09:00:00+04'::timestamptz, 'high', 'pending'),
    ('ACT-2024-008', 'ISS-2024-008', 'Contain and clean oil leak', 'Mariam Ahmed', '2024-01-30 11:00:00+04'::timestamptz, 'medium', 'in-progress'),
    ('ACT-2024-009', 'ISS-2024-009', 'Schedule operator training', 'Hassan Ali', '2024-02-15 17:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-010', 'ISS-2024-010', 'Update single line diagrams', 'Noura Rashid', '2024-02-10 16:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-011', 'ISS-2024-011', 'Order spare breaker contacts', 'Saif Mohammed', '2024-01-30 12:00:00+04'::timestamptz, 'medium', 'pending'),
    ('ACT-2024-012', 'ISS-2024-012', 'Replace weather station sensor', 'Layla Hassan', '2024-01-29 15:00:00+04'::timestamptz, 'low', 'completed'),
    ('ACT-2024-013', 'ISS-2024-013', 'Test security alarm system', 'Ahmed Al-Rashid', '2024-01-31 13:00:00+04'::timestamptz, 'medium', 'in-progress'),
    ('ACT-2024-014', 'ISS-2024-014', 'Review load forecasting model', 'Sarah Mohammed', '2024-02-01 10:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-015', 'ISS-2024-015', 'Process contractor permits', 'Omar Hassan', '2024-01-29 09:00:00+04'::timestamptz, 'low', 'completed'),
    ('ACT-2024-016', 'ISS-2024-001', 'Monitor transformer loading', 'Fatima Ali', '2024-01-29 20:00:00+04'::timestamptz, 'medium', 'in-progress'),
    ('ACT-2024-017', 'ISS-2024-002', 'Check breaker operation counters', 'Mohammed Khalil', '2024-01-30 14:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-018', 'ISS-2024-003', 'Verify protection coordination', 'Aisha Saeed', '2024-02-02 11:00:00+04'::timestamptz, 'medium', 'pending'),
    ('ACT-2024-019', 'ISS-2024-004', 'Update emergency procedures', 'Khalid Nasser', '2024-02-05 15:00:00+04'::timestamptz, 'medium', 'pending'),
    ('ACT-2024-020', 'ISS-2024-005', 'Test communication backup', 'Mariam Ahmed', '2024-01-31 08:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-021', 'ISS-2024-006', 'Inspect cable terminations', 'Hassan Ali', '2024-02-03 10:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-022', 'ISS-2024-007', 'Review switching procedures', 'Noura Rashid', '2024-02-01 14:00:00+04'::timestamptz, 'medium', 'pending'),
    ('ACT-2024-023', 'ISS-2024-008', 'Check earthing system', 'Saif Mohammed', '2024-02-04 09:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-024', 'ISS-2024-009', 'Update asset register', 'Layla Hassan', '2024-02-06 16:00:00+04'::timestamptz, 'low', 'pending'),
    ('ACT-2024-025', 'ISS-2024-010', 'Plan maintenance schedule', 'Ahmed Al-Rashid', '2024-02-07 11:00:00+04'::timestamptz, 'medium', 'pending')
  ) AS v(action_ref, link_issue_ref, description, owner, due_date, priority, status)
  INNER JOIN issues_lookup i ON i.issue_ref = v.link_issue_ref
  ON CONFLICT (tenant_id, action_ref)
  DO UPDATE SET
    site_id = EXCLUDED.site_id,
    description = EXCLUDED.description,
    owner = EXCLUDED.owner,
    due_date = EXCLUDED.due_date,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id, action_ref
),
-- 20) Force dependency: lookup actions (deduplicated so ROW_NUMBER is stable 1-25)
actions_lookup AS (
  SELECT DISTINCT ON (id) id, action_ref
  FROM (
    SELECT id, action_ref FROM upsert_actions
    UNION ALL
    SELECT sa.id, sa.action_ref
    FROM sim_actions sa
    INNER JOIN tenant t ON sa.tenant_id = t.id
  ) combined
  ORDER BY id
),
-- 21) Upsert action links
-- Link each action to its matching issue (1:1, first 15 actions → 15 issues)
upsert_action_issue_links AS (
  INSERT INTO sim_action_links (action_id, issue_id)
  SELECT a.id, i.id
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM actions_lookup) a
  INNER JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM issues_lookup) i
    ON i.rn = ((a.rn - 1) % 15) + 1
  ON CONFLICT DO NOTHING
  RETURNING id
),
-- Link each switching order to 2 distinct actions
upsert_order_action_links AS (
  INSERT INTO sim_action_links (action_id, order_id)
  SELECT a.id, so.id
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM switching_orders_lookup) so
  CROSS JOIN LATERAL (
    VALUES
      (((so.rn - 1) % 25) + 1),       -- primary action
      ((so.rn + 11) % 25 + 1)         -- secondary action (offset by 12)
  ) AS lnk(action_rn)
  INNER JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM actions_lookup) a
    ON a.rn = lnk.action_rn
  ON CONFLICT DO NOTHING
  RETURNING id
),
-- Link each outage to 1 action
upsert_outage_action_links AS (
  INSERT INTO sim_action_links (action_id, outage_id)
  SELECT a.id, o.id
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM outages_lookup) o
  INNER JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM actions_lookup) a
    ON a.rn = ((o.rn + 18) % 25) + 1
  ON CONFLICT DO NOTHING
  RETURNING id
)
SELECT 
  (SELECT COUNT(*) FROM upsert_shifts) as shifts_created,
  (SELECT COUNT(*) FROM upsert_boards) as boards_created,
  (SELECT COUNT(*) FROM upsert_kpis) as kpis_created,
  (SELECT COUNT(*) FROM upsert_switching_orders) as orders_created,
  (SELECT COUNT(*) FROM upsert_outages) as outages_created,
  (SELECT COUNT(*) FROM upsert_issues) as issues_created,
  (SELECT COUNT(*) FROM upsert_actions) as actions_created,
  (SELECT COUNT(*) FROM upsert_action_issue_links) as issue_links_created,
  (SELECT COUNT(*) FROM upsert_order_action_links) as order_links_created,
  (SELECT COUNT(*) FROM upsert_outage_action_links) as outage_links_created;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_boards_count INTEGER;
  v_orders_count INTEGER;
  v_outages_count INTEGER;
  v_issues_count INTEGER;
  v_actions_count INTEGER;
BEGIN
  -- Get tenant-specific counts
  SELECT 
    (SELECT COUNT(*) FROM sim_boards WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM switching_orders WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM outages WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM sim_issues WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM sim_actions WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))
  INTO v_boards_count, v_orders_count, v_outages_count, v_issues_count, v_actions_count;
  
  -- Validate minimum counts
  IF v_boards_count < 6 THEN
    RAISE EXCEPTION 'SEED 008_sim_seed.sql FAILED: expected >= 6 sim_boards for DEWA tenant, found %', v_boards_count;
  END IF;
  
  IF v_orders_count < 12 THEN
    RAISE EXCEPTION 'SEED 008_sim_seed.sql FAILED: expected >= 12 switching_orders for DEWA tenant, found %', v_orders_count;
  END IF;
  
  IF v_outages_count < 6 THEN
    RAISE EXCEPTION 'SEED 008_sim_seed.sql FAILED: expected >= 6 outages for DEWA tenant, found %', v_outages_count;
  END IF;
  
  IF v_issues_count < 15 THEN
    RAISE EXCEPTION 'SEED 008_sim_seed.sql FAILED: expected >= 15 sim_issues for DEWA tenant, found %', v_issues_count;
  END IF;
  
  IF v_actions_count < 25 THEN
    RAISE EXCEPTION 'SEED 008_sim_seed.sql FAILED: expected >= 25 sim_actions for DEWA tenant, found %', v_actions_count;
  END IF;
  
  RAISE NOTICE 'Seed 008_sim_seed.sql OK: boards=%, orders=%, outages=%, issues=%, actions=%', 
    v_boards_count, v_orders_count, v_outages_count, v_issues_count, v_actions_count;
END $$;

COMMIT;

-- ============================================================================
-- SUMMARY REPORT
-- Show final counts for verification
-- ============================================================================
SELECT 
  'SIM Seed Summary' as report_title,
  (SELECT COUNT(*) FROM sim_shifts WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as shifts,
  (SELECT COUNT(*) FROM sim_boards WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as boards,
  (SELECT COUNT(*) FROM sim_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as kpis,
  (SELECT COUNT(*) FROM switching_orders WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as switching_orders,
  (SELECT COUNT(*) FROM switching_order_impacts soi 
   INNER JOIN switching_orders so ON soi.order_id = so.id 
   WHERE so.tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as switching_impacts,
  (SELECT COUNT(*) FROM outages WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as outages,
  (SELECT COUNT(*) FROM outage_impacts oi 
   INNER JOIN outages o ON oi.outage_id = o.id 
   WHERE o.tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as outage_impacts,
  (SELECT COUNT(*) FROM sim_issues WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as issues,
  (SELECT COUNT(*) FROM sim_actions WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as actions,
  (SELECT COUNT(*) FROM sim_action_links sal 
   INNER JOIN sim_actions sa ON sal.action_id = sa.id 
   WHERE sa.tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as action_links,
  (SELECT COUNT(*) FROM shift_performance WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as shift_performance_records;

-- ============================================================================
-- SHIFT PERFORMANCE SEED DATA
-- ============================================================================

-- Insert Shift Performance metrics for existing shifts
INSERT INTO shift_performance (tenant_id, shift_id, performance_score, status, achievements, issues, metrics, notes)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' AND subsector = 'transmission' LIMIT 1),
  s.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 98.5
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 94.2
    ELSE 87.8
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 'excellent'
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 'good'
    ELSE 'needs-improvement'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 4
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 3
    ELSE 1
  END,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 0
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 1
    ELSE 3
  END,
  jsonb_build_object(
    'safety_incidents', CASE
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 0
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 0
      ELSE (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 2)  -- 0 or 1 incident
    END,
    'equipment_uptime', CASE
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN
        -- Excellent tier: 97.5 - 99.9%
        97.5 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 4) * 0.6
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN
        -- Good tier: 94.0 - 96.8%
        94.0 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 5) * 0.7
      ELSE
        -- Needs improvement tier: 88.0 - 93.5%
        88.0 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 4) * 1.4
    END,
    'response_time_avg', CASE
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN
        -- Excellent tier: 8 - 13 min
        8.0 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 6)
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN
        -- Good tier: 13 - 17 min
        13.0 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 5)
      ELSE
        -- Needs improvement: 17 - 24 min
        17.0 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 8)
    END,
    'tasks_completed', CASE
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN
        14 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 4)   -- 14-17
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN
        10 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 5)   -- 10-14
      ELSE
        6 + (ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 5)    -- 6-10
    END,
    'tasks_planned', CASE
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 16
      WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 15
      ELSE 16
    END
  ),
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 0 THEN 'Excellent shift performance with all targets met'
    WHEN ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) % 3 = 1 THEN 'Good performance with minor issues resolved'
    ELSE 'Performance below target, requires improvement actions'
  END
FROM sim_shifts s
WHERE s.tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' AND subsector = 'transmission' LIMIT 1)
ORDER BY s.shift_start DESC
LIMIT 12
ON CONFLICT (shift_id)
DO UPDATE SET
  performance_score = EXCLUDED.performance_score,
  status = EXCLUDED.status,
  achievements = EXCLUDED.achievements,
  issues = EXCLUDED.issues,
  metrics = EXCLUDED.metrics,
  notes = EXCLUDED.notes,
  updated_at = now();
