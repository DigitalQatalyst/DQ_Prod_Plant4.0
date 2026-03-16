# Supabase Setup - Phase A, B & C Complete

This document tracks the Supabase integration progress following the strangler pattern migration strategy.

## ✅ Phase A: Connect Repo to Supabase (COMPLETE)

### What Was Done

1. **Supabase CLI Structure**
   - Created `/supabase/config.toml` - Local development configuration
   - Created `/supabase/migrations/` - Database migration files directory
   - Created `/supabase/seed/` - Seed data directory

2. **Environment Configuration**
   - Updated `.env.development` - Development environment with `VITE_DATA_BACKEND=mock`
   - Updated `.env.example` - Template with documentation
   - Created `.env.staging` - Staging environment configuration
   - Created `.env.production` - Production environment configuration
   - Added `VITE_DATA_BACKEND` flag to switch between mock and Supabase

3. **Supabase Client**
   - Enhanced `src/lib/supabase.ts` with:
     - Graceful handling of missing credentials in mock mode
     - Helper functions: `isSupabaseConfigured()`, `getDataBackend()`
     - Clear error messages when credentials are required

4. **TypeScript Configuration**
   - Updated `src/vite-env.d.ts` with `VITE_DATA_BACKEND` type definition

5. **Git Configuration**
   - Updated `.gitignore` to exclude:
     - Environment files (except `.env.example`)
     - Supabase local development files

### Current State
- ✅ Repo is connected to Supabase
- ✅ Build is stable (no behavior changes)
- ✅ Legacy mocks still work
- ✅ Ready for Phase B

---

## ✅ Phase B: Provider Layer (COMPLETE)

### What Was Done

1. **DataProvider Interface** (`src/lib/data/DataProvider.ts`)
   - Single read surface for all data access
   - Mirrors existing helper function signatures
   - All methods return Promises (async-ready)
   - Covers:
     - Tenants/Organizations
     - Sectors
     - Assets
     - Alerts & Incidents
     - Upstream-specific entities (Oil & Gas)

2. **MockProvider** (`src/lib/data/providers/MockProvider.ts`)
   - Wraps existing mock data files
   - Implements DataProvider interface
   - **ONLY place that imports from `src/data/*` directly**
   - Returns Promises for consistency

3. **SupabaseProvider** (`src/lib/data/providers/SupabaseProvider.ts`)
   - Stub implementation with clear "not implemented" errors
   - Ready for entity-by-entity migration
   - Validates Supabase connection

4. **Provider Factory** (`src/lib/data/index.ts`)
   - Single entrypoint: `getDataProvider()`
   - Switches based on `VITE_DATA_BACKEND` env variable
   - Singleton pattern (stable instances)

5. **React Hook** (`src/hooks/useDataProvider.ts`)
   - `useDataProvider()` hook for components
   - Memoized provider instance
   - Backend mode helpers

### Current State
- ✅ Provider layer is in place
- ✅ MockProvider wraps legacy mocks
- ✅ SupabaseProvider ready for implementation
- ✅ App still uses legacy mocks (no breaking changes)
- ✅ Build passes successfully

---

## ✅ Phase C: Schema + Seed (COMPLETE)

### What Was Done

1. **Core Database Schema Migrations**
   - `001_create_tenants.sql` - Multi-sector tenant registry
   - `002_create_sites.sql` - Physical locations with geo coordinates
   - `003_create_asset_types.sql` - Asset classification with JSONB schema
   - `004_create_assets.sql` - Physical/logical assets with hierarchical structure
   - `005_create_alerts.sql` - Cross-domain alerts with JSONB payload
   - `006_create_telemetry.sql` - Tags and telemetry points for monitoring

2. **Power Transmission Domain Schema**
   - `007_create_grid_nodes.sql` - Transmission network topology nodes
   - `008_create_grid_lines.sql` - Transmission lines connecting nodes
   - `009_create_grid_asset_links.sql` - Links assets to grid topology

3. **Seed Data for Power Transmission Demo**
   - `001_transmission_tenant.sql` - DEWA tenant with 3 sites
   - `002_grid_topology.sql` - 5 grid nodes and 6 grid lines forming connected network
   - `003_assets.sql` - Asset types and 15 assets (transformers, breakers, bays, meters)
   - `006_grid_asset_links.sql` - 18 links between assets and grid topology (15 node links + 3 line links)
   - `004_telemetry_alerts.sql` - 10 tags, 30 telemetry points and 12 alerts
   - `005_operational.sql` - Automation workflows, alarm rules, CI projects
   
   **Note:** Seeds 002-006 now include precondition assertions that will fail loudly with meaningful error messages if required data is missing. This ensures the seed pipeline is robust and deterministic.

