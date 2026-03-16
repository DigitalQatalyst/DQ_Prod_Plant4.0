-- Create v_overview_kpis view
CREATE OR REPLACE VIEW v_overview_kpis AS
SELECT 
  t.id AS tenant_id,
  COUNT(DISTINCT a.id) AS total_assets,
  COUNT(DISTINCT CASE WHEN al.status IN ('open', 'acknowledged', 'in-progress') THEN al.id END) AS active_alerts,
  COUNT(DISTINCT CASE WHEN al.status IN ('open', 'acknowledged', 'in-progress') AND al.severity = 'critical' THEN al.id END) AS critical_alerts,
  COUNT(DISTINCT CASE WHEN wi.status IN ('open', 'in_progress') THEN wi.id END) AS open_work_items,
  COUNT(DISTINCT CASE WHEN phf.status = 'open' AND phf.check_key = 'telemetry_freshness' THEN phf.id END) AS stale_telemetry_count,
  COALESCE(AVG(CASE 
    WHEN ihe.status = 'healthy' THEN 100
    WHEN ihe.status = 'degraded' THEN 50
    WHEN ihe.status = 'down' THEN 0
  END), 0) AS integration_health_score,
  NOW() AS last_updated
FROM tenants t
LEFT JOIN assets a ON a.tenant_id = t.id
LEFT JOIN alerts al ON al.tenant_id = t.id
LEFT JOIN work_items wi ON wi.tenant_id = t.id
LEFT JOIN platform_health_findings phf ON phf.tenant_id = t.id
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (integration_id) status
  FROM integration_health_events
  WHERE tenant_id = t.id
  ORDER BY integration_id, timestamp DESC
) ihe ON true
GROUP BY t.id;

-- Create v_overview_top_alerts view
CREATE OR REPLACE VIEW v_overview_top_alerts AS
SELECT 
  a.*,
  ROW_NUMBER() OVER (
    PARTITION BY a.tenant_id 
    ORDER BY 
      CASE a.severity 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'info' THEN 3
      END,
      a.created_at DESC
  ) AS rank
FROM alerts a
WHERE a.status IN ('open', 'acknowledged', 'in-progress');

-- Create v_overview_data_freshness view
CREATE OR REPLACE VIEW v_overview_data_freshness AS
SELECT 
  tp.tenant_id,
  a.site_id,
  NULL::UUID AS stream_id,
  CAST(NULL AS TIMESTAMPTZ) AS last_telemetry_at,
  CAST(NULL AS NUMERIC) AS staleness_minutes,
  'unknown'::TEXT AS status
FROM telemetry_points tp
JOIN assets a ON a.id = tp.asset_id
GROUP BY tp.tenant_id, a.site_id;

-- Create fn_compute_platform_health_score function
CREATE OR REPLACE FUNCTION fn_compute_platform_health_score(p_tenant_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_integration_score NUMERIC;
  v_freshness_score NUMERIC;
  v_alert_score NUMERIC;
  v_final_score NUMERIC;
BEGIN
  -- Integration health (40% weight)
  SELECT COALESCE(AVG(CASE 
    WHEN status = 'healthy' THEN 100
    WHEN status = 'degraded' THEN 50
    ELSE 0
  END), 0) INTO v_integration_score
  FROM (
    SELECT DISTINCT ON (integration_id) status
    FROM integration_health_events
    WHERE tenant_id = p_tenant_id
    ORDER BY integration_id, timestamp DESC
  ) latest_health;
  
  -- Data freshness (30% weight)
  SELECT COALESCE(AVG(CASE 
    WHEN status = 'fresh' THEN 100
    WHEN status = 'stale' THEN 50
    ELSE 0
  END), 0) INTO v_freshness_score
  FROM v_overview_data_freshness
  WHERE tenant_id = p_tenant_id;
  
  -- Alert severity (30% weight)
  SELECT COALESCE(100 - (
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) * 10 +
    COUNT(CASE WHEN severity = 'warning' THEN 1 END) * 5
  ), 100) INTO v_alert_score
  FROM alerts
  WHERE tenant_id = p_tenant_id AND status IN ('open', 'acknowledged', 'in-progress');
  
  v_final_score := (
    v_integration_score * 0.4 +
    v_freshness_score * 0.3 +
    v_alert_score * 0.3
  );
  
  RETURN GREATEST(0, LEAST(100, v_final_score));
END;
$$ LANGUAGE plpgsql;
