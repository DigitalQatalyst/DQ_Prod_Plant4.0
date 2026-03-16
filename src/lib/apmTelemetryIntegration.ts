/**
 * APM Telemetry Integration
 * 
 * Utilities for integrating APM features with existing telemetry structure
 * (telemetry_points, tags tables).
 * 
 * This ensures APM queries respect existing tenant isolation through asset
 * relationships and use existing protocol and address mappings.
 * 
 * Requirements: 31.6
 */

import { supabase } from './supabase';
import { getTransmissionTenantId } from './tenantUtils';

/**
 * Telemetry protocol types
 */
export type TelemetryProtocol = 'OPC-UA' | 'Modbus' | 'MQTT' | 'DNP3' | 'IEC61850';

/**
 * Tag representing protocol/address mapping for telemetry
 */
export interface Tag {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  protocol: TelemetryProtocol;
  address: string;
  name: string | null;
  created_at: string;
}

/**
 * Telemetry point representing a metric definition
 */
export interface TelemetryPoint {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  tag_id: string | null;
  metric: string;
  unit: string | null;
  limits: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
  } | null;
  created_at: string;
}

/**
 * Get telemetry points for a specific asset
 * 
 * @param assetId - The asset ID to get telemetry points for
 * @returns Array of telemetry points for the asset
 * 
 * @example
 * ```ts
 * const points = await getTelemetryPointsForAsset('asset-uuid');
 * console.log(`Found ${points.length} telemetry points`);
 * ```
 */
export async function getTelemetryPointsForAsset(assetId: string): Promise<TelemetryPoint[]> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return [];
  }

  try {
    // Query telemetry_points for this asset
    // Tenant isolation is enforced through asset_id relationship
    const { data, error } = await supabase
      .from('telemetry_points')
      .select('*')
      .eq('asset_id', assetId)
      .order('metric');

    if (error) {
      console.error('[apmTelemetry] Error fetching telemetry points:', error);
      return [];
    }

    return (data as TelemetryPoint[]) || [];
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch telemetry points:', err);
    return [];
  }
}

/**
 * Get tags for a specific asset
 * 
 * @param assetId - The asset ID to get tags for
 * @returns Array of tags for the asset
 * 
 * @example
 * ```ts
 * const tags = await getTagsForAsset('asset-uuid');
 * console.log(`Found ${tags.length} tags`);
 * ```
 */
export async function getTagsForAsset(assetId: string): Promise<Tag[]> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return [];
  }

  try {
    // Query tags for this asset
    // Tenant isolation is enforced through asset_id relationship
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('asset_id', assetId)
      .order('name');

    if (error) {
      console.error('[apmTelemetry] Error fetching tags:', error);
      return [];
    }

    return (data as Tag[]) || [];
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch tags:', err);
    return [];
  }
}

/**
 * Get telemetry points for the current transmission tenant
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns Array of telemetry points filtered by tenant_id
 * 
 * @example
 * ```ts
 * const points = await getTelemetryPointsForTenant('t1');
 * console.log(`Found ${points.length} telemetry points for tenant`);
 * ```
 */
export async function getTelemetryPointsForTenant(mockTenantId: string): Promise<TelemetryPoint[]> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return [];
  }

  try {
    // Get the real tenant ID for power transmission
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // Query telemetry_points with tenant filtering
    const { data, error } = await supabase
      .from('telemetry_points')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('metric');

    if (error) {
      console.error('[apmTelemetry] Error fetching telemetry points:', error);
      return [];
    }

    return (data as TelemetryPoint[]) || [];
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch telemetry points:', err);
    return [];
  }
}

/**
 * Get tags for the current transmission tenant
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns Array of tags filtered by tenant_id
 * 
 * @example
 * ```ts
 * const tags = await getTagsForTenant('t1');
 * console.log(`Found ${tags.length} tags for tenant`);
 * ```
 */
export async function getTagsForTenant(mockTenantId: string): Promise<Tag[]> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return [];
  }

  try {
    // Get the real tenant ID for power transmission
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // Query tags with tenant filtering
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      console.error('[apmTelemetry] Error fetching tags:', error);
      return [];
    }

    return (data as Tag[]) || [];
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch tags:', err);
    return [];
  }
}

/**
 * Get telemetry point with associated tag information
 * 
 * @param pointId - The telemetry point ID
 * @returns Telemetry point with tag information
 * 
 * @example
 * ```ts
 * const pointWithTag = await getTelemetryPointWithTag('point-uuid');
 * if (pointWithTag.tag) {
 *   console.log(`Protocol: ${pointWithTag.tag.protocol}, Address: ${pointWithTag.tag.address}`);
 * }
 * ```
 */
export async function getTelemetryPointWithTag(pointId: string): Promise<{
  point: TelemetryPoint | null;
  tag: Tag | null;
}> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return { point: null, tag: null };
  }

  try {
    // Fetch telemetry point
    const { data: pointData, error: pointError } = await supabase
      .from('telemetry_points')
      .select('*')
      .eq('id', pointId)
      .single();

    if (pointError) {
      console.error('[apmTelemetry] Error fetching telemetry point:', pointError);
      return { point: null, tag: null };
    }

    const point = pointData as TelemetryPoint;

    // Fetch associated tag if exists
    let tag: Tag | null = null;
    if (point.tag_id) {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('*')
        .eq('id', point.tag_id)
        .single();

      if (!tagError && tagData) {
        tag = tagData as Tag;
      }
    }

    return { point, tag };
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch telemetry point with tag:', err);
    return { point: null, tag: null };
  }
}

/**
 * Get telemetry points by protocol
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @param protocol - The telemetry protocol to filter by
 * @returns Array of telemetry points using the specified protocol
 * 
 * @example
 * ```ts
 * const dnp3Points = await getTelemetryPointsByProtocol('t1', 'DNP3');
 * console.log(`Found ${dnp3Points.length} DNP3 telemetry points`);
 * ```
 */
export async function getTelemetryPointsByProtocol(
  mockTenantId: string,
  protocol: TelemetryProtocol
): Promise<TelemetryPoint[]> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return [];
  }

  try {
    // Get the real tenant ID for power transmission
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // Query telemetry_points joined with tags to filter by protocol
    const { data, error } = await supabase
      .from('telemetry_points')
      .select('*, tags!inner(protocol)')
      .eq('tenant_id', tenantId)
      .eq('tags.protocol', protocol)
      .order('metric');

    if (error) {
      console.error('[apmTelemetry] Error fetching telemetry points by protocol:', error);
      return [];
    }

    return (data as TelemetryPoint[]) || [];
  } catch (err) {
    console.error('[apmTelemetry] Failed to fetch telemetry points by protocol:', err);
    return [];
  }
}

/**
 * Check if an asset has telemetry configured
 * 
 * @param assetId - The asset ID to check
 * @returns True if the asset has at least one telemetry point
 * 
 * @example
 * ```ts
 * const hasTelemetry = await assetHasTelemetry('asset-uuid');
 * if (hasTelemetry) {
 *   console.log('Asset has telemetry configured');
 * }
 * ```
 */
export async function assetHasTelemetry(assetId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[apmTelemetry] Supabase not configured');
    return false;
  }

  try {
    // Query telemetry_points count for this asset
    const { count, error } = await supabase
      .from('telemetry_points')
      .select('*', { count: 'exact', head: true })
      .eq('asset_id', assetId);

    if (error) {
      console.error('[apmTelemetry] Error checking asset telemetry:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (err) {
    console.error('[apmTelemetry] Failed to check asset telemetry:', err);
    return false;
  }
}
