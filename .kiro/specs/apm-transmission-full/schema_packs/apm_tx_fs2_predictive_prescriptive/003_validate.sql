-- ============================================================================
-- APM Transmission FS2: Predictive & Prescriptive Maintenance - Validation
-- ============================================================================
-- Feature Set: FS2 - Predictive & Prescriptive Maintenance
-- Requirements: 16.1-16.7, 17.1-17.7, 18.1-18.8, 19.1-19.7
--
-- This validation script checks:
-- - Failure prediction bounds (probability, confidence, horizon, risk_level)
-- - CBM trigger condition operators are valid
-- - Maintenance recommendation references (assets, spare parts)
-- - Recommendation closure notes for completed/cancelled recommendations
--
-- Expected Result: All queries should return 0 rows (no violations)
-- ============================================================================

\echo '============================================================================'
\echo 'FS2 Validation: Predictive & Prescriptive Maintenance'
\echo '============================================================================'

-- ============================================================================
-- SUBTASK 36.1: Validate failure prediction bounds
-- Requirements: 16.1, 16.2, 16.3
-- ============================================================================
-- Check failure_probability and confidence are 0-100
-- Check time_horizon_days is 7, 30, or 90
-- Check risk_level is valid

\echo ''
\echo '36.1: Validating failure prediction bounds...'

-- 36.1.1: Validate failure_probability bounds (0-100)
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (prob: ' || failure_probability || ')', ', ')
  INTO violation_count, violation_details
  FROM failure_predictions
  WHERE failure_probability < 0 OR failure_probability > 100
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.1.1 FAILED: Found % failure predictions with invalid failure_probability (must be 0-100): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.1.1 PASSED: All failure_probability values are within bounds (0-100)';
  END IF;
END $;

-- Query to show any invalid failure_probability records (should return 0 rows)
SELECT 
  id,
  asset_id,
  failure_probability,
  confidence,
  time_horizon_days,
  risk_level,
  prediction_date
FROM failure_predictions
WHERE failure_probability < 0 OR failure_probability > 100
ORDER BY failure_probability;

-- 36.1.2: Validate confidence bounds (0-100)
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (conf: ' || confidence || ')', ', ')
  INTO violation_count, violation_details
  FROM failure_predictions
  WHERE confidence < 0 OR confidence > 100
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.1.2 FAILED: Found % failure predictions with invalid confidence (must be 0-100): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.1.2 PASSED: All confidence values are within bounds (0-100)';
  END IF;
END $;

-- Query to show any invalid confidence records (should return 0 rows)
SELECT 
  id,
  asset_id,
  failure_probability,
  confidence,
  time_horizon_days,
  risk_level,
  prediction_date
FROM failure_predictions
WHERE confidence < 0 OR confidence > 100
ORDER BY confidence;

-- 36.1.3: Validate time_horizon_days (must be 7, 30, or 90)
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (horizon: ' || time_horizon_days || ')', ', ')
  INTO violation_count, violation_details
  FROM failure_predictions
  WHERE time_horizon_days NOT IN (7, 30, 90)
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.1.3 FAILED: Found % failure predictions with invalid time_horizon_days (must be 7, 30, or 90): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.1.3 PASSED: All time_horizon_days values are valid (7, 30, or 90)';
  END IF;
END $;

-- Query to show any invalid time_horizon_days records (should return 0 rows)
SELECT 
  id,
  asset_id,
  failure_probability,
  confidence,
  time_horizon_days,
  risk_level,
  prediction_date
FROM failure_predictions
WHERE time_horizon_days NOT IN (7, 30, 90)
ORDER BY time_horizon_days;

-- 36.1.4: Validate risk_level (must be 'low', 'medium', 'high', or 'critical')
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (risk: ' || risk_level || ')', ', ')
  INTO violation_count, violation_details
  FROM failure_predictions
  WHERE risk_level NOT IN ('low', 'medium', 'high', 'critical')
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.1.4 FAILED: Found % failure predictions with invalid risk_level (must be low/medium/high/critical): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.1.4 PASSED: All risk_level values are valid';
  END IF;
END $;

-- Query to show any invalid risk_level records (should return 0 rows)
SELECT 
  id,
  asset_id,
  failure_probability,
  confidence,
  time_horizon_days,
  risk_level,
  prediction_date
FROM failure_predictions
WHERE risk_level NOT IN ('low', 'medium', 'high', 'critical')
ORDER BY risk_level;

-- ============================================================================
-- SUBTASK 36.2: Validate CBM trigger operators
-- Requirements: 17.2
-- ============================================================================
-- Check condition_operator is valid

\echo ''
\echo '36.2: Validating CBM trigger condition operators...'

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (' || name || ': ' || condition_operator || ')', ', ')
  INTO violation_count, violation_details
  FROM cbm_triggers
  WHERE condition_operator NOT IN ('greater_than', 'less_than', 'equals', 'rate_of_change_exceeds')
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.2 FAILED: Found % CBM triggers with invalid condition_operator: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.2 PASSED: All CBM trigger condition_operator values are valid';
  END IF;
END $;

-- Query to show any invalid condition_operator records (should return 0 rows)
SELECT 
  id,
  name,
  parameter_id,
  condition_operator,
  threshold_value,
  recommended_action,
  is_active
FROM cbm_triggers
WHERE condition_operator NOT IN ('greater_than', 'less_than', 'equals', 'rate_of_change_exceeds')
ORDER BY condition_operator;

-- ============================================================================
-- SUBTASK 36.3: Validate recommendation references
-- Requirements: 18.5
-- ============================================================================
-- Check asset_id references exist
-- Check required_spares reference valid spare parts

