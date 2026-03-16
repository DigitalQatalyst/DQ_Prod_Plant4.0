/**
 * Transmission Data Cache
 * 
 * Implements caching for frequently accessed transmission topology data
 * to reduce database queries and improve performance.
 * 
 * Requirements: 29.3, 29.4
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000
};

/**
 * Generic in-memory cache with TTL and size limits
 */
class InMemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private accessOrder: string[]; // For LRU eviction

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.accessOrder = [];
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.ttl);

    // Evict if cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt
    });

    this.updateAccessOrder(key);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromAccessOrder(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder.shift();
    }
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

/**
 * Transmission-specific cache instances
 */
export class TransmissionCache {
  // Cache for substation data (longer TTL as it changes infrequently)
  private static substationCache = new InMemoryCache<any>({
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 500
  });

  // Cache for feeder data
  private static feederCache = new InMemoryCache<any>({
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 2000
  });

  // Cache for transformer data
  private static transformerCache = new InMemoryCache<any>({
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 1000
  });

  // Cache for meter registry (shorter TTL as telemetry updates frequently)
  private static meterRegistryCache = new InMemoryCache<any>({
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 5000
  });

  // Cache for latest telemetry (very short TTL)
  private static latestTelemetryCache = new InMemoryCache<any>({
    ttl: 1 * 60 * 1000, // 1 minute
    maxSize: 1000
  });

  // Cache for KPI snapshots
  private static kpiCache = new InMemoryCache<any>({
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 2000
  });

  /**
   * Get or fetch substation data
   */
  static async getSubstation(
    orgId: string,
    substationId: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const key = `${orgId}:${substationId}`;
    const cached = this.substationCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.substationCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch substations list
   */
  static async getSubstations(
    orgId: string,
    fetchFn: () => Promise<any[]>
  ): Promise<any[]> {
    const key = `list:${orgId}`;
    const cached = this.substationCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.substationCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch feeder data
   */
  static async getFeeder(
    substationId: string,
    feederId: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const key = `${substationId}:${feederId}`;
    const cached = this.feederCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.feederCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch feeders list
   */
  static async getFeeders(
    substationId: string,
    fetchFn: () => Promise<any[]>
  ): Promise<any[]> {
    const key = `list:${substationId}`;
    const cached = this.feederCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.feederCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch transformer data
   */
  static async getTransformer(
    substationId: string,
    transformerId: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const key = `${substationId}:${transformerId}`;
    const cached = this.transformerCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.transformerCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch meter registry data
   */
  static async getMeterRegistry(
    orgId: string,
    filters: Record<string, any>,
    fetchFn: () => Promise<any[]>
  ): Promise<any[]> {
    const key = `registry:${orgId}:${JSON.stringify(filters)}`;
    const cached = this.meterRegistryCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.meterRegistryCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch latest telemetry
   */
  static async getLatestTelemetry(
    meterId: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const key = `telemetry:${meterId}`;
    const cached = this.latestTelemetryCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.latestTelemetryCache.set(key, data);
    return data;
  }

  /**
   * Get or fetch KPI snapshots
   */
  static async getKPISnapshots(
    scopeType: string,
    scopeId: string,
    period: string,
    fetchFn: () => Promise<any[]>
  ): Promise<any[]> {
    const key = `kpi:${scopeType}:${scopeId}:${period}`;
    const cached = this.kpiCache.get(key);
    
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    this.kpiCache.set(key, data);
    return data;
  }

  /**
   * Invalidate substation cache
   */
  static invalidateSubstation(orgId: string, substationId?: string): void {
    if (substationId) {
      this.substationCache.delete(`${orgId}:${substationId}`);
    }
    // Also invalidate list cache
    this.substationCache.delete(`list:${orgId}`);
  }

  /**
   * Invalidate feeder cache
   */
  static invalidateFeeder(substationId: string, feederId?: string): void {
    if (feederId) {
      this.feederCache.delete(`${substationId}:${feederId}`);
    }
    // Also invalidate list cache
    this.feederCache.delete(`list:${substationId}`);
  }

  /**
   * Invalidate transformer cache
   */
  static invalidateTransformer(substationId: string, transformerId?: string): void {
    if (transformerId) {
      this.transformerCache.delete(`${substationId}:${transformerId}`);
    }
  }

  /**
   * Invalidate meter registry cache
   */
  static invalidateMeterRegistry(orgId: string): void {
    // Clear all meter registry entries for this org
    const stats = this.meterRegistryCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(`registry:${orgId}:`)) {
        this.meterRegistryCache.delete(key);
      }
    });
  }

  /**
   * Invalidate latest telemetry cache
   */
  static invalidateLatestTelemetry(meterId: string): void {
    this.latestTelemetryCache.delete(`telemetry:${meterId}`);
  }

  /**
   * Invalidate KPI cache
   */
  static invalidateKPI(scopeType: string, scopeId: string): void {
    const stats = this.kpiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(`kpi:${scopeType}:${scopeId}:`)) {
        this.kpiCache.delete(key);
      }
    });
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    this.substationCache.clear();
    this.feederCache.clear();
    this.transformerCache.clear();
    this.meterRegistryCache.clear();
    this.latestTelemetryCache.clear();
    this.kpiCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      substations: this.substationCache.getStats(),
      feeders: this.feederCache.getStats(),
      transformers: this.transformerCache.getStats(),
      meterRegistry: this.meterRegistryCache.getStats(),
      latestTelemetry: this.latestTelemetryCache.getStats(),
      kpi: this.kpiCache.getStats()
    };
  }
}

/**
 * React hook for using transmission cache
 */
export function useTransmissionCache() {
  return {
    getSubstation: TransmissionCache.getSubstation,
    getSubstations: TransmissionCache.getSubstations,
    getFeeder: TransmissionCache.getFeeder,
    getFeeders: TransmissionCache.getFeeders,
    getTransformer: TransmissionCache.getTransformer,
    getMeterRegistry: TransmissionCache.getMeterRegistry,
    getLatestTelemetry: TransmissionCache.getLatestTelemetry,
    getKPISnapshots: TransmissionCache.getKPISnapshots,
    invalidateSubstation: TransmissionCache.invalidateSubstation,
    invalidateFeeder: TransmissionCache.invalidateFeeder,
    invalidateTransformer: TransmissionCache.invalidateTransformer,
    invalidateMeterRegistry: TransmissionCache.invalidateMeterRegistry,
    invalidateLatestTelemetry: TransmissionCache.invalidateLatestTelemetry,
    invalidateKPI: TransmissionCache.invalidateKPI,
    clearAll: TransmissionCache.clearAll,
    getStats: TransmissionCache.getStats
  };
}
