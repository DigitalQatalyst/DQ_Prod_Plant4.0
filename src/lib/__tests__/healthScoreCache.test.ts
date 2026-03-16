/**
 * Health Score Cache Tests
 * Validates Requirement 28.5
 * 
 * Tests the health score caching functionality with configurable TTL.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthScoreCache, healthScoreCache } from '../healthScoreCache';

describe('HealthScoreCache', () => {
  let cache: HealthScoreCache;

  beforeEach(() => {
    cache = new HealthScoreCache({ ttlMs: 1000, maxSize: 10 });
  });

  it('should cache and retrieve health scores', () => {
    const healthScore = {
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: { param1: 0.5, param2: 0.3 },
    };

    cache.set(healthScore);
    const cached = cache.get('asset-1');

    expect(cached).toBeDefined();
    expect(cached?.assetId).toBe('asset-1');
    expect(cached?.score).toBe(85);
    expect(cached?.modelVersion).toBe('v1');
  });

  it('should return null for non-existent cache entries', () => {
    const cached = cache.get('non-existent');
    expect(cached).toBeNull();
  });

  it('should expire cached entries after TTL', async () => {
    const healthScore = {
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    };

    cache.set(healthScore);
    
    // Should be cached immediately
    expect(cache.get('asset-1')).toBeDefined();

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should be expired
    expect(cache.get('asset-1')).toBeNull();
  });

  it('should invalidate specific cache entries', () => {
    const healthScore = {
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    };

    cache.set(healthScore);
    expect(cache.get('asset-1')).toBeDefined();

    cache.invalidate('asset-1');
    expect(cache.get('asset-1')).toBeNull();
  });

  it('should clear all cache entries', () => {
    cache.set({
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    cache.set({
      assetId: 'asset-2',
      score: 90,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    expect(cache.get('asset-1')).toBeDefined();
    expect(cache.get('asset-2')).toBeDefined();

    cache.clear();

    expect(cache.get('asset-1')).toBeNull();
    expect(cache.get('asset-2')).toBeNull();
  });

  it('should evict LRU entries when max size is reached', () => {
    const smallCache = new HealthScoreCache({ ttlMs: 60000, maxSize: 3 });

    // Add 3 entries
    smallCache.set({
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    smallCache.set({
      assetId: 'asset-2',
      score: 90,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    smallCache.set({
      assetId: 'asset-3',
      score: 95,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    // All 3 should be cached
    expect(smallCache.get('asset-1')).toBeDefined();
    expect(smallCache.get('asset-2')).toBeDefined();
    expect(smallCache.get('asset-3')).toBeDefined();

    // Add a 4th entry - should evict asset-1 (least recently used)
    smallCache.set({
      assetId: 'asset-4',
      score: 80,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    // asset-1 should be evicted
    expect(smallCache.get('asset-1')).toBeNull();
    expect(smallCache.get('asset-2')).toBeDefined();
    expect(smallCache.get('asset-3')).toBeDefined();
    expect(smallCache.get('asset-4')).toBeDefined();
  });

  it('should update access order on get', () => {
    const smallCache = new HealthScoreCache({ ttlMs: 60000, maxSize: 3 });

    smallCache.set({
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    smallCache.set({
      assetId: 'asset-2',
      score: 90,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    smallCache.set({
      assetId: 'asset-3',
      score: 95,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    // Access asset-1 to make it most recently used
    smallCache.get('asset-1');

    // Add a 4th entry - should evict asset-2 (now least recently used)
    smallCache.set({
      assetId: 'asset-4',
      score: 80,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    // asset-2 should be evicted, asset-1 should still be cached
    expect(smallCache.get('asset-1')).toBeDefined();
    expect(smallCache.get('asset-2')).toBeNull();
    expect(smallCache.get('asset-3')).toBeDefined();
    expect(smallCache.get('asset-4')).toBeDefined();
  });

  it('should provide cache statistics', () => {
    cache.set({
      assetId: 'asset-1',
      score: 85,
      computedAt: '2024-01-01T00:00:00Z',
      modelVersion: 'v1',
      componentBreakdown: {},
    });

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(10);
    expect(stats.ttlMs).toBe(1000);
  });

  it('should allow updating TTL configuration', () => {
    cache.setTTL(5000);
    const stats = cache.getStats();
    expect(stats.ttlMs).toBe(5000);
  });

  it('should allow updating max size configuration', () => {
    // Add 5 entries
    for (let i = 1; i <= 5; i++) {
      cache.set({
        assetId: `asset-${i}`,
        score: 85,
        computedAt: '2024-01-01T00:00:00Z',
        modelVersion: 'v1',
        componentBreakdown: {},
      });
    }

    expect(cache.getStats().size).toBe(5);

    // Reduce max size to 3 - should evict 2 entries
    cache.setMaxSize(3);
    expect(cache.getStats().size).toBe(3);
    expect(cache.getStats().maxSize).toBe(3);
  });

  it('should export singleton instance', () => {
    expect(healthScoreCache).toBeDefined();
    expect(healthScoreCache).toBeInstanceOf(HealthScoreCache);
  });
});
