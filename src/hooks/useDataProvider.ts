/**
 * React hook for data provider access
 * 
 * Provides convenient access to the DataProvider with React Query integration.
 * Use this hook in components instead of calling getDataProvider() directly.
 * 
 * Usage:
 *   const { provider, backend } = useDataProvider();
 *   // Then use with React Query:
 *   const { data: tenants } = useQuery({
 *     queryKey: ['tenants'],
 *     queryFn: () => provider.getTenants()
 *   });
 */

import { useMemo } from "react";
import { getDataProvider, getCurrentBackend, type DataProvider } from "@/lib/data";

interface UseDataProviderResult {
  /** The data provider instance */
  provider: DataProvider;
  /** Current backend mode: "mock" or "supabase" */
  backend: "mock" | "supabase";
  /** Whether using mock backend */
  isMock: boolean;
  /** Whether using Supabase backend */
  isSupabase: boolean;
}

/**
 * Hook to access the data provider
 * 
 * The provider instance is memoized and stable across renders.
 */
export function useDataProvider(): UseDataProviderResult {
  const provider = useMemo(() => getDataProvider(), []);
  const backend = getCurrentBackend();
  
  return {
    provider,
    backend,
    isMock: backend === "mock",
    isSupabase: backend === "supabase"
  };
}