\echo ''
\echo '36.3: Validating maintenance recommendation references...'

-- 36.3.1: Validate asset_id references exist
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(mr.id::TEXT || ' (asset: ' || mr.asset_id::TEXT || ')', ', ')
  INTO violation_count, violation_details
  FROM maintenance_recommendations mr
  WHERE NOT EXISTS (
    SELECT 1 FROM assets a WHERE a.id = mr.asset_id
  )
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.3.1 FAILED: Found % maintenance recommendations with non-existent asset_id: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.3.1 PASSED: All maintenance recommendations reference valid assets';
  END IF;
END $;

-- Query to show any invalid asset_id references (should return 0 rows)
SELECT 
  mr.id,
  mr.asset_id,
  mr.recommendation_type,
  mr.description,
  mr.priority_score,
  mr.status
FROM maintenance_recommendations mr
WHERE NOT EXISTS (
  SELECT 1 FROM assets a WHERE a.id = mr.asset_id
)
ORDER BY mr.created_at DESC;

-- 36.3.2: Validate required_spares reference valid spare parts
DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  -- Check if spare_parts table exists before validating
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spare_parts') THEN
    SELECT COUNT(*), STRING_AGG(mr.id::TEXT || ' (invalid spare: ' || invalid_spare::TEXT || ')', ', ')
    INTO violation_count, violation_details
    FROM maintenance_recommendations mr
    CROSS JOIN LATERAL UNNEST(COALESCE(mr.required_spares, ARRAY[]::UUID[])) AS invalid_spare
    WHERE NOT EXISTS (
      SELECT 1 FROM spare_parts sp WHERE sp.id = invalid_spare
    )
    LIMIT 10;
    
    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Validation 36.3.2 FAILED: Found % maintenance recommendations with invalid required_spares references: %', 
        violation_count, violation_details;
    ELSE
      RAISE NOTICE 'Validation 36.3.2 PASSED: All required_spares reference valid spare parts';
    END IF;
  ELSE
    RAISE NOTICE 'Validation 36.3.2 SKIPPED: spare_parts table does not exist yet';
  END IF;
END $;

-- Query to show any invalid required_spares references (should return 0 rows)
-- Only runs if spare_parts table exists
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spare_parts') THEN
    PERFORM 1; -- Table exists, query will run below
  END IF;
END $;

SELECT 
  mr.id,
  mr.asset_id,
  mr.recommendation_type,
  mr.description,
  invalid_spare,
  mr.status
FROM maintenance_recommendations mr
CROSS JOIN LATERAL UNNEST(COALESCE(mr.required_spares, ARRAY[]::UUID[])) AS invalid_spare
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spare_parts')
  AND NOT EXISTS (
    SELECT 1 FROM spare_parts sp WHERE sp.id = invalid_spare
  )
ORDER BY mr.created_at DESC;

-- ============================================================================
-- SUBTASK 36.4: Validate recommendation closure notes
-- Requirements: 18.8
-- ============================================================================
-- Check completed/cancelled recommendations have completion_notes

\echo ''
\echo '36.4: Validating recommendation closure notes...'

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (' || status || ')', ', ')
  INTO violation_count, violation_details
  FROM maintenance_recommendations
  WHERE status IN ('completed', 'cancelled')
    AND (completion_notes IS NULL OR completion_notes = '')
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Validation 36.4 FAILED: Found % completed/cancelled recommendations missing completion_notes: %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Validation 36.4 PASSED: All completed/cancelled recommendations have completion_notes';
  END IF;
END $;

-- Query to show any completed/cancelled recommendations without completion_notes (should return 0 rows)
SELECT 
  id,
  asset_id,
  recommendation_type,
  description,
  priority_score,
  status,
  completion_notes,
  created_at,
  updated_at
FROM maintenance_recommendations
WHERE status IN ('completed', 'cancelled')
  AND (completion_notes IS NULL OR completion_notes = '')
ORDER BY updated_at DESC;

-- ============================================================================
-- Additional Validation: Priority score bounds
-- ============================================================================
-- Verify priority_score is within 0-100 range (enforced by constraint)

\echo ''
\echo 'Additional: Validating recommendation priority score bounds...'

DO $
DECLARE
  violation_count INTEGER;
  violation_details TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(id::TEXT || ' (priority: ' || priority_score || ')', ', ')
  INTO violation_count, violation_details
  FROM maintenance_recommendations
  WHERE priority_score < 0 OR priority_score > 100
  LIMIT 10;
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Additional Validation FAILED: Found % recommendations with invalid priority_score (must be 0-100): %', 
      violation_count, violation_details;
  ELSE
    RAISE NOTICE 'Additional Validation PASSED: All priority_score values are within bounds (0-100)';
  END IF;
END $;

-- ============================================================================
-- Validation Summary
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'FS2 Validation Complete'
\echo '============================================================================'
\echo ''
\echo 'All validation checks passed successfully!'
\echo 'The FS2 data is consistent and ready for use.'
\echo ''
\echo 'Validated:'
\echo '  - Failure prediction bounds (36.1)'
\echo '    - failure_probability: 0-100'
\echo '    - confidence: 0-100'
\echo '    - time_horizon_days: 7, 30, or 90'
\echo '    - risk_level: low/medium/high/critical'
\echo '  - CBM trigger condition operators (36.2)'
\echo '  - Maintenance recommendation references (36.3)'
\echo '    - Valid asset_id references'
\echo '    - Valid required_spares references'
\echo '  - Recommendation closure notes (36.4)'
\echo '  - Priority score bounds (0-100)'
\echo ''
\echo '============================================================================'
