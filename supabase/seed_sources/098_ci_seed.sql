-- Seed data for CI (Continuous Improvement) feature set
-- This creates CI stages, projects, RCA records, countermeasures, KPIs, impacts, and documents for DEWA Transmission tenant
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
  v_alert_count INTEGER;
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

  -- 4) Verify alerts exist (count >= 5)
  SELECT COUNT(*) INTO v_alert_count
  FROM alerts a
  INNER JOIN tenants t ON a.tenant_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_alert_count < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected >= 5 alerts for DEWA tenant, found %. Run 004_telemetry_alerts.sql first.', v_alert_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, sites=%, assets=%, alerts=%', v_site_count, v_asset_count, v_alert_count;
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
  SELECT a.id, a.name
  FROM assets a
  INNER JOIN tenant t ON a.tenant_id = t.id
  LIMIT 10
),
-- 4) Get alert IDs
alerts AS (
  SELECT a.id
  FROM alerts a
  INNER JOIN tenant t ON a.tenant_id = t.id
  LIMIT 10
),
-- 5) Get grid node IDs
grid_nodes_data AS (
  SELECT gn.id
  FROM grid_nodes gn
  INNER JOIN tenant t ON gn.tenant_id = t.id
  LIMIT 5
),
-- 6) Get grid line IDs
grid_lines_data AS (
  SELECT gl.id
  FROM grid_lines gl
  INNER JOIN tenant t ON gl.tenant_id = t.id
  LIMIT 5
),
-- 7) Upsert CI stages (6 stages)
upsert_stages AS (
  INSERT INTO ci_stages (tenant_id, code, name, sort_order)
  SELECT 
    (SELECT id FROM tenant),
    v.code,
    v.name,
    v.sort_order
  FROM (VALUES
    ('BACKLOG', 'Backlog', 1),
    ('ANALYSIS', 'Analysis', 2),
    ('COUNTERMEASURES', 'Countermeasures', 3),
    ('IMPLEMENTATION', 'Implementation', 4),
    ('VERIFICATION', 'Verification', 5),
    ('CLOSED', 'Closed', 6)
  ) AS v(code, name, sort_order)
  ON CONFLICT (tenant_id, code)
  DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id, code
),
-- 8) Force dependency: lookup stages from upsert_stages + existing ci_stages
stages_lookup AS (
  SELECT id, code FROM upsert_stages
  UNION ALL
  SELECT cs.id, cs.code
  FROM ci_stages cs
  INNER JOIN tenant t ON cs.tenant_id = t.id
),
-- 9) Upsert CI projects (12 projects across all stages)
upsert_projects AS (
  INSERT INTO ci_projects (tenant_id, project_ref, title, stage_id, site_id, owner, priority, status, start_date, due_date, summary, tags)
  SELECT 
    (SELECT id FROM tenant),
    v.project_ref,
    v.title,
    (SELECT id FROM stages_lookup WHERE code = v.stage_code LIMIT 1),
    (SELECT id FROM sites OFFSET v.site_offset LIMIT 1),
    v.owner,
    v.priority,
    v.status,
    v.start_date,
    v.due_date,
    v.summary,
    v.tags::jsonb
  FROM (VALUES
    ('CI-2024-001', 'Reduce relay misoperation frequency', 'BACKLOG', 0, 'Ahmed Al-Rashid', 'high', 'active', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '55 days', 'Investigate and reduce protection relay misoperations at Dubai Main substation', '["reliability", "protection"]'),
    ('CI-2024-002', 'Improve SAIDI performance', 'ANALYSIS', 1, 'Sarah Mohammed', 'high', 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days', 'Analyze outage data and implement measures to improve SAIDI index', '["reliability", "performance"]'),
    ('CI-2024-003', 'Optimize transformer loading', 'ANALYSIS', 2, 'Omar Hassan', 'medium', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', 'Balance transformer loading across Jebel Ali substations', '["efficiency", "loading"]'),
    ('CI-2024-004', 'Reduce transmission losses', 'COUNTERMEASURES', 0, 'Fatima Ali', 'high', 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '150 days', 'Implement measures to reduce transmission line losses by 2%', '["efficiency", "losses"]'),
    ('CI-2024-005', 'Trip cause investigation', 'COUNTERMEASURES', 1, 'Mohammed Khalil', 'medium', 'active', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '50 days', 'Investigate root causes of frequent trips on Line 2', '["reliability", "investigation"]'),
    ('CI-2024-006', 'Improve SAIFI metrics', 'IMPLEMENTATION', 2, 'Aisha Saeed', 'high', 'active', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '75 days', 'Reduce frequency of customer interruptions', '["reliability", "performance"]'),
    ('CI-2024-007', 'Voltage regulation improvement', 'IMPLEMENTATION', 0, 'Khalid Nasser', 'medium', 'active', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '115 days', 'Improve voltage regulation at Al Aweer substation', '["quality", "voltage"]'),
    ('CI-2024-008', 'Breaker maintenance optimization', 'VERIFICATION', 1, 'Mariam Ahmed', 'low', 'active', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '35 days', 'Optimize breaker maintenance schedules based on operation counts', '["maintenance", "optimization"]'),
    ('CI-2024-009', 'Communication system upgrade', 'VERIFICATION', 2, 'Hassan Ali', 'medium', 'active', CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE + INTERVAL '20 days', 'Verify improvements after SCADA communication upgrade', '["communication", "scada"]'),
    ('CI-2024-010', 'Protection coordination study', 'CLOSED', 0, 'Noura Rashid', 'high', 'completed', CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE - INTERVAL '5 days', 'Complete protection coordination study for Dubai network', '["protection", "study"]'),
    ('CI-2024-011', 'Asset condition monitoring', 'CLOSED', 1, 'Saif Mohammed', 'medium', 'completed', CURRENT_DATE - INTERVAL '125 days', CURRENT_DATE - INTERVAL '10 days', 'Implement condition monitoring for critical transformers', '["monitoring", "assets"]'),
    ('CI-2024-012', 'Emergency response procedure', 'CLOSED', 2, 'Layla Hassan', 'low', 'completed', CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE, 'Update emergency response procedures for all sites', '["procedures", "emergency"]')
  ) AS v(project_ref, title, stage_code, site_offset, owner, priority, status, start_date, due_date, summary, tags)
  ON CONFLICT (tenant_id, project_ref)
  DO UPDATE SET
    title = EXCLUDED.title,
    stage_id = EXCLUDED.stage_id,
    site_id = EXCLUDED.site_id,
    owner = EXCLUDED.owner,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    due_date = EXCLUDED.due_date,
    summary = EXCLUDED.summary,
    tags = EXCLUDED.tags,
    updated_at = now()
  RETURNING id, project_ref
),
-- 10) Force dependency: lookup projects from upsert_projects + existing ci_projects
projects_lookup AS (
  SELECT id, project_ref FROM upsert_projects
  UNION ALL
  SELECT cp.id, cp.project_ref
  FROM ci_projects cp
  INNER JOIN tenant t ON cp.tenant_id = t.id
),
-- 11) Upsert CI project links (24 links: 2 per project × 12 projects)
upsert_project_links AS (
  INSERT INTO ci_project_links (project_id, asset_id, node_id, line_id, alert_id)
  SELECT 
    p.id,
    CASE WHEN v.link_type = 'asset' THEN (SELECT id FROM assets OFFSET v.seq - 1 LIMIT 1) ELSE NULL END,
    CASE WHEN v.link_type = 'node' THEN (SELECT id FROM grid_nodes_data OFFSET (v.seq - 1) % 5 LIMIT 1) ELSE NULL END,
    CASE WHEN v.link_type = 'line' THEN (SELECT id FROM grid_lines_data OFFSET (v.seq - 1) % 5 LIMIT 1) ELSE NULL END,
    CASE WHEN v.link_type = 'alert' THEN (SELECT id FROM alerts OFFSET (v.seq - 1) % 10 LIMIT 1) ELSE NULL END
  FROM projects_lookup p
  CROSS JOIN (VALUES
    ('asset', 1), ('alert', 1),
    ('node', 1), ('asset', 2),
    ('line', 1), ('alert', 2),
    ('asset', 3), ('node', 2),
    ('alert', 3), ('line', 2),
    ('asset', 4), ('node', 3),
    ('line', 3), ('alert', 4),
    ('asset', 5), ('node', 4),
    ('alert', 5), ('line', 4),
    ('asset', 6), ('node', 5),
    ('line', 5), ('alert', 6),
    ('asset', 7), ('node', 1)
  ) AS v(link_type, seq)
  WHERE p.id IS NOT NULL
  ON CONFLICT DO NOTHING
  RETURNING id
),
-- 12) Upsert CI RCA records (12 RCA: 1 per project, alternating 5-Whys and Fishbone)
upsert_rca AS (
  INSERT INTO ci_rca (project_id, rca_type, content)
  SELECT 
    p.id,
    CASE WHEN v.seq % 2 = 1 THEN '5-whys' ELSE 'fishbone' END,
    CASE 
      WHEN v.seq % 2 = 1 THEN 
        jsonb_build_object(
          'why1', v.why1,
          'why2', v.why2,
          'why3', v.why3,
          'why4', v.why4,
          'why5', v.why5
        )
      ELSE
        jsonb_build_object(
          'people', v.people,
          'process', v.process,
          'equipment', v.equipment,
          'materials', v.materials,
          'environment', v.environment,
          'management', v.management
        )
    END
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM projects_lookup) p
  INNER JOIN (VALUES
    (1, 'Relay misoperation occurred', 'Settings were incorrect', 'Settings not updated after network change', 'Change management process not followed', 'Insufficient training on change procedures', 'Operator error', 'No verification step', 'Old relay model', 'No spare parts', 'High temperature', 'No formal review process'),
    (2, 'High SAIDI index due to recurring faults', 'Frequent cable punctures', 'Soil acidic corrosion', 'Cable protection failed', 'No regular soil analysis', 'External damage during excavation', 'Insufficient surveillance', 'Poor cable insulation', 'No spare cable drums', 'Water logging in trenches', 'Asset replacement deferred'),
    (3, 'Transformer overheating during peak', 'Cooling fans inadequate', 'Maintenance backlog on radiators', 'Cleaning schedule not maintained', 'Staff shortage during summer', 'Operator failed to switch backup', 'Inaccurate thermal sensors', 'Restricted airflow', 'Missing fan blades', 'Ambient temp exceeded design', 'No dynamic rating system'),
    (4, 'Transmission efficiency gap', 'High reactive power flow', 'Capacitor bank offline', 'Control fuse blown', 'Shift check missed', 'Faulty capacitor cells', 'No real-time loss monitoring', 'Excessive harmonic levels', 'Poor conductor contact', 'Humidity in control panel', 'Efficiency targets not linked to bonus'),
    (5, 'Frequent GIS line trips', 'SF6 gas leakage', 'Seal degradation', 'Exposure to salt spray', 'No periodic gas analysis', 'Contractor used wrong torque', 'Torque wrench uncalibrated', 'Valve body corrosion', 'Seal material incompatible', 'Coastal environment', 'GIS maintenance procedure outdated'),
    (6, 'High SAIFI frequency at Substation B', 'Bird strikes on busbars', 'Insufficient insulation covers', 'Covers dislodged by wind', 'Poor mounting clip design', 'Inspection missed height check', 'Manual records kept incorrectly', 'Conductive animal nesting', 'Lack of repellent devices', 'Migration season peak', 'No wildlife mitigation strategy'),
    (7, 'Recurring voltage dips', 'Slow tap changer response', 'Stuck diverter switch', 'Oil carbonization', 'Filtering cycle interval too long', 'Incomplete tap operation alarm missed', 'Control relay jitter', 'Contact wear beyond limit', 'Lead contamination in oil', 'System frequency fluctuation', 'AVR settings too tight'),
    (8, 'Circuit breaker "Trip Circuit Supervised" alarm', 'Loose wiring connection', 'Vibration in breaker panel', 'Inadequate mounting fasteners', 'Quality check not enforced', 'Technician missed terminal 4B', 'High resistance contact', 'Auxiliary contact burnt', 'Missing jumper wire', 'Ambient vibration from nearby pump', 'Wiring diagram label error'),
    (9, 'SCADA data gaps appearing daily', 'Packet loss in wireless link', 'Antenna misalignment', 'Wind load on mast', 'Loose mounting bolts', 'No mast stability check', 'Network switch buffer overflow', 'Old firmware on RTU', 'Fibre optic patch cord kink', 'Seasonal signal fading', 'Lack of bandwidth management'),
    (10, 'Control room operator fatigue issues', 'Excessive nuisance alarms', 'Bad alarm configuration', 'Lack of systematic review', 'No alarm management policy', 'Operator overwhelmed by flashes', 'Slow human-machine interface (HMI)', 'Glare on monitor screen', 'Uncomfortable chair design', 'High ambient noise level', 'Shift rotation pattern too fast'),
    (11, 'Battery bank capacity drop', 'Uneven cell charging', 'Charger calibration error', 'No periodic discharge test', 'Test equipment unavailable', 'Corroded battery terminals', 'Loose inter-cell connectors', 'Electrolyte level low', 'Incompatible battery models mixed', 'High battery room temperature', 'Battery management system (BMS) offline'),
    (12, 'Emergency restoration delay', 'Key to substation gate missing', 'Master key system failed', 'Responsibility changed recently', 'Access database not updated', 'Drive time miscalculated', 'Traffic congestion on main route', 'Fault finding equipment flat battery', 'Missing test leads in vehicle', 'Poor mobile signal at site', 'No off-grid communication tool')
  ) AS v(seq, why1, why2, why3, why4, why5, people, process, equipment, materials, environment, management) ON p.rn = v.seq
  WHERE p.id IS NOT NULL
  ON CONFLICT (project_id, rca_type)
  DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now()
  RETURNING id, rca_type
),
-- 13) Upsert CI countermeasures (30 countermeasures: 2-3 per project)
upsert_countermeasures AS (
  INSERT INTO ci_countermeasures (tenant_id, cm_ref, project_id, owner, status, due_date, summary, effectiveness_score)
  SELECT 
    (SELECT id FROM tenant),
    v.cm_ref,
    (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1),
    v.owner,
    v.status,
    v.due_date,
    v.summary,
    v.effectiveness_score
  FROM (VALUES
    ('CM-2024-001', 'CI-2024-001', 'Ahmed Al-Rashid', 'planned', CURRENT_DATE + INTERVAL '25 days', 'Update relay settings per latest coordination study', NULL),
    ('CM-2024-002', 'CI-2024-001', 'Sarah Mohammed', 'planned', CURRENT_DATE + INTERVAL '30 days', 'Implement change management procedure for protection settings', NULL),
    ('CM-2024-003', 'CI-2024-002', 'Omar Hassan', 'in-progress', CURRENT_DATE + INTERVAL '48 days', 'Install additional sectionalizing switches', NULL),
    ('CM-2024-004', 'CI-2024-002', 'Fatima Ali', 'in-progress', CURRENT_DATE + INTERVAL '53 days', 'Upgrade aging circuit breakers', NULL),
    ('CM-2024-005', 'CI-2024-002', 'Mohammed Khalil', 'planned', CURRENT_DATE + INTERVAL '58 days', 'Implement predictive maintenance program', NULL),
    ('CM-2024-006', 'CI-2024-003', 'Aisha Saeed', 'in-progress', CURRENT_DATE + INTERVAL '79 days', 'Install load monitoring system', NULL),
    ('CM-2024-007', 'CI-2024-003', 'Khalid Nasser', 'planned', CURRENT_DATE + INTERVAL '84 days', 'Develop load balancing procedure', NULL),
    ('CM-2024-008', 'CI-2024-004', 'Mariam Ahmed', 'in-progress', CURRENT_DATE + INTERVAL '104 days', 'Install capacitor banks for reactive power compensation', NULL),
    ('CM-2024-009', 'CI-2024-004', 'Hassan Ali', 'in-progress', CURRENT_DATE + INTERVAL '109 days', 'Optimize voltage control strategy', NULL),
    ('CM-2024-010', 'CI-2024-004', 'Noura Rashid', 'planned', CURRENT_DATE + INTERVAL '114 days', 'Replace aging conductors on high-loss lines', NULL),
    ('CM-2024-011', 'CI-2024-005', 'Saif Mohammed', 'in-progress', CURRENT_DATE + INTERVAL '37 days', 'Adjust protection relay sensitivity', NULL),
    ('CM-2024-012', 'CI-2024-005', 'Layla Hassan', 'planned', CURRENT_DATE + INTERVAL '43 days', 'Perform protection coordination study', NULL),
    ('CM-2024-013', 'CI-2024-006', 'Ahmed Al-Rashid', 'in-progress', CURRENT_DATE + INTERVAL '58 days', 'Install auto-reclose functionality', NULL),
    ('CM-2024-014', 'CI-2024-006', 'Sarah Mohammed', 'in-progress', CURRENT_DATE + INTERVAL '63 days', 'Implement vegetation management program', NULL),
    ('CM-2024-015', 'CI-2024-006', 'Omar Hassan', 'planned', CURRENT_DATE + INTERVAL '68 days', 'Upgrade breaker maintenance schedule', NULL),
    ('CM-2024-016', 'CI-2024-007', 'Fatima Ali', 'in-progress', CURRENT_DATE + INTERVAL '89 days', 'Repair tap changer control circuit', NULL),
    ('CM-2024-017', 'CI-2024-007', 'Mohammed Khalil', 'planned', CURRENT_DATE + INTERVAL '94 days', 'Implement automatic voltage regulation', NULL),
    ('CM-2024-018', 'CI-2024-008', 'Aisha Saeed', 'completed', CURRENT_DATE - INTERVAL '20 days', 'Install breaker operation counters', 85),
    ('CM-2024-019', 'CI-2024-008', 'Khalid Nasser', 'verified', CURRENT_DATE - INTERVAL '15 days', 'Develop condition-based maintenance schedule', 90),
    ('CM-2024-020', 'CI-2024-009', 'Mariam Ahmed', 'completed', CURRENT_DATE - INTERVAL '25 days', 'Upgrade SCADA communication network', 88),
    ('CM-2024-021', 'CI-2024-009', 'Hassan Ali', 'verified', CURRENT_DATE - INTERVAL '19 days', 'Install redundant communication links', 92),
    ('CM-2024-022', 'CI-2024-010', 'Noura Rashid', 'completed', CURRENT_DATE - INTERVAL '40 days', 'Perform protection coordination study', 95),
    ('CM-2024-023', 'CI-2024-010', 'Saif Mohammed', 'verified', CURRENT_DATE - INTERVAL '38 days', 'Update protection settings database', 93),
    ('CM-2024-024', 'CI-2024-010', 'Layla Hassan', 'verified', CURRENT_DATE - INTERVAL '36 days', 'Train operators on new protection scheme', 87),
    ('CM-2024-025', 'CI-2024-011', 'Ahmed Al-Rashid', 'completed', CURRENT_DATE - INTERVAL '45 days', 'Install online monitoring sensors', 91),
    ('CM-2024-026', 'CI-2024-011', 'Sarah Mohammed', 'verified', CURRENT_DATE - INTERVAL '42 days', 'Develop condition monitoring procedures', 89),
    ('CM-2024-027', 'CI-2024-012', 'Omar Hassan', 'completed', CURRENT_DATE - INTERVAL '35 days', 'Update emergency response procedures', 86),
    ('CM-2024-028', 'CI-2024-012', 'Fatima Ali', 'verified', CURRENT_DATE - INTERVAL '32 days', 'Conduct emergency response drills', 88),
    ('CM-2024-029', 'CI-2024-012', 'Mohammed Khalil', 'verified', CURRENT_DATE - INTERVAL '30 days', 'Prepare emergency equipment kits', 90),
    ('CM-2024-030', 'CI-2024-001', 'Aisha Saeed', 'planned', CURRENT_DATE + INTERVAL '35 days', 'Train operators on relay settings verification', NULL)
  ) AS v(cm_ref, project_ref, owner, status, due_date, summary, effectiveness_score)
  ON CONFLICT (tenant_id, cm_ref)
  DO UPDATE SET
    project_id = EXCLUDED.project_id,
    owner = EXCLUDED.owner,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date,
    summary = EXCLUDED.summary,
    effectiveness_score = EXCLUDED.effectiveness_score,
    updated_at = now()
  RETURNING id, cm_ref
),
-- 14) Upsert CI KPIs (6 KPIs)
upsert_kpis AS (
  INSERT INTO ci_kpis (tenant_id, kpi_code, name, unit)
  SELECT 
    (SELECT id FROM tenant),
    v.kpi_code,
    v.name,
    v.unit
  FROM (VALUES
    ('LOSS_PCT', 'Transmission Loss Percentage', '%'),
    ('SAIDI', 'System Average Interruption Duration Index', 'minutes'),
    ('SAIFI', 'System Average Interruption Frequency Index', 'interruptions'),
    ('MISOP_FREQ', 'Relay Misoperation Frequency', 'events/month'),
    ('XFMR_LOAD', 'Transformer Loading', '%'),
    ('TRIP_COUNT', 'Line Trip Count', 'trips/month')
  ) AS v(kpi_code, name, unit)
  ON CONFLICT (tenant_id, kpi_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    unit = EXCLUDED.unit
  RETURNING id, kpi_code
),
-- 15) Force dependency: lookup KPIs from upsert_kpis + existing ci_kpis
kpis_lookup AS (
  SELECT id, kpi_code FROM upsert_kpis
  UNION ALL
  SELECT ck.id, ck.kpi_code
  FROM ci_kpis ck
  INNER JOIN tenant t ON ck.tenant_id = t.id
),
-- 16) Upsert CI KPI links (18 links: 1-2 KPIs per project)
upsert_kpi_links AS (
  INSERT INTO ci_kpi_links (project_id, kpi_id)
  SELECT 
    (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1),
    (SELECT id FROM kpis_lookup WHERE kpi_code = v.kpi_code LIMIT 1)
  FROM (VALUES
    ('CI-2024-001', 'MISOP_FREQ'),
    ('CI-2024-002', 'SAIDI'),
    ('CI-2024-002', 'SAIFI'),
    ('CI-2024-003', 'XFMR_LOAD'),
    ('CI-2024-004', 'LOSS_PCT'),
    ('CI-2024-005', 'TRIP_COUNT'),
    ('CI-2024-005', 'MISOP_FREQ'),
    ('CI-2024-006', 'SAIFI'),
    ('CI-2024-007', 'LOSS_PCT'),
    ('CI-2024-008', 'TRIP_COUNT'),
    ('CI-2024-009', 'SAIDI'),
    ('CI-2024-010', 'MISOP_FREQ'),
    ('CI-2024-010', 'TRIP_COUNT'),
    ('CI-2024-011', 'XFMR_LOAD'),
    ('CI-2024-011', 'SAIDI'),
    ('CI-2024-012', 'SAIDI'),
    ('CI-2024-012', 'SAIFI'),
    ('CI-2024-003', 'LOSS_PCT')
  ) AS v(project_ref, kpi_code)
  WHERE (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1) IS NOT NULL
    AND (SELECT id FROM kpis_lookup WHERE kpi_code = v.kpi_code LIMIT 1) IS NOT NULL
  ON CONFLICT (project_id, kpi_id)
  DO NOTHING
  RETURNING id
),
-- 17) Upsert CI impacts (12 impact measurements)
upsert_impacts AS (
  INSERT INTO ci_impacts (project_id, kpi_id, baseline, target, actual, impact_value, notes)
  SELECT 
    (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1),
    (SELECT id FROM kpis_lookup WHERE kpi_code = v.kpi_code LIMIT 1),
    v.baseline,
    v.target,
    v.actual,
    CASE 
      WHEN v.target != v.baseline THEN ((v.actual - v.baseline) / (v.target - v.baseline) * 100)
      ELSE NULL
    END,
    v.notes
  FROM (VALUES
    ('CI-2024-008', 'TRIP_COUNT', 12.0, 8.0, 9.5, 'Reduced trip count by implementing condition-based maintenance. High correlation with vibration reduction.'),
    ('CI-2024-009', 'SAIDI', 45.0, 35.0, 38.0, 'Improved SAIDI through communication system upgrade. Packet loss reduced from 5% to 0.1%.'),
    ('CI-2024-010', 'MISOP_FREQ', 3.5, 1.5, 1.8, 'Reduced misoperations through protection coordination study. Secondary benefit: improved fault clearing speed.'),
    ('CI-2024-010', 'TRIP_COUNT', 15.0, 10.0, 11.0, 'Fewer trips after protection settings update. Sustained performance over 3 months.'),
    ('CI-2024-011', 'XFMR_LOAD', 92.0, 85.0, 87.0, 'Improved transformer loading through condition monitoring. Optimized load shedding triggers.'),
    ('CI-2024-011', 'SAIDI', 50.0, 40.0, 42.0, 'Reduced outage duration with predictive maintenance. Detected incipient fault on T3 bushing.'),
    ('CI-2024-012', 'SAIDI', 48.0, 38.0, 40.0, 'Faster restoration with updated emergency procedures. Average dispatch time improved by 12 mins.'),
    ('CI-2024-012', 'SAIFI', 2.8, 2.0, 2.2, 'Fewer interruptions with improved response. Improved network switching reliability.'),
    ('CI-2024-002', 'SAIDI', 52.0, 40.0, 46.0, 'Initial phase results for SAIDI improvement. Focusing on coastal corrosion issues now.'),
    ('CI-2024-004', 'LOSS_PCT', 4.2, 3.2, 3.8, 'Early results from capacitor bank pilot. Reactive power flow reduced at Substation A.'),
    ('CI-2024-006', 'SAIFI', 3.2, 2.5, 2.9, 'Refining auto-reclose settings at remote nodes. Bird strike frequency declining.'),
    ('CI-2024-007', 'LOSS_PCT', 3.8, 3.0, 3.5, 'Voltage regulation stabilized. Tap changer operations normalized across peak hours.'),
    ('CI-2024-001', 'MISOP_FREQ', 4.2, 2.0, 3.9, 'Initial baseline measurement captured. Relay settings audit underway. Early data shows slight natural variation.'),
    ('CI-2024-003', 'XFMR_LOAD', 91.5, 82.0, 89.0, 'Transformer loading profiled across peak and off-peak hours. Load balancing strategy under analysis.'),
    ('CI-2024-003', 'LOSS_PCT', 4.5, 3.5, 4.2, 'Reactive power contribution identified as primary driver of losses at Jebel Ali substations.'),
    ('CI-2024-005', 'TRIP_COUNT', 18.0, 12.0, 15.5, 'Trip frequency declining since SF6 gas leakage was contained. Targeted maintenance has reduced incidents.'),
    ('CI-2024-005', 'MISOP_FREQ', 3.0, 1.5, 2.4, 'Protection relay sensitivity adjustment in-progress. Misoperation rate tracking downward.')
  ) AS v(project_ref, kpi_code, baseline, target, actual, notes)
  WHERE (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1) IS NOT NULL
    AND (SELECT id FROM kpis_lookup WHERE kpi_code = v.kpi_code LIMIT 1) IS NOT NULL
  ON CONFLICT (project_id, kpi_id)
  DO UPDATE SET
    baseline = EXCLUDED.baseline,
    target = EXCLUDED.target,
    actual = EXCLUDED.actual,
    impact_value = EXCLUDED.impact_value,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING id
),
-- 18) Upsert CI documents (20 document metadata records)
upsert_documents AS (
  INSERT INTO ci_documents (project_id, doc_ref, name, doc_type, url)
  SELECT 
    (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1),
    v.doc_ref,
    v.name,
    v.doc_type,
    v.url
  FROM (VALUES
    ('CI-2024-001', 'DOC-001-001', 'Relay Settings Analysis Report', 'analysis', 'https://docs.example.com/ci-001-analysis.pdf'),
    ('CI-2024-001', 'DOC-001-002', 'Protection Coordination Study', 'report', 'https://docs.example.com/ci-001-coordination.pdf'),
    ('CI-2024-002', 'DOC-002-001', 'SAIDI Historical Data Analysis', 'analysis', 'https://docs.example.com/ci-002-saidi-analysis.pdf'),
    ('CI-2024-002', 'DOC-002-002', 'Outage Root Cause Report', 'report', 'https://docs.example.com/ci-002-outage-rca.pdf'),
    ('CI-2024-003', 'DOC-003-001', 'Transformer Loading Study', 'analysis', 'https://docs.example.com/ci-003-loading.pdf'),
    ('CI-2024-003', 'DOC-003-002', 'Load Balancing Procedure', 'procedure', 'https://docs.example.com/ci-003-procedure.pdf'),
    ('CI-2024-004', 'DOC-004-001', 'Loss Reduction Analysis', 'analysis', 'https://docs.example.com/ci-004-loss-analysis.pdf'),
    ('CI-2024-004', 'DOC-004-002', 'Capacitor Bank Installation Plan', 'diagram', 'https://docs.example.com/ci-004-capacitor-plan.pdf'),
    ('CI-2024-005', 'DOC-005-001', 'Trip Investigation Report', 'report', 'https://docs.example.com/ci-005-trip-report.pdf'),
    ('CI-2024-005', 'DOC-005-002', 'Line 2 Protection Settings', 'analysis', 'https://docs.example.com/ci-005-settings.pdf'),
    ('CI-2024-006', 'DOC-006-001', 'SAIFI Improvement Plan', 'report', 'https://docs.example.com/ci-006-saifi-plan.pdf'),
    ('CI-2024-006', 'DOC-006-002', 'Auto-Reclose Implementation', 'procedure', 'https://docs.example.com/ci-006-autoreclose.pdf'),
    ('CI-2024-007', 'DOC-007-001', 'Voltage Regulation Study', 'analysis', 'https://docs.example.com/ci-007-voltage-study.pdf'),
    ('CI-2024-008', 'DOC-008-001', 'Breaker Maintenance Optimization', 'report', 'https://docs.example.com/ci-008-breaker-opt.pdf'),
    ('CI-2024-009', 'DOC-009-001', 'SCADA Communication Upgrade', 'report', 'https://docs.example.com/ci-009-scada-upgrade.pdf'),
    ('CI-2024-010', 'DOC-010-001', 'Protection Coordination Final Report', 'report', 'https://docs.example.com/ci-010-final-report.pdf'),
    ('CI-2024-010', 'DOC-010-002', 'Network Single Line Diagram', 'diagram', 'https://docs.example.com/ci-010-sld.pdf'),
    ('CI-2024-011', 'DOC-011-001', 'Condition Monitoring Implementation', 'report', 'https://docs.example.com/ci-011-monitoring.pdf'),
    ('CI-2024-012', 'DOC-012-001', 'Emergency Response Procedures', 'procedure', 'https://docs.example.com/ci-012-emergency.pdf'),
    ('CI-2024-012', 'DOC-012-002', 'Emergency Drill Results', 'report', 'https://docs.example.com/ci-012-drill-results.pdf')
  ) AS v(project_ref, doc_ref, name, doc_type, url)
  WHERE (SELECT id FROM projects_lookup WHERE project_ref = v.project_ref LIMIT 1) IS NOT NULL
  ON CONFLICT (project_id, doc_ref)
  DO UPDATE SET
    name = EXCLUDED.name,
    doc_type = EXCLUDED.doc_type,
    url = EXCLUDED.url
  RETURNING id, doc_ref
)
SELECT 
  (SELECT COUNT(*) FROM upsert_stages) as stages_created,
  (SELECT COUNT(*) FROM upsert_projects) as projects_created,
  (SELECT COUNT(*) FROM upsert_rca) as rca_created,
  (SELECT COUNT(*) FROM upsert_countermeasures) as countermeasures_created,
  (SELECT COUNT(*) FROM upsert_kpis) as kpis_created,
  (SELECT COUNT(*) FROM upsert_impacts) as impacts_created,
  (SELECT COUNT(*) FROM upsert_documents) as documents_created;

