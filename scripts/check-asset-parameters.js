#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const assetName = process.argv[2] || 'Al Aweer T1 Main Transformer';
  console.log(`🔍 Checking parameters for "${assetName}"\n`);

  // Get the asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      asset_type_id,
      asset_types(name)
    `)
    .eq('name', assetName)
    .single();

  if (assetError) {
    console.error('Error fetching asset:', assetError);
    return;
  }

  console.log('Asset Details:');
  console.log(`  Name: ${asset.name}`);
  console.log(`  Asset Type (from asset_types table): ${asset.asset_types?.name || 'N/A'}`);
  console.log(`  Asset Type ID: ${asset.asset_type_id || 'N/A'}`);
  console.log(`  ID: ${asset.id}\n`);

  // Check asset_parameter_map using asset_types.name
  const assetTypeName = asset.asset_types?.name;
  
  if (assetTypeName) {
    console.log(`Checking asset_parameter_map for asset_type: "${assetTypeName}"`);
    
    const { data: paramMappings, error: paramError } = await supabase
      .from('asset_parameter_map')
      .select(`
        parameter_id,
        telemetry_parameters (
          id,
          name,
          unit,
          parameter_type,
          warning_min,
          warning_max,
          critical_min,
          critical_max
        )
      `)
      .eq('asset_type', assetTypeName);

    if (paramError) {
      console.error('Error fetching parameters:', paramError);
    } else {
      console.log(`\nFound ${paramMappings?.length || 0} parameter mappings:`);
      
      if (paramMappings && paramMappings.length > 0) {
        paramMappings.forEach((mapping, index) => {
          const param = mapping.telemetry_parameters;
          console.log(`\n${index + 1}. ${param.name}`);
          console.log(`   ID: ${param.id}`);
          console.log(`   Unit: ${param.unit}`);
          console.log(`   Type: ${param.parameter_type}`);
          console.log(`   Warning: ${param.warning_min} - ${param.warning_max}`);
          console.log(`   Critical: ${param.critical_min} - ${param.critical_max}`);
        });
      } else {
        console.log('\n⚠️  No parameters mapped for this asset type!');
        console.log('\nPossible reasons:');
        console.log('  1. asset_parameter_map table is empty');
        console.log('  2. Asset type name mismatch');
        console.log('  3. Parameters not seeded for this asset type');
      }
    }
  }

  // Check if there's any telemetry data for this asset
  console.log('\n\nChecking telemetry data...');
  const { data: telemetry, error: telError } = await supabase
    .from('telemetry_data')
    .select('parameter_id, value, timestamp')
    .eq('asset_id', asset.id)
    .order('timestamp', { ascending: false })
    .limit(5);

  if (telError) {
    console.error('Error fetching telemetry:', telError);
  } else {
    console.log(`Found ${telemetry?.length || 0} telemetry records`);
    
    if (telemetry && telemetry.length > 0) {
      console.log('\nLatest readings:');
      telemetry.forEach((reading, index) => {
        console.log(`  ${index + 1}. Parameter ID: ${reading.parameter_id}, Value: ${reading.value}, Time: ${reading.timestamp}`);
      });
    }
  }

  // Check all asset types in asset_parameter_map
  console.log('\n\nAll asset types in asset_parameter_map:');
  const { data: allMappings, error: allError } = await supabase
    .from('asset_parameter_map')
    .select('asset_type')
    .limit(100);

  if (allError) {
    console.error('Error:', allError);
  } else {
    const uniqueTypes = [...new Set(allMappings?.map(m => m.asset_type) || [])];
    console.log(uniqueTypes.join(', '));
  }
}

main();
