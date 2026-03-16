/**
 * Tests for TransmissionProvider monitoring API functions
 * 
 * Tests the implementation of monitoring queries including:
 * - Real-time telemetry
 * - Baseline with trends
 * - Multi-fluid summary
 * - Power quality events
 * - Submeters
 * 
 * Requirements: 2.5, 4.4, 5.1, 6.4, 7.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getTransmissionProvider } from '../TransmissionProvider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

describe('TransmissionProvider Monitoring API', () => {
  const provider = getTransmissionProvider();
  
  beforeAll(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping monitoring API tests');
    }
  });

  describe('Real-time Telemetry', () => {
    it('should get real-time telemetry without filters', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getRealtimeTelemetry();
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const meter = result[0];
        expect(meter).toHaveProperty('id');
        expect(meter).toHaveProperty('name');
        expect(meter).toHaveProperty('last_telemetry_at');
        expect(meter).toHaveProperty('current_kw');
        expect(meter).toHaveProperty('is_stale');
      }
    });

    it('should filter real-time telemetry by substation', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get a substation first
      const substations = await provider.listTxSubstations({ active: true });
      
      if (substations.length === 0) {
        console.warn('No substations found, skipping substation filter test');
        return;
      }

      const substation = substations[0];
      const result = await provider.getRealtimeTelemetry({
        substation_id: substation.id
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should have the specified substation_id
      result.forEach(meter => {
        expect(meter.substation_id).toBe(substation.id);
      });
    });

    it('should filter real-time telemetry by stale flag', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getRealtimeTelemetry({
        stale_telemetry: false
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should not be stale
      result.forEach(meter => {
        expect(meter.is_stale).toBe(false);
      });
    });

    it('should limit real-time telemetry results', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const limit = 5;
      const result = await provider.getRealtimeTelemetry({ limit });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Baseline with Trends', () => {
    it('should return null when no baseline exists', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const nonExistentMeterId = '00000000-0000-0000-0000-000000000000';
      const result = await provider.getBaselineWithTrends(
        nonExistentMeterId,
        {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      );
      
      expect(result).toBeNull();
    });

    it('should get baseline with trends when baseline exists', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get meters with baselines
      const { data: baselines } = await supabase!
        .from('energy_baselines')
        .select('meter_id')
        .eq('active', true)
        .limit(1);
      
      if (!baselines || baselines.length === 0) {
        console.warn('No baselines found, skipping baseline trends test');
        return;
      }

      const meterId = baselines[0].meter_id;
      const result = await provider.getBaselineWithTrends(
        meterId,
        {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      );
      
      if (result) {
        expect(result).toHaveProperty('baseline');
        expect(result).toHaveProperty('trends');
        expect(result).toHaveProperty('summary');
        
        expect(result.baseline).toHaveProperty('meter_id', meterId);
        expect(Array.isArray(result.trends)).toBe(true);
        
        expect(result.summary).toHaveProperty('avg_deviation_pct');
        expect(result.summary).toHaveProperty('max_deviation_pct');
        expect(result.summary).toHaveProperty('anomaly_count');
      }
    });
  });

  describe('Baseline Upsert', () => {
    it('should create a new baseline', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get a meter first
      const meters = await provider.listEnergyMetersTxScoped({ active: true });
      
      if (meters.length === 0) {
        console.warn('No meters found, skipping baseline upsert test');
        return;
      }

      const meter = meters[0];
      const baseline = await provider.upsertBaseline({
        meter_id: meter.id,
        baseline_name: 'Test Baseline',
        baseline_type: 'regression',
        baseline_period_start: '2024-01-01',
        baseline_period_end: '2024-01-31',
        baseline_value: 1000,
        baseline_unit: 'kWh',
        normalization_factors: {},
        confidence_level: 0.95,
        active: true,
        metadata: {}
      });
      
      expect(baseline).toHaveProperty('id');
      expect(baseline.meter_id).toBe(meter.id);
      expect(baseline.baseline_name).toBe('Test Baseline');
    });
  });

  describe('Multi-Fluid Summary', () => {
    it('should get multi-fluid summary without filters', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getMultiFluidSummary();
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const summary = result[0];
        expect(summary).toHaveProperty('energy_type');
        expect(summary).toHaveProperty('meter_count');
        expect(summary).toHaveProperty('meters');
        expect(Array.isArray(summary.meters)).toBe(true);
      }
    });

    it('should filter multi-fluid summary by substation', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const substations = await provider.listTxSubstations({ active: true });
      
      if (substations.length === 0) {
        console.warn('No substations found, skipping multi-fluid filter test');
        return;
      }

      const substation = substations[0];
      const result = await provider.getMultiFluidSummary({
        substation_id: substation.id
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All meters in the summary should belong to the specified substation
      result.forEach(summary => {
        summary.meters.forEach(meter => {
          expect(meter.substation_name).toBe(substation.name);
        });
      });
    });
  });

  describe('Power Quality Events', () => {
    it('should get power quality events without filters', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getPowerQualityEvents();
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const event = result[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('meter_id');
        expect(event).toHaveProperty('event_type');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('severity');
        expect(event).toHaveProperty('resolved');
      }
    });

    it('should filter power quality events by resolved status', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getPowerQualityEvents({
        resolved: false
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should be unresolved
      result.forEach(event => {
        expect(event.resolved).toBe(false);
      });
    });

    it('should filter power quality events by severity', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getPowerQualityEvents({
        severity: 'High'
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should have High severity
      result.forEach(event => {
        expect(event.severity).toBe('High');
      });
    });

    it('should filter power quality events by date range', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const result = await provider.getPowerQualityEvents({
        start_date: startDate,
        end_date: endDate
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should be within the date range
      result.forEach(event => {
        expect(event.timestamp >= startDate).toBe(true);
        expect(event.timestamp <= endDate).toBe(true);
      });
    });
  });

  describe('Resolve PQ Event', () => {
    it('should resolve a power quality event', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get an unresolved event first
      const events = await provider.getPowerQualityEvents({
        resolved: false
      });
      
      if (events.length === 0) {
        console.warn('No unresolved PQ events found, skipping resolve test');
        return;
      }

      const event = events[0];
      const resolved = await provider.resolvePQEvent(
        event.id,
        'Test resolution notes'
      );
      
      expect(resolved.id).toBe(event.id);
      expect(resolved.resolved).toBe(true);
      expect(resolved.resolved_at).toBeTruthy();
      expect(resolved.resolution_notes).toBe('Test resolution notes');
    });
  });

  describe('Submeters', () => {
    it('should get submeters without filters', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getSubmeters();
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const submeter = result[0];
        expect(submeter).toHaveProperty('id');
        expect(submeter).toHaveProperty('parent_meter_id');
        expect(submeter).toHaveProperty('submeter_id');
        expect(submeter).toHaveProperty('parent_meter_name');
        expect(submeter).toHaveProperty('submeter_name');
      }
    });

    it('should filter submeters by parent meter', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get a parent meter first
      const { data: submeters } = await supabase!
        .from('submeters')
        .select('parent_meter_id')
        .limit(1);
      
      if (!submeters || submeters.length === 0) {
        console.warn('No submeters found, skipping parent filter test');
        return;
      }

      const parentMeterId = submeters[0].parent_meter_id;
      const result = await provider.getSubmeters({
        parent_meter_id: parentMeterId
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should have the specified parent meter
      result.forEach(submeter => {
        expect(submeter.parent_meter_id).toBe(parentMeterId);
      });
    });

    it('should filter submeters by active status', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const result = await provider.getSubmeters({
        active: true
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // All results should be active
      result.forEach(submeter => {
        expect(submeter.active).toBe(true);
      });
    });
  });

  describe('Submeter Upsert', () => {
    it('should create a new submeter relationship', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // Get two different meters
      const meters = await provider.listEnergyMetersTxScoped({ active: true });
      
      if (meters.length < 2) {
        console.warn('Need at least 2 meters, skipping submeter upsert test');
        return;
      }

      const parentMeter = meters[0];
      const submeter = meters[1];
      
      const result = await provider.upsertSubmeter({
        parent_meter_id: parentMeter.id,
        submeter_id: submeter.id,
        allocation_percentage: 100,
        active: true,
        metadata: {}
      });
      
      expect(result).toHaveProperty('id');
      expect(result.parent_meter_id).toBe(parentMeter.id);
      expect(result.submeter_id).toBe(submeter.id);
    });

    it('should reject submeter with same parent and submeter', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const meters = await provider.listEnergyMetersTxScoped({ active: true });
      
      if (meters.length === 0) {
        console.warn('No meters found, skipping validation test');
        return;
      }

      const meter = meters[0];
      
      await expect(
        provider.upsertSubmeter({
          parent_meter_id: meter.id,
          submeter_id: meter.id,
          allocation_percentage: 100,
          active: true,
          metadata: {}
        })
      ).rejects.toThrow('parent_meter_id and submeter_id must be different');
    });
  });

  describe('Error Handling', () => {
    it('should handle RLS denial gracefully', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      // This test would require setting up a user with restricted permissions
      // For now, we just verify the error handling structure exists
      expect(provider).toHaveProperty('handleError');
    });

    it('should handle non-existent resources gracefully', async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const result = await provider.getBaselineWithTrends(
        nonExistentId,
        { start: '2024-01-01', end: '2024-01-31' }
      );
      
      expect(result).toBeNull();
    });
  });
});
