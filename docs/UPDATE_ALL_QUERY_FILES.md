# Update All Query Files with Tenant ID Mapping

## Files That Need Updating

The following query files still need to import and use `mapTenantIdToUUID`:

1. ✅ `src/lib/encryptionKeyQueries.ts` - DONE
2. ✅ `src/lib/platformProtectionQueries.ts` - DONE
3. ❌ `src/lib/backupRecoveryQueries.ts` - NEEDS UPDATE
4. ❌ `src/lib/workloadSecurityQueries.ts` - NEEDS UPDATE
5. ❌ `src/lib/applicationSecurityQueries.ts` - NEEDS UPDATE

## Pattern to Apply

For each query file, add this import at the top:
```typescript
import { mapTenantIdToUUID } from './tenantMapping';
```

Then in each function that takes `tenantId: string`, add this at the beginning:
```typescript
// Map frontend tenant ID to Supabase UUID
const tenantUUID = await mapTenantIdToUUID(tenantId);
if (!tenantUUID) {
  return []; // or return empty summary/null as appropriate
}
```

Then replace all `.eq('tenant_id', tenantId)` with `.eq('tenant_id', tenantUUID)`

## Critical Issue

**The 406 error and "No data" issue will NOT be fixed by code changes alone.**

You MUST run the SQL script in Supabase:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `fix_platform_protection_data.sql`
4. This will:
   - Disable RLS (fix 406 errors)
   - Insert seed data (fix "No data" issue)

## Current Status

From the console logs:
- `[PlatformDataProtection] Loaded policies: 0` - No data in database
- `406 (Not Acceptable)` - RLS is still enabled
- `400 (Bad Request)` - Tenant ID mapping not applied to backup/workload queries
- `404 (Not Found)` - workload_security table may not exist or schema cache issue

## Next Steps

1. **FIRST**: Run `fix_platform_protection_data.sql` in Supabase SQL Editor
2. **THEN**: I'll update the remaining query files with tenant ID mapping
3. **FINALLY**: Refresh the app and verify all pages work
