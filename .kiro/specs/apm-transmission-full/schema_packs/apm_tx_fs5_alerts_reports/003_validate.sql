-- ============================================================================
-- APM Transmission FS5: Alerts, Reports & Visualisation - Validation Script
-- ============================================================================
-- Feature Set: FS5 - Alerts, Reports & Visualisation
-- Purpose: Validate schema integrity and data quality for FS5 tables
-- Requirements: 20.1-20.9, 21.1-21.6, 22.1-22.7, 23.1-23.7, 24.1-24.8
-- Success Criteria: All validation queries should return 0 rows
-- ============================================================================

-- ============================================================================
-- Validation 1: Alert Severity and Source Values
-- Purpose: Ensure all alerts have valid severity and source values
-- Requirements: 20.2
-- Expected: 0 rows (all alerts have valid values)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts
  WHERE severity NOT IN ('info', 'warning', 'critical', 'emergency')
     OR source NOT IN ('telemetry', 'diagnostic', 'prediction', 'manual');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % alerts have invalid severity or source values', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 1 passed: All alerts have valid severity and source values';
  END IF;
END $$;

-- ============================================================================
-- Validation 2: Alert Closure Notes Required
-- Purpose: Ensure closed alerts have resolution_notes
-- Requirements: 20.8
-- Expected: 0 rows (all closed alerts have resolution notes)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts
  WHERE state = 'closed'
    AND (resolution_notes IS NULL OR resolution_notes = '');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % closed alerts missing resolution_notes', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 2 passed: All closed alerts have resolution notes';
  END IF;
END $$;

-- ============================================================================
-- Validation 3: Alert State Transition Consistency
-- Purpose: Ensure acknowledged alerts have acknowledged_by and acknowledged_at
-- Requirements: 20.7
-- Expected: 0 rows (all acknowledged alerts have required fields)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts
  WHERE state IN ('ack', 'closed')
    AND (acknowledged_by IS NULL OR acknowledged_at IS NULL);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % acknowledged alerts missing acknowledged_by or acknowledged_at', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 3 passed: All acknowledged alerts have required fields';
  END IF;
END $$;

-- ============================================================================
-- Validation 4: Alert History References Valid Alerts
-- Purpose: Ensure all alert_history records reference existing alerts
-- Requirements: 21.4, 21.5
-- Expected: 0 rows (all history records link to valid alerts)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM alert_history ah
  WHERE NOT EXISTS (
    SELECT 1 FROM alerts a WHERE a.id = ah.alert_id
  );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % alert_history records reference non-existent alerts', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 4 passed: All alert history records reference valid alerts';
  END IF;
END $$;

-- ============================================================================
-- Validation 4.1: Alert State Changes Have Corresponding History Records
-- Purpose: Ensure alerts in 'ack' or 'closed' state have corresponding history records
-- Requirements: 21.5
-- Expected: 0 rows (all state transitions are recorded in history)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check alerts in 'ack' state have history record showing transition to 'ack'
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts a
  WHERE a.state = 'ack'
    AND NOT EXISTS (
      SELECT 1 FROM alert_history ah 
      WHERE ah.alert_id = a.id 
        AND ah.new_state = 'ack'
    );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % acknowledged alerts missing history records for ack transition', invalid_count;
  END IF;
  
  -- Check alerts in 'closed' state have history record showing transition to 'closed'
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts a
  WHERE a.state = 'closed'
    AND NOT EXISTS (
      SELECT 1 FROM alert_history ah 
      WHERE ah.alert_id = a.id 
        AND ah.new_state = 'closed'
    );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % closed alerts missing history records for closed transition', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 4.1 passed: All alert state changes have corresponding history records';
  END IF;
END $$;

-- ============================================================================
-- Validation 5: Dashboard Widget References Valid Dashboards
-- Purpose: Ensure all dashboard_widgets reference existing dashboards
-- Requirements: 22.2
-- Expected: 0 rows (all widgets link to valid dashboards)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM dashboard_widgets dw
  WHERE NOT EXISTS (
    SELECT 1 FROM dashboards d WHERE d.id = dw.dashboard_id
  );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % dashboard_widgets reference non-existent dashboards', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 5 passed: All dashboard widgets reference valid dashboards';
  END IF;
END $$;

-- ============================================================================
-- Validation 6: Dashboard Widget Type Validity
-- Purpose: Ensure all dashboard widgets have valid widget_type values
-- Requirements: 22.4
-- Expected: 0 rows (all widgets have valid types)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM dashboard_widgets
  WHERE widget_type NOT IN ('KPI_card', 'time_series_chart', 'table', 'status_grid', 'alert_list');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % dashboard_widgets have invalid widget_type', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 6 passed: All dashboard widgets have valid widget types';
  END IF;
END $$;

