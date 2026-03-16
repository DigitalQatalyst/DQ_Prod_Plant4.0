#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Adding parameter mappings for Switchgear Bay assets\n');

  // First, let's see what parameters are being used by Switchgear Bay assets
  const { data: bayAssets } = await supabase
    .from('assets')
    .select('id, name, asset_types(name)')
    .eq('asset_types.name', 'Switchgear Bay')
    .limit(1);

  if (!bayAssets || bayAssets.length === 0) {
    console.log('No Switchgear Bay assets found');
    return;
  }

  const bayAsset = bayAssets[0];
  console.log(`Found Switchgear Bay asset: ${bayAsset.name}`);

  // Get telemetry parameters used by this asset
  const { data: telemetry } = await supabase
    .from('telemetry_data')
    .select('parameter_id')
    .eq('asset_id', bayAsset.id)
    .limit(100);

  const uniqueParamIds = [...new Set(telemetry?.map(t => t.parameter_id) || [])];
  console.log(`\nFound ${uniqueParamIds.length} unique parameters in telemetry data`);

  // Get parameter details
  const { data: parameters } = await supabase
    .from('telemetry_parameters')
    .select('*')
    .in('id', uniqueParamIds);

  console.log('\nParameters used by Switchgear Bay:');
  parameters?.forEach((param, i) => {
    console.log(`  ${i + 1}. ${param.name} (${param.unit}) - ${param.parameter_type}`);
  });

  // Add mappings
  console.log('\nAdding parameter mappings...');
  
  const mappings = parameters?.map(param => ({
    asset_type: 'Switchgear Bay',
    parameter_id: param.id,
    is_required: true,
    display_order: parameters.indexOf(param) + 1
  })) || [];

  const { data: inserted, error } = await supabase
    .from('asset_parameter_map')
    .upsert(mappings, {
      onConflict: 'asset_type,parameter_id',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Added ${inserted?.length || 0} parameter mappings for Switchgear Bay`);

  // Verify
  const { data: verification } = await supabase
    .from('asset_parameter_map')
    .select('parameter_id, telemetry_parameters(name)')
    .eq('asset_type', 'Switchgear Bay');

  console.log('\nVerification - Switchgear Bay now has these parameters:');
  verification?.forEach((mapping, i) => {
    const param = mapping.telemetry_parameters;
    console.log(`  ${i + 1}. ${param.name}`);
  });

  console.log('\n✅ Done! Switchgear Bay assets should now show parameters in the Degradation Trends page.');
}

main();
