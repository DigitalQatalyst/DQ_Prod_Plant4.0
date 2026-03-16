/**
 * Health Score Caching Utility
 * Validates Requirement 28.5
 * 
 * Implements caching for health scores with configurable TTL
 * to improve performance of repeated health score queries.
 */

export interface CachedHealthScore {
  assetId: string;
  score: number;
  computedAt: string;
  modelVersion: string;
  componentBreakdown: Record<string, number>;
  cachedAt: number; // timestamp when cached
}

export interface HealthScoreCacheConfig {
  ttlMs: number; // Time-to-live in milliseconds
  maxSize: number; // Maximum number of entries to cache
}

const DEFAULT_CONFIG: HealthScoreCacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes default TTL
  maxSize: 1000, // Cache up to 1000 health scores
};

/**
 * Simple in-memory cache for health scores
 * Uses LRU (Least Recently Used) eviction when max size is reached
 */
class HealthScoreCache {
  private cache: Map<string, CachedHealthScore>;
  private config: HealthScoreCacheConfig;
  private accessOrder: string[]; // Track access order for LRU

  constructor(config: Partial<HealthScoreCacheConfig> = {}) {
    this.cache = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.accessOrder = [];
  }

  /**
   * Get a cached health score for an asset
   * Returns null if not cached or expired
   */
  get(assetId: string): CachedHealthScore | null {
    const cached = this.cache.get(assetId);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - cached.cachedAt > this.config.ttlMs) {
      this.cache.delete(assetId);
      this.removeFromAccessOrder(assetId);
      return null;
    }

    // Update access order (move to end = most recently used)
    this.updateAccessOrder(assetId);

    return cached;
  }

  /**
   * Set a health score in the cache
   */
  set(healthScore: Omit<CachedHealthScore, 'cachedAt'>): void {
    const cached: CachedHealthScore = {
      ...healthScore,
      cachedAt: Date.now(),
    };

    // If cache is full, evict least recently used
    if (this.cache.size >= this.config.maxSize && !this.cache.has(healthScore.assetId)) {
      this.evictLRU();
    }

    this.cache.set(healthScore.assetId, cached);
    this.updateAccessOrder(healthScore.assetId);
  }

  /**
   * Invalidate (remove) a cached health score
   */
  invalidate(assetId: string): void {
    this.cache.delete(assetId);
    this.removeFromAccessOrder(assetId);
  }

  /**
   * Clear all cached health scores
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttlMs: this.config.ttlMs,
    };
  }

  /**
   * Update TTL configuration
   */
  setTTL(ttlMs: number): void {
    this.config.ttlMs = ttlMs;
  }

  /**
   * Update max size configuration
   */
  setMaxSize(maxSize: number): void {
    this.config.maxSize = maxSize;
    // Evict entries if current size exceeds new max
    while (this.cache.size > maxSize) {
      this.evictLRU();
    }
  }

  // Private helper methods

  private updateAccessOrder(assetId: string): void {
    this.removeFromAccessOrder(assetId);
    this.accessOrder.push(assetId);
  }

  private removeFromAccessOrder(assetId: string): void {
    const index = this.accessOrder.indexOf(assetId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    // Remove least recently used (first in access order)
    const lruAssetId = this.accessOrder.shift();
    if (lruAssetId) {
      this.cache.delete(lruAssetId);
    }
  }
}

// Export singleton instance with default configuration
export const healthScoreCache = new HealthScoreCache();

// Export class for custom instances
export { HealthScoreCache };
