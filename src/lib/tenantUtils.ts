/**
 * Tenant Utilities
 *
 * Helper functions to bridge the gap between mock tenant IDs in AppContext
 * and real tenant IDs in Supabase.
 *
 * TEMPORARY: This is a workaround until AppContext is updated to use DataProvider
 */

import { supabase } from './supabase';

// ─── In-memory promise cache ──────────────────────────────────────────────────
// Key: "sector/subsector" (e.g. "power/transmission")
// Value: an in-flight or already-resolved Promise<string>
//
// Using a Promise cache (not just a value cache) ensures that even if 10
// hooks call getTransmissionTenantId simultaneously before the first DB round-
// trip completes, they all share the SAME promise and make exactly ONE query.
const _tenantIdCache = new Map<string, Promise<string>>();

/**
 * Get the real Supabase tenant ID for the current sector/subsector.
 *
 * Results are cached in module memory; repeated calls with the same
 * sector/subsector return immediately without hitting the database again.
 *
 * @param mockTenantId - The tenant ID from AppContext (may be mock)
 * @param sector - The sector (e.g., 'power', 'oil & gas')
 * @param subsector - The subsector (e.g., 'transmission', 'upstream')
 * @returns The real Supabase tenant ID, or the mock ID if not using Supabase
 */
export async function getRealTenantId(
  mockTenantId: string,
  sector?: string | null,
  subsector?: string | null
): Promise<string> {
  const dataBackend = import.meta.env.VITE_DATA_BACKEND;

  // If not using Supabase, return the mock ID as-is (no cache needed)
  if (dataBackend !== 'supabase' && dataBackend !== 'hybrid') {
    return mockTenantId;
  }

  // If Supabase is not configured, return mock ID (no cache needed)
  if (!supabase) {
    console.warn('[tenantUtils] Supabase not configured, using mock tenant ID');
    return mockTenantId;
  }

  // Build a stable cache key from sector + subsector
  const cacheKey = `${sector ?? ''}/${subsector ?? ''}`;

  // Return the cached promise immediately if it exists
  if (_tenantIdCache.has(cacheKey)) {
    return _tenantIdCache.get(cacheKey)!;
  }

  // Build and cache the resolution promise BEFORE awaiting so concurrent
  // callers find it on their first check.
  const resolutionPromise = (async (): Promise<string> => {
    try {
      let query = supabase.from('tenants').select('id');

      if (sector) {
        query = query.eq('sector', sector.toLowerCase());
      }
      if (subsector) {
        query = query.eq('subsector', subsector.toLowerCase());
      }
      query = query.limit(1);

      console.log(`[tenantUtils] Querying Supabase for tenant (${cacheKey})...`);
      const { data, error } = await query;

      if (error) {
        console.error('[tenantUtils] Error querying Supabase for tenant:', error);
        // Remove from cache on error so the next call retries
        _tenantIdCache.delete(cacheKey);
        return mockTenantId;
      }

      if (data && data.length > 0) {
        const realId = data[0].id;
        console.log(`[tenantUtils] ✅ Resolved tenant ID: ${mockTenantId} → ${realId} (${sector}/${subsector})`);
        return realId;
      }

      console.warn(`[tenantUtils] ⚠️ No tenant found in Supabase for ${sector}/${subsector}, using mock ID`);
      return mockTenantId;
    } catch (err) {
      console.error('[tenantUtils] Failed to resolve tenant ID:', err);
      _tenantIdCache.delete(cacheKey);
      return mockTenantId;
    }
  })();

  _tenantIdCache.set(cacheKey, resolutionPromise);
  return resolutionPromise;
}

/**
 * Get the real Supabase tenant ID for Power Transmission
 *
 * Convenience function specifically for transmission pages.
 * Result is cached after the first resolution.
 */
export async function getTransmissionTenantId(mockTenantId: string): Promise<string> {
  return getRealTenantId(mockTenantId, 'power', 'transmission');
}

/**
 * Get the real Supabase tenant ID for Oil & Gas Upstream
 *
 * Convenience function specifically for upstream pages.
 * Result is cached after the first resolution.
 */
export async function getUpstreamTenantId(mockTenantId: string): Promise<string> {
  return getRealTenantId(mockTenantId, 'oil & gas', 'upstream');
}

/**
 * Clear the tenant ID cache.
 * Useful in tests or when switching tenants at runtime.
 */
export function clearTenantIdCache(): void {
  _tenantIdCache.clear();
}
