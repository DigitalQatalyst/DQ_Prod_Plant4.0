#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('='.repeat(80));
console.log('Quick Telemetry Data Seed');
console.log('='.repeat(80));
console.log('');

async function main() {
  try {
    // Get assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name, asset_type_id, asset_types(name)')
      .in('status', ['online', 'standby']);
    
    if (assetsError) throw assetsError;
    
    console.log(`Found ${assets.length} assets to seed telemetry for\n`);
    
    // Get telemetry parameters
    const { data: parameters, error: paramsError } = await supabase
      .from('telemetry_parameters')
      .select('*');
    
    if (paramsError) throw paramsError;
    
    console.log(`Found ${parameters.length} telemetry parameters\n`);
    
    // Create a map of parameter names to IDs
    const paramMap = {};
    parameters.forEach(p => {
      paramMap[p.name] = p;
    });
    
    let totalInserted = 0;
    
    // For each asset, insert telemetry data for the last 7 days
    for (const asset of assets) {
      const assetTypeName = asset.asset_types?.name;
      console.log(`Seeding telemetry for ${asset.name} (${assetTypeName})...`);
      
      // Get parameter mappings for this asset type
      const { data: mappings, error: mappingsError } = await supabase
        .from('asset_parameter_map')
        .select('parameter_id, telemetry_parameters(name)')
        .eq('asset_type', assetTypeName);
      
      if (mappingsError) {
        console.log(`  ⚠ No parameter mappings found for ${assetTypeName}`);
        continue;
      }
      
      if (!mappings || mappings.length === 0) {
        console.log(`  ⚠ No parameters mapped for ${assetTypeName}`);
        continue;
      }
      
      const telemetryData = [];
      
      // Generate telemetry for last 7 days, hourly
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        for (let hourOffset = 0; hourOffset < 24; hourOffset++) {
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - dayOffset);
          timestamp.setHours(timestamp.getHours() - hourOffset);
          timestamp.setMinutes(0);
          timestamp.setSeconds(0);
          timestamp.setMilliseconds(0);
          
          // For each mapped parameter, generate a reading
          for (const mapping of mappings) {
            const paramName = mapping.telemetry_parameters?.name;
            const param = paramMap[paramName];
            
            if (!param) continue;
            
            // Generate realistic values based on parameter type
            let value;
            switch (param.parameter_type) {
              case 'temperature':
                value = 60 + Math.random() * 30; // 60-90°C
                break;
              case 'current':
                value = 500 + Math.random() * 500; // 500-1000A
                break;
              case 'pressure':
                value = 5 + Math.random() * 1; // 5-6 bar
                break;
              case 'percentage':
                value = 40 + Math.random() * 30; // 40-70%
                break;
              case 'concentration':
                value = 50 + Math.random() * 50; // 50-100 ppm
                break;
              case 'count':
                value = Math.floor(1000 + dayOffset * 10); // incrementing count
                break;
              case 'speed':
                value = 2 + Math.random() * 8; // 2-10 m/s
                break;
              case 'distance':
                value = 5 + Math.random() * 3; // 5-8 m
                break;
              case 'acceleration':
                value = 3 + Math.random() * 4; // 3-7 mm/s
                break;
              case 'voltage':
                value = 110 + Math.random() * 20; // 110-130V
                break;
              case 'time':
                value = 10 + Math.random() * 20; // 10-30 ms
                break;
              case 'status':
                value = Math.random() > 0.1 ? 1 : 0; // mostly 1 (OK)
                break;
              default:
                value = 50 + Math.random() * 50;
            }
            
            telemetryData.push({
              timestamp: timestamp.toISOString(),
              asset_id: asset.id,
              parameter_id: param.id,
              value: Math.round(value * 100) / 100,
              unit: param.unit,
              quality_score: 95 + Math.random() * 5
            });
          }
        }
      }
      
      // Insert in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < telemetryData.length; i += batchSize) {
        const batch = telemetryData.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('telemetry_data')
          .insert(batch);
        
        if (insertError) {
          console.log(`  ✗ Error inserting batch: ${insertError.message}`);
        } else {
          totalInserted += batch.length;
        }
      }
      
      console.log(`  ✓ Inserted ${telemetryData.length} telemetry readings`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✓ Successfully inserted ${totalInserted} telemetry readings`);
    console.log('='.repeat(80));
    console.log('\nNext steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to /monitor/condition-monitoring');
    console.log('  3. Select an asset to view telemetry data\n');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