-- ============================================================================
-- POST-SEED VALIDATION
-- Fail loudly if expected counts are not met
-- ============================================================================
DO $$
DECLARE
  v_projects_count INTEGER;
  v_rca_count INTEGER;
  v_countermeasures_count INTEGER;
  v_kpis_count INTEGER;
BEGIN
  -- Get tenant-specific counts
  SELECT 
    (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))),
    (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)),
    (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))
  INTO v_projects_count, v_rca_count, v_countermeasures_count, v_kpis_count;
  
  -- Validate minimum counts
  IF v_projects_count < 12 THEN
    RAISE EXCEPTION 'SEED 009_ci_seed.sql FAILED: expected >= 12 ci_projects for DEWA tenant, found %', v_projects_count;
  END IF;
  
  IF v_rca_count < 12 THEN
    RAISE EXCEPTION 'SEED 009_ci_seed.sql FAILED: expected >= 12 ci_rca records for DEWA tenant, found %', v_rca_count;
  END IF;
  
  IF v_countermeasures_count < 30 THEN
    RAISE EXCEPTION 'SEED 009_ci_seed.sql FAILED: expected >= 30 ci_countermeasures for DEWA tenant, found %', v_countermeasures_count;
  END IF;
  
  IF v_kpis_count < 6 THEN
    RAISE EXCEPTION 'SEED 009_ci_seed.sql FAILED: expected >= 6 ci_kpis for DEWA tenant, found %', v_kpis_count;
  END IF;
  
  RAISE NOTICE 'Seed 009_ci_seed.sql OK: projects=%, rca=%, countermeasures=%, kpis=%', 
    v_projects_count, v_rca_count, v_countermeasures_count, v_kpis_count;
