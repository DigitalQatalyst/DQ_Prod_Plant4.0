-- Comprehensive seed data for Performance feature set
-- This creates performance panels, losses, bottlenecks, trends, and benchmarks for DEWA Transmission tenant
-- Standardized to follow the project's CTE pattern and robust tenant identification.

BEGIN;

-- ============================================================================
-- 1) Get Base Identifiers
-- ============================================================================
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Get site IDs for linking
sites_data AS (
  SELECT s.id, s.name
  FROM sites s
  INNER JOIN tenant t ON s.tenant_id = t.id
),
-- Get asset IDs for linking
assets_data AS (
  SELECT a.id, a.name, a.site_id
  FROM assets a
  INNER JOIN tenant t ON a.tenant_id = t.id
),

-- ============================================================================
-- 2) Insert Performance Panels
-- ============================================================================
insert_panels AS (
  INSERT INTO performance_panels (
    tenant_id, site_id, asset_id,
    name, panel_type,
    oee_percentage, availability_percentage, performance_percentage, quality_percentage,
    line_loading, transformer_loading, transmission_losses, saidi, saifi, trip_count,
    status, last_updated
  )
  SELECT
    t.id,
    CASE 
      WHEN v.panel_type = 'site' THEN s.id
      WHEN v.panel_type = 'asset' THEN a.site_id
      ELSE NULL
    END,
    CASE 
      WHEN v.panel_type = 'asset' THEN a.id
      ELSE NULL
    END,
    v.name,
    v.panel_type::text,
    v.oee, v.availability, v.performance, v.quality,
    v.line_loading, v.transformer_loading, v.transmission_losses,
    v.saidi, v.saifi, v.trip_count,
    'active',
    NOW() - (v.hours_ago || ' hours')::INTERVAL
  FROM tenant t
  CROSS JOIN (VALUES
    -- System-level panel
    ('DEWA Transmission System Overview', 'system', NULL, NULL, 87.5, 92.3, 94.8, 100.0, 78.5, 85.2, 2.3, 45.2, 1.8, 12, 2),
    -- Site-level panels
    ('Dubai Main Substation Performance', 'site', 'Dubai Main Substation', NULL, 89.2, 94.1, 95.0, 99.8, 82.1, 88.5, 1.9, 38.5, 1.5, 8, 4),
    ('Jebel Ali Grid Station Performance', 'site', 'Jebel Ali Grid Station', NULL, 85.8, 90.5, 94.6, 100.0, 75.2, 82.0, 2.7, 52.0, 2.1, 16, 6),
    ('Al Aweer Regional Hub Performance', 'site', 'Al Aweer Regional Hub', NULL, 88.0, 93.2, 94.5, 99.9, 76.8, 84.3, 2.1, 42.8, 1.7, 10, 8),
    -- Asset-level panels
    ('Dubai T1 Main Transformer Performance', 'asset', NULL, 'Dubai T1 Main Transformer', 91.5, 96.2, 95.1, 100.0, NULL, 92.5, 1.8, NULL, NULL, 5, 1),
    ('Dubai T2 Backup Transformer Performance', 'asset', NULL, 'Dubai T2 Backup Transformer', 88.3, 93.8, 94.2, 99.8, NULL, 88.0, 2.2, NULL, NULL, 7, 3),
    ('Jebel Ali T1 Main Transformer Performance', 'asset', NULL, 'Jebel Ali T1 Main Transformer', 90.1, 95.0, 94.9, 100.0, NULL, 90.5, 1.9, NULL, NULL, 6, 5),
    ('Al Aweer T1 Main Transformer Performance', 'asset', NULL, 'Al Aweer T1 Main Transformer', 87.5, 92.5, 94.6, 99.9, NULL, 85.2, 2.4, NULL, NULL, 8, 7),
    ('Dubai 400kV Incomer CB Performance', 'asset', NULL, 'Dubai 400kV Incomer CB', 89.8, 94.5, 95.0, 100.0, NULL, NULL, NULL, NULL, NULL, 6, 9),
    ('Jebel Ali 400kV Incomer CB Performance', 'asset', NULL, 'Jebel Ali 400kV Incomer CB', 86.2, 91.0, 94.7, 100.0, NULL, NULL, NULL, NULL, NULL, 9, 11)
  ) AS v(name, panel_type, site_name, asset_name, oee, availability, performance, quality, line_loading, transformer_loading, transmission_losses, saidi, saifi, trip_count, hours_ago)
  LEFT JOIN sites_data s ON s.name = v.site_name
  LEFT JOIN assets_data a ON a.name = v.asset_name
  ON CONFLICT (tenant_id, name) DO NOTHING
),

