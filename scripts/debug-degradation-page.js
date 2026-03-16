#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAssetSelection() {
  console.log('🔍 Debugging Asset Selection Flow\n');

  // Step 1: Fetch assets like useAssets hook does
  console.log('Step 1: Fetching assets (simulating useAssets hook)...');
  const { data: rawAssets, error: assetsError } = await supabase
    .from('assets')
    .select('*, asset_types(name)')
    .eq('status', 'online')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (assetsError) {
    console.error('❌ Error:', assetsError);
    return;
  }

  console.log(`✅ Found ${rawAssets.length} assets`);
  
  // Map assets like the hook does
  const assets = rawAssets.map(asset => ({
    ...asset,
    asset_type: asset.asset_types?.name || 'Unknown',
    operational_status: asset.status,
  }));

  assets.forEach((asset, i) => {
    console.log(`   ${i + 1}. ${asset.name} (${asset.asset_type})`);
  });

  // Step 2: Select first asset
  const selectedAsset = assets[0];
  console.log(`\n✅ Selected asset: ${selectedAsset.name}`);
  console.log(`   ID: ${selectedAsset.id}`);
  console.log(`   Type: ${selectedAsset.asset_type}`);

  // Step 3: Fetch parameters for selected asset
  console.log('\nStep 3: Fetching parameters...');
  
  const { data: assetData, error: assetError } = await supabase
    .from('assets')
    .select('asset_types(name)')
    .eq('id', selectedAsset.id)
    .single();

  if (assetError) {
    console.error('❌ Error fetching asset type:', assetError);
    return;
  }

  const assetTypeName = assetData.asset_types?.name;
  console.log(`✅ Asset type from query: ${assetTypeName}`);

  if (!assetTypeName) {
    console.error('❌ Asset type is null!');
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
    ?.map(m => m.telemetry_parameters)
    .filter(Boolean) || [];

  console.log(`✅ Found ${params.length} parameters`);
  
  if (params.length === 0) {
    console.error('❌ No parameters found!');
    console.log('\nDebugging info:');
    console.log(`   Asset type name: "${assetTypeName}"`);
    console.log(`   Checking asset_parameter_map...`);
    
    const { data: allMappings } = await supabase
      .from('asset_parameter_map')
      .select('asset_type')
      .limit(10);
    
    console.log('   Available asset types in map:');
    const uniqueTypes = [...new Set(allMappings?.map(m => m.asset_type) || [])];
    uniqueTypes.forEach(type => console.log(`     - "${type}"`));
    
    return;
  }

  params.forEach((param, i) => {
    console.log(`   ${i + 1}. ${param.name} (${param.unit})`);
  });

  // Step 4: Auto-select first parameter
  const selectedParameter = params[0];
  console.log(`\n✅ Auto-selected parameter: ${selectedParameter.name}`);

  // Step 5: Fetch telemetry data
  console.log('\nStep 5: Fetching telemetry data...');
  
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const { data: telemetryData, error: telemetryError } = await supabase
    .from('telemetry_data')
    .select('timestamp, value')
    .eq('asset_id', selectedAsset.id)
    .eq('parameter_id', selectedParameter.id)
    .gte('timestamp', from.toISOString())
    .lte('timestamp', to.toISOString())
    .order('timestamp', { ascending: true });

  if (telemetryError) {
    console.error('❌ Error fetching telemetry:', telemetryError);
    return;
  }

  console.log(`✅ Found ${telemetryData?.length || 0} telemetry points`);
  
  if (telemetryData && telemetryData.length > 0) {
    console.log(`   First: ${telemetryData[0].value} at ${telemetryData[0].timestamp}`);
    console.log(`   Last: ${telemetryData[telemetryData.length - 1].value} at ${telemetryData[telemetryData.length - 1].timestamp}`);
  }

  console.log('\n✅ All steps completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Assets loaded: ${assets.length}`);
  console.log(`   Selected asset: ${selectedAsset.name}`);
  console.log(`   Parameters available: ${params.length}`);
  console.log(`   Selected parameter: ${selectedParameter.name}`);
  console.log(`   Telemetry points: ${telemetryData?.length || 0}`);
  console.log('\n✅ The page should display data correctly!');
}

debugAssetSelection();
