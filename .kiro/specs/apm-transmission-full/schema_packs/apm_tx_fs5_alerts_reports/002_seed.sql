-- ============================================================================
-- APM Transmission FS5: Alerts, Reports & Visualisation - Seed Script
-- ============================================================================
-- Feature Set: FS5 - Alerts, Reports & Visualisation
-- Purpose: Seed sample data for alerts, alert history, dashboards, reports,
--          and export jobs
-- Requirements: 20.1-20.9, 21.1-21.6, 22.1-22.7, 23.1-23.7, 24.1-24.8
-- Dependencies: Requires seeded data from FS1, FS2, FS3, FS4
-- ============================================================================

-- ============================================================================
-- Seed: alerts
-- Purpose: Create sample alerts from various sources
-- Requirements: 20.1-20.9
-- ============================================================================

DO $
DECLARE
  tx001_id UUID;
  tx002_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
  relay001_id UUID;
  relay002_id UUID;
  
  diag_event1_id UUID;
  diag_event2_id UUID;
  diag_event3_id UUID;
  
  pred1_id UUID;
  pred2_id UUID;
BEGIN
  RAISE NOTICE 'Seeding alerts...';
  
  -- Get asset IDs
  SELECT id INTO tx001_id FROM assets WHERE asset_tag = 'TX-001' AND sector = 'power_transmission';
  SELECT id INTO tx002_id FROM assets WHERE asset_tag = 'TX-002' AND sector = 'power_transmission';
  SELECT id INTO cb101_id FROM assets WHERE asset_tag = 'CB-101' AND sector = 'power_transmission';
  SELECT id INTO cb102_id FROM assets WHERE asset_tag = 'CB-102' AND sector = 'power_transmission';
  SELECT id INTO cb103_id FROM assets WHERE asset_tag = 'CB-103' AND sector = 'power_transmission';
  SELECT id INTO cb104_id FROM assets WHERE asset_tag = 'CB-104' AND sector = 'power_transmission';
  SELECT id INTO line_n01_id FROM assets WHERE asset_tag = 'LINE-N01' AND sector = 'power_transmission';
  SELECT id INTO line_n02_id FROM assets WHERE asset_tag = 'LINE-N02' AND sector = 'power_transmission';
  SELECT id INTO relay001_id FROM assets WHERE asset_tag = 'RELAY-001' AND sector = 'power_transmission';
  SELECT id INTO relay002_id FROM assets WHERE asset_tag = 'RELAY-002' AND sector = 'power_transmission';
  
  -- Get some diagnostic event IDs for linking
  SELECT id INTO diag_event1_id FROM diagnostic_events WHERE asset_id = tx001_id AND event_type = 'thermal' LIMIT 1;
  SELECT id INTO diag_event2_id FROM diagnostic_events WHERE asset_id = cb101_id AND event_type = 'electrical' LIMIT 1;
  SELECT id INTO diag_event3_id FROM diagnostic_events WHERE asset_id = relay002_id AND event_type = 'comms' LIMIT 1;
  
  -- Get some failure prediction IDs for linking
  SELECT id INTO pred1_id FROM failure_predictions WHERE asset_id = tx001_id AND risk_level = 'high' LIMIT 1;
  SELECT id INTO pred2_id FROM failure_predictions WHERE asset_id = cb101_id AND risk_level = 'critical' LIMIT 1;
  
  -- ========================================================================
  -- Alerts from Telemetry Threshold Violations
  -- ========================================================================
  
  -- Critical: TX-001 Top Oil Temperature exceeds critical threshold
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state
  ) VALUES (
    tx001_id,
    'temperature_critical',
    'critical',
    'telemetry',
    'Top oil temperature exceeded critical threshold (95°C). Current: 98°C',
    NOW() - INTERVAL '2 hours',
    'open'
  );
  
  -- Warning: TX-001 Winding Hot Spot Temperature in warning range
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    tx001_id,
    'temperature_warning',
    'warning',
    'telemetry',
    'Winding hot spot temperature in warning range (110°C). Current: 112°C',
    NOW() - INTERVAL '6 hours',
    'ack',
    'operator_john',
    NOW() - INTERVAL '5 hours'
  );
  
  -- Critical: CB-101 SF6 Pressure critically low
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state
  ) VALUES (
    cb101_id,
    'sf6_pressure_critical',
    'critical',
    'telemetry',
    'SF6 gas pressure critically low (4.2 bar). Minimum: 4.5 bar',
    NOW() - INTERVAL '1 hour',
    'open'
  );
  
  -- Warning: CB-102 Contact Wear approaching limit
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    cb102_id,
    'contact_wear_warning',
    'warning',
    'telemetry',
    'Contact wear approaching limit (78%). Threshold: 80%',
    NOW() - INTERVAL '12 hours',
    'ack',
    'engineer_sarah',
    NOW() - INTERVAL '10 hours'
  );
  
  -- Emergency: LINE-N01 Conductor Temperature extreme
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    line_n01_id,
    'conductor_temp_emergency',
    'emergency',
    'telemetry',
    'Conductor temperature at emergency level (95°C). Risk of sag violation',
    NOW() - INTERVAL '30 minutes',
    'ack',
    'operator_mike',
    NOW() - INTERVAL '25 minutes'
  );
  
  -- Warning: TX-002 Load Factor high
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes
  ) VALUES (
    tx002_id,
    'load_factor_warning',
    'warning',
    'telemetry',
    'Load factor high (92%). Consider load balancing',
    NOW() - INTERVAL '24 hours',
    'closed',
    'operator_john',
    NOW() - INTERVAL '23 hours',
    'engineer_sarah',
    NOW() - INTERVAL '20 hours',
    'Load redistributed to TX-001. Load factor now at 85%'
  );
  
  -- Info: CB-103 Operation Count milestone
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes
  ) VALUES (
    cb103_id,
    'operation_count_milestone',
    'info',
    'telemetry',
    'Operation count reached 5000 cycles. Maintenance inspection recommended',
    NOW() - INTERVAL '48 hours',
    'closed',
    'engineer_sarah',
    NOW() - INTERVAL '47 hours',
    'engineer_sarah',
    NOW() - INTERVAL '24 hours',
    'Inspection completed. Breaker in good condition. Next inspection at 7500 cycles'
  );
  
  -- Critical: RELAY-002 Communication Latency high
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state
  ) VALUES (
    relay002_id,
    'comms_latency_critical',
    'critical',
    'telemetry',
    'Communication latency critically high (850ms). Threshold: 500ms',
    NOW() - INTERVAL '15 minutes',
    'open'
  );
  
  -- ========================================================================
  -- Alerts from Diagnostic Events
  -- ========================================================================
  
  -- Critical: Thermal anomaly detected on TX-001
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, source_event_id
  ) VALUES (
    tx001_id,
    'thermal_anomaly',
    'critical',
    'diagnostic',
    'Thermal anomaly detected: Abnormal temperature rise pattern in top oil',
    NOW() - INTERVAL '3 hours',
    'open',
    diag_event1_id
  );
  
  -- Warning: Electrical anomaly on CB-101
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, source_event_id
  ) VALUES (
    cb101_id,
    'electrical_anomaly',
    'warning',
    'diagnostic',
    'Electrical anomaly: Trip coil current deviation detected',
    NOW() - INTERVAL '8 hours',
    'ack',
    'engineer_sarah',
    NOW() - INTERVAL '7 hours',
    diag_event2_id
  );
  
  -- Critical: Communication failure on RELAY-002
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, source_event_id
  ) VALUES (
    relay002_id,
    'comms_failure',
    'critical',
    'diagnostic',
    'Communication failure: GOOSE message timeout detected',
    NOW() - INTERVAL '20 minutes',
    'open',
    diag_event3_id
  );
  
  -- Warning: Insulation degradation on TX-001
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    tx001_id,
    'insulation_degradation',
    'warning',
    'diagnostic',
    'Insulation degradation: DGA analysis shows elevated acetylene levels',
    NOW() - INTERVAL '36 hours',
    'ack',
    'engineer_sarah',
    NOW() - INTERVAL '35 hours'
  );
  
  -- ========================================================================
  -- Alerts from Failure Predictions
  -- ========================================================================
  
  -- Critical: High failure probability for TX-001
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, source_event_id
  ) VALUES (
    tx001_id,
    'failure_prediction_high',
    'critical',
    'prediction',
    'High failure probability (75%) within 7 days. Insulation degradation risk',
    NOW() - INTERVAL '4 hours',
    'ack',
    'engineer_sarah',
    NOW() - INTERVAL '3 hours',
    pred1_id
  );
  
  -- Emergency: Critical failure risk for CB-101
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, source_event_id
  ) VALUES (
    cb101_id,
    'failure_prediction_critical',
    'emergency',
    'prediction',
    'Critical failure risk (85%) within 7 days. Mechanism wear detected',
    NOW() - INTERVAL '1 hour',
    'ack',
    'operator_mike',
    NOW() - INTERVAL '55 minutes',
    pred2_id
  );
  
  -- Warning: Medium failure probability for CB-102
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes
  ) VALUES (
    cb102_id,
    'failure_prediction_medium',
    'warning',
    'prediction',
    'Medium failure probability (45%) within 30 days. SF6 degradation trend',
    NOW() - INTERVAL '72 hours',
    'closed',
    'engineer_sarah',
    NOW() - INTERVAL '71 hours',
    'engineer_sarah',
    NOW() - INTERVAL '48 hours',
    'Maintenance scheduled for next week. SF6 replenishment planned'
  );
  
  -- Info: Low failure probability for CB-103
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes
  ) VALUES (
    cb103_id,
    'failure_prediction_low',
    'info',
    'prediction',
    'Low failure probability (15%) within 90 days. Asset in good condition',
    NOW() - INTERVAL '96 hours',
    'closed',
    'engineer_sarah',
    NOW() - INTERVAL '95 hours',
    'engineer_sarah',
    NOW() - INTERVAL '72 hours',
    'Acknowledged. Continue normal monitoring'
  );
  
  -- ========================================================================
  -- Manual Alerts
  -- ========================================================================
  
  -- Warning: Manual alert for scheduled maintenance
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    tx001_id,
    'scheduled_maintenance',
    'warning',
    'manual',
    'Scheduled maintenance window: Oil sampling and DGA analysis required',
    NOW() - INTERVAL '5 days',
    'ack',
    'engineer_sarah',
    NOW() - INTERVAL '4 days'
  );
  
  -- Info: Manual alert for inspection completion
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes
  ) VALUES (
    cb104_id,
    'inspection_complete',
    'info',
    'manual',
    'Annual inspection completed. Minor issues identified',
    NOW() - INTERVAL '7 days',
    'closed',
    'engineer_sarah',
    NOW() - INTERVAL '7 days',
    'engineer_sarah',
    NOW() - INTERVAL '6 days',
    'Contact wear at 65%. Scheduled for replacement in 6 months'
  );
  
  -- Critical: Manual alert for grid event
  INSERT INTO alerts (
    asset_id, alert_type, severity, source, message, 
    detected_at, state, acknowledged_by, acknowledged_at
  ) VALUES (
    line_n01_id,
    'grid_event',
    'critical',
    'manual',
    'Grid disturbance detected. Line tripped due to fault',
    NOW() - INTERVAL '10 hours',
    'ack',
    'operator_mike',
    NOW() - INTERVAL '9 hours'
  );
  
  RAISE NOTICE 'Seeded % alerts with variety of severities and states', 
    (SELECT COUNT(*) FROM alerts);
