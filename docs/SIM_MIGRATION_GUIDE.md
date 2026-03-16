# SIM Schema Migration Guide

## Overview

This guide documents the SIM (Shift Intelligence Management) schema migration for the Operational Excellence feature.

**Migration File**: `supabase/migrations/013_create_sim_tables.sql`

**⚠️ CRITICAL**: This migration should ONLY be run against the LOCAL Supabase instance. Never run against remote (staging or production) databases.

## Tables Created

The migration creates 10 tables for the SIM feature set:

### Core SIM Tables
1. **sim_shifts** - Shift definitions (day/evening/night)
2. **sim_boards** - Operational dashboards for shifts
3. **sim_kpis** - KPI metrics tracked on boards

### Switching Operations
4. **switching_orders** - Planned switching operations
5. **switching_order_impacts** - Grid/asset impacts of switching orders

### Outage Management
6. **outages** - Planned and unplanned service interruptions
7. **outage_impacts** - Grid/asset impacts of outages

### Issue & Action Tracking
8. **sim_issues** - Issues logged during operations
9. **sim_actions** - Actions with owners and due dates
10. **sim_action_links** - Links between actions and entities

## Features Implemented

### 1. Natural Keys for Idempotent Upserts
Each table has a unique constraint on business natural keys:
- `sim_shifts`: (tenant_id, site_id, shift_start)
- `sim_boards`: (tenant_id, board_date, site_id, shift_id)
- `sim_kpis`: (tenant_id, board_id, kpi_code)
- `switching_orders`: (tenant_id, order_no)
- `outages`: (tenant_id, outage_ref)
- `sim_issues`: (tenant_id, issue_ref)
- `sim_actions`: (tenant_id, action_ref)

### 2. Comprehensive Indexing
Indexes created for:
- All tenant_id columns (for tenant filtering)
- All foreign keys (for join performance)
- Status columns (for filtering)
- Date/timestamp columns (for range queries)
- Owner columns (for assignment queries)

### 3. Row Level Security (RLS)
All tables have RLS enabled with policies for:
- SELECT: Filter by tenant_id
- INSERT: Validate tenant_id matches current tenant
- UPDATE: Filter by tenant_id
- DELETE: Filter by tenant_id

Impact tables (switching_order_impacts, outage_impacts, sim_action_links) use parent table tenant validation.

### 4. Automatic Timestamp Updates
Triggers automatically update `updated_at` columns on:
- sim_shifts
- sim_boards
- sim_kpis
- switching_orders
- outages
- sim_issues
- sim_actions

### 5. Data Integrity Constraints
- Check constraints on status enums
- Check constraints on priority levels
- Check constraints ensuring at least one impact target is specified
- Foreign key constraints with appropriate CASCADE/SET NULL behavior

## Running the Migration

### Prerequisites

1. **Verify Local Supabase is Running**
   ```bash
   npx supabase status
   ```
   
   If not running, start it:
   ```bash
   npx supabase start
   ```

2. **Confirm Local Connection**
   Check your `.env.development` file:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   ```

### Apply Migration

The migration will be automatically applied when you reset the database:

```bash
npx supabase db reset --local
```

This will:
1. Drop all existing data
2. Re-run all migrations (including 013_create_sim_tables.sql)
3. Re-seed all data

### Manual Migration (if needed)

If you need to apply just this migration:

```bash
npx supabase db psql < supabase/migrations/013_create_sim_tables.sql
```

## Verification

### Method 1: SQL Verification Script

Run the verification script:

```bash
npx supabase db psql < verify_sim_tables.sql
```

This will check:
- All 10 tables exist
- Indexes are created
- RLS is enabled
- Constraints are in place

### Method 2: Manual SQL Queries

Connect to the database:

```bash
npx supabase db psql
```

Then run:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%')
ORDER BY table_name;

-- Expected output: 10 tables
-- outage_impacts, outages, sim_action_links, sim_actions, sim_boards, 
-- sim_issues, sim_kpis, sim_shifts, switching_order_impacts, switching_orders

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'sim_%' OR tablename LIKE '%order%' OR tablename LIKE 'outage%')
ORDER BY tablename;

-- All should show rowsecurity = true

-- Exit psql
\q
```

### Method 3: Supabase Studio

1. Open Supabase Studio: http://localhost:54323
2. Navigate to "Table Editor"
3. Verify all 10 SIM tables are listed
4. Check each table's structure, indexes, and policies

## Expected Results

After successful migration:

✅ 10 tables created
✅ 40+ indexes created
✅ RLS enabled on all tables
✅ 40+ RLS policies created
✅ 7 update triggers created
✅ All constraints in place

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: Reset the database
```bash
npx supabase db reset --local
```

### Issue: Cannot connect to database

**Solution**: 
1. Check Docker is running
2. Start Supabase: `npx supabase start`
3. Verify status: `npx supabase status`

### Issue: RLS policies not working

**Solution**: 
1. Verify RLS is enabled: Check pg_tables.rowsecurity
2. Check tenant context is set in application code
3. Verify policies exist: Check pg_policies table

### Issue: Seed data fails after migration

**Solution**: 
The seed data for SIM tables will be created in Task 2. If you're running this migration before the seed file exists, that's expected.

## Next Steps

After this migration is successfully applied:

1. **Task 2**: Create seed data file `supabase/seed/008_sim_seed.sql`
2. **Task 3**: Add TypeScript types to `src/types/optimise.ts`
3. **Task 4**: Extend DataProvider interface
4. **Task 5**: Implement SupabaseProvider methods

## Rollback

If you need to rollback this migration:

1. Uncomment the DROP statements at the top of the migration file
2. Run:
   ```bash
   npx supabase db psql < supabase/migrations/013_create_sim_tables.sql
   ```

Or simply reset to a previous state:
```bash
npx supabase db reset --local
```

## References

- Design Document: `.kiro/specs/operational-excellence/design.md`
- Requirements: `.kiro/specs/operational-excellence/requirements.md`
- Tasks: `.kiro/specs/operational-excellence/tasks.md`
- Local Setup Guide: `LOCAL_SUPABASE_SETUP.md`
