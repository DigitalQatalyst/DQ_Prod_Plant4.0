# CRITICAL: Fix Instructions

## IMMEDIATE ACTION REQUIRED

You are seeing errors because:

### 1. Database Issues (MUST FIX FIRST)
- **406 Error**: RLS is still enabled on tables
- **No Data**: Seed data hasn't been inserted
- **Solution**: Run `fix_platform_protection_data.sql` in Supabase SQL Editor NOW

### 2. Code Issues (Fix After Database)
- **400 Errors**: Tenant ID mapping not applied to all query files
- **404 Error**: `workload_security` table doesn't exist (migration issue)

## Step-by-Step Fix

### STEP 1: Fix Database (DO THIS NOW)

1. Open your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `fix_platform_protection_data.sql`
5. Paste into the editor
6. Click "Run" or press Ctrl+Enter
7. Verify you see output showing:
   ```
   Data Protection Policies: 3
   Data Classification Catalog: 3
   Data Protection Metrics: 3
   ```

### STEP 2: Verify Tables Exist

Run this query in Supabase SQL Editor to check which tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'data_protection_policies',
    'data_protection_metrics',
    'encryption_keys',
    'backup_policies',
    'workload_security',
    'application_security_scans'
  )
ORDER BY table_name;
```

If `workload_security` is missing, you need to run migration 043.

### STEP 3: Check Current State

After running the SQL script, refresh your app and check the console. You should see:
- ✅ No more 406 errors
- ✅ `[PlatformDataProtection] Loaded policies: 3` (not 0)
- ❌ Still 400 errors for backup/workload (need code fixes)
- ❌ Still 404 for workload_security (if table doesn't exist)

### STEP 4: Code Fixes (I'll do this)

Once you confirm Step 1 is done, I'll update:
- `src/lib/backupRecoveryQueries.ts`
- `src/lib/workloadSecurityQueries.ts`  
- `src/lib/applicationSecurityQueries.ts`

## Why This Order Matters

1. **Database first**: Without data and RLS disabled, nothing will work
2. **Verify tables**: Can't query tables that don't exist
3. **Code fixes**: Only needed if tables exist but queries fail

## Current Console Errors Explained

```
406 (Not Acceptable) - data_protection_metrics
```
→ RLS is blocking the query. Run the SQL script.

```
Loaded policies: 0
```
→ No data in database. Run the SQL script.

```
400 (Bad Request) - invalid input syntax for type uuid: "dewa-transmission"
```
→ Code is passing string ID instead of UUID. I'll fix after you run SQL script.

```
404 (Not Found) - workload_security
```
→ Table doesn't exist. Check if migration 043 was run.

## What to Tell Me

After running the SQL script, tell me:
1. Did it run successfully?
2. What was the output (the 3 counts)?
3. Are you still seeing 406 errors?
4. What does the "Loaded policies" log say now?
