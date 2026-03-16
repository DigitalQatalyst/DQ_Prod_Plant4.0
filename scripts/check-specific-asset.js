#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking "Al Aweer 220kV Bay 1" asset\n');

  // Get the specific asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      status,
      asset_type_id,
      asset_types(name)
    `)
    .eq('name', 'Al Aweer 220kV Bay 1')
    .single();

  if (assetError) {
    console.error('Error:', assetError);
    return;
  }

  console.log('Asset Details:');
  console.log(`  Name: ${asset.name}`);
  console.log(`  Status: ${asset.status}`);
  console.log(`  Type: ${asset.asset_types.name}`);
  console.log(`  ID: ${asset.id}`);

  // Check for telemetry
  const { data: telemetry, error: telError } = await supabase
    .from('telemetry_data')
    .select('parameter_id, value, timestamp')
    .eq('asset_id', asset.id)
    .order('timestamp', { ascending: false })
    .limit(5);

  console.log(`\nTelemetry: ${telemetry?.length || 0} records`);

  // Check for health score
  const { data: healthScore, error: healthError } = await supabase
    .from('health_scores')
    .select('*')
    .eq('asset_id', asset.id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (healthScore) {
    console.log(`\nHealth Score: ${healthScore.score}/100`);
  } else {
    console.log('\nNo health score found');
    console.log('\nReasons:');
    console.log(`  1. Asset status is "${asset.status}" (should be "online")`);
    console.log(`  2. No telemetry data available`);
    console.log(`  3. Asset type "${asset.asset_types.name}" may not have a health model`);
  }
}

main();
