# FS4: Asset Inventory & Criticality - Schema Pack

## Overview

This schema pack implements the foundational Asset Inventory & Criticality feature set for the APM Power Transmission system. It extends the baseline Supabase schema with transmission-specific asset management, criticality scoring, FMEA library, lifecycle tracking, and spare parts management.

## Requirements Coverage

This schema pack implements requirements:
- **1.1-1.10:** Asset Registry and Hierarchy Management
- **2.1-2.7:** Asset Criticality and Risk Scoring
- **3.1-3.7:** FMEA Library Management
- **4.1-4.6:** Asset Lifecycle Tracking
- **5.1-5.7:** Spare Parts Linkage
- **6.1-6.5:** Transmission Telemetry Parameter Library
- **26.1-26.6:** Schema Migration Idempotency
- **27.2-27.6, 27.9-27.10:** Data Validation and Health Checks
- **30.1-30.9:** Seed Data Completeness

## Files

### 001_migration.sql
**Purpose:** Database schema extensions for FS4

**What it does:**
- Extends `asset_type` enum with 18 transmission asset types
- Extends `assets` table with transmission-specific columns
- Creates `asset_relationships` table for asset connections
- Creates `asset_lifecycle_events` table for lifecycle tracking
- Creates `asset_criticality_model` table for criticality scoring
- Extends `fmea_entries` table with computed RPN column
- Creates `spare_parts` and `asset_spare_parts` tables

**Idempotency:** Uses `CREATE IF NOT EXISTS`, `DO $` blocks, and existence checks

### 002_seed.sql
**Purpose:** Sample data for development and testing

**What it seeds:**
- 30+ telemetry parameters (transformer, breaker, line, relay, substation)
- 1 substation with 4 bays
- 2 power transformers
- 4 circuit breakers
- 2 transmission lines
- 2 protection relays
- 15+ asset relationships (connected_to, feeds_to, protects, in_bay)
- 15+ FMEA entries covering all transmission asset types
- 8 spare parts with linkages to assets
- 1 criticality scoring model for power_transmission sector

**Idempotency:** Uses natural key upserts with `ON CONFLICT ... DO UPDATE`

### 003_validate.sql
**Purpose:** Data integrity and business rule validation

**What it validates:**
- No duplicate natural keys in assets and FMEA entries
- No orphan foreign key references
- All transmission assets have correct sector
- All transmission asset types have FMEA coverage
- All spare part linkages are valid
- All quantity values are non-negative

**Behavior:** Raises exceptions on validation failures, returns success message on pass

## Quick Start

### Prerequisites

- Supabase project with PostgreSQL database
- Database connection credentials
- One of: Supabase Dashboard, psql client, or Supabase CLI

### Execution Steps

1. **Run the execution guide script:**
   ```powershell
   .\scripts\execute-fs4-schema-pack.ps1
   ```

2. **Follow the instructions to execute SQL files:**
   - Run `001_migration.sql` **twice** (verify idempotency)
   - Run `002_seed.sql` **twice** (verify natural key upserts)
   - Run `003_validate.sql` **once** (verify zero failures)

3. **Verify success:**
   - All validation checks pass
   - Expected data counts match
   - No errors during execution

### Detailed Instructions

See [EXECUTION_VERIFICATION.md](./EXECUTION_VERIFICATION.md) for:
- Complete execution checklist
- Multiple execution methods
- Verification criteria
- Troubleshooting guide
- Data verification queries
- Expected data counts

## Key Design Patterns

### Idempotent Migrations

All DDL operations are idempotent:
```sql
-- Tables
CREATE TABLE IF NOT EXISTS assets (...);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_sector_type ON assets(sector, asset_type);

-- Enum extensions
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'power_transformer' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'power_transformer';
  END IF;
END $;
```

### Natural Key Upserts

All seed data uses natural keys for idempotency:
```sql
-- Assets use (sector, name, location) as natural key
INSERT INTO assets (sector, name, location, ...)
VALUES ('power_transmission', 'TX-001', 'Grid Zone North', ...)
ON CONFLICT (sector, name, location) DO UPDATE
  SET asset_type = EXCLUDED.asset_type,
      operational_status = EXCLUDED.operational_status,
      updated_at = NOW();
```

