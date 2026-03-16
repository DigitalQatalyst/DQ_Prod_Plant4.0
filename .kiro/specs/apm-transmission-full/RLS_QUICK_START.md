# RLS Quick Start Guide

## Overview

This guide provides quick instructions for applying the RLS (Row-Level Security) migrations to your Supabase database.

## Prerequisites

- Supabase project configured
- Supabase CLI installed (optional but recommended)
- Database migrations 001-017 already applied

## Quick Apply

### Method 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /path/to/project

# Apply all pending migrations
supabase db push

# Or apply migrations one at a time
supabase migration up
```

### Method 2: Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and execute each file in order:

**Step 1: Enable RLS**
```sql
-- Copy contents of: supabase/migrations/018_enable_rls_policies.sql
-- Paste and execute in SQL Editor
```

**Step 2: Create Write Policies**
```sql
-- Copy contents of: supabase/migrations/019_create_write_policies.sql
-- Paste and execute in SQL Editor
```

**Step 3: Add Audit Logging**
```sql
-- Copy contents of: supabase/migrations/020_add_audit_logging.sql
-- Paste and execute in SQL Editor
```

### Method 3: Local Supabase

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase migration up

# Check status
supabase status
```

## Verification

### 1. Check RLS is Enabled

```sql
-- Run in SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('assets', 'diagnostic_events', 'apm_alerts')
ORDER BY tablename;

-- Expected: rowsecurity = true for all tables
```

### 2. Check Policies Exist

```sql
-- Run in SQL Editor
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Multiple policies for each table
```

### 3. Check Audit Log Table

```sql
-- Run in SQL Editor
SELECT COUNT(*) as audit_log_count FROM audit_logs;

-- Expected: 0 (no logs yet, but table exists)
```

### 4. Test Read Access

```typescript
// In your application
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test read (should work for authenticated users)
const { data, error } = await supabase
  .from('assets')
  .select('*')
  .limit(5);

console.log('Assets:', data);
console.log('Error:', error); // Should be null if authenticated
```

### 5. Test Audit Logging

```typescript
// Perform a write operation
const { data, error } = await supabase
  .from('assets')
  .update({ operational_status: 'maintenance' })
  .eq('id', 'some-asset-id');

// Check audit logs
const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .order('changed_at', { ascending: false })
  .limit(1);

console.log('Latest audit log:', logs);
```

## Troubleshooting

### Issue: "permission denied for table"

**Solution**: Ensure you're authenticated:
```typescript
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Issue: "relation does not exist"

**Solution**: Apply earlier migrations first (001-017)

### Issue: "policy already exists"

**Solution**: Migrations are idempotent, this is safe to ignore

### Issue: Audit logs not being created

**Solution**: Check triggers exist:
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE 'audit_%';
```

## What's Next?

After applying RLS migrations:

1. **Test thoroughly** with different user roles
2. **Monitor performance** - RLS adds overhead
3. **Refine policies** for production:
   - Add role-based restrictions
   - Add sector-based filtering
   - Add tenant-based isolation
4. **Implement retention** for audit logs
5. **Set up monitoring** for security events

## Need Help?

- See `RLS_IMPLEMENTATION.md` for detailed documentation
- See `TASK_56_COMPLETION_SUMMARY.md` for implementation details
- Check Supabase docs: https://supabase.com/docs/guides/auth/row-level-security

## Summary

✅ Three migration files to apply:
- `018_enable_rls_policies.sql` - Enable RLS and create read policies
- `019_create_write_policies.sql` - Create write policies
- `020_add_audit_logging.sql` - Add audit logging

✅ All migrations are idempotent (safe to run multiple times)

✅ Comprehensive audit logging on 15 key tables

✅ Foundation for role-based and sector-based access control

Apply the migrations and start testing!
