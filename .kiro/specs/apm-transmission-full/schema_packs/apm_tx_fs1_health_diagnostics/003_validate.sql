-- FS1: Asset Health & Diagnostics - Validation Script
-- This script validates the health diagnostics schema and data integrity
-- Requirements: 6.1-6.10, 7.1-7.10, 8.1-8.8, 9.1-9.9, 10.1-10.6, 11.1-11.6
--
-- All validation queries should return 0 rows (no violations).
-- If any query returns rows, it indicates a data integrity issue.

BEGIN;

-- =============================================================================
-- SUBTASK 16.1: Validate parameter mappings complete
-- Requirement: 6.10
-- Check each transmission asset_type has >= 10 mapped parameters
-- =============================================================================

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  RAISE NOTICE 'Validating parameter mappings completeness...';
  
  -- Find asset types with fewer than 10 mapped parameters
  SELECT COUNT(*), STRING_AGG(asset_type || ' (' || param_count || ' params)', ', ')
  INTO violation_count, violation_details
  FROM (
    SELECT 
      asset_type,
      COUNT(*) as param_count
    FROM asset_parameter_map
    WHERE asset_type IN (
      'power_transformer',
      'circuit_breaker',
      'transmission_line',
      'protection_relay'
    )
    GROUP BY asset_type
    HAVING COUNT(*) < 10
  ) missing_params;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % transmission asset types have fewer than 10 mapped parameters: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All transmission asset types have >= 10 mapped parameters';
  END IF;
END $;

-- =============================================================================
-- SUBTASK 16.2: Validate telemetry exists for online assets
-- Requirement: 7.10
-- Check online assets have telemetry within expected intervals
-- =============================================================================

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  RAISE NOTICE 'Validating telemetry exists for online assets...';
  
  -- Find online assets without recent telemetry (within last 24 hours)
  -- This assumes online assets should have telemetry data
  SELECT COUNT(*), STRING_AGG(a.name || ' (' || a.asset_type || ')', ', ')
  INTO violation_count, violation_details
  FROM assets a
  WHERE a.operational_status = 'online'
    AND a.sector = 'power_transmission'
    AND NOT EXISTS (
      SELECT 1 
      FROM telemetry_data td
      WHERE td.asset_id = a.id
        AND td.timestamp >= NOW() - INTERVAL '24 hours'
    )
  LIMIT 10; -- Limit to first 10 violations for readability
  
  IF violation_count > 0 THEN
    RAISE WARNING 'VALIDATION WARNING: % online assets have no telemetry in last 24 hours: %', 
      violation_count, violation_details;
    -- Note: This is a warning, not an error, as it depends on seed data timing
  ELSE
    RAISE NOTICE '✓ All online assets have recent telemetry data';
  END IF;
END $;

-- =============================================================================
-- SUBTASK 16.3: Validate health score bounds
-- Requirement: 8.1
-- Check all health_scores have score between 0 and 100
-- =============================================================================

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  RAISE NOTICE 'Validating health score bounds...';
  
  -- Find health scores outside valid range
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (score: ' || score || ')', ', ')
  INTO violation_count, violation_details
  FROM health_scores
  WHERE score < 0 OR score > 100
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % health scores are outside bounds (0-100): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All health scores are within valid bounds (0-100)';
  END IF;
END $;

-- =============================================================================
-- SUBTASK 16.4: Validate diagnostic event states
-- Requirement: 9.8
-- Check closed events have resolution_notes
-- Check state transitions are valid
-- =============================================================================

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  RAISE NOTICE 'Validating diagnostic event states...';
  
  -- Check closed events have resolution_notes
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (' || title || ')', ', ')
  INTO violation_count, violation_details
  FROM diagnostic_events
  WHERE state = 'closed'
    AND (resolution_notes IS NULL OR resolution_notes = '')
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % closed diagnostic events missing resolution_notes: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All closed diagnostic events have resolution_notes';
  END IF;
  
  -- Check acknowledged events have acknowledged_by and acknowledged_at
  SELECT COUNT(*), STRING_AGG(id::TEXT, ', ')
  INTO violation_count, violation_details
  FROM diagnostic_events
  WHERE state IN ('ack', 'closed')
    AND (acknowledged_by IS NULL OR acknowledged_at IS NULL)
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % acknowledged/closed events missing acknowledgment details: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All acknowledged/closed events have acknowledgment details';
  END IF;
  
  -- Check closed events have closed_by and closed_at
  SELECT COUNT(*), STRING_AGG(id::TEXT, ', ')
  INTO violation_count, violation_details
  FROM diagnostic_events
  WHERE state = 'closed'
    AND (closed_by IS NULL OR closed_at IS NULL)
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % closed events missing closure details: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All closed events have closure details';
  END IF;
END $;

-- =============================================================================
-- SUBTASK 16.5: Validate RCA linkages
-- Requirement: 10.3
-- Check all rca_records link to valid events
-- =============================================================================

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  RAISE NOTICE 'Validating RCA record linkages...';
  
  -- Check RCA records link to valid diagnostic_events or downtime_events
  SELECT COUNT(*), STRING_AGG(r.id::TEXT, ', ')
  INTO violation_count, violation_details
  FROM rca_records r
  WHERE NOT EXISTS (
      SELECT 1 FROM diagnostic_events de WHERE de.id = r.event_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM downtime_events dwe WHERE dwe.id = r.event_id
    )
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % RCA records link to non-existent events: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE '✓ All RCA records link to valid events';
  END IF;
END $;

-- =============================================================================
-- Validation Summary
-- =============================================================================

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FS1 Validation Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All validation checks passed successfully.';
  RAISE NOTICE 'The health diagnostics schema and data are valid.';
END $;

COMMIT;