-- ============================================================================
-- Validation 6.1: Dashboard Widget Query References Are Valid
-- Purpose: Ensure all dashboard widgets have valid query_template_ref values
-- Requirements: 22.7
-- Expected: 0 rows (all widgets have valid query references)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
  valid_query_refs TEXT[] := ARRAY[
    'fleet_availability',
    'mtbf_trend',
    'asset_health_status',
    'high_risk_predictions',
    'active_critical_alerts',
    'asset_operational_status',
    'realtime_telemetry',
    'recent_diagnostic_events',
    'maintenance_backlog_count',
    'avg_priority_score',
    'prioritized_recommendations',
    'spare_parts_status'
  ];
BEGIN
  -- Check for empty string query_template_ref (NULL is allowed)
  SELECT COUNT(*)
  INTO invalid_count
  FROM dashboard_widgets
  WHERE query_template_ref IS NOT NULL 
    AND query_template_ref = '';
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % dashboard_widgets have empty query_template_ref', invalid_count;
  END IF;
  
  -- Check that all non-NULL query_template_ref values are from the known valid set
  SELECT COUNT(*)
  INTO invalid_count
  FROM dashboard_widgets
  WHERE query_template_ref IS NOT NULL
    AND query_template_ref != ''
    AND query_template_ref != ALL(valid_query_refs);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % dashboard_widgets have invalid query_template_ref values', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 6.1 passed: All dashboard widgets have valid query references';
  END IF;
END $$;

-- ============================================================================
-- Validation 7: Report Run Type and Status Validity
-- Purpose: Ensure all report_runs have valid report_type and status values
-- Requirements: 23.1, 23.3
-- Expected: 0 rows (all report runs have valid values)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM report_runs
  WHERE report_type NOT IN ('reliability_summary', 'maintenance_backlog', 'asset_health_status', 'performance_benchmarking')
     OR status NOT IN ('queued', 'processing', 'completed', 'failed');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % report_runs have invalid report_type or status', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 7 passed: All report runs have valid report_type and status';
  END IF;
END $$;

-- ============================================================================
-- Validation 8: Completed Report Runs Have Output Location
-- Purpose: Ensure completed report runs have output_location
-- Requirements: 23.4
-- Expected: 0 rows (all completed reports have output location)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM report_runs
  WHERE status = 'completed'
    AND (output_location IS NULL OR output_location = '');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % completed report_runs missing output_location', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 8 passed: All completed report runs have output location';
  END IF;
END $$;

-- ============================================================================
-- Validation 9: Export Job Format and Status Validity
-- Purpose: Ensure all export_jobs have valid format and status values
-- Requirements: 24.2, 24.3, 24.4
-- Expected: 0 rows (all export jobs have valid values)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM export_jobs
  WHERE format NOT IN ('CSV', 'JSON', 'Excel')
     OR status NOT IN ('queued', 'processing', 'completed', 'failed');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % export_jobs have invalid format or status', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 9 passed: All export jobs have valid format and status';
  END IF;
END $$;

-- ============================================================================
-- Validation 10: Completed Export Jobs Have Output Location
-- Purpose: Ensure completed export jobs have output_location and completed_at
-- Requirements: 24.5
-- Expected: 0 rows (all completed exports have required fields)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM export_jobs
  WHERE status = 'completed'
    AND (output_location IS NULL OR output_location = '' OR completed_at IS NULL);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % completed export_jobs missing output_location or completed_at', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 10 passed: All completed export jobs have required fields';
  END IF;
END $$;

-- ============================================================================
-- Validation 11: Alert Asset References Exist
-- Purpose: Ensure all alerts reference existing assets
-- Requirements: 20.3
-- Expected: 0 rows (all alerts link to valid assets)
-- ============================================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM alerts a
  WHERE NOT EXISTS (
    SELECT 1 FROM assets ast WHERE ast.id = a.asset_id
  );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % alerts reference non-existent assets', invalid_count;
  ELSE
    RAISE NOTICE '✓ Validation 11 passed: All alerts reference valid assets';
  END IF;
END $$;

-- ============================================================================
-- Validation Summary
-- ============================================================================

DO $$
DECLARE
  alert_count INTEGER;
  alert_history_count INTEGER;
  dashboard_count INTEGER;
  widget_count INTEGER;
  report_count INTEGER;
  export_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count FROM alerts;
  SELECT COUNT(*) INTO alert_history_count FROM alert_history;
  SELECT COUNT(*) INTO dashboard_count FROM dashboards;
  SELECT COUNT(*) INTO widget_count FROM dashboard_widgets;
  SELECT COUNT(*) INTO report_count FROM report_runs;
  SELECT COUNT(*) INTO export_count FROM export_jobs;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FS5 Validation Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alerts: %', alert_count;
  RAISE NOTICE 'Alert History: %', alert_history_count;
  RAISE NOTICE 'Dashboards: %', dashboard_count;
  RAISE NOTICE 'Dashboard Widgets: %', widget_count;
  RAISE NOTICE 'Report Runs: %', report_count;
  RAISE NOTICE 'Export Jobs: %', export_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All validations passed successfully!';
  RAISE NOTICE '========================================';
END $$;