END $;

-- ============================================================================
-- Seed: alert_history
-- Purpose: Create sample alert state transition records
-- Requirements: 21.5
-- ============================================================================

DO $
DECLARE
  alert_id1 UUID;
  alert_id2 UUID;
  alert_id3 UUID;
  alert_id4 UUID;
BEGIN
  RAISE NOTICE 'Seeding alert history...';
  
  -- Get some alert IDs that have state transitions
  SELECT id INTO alert_id1 FROM alerts WHERE alert_type = 'temperature_warning' AND state = 'ack' LIMIT 1;
  SELECT id INTO alert_id2 FROM alerts WHERE alert_type = 'load_factor_warning' AND state = 'closed' LIMIT 1;
  SELECT id INTO alert_id3 FROM alerts WHERE alert_type = 'operation_count_milestone' AND state = 'closed' LIMIT 1;
  SELECT id INTO alert_id4 FROM alerts WHERE alert_type = 'failure_prediction_medium' AND state = 'closed' LIMIT 1;
  
  -- Alert history for temperature_warning (open -> ack)
  IF alert_id1 IS NOT NULL THEN
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id1,
      'open',
      'ack',
      'operator_john',
      NOW() - INTERVAL '5 hours',
      'Acknowledged. Monitoring temperature trend'
    );
  END IF;
  
  -- Alert history for load_factor_warning (open -> ack -> closed)
  IF alert_id2 IS NOT NULL THEN
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id2,
      'open',
      'ack',
      'operator_john',
      NOW() - INTERVAL '23 hours',
      'Acknowledged. Will coordinate load redistribution'
    );
    
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id2,
      'ack',
      'closed',
      'engineer_sarah',
      NOW() - INTERVAL '20 hours',
      'Load redistributed successfully. Issue resolved'
    );
  END IF;
  
  -- Alert history for operation_count_milestone (open -> ack -> closed)
  IF alert_id3 IS NOT NULL THEN
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id3,
      'open',
      'ack',
      'engineer_sarah',
      NOW() - INTERVAL '47 hours',
      'Acknowledged. Scheduling inspection'
    );
    
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id3,
      'ack',
      'closed',
      'engineer_sarah',
      NOW() - INTERVAL '24 hours',
      'Inspection completed. Breaker in good condition'
    );
  END IF;
  
  -- Alert history for failure_prediction_medium (open -> ack -> closed)
  IF alert_id4 IS NOT NULL THEN
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id4,
      'open',
      'ack',
      'engineer_sarah',
      NOW() - INTERVAL '71 hours',
      'Acknowledged. Reviewing maintenance schedule'
    );
    
    INSERT INTO alert_history (
      alert_id, previous_state, new_state, changed_by, changed_at, notes
    ) VALUES (
      alert_id4,
      'ack',
      'closed',
      'engineer_sarah',
      NOW() - INTERVAL '48 hours',
      'Maintenance scheduled. SF6 replenishment planned for next week'
    );
  END IF;
  
  RAISE NOTICE 'Seeded % alert history records', 
    (SELECT COUNT(*) FROM alert_history);
