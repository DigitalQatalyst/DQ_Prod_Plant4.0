#!/usr/bin/env node

/**
 * Compute Health Scores Script
 * 
 * This script computes health scores for all assets based on their telemetry data
 * and inserts them into the health_scores table.
 * 
 * Usage: node scripts/compute-health-scores.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.development');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Compute health score for an asset based on telemetry data and health model
 */
async function computeHealthScore(assetId, assetType, modelVersion = 'v1.0') {
  try {
    // Get the health model for this asset type
    const { data: healthModel, error: modelError } = await supabase
      .from('health_models')
      .select('parameter_weights')
      .eq('asset_type', assetType)
      .eq('model_version', modelVersion)
      .single();

    if (modelError || !healthModel) {
      console.warn(`⚠️  No health model found for ${assetType} ${modelVersion}`);
      return null;
    }

    const parameterWeights = healthModel.parameter_weights;
    const parameterNames = Object.keys(parameterWeights);

    // Get parameter IDs for these parameter names
    const { data: parameters, error: paramError } = await supabase
      .from('telemetry_parameters')
      .select('id, name, warning_min, warning_max, critical_min, critical_max')
      .in('name', parameterNames);

    if (paramError || !parameters || parameters.length === 0) {
      console.warn(`⚠️  No parameters found for ${assetType}`);
      return null;
    }

    // Get latest telemetry for each parameter
    const componentBreakdown = {};
    let totalWeight = 0;
    let weightedScore = 0;

    for (const param of parameters) {
      const weight = parameterWeights[param.name];
      if (!weight) continue;

      // Get latest telemetry value
      const { data: telemetry, error: telemetryError } = await supabase
        .from('telemetry_data')
        .select('value, timestamp')
        .eq('asset_id', assetId)
        .eq('parameter_id', param.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (telemetryError || !telemetry) {
        console.warn(`⚠️  No telemetry for parameter ${param.name}`);
        continue;
      }

      // Compute parameter health score (0-100)
      let paramScore = 100;
      const value = telemetry.value;

      // Check against thresholds
      if (param.critical_min !== null && value < param.critical_min) {
        paramScore = 40; // Critical low
      } else if (param.critical_max !== null && value > param.critical_max) {
        paramScore = 40; // Critical high
      } else if (param.warning_min !== null && value < param.warning_min) {
        paramScore = 70; // Warning low
      } else if (param.warning_max !== null && value > param.warning_max) {
        paramScore = 70; // Warning high
      }

      componentBreakdown[param.id] = paramScore;
      weightedScore += paramScore * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      console.warn(`⚠️  No valid parameters for asset ${assetId}`);
      return null;
    }

    // Compute final health score
    const healthScore = Math.round(weightedScore / totalWeight);

    return {
      score: healthScore,
      model_version: modelVersion,
      component_breakdown: componentBreakdown,
    };
  } catch (error) {
    console.error(`❌ Error computing health score for asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Computing health scores for all assets...\n');

  try {
    // Get all assets in power_transmission sector
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select(`
        id,
        name,
        status,
        asset_type_id,
        asset_types!inner(name)
      `)
      .eq('status', 'online');

    if (assetsError) {
      throw assetsError;
    }

    if (!assets || assets.length === 0) {
      console.log('⚠️  No online assets found');
      return;
    }

    console.log(`📊 Found ${assets.length} online assets\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const asset of assets) {
      const assetTypeName = asset.asset_types.name;
      // Convert to snake_case for health model lookup
      const assetTypeKey = assetTypeName.toLowerCase().replace(/\s+/g, '_');
      console.log(`Processing: ${asset.name} - ${assetTypeName}`);

      const healthData = await computeHealthScore(asset.id, assetTypeKey);

      if (!healthData) {
        console.log(`  ⏭️  Skipped (no data or model)\n`);
        skipCount++;
        continue;
      }

      // Insert health score
      const { error: insertError } = await supabase
        .from('health_scores')
        .upsert({
          asset_id: asset.id,
          score: healthData.score,
          computed_at: new Date().toISOString(),
          model_version: healthData.model_version,
          component_breakdown: healthData.component_breakdown,
        }, {
          onConflict: 'asset_id,computed_at',
        });

      if (insertError) {
        console.error(`  ❌ Failed to insert: ${insertError.message}\n`);
        continue;
      }

      console.log(`  ✅ Health Score: ${healthData.score}/100\n`);
      successCount++;
    }

    console.log('═'.repeat(60));
    console.log(`✅ Successfully computed ${successCount} health scores`);
    console.log(`⏭️  Skipped ${skipCount} assets`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
