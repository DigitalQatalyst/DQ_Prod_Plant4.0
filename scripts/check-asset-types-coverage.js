#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking Asset Type Coverage\n');

  // Get all online assets
  const { data: assets } = await supabase
    .from('assets')
    .select('asset_types(name)')
    .eq('status', 'online');

  const assetTypeCounts = {};
  assets.forEach(a => {
    const type = a.asset_types?.name;
    if (type) {
      assetTypeCounts[type] = (assetTypeCounts[type] || 0) + 1;
    }
  });

  console.log('Asset types with online assets:');
  Object.entries(assetTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} assets`);
    });

  // Get asset types with parameters
  const { data: paramMappings } = await supabase
    .from('asset_parameter_map')
    .select('asset_type');

  const typesWithParams = [...new Set(paramMappings?.map(m => m.asset_type) || [])];

  console.log('\nAsset types with parameters mapped:');
  typesWithParams.forEach(type => {
    console.log(`  ${type}`);
  });

  console.log('\nAsset types WITHOUT parameters:');
  Object.keys(assetTypeCounts).forEach(type => {
    if (!typesWithParams.includes(type)) {
      console.log(`  ❌ ${type} (${assetTypeCounts[type]} assets)`);
    }
  });

  console.log('\nAsset types WITH parameters:');
  Object.keys(assetTypeCounts).forEach(type => {
    if (typesWithParams.includes(type)) {
      console.log(`  ✅ ${type} (${assetTypeCounts[type]} assets)`);
    }
  });
}

main();
