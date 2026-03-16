-- Seed data for Energy Alerts (Transmission EMS)
-- Creates alerts for existing unresolved anomalies and PQ events
-- Seeds alerts in different states (open, acked, closed) with activity records
-- Requirements: 8.1, 8.2

-- Transaction handled by CLI

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_meter_count INTEGER;
  v_pq_event_count INTEGER;
BEGIN
  -- 1) Verify transmission tenant exists
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Tenant "DEWA - Transmission" (power/transmission) does not exist. Run 001_transmission_tenant.sql first.';
  END IF;

  -- 2) Verify energy meters exist
  SELECT COUNT(*) INTO v_meter_count
  FROM energy_meters em
  INNER JOIN tenants t ON em.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.sector = 'power'
    AND t.subsector = 'transmission';
  
  IF v_meter_count < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected at least 5 energy meters, found %. Run 008_energy_monitoring_tx.sql first.', v_meter_count;
  END IF;

  -- 3) Verify power quality events exist
  SELECT COUNT(*) INTO v_pq_event_count
  FROM power_quality_events pq
  INNER JOIN energy_meters em ON pq.meter_id = em.id
  INNER JOIN tenants t ON em.org_id = t.id
  WHERE t.name = 'DEWA - Transmission';
  
  IF v_pq_event_count < 5 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Expected at least 5 power quality events, found %. Run 008_energy_monitoring_tx.sql first.', v_pq_event_count;
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant=1, meters=%, pq_events=%', v_meter_count, v_pq_event_count;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- Get tenant UUID for transmission tenant
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),

-- Get meter lookup for easier referencing
meters_lookup AS (
  SELECT em.id, em.name as meter_name
  FROM energy_meters em
  INNER JOIN tenant ON em.org_id = tenant.id
),

-- 1) First, create some energy anomalies since none exist yet
-- These will be used to create alerts from anomalies
upsert_anomalies AS (
  INSERT INTO energy_anomalies (
    meter_id, timestamp, anomaly_type, magnitude_pct, severity,
    description, baseline_value, actual_value, deviation_value,
    resolved, resolved_at, detection_method, confidence_score
  )
  SELECT 
    m.id,
    v.timestamp,
    v.anomaly_type::anomaly_type,
    v.magnitude_pct,
    v.severity::severity_level,
    v.description,
    v.baseline_value,
    v.actual_value,
    v.deviation_value,
    v.resolved,
    v.resolved_at,
    v.detection_method,
    v.confidence_score
  FROM meters_lookup m
  CROSS JOIN (VALUES
    -- Resolved anomalies (older)
    ('MTR-DXB-MAIN-IN', (now() - interval '30 days')::TIMESTAMPTZ, 'consumption_spike', 25.3, 'Medium', 'Unexpected consumption increase during off-peak hours', 1250.0, 1566.25, 316.25, true, (now() - interval '29 days')::TIMESTAMPTZ, 'statistical', 0.87),
    ('MTR-JA-MAIN-IN', (now() - interval '25 days')::TIMESTAMPTZ, 'efficiency_drop', 18.7, 'High', 'Transformer efficiency below baseline', 98.2, 79.8, -18.4, true, (now() - interval '24 days')::TIMESTAMPTZ, 'ml_model', 0.92),
    ('MTR-AW-MAIN-IN', (now() - interval '20 days')::TIMESTAMPTZ, 'consumption_drop', 22.1, 'Medium', 'Significant load reduction - possible equipment offline', 2100.0, 1635.9, -464.1, true, (now() - interval '19 days')::TIMESTAMPTZ, 'rule_based', 0.78),
    ('MTR-DXB-FDR-OUT-01', (now() - interval '15 days')::TIMESTAMPTZ, 'pattern_deviation', 15.8, 'Low', 'Load pattern differs from historical norm', 850.0, 984.3, 134.3, true, (now() - interval '14 days')::TIMESTAMPTZ, 'statistical', 0.65),
    
    -- Unresolved anomalies (recent - these will generate open alerts)
    ('MTR-AW-FDR-OUT-01', (now() - interval '4 days')::TIMESTAMPTZ, 'consumption_spike', 32.4, 'High', 'Sustained high consumption on Al Aweer feeder - investigation required', 1800.0, 2383.2, 583.2, false, NULL, 'ml_model', 0.94),
    ('MTR-JA-FDR-OUT-01', (now() - interval '3 days')::TIMESTAMPTZ, 'efficiency_drop', 28.9, 'Critical', 'Critical efficiency degradation detected', 95.5, 67.9, -27.6, false, NULL, 'statistical', 0.89),
    ('MTR-DXB-MAIN-IN', (now() - interval '2 days')::TIMESTAMPTZ, 'pattern_deviation', 19.3, 'Medium', 'Unusual load pattern - possible load shift', 2200.0, 2624.6, 424.6, false, NULL, 'rule_based', 0.73),
    ('MTR-DXB-FDR-OUT-02', (now() - interval '1 day')::TIMESTAMPTZ, 'consumption_spike', 41.7, 'Critical', 'Extreme consumption spike - immediate attention required', 1200.0, 1700.4, 500.4, false, NULL, 'ml_model', 0.96),
    ('MTR-JA-MAIN-IN', (now() - interval '8 hours')::TIMESTAMPTZ, 'consumption_drop', 35.2, 'High', 'Unexpected load drop during peak hours', 2800.0, 1814.4, -985.6, false, NULL, 'statistical', 0.91)
  ) AS v(
    meter_name, timestamp, anomaly_type, magnitude_pct, severity,
    description, baseline_value, actual_value, deviation_value,
    resolved, resolved_at, detection_method, confidence_score
  )
  WHERE m.meter_name = v.meter_name
  ON CONFLICT DO NOTHING
  RETURNING id, meter_id, anomaly_type, resolved
),

