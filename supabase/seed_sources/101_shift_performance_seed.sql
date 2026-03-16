-- Seed data for Shift Performance
-- This creates performance metrics for existing shifts

BEGIN;

-- Get tenant UUID
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Get shifts
shifts AS (
  SELECT sh.id, sh.shift_name, sh.shift_start
  FROM sim_shifts sh
  INNER JOIN tenant t ON sh.tenant_id = t.id
  ORDER BY sh.shift_start DESC
  LIMIT 12
),
-- Upsert shift performance
upsert_performance AS (
  INSERT INTO shift_performance (tenant_id, shift_id, performance_score, status, achievements, issues, metrics, notes)
  SELECT 
    (SELECT id FROM tenant),
    s.id,
    -- Unique performance score per shift
    (82.0 + (mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 73, 180) / 10.0)),
    CASE 
      WHEN mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC), 4) = 0 THEN 'excellent'
      WHEN mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC), 4) = 1 THEN 'good'
      WHEN mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC), 4) = 2 THEN 'needs-improvement'
      ELSE 'critical'
    END,
    mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 3, 7), -- achievements
    mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 2, 5), -- issues
    jsonb_build_object(
      'safety_incidents', 0,
      'equipment_uptime', 98.5 + (mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 11, 15) / 10.0),
      'response_time_avg', 8.0 + (mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 13, 120) / 10.0),
      'tasks_completed', 10 + mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 7, 15),
      'tasks_planned', 25 + mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC) * 5, 5)
    ),
    CASE 
      WHEN mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC), 3) = 0 THEN 'Performance optimization target achieved.'
      WHEN mod(ROW_NUMBER() OVER (ORDER BY s.shift_start DESC), 3) = 1 THEN 'Shift handover completed with minor pending actions.'
      ELSE 'Requires focus on response time for secondary alerts.'
    END
  FROM shifts s
  ON CONFLICT (shift_id)
  DO UPDATE SET
    performance_score = EXCLUDED.performance_score,
    status = EXCLUDED.status,
    achievements = EXCLUDED.achievements,
    issues = EXCLUDED.issues,
    metrics = EXCLUDED.metrics,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING id
)
SELECT COUNT(*) as performance_records_created FROM upsert_performance;

COMMIT;