END $$;

COMMIT;

-- ============================================================================
-- CI REPORTS SEED DATA
-- ============================================================================

-- Insert CI Reports
INSERT INTO ci_reports (tenant_id, report_ref, name, report_type, scope, status, generated_date, author, recipients, content)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' AND subsector = 'transmission' LIMIT 1),
  v.report_ref,
  v.name,
  v.report_type,
  v.scope,
  v.status,
  v.generated_date,
  v.author,
  v.recipients,
  v.content::jsonb
FROM (VALUES
  ('RPT-2024-001', 'Monthly CI Summary - December', 'Summary Report', 'Plant-wide', 'published', CURRENT_DATE - INTERVAL '15 days', 'CI Team', 15, '{"sections": ["Executive Summary", "Project Status", "Impact Analysis", "Recommendations"], "highlights": "3 critical projects closed, 12% improvement in SAIDI.", "risks": "Budget delays for Q1 projects."}'),
  ('RPT-2024-002', 'Q4 Impact Assessment', 'Impact Report', 'All Projects', 'published', CURRENT_DATE - INTERVAL '20 days', 'Sarah Mohammed', 12, '{"sections": ["Impact Overview", "KPI Analysis", "Cost Savings", "Future Outlook"], "savings_usd": 125000, "major_wins": "Transformer life extension pilot successful."}'),
  ('RPT-2024-003', 'Protection System Improvements', 'Technical Report', 'Protection Projects', 'in-review', CURRENT_DATE - INTERVAL '10 days', 'Ahmed Al-Rashid', 8, '{"sections": ["Current State", "Improvements", "Test Results", "Recommendations"], "technical_findings": "Numerical relays showing better performance than old static types."}'),
  ('RPT-2024-004', 'Reliability Enhancement Status', 'Status Report', 'Active Projects', 'in-review', CURRENT_DATE - INTERVAL '8 days', 'Fatima Ali', 10, '{"sections": ["Project Status", "Milestones", "Risks", "Next Steps"], "status_summary": "75% of milestones on track. No safety incidents."}'),
  ('RPT-2024-005', 'Asset Condition Monitoring Report', 'Technical Report', 'Asset Management', 'published', CURRENT_DATE - INTERVAL '25 days', 'Omar Hassan', 18, '{"sections": ["Asset Health", "Monitoring Results", "Maintenance Needs", "Budget Impact"], "top_recommendation": "Replace T4 bushing by end of month."}'),
  ('RPT-2024-006', 'January CI Planning', 'Planning Report', 'Future Projects', 'draft', CURRENT_DATE - INTERVAL '3 days', 'Mohammed Khalil', 0, '{"sections": ["Proposed Projects", "Resource Allocation", "Timeline", "Budget"], "pipeline_count": 5}'),
  ('RPT-2024-007', 'Loss Reduction Initiative', 'Impact Report', 'Efficiency Projects', 'draft', CURRENT_DATE - INTERVAL '5 days', 'Aisha Saeed', 0, '{"sections": ["Current Losses", "Reduction Strategies", "Expected Impact", "Implementation Plan"], "loss_reduction_target": "500 MWh/year"}'),
  ('RPT-2024-008', 'Training Effectiveness Analysis', 'Analysis Report', 'Training Programs', 'published', CURRENT_DATE - INTERVAL '30 days', 'Khalid Nasser', 14, '{"sections": ["Training Overview", "Effectiveness Metrics", "Skill Gaps", "Recommendations"], "certification_rate": "92%"}')
) AS v(report_ref, name, report_type, scope, status, generated_date, author, recipients, content)
ON CONFLICT (tenant_id, report_ref)
DO UPDATE SET
  name = EXCLUDED.name,
  report_type = EXCLUDED.report_type,
  scope = EXCLUDED.scope,
  status = EXCLUDED.status,
  generated_date = EXCLUDED.generated_date,
  author = EXCLUDED.author,
  recipients = EXCLUDED.recipients,
  content = EXCLUDED.content,
  updated_at = now();

-- ============================================================================
-- SUMMARY REPORT
-- Show final counts for verification
-- ============================================================================
SELECT 
  'CI Seed Summary' as report_title,
  (SELECT COUNT(*) FROM ci_stages WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as stages,
  (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as projects,
  (SELECT COUNT(*) FROM ci_project_links WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as project_links,
  (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as rca_records,
  (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as countermeasures,
  (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as kpis,
  (SELECT COUNT(*) FROM ci_kpi_links WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as kpi_links,
  (SELECT COUNT(*) FROM ci_impacts WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as impacts,
  (SELECT COUNT(*) FROM ci_documents WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as documents,
  (SELECT COUNT(*) FROM ci_reports WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as reports;