-- 2) Create alerts for existing unresolved anomalies
alerts_from_anomalies AS (
  INSERT INTO energy_alerts (
    org_id, source_type, source_id, alert_state, severity,
    assigned_to, ack_at, close_at, sla_due_at, tags, notes, created_at
  )
  SELECT 
    tenant.id,
    'anomaly'::energy_alert_source_type,
    an.id,
    CASE 
      WHEN an.severity = 'Critical'::severity_level AND random() < 0.3 THEN 'acked'::energy_alert_state
      WHEN an.severity = 'High'::severity_level AND random() < 0.2 THEN 'acked'::energy_alert_state
      ELSE 'open'::energy_alert_state
    END,
    an.severity::text::energy_alert_severity,
    CASE WHEN random() < 0.4 THEN gen_random_uuid() ELSE NULL END, -- Some alerts assigned
    CASE 
      WHEN an.severity = 'Critical'::severity_level AND random() < 0.3 THEN (an.timestamp + interval '10 minutes')::TIMESTAMPTZ
      WHEN an.severity = 'High'::severity_level AND random() < 0.2 THEN (an.timestamp + interval '30 minutes')::TIMESTAMPTZ
      ELSE NULL
    END,
    NULL, -- No closed alerts from unresolved anomalies
    (now() + interval '4 hours')::TIMESTAMPTZ, -- SLA due in 4 hours
    ARRAY['anomaly', 'energy', 'transmission'],
    CASE 
      WHEN an.severity = 'Critical'::severity_level THEN 'Critical anomaly requires immediate investigation'
      WHEN an.severity = 'High'::severity_level THEN 'High severity anomaly - priority investigation'
      ELSE 'Anomaly detected - routine investigation'
    END,
    an.timestamp
  FROM tenant
  CROSS JOIN energy_anomalies an
  INNER JOIN energy_meters em ON an.meter_id = em.id
  WHERE em.org_id = tenant.id
    AND an.resolved = false
  ON CONFLICT (source_type, source_id) DO NOTHING
  RETURNING id, source_id, alert_state, severity
),

