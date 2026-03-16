/**
 * Data Provider Factory
 * 
 * This is the SINGLE ENTRYPOINT for all data access in the application.
 * 
 * Usage:
 *   import { getDataProvider } from "@/lib/data";
 *   const provider = getDataProvider();
 *   const tenants = await provider.getTenants();
 * 
 * The provider is selected based on VITE_DATA_BACKEND:
 *   - "mock" (default): Uses MockProvider with legacy mock data
 *   - "supabase": Uses SupabaseProvider with Supabase backend
 * 
 * MIGRATION RULES:
 * 1. All data access MUST go through this provider
 * 2. No direct imports from src/data/* outside of MockProvider
 * 3. Components should use React Query or similar for caching
 */

import type { DataProvider } from "./DataProvider";
import { getMockProvider } from "./providers/MockProvider";
import { getSupabaseProvider } from "./providers/SupabaseProvider";
import { getHybridProvider } from "./providers/HybridProvider";
import { getDataBackend } from "@/lib/supabase";

// Re-export types for convenience
export type { DataProvider, SiteSummary, ProviderInfo } from "./DataProvider";

/**
 * Get the configured data provider instance
 * 
 * Returns MockProvider, SupabaseProvider, or HybridProvider based on VITE_DATA_BACKEND env var.
 * The provider is a singleton - same instance returned on each call.
 */
export function getDataProvider(): DataProvider {
  const backend = getDataBackend();
  
  console.log(`[DataProvider Factory] Backend mode: ${backend}`);
  
  if (backend === "supabase") {
    console.log('[DataProvider Factory] Using SupabaseProvider');
    return getSupabaseProvider();
  }
  
  if (backend === "hybrid") {
    console.log('[DataProvider Factory] Using HybridProvider');
    return getHybridProvider();
  }
  
  console.log('[DataProvider Factory] Using MockProvider');
  return getMockProvider();
}

/**
 * Get the current backend mode
 */
export function getCurrentBackend(): "mock" | "supabase" | "hybrid" {
  return getDataBackend();
}

/**
 * Check if we're using the mock backend
 */
export function isMockBackend(): boolean {
  return getDataBackend() === "mock";
}

/**
 * Check if we're using the hybrid backend
 */
export function isHybridBackend(): boolean {
  return getDataBackend() === "hybrid";
}

/**
 * Check if we're using the Supabase backend
 */
export function isSupabaseBackend(): boolean {
  return getDataBackend() === "supabase";
}
