import { supabase, isSupabaseConfigured } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  EncryptionKey,
  KeyRotationHistory,
  EncryptionKeyManagementSummary,
  KeyUsageType,
  KeyAlgorithm,
  KeyStatus
} from '@/types/security';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class EncryptionKeyQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'EncryptionKeyQueryError';
  }
}

function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new EncryptionKeyQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new EncryptionKeyQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new EncryptionKeyQueryError(`${operation} failed with unknown error`, 'UNKNOWN_ERROR', error);
}

// Transform database row to EncryptionKey interface
function transformEncryptionKey(row: any): EncryptionKey {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    keyName: row.key_name,
    description: row.description,
    keyType: row.key_type,
    algorithm: row.algorithm,
    keyLength: row.key_size_bits,
    keyId: row.key_id,
    keyFingerprint: row.key_material_reference, // Using reference as fingerprint
    status: row.status,
    usageType: row.purpose,
    createdDate: row.creation_date,
    activatedDate: row.activation_date,
    expirationDate: row.expiration_date,
    lastRotated: row.rotation_date,
    rotationIntervalDays: row.rotation_period_days || 90,
    nextRotation: row.next_rotation_date,
    usageCount: Number(row.usage_count || 0),
    lastUsed: row.last_used_timestamp,
    usedByServices: row.protected_assets || [],
    usedByAssets: row.protected_assets || [],
    protectedDataCategories: row.protected_data_types || [],
    complianceStandards: row.compliance_requirements || [],
    accessRoles: [], // Will be populated from access policies
    requiresHsm: row.storage_location === 'hsm',
    hsmLocation: row.storage_location === 'hsm' ? row.storage_provider : undefined,
    backupExists: row.backup_key_exists || false,
    backupLocation: row.backup_key_location,
    auditTrail: [], // Will be populated separately
    createdBy: row.owner_id,
    approvedBy: row.technical_contact_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getEncryptionKeys(
  tenantId: string,
  options: QueryOptions = {}
): Promise<EncryptionKey[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      // Tenant not in Supabase, return empty array
      return [];
    }

    let query = supabase
      .from('encryption_keys')
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
      handleSupabaseError(error, 'Get encryption keys');
    }

    return (data || []).map(transformEncryptionKey);
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get encryption keys');
  }
}

export async function getEncryptionKeyById(
  tenantId: string,
  keyId: string
): Promise<EncryptionKey | null> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase
      .from('encryption_keys')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', keyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      handleSupabaseError(error, 'Get encryption key by ID');
    }

    return data ? transformEncryptionKey(data) : null;
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get encryption key by ID');
  }
}

