#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Finding assets that will work in Degradation Trends page\n');

  // Get asset types with parameters
  const { data: paramMappings } = await supabase
    .from('asset_parameter_map')
    .select('asset_type');

  const typesWithParams = [...new Set(paramMappings?.map(m => m.asset_type) || [])];

  console.log('Asset types with parameters mapped:');
  typesWithParams.forEach(type => console.log(`  - ${type}`));

  console.log('\n📊 Assets that should work:\n');

  for (const assetType of typesWithParams) {
    // Get assets of this type
    const { data: assets } = await supabase
      .from('assets')
      .select('id, name, asset_types(name)')
      .eq('asset_types.name', assetType)
      .eq('status', 'online')
      .limit(5);

    if (!assets || assets.length === 0) continue;

    console.log(`\n${assetType}:`);

    for (const asset of assets) {
      // Check if asset has telemetry
      const { data: telemetry } = await supabase
        .from('telemetry_data')
        .select('parameter_id')
        .eq('asset_id', asset.id)
        .limit(1);

      const hasTelemetry = telemetry && telemetry.length > 0;
      const status = hasTelemetry ? '✅' : '⚠️ ';
      const note = hasTelemetry ? '' : ' (no telemetry data)';
      
      console.log(`  ${status} ${asset.name}${note}`);
    }
  }

  console.log('\n\n💡 Recommendation:');
  console.log('Select an asset marked with ✅ to see degradation trends.');
  console.log('Assets marked with ⚠️  have parameters mapped but no telemetry data yet.');
}

main();
