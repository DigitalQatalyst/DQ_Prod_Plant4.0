-- Simple CI Seed Data (avoiding CROSS JOIN issues)
-- Description: Seeds CI stages, projects, RCA records, countermeasures, KPIs, impacts, and documents

-- =====================================================
-- PRECONDITION ASSERTIONS
-- =====================================================

DO $ 
DECLARE
  tenant_count INTEGER;
  site_count INTEGER;
  asset_count INTEGER;
  alert_count INTEGER;
BEGIN
  -- Check tenant exists
  SELECT COUNT(*) INTO tenant_count FROM tenants WHERE name = 'DEWA - Transmission';
  IF tenant_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: DEWA - Transmission tenant not found';
  END IF;

  -- Check sites exist
  SELECT COUNT(*) INTO site_count FROM sites WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1);
  IF site_count < 3 THEN
    RAISE EXCEPTION 'Precondition failed: Expected at least 3 sites, found %', site_count;
  END IF;

  -- Check assets exist
  SELECT COUNT(*) INTO asset_count FROM assets WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1);
  IF asset_count < 10 THEN
    RAISE EXCEPTION 'Precondition failed: Expected at least 10 assets, found %', asset_count;
  END IF;

  -- Check alerts exist
  SELECT COUNT(*) INTO alert_count FROM alerts WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1);
  IF alert_count < 5 THEN
    RAISE EXCEPTION 'Precondition failed: Expected at least 5 alerts, found %', alert_count;
  END IF;

  RAISE NOTICE 'Preconditions passed: tenant=%, sites=%, assets=%, alerts=%', tenant_count, site_count, asset_count, alert_count;
END $;

-- Get tenant ID
DO $ 
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;

  -- =====================================================
  -- CI STAGES SEED DATA
  -- =====================================================
  
  INSERT INTO ci_stages (tenant_id, code, name, sort_order) VALUES
    (tenant_uuid, 'backlog', 'Backlog', 1),
    (tenant_uuid, 'analysis', 'Analysis', 2),
    (tenant_uuid, 'countermeasures', 'Countermeasures', 3),
    (tenant_uuid, 'implementation', 'Implementation', 4),
    (tenant_uuid, 'verification', 'Verification', 5),
    (tenant_uuid, 'closed', 'Closed', 6)
  ON CONFLICT (tenant_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

  -- =====================================================
  -- CI KPIS SEED DATA
  -- =====================================================
  
  INSERT INTO ci_kpis (tenant_id, kpi_code, name, unit) VALUES
    (tenant_uuid, 'loss_pct', 'Loss Percentage', '%'),
    (tenant_uuid, 'saidi_proxy', 'SAIDI Proxy', 'minutes'),
    (tenant_uuid, 'saifi_proxy', 'SAIFI Proxy', 'count'),
    (tenant_uuid, 'misop_freq', 'Misoperation Frequency', 'events/month'),
    (tenant_uuid, 'xfmr_loading', 'Transformer Loading', '%'),
    (tenant_uuid, 'trip_count', 'Trip Count', 'trips/month')
  ON CONFLICT (tenant_id, kpi_code) DO UPDATE SET
    name = EXCLUDED.name,
    unit = EXCLUDED.unit;

END $;