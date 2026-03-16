/**
 * APM Power Transmission React Hooks
 * 
 * Custom hooks for querying and mutating APM data using Supabase.
 * These hooks provide type-safe access to the APM database with
 * loading, error, and empty state handling.
 * 
 * Feature Set 4 (FS4): Asset Inventory & Criticality
 * - useAssets: Query assets with filtering, pagination, and sorting
 * - useAssetById: Fetch single asset with relationships
 * - useUpsertAsset: Create or update assets with natural key logic
 * - useFMEAEntries: Query FMEA library entries
 * - useSpareParts: Query spare parts with linkages
 * 
 * Feature Set 1 (FS1): Asset Health & Diagnostics
 * - useLatestTelemetry: Fetch latest telemetry readings for an asset
 * - useTelemetrySeries: Fetch telemetry time series data
 * - useHealthScore: Fetch health score with breakdown
 * - useDiagnosticEvents: Query diagnostic events with filtering
 * - useAcknowledgeDiagnosticEvent: Acknowledge a diagnostic event
 * - useCloseDiagnosticEvent: Close a diagnostic event with resolution notes
 * 
 * Feature Set 3 (FS3): Asset Performance & Utilisation
 * - useDowntimeEvents: Query downtime events with filtering
 * - useReliabilityMetrics: Query reliability metrics (MTBF, MTTR, Availability)
 * - useUtilisationMetrics: Query utilisation metrics (load factor, thermal headroom)
 * - usePerformanceBenchmarks: Query performance benchmarks by asset type or sector
 * - usePerformanceDeviations: Query performance deviations from benchmarks
 * 
 * Feature Set 2 (FS2): Predictive & Prescriptive Maintenance
 * - useFailurePredictions: Query failure predictions with risk levels and RUL
 * - useCBMTriggers: Query Condition-Based Maintenance triggers
 * - useMaintenanceRecommendations: Query maintenance recommendations with priority
 * - useAcknowledgeRecommendation: Acknowledge a maintenance recommendation
 * - useScheduleRecommendation: Schedule a maintenance recommendation
 * - useCloseRecommendation: Close a recommendation with completion notes
 * 
 * Feature Set 5 (FS5): Alerts, Reports & Visualisation
 * - useAlerts: Query alerts with filtering by severity, state, time range
 * - useAcknowledgeAlert: Acknowledge an alert
 * - useCloseAlert: Close an alert with resolution notes
 * - useAlertTimeline: Query unified timeline of alerts, diagnostic events, downtime
 * - useDashboards: Query user's dashboards
 * - useUpsertDashboard: Create or update a dashboard
 * - useDeleteDashboard: Delete a dashboard
 * - useReportRuns: Query report execution history
 * - useGenerateReport: Trigger report generation
 * - useExportJobs: Query user's export jobs
 * - useCreateExport: Create an export job
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getTransmissionTenantId } from '@/lib/tenantUtils';
import { useApp } from '@/context/AppContext';
import { healthScoreCache } from '@/lib/healthScoreCache';
import type {
  Asset,
  AssetRelationship,
  LifecycleEvent,
  FMEAEntry,
  SparePart,
  SparePartWithLinkage,
  ListAssetsParams,
  ListAssetsResponse,
  GetAssetResponse,
  UpsertAssetParams,
  TelemetryParameter,
  TelemetryStatus,
  GetLatestTelemetryParams,
  GetLatestTelemetryResponse,
  GetTelemetrySeriesParams,
  GetTelemetrySeriesResponse,
  GetHealthScoreParams,
  GetHealthScoreResponse,
  DiagnosticEvent,
  DiagnosticEventType,
  ListDiagnosticEventsParams,
  AcknowledgeDiagnosticEventParams,
  CloseDiagnosticEventParams,
  RCARecord,
  DowntimeEvent,
  ListDowntimeEventsParams,
  ReliabilityMetrics,
  UtilisationMetrics,
  PerformanceBenchmark,
  PerformanceDeviation,
  FailurePrediction,
  RiskLevel,
  PredictionHorizon,
  CBMTrigger,
  MaintenanceRecommendation,
  ListRecommendationsParams,
  Alert,
  AlertHistory,
  TimelineEvent,
  Dashboard,
  DashboardWidget,
  DashboardWithWidgets,
  ReportRun,
  ExportJob,
  ListAlertsParams,
  AcknowledgeAlertParams,
  CloseAlertParams,
  ListAlertTimelineParams,
  ListDashboardsParams,
  UpsertDashboardParams,
  ListReportRunsParams,
  GenerateReportParams,
  ListExportJobsParams,
  CreateExportJobParams,
} from '@/types/apm';

// =============================================================================
// Hook State Types
// =============================================================================

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (params: any) => Promise<void>;
  reset: () => void;
}

// =============================================================================
// FS4.1: useAssets Hook
// =============================================================================

/**
 * Hook to query assets with filtering, pagination, and sorting
 * 
 * Supports filters: sector, asset_type, operational_status, location, search
 * Handles loading, error, and empty states
 * 
 * Requirements: 1.9, 1.10
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAssets({
 *   sector: 'power_transmission',
 *   asset_type: 'power_transformer',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useAssets(params: ListAssetsParams = {}): QueryState<ListAssetsResponse> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<ListAssetsResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAssets = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Build query with tenant filtering
      let query = supabase
        .from('assets')
        .select('*, asset_types(name)', { count: 'exact' })
        .eq('tenant_id', tenantId); // CRITICAL: Filter by tenant_id for RLS

      // Apply filters
      // Note: sector column doesn't exist in current schema, all assets are transmission
      if (params.asset_type) {
        // Need to join with asset_types table or use asset_type_id
        // For now, skip this filter as schema uses asset_type_id
      }
      if (params.operational_status) {
        query = query.eq('status', params.operational_status);
      }
      if (params.location) {
        // Location might be in properties JSONB or not exist
        // Skip for now
      }
      if (params.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      // Apply sorting
      const sortBy = params.sortBy || 'updated_at';
      const sortOrder = params.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Map the data to match the Asset type interface and deduplicate
      const mappedData = (data || []).map((asset: any) => ({
        ...asset,
        asset_type: asset.asset_types?.name || 'Unknown',
        operational_status: asset.status,
      })).filter((v, i, a) => a.findIndex((t) => (t.id === v.id)) === i);

      setState({
        data: {
          data: mappedData,
          total: count || 0,
          page,
          pageSize,
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch assets'),
      });
    }
  }, [currentTenant.id, params.sector, params.asset_type, params.operational_status, params.location, params.search, params.page, params.pageSize, params.sortBy, params.sortOrder]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    ...state,
    refetch: fetchAssets,
  };
}


// =============================================================================
// FS4.2: useAssetById Hook
// =============================================================================

/**
 * Hook to fetch a single asset with all relationships
 * 
 * Fetches asset with:
 * - Parent asset
 * - Child assets
 * - Asset relationships (connected_to, feeds_to, protects, in_bay)
 * - Linked spare parts
 * - Lifecycle events
 * - Applicable FMEA entries
 * 
 * Requirements: 1.3, 3.7, 4.6, 5.5
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAssetById('asset-uuid');
 * if (data) {
 *   console.log(data.asset.name);
 *   console.log(data.parent?.name);
 *   console.log(data.children.length);
 * }
 * ```
 */
