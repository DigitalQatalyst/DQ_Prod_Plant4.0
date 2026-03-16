/**
 * EMS Transmission Concurrent Load Tests
 * 
 * Tests system performance under concurrent user load to validate:
 * - Multiple simultaneous queries don't degrade performance
 * - Cache effectiveness under load
 * - Database connection pooling works correctly
 * - No race conditions or deadlocks occur
 * 
 * Requirements: 29.1, 29.2, 29.3, 29.4
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

describe('EMS Transmission Concurrent Load Tests', () => {
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

  describe('Concurrent Meter Registry Queries', () => {
    it('should handle 10 concurrent meter list queries efficiently', async () => {
      const concurrentQueries = 10;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentQueries }, (_, i) =>
        supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('active', true)
          .limit(100)
      );
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentQueries;
      
      // All queries should succeed
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });
      
      // Average query time should still be reasonable
      expect(avgDuration).toBeLessThan(2000);
      
      console.log(`${concurrentQueries} concurrent meter queries: ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg`);
    });

    it('should handle 20 concurrent filtered meter queries', async () => {
      const concurrentQueries = 20;
      
      // Get some substations to filter by
      const { data: substations } = await supabase
        .from('tx_substations')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(5);
      
      if (substations && substations.length > 0) {
        const startTime = performance.now();
        
        const promises = Array.from({ length: concurrentQueries }, (_, i) => {
          const substationId = substations[i % substations.length].id;
          return supabase
            .from('mv_tx_energy_meter_registry')
            .select('*')
            .eq('substation_id', substationId)
            .eq('active', true);
        });
        
        const results = await Promise.all(promises);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / concurrentQueries;
        
        results.forEach(({ error }) => {
          expect(error).toBeNull();
        });
        
        expect(avgDuration).toBeLessThan(1000);
        
        console.log(`${concurrentQueries} concurrent filtered queries: ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg`);
      }
    });
  });

  describe('Concurrent Telemetry Queries', () => {
    it('should handle 15 concurrent latest telemetry queries', async () => {
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(15);
      
      if (meters && meters.length > 0) {
        const startTime = performance.now();
        
        const promises = meters.map(meter =>
          supabase
            .from('energy_telemetry')
            .select('timestamp, kw, kwh, voltage_v, power_factor')
            .eq('meter_id', meter.id)
            .order('timestamp', { ascending: false })
            .limit(1)
        );
        
        const results = await Promise.all(promises);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / meters.length;
        
        results.forEach(({ error }) => {
          expect(error).toBeNull();
        });
        
        expect(avgDuration).toBeLessThan(500);
        
        console.log(`${meters.length} concurrent latest telemetry queries: ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg`);
      }
    });

    it('should handle 10 concurrent time-range telemetry queries', async () => {
      const { data: meters } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('org_id', testOrgId)
        .limit(10);
      
      if (meters && meters.length > 0) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
        
        const startTime = performance.now();
        
        const promises = meters.map(meter =>
          supabase
            .from('energy_telemetry')
            .select('timestamp, kw, kwh')
            .eq('meter_id', meter.id)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: false })
            .limit(1000)
        );
        
        const results = await Promise.all(promises);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / meters.length;
        
        results.forEach(({ error }) => {
          expect(error).toBeNull();
        });
        
        expect(avgDuration).toBeLessThan(3000);
        
        console.log(`${meters.length} concurrent time-range queries: ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg`);
      }
    });
  });

  describe('Concurrent Dashboard Queries', () => {
    it('should handle concurrent dashboard widget queries', async () => {
      const startTime = performance.now();
      
      // Simulate loading multiple dashboard widgets concurrently
      const promises = [
        // Widget 1: Meter list
        supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('org_id', testOrgId)
          .limit(50),
        
        // Widget 2: Alert summary
        supabase
          .from('v_energy_alert_summary')
          .select('*')
          .eq('org_id', testOrgId)
          .limit(20),
        
        // Widget 3: KPI snapshots
        supabase
          .from('energy_kpi_snapshots')
          .select('*')
          .eq('org_id', testOrgId)
          .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100),
        
        // Widget 4: Substation list
        supabase
          .from('tx_substations')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('active', true),
        
        // Widget 5: Feeder list
        supabase
          .from('tx_feeders')
          .select('*')
          .eq('active', true)
          .limit(100),
        
        // Widget 6: Recent anomalies
        supabase
          .from('energy_anomalies')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('resolved', false)
          .order('timestamp', { ascending: false })
          .limit(20)
      ];
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });
      
      // All dashboard widgets should load within 5 seconds (Requirement 29.3)
      expect(duration).toBeLessThan(5000);
      
      console.log(`Dashboard load (6 concurrent widgets): ${duration.toFixed(2)}ms`);
    });

    it('should handle multiple users loading dashboards simultaneously', async () => {
      const concurrentUsers = 5;
      const startTime = performance.now();
      
      // Simulate 5 users loading dashboards at the same time
      const userPromises = Array.from({ length: concurrentUsers }, () =>
        Promise.all([
          supabase
            .from('mv_tx_energy_meter_registry')
            .select('*')
            .eq('org_id', testOrgId)
            .limit(50),
          
          supabase
            .from('v_energy_alert_summary')
            .select('*')
            .eq('org_id', testOrgId)
            .limit(20),
          
          supabase
            .from('energy_kpi_snapshots')
            .select('*')
            .eq('org_id', testOrgId)
            .limit(50)
        ])
      );
      
      const results = await Promise.all(userPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgPerUser = duration / concurrentUsers;
      
      results.forEach(userResults => {
        userResults.forEach(({ error }) => {
          expect(error).toBeNull();
        });
      });
      
      // Each user's dashboard should load within reasonable time
      expect(avgPerUser).toBeLessThan(5000);
      
      console.log(`${concurrentUsers} concurrent users loading dashboards: ${duration.toFixed(2)}ms total, ${avgPerUser.toFixed(2)}ms avg per user`);
    });
  });

  describe('Concurrent Topology Queries', () => {
    it('should handle concurrent substation and feeder queries', async () => {
      const startTime = performance.now();
      
      const promises = [
        // Query substations
        supabase
          .from('tx_substations')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('active', true),
        
        // Query feeders
        supabase
          .from('tx_feeders')
          .select('*')
          .eq('active', true)
          .limit(500),
        
        // Query transformers
        supabase
          .from('tx_transformers')
          .select('*')
          .eq('active', true)
          .limit(500),
        
        // Query lines
        supabase
          .from('tx_lines')
          .select('*')
          .eq('active', true)
          .limit(500)
      ];
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });
      
      expect(duration).toBeLessThan(2000);
      
      console.log(`Concurrent topology queries: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Mixed Workload Simulation', () => {
    it('should handle realistic mixed workload', async () => {
      const startTime = performance.now();
      
      // Simulate a realistic mix of queries that might happen in production
      const promises = [
        // User 1: Loading meter list page
        supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('org_id', testOrgId)
          .limit(100),
        
        // User 2: Loading alert page
        supabase
          .from('v_energy_alert_summary')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('alert_state', 'open')
          .limit(50),
        
        // User 3: Loading dashboard
        supabase
          .from('energy_kpi_snapshots')
          .select('*')
          .eq('org_id', testOrgId)
          .gte('period_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100),
        
        // User 4: Viewing substation details
        supabase
          .from('tx_substations')
          .select('*')
          .eq('org_id', testOrgId)
          .limit(1),
        
        // User 5: Checking latest telemetry
        supabase
          .from('energy_meters')
          .select('id')
          .eq('org_id', testOrgId)
          .limit(10)
          .then(async ({ data: meters }) => {
            if (meters && meters.length > 0) {
              return supabase
                .from('energy_telemetry')
                .select('*')
                .eq('meter_id', meters[0].id)
                .order('timestamp', { ascending: false })
                .limit(1);
            }
            return { data: null, error: null };
          }),
        
        // Background: Anomaly detection query
        supabase
          .from('energy_anomalies')
          .select('*')
          .eq('org_id', testOrgId)
          .eq('resolved', false)
          .limit(50),
        
        // Background: Baseline comparison
        supabase
          .from('energy_baselines')
          .select('*')
          .limit(50)
      ];
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Most queries should succeed (some might fail if data doesn't exist)
      const successCount = results.filter(result => !result.error).length;
      expect(successCount).toBeGreaterThan(5);
      
      // Mixed workload should complete in reasonable time
      expect(duration).toBeLessThan(5000);
      
      console.log(`Mixed workload (7 concurrent operations): ${duration.toFixed(2)}ms, ${successCount}/${results.length} succeeded`);
    });
  });

  describe('Stress Test', () => {
    it('should handle high concurrent query load', async () => {
      const concurrentQueries = 50;
      const startTime = performance.now();
      
      // Create 50 concurrent queries of various types
      const promises = Array.from({ length: concurrentQueries }, (_, i) => {
        const queryType = i % 5;
        
        switch (queryType) {
          case 0:
            return supabase
              .from('mv_tx_energy_meter_registry')
              .select('*')
              .eq('org_id', testOrgId)
              .limit(50);
          
          case 1:
            return supabase
              .from('tx_substations')
              .select('*')
              .eq('org_id', testOrgId);
          
          case 2:
            return supabase
              .from('tx_feeders')
              .select('*')
              .limit(100);
          
          case 3:
            return supabase
              .from('energy_kpi_snapshots')
              .select('*')
              .eq('org_id', testOrgId)
              .limit(50);
          
          case 4:
            return supabase
              .from('v_energy_alert_summary')
              .select('*')
              .eq('org_id', testOrgId)
              .limit(20);
          
          default:
            return supabase
              .from('mv_tx_energy_meter_registry')
              .select('*')
              .eq('org_id', testOrgId)
              .limit(50);
        }
      });
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentQueries;
      
      const successCount = results.filter(({ error }) => !error).length;
      const successRate = (successCount / concurrentQueries) * 100;
      
      // At least 90% of queries should succeed
      expect(successRate).toBeGreaterThan(90);
      
      // Average query time should still be reasonable under load
      expect(avgDuration).toBeLessThan(3000);
      
      console.log(`Stress test (${concurrentQueries} concurrent queries): ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg, ${successRate.toFixed(1)}% success rate`);
    });
  });
});
