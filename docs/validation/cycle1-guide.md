# Cycle 1 Validation Guide

This guide walks you through validating the Cycle 1 (Asset Catalog & Types) implementation locally before pushing to remote Supabase.

## What Was Implemented in Cycle 1

### Migrations
- `012_create_property_sets.sql` - Property sets table for reusable metadata field collections
- `013_create_lifecycle_states.sql` - Lifecycle states table for asset lifecycle stages

### Seeds
- `007_property_sets.sql` - 5 property sets (technical, operational, safety, financial, maintenance)
- `008_lifecycle_states.sql` - 15 lifecycle states across 3 categories (electrical, protection, measurement)

### Provider Methods
- `getPropertySetsByTenant()` - List property sets with pagination and filtering
- `getPropertySetById()` - Get single property set
- `createPropertySet()` - Create new property set
- `getLifecycleStatesByCategory()` - List lifecycle states for a category
- `createLifecycleState()` - Create new lifecycle state

### UI Pages
- `AssetCatalogPage` - Asset type management
- `PropertySetsPage` - Property set management
- `LifecycleConfigPage` - Lifecycle state configuration
- `SectorProfilesPage` - Read-only sector profiles

## Prerequisites

1. **Supabase CLI installed**
   ```powershell
   # Check if installed
   supabase --version
   
   # If not installed, download from:
   # https://supabase.com/docs/guides/cli
   ```

2. **Local Supabase initialized**
   ```powershell
   # Should already be done, but if not:
   supabase init
   ```

## Validation Steps

### Option 1: Quick Validation (Recommended)

Run the simple validation script that uses the REST API:

```powershell
.\validate-cycle1-simple.ps1
```

This script will:
1. Check if local Supabase is running
2. Verify the transmission tenant exists
3. Validate property_sets table and data (>= 5 records)
4. Validate lifecycle_states table and data (>= 15 records)

### Option 2: Full Validation

Run the comprehensive validation script:

```powershell
.\validate-cycle1.ps1
```

This script will:
1. Check Supabase CLI installation
2. Check/start local Supabase
3. Reset database (applies all migrations + seeds)
4. Validate table existence
5. Validate seed data counts
6. Test seed idempotency (re-run seeds)

### Option 3: Manual Validation

If you prefer manual steps:

#### 1. Start Local Supabase
```powershell
supabase start
```

#### 2. Reset Database (Apply Migrations + Seeds)
```powershell
supabase db reset
```

This will:
- Drop all existing data
- Apply all migrations in order (001-013)
- Run all seeds in order (001-005, 007-008)

#### 3. Open Supabase Studio
```powershell
# Studio URL will be shown in terminal, typically:
# http://127.0.0.1:54323
```

Navigate to:
- **Table Editor** → `property_sets` → Should see 5 records
- **Table Editor** → `lifecycle_states` → Should see 15 records

#### 4. Verify Data via SQL Editor

In Supabase Studio SQL Editor, run:

```sql
-- Check property_sets
SELECT 
  ps.name,
  ps.type,
  jsonb_array_length(ps.fields) as field_count
FROM property_sets ps
JOIN tenants t ON ps.tenant_id = t.id
WHERE t.scenario_tag = 'power_transmission_demo_v1';

-- Expected: 5 rows (technical, operational, safety, financial, maintenance)
```

```sql
-- Check lifecycle_states
SELECT 
  ls.asset_category,
  COUNT(*) as state_count
FROM lifecycle_states ls
JOIN tenants t ON ls.tenant_id = t.id
WHERE t.scenario_tag = 'power_transmission_demo_v1'
GROUP BY ls.asset_category
ORDER BY ls.asset_category;

-- Expected: 3 categories with 5 states each (total 15)
```

## Testing the UI

### 1. Start Development Server
```powershell
npm run dev
```

### 2. Navigate to Cycle 1 Pages

- **Asset Catalog**: http://localhost:5173/assets/catalog
  - Should display existing asset types from baseline seeds
  - Test create/edit/delete functionality
  
- **Property Sets**: http://localhost:5173/assets/catalog/property-sets
  - Should display 5 property sets
  - Test filtering by type
  - Test create/edit functionality
  
- **Lifecycle Config**: http://localhost:5173/assets/catalog/lifecycle
  - Should display 15 lifecycle states grouped by category
  - Test editing states
  
- **Sector Profiles**: http://localhost:5173/assets/catalog/profiles
  - Should display read-only sector profiles

### 3. Test Provider Methods

Open browser console and test:

```javascript
// Get the data provider
const provider = window.__dataProvider; // If exposed for debugging

// Test property sets
const propertySets = await provider.getPropertySetsByTenant(tenantId);
console.log('Property Sets:', propertySets);

// Test lifecycle states
const lifecycleStates = await provider.getLifecycleStatesByCategory(tenantId, 'electrical');
console.log('Lifecycle States:', lifecycleStates);
```

## Common Issues

### Issue: "Local Supabase is not running"
**Solution:**
```powershell
supabase start
```

### Issue: "Table does not exist"
**Solution:**
```powershell
# Reset database to apply all migrations
supabase db reset
```

### Issue: "Seed data not found"
**Solution:**
```powershell
# Re-run specific seed
supabase db execute --file supabase/seed/007_property_sets.sql
supabase db execute --file supabase/seed/008_lifecycle_states.sql
```

### Issue: "Tenant not found"
**Solution:**
```powershell
# Reset database to run all seeds including tenant seed
supabase db reset
```

## Pushing to Remote Supabase

Once local validation passes:

### 1. Review Changes
```powershell
# See what migrations will be applied
supabase db diff
```

### 2. Push Migrations
```powershell
# Push migrations to remote
supabase db push
```

This will:
- Apply migrations 012 and 013 to remote database
- NOT run seeds automatically (seeds are local-only by default)

### 3. Run Seeds on Remote (Manual)

You'll need to run seeds manually on remote:

```powershell
# Option A: Via Supabase Studio SQL Editor
# Copy contents of seed files and run in SQL Editor

# Option B: Via CLI (if you have direct DB access)
psql $DATABASE_URL -f supabase/seed/007_property_sets.sql
psql $DATABASE_URL -f supabase/seed/008_lifecycle_states.sql
```

### 4. Verify Remote Data

In Supabase Studio (remote):
- Check `property_sets` table has 5 records
- Check `lifecycle_states` table has 15 records

## Rollback (If Needed)

If something goes wrong:

### Local Rollback
```powershell
# Just reset to previous state
supabase db reset
```

### Remote Rollback
```powershell
# Create a migration to drop tables
supabase migration new rollback_cycle1

# Edit the migration file to add:
# DROP TABLE IF EXISTS lifecycle_states;
# DROP TABLE IF EXISTS property_sets;

# Push the rollback
supabase db push
```

## Success Criteria

✅ Local Supabase running  
✅ Migrations 012, 013 applied successfully  
✅ Seeds 007, 008 run without errors  
✅ property_sets table has >= 5 records  
✅ lifecycle_states table has >= 15 records  
✅ Seeds are idempotent (can re-run without errors)  
✅ UI pages render with seeded data  
✅ Provider methods return expected data  

## Next Steps

After successful validation:

1. ✅ Mark Cycle 1 tasks as complete in tasks.md
2. 🚀 Push migrations to remote Supabase
3. 📝 Document any issues or learnings
4. ⏭️ Proceed to Cycle 2 (Discovery & Onboarding)

## Support

If you encounter issues:
- Check Supabase logs: `supabase logs`
- Check migration status: `supabase migration list`
- Check database status: `supabase status`
- Review Supabase docs: https://supabase.com/docs