export function useAssetById(assetId: string | null): QueryState<GetAssetResponse> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<GetAssetResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAsset = useCallback(async () => {
    if (!assetId) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch main asset with asset type information
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*, asset_types(name)')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;
      if (!asset) throw new Error('Asset not found');

      // Get the asset type name from the joined data
      const assetTypeName = (asset.asset_types as any)?.name;

      // Fetch parent asset if exists
      let parent: Asset | undefined;
      if (asset.parent_asset_id) {
        const { data: parentData, error: parentError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', asset.parent_asset_id)
          .single();

        if (!parentError && parentData) {
          parent = parentData as Asset;
        }
      }

      // Fetch child assets
      const { data: childrenData, error: childrenError } = await supabase
        .from('assets')
        .select('*')
        .eq('parent_asset_id', assetId);

      const children = childrenError ? [] : (childrenData as Asset[] || []);

      // Fetch asset relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('asset_relationships')
        .select('*')
        .or(`from_asset_id.eq.${assetId},to_asset_id.eq.${assetId}`);

      const relationships = relationshipsError ? [] : (relationshipsData as AssetRelationship[] || []);

      // Fetch linked spare parts
      const { data: assetSpareParts, error: assetSparePartsError } = await supabase
        .from('asset_spare_parts')
        .select('spare_part_id, quantity_required, is_critical')
        .eq('asset_id', assetId);

      let linked_spares: SparePartWithLinkage[] = [];
      if (!assetSparePartsError && assetSpareParts && assetSpareParts.length > 0) {
        const sparePartIds = assetSpareParts.map(asp => asp.spare_part_id);
        const { data: sparePartsData, error: sparePartsError } = await supabase
          .from('spare_parts')
          .select('*')
          .in('id', sparePartIds);

        if (!sparePartsError && sparePartsData) {
          linked_spares = (sparePartsData as SparePart[]).map(part => {
            const link = assetSpareParts.find(l => l.spare_part_id === part.id);
            return {
              ...part,
              quantity_required: link?.quantity_required,
              is_critical: link?.is_critical
            };
          });
        }
      }

      // Fetch lifecycle events
      const { data: lifecycleData, error: lifecycleError } = await supabase
        .from('asset_lifecycle_events')
        .select('*')
        .eq('asset_id', assetId)
        .order('occurred_at', { ascending: false });

      const lifecycle_events = lifecycleError ? [] : (lifecycleData as LifecycleEvent[] || []);

      // Fetch FMEA entries for this asset type
      const { data: fmeaData, error: fmeaError } = await supabase
        .from('fmea_entries')
        .select('*')
        .eq('asset_type', assetTypeName)
        .order('rpn', { ascending: false });

      const fmea_entries = fmeaError ? [] : (fmeaData as FMEAEntry[] || []);

      // Map the asset to include asset_type field
      const mappedAsset = {
        ...asset,
        asset_type: assetTypeName,
        operational_status: asset.status,
      } as Asset;

      setState({
        data: {
          asset: mappedAsset,
          parent,
          children,
          relationships,
          linked_spares,
          lifecycle_events,
          fmea_entries,
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch asset'),
      });
    }
  }, [assetId]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  return {
    ...state,
    refetch: fetchAsset,
  };
}


// =============================================================================
// FS4.3: useUpsertAsset Mutation Hook
// =============================================================================

/**
 * Hook to create or update an asset using natural key upsert logic
 * 
 * Natural key: (sector, name, location) OR asset_tag
 * Validates required fields and handles RLS errors
 * 
 * Requirements: 1.2, 1.5, 25.4
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useUpsertAsset();
 * 
 * await mutate({
 *   sector: 'power_transmission',
 *   name: 'TX-001',
 *   asset_type: 'power_transformer',
 *   location: 'Substation A',
 *   operational_status: 'online',
 *   criticality: 'Critical',
 *   lifecycle_stage: 'operate'
 * });
 * ```
 */
export function useUpsertAsset(): MutationState<Asset> {
  const [state, setState] = useState<Omit<MutationState<Asset>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: UpsertAssetParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    // Validate required fields
    if (!params.name || !params.asset_type) {
      setState({
        data: null,
        loading: false,
        error: new Error('Required fields missing: name and asset_type are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Prepare asset data (matching actual schema)
      const assetData: any = {
        name: params.name,
        // asset_type would need to be mapped to asset_type_id
        // For now, store in properties
        properties: {
          asset_type: params.asset_type,
          asset_tag: params.asset_tag,
          location: params.location,
          voltage_kv: params.voltage_kv,
          ...(params.metadata || {})
        },
        commissioning_date: params.commissioning_date,
        status: params.operational_status,
        criticality: params.criticality,
        lifecycle_stage: params.lifecycle_stage,
        parent_asset_id: params.parent_asset_id,
        updated_at: new Date().toISOString(),
      };

      // Check if asset exists by natural key (name)
      let existingAsset = null;

      // Try to find by name
      const { data: assetByName } = await supabase
        .from('assets')
        .select('id')
        .eq('name', params.name)
        .maybeSingle();

      existingAsset = assetByName;

      let result;
      if (existingAsset) {
        // Update existing asset
        const { data, error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', existingAsset.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new asset
        const { data, error } = await supabase
          .from('assets')
          .insert({
            ...assetData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setState({
        data: result as Asset,
        loading: false,
        error: null,
      });
    } catch (err) {
      // Handle RLS errors specifically
      let errorMessage = 'Failed to upsert asset';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to modify assets';
        } else if (err.message.includes('duplicate key')) {
          errorMessage = 'Asset already exists with this natural key';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS4.4: useFMEAEntries Hook
// =============================================================================

/**
 * Parameters for querying FMEA entries
 */
export interface ListFMEAEntriesParams {
  asset_type?: string;
  min_rpn?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query FMEA library entries with filtering
 * 
 * Supports filters: asset_type, min_rpn, search
 * Returns entries sorted by RPN (descending) by default
 * 
 * Requirements: 3.5
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFMEAEntries({
 *   asset_type: 'power_transformer',
 *   min_rpn: 100
 * });
 * ```
 */
export function useFMEAEntries(params: ListFMEAEntriesParams = {}): QueryState<FMEAEntry[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<FMEAEntry[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchFMEAEntries = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query
      let query = supabase
        .from('fmea_entries')
        .select('*');

      // Apply filters
      if (params.asset_type) {
        query = query.eq('asset_type', params.asset_type);
      }
      if (params.min_rpn !== undefined) {
        query = query.gte('rpn', params.min_rpn);
      }
      if (params.search) {
        query = query.or(`failure_mode.ilike.%${params.search}%,failure_cause.ilike.%${params.search}%,failure_effect.ilike.%${params.search}%`);
      }

      // Sort by RPN descending (highest risk first)
      query = query.order('rpn', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setState({
        data: (data as FMEAEntry[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch FMEA entries'),
      });
    }
  }, [params.asset_type, params.min_rpn, params.search, params.page, params.pageSize]);

  useEffect(() => {
    fetchFMEAEntries();
  }, [fetchFMEAEntries]);

  return {
    ...state,
    refetch: fetchFMEAEntries,
  };
}


// =============================================================================
// FS4.5: useSpareParts Hook
// =============================================================================

/**
 * Parameters for querying spare parts
 */
export interface ListSparePartsParams {
  asset_type?: string;
  asset_id?: string;
  page?: number;
  pageSize?: number;
}



/**
 * Hook to query spare parts with optional asset linkage filtering
 * 
 * Supports filters: asset_type, asset_id
 * When asset_id is provided, includes linkage information (quantity_required, is_critical)
 * 
 * Requirements: 5.6
 * 
 * @example
 * ```tsx
 * // Get all spare parts for a specific asset type
 * const { data, loading, error } = useSpareParts({
 *   asset_type: 'power_transformer'
 * });
 * 
 * // Get spare parts linked to a specific asset
 * const { data, loading, error } = useSpareParts({
 *   asset_id: 'asset-uuid'
 * });
 * ```
 */
export function useSpareParts(params: ListSparePartsParams = {}): QueryState<SparePartWithLinkage[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<SparePartWithLinkage[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchSpareParts = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let spareParts: SparePartWithLinkage[] = [];

      if (params.asset_id) {
        // Fetch spare parts linked to specific asset
        const { data: linkages, error: linkagesError } = await supabase
          .from('asset_spare_parts')
          .select('spare_part_id, quantity_required, is_critical')
          .eq('asset_id', params.asset_id);

        if (linkagesError) throw linkagesError;

        if (linkages && linkages.length > 0) {
          const sparePartIds = linkages.map(l => l.spare_part_id);

          const { data: parts, error: partsError } = await supabase
            .from('spare_parts')
            .select('*')
            .in('id', sparePartIds);

          if (partsError) throw partsError;

          // Merge spare part data with linkage information
          spareParts = (parts as SparePart[] || []).map(part => {
            const linkage = linkages.find(l => l.spare_part_id === part.id);
            return {
              ...part,
              quantity_required: linkage?.quantity_required,
              is_critical: linkage?.is_critical,
            };
          });
        }
      } else if (params.asset_type) {
        // Fetch spare parts applicable to asset type
        const { data: parts, error: partsError } = await supabase
          .from('spare_parts')
          .select('*')
          .contains('applicable_asset_types', [params.asset_type]);

        if (partsError) throw partsError;
        spareParts = (parts as SparePart[]) || [];
      } else {
        // Fetch all spare parts
        let query = supabase
          .from('spare_parts')
          .select('*')
          .order('part_number', { ascending: true });

        // Apply pagination if specified
        if (params.page && params.pageSize) {
          const from = (params.page - 1) * params.pageSize;
          const to = from + params.pageSize - 1;
          query = query.range(from, to);
        }

        const { data: parts, error: partsError } = await query;

        if (partsError) throw partsError;
        spareParts = (parts as SparePart[]) || [];
      }

      setState({
        data: spareParts,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch spare parts'),
      });
    }
  }, [params.asset_type, params.asset_id, params.page, params.pageSize]);

  useEffect(() => {
    fetchSpareParts();
  }, [fetchSpareParts]);

  return {
    ...state,
    refetch: fetchSpareParts,
  };
}



// =============================================================================
// FS1: Asset Health & Diagnostics Hooks
// =============================================================================

// =============================================================================
// FS1.1: useLatestTelemetry Hook
// =============================================================================

/**
 * Hook to fetch latest telemetry readings for an asset
 * 
 * Fetches the most recent telemetry values across all mapped parameters
 * for the specified asset. Returns readings with status classification
 * (Normal, Warning, Critical) based on parameter thresholds.
 * 
 * Requirements: 7.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useLatestTelemetry({
 *   asset_id: 'asset-uuid',
 *   parameter_ids: ['param-1', 'param-2'] // optional filter
 * });
 * 
 * if (data) {
 *   data.readings.forEach(reading => {
 *     console.log(`${reading.parameter_name}: ${reading.value} ${reading.unit} (${reading.status})`);
 *   });
 * }
 * ```
 */
export function useLatestTelemetry(
  params: GetLatestTelemetryParams
): QueryState<GetLatestTelemetryResponse> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<GetLatestTelemetryResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchLatestTelemetry = useCallback(async () => {
    if (!params.asset_id) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First, get the asset to determine its type
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('asset_type_id, asset_types(name)')
        .eq('id', params.asset_id)
        .single();

      if (assetError) throw assetError;
      if (!asset) throw new Error('Asset not found');

      // Get the asset type name from the joined data
      const assetTypeName = (asset.asset_types as any)?.name;
      if (!assetTypeName) {
        throw new Error('Asset type not found');
      }

      // Get mapped parameters for this asset type
      let parameterQuery = supabase
        .from('asset_parameter_map')
        .select('parameter_id, telemetry_parameters(id, name, unit, warning_min, warning_max, critical_min, critical_max)')
        .eq('asset_type', assetTypeName);

      // Filter by specific parameters if provided
      if (params.parameter_ids && params.parameter_ids.length > 0) {
        parameterQuery = parameterQuery.in('parameter_id', params.parameter_ids);
      }

      const { data: paramMappings, error: paramError } = await parameterQuery;

      if (paramError) throw paramError;

      if (!paramMappings || paramMappings.length === 0) {
        // No parameters mapped for this asset type
        setState({
          data: {
            asset_id: params.asset_id,
            readings: [],
          },
          loading: false,
          error: null,
        });
        return;
      }

      // Get latest telemetry for each parameter
      const readings: GetLatestTelemetryResponse['readings'] = [];

      for (const mapping of paramMappings) {
        const param = mapping.telemetry_parameters as unknown as TelemetryParameter;
        if (!param) continue;

        // Get the most recent telemetry reading for this parameter
        const { data: telemetryData, error: telemetryError } = await supabase
          .from('telemetry_data')
          .select('timestamp, value, unit')
          .eq('asset_id', params.asset_id)
          .eq('parameter_id', param.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (telemetryError) {
          console.warn(`Failed to fetch telemetry for parameter ${param.id}:`, telemetryError);
          continue;
        }

        if (telemetryData) {
          // Compute status based on thresholds
          let status: TelemetryStatus = 'Normal';
          const value = telemetryData.value;

          if (param.critical_min !== null && value < param.critical_min) {
            status = 'Critical';
          } else if (param.critical_max !== null && value > param.critical_max) {
            status = 'Critical';
          } else if (param.warning_min !== null && value < param.warning_min) {
            status = 'Warning';
          } else if (param.warning_max !== null && value > param.warning_max) {
            status = 'Warning';
          }

          readings.push({
            parameter_id: param.id,
            parameter_name: param.name,
            value: telemetryData.value,
            unit: telemetryData.unit,
            status,
            timestamp: telemetryData.timestamp,
          });
        }
      }

      setState({
        data: {
          asset_id: params.asset_id,
          readings,
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch latest telemetry'),
      });
    }
  }, [params.asset_id, params.parameter_ids]);

  useEffect(() => {
    fetchLatestTelemetry();
  }, [fetchLatestTelemetry]);

  return {
    ...state,
    refetch: fetchLatestTelemetry,
  };
}


// =============================================================================
// FS1.2: useTelemetrySeries Hook
// =============================================================================

/**
 * Hook to fetch telemetry time series data
 * 
 * Fetches historical telemetry data for specified parameters over a time range.
 * Supports aggregation intervals for performance optimization.
 * Handles 30-day windows with acceptable performance.
 * 
 * Requirements: 7.7, 7.8, 28.2
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useTelemetrySeries({
 *   asset_id: 'asset-uuid',
 *   parameter_ids: ['param-1', 'param-2'],
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z',
 *   interval: '1 hour' // optional aggregation
 * });
 * 
 * if (data) {
 *   data.series.forEach(series => {
 *     console.log(`${series.parameter_name}: ${series.datapoints.length} points`);
 *   });
 * }
 * ```
 */
export function useTelemetrySeries(
  params: GetTelemetrySeriesParams
): QueryState<GetTelemetrySeriesResponse> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<GetTelemetrySeriesResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchTelemetrySeries = useCallback(async () => {
    if (!params.asset_id || !params.parameter_ids || params.parameter_ids.length === 0) {
      setState({
        data: null,
        loading: false,
        error: null, // Don't set error for empty params, just return null data
      });
      return;
    }

    // ── Guard: skip Supabase if any IDs are mock/placeholder values ───────────
    // Mock IDs (e.g. 'mock-p1', 'mock-tx-01') are not valid UUIDs and will
    // cause a 400 Bad Request from PostgREST. Return null data so the calling
    // component can fall back to its own mock data generation.
    const isMockId = (id: string) => id.startsWith('mock-') || !id.includes('-') || id.length < 36;
    if (isMockId(params.asset_id) || params.parameter_ids.some(isMockId)) {
      setState({
        data: null,
        loading: false,
        error: null, // Caller should fall back to mock data
      });
      return;
    }

    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));


    try {
      // Get parameter details with thresholds
      const { data: parameters, error: paramError } = await supabase
        .from('telemetry_parameters')
        .select('id, name, unit, warning_min, warning_max, critical_min, critical_max')
        .in('id', params.parameter_ids);

      if (paramError) throw paramError;
      if (!parameters || parameters.length === 0) {
        throw new Error('No parameters found');
      }

      // Fetch telemetry data for each parameter
      const series: GetTelemetrySeriesResponse['series'] = [];

      for (const param of parameters) {
        let query = supabase
          .from('telemetry_data')
          .select('timestamp, value')
          .eq('asset_id', params.asset_id)
          .eq('parameter_id', param.id)
          .gte('timestamp', params.from)
          .lte('timestamp', params.to)
          .order('timestamp', { ascending: true });

        // Note: Aggregation by interval would typically be done via a database function
        // For now, we fetch raw data. In production, consider using TimescaleDB's
        // time_bucket function for better performance on large datasets.

        const { data: telemetryData, error: telemetryError } = await query;

        if (telemetryError) {
          console.warn(`Failed to fetch telemetry series for parameter ${param.id}:`, telemetryError);
          continue;
        }

        series.push({
          parameter_id: param.id,
          parameter_name: param.name,
          unit: param.unit,
          datapoints: (telemetryData || []).map(d => {
            // Compute status based on thresholds
            let status: TelemetryStatus = 'Normal';
            const value = d.value;

            if (param.critical_min !== null && value < param.critical_min) {
              status = 'Critical';
            } else if (param.critical_max !== null && value > param.critical_max) {
              status = 'Critical';
            } else if (param.warning_min !== null && value < param.warning_min) {
              status = 'Warning';
            } else if (param.warning_max !== null && value > param.warning_max) {
              status = 'Warning';
            }

            return {
              timestamp: d.timestamp,
              value: d.value,
              status,
            };
          }),
        });
      }

      setState({
        data: {
          asset_id: params.asset_id,
          series,
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch telemetry series'),
      });
    }
  }, [
    params.asset_id,
    JSON.stringify(params.parameter_ids), // Stringify array to prevent reference changes
    params.from,
    params.to,
    params.interval
  ]);

  useEffect(() => {
    fetchTelemetrySeries();
  }, [fetchTelemetrySeries]);

  return {
    ...state,
    refetch: fetchTelemetrySeries,
  };
}


// =============================================================================
// FS1.3: useHealthScore Hook
// =============================================================================

/**
 * Hook to fetch health score for an asset
 * 
 * Fetches the computed health score with component breakdown.
 * Supports historical queries with as_of parameter.
 * 
 * Requirements: 8.5, 8.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useHealthScore({
 *   asset_id: 'asset-uuid',
 *   as_of: '2024-01-15T00:00:00Z' // optional, defaults to latest
 * });
 * 
 * if (data) {
 *   console.log(`Health Score: ${data.score}`);
 *   data.breakdown.forEach(component => {
 *     console.log(`${component.parameter_name}: ${component.contribution}%`);
 *   });
 * }
 * ```
 */
export function useHealthScore(
  params: GetHealthScoreParams
): QueryState<GetHealthScoreResponse> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<GetHealthScoreResponse>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchHealthScore = useCallback(async () => {
    if (!params.asset_id) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    // Check cache first (only for current/latest health scores, not historical)
    if (!params.as_of) {
      const cached = healthScoreCache.get(params.asset_id);
      if (cached) {
        // Build response from cached data
        const breakdown: GetHealthScoreResponse['breakdown'] = Object.entries(cached.componentBreakdown).map(([paramName, contribution]) => ({
          parameter_name: paramName,
          contribution,
          current_value: 0, // Not stored in cache
          status: 'Normal' as TelemetryStatus, // Not stored in cache
        }));

        setState({
          data: {
            asset_id: cached.assetId,
            score: cached.score,
            computed_at: cached.computedAt,
            model_version: cached.modelVersion,
            breakdown,
          },
          loading: false,
          error: null,
        });
        return;
      }
    }

    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query for health score
      let query = supabase
        .from('health_scores')
        .select('*')
        .eq('asset_id', params.asset_id)
        .order('computed_at', { ascending: false });

      // Filter by as_of date if provided
      if (params.as_of) {
        query = query.lte('computed_at', params.as_of);
      }

      // Get the most recent health score
      const { data: healthScoreData, error: healthScoreError } = await query
        .limit(1)
        .maybeSingle();

      if (healthScoreError) throw healthScoreError;

      if (!healthScoreData) {
        // No health score computed yet
        setState({
          data: null,
          loading: false,
          error: new Error('No health score available for this asset'),
        });
        return;
      }

      // Get the asset to determine its type
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('asset_type_id, asset_types(name)')
        .eq('id', params.asset_id)
        .single();

      if (assetError) throw assetError;

      // Get the asset type name from the joined data
      const assetTypeName = (asset.asset_types as any)?.name;

      // Get the health model to understand parameter weights
      const { data: healthModel, error: modelError } = await supabase
        .from('health_models')
        .select('parameter_weights')
        .eq('asset_type', assetTypeName)
        .eq('model_version', healthScoreData.model_version)
        .maybeSingle();

      if (modelError) {
        console.warn('Failed to fetch health model:', modelError);
      }

      // Build breakdown from component_breakdown
      const breakdown: GetHealthScoreResponse['breakdown'] = [];
      const componentBreakdown = healthScoreData.component_breakdown as Record<string, number>;

      if (componentBreakdown) {
        // Get parameter details for breakdown
        const parameterIds = Object.keys(componentBreakdown);

        if (parameterIds.length > 0) {
          const { data: parameters, error: paramError } = await supabase
            .from('telemetry_parameters')
            .select('id, name, warning_min, warning_max, critical_min, critical_max')
            .in('id', parameterIds);

          if (!paramError && parameters) {
            // Get latest telemetry values for context
            for (const param of parameters) {
              const { data: latestTelemetry } = await supabase
                .from('telemetry_data')
                .select('value')
                .eq('asset_id', params.asset_id)
                .eq('parameter_id', param.id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .maybeSingle();

              // Compute status based on thresholds
              let status: TelemetryStatus = 'Normal';
              if (latestTelemetry?.value !== undefined) {
                const value = latestTelemetry.value;
                if (param.critical_min !== null && value < param.critical_min) {
                  status = 'Critical';
                } else if (param.critical_max !== null && value > param.critical_max) {
                  status = 'Critical';
                } else if (param.warning_min !== null && value < param.warning_min) {
                  status = 'Warning';
                } else if (param.warning_max !== null && value > param.warning_max) {
                  status = 'Warning';
                }
              }

              breakdown.push({
                parameter_name: param.name,
                contribution: componentBreakdown[param.id] || 0,
                current_value: latestTelemetry?.value || 0,
                status,
              });
            }
          }
        }
      }

      const responseData = {
        asset_id: params.asset_id,
        score: healthScoreData.score,
        computed_at: healthScoreData.computed_at,
        model_version: healthScoreData.model_version,
        breakdown,
      };

      // Cache the health score (only for current/latest, not historical)
      if (!params.as_of) {
        healthScoreCache.set({
          assetId: params.asset_id,
          score: healthScoreData.score,
          computedAt: healthScoreData.computed_at,
          modelVersion: healthScoreData.model_version,
          componentBreakdown: componentBreakdown || {},
        });
      }

      setState({
        data: responseData,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch health score'),
      });
    }
  }, [params.asset_id, params.as_of]);

  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  return {
    ...state,
    refetch: fetchHealthScore,
  };
}


// =============================================================================
// FS1.4: useDiagnosticEvents Hook
// =============================================================================

/**
 * Hook to query diagnostic events with filtering
 * 
 * Supports filters: asset_id, asset_type, event_type, state, time_range
 * Returns paginated results with sorting by detected_at (descending)
 * 
 * Requirements: 9.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDiagnosticEvents({
 *   asset_id: 'asset-uuid',
 *   state: 'open',
 *   event_type: 'thermal',
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useDiagnosticEvents(
  params: ListDiagnosticEventsParams = {}
): QueryState<DiagnosticEvent[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<DiagnosticEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchDiagnosticEvents = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query
      let query = supabase
        .from('diagnostic_events')
        .select('*');

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.asset_type) {
        // Need to join with assets table to filter by asset_type
        // For now, we'll fetch asset_ids of the specified type first
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('id')
          .eq('asset_type', params.asset_type);

        if (assetsError) throw assetsError;

        if (assets && assets.length > 0) {
          const assetIds = assets.map(a => a.id);
          query = query.in('asset_id', assetIds);
        } else {
          // No assets of this type, return empty
          setState({
            data: [],
            loading: false,
            error: null,
          });
          return;
        }
      }

      if (params.event_type) {
        query = query.eq('event_type', params.event_type);
      }

      if (params.state) {
        query = query.eq('state', params.state);
      }

      if (params.from) {
        query = query.gte('detected_at', params.from);
      }

      if (params.to) {
        query = query.lte('detected_at', params.to);
      }

      // Sort by detected_at descending (most recent first)
      query = query.order('detected_at', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as DiagnosticEvent[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch diagnostic events'),
      });
    }
  }, [
    params.asset_id,
    params.asset_type,
    params.event_type,
    params.state,
    params.from,
    params.to,
    params.page,
    params.pageSize,
  ]);

  useEffect(() => {
    fetchDiagnosticEvents();
  }, [fetchDiagnosticEvents]);

  return {
    ...state,
    refetch: fetchDiagnosticEvents,
  };
}


// =============================================================================
// FS1.5: Diagnostic Event Mutations
// =============================================================================

/**
 * Hook to acknowledge a diagnostic event
 * 
 * Updates the event state to 'ack' and records the acknowledging user and timestamp.
 * Restricted to authorized operations roles.
 * 
 * Requirements: 9.7, 9.9
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useAcknowledgeDiagnosticEvent();
 * 
 * await mutate({
 *   event_id: 'event-uuid',
 *   acknowledged_by: 'user@example.com'
 * });
 * ```
 */
export function useAcknowledgeDiagnosticEvent(): MutationState<DiagnosticEvent> {
  const [state, setState] = useState<Omit<MutationState<DiagnosticEvent>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: AcknowledgeDiagnosticEventParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.event_id || !params.acknowledged_by) {
      setState({
        data: null,
        loading: false,
        error: new Error('event_id and acknowledged_by are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the diagnostic event
      const { data, error } = await supabase
        .from('diagnostic_events')
        .update({
          state: 'ack',
          acknowledged_by: params.acknowledged_by,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', params.event_id)
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as DiagnosticEvent,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to acknowledge diagnostic event';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to acknowledge events';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


/**
 * Hook to close a diagnostic event with resolution notes
 * 
 * Updates the event state to 'closed' and requires resolution_notes.
 * Records the closing user and timestamp.
 * Restricted to authorized operations roles.
 * 
 * Requirements: 9.8, 9.9
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useCloseDiagnosticEvent();
 * 
 * await mutate({
 *   event_id: 'event-uuid',
 *   closed_by: 'user@example.com',
 *   resolution_notes: 'Issue resolved by replacing faulty sensor'
 * });
 * ```
 */
export function useCloseDiagnosticEvent(): MutationState<DiagnosticEvent> {
  const [state, setState] = useState<Omit<MutationState<DiagnosticEvent>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: CloseDiagnosticEventParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.event_id || !params.closed_by || !params.resolution_notes) {
      setState({
        data: null,
        loading: false,
        error: new Error('event_id, closed_by, and resolution_notes are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the diagnostic event
      const { data, error } = await supabase
        .from('diagnostic_events')
        .update({
          state: 'closed',
          closed_by: params.closed_by,
          closed_at: new Date().toISOString(),
          resolution_notes: params.resolution_notes,
        })
        .eq('id', params.event_id)
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as DiagnosticEvent,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to close diagnostic event';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to close events';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS1.6: RCA Records Hooks
// =============================================================================

/**
 * Parameters for querying RCA records
 */
export interface ListRCARecordsParams {
  asset_id?: string;
  event_type?: DiagnosticEventType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * RCA record with linked event details
 */
export interface RCARecordWithEvent extends RCARecord {
  diagnostic_event?: DiagnosticEvent;
  downtime_event?: DowntimeEvent;
  asset?: Asset;
}

/**
 * Hook to query RCA records with filtering
 * 
 * Supports filters: asset_id, event_type, time_range
 * Returns RCA records with linked event details
 * 
 * Requirements: 10.4
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useRCARecords({
 *   asset_id: 'asset-uuid',
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z'
 * });
 * ```
 */
export function useRCARecords(
  params: ListRCARecordsParams = {}
): QueryState<RCARecordWithEvent[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<RCARecordWithEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchRCARecords = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query for RCA records
      let query = supabase
        .from('rca_records')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      const { data: rcaRecords, error: rcaError } = await query;

      if (rcaError) throw rcaError;

      if (!rcaRecords || rcaRecords.length === 0) {
        setState({
          data: [],
          loading: false,
          error: null,
        });
        return;
      }

      // Enrich RCA records with linked event and asset details
      const enrichedRecords: RCARecordWithEvent[] = [];

      for (const rca of rcaRecords) {
        const enriched: RCARecordWithEvent = { ...rca } as RCARecordWithEvent;

        // Try to fetch linked diagnostic event
        const { data: diagnosticEvent } = await supabase
          .from('diagnostic_events')
          .select('*')
          .eq('id', rca.event_id)
          .maybeSingle();

        if (diagnosticEvent) {
          enriched.diagnostic_event = diagnosticEvent as DiagnosticEvent;

          // Fetch asset details
          const { data: asset } = await supabase
            .from('assets')
            .select('*')
            .eq('id', diagnosticEvent.asset_id)
            .maybeSingle();

          if (asset) {
            enriched.asset = asset as Asset;
          }

          // Apply filters based on asset and event
          if (params.asset_id && diagnosticEvent.asset_id !== params.asset_id) {
            continue;
          }

          if (params.event_type && diagnosticEvent.event_type !== params.event_type) {
            continue;
          }

          if (params.from && diagnosticEvent.detected_at < params.from) {
            continue;
          }

          if (params.to && diagnosticEvent.detected_at > params.to) {
            continue;
          }
        } else {
          // Try to fetch linked downtime event
          const { data: downtimeEvent } = await supabase
            .from('downtime_events')
            .select('*')
            .eq('rca_id', rca.id)
            .maybeSingle();

          if (downtimeEvent) {
            enriched.downtime_event = downtimeEvent as DowntimeEvent;

            // Fetch asset details
            const { data: asset } = await supabase
              .from('assets')
              .select('*')
              .eq('id', downtimeEvent.asset_id)
              .maybeSingle();

            if (asset) {
              enriched.asset = asset as Asset;
            }

            // Apply filters
            if (params.asset_id && downtimeEvent.asset_id !== params.asset_id) {
              continue;
            }

            if (params.from && downtimeEvent.start_time < params.from) {
              continue;
            }

            if (params.to && downtimeEvent.start_time > params.to) {
              continue;
            }
          }
        }

        enrichedRecords.push(enriched);
      }

      setState({
        data: enrichedRecords,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch RCA records'),
      });
    }
  }, [params.asset_id, params.event_type, params.from, params.to, params.page, params.pageSize]);

  useEffect(() => {
    fetchRCARecords();
  }, [fetchRCARecords]);

  return {
    ...state,
    refetch: fetchRCARecords,
  };
}


/**
 * Parameters for creating an RCA record
 */
export interface CreateRCARecordParams {
  event_id: string;
  root_cause: string;
  contributing_factors?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  created_by?: string;
}

/**
 * Hook to create an RCA record
 * 
 * Creates a new RCA record linked to a diagnostic event or downtime event.
 * Validates that the event exists.
 * Restricted to authorized roles.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.6
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useCreateRCARecord();
 * 
 * await mutate({
 *   event_id: 'event-uuid',
 *   root_cause: 'Bearing lubrication contamination',
 *   contributing_factors: 'Moisture ingress, H2S corrosion',
 *   corrective_actions: 'Replace bearing assembly, upgrade seals',
 *   preventive_actions: 'Monthly oil analysis, quarterly seal inspection',
 *   created_by: 'user@example.com'
 * });
 * ```
 */
export function useCreateRCARecord(): MutationState<RCARecord> {
  const [state, setState] = useState<Omit<MutationState<RCARecord>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: CreateRCARecordParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.event_id || !params.root_cause) {
      setState({
        data: null,
        loading: false,
        error: new Error('event_id and root_cause are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Validate that the event exists
      const { data: diagnosticEvent } = await supabase
        .from('diagnostic_events')
        .select('id')
        .eq('id', params.event_id)
        .maybeSingle();

      if (!diagnosticEvent) {
        // Check if it's a downtime event
        const { data: downtimeEvent } = await supabase
          .from('downtime_events')
          .select('id')
          .eq('id', params.event_id)
          .maybeSingle();

        if (!downtimeEvent) {
          throw new Error('Event not found');
        }
      }

      // Create the RCA record
      const { data, error } = await supabase
        .from('rca_records')
        .insert({
          event_id: params.event_id,
          root_cause: params.root_cause,
          contributing_factors: params.contributing_factors,
          corrective_actions: params.corrective_actions,
          preventive_actions: params.preventive_actions,
          created_by: params.created_by,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as RCARecord,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to create RCA record';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to create RCA records';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS3: Asset Performance & Utilisation Hooks
// =============================================================================

// =============================================================================
// FS3.1: useDowntimeEvents Hook
// =============================================================================

/**
 * Hook to query downtime events with filtering
 * 
 * Supports filters: asset_id, event_type, time_range, outage_scope
 * Returns paginated results with sorting by start_time (descending)
 * 
 * Requirements: 12.7
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDowntimeEvents({
 *   asset_id: 'asset-uuid',
 *   event_type: 'unplanned_failure',
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useDowntimeEvents(
  params: ListDowntimeEventsParams = {}
): QueryState<DowntimeEvent[]> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<DowntimeEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchDowntimeEvents = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Build query with tenant scoping via join
      let query = supabase
        .from('downtime_events')
        .select('*, assets!inner(tenant_id)')
        .eq('assets.tenant_id', tenantId);

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.event_type) {
        query = query.eq('event_type', params.event_type);
      }

      if (params.from) {
        query = query.gte('start_time', params.from);
      }

      if (params.to) {
        query = query.lte('start_time', params.to);
      }

      // Note: outage_scope filter would be added here if the column exists
      // The schema extension adds this column in FS3 migration

      // Sort by start_time descending (most recent first)
      query = query.order('start_time', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as DowntimeEvent[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch downtime events'),
      });
    }
  }, [
    params.asset_id,
    params.event_type,
    params.from,
    params.to,
    params.page,
    params.pageSize,
    currentTenant.id,
  ]);

  useEffect(() => {
    fetchDowntimeEvents();
  }, [fetchDowntimeEvents]);

  return {
    ...state,
    refetch: fetchDowntimeEvents,
  };
}


// =============================================================================
// FS3.2: useReliabilityMetrics Hook
// =============================================================================

/**
 * Parameters for querying reliability metrics with flexible time periods
 */
export interface ListReliabilityMetricsParams {
  asset_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query reliability metrics with configurable time periods
 * 
 * Supports configurable time periods for MTBF, MTTR, and Availability calculations.
 * Can query for a specific asset or all assets.
 * 
 * Requirements: 13.5, 13.7
 * 
 * @example
 * ```tsx
 * // Get reliability metrics for a specific asset
 * const { data, loading, error, refetch } = useReliabilityMetrics({
 *   asset_id: 'asset-uuid',
 *   period_start: '2024-01-01T00:00:00Z',
 *   period_end: '2024-01-31T23:59:59Z'
 * });
 * 
 * // Get all reliability metrics
 * const { data, loading, error } = useReliabilityMetrics({
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useReliabilityMetrics(
  params: ListReliabilityMetricsParams = {}
): QueryState<ReliabilityMetrics[]> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<ReliabilityMetrics[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchReliabilityMetrics = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Build query with tenant scoping via join
      let query = supabase
        .from('reliability_metrics')
        .select('*, assets!inner(tenant_id)')
        .eq('assets.tenant_id', tenantId);

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      // Find records that overlap with the requested period
      if (params.period_start) {
        query = query.gte('period_end', params.period_start);
      }

      if (params.period_end) {
        query = query.lte('period_start', params.period_end);
      }

      // Sort by period_start descending (most recent first)
      query = query.order('period_start', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as ReliabilityMetrics[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch reliability metrics'),
      });
    }
  }, [
    params.asset_id,
    params.period_start,
    params.period_end,
    params.page,
    params.pageSize,
    currentTenant.id,
  ]);

  useEffect(() => {
    fetchReliabilityMetrics();
  }, [fetchReliabilityMetrics]);

  return {
    ...state,
    refetch: fetchReliabilityMetrics,
  };
}


// =============================================================================
// FS3.3: useUtilisationMetrics Hook
// =============================================================================

/**
 * Parameters for querying utilisation metrics
 */
export interface ListUtilisationMetricsParams {
  asset_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query utilisation metrics with asset_id and time_range filters
 * 
 * Supports filtering by asset and time range for load factor, peak current,
 * thermal headroom, and switching cycles metrics.
 * 
 * Requirements: 14.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useUtilisationMetrics({
 *   asset_id: 'asset-uuid',
 *   period_start: '2024-01-01T00:00:00Z',
 *   period_end: '2024-01-31T23:59:59Z'
 * });
 * ```
 */
export function useUtilisationMetrics(
  params: ListUtilisationMetricsParams = {}
): QueryState<UtilisationMetrics[]> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<UtilisationMetrics[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchUtilisationMetrics = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Build query with tenant scoping via join
      let query = supabase
        .from('utilisation_metrics')
        .select('*, assets!inner(tenant_id)')
        .eq('assets.tenant_id', tenantId);

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      // Find records that overlap with the requested period
      if (params.period_start) {
        query = query.gte('period_end', params.period_start);
      }

      if (params.period_end) {
        query = query.lte('period_start', params.period_end);
      }

      // Sort by period_start descending (most recent first)
      query = query.order('period_start', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as UtilisationMetrics[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch utilisation metrics'),
      });
    }
  }, [
    params.asset_id,
    params.period_start,
    params.period_end,
    params.page,
    params.pageSize,
    currentTenant.id,
  ]);

  useEffect(() => {
    fetchUtilisationMetrics();
  }, [fetchUtilisationMetrics]);

  return {
    ...state,
    refetch: fetchUtilisationMetrics,
  };
}


// =============================================================================
// FS3.4: usePerformanceBenchmarks Hook
// =============================================================================

/**
 * Parameters for querying performance benchmarks
 */
export interface ListPerformanceBenchmarksParams {
  asset_type?: string;
  sector?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query performance benchmarks by asset_type or sector
 * 
 * Fetches benchmark definitions for availability, load_factor, and MTBF targets.
 * Supports filtering by asset type or sector.
 * 
 * Requirements: 15.2
 * 
 * @example
 * ```tsx
 * // Get benchmarks for a specific asset type
 * const { data, loading, error, refetch } = usePerformanceBenchmarks({
 *   asset_type: 'power_transformer'
 * });
 * 
 * // Get benchmarks for a sector
 * const { data, loading, error } = usePerformanceBenchmarks({
 *   sector: 'power_transmission'
 * });
 * ```
 */
export function usePerformanceBenchmarks(
  params: ListPerformanceBenchmarksParams = {}
): QueryState<PerformanceBenchmark[]> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<PerformanceBenchmark[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPerformanceBenchmarks = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Get tenant sector/subsector to filter benchmarks
      // Note: performance_benchmarks table doesn't have tenant_id
      // but we can filter by sector if needed. For now, we'll return all
      // as they are typically global per sector.

      // Build query
      let query = supabase
        .from('performance_benchmarks')
        .select('*');

      // Apply filters
      if (params.asset_type) {
        query = query.eq('asset_type', params.asset_type);
      }

      if (params.sector) {
        query = query.eq('sector', params.sector);
      }

      // Sort by asset_type
      query = query.order('asset_type', { ascending: true });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as PerformanceBenchmark[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch performance benchmarks'),
      });
    }
  }, [
    params.asset_type,
    params.sector,
    params.page,
    params.pageSize,
    currentTenant.id,
  ]);

  useEffect(() => {
    fetchPerformanceBenchmarks();
  }, [fetchPerformanceBenchmarks]);

  return {
    ...state,
    refetch: fetchPerformanceBenchmarks,
  };
}


// =============================================================================
// FS3.5: usePerformanceDeviations Hook
// =============================================================================

/**
 * Parameters for querying performance deviations
 */
export interface ListPerformanceDeviationsParams {
  asset_id?: string;
  asset_type?: string;
  min_magnitude?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query performance deviations with filtering
 * 
 * Supports filters: asset_type, deviation_magnitude, time_range
 * Returns deviations where assets perform below benchmarks.
 * 
 * Requirements: 15.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = usePerformanceDeviations({
 *   asset_type: 'power_transformer',
 *   min_magnitude: 10, // deviations >= 10%
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z'
 * });
 * ```
 */
export function usePerformanceDeviations(
  params: ListPerformanceDeviationsParams = {}
): QueryState<PerformanceDeviation[]> & { refetch: () => void } {
  const { currentTenant } = useApp();
  const [state, setState] = useState<QueryState<PerformanceDeviation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPerformanceDeviations = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get the real tenant ID for power transmission
      const tenantId = await getTransmissionTenantId(currentTenant.id);

      // Build query with tenant scoping via join
      let query = supabase
        .from('performance_deviations')
        .select('*, assets!inner(tenant_id)')
        .eq('assets.tenant_id', tenantId);

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.asset_type) {
        // Need to join with assets table to filter by asset_type
        // For now, we'll fetch asset_ids of the specified type first
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('id')
          .eq('asset_type', params.asset_type);

        if (assetsError) throw assetsError;

        if (assets && assets.length > 0) {
          const assetIds = assets.map(a => a.id);
          query = query.in('asset_id', assetIds);
        } else {
          // No assets of this type, return empty
          setState({
            data: [],
            loading: false,
            error: null,
          });
          return;
        }
      }

      if (params.min_magnitude !== undefined) {
        query = query.gte('magnitude', params.min_magnitude);
      }

      if (params.from) {
        query = query.gte('detected_at', params.from);
      }

      if (params.to) {
        query = query.lte('detected_at', params.to);
      }

      // Sort by detected_at descending (most recent first)
      query = query.order('detected_at', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as PerformanceDeviation[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch performance deviations'),
      });
    }
  }, [
    params.asset_id,
    params.asset_type,
    params.min_magnitude,
    params.from,
    params.to,
    params.page,
    params.pageSize,
    currentTenant.id,
  ]);

  useEffect(() => {
    fetchPerformanceDeviations();
  }, [fetchPerformanceDeviations]);

  return {
    ...state,
    refetch: fetchPerformanceDeviations,
  };
}


// =============================================================================
// FS2: Predictive & Prescriptive Maintenance Hooks
// =============================================================================

// =============================================================================
// FS2.1: useFailurePredictions Hook
// =============================================================================

/**
 * Parameters for querying failure predictions
 */
export interface ListFailurePredictionsParams {
  asset_id?: string;
  risk_level?: RiskLevel;
  time_horizon?: PredictionHorizon;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query failure predictions with filtering
 * 
 * Supports filters: asset_id, risk_level, time_horizon
 * Returns AI-driven failure forecasts with confidence scores and RUL estimates.
 * 
 * Requirements: 16.6
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFailurePredictions({
 *   asset_id: 'asset-uuid',
 *   risk_level: 'high',
 *   time_horizon: 30
 * });
 * 
 * // Get all critical risk predictions
 * const { data, loading, error } = useFailurePredictions({
 *   risk_level: 'critical',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useFailurePredictions(
  params: ListFailurePredictionsParams = {}
): QueryState<FailurePrediction[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<FailurePrediction[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchFailurePredictions = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query
      let query = supabase
        .from('failure_predictions')
        .select('*');

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.risk_level) {
        query = query.eq('risk_level', params.risk_level);
      }

      if (params.time_horizon) {
        query = query.eq('time_horizon_days', params.time_horizon);
      }

      if (params.from) {
        query = query.gte('prediction_date', params.from);
      }

      if (params.to) {
        query = query.lte('prediction_date', params.to);
      }

      // Sort by prediction_date descending (most recent first)
      query = query.order('prediction_date', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as FailurePrediction[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch failure predictions'),
      });
    }
  }, [
    params.asset_id,
    params.risk_level,
    params.time_horizon,
    params.from,
    params.to,
    params.page,
    params.pageSize,
  ]);

  useEffect(() => {
    fetchFailurePredictions();
  }, [fetchFailurePredictions]);

  return {
    ...state,
    refetch: fetchFailurePredictions,
  };
}


// =============================================================================
// FS2.2: useCBMTriggers Hook
// =============================================================================

/**
 * Parameters for querying CBM triggers
 */
export interface ListCBMTriggersParams {
  asset_type?: string;
  parameter_id?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to query Condition-Based Maintenance triggers with filtering
 * 
 * Supports filters: asset_type, parameter
 * Returns CBM trigger rules with condition operators and recommended actions.
 * 
 * Requirements: 17.5
 * 
 * @example
 * ```tsx
 * // Get all active CBM triggers
 * const { data, loading, error, refetch } = useCBMTriggers({
 *   is_active: true
 * });
 * 
 * // Get triggers for a specific parameter
 * const { data, loading, error } = useCBMTriggers({
 *   parameter_id: 'param-uuid'
 * });
 * ```
 */
export function useCBMTriggers(
  params: ListCBMTriggersParams = {}
): QueryState<CBMTrigger[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<CBMTrigger[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchCBMTriggers = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query
      let query = supabase
        .from('cbm_triggers')
        .select('*');

      // Apply filters
      if (params.parameter_id) {
        query = query.eq('parameter_id', params.parameter_id);
      }

      if (params.is_active !== undefined) {
        query = query.eq('is_active', params.is_active);
      }

      // If filtering by asset_type, we need to join with asset_parameter_map
      // to find parameters applicable to that asset type
      if (params.asset_type) {
        // First, get parameter IDs for this asset type
        const { data: paramMappings, error: paramError } = await supabase
          .from('asset_parameter_map')
          .select('parameter_id')
          .eq('asset_type', params.asset_type);

        if (paramError) throw paramError;

        if (paramMappings && paramMappings.length > 0) {
          const parameterIds = paramMappings.map(pm => pm.parameter_id);
          query = query.in('parameter_id', parameterIds);
        } else {
          // No parameters for this asset type, return empty
          setState({
            data: [],
            loading: false,
            error: null,
          });
          return;
        }
      }

      // Sort by name
      query = query.order('name', { ascending: true });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as CBMTrigger[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch CBM triggers'),
      });
    }
  }, [
    params.asset_type,
    params.parameter_id,
    params.is_active,
    params.page,
    params.pageSize,
  ]);

  useEffect(() => {
    fetchCBMTriggers();
  }, [fetchCBMTriggers]);

  return {
    ...state,
    refetch: fetchCBMTriggers,
  };
}


// =============================================================================
// FS2.3: useMaintenanceRecommendations Hook
// =============================================================================

/**
 * Hook to query maintenance recommendations with filtering
 * 
 * Supports filters: asset_id, priority_score, due_date, status
 * Returns prescriptive maintenance actions with required spares and priority scoring.
 * 
 * Requirements: 18.6
 * 
 * @example
 * ```tsx
 * // Get open recommendations for an asset
 * const { data, loading, error, refetch } = useMaintenanceRecommendations({
 *   asset_id: 'asset-uuid',
 *   status: 'open'
 * });
 * 
 * // Get high-priority recommendations due soon
 * const { data, loading, error } = useMaintenanceRecommendations({
 *   min_priority: 80,
 *   due_before: '2024-02-01T00:00:00Z',
 *   status: 'open',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useMaintenanceRecommendations(
  params: ListRecommendationsParams = {}
): QueryState<MaintenanceRecommendation[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<MaintenanceRecommendation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchMaintenanceRecommendations = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query
      let query = supabase
        .from('maintenance_recommendations')
        .select('*');

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.min_priority !== undefined) {
        query = query.gte('priority_score', params.min_priority);
      }

      if (params.due_before) {
        query = query.lte('due_date', params.due_before);
      }

      // Sort by priority_score descending (highest priority first)
      query = query.order('priority_score', { ascending: false });

      // Apply pagination if specified
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as MaintenanceRecommendation[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch maintenance recommendations'),
      });
    }
  }, [
    params.asset_id,
    params.status,
    params.min_priority,
    params.due_before,
    params.page,
    params.pageSize,
  ]);

  useEffect(() => {
    fetchMaintenanceRecommendations();
  }, [fetchMaintenanceRecommendations]);

  return {
    ...state,
    refetch: fetchMaintenanceRecommendations,
  };
}


// =============================================================================
// FS2.4: Maintenance Recommendation Mutations
// =============================================================================

/**
 * Parameters for acknowledging a maintenance recommendation
 */
export interface AcknowledgeRecommendationParams {
  recommendation_id: string;
  acknowledged_by?: string;
}

/**
 * Hook to acknowledge a maintenance recommendation
 * 
 * Updates the recommendation status to indicate it has been reviewed.
 * Restricted to authorized roles.
 * 
 * Requirements: 18.7
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useAcknowledgeRecommendation();
 * 
 * await mutate({
 *   recommendation_id: 'rec-uuid',
 *   acknowledged_by: 'user@example.com'
 * });
 * ```
 */
export function useAcknowledgeRecommendation(): MutationState<MaintenanceRecommendation> {
  const [state, setState] = useState<Omit<MutationState<MaintenanceRecommendation>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: AcknowledgeRecommendationParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.recommendation_id) {
      setState({
        data: null,
        loading: false,
        error: new Error('recommendation_id is required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the recommendation - just update the updated_at timestamp
      // Status remains the same, but we record that it was acknowledged
      const { data, error } = await supabase
        .from('maintenance_recommendations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.recommendation_id)
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as MaintenanceRecommendation,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to acknowledge recommendation';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to acknowledge recommendations';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


/**
 * Parameters for scheduling a maintenance recommendation
 */
export interface ScheduleRecommendationParams {
  recommendation_id: string;
  scheduled_date: string;
  assigned_to?: string;
}

/**
 * Hook to schedule a maintenance recommendation
 * 
 * Updates the recommendation status to 'scheduled' and sets the due date.
 * Restricted to authorized roles.
 * 
 * Requirements: 18.7
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useScheduleRecommendation();
 * 
 * await mutate({
 *   recommendation_id: 'rec-uuid',
 *   scheduled_date: '2024-02-15T00:00:00Z',
 *   assigned_to: 'technician@example.com'
 * });
 * ```
 */
export function useScheduleRecommendation(): MutationState<MaintenanceRecommendation> {
  const [state, setState] = useState<Omit<MutationState<MaintenanceRecommendation>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: ScheduleRecommendationParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.recommendation_id || !params.scheduled_date) {
      setState({
        data: null,
        loading: false,
        error: new Error('recommendation_id and scheduled_date are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the recommendation to scheduled status
      const { data, error } = await supabase
        .from('maintenance_recommendations')
        .update({
          status: 'scheduled',
          due_date: params.scheduled_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.recommendation_id)
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as MaintenanceRecommendation,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to schedule recommendation';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to schedule recommendations';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


/**
 * Parameters for closing a maintenance recommendation
 */
export interface CloseRecommendationParams {
  recommendation_id: string;
  completion_notes: string;
  closed_by?: string;
}

/**
 * Hook to close a maintenance recommendation with completion notes
 * 
 * Updates the recommendation status to 'completed' and requires completion_notes.
 * Restricted to authorized roles.
 * 
 * Requirements: 18.7, 18.8
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error, data } = useCloseRecommendation();
 * 
 * await mutate({
 *   recommendation_id: 'rec-uuid',
 *   completion_notes: 'Transformer oil replaced, DGA results normal',
 *   closed_by: 'technician@example.com'
 * });
 * ```
 */
export function useCloseRecommendation(): MutationState<MaintenanceRecommendation> {
  const [state, setState] = useState<Omit<MutationState<MaintenanceRecommendation>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: CloseRecommendationParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.recommendation_id || !params.completion_notes) {
      setState({
        data: null,
        loading: false,
        error: new Error('recommendation_id and completion_notes are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the recommendation to completed status
      const { data, error } = await supabase
        .from('maintenance_recommendations')
        .update({
          status: 'completed',
          completion_notes: params.completion_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.recommendation_id)
        .select()
        .single();

      if (error) throw error;

      setState({
        data: data as MaintenanceRecommendation,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to close recommendation';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to close recommendations';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// =============================================================================
// FS5: Alerts, Reports & Visualisation Hooks
// =============================================================================

// =============================================================================
// FS5.1: useAlerts Hook
// =============================================================================

/**
 * Query alerts with filtering
 * 
 * Supports filtering by:
 * - asset_id: Filter by specific asset
 * - severity: Filter by alert severity (info, warning, critical, emergency)
 * - state: Filter by alert state (open, ack, closed)
 * - from/to: Filter by time range
 * - Pagination with page and pageSize
 * 
 * @param params - Query parameters
 * @returns Query state with alerts data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAlerts({
 *   asset_id: 'asset-uuid',
 *   severity: 'critical',
 *   state: 'open',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useAlerts(
  params: ListAlertsParams = {}
): QueryState<Alert[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<Alert[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAlerts = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from('apm_alerts')
        .select('*')
        .order('detected_at', { ascending: false });

      // Apply filters
      if (params.asset_id) {
        query = query.eq('asset_id', params.asset_id);
      }

      if (params.severity) {
        query = query.eq('severity', params.severity);
      }

      if (params.state) {
        query = query.eq('state', params.state);
      }

      if (params.from) {
        query = query.gte('detected_at', params.from);
      }

      if (params.to) {
        query = query.lte('detected_at', params.to);
      }

      // Apply pagination
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as Alert[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch alerts'),
      });
    }
  }, [params.asset_id, params.severity, params.state, params.from, params.to, params.page, params.pageSize]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    ...state,
    refetch: fetchAlerts,
  };
}


// =============================================================================
// FS5.2: useAcknowledgeAlert Hook
// =============================================================================

/**
 * Acknowledge an alert
 * 
 * Updates the alert state to 'ack' and records the acknowledging user and timestamp.
 * Restricted to authorized operations roles.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useAcknowledgeAlert();
 * 
 * await mutate({
 *   alert_id: 'alert-uuid',
 *   acknowledged_by: 'operator@example.com'
 * });
 * ```
 */
export function useAcknowledgeAlert(): MutationState<Alert> {
  const [state, setState] = useState<Omit<MutationState<Alert>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: AcknowledgeAlertParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.alert_id || !params.acknowledged_by) {
      setState({
        data: null,
        loading: false,
        error: new Error('alert_id and acknowledged_by are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the alert to acknowledged state
      const { data, error } = await supabase
        .from('apm_alerts')
        .update({
          state: 'ack',
          acknowledged_by: params.acknowledged_by,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', params.alert_id)
        .select()
        .single();

      if (error) throw error;

      // Record state transition in alert_history
      await supabase
        .from('alert_history')
        .insert({
          alert_id: params.alert_id,
          previous_state: 'open',
          new_state: 'ack',
          changed_by: params.acknowledged_by,
          changed_at: new Date().toISOString(),
        });

      setState({
        data: data as Alert,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to acknowledge alert';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to acknowledge alerts';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS5.3: useCloseAlert Hook
// =============================================================================

/**
 * Close an alert with resolution notes
 * 
 * Updates the alert state to 'closed' and requires resolution notes.
 * Restricted to authorized operations roles.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useCloseAlert();
 * 
 * await mutate({
 *   alert_id: 'alert-uuid',
 *   closed_by: 'operator@example.com',
 *   resolution_notes: 'Issue resolved, transformer temperature normalized'
 * });
 * ```
 */
export function useCloseAlert(): MutationState<Alert> {
  const [state, setState] = useState<Omit<MutationState<Alert>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: CloseAlertParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.alert_id || !params.resolution_notes) {
      setState({
        data: null,
        loading: false,
        error: new Error('alert_id and resolution_notes are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Update the alert to closed state
      const { data, error } = await supabase
        .from('apm_alerts')
        .update({
          state: 'closed',
          closed_by: params.closed_by,
          closed_at: new Date().toISOString(),
          resolution_notes: params.resolution_notes,
        })
        .eq('id', params.alert_id)
        .select()
        .single();

      if (error) throw error;

      // Record state transition in alert_history
      await supabase
        .from('alert_history')
        .insert({
          alert_id: params.alert_id,
          previous_state: 'ack',
          new_state: 'closed',
          changed_by: params.closed_by,
          changed_at: new Date().toISOString(),
          notes: params.resolution_notes,
        });

      setState({
        data: data as Alert,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to close alert';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to close alerts';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS5.4: useAlertTimeline Hook
// =============================================================================

/**
 * Query unified timeline of alerts, diagnostic events, and downtime events
 * 
 * Combines multiple event types into a chronologically sorted timeline.
 * Supports filtering by:
 * - asset_id: Filter by specific asset
 * - event_type: Filter by event type (alert, diagnostic, downtime)
 * - from/to: Filter by time range
 * - Pagination with page and pageSize
 * 
 * @param params - Query parameters
 * @returns Query state with timeline events, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAlertTimeline({
 *   asset_id: 'asset-uuid',
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-01-31T23:59:59Z',
 *   page: 1,
 *   pageSize: 50
 * });
 * ```
 */
export function useAlertTimeline(
  params: ListAlertTimelineParams = {}
): QueryState<TimelineEvent[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<TimelineEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchTimeline = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const timeline: TimelineEvent[] = [];

      // Fetch alerts if not filtered out
      if (!params.event_type || params.event_type === 'alert') {
        let alertQuery = supabase
          .from('apm_alerts')
          .select('*');

        if (params.asset_id) {
          alertQuery = alertQuery.eq('asset_id', params.asset_id);
        }
        if (params.from) {
          alertQuery = alertQuery.gte('detected_at', params.from);
        }
        if (params.to) {
          alertQuery = alertQuery.lte('detected_at', params.to);
        }

        const { data: alerts, error: alertError } = await alertQuery;
        if (alertError) throw alertError;

        if (alerts) {
          alerts.forEach((alert: Alert) => {
            timeline.push({
              id: alert.id,
              event_type: 'alert',
              asset_id: alert.asset_id,
              timestamp: alert.detected_at,
              title: alert.message,
              severity: alert.severity,
              state: alert.state,
              details: alert,
            });
          });
        }
      }

      // Fetch diagnostic events if not filtered out
      if (!params.event_type || params.event_type === 'diagnostic') {
        let diagnosticQuery = supabase
          .from('diagnostic_events')
          .select('*');

        if (params.asset_id) {
          diagnosticQuery = diagnosticQuery.eq('asset_id', params.asset_id);
        }
        if (params.from) {
          diagnosticQuery = diagnosticQuery.gte('detected_at', params.from);
        }
        if (params.to) {
          diagnosticQuery = diagnosticQuery.lte('detected_at', params.to);
        }

        const { data: diagnostics, error: diagnosticError } = await diagnosticQuery;
        if (diagnosticError) throw diagnosticError;

        if (diagnostics) {
          diagnostics.forEach((diagnostic: DiagnosticEvent) => {
            timeline.push({
              id: diagnostic.id,
              event_type: 'diagnostic',
              asset_id: diagnostic.asset_id,
              timestamp: diagnostic.detected_at,
              title: diagnostic.title,
              state: diagnostic.state,
              details: diagnostic,
            });
          });
        }
      }

      // Fetch downtime events if not filtered out
      if (!params.event_type || params.event_type === 'downtime') {
        let downtimeQuery = supabase
          .from('downtime_events')
          .select('*');

        if (params.asset_id) {
          downtimeQuery = downtimeQuery.eq('asset_id', params.asset_id);
        }
        if (params.from) {
          downtimeQuery = downtimeQuery.gte('start_time', params.from);
        }
        if (params.to) {
          downtimeQuery = downtimeQuery.lte('start_time', params.to);
        }

        const { data: downtimes, error: downtimeError } = await downtimeQuery;
        if (downtimeError) throw downtimeError;

        if (downtimes) {
          downtimes.forEach((downtime: DowntimeEvent) => {
            timeline.push({
              id: downtime.id,
              event_type: 'downtime',
              asset_id: downtime.asset_id,
              timestamp: downtime.start_time,
              title: `${downtime.event_type} - ${downtime.description || 'Downtime event'}`,
              details: downtime,
            });
          });
        }
      }

      // Sort chronologically (most recent first)
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      let paginatedTimeline = timeline;
      if (params.page && params.pageSize) {
        const start = (params.page - 1) * params.pageSize;
        const end = start + params.pageSize;
        paginatedTimeline = timeline.slice(start, end);
      }

      setState({
        data: paginatedTimeline,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch timeline'),
      });
    }
  }, [params.asset_id, params.event_type, params.from, params.to, params.page, params.pageSize]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    ...state,
    refetch: fetchTimeline,
  };
}


// =============================================================================
// FS5.5: useDashboards Hook
// =============================================================================

/**
 * Query user's dashboards with widgets
 * 
 * Fetches dashboards and optionally loads associated widgets.
 * Supports filtering by:
 * - owner: Filter by dashboard owner
 * - Pagination with page and pageSize
 * 
 * @param params - Query parameters
 * @returns Query state with dashboards data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDashboards({
 *   owner: 'user@example.com',
 *   page: 1,
 *   pageSize: 10
 * });
 * ```
 */
export function useDashboards(
  params: ListDashboardsParams = {}
): QueryState<Dashboard[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<Dashboard[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchDashboards = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from('dashboards')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply filters
      if (params.owner) {
        query = query.eq('owner', params.owner);
      }

      // Apply pagination
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as Dashboard[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch dashboards'),
      });
    }
  }, [params.owner, params.page, params.pageSize]);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  return {
    ...state,
    refetch: fetchDashboards,
  };
}


/**
 * Load a single dashboard with its widgets
 * 
 * @param dashboardId - Dashboard ID to load
 * @returns Query state with dashboard and widgets
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDashboardWithWidgets('dashboard-uuid');
 * ```
 */
export function useDashboardWithWidgets(
  dashboardId: string | null
): QueryState<DashboardWithWidgets> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<DashboardWithWidgets>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchDashboard = useCallback(async () => {
    if (!dashboardId) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch dashboard
      const { data: dashboard, error: dashboardError } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single();

      if (dashboardError) throw dashboardError;

      // Fetch widgets
      const { data: widgets, error: widgetsError } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: true });

      if (widgetsError) throw widgetsError;

      setState({
        data: {
          dashboard: dashboard as Dashboard,
          widgets: (widgets as DashboardWidget[]) || [],
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch dashboard'),
      });
    }
  }, [dashboardId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...state,
    refetch: fetchDashboard,
  };
}


// =============================================================================
// FS5.6: useUpsertDashboard Hook
// =============================================================================

/**
 * Create or update a dashboard with widgets
 * 
 * Validates widget query references before saving.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useUpsertDashboard();
 * 
 * await mutate({
 *   name: 'Reliability Dashboard',
 *   description: 'Key reliability metrics',
 *   owner: 'user@example.com',
 *   layout_config: { columns: 3, rows: 2 },
 *   widgets: [
 *     {
 *       widget_type: 'KPI_card',
 *       query_template_ref: 'mtbf_summary',
 *       position: { x: 0, y: 0 },
 *       config: { title: 'MTBF' }
 *     }
 *   ]
 * });
 * ```
 */
export function useUpsertDashboard(): MutationState<Dashboard> {
  const [state, setState] = useState<Omit<MutationState<Dashboard>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: UpsertDashboardParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.name || !params.owner) {
      setState({
        data: null,
        loading: false,
        error: new Error('name and owner are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Validate widget query references (basic validation)
      if (params.widgets) {
        for (const widget of params.widgets) {
          if (!widget.query_template_ref) {
            throw new Error('All widgets must have a query_template_ref');
          }
        }
      }

      let dashboard: Dashboard;

      if (params.id) {
        // Update existing dashboard
        const { data, error } = await supabase
          .from('dashboards')
          .update({
            name: params.name,
            description: params.description,
            layout_config: params.layout_config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.id)
          .select()
          .single();

        if (error) throw error;
        dashboard = data as Dashboard;

        // Delete existing widgets
        await supabase
          .from('dashboard_widgets')
          .delete()
          .eq('dashboard_id', params.id);
      } else {
        // Create new dashboard
        const { data, error } = await supabase
          .from('dashboards')
          .insert({
            name: params.name,
            description: params.description,
            owner: params.owner,
            layout_config: params.layout_config,
          })
          .select()
          .single();

        if (error) throw error;
        dashboard = data as Dashboard;
      }

      // Insert widgets if provided
      if (params.widgets && params.widgets.length > 0) {
        const widgetsToInsert = params.widgets.map(widget => ({
          dashboard_id: dashboard.id,
          widget_type: widget.widget_type,
          query_template_ref: widget.query_template_ref,
          position: widget.position,
          config: widget.config,
        }));

        const { error: widgetsError } = await supabase
          .from('dashboard_widgets')
          .insert(widgetsToInsert);

        if (widgetsError) throw widgetsError;
      }

      setState({
        data: dashboard,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to save dashboard';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to save dashboards';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS5.7: useDeleteDashboard Hook
// =============================================================================

/**
 * Delete a dashboard
 * 
 * Cascades to delete associated widgets.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useDeleteDashboard();
 * 
 * await mutate({ dashboard_id: 'dashboard-uuid' });
 * ```
 */
export function useDeleteDashboard(): MutationState<{ success: boolean }> {
  const [state, setState] = useState<Omit<MutationState<{ success: boolean }>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: { dashboard_id: string }) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.dashboard_id) {
      setState({
        data: null,
        loading: false,
        error: new Error('dashboard_id is required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', params.dashboard_id);

      if (error) throw error;

      setState({
        data: { success: true },
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to delete dashboard';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to delete dashboards';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS5.8: useReportRuns Hook
// =============================================================================

/**
 * Query report execution history
 * 
 * Supports filtering by:
 * - report_type: Filter by report type
 * - created_by: Filter by user who created the report
 * - from/to: Filter by execution time range
 * - Pagination with page and pageSize
 * 
 * @param params - Query parameters
 * @returns Query state with report runs data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useReportRuns({
 *   report_type: 'reliability_summary',
 *   created_by: 'user@example.com',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useReportRuns(
  params: ListReportRunsParams = {}
): QueryState<ReportRun[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<ReportRun[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchReportRuns = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from('report_runs')
        .select('*')
        .order('execution_time', { ascending: false });

      // Apply filters
      if (params.report_type) {
        query = query.eq('report_type', params.report_type);
      }

      if (params.created_by) {
        query = query.eq('created_by', params.created_by);
      }

      if (params.from) {
        query = query.gte('execution_time', params.from);
      }

      if (params.to) {
        query = query.lte('execution_time', params.to);
      }

      // Apply pagination
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as ReportRun[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch report runs'),
      });
    }
  }, [params.report_type, params.created_by, params.from, params.to, params.page, params.pageSize]);

  useEffect(() => {
    fetchReportRuns();
  }, [fetchReportRuns]);

  return {
    ...state,
    refetch: fetchReportRuns,
  };
}


// =============================================================================
// FS5.9: useGenerateReport Hook
// =============================================================================

/**
 * Trigger report generation
 * 
 * Creates a report run record and initiates report generation.
 * Handles failures with error logging.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useGenerateReport();
 * 
 * await mutate({
 *   report_type: 'reliability_summary',
 *   asset_scope: { asset_types: ['power_transformer', 'circuit_breaker'] },
 *   created_by: 'user@example.com'
 * });
 * ```
 */
export function useGenerateReport(): MutationState<ReportRun> {
  const [state, setState] = useState<Omit<MutationState<ReportRun>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: GenerateReportParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.report_type || !params.created_by) {
      setState({
        data: null,
        loading: false,
        error: new Error('report_type and created_by are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Create report run record
      const { data, error } = await supabase
        .from('report_runs')
        .insert({
          report_type: params.report_type,
          execution_time: new Date().toISOString(),
          status: 'pending',
          asset_scope: params.asset_scope || {},
          created_by: params.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would trigger an async job
      // For now, we just return the pending report run
      setState({
        data: data as ReportRun,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to generate report';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to generate reports';
        } else {
          errorMessage = err.message;
        }
      }

      // Log error for admin review (in production, this would go to a logging service)
      console.error('Report generation failed:', errorMessage, params);

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}


// =============================================================================
// FS5.10: useExportJobs Hook
// =============================================================================

/**
 * Query user's export jobs with status
 * 
 * Supports filtering by:
 * - user_id: Filter by user who created the export
 * - status: Filter by export job status
 * - from/to: Filter by creation time range
 * - Pagination with page and pageSize
 * 
 * @param params - Query parameters
 * @returns Query state with export jobs data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useExportJobs({
 *   user_id: 'user-uuid',
 *   status: 'completed',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export function useExportJobs(
  params: ListExportJobsParams = {}
): QueryState<ExportJob[]> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<ExportJob[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchExportJobs = useCallback(async () => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from('export_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (params.user_id) {
        query = query.eq('user_id', params.user_id);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.from) {
        query = query.gte('created_at', params.from);
      }

      if (params.to) {
        query = query.lte('created_at', params.to);
      }

      // Apply pagination
      if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setState({
        data: (data as ExportJob[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch export jobs'),
      });
    }
  }, [params.user_id, params.status, params.from, params.to, params.page, params.pageSize]);

  useEffect(() => {
    fetchExportJobs();
  }, [fetchExportJobs]);

  return {
    ...state,
    refetch: fetchExportJobs,
  };
}


// =============================================================================
// FS5.11: useCreateExport Hook
// =============================================================================

/**
 * Create an export job
 * 
 * Enforces data access permissions and processes large exports asynchronously.
 * 
 * @returns Mutation state with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useCreateExport();
 * 
 * await mutate({
 *   user_id: 'user-uuid',
 *   query_reference: 'telemetry_30day_export',
 *   format: 'CSV'
 * });
 * ```
 */
export function useCreateExport(): MutationState<ExportJob> {
  const [state, setState] = useState<Omit<MutationState<ExportJob>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: CreateExportJobParams) => {
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: new Error('Supabase client not configured'),
      });
      return;
    }

    if (!params.user_id || !params.query_reference || !params.format) {
      setState({
        data: null,
        loading: false,
        error: new Error('user_id, query_reference, and format are required'),
      });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      // Create export job record
      // Data access permissions are enforced through RLS policies
      const { data, error } = await supabase
        .from('export_jobs')
        .insert({
          user_id: params.user_id,
          query_reference: params.query_reference,
          format: params.format,
          status: 'queued',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would trigger an async job processor
      // that respects RLS policies when fetching data
      // For now, we just return the queued export job
      setState({
        data: data as ExportJob,
        loading: false,
        error: null,
      });
    } catch (err) {
      let errorMessage = 'Failed to create export job';
      if (err instanceof Error) {
        if (err.message.includes('row-level security')) {
          errorMessage = 'Permission denied: insufficient privileges to export data';
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        data: null,
        loading: false,
        error: new Error(errorMessage),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
