-- ============================================================================
-- FS3: Asset Performance & Utilisation - Seed Script
-- ============================================================================
-- This seed script populates sample data for downtime events, reliability
-- metrics, performance benchmarks, utilisation metrics, and performance
-- deviations for transmission assets.
--
-- Requirements: 12.1-12.9, 13.1-13.7, 14.1-14.7, 15.1-15.7
-- ============================================================================

-- ============================================================================
-- 25.1: Seed downtime events
-- ============================================================================
-- Insert sample downtime events with transmission-specific fields
-- Requirements: 12.1-12.9, 30.4

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO cb104_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-104';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO line_n02_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N02';
  
  -- Planned maintenance event on TX-001 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    tx1_id,
    'planned_maintenance',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days' + INTERVAL '8 hours',
    480,
    150.0,
    'transformer',
    'Annual preventive maintenance: oil sampling, bushing inspection, OLTC maintenance'
  )
  ON CONFLICT DO NOTHING;
  
  -- Unplanned failure event on CB-101 (SF6 leak - completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    cb101_id,
    'unplanned_failure',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days' + INTERVAL '18 hours',
    1080,
    75.0,
    'SF6_LOW_PRESSURE',
    'bay',
    'SF6 gas leak detected, breaker taken out of service for seal replacement'
  )
  ON CONFLICT DO NOTHING;
  
  -- Forced outage on LINE-N01 (weather event - completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    line_n01_id,
    'forced_outage',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days' + INTERVAL '4 hours',
    240,
    200.0,
    'OVERCURRENT_TRIP',
    'line',
    'Line tripped due to lightning strike, inspection and testing required before restoration'
  )
  ON CONFLICT DO NOTHING;
  
  -- Testing event on CB-102 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    cb102_id,
    'testing',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '2 hours',
    120,
    50.0,
    'bay',
    'Routine breaker timing and contact resistance testing'
  )
  ON CONFLICT DO NOTHING;
  
  -- Planned maintenance on TX-002 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    tx2_id,
    'planned_maintenance',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days' + INTERVAL '10 hours',
    600,
    180.0,
    'transformer',
    'Major overhaul: winding resistance test, turns ratio test, DGA analysis, cooling system maintenance'
  )
  ON CONFLICT DO NOTHING;
  
  -- Unplanned failure on CB-103 (mechanism fault - completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    cb103_id,
    'unplanned_failure',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '14 days' + INTERVAL '20 hours',
    1200,
    60.0,
    'MECHANISM_FAULT',
    'bay',
    'Operating mechanism failure, replacement parts ordered and installed'
  )
  ON CONFLICT DO NOTHING;
  
  -- Forced outage on LINE-N02 (bird contact - completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    line_n02_id,
    'forced_outage',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '1 hour',
    60,
    120.0,
    'GROUND_FAULT',
    'line',
    'Transient ground fault due to bird contact, line inspection and restoration'
  )
  ON CONFLICT DO NOTHING;
  
  -- Planned maintenance on CB-104 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    cb104_id,
    'planned_maintenance',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days' + INTERVAL '3 hours',
    180,
    45.0,
    'bay',
    'Preventive maintenance: contact inspection, lubrication, SF6 density check'
  )
  ON CONFLICT DO NOTHING;
  
  -- Testing event on LINE-N01 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    line_n01_id,
    'testing',
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '50 days' + INTERVAL '6 hours',
    360,
    200.0,
    'line',
    'Annual line testing: insulation resistance, conductor resistance, protection relay testing'
  )
  ON CONFLICT DO NOTHING;
  
  -- Unplanned failure on TX-001 (cooling system - completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    tx1_id,
    'unplanned_failure',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days' + INTERVAL '12 hours',
    720,
    150.0,
    'COOLING_FAILURE',
    'transformer',
    'Cooling fan motor failure, emergency replacement required'
  )
  ON CONFLICT DO NOTHING;
  
  -- Forced outage on substation bay (multiple assets affected)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, protection_trip_code, outage_scope, description
  )
  VALUES (
    cb102_id,
    'forced_outage',
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '70 days' + INTERVAL '2 hours',
    120,
    100.0,
    'BUS_FAULT',
    'substation',
    'Bus fault in substation, multiple bays affected, fault isolation and restoration'
  )
  ON CONFLICT DO NOTHING;
  
  -- Planned maintenance on LINE-N02 (completed)
  INSERT INTO downtime_events (
    asset_id, event_type, start_time, end_time, duration_minutes,
    grid_impact_mw, outage_scope, description
  )
  VALUES (
    line_n02_id,
    'planned_maintenance',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '35 days' + INTERVAL '5 hours',
    300,
    120.0,
    'line',
    'Vegetation management and tower inspection along line corridor'
  )
  ON CONFLICT DO NOTHING;