export async function getKeyRotationHistory(
  tenantId: string,
  keyId?: string,
  options: QueryOptions = {}
): Promise<KeyRotationHistory[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase
      .from('key_rotation_history')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (keyId) {
      query = query.eq('key_id', keyId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('rotation_start', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get key rotation history');
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      keyId: row.key_id,
      keyName: '', // Will be populated from join
      rotationType: row.rotation_type,
      oldKeyFingerprint: row.old_key_id,
      newKeyFingerprint: row.new_key_id,
      rotationReason: row.rotation_reason,
      rotationRequestedAt: row.rotation_start,
      rotationCompletedAt: row.rotation_end,
      requestedBy: row.initiated_by || '',
      completedBy: row.executed_by_system || '',
      status: row.rotation_status,
      errorMessage: row.issues_encountered?.join(', '),
      affectedServices: [],
      affectedAssets: [],
      downtime: row.rotation_duration_seconds ? Math.round(row.rotation_duration_seconds / 60) : undefined,
      rollbackPlan: row.rollback_possible ? 'Available' : 'Not available',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get key rotation history');
  }
}

export async function getKeyUsageAudit(
  tenantId: string,
  keyId?: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase
      .from('key_usage_audit')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (keyId) {
      query = query.eq('key_id', keyId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('usage_timestamp', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get key usage audit');
    }

    return data || [];
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get key usage audit');
  }
}

export async function getEncryptionKeyManagementSummary(
  tenantId: string
): Promise<EncryptionKeyManagementSummary> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      // Return empty summary for tenants not in Supabase
      return {
        tenantId,
        totalKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        compromisedKeys: 0,
        pendingRotationKeys: 0,
        keysByType: {
          'data-encryption': 0,
          'key-encryption': 0,
          'signing': 0,
          'authentication': 0,
          'protocol-encryption': 0
        },
        keysByAlgorithm: {
          'AES-256': 0,
          'AES-128': 0,
          'RSA-2048': 0,
          'RSA-4096': 0,
          'ECC-P256': 0,
          'ECC-P384': 0
        },
        hsmProtectedKeys: 0,
        keysWithoutBackup: 0,
        averageKeyAge: 0,
        oldestKeyAge: 0,
        keysRequiringRotation: 0,
        complianceScore: 0,
        lastAudit: new Date().toISOString()
      };
    }

    const { data: keys, error: keysError } = await supabase
      .from('encryption_keys')
      .select('status, purpose, algorithm, creation_date, next_rotation_date, backup_key_exists, storage_location, compromise_suspected')
      .eq('tenant_id', tenantUUID);

    if (keysError) {
      handleSupabaseError(keysError, 'Get encryption keys for summary');
    }

    const totalKeys = keys?.length || 0;
    const activeKeys = keys?.filter(k => k.status === 'active').length || 0;
    const expiredKeys = keys?.filter(k => k.status === 'deprecated').length || 0;
    const compromisedKeys = keys?.filter(k => k.compromise_suspected).length || 0;

    // Calculate keys requiring rotation (next rotation date is past)
    const now = new Date();
    const pendingRotationKeys = keys?.filter(k =>
      k.next_rotation_date && new Date(k.next_rotation_date) < now
    ).length || 0;

    // Group by usage type
    const keysByType: Record<KeyUsageType, number> = {
      'data-encryption': 0,
      'key-encryption': 0,
      'signing': 0,
      'authentication': 0,
      'protocol-encryption': 0
    };

    keys?.forEach(key => {
      if (key.purpose && keysByType.hasOwnProperty(key.purpose)) {
        keysByType[key.purpose as KeyUsageType]++;
      }
    });

    // Group by algorithm
    const keysByAlgorithm: Record<KeyAlgorithm, number> = {
      'AES-256': 0,
      'AES-128': 0,
      'RSA-2048': 0,
      'RSA-4096': 0,
      'ECC-P256': 0,
      'ECC-P384': 0
    };

    keys?.forEach(key => {
      if (key.algorithm && keysByAlgorithm.hasOwnProperty(key.algorithm)) {
        keysByAlgorithm[key.algorithm as KeyAlgorithm]++;
      }
    });

    // Calculate average key age
    const keyAges = keys?.map(key => {
      const createdDate = new Date(key.creation_date);
      return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    }) || [];

    const averageKeyAge = keyAges.length > 0
      ? Math.round(keyAges.reduce((sum, age) => sum + age, 0) / keyAges.length)
      : 0;

    const oldestKeyAge = keyAges.length > 0 ? Math.max(...keyAges) : 0;

    const keysWithoutBackup = keys?.filter(k => !k.backup_key_exists).length || 0;
    const hsmProtectedKeys = keys?.filter(k => k.storage_location === 'hsm').length || 0;

    // Calculate compliance score based on various factors
    let complianceScore = 100;
    if (totalKeys > 0) {
      // Deduct points for expired keys
      complianceScore -= (expiredKeys / totalKeys) * 30;
      // Deduct points for keys requiring rotation
      complianceScore -= (pendingRotationKeys / totalKeys) * 25;
      // Deduct points for compromised keys
      complianceScore -= (compromisedKeys / totalKeys) * 40;
      // Deduct points for keys without backup
      complianceScore -= (keysWithoutBackup / totalKeys) * 15;
    }

    complianceScore = Math.max(0, Math.round(complianceScore));

    return {
      tenantId,
      totalKeys,
      activeKeys,
      expiredKeys,
      pendingRotationKeys,
      compromisedKeys,
      keysByType,
      keysByAlgorithm,
      averageKeyAge,
      oldestKeyAge,
      keysRequiringRotation: pendingRotationKeys,
      keysWithoutBackup,
      hsmProtectedKeys,
      complianceScore,
      lastAudit: undefined,
      nextAudit: undefined
    };
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get encryption key management summary');
  }
}

export async function initiateKeyRotation(
  tenantId: string,
  keyId: string,
  rotationType: 'scheduled' | 'manual' | 'emergency' | 'compliance',
  rotationReason?: string,
  initiatedBy?: string
): Promise<string> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase.rpc('initiate_key_rotation', {
      p_key_id: keyId,
      p_rotation_type: rotationType,
      p_rotation_reason: rotationReason || 'Manual rotation',
      p_initiated_by: initiatedBy
    });

    if (error) {
      handleSupabaseError(error, 'Initiate key rotation');
    }

    return data;
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Initiate key rotation');
  }
}

export async function getKeyAccessRequests(
  tenantId: string,
  keyId?: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('key_access_requests')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (keyId) {
      query = query.eq('key_id', keyId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('request_timestamp', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get key access requests');
    }

    return data || [];
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get key access requests');
  }
}

export async function getKeyComplianceChecks(
  tenantId: string,
  keyId?: string,
  options: QueryOptions = {}
): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('key_compliance_checks')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (keyId) {
      query = query.eq('key_id', keyId);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('check_timestamp', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get key compliance checks');
    }

    return data || [];
  } catch (error) {
    if (error instanceof EncryptionKeyQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get key compliance checks');
  }
}

export function isEncryptionKeyQueriesAvailable(): boolean {
  return isSupabaseConfigured();
}