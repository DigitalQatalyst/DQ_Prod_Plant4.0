/**
 * Tests for APM Grid Topology Integration
 * 
 * Validates that APM features properly integrate with existing grid topology
 * (grid_nodes, grid_lines) and respect tenant_id filtering.
 * 
 * Requirements: 31.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGridNodesForTenant,
  getGridLinesForTenant,
  getGridLinksForAsset,
  getAssetsForGridNode,
  getAssetsForGridLine,
  getGridNodeWithAssets,
  getGridLineWithAssets
} from '../apmGridTopologyIntegration';
import * as tenantUtils from '../tenantUtils';

// Mock the dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('../tenantUtils');

describe('APM Grid Topology Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getTransmissionTenantId to return a UUID
    vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('getGridNodesForTenant', () => {
    it('should call getTransmissionTenantId with mock tenant ID', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      } as any);
      
      await getGridNodesForTenant('t1');
      
      expect(tenantUtils.getTransmissionTenantId).toHaveBeenCalledWith('t1');
    });

    it('should filter grid_nodes by tenant_id', async () => {
      const { supabase } = await import('../supabase');
      const mockEq = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }));
      
      const mockSelect = vi.fn(() => ({
        eq: mockEq
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);
      
      await getGridNodesForTenant('t1');
      
      expect(supabase.from).toHaveBeenCalledWith('grid_nodes');
      expect(mockEq).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return grid nodes for tenant', async () => {
      const { supabase } = await import('../supabase');
      const mockNodes = [
        {
          id: 'node-1',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Dubai Main Substation',
          node_type: 'substation',
          voltage_kv: 400
        },
        {
          id: 'node-2',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Jebel Ali Grid Station',
          node_type: 'substation',
          voltage_kv: 400
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockNodes,
              error: null
            }))
          }))
        }))
      } as any);
      
      const nodes = await getGridNodesForTenant('t1');
      
      expect(nodes).toHaveLength(2);
      expect(nodes[0].name).toBe('Dubai Main Substation');
    });

    it('should handle errors gracefully', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      } as any);
      
      const nodes = await getGridNodesForTenant('t1');
      
      expect(nodes).toEqual([]);
    });
  });

  describe('getGridLinesForTenant', () => {
    it('should filter grid_lines by tenant_id', async () => {
      const { supabase } = await import('../supabase');
      const mockEq = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }));
      
      const mockSelect = vi.fn(() => ({
        eq: mockEq
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);
      
      await getGridLinesForTenant('t1');
      
      expect(supabase.from).toHaveBeenCalledWith('grid_lines');
      expect(mockEq).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return grid lines for tenant', async () => {
      const { supabase } = await import('../supabase');
      const mockLines = [
        {
          id: 'line-1',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Dubai-Jebel Ali Direct',
          from_node_id: 'node-1',
          to_node_id: 'node-2',
          voltage_kv: 400,
          length_km: 45.2,
          status: 'active'
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockLines,
              error: null
            }))
          }))
        }))
      } as any);
      
      const lines = await getGridLinesForTenant('t1');
      
      expect(lines).toHaveLength(1);
      expect(lines[0].name).toBe('Dubai-Jebel Ali Direct');
    });
  });

  describe('getGridLinksForAsset', () => {
    it('should query grid_asset_links for specific asset', async () => {
      const { supabase } = await import('../supabase');
      const mockEq = vi.fn(() => Promise.resolve({
        data: [],
        error: null
      }));
      
      const mockSelect = vi.fn(() => ({
        eq: mockEq
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);
      
      await getGridLinksForAsset('asset-123');
      
      expect(supabase.from).toHaveBeenCalledWith('grid_asset_links');
      expect(mockEq).toHaveBeenCalledWith('asset_id', 'asset-123');
    });

    it('should return grid links for asset', async () => {
      const { supabase } = await import('../supabase');
      const mockLinks = [
        {
          id: 'link-1',
          asset_id: 'asset-123',
          node_id: 'node-1',
          line_id: null
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockLinks,
            error: null
          }))
        }))
      } as any);
      
      const links = await getGridLinksForAsset('asset-123');
      
      expect(links).toHaveLength(1);
      expect(links[0].node_id).toBe('node-1');
    });
  });

  describe('getAssetsForGridNode', () => {
    it('should return asset IDs for a grid node', async () => {
      const { supabase } = await import('../supabase');
      const mockLinks = [
        { asset_id: 'asset-1' },
        { asset_id: 'asset-2' },
        { asset_id: 'asset-3' }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockLinks,
            error: null
          }))
        }))
      } as any);
      
      const assetIds = await getAssetsForGridNode('node-1');
      
      expect(assetIds).toHaveLength(3);
      expect(assetIds).toContain('asset-1');
      expect(assetIds).toContain('asset-2');
      expect(assetIds).toContain('asset-3');
    });
  });

  describe('getAssetsForGridLine', () => {
    it('should return asset IDs for a grid line', async () => {
      const { supabase } = await import('../supabase');
      const mockLinks = [
        { asset_id: 'asset-4' },
        { asset_id: 'asset-5' }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockLinks,
            error: null
          }))
        }))
      } as any);
      
      const assetIds = await getAssetsForGridLine('line-1');
      
      expect(assetIds).toHaveLength(2);
      expect(assetIds).toContain('asset-4');
      expect(assetIds).toContain('asset-5');
    });
  });

  describe('Tenant isolation', () => {
    it('should respect tenant_id filtering for grid nodes', async () => {
      const { supabase } = await import('../supabase');
      
      // Mock different tenant
      vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('different-tenant-uuid');
      
      const mockEq = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: mockEq
        }))
      } as any);
      
      await getGridNodesForTenant('different-tenant');
      
      // Should filter by the different tenant ID
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'different-tenant-uuid');
    });

    it('should respect tenant_id filtering for grid lines', async () => {
      const { supabase } = await import('../supabase');
      
      // Mock different tenant
      vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('different-tenant-uuid');
      
      const mockEq = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: mockEq
        }))
      } as any);
      
      await getGridLinesForTenant('different-tenant');
      
      // Should filter by the different tenant ID
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'different-tenant-uuid');
    });
  });
});
