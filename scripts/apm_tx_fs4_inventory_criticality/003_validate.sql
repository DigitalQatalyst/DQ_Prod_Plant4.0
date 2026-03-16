-- ============================================================================
-- APM Transmission FS4: Asset Inventory & Criticality - Validation Script
-- ============================================================================
-- This script validates the FS4 schema and seed data integrity.
-- All validation queries should return 0 rows if data is correct.
-- Any rows returned indicate data quality issues that need attention.
--
-- Requirements: 27.1-27.10
-- ============================================================================

\echo '============================================================================'
\echo 'FS4 Validation: Asset Inventory & Criticality'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. Validate Assets Table Extensions
-- ============================================================================

\echo '1. Checking assets table has required transmission columns...'
SELECT 
  CASE 
    WHEN COUNT(*) = 7 THEN 'PASS: All 7 transmission columns exist'
    ELSE 'FAIL: Missing transmission columns - Expected 7, Found ' || COUNT(*)::text
  END as validation_result
FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN (
    'parent_asset_id', 'substation_id', 'bay_code', 
    'voltage_kv', 'commissioning_date', 'lifecycle_stage', 'owner_org_unit'
  );

\echo ''

-- ============================================================================
-- 2. Validate Lifecycle Stage Constraint
-- ============================================================================

\echo '2. Checking lifecycle_stage constraint exists...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Lifecycle stage constraint exists'
    ELSE 'FAIL: Lifecycle stage constraint missing'
  END as validation_result
FROM pg_constraint
WHERE conname = 'chk_lifecycle_stage';

\echo ''

-- ============================================================================
-- 3. Validate Required Tables Exist
-- ============================================================================

\echo '3. Checking all FS4 tables exist...'
SELECT 
  CASE 
    WHEN COUNT(*) = 6 THEN 'PASS: All 6 FS4 tables exist'
    ELSE 'FAIL: Missing FS4 tables - Expected 6, Found ' || COUNT(*)::text
  END as validation_result
FROM information_schema.tables
WHERE table_name IN (
  'asset_relationships',
  'asset_lifecycle_events',
  'asset_criticality_model',
  'fmea_entries',
  'spare_parts',
  'asset_spare_parts'
);

\echo ''

-- ============================================================================
-- 4. Validate Asset Relationships Integrity
-- ============================================================================

\echo '4. Checking for orphan asset relationships (invalid from_asset_id)...'
SELECT 
  COUNT(*) as orphan_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No orphan relationships found'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' orphan relationships'
  END as validation_result
FROM asset_relationships ar
WHERE NOT EXISTS (
  SELECT 1 FROM assets a WHERE a.id = ar.from_asset_id
);

\echo ''

\echo '5. Checking for orphan asset relationships (invalid to_asset_id)...'
SELECT 
  COUNT(*) as orphan_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No orphan relationships found'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' orphan relationships'
  END as validation_result
FROM asset_relationships ar
WHERE NOT EXISTS (
  SELECT 1 FROM assets a WHERE a.id = ar.to_asset_id
);

\echo ''

\echo '6. Checking for self-referencing relationships...'
SELECT 
  COUNT(*) as self_ref_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No self-referencing relationships'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' self-referencing relationships'
  END as validation_result
FROM asset_relationships
WHERE from_asset_id = to_asset_id;

\echo ''

-- ============================================================================
-- 5. Validate FMEA Entries
-- ============================================================================

\echo '7. Checking FMEA severity values are in valid range (1-10)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All severity values valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' invalid severity values'
  END as validation_result
FROM fmea_entries
WHERE severity < 1 OR severity > 10;

\echo ''

\echo '8. Checking FMEA occurrence values are in valid range (1-10)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All occurrence values valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' invalid occurrence values'
  END as validation_result
FROM fmea_entries
WHERE occurrence < 1 OR occurrence > 10;

\echo ''

\echo '9. Checking FMEA detection values are in valid range (1-10)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All detection values valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' invalid detection values'
  END as validation_result
FROM fmea_entries
WHERE detection < 1 OR detection > 10;

\echo ''

\echo '10. Checking FMEA RPN calculation is correct...'
SELECT 
  COUNT(*) as incorrect_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All RPN calculations correct'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' incorrect RPN calculations'
  END as validation_result
FROM fmea_entries
WHERE rpn != (severity * occurrence * detection);

\echo ''

\echo '11. Checking FMEA coverage for transmission asset types...'
WITH expected_types AS (
  SELECT unnest(ARRAY['TRANSFORMER', 'BREAKER', 'LINE', 'RELAY']) as asset_type
),
actual_coverage AS (
  SELECT DISTINCT asset_type
  FROM fmea_entries
)
SELECT 
  COUNT(*) as missing_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: FMEA coverage complete for all asset types'
    ELSE 'FAIL: Missing FMEA entries for ' || COUNT(*)::text || ' asset types'
  END as validation_result
FROM expected_types et
WHERE NOT EXISTS (
  SELECT 1 FROM actual_coverage ac WHERE ac.asset_type = et.asset_type
);

\echo ''

-- ============================================================================
-- 6. Validate Spare Parts
-- ============================================================================

