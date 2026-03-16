# APM Power Transmission Hooks - Developer Guide

## Overview

This module provides React hooks for querying and mutating APM (Asset Performance Management) data for the Power Transmission sector. All hooks are type-safe, handle loading/error states, and integrate seamlessly with Supabase.

## Installation

```typescript
import {
  useAssets,
  useAssetById,
  useUpsertAsset,
  useFMEAEntries,
  useSpareParts,
} from '@/hooks/useAPM';
```

## Hooks Reference

### useAssets

Query assets with filtering, pagination, and sorting.

**Parameters:**
```typescript
interface ListAssetsParams {
  sector?: string;
  asset_type?: TransmissionAssetType;
  operational_status?: OperationalStatus;
  location?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

**Returns:**
```typescript
{
  data: ListAssetsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Example:**
```typescript
function AssetList() {
  const { data, loading, error, refetch } = useAssets({
    sector: 'power_transmission',
    asset_type: 'power_transformer',
    operational_status: 'online',
    page: 1,
    pageSize: 20,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data || data.data.length === 0) return <EmptyState />;

  return (
    <div>
      {data.data.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
      <Pagination 
        page={data.page} 
        total={data.total} 
        pageSize={data.pageSize} 
      />
    </div>
  );
}
```

### useAssetById

Fetch a single asset with all relationships.

**Parameters:**
- `assetId: string | null` - Asset UUID or null

**Returns:**
```typescript
{
  data: GetAssetResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Example:**
```typescript
function AssetDetail({ assetId }: { assetId: string }) {
  const { data, loading, error, refetch } = useAssetById(assetId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return (
    <div>
      <h1>{data.asset.name}</h1>
      <p>Type: {data.asset.asset_type}</p>
      <p>Status: {data.asset.operational_status}</p>
      
      {data.parent && (
        <div>
          <h2>Parent Asset</h2>
          <AssetCard asset={data.parent} />
        </div>
      )}
      
      {data.children.length > 0 && (
        <div>
          <h2>Child Assets</h2>
          {data.children.map(child => (
            <AssetCard key={child.id} asset={child} />
          ))}
        </div>
      )}
      
      {data.fmea_entries.length > 0 && (
        <div>
          <h2>FMEA Entries</h2>
          <FMEATable entries={data.fmea_entries} />
        </div>
      )}
    </div>
  );
}
```

### useUpsertAsset

Create or update an asset using natural key logic.

**Parameters:**
```typescript
interface UpsertAssetParams {
  sector: "power_transmission";
  name: string;
  asset_type: TransmissionAssetType;
  asset_tag?: string;
  location: string;
  voltage_kv?: number;
  commissioning_date?: string;
  operational_status: OperationalStatus;
  criticality: CriticalityTier;
  lifecycle_stage: LifecycleStage;
  parent_asset_id?: string | null;
  metadata?: Record<string, unknown>;
}
```

**Returns:**
```typescript
{
  data: Asset | null;
  loading: boolean;
  error: Error | null;
  mutate: (params: UpsertAssetParams) => Promise<void>;
  reset: () => void;
}
```

**Example:**
```typescript
function AssetForm() {
  const { mutate, loading, error, data, reset } = useUpsertAsset();
  const [formData, setFormData] = useState<UpsertAssetParams>({
    sector: 'power_transmission',
    name: '',
    asset_type: 'power_transformer',
    location: '',
    operational_status: 'online',
    criticality: 'Standard',
    lifecycle_stage: 'operate'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate(formData);
  };

  useEffect(() => {
    if (data) {
      toast.success('Asset saved successfully!');
      reset();
    }
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="Asset Name"
        required
      />
      {/* More form fields... */}
      
      {error && <ErrorMessage error={error} />}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Asset'}
      </button>
    </form>
  );
}
```

### useFMEAEntries

Query FMEA library entries with filtering.

**Parameters:**
```typescript
interface ListFMEAEntriesParams {
  asset_type?: string;
  min_rpn?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}
```

**Returns:**
```typescript
{
  data: FMEAEntry[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Example:**
```typescript
function FMEALibrary() {
  const [assetType, setAssetType] = useState<string>('power_transformer');
  const [minRPN, setMinRPN] = useState<number>(100);
  
  const { data, loading, error, refetch } = useFMEAEntries({
    asset_type: assetType,
    min_rpn: minRPN
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div>
      <div>
        <select value={assetType} onChange={e => setAssetType(e.target.value)}>
          <option value="power_transformer">Power Transformer</option>
          <option value="circuit_breaker">Circuit Breaker</option>
          {/* More options... */}
        </select>
        
        <input
          type="number"
          value={minRPN}
          onChange={e => setMinRPN(Number(e.target.value))}
          placeholder="Min RPN"
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Failure Mode</th>
            <th>RPN</th>
            <th>Severity</th>
            <th>Occurrence</th>
            <th>Detection</th>
          </tr>
        </thead>
        <tbody>
          {data.map(entry => (
            <tr key={entry.id}>
              <td>{entry.failure_mode}</td>
              <td>{entry.rpn}</td>
              <td>{entry.severity}</td>
              <td>{entry.occurrence}</td>
              <td>{entry.detection}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### useSpareParts

Query spare parts with optional asset linkage filtering.

**Parameters:**
```typescript
interface ListSparePartsParams {
  asset_type?: string;
  asset_id?: string;
  page?: number;
  pageSize?: number;
}
```

**Returns:**
```typescript
{
  data: SparePartWithLinkage[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Example:**
```typescript
function SparePartsList({ assetId }: { assetId?: string }) {
  const { data, loading, error, refetch } = useSpareParts({
    asset_id: assetId
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <table>
      <thead>
        <tr>
          <th>Part Number</th>
          <th>Description</th>
          <th>Lead Time</th>
          <th>On Hand</th>
          {assetId && (
            <>
              <th>Qty Required</th>
              <th>Critical</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {data.map(part => (
          <tr key={part.id}>
            <td>{part.part_number}</td>
            <td>{part.description}</td>
            <td>{part.lead_time_days} days</td>
            <td>{part.on_hand_quantity}</td>
            {assetId && (
              <>
                <td>{part.quantity_required}</td>
                <td>{part.is_critical ? '⚠️' : ''}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Error Handling

All hooks provide consistent error handling:

```typescript
function MyComponent() {
  const { data, loading, error } = useAssets();

  if (error) {
    // Error types:
    // - "Supabase client not configured"
    // - "Permission denied: insufficient privileges..."
    // - "Asset already exists with this natural key"
    // - Database errors from Supabase
    
    return (
      <div className="error-state">
        <h3>Error</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // ... rest of component
}
```

## Loading States

All hooks provide loading indicators:

```typescript
function MyComponent() {
  const { data, loading } = useAssets();

  if (loading) {
    return (
      <div className="loading-state">
        <Spinner />
        <p>Loading assets...</p>
      </div>
    );
  }

  // ... rest of component
}
```

## Empty States

Handle empty results gracefully:

```typescript
function MyComponent() {
  const { data, loading, error } = useAssets();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  if (!data || data.data.length === 0) {
    return (
      <div className="empty-state">
        <p>No assets found</p>
        <button onClick={() => navigate('/assets/new')}>
          Create First Asset
        </button>
      </div>
    );
  }

  // ... rest of component
}
```

## Best Practices

### 1. Always Handle All States

```typescript
// ✅ Good
function MyComponent() {
  const { data, loading, error } = useAssets();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}

// ❌ Bad
function MyComponent() {
  const { data } = useAssets();
  return <DataDisplay data={data} />; // Will crash if data is null
}
```

### 2. Use Refetch for Manual Refresh

```typescript
function MyComponent() {
  const { data, loading, refetch } = useAssets();

  return (
    <div>
      <button onClick={refetch} disabled={loading}>
        Refresh
      </button>
      {/* ... */}
    </div>
  );
}
```

### 3. Reset Mutation State After Success

```typescript
function MyForm() {
  const { mutate, data, reset } = useUpsertAsset();

  useEffect(() => {
    if (data) {
      toast.success('Saved!');
      reset(); // Clear mutation state
    }
  }, [data, reset]);

  // ... rest of component
}
```

### 4. Combine Multiple Hooks

```typescript
function AssetDetailPage({ assetId }: { assetId: string }) {
  const asset = useAssetById(assetId);
  const spareParts = useSpareParts({ asset_id: assetId });
  const fmea = useFMEAEntries({ 
    asset_type: asset.data?.asset.asset_type 
  });

  const loading = asset.loading || spareParts.loading || fmea.loading;
  const error = asset.error || spareParts.error || fmea.error;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <AssetInfo asset={asset.data!.asset} />
      <SparePartsList parts={spareParts.data!} />
      <FMEATable entries={fmea.data!} />
    </div>
  );
}
```

## TypeScript Types

All types are exported from `@/types/apm`:

```typescript
import type {
  Asset,
  AssetRelationship,
  FMEAEntry,
  SparePart,
  TransmissionAssetType,
  OperationalStatus,
  CriticalityTier,
  LifecycleStage,
  ListAssetsParams,
  ListAssetsResponse,
  GetAssetResponse,
  UpsertAssetParams,
} from '@/types/apm';
```

## Testing

When testing components that use these hooks, mock the hooks:

```typescript
import { vi } from 'vitest';
import * as useAPM from '@/hooks/useAPM';

vi.spyOn(useAPM, 'useAssets').mockReturnValue({
  data: {
    data: [mockAsset1, mockAsset2],
    total: 2,
    page: 1,
    pageSize: 20,
  },
  loading: false,
  error: null,
  refetch: vi.fn(),
});
```

## Performance Tips

1. **Use pagination** to limit result set sizes
2. **Filter at the database level** rather than in the UI
3. **Memoize expensive computations** on the returned data
4. **Debounce search inputs** to reduce query frequency

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

function AssetSearch() {
  const [search, setSearch] = useState('');
  const { data, loading } = useAssets({ search });

  const debouncedSetSearch = useMemo(
    () => debounce(setSearch, 300),
    []
  );

  return (
    <input
      onChange={e => debouncedSetSearch(e.target.value)}
      placeholder="Search assets..."
    />
  );
}
```

## Support

For issues or questions:
- Check the implementation in `src/hooks/useAPM.ts`
- Review the type definitions in `src/types/apm.ts`
- See the design document at `.kiro/specs/apm-transmission-full/design.md`
- Run tests: `npm test -- src/hooks/__tests__/useAPM.test.ts`