END $;

-- ============================================================================
-- 25.2: Seed reliability metrics
-- ============================================================================
-- Compute and insert reliability metrics for seeded assets
-- Requirements: 13.1-13.7

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
  
  -- Time periods for metrics
  q1_start TIMESTAMPTZ := DATE_TRUNC('quarter', NOW() - INTERVAL '9 months');
  q1_end TIMESTAMPTZ := DATE_TRUNC('quarter', NOW() - INTERVAL '6 months');
  q2_start TIMESTAMPTZ := DATE_TRUNC('quarter', NOW() - INTERVAL '6 months');
  q2_end TIMESTAMPTZ := DATE_TRUNC('quarter', NOW() - INTERVAL '3 months');
  q3_start TIMESTAMPTZ := DATE_TRUNC('quarter', NOW() - INTERVAL '3 months');
  q3_end TIMESTAMPTZ := DATE_TRUNC('quarter', NOW());
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO cb104_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-104';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO line_n02_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N02';
  
  -- TX-001 Reliability Metrics
  -- Q1: One unplanned failure (720 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx1_id, q1_start, q1_end,
    2160.0,  -- 90 days between failures
    12.0,    -- 12 hours to repair
    99.45,   -- (2160 - 12) / 2160 * 100
    1,
    720
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One planned maintenance (480 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx1_id, q2_start, q2_end,
    NULL,    -- No failures in this period
    NULL,
    99.63,   -- (2160 - 8) / 2160 * 100
    0,
    480
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx1_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- TX-002 Reliability Metrics
  -- Q1: One planned maintenance (600 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx2_id, q1_start, q1_end,
    NULL,
    NULL,
    99.54,   -- (2160 - 10) / 2160 * 100
    0,
    600
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx2_id, q2_start, q2_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    tx2_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- CB-101 Reliability Metrics
  -- Q1: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb101_id, q1_start, q1_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb101_id, q2_start, q2_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: One unplanned failure (1080 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb101_id, q3_start, q3_end,
    2160.0,
    18.0,    -- 18 hours to repair
    99.17,   -- (2160 - 18) / 2160 * 100
    1,
    1080
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- CB-102 Reliability Metrics
  -- Q1: One forced outage (120 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb102_id, q1_start, q1_end,
    2160.0,
    2.0,
    99.91,   -- (2160 - 2) / 2160 * 100
    1,
    120
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One testing event (120 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb102_id, q2_start, q2_end,
    NULL,
    NULL,
    99.91,
    0,
    120
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb102_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- CB-103 Reliability Metrics
  -- Q1: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb103_id, q1_start, q1_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One unplanned failure (1200 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb103_id, q2_start, q2_end,
    2160.0,
    20.0,
    99.07,   -- (2160 - 20) / 2160 * 100
    1,
    1200
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb103_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- CB-104 Reliability Metrics
  -- Q1: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb104_id, q1_start, q1_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One planned maintenance (180 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb104_id, q2_start, q2_end,
    NULL,
    NULL,
    99.86,   -- (2160 - 3) / 2160 * 100
    0,
    180
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    cb104_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- LINE-N01 Reliability Metrics
  -- Q1: One forced outage (240 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n01_id, q1_start, q1_end,
    2160.0,
    4.0,
    99.81,   -- (2160 - 4) / 2160 * 100
    1,
    240
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One testing event (360 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n01_id, q2_start, q2_end,
    NULL,
    NULL,
    99.72,   -- (2160 - 6) / 2160 * 100
    0,
    360
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n01_id, q3_start, q3_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- LINE-N02 Reliability Metrics
  -- Q1: No downtime
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n02_id, q1_start, q1_end,
    NULL,
    NULL,
    100.0,
    0,
    0
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q2: One planned maintenance (300 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n02_id, q2_start, q2_end,
    NULL,
    NULL,
    99.77,   -- (2160 - 5) / 2160 * 100
    0,
    300
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;
  
  -- Q3: One forced outage (60 min downtime)
  INSERT INTO reliability_metrics (
    asset_id, period_start, period_end,
    mtbf_hours, mttr_hours, availability_percent,
    failure_count, total_downtime_minutes
  )
  VALUES (
    line_n02_id, q3_start, q3_end,
    2160.0,
    1.0,
    99.95,   -- (2160 - 1) / 2160 * 100
    1,
    60
  )
  ON CONFLICT (asset_id, period_start, period_end) DO UPDATE
    SET mtbf_hours = EXCLUDED.mtbf_hours,
        mttr_hours = EXCLUDED.mttr_hours,
        availability_percent = EXCLUDED.availability_percent,
        failure_count = EXCLUDED.failure_count,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes;

END $;

-- ============================================================================
-- 25.3: Seed performance benchmarks
-- ============================================================================
-- Insert benchmark targets for each transmission asset type
-- Requirements: 15.1, 15.2, 30.7

-- Power Transformer Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'power_transformer',
  'power_transmission',
  99.5,    -- 99.5% availability target
  75.0,    -- 75% load factor target
  8760.0   -- 1 year MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Circuit Breaker Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'circuit_breaker',
  'power_transmission',
  99.8,    -- 99.8% availability target
  NULL,    -- Load factor not applicable for breakers
  17520.0  -- 2 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Transmission Line Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'transmission_line',
  'power_transmission',
  99.7,    -- 99.7% availability target
  65.0,    -- 65% load factor target
  26280.0  -- 3 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Protection Relay Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'protection_relay',
  'power_transmission',
  99.9,    -- 99.9% availability target
  NULL,    -- Load factor not applicable for relays
  43800.0  -- 5 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Disconnect Switch Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'disconnect_switch',
  'power_transmission',
  99.9,    -- 99.9% availability target
  NULL,    -- Load factor not applicable
  35040.0  -- 4 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Current Transformer (CT) Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'ct',
  'power_transmission',
  99.95,   -- 99.95% availability target
  NULL,    -- Load factor not applicable
  87600.0  -- 10 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- Voltage Transformer (VT) Benchmarks
INSERT INTO performance_benchmarks (
  asset_type, sector, availability_target, load_factor_target, mtbf_target
)
VALUES (
  'vt',
  'power_transmission',
  99.95,   -- 99.95% availability target
  NULL,    -- Load factor not applicable
  87600.0  -- 10 years MTBF target (hours)
)
ON CONFLICT (asset_type, sector) DO UPDATE
  SET availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target,
      updated_at = NOW();

-- ============================================================================
-- 25.4: Seed utilisation metrics
-- ============================================================================
-- Insert utilisation data for transformers and breakers
-- Requirements: 14.1-14.7

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
  
  -- Time periods for metrics (monthly)
  month1_start TIMESTAMPTZ := DATE_TRUNC('month', NOW() - INTERVAL '3 months');
  month1_end TIMESTAMPTZ := DATE_TRUNC('month', NOW() - INTERVAL '2 months');
  month2_start TIMESTAMPTZ := DATE_TRUNC('month', NOW() - INTERVAL '2 months');
  month2_end TIMESTAMPTZ := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
  month3_start TIMESTAMPTZ := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
  month3_end TIMESTAMPTZ := DATE_TRUNC('month', NOW());
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO cb104_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-104';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO line_n02_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N02';
  
  -- TX-001 Utilisation Metrics (Rated: 150 MVA, 1200A)
  -- Month 1: High utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx1_id, month1_start, month1_end,
    82.5,    -- 82.5% load factor (avg 990A / 1200A)
    1150.0,  -- Peak current 1150A
    15.8     -- Thermal headroom: (1200 - 990) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx1_id, month2_start, month2_end,
    72.0,    -- 72% load factor (avg 864A / 1200A)
    1050.0,  -- Peak current 1050A
    28.0     -- Thermal headroom: (1200 - 864) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3: Lower utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx1_id, month3_start, month3_end,
    68.5,    -- 68.5% load factor (avg 822A / 1200A)
    980.0,   -- Peak current 980A
    31.5     -- Thermal headroom: (1200 - 822) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- TX-002 Utilisation Metrics (Rated: 180 MVA, 1400A)
  -- Month 1: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx2_id, month1_start, month1_end,
    65.0,    -- 65% load factor (avg 910A / 1400A)
    1200.0,  -- Peak current 1200A
    35.0     -- Thermal headroom: (1400 - 910) / 1400 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2: Lower utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx2_id, month2_start, month2_end,
    58.0,    -- 58% load factor (avg 812A / 1400A)
    1100.0,  -- Peak current 1100A
    42.0     -- Thermal headroom: (1400 - 812) / 1400 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    tx2_id, month3_start, month3_end,
    62.5,    -- 62.5% load factor (avg 875A / 1400A)
    1150.0,  -- Peak current 1150A
    37.5     -- Thermal headroom: (1400 - 875) / 1400 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-101 Utilisation Metrics (Rated: 2000A, switching cycles)
  -- Month 1
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb101_id, month1_start, month1_end,
    NULL,    -- Load factor not typically tracked for breakers
    1150.0,  -- Peak current through breaker
    45       -- 45 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb101_id, month2_start, month2_end,
    NULL,
    1050.0,
    38       -- 38 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb101_id, month3_start, month3_end,
    NULL,
    980.0,
    42       -- 42 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-102 Utilisation Metrics (Rated: 2000A)
  -- Month 1
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb102_id, month1_start, month1_end,
    NULL,
    1200.0,
    52       -- 52 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb102_id, month2_start, month2_end,
    NULL,
    1100.0,
    48       -- 48 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb102_id, month3_start, month3_end,
    NULL,
    1150.0,
    50       -- 50 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-103 Utilisation Metrics (Rated: 1600A)
  -- Month 1
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb103_id, month1_start, month1_end,
    NULL,
    850.0,
    28       -- 28 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb103_id, month2_start, month2_end,
    NULL,
    780.0,
    25       -- 25 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb103_id, month3_start, month3_end,
    NULL,
    820.0,
    30       -- 30 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-104 Utilisation Metrics (Rated: 1600A)
  -- Month 1
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb104_id, month1_start, month1_end,
    NULL,
    920.0,
    35       -- 35 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb104_id, month2_start, month2_end,
    NULL,
    880.0,
    32       -- 32 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, switching_cycles
  )
  VALUES (
    cb104_id, month3_start, month3_end,
    NULL,
    900.0,
    38       -- 38 switching operations
  )
  ON CONFLICT DO NOTHING;
  
  -- LINE-N01 Utilisation Metrics (Rated: 1200A)
  -- Month 1: High utilisation with low thermal headroom
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n01_id, month1_start, month1_end,
    78.0,    -- 78% load factor (avg 936A / 1200A)
    1150.0,  -- Peak current 1150A
    22.0     -- Thermal headroom: (1200 - 936) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n01_id, month2_start, month2_end,
    70.0,    -- 70% load factor (avg 840A / 1200A)
    1050.0,  -- Peak current 1050A
    30.0     -- Thermal headroom: (1200 - 840) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3: Lower utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n01_id, month3_start, month3_end,
    65.0,    -- 65% load factor (avg 780A / 1200A)
    950.0,   -- Peak current 950A
    35.0     -- Thermal headroom: (1200 - 780) / 1200 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- LINE-N02 Utilisation Metrics (Rated: 1000A)
  -- Month 1: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n02_id, month1_start, month1_end,
    62.0,    -- 62% load factor (avg 620A / 1000A)
    850.0,   -- Peak current 850A
    38.0     -- Thermal headroom: (1000 - 620) / 1000 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 2: Lower utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n02_id, month2_start, month2_end,
    55.0,    -- 55% load factor (avg 550A / 1000A)
    750.0,   -- Peak current 750A
    45.0     -- Thermal headroom: (1000 - 550) / 1000 * 100
  )
  ON CONFLICT DO NOTHING;
  
  -- Month 3: Medium utilisation
  INSERT INTO utilisation_metrics (
    asset_id, period_start, period_end,
    load_factor, peak_current, thermal_headroom
  )
  VALUES (
    line_n02_id, month3_start, month3_end,
    58.5,    -- 58.5% load factor (avg 585A / 1000A)
    800.0,   -- Peak current 800A
    41.5     -- Thermal headroom: (1000 - 585) / 1000 * 100
  )
  ON CONFLICT DO NOTHING;

END $;

-- ============================================================================
-- 25.5: Seed performance deviations
-- ============================================================================
-- Insert deviation records for assets below benchmarks
-- Requirements: 15.4, 15.5

DO $
DECLARE
  tx1_id UUID;
  cb101_id UUID;
  cb103_id UUID;
  line_n01_id UUID;
BEGIN
  -- Get asset IDs for assets with performance deviations
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  
  -- TX-001: Availability deviation (Q1)
  -- Actual: 99.45%, Target: 99.5%, Deviation: -0.05%
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    tx1_id,
    'availability_below_target',
    -0.05,  -- 0.05% below target
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '9 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    'power_transformer benchmark: 99.5% availability'
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-101: Availability deviation (Q3)
  -- Actual: 99.17%, Target: 99.8%, Deviation: -0.63%
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    cb101_id,
    'availability_below_target',
    -0.63,  -- 0.63% below target
    DATE_TRUNC('quarter', NOW()),
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('quarter', NOW()),
    'circuit_breaker benchmark: 99.8% availability'
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-103: Availability deviation (Q2)
  -- Actual: 99.07%, Target: 99.8%, Deviation: -0.73%
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    cb103_id,
    'availability_below_target',
    -0.73,  -- 0.73% below target
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    'circuit_breaker benchmark: 99.8% availability'
  )
  ON CONFLICT DO NOTHING;
  
  -- LINE-N01: Availability deviation (Q1)
  -- Actual: 99.81%, Target: 99.7%, Deviation: +0.11% (above target, but still tracked)
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    line_n01_id,
    'availability_above_target',
    0.11,   -- 0.11% above target (positive deviation)
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '9 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    'transmission_line benchmark: 99.7% availability'
  )
  ON CONFLICT DO NOTHING;
  
  -- TX-001: Load factor above target (Month 1)
  -- Actual: 82.5%, Target: 75%, Deviation: +7.5%
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    tx1_id,
    'load_factor_above_target',
    7.5,    -- 7.5% above target (may indicate overloading risk)
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '2 months'),
    'power_transformer benchmark: 75% load factor'
  )
  ON CONFLICT DO NOTHING;
  
  -- LINE-N01: Load factor above target (Month 1)
  -- Actual: 78%, Target: 65%, Deviation: +13%
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    line_n01_id,
    'load_factor_above_target',
    13.0,   -- 13% above target (significant overloading)
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '2 months'),
    'transmission_line benchmark: 65% load factor'
  )
  ON CONFLICT DO NOTHING;
  
  -- LINE-N01: Low thermal headroom (Month 1)
  -- Actual: 22%, indicates high loading approaching thermal limits
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    line_n01_id,
    'thermal_headroom_low',
    22.0,   -- Only 22% thermal headroom remaining
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '2 months'),
    'Thermal headroom below 25% threshold'
  )
  ON CONFLICT DO NOTHING;
  
  -- TX-001: Low thermal headroom (Month 1)
  -- Actual: 15.8%, indicates high loading
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    tx1_id,
    'thermal_headroom_low',
    15.8,   -- Only 15.8% thermal headroom remaining
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('month', NOW() - INTERVAL '2 months'),
    'Thermal headroom below 20% threshold'
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-101: MTBF below target
  -- Actual MTBF: 2160 hours (90 days), Target: 17520 hours (2 years)
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    cb101_id,
    'mtbf_below_target',
    -15360.0,  -- 15360 hours below target
    DATE_TRUNC('quarter', NOW()),
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('quarter', NOW()),
    'circuit_breaker benchmark: 17520 hours MTBF'
  )
  ON CONFLICT DO NOTHING;
  
  -- CB-103: MTBF below target
  -- Actual MTBF: 2160 hours (90 days), Target: 17520 hours (2 years)
  INSERT INTO performance_deviations (
    asset_id, deviation_type, magnitude,
    detected_at, telemetry_window_start, telemetry_window_end,
    benchmark_reference
  )
  VALUES (
    cb103_id,
    'mtbf_below_target',
    -15360.0,  -- 15360 hours below target
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '6 months'),
    DATE_TRUNC('quarter', NOW() - INTERVAL '3 months'),
    'circuit_breaker benchmark: 17520 hours MTBF'
  )
  ON CONFLICT DO NOTHING;

END $;

-- ============================================================================
-- Seed Complete
-- ============================================================================
