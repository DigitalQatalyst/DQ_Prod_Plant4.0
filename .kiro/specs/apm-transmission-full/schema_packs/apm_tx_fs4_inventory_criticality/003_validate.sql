-- FS4: Asset Inventory & Criticality - Validation Script
-- This script validates data integrity, referential integrity, and business rules
-- for the FS4 schema pack.
--
-- Requirements: 1.1-1.10, 2.1-2.7, 3.1-3.7, 4.1-4.6, 5.1-5.7, 27.2-27.6, 27.9
--
-- All validation queries should return 0 rows. If any query returns rows,
-- it indicates a validation failure and an exception will be raised.

-- =============================================================================
-- SUBTASK 4.6: Wrap all validations in DO block with exception raising
-- Requirements: 27.9
-- =============================================================================

DO $
DECLARE
  v_count INTEGER;
  v_error_msg TEXT;
BEGIN

  -- ===========================================================================
  -- SUBTASK 4.1: Validate no duplicate natural keys
  -- Requirements: 27.2
  -- ===========================================================================

  -- Check for duplicate (sector, name, location) in assets
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT sector, name, location, COUNT(*) as dup_count
    FROM assets
    GROUP BY sector, name, location
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s duplicate (sector, name, location) combinations in assets table', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: No duplicate (sector, name, location) in assets';

  -- Check for duplicate (asset_type, failure_mode) in fmea_entries
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT asset_type, failure_mode, COUNT(*) as dup_count
    FROM fmea_entries
    GROUP BY asset_type, failure_mode
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s duplicate (asset_type, failure_mode) combinations in fmea_entries table', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: No duplicate (asset_type, failure_mode) in fmea_entries';

  -- ===========================================================================
  -- SUBTASK 4.2: Validate referential integrity
  -- Requirements: 1.4, 1.8, 27.3
  -- ===========================================================================

  -- Check for orphan parent_asset_id references
  SELECT COUNT(*) INTO v_count
  FROM assets a
  WHERE a.parent_asset_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM assets p WHERE p.id = a.parent_asset_id
    );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s orphan parent_asset_id references in assets table', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: No orphan parent_asset_id references';

  -- Check for orphan asset_relationships (from_asset_id must exist)
  SELECT COUNT(*) INTO v_count
  FROM asset_relationships ar
  WHERE NOT EXISTS (
    SELECT 1 FROM assets a WHERE a.id = ar.from_asset_id
  );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s orphan from_asset_id references in asset_relationships table', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: No orphan from_asset_id references in asset_relationships';

  -- Check for orphan asset_relationships (to_asset_id must exist)
  SELECT COUNT(*) INTO v_count
  FROM asset_relationships ar
  WHERE NOT EXISTS (
    SELECT 1 FROM assets a WHERE a.id = ar.to_asset_id
  );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s orphan to_asset_id references in asset_relationships table', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: No orphan to_asset_id references in asset_relationships';

  -- ===========================================================================
  -- SUBTASK 4.3: Validate sector enforcement
  -- Requirements: 1.2, 27.4
  -- ===========================================================================

  -- Check all transmission asset_types have sector='power_transmission'
  SELECT COUNT(*) INTO v_count
  FROM assets
  WHERE asset_type::TEXT IN (
    'power_transformer', 'circuit_breaker', 'disconnect_switch', 'busbar',
    'transmission_line', 'line_terminal', 'substation_bay', 'protection_relay',
    'ct', 'vt', 'surge_arrester', 'reactor', 'capacitor_bank',
    'station_battery', 'charger', 'scada_rtu', 'plc_ied', 'meter'
  )
  AND sector != 'power_transmission';

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s transmission assets without sector=''power_transmission''', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: All transmission assets have sector=''power_transmission''';

  -- ===========================================================================
  -- SUBTASK 4.4: Validate FMEA coverage
  -- Requirements: 3.6, 27.5
  -- ===========================================================================

  -- Check each transmission asset_type has at least one FMEA entry
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT UNNEST(ARRAY[
      'power_transformer', 'circuit_breaker', 'disconnect_switch', 'busbar',
      'transmission_line', 'line_terminal', 'substation_bay', 'protection_relay',
      'ct', 'vt', 'surge_arrester', 'reactor', 'capacitor_bank',
      'station_battery', 'charger', 'scada_rtu', 'plc_ied', 'meter'
    ]) AS asset_type
  ) expected_types
  WHERE NOT EXISTS (
    SELECT 1 FROM fmea_entries f WHERE f.asset_type = expected_types.asset_type
  );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s transmission asset_types without FMEA entries', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: All transmission asset_types have FMEA coverage';

  -- ===========================================================================
  -- SUBTASK 4.5: Validate spare part linkages
  -- Requirements: 5.7, 27.6
  -- ===========================================================================

  -- Check all asset_spare_parts reference valid assets
  SELECT COUNT(*) INTO v_count
  FROM asset_spare_parts asp
  WHERE asp.asset_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asp.asset_id
    );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s asset_spare_parts with invalid asset_id references', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: All asset_spare_parts reference valid assets';

  -- Check all asset_spare_parts reference valid spare_parts
  SELECT COUNT(*) INTO v_count
  FROM asset_spare_parts asp
  WHERE NOT EXISTS (
    SELECT 1 FROM spare_parts sp WHERE sp.id = asp.spare_part_id
  );

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s asset_spare_parts with invalid spare_part_id references', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: All asset_spare_parts reference valid spare_parts';

  -- Check quantity_required >= 0
  SELECT COUNT(*) INTO v_count
  FROM asset_spare_parts
  WHERE quantity_required < 0;

  IF v_count > 0 THEN
    v_error_msg := format('VALIDATION FAILED: Found %s asset_spare_parts with negative quantity_required', v_count);
    RAISE EXCEPTION '%', v_error_msg;
  END IF;

  RAISE NOTICE 'PASS: All asset_spare_parts have non-negative quantity_required';

  -- ===========================================================================
  -- All validations passed
  -- ===========================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL VALIDATIONS PASSED';
  RAISE NOTICE '========================================';

END $;
