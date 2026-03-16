#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Adding parameter mappings for Energy Meter assets\n');

  // Get an Energy Meter asset
  const { data: meterAssets } = await supabase
    .from('assets')
    .select('id, name, asset_types(name)')
    .eq('asset_types.name', 'Energy Meter')
    .limit(1);

  if (!meterAssets || meterAssets.length === 0) {
    console.log('No Energy Meter assets found');
    return;
  }

  const meterAsset = meterAssets[0];
  console.log(`Asset: ${meterAsset.name}`);
  console.log(`Type: ${meterAsset.asset_types.name}`);
  console.log(`ID: ${meterAsset.id}\n`);

  // Get telemetry parameters used by this asset
  const { data: telemetry } = await supabase
    .from('telemetry_data')
    .select('parameter_id')
    .eq('asset_id', meterAsset.id);

  const uniqueParamIds = [...new Set(telemetry?.map(t => t.parameter_id) || [])];
  console.log(`Found ${uniqueParamIds.length} unique parameters in telemetry data\n`);

  if (uniqueParamIds.length === 0) {
    console.log('No telemetry data found for this asset');
    console.log('Creating standard Energy Meter parameters...\n');
    
    // Create standard energy meter parameters
    const standardParams = [
      { name: 'active_power', unit: 'kW', parameter_type: 'power', warning_max: 5000, critical_max: 6000 },
      { name: 'reactive_power', unit: 'kVAR', parameter_type: 'power', warning_max: 2000, critical_max: 2500 },
      { name: 'power_factor', unit: 'pf', parameter_type: 'ratio', warning_min: 0.85, critical_min: 0.8 },
      { name: 'voltage_l1', unit: 'V', parameter_type: 'voltage', warning_min: 210, warning_max: 250, critical_min: 200, critical_max: 260 },
      { name: 'current_l1', unit: 'A', parameter_type: 'current', warning_max: 100, critical_max: 120 },
      { name: 'frequency', unit: 'Hz', parameter_type: 'frequency', warning_min: 49.5, warning_max: 50.5, critical_min: 49, critical_max: 51 },
      { name: 'energy_consumed', unit: 'kWh', parameter_type: 'energy', warning_max: null, critical_max: null },
    ];

    console.log('Standard Energy Meter parameters:');
    standardParams.forEach((param, i) => {
      console.log(`  ${i + 1}. ${param.name} (${param.unit})`);
    });

    console.log('\n⚠️  Note: These are standard parameters. Actual telemetry data may use different parameters.');
    console.log('Run this script after seeding telemetry data for Energy Meter assets.\n');
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

  // Add mappings for Energy Meter
  console.log('\nAdding parameter mappings for Energy Meter...');
  
  const mappings = parameters?.map((param) => ({
    asset_type: 'Energy Meter',
    parameter_id: param.id,
    is_required: true,
    sampling_interval_seconds: 60 // 1 minute for meters
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
    .eq('asset_type', 'Energy Meter');

  console.log(`\nEnergy Meter now has ${verification?.length || 0} parameters mapped:`);
  verification?.forEach((mapping, i) => {
    const param = mapping.telemetry_parameters;
    console.log(`  ${i + 1}. ${param.name} (${param.unit})`);
  });

  console.log('\n✅ Done! Refresh the Degradation Trends page to see the parameters.');
}

main();
