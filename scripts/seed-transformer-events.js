/**
 * Seed Diagnostic Events for Transformer Assets
 * 
 * This script creates diagnostic events for transformer assets shown in the UI
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // service_role key

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Seeding Diagnostic Events for Transformers');
console.log('='.repeat(80));

async function main() {
  try {
    // Get transformer assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .ilike('name', '%transformer%');
    
    if (assetsError) throw assetsError;
    
    if (!assets || assets.length === 0) {
      console.log('No transformer assets found.');
      return;
    }
    
    console.log(`\nFound ${assets.length} transformer assets:`);
    assets.forEach(asset => {
      console.log(`  - ${asset.name} (${asset.id})`);
    });
    
    // Create diagnostic events for each transformer
    const events = [];
    const now = new Date();
    
    for (const asset of assets) {
      // Create 2-3 events per transformer with different states
      
      // Event 1: Open thermal event
      events.push({
        asset_id: asset.id,
        event_type: 'thermal',
        title: 'Elevated Temperature Detected',
        description: 'Top oil temperature approaching warning threshold during peak load',
        confidence: 85,
        detected_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        state: 'open',
        telemetry_window_start: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
        telemetry_window_end: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      // Event 2: Acknowledged insulation event
      events.push({
        asset_id: asset.id,
        event_type: 'insulation',
        title: 'DGA Analysis Shows Elevated Acetylene',
        description: 'Dissolved gas analysis indicates potential partial discharge activity',
        confidence: 78,
        detected_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        state: 'ack',
        acknowledged_by: 'operator@example.com',
        acknowledged_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        telemetry_window_start: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000).toISOString(),
        telemetry_window_end: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      // Event 3: Closed electrical event (only for first transformer)
      if (assets.indexOf(asset) === 0) {
        events.push({
          asset_id: asset.id,
          event_type: 'electrical',
          title: 'Bushing Power Factor Deviation',
          description: 'Bushing C1 power factor test results outside acceptable range',
          confidence: 92,
          detected_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          state: 'closed',
          acknowledged_by: 'engineer@example.com',
          acknowledged_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          closed_by: 'engineer@example.com',
          closed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          resolution_notes: 'Bushing replaced during scheduled maintenance. Post-maintenance testing shows normal power factor values.',
          telemetry_window_start: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000).toISOString(),
          telemetry_window_end: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      // Event 4: Open vibration event (mechanical)
      if (assets.indexOf(asset) < 2) {
        events.push({
          asset_id: asset.id,
          event_type: 'mechanical',
          title: 'Abnormal Vibration Pattern',
          description: 'Core vibration levels elevated, possible loose core clamping',
          confidence: 72,
          detected_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          state: 'open',
          telemetry_window_start: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
          telemetry_window_end: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    console.log(`\nCreating ${events.length} diagnostic events...`);
    
    const { error: eventsError } = await supabase
      .from('diagnostic_events')
      .insert(events);
    
    if (eventsError) {
      console.log(`✗ Error creating events: ${eventsError.message}`);
      throw eventsError;
    }
    
    console.log(`✓ Created ${events.length} diagnostic events`);
    
    // Summary by asset
    console.log('\nEvents created per asset:');
    for (const asset of assets) {
      const assetEvents = events.filter(e => e.asset_id === asset.id);
      console.log(`  ${asset.name}: ${assetEvents.length} events`);
      assetEvents.forEach(e => {
        console.log(`    - ${e.title} (${e.state})`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✓ Seed completed successfully!');
    console.log('\nNext Steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to /monitor/anomaly-detection');
    console.log('  3. Select a transformer asset');
    console.log('  4. You should now see diagnostic events!\n');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
