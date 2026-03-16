/**
 * APM Grid Topology Integration
 * 
 * Utilities for integrating APM features with existing grid topology
 * (grid_nodes, grid_lines, grid_asset_links tables).
 * 
 * This ensures APM queries respect existing tenant_id filtering and
 * leverage existing site relationships.
 * 
 * Requirements: 31.5
 */

import { supabase } from './supabase';
import { getTransmissionTenantId } from './tenantUtils';

/**
 * Grid node representing a substation, junction, or plant
 */
export interface GridNode {
  id: string;
  tenant_id: string;
  site_id: string | null;
  name: string;
  node_type: 'substation' | 'junction' | 'plant';
  voltage_kv: number | null;
  region: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  created_at: string;
}

/**
 * Grid line representing a transmission line between nodes
 */
export interface GridLine {
  id: string;
  tenant_id: string;
  name: string;
  from_node_id: string;
  to_node_id: string;
  voltage_kv: number | null;
  length_km: number | null;
  status: 'active' | 'maintenance' | 'offline';
  created_at: string;
}

/**
 * Link between an asset and grid topology (node or line)
 */
export interface GridAssetLink {
  id: string;
  asset_id: string;
  node_id: string | null;
  line_id: string | null;
}

/**
 * Get grid nodes for the current transmission tenant
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns Array of grid nodes filtered by tenant_id
 * 
 * @example
 * ```ts
 * const nodes = await getGridNodesForTenant('t1');
 * console.log(`Found ${nodes.length} substations`);
 * ```
 */
export async function getGridNodesForTenant(mockTenantId: string): Promise<GridNode[]> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return [];
  }

  try {
    // Get the real tenant ID for power transmission
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // Query grid_nodes with tenant filtering
    const { data, error } = await supabase
      .from('grid_nodes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      console.error('[apmGridTopology] Error fetching grid nodes:', error);
      return [];
    }

    return (data as GridNode[]) || [];
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch grid nodes:', err);
    return [];
  }
}

/**
 * Get grid lines for the current transmission tenant
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns Array of grid lines filtered by tenant_id
 * 
 * @example
 * ```ts
 * const lines = await getGridLinesForTenant('t1');
 * console.log(`Found ${lines.length} transmission lines`);
 * ```
 */
export async function getGridLinesForTenant(mockTenantId: string): Promise<GridLine[]> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return [];
  }

  try {
    // Get the real tenant ID for power transmission
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // Query grid_lines with tenant filtering
    const { data, error } = await supabase
      .from('grid_lines')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      console.error('[apmGridTopology] Error fetching grid lines:', error);
      return [];
    }

    return (data as GridLine[]) || [];
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch grid lines:', err);
    return [];
  }
}

/**
 * Get grid topology links for a specific asset
 * 
 * @param assetId - The asset ID to get links for
 * @returns Array of grid asset links
 * 
 * @example
 * ```ts
 * const links = await getGridLinksForAsset('asset-uuid');
 * if (links.length > 0) {
 *   console.log('Asset is linked to grid topology');
 * }
 * ```
 */
export async function getGridLinksForAsset(assetId: string): Promise<GridAssetLink[]> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return [];
  }

  try {
    // Query grid_asset_links for this asset
    const { data, error } = await supabase
      .from('grid_asset_links')
      .select('*')
      .eq('asset_id', assetId);

    if (error) {
      console.error('[apmGridTopology] Error fetching grid links:', error);
      return [];
    }

    return (data as GridAssetLink[]) || [];
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch grid links:', err);
    return [];
  }
}

/**
 * Get all assets linked to a specific grid node
 * 
 * @param nodeId - The grid node ID
 * @returns Array of asset IDs linked to this node
 * 
 * @example
 * ```ts
 * const assetIds = await getAssetsForGridNode('node-uuid');
 * console.log(`Found ${assetIds.length} assets at this substation`);
 * ```
 */
export async function getAssetsForGridNode(nodeId: string): Promise<string[]> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return [];
  }

  try {
    // Query grid_asset_links for this node
    const { data, error } = await supabase
      .from('grid_asset_links')
      .select('asset_id')
      .eq('node_id', nodeId);

    if (error) {
      console.error('[apmGridTopology] Error fetching assets for node:', error);
      return [];
    }

    return (data || []).map(link => link.asset_id);
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch assets for node:', err);
    return [];
  }
}

/**
 * Get all assets linked to a specific grid line
 * 
 * @param lineId - The grid line ID
 * @returns Array of asset IDs linked to this line
 * 
 * @example
 * ```ts
 * const assetIds = await getAssetsForGridLine('line-uuid');
 * console.log(`Found ${assetIds.length} assets on this line`);
 * ```
 */
export async function getAssetsForGridLine(lineId: string): Promise<string[]> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return [];
  }

  try {
    // Query grid_asset_links for this line
    const { data, error } = await supabase
      .from('grid_asset_links')
      .select('asset_id')
      .eq('line_id', lineId);

    if (error) {
      console.error('[apmGridTopology] Error fetching assets for line:', error);
      return [];
    }

    return (data || []).map(link => link.asset_id);
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch assets for line:', err);
    return [];
  }
}

/**
 * Get grid node with linked assets
 * 
 * @param nodeId - The grid node ID
 * @returns Grid node with array of linked asset IDs
 * 
 * @example
 * ```ts
 * const nodeWithAssets = await getGridNodeWithAssets('node-uuid');
 * console.log(`${nodeWithAssets.node.name} has ${nodeWithAssets.assetIds.length} assets`);
 * ```
 */
export async function getGridNodeWithAssets(nodeId: string): Promise<{
  node: GridNode | null;
  assetIds: string[];
}> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return { node: null, assetIds: [] };
  }

  try {
    // Fetch node
    const { data: nodeData, error: nodeError } = await supabase
      .from('grid_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('[apmGridTopology] Error fetching grid node:', nodeError);
      return { node: null, assetIds: [] };
    }

    // Fetch linked assets
    const assetIds = await getAssetsForGridNode(nodeId);

    return {
      node: nodeData as GridNode,
      assetIds
    };
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch node with assets:', err);
    return { node: null, assetIds: [] };
  }
}

/**
 * Get grid line with linked assets
 * 
 * @param lineId - The grid line ID
 * @returns Grid line with array of linked asset IDs
 * 
 * @example
 * ```ts
 * const lineWithAssets = await getGridLineWithAssets('line-uuid');
 * console.log(`${lineWithAssets.line.name} has ${lineWithAssets.assetIds.length} assets`);
 * ```
 */
export async function getGridLineWithAssets(lineId: string): Promise<{
  line: GridLine | null;
  assetIds: string[];
}> {
  if (!supabase) {
    console.warn('[apmGridTopology] Supabase not configured');
    return { line: null, assetIds: [] };
  }

  try {
    // Fetch line
    const { data: lineData, error: lineError } = await supabase
      .from('grid_lines')
      .select('*')
      .eq('id', lineId)
      .single();

    if (lineError) {
      console.error('[apmGridTopology] Error fetching grid line:', lineError);
      return { line: null, assetIds: [] };
    }

    // Fetch linked assets
    const assetIds = await getAssetsForGridLine(lineId);

    return {
      line: lineData as GridLine,
      assetIds
    };
  } catch (err) {
    console.error('[apmGridTopology] Failed to fetch line with assets:', err);
    return { line: null, assetIds: [] };
  }
}
