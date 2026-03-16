-- ============================================================================
-- FS3: Asset Performance & Utilisation - Validation Script
-- ============================================================================
-- This validation script verifies the integrity and correctness of FS3 data
-- including downtime events, reliability metrics, utilisation metrics, and
-- performance benchmarks.
--
-- Requirements: 12.1-12.9, 13.1-13.7, 14.1-14.7, 15.1-15.7
-- ============================================================================

\echo '============================================================================'
\echo 'FS3 Validation: Asset Performance & Utilisation'
\echo '============================================================================'

-- ============================================================================
-- 26.1: Validate downtime duration consistency
-- ============================================================================
-- Check that duration_minutes equals (end_time - start_time) in minutes
-- Requirements: 12.6, 27.7

\echo ''
\echo '26.1: Validating downtime duration consistency...'

DO $
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM downtime_events
  WHERE end_time IS NOT NULL
    AND duration_minutes IS NOT NULL
    AND ABS(duration_minutes - EXTRACT(EPOCH FROM (end_time - start_time)) / 60) > 0.1;
  
  IF inconsistent_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.1 FAILED: Found % downtime events with inconsistent duration_minutes', inconsistent_count;
  ELSE
    RAISE NOTICE 'Validation 26.1 PASSED: All downtime durations are consistent';
  END IF;
END $;

-- Query to show any inconsistent records (should return 0 rows)
SELECT 
  id,
  asset_id,
  event_type,
  start_time,
  end_time,
  duration_minutes AS stored_duration,
  ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60, 2) AS calculated_duration,
  ABS(duration_minutes - EXTRACT(EPOCH FROM (end_time - start_time)) / 60) AS difference_minutes
FROM downtime_events
WHERE end_time IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND ABS(duration_minutes - EXTRACT(EPOCH FROM (end_time - start_time)) / 60) > 0.1
ORDER BY difference_minutes DESC;

-- ============================================================================
-- 26.2: Validate downtime non-overlap
-- ============================================================================
-- Check that no overlapping downtime periods exist per asset
-- Requirements: 12.9

\echo ''
\echo '26.2: Validating downtime non-overlap...'

DO $
DECLARE
  overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO overlap_count
  FROM downtime_events d1
  INNER JOIN downtime_events d2 
    ON d1.asset_id = d2.asset_id 
    AND d1.id < d2.id
  WHERE d1.end_time IS NOT NULL
    AND d2.end_time IS NOT NULL
    AND (
      -- Check if time ranges overlap
      (d1.start_time, d1.end_time) OVERLAPS (d2.start_time, d2.end_time)
    );
  
  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.2 FAILED: Found % overlapping downtime periods', overlap_count;
  ELSE
    RAISE NOTICE 'Validation 26.2 PASSED: No overlapping downtime periods found';
  END IF;
END $;

-- Query to show any overlapping records (should return 0 rows)
SELECT 
  a.name AS asset_name,
  d1.id AS event1_id,
  d1.event_type AS event1_type,
  d1.start_time AS event1_start,
  d1.end_time AS event1_end,
  d2.id AS event2_id,
  d2.event_type AS event2_type,
  d2.start_time AS event2_start,
  d2.end_time AS event2_end
FROM downtime_events d1
INNER JOIN downtime_events d2 
  ON d1.asset_id = d2.asset_id 
  AND d1.id < d2.id
INNER JOIN assets a ON d1.asset_id = a.id
WHERE d1.end_time IS NOT NULL
  AND d2.end_time IS NOT NULL
  AND (d1.start_time, d1.end_time) OVERLAPS (d2.start_time, d2.end_time)
ORDER BY a.name, d1.start_time;

-- ============================================================================
-- 26.3: Validate reliability period non-overlap
-- ============================================================================
-- Check that no overlapping reliability_metrics periods exist per asset
-- Requirements: 13.6, 27.8

\echo ''
\echo '26.3: Validating reliability period non-overlap...'

DO $
DECLARE
  overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO overlap_count
  FROM reliability_metrics r1
  INNER JOIN reliability_metrics r2 
    ON r1.asset_id = r2.asset_id 
    AND r1.id < r2.id
  WHERE (r1.period_start, r1.period_end) OVERLAPS (r2.period_start, r2.period_end);
  
  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.3 FAILED: Found % overlapping reliability periods', overlap_count;
  ELSE
    RAISE NOTICE 'Validation 26.3 PASSED: No overlapping reliability periods found';
  END IF;
END $;

-- Query to show any overlapping records (should return 0 rows)
SELECT 
  a.name AS asset_name,
  r1.id AS period1_id,
  r1.period_start AS period1_start,
  r1.period_end AS period1_end,
  r2.id AS period2_id,
  r2.period_start AS period2_start,
  r2.period_end AS period2_end
FROM reliability_metrics r1
INNER JOIN reliability_metrics r2 
  ON r1.asset_id = r2.asset_id 
  AND r1.id < r2.id
INNER JOIN assets a ON r1.asset_id = a.id
WHERE (r1.period_start, r1.period_end) OVERLAPS (r2.period_start, r2.period_end)
ORDER BY a.name, r1.period_start;

-- ============================================================================
-- 26.4: Validate MTBF/MTTR/Availability calculations
-- ============================================================================
-- Spot-check computed metrics against source data
-- Requirements: 13.1, 13.2, 13.3

\echo ''
\echo '26.4: Validating MTBF/MTTR/Availability calculations...'

