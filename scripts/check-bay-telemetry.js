#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking Switchgear Bay assets and telemetry\n');

  // Get all bay assets
  const { data: bays, error: bayError } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      status,
      asset_types(name)
    `)
    .eq('asset_types.name', 'Switchgear Bay');

  if (bayError) {
    console.error('Error:', bayError);
    return;
  }

  console.log(`Found ${bays?.length || 0} Switchgear Bay assets:`);
  
  for (const bay of bays || []) {
    console.log(`\n  ${bay.name} (${bay.status})`);
    
    // Check for telemetry
    const { data: telemetry, error: telError } = await supabase
      .from('telemetry_data')
      .select('parameter_id, value, timestamp')
      .eq('asset_id', bay.id)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (telemetry && telemetry.length > 0) {
      console.log(`    Has ${telemetry.length} telemetry records`);
    } else {
      console.log(`    No telemetry data`);
    }
  }

  // Check what parameters are available for bays
  console.log('\n\nChecking asset_parameter_map for switchgear_bay...');
  const { data: paramMap, error: paramError } = await supabase
    .from('asset_parameter_map')
    .select(`
      asset_type,
      telemetry_parameters(name, parameter_type)
    `)
    .eq('asset_type', 'switchgear_bay');

  if (paramMap && paramMap.length > 0) {
    console.log('Parameters mapped to switchgear_bay:');
    paramMap.forEach(p => {
      console.log(`  - ${p.telemetry_parameters.name} (${p.telemetry_parameters.parameter_type})`);
    });
  } else {
    console.log('No parameters mapped to switchgear_bay');
  }
}

main();
