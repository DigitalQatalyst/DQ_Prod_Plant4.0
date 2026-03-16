import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSecurityDataOptions<T> {
  fetchFn: () => T | Promise<T>;
  dependencies?: any[];
  initialData?: T;
  onError?: (error: Error) => void;
}

interface UseSecurityDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  refresh: () => void;
}

export function useSecurityData<T>({
  fetchFn,
  dependencies = [],
  initialData = null,
  onError
}: UseSecurityDataOptions<T>): UseSecurityDataResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchFnRef = useRef(fetchFn);
  const onErrorRef = useRef(onError);
  
  // Update refs when props change
  fetchFnRef.current = fetchFn;
  onErrorRef.current = onError;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await Promise.resolve(fetchFnRef.current());
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    retry,
    refresh
  };
}

// Specialized hook for tenant-filtered data
export function useTenantSecurityData<T>(
  tenantId: string,
  fetchFn: (tenantId: string) => T | Promise<T>,
  options?: Omit<UseSecurityDataOptions<T>, 'fetchFn' | 'dependencies'>
) {
  const memoizedFetchFn = useCallback(() => fetchFn(tenantId), [fetchFn, tenantId]);
  
  return useSecurityData({
    ...options,
    fetchFn: memoizedFetchFn,
    dependencies: [tenantId]
  });
}

// Hook for handling async operations with loading states
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
}