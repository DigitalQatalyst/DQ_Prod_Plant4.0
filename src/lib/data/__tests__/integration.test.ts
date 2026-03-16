/**
 * Integration Tests
 * 
 * Tests that verify the app can work with different data backend configurations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Data Provider Integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('app works with mock backend', async () => {
    // Mock environment for mock backend
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'mock',
      isSupabaseConfigured: () => false,
      supabase: null
    }));
    
    const { getDataProvider } = await import('../index');
    
    const provider = getDataProvider();
    
    // Test basic functionality
    expect(provider).toBeDefined();
    expect(provider.getInfo().name).toBe('MockProvider');
    
    // Test that basic methods work
    const tenants = await provider.getTenants();
    expect(Array.isArray(tenants)).toBe(true);
    
    const sectors = await provider.getSectors();
    expect(Array.isArray(sectors)).toBe(true);
  });

  it('app works with hybrid backend', async () => {
    // Mock environment for hybrid backend
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'hybrid',
      isSupabaseConfigured: () => true,
      supabase: { from: vi.fn() }
    }));
    
    // Mock SupabaseProvider to avoid actual database calls
    vi.doMock('../providers/SupabaseProvider', () => ({
      getSupabaseProvider: () => ({
        getInfo: () => ({ name: 'SupabaseProvider', version: '1.0.0', isConnected: true }),
        getTransmissionTenants: vi.fn().mockResolvedValue([]),
        getGridNodesByTenant: vi.fn().mockResolvedValue([]),
        getGridLinesByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionAssetsByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionOverviewKpis: vi.fn().mockResolvedValue({}),
        // Other methods won't be called in hybrid mode for non-transmission data
        getTenants: vi.fn(),
        getAssetsByTenant: vi.fn(),
        getAlertsByTenant: vi.fn(),
        getSectors: vi.fn(),
        getTenantsBySector: vi.fn(),
        getTenantById: vi.fn(),
        getSectorById: vi.fn(),
        getAssetById: vi.fn(),
        getSiteSummaryByTenant: vi.fn(),
        getAlertsBySeverity: vi.fn(),
        getIncidentsByTenant: vi.fn(),
        getUpstreamAssetsByTenant: vi.fn(),
        getDiscoveryJobsByTenant: vi.fn(),
        getDiscoveryAgentsByTenant: vi.fn(),
        getConnectionEndpointsByTenant: vi.fn(),
        getCandidateAssetsByJob: vi.fn()
      })
    }));
    
    const { getDataProvider } = await import('../index');
    
    const provider = getDataProvider();
    
    // Test basic functionality
    expect(provider).toBeDefined();
    expect(provider.getInfo().name).toBe('HybridProvider');
    
    // Test that generic methods work (should use MockProvider)
    const tenants = await provider.getTenants();
    expect(Array.isArray(tenants)).toBe(true);
    
    // Test that transmission methods work (should use SupabaseProvider)
    const transmissionTenants = await provider.getTransmissionTenants();
    expect(Array.isArray(transmissionTenants)).toBe(true);
    
    const gridNodes = await provider.getGridNodesByTenant('test-tenant');
    expect(Array.isArray(gridNodes)).toBe(true);
  });

  it('hybrid provider delegates correctly', async () => {
    // Mock environment for hybrid backend
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'hybrid',
      isSupabaseConfigured: () => true,
      supabase: { from: vi.fn() }
    }));
    
    // Create spies to track which provider methods are called
    const mockProviderSpy = {
      getTenants: vi.fn().mockResolvedValue([{ id: 'mock-tenant' }]),
      getAssetsByTenant: vi.fn().mockResolvedValue([{ id: 'mock-asset' }])
    };
    
    const supabaseProviderSpy = {
      getTransmissionTenants: vi.fn().mockResolvedValue([{ id: 'supabase-tenant' }]),
      getGridNodesByTenant: vi.fn().mockResolvedValue([{ id: 'supabase-node' }])
    };
    
    vi.doMock('../providers/MockProvider', () => ({
      getMockProvider: () => ({
        getInfo: () => ({ name: 'MockProvider', version: '1.0.0', isConnected: true }),
        ...mockProviderSpy,
        // Add other required methods as no-ops
        getSectors: vi.fn().mockResolvedValue([]),
        getTenantsBySector: vi.fn().mockResolvedValue([]),
        getTenantById: vi.fn().mockResolvedValue(null),
        getSectorById: vi.fn().mockResolvedValue(null),
        getAssetById: vi.fn().mockResolvedValue(null),
        getSiteSummaryByTenant: vi.fn().mockResolvedValue([]),
        getAlertsByTenant: vi.fn().mockResolvedValue([]),
        getAlertsBySeverity: vi.fn().mockResolvedValue([]),
        getIncidentsByTenant: vi.fn().mockResolvedValue([]),
        getUpstreamAssetsByTenant: vi.fn().mockResolvedValue([]),
        getDiscoveryJobsByTenant: vi.fn().mockResolvedValue([]),
        getDiscoveryAgentsByTenant: vi.fn().mockResolvedValue([]),
        getConnectionEndpointsByTenant: vi.fn().mockResolvedValue([]),
        getCandidateAssetsByJob: vi.fn().mockResolvedValue([]),
        getTransmissionTenants: vi.fn().mockResolvedValue([]),
        getGridNodesByTenant: vi.fn().mockResolvedValue([]),
        getGridLinesByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionAssetsByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionOverviewKpis: vi.fn().mockResolvedValue({})
      })
    }));
    
    vi.doMock('../providers/SupabaseProvider', () => ({
      getSupabaseProvider: () => ({
        getInfo: () => ({ name: 'SupabaseProvider', version: '1.0.0', isConnected: true }),
        ...supabaseProviderSpy,
        // Add other required methods as no-ops
        getTenants: vi.fn(),
        getAssetsByTenant: vi.fn(),
        getAlertsByTenant: vi.fn(),
        getSectors: vi.fn(),
        getTenantsBySector: vi.fn(),
        getTenantById: vi.fn(),
        getSectorById: vi.fn(),
        getAssetById: vi.fn(),
        getSiteSummaryByTenant: vi.fn(),
        getAlertsBySeverity: vi.fn(),
        getIncidentsByTenant: vi.fn(),
        getUpstreamAssetsByTenant: vi.fn(),
        getDiscoveryJobsByTenant: vi.fn(),
        getDiscoveryAgentsByTenant: vi.fn(),
        getConnectionEndpointsByTenant: vi.fn(),
        getCandidateAssetsByJob: vi.fn(),
        getGridLinesByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionAssetsByTenant: vi.fn().mockResolvedValue([]),
        getTransmissionOverviewKpis: vi.fn().mockResolvedValue({})
      })
    }));
    
    const { getDataProvider } = await import('../index');
    
    const provider = getDataProvider();
    
    // Call generic methods - should use MockProvider
    await provider.getTenants();
    await provider.getAssetsByTenant('test-tenant');
    
    // Call transmission methods - should use SupabaseProvider
    await provider.getTransmissionTenants();
    await provider.getGridNodesByTenant('test-tenant');
    
    // Verify delegation
    expect(mockProviderSpy.getTenants).toHaveBeenCalledOnce();
    expect(mockProviderSpy.getAssetsByTenant).toHaveBeenCalledWith('test-tenant');
    
    expect(supabaseProviderSpy.getTransmissionTenants).toHaveBeenCalledOnce();
    expect(supabaseProviderSpy.getGridNodesByTenant).toHaveBeenCalledWith('test-tenant');
  });
});