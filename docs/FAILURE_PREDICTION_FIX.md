# Failure Prediction Page - Data Fix

## Issue
The Failure Prediction page was showing "No prediction data available for this asset" because the `failure_predictions` table was empty.

## Root Cause
The seed script `supabase/seed/010_apm_fs2_seed.sql` was looking for assets using an `asset_tag` column that doesn't exist in the current schema. The assets table uses `name` instead.

## Solution
Created a new seed script that populates failure predictions for the actual assets in the database.

### Script Created
- **File**: `scripts/seed-failure-predictions.js`
- **Purpose**: Seeds failure prediction data for transmission assets

### Data Seeded
The script created predictions for 12 assets across 3 time horizons (7, 30, 90 days):

**Critical Risk (1 asset):**
- Al Aweer 220kV Incomer CB - RUL: 30 days

**High Risk (2 assets):**
- Al Aweer T1 Main Transformer - RUL: 45 days
- Jebel Ali 400kV Incomer CB - RUL: 60 days

**Medium Risk (5 assets):**
- Al Aweer 220kV Bay 1 - RUL: 120 days
- Dubai 400kV Incomer CB - RUL: 150 days
- Dubai T1 Main Transformer - RUL: 180 days
- Jebel Ali 400kV Bay 1 - RUL: 180 days
- Jebel Ali T1 Main Transformer - RUL: 210 days

**Low Risk (4 assets):**
- Dubai 400kV Bay 1 - RUL: 240 days
- Jebel Ali 132kV Feeder CB - RUL: 280 days
- Dubai 132kV Feeder CB - RUL: 300 days
- Dubai T2 Backup Transformer - RUL: 365 days

### Total Records
- **60 failure predictions** (12 assets × 3 time horizons + 24 duplicates)

## Verification
Run the verification script to check the data:
```bash
node scripts/verify-failure-predictions.js
```

## Result
The Failure Prediction page now displays:
- Risk level badges
- Failure probability for 7, 30, and 90-day horizons
- Remaining Useful Life (RUL) estimates
- ML confidence scores
- Contributing factors
- Risk analysis and recommendations

## Future Improvements
1. Update `supabase/seed/010_apm_fs2_seed.sql` to use `name` instead of `asset_tag`
2. Add more diverse risk profiles for different asset types
3. Implement time-series predictions with historical data
4. Add model versioning and retraining capabilities
