/**
 * Quick FS1 Seed Script
 * 
 * This script seeds minimal FS1 data directly via Supabase client
 * to get the pages working quickly
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // service_role key

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Quick FS1 Data Seeding');
console.log('='.repeat(80));

async function main() {
  try {
    // Get an asset to work with
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .limit(1);
    
    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) {
      console.log('No assets found. Please run the base seeds first.');
      return;
    }
    
    const asset = assets[0];
    console.log(`\nUsing asset: ${asset.name} (${asset.id})`);
    
    // Create a telemetry parameter
    console.log('\nCreating telemetry parameters...');
    
    // First check if it exists
    let { data: existingParam } = await supabase
      .from('telemetry_parameters')
      .select('*')
      .eq('name', 'top_oil_temp')
      .eq('parameter_type', 'temperature')
      .maybeSingle();
    
    let param;
    if (!existingParam) {
      const { data: newParam, error: paramError } = await supabase
        .from('telemetry_parameters')
        .insert({
          name: 'top_oil_temp',
          parameter_type: 'temperature',
          unit: '°C',
          description: 'Top oil temperature',
          parameter_role: 'health_driver',
          warning_min: null,
          warning_max: 90,
          critical_min: null,
          critical_max: 100
        })
        .select()
        .single();
      
      if (paramError) {
        console.log(`Parameter creation: ${paramError.message}`);
        return;
      }
      param = newParam;
      console.log(`✓ Created parameter: ${param.name}`);
    } else {
      param = existingParam;
      console.log(`✓ Parameter already exists: ${param.name}`);
    }
    
    const paramId = param.id;
    
    // Create telemetry data for the last 7 days
    console.log('\nCreating telemetry data...');
    const telemetryData = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(timestamp.getHours() - hour);
        
        telemetryData.push({
          timestamp: timestamp.toISOString(),
          asset_id: asset.id,
          parameter_id: paramId,
          value: 70 + Math.random() * 20,
          unit: '°C',
          quality_score: 95 + Math.random() * 5
        });
      }
    }
    
    const { error: telemetryError } = await supabase
      .from('telemetry_data')
      .insert(telemetryData);
    
    if (telemetryError) {
      console.log(`Telemetry creation: ${telemetryError.message}`);
    } else {
      console.log(`✓ Created ${telemetryData.length} telemetry readings`);
    }
    
    // Create a health score
    console.log('\nCreating health score...');
    const { error: healthError } = await supabase
      .from('health_scores')
      .insert({
        asset_id: asset.id,
        score: 85,
        computed_at: new Date().toISOString(),
        model_version: 'v1.0',
        component_breakdown: {
          [paramId]: 85
        }
      });
    
    if (healthError) {
      console.log(`Health score creation: ${healthError.message}`);
    } else {
      console.log(`✓ Created health score`);
    }
    
    // Create a diagnostic event
    console.log('\nCreating diagnostic event...');
    const { error: eventError } = await supabase
      .from('diagnostic_events')
      .insert({
        asset_id: asset.id,
        event_type: 'thermal',
        title: 'Elevated Temperature Detected',
        description: 'Top oil temperature approaching warning threshold',
        confidence: 85,
        detected_at: new Date().toISOString(),
        state: 'open'
      });
    
    if (eventError) {
      console.log(`Diagnostic event creation: ${eventError.message}`);
    } else {
      console.log(`✓ Created diagnostic event`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✓ Quick seed completed successfully!');
    console.log('\nNext Steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to /monitor/health-diagnostics');
    console.log(`  3. Select asset: ${asset.name}`);
    console.log('  4. You should now see telemetry data!\n');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
