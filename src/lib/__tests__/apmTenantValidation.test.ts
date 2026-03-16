/**
 * Tests for APM Tenant Validation
 * 
 * Validates that tenant data consistency checks work correctly
 * and handle cases where tenants don't have transmission data.
 * 
 * Requirements: 31.9, 31.10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTransmissionTenant,
  tenantHasTransmissionData,
  validateDEWATenant,
  getTenantValidationSummary
} from '../apmTenantValidation';
import * as tenantUtils from '../tenantUtils';

// Mock the dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('../tenantUtils');

describe('APM Tenant Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getTransmissionTenantId to return a UUID
    vi.mocked(tenantUtils.getTransmissionTenantId).mockResolvedValue('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('validateTransmissionTenant', () => {
    it('should validate a valid power transmission tenant', async () => {
      const { supabase } = await import('../supabase');
      
      // Mock tenant query
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Test Tenant',
                    sector: 'power',
                    subsector: 'transmission'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        } else if (table === 'assets') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 10,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'grid_nodes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 3,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'telemetry_points') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 50,
                error: null
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateTransmissionTenant('t1');
      
      expect(result.isValid).toBe(true);
      expect(result.isPowerTransmission).toBe(true);
      expect(result.hasAssets).toBe(true);
      expect(result.hasGridTopology).toBe(true);
      expect(result.hasTelemetry).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for non-power tenant', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Oil & Gas Tenant',
                    sector: 'oil_gas',
                    subsector: 'upstream'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateTransmissionTenant('t1');
      
      expect(result.isValid).toBe(false);
      expect(result.isPowerTransmission).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('power transmission tenant');
    });

    it('should fail validation for non-transmission subsector', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Power Generation Tenant',
                    sector: 'power',
                    subsector: 'generation'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateTransmissionTenant('t1');
      
      expect(result.isValid).toBe(false);
      expect(result.isPowerTransmission).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('power transmission tenant');
    });

    it('should warn when tenant has no assets', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Test Tenant',
                    sector: 'power',
                    subsector: 'transmission'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        } else if (table === 'assets') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 0,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'grid_nodes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 0,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'telemetry_points') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 0,
                error: null
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateTransmissionTenant('t1');
      
      expect(result.isValid).toBe(true);
      expect(result.isPowerTransmission).toBe(true);
      expect(result.hasAssets).toBe(false);
      expect(result.hasGridTopology).toBe(false);
      expect(result.hasTelemetry).toBe(false);
      expect(result.warnings).toContain('Tenant has no assets configured');
      expect(result.warnings).toContain('Tenant has no grid topology configured');
      expect(result.warnings).toContain('Tenant has no telemetry points configured');
    });

    it('should fail validation when tenant not found', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Not found' }
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateTransmissionTenant('t1');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tenant not found in database');
    });
  });

  describe('tenantHasTransmissionData', () => {
    it('should return true when tenant has assets', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    sector: 'power',
                    subsector: 'transmission'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        } else if (table === 'assets') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 5,
                error: null
              }))
            }))
          } as any;
        } else {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 0,
                error: null
              }))
            }))
          } as any;
        }
      });
      
      const hasData = await tenantHasTransmissionData('t1');
      
      expect(hasData).toBe(true);
    });

    it('should return false when tenant has no data', async () => {
      const { supabase } = await import('../supabase');
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    sector: 'power',
                    subsector: 'transmission'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        } else {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 0,
                error: null
              }))
            }))
          } as any;
        }
      });
      
      const hasData = await tenantHasTransmissionData('t1');
      
      expect(hasData).toBe(false);
    });
  });

  describe('validateDEWATenant', () => {
    it('should validate DEWA tenant structure', async () => {
      const { supabase } = await import('../supabase');
      
      // First call for DEWA tenant lookup
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'tenants' && callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      single: vi.fn(() => Promise.resolve({
                        data: {
                          id: 'dewa-uuid',
                          name: 'DEWA - Transmission',
                          sector: 'power',
                          subsector: 'transmission',
                          scenario_tag: 'power_transmission_demo_v1'
                        },
                        error: null
                      }))
                    }))
                  }))
                }))
              }))
            }))
          } as any;
        } else if (table === 'tenants') {
          // Second call for validation
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'dewa-uuid',
                    name: 'DEWA - Transmission',
                    sector: 'power',
                    subsector: 'transmission',
                    scenario_tag: 'power_transmission_demo_v1'
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        } else if (table === 'assets') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 15,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'grid_nodes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 3,
                error: null
              }))
            }))
          } as any;
        } else if (table === 'telemetry_points') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 50,
                error: null
              }))
            }))
          } as any;
        }
        return {} as any;
      });
      
      const result = await validateDEWATenant();
      
      expect(result.isValid).toBe(true);
      expect(result.isPowerTransmission).toBe(true);
    });
  });

  describe('getTenantValidationSummary', () => {
    it('should generate summary for valid tenant with all data', () => {
      const result = {
        isValid: true,
        isPowerTransmission: true,
        hasAssets: true,
        hasGridTopology: true,
        hasTelemetry: true,
        errors: [],
        warnings: []
      };
      
      const summary = getTenantValidationSummary(result);
      
      expect(summary).toContain('✓ Power transmission tenant');
      expect(summary).toContain('✓ Has assets');
      expect(summary).toContain('✓ Has grid topology');
      expect(summary).toContain('✓ Has telemetry');
    });

    it('should generate summary for tenant with missing data', () => {
      const result = {
        isValid: true,
        isPowerTransmission: true,
        hasAssets: false,
        hasGridTopology: false,
        hasTelemetry: false,
        errors: [],
        warnings: []
      };
      
      const summary = getTenantValidationSummary(result);
      
      expect(summary).toContain('⚠ No assets');
      expect(summary).toContain('⚠ No grid topology');
      expect(summary).toContain('⚠ No telemetry');
    });

    it('should generate summary for invalid tenant', () => {
      const result = {
        isValid: false,
        isPowerTransmission: false,
        hasAssets: false,
        hasGridTopology: false,
        hasTelemetry: false,
        errors: ['Tenant not found'],
        warnings: []
      };
      
      const summary = getTenantValidationSummary(result);
      
      expect(summary).toContain('Tenant validation failed');
      expect(summary).toContain('Tenant not found');
    });
  });
});
