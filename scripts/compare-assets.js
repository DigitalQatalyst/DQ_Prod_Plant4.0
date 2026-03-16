#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📊 Comparing Mock Assets vs Supabase Assets\n');
  
  // Get Supabase assets
  const { data: supabaseAssets, error } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      status,
      asset_types(name)
    `)
    .eq('status', 'online')
    .limit(20);

  if (error) {
    console.error('Error fetching Supabase assets:', error);
    return;
  }

  console.log('=== SUPABASE ASSETS ===');
  supabaseAssets.forEach(asset => {
    console.log(`  - ${asset.name} (${asset.asset_types.name})`);
  });

  console.log('\n=== MOCK ASSETS (from mockData.ts) ===');
  console.log('  Check src/data/mockData.ts for the asset list');
  console.log('  The issue is that mock asset names don\'t match Supabase asset names');
}

main();
