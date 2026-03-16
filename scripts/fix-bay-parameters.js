#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Fixing parameter mappings for Bay assets\n');

  const bayAssetName = 'Al Aweer 220kV Bay 1';

  // Get the specific bay asset
  const { data: bayAsset } = await supabase
    .from('assets')
    .select('id, name, asset_types(name)')
    .eq('name', bayAssetName)
    .single();

  if (!bayAsset) {
    console.log('Asset not found');
    return;
  }

  console.log(`Asset: ${bayAsset.name}`);
  console.log(`Type: ${bayAsset.asset_types.name}`);
  console.log(`ID: ${bayAsset.id}\n`);

  // Get telemetry parameters used by this asset
  const { data: telemetry } = await supabase
    .from('telemetry_data')
    .select('parameter_id')
    .eq('asset_id', bayAsset.id);

  const uniqueParamIds = [...new Set(telemetry?.map(t => t.parameter_id) || [])];
  console.log(`Found ${uniqueParamIds.length} unique parameters in telemetry data\n`);

  if (uniqueParamIds.length === 0) {
    console.log('No telemetry data found for this asset');
    return;
  }

  // Get parameter details
  const { data: parameters } = await supabase
    .from('telemetry_parameters')
    .select('*')
    .in('id', uniqueParamIds);

  console.log('Parameters used by this asset:');
  parameters?.forEach((param, i) => {
    console.log(`  ${i + 1}. ${param.name} (${param.unit}) - ${param.parameter_type}`);
  });

  // Add mappings for Switchgear Bay
  console.log('\nAdding parameter mappings for Switchgear Bay...');
  
  const mappings = parameters?.map((param) => ({
    asset_type: 'Switchgear Bay',
    parameter_id: param.id,
    is_required: true,
    sampling_interval_seconds: 300 // 5 minutes
  })) || [];

  for (const mapping of mappings) {
    const { error } = await supabase
      .from('asset_parameter_map')
      .upsert(mapping, {
        onConflict: 'asset_type,parameter_id'
      });

    if (error) {
      console.error(`  ❌ Error adding ${mapping.parameter_id}:`, error.message);
    } else {
      const param = parameters.find(p => p.id === mapping.parameter_id);
      console.log(`  ✅ Added ${param?.name}`);
    }
  }

  // Verify
  console.log('\nVerifying...');
  const { data: verification } = await supabase
    .from('asset_parameter_map')
    .select(`
      parameter_id,
      telemetry_parameters (
        id,
        name,
        unit
      )
    `)
    .eq('asset_type', 'Switchgear Bay');

  console.log(`\nSwitchgear Bay now has ${verification?.length || 0} parameters mapped:`);
  verification?.forEach((mapping, i) => {
    const param = mapping.telemetry_parameters;
    console.log(`  ${i + 1}. ${param.name} (${param.unit})`);
  });

  console.log('\n✅ Done! Refresh the Degradation Trends page to see the parameters.');
}

main();