-- 3) Create alerts for existing unresolved PQ events
alerts_from_pq_events AS (
  INSERT INTO energy_alerts (
    org_id, source_type, source_id, alert_state, severity,
    assigned_to, ack_at, close_at, sla_due_at, tags, notes, created_at
  )
  SELECT 
    tenant.id,
    'pq_event'::energy_alert_source_type,
    pq.id,
    CASE 
      WHEN pq.severity = 'Medium' AND random() < 0.5 THEN 'acked'::energy_alert_state
      WHEN pq.severity = 'Low' AND random() < 0.3 THEN 'closed'::energy_alert_state
      ELSE 'open'::energy_alert_state
    END,
    pq.severity::text::energy_alert_severity,
    CASE WHEN random() < 0.6 THEN gen_random_uuid() ELSE NULL END, -- More PQ alerts assigned
    CASE 
      WHEN pq.severity = 'Medium' AND random() < 0.5 THEN (pq.timestamp + interval '30 minutes')::TIMESTAMPTZ
      WHEN pq.severity = 'Low' AND random() < 0.3 THEN (pq.timestamp + interval '1 hour')::TIMESTAMPTZ
      ELSE NULL
    END,
    CASE 
      WHEN pq.severity = 'Low' AND random() < 0.3 THEN (pq.timestamp + interval '2 hours')::TIMESTAMPTZ
      ELSE NULL
    END,
    (pq.timestamp + interval '2 hours')::TIMESTAMPTZ, -- SLA due in 2 hours from event
    ARRAY['power_quality', 'grid', 'transmission'],
    CASE 
      WHEN pq.event_type = 'voltage_sag' THEN 'Voltage sag detected - grid stability concern'
      WHEN pq.event_type = 'voltage_swell' THEN 'Voltage swell detected - equipment protection'
      WHEN pq.event_type = 'thd_high' THEN 'High THD detected - harmonic distortion'
      WHEN pq.event_type = 'frequency_deviation' THEN 'Frequency deviation - grid synchronization'
      WHEN pq.event_type = 'pf_low' THEN 'Low power factor - reactive power concern'
      ELSE 'Power quality event detected'
    END,
    pq.timestamp
  FROM tenant
  CROSS JOIN power_quality_events pq
  INNER JOIN energy_meters em ON pq.meter_id = em.id
  WHERE em.org_id = tenant.id
    AND pq.resolved = false
  ON CONFLICT (source_type, source_id) DO NOTHING
  RETURNING id, source_id, alert_state, severity
),

-- 4) Create some additional alerts in various states for demonstration
additional_alerts AS (
  INSERT INTO energy_alerts (
    org_id, source_type, source_id, alert_state, severity,
    assigned_to, ack_at, close_at, sla_due_at, tags, notes, created_at
  )
  SELECT 
    tenant.id,
    'pq_event'::energy_alert_source_type,
    pq.id,
    v.alert_state::energy_alert_state,
    pq.severity::energy_alert_severity,
    v.assigned_to::UUID,
    v.ack_at,
    v.close_at,
    v.sla_due_at,
    v.tags,
    v.notes,
    v.created_at
  FROM tenant
  CROSS JOIN (VALUES
    ('closed', NULL, (now() - interval '2 days')::TIMESTAMPTZ, (now() - interval '1 day')::TIMESTAMPTZ, (now() - interval '3 days')::TIMESTAMPTZ, ARRAY['resolved', 'maintenance'], 'Resolved after tap changer adjustment', (now() - interval '4 days')::TIMESTAMPTZ),
    ('acked', NULL, (now() - interval '1 hour')::TIMESTAMPTZ, NULL, (now() + interval '1 hour')::TIMESTAMPTZ, ARRAY['investigating', 'high_priority'], 'Under investigation by field team', (now() - interval '2 hours')::TIMESTAMPTZ),
    ('closed', NULL, (now() - interval '5 days')::TIMESTAMPTZ, (now() - interval '4 days')::TIMESTAMPTZ, (now() - interval '6 days')::TIMESTAMPTZ, ARRAY['resolved', 'capacitor_bank'], 'Resolved by switching capacitor bank', (now() - interval '10 days')::TIMESTAMPTZ)
  ) AS v(alert_state, assigned_to, ack_at, close_at, sla_due_at, tags, notes, created_at)
  CROSS JOIN power_quality_events pq
  INNER JOIN energy_meters em ON pq.meter_id = em.id
  WHERE em.org_id = tenant.id
    AND pq.resolved = true
  LIMIT 3 -- Only create 3 additional alerts from resolved PQ events
  ON CONFLICT (source_type, source_id) DO NOTHING
  RETURNING id, alert_state
),

