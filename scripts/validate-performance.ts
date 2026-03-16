/**
 * Performance Validation Script
 * 
 * Runs comprehensive performance validation tests and generates a report.
 * This script should be run after deploying performance optimizations.
 * 
 * Usage: npx tsx scripts/validate-performance.ts
 * 
 * Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

interface PerformanceResult {
  testName: string;
  description: string;
  duration: number;
  target: number;
  passed: boolean;
  details?: any;
}

class PerformanceValidator {
  private supabase: ReturnType<typeof createClient>;
  private results: PerformanceResult[] = [];
  private testOrgId: string = '';

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize() {
    console.log('🔧 Initializing performance validator...\n');
    
    // Get test organization
    const { data: orgs } = await this.supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'TransGrid Energy')
      .single();
    
    if (orgs) {
      this.testOrgId = orgs.id;
      console.log(`✓ Using test organization: ${orgs.name} (${orgs.id})\n`);
    } else {
      console.log('⚠ Warning: TransGrid Energy organization not found. Some tests may fail.\n');
    }
  }

  async runTest(
    name: string,
    description: string,
    target: number,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const duration = performance.now() - startTime;
      const passed = duration < target;
      
      this.results.push({
        testName: name,
        description,
        duration,
        target,
        passed,
        details: result
      });
      
      const status = passed ? '✓' : '✗';
      const color = passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(`${color}${status}${reset} ${name}: ${duration.toFixed(2)}ms (target: ${target}ms)`);
    } catch (error) {
      console.log(`✗ ${name}: ERROR - ${error}`);
      this.results.push({
        testName: name,
        description,
        duration: 0,
        target,
        passed: false,
        details: { error: String(error) }
      });
    }
  }

  async validateMeterListPerformance() {
    console.log('\n📊 Requirement 29.1: Meter List Query Performance\n');
    
    await this.runTest(
      'Meter List (10,000 limit)',
      'Query meter registry with topology joins',
      2000,
      async () => {
        const { data, error } = await this.supabase
          .from('mv_tx_energy_meter_registry')
          .select('*')
          .eq('org_id', this.testOrgId)
          .eq('active', true)
          .limit(10000);
        
        return { count: data?.length || 0, error };
      }
    );

    await this.runTest(
      'Meter List with Substation Filter',
      'Filter meters by substation',
      1000,
      async () => {
        const { data: substations } = await this.supabase
          .from('tx_substations')
          .select('id')
          .eq('org_id', this.testOrgId)
          .limit(1);
        
        if (substations && substations.length > 0) {
          const { data, error } = await this.supabase
            .from('mv_tx_energy_meter_registry')
            .select('*')
            .eq('substation_id', substations[0].id)
            .eq('active', true);
          
          return { count: data?.length || 0, error };
        }
        return { count: 0 };
      }
    );

    await this.runTest(
      'Stale Meter Detection',
      'Identify meters with stale telemetry',
      1000,
      async () => {
        const { data, error } = await this.supabase
          .from('mv_tx_energy_meter_registry')
          .select('id, name, last_telemetry_at, is_stale')
          .eq('org_id', this.testOrgId)
          .eq('is_stale', true)
          .limit(100);
        
        return { count: data?.length || 0, error };
      }
    );
  }

  async validateTelemetryPerformance() {
    console.log('\n📈 Requirement 29.2: Telemetry Time Series Query Performance\n');
    
    await this.runTest(
      'Telemetry Time Range (30 days)',
      'Query telemetry for 30-day period',
      3000,
      async () => {
        const { data: meters } = await this.supabase
          .from('energy_meters')
          .select('id')
          .eq('org_id', this.testOrgId)
          .limit(1);
        
        if (meters && meters.length > 0) {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const { data, error } = await this.supabase
            .from('energy_telemetry')
            .select('timestamp, kw, kwh, voltage_v, power_factor')
            .eq('meter_id', meters[0].id)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: false })
            .limit(10000);
          
          return { count: data?.length || 0, error };
        }
        return { count: 0 };
      }
    );

    await this.runTest(
      'Latest Telemetry (10 meters)',
      'Query latest telemetry for multiple meters',
      1000,
      async () => {
        const { data: meters } = await this.supabase
          .from('energy_meters')
          .select('id')
          .eq('org_id', this.testOrgId)
          .limit(10);
        
        if (meters && meters.length > 0) {
          const promises = meters.map(meter =>
            this.supabase
              .from('energy_telemetry')
              .select('timestamp, kw, voltage_v')
              .eq('meter_id', meter.id)
              .order('timestamp', { ascending: false })
              .limit(1)
          );
          
          const results = await Promise.all(promises);
          return { count: results.length };
        }
        return { count: 0 };
      }
    );
  }

  async validateDashboardPerformance() {
    console.log('\n📊 Requirement 29.3: Dashboard Load Performance\n');
    
    await this.runTest(
      'Dashboard Load (6 widgets)',
      'Load all dashboard widgets concurrently',
      5000,
      async () => {
        const promises = [
          this.supabase
            .from('mv_tx_energy_meter_registry')
            .select('*')
            .eq('org_id', this.testOrgId)
            .limit(50),
          
          this.supabase
            .from('v_energy_alert_summary')
            .select('*')
            .eq('org_id', this.testOrgId)
            .limit(20),
          
          this.supabase
            .from('energy_kpi_snapshots')
            .select('*')
            .eq('org_id', this.testOrgId)
            .limit(100),
          
          this.supabase
            .from('tx_substations')
            .select('*')
            .eq('org_id', this.testOrgId),
          
          this.supabase
            .from('tx_feeders')
            .select('*')
            .limit(100),
          
          this.supabase
            .from('energy_anomalies')
            .select('*')
            .eq('org_id', this.testOrgId)
            .eq('resolved', false)
            .limit(20)
        ];
        
        const results = await Promise.all(promises);
        return { widgets: results.length };
      }
    );

    await this.runTest(
      'Alert Summary',
      'Query alert summary view',
      1000,
      async () => {
        const { data, error } = await this.supabase
          .from('v_energy_alert_summary')
          .select('*')
          .eq('org_id', this.testOrgId)
          .limit(100);
        
        return { count: data?.length || 0, error };
      }
    );

    await this.runTest(
      'KPI Snapshots',
      'Query KPI snapshots for last 30 days',
      1000,
      async () => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const { data, error } = await this.supabase
          .from('energy_kpi_snapshots')
          .select('*')
          .eq('org_id', this.testOrgId)
          .gte('period_start', startDate.toISOString())
          .limit(1000);
        
        return { count: data?.length || 0, error };
      }
    );
  }

  async validateDatabaseFunctions() {
    console.log('\n🔍 Requirement 29.6: Database Function Performance\n');
    
    await this.runTest(
      'Performance Validation Function',
      'Run fn_validate_query_performance()',
      5000,
      async () => {
        const { data, error } = await this.supabase.rpc('fn_validate_query_performance');
        
        if (data && Array.isArray(data)) {
          const allPass = data.every((result: any) => result.meets_target);
          return { 
            tests: data.length, 
            allPass,
            results: data.map((r: any) => ({
              name: r.test_name,
              duration: r.execution_time_ms,
              target: r.target_ms,
              passed: r.meets_target
            }))
          };
        }
        
        return { error };
      }
    );
  }

  async validatePagination() {
    console.log('\n📄 Requirement 29.7: Pagination Performance\n');
    
    await this.runTest(
      'Cursor-Based Pagination (5 pages)',
      'Fetch 5 pages using cursor-based pagination',
      5000,
      async () => {
        const pageSize = 100;
        let lastId = '';
        let totalFetched = 0;
        
        for (let page = 0; page < 5; page++) {
          let query = this.supabase
            .from('mv_tx_energy_meter_registry')
            .select('id, name')
            .eq('org_id', this.testOrgId)
            .order('id')
            .limit(pageSize);
          
          if (lastId) {
            query = query.gt('id', lastId);
          }
          
          const { data } = await query;
          
          if (!data || data.length === 0) break;
          
          totalFetched += data.length;
          lastId = data[data.length - 1].id;
        }
        
        return { totalFetched };
      }
    );

    await this.runTest(
      'Offset Pagination (first page)',
      'Fetch first page using offset pagination',
      1000,
      async () => {
        const { data, error } = await this.supabase
          .from('mv_tx_energy_meter_registry')
          .select('id, name')
          .eq('org_id', this.testOrgId)
          .order('name')
          .range(0, 49);
        
        return { count: data?.length || 0, error };
      }
    );
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PERFORMANCE VALIDATION REPORT');
    console.log('='.repeat(80) + '\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const passRate = (passed / total) * 100;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${passRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed}\n`);
    
    if (failed > 0) {
      console.log('❌ Failed Tests:\n');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.testName}`);
          console.log(`    Duration: ${r.duration.toFixed(2)}ms (target: ${r.target}ms)`);
          console.log(`    Description: ${r.description}\n`);
        });
    }
    
    console.log('✅ Performance Summary:\n');
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    const maxDuration = Math.max(...this.results.map(r => r.duration));
    const minDuration = Math.min(...this.results.map(r => r.duration));
    
    console.log(`  Average Query Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Fastest Query: ${minDuration.toFixed(2)}ms`);
    console.log(`  Slowest Query: ${maxDuration.toFixed(2)}ms\n`);
    
    if (passRate === 100) {
      console.log('🎉 All performance targets met!\n');
    } else if (passRate >= 80) {
      console.log('⚠️  Most performance targets met, but some optimizations needed.\n');
    } else {
      console.log('❌ Performance targets not met. Optimization required.\n');
    }
    
    console.log('='.repeat(80) + '\n');
  }

  async run() {
    try {
      await this.initialize();
      
      await this.validateMeterListPerformance();
      await this.validateTelemetryPerformance();
      await this.validateDashboardPerformance();
      await this.validateDatabaseFunctions();
      await this.validatePagination();
      
      this.generateReport();
      
      // Exit with appropriate code
      const allPassed = this.results.every(r => r.passed);
      process.exit(allPassed ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Performance validation failed:', error);
      process.exit(1);
    }
  }
}

// Run validation
const validator = new PerformanceValidator();
validator.run();