END $;

-- ============================================================================
-- Seed: dashboards
-- Purpose: Create sample dashboards for different user roles
-- Requirements: 22.1-22.7
-- ============================================================================

DO $
DECLARE
  reliability_dashboard_id UUID;
  operations_dashboard_id UUID;
  maintenance_dashboard_id UUID;
BEGIN
  RAISE NOTICE 'Seeding dashboards...';
  
  -- Reliability Manager Dashboard
  INSERT INTO dashboards (
    name, description, owner, layout_config
  ) VALUES (
    'Reliability Manager Overview',
    'Comprehensive reliability metrics and asset health overview for transmission assets',
    'reliability_manager',
    '{
      "layout": "grid",
      "columns": 3,
      "rows": 3,
      "theme": "light"
    }'::JSONB
  ) RETURNING id INTO reliability_dashboard_id;
  
  -- Operations Engineer Dashboard
  INSERT INTO dashboards (
    name, description, owner, layout_config
  ) VALUES (
    'Operations Control Center',
    'Real-time monitoring and alert management for transmission operations',
    'operations_engineer',
    '{
      "layout": "grid",
      "columns": 2,
      "rows": 4,
      "theme": "dark",
      "refresh_interval": 30
    }'::JSONB
  ) RETURNING id INTO operations_dashboard_id;
  
  -- Maintenance Planner Dashboard
  INSERT INTO dashboards (
    name, description, owner, layout_config
  ) VALUES (
    'Maintenance Planning Dashboard',
    'Predictive maintenance recommendations and work order tracking',
    'maintenance_planner',
    '{
      "layout": "grid",
      "columns": 2,
      "rows": 3,
      "theme": "light"
    }'::JSONB
  ) RETURNING id INTO maintenance_dashboard_id;
  
  -- ========================================================================
  -- Widgets for Reliability Manager Dashboard
  -- ========================================================================
  
  -- Widget: Overall Fleet Availability KPI
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    reliability_dashboard_id,
    'KPI_card',
    'fleet_availability',
    '{"row": 1, "col": 1, "width": 1, "height": 1}'::JSONB,
    '{
      "title": "Fleet Availability",
      "metric": "availability_percent",
      "format": "percentage",
      "threshold_warning": 95,
      "threshold_critical": 90
    }'::JSONB
  );
  
  -- Widget: MTBF Trend Chart
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    reliability_dashboard_id,
    'time_series_chart',
    'mtbf_trend',
    '{"row": 1, "col": 2, "width": 2, "height": 1}'::JSONB,
    '{
      "title": "MTBF Trend (30 Days)",
      "chart_type": "line",
      "y_axis_label": "Hours",
      "show_target_line": true
    }'::JSONB
  );
  
  -- Widget: Asset Health Status Grid
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    reliability_dashboard_id,
    'status_grid',
    'asset_health_status',
    '{"row": 2, "col": 1, "width": 3, "height": 1}'::JSONB,
    '{
      "title": "Asset Health Status",
      "group_by": "asset_type",
      "color_by": "health_score"
    }'::JSONB
  );
  
  -- Widget: Failure Predictions Table
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    reliability_dashboard_id,
    'table',
    'high_risk_predictions',
    '{"row": 3, "col": 1, "width": 3, "height": 1}'::JSONB,
    '{
      "title": "High Risk Failure Predictions",
      "columns": ["asset", "risk_level", "probability", "horizon", "rul_days"],
      "sort_by": "probability",
      "sort_order": "desc",
      "max_rows": 10
    }'::JSONB
  );
  
  -- ========================================================================
  -- Widgets for Operations Engineer Dashboard
  -- ========================================================================
  
  -- Widget: Active Critical Alerts
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    operations_dashboard_id,
    'alert_list',
    'active_critical_alerts',
    '{"row": 1, "col": 1, "width": 2, "height": 1}'::JSONB,
    '{
      "title": "Active Critical Alerts",
      "filter_severity": ["critical", "emergency"],
      "filter_state": ["open", "ack"],
      "max_items": 15,
      "auto_refresh": true
    }'::JSONB
  );
  
  -- Widget: Asset Operational Status
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    operations_dashboard_id,
    'status_grid',
    'asset_operational_status',
    '{"row": 2, "col": 1, "width": 1, "height": 1}'::JSONB,
    '{
      "title": "Asset Status",
      "group_by": "operational_status",
      "show_counts": true
    }'::JSONB
  );
  
  -- Widget: Real-time Telemetry Chart
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    operations_dashboard_id,
    'time_series_chart',
    'realtime_telemetry',
    '{"row": 2, "col": 2, "width": 1, "height": 2}'::JSONB,
    '{
      "title": "Real-time Telemetry",
      "chart_type": "line",
      "time_window": "1 hour",
      "parameters": ["temperature", "load_current", "voltage"],
      "auto_refresh": true
    }'::JSONB
  );
  
  -- Widget: Recent Diagnostic Events
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    operations_dashboard_id,
    'table',
    'recent_diagnostic_events',
    '{"row": 3, "col": 1, "width": 1, "height": 2}'::JSONB,
    '{
      "title": "Recent Diagnostic Events",
      "columns": ["asset", "event_type", "confidence", "detected_at", "state"],
      "sort_by": "detected_at",
      "sort_order": "desc",
      "max_rows": 10
    }'::JSONB
  );
  
  -- ========================================================================
  -- Widgets for Maintenance Planner Dashboard
  -- ========================================================================
  
  -- Widget: Maintenance Backlog Count
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    maintenance_dashboard_id,
    'KPI_card',
    'maintenance_backlog_count',
    '{"row": 1, "col": 1, "width": 1, "height": 1}'::JSONB,
    '{
      "title": "Open Recommendations",
      "metric": "count",
      "format": "number",
      "threshold_warning": 20,
      "threshold_critical": 30
    }'::JSONB
  );
  
  -- Widget: Average Priority Score
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    maintenance_dashboard_id,
    'KPI_card',
    'avg_priority_score',
    '{"row": 1, "col": 2, "width": 1, "height": 1}'::JSONB,
    '{
      "title": "Avg Priority Score",
      "metric": "priority_score",
      "format": "number",
      "decimals": 1
    }'::JSONB
  );
  
  -- Widget: Prioritized Recommendations Table
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    maintenance_dashboard_id,
    'table',
    'prioritized_recommendations',
    '{"row": 2, "col": 1, "width": 2, "height": 1}'::JSONB,
    '{
      "title": "Prioritized Maintenance Recommendations",
      "columns": ["asset", "recommendation_type", "priority_score", "due_date", "status"],
      "sort_by": "priority_score",
      "sort_order": "desc",
      "max_rows": 15
    }'::JSONB
  );
  
  -- Widget: Spare Parts Availability
  INSERT INTO dashboard_widgets (
    dashboard_id, widget_type, query_template_ref, position, config
  ) VALUES (
    maintenance_dashboard_id,
    'table',
    'spare_parts_status',
    '{"row": 3, "col": 1, "width": 2, "height": 1}'::JSONB,
    '{
      "title": "Critical Spare Parts Status",
      "columns": ["part_number", "description", "on_hand", "reorder_point", "status"],
      "filter_critical": true,
      "max_rows": 10
    }'::JSONB
  );
  
  RAISE NOTICE 'Seeded % dashboards with % widgets', 
    (SELECT COUNT(*) FROM dashboards),
    (SELECT COUNT(*) FROM dashboard_widgets);
