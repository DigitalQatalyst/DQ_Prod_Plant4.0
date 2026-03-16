# Degradation Trends Page - Data Display Fix

## Issue
The Degradation Trend Analysis page was showing "No parameters available for this asset" and data was flickering (briefly appearing then disappearing).

## Root Causes

### 1. Database Schema Mismatch
The component was querying the non-existent `asset_type` column directly from the `assets` table.

### 2. Hook Error Handling
The `useTelemetrySeries` hook was setting an error state when called with empty parameters, causing data to be cleared.

### 3. Asset Selection Sync
The local asset state wasn't syncing with the global selected asset from context on mount.

## Solutions

### 1. Fixed DegradationTrends.tsx - Asset Type Query
Updated the parameter fetching logic to properly query the asset type through the relationship:

```typescript
const { data: assetData, error: assetError } = await supabase
  .from('assets')
  .select('asset_types(name)')  // ✅ Query through relationship
  .eq('id', currentAsset.id)
  .single();

const assetTypeName = (assetData.asset_types as any)?.name;
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~305-325

### 2. Fixed DegradationTrends.tsx - Asset Selection Sync
Added useEffect to sync local asset state with global context:

```typescript
// Sync selectedAssetLocal with global selectedAsset on mount or when assets load
useEffect(() => {
  if (selectedAsset && assets.length > 0 && !selectedAssetLocal) {
    const apmAsset = assets.find(a => a.id === selectedAsset.id);
    if (apmAsset) {
      setSelectedAssetLocal(apmAsset);
    }
  }
}, [selectedAsset, assets, selectedAssetLocal]);
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~260-268

### 3. Fixed useTelemetrySeries Hook - Error Handling
Changed the hook to not set an error when parameters are empty (graceful degradation):

```typescript
if (!params.asset_id || !params.parameter_ids || params.parameter_ids.length === 0) {
  setState({
    data: null,
    loading: false,
    error: null, // ✅ Don't set error for empty params
  });
  return;
}
```

**File:** `src/hooks/useAPM.ts`
**Lines:** ~1069-1075

### 4. Enhanced useAssets Hook
Updated the `useAssets` hook to properly map the database structure to the TypeScript Asset interface:

```typescript
// Map the data to match the Asset type interface
const mappedData = (data || []).map((asset: any) => ({
  ...asset,
  asset_type: asset.asset_types?.name || 'Unknown',
  operational_status: asset.status,
}));
```

**File:** `src/hooks/useAPM.ts`
**Lines:** ~220-230

### 5. Enhanced useAssetById Hook
Updated the `useAssetById` hook to properly map the asset_type field:

```typescript
// Map the asset to include asset_type field
const mappedAsset = {
  ...asset,
  asset_type: assetTypeName,
  operational_status: asset.status,
} as Asset;
```

**File:** `src/hooks/useAPM.ts`
**Lines:** ~390-400

## Verification

Created test script `scripts/test-degradation-page-data.js` that verifies:
1. ✅ Asset fetching works correctly
2. ✅ Asset type mapping works correctly
3. ✅ Parameter fetching returns 11 parameters for Power Transformer
4. ✅ Telemetry data is available (168 data points for 30 days)

## Impact

This fix resolves the data display issue for:
- **Degradation Trend Analysis** page
- Any other pages using the `useAssets` or `useAssetById` hooks
- Ensures proper mapping between database schema and TypeScript types

## Testing

To test the fix:
1. Navigate to Monitor > Degradation Trend Analysis
2. Select "Al Aweer T1 Main Transformer" from the asset list
3. Verify that 11 parameters are displayed
4. Select any parameter (e.g., "top_oil_temp")
5. Verify that the trend chart and analysis are displayed

## Related Files

- `src/pages/monitor/DegradationTrends.tsx` - Fixed parameter fetching
- `src/hooks/useAPM.ts` - Enhanced data mapping in useAssets and useAssetById
- `scripts/test-degradation-page-data.js` - Verification script
- `scripts/check-asset-parameters.js` - Diagnostic script

## Database Schema Reference

```sql
-- Assets table structure
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type_id UUID REFERENCES asset_types(id),  -- Foreign key, not direct string
  status TEXT,
  -- ... other fields
);

-- Asset types table
CREATE TABLE asset_types (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL  -- "Power Transformer", "Circuit Breaker", etc.
);

-- Asset parameter map
CREATE TABLE asset_parameter_map (
  asset_type TEXT,  -- References asset_types.name
  parameter_id UUID REFERENCES telemetry_parameters(id)
);
```

## Notes

- The TypeScript `Asset` interface has `asset_type: TransmissionAssetType` but the database uses `asset_type_id: UUID`
- The hooks now properly bridge this gap by mapping `asset_types.name` to `asset_type`
- This pattern should be followed for any new components that query assets

## Asset Type Coverage

Not all asset types had parameters mapped initially. After running the fix script:

**Asset types WITH parameters:**
- ✅ Power Transformer (11 parameters)
- ✅ Circuit Breaker (parameters available)
- ✅ Switchgear Bay (5 parameters) - **NEWLY ADDED**

**Asset types WITHOUT parameters:**
- ❌ Energy Meter

**Switchgear Bay Parameters Added:**
1. busbar_voltage (kV)
2. busbar_current (A)
3. bay_temperature (°C)
4. isolator_status (bool)
5. earthing_status (bool)

If you select an asset without parameters, the page will correctly show "No parameters available for this asset".

**Recommended test assets:**
- Al Aweer 220kV Bay 1 (Switchgear Bay) - **NOW WORKING**
- Al Aweer T1 Main Transformer (Power Transformer)
- Dubai T2 Backup Transformer (Power Transformer)
- Dubai 400kV Incomer CB (Circuit Breaker)
- Dubai 132kV Feeder CB (Circuit Breaker)

## Adding Parameters for Other Asset Types

To add parameters for other asset types (like Energy Meter), run:

```bash
node scripts/fix-bay-parameters.js
```

Then modify the script to target the desired asset type.
