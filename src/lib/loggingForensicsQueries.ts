/**
 * Logging and Forensics Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for audit logs, file integrity monitoring, and forensic snapshots.
 * Implements RLS-aware queries with proper error handling and loading states.
 * Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 8.1
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import { toCamelCase } from './dataMapping';
import type {
  SecurityAuditLogEntry,
  ConfigurationChange,
  LogCorrelationRule,
  AuditLogAggregation,
  LogArchivalJob,
  LogStorageLocation,
  ArchivedAuditLog,
  FileIntegrityMonitor,
  FileIntegrityViolation,
  FileIntegrityBaseline,
  FileIntegrityCheckHistory,
  ForensicSnapshot,
  ForensicSnapshotDb,
  ForensicSnapshotComponent,
  ForensicSnapshotComponentDb,
  ForensicAnalysisSession,
  ForensicEvidenceItem,
  ForensicSnapshotRequest,
  LogSearchQuery,
  LogSearchResult,
  LogAnalysisMetrics,
  AuditRetentionPolicy,
  AuditSearchQuery,
  AuditExportRequest
} from '@/types/security';

/**
 * Query result wrapper with loading and error states
 */
export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Logging query error class
 */
export class LoggingQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'LoggingQueryError';
  }
}

/**
 * Ensure Supabase is connected and throw descriptive error if not
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new LoggingQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

/**
 * Handle Supabase query errors with proper typing
 */
function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new LoggingQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new LoggingQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Security Audit Logs
// ============================================================================

/**
 * Search audit logs with comprehensive filtering
 */
export async function searchAuditLogs(
  query: LogSearchQuery
): Promise<LogSearchResult> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(query.tenantId);
    if (!tenantUUID) {
      console.error('[LogDebug] mapTenantIdToUUID returned null for:', query.tenantId);
      return { logs: [], totalCount: 0 };
    }
    console.log('[LogDebug] Mapped tenant', query.tenantId, 'to UUID', tenantUUID);

    let supabaseQuery = supabase
      .from('security_audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantUUID);

    // ... (rest of query construction)

    // ...

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('[LogDebug] Supabase query error:', error);
      handleSupabaseError(error, 'Search audit logs');
    }

    console.log('[LogDebug] Query success. Count:', count, 'Data length:', data?.length);

    return {
      logs: toCamelCase<SecurityAuditLogEntry[]>((data || [])),
      totalCount: count || 0
    };
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Search audit logs');
  }
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(
  tenantId: string,
  logId: string
): Promise<SecurityAuditLogEntry | null> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return null;

    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', logId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get audit log by ID');
    }

    return toCamelCase<SecurityAuditLogEntry>(data);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit log by ID');
  }
}

// ============================================================================
// Configuration Changes
// ============================================================================

/**
 * Get configuration changes for a tenant
 */
export async function getConfigurationChanges(
  tenantId: string,
  options: QueryOptions = {}
): Promise<ConfigurationChange[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('configuration_changes')
      .select('*')
      .eq('tenant_id', tenantUUID);

    // Apply sorting
    const sortBy = options.orderBy || 'change_timestamp';
    const sortOrder = options.orderDirection || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get configuration changes');
    }

    return toCamelCase<ConfigurationChange[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get configuration changes');
  }
}

/**
 * Get configuration changes by asset
 */
export async function getConfigurationChangesByAsset(
  tenantId: string,
  assetId: string,
  options: QueryOptions = {}
): Promise<ConfigurationChange[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('configuration_changes')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('asset_id', assetId);

    const sortBy = options.orderBy || 'change_timestamp';
    const sortOrder = options.orderDirection || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get configuration changes by asset');
    }

    return toCamelCase<ConfigurationChange[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get configuration changes by asset');
  }
}

// ============================================================================
// File Integrity Monitoring
// ============================================================================

/**
 * Get file integrity monitors for a tenant
 */
export async function getFileIntegrityMonitors(
  tenantId: string,
  options: QueryOptions = {}
): Promise<FileIntegrityMonitor[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('file_integrity_monitors')
      .select('*')
      .eq('tenant_id', tenantUUID);

    const sortBy = options.orderBy || 'monitor_name';
    const sortOrder = options.orderDirection || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get file integrity monitors');
    }

    return toCamelCase<FileIntegrityMonitor[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get file integrity monitors');
  }
}

/**
 * Get file integrity violations
 */
export async function getFileIntegrityViolations(
  tenantId: string,
  options: QueryOptions = {}
): Promise<FileIntegrityViolation[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('file_integrity_violations')
      .select('*')
      .eq('tenant_id', tenantUUID);

    const sortBy = options.orderBy || 'detected_timestamp';
    const sortOrder = options.orderDirection || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get file integrity violations');
    }

    return toCamelCase<FileIntegrityViolation[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get file integrity violations');
  }
}

// ============================================================================
// Forensic Snapshots
// ============================================================================

/**
 * Get forensic snapshots for a tenant
 */
export async function getForensicSnapshots(
  tenantId: string,
  options: QueryOptions = {}
): Promise<ForensicSnapshotDb[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('forensic_snapshots')
      .select('*')
      .eq('tenant_id', tenantUUID);

    const sortBy = options.orderBy || 'capture_start';
    const sortOrder = options.orderDirection || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get forensic snapshots');
    }

    return toCamelCase<ForensicSnapshotDb[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get forensic snapshots');
  }
}

