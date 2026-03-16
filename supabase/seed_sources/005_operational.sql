-- Seed data for Power Transmission operational data
-- This creates automation workflows, alarm rules, and CI projects for demo purposes
-- Uses clean CTE pattern with UUID generation (no explicit string IDs)
-- Note: Requires migration 011_create_operational_data.sql
-- Seeds now hard-fail with meaningful messages if preconditions are unmet.

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
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
  
  RAISE NOTICE 'Preconditions passed: tenant=1';
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- Get tenant UUID and upsert data
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Upsert automation workflows
upsert_automation AS (
  INSERT INTO operational_data (tenant_id, data_type, name, status, configuration)
  SELECT 
    tenant.id,
    'automation_workflow',
    v.name,
    v.status,
    v.configuration::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('Peak Load Management Automation', 'active', '{"trigger": "load_threshold", "threshold": 90, "actions": ["redistribute_load", "notify_operator"], "priority": "high", "auto_execute": true}'),
    ('Voltage Regulation Control', 'active', '{"trigger": "voltage_deviation", "threshold": 5, "actions": ["adjust_tap_changer", "switch_capacitor_bank"], "priority": "medium", "auto_execute": true}'),
    ('Emergency Load Shedding', 'standby', '{"trigger": "system_frequency", "threshold": 49.7, "actions": ["shed_non_critical_loads", "alert_control_room"], "priority": "critical", "auto_execute": false}')
  ) AS v(name, status, configuration)
  ON CONFLICT (tenant_id, data_type, name)
  DO UPDATE SET
    status = EXCLUDED.status,
    configuration = EXCLUDED.configuration,
    updated_at = now()
  RETURNING id, name
),
-- Upsert alarm rules
upsert_alarms AS (
  INSERT INTO operational_data (tenant_id, data_type, name, status, configuration)
  SELECT 
    tenant.id,
    'alarm_rule',
    v.name,
    v.status,
    v.configuration::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('Transformer Temperature Alarm', 'active', '{"monitored_metric": "oil_temperature", "warning_threshold": 95, "critical_threshold": 105, "escalation_time": 300, "notification_groups": ["operations", "maintenance"]}'),
    ('Circuit Breaker Failure Alarm', 'active', '{"monitored_metric": "breaker_status", "condition": "fail_to_operate", "severity": "critical", "auto_actions": ["isolate_section", "transfer_load"], "notification_groups": ["operations", "engineering"]}'),
    ('Line Overload Alarm', 'active', '{"monitored_metric": "line_loading", "warning_threshold": 85, "critical_threshold": 95, "hysteresis": 5, "notification_groups": ["operations"]}')
  ) AS v(name, status, configuration)
  ON CONFLICT (tenant_id, data_type, name)
  DO UPDATE SET
    status = EXCLUDED.status,
    configuration = EXCLUDED.configuration,
    updated_at = now()
  RETURNING id, name
),
-- Upsert CI projects
upsert_ci_projects AS (
  INSERT INTO operational_data (tenant_id, data_type, name, status, configuration)
  SELECT 
    tenant.id,
    'ci_project',
    v.name,
    v.status,
    v.configuration::jsonb
  FROM tenant
  CROSS JOIN (VALUES
    ('Reduce Transformer Maintenance Downtime', 'in_progress', '{"objective": "Reduce planned maintenance duration by 25%", "target_date": "2024-06-30", "owner": "Maintenance Team", "current_progress": 40, "kpis": ["downtime_hours", "maintenance_cost"]}'),
    ('Improve Grid Reliability Index', 'planning', '{"objective": "Achieve 99.98% grid availability", "target_date": "2024-12-31", "owner": "Operations Team", "current_progress": 15, "kpis": ["saidi", "saifi", "caidi"]}'),
    ('Optimize Load Dispatch Efficiency', 'completed', '{"objective": "Reduce transmission losses by 12%", "target_date": "2024-03-31", "owner": "Control Room", "current_progress": 100, "kpis": ["transmission_losses", "dispatch_accuracy"]}'),
    ('Enhance Cybersecurity Posture', 'in_progress', '{"objective": "Implement zero-trust network architecture", "target_date": "2024-09-30", "owner": "IT Security", "current_progress": 65, "kpis": ["security_incidents", "compliance_score"]}'),
    ('Smart Grid Digital Twin Implementation', 'planning', '{"objective": "Deploy IoT sensors on 90% of critical assets", "target_date": "2024-11-30", "owner": "Asset Management", "current_progress": 8, "kpis": ["sensor_coverage", "predictive_accuracy"]}')
  ) AS v(name, status, configuration)
  ON CONFLICT (tenant_id, data_type, name)
  DO UPDATE SET
    status = EXCLUDED.status,
    configuration = EXCLUDED.configuration,
    updated_at = now()
  RETURNING id, name
)
SELECT COUNT(*) FROM upsert_ci_projects;

COMMIT;