-- ============================================================================
-- 3) Insert Performance Losses (Site AND Asset Level)
-- ============================================================================
insert_losses AS (
  INSERT INTO performance_losses (
    tenant_id, site_id, asset_id,
    loss_category, loss_type, description,
    duration_minutes, frequency_count, impact_percentage, energy_lost_mwh,
    occurred_at, resolved_at
  )
  -- Site Level Losses
  SELECT
    t.id, s.id, NULL,
    v.category, v.type, v.descr,
    v.dur, v.freq, v.impact, v.energy,
    NOW() - (v.days_ago || ' days')::INTERVAL, 
    NOW() - (v.days_ago || ' days')::INTERVAL + (v.dur || ' minutes')::INTERVAL
  FROM tenant t
  CROSS JOIN sites_data s
  CROSS JOIN (VALUES
    ('technical', 'Line Overload', 'Transmission line exceeded thermal capacity during peak demand', 45, 3, 12.5, 25.8, 2),
    ('non_technical', 'Scheduled Maintenance', 'Planned transformer maintenance outage', 120, 1, 8.3, 45.2, 5)
  ) AS v(category, type, descr, dur, freq, impact, energy, days_ago)
  
  UNION ALL
  
  -- Asset Level Losses (Transformers & Breakers)
  SELECT
    t.id, a.site_id, a.id,
    v.category, v.type, v.descr,
    v.dur, v.freq, v.impact, v.energy,
    NOW() - (v.days_ago || ' days')::INTERVAL, 
    NOW() - (v.days_ago || ' days')::INTERVAL + (v.dur || ' minutes')::INTERVAL
  FROM tenant t
  CROSS JOIN assets_data a
  CROSS JOIN (VALUES
    ('technical', 'Overheating', 'Transformer oil temperature exceeded threshold', 60, 2, 5.5, 12.4, 1),
    ('technical', 'Vibration', 'Abnormal vibration detected in cooling fan', 30, 4, 2.1, 4.5, 3),
    ('technical', 'Tap Changer Stuck', 'OLTC mechanism failed to operate', 180, 1, 15.0, 32.0, 7),
    ('non_technical', 'Cleaning', 'Scheduled cleaning of bushings', 90, 1, 0.0, 0.0, 14)
  ) AS v(category, type, descr, dur, freq, impact, energy, days_ago)
),

-- ============================================================================
-- 4) Insert Performance Bottlenecks (Asset-Specific with Variation)
-- ============================================================================
insert_bottlenecks AS (
  INSERT INTO performance_bottlenecks (
    tenant_id, site_id, asset_id,
    constraint_type, severity, description,
    capacity_limit_mw, current_loading_mw, loading_percentage,
    constraint_hours, status, resolved_at
  )
  -- Dubai T1 Main Transformer - 2 bottlenecks
  SELECT t.id, a.site_id, a.id,
    'thermal', 'high', 'Transformer winding temperature approaching limit during peak load', 
    150.0, 145.0, 96.7, 48, 'active', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Dubai T1 Main Transformer'
  
  UNION ALL
  
  SELECT t.id, a.site_id, a.id,
    'operational', 'medium', 'OLTC tap changer nearing maintenance cycle limit', 
    NULL, NULL, 85.0, 120, 'monitoring', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Dubai T1 Main Transformer'
  
  UNION ALL
  
  -- Dubai T2 Backup Transformer - 1 bottleneck
  SELECT t.id, a.site_id, a.id,
    'thermal', 'medium', 'Cooling system efficiency reduced, limiting capacity', 
    120.0, 105.0, 87.5, 72, 'monitoring', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Dubai T2 Backup Transformer'
  
  UNION ALL
  
  -- Jebel Ali T1 Main Transformer - 2 bottlenecks
  SELECT t.id, a.site_id, a.id,
    'thermal', 'high', 'Oil temperature high during sustained load', 
    180.0, 175.0, 97.2, 36, 'active', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Jebel Ali T1 Main Transformer'
  
  UNION ALL
  
  SELECT t.id, a.site_id, a.id,
    'voltage', 'low', 'Voltage regulation at edge of acceptable range', 
    NULL, NULL, 92.0, 24, 'monitoring', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Jebel Ali T1 Main Transformer'
  
  UNION ALL
  
  -- Al Aweer T1 Main Transformer - 2 bottlenecks
  SELECT t.id, a.site_id, a.id,
    'thermal', 'medium', 'Ambient temperature affecting transformer cooling', 
    140.0, 119.0, 85.0, 96, 'monitoring', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Al Aweer T1 Main Transformer'
  
  UNION ALL
  
  SELECT t.id, a.site_id, a.id,
    'operational', 'high', 'Bushing insulation degradation detected', 
    NULL, NULL, 78.0, 168, 'active', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Al Aweer T1 Main Transformer'
  
  UNION ALL
  
  -- Dubai 400kV Incomer CB - 1 bottleneck
  SELECT t.id, a.site_id, a.id,
    'operational', 'medium', 'Contact wear approaching maintenance threshold', 
    NULL, NULL, 82.0, 144, 'monitoring', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Dubai 400kV Incomer CB'
  
  UNION ALL
  
  -- Jebel Ali 400kV Incomer CB - 1 bottleneck
  SELECT t.id, a.site_id, a.id,
    'operational', 'high', 'Operating mechanism response time degraded', 
    NULL, NULL, 75.0, 192, 'active', NULL::timestamptz
  FROM tenant t
  CROSS JOIN assets_data a
  WHERE a.name = 'Jebel Ali 400kV Incomer CB'
),

