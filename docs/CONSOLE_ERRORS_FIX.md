# Console Errors Fix Summary

## Issues Identified

### 1. Missing Favicon (404 Errors)
**Error:** `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/favicon.ico`

**Root Cause:** The `index.html` file didn't have favicon link tags, even though favicon files exist in the `/public` folder.

**Fix Applied:**
- Added favicon link tags to `index.html` pointing to the existing favicon files:
  - `/P4.0_favicon_16.png` (16x16)
  - `/P4.0_favicon_32.png` (32x32)
  - `/P4.0_favicon_128.png` (128x128)

### 2. Supabase API 406 Error (Not Acceptable)
**Error:** `Failed to load resource: the server responded with a status of 406 (Not Acceptable)` for `data_protection_metrics` table

**Root Cause:** Row Level Security (RLS) was enabled on the new security tables (migrations 040-044) but the RLS disable migration (045) only covered file integrity and forensic tables.

**Fix Applied:**

#### Updated Migration File
Updated `supabase/migrations/045_disable_rls_for_development.sql` to include:

**Data Protection Tables (Migration 040):**
- `data_protection_policies`
- `data_protection_measures`
- `data_classification_catalog`
- `data_access_audit`
- `data_protection_violations`
- `data_protection_metrics`

**Encryption Key Management Tables (Migration 041):**
- `encryption_keys`
- `key_rotation_history`
- `key_usage_audit`
- `key_access_requests`

**Backup Recovery Tables (Migration 042):**
- `backup_policies`
- `backup_jobs`
- `backup_sets`
- `recovery_plans`
- `recovery_tests`

**Workload Security Tables (Migration 043):**
- `workload_security`
- `workload_vulnerabilities`
- `workload_patches`
- `workload_compliance_checks`

**Application Security Tables (Migration 044):**
- `application_security_scans`
- `application_vulnerabilities`
- `application_dependencies`
- `application_security_tests`

#### Quick Fix SQL Script
Created `fix_rls_disable.sql` for immediate application to existing database:
- Run this script in the Supabase SQL Editor to disable RLS on all affected tables
- This bypasses the need for a full database reset

### 3. Tenant ID Mapping Error (400 Bad Request)
**Error:** `GET http://127.0.0.1:8000/rest/v1/encryption_keys?...&tenant_id=eq.dewa-transmission 400 (Bad Request)`
**Error Message:** `invalid input syntax for type uuid: "dewa-transmission"`

**Root Cause:** The frontend uses string tenant IDs like "dewa-transmission" but the Supabase database expects UUIDs. The queries were passing the string ID directly instead of mapping it to the UUID.

**Fix Applied:**

#### Updated Query Functions
Modified the following query files to use the existing `mapTenantIdToUUID` utility:

**src/lib/encryptionKeyQueries.ts:**
- Added import for `mapTenantIdToUUID`
- Updated `getEncryptionKeys()` to map tenant ID before querying
- Updated `getEncryptionKeyById()` to map tenant ID
- Updated `getKeyRotationHistory()` to map tenant ID
- Updated `getKeyUsageAudit()` to map tenant ID
- Updated `getEncryptionKeyManagementSummary()` to map tenant ID and return empty data for unmapped tenants

**src/lib/platformProtectionQueries.ts:**
- Added import for `mapTenantIdToUUID`
- Updated `getDataProtectionPolicies()` to map tenant ID
- Updated `getDataProtectionViolations()` to map tenant ID
- Updated `getPlatformDataProtectionSummary()` to map tenant ID and return empty summary for unmapped tenants

The `mapTenantIdToUUID` utility (already existing in `src/lib/tenantMapping.ts`):
- Maps frontend string IDs to Supabase UUIDs
- Caches mappings for performance
- Returns `null` for tenants not in Supabase (allowing graceful fallback to mock data)
- Handles multiple frontend ID variations (e.g., "dewa-transmission", "alpha-upstream") mapping to the same UUID

## How to Apply Fixes

### Favicon Fix
✅ Already applied - will take effect on next page reload

### Database RLS Fix & Seed Data

**IMPORTANT: Run this single comprehensive script to fix everything**

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_platform_protection_data.sql`
4. Execute the script
5. Verify the output shows:
   ```
   Data Protection Policies: 3
   Data Classification Catalog: 3
   Data Protection Metrics: 3
   ```
6. Refresh your application

This script will:
- Disable RLS on all security tables
- Clear any existing data protection data for DEWA - Transmission
- Insert fresh seed data for policies, classification catalog, and metrics

**Alternative: Individual Scripts**

If you prefer to run scripts separately:

**Option 1: RLS Disable Only**
- Run `fix_rls_disable.sql` in Supabase SQL Editor

**Option 2: Database Reset (For fresh start)**
If you have Supabase CLI installed:
```bash
supabase db reset
```

This will reapply all migrations including the updated migration 045 and all seed data.

### Tenant ID Mapping Fix
✅ Already applied - code changes are in place
- The query functions now automatically map frontend tenant IDs to Supabase UUIDs
- No additional configuration needed
- Works transparently for all security pages

## Verification

After applying the fixes:

1. **Favicon:** Check browser console - no more 404 errors for favicon
2. **API Calls:** Check browser console - no more 406 errors from Supabase
3. **Tenant ID Mapping:** Check browser console - no more 400 "invalid input syntax for type uuid" errors
4. **Data Loading:** 
   - Platform Data Protection page should load metrics successfully
   - Encryption Key Management page should load keys successfully
   - All security pages should query the database correctly

## Notes

- The RLS disable is for **development only**
- In production, proper RLS policies should be implemented
- The migration file (045) is now comprehensive and covers all security tables
- The tenant ID mapping is cached for performance and works across all query functions
- Tenants not in Supabase will gracefully return empty data instead of errors
