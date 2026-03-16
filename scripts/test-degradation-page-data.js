#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const assetName = 'Al Aweer T1 Main Transformer';
  console.log(`🧪 Testing Degradation Trends page data flow for "${assetName}"\n`);

  // Step 1: Fetch asset (simulating useAssets hook)
  console.log('Step 1: Fetching asset...');
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('*, asset_types(name)')
    .eq('name', assetName)
    .limit(1);

  if (assetsError) {
    console.error('❌ Error fetching assets:', assetsError);
    return;
  }

  if (!assets || assets.length === 0) {
    console.error('❌ Asset not found');
    return;
  }

  const asset = assets[0];
  console.log('✅ Asset fetched:', asset.name);
  console.log('   Asset Type (raw):', asset.asset_types);
  
  // Map the asset like useAssets does
  const mappedAsset = {
    ...asset,
    asset_type: asset.asset_types?.name || 'Unknown',
    operational_status: asset.status,
  };
  console.log('   Asset Type (mapped):', mappedAsset.asset_type);

  // Step 2: Fetch parameters (simulating DegradationTrends component)
  console.log('\nStep 2: Fetching parameters for asset type...');
  
  const { data: assetData, error: assetError } = await supabase
    .from('assets')
    .select('asset_types(name)')
    .eq('id', asset.id)
    .single();

  if (assetError) {
    console.error('❌ Error fetching asset type:', assetError);
    return;
  }

  const assetTypeName = assetData.asset_types?.name;
  console.log('✅ Asset type name:', assetTypeName);

  if (!assetTypeName) {
    console.error('❌ Asset type not found');
    return;
  }

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
    console.error('❌ Error fetching parameters:', paramError);
    return;
  }

  const params = paramMappings
    ?.map((m) => m.telemetry_parameters)
    .filter(Boolean) || [];

  console.log(`✅ Found ${params.length} parameters:`);
  params.forEach((param, index) => {
    console.log(`   ${index + 1}. ${param.name} (${param.unit})`);
  });

  if (params.length === 0) {
    console.error('\n❌ No parameters available - this is the issue!');
    return;
  }

  // Step 3: Fetch telemetry data for first parameter
  console.log('\nStep 3: Fetching telemetry data for first parameter...');
  const firstParam = params[0];
  
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const { data: telemetryData, error: telemetryError } = await supabase
    .from('telemetry_data')
    .select('timestamp, value, parameter_id')
    .eq('asset_id', asset.id)
    .eq('parameter_id', firstParam.id)
    .gte('timestamp', from.toISOString())
    .lte('timestamp', to.toISOString())
    .order('timestamp', { ascending: true });

  if (telemetryError) {
    console.error('❌ Error fetching telemetry:', telemetryError);
    return;
  }

  console.log(`✅ Found ${telemetryData?.length || 0} telemetry readings for ${firstParam.name}`);
  
  if (telemetryData && telemetryData.length > 0) {
    console.log(`   Latest value: ${telemetryData[telemetryData.length - 1].value} ${firstParam.unit}`);
    console.log(`   Oldest value: ${telemetryData[0].value} ${firstParam.unit}`);
  }

  console.log('\n✅ All data flows working correctly!');
  console.log('\n📊 Summary:');
  console.log(`   - Asset: ${asset.name}`);
  console.log(`   - Asset Type: ${assetTypeName}`);
  console.log(`   - Parameters: ${params.length}`);
  console.log(`   - Telemetry Points: ${telemetryData?.length || 0}`);
}

main();