-- ============================================================================
-- 5) Insert Performance Benchmarks (Real Comparisons from Panel Data)
-- ============================================================================
insert_benchmarks AS (
  INSERT INTO performance_benchmarks (
    tenant_id,
    benchmark_name, benchmark_type,
    entities, metrics,
    updated_at
  )
  -- Transformer Fleet Benchmark (based on actual OEE values)
  SELECT
    t.id,
    'Transformer Fleet Performance Benchmark', 'asset_comparison',
    jsonb_build_array(
      jsonb_build_object('entity_id', 'T1', 'entity_name', 'Dubai T1 Main', 'entity_type', 'asset', 'rank', 1, 'percentile', 98),
      jsonb_build_object('entity_id', 'T3', 'entity_name', 'Jebel Ali T1', 'entity_type', 'asset', 'rank', 2, 'percentile', 92),
      jsonb_build_object('entity_id', 'T2', 'entity_name', 'Dubai T2 Backup', 'entity_type', 'asset', 'rank', 3, 'percentile', 76),
      jsonb_build_object('entity_id', 'T4', 'entity_name', 'Al Aweer T1', 'entity_type', 'asset', 'rank', 4, 'percentile', 65)
    ),
    jsonb_build_array(
      jsonb_build_object('metric_name', 'OEE', 'metric_value', 89.3, 'target_value', 85.0, 'benchmark_value', 91.5),
      jsonb_build_object('metric_name', 'Availability', 'metric_value', 94.4, 'target_value', 92.0, 'benchmark_value', 96.2),
      jsonb_build_object('metric_name', 'Transformer Loading', 'metric_value', 89.1, 'target_value', 85.0, 'benchmark_value', 92.5)
    ),
    NOW()
  FROM tenant t
  
  UNION ALL
  
  -- Circuit Breaker Fleet Benchmark
  SELECT
    t.id,
    'Circuit Breaker Fleet Benchmark', 'asset_comparison',
    jsonb_build_array(
      jsonb_build_object('entity_id', 'CB1', 'entity_name', 'Dubai 400kV Incomer', 'entity_type', 'asset', 'rank', 1, 'percentile', 88),
      jsonb_build_object('entity_id', 'CB2', 'entity_name', 'Jebel Ali 400kV Incomer', 'entity_type', 'asset', 'rank', 2, 'percentile', 72)
    ),
    jsonb_build_array(
      jsonb_build_object('metric_name', 'OEE', 'metric_value', 88.0, 'target_value', 85.0, 'benchmark_value', 89.8),
      jsonb_build_object('metric_name', 'Availability', 'metric_value', 92.8, 'target_value', 90.0, 'benchmark_value', 94.5)
    ),
    NOW()
  FROM tenant t
  
  UNION ALL
  
  -- Site Performance Comparison (based on actual site metrics)
  SELECT
    t.id,
    'Substation Performance Comparison', 'site_comparison',
    jsonb_build_array(
      jsonb_build_object('entity_id', 'S1', 'entity_name', 'Dubai Main Substation', 'entity_type', 'site', 'rank', 1, 'percentile', 95),
      jsonb_build_object('entity_id', 'S3', 'entity_name', 'Al Aweer Regional Hub', 'entity_type', 'site', 'rank', 2, 'percentile', 82),
      jsonb_build_object('entity_id', 'S2', 'entity_name', 'Jebel Ali Grid Station', 'entity_type', 'site', 'rank', 3, 'percentile', 78)
    ),
    jsonb_build_array(
      jsonb_build_object('metric_name', 'OEE', 'metric_value', 87.7, 'target_value', 85.0, 'benchmark_value', 89.2),
      jsonb_build_object('metric_name', 'Availability', 'metric_value', 92.6, 'target_value', 90.0, 'benchmark_value', 94.1),
      jsonb_build_object('metric_name', 'SAIDI', 'metric_value', 44.5, 'target_value', 50.0, 'benchmark_value', 38.5)
    ),
    NOW()
  FROM tenant t
),

