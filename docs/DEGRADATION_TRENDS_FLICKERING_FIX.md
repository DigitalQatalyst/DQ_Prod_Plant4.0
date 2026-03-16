# Degradation Trends Page - Flickering Fix

## Issue
The Degradation Trend Analysis page was continuously flickering and showing "Loading telemetry data..." in a loop, even though data was available.

## Root Causes

### 1. Array Reference Instability
The `parameter_ids` array was being created inline `[selectedParameter]` on every render, causing React to think the dependencies had changed even when the actual parameter ID hadn't changed.

### 2. Date Range Instability
The `dateRange` was using `new Date()` which creates a new timestamp on every render, causing the date strings to change constantly.

### 3. Assets Array Recreation
The `assets` array was being created with `assetsData?.data || []` on every render, creating a new array reference each time.

### 4. Hook Dependency on Array Reference
The `useTelemetrySeries` hook had `params.parameter_ids` in its dependency array, which compared arrays by reference, not by value.

### 5. Asset Sync Loop
The asset synchronization useEffect had `selectedAssetLocal` in its dependency array, potentially causing infinite loops.

## Solutions

### 1. Fixed useTelemetrySeries Hook - Stringify Array Dependencies
Changed the dependency array to stringify the parameter_ids array:

```typescript
// Before
}, [params.asset_id, params.parameter_ids, params.from, params.to, params.interval]);

// After
}, [
  params.asset_id, 
  JSON.stringify(params.parameter_ids), // Stringify to prevent reference changes
  params.from, 
  params.to, 
  params.interval
]);
```

**File:** `src/hooks/useAPM.ts`
**Lines:** ~1165-1172

### 2. Fixed DegradationTrends - Stabilize Date Range
Rounded the date to the hour to prevent constant timestamp changes:

```typescript
const dateRange = useMemo(() => {
  const to = new Date();
  to.setMinutes(0, 0, 0); // Round to the hour
  const from = new Date(to);
  from.setDate(from.getDate() - parseInt(timeHorizon));
  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}, [timeHorizon]);
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~375-385

### 3. Fixed DegradationTrends - Memoize Assets Array
Wrapped the assets array in useMemo:

```typescript
const assets = useMemo(() => assetsData?.data || [], [assetsData?.data]);
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~265

### 4. Fixed DegradationTrends - Memoize Parameter IDs
Created a stable reference for the parameter_ids array:

```typescript
const parameterIds = useMemo(() => {
  return selectedParameter ? [selectedParameter] : [];
}, [selectedParameter]);

const { data: telemetryData, loading: telemetryLoading, refetch } = useTelemetrySeries({
  asset_id: currentAsset?.id || '',
  parameter_ids: parameterIds, // Use memoized array
  from: dateRange.from,
  to: dateRange.to,
  interval: timeHorizon === '7' ? '1 hour' : timeHorizon === '30' ? '4 hours' : '12 hours'
});
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~387-398

### 5. Fixed DegradationTrends - Asset Sync with Ref
Used a ref to track synced asset ID and prevent loops:

```typescript
const syncedAssetIdRef = useRef<string | null>(null);

useEffect(() => {
  if (selectedAsset && assets.length > 0 && syncedAssetIdRef.current !== selectedAsset.id) {
    const apmAsset = assets.find(a => a.id === selectedAsset.id);
    if (apmAsset) {
      setSelectedAssetLocal(apmAsset);
      syncedAssetIdRef.current = selectedAsset.id;
    }
  }
}, [selectedAsset?.id, assets]);
```

**File:** `src/pages/monitor/DegradationTrends.tsx`
**Lines:** ~258, 268-277

## Impact

These fixes eliminate the infinite re-render loop by ensuring:
1. Hook dependencies are stable and only change when actual values change
2. Arrays are compared by value, not by reference
3. Date ranges are rounded to prevent millisecond-level changes
4. Asset synchronization doesn't create loops

## Testing

To verify the fix:
1. Navigate to Monitor > Degradation Trend Analysis
2. Select "Dubai 400kV Bay 1" or any asset with parameters
3. Select a parameter (e.g., "busbar_voltage")
4. Verify that:
   - The loading state appears briefly
   - Data loads and stays visible (no flickering)
   - The chart and analysis remain stable
   - Changing time horizon (7/30/90 days) works smoothly

## Related Files

- `src/hooks/useAPM.ts` - Fixed array dependency comparison
- `src/pages/monitor/DegradationTrends.tsx` - Fixed multiple stability issues
- Added `useRef` import for asset sync tracking

## Technical Notes

### React Dependency Comparison
React's `useEffect` and `useCallback` compare dependencies using `Object.is()`, which:
- Compares primitives by value (strings, numbers, booleans)
- Compares objects and arrays by reference

This means:
- `[1, 2, 3] !== [1, 2, 3]` (different references)
- `JSON.stringify([1, 2, 3]) === JSON.stringify([1, 2, 3])` (same string value)

### Best Practices Applied
1. **Memoize arrays and objects** passed as dependencies
2. **Stringify arrays** in dependency arrays when comparing by value
3. **Round timestamps** to prevent constant changes
4. **Use refs** to track state without triggering re-renders
5. **Minimize dependencies** to only what actually affects the effect

## Performance Impact

These optimizations significantly improve performance by:
- Eliminating unnecessary API calls
- Reducing component re-renders
- Preventing infinite loops
- Improving user experience with stable UI
