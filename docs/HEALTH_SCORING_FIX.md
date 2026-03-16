# Health Scoring Page - Data Issue Fixed

## Problem
The "Asset Health Scoring / Index" page was showing "No health score data available for this week" because:

1. **Missing Health Models**: The `health_models` table was empty - the FS1 seed script hadn't been run successfully
2. **Missing Health Scores**: The `health_scores` table was empty - no health scores had been computed
3. **Asset Mismatch**: The page was using mock assets from AppContext which didn't match the Supabase asset names
4. **Seed Script Issues**: The existing seed scripts were trying to use an RPC function (`exec_sql`) that doesn't exist

## Solution Implemented

### 1. Created Health Models Seed Script
Created `scripts/seed-health-models-direct.js` to directly insert health models:
- `power_transformer` model with parameter weights
- `circuit_breaker` model with parameter weights  
- `transmission_line` model with parameter weights

### 2. Created Health Score Computation Script
Created `scripts/compute-health-scores.js` to:
- Query all online assets
- For each asset, fetch latest telemetry data
- Compute health score based on the health model
- Insert computed scores into `health_scores` table

### 3. Fixed Asset Data Source
Modified `src/pages/monitor/HealthScoring.tsx` to:
- Fetch assets directly from Supabase using `useAssets()` hook
- Convert APM assets to the Asset format for the sidebar
- Use the APM asset ID directly for health score queries
- Removed dependency on mock assets from AppContext

### 4. Results
Successfully computed health scores for 8 assets:
- Dubai T1 Main Transformer: 83/100
- Dubai T2 Backup Transformer: 89/100
- Dubai 132kV Feeder CB: 95/100
- Dubai 400kV Incomer CB: 95/100
- Jebel Ali T1 Main Transformer: 89/100
- Jebel Ali 132kV Feeder CB: 95/100
- Al Aweer T1 Main Transformer: 89/100
- Al Aweer 220kV Incomer CB: 95/100

## How to Use

### Initial Setup (One-time)
```bash
# 1. Seed health models
node scripts/seed-health-models-direct.js

# 2. Compute initial health scores
node scripts/compute-health-scores.js
```

### Ongoing Maintenance
```bash
# Recompute health scores (run periodically or on-demand)
node scripts/compute-health-scores.js
```

## Verification Scripts

### Check Health Models
```bash
node scripts/check-health-models.js
```

### Check Health Scores
```bash
node scripts/check-health-scores.js
```

### Test Data Flow
```bash
node scripts/test-health-scoring-data.js
```

## Next Steps

1. **Refresh the browser** - The page should now display health scores for assets
2. **Select an asset** - Click on any transformer or circuit breaker to see detailed health breakdown
3. **Schedule periodic computation** - Set up a cron job or scheduled task to run `compute-health-scores.js` regularly (e.g., hourly or daily)

## Technical Notes

### Asset Type Mapping
The script handles the mismatch between:
- Asset Types table: Uses title case (e.g., "Power Transformer", "Circuit Breaker")
- Health Models table: Uses snake_case (e.g., "power_transformer", "circuit_breaker")

The script automatically converts asset type names to snake_case for health model lookups.

### Health Score Computation
Health scores are computed using a weighted average of parameter scores:
- Each parameter is scored 0-100 based on thresholds (critical/warning/normal)
- Parameter scores are weighted according to the health model
- Final score is the weighted average of all parameter scores

### Data Backend Configuration
The app uses `VITE_DATA_BACKEND=hybrid` mode:
- Power Transmission assets come from Supabase
- Other sector data comes from mock data
- The HealthScoring page now correctly uses Supabase assets

### Skipped Assets
Assets without health models (Energy Meter, Switchgear Bay) are skipped. To add support:
1. Add health model entries in `seed-health-models-direct.js`
2. Ensure telemetry parameters exist for those asset types
3. Run the seed and compute scripts

## Changes Made to Code

### src/pages/monitor/HealthScoring.tsx
- Removed dependency on `useApp()` context for assets
- Now fetches assets directly from Supabase using `useAssets()` hook
- Converts APM assets to Asset format for sidebar display
- Uses APM asset ID directly for health score queries
- No more name/location matching required
