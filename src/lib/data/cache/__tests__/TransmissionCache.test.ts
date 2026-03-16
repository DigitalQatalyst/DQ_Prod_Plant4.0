/**
 * Transmission Cache Tests
 * 
 * Validates caching functionality for transmission data
 * Requirements: 29.3, 29.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransmissionCache } from '../TransmissionCache';

describe('TransmissionCache', () => {
  beforeEach(() => {
    // Clear all caches before each test
    TransmissionCache.clearAll();
  });

  describe('Substation Caching', () => {
    it('should cache and retrieve substation data', async () => {
      const orgId = 'org-123';
      const substationId = 'sub-456';
      const mockData = { id: substationId, name: 'Test Substation' };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      // First call should fetch
      const result1 = await TransmissionCache.getSubstation(orgId, substationId, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      // Second call should use cache
      const result2 = await TransmissionCache.getSubstation(orgId, substationId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1); // Should not fetch again
    });

    it('should cache substations list', async () => {
      const orgId = 'org-123';
      const mockData = [
        { id: 'sub-1', name: 'Substation 1' },
        { id: 'sub-2', name: 'Substation 2' }
      ];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getSubstations(orgId, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getSubstations(orgId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should invalidate substation cache', async () => {
      const orgId = 'org-123';
      const substationId = 'sub-456';
      const mockData = { id: substationId, name: 'Test Substation' };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      await TransmissionCache.getSubstation(orgId, substationId, fetchFn);
      expect(fetchCount).toBe(1);
      
      // Invalidate cache
      TransmissionCache.invalidateSubstation(orgId, substationId);
      
      // Should fetch again
      await TransmissionCache.getSubstation(orgId, substationId, fetchFn);
      expect(fetchCount).toBe(2);
    });
  });

  describe('Feeder Caching', () => {
    it('should cache and retrieve feeder data', async () => {
      const substationId = 'sub-123';
      const feederId = 'feeder-456';
      const mockData = { id: feederId, name: 'Test Feeder' };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getFeeder(substationId, feederId, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getFeeder(substationId, feederId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should cache feeders list', async () => {
      const substationId = 'sub-123';
      const mockData = [
        { id: 'feeder-1', name: 'Feeder 1' },
        { id: 'feeder-2', name: 'Feeder 2' }
      ];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getFeeders(substationId, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getFeeders(substationId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should invalidate feeder cache', async () => {
      const substationId = 'sub-123';
      const feederId = 'feeder-456';
      const mockData = { id: feederId, name: 'Test Feeder' };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      await TransmissionCache.getFeeder(substationId, feederId, fetchFn);
      expect(fetchCount).toBe(1);
      
      TransmissionCache.invalidateFeeder(substationId, feederId);
      
      await TransmissionCache.getFeeder(substationId, feederId, fetchFn);
      expect(fetchCount).toBe(2);
    });
  });

  describe('Meter Registry Caching', () => {
    it('should cache meter registry with filters', async () => {
      const orgId = 'org-123';
      const filters = { active: true, substation_id: 'sub-456' };
      const mockData = [
        { id: 'meter-1', name: 'Meter 1' },
        { id: 'meter-2', name: 'Meter 2' }
      ];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getMeterRegistry(orgId, filters, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getMeterRegistry(orgId, filters, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should cache different filter combinations separately', async () => {
      const orgId = 'org-123';
      const filters1 = { active: true };
      const filters2 = { active: false };
      
      let fetchCount = 0;
      const fetchFn1 = vi.fn(async () => {
        fetchCount++;
        return [{ id: 'meter-1' }];
      });
      const fetchFn2 = vi.fn(async () => {
        fetchCount++;
        return [{ id: 'meter-2' }];
      });
      
      await TransmissionCache.getMeterRegistry(orgId, filters1, fetchFn1);
      await TransmissionCache.getMeterRegistry(orgId, filters2, fetchFn2);
      
      expect(fetchCount).toBe(2); // Both should fetch
    });

    it('should invalidate meter registry cache', async () => {
      const orgId = 'org-123';
      const filters = { active: true };
      const mockData = [{ id: 'meter-1' }];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      await TransmissionCache.getMeterRegistry(orgId, filters, fetchFn);
      expect(fetchCount).toBe(1);
      
      TransmissionCache.invalidateMeterRegistry(orgId);
      
      await TransmissionCache.getMeterRegistry(orgId, filters, fetchFn);
      expect(fetchCount).toBe(2);
    });
  });

  describe('Latest Telemetry Caching', () => {
    it('should cache latest telemetry', async () => {
      const meterId = 'meter-123';
      const mockData = { timestamp: '2025-01-27T10:00:00Z', kw: 100 };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getLatestTelemetry(meterId, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getLatestTelemetry(meterId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should invalidate latest telemetry cache', async () => {
      const meterId = 'meter-123';
      const mockData = { timestamp: '2025-01-27T10:00:00Z', kw: 100 };
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      await TransmissionCache.getLatestTelemetry(meterId, fetchFn);
      expect(fetchCount).toBe(1);
      
      TransmissionCache.invalidateLatestTelemetry(meterId);
      
      await TransmissionCache.getLatestTelemetry(meterId, fetchFn);
      expect(fetchCount).toBe(2);
    });
  });

  describe('KPI Caching', () => {
    it('should cache KPI snapshots', async () => {
      const scopeType = 'substation';
      const scopeId = 'sub-123';
      const period = '2025-01';
      const mockData = [
        { kpi_code: 'losses_pct', value: 2.5 },
        { kpi_code: 'load_factor', value: 0.85 }
      ];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      const result1 = await TransmissionCache.getKPISnapshots(scopeType, scopeId, period, fetchFn);
      expect(result1).toEqual(mockData);
      expect(fetchCount).toBe(1);
      
      const result2 = await TransmissionCache.getKPISnapshots(scopeType, scopeId, period, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchCount).toBe(1);
    });

    it('should invalidate KPI cache', async () => {
      const scopeType = 'substation';
      const scopeId = 'sub-123';
      const period = '2025-01';
      const mockData = [{ kpi_code: 'losses_pct', value: 2.5 }];
      
      let fetchCount = 0;
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return mockData;
      });
      
      await TransmissionCache.getKPISnapshots(scopeType, scopeId, period, fetchFn);
      expect(fetchCount).toBe(1);
      
      TransmissionCache.invalidateKPI(scopeType, scopeId);
      
      await TransmissionCache.getKPISnapshots(scopeType, scopeId, period, fetchFn);
      expect(fetchCount).toBe(2);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      const orgId = 'org-123';
      const substationId = 'sub-456';
      
      await TransmissionCache.getSubstation(orgId, substationId, async () => ({ id: substationId }));
      await TransmissionCache.getSubstations(orgId, async () => [{ id: substationId }]);
      
      const stats = TransmissionCache.getStats();
      
      expect(stats).toHaveProperty('substations');
      expect(stats).toHaveProperty('feeders');
      expect(stats).toHaveProperty('transformers');
      expect(stats).toHaveProperty('meterRegistry');
      expect(stats).toHaveProperty('latestTelemetry');
      expect(stats).toHaveProperty('kpi');
      
      expect(stats.substations.size).toBeGreaterThan(0);
    });
  });

  describe('Cache Clearing', () => {
    it('should clear all caches', async () => {
      // Populate caches
      await TransmissionCache.getSubstation('org-1', 'sub-1', async () => ({ id: 'sub-1' }));
      await TransmissionCache.getFeeder('sub-1', 'feeder-1', async () => ({ id: 'feeder-1' }));
      await TransmissionCache.getMeterRegistry('org-1', {}, async () => [{ id: 'meter-1' }]);
      
      let stats = TransmissionCache.getStats();
      expect(stats.substations.size).toBeGreaterThan(0);
      
      // Clear all
      TransmissionCache.clearAll();
      
      stats = TransmissionCache.getStats();
      expect(stats.substations.size).toBe(0);
      expect(stats.feeders.size).toBe(0);
      expect(stats.meterRegistry.size).toBe(0);
    });
  });

  describe('Cache Performance', () => {
    it('should significantly reduce fetch time on cache hit', async () => {
      const orgId = 'org-123';
      const substationId = 'sub-456';
      
      // Simulate slow fetch
      const slowFetchFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: substationId, name: 'Test' };
      };
      
      // First call - should be slow
      const start1 = performance.now();
      await TransmissionCache.getSubstation(orgId, substationId, slowFetchFn);
      const duration1 = performance.now() - start1;
      
      // Second call - should be fast (cached)
      const start2 = performance.now();
      await TransmissionCache.getSubstation(orgId, substationId, slowFetchFn);
      const duration2 = performance.now() - start2;
      
      expect(duration1).toBeGreaterThan(90); // Should take at least 100ms
      expect(duration2).toBeLessThan(10); // Should be nearly instant
      
      console.log(`Cache performance: First call ${duration1.toFixed(2)}ms, Cached call ${duration2.toFixed(2)}ms`);
    });
  });
});