-- 5) Create alert activity records for the alerts we just created
-- This will be handled automatically by the trigger, but we can add some manual entries
manual_activity AS (
  INSERT INTO energy_alert_activity (
    alert_id, activity_type, user_id, old_value, new_value, notes
  )
  SELECT 
    ea.id,
    v.activity_type,
    v.user_id::UUID,
    v.old_value::JSONB,
    v.new_value::JSONB,
    v.notes
  FROM energy_alerts ea
  INNER JOIN tenant ON ea.org_id = tenant.id
  CROSS JOIN (VALUES
    ('note_added', NULL, NULL, '{"notes": "Initial assessment completed"}', 'Field team dispatched for investigation'),
    ('assigned', NULL, '{"assigned_to": null}', '{"assigned_to": "ops-user-1"}', 'Assigned to operations team lead'),
    ('note_added', NULL, NULL, '{"notes": "Equipment inspection scheduled"}', 'Maintenance window scheduled for tomorrow')
  ) AS v(activity_type, user_id, old_value, new_value, notes)
  WHERE ea.alert_state = 'acked'
  LIMIT 10 -- Add some manual activity records
  RETURNING id, activity_type
)

-- Return summary counts
SELECT 
  (SELECT COUNT(*) FROM upsert_anomalies) as anomalies_created,
  (SELECT COUNT(*) FROM alerts_from_anomalies) as alerts_from_anomalies,
  (SELECT COUNT(*) FROM alerts_from_pq_events) as alerts_from_pq_events,
  (SELECT COUNT(*) FROM additional_alerts) as additional_alerts,
  (SELECT COUNT(*) FROM manual_activity) as manual_activity_records;

-- ============================================================================
-- POST-SEED VALIDATION
-- Ensure every unresolved anomaly and PQ event has an alert
-- ============================================================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_unresolved_anomalies INTEGER;
  v_anomaly_alerts INTEGER;
  v_unresolved_pq_events INTEGER;
  v_pq_alerts INTEGER;
  v_total_alerts INTEGER;
  v_open_alerts INTEGER;
  v_acked_alerts INTEGER;
  v_closed_alerts INTEGER;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';

  -- Count unresolved anomalies
  SELECT COUNT(*) INTO v_unresolved_anomalies
  FROM energy_anomalies an
  INNER JOIN energy_meters em ON an.meter_id = em.id
  WHERE em.org_id = v_tenant_id
    AND an.resolved = false;

  -- Count alerts from anomalies
  SELECT COUNT(*) INTO v_anomaly_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id
    AND ea.source_type = 'anomaly';

  -- Count unresolved PQ events
  SELECT COUNT(*) INTO v_unresolved_pq_events
  FROM power_quality_events pq
  INNER JOIN energy_meters em ON pq.meter_id = em.id
  WHERE em.org_id = v_tenant_id
    AND pq.resolved = false;

  -- Count alerts from PQ events
  SELECT COUNT(*) INTO v_pq_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id
    AND ea.source_type = 'pq_event';

  -- Count alerts by state
  SELECT COUNT(*) INTO v_total_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id;

  SELECT COUNT(*) INTO v_open_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id
    AND ea.alert_state = 'open';

  SELECT COUNT(*) INTO v_acked_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id
    AND ea.alert_state = 'acked';

  SELECT COUNT(*) INTO v_closed_alerts
  FROM energy_alerts ea
  WHERE ea.org_id = v_tenant_id
    AND ea.alert_state = 'closed';

  -- Validation: Every unresolved anomaly should have an alert
  IF v_anomaly_alerts < v_unresolved_anomalies THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Expected >= % alerts from anomalies, found %', v_unresolved_anomalies, v_anomaly_alerts;
  END IF;

  -- Validation: Every unresolved PQ event should have an alert  
  IF v_pq_alerts < v_unresolved_pq_events THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Expected >= % alerts from PQ events, found %', v_unresolved_pq_events, v_pq_alerts;
  END IF;

  -- Validation: Should have alerts in different states
  IF v_open_alerts = 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Expected at least 1 open alert, found 0';
  END IF;

  -- Validation: Should have reasonable total count
  IF v_total_alerts < 5 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Expected at least 5 total alerts, found %', v_total_alerts;
  END IF;

  RAISE NOTICE 'Seed 2702_seed_energy_alerts_tx.sql OK: anomalies=%, anomaly_alerts=%, pq_events=%, pq_alerts=%, total_alerts=% (open=%, acked=%, closed=%)', 
    v_unresolved_anomalies, v_anomaly_alerts, v_unresolved_pq_events, v_pq_alerts, v_total_alerts, v_open_alerts, v_acked_alerts, v_closed_alerts;
END $$;

-- Transaction handled by CLI