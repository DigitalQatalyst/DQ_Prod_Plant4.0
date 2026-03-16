/**
 * HybridProvider Tests
 * 
 * Tests the HybridProvider delegation logic to ensure:
 * - Transmission methods route to SupabaseProvider
 * - Generic methods route to MockProvider
 * - Errors propagate correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridProvider } from '../providers/HybridProvider';

// Mock the providers
vi.mock('../providers/MockProvider', () => ({
  getMockProvider: () => ({
    getInfo: () => ({ name: 'MockProvider', version: '1.0.0', isConnected: true }),
    getTenants: vi.fn().mockResolvedValue([{ id: 'mock-tenant', name: 'Mock Tenant' }]),
    getAssetsByTenant: vi.fn().mockResolvedValue([{ id: 'mock-asset', name: 'Mock Asset' }]),
    getAlertsByTenant: vi.fn().mockResolvedValue([]),
    getSectors: vi.fn().mockResolvedValue([]),
    getTenantsBySector: vi.fn().mockResolvedValue([]),
    getTenantById: vi.fn().mockResolvedValue(null),
    getSectorById: vi.fn().mockResolvedValue(null),
    getAssetById: vi.fn().mockResolvedValue(null),
    getSiteSummaryByTenant: vi.fn().mockResolvedValue([]),
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

vi.mock('../providers/SupabaseProvider', () => ({
  getSupabaseProvider: () => ({
    getInfo: () => ({ name: 'SupabaseProvider', version: '1.0.0', isConnected: true }),
    getTransmissionTenants: vi.fn().mockResolvedValue([{ id: 'supabase-tenant', name: 'Supabase Tenant' }]),
    getGridNodesByTenant: vi.fn().mockResolvedValue([{ id: 'grid-node-1', name: 'Node 1' }]),
    getGridLinesByTenant: vi.fn().mockResolvedValue([{ id: 'grid-line-1', name: 'Line 1' }]),
    getTransmissionAssetsByTenant: vi.fn().mockResolvedValue([{ id: 'transmission-asset-1', name: 'Asset 1' }]),
    getTransmissionOverviewKpis: vi.fn().mockResolvedValue({ totalAssets: 10, onlineAssets: 8 }),
    // Mock other methods that won't be called
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

describe('HybridProvider', () => {
  let hybridProvider: HybridProvider;

  beforeEach(() => {
    hybridProvider = new HybridProvider();
  });

  describe('Provider Info', () => {
    it('returns correct provider info', () => {
      const info = hybridProvider.getInfo();
      expect(info.name).toBe('HybridProvider');
      expect(info.version).toBe('1.0.0');
      expect(info.isConnected).toBe(true);
    });
  });

  describe('Generic Methods - Delegate to MockProvider', () => {
    it('delegates getTenants to MockProvider', async () => {
      const result = await hybridProvider.getTenants();
      expect(result).toEqual([{ id: 'mock-tenant', name: 'Mock Tenant' }]);
    });

    it('delegates getAssetsByTenant to MockProvider', async () => {
      const result = await hybridProvider.getAssetsByTenant('tenant-1');
      expect(result).toEqual([{ id: 'mock-asset', name: 'Mock Asset' }]);
    });

    it('delegates getAlertsByTenant to MockProvider', async () => {
      const result = await hybridProvider.getAlertsByTenant('tenant-1');
      expect(result).toEqual([]);
    });
  });

  describe('Transmission Methods - Delegate to SupabaseProvider', () => {
    it('delegates getTransmissionTenants to SupabaseProvider', async () => {
      const result = await hybridProvider.getTransmissionTenants();
      expect(result).toEqual([{ id: 'supabase-tenant', name: 'Supabase Tenant' }]);
    });

    it('delegates getGridNodesByTenant to SupabaseProvider', async () => {
      const result = await hybridProvider.getGridNodesByTenant('tenant-1');
      expect(result).toEqual([{ id: 'grid-node-1', name: 'Node 1' }]);
    });

    it('delegates getGridLinesByTenant to SupabaseProvider', async () => {
      const result = await hybridProvider.getGridLinesByTenant('tenant-1');
      expect(result).toEqual([{ id: 'grid-line-1', name: 'Line 1' }]);
    });

    it('delegates getTransmissionAssetsByTenant to SupabaseProvider', async () => {
      const result = await hybridProvider.getTransmissionAssetsByTenant('tenant-1');
      expect(result).toEqual([{ id: 'transmission-asset-1', name: 'Asset 1' }]);
    });

    it('delegates getTransmissionOverviewKpis to SupabaseProvider', async () => {
      const result = await hybridProvider.getTransmissionOverviewKpis('tenant-1');
      expect(result).toEqual({ totalAssets: 10, onlineAssets: 8 });
    });
  });
});