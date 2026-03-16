# FS1 & FS2 Data Restoration Summary

## Issue
After recent fixes, FS1 (Asset Health & Diagnostics) had lost all its data while FS2 (Predictive & Prescriptive Maintenance) retained its data.

## Resolution

### FS1: Asset Health & Diagnostics - ✅ RESTORED
All 5 features now have complete data:

1. **Real-time Condition Monitoring** ✓
   - Telemetry data: 168+ records
   - Parameters: top_oil_temp and others
   - Coverage: All online assets

2. **Asset Health Scoring** ✓
   - Health scores: 14 records (one per online asset)
   - Model version: v1.0
   - Score range: 70-95/100
   - Component breakdown included

3. **Anomaly & Fault Detection** ✓
   - Diagnostic events: 9 records
   - Event types: thermal, electrical, mechanical, insulation, comms
   - States: open and closed
   - Confidence levels: 70-95%

4. **Root-cause Diagnostics** ✓
   - RCA records: 5 records
   - Linked to diagnostic events
   - Includes root causes, contributing factors, and corrective actions

5. **Degradation Trend Analysis** ✓
   - Health history: 10+ assets tracked
   - Time-series health scores available
   - Trend analysis ready

### FS2: Predictive & Prescriptive Maintenance - ✅ MAINTAINED
All 5 features continue to have complete data:

1. **Machine-learning Failure Prediction** ✓
   - Predictions: 8 records
   - Risk levels: low, medium, high, critical
   - Probability scores included

2. **RUL Estimation** ✓
   - RUL data: 8 assets
   - Range: 14-180 days
   - Linked to failure predictions

3. **CBM Triggers** ✓
   - Triggers: 8 active triggers
   - Parameters: SF6 pressure, temperature, DGA gases, etc.
   - Conditions: threshold-based
   - Actions: defined for each trigger

4. **Maintenance Recommendations** ✓
   - Recommendations: 8 records
   - Types: inspection, repair, replacement
   - Linked to predictions and triggers

5. **Priority & Risk Scoring** ✓
   - Risk levels: 8 assets scored
   - Distribution: 0 critical, 2 high, 1 medium, 1 low
   - Priority-based maintenance scheduling enabled

## Scripts Created

### 1. `scripts/reseed-fs1-complete.js`
Complete FS1 data seeding script that:
- Seeds health models for all asset types
- Creates health scores for all online assets
- Generates diagnostic events
- Creates RCA records linked to events
- Uses correct schema (computation_method, not algorithm)

### 2. `scripts/check-fs1-fs2-features.js`
Quick verification script showing:
- Record counts for all FS1 and FS2 tables
- Sample data from each feature
- Summary of data availability

### 3. `scripts/verify-fs1-fs2-complete.js`
Comprehensive feature verification that:
- Checks all 5 FS1 features individually
- Checks all 5 FS2 features individually
- Provides detailed pass/fail for each feature
- Shows summary of data completeness

## Data Summary

### Total Records by Feature Set
- **FS4** (Asset Inventory): 56 rows ✓
- **FS1** (Health & Diagnostics): 28 rows ✓
- **FS2** (Predictive Maintenance): 24 rows ✓
- **FS3** (Performance): 0 rows (not in scope)
- **FS5** (Alerts & Reports): 0 rows (not in scope)

**Total: 108 rows across FS1, FS2, and FS4**

## Verification Commands

```bash
# Quick check of all feature sets
node scripts/verify-all-fs-data.js

# Detailed FS1 & FS2 feature verification
node scripts/verify-fs1-fs2-complete.js

# View all health scores
node scripts/show-all-health-scores.js

# Check failure predictions
node scripts/verify-failure-predictions.js

# Check CBM triggers
node scripts/check-cbm-triggers.js
```

## Key Schema Corrections

The script was updated to match the actual database schema:

### Health Models
- ✓ `computation_method` (not `algorithm`)
- ✓ `parameter_weights` (not nested `parameters.weights`)

### Health Scores
- ✓ Insert without upsert (no unique constraint on asset_id alone)
- ✓ Unique constraint on (asset_id, computed_at)

### Diagnostic Events
- ✓ `state` values: 'open', 'ack', 'closed' (not 'resolved')
- ✓ `closed_at` (not `resolved_at`)
- ✓ Event types: thermal, electrical, mechanical, insulation, comms

### RCA Records
- ✓ `event_id` (not `diagnostic_event_id`)
- ✓ `contributing_factors` as TEXT (not array)
- ✓ `created_by` (not `analyzed_at`)

## Status: ✅ COMPLETE

All FS1 and FS2 features now have complete, working data. The application pages should display data correctly for:
- Health scoring and monitoring
- Diagnostic events and anomaly detection
- Root cause analysis
- Failure predictions
- RUL estimation
- CBM triggers
- Maintenance recommendations
- Risk and priority scoring