\echo '12. Checking spare parts have valid on_hand_quantity (>= 0)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All on_hand_quantity values valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' negative on_hand_quantity values'
  END as validation_result
FROM spare_parts
WHERE on_hand_quantity < 0;

\echo ''

\echo '13. Checking spare parts have valid lead_time_days (>= 0 or NULL)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All lead_time_days values valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' negative lead_time_days values'
  END as validation_result
FROM spare_parts
WHERE lead_time_days < 0;

\echo ''

\echo '14. Checking spare parts have unique part numbers...'
SELECT 
  COUNT(*) as duplicate_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All part numbers unique'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' duplicate part numbers'
  END as validation_result
FROM (
  SELECT part_number, COUNT(*) as cnt
  FROM spare_parts
  GROUP BY part_number
  HAVING COUNT(*) > 1
) duplicates;

\echo ''

-- ============================================================================
-- 7. Validate Asset Spare Parts Linkages
-- ============================================================================

\echo '15. Checking asset_spare_parts references valid spare parts...'
SELECT 
  COUNT(*) as orphan_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All spare part references valid'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' invalid spare part references'
  END as validation_result
FROM asset_spare_parts asp
WHERE NOT EXISTS (
  SELECT 1 FROM spare_parts sp WHERE sp.id = asp.spare_part_id
);

\echo ''

\echo '16. Checking asset_spare_parts has either asset_id OR asset_type (not both)...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All linkages have correct asset reference'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' linkages with invalid asset reference'
  END as validation_result
FROM asset_spare_parts
WHERE (asset_id IS NULL AND asset_type IS NULL)
   OR (asset_id IS NOT NULL AND asset_type IS NOT NULL);

\echo ''

\echo '17. Checking asset_spare_parts quantity_required is positive...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All quantity_required values positive'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' non-positive quantity_required values'
  END as validation_result
FROM asset_spare_parts
WHERE quantity_required <= 0;

\echo ''

-- ============================================================================
-- 8. Validate Criticality Model
-- ============================================================================

\echo '18. Checking criticality model weights sum to 1.0...'
SELECT 
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All criticality model weights sum to 1.0'
    ELSE 'FAIL: Found ' || COUNT(*)::text || ' models with incorrect weight sum'
  END as validation_result
FROM asset_criticality_model
WHERE ABS(
  safety_weight + production_impact_weight + 
  environmental_impact_weight + detectability_weight - 1.0
) > 0.001;

\echo ''

\echo '19. Checking power_transmission criticality model exists...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Power transmission criticality model exists'
    ELSE 'FAIL: Power transmission criticality model missing'
  END as validation_result
FROM asset_criticality_model
WHERE sector = 'power_transmission';

\echo ''

-- ============================================================================
-- 9. Validate RLS Policies
-- ============================================================================

\echo '20. Checking RLS is enabled on all FS4 tables...'
SELECT 
  CASE 
    WHEN COUNT(*) = 6 THEN 'PASS: RLS enabled on all 6 FS4 tables'
    ELSE 'FAIL: RLS not enabled on all tables - Expected 6, Found ' || COUNT(*)::text
  END as validation_result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'asset_relationships',
    'asset_lifecycle_events',
    'asset_criticality_model',
    'fmea_entries',
    'spare_parts',
    'asset_spare_parts'
  )
  AND rowsecurity = true;

\echo ''

-- ============================================================================
-- 10. Validate Indexes
-- ============================================================================

\echo '21. Checking critical indexes exist...'
WITH expected_indexes AS (
  SELECT unnest(ARRAY[
    'idx_assets_parent',
    'idx_asset_rel_from',
    'idx_asset_rel_to',
    'idx_lifecycle_events_asset',
    'idx_fmea_asset_type',
    'idx_fmea_rpn',
    'idx_spare_parts_number',
    'idx_asset_spare_parts_part'
  ]) as index_name
)
SELECT 
  COUNT(*) as missing_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All critical indexes exist'
    ELSE 'FAIL: Missing ' || COUNT(*)::text || ' critical indexes'
  END as validation_result
FROM expected_indexes ei
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes WHERE indexname = ei.index_name
);

\echo ''

-- ============================================================================
-- Summary
-- ============================================================================

\echo '============================================================================'
\echo 'Validation Summary'
\echo '============================================================================'
\echo ''

SELECT 
  'Total FMEA Entries: ' || COUNT(*)::text as summary
FROM fmea_entries
UNION ALL
SELECT 
  'Total Spare Parts: ' || COUNT(*)::text
FROM spare_parts
UNION ALL
SELECT 
  'Total Asset Type Mappings: ' || COUNT(*)::text
FROM asset_spare_parts
WHERE asset_type IS NOT NULL
UNION ALL
SELECT 
  'Total Asset Relationships: ' || COUNT(*)::text
FROM asset_relationships
UNION ALL
SELECT 
  'Total Lifecycle Events: ' || COUNT(*)::text
FROM asset_lifecycle_events;

\echo ''
\echo '============================================================================'
\echo 'FS4 Validation Complete'
\echo '============================================================================'
\echo 'Review output above. All checks should show PASS status.'
\echo 'Any FAIL status indicates data quality issues requiring attention.'
\echo '============================================================================'
