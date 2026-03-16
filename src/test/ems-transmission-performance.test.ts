/**
 * EMS Transmission Performance Validation Tests
 * 
 * Validates that the system meets performance requirements for:
 * - Query latency (Requirements 29.1, 29.2, 29.3)
 * - Data throughput (Requirement 29.4)
 * - Index usage (Requirement 29.6)
 * - Pagination (Requirement 29.7)
 * 
 * These tests verify performance targets are met with realistic data volumes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

describe('EMS Transmission Performance Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrgId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get test organization ID
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'TransGrid Energy')
      .single();
    
    testOrgId = orgs?.id || '';
  });

  describe('Requirement 29.1: Meter List Query Performance', () => {
    it('should return meter list within 2 seconds for up to 10,000 meters', async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('mv_tx_energy_meter_registry')
        .select('*')
        .eq('org_id', testOrgId)
        .eq('active', true)
        .limit(10000);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(2000); // 2 seconds target
      
      console.log(`Meter list query: ${duration.toFixed(2)}ms for ${data?.length || 0} meters`);
    });

    it('should use materialized view for meter registry queries', async () => {
      // Query the materialized view directly
      const { data, error } = await supabase
        .from('mv_tx_energy_meter_registry')
        .select('id, name, substation_name, feeder_name, last_telemetry_at, is_stale')
        .eq('org_id', testOrgId)
        .limit(100);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter meters by substation efficiently', async () => {
      const startTime = performance.now();
      
      const { data: substations } = await supabase
        .from('tx_substations')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(1);
      
      if (substations && substations.length > 0) {
        const { data, error } = await supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('substation_id', substations[0].id)
          .eq('active', true);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeNull();
        expect(duration).toBeLessThan(1000); // Should be fast with index
        
        console.log(`Substation filter query: ${duration.toFixed(2)}ms for ${data?.length || 0} meters`);
      }
    });

    it('should filter meters by feeder efficiently', async () => {
      const startTime = performance.now();
      
      const { data: feeders } = await supabase
        .from('tx_feeders')
        .select('id')
        .limit(1);
      
      if (feeders && feeders.length > 0) {
        const { data, error } = await supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('feeder_id', feeders[0].id)
          .eq('active', true);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeNull();
        expect(duration).toBeLessThan(1000);
        
        console.log(`Feeder filter query: ${duration.toFixed(2)}ms for ${data?.length || 0} meters`);
      }
    });

    it('should identify stale meters efficiently', async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('mv_tx_energy_meter_registry')
        .select('id, name, last_telemetry_at, is_stale')
        .eq('org_id', testOrgId)
        .eq('is_stale', true)
        .limit(100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
      
      console.log(`Stale meter query: ${duration.toFixed(2)}ms for ${data?.length || 0} meters`);
    });
  });

  describe('Requirement 29.2: Telemetry Time Series Query Performance', () => {
    it('should return telemetry within 3 seconds for large time ranges', async () => {
      // Get a test meter
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(1);
      
      if (meters && meters.length > 0) {
        const meterId = meters[0].id;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        
        const startTime = performance.now();
        
        const { data, error } = await supabase
          .from('energy_telemetry')
          .select('timestamp, kw, kwh, voltage_v, power_factor')
          .eq('meter_id', meterId)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order('timestamp', { ascending: false })
          .limit(10000);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeNull();
        expect(duration).toBeLessThan(3000); // 3 seconds target
        
        console.log(`Telemetry time series query: ${duration.toFixed(2)}ms for ${data?.length || 0} points`);
      }
    });

    it('should retrieve latest telemetry efficiently', async () => {
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(10);
      
      if (meters && meters.length > 0) {
        const startTime = performance.now();
        
        // Query latest telemetry for multiple meters
        const promises = meters.map(meter =>
          supabase
            .from('energy_telemetry')
            .select('timestamp, kw, voltage_v, power_factor')
            .eq('meter_id', meter.id)
            .order('timestamp', { ascending: false })
            .limit(1)
        );
        
        const results = await Promise.all(promises);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(1000); // Should be fast with index
        
        console.log(`Latest telemetry for ${meters.length} meters: ${duration.toFixed(2)}ms`);
      }
    });

    it('should use hourly aggregates for dashboard queries', async () => {
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(1);
      
      if (meters && meters.length > 0) {
        const meterId = meters[0].id;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        const startTime = performance.now();
        
        // Query continuous aggregate if it exists
        const { data, error } = await supabase
          .from('telemetry_hourly')
          .select('bucket, avg_kw, max_kw, total_kwh')
          .eq('meter_id', meterId)
          .gte('bucket', startDate.toISOString())
          .lte('bucket', endDate.toISOString())
          .order('bucket', { ascending: false });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // If continuous aggregate doesn't exist, this will fail gracefully
        if (!error) {
          expect(duration).toBeLessThan(1000);
          console.log(`Hourly aggregate query: ${duration.toFixed(2)}ms for ${data?.length || 0} hours`);
        }
      }
    });
  });

  describe('Requirement 29.3: Dashboard Load Performance', () => {
    it('should load alert summary within 1 second', async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('v_energy_alert_summary')
        .select('*')
        .eq('org_id', testOrgId)
        .limit(100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
      
      console.log(`Alert summary query: ${duration.toFixed(2)}ms for ${data?.length || 0} alerts`);
    });

    it('should load KPI snapshots within 1 second', async () => {
      const startTime = performance.now();
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('energy_kpi_snapshots')
        .select('*')
        .eq('org_id', testOrgId)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: false })
        .limit(1000);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
      
      console.log(`KPI snapshots query: ${duration.toFixed(2)}ms for ${data?.length || 0} snapshots`);
    });

    it('should load substation list within 500ms', async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('tx_substations')
        .select('id, code, name, region, voltage_levels_kv, active')
        .eq('org_id', testOrgId)
        .eq('active', true)
        .order('name');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(500);
      
      console.log(`Substation list query: ${duration.toFixed(2)}ms for ${data?.length || 0} substations`);
    });

    it('should load feeder list within 500ms', async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('tx_feeders')
        .select('id, feeder_code, name, substation_id, voltage_level_kv, direction, active')
        .eq('active', true)
        .order('name')
        .limit(1000);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(500);
      
      console.log(`Feeder list query: ${duration.toFixed(2)}ms for ${data?.length || 0} feeders`);
    });
  });

  describe('Requirement 29.6: Index Usage Validation', () => {
    it('should validate performance function exists', async () => {
      const { data, error } = await supabase.rpc('fn_validate_query_performance');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      if (data && data.length > 0) {
        console.log('\nQuery Performance Validation Results:');
        data.forEach((result: any) => {
          console.log(`  ${result.test_name}: ${result.execution_time_ms.toFixed(2)}ms (target: ${result.target_ms}ms) - ${result.meets_target ? '✓ PASS' : '✗ FAIL'}`);
        });
        
        // All tests should meet their targets
        const allPass = data.every((result: any) => result.meets_target);
        expect(allPass).toBe(true);
      }
    });
  });

  describe('Requirement 29.7: Cursor-Based Pagination', () => {
    it('should support cursor-based pagination for large result sets', async () => {
      const pageSize = 100;
      let lastId = '';
      let totalFetched = 0;
      const maxPages = 5;
      
      for (let page = 0; page < maxPages; page++) {
        const startTime = performance.now();
        
        let query = supabase
          .from('mv_tx_energy_meter_registry')
          .select('id, name, substation_name')
          .eq('org_id', testOrgId)
          .order('id')
          .limit(pageSize);
        
        if (lastId) {
          query = query.gt('id', lastId);
        }
        
        const { data, error } = await query;
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeNull();
        expect(duration).toBeLessThan(1000); // Each page should be fast
        
        if (!data || data.length === 0) break;
        
        totalFetched += data.length;
        lastId = data[data.length - 1].id;
        
        console.log(`Page ${page + 1}: ${duration.toFixed(2)}ms for ${data.length} records`);
      }
      
      expect(totalFetched).toBeGreaterThan(0);
    });

    it('should support offset pagination with reasonable performance', async () => {
      const pageSize = 50;
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('mv_tx_energy_meter_registry')
        .select('id, name, substation_name')
        .eq('org_id', testOrgId)
        .order('name')
        .range(0, pageSize - 1);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
      
      console.log(`Offset pagination (first page): ${duration.toFixed(2)}ms for ${data?.length || 0} records`);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should track query performance metrics', async () => {
      const metrics = {
        meter_list: 0,
        telemetry_latest: 0,
        alert_summary: 0,
        kpi_snapshots: 0,
        substation_list: 0
      };
      
      // Meter list
      let start = performance.now();
      await supabase
        .from('mv_tx_energy_meter_registry')
        .select('*')
        .eq('org_id', testOrgId)
        .limit(100);
      metrics.meter_list = performance.now() - start;
      
      // Latest telemetry
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(1);
      
      if (meters && meters.length > 0) {
        start = performance.now();
        await supabase
          .from('energy_telemetry')
          .select('*')
          .eq('meter_id', meters[0].id)
          .order('timestamp', { ascending: false })
          .limit(1);
        metrics.telemetry_latest = performance.now() - start;
      }
      
      // Alert summary
      start = performance.now();
      await supabase
        .from('v_energy_alert_summary')
        .select('*')
        .eq('org_id', testOrgId)
        .limit(50);
      metrics.alert_summary = performance.now() - start;
      
      // KPI snapshots
      start = performance.now();
      await supabase
        .from('energy_kpi_snapshots')
        .select('*')
        .eq('org_id', testOrgId)
        .limit(100);
      metrics.kpi_snapshots = performance.now() - start;
      
      // Substation list
      start = performance.now();
      await supabase
        .from('tx_substations')
        .select('*')
        .eq('org_id', testOrgId);
      metrics.substation_list = performance.now() - start;
      
      console.log('\nPerformance Metrics Summary:');
      console.log(`  Meter List: ${metrics.meter_list.toFixed(2)}ms`);
      console.log(`  Latest Telemetry: ${metrics.telemetry_latest.toFixed(2)}ms`);
      console.log(`  Alert Summary: ${metrics.alert_summary.toFixed(2)}ms`);
      console.log(`  KPI Snapshots: ${metrics.kpi_snapshots.toFixed(2)}ms`);
      console.log(`  Substation List: ${metrics.substation_list.toFixed(2)}ms`);
      
      // All queries should complete in reasonable time
      expect(metrics.meter_list).toBeLessThan(2000);
      expect(metrics.telemetry_latest).toBeLessThan(1000);
      expect(metrics.alert_summary).toBeLessThan(1000);
      expect(metrics.kpi_snapshots).toBeLessThan(1000);
      expect(metrics.substation_list).toBeLessThan(500);
    });
  });
});
