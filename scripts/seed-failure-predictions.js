#!/usr/bin/env node

/**
 * Seed failure predictions for transmission assets
 * This script creates failure prediction data for assets that currently have none
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Asset configurations with their risk profiles
const assetRiskProfiles = {
  'Power Transformer': {
    'Al Aweer T1 Main Transformer': { risk: 'high', rul: 45, factors: ['insulation_degradation', 'moisture_high', 'dga_elevated'] },
    'Dubai T1 Main Transformer': { risk: 'medium', rul: 180, factors: ['normal_aging', 'load_cycling'] },
    'Dubai T2 Backup Transformer': { risk: 'low', rul: 365, factors: ['minimal_usage'] },
    'Jebel Ali T1 Main Transformer': { risk: 'medium', rul: 210, factors: ['load_variation', 'temperature_cycling'] },
  },
  'Circuit Breaker': {
    'Al Aweer 220kV Incomer CB': { risk: 'critical', rul: 30, factors: ['contact_wear', 'mechanism_degradation', 'sf6_leakage'] },
    'Dubai 400kV Incomer CB': { risk: 'medium', rul: 150, factors: ['normal_wear', 'operation_count'] },
    'Dubai 132kV Feeder CB': { risk: 'low', rul: 300, factors: ['low_operation_count'] },
    'Jebel Ali 400kV Incomer CB': { risk: 'high', rul: 60, factors: ['contact_erosion', 'high_operation_count'] },
    'Jebel Ali 132kV Feeder CB': { risk: 'low', rul: 280, factors: ['minimal_operations'] },
  },
  'Switchgear Bay': {
    'Al Aweer 220kV Bay 1': { risk: 'medium', rul: 120, factors: ['busbar_heating', 'insulator_contamination'] },
    'Dubai 400kV Bay 1': { risk: 'low', rul: 240, factors: ['normal_condition'] },
    'Jebel Ali 400kV Bay 1': { risk: 'medium', rul: 180, factors: ['environmental_stress'] },
  }
};

// Risk level to failure probability mapping
const riskToProbability = {
  'critical': { '7d': 85, '30d': 95, '90d': 98 },
  'high': { '7d': 65, '30d': 78, '90d': 88 },
  'medium': { '7d': 35, '30d': 50, '90d': 65 },
  'low': { '7d': 8, '30d': 15, '90d': 25 }
};

async function seedFailurePredictions() {
  console.log('🔍 Fetching assets...');
  
  // Get all assets
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('id, name, asset_type_id');
  
  if (assetsError) {
    console.error('❌ Error fetching assets:', assetsError);
    return;
  }

  console.log(`✅ Found ${assets.length} assets`);

  // Get asset types to map IDs to names
  const { data: assetTypes, error: typesError } = await supabase
    .from('asset_types')
    .select('id, name');
  
  if (typesError) {
    console.error('❌ Error fetching asset types:', typesError);
    return;
  }

  const typeMap = {};
  assetTypes.forEach(type => {
    typeMap[type.id] = type.name;
  });

  console.log('\n📊 Creating failure predictions...');
  
  let created = 0;
  let skipped = 0;

  for (const asset of assets) {
    const typeName = typeMap[asset.asset_type_id];
    const profile = assetRiskProfiles[typeName]?.[asset.name];

    if (!profile) {
      skipped++;
      continue;
    }

    const probabilities = riskToProbability[profile.risk];
    const baseConfidence = profile.risk === 'critical' ? 92 : 
                          profile.risk === 'high' ? 85 : 
                          profile.risk === 'medium' ? 78 : 72;

    // Create predictions for 7, 30, and 90 day horizons
    for (const [horizon, probability] of Object.entries(probabilities)) {
      const days = parseInt(horizon);
      const confidence = baseConfidence - (days === 90 ? 5 : days === 30 ? 2 : 0);

      const prediction = {
        asset_id: asset.id,
        prediction_date: new Date().toISOString(),
        failure_probability: probability,
        confidence: confidence,
        time_horizon_days: days,
        risk_level: profile.risk,
        rul_days: profile.rul,
        contributing_factors: profile.factors
      };

      const { error: insertError } = await supabase
        .from('failure_predictions')
        .insert(prediction);

      if (insertError) {
        console.error(`❌ Error inserting prediction for ${asset.name} (${horizon}):`, insertError.message);
      } else {
        created++;
      }
    }

    console.log(`✅ Created predictions for ${asset.name} (${profile.risk} risk, ${profile.rul} days RUL)`);
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Created: ${created} predictions`);
  console.log(`   Skipped: ${skipped} assets (no risk profile)`);
}

// Run the script
seedFailurePredictions()
  .then(() => {
    console.log('\n✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