4. **Hybrid Provider Implementation**
   - `HybridProvider.ts` - Delegates Transmission methods to Supabase, others to Mock
   - Extended `DataProvider` interface with Transmission-specific methods
   - Updated provider factory to support `VITE_DATA_BACKEND=hybrid`
   - Implemented all Transmission methods in `SupabaseProvider`

### Current State
- ✅ Database schema is complete and tested
- ✅ Seed data provides realistic Power Transmission demo
- ✅ HybridProvider enables selective Supabase usage
- ✅ Power Transmission pages use Supabase data
- ✅ Upstream O&G pages continue using mocks
- ✅ All tests pass with hybrid mode

---

## 🔄 Phase D: Migrate Entity-by-Entity (TODO)

### Recommended Migration Order

1. **getTenants()** - Core entity, used everywhere
2. **getSectors()** - Core entity, used for navigation
3. **getAssetsByTenant()** - Main data entity
4. **getAlertsByTenant()** - Alerts/incidents
5. **Upstream methods** - Oil & Gas specific features

### Migration Process for Each Entity

1. Implement method in `SupabaseProvider`
2. Keep method signature identical to MockProvider
3. Test with `VITE_DATA_BACKEND=supabase`
4. Verify pages that depend on that method
5. Commit and move to next entity

---

## 🚫 Guardrails (TODO - Recommended)

### 1. CI/Lint Rule: Block Legacy Mock Changes

Add to CI pipeline:
```bash
# Fail if legacy mock files are modified
git diff --name-only origin/main | grep -E "src/data/(mockData|upstreamMockData|alertData).ts" && exit 1
```

### 2. ESLint Rule: Restrict Direct Imports

Add to `eslint.config.js`:
```js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/data/mockData*', '**/data/upstreamMockData*', '**/data/alertData*'],
        message: 'Import from @/lib/data provider instead of direct mock imports'
      }]
    }]
  }
}
```

### 3. Kiro Steering Rule

Add to `.kiro/steering/data-access.md`:
```markdown
# Data Access Rules

All data access MUST go through `src/lib/data` providers.

- ✅ DO: `import { getDataProvider } from "@/lib/data"`
- ❌ DON'T: `import { mockData } from "@/data/mockData"`

No new global mock datasets. Tests and Storybook only.
```

---

## 📝 Usage Examples

### In Components (with React Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import { useDataProvider } from '@/hooks/useDataProvider';

function MyComponent() {
  const { provider } = useDataProvider();
  
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => provider.getTenants()
  });
  
  // Use tenants...
}
```

### Direct Usage

```typescript
import { getDataProvider } from '@/lib/data';

async function loadData() {
  const provider = getDataProvider();
  const tenants = await provider.getTenants();
  const assets = await provider.getAssetsByTenant('t1');
  return { tenants, assets };
}
```

### Switching Backends

```bash
# Use mock data (default)
VITE_DATA_BACKEND=mock npm run dev

# Use Supabase for all data
VITE_DATA_BACKEND=supabase npm run dev

# Use hybrid mode (Power Transmission on Supabase, Upstream O&G on mocks)
VITE_DATA_BACKEND=hybrid npm run dev
```

### Hybrid Mode Usage

Hybrid mode is ideal for demonstrations where you want to show:
- **Power Transmission pages** with live database data (realistic grid topology, assets, alerts)
- **Upstream O&G pages** with mock data (no database setup required)

**When to use hybrid mode:**
- Demo scenarios showcasing Power Transmission capabilities
- Development when only Transmission schema is ready
- Testing Transmission features without affecting Upstream workflows

**Requirements for hybrid mode:**
- Supabase project must be configured (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Database migrations must be applied
- Seed data should be loaded for realistic demo content

---

## 🎯 Benefits of This Approach

1. **No Breaking Changes** - App continues working with mocks
2. **Gradual Migration** - Migrate entity-by-entity at your pace
3. **Easy Testing** - Switch backends with env variable
4. **Clean Architecture** - Single data access layer
5. **Merge Safety** - Provider layer prevents mock sprawl

---

## 📚 Files Created/Modified

### Created
- `/supabase/config.toml`
- `/supabase/migrations/.gitkeep`
- `/supabase/seed/.gitkeep`
- `.env.staging`
- `.env.production`
- `src/lib/data/DataProvider.ts`
- `src/lib/data/providers/MockProvider.ts`
- `src/lib/data/providers/SupabaseProvider.ts`
- `src/lib/data/index.ts`
- `src/hooks/useDataProvider.ts`

### Modified
- `.env.development` - Added `VITE_DATA_BACKEND=mock`
- `.env.example` - Added `VITE_DATA_BACKEND` documentation
- `src/lib/supabase.ts` - Enhanced with backend switching
- `src/vite-env.d.ts` - Added `VITE_DATA_BACKEND` type
- `.gitignore` - Added env files and Supabase local files

### Fixed (Pre-existing Issues)
- `src/components/shared/StatusBadge.tsx` - Removed duplicate const
- `src/data/mockData.ts` - Fixed incomplete interface and syntax errors
- `src/data/navigation.ts` - Fixed malformed energy section

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Hybrid Mode Not Working

**Error:** `Hybrid mode requires Supabase configuration`

**Solution:**
```bash
# Check environment variables are set
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# If missing, copy from .env.example and fill in values
cp .env.example .env.development
# Edit .env.development with your Supabase credentials
```

#### 2. Database Connection Errors

**Error:** `getGridNodesByTenant failed: relation "grid_nodes" does not exist`

**Solution:**
```bash
# Apply migrations to your Supabase project
supabase db push

