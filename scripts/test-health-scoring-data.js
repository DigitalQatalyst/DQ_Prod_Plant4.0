#!/usr/bin/env node

/**
 * Test Health Scoring Data Flow
 * 
 * This script simulates what the HealthScoring page does:
 * 1. Fetch assets from Supabase
 * 2. Select an asset
 * 3. Fetch health score for that asset
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🧪 Testing Health Scoring Data Flow\n');

  // Step 1: Fetch assets (like useAssets hook)
  console.log('Step 1: Fetching assets...');
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      status,
      asset_types(name)
    `)
    .eq('status', 'online')
    .limit(10);

  if (assetsError) {
    console.error('❌ Error fetching assets:', assetsError);
    return;
  }

  console.log(`✅ Found ${assets.length} assets\n`);

  // Step 2: Select first transformer
  const transformer = assets.find(a => a.asset_types.name === 'Power Transformer');
  
  if (!transformer) {
    console.log('⚠️  No transformer found');
    return;
  }

  console.log(`Step 2: Selected asset: ${transformer.name}`);
  console.log(`  ID: ${transformer.id}\n`);

  // Step 3: Fetch health score (like useHealthScore hook)
  console.log('Step 3: Fetching health score...');
  const { data: healthScore, error: healthError } = await supabase
    .from('health_scores')
    .select('*')
    .eq('asset_id', transformer.id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (healthError) {
    console.error('❌ Error fetching health score:', healthError);
    return;
  }

  if (!healthScore) {
    console.log('❌ No health score found for this asset');
    console.log('   This is the problem! The page shows "No health score data available"');
    return;
  }

  console.log(`✅ Health Score: ${healthScore.score}/100`);
  console.log(`   Computed at: ${healthScore.computed_at}`);
  console.log(`   Model version: ${healthScore.model_version}`);
  console.log(`   Component breakdown:`, healthScore.component_breakdown);

  console.log('\n✅ Data flow is working correctly!');
  console.log('   The page should now display health scores.');
}

main();
