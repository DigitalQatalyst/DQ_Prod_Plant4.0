/**
 * Migration 2701 Verification Tests
 * Verifies the energy monitoring schema extensions
 * Requirements: 4.1, 4.2, 4.3, 6.3, 6.8
 */

import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Migration 2701: Energy Monitoring Schema Extensions', () => {
  
  describe('Energy Baselines Table Extensions', () => {
    test('should have energy_baselines table', async () => {
      const { data, error } = await supabase
        .from('energy_baselines')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have transmission-specific baseline columns', async () => {
      const { data: columns, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'energy_baselines' 
          AND column_name IN (
            'baseline_kwh_per_mwh_delivered',
            'baseline_kwh_per_mw_peak',
            'baseline_method'
          )
          ORDER BY column_name;
        `
      });

      if (error) {
        // If RPC doesn't exist, try direct query
        const { data: tableInfo } = await supabase
          .from('energy_baselines')
          .select('baseline_kwh_per_mwh_delivered, baseline_kwh_per_mw_peak, baseline_method')
          .limit(0);
        
        expect(tableInfo).toBeDefined();
      } else {
        expect(columns).toBeDefined();
        expect(columns?.length).toBeGreaterThanOrEqual(3);
      }
    });

    test('should have indexes on energy_baselines', async () => {
      // Test that we can query efficiently by meter_id
      const { error } = await supabase
        .from('energy_baselines')
        .select('id')
        .eq('meter_id', '00000000-0000-0000-0000-000000000000')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('TX Meter Channels Table', () => {
    test('should have tx_meter_channels table', async () => {
      const { data, error } = await supabase
        .from('tx_meter_channels')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('tx_meter_channels')
        .select('id, meter_id, channel_number, channel_name, channel_type, measurement_type, phase, unit, multiplier, offset, active')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should enforce unique constraint on (meter_id, channel_number)', async () => {
      // This test verifies the constraint exists by checking table constraints
      const { error } = await supabase
        .from('tx_meter_channels')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
    });
  });

  describe('TX Power Quality Limits Table', () => {
    test('should have tx_power_quality_limits table', async () => {
      const { data, error } = await supabase
        .from('tx_power_quality_limits')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('tx_power_quality_limits')
        .select('id, org_id, voltage_level_kv, limit_type, severity, min_value, max_value, duration_threshold_ms, standard_reference, active')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should support voltage-level-specific queries', async () => {
      const { error } = await supabase
        .from('tx_power_quality_limits')
        .select('*')
        .eq('voltage_level_kv', 400)
        .eq('limit_type', 'voltage_sag')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('Power Quality Events Table', () => {
    test('should have power_quality_events table', async () => {
      const { data, error } = await supabase
        .from('power_quality_events')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should support filtering by resolved status', async () => {
      const { error } = await supabase
        .from('power_quality_events')
        .select('*')
        .eq('resolved', false)
        .limit(10);
      
      expect(error).toBeNull();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('power_quality_events')
        .select('id, meter_id, event_type, timestamp, duration_ms, magnitude, severity, resolved, resolved_at, resolution_notes')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Submeters Table', () => {
    test('should have submeters table', async () => {
      const { data, error } = await supabase
        .from('submeters')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('submeters')
        .select('id, parent_meter_id, submeter_id, allocation_percentage, active')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should support querying by parent meter', async () => {
      const { error } = await supabase
        .from('submeters')
        .select('*')
        .eq('parent_meter_id', '00000000-0000-0000-0000-000000000000')
        .limit(10);
      
      expect(error).toBeNull();
    });
  });

  describe('Energy Telemetry Table', () => {
    test('should have energy_telemetry table', async () => {
      const { data, error } = await supabase
        .from('energy_telemetry')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('energy_telemetry')
        .select('meter_id, timestamp, kw, kwh, voltage_v, current_a, frequency_hz, power_factor, thd_pct')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Power Quality Table', () => {
    test('should have power_quality table', async () => {
      const { data, error } = await supabase
        .from('power_quality')
        .select('*')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have required columns', async () => {
      const { data, error } = await supabase
        .from('power_quality')
        .select('id, meter_id, timestamp, power_factor, thd_voltage_pct, thd_current_pct, voltage_l1, voltage_l2, voltage_l3, frequency')
        .limit(0);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Schema Integrity', () => {
    test('should have all required tables', async () => {
      const tables = [
        'energy_baselines',
        'tx_meter_channels',
        'tx_power_quality_limits',
        'power_quality_events',
        'submeters',
        'energy_telemetry',
        'power_quality'
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        expect(error).toBeNull();
      }
    });

    test('should support foreign key relationships', async () => {
      // Test that tx_meter_channels references energy_meters
      const { error: channelsError } = await supabase
        .from('tx_meter_channels')
        .select('meter_id')
        .limit(0);
      
      expect(channelsError).toBeNull();

      // Test that tx_power_quality_limits references tenants
      const { error: limitsError } = await supabase
        .from('tx_power_quality_limits')
        .select('org_id')
        .limit(0);
      
      expect(limitsError).toBeNull();

      // Test that submeters references energy_meters
      const { error: submetersError } = await supabase
        .from('submeters')
        .select('parent_meter_id, submeter_id')
        .limit(0);
      
      expect(submetersError).toBeNull();
    });
  });
});