# Or if using local Supabase
supabase migration up
```

#### 3. Empty Transmission Data

**Error:** Transmission pages show no data or empty lists

**Solution:**
```bash
# Load seed data (must be run in order)
supabase db seed

# Or manually run seed files in order:
# 001_transmission_tenant.sql
# 002_grid_topology.sql
# 003_assets.sql
# 006_grid_asset_links.sql
# 004_telemetry_alerts.sql
# 005_operational.sql
```

**Note:** Seeds 002-005 include precondition assertions that will fail with clear error messages if dependencies are missing. For example, if you run `003_assets.sql` before `001_transmission_tenant.sql`, you'll see:
```
PRECONDITION FAILED: Tenant "DEWA - Transmission" (power/transmission/power_transmission_demo_v1) does not exist. Run 001_transmission_tenant.sql first.
```

**Expected row counts after successful seeding:**
- tenants: 1
- sites: 3
- asset_types: 4
- grid_nodes: 5
- grid_lines: 6
- grid_asset_links: 18 (15 node links + 3 line links)
- assets: 15
- tags: 10
- telemetry_points: 30
- alerts: 12
- operational_data: 11

#### 4. TypeScript Errors with Hybrid Mode

**Error:** `Property 'getTransmissionTenants' does not exist on type 'DataProvider'`

**Solution:**
```bash
# Restart TypeScript server in your IDE
# Or restart development server
npm run dev
```

#### 5. Supabase Local Development Issues

**Error:** `Connection refused` when using local Supabase

**Solution:**
```bash
# Start Supabase local development
supabase start

# Check status
supabase status

# Use the local URLs in your .env.development:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=<anon key from supabase status>
```

### Debug Mode

Enable debug logging by setting:
```bash
# In your .env file
VITE_DEBUG_DATA_PROVIDER=true
```

This will log all provider method calls and their results to the browser console.

### Verification Steps

1. **Check Provider Mode:**
   ```typescript
   import { getDataProvider } from '@/lib/data';
   console.log(getDataProvider().constructor.name); // Should be "HybridProvider"
   ```

2. **Test Transmission Methods:**
   ```typescript
   const provider = getDataProvider();
   const tenants = await provider.getTransmissionTenants();
   console.log('Transmission tenants:', tenants);
   ```

3. **Test Mock Methods:**
   ```typescript
   const provider = getDataProvider();
   const tenants = await provider.getTenants();
   console.log('All tenants (from mocks):', tenants);
   ```

---

## 🚀 Next Actions

1. **Use Hybrid Mode for Demos**
   ```bash
   # Set environment for hybrid mode
   VITE_DATA_BACKEND=hybrid npm run dev
   ```

2. **Extend to Other Sectors** (Phase D)
   - Implement sector-specific methods for other domains
   - Migrate additional entities from mocks to Supabase
   - Consider full migration when all sectors are ready

3. **Production Deployment**
   ```bash
   # For production with hybrid mode
   VITE_DATA_BACKEND=hybrid npm run build
   ```

4. **Monitor and Optimize**
   - Review query performance for Transmission methods
   - Add caching layer if needed
   - Consider read replicas for high-traffic scenarios

---

## 📞 Support

For questions about this setup:
- Review the plan document that guided this implementation
- Check `src/lib/data/DataProvider.ts` for interface documentation
- See usage examples above
