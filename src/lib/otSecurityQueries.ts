/**
 * OT Security Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for OT asset security, network zones, and exposure assessments.
 * Implements RLS-aware queries with proper error handling and loading states.
 * Requirements: 3.1, 3.2, 3.5, 3.8, 8.1
 */

import { supabase } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  SecurityZone,
  SecurityConduit,
  OTAssetSecurity,
  RemoteAccessSession,
  NetworkExposureAssessment,
  SecurityZoneType,
  ComplianceStatus,
  OTAssetCriticality,
  OTAssetSecurityStatus,
  RemoteSessionStatus,
  AssessmentType,
  ExposureLevel,
  MitigationStatus
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
 * OT security query error class
 */
export class OTSecurityQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'OTSecurityQueryError';
  }
}


/**
 * Ensure Supabase is connected and throw descriptive error if not
 */
function ensureSupabaseConnected(): void {
  if (!supabase) { // Removed isSupabaseConfigured check as it's not imported
    throw new OTSecurityQueryError(
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
    throw new OTSecurityQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new OTSecurityQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Security Zones (IEC 62443)
// ============================================================================

/**
 * Get all security zones for a tenant with RLS enforcement
 */
export async function getSecurityZones(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityZone[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_zones')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('name');
    }


    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security zones');
    }

    return toCamelCase<SecurityZone[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security zones');
  }
}

/**
 * Get security zones by site
 */
export async function getSecurityZonesBySite(
  tenantId: string,
  siteId: string
): Promise<SecurityZone[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('security_zones')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('site_id', siteId)
      .order('name');

    if (error) {
      handleSupabaseError(error, 'Get security zones by site');
    }

    return toCamelCase<SecurityZone[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security zones by site');
  }
}


/**
 * Get security zones by type
 */
export async function getSecurityZonesByType(
  tenantId: string,
  zoneType: SecurityZoneType
): Promise<SecurityZone[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('security_zones')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('zone_type', zoneType)
      .order('name');

    if (error) {
      handleSupabaseError(error, 'Get security zones by type');
    }

    return toCamelCase<SecurityZone[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security zones by type');
  }
}

/**
 * Get a single security zone by ID
 */
export async function getSecurityZoneById(
  tenantId: string,
  zoneId: string
): Promise<SecurityZone | null> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
      .from('security_zones')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', zoneId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get security zone by ID');
    }

    return toCamelCase<SecurityZone | null>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security zone by ID');
  }
}


/**
 * Create a new security zone
 */
export async function createSecurityZone(
  zone: Omit<SecurityZone, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SecurityZone> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('security_zones')
      .insert([zone])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security zone');
    }

    return toCamelCase<SecurityZone>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security zone');
  }
}

/**
 * Update a security zone
 */
export async function updateSecurityZone(
  tenantId: string,
  zoneId: string,
  updates: Partial<Omit<SecurityZone, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<SecurityZone> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('security_zones')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', zoneId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update security zone');
    }

    return toCamelCase<SecurityZone>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update security zone');
  }
}


/**
 * Delete a security zone
 */
export async function deleteSecurityZone(
  tenantId: string,
  zoneId: string
): Promise<void> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { error } = await supabase!
      .from('security_zones')
      .delete()
      .eq('tenant_id', tenantUUID)
      .eq('id', zoneId);

    if (error) {
      handleSupabaseError(error, 'Delete security zone');
    }
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Delete security zone');
  }
}

// ============================================================================
// Security Conduits (IEC 62443)
// ============================================================================

/**
 * Get all security conduits for a tenant
 */
export async function getSecurityConduits(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityConduit[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_conduits')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('name');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security conduits');
    }

    return toCamelCase<SecurityConduit[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security conduits');
  }
}


/**
 * Get conduits for a specific zone (source or target)
 */
export async function getConduitsForZone(
  tenantId: string,
  zoneId: string
): Promise<SecurityConduit[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('security_conduits')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .or(`source_zone_id.eq.${zoneId},target_zone_id.eq.${zoneId}`)
      .order('name');

    if (error) {
      handleSupabaseError(error, 'Get conduits for zone');
    }

    return toCamelCase<SecurityConduit[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get conduits for zone');
  }
}

/**
 * Create a new security conduit
 */
export async function createSecurityConduit(
  conduit: Omit<SecurityConduit, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SecurityConduit> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('security_conduits')
      .insert([conduit])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security conduit');
    }

    return toCamelCase<SecurityConduit>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security conduit');
  }
}

/**
 * Get a single security conduit by ID
 */
