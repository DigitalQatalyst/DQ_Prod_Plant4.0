# Supabase RLS (Row Level Security) Status

## ✅ Status: UNRESTRICTED (RLS Policies Applied)

**Date:** 2026-01-19  
**Migration Applied:** `014_disable_rls_for_dev.sql`

## Summary

All Supabase tables have been made **unrestricted** for local development. This means:
- ✅ RLS is **enabled** on all tables
- ✅ **Permissive policies** allow full public access (SELECT, INSERT, UPDATE, DELETE)
- ✅ No authentication required for local development
- ✅ All tables are accessible via the anon key

## Tables with Unrestricted Access

The following **26 tables** now have unrestricted access:

### Core Infrastructure (6 tables)
1. `tenants` - 4 policies (read, insert, update, delete)
2. `sites` - 4 policies
3. `asset_types` - 4 policies
4. `assets` - 4 policies
5. `alerts` - 4 policies
6. `tags` - 4 policies

### Grid Topology (3 tables)
7. `grid_nodes` - 4 policies
8. `grid_lines` - 4 policies
9. `grid_asset_links` - 4 policies

### Telemetry & Operational Data (2 tables)
10. `telemetry_points` - 4 policies
11. `operational_data` - 4 policies

### Performance Monitoring (5 tables)
12. `performance_panels` - 4 policies
13. `performance_losses` - 4 policies
14. `performance_bottlenecks` - 4 policies
15. `performance_trends` - 4 policies
16. `performance_benchmarks` - 4 policies

### SIM (Shift Information Management) (10 tables)
17. `sim_shifts` - 4 policies
18. `sim_boards` - 4 policies
19. `sim_kpis` - 4 policies
20. `sim_issues` - 4 policies
21. `sim_actions` - 4 policies
22. `sim_action_links` - 4 policies
23. `switching_orders` - 4 policies
24. `switching_order_impacts` - 4 policies
25. `outages` - 4 policies
26. `outage_impacts` - 4 policies

## Policy Details

Each table has **4 permissive policies**:
1. **SELECT** - `Allow public read access to [table]` - Using: `true`
2. **INSERT** - `Allow public insert access to [table]` - Check: `true`
3. **UPDATE** - `Allow public update access to [table]` - Using: `true`
4. **DELETE** - `Allow public delete access to [table]` - Using: `true`

### Example Policy (sim_shifts table)
```sql
CREATE POLICY "Allow public read access to sim_shifts" ON sim_shifts
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sim_shifts" ON sim_shifts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sim_shifts" ON sim_shifts
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to sim_shifts" ON sim_shifts
  FOR DELETE USING (true);
```

## Verification Results

Database queries confirm:
- ✅ All 26 tables have RLS enabled (`rowsecurity = true`)
- ✅ Each table has exactly 4 policies (104 total policies)
- ✅ All policies use `USING (true)` or `WITH CHECK (true)` for unrestricted access
- ✅ Data is accessible: 1 tenant, 15 assets loaded successfully

## How to Access Data

You can now access all data using the **anon key** without authentication:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'your-anon-key'
)

// No auth required - all operations work!
const { data, error } = await supabase
  .from('sim_shifts')
  .select('*')
```

## ⚠️ Important Notes

### For Local Development
- ✅ **SAFE**: These permissive policies are perfect for local development
- ✅ All team members can access data without authentication complexity
- ✅ Faster development iteration

### For Production Deployment
- ⚠️ **DO NOT USE IN PRODUCTION**: These policies allow unrestricted access
- 🔒 Before deploying to production, create proper RLS policies based on:
  - User authentication (`auth.uid()`)
  - Tenant isolation (`tenant_id` filtering)
  - Role-based access control
  - Data sensitivity requirements

## Migration File Location

The migration that enables this is located at:
```
supabase/migrations/014_disable_rls_for_dev.sql
```

## How to Re-apply

If you need to reset the database and re-apply all migrations (including RLS policies):

```bash
# Reset database (drops all data, re-runs migrations and seeds)
npx supabase db reset

# Check status
npx supabase status
```

## Related Documentation

- `LOCAL_SUPABASE_SETUP.md` - Complete local setup guide
- `SUPABASE_QUICK_START.md` - Quick reference guide
- `SUPABASE_TROUBLESHOOTING.md` - Common issues and solutions
- `supabase/migrations/014_disable_rls_for_dev.sql` - The actual migration file

## Contact

For questions about RLS policies or access control, refer to:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy System](https://www.postgresql.org/docs/current/sql-createpolicy.html)