-- ============================================================================
-- 6) Insert Performance Trends (Multi-Metric with Realistic Variations)
-- ============================================================================
insert_trends AS (
  INSERT INTO performance_trends (
    tenant_id, asset_id,
    metric_name, metric_value, timestamp
  )
  -- OEE Trends for all assets (30 days)
  SELECT
    t.id,
    a.id,
    'oee_percentage',
    CASE 
      WHEN a.name = 'Dubai T1 Main Transformer' THEN 91.5 + (random() * 4 - 2)
      WHEN a.name = 'Dubai T2 Backup Transformer' THEN 88.3 + (random() * 3 - 1.5)
      WHEN a.name = 'Jebel Ali T1 Main Transformer' THEN 90.1 + (random() * 3.5 - 1.75)
      WHEN a.name = 'Al Aweer T1 Main Transformer' THEN 87.5 + (random() * 3 - 1.5)
      WHEN a.name = 'Dubai 400kV Incomer CB' THEN 89.8 + (random() * 2.5 - 1.25)
      WHEN a.name = 'Jebel Ali 400kV Incomer CB' THEN 86.2 + (random() * 3 - 1.5)
      ELSE 85.0 + (random() * 5)
    END,
    NOW() - (i || ' days')::INTERVAL
  FROM tenant t
  CROSS JOIN assets_data a
  CROSS JOIN generate_series(0, 29) i
  
  UNION ALL
  
  -- Availability Trends for all assets (30 days)
  SELECT
    t.id,
    a.id,
    'availability_percentage',
    CASE 
      WHEN a.name = 'Dubai T1 Main Transformer' THEN 96.2 + (random() * 2 - 1)
      WHEN a.name = 'Dubai T2 Backup Transformer' THEN 93.8 + (random() * 2 - 1)
      WHEN a.name = 'Jebel Ali T1 Main Transformer' THEN 95.0 + (random() * 2 - 1)
      WHEN a.name = 'Al Aweer T1 Main Transformer' THEN 92.5 + (random() * 2.5 - 1.25)
      WHEN a.name = 'Dubai 400kV Incomer CB' THEN 94.5 + (random() * 1.5 - 0.75)
      WHEN a.name = 'Jebel Ali 400kV Incomer CB' THEN 91.0 + (random() * 2.5 - 1.25)
      ELSE 92.0 + (random() * 3)
    END,
    NOW() - (i || ' days')::INTERVAL
  FROM tenant t
  CROSS JOIN assets_data a
  CROSS JOIN generate_series(0, 29) i
  
  UNION ALL
  
  -- Transmission Losses Trends for transformers only (30 days)
  SELECT
    t.id,
    a.id,
    'transmission_losses',
    CASE 
      WHEN a.name = 'Dubai T1 Main Transformer' THEN 1.8 + (random() * 0.4 - 0.2)
      WHEN a.name = 'Dubai T2 Backup Transformer' THEN 2.2 + (random() * 0.5 - 0.25)
      WHEN a.name = 'Jebel Ali T1 Main Transformer' THEN 1.9 + (random() * 0.4 - 0.2)
      WHEN a.name = 'Al Aweer T1 Main Transformer' THEN 2.4 + (random() * 0.5 - 0.25)
      ELSE 2.0 + (random() * 0.6 - 0.3)
    END,
    NOW() - (i || ' days')::INTERVAL
  FROM tenant t
  CROSS JOIN assets_data a
  CROSS JOIN generate_series(0, 29) i
  WHERE a.name LIKE '%Transformer%'
)
SELECT 1;

COMMIT;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================
SELECT 
  'Performance Panels' as table_name, COUNT(*) as count FROM performance_panels pp 
  INNER JOIN tenants t ON pp.tenant_id = t.id WHERE t.name = 'DEWA - Transmission'
UNION ALL
SELECT 'Performance Losses', COUNT(*) FROM performance_losses pl
  INNER JOIN tenants t ON pl.tenant_id = t.id WHERE t.name = 'DEWA - Transmission'
UNION ALL
SELECT 'Performance Bottlenecks', COUNT(*) FROM performance_bottlenecks pb
  INNER JOIN tenants t ON pb.tenant_id = t.id WHERE t.name = 'DEWA - Transmission'
UNION ALL
SELECT 'Performance Benchmarks', COUNT(*) FROM performance_benchmarks pb
  INNER JOIN tenants t ON pb.tenant_id = t.id WHERE t.name = 'DEWA - Transmission'
UNION ALL
SELECT 'Performance Trends', COUNT(*) FROM performance_trends pt
  INNER JOIN tenants t ON pt.tenant_id = t.id WHERE t.name = 'DEWA - Transmission';
