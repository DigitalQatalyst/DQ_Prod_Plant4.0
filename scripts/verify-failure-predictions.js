#!/usr/bin/env node

/**
 * Verify failure predictions data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyFailurePredictions() {
  console.log('🔍 Verifying failure predictions...\n');
  
  // Get all predictions with asset names
  const { data: predictions, error } = await supabase
    .from('failure_predictions')
    .select(`
      id,
      asset_id,
      failure_probability,
      confidence,
      time_horizon_days,
      risk_level,
      rul_days,
      assets (name)
    `)
    .order('risk_level', { ascending: false })
    .order('time_horizon_days', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${predictions.length} predictions\n`);

  // Group by asset
  const byAsset = {};
  predictions.forEach(pred => {
    const assetName = pred.assets.name;
    if (!byAsset[assetName]) {
      byAsset[assetName] = [];
    }
    byAsset[assetName].push(pred);
  });

  // Display summary
  console.log('📊 Summary by Asset:\n');
  Object.entries(byAsset).forEach(([assetName, preds]) => {
    const riskLevel = preds[0].risk_level;
    const rulDays = preds[0].rul_days;
    const horizons = preds.map(p => `${p.time_horizon_days}d: ${p.failure_probability}%`).join(', ');
    
    const riskEmoji = riskLevel === 'critical' ? '🔴' : 
                     riskLevel === 'high' ? '🟠' : 
                     riskLevel === 'medium' ? '🟡' : '🟢';
    
    console.log(`${riskEmoji} ${assetName}`);
    console.log(`   Risk: ${riskLevel.toUpperCase()} | RUL: ${rulDays} days`);
    console.log(`   Failure Probability: ${horizons}\n`);
  });

  // Risk level summary
  console.log('\n📈 Risk Level Distribution:\n');
  const riskCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  Object.values(byAsset).forEach(preds => {
    riskCounts[preds[0].risk_level]++;
  });

  console.log(`   🔴 Critical: ${riskCounts.critical} assets`);
  console.log(`   🟠 High: ${riskCounts.high} assets`);
  console.log(`   🟡 Medium: ${riskCounts.medium} assets`);
  console.log(`   🟢 Low: ${riskCounts.low} assets`);
}

verifyFailurePredictions()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