END $;

-- ============================================================================
-- Seed: report_runs
-- Purpose: Create sample report execution records
-- Requirements: 23.3, 23.4
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE 'Seeding report runs...';
  
  -- Reliability Summary Report - Completed
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'reliability_summary',
    NOW() - INTERVAL '7 days',
    'completed',
    '/reports/reliability_summary_2025_01_23.pdf',
    '{
      "asset_types": ["power_transformer", "circuit_breaker", "transmission_line"],
      "period": "monthly",
      "month": "2025-01"
    }'::JSONB,
    'reliability_manager'
  );
  
  -- Reliability Summary Report - Completed (Previous Month)
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'reliability_summary',
    NOW() - INTERVAL '37 days',
    'completed',
    '/reports/reliability_summary_2024_12_24.pdf',
    '{
      "asset_types": ["power_transformer", "circuit_breaker", "transmission_line"],
      "period": "monthly",
      "month": "2024-12"
    }'::JSONB,
    'reliability_manager'
  );
  
  -- Maintenance Backlog Report - Completed
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'maintenance_backlog',
    NOW() - INTERVAL '3 days',
    'completed',
    '/reports/maintenance_backlog_2025_01_27.pdf',
    '{
      "status": ["open", "scheduled"],
      "min_priority": 50,
      "asset_types": ["power_transformer", "circuit_breaker"]
    }'::JSONB,
    'maintenance_planner'
  );
  
  -- Asset Health Status Report - Completed
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'asset_health_status',
    NOW() - INTERVAL '1 day',
    'completed',
    '/reports/asset_health_status_2025_01_29.pdf',
    '{
      "asset_types": ["power_transformer", "circuit_breaker", "transmission_line", "protection_relay"],
      "include_health_scores": true,
      "include_diagnostic_events": true
    }'::JSONB,
    'reliability_manager'
  );
  
  -- Performance Benchmarking Report - Completed
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'performance_benchmarking',
    NOW() - INTERVAL '14 days',
    'completed',
    '/reports/performance_benchmarking_2025_01_16.pdf',
    '{
      "asset_types": ["power_transformer", "circuit_breaker"],
      "period": "quarterly",
      "quarter": "2024-Q4",
      "include_deviations": true
    }'::JSONB,
    'reliability_manager'
  );
  
  -- Maintenance Backlog Report - Processing
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'maintenance_backlog',
    NOW() - INTERVAL '5 minutes',
    'processing',
    NULL,
    '{
      "status": ["open"],
      "min_priority": 70,
      "asset_types": ["power_transformer", "circuit_breaker", "transmission_line"]
    }'::JSONB,
    'maintenance_planner'
  );
  
  -- Asset Health Status Report - Failed
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'asset_health_status',
    NOW() - INTERVAL '2 days',
    'failed',
    NULL,
    '{
      "asset_types": ["power_transformer"],
      "include_health_scores": true
    }'::JSONB,
    'reliability_manager'
  );
  
  -- Reliability Summary Report - Queued
  INSERT INTO report_runs (
    report_type, execution_time, status, output_location, asset_scope, created_by
  ) VALUES (
    'reliability_summary',
    NOW(),
    'queued',
    NULL,
    '{
      "asset_types": ["power_transformer", "circuit_breaker", "transmission_line"],
      "period": "weekly",
      "week": "2025-W05"
    }'::JSONB,
    'reliability_manager'
  );
  
  RAISE NOTICE 'Seeded % report runs with variety of statuses', 
    (SELECT COUNT(*) FROM report_runs);
END $;

-- ============================================================================
-- Seed Complete
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FS5 seed script completed successfully';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Alerts: %', (SELECT COUNT(*) FROM alerts);
  RAISE NOTICE '  - Alert History: %', (SELECT COUNT(*) FROM alert_history);
  RAISE NOTICE '  - Dashboards: %', (SELECT COUNT(*) FROM dashboards);
  RAISE NOTICE '  - Dashboard Widgets: %', (SELECT COUNT(*) FROM dashboard_widgets);
  RAISE NOTICE '  - Report Runs: %', (SELECT COUNT(*) FROM report_runs);
  RAISE NOTICE '========================================';
END $;
