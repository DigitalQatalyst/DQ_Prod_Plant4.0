# APM Power Transmission - Schema Pack Execution Guide

## Overview

This guide provides step-by-step instructions for executing the APM Power Transmission schema packs. Each schema pack contains migration, seed, and validation scripts that must be executed in the correct order.

## Prerequisites

### Environment Setup

1. **Node.js**: Version 18 or higher
2. **Supabase CLI**: Installed and configured
3. **Environment Variables**: Set in `.env.development`

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. **Database Access**: Ensure you have admin access to the Supabase project

### Verify Database Connection

```bash
# Test connection
node scripts/execute-sql-file.js supabase/migrations/001_create_tenants.sql
```

## Schema Pack Execution Order

Schema packs MUST be executed in this order due to dependencies:

1. **FS4: Asset Inventory & Criticality** (Foundation)
2. **FS1: Asset Health & Diagnostics**
3. **FS3: Asset Performance & Utilisation**
4. **FS2: Predictive & Prescriptive Maintenance**
5. **FS5: Alerts, Reports & Visualisation**

## Execution Methods

### Method 1: Individual Schema Pack Execution (Recommended for Development)

Execute each schema pack individually for better control and debugging.

#### FS4: Asset Inventory & Criticality

```bash
# Navigate to schema pack directory
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs4_inventory_criticality

# Execute migration
node ../../../../../scripts/execute-sql-file.js 001_migration.sql

# Execute seed
node ../../../../../scripts/execute-sql-file.js 002_seed.sql

# Execute validation
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Output:**
- Migration: Tables created, indexes added
- Seed: Assets, FMEA entries, spare parts inserted
- Validation: Zero validation failures

#### FS1: Asset Health & Diagnostics

```bash
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs1_health_diagnostics

# Execute migration
node ../../../../../scripts/execute-sql-file.js 001_migration.sql

# Execute seed
node ../../../../../scripts/execute-sql-file.js 002_seed.sql

# Execute validation
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Output:**
- Migration: Telemetry tables, health models created
- Seed: Telemetry data, health scores, diagnostic events inserted
- Validation: Zero validation failures

#### FS3: Asset Performance & Utilisation

```bash
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs3_performance_utilisation

# Execute migration
node ../../../../../scripts/execute-sql-file.js 001_migration.sql

# Execute seed
node ../../../../../scripts/execute-sql-file.js 002_seed.sql

# Execute validation
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Output:**
- Migration: Downtime, reliability, utilisation tables created
- Seed: Downtime events, reliability metrics inserted
- Validation: Zero validation failures

#### FS2: Predictive & Prescriptive Maintenance

```bash
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs2_predictive_prescriptive

# Execute migration
node ../../../../../scripts/execute-sql-file.js 001_migration.sql

# Execute seed
node ../../../../../scripts/execute-sql-file.js 002_seed.sql

# Execute validation
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Output:**
- Migration: Predictions, CBM triggers, recommendations tables created
- Seed: Failure predictions, CBM triggers, recommendations inserted
- Validation: Zero validation failures

#### FS5: Alerts, Reports & Visualisation

```bash
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs5_alerts_reports

# Execute migration
node ../../../../../scripts/execute-sql-file.js 001_migration.sql

# Execute seed
node ../../../../../scripts/execute-sql-file.js 002_seed.sql

# Execute validation
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Output:**
- Migration: Alerts, dashboards, reports tables created
- Seed: Alerts, dashboards, report runs inserted
- Validation: Zero validation failures

### Method 2: Automated All-in-One Execution

Use the provided scripts for automated execution of all schema packs.

```bash
# Execute all schema packs in order
npm run seed:fs-all

# Or using PowerShell
.\scripts\seed-fs-all.ps1
```

**Note:** This method executes all schema packs sequentially. If any pack fails, the script will stop.

### Method 3: Supabase Migrations (Production)

For production deployments, use Supabase migrations:

```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/012_apm_fs4_inventory_criticality.sql
```

## Idempotency

All schema packs are designed to be idempotent and can be safely re-executed:

- **Migrations**: Use `CREATE IF NOT EXISTS` patterns
- **Seeds**: Use `INSERT ... ON CONFLICT DO UPDATE` (upsert) with natural keys
- **Validations**: Always return current state

### Re-executing a Schema Pack

If you need to re-execute a schema pack:

```bash
# Re-run the entire pack
cd .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs4_inventory_criticality
node ../../../../../scripts/execute-sql-file.js 001_migration.sql
node ../../../../../scripts/execute-sql-file.js 002_seed.sql
node ../../../../../scripts/execute-sql-file.js 003_validate.sql
```

**Expected Behavior:**
- Migrations: Skip existing objects
- Seeds: Update existing records, insert new ones
- Validations: Report current state

## Validation

### Understanding Validation Output

Validation scripts return rows that fail validation checks. Zero rows = success.

**Example Validation Output:**

```sql
-- Good: No rows returned
SELECT 'No validation failures' AS status;

