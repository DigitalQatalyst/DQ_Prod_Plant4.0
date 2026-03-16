/**
 * Performance Provider Integration Test
 * 
 * This test verifies that the performance provider methods are properly implemented
 * and can be called without errors.
 */

import { describe, it, expect } from 'vitest';
import { getDataProvider } from '../index';

describe('Performance Provider Integration', () => {
  it('should have performance methods available', () => {
    const provider = getDataProvider();
    
    // Check that all performance methods exist
    expect(typeof provider.getPerformancePanelsByTenant).toBe('function');
    expect(typeof provider.getPerformancePanelById).toBe('function');
    expect(typeof provider.createPerformancePanel).toBe('function');
    expect(typeof provider.updatePerformancePanel).toBe('function');
    expect(typeof provider.deletePerformancePanel).toBe('function');
    
    expect(typeof provider.getPerformanceLossesByTenant).toBe('function');
    expect(typeof provider.getPerformanceLossById).toBe('function');
    expect(typeof provider.createPerformanceLoss).toBe('function');
    expect(typeof provider.updatePerformanceLoss).toBe('function');
    
    expect(typeof provider.getPerformanceBottlenecksByTenant).toBe('function');
    expect(typeof provider.getPerformanceBottleneckById).toBe('function');
    expect(typeof provider.createPerformanceBottleneck).toBe('function');
    expect(typeof provider.updatePerformanceBottleneck).toBe('function');
    
    expect(typeof provider.getPerformanceTrendsByTenant).toBe('function');
    expect(typeof provider.getPerformanceBenchmarksByTenant).toBe('function');
    expect(typeof provider.exportPerformanceData).toBe('function');
  });

  it('should return provider info', () => {
    const provider = getDataProvider();
    const info = provider.getInfo();
    
    expect(info).toBeDefined();
    expect(typeof info.name).toBe('string');
    expect(typeof info.version).toBe('string');
    expect(typeof info.isConnected).toBe('boolean');
  });

  it('should handle performance panel methods gracefully', async () => {
    const provider = getDataProvider();
    const testTenantId = 'test-tenant-id';
    
    // These should not throw errors, even if they return empty results
    const panels = await provider.getPerformancePanelsByTenant(testTenantId);
    expect(Array.isArray(panels)).toBe(true);
    
    const losses = await provider.getPerformanceLossesByTenant(testTenantId);
    expect(Array.isArray(losses)).toBe(true);
    
    const bottlenecks = await provider.getPerformanceBottlenecksByTenant(testTenantId);
    expect(Array.isArray(bottlenecks)).toBe(true);
  });
});