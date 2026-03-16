/**
 * Tests for APM Telemetry Integration
 * 
 * Validates that APM features properly integrate with existing telemetry structure
 * (telemetry_points, tags) and respect tenant isolation through asset relationships.
 * 
 * Requirements: 31.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTelemetryPointsForAsset,
  getTagsForAsset,
  getTelemetryPointsForTenant,
  getTagsForTenant,
  getTelemetryPointWithTag,
  getTelemetryPointsByProtocol,
  assetHasTelemetry
} from '../apmTelemetryIntegration';
import * as tenantUtils from '../tenantUtils';

// Mock the dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('../tenantUtils');

describe('APM Telemetry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getTransmissionTenantId to return a UUID
    vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('getTelemetryPointsForAsset', () => {
    it('should query telemetry_points for specific asset', async () => {
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
      
      await getTelemetryPointsForAsset('asset-123');
      
      expect(supabase.from).toHaveBeenCalledWith('telemetry_points');
      expect(mockEq).toHaveBeenCalledWith('asset_id', 'asset-123');
    });

    it('should return telemetry points for asset', async () => {
      const { supabase } = await import('../supabase');
      const mockPoints = [
        {
          id: 'point-1',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          asset_id: 'asset-123',
          metric: 'voltage',
          unit: 'kV',
          limits: { min: 0, max: 400, warning: 380, critical: 395 }
        },
        {
          id: 'point-2',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          asset_id: 'asset-123',
          metric: 'current',
          unit: 'A',
          limits: { min: 0, max: 2000, warning: 1800, critical: 1950 }
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockPoints,
              error: null
            }))
          }))
        }))
      } as any);
      
      const points = await getTelemetryPointsForAsset('asset-123');
      
      expect(points).toHaveLength(2);
      expect(points[0].metric).toBe('voltage');
      expect(points[1].metric).toBe('current');
    });
  });

  describe('getTagsForAsset', () => {
    it('should query tags for specific asset', async () => {
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
      
      await getTagsForAsset('asset-123');
      
      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(mockEq).toHaveBeenCalledWith('asset_id', 'asset-123');
    });

    it('should return tags for asset', async () => {
      const { supabase } = await import('../supabase');
      const mockTags = [
        {
          id: 'tag-1',
          tenant_id: '550e8400-e29b-41d4-a716-446655440000',
          asset_id: 'asset-123',
          protocol: 'DNP3',
          address: '10.1.1.100:20000',
          name: 'Breaker Status'
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockTags,
              error: null
            }))
          }))
        }))
      } as any);
      
      const tags = await getTagsForAsset('asset-123');
      
      expect(tags).toHaveLength(1);
      expect(tags[0].protocol).toBe('DNP3');
    });
  });

  describe('getTelemetryPointsForTenant', () => {
    it('should call getTransmissionTenantId', async () => {
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
      
      await getTelemetryPointsForTenant('t1');
      
      expect(tenantUtils.getTransmissionTenantId).toHaveBeenCalledWith('t1');
    });

    it('should filter telemetry_points by tenant_id', async () => {
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
      
      await getTelemetryPointsForTenant('t1');
      
      expect(mockEq).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('getTagsForTenant', () => {
    it('should filter tags by tenant_id', async () => {
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
      
      await getTagsForTenant('t1');
      
      expect(mockEq).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('getTelemetryPointsByProtocol', () => {
    it('should filter by protocol', async () => {
      const { supabase } = await import('../supabase');
      const mockOrder = vi.fn(() => Promise.resolve({
        data: [],
        error: null
      }));
      
      const mockEq2 = vi.fn(() => ({
        order: mockOrder
      }));
      
      const mockEq1 = vi.fn(() => ({
        eq: mockEq2
      }));
      
      const mockSelect = vi.fn(() => ({
        eq: mockEq1
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);
      
      await getTelemetryPointsByProtocol('t1', 'DNP3');
      
      // Should filter by both tenant_id and protocol
      expect(mockEq1).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockEq2).toHaveBeenCalledWith('tags.protocol', 'DNP3');
    });
  });

  describe('assetHasTelemetry', () => {
    it('should return true if asset has telemetry points', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            count: 5,
            error: null
          }))
        }))
      } as any);
      
      const hasTelemetry = await assetHasTelemetry('asset-123');
      
      expect(hasTelemetry).toBe(true);
    });

    it('should return false if asset has no telemetry points', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            count: 0,
            error: null
          }))
        }))
      } as any);
      
      const hasTelemetry = await assetHasTelemetry('asset-123');
      
      expect(hasTelemetry).toBe(false);
    });
  });

  describe('Tenant isolation through asset relationships', () => {
    it('should enforce tenant isolation through asset_id', async () => {
      const { supabase } = await import('../supabase');
      
      // When querying by asset_id, tenant isolation is enforced through the asset relationship
      // The asset itself belongs to a tenant, so querying by asset_id automatically filters by tenant
      
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
      
      await getTelemetryPointsForAsset('asset-from-tenant-1');
      
      // Should query by asset_id, which enforces tenant isolation
      expect(mockEq).toHaveBeenCalledWith('asset_id', 'asset-from-tenant-1');
    });
  });

  describe('Protocol and address mappings', () => {
    it('should preserve protocol information from tags', async () => {
      const { supabase } = await import('../supabase');
      const mockTags = [
        {
          id: 'tag-1',
          protocol: 'DNP3',
          address: '10.1.1.100:20000'
        },
        {
          id: 'tag-2',
          protocol: 'IEC61850',
          address: '10.1.1.101:102'
        }
      ];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockTags,
              error: null
            }))
          }))
        }))
      } as any);
      
      const tags = await getTagsForAsset('asset-123');
      
      expect(tags[0].protocol).toBe('DNP3');
      expect(tags[0].address).toBe('10.1.1.100:20000');
      expect(tags[1].protocol).toBe('IEC61850');
      expect(tags[1].address).toBe('10.1.1.101:102');
    });
  });
});
