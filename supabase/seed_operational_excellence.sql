-- Seed data for Operational Excellence (Performance, SIM, CI)
-- For DEWA Transmission tenant
-- Run via: npx supabase db execute --file supabase/seed_operational_excellence.sql

DO $$
DECLARE
  v_tenant_id UUID;
  v_site_id UUID;
  v_asset_id UUID;
  v_board_id UUID;
  v_shift_id UUID;
  v_ci_stage_analysis UUID;
  v_ci_stage_implementation UUID;
  v_ci_stage_backlog UUID;
BEGIN
  -- Get the DEWA transmission tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'DEWA tenant not found, skipping seed';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data for tenant: %', v_tenant_id;

  -- Get a site and asset for references
  SELECT id INTO v_site_id FROM sites WHERE tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_asset_id FROM assets WHERE tenant_id = v_tenant_id LIMIT 1;

  -- ============================================================
  -- PERFORMANCE PANELS
  -- ============================================================
  -- system: no spatial refs; site: site_id; asset: asset_id (or grid_node_id)
  INSERT INTO performance_panels (
    tenant_id, site_id, asset_id, name, panel_type,
    oee_percentage, availability_percentage, performance_percentage, quality_percentage,
    line_loading, transformer_loading, transmission_losses, saidi, saifi, trip_count, status
  ) VALUES
  (v_tenant_id, NULL, NULL, 'DEWA Grid Fleet Overview', 'system',
    87.2, 94.5, 91.8, 99.2, 72.3, 68.5, 1.8, 4.2, 0.8, 3, 'active'),
  (v_tenant_id, v_site_id, NULL, 'Al Quoz Substation', 'site',
    82.1, 91.2, 88.4, 98.9, 78.1, 74.2, 2.1, 6.1, 1.1, 5, 'active'),
  (v_tenant_id, NULL, v_asset_id, 'Jumeirah Transmission Line', 'asset',
    91.4, 96.3, 94.2, 100.0, 65.4, NULL, 1.2, 2.8, 0.5, 1, 'active'),
  (v_tenant_id, NULL, v_asset_id, 'Mirdif 400kV Transformer', 'asset',
    78.3, 88.9, 85.6, 98.1, NULL, 82.3, 2.8, 8.4, 1.4, 7, 'maintenance')
  ON CONFLICT (tenant_id, name) DO UPDATE SET
    oee_percentage = EXCLUDED.oee_percentage,
    availability_percentage = EXCLUDED.availability_percentage,
    last_updated = now();

  -- ============================================================
  -- PERFORMANCE LOSSES
  -- ============================================================
  INSERT INTO performance_losses (
    tenant_id, site_id, loss_category, loss_type, description,
    duration_minutes, frequency_count, impact_percentage, energy_lost_mwh, occurred_at
  ) VALUES
  (v_tenant_id, v_site_id, 'technical', 'Line Fault', 'Phase-to-earth fault on 132kV feeder F07', 45, 1, 3.2, 18.5, NOW() - INTERVAL '2 days'),
  (v_tenant_id, v_site_id, 'technical', 'Transformer Overload', 'T3 transformer thermal overload during peak demand', 120, 2, 5.8, 42.1, NOW() - INTERVAL '5 days'),
  (v_tenant_id, v_site_id, 'non_technical', 'Planned Maintenance', 'Scheduled outage for relay protection testing', 240, 1, 8.1, 65.4, NOW() - INTERVAL '7 days'),
  (v_tenant_id, v_site_id, 'technical', 'Capacitor Bank Trip', 'Capacitor bank automatic trip on bus bar 2', 30, 3, 1.9, 8.2, NOW() - INTERVAL '1 day'),
  (v_tenant_id, v_site_id, 'measurement_error', 'Meter Calibration', 'CT meter error detected during calibration cycle', 0, 1, 0.4, NULL, NOW() - INTERVAL '10 days');

  -- ============================================================
  -- PERFORMANCE BOTTLENECKS
  -- ============================================================
  INSERT INTO performance_bottlenecks (
    tenant_id, site_id, constraint_type, severity, description,
    capacity_limit_mw, current_loading_mw, loading_percentage, constraint_hours, status
  ) VALUES
  (v_tenant_id, v_site_id, 'thermal', 'high', '132kV interconnector approaching thermal limit during peak load',
    350.0, 318.5, 91.0, 48, 'active'),
  (v_tenant_id, v_site_id, 'voltage', 'medium', 'Low voltage profile at 33kV busbar 4 during morning peak',
    NULL, NULL, 85.0, 24, 'monitoring'),
  (v_tenant_id, v_site_id, 'operational', 'low', 'N-1 contingency limit reached on outgoing 400kV feeder',
    800.0, 620.0, 77.5, 12, 'monitoring'),
  (v_tenant_id, v_site_id, 'stability', 'medium', 'Voltage stability margin reduction due to reactive power deficit',
    NULL, NULL, 88.0, 36, 'active');

  -- ============================================================
  -- PERFORMANCE TRENDS (last 7 days of data points)
  -- ============================================================
  INSERT INTO performance_trends (tenant_id, site_id, metric_name, metric_value, timestamp)
  SELECT
    v_tenant_id, v_site_id,
    metric_name,
    base_value + (RANDOM() * variance - variance/2),
    NOW() - (INTERVAL '1 hour' * gs)
  FROM generate_series(0, 167) AS gs,
  (VALUES
    ('oee_percentage', 87.0, 4.0),
    ('availability_percentage', 94.0, 2.0),
    ('line_loading', 72.0, 10.0),
    ('transmission_losses', 1.8, 0.5)
  ) AS metrics(metric_name, base_value, variance)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SIM SHIFTS
  -- ============================================================
  INSERT INTO sim_shifts (tenant_id, site_id, shift_start, shift_end, shift_name)
  VALUES
  (v_tenant_id, v_site_id, NOW()::date + TIME '06:00', NOW()::date + TIME '14:00', 'day'),
  (v_tenant_id, v_site_id, NOW()::date + TIME '14:00', NOW()::date + TIME '22:00', 'evening'),
  (v_tenant_id, v_site_id, NOW()::date - INTERVAL '1 day' + TIME '06:00', NOW()::date - INTERVAL '1 day' + TIME '14:00', 'day')
  ON CONFLICT (tenant_id, site_id, shift_start) DO NOTHING
  RETURNING id INTO v_shift_id;

  SELECT id INTO v_shift_id FROM sim_shifts WHERE tenant_id = v_tenant_id ORDER BY shift_start DESC LIMIT 1;

  -- ============================================================
  -- SIM BOARDS
  -- ============================================================
  INSERT INTO sim_boards (tenant_id, board_date, site_id, shift_id, board_name, status)
  VALUES
  (v_tenant_id, NOW()::date, v_site_id, v_shift_id, 'DEWA Control Centre - Day Shift', 'at-risk'),
  (v_tenant_id, NOW()::date - INTERVAL '1 day', v_site_id, v_shift_id, 'DEWA Control Centre - Yesterday Evening', 'on-track'),
  (v_tenant_id, NOW()::date - INTERVAL '2 days', v_site_id, v_shift_id, 'DEWA Control Centre - 2 Days Ago', 'behind')
  ON CONFLICT (tenant_id, board_date, site_id, shift_id) DO UPDATE SET status = EXCLUDED.status
  RETURNING id INTO v_board_id;

  SELECT id INTO v_board_id FROM sim_boards WHERE tenant_id = v_tenant_id ORDER BY board_date DESC LIMIT 1;

  -- ============================================================
  -- SIM KPIs
  -- ============================================================
  INSERT INTO sim_kpis (tenant_id, board_id, kpi_code, kpi_name, target_value, actual_value, unit, status)
  VALUES
  (v_tenant_id, v_board_id, 'SYS_AVAIL', 'System Availability', 99.5, 98.2, '%', 'warning'),
  (v_tenant_id, v_board_id, 'SAIDI', 'SAIDI (min)', 5.0, 4.2, 'min', 'good'),
  (v_tenant_id, v_board_id, 'PEAK_LOAD', 'Peak Load', 3500.0, 3420.0, 'MW', 'good'),
  (v_tenant_id, v_board_id, 'SWITCHING', 'Switching Orders', 8, 12, 'orders', 'critical'),
  (v_tenant_id, v_board_id, 'OUTAGES', 'Active Outages', 2, 3, 'count', 'warning')
  ON CONFLICT (tenant_id, board_id, kpi_code) DO UPDATE SET actual_value = EXCLUDED.actual_value;

  -- ============================================================
  -- SWITCHING ORDERS
  -- ============================================================
  INSERT INTO switching_orders (tenant_id, order_no, description, priority, status, planned_start, planned_end, assigned_owner)
  VALUES
  (v_tenant_id, 'SO-2026-001', 'Maintenance switching for Al Quoz 132kV feeder F03', 'high', 'approved', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '6 hours', 'Ahmed Al Rashid'),
  (v_tenant_id, 'SO-2026-002', 'Load transfer from 400kV busbar A to busbar B', 'medium', 'in-progress', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'Mohammed Al Farsi'),
  (v_tenant_id, 'SO-2026-003', 'Capacitor bank C4 isolation for testing', 'low', 'pending', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 4 hours', 'Sara Al Mansoori'),
  (v_tenant_id, 'SO-2026-004', 'Emergency reconfiguration due to feeder fault', 'high', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours', 'Khalid Al Hamadi'),
  (v_tenant_id, 'SO-2026-005', 'Transformer T2 bypass for insulation test', 'medium', 'pending', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 8 hours', 'Fatima Al Zaabi')
  ON CONFLICT (tenant_id, order_no) DO UPDATE SET status = EXCLUDED.status;

  -- ============================================================
  -- OUTAGES
  -- ============================================================
  INSERT INTO outages (tenant_id, outage_ref, outage_type, status, start_time, estimated_restoration, impact_level, description)
  VALUES
  (v_tenant_id, 'OTG-2026-001', 'planned', 'scheduled', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 8 hours', 'medium', 'Scheduled maintenance outage on 132kV section B for relay protection calibration'),
  (v_tenant_id, 'OTG-2026-002', 'unplanned', 'active', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '2 hours', 'high', 'Unplanned outage due to phase-to-earth fault on 33kV feeder F12 at Al Mirdif substation'),
  (v_tenant_id, 'OTG-2026-003', 'planned', 'resolved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '6 hours', 'low', 'Completed planned outage for transformer oil sampling and dissolved gas analysis'),
  (v_tenant_id, 'OTG-2026-004', 'unplanned', 'resolved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 hours', 'medium', 'Lightning strike induced transient fault on 400kV overhead line - auto-reclosure successful')
  ON CONFLICT (tenant_id, outage_ref) DO UPDATE SET status = EXCLUDED.status;

  -- ============================================================
  -- SIM ISSUES
  -- ============================================================
  INSERT INTO sim_issues (tenant_id, issue_ref, title, description, category, priority, status)
  VALUES
  (v_tenant_id, 'ISS-2026-001', 'High Line Loading on 132kV Interconnector', 'Loading approaching 91% of thermal limit during peak hours - requires load shedding plan', 'Grid Loading', 'high', 'open'),
  (v_tenant_id, 'ISS-2026-002', 'Voltage Deviation on 33kV Busbar 4', 'Voltage profile dropping below acceptable limits (0.95 pu) during morning peak', 'Voltage Quality', 'medium', 'in-progress'),
  (v_tenant_id, 'ISS-2026-003', 'SCADA Communication Intermittent', 'Intermittent loss of telemetry from Al Quoz substation RTU', 'Communication', 'high', 'open'),
  (v_tenant_id, 'ISS-2026-004', 'Protection Relay Misoperation Investigation', 'Distance relay R17 operated without fault - investigation underway', 'Protection', 'high', 'in-progress'),
  (v_tenant_id, 'ISS-2026-005', 'Cooling Fan Failure on Transformer T3', 'One of four cooling fans failed - redundancy reduced', 'Equipment', 'medium', 'resolved')
  ON CONFLICT (tenant_id, issue_ref) DO UPDATE SET status = EXCLUDED.status;

  -- ============================================================
  -- SIM ACTIONS
  -- ============================================================
  INSERT INTO sim_actions (tenant_id, action_ref, description, owner, due_date, priority, status)
  VALUES
  (v_tenant_id, 'ACT-2026-001', 'Prepare load shedding scheme for 132kV interconnector contingency', 'Ahmed Al Rashid', NOW() + INTERVAL '2 days', 'high', 'in-progress'),
  (v_tenant_id, 'ACT-2026-002', 'Install additional reactive power compensation at 33kV busbar 4', 'Mohammed Al Farsi', NOW() + INTERVAL '7 days', 'medium', 'pending'),
  (v_tenant_id, 'ACT-2026-003', 'Replace faulty RTU communication module at Al Quoz substation', 'Khalid Al Hamadi', NOW() + INTERVAL '1 day', 'high', 'in-progress'),
  (v_tenant_id, 'ACT-2026-004', 'Conduct relay coordination study for distance relay R17', 'Sara Al Mansoori', NOW() + INTERVAL '5 days', 'high', 'pending'),
  (v_tenant_id, 'ACT-2026-005', 'Schedule replacement of T3 cooling fan unit CF-02', 'Fatima Al Zaabi', NOW() + INTERVAL '3 days', 'medium', 'completed'),
  (v_tenant_id, 'ACT-2026-006', 'Update emergency contact list for night shift operations', 'Ahmed Al Rashid', NOW() + INTERVAL '1 day', 'low', 'pending')
  ON CONFLICT (tenant_id, action_ref) DO UPDATE SET status = EXCLUDED.status;

  -- ============================================================
  -- CI STAGES (if not already present)
  -- ============================================================
  INSERT INTO ci_stages (tenant_id, name, sort_order, description)
  VALUES
  (v_tenant_id, 'Backlog', 1, 'Issues identified but not yet started'),
  (v_tenant_id, 'Analysis', 2, 'Root cause analysis in progress'),
  (v_tenant_id, 'Implementation', 3, 'Countermeasures being implemented'),
  (v_tenant_id, 'Validation', 4, 'Verifying improvement effectiveness'),
  (v_tenant_id, 'Verified', 5, 'Improvement verified and closed')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_ci_stage_backlog FROM ci_stages WHERE tenant_id = v_tenant_id AND name = 'Backlog' LIMIT 1;
  SELECT id INTO v_ci_stage_analysis FROM ci_stages WHERE tenant_id = v_tenant_id AND name = 'Analysis' LIMIT 1;
  SELECT id INTO v_ci_stage_implementation FROM ci_stages WHERE tenant_id = v_tenant_id AND name = 'Implementation' LIMIT 1;

  -- ============================================================
  -- CI PROJECTS
  -- ============================================================
  INSERT INTO ci_projects (
    tenant_id, site_id, stage_id, title, description,
    priority, status, owner, target_kpi, target_improvement
  ) VALUES
  (v_tenant_id, v_site_id, v_ci_stage_analysis, 'Reduce SAIDI Below 4 Minutes', 
    'Systematic analysis of outage causes and implementation of rapid restoration procedures to reduce SAIDI from 5.2 to below 4.0 minutes per year',
    'high', 'active', 'Ahmed Al Rashid', 'SAIDI', '25% reduction in 6 months'),
  (v_tenant_id, v_site_id, v_ci_stage_implementation, 'Automatic Voltage Regulation Improvement',
    'Upgrade AVR systems at 3 key substations to maintain voltage within ±1% of nominal across the transmission network',
    'high', 'active', 'Mohammed Al Farsi', 'Voltage Profile', '±1% voltage deviation'),
  (v_tenant_id, v_site_id, v_ci_stage_backlog, 'Transmission Loss Reduction Program',
    'Identify and address top transmission loss contributors through network optimization and equipment upgrades',
    'medium', 'active', 'Sara Al Mansoori', 'Transmission Losses', 'Reduce losses from 1.8% to 1.4%'),
  (v_tenant_id, v_site_id, v_ci_stage_analysis, 'Protection Relay Coordination Study',
    'Complete network-wide protection coordination study following recent relay misoperation events',
    'high', 'active', 'Khalid Al Hamadi', 'Relay Protection Accuracy', 'Zero misoperations')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Operational Excellence seed data inserted successfully for tenant: %', v_tenant_id;
END $$;