export async function getSecurityConduitById(
  tenantId: string,
  conduitId: string
): Promise<SecurityConduit | null> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
      .from('security_conduits')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', conduitId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get security conduit by ID');
    }

    return toCamelCase<SecurityConduit | null>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security conduit by ID');
  }
}

/**
 * Update a security conduit
 */
export async function updateSecurityConduit(
  tenantId: string,
  conduitId: string,
  updates: Partial<Omit<SecurityConduit, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<SecurityConduit> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('security_conduits')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', conduitId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update security conduit');
    }

    return toCamelCase<SecurityConduit>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update security conduit');
  }
}

/**
 * Delete a security conduit
 */
export async function deleteSecurityConduit(
  tenantId: string,
  conduitId: string
): Promise<void> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { error } = await supabase!
      .from('security_conduits')
      .delete()
      .eq('tenant_id', tenantUUID)
      .eq('id', conduitId);

    if (error) {
      handleSupabaseError(error, 'Delete security conduit');
    }
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Delete security conduit');
  }
}


// ============================================================================
// OT Asset Security
// ============================================================================

/**
 * Get all OT asset security records for a tenant
 */
export async function getOTAssetSecurity(
  tenantId: string,
  options: QueryOptions = {}
): Promise<OTAssetSecurity[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('risk_score', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get OT asset security');
    }

    return toCamelCase<OTAssetSecurity[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security');
  }
}

/**
 * Get OT asset security with asset details (join)
 */
export async function getOTAssetSecurityWithAssets(
  tenantId: string,
  options: QueryOptions = {}
): Promise<(OTAssetSecurity & { asset: unknown })[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('ot_asset_security')
      .select('*, asset:assets(*)')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get OT asset security with assets');
    }

    return toCamelCase<(OTAssetSecurity & { asset: unknown })[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security with assets');
  }
}


/**
 * Get OT asset security by zone
 */
export async function getOTAssetSecurityByZone(
  tenantId: string,
  zoneId: string
): Promise<OTAssetSecurity[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('zone_id', zoneId)
      .order('risk_score', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get OT asset security by zone');
    }

    return toCamelCase<OTAssetSecurity[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security by zone');
  }
}

/**
 * Get OT asset security by site
 */
export async function getOTAssetSecurityBySite(
  tenantId: string,
  siteId: string
): Promise<OTAssetSecurity[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('site_id', siteId)
      .order('asset_name', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get OT asset security by site');
    }

    return toCamelCase<OTAssetSecurity[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security by site');
  }
}

/**
 * Get OT asset security by criticality
 */
export async function getOTAssetSecurityByCriticality(
  tenantId: string,
  criticality: OTAssetCriticality
): Promise<OTAssetSecurity[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('criticality', criticality)
      .order('risk_score', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get OT asset security by criticality');
    }

    return toCamelCase<OTAssetSecurity[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security by criticality');
  }
}


/**
 * Get OT asset security by status
 */
export async function getOTAssetSecurityByStatus(
  tenantId: string,
  status: OTAssetSecurityStatus
): Promise<OTAssetSecurity[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('security_status', status)
      .order('risk_score', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get OT asset security by status');
    }

    return data || [];
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security by status');
  }
}

/**
 * Get OT asset security for a specific asset
 */
export async function getOTAssetSecurityByAssetId(
  tenantId: string,
  assetId: string
): Promise<OTAssetSecurity | null> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('asset_id', assetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get OT asset security by asset ID');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get OT asset security by asset ID');
  }
}


/**
 * Create OT asset security record
 */
export async function createOTAssetSecurity(
  assetSecurity: Omit<OTAssetSecurity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OTAssetSecurity> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('ot_asset_security')
      .insert([assetSecurity])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create OT asset security');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create OT asset security');
  }
}

/**
 * Update OT asset security record
 */
export async function updateOTAssetSecurity(
  tenantId: string,
  assetSecurityId: string,
  updates: Partial<Omit<OTAssetSecurity, 'id' | 'tenantId' | 'assetId' | 'createdAt' | 'updatedAt'>>
): Promise<OTAssetSecurity> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', assetSecurityId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update OT asset security');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update OT asset security');
  }
}


// ============================================================================
// Remote Access Sessions
// ============================================================================

/**
 * Get all remote access sessions for a tenant
 */
export async function getRemoteAccessSessions(
  tenantId: string,
  options: QueryOptions = {}
): Promise<RemoteAccessSession[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('remote_access_sessions')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('session_start', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get remote access sessions');
    }

    return data || [];
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get remote access sessions');
  }
}

/**
 * Get active remote access sessions
 */