### Validation with Exception Raising

All validations raise exceptions on failure:
```sql
DO $
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM (...);
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Found % issues', v_count;
  END IF;
  
  RAISE NOTICE 'PASS: Validation successful';
END $;
```

## Database Schema

### Core Tables

**assets** (extended)
- Transmission-specific columns: sector, parent_asset_id, voltage_kv, lifecycle_stage, etc.
- Hierarchical structure via parent_asset_id
- Natural key: (sector, name, location)

**asset_relationships**
- Connects assets with typed relationships
- Relation types: connected_to, feeds_to, protects, in_bay
- Unique constraint: (from_asset_id, to_asset_id, relation_type)

**asset_lifecycle_events**
- Tracks lifecycle stage transitions
- Audit trail with timestamps and notes
- Linked to assets via foreign key

**asset_criticality_model**
- Sector-specific criticality scoring weights
- Configurable factors: safety, production, environmental, detectability
- Unique per sector

**fmea_entries** (extended)
- Failure mode library per asset type
- Computed RPN column: severity × occurrence × detection
- Natural key: (asset_type, failure_mode)

**spare_parts**
- Spare parts catalog
- Applicable asset types array
- Lead times and inventory levels

**asset_spare_parts**
- Links spare parts to specific assets
- Quantity required and criticality flag
- Unique constraint: (asset_id, spare_part_id)

### Indexes

Performance-optimized indexes on:
- (sector, asset_type) - Asset filtering
- (sector, operational_status) - Status queries
- parent_asset_id - Hierarchy traversal
- location - Geographic queries
- from_asset_id, to_asset_id - Relationship queries

## Testing

### Idempotency Testing

Run migration script twice:
```bash
# First run - creates objects
psql ... -f 001_migration.sql

# Second run - should succeed without errors
psql ... -f 001_migration.sql
```

### Natural Key Upsert Testing

Run seed script twice:
```bash
# First run - inserts data
psql ... -f 002_seed.sql

# Second run - updates data, no duplicates
psql ... -f 002_seed.sql
```

### Validation Testing

Run validation script:
```bash
# Should pass with zero failures
psql ... -f 003_validate.sql
```

## Troubleshooting

### Common Issues

**Issue:** Enum value already exists
- **Cause:** Running migration on database that already has enum values
- **Solution:** This is expected behavior; idempotency checks should handle it

**Issue:** Duplicate key violation
- **Cause:** Natural key conflict in seed data
- **Solution:** Check for duplicate (sector, name, location) combinations

**Issue:** Foreign key violation
- **Cause:** Parent asset doesn't exist
- **Solution:** Ensure parent assets are created before children

**Issue:** Validation failures
- **Cause:** Data integrity issues
- **Solution:** Review validation error message and fix data

### Debug Queries

```sql
-- Check for duplicate natural keys
SELECT sector, name, location, COUNT(*) 
FROM assets 
GROUP BY sector, name, location 
HAVING COUNT(*) > 1;

-- Check for orphan relationships
SELECT * FROM asset_relationships ar
WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.id = ar.from_asset_id);

-- Check sector enforcement
SELECT * FROM assets 
WHERE asset_type::TEXT IN ('power_transformer', 'circuit_breaker', ...)
  AND sector != 'power_transmission';
```

## Next Steps

After successfully executing this schema pack:

1. ✅ Mark Task 5 as complete in tasks.md
2. ➡️ Proceed to Task 6: Implement FS4 TypeScript interfaces
3. ➡️ Continue with Task 7: Implement FS4 API query hooks
4. ➡️ Build FS4 UI pages following nLVE pattern

## Support

For issues or questions:
- Review [EXECUTION_VERIFICATION.md](./EXECUTION_VERIFICATION.md)
- Check the troubleshooting section above
- Review the SQL files for inline comments
- Consult the main requirements and design documents

## Version

**Schema Pack:** FS4 - Asset Inventory & Criticality
**Version:** 1.0.0
**Last Updated:** 2025-01-16
**Status:** Ready for Execution
