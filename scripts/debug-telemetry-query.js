#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('='.repeat(80));
console.log('Debug Telemetry Query (Simulating useLatestTelemetry hook)');
console.log('='.repeat(80));
console.log('');

async function main() {
  try {
    // Use Al Aweer 220kV Bay 1 as test asset
    const assetName = 'Al Aweer 220kV Incomer CB';
    
    // Step 1: Get the asset
    console.log(`Step 1: Getting asset "${assetName}"...`);
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, name, asset_type_id, asset_types(name)')
      .eq('name', assetName)
      .single();
    
    if (assetError) {
      console.error('❌ Asset query failed:', assetError);
      return;
    }
    
    console.log('✓ Asset found:', asset.id);
    console.log('  Asset type:', asset.asset_types?.name);
    console.log('');
    
    // Step 2: Get parameter mappings
    const assetTypeName = asset.asset_types?.name;
    console.log(`Step 2: Getting parameter mappings for "${assetTypeName}"...`);
    
    const { data: paramMappings, error: paramError } = await supabase
      .from('asset_parameter_map')
      .select('parameter_id, telemetry_parameters(id, name, unit, warning_min, warning_max, critical_min, critical_max)')
      .eq('asset_type', assetTypeName);
    
    if (paramError) {
      console.error('❌ Parameter mapping query failed:', paramError);
      return;
    }
    
    console.log(`✓ Found ${paramMappings?.length || 0} parameter mappings`);
    if (paramMappings && paramMappings.length > 0) {
      paramMappings.slice(0, 3).forEach(m => {
        console.log(`  - ${m.telemetry_parameters?.name}`);
      });
      if (paramMappings.length > 3) {
        console.log(`  ... and ${paramMappings.length - 3} more`);
      }
    }
    console.log('');
    
    // Step 3: Get latest telemetry for each parameter
    console.log('Step 3: Getting latest telemetry readings...');
    
    const readings = [];
    let successCount = 0;
    let emptyCount = 0;
    
    for (const mapping of paramMappings || []) {
      const param = mapping.telemetry_parameters;
      if (!param) continue;
      
      const { data: telemetryData, error: telemetryError } = await supabase
        .from('telemetry_data')
        .select('timestamp, value, unit')
        .eq('asset_id', asset.id)
        .eq('parameter_id', param.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (telemetryError) {
        console.log(`  ❌ ${param.name}: ${telemetryError.message}`);
      } else if (telemetryData) {
        successCount++;
        
        // Compute status
        let status = 'Normal';
        const value = telemetryData.value;
        
        if (param.critical_min !== null && value < param.critical_min) {
          status = 'Critical';
        } else if (param.critical_max !== null && value > param.critical_max) {
          status = 'Critical';
        } else if (param.warning_min !== null && value < param.warning_min) {
          status = 'Warning';
        } else if (param.warning_max !== null && value > param.warning_max) {
          status = 'Warning';
        }
        
        readings.push({
          parameter_id: param.id,
          parameter_name: param.name,
          value: telemetryData.value,
          unit: telemetryData.unit,
          status,
          timestamp: telemetryData.timestamp,
        });
      } else {
        emptyCount++;
      }
    }
    
    console.log(`✓ Successfully fetched ${successCount} readings`);
    if (emptyCount > 0) {
      console.log(`  ⚠ ${emptyCount} parameters have no data`);
    }
    console.log('');
    
    // Step 4: Display results
    console.log('Step 4: Results');
    console.log('-'.repeat(80));
    
    if (readings.length === 0) {
      console.log('❌ NO TELEMETRY DATA FOUND');
      console.log('');
      console.log('This is the same result the UI is getting.');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Telemetry data was not seeded for this asset');
      console.log('  2. Asset ID mismatch between assets and telemetry_data tables');
      console.log('  3. RLS policies blocking the query');
    } else {
      console.log(`✓ Found ${readings.length} telemetry readings:`);
      console.log('');
      readings.forEach(r => {
        console.log(`  ${r.parameter_name}: ${r.value} ${r.unit} [${r.status}]`);
      });
      console.log('');
      console.log('✓ This data should appear in the UI!');
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  }
}

main();