-- Bad: Rows returned indicate failures
SELECT asset_id, issue FROM validation_check WHERE issue IS NOT NULL;
```

### Common Validation Checks

1. **Natural Key Uniqueness**: No duplicate natural keys
2. **Foreign Key Integrity**: All references point to existing records
3. **Data Consistency**: Computed values match source data
4. **Constraint Compliance**: All check constraints satisfied
5. **Coverage Completeness**: Required data exists for all asset types

### Troubleshooting Validation Failures

If validation fails:

1. **Review the validation output**: Identify which check failed
2. **Check the seed script**: Verify data is correct
3. **Re-run the seed script**: May resolve transient issues
4. **Check for manual data changes**: Ensure no manual edits broke constraints

## RLS Policy Execution

After executing all schema packs, apply RLS policies:

```bash
# Apply RLS policies
.\scripts\apply-rls-migrations.ps1
```

**This will:**
1. Enable RLS on all APM tables
2. Create read policies for authenticated users
3. Create write policies for authorized roles
4. Add audit logging triggers

**Verify RLS:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%asset%';

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Verification Scripts

### Verify All Feature Sets

```bash
# Verify all data is seeded correctly
node scripts/verify-all-fs-data.js
```

**This checks:**
- Asset counts by type
- Telemetry data exists
- Health scores computed
- Downtime events recorded
- Predictions generated
- Alerts created

### Verify Specific Feature Set

```bash
# Verify FS5 specifically
node scripts/verify-fs5-migration.js
```

## Common Issues and Solutions

### Issue: "Table already exists"

**Cause:** Migration already executed
**Solution:** This is expected behavior. Migrations are idempotent.

### Issue: "Foreign key violation"

**Cause:** Seed data references non-existent records
**Solution:** Ensure previous feature sets are seeded first

### Issue: "Validation returns failures"

**Cause:** Data inconsistency or missing data
**Solution:** 
1. Check validation output for specific issues
2. Re-run seed script
3. Verify previous feature sets are complete

### Issue: "Permission denied"

**Cause:** RLS policies blocking access
**Solution:**
1. Ensure user has correct role
2. Check RLS policies are correctly configured
3. Use service role key for admin operations

### Issue: "Timeout during seed"

**Cause:** Large dataset or slow connection
**Solution:**
1. Increase timeout in script
2. Seed in smaller batches
3. Check database performance

## Performance Considerations

### Execution Time

Expected execution times (approximate):

- **FS4**: 2-3 seconds
- **FS1**: 5-10 seconds (telemetry data)
- **FS3**: 3-5 seconds
- **FS2**: 2-3 seconds
- **FS5**: 2-3 seconds
- **Total**: ~15-25 seconds

### Optimization Tips

1. **Use batch inserts**: Seed scripts use batch inserts for performance
2. **Disable triggers temporarily**: For large data loads (not recommended for production)
3. **Increase connection pool**: For parallel execution
4. **Use local Supabase**: For development (faster than cloud)

## Rollback Procedures

### Rolling Back a Feature Set

If you need to rollback a feature set:

```sql
-- Example: Rollback FS5
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS alert_history CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS report_runs CASCADE;
DROP TABLE IF EXISTS export_jobs CASCADE;
```

**Warning:** This will delete all data in these tables.

### Safer Rollback: Disable RLS

Instead of dropping tables, disable RLS to prevent access:

```sql
-- Disable RLS on specific table
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
```

## Production Deployment Checklist

Before deploying to production:

- [ ] All schema packs executed successfully in staging
- [ ] All validation scripts return zero failures
- [ ] RLS policies applied and tested
- [ ] Performance benchmarks met
- [ ] Backup created before deployment
- [ ] Rollback plan documented
- [ ] Monitoring and alerting configured
- [ ] User access roles configured
- [ ] Documentation updated

## Monitoring

### Post-Deployment Verification

After deployment, verify:

```sql
-- Check table counts
SELECT 
  'assets' AS table_name, COUNT(*) AS count FROM assets WHERE sector = 'power_transmission'
UNION ALL
SELECT 'telemetry_data', COUNT(*) FROM telemetry_data
UNION ALL
SELECT 'health_scores', COUNT(*) FROM health_scores
UNION ALL
SELECT 'diagnostic_events', COUNT(*) FROM diagnostic_events
UNION ALL
SELECT 'downtime_events', COUNT(*) FROM downtime_events
UNION ALL
SELECT 'failure_predictions', COUNT(*) FROM failure_predictions
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts;
```

### Health Checks

```sql
-- Check for recent telemetry
SELECT MAX(timestamp) AS latest_telemetry FROM telemetry_data;

-- Check for recent alerts
SELECT COUNT(*) AS open_alerts FROM alerts WHERE state = 'open';

-- Check for recent health scores
SELECT MAX(computed_at) AS latest_health_score FROM health_scores;
```

## Support

For issues or questions:

1. Check this guide first
2. Review validation output
3. Check Supabase logs
4. Contact the development team

## Appendix: Script Reference

### Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `execute-sql-file.js` | Execute single SQL file | `node scripts/execute-sql-file.js <file>` |
| `seed-fs-all.ps1` | Seed all feature sets | `.\scripts\seed-fs-all.ps1` |
| `verify-all-fs-data.js` | Verify all data | `node scripts/verify-all-fs-data.js` |
| `verify-fs5-migration.js` | Verify FS5 | `node scripts/verify-fs5-migration.js` |
| `apply-rls-migrations.ps1` | Apply RLS policies | `.\scripts\apply-rls-migrations.ps1` |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | For RLS setup |
