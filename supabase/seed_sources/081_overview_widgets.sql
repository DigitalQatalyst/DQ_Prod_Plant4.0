BEGIN;

-- Precondition: Ensure tenant and dashboards exist
DO $$
DECLARE
  v_tenant_id UUID;
  v_dashboard_count INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  SELECT COUNT(*) INTO v_dashboard_count FROM overview_dashboards;
  
  IF v_tenant_id IS NULL OR v_dashboard_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants or dashboards found';
  END IF;
END $$;

-- 1) Seed Overview Widgets
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO overview_widgets (tenant_id, widget_key, name, description, source_feature_area)
SELECT 
  t.id,
  v.widget_key,
  v.name,
  v.description,
  v.area
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('kpi_summary', 'KPI Summary', 'Total assets, active alerts, and open work items', 'Overview'),
  ('top_alerts', 'Top Alerts', 'Highest priority active alerts', 'Overview'),
  ('data_freshness', 'Data Freshness', 'Telemetry staleness by site', 'Overview'),
  ('health_score', 'Platform Health Score', 'Composite health score and trends', 'Overview'),
  ('integration_status', 'Integration Status', 'Health of external data connectors', 'Settings'),
  ('work_item_backlog', 'Recent Work Items', 'Latest tasks and notifications', 'Overview'),
  ('asset_distribution', 'Asset Distribution', 'Assets by type and status', 'Asset Catalog'),
  ('topology_health', 'Topology Health', 'Grid connectivity and node status', 'Topology'),
  ('security_threats', 'Security Findings', 'Active cybersecurity alerts and threats', 'Overview'),
  ('energy_throughput', 'Energy Throughput', 'Daily power transmission volume', 'Overview')
) AS v(widget_key, name, description, area)
ON CONFLICT (tenant_id, widget_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_feature_area = EXCLUDED.source_feature_area
RETURNING id, widget_key;

-- 2) Seed Dashboard Widget placements
WITH dashboards AS (
  SELECT id, preset_type FROM overview_dashboards
),
widgets AS (
  SELECT id, widget_key FROM overview_widgets
)
INSERT INTO overview_dashboard_widgets (dashboard_id, widget_id, position, config)
SELECT 
  d.id,
  w.id,
  v.pos,
  v.config
FROM dashboards d
CROSS JOIN widgets w
JOIN (VALUES
  -- Operational Overview (ops)
  ('ops', 'kpi_summary', '{"x": 0, "y": 0, "w": 12, "h": 2}'::jsonb, '{"theme": "primary"}'::jsonb),
  ('ops', 'top_alerts', '{"x": 0, "y": 2, "w": 6, "h": 4}'::jsonb, '{"limit": 5}'::jsonb),
  ('ops', 'work_item_backlog', '{"x": 6, "y": 2, "w": 6, "h": 4}'::jsonb, '{"limit": 5}'::jsonb),
  ('ops', 'health_score', '{"x": 0, "y": 6, "w": 4, "h": 4}'::jsonb, '{}'::jsonb),
  ('ops', 'data_freshness', '{"x": 4, "y": 6, "w": 8, "h": 4}'::jsonb, '{}'::jsonb),
  
  -- Asset Reliability (reliability)
  ('reliability', 'kpi_summary', '{"x": 0, "y": 0, "w": 12, "h": 2}'::jsonb, '{}'::jsonb),
  ('reliability', 'asset_distribution', '{"x": 0, "y": 2, "w": 6, "h": 6}'::jsonb, '{}'::jsonb),
  ('reliability', 'topology_health', '{"x": 6, "y": 2, "w": 6, "h": 6}'::jsonb, '{}'::jsonb),
  
  -- Security Posture (security)
  ('security', 'security_threats', '{"x": 0, "y": 0, "w": 8, "h": 6}'::jsonb, '{"critical_only": false}'::jsonb),
  ('security', 'health_score', '{"x": 8, "y": 0, "w": 4, "h": 6}'::jsonb, '{"component": "security"}'::jsonb),
  
  -- Executive Summary (executive)
  ('executive', 'health_score', '{"x": 0, "y": 0, "w": 6, "h": 4}'::jsonb, '{"large": true}'::jsonb),
  ('executive', 'energy_throughput', '{"x": 6, "y": 0, "w": 6, "h": 4}'::jsonb, '{}'::jsonb),
  ('executive', 'integration_status', '{"x": 0, "y": 4, "w": 12, "h": 4}'::jsonb, '{"view": "simplified"}'::jsonb)
) AS v(preset, widget_key, pos, config) ON d.preset_type = v.preset AND w.widget_key = v.widget_key
ON CONFLICT (dashboard_id, widget_id) DO UPDATE SET
  position = EXCLUDED.position,
  config = EXCLUDED.config;

-- Post-seed validation
DO $$
DECLARE
  v_widget_count INTEGER;
  v_dw_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_widget_count FROM overview_widgets;
  SELECT COUNT(*) INTO v_dw_count FROM overview_dashboard_widgets;
  
  IF v_widget_count < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 widgets, got %', v_widget_count;
  END IF;
  
  IF v_dw_count < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 dashboard_widgets, got %', v_dw_count;
  END IF;
END $$;

COMMIT;
