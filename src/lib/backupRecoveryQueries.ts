import { supabase, isSupabaseConfigured } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class BackupRecoveryQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'BackupRecoveryQueryError';
  }
}

function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new BackupRecoveryQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new BackupRecoveryQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new BackupRecoveryQueryError(`${operation} failed with unknown error`, 'UNKNOWN_ERROR', error);
}

// Backup Policies
export async function getBackupPolicies(
  tenantId: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_policies')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get backup policies');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get backup policies');
  }
}

// Backup Jobs
export async function getBackupJobs(
  tenantId: string,
  policyId?: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_jobs')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (policyId) {
      query = query.eq('policy_id', policyId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('actual_start', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get backup jobs');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get backup jobs');
  }
}

// Restore Points
export async function getRestorePoints(
  tenantId: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_restore_points')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('restore_point_timestamp', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get restore points');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get restore points');
  }
}

// Restore Jobs
export async function getRestoreJobs(
  tenantId: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_restore_jobs')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('actual_start', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get restore jobs');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get restore jobs');
  }
}

// Verification Tests
export async function getVerificationTests(
  tenantId: string,
  restorePointId?: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_verification_tests')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (restorePointId) {
      query = query.eq('restore_point_id', restorePointId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('test_start', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get verification tests');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get verification tests');
  }
}

// Storage Locations
export async function getStorageLocations(
  tenantId: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('backup_storage_locations')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('location_name', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get storage locations');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get storage locations');
  }
}

// Summary
export async function getBackupRecoverySummary(
  tenantId: string
): Promise<any> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return {};

    // Get policies
    const { data: policies, error: policiesError } = await supabase
      .from('backup_policies')
      .select('status')
      .eq('tenant_id', tenantUUID);

    if (policiesError) {
      handleSupabaseError(policiesError, 'Get backup policies for summary');
    }

    const totalPolicies = policies?.length || 0;
    const activePolicies = policies?.filter(p => p.status === 'active').length || 0;

    // Get recent jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('backup_jobs')
      .select('status, actual_start')
      .eq('tenant_id', tenantUUID)
      .order('actual_start', { ascending: false })
      .limit(100);

    if (jobsError) {
      handleSupabaseError(jobsError, 'Get backup jobs for summary');
    }

    const totalJobs = jobs?.length || 0;
    const successfulJobs = jobs?.filter(j => j.status === 'completed').length || 0;
    const failedJobs = jobs?.filter(j => j.status === 'failed').length || 0;
    const runningJobs = jobs?.filter(j => j.status === 'running').length || 0;

    // Get restore points
    const { data: restorePoints, error: restorePointsError } = await supabase
      .from('backup_restore_points')
      .select('restore_tested, last_restore_test')
      .eq('tenant_id', tenantUUID);

    if (restorePointsError) {
      handleSupabaseError(restorePointsError, 'Get restore points for summary');
    }

    const totalRestorePoints = restorePoints?.length || 0;
    const testedRestorePoints = restorePoints?.filter(rp => rp.restore_tested).length || 0;

    // Get storage locations
    const { data: storage, error: storageError } = await supabase
      .from('backup_storage_locations')
      .select('status, health_status, total_capacity_gb, used_capacity_gb')
      .eq('tenant_id', tenantUUID);

    if (storageError) {
      handleSupabaseError(storageError, 'Get storage locations for summary');
    }

    const totalStorage = storage?.reduce((sum, s) => sum + (s.total_capacity_gb || 0), 0) || 0;
    const usedStorage = storage?.reduce((sum, s) => sum + (s.used_capacity_gb || 0), 0) || 0;
    const storageUtilization = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;

    const successRate = totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0;
    const testCoverage = totalRestorePoints > 0 ? Math.round((testedRestorePoints / totalRestorePoints) * 100) : 0;

    const overallStatus: 'healthy' | 'warning' | 'critical' =
      failedJobs > 5 || successRate < 80 ? 'critical' :
        failedJobs > 2 || successRate < 90 || storageUtilization > 85 ? 'warning' :
          'healthy';

    return {
      tenantId,
      overallStatus,
      totalPolicies,
      activePolicies,
      totalJobs,
      successfulJobs,
      failedJobs,
      runningJobs,
      successRate,
      totalRestorePoints,
      testedRestorePoints,
      testCoverage,
      totalStorage,
      usedStorage,
      storageUtilization,
      lastBackup: jobs && jobs.length > 0 ? jobs[0].actual_start : null
    };
  } catch (error) {
    if (error instanceof BackupRecoveryQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get backup recovery summary');
  }
}

export function isBackupRecoveryQueriesAvailable(): boolean {
  return isSupabaseConfigured();
}
