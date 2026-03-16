/**
 * Tests for APM Power Transmission Hooks
 * 
 * Basic unit tests for FS4 and FS1 API query hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { 
  useAssets, 
  useFMEAEntries, 
  useSpareParts,
  useLatestTelemetry,
  useTelemetrySeries,
  useHealthScore,
  useDiagnosticEvents,
  useAcknowledgeDiagnosticEvent,
  useCloseDiagnosticEvent,
} from '../useAPM';

// Mock Supabase client with proper chaining
const createMockQuery = () => {
  const mockQuery = {
    eq: vi.fn(() => mockQuery),
    ilike: vi.fn(() => mockQuery),
    or: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
    gte: vi.fn(() => mockQuery),
    contains: vi.fn(() => mockQuery),
    in: vi.fn(() => mockQuery),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return mockQuery;
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => createMockQuery()),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
}));

describe('useAPM Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAssets', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAssets());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty results', async () => {
      const { result } = renderHook(() => useAssets({ sector: 'power_transmission' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useAssets());
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useFMEAEntries', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useFMEAEntries());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty results', async () => {
      const { result } = renderHook(() => useFMEAEntries({ asset_type: 'power_transformer' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useFMEAEntries());
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useSpareParts', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useSpareParts());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty results', async () => {
      const { result } = renderHook(() => useSpareParts({ asset_type: 'power_transformer' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useSpareParts());
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  // FS1: Asset Health & Diagnostics Tests
  describe('useLatestTelemetry', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useLatestTelemetry({ asset_id: 'test-asset-id' }));
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle missing asset_id', async () => {
      const { result } = renderHook(() => useLatestTelemetry({ asset_id: '' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useLatestTelemetry({ asset_id: 'test-asset-id' }));
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useTelemetrySeries', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useTelemetrySeries({
        asset_id: 'test-asset-id',
        parameter_ids: ['param-1'],
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      }));
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle missing required parameters', async () => {
      const { result } = renderHook(() => useTelemetrySeries({
        asset_id: '',
        parameter_ids: [],
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).not.toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useTelemetrySeries({
        asset_id: 'test-asset-id',
        parameter_ids: ['param-1'],
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      }));
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useHealthScore', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useHealthScore({ asset_id: 'test-asset-id' }));
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle missing asset_id', async () => {
      const { result } = renderHook(() => useHealthScore({ asset_id: '' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useHealthScore({ asset_id: 'test-asset-id' }));
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useDiagnosticEvents', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useDiagnosticEvents());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty results', async () => {
      const { result } = renderHook(() => useDiagnosticEvents({ asset_id: 'test-asset-id' }));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useDiagnosticEvents());
      
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useAcknowledgeDiagnosticEvent', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useAcknowledgeDiagnosticEvent());
      
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should provide mutate function', () => {
      const { result } = renderHook(() => useAcknowledgeDiagnosticEvent());
      
      expect(typeof result.current.mutate).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useAcknowledgeDiagnosticEvent());
      
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('useCloseDiagnosticEvent', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useCloseDiagnosticEvent());
      
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should provide mutate function', () => {
      const { result } = renderHook(() => useCloseDiagnosticEvent());
      
      expect(typeof result.current.mutate).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useCloseDiagnosticEvent());
      
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('FS3: Asset Performance & Utilisation Hooks', () => {
    describe('useDowntimeEvents', () => {
      it('should initialize with loading state', () => {
        const { useDowntimeEvents } = require('../useAPM');
        const { result } = renderHook(() => useDowntimeEvents());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useDowntimeEvents } = require('../useAPM');
        const { result } = renderHook(() => useDowntimeEvents({ asset_id: 'test-asset' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useDowntimeEvents } = require('../useAPM');
        const { result } = renderHook(() => useDowntimeEvents());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('useReliabilityMetrics', () => {
      it('should initialize with loading state', () => {
        const { useReliabilityMetrics } = require('../useAPM');
        const { result } = renderHook(() => useReliabilityMetrics());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useReliabilityMetrics } = require('../useAPM');
        const { result } = renderHook(() => useReliabilityMetrics({ asset_id: 'test-asset' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useReliabilityMetrics } = require('../useAPM');
        const { result } = renderHook(() => useReliabilityMetrics());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('useUtilisationMetrics', () => {
      it('should initialize with loading state', () => {
        const { useUtilisationMetrics } = require('../useAPM');
        const { result } = renderHook(() => useUtilisationMetrics());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useUtilisationMetrics } = require('../useAPM');
        const { result } = renderHook(() => useUtilisationMetrics({ asset_id: 'test-asset' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useUtilisationMetrics } = require('../useAPM');
        const { result } = renderHook(() => useUtilisationMetrics());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('usePerformanceBenchmarks', () => {
      it('should initialize with loading state', () => {
        const { usePerformanceBenchmarks } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceBenchmarks());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { usePerformanceBenchmarks } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceBenchmarks({ asset_type: 'power_transformer' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { usePerformanceBenchmarks } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceBenchmarks());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('usePerformanceDeviations', () => {
      it('should initialize with loading state', () => {
        const { usePerformanceDeviations } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceDeviations());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { usePerformanceDeviations } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceDeviations({ asset_type: 'power_transformer' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { usePerformanceDeviations } = require('../useAPM');
        const { result } = renderHook(() => usePerformanceDeviations());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });
  });

  describe('FS2: Predictive & Prescriptive Maintenance Hooks', () => {
    describe('useFailurePredictions', () => {
      it('should initialize with loading state', () => {
        const { useFailurePredictions } = require('../useAPM');
        const { result } = renderHook(() => useFailurePredictions());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useFailurePredictions } = require('../useAPM');
        const { result } = renderHook(() => useFailurePredictions({ 
          asset_id: 'test-asset',
          risk_level: 'high'
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useFailurePredictions } = require('../useAPM');
        const { result } = renderHook(() => useFailurePredictions());
        
        expect(typeof result.current.refetch).toBe('function');
      });

      it('should support filtering by risk_level', async () => {
        const { useFailurePredictions } = require('../useAPM');
        const { result } = renderHook(() => useFailurePredictions({ 
          risk_level: 'critical'
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
      });

      it('should support filtering by time_horizon', async () => {
        const { useFailurePredictions } = require('../useAPM');
        const { result } = renderHook(() => useFailurePredictions({ 
          time_horizon: 30
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
      });
    });

    describe('useCBMTriggers', () => {
      it('should initialize with loading state', () => {
        const { useCBMTriggers } = require('../useAPM');
        const { result } = renderHook(() => useCBMTriggers());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useCBMTriggers } = require('../useAPM');
        const { result } = renderHook(() => useCBMTriggers({ 
          is_active: true
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useCBMTriggers } = require('../useAPM');
        const { result } = renderHook(() => useCBMTriggers());
        
        expect(typeof result.current.refetch).toBe('function');
      });

      it('should support filtering by parameter_id', async () => {
        const { useCBMTriggers } = require('../useAPM');
        const { result } = renderHook(() => useCBMTriggers({ 
          parameter_id: 'param-uuid'
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
      });
    });

    describe('useMaintenanceRecommendations', () => {
      it('should initialize with loading state', () => {
        const { useMaintenanceRecommendations } = require('../useAPM');
        const { result } = renderHook(() => useMaintenanceRecommendations());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useMaintenanceRecommendations } = require('../useAPM');
        const { result } = renderHook(() => useMaintenanceRecommendations({ 
          asset_id: 'test-asset',
          status: 'open'
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
      });

      it('should provide refetch function', () => {
        const { useMaintenanceRecommendations } = require('../useAPM');
        const { result } = renderHook(() => useMaintenanceRecommendations());
        
        expect(typeof result.current.refetch).toBe('function');
      });

      it('should support filtering by priority_score', async () => {
        const { useMaintenanceRecommendations } = require('../useAPM');
        const { result } = renderHook(() => useMaintenanceRecommendations({ 
          min_priority: 80
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
      });

      it('should support filtering by due_date', async () => {
        const { useMaintenanceRecommendations } = require('../useAPM');
        const { result } = renderHook(() => useMaintenanceRecommendations({ 
          due_before: '2024-02-01T00:00:00Z'
        }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
      });
    });

    describe('useAcknowledgeRecommendation', () => {
      it('should initialize with idle state', () => {
        const { useAcknowledgeRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeRecommendation());
        
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should provide mutate function', () => {
        const { useAcknowledgeRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeRecommendation());
        
        expect(typeof result.current.mutate).toBe('function');
      });

      it('should provide reset function', () => {
        const { useAcknowledgeRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeRecommendation());
        
        expect(typeof result.current.reset).toBe('function');
      });

      it('should validate required parameters', async () => {
        const { useAcknowledgeRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeRecommendation());
        
        await result.current.mutate({ recommendation_id: '' });
        
        await waitFor(() => {
          expect(result.current.error).not.toBe(null);
          expect(result.current.error?.message).toContain('recommendation_id is required');
        });
      });
    });

    describe('useScheduleRecommendation', () => {
      it('should initialize with idle state', () => {
        const { useScheduleRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useScheduleRecommendation());
        
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should provide mutate function', () => {
        const { useScheduleRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useScheduleRecommendation());
        
        expect(typeof result.current.mutate).toBe('function');
      });

      it('should provide reset function', () => {
        const { useScheduleRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useScheduleRecommendation());
        
        expect(typeof result.current.reset).toBe('function');
      });

      it('should validate required parameters', async () => {
        const { useScheduleRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useScheduleRecommendation());
        
        await result.current.mutate({ 
          recommendation_id: 'rec-uuid',
          scheduled_date: ''
        });
        
        await waitFor(() => {
          expect(result.current.error).not.toBe(null);
          expect(result.current.error?.message).toContain('scheduled_date are required');
        });
      });
    });

    describe('useCloseRecommendation', () => {
      it('should initialize with idle state', () => {
        const { useCloseRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useCloseRecommendation());
        
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
      });

      it('should provide mutate function', () => {
        const { useCloseRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useCloseRecommendation());
        
        expect(typeof result.current.mutate).toBe('function');
      });

      it('should provide reset function', () => {
        const { useCloseRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useCloseRecommendation());
        
        expect(typeof result.current.reset).toBe('function');
      });

      it('should validate required parameters', async () => {
        const { useCloseRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useCloseRecommendation());
        
        await result.current.mutate({ 
          recommendation_id: 'rec-uuid',
          completion_notes: ''
        });
        
        await waitFor(() => {
          expect(result.current.error).not.toBe(null);
          expect(result.current.error?.message).toContain('completion_notes are required');
        });
      });

      it('should require completion_notes when closing', async () => {
        const { useCloseRecommendation } = require('../useAPM');
        const { result } = renderHook(() => useCloseRecommendation());
        
        await result.current.mutate({ 
          recommendation_id: '',
          completion_notes: ''
        });
        
        await waitFor(() => {
          expect(result.current.error).not.toBe(null);
        });
      });
    });
  });

  describe('FS5: Alerts, Reports & Visualisation Hooks', () => {
    describe('useAlerts', () => {
      it('should initialize with loading state', () => {
        const { useAlerts } = require('../useAPM');
        const { result } = renderHook(() => useAlerts());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
      });

      it('should handle empty results', async () => {
        const { useAlerts } = require('../useAPM');
        const { result } = renderHook(() => useAlerts({ asset_id: 'test-asset' }));
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.data).toEqual([]);
        });
      });

      it('should provide refetch function', () => {
        const { useAlerts } = require('../useAPM');
        const { result } = renderHook(() => useAlerts());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('useAcknowledgeAlert', () => {
      it('should initialize with idle state', () => {
        const { useAcknowledgeAlert } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeAlert());
        
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
      });

      it('should provide mutate and reset functions', () => {
        const { useAcknowledgeAlert } = require('../useAPM');
        const { result } = renderHook(() => useAcknowledgeAlert());
        
        expect(typeof result.current.mutate).toBe('function');
        expect(typeof result.current.reset).toBe('function');
      });
    });

    describe('useCloseAlert', () => {
      it('should initialize with idle state', () => {
        const { useCloseAlert } = require('../useAPM');
        const { result } = renderHook(() => useCloseAlert());
        
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
      });
    });

    describe('useAlertTimeline', () => {
      it('should initialize with loading state', () => {
        const { useAlertTimeline } = require('../useAPM');
        const { result } = renderHook(() => useAlertTimeline());
        
        expect(result.current.loading).toBe(true);
      });
    });


    describe('useDashboards', () => {
      it('should initialize with loading state', () => {
        const { useDashboards } = require('../useAPM');
        const { result } = renderHook(() => useDashboards());
        
        expect(result.current.loading).toBe(true);
      });

      it('should provide refetch function', () => {
        const { useDashboards } = require('../useAPM');
        const { result } = renderHook(() => useDashboards());
        
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('useUpsertDashboard', () => {
      it('should initialize with idle state', () => {
        const { useUpsertDashboard } = require('../useAPM');
        const { result } = renderHook(() => useUpsertDashboard());
        
        expect(result.current.loading).toBe(false);
      });
    });

    describe('useReportRuns', () => {
      it('should initialize with loading state', () => {
        const { useReportRuns } = require('../useAPM');
        const { result } = renderHook(() => useReportRuns());
        
        expect(result.current.loading).toBe(true);
      });
    });

    describe('useGenerateReport', () => {
      it('should initialize with idle state', () => {
        const { useGenerateReport } = require('../useAPM');
        const { result } = renderHook(() => useGenerateReport());
        
        expect(result.current.loading).toBe(false);
      });
    });

    describe('useExportJobs', () => {
      it('should initialize with loading state', () => {
        const { useExportJobs } = require('../useAPM');
        const { result } = renderHook(() => useExportJobs());
        
        expect(result.current.loading).toBe(true);
      });
    });

    describe('useCreateExport', () => {
      it('should initialize with idle state', () => {
        const { useCreateExport } = require('../useAPM');
        const { result } = renderHook(() => useCreateExport());
        
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