export async function getActiveRemoteAccessSessions(
  tenantId: string
): Promise<RemoteAccessSession[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', 'active')
      .order('session_start', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get active remote access sessions');
    }

    return data || [];
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get active remote access sessions');
  }
}


/**
 * Get remote access sessions by status
 */
export async function getRemoteAccessSessionsByStatus(
  tenantId: string,
  status: RemoteSessionStatus
): Promise<RemoteAccessSession[]> {
  ensureSupabaseConnected();

  try {

    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', status)
      .order('session_start', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get remote access sessions by status');
    }

    return toCamelCase<RemoteAccessSession[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get remote access sessions by status');
  }
}

/**
 * Get remote access sessions for a specific user
 */
export async function getRemoteAccessSessionsByUser(
  tenantId: string,
  userId: string
): Promise<RemoteAccessSession[]> {
  ensureSupabaseConnected();

  try {

    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('user_id', userId)
      .order('session_start', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get remote access sessions by user');
    }

    return toCamelCase<RemoteAccessSession[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get remote access sessions by user');
  }
}


/**
 * Create a remote access session
 */
export async function createRemoteAccessSession(
  session: Omit<RemoteAccessSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RemoteAccessSession> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .insert([session])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create remote access session');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create remote access session');
  }
}

/**
 * Update a remote access session
 */
export async function updateRemoteAccessSession(
  tenantId: string,
  sessionId: string,
  updates: Partial<Omit<RemoteAccessSession, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<RemoteAccessSession> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update remote access session');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update remote access session');
  }
}


/**
 * Terminate a remote access session
 */
export async function terminateRemoteAccessSession(
  tenantId: string,
  sessionId: string,
  terminationReason: string
): Promise<RemoteAccessSession> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('remote_access_sessions')
      .update({
        status: 'terminated',
        session_end: new Date().toISOString(),
        termination_reason: terminationReason
      })
      .eq('tenant_id', tenantId)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Terminate remote access session');
    }

    return data;
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Terminate remote access session');
  }
}

// ============================================================================
// Network Exposure Assessments
// ============================================================================

/**
 * Get all network exposure assessments for a tenant
 */
export async function getNetworkExposureAssessments(
  tenantId: string,
  options: QueryOptions = {}
): Promise<NetworkExposureAssessment[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('network_exposure_assessments')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('assessment_date', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get network exposure assessments');
    }

    return toCamelCase<NetworkExposureAssessment[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get network exposure assessments');
  }
}


/**
 * Get network exposure assessments by exposure level
 */
export async function getNetworkExposureAssessmentsByLevel(
  tenantId: string,
  exposureLevel: ExposureLevel
): Promise<NetworkExposureAssessment[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('network_exposure_assessments')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('exposure_level', exposureLevel)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get network exposure assessments by level');
    }

    return toCamelCase<NetworkExposureAssessment[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get network exposure assessments by level');
  }
}

/**
 * Get network exposure assessments for a specific asset
 */
export async function getNetworkExposureAssessmentsByAsset(
  tenantId: string,
  assetId: string
): Promise<NetworkExposureAssessment[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('network_exposure_assessments')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('asset_id', assetId)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get network exposure assessments by asset');
    }

    return toCamelCase<NetworkExposureAssessment[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get network exposure assessments by asset');
  }
}


/**
 * Get network exposure assessments by zone
 */
export async function getNetworkExposureAssessmentsByZone(
  tenantId: string,
  zoneId: string
): Promise<NetworkExposureAssessment[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('network_exposure_assessments')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('zone_id', zoneId)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get network exposure assessments by zone');
    }

    return toCamelCase<NetworkExposureAssessment[]>(data || []);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get network exposure assessments by zone');
  }
}

/**
 * Create a network exposure assessment
 */
export async function createNetworkExposureAssessment(
  assessment: Omit<NetworkExposureAssessment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NetworkExposureAssessment> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('network_exposure_assessments')
      .insert([assessment])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create network exposure assessment');
    }

    return toCamelCase<NetworkExposureAssessment>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create network exposure assessment');
  }
}

/**
 * Update a network exposure assessment
 */
export async function updateNetworkExposureAssessment(
  tenantId: string,
  assessmentId: string,
  updates: Partial<Omit<NetworkExposureAssessment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<NetworkExposureAssessment> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new OTSecurityQueryError('Invalid tenant ID', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('network_exposure_assessments')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update network exposure assessment');
    }

    return toCamelCase<NetworkExposureAssessment>(data);
  } catch (error) {
    if (error instanceof OTSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update network exposure assessment');
  }
}
