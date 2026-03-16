/**
 * Tenant ID Mapping Utility
 * 
 * Maps frontend string tenant IDs to Supabase UUID tenant IDs.
 * This allows the frontend to continue using friendly string IDs while
 * the database uses UUIDs.
 */

import { supabase } from './supabase';

// Cache for tenant ID mappings
const tenantIdCache = new Map<string, string>();

/**
 * Map a frontend tenant ID (string) to a Supabase tenant UUID
 * 
 * For Power Transmission demo, we use the scenario_tag to identify tenants.
 * For other tenants, we'll need to add mappings as needed.
 */
export async function mapTenantIdToUUID(frontendTenantId: string): Promise<string | null> {
  if (!frontendTenantId) {
    return null;
  }

  // Check cache first
  if (tenantIdCache.has(frontendTenantId)) {
    return tenantIdCache.get(frontendTenantId)!;
  }

  // For Power Transmission demo, map various frontend IDs to the DEWA tenant
  // This includes the default upstream tenant when working in power sector
  const transmissionTenantIds = [
    'dewa-transmission',  // DEWA - Transmission tenant ID
    'alpha-upstream',     // Default upstream tenant that gets mapped to transmission for cybersecurity
    't-upstream',         // Another upstream tenant ID
    'power-transmission-demo'
  ];

  if (transmissionTenantIds.includes(frontendTenantId)) {
    // Query the database to get the actual UUID
    try {
      const { data, error } = await supabase!
        .from('tenants')
        .select('id')
        .eq('scenario_tag', 'power_transmission_demo_v1')
        .maybeSingle();

      if (error) {
        console.error('Error querying tenant:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (data) {
        tenantIdCache.set(frontendTenantId, data.id);
        return data.id;
      } else {
        console.warn(`Tenant with scenario_tag 'power_transmission_demo_v1' not found in database`);

        // DEBUG: List all tenants to see what's actually there
        const { data: allTenants } = await supabase!.from('tenants').select('*');
        console.log('DEBUG: Current tenants in DB:', allTenants);
      }
    } catch (error) {
      console.error('Error mapping tenant ID:', error);
    }
  }

  // For other upstream O&G tenants, return null (not yet in Supabase)
  // These will continue to use mock data
  if (frontendTenantId.includes('field') || frontendTenantId.includes('drilling')) {
    return null;
  }

  return null;
}

/**
 * Check if a tenant exists in Supabase
 */
export async function isTenantInSupabase(frontendTenantId: string): Promise<boolean> {
  const uuid = await mapTenantIdToUUID(frontendTenantId);
  return uuid !== null;
}

/**
 * Clear the tenant ID cache (useful for testing)
 */
export function clearTenantIdCache(): void {
  tenantIdCache.clear();
}