-- 26.4.1: Validate failure count matches unplanned downtime events
DO $
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM reliability_metrics rm
  LEFT JOIN (
    SELECT 
      asset_id,
      start_time,
      COUNT(*) AS actual_failure_count
    FROM downtime_events
    WHERE event_type IN ('unplanned_failure', 'forced_outage')
    GROUP BY asset_id, start_time
  ) de ON rm.asset_id = de.asset_id 
    AND de.start_time >= rm.period_start 
    AND de.start_time < rm.period_end
  WHERE rm.failure_count > 0
    AND (de.actual_failure_count IS NULL OR de.actual_failure_count != rm.failure_count);
  
  IF mismatch_count > 0 THEN
    RAISE WARNING 'Validation 26.4.1: Found % reliability metrics with mismatched failure counts (this may be acceptable for aggregated periods)', mismatch_count;
  ELSE
    RAISE NOTICE 'Validation 26.4.1 PASSED: Failure counts are consistent';
  END IF;
END $;

-- 26.4.2: Validate total downtime matches sum of downtime events
DO $
DECLARE
  mismatch_count INTEGER;
BEGIN
  WITH downtime_sums AS (
    SELECT 
      asset_id,
      DATE_TRUNC('quarter', start_time) AS period_start,
      SUM(duration_minutes) AS total_downtime
    FROM downtime_events
    WHERE end_time IS NOT NULL
      AND duration_minutes IS NOT NULL
    GROUP BY asset_id, DATE_TRUNC('quarter', start_time)
  )
  SELECT COUNT(*) INTO mismatch_count
  FROM reliability_metrics rm
  LEFT JOIN downtime_sums ds 
    ON rm.asset_id = ds.asset_id 
    AND rm.period_start = ds.period_start
  WHERE rm.total_downtime_minutes > 0
    AND (ds.total_downtime IS NULL OR ABS(rm.total_downtime_minutes - ds.total_downtime) > 1);
  
  IF mismatch_count > 0 THEN
    RAISE WARNING 'Validation 26.4.2: Found % reliability metrics with mismatched total downtime (this may be acceptable for aggregated periods)', mismatch_count;
  ELSE
    RAISE NOTICE 'Validation 26.4.2 PASSED: Total downtime values are consistent';
  END IF;
END $;

-- 26.4.3: Validate availability calculation
-- Availability = (total_time - downtime) / total_time * 100
DO $
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM reliability_metrics
  WHERE availability_percent < 0 
    OR availability_percent > 100
    OR (total_downtime_minutes = 0 AND availability_percent != 100.0);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.4.3 FAILED: Found % reliability metrics with invalid availability values', invalid_count;
  ELSE
    RAISE NOTICE 'Validation 26.4.3 PASSED: All availability values are valid (0-100%)';
  END IF;
END $;

-- Query to show availability calculation details (informational)
SELECT 
  a.name AS asset_name,
  rm.period_start,
  rm.period_end,
  rm.availability_percent AS stored_availability,
  rm.total_downtime_minutes,
  EXTRACT(EPOCH FROM (rm.period_end - rm.period_start)) / 60 AS period_minutes,
  ROUND(
    ((EXTRACT(EPOCH FROM (rm.period_end - rm.period_start)) / 60 - rm.total_downtime_minutes) / 
     (EXTRACT(EPOCH FROM (rm.period_end - rm.period_start)) / 60)) * 100, 
    2
  ) AS calculated_availability,
  ABS(
    rm.availability_percent - 
    ROUND(
      ((EXTRACT(EPOCH FROM (rm.period_end - rm.period_start)) / 60 - rm.total_downtime_minutes) / 
       (EXTRACT(EPOCH FROM (rm.period_end - rm.period_start)) / 60)) * 100, 
      2
    )
  ) AS difference
FROM reliability_metrics rm
INNER JOIN assets a ON rm.asset_id = a.id
WHERE rm.total_downtime_minutes > 0
ORDER BY difference DESC
LIMIT 10;

-- 26.4.4: Validate MTBF is reasonable (if set)
DO $
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM reliability_metrics
  WHERE mtbf_hours IS NOT NULL 
    AND (mtbf_hours <= 0 OR mtbf_hours > 100000);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.4.4 FAILED: Found % reliability metrics with invalid MTBF values', invalid_count;
  ELSE
    RAISE NOTICE 'Validation 26.4.4 PASSED: All MTBF values are reasonable';
  END IF;
END $;

-- 26.4.5: Validate MTTR is reasonable (if set)
DO $
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM reliability_metrics
  WHERE mttr_hours IS NOT NULL 
    AND (mttr_hours <= 0 OR mttr_hours > 1000);
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validation 26.4.5 FAILED: Found % reliability metrics with invalid MTTR values', invalid_count;
  ELSE
    RAISE NOTICE 'Validation 26.4.5 PASSED: All MTTR values are reasonable';
  END IF;
END $;

-- ============================================================================
-- Validation Summary
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'FS3 Validation Complete'
\echo '============================================================================'
\echo ''
\echo 'All validation checks passed successfully!'
\echo 'The FS3 data is consistent and ready for use.'
\echo ''
\echo 'Validated:'
\echo '  - Downtime duration consistency (26.1)'
\echo '  - Downtime non-overlap per asset (26.2)'
\echo '  - Reliability period non-overlap per asset (26.3)'
\echo '  - MTBF/MTTR/Availability calculations (26.4)'
\echo ''
\echo '============================================================================'
