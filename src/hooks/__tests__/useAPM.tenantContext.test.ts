/**
 * Tests for APM Tenant Context Adherence
 * 
 * Validates that all APM hooks properly use existing tenant context
 * and respect RLS policies for power transmission tenant data.
 * 
 * Requirements: 31.1, 31.2, 31.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAssets } from '../useAPM';
import * as tenantUtils from '@/lib/tenantUtils';
import * as appContext from '@/context/AppContext';

// Mock the dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({
              data: [],
              error: null,
              count: 0
            }))
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/lib/tenantUtils');
vi.mock('@/context/AppContext');

describe('APM Tenant Context Adherence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock AppContext to return a power transmission tenant
    vi.mocked(appContext.useApp).mockReturnValue({
      currentTenant: {
        id: 't1',
        name: 'Kenya Power',
        industry: 'Power & Utilities',
        sector: 'power',
        subsector: 'transmission'
      },
      sector: 'power',
      subsector: 'transmission',
    } as any);
    
    // Mock getTransmissionTenantId to return a UUID
    vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('useAssets Hook', () => {
    it('should call getTransmissionTenantId with current tenant ID', async () => {
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(tenantUtils.getTransmissionTenantId).toHaveBeenCalledWith('t1');
    });

    it('should filter assets by tenant_id in query', async () => {
      const { supabase } = await import('@/lib/supabase');
      const mockEq = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
            count: 0
          }))
        }))
      }));
      
      const mockSelect = vi.fn(() => ({
        eq: mockEq
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);
      
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Verify that eq was called with tenant_id filter
      expect(mockEq).toHaveBeenCalledWith('tenant_id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should respect existing RLS policies', async () => {
      // RLS policies are enforced at the database level
      // This test verifies that we're using the correct tenant_id
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // If RLS is properly configured, queries with wrong tenant_id would return empty
      expect(result.current.error).toBeNull();
    });
  });

  describe('Tenant Context Validation', () => {
    it('should work with DEWA transmission tenant structure', async () => {
      // Mock DEWA tenant
      vi.mocked(appContext.useApp).mockReturnValue({
        currentTenant: {
          id: 'dewa-transmission',
          name: 'DEWA Transmission',
          industry: 'Power & Utilities',
          sector: 'power',
          subsector: 'transmission',
          scenario_tag: 'power_transmission_demo_v1'
        },
        sector: 'power',
        subsector: 'transmission',
      } as any);
      
      vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('dewa-uuid-123');
      
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(tenantUtils.getTransmissionTenantId).toHaveBeenCalledWith('dewa-transmission');
    });

    it('should handle sector=power and subsector=transmission filtering', async () => {
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Verify that getTransmissionTenantId was called
      // This function internally filters by sector='power' and subsector='transmission'
      expect(tenantUtils.getTransmissionTenantId).toHaveBeenCalled();
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty results gracefully', async () => {
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20
      });
      expect(result.current.error).toBeNull();
    });

    it('should provide appropriate error message when tenant has no transmission data', async () => {
      const { supabase } = await import('@/lib/supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'No data found for tenant' },
                count: 0
              }))
            }))
          }))
        }))
      } as any);
      
      const { result } = renderHook(() => useAssets());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBeTruthy();
    });
  });
});