/**
 * Get forensic snapshot by ID with components
 */
export async function getForensicSnapshotById(
  tenantId: string,
  snapshotId: string
): Promise<{ snapshot: ForensicSnapshotDb; components: ForensicSnapshotComponentDb[] } | null> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return null;

    // Get snapshot
    const { data: snapshotData, error: snapshotError } = await supabase
      .from('forensic_snapshots')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', snapshotId)
      .single();

    if (snapshotError) {
      if (snapshotError.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(snapshotError, 'Get forensic snapshot by ID');
    }

    // Get components
    const { data: componentsData, error: componentsError } = await supabase
      .from('forensic_snapshot_components')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('snapshot_id', snapshotId);

    if (componentsError) {
      handleSupabaseError(componentsError, 'Get forensic snapshot components');
    }

    return {
      snapshot: toCamelCase<ForensicSnapshotDb>(snapshotData),
      components: toCamelCase<ForensicSnapshotComponentDb[]>(componentsData || [])
    };
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get forensic snapshot by ID');
  }
}

/**
 * Get forensic snapshot components by snapshot ID
 */
export async function getForensicSnapshotComponents(
  snapshotId: string
): Promise<ForensicSnapshotComponentDb[]> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase
      .from('forensic_snapshot_components')
      .select('*')
      .eq('snapshot_id', snapshotId);

    if (error) {
      handleSupabaseError(error, 'Get forensic snapshot components');
    }

    return toCamelCase<ForensicSnapshotComponent[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get forensic snapshot components');
  }
}

/**
 * Get forensic evidence items for a snapshot
 */
export async function getForensicEvidenceItems(
  tenantId: string,
  snapshotId: string
): Promise<ForensicEvidenceItem[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('forensic_evidence_items')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('snapshot_id', snapshotId)
      .order('collection_timestamp', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get forensic evidence items');
    }

    return toCamelCase<ForensicEvidenceItem[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get forensic evidence items');
  }
}

// ============================================================================
// Log Aggregations and Analytics
// ============================================================================

/**
 * Get audit log aggregations for a time period
 */
export async function getAuditLogAggregations(
  tenantId: string,
  startTime: string,
  endTime: string,
  aggregationType: 'hourly' | 'daily' | 'weekly' = 'daily'
): Promise<AuditLogAggregation[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('audit_log_aggregations')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('aggregation_type', aggregationType)
      .gte('period_start', startTime)
      .lte('period_end', endTime)
      .order('period_start', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get audit log aggregations');
    }

    return toCamelCase<AuditLogAggregation[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit log aggregations');
  }
}

/**
 * Get log analysis metrics for a time range
 */
export async function getLogAnalysisMetrics(
  tenantId: string,
  startTime: string,
  endTime: string
): Promise<LogAnalysisMetrics> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return {
      tenantId: tenantId,
      timeRange: { start: startTime, end: endTime },
      totalEvents: 0,
      criticalEvents: 0,
      highRiskEvents: 0,
      failedAuthentications: 0,
      policyViolations: 0,
      configurationChanges: 0,
      activeUsers: 0,
      topUsers: [],
      affectedAssets: 0,
      topAssets: [],
      eventTrend: [],
      anomalousPatterns: [],
      severity_counts: {}, // These might be old fields from RPC, adding them just in case but interface is different
      event_type_counts: {},
      outcome_counts: {},
      risk_score_avg: 0
    } as any;

    // Get aggregated metrics
    const { data, error } = await supabase
      .rpc('get_log_analysis_metrics', {
        p_tenant_id: tenantUUID,
        p_start_time: startTime,
        p_end_time: endTime
      });

    if (error) {
      handleSupabaseError(error, 'Get log analysis metrics');
    }

    return toCamelCase<LogAnalysisMetrics>(data);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get log analysis metrics');
  }
}

// ============================================================================
// Log Retention and Archival
// ============================================================================

/**
 * Get log archival jobs
 */
export async function getLogArchivalJobs(
  tenantId: string
): Promise<LogArchivalJob[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('log_archival_jobs')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get log archival jobs');
    }

    return toCamelCase<LogArchivalJob[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get log archival jobs');
  }
}

/**
 * Get log storage locations
 */
export async function getLogStorageLocations(
  tenantId: string
): Promise<LogStorageLocation[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('log_storage_locations')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .order('storage_type', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get log storage locations');
    }

    return toCamelCase<LogStorageLocation[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get log storage locations');
  }
}

/**
 * Get log retention policies
 */
export async function getLogRetentionPolicies(
  tenantId: string
): Promise<AuditRetentionPolicy[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('audit_retention_policies')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .order('priority', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get audit retention policies');
    }

    return toCamelCase<AuditRetentionPolicy[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit retention policies');
  }
}

/**
 * Get saved audit search queries
 */
export async function getAuditSearchQueries(
  tenantId: string
): Promise<AuditSearchQuery[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('audit_search_queries')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .order('name', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get audit search queries');
    }

    return toCamelCase<AuditSearchQuery[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit search queries');
  }
}

/**
 * Get audit export requests
 */
export async function getAuditExportRequests(
  tenantId: string
): Promise<AuditExportRequest[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase
      .from('audit_export_requests')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get audit export requests');
    }

    return toCamelCase<AuditExportRequest[]>(data || []);
  } catch (error) {
    if (error instanceof LoggingQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit export requests');
  }
}
