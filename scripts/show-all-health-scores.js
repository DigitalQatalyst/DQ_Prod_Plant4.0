#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📊 All Assets with Health Scores\n');

  const { data, error } = await supabase
    .from('health_scores')
    .select(`
      score,
      computed_at,
      assets(name, status, asset_types(name))
    `)
    .order('computed_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Group by asset
  const assetScores = new Map();
  
  data.forEach(score => {
    const assetName = score.assets.name;
    if (!assetScores.has(assetName)) {
      assetScores.set(assetName, {
        name: assetName,
        type: score.assets.asset_types.name,
        status: score.assets.status,
        score: score.score,
        computed_at: score.computed_at
      });
    }
  });

  // Group by asset type
  const byType = {};
  assetScores.forEach(asset => {
    if (!byType[asset.type]) {
      byType[asset.type] = [];
    }
    byType[asset.type].push(asset);
  });

  // Display by type
  Object.keys(byType).sort().forEach(type => {
    console.log(`\n${type}:`);
    console.log('─'.repeat(60));
    
    byType[type].forEach(asset => {
      const scoreColor = asset.score >= 90 ? '🟢' : asset.score >= 70 ? '🟡' : '🔴';
      console.log(`  ${scoreColor} ${asset.name}`);
      console.log(`     Score: ${asset.score}/100 | Status: ${asset.status}`);
    });
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`Total assets with health scores: ${assetScores.size}`);
  console.log('═'.repeat(60));
}

main();
