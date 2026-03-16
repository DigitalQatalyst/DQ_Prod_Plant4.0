# APM Transmission FS4: Asset Inventory & Criticality Schema Pack

## Overview

This schema pack implements Feature Set 4 (FS4) for APM Power Transmission, providing the foundational database schema and reference data for asset inventory and criticality management.

## Contents

- **001_migration.sql** - Creates tables and extends existing schema
- **002_seed.sql** - Populates reference data (FMEA, spare parts, criticality models)
- **003_validate.sql** - Validates schema and data integrity

## Tables Created

### Core Tables
- `asset_relationships` - Asset connections and dependencies
- `asset_lifecycle_events` - Asset lifecycle stage transitions
- `asset_criticality_model` - Criticality scoring configuration
- `fmea_entries` - Failure Mode and Effects Analysis library
- `spare_parts` - Spare parts catalog
- `asset_spare_parts` - Asset to spare parts linkages

### Extended Tables
- `assets` - Extended with transmission-specific columns

## Requirements Addressed

- **Req 1**: Asset Registry and Hierarchy Management
- **Req 2**: Asset Criticality and Risk Scoring
- **Req 3**: FMEA Library Management
- **Req 4**: Asset Lifecycle Tracking
- **Req 5**: Spare Parts Linkage
- **Req 26**: Schema Migration Idempotency
- **Req 27**: Data Validation and Health Checks
- **Req 30**: Seed Data Completeness

## Execution

### Prerequisites
- Supabase CLI installed
- Database connection configured
- Authenticated user with schema modification privileges

### Run All Scripts

```bash
# Using PowerShell (Windows)
.\scripts\execute-fs4-schema-pack.ps1

# Or manually execute each script:
psql -h <host> -U <user> -d <database> -f scripts/apm_tx_fs4_inventory_criticality/001_migration.sql
psql -h <host> -U <user> -d <database> -f scripts/apm_tx_fs4_inventory_criticality/002_seed.sql
psql -h <host> -U <user> -d <database> -f scripts/apm_tx_fs4_inventory_criticality/003_validate.sql
```

### Using Supabase CLI

```bash
# Apply migration
supabase db push --file scripts/apm_tx_fs4_inventory_criticality/001_migration.sql

# Run seed
supabase db push --file scripts/apm_tx_fs4_inventory_criticality/002_seed.sql

# Run validation
supabase db push --file scripts/apm_tx_fs4_inventory_criticality/003_validate.sql
```

## Validation

The validation script (003_validate.sql) performs 21 checks:

1. Assets table column extensions
2. Lifecycle stage constraints
3. Table existence
4. Relationship integrity
5. FMEA value ranges
6. RPN calculations
7. FMEA coverage
8. Spare parts data quality
9. Linkage integrity
10. Criticality model weights
11. RLS policies
12. Index existence

**Expected Result**: All checks should return "PASS" status.

## Idempotency

All scripts are idempotent and safe to run multiple times:
- Migrations use `IF NOT EXISTS` and `DO $$` blocks
- Seeds use `ON CONFLICT` clauses for upserts
- Validation is read-only

## Seed Data Summary

- **1** criticality scoring model (power_transmission)
- **19** FMEA entries across 4 asset types:
  - 8 for Transformers
  - 6 for Circuit Breakers
  - 5 for Transmission Lines
  - 4 for Protection Relays
- **18** spare parts in catalog
- **Asset type mappings** for critical spares

## Next Steps

After successful execution:

1. Verify validation passes all checks
2. Test API hooks (`useAssets`, `useFMEAEntries`, `useSpareParts`)
3. Verify UI pages display data correctly
4. Proceed to FS1: Asset Health & Diagnostics

## Rollback

To rollback this schema pack:

```sql
-- Drop FS4 tables (in reverse dependency order)
DROP TABLE IF EXISTS asset_spare_parts CASCADE;
DROP TABLE IF EXISTS spare_parts CASCADE;
DROP TABLE IF EXISTS fmea_entries CASCADE;
DROP TABLE IF EXISTS asset_criticality_model CASCADE;
DROP TABLE IF EXISTS asset_lifecycle_events CASCADE;
DROP TABLE IF EXISTS asset_relationships CASCADE;

-- Remove assets table extensions
ALTER TABLE assets
  DROP COLUMN IF EXISTS parent_asset_id,
  DROP COLUMN IF EXISTS substation_id,
  DROP COLUMN IF EXISTS bay_code,
  DROP COLUMN IF EXISTS voltage_kv,
  DROP COLUMN IF EXISTS commissioning_date,
  DROP COLUMN IF EXISTS lifecycle_stage,
  DROP COLUMN IF EXISTS owner_org_unit;
```

## Support

For issues or questions:
- Review validation output for specific failures
- Check Supabase logs for detailed error messages
- Verify database user has required permissions
- Ensure no conflicting schema modifications
