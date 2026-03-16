/**
 * Quick FS3 Seed Script
 * 
 * This script seeds minimal FS3 data directly via Supabase client
 * to get the performance & utilisation pages working quickly
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // service_role key

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Quick FS3 Data Seeding');
console.log('Feature Set 3: Asset Performance & Utilisation');
console.log('='.repeat(80));

async function main() {
  try {
    // Get assets to work with
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .limit(5);
    
    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) {
      console.log('No assets found. Please run the base seeds first.');
      return;
    }
    
    console.log(`\nFound ${assets.length} assets to seed data for`);
    
    // Create downtime events
    console.log('\nCreating downtime events...');
    const downtimeEvents = [];
    const now = new Date();
    
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      // Create 2-3 downtime events per asset
      for (let j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - (j * 10 + Math.floor(Math.random() * 5)));
        
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2 + Math.floor(Math.random() * 6));
        
        const durationMinutes = Math.floor((endTime - startTime) / 60000);
        
        const eventTypes = ['planned_maintenance', 'unplanned_failure', 'forced_outage', 'testing'];
        const outageScopes = ['bay', 'line', 'transformer', 'substation'];
        
        downtimeEvents.push({
          asset_id: asset.id,
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          grid_impact_mw: Math.random() * 100,
          protection_trip_code: j % 2 === 0 ? `TRIP-${Math.floor(Math.random() * 1000)}` : null,
          outage_scope: outageScopes[Math.floor(Math.random() * outageScopes.length)],
          description: `Downtime event ${j + 1} for ${asset.name}`
        });
      }
    }
    
    const { error: downtimeError } = await supabase
      .from('downtime_events')
      .insert(downtimeEvents);
    
    if (downtimeError) {
      console.log(`Downtime events creation: ${downtimeError.message}`);
    } else {
      console.log(`✓ Created ${downtimeEvents.length} downtime events`);
    }
    
    // Create reliability metrics
    console.log('\nCreating reliability metrics...');
    const reliabilityMetrics = [];
    
    for (const asset of assets) {
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 30);
      
      reliabilityMetrics.push({
        asset_id: asset.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        mtbf_hours: 500 + Math.random() * 500,
        mttr_hours: 2 + Math.random() * 6,
        availability_percent: 95 + Math.random() * 4,
        failure_count: Math.floor(Math.random() * 5),
        total_downtime_minutes: Math.floor(Math.random() * 500),
        computed_at: new Date().toISOString()
      });
    }
    
    const { error: reliabilityError } = await supabase
      .from('reliability_metrics')
      .insert(reliabilityMetrics);
    
    if (reliabilityError) {
      console.log(`Reliability metrics creation: ${reliabilityError.message}`);
    } else {
      console.log(`✓ Created ${reliabilityMetrics.length} reliability metric records`);
    }
    
    // Create utilisation metrics
    console.log('\nCreating utilisation metrics...');
    const utilisationMetrics = [];
    
    for (const asset of assets) {
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 7);
      
      utilisationMetrics.push({
        asset_id: asset.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        load_factor: 60 + Math.random() * 30,
        peak_current: 100 + Math.random() * 200,
        thermal_headroom: 10 + Math.random() * 30,
        switching_cycles: Math.floor(Math.random() * 100),
        computed_at: new Date().toISOString()
      });
    }
    
    const { error: utilisationError } = await supabase
      .from('utilisation_metrics')
      .insert(utilisationMetrics);
    
    if (utilisationError) {
      console.log(`Utilisation metrics creation: ${utilisationError.message}`);
    } else {
      console.log(`✓ Created ${utilisationMetrics.length} utilisation metric records`);
    }
    
    // Create performance benchmarks
    console.log('\nCreating performance benchmarks...');
    const assetTypes = ['power_transformer', 'circuit_breaker', 'transmission_line'];
    const benchmarks = [];
    
    for (const assetType of assetTypes) {
      benchmarks.push({
        asset_type: assetType,
        sector: 'power_transmission',
        availability_target: 98 + Math.random() * 1.5,
        load_factor_target: 70 + Math.random() * 10,
        mtbf_target: 8000 + Math.random() * 2000,
        created_at: new Date().toISOString()
      });
    }
    
    const { error: benchmarkError } = await supabase
      .from('performance_benchmarks')
      .insert(benchmarks);
    
    if (benchmarkError) {
      console.log(`Performance benchmarks creation: ${benchmarkError.message}`);
    } else {
      console.log(`✓ Created ${benchmarks.length} performance benchmarks`);
    }
    
    // Create performance deviations
    console.log('\nCreating performance deviations...');
    const deviations = [];
    
    for (let i = 0; i < Math.min(3, assets.length); i++) {
      const asset = assets[i];
      const detectedAt = new Date();
      detectedAt.setDate(detectedAt.getDate() - Math.floor(Math.random() * 7));
      
      const windowStart = new Date(detectedAt);
      windowStart.setHours(windowStart.getHours() - 24);
      
      deviations.push({
        asset_id: asset.id,
        deviation_type: 'availability_below_target',
        magnitude: 5 + Math.random() * 10,
        detected_at: detectedAt.toISOString(),
        telemetry_window_start: windowStart.toISOString(),
        telemetry_window_end: detectedAt.toISOString(),
        benchmark_reference: benchmarks[0]?.id || null,
        created_at: new Date().toISOString()
      });
    }
    
    const { error: deviationError } = await supabase
      .from('performance_deviations')
      .insert(deviations);
    
    if (deviationError) {
      console.log(`Performance deviations creation: ${deviationError.message}`);
    } else {
      console.log(`✓ Created ${deviations.length} performance deviation records`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✓ Quick FS3 seed completed successfully!');
    console.log('\nNext Steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to /monitor/performance-utilisation');
    console.log('  3. You should now see downtime events, reliability metrics, and utilisation data!\n');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
