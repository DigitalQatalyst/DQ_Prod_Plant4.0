#!/usr/bin/env node

/**
 * Fix Al Aweer 220kV Bay 1 Asset
 * 
 * This script:
 * 1. Updates the asset status to "online"
 * 2. Creates telemetry parameters for switchgear bays
 * 3. Seeds telemetry data
 * 4. Creates a health model for switchgear_bay
 * 5. Computes health score
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Fixing Al Aweer 220kV Bay 1 Asset\n');

  // Step 1: Get the asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, name, status, asset_types(name)')
    .eq('name', 'Al Aweer 220kV Bay 1')
    .single();

  if (assetError || !asset) {
    console.error('❌ Asset not found:', assetError);
    return;
  }

  console.log(`Step 1: Found asset "${asset.name}"`);
  console.log(`  Current status: ${asset.status}\n`);

  // Step 2: Update status to online
  if (asset.status !== 'online') {
    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: 'online' })
      .eq('id', asset.id);

    if (updateError) {
      console.error('❌ Failed to update status:', updateError);
      return;
    }
    console.log('✅ Step 2: Updated status to "online"\n');
  } else {
    console.log('✅ Step 2: Status already "online"\n');
  }

  // Step 3: Create telemetry parameters for switchgear bay
  console.log('Step 3: Creating telemetry parameters for switchgear bay...');
  
  const parameters = [
    { name: 'busbar_voltage', parameter_type: 'voltage', unit: 'kV', warning_min: 200, warning_max: 240, critical_min: 190, critical_max: 250 },
    { name: 'busbar_current', parameter_type: 'current', unit: 'A', warning_min: null, warning_max: 1800, critical_min: null, critical_max: 2000 },
    { name: 'bay_temperature', parameter_type: 'temperature', unit: '°C', warning_min: null, warning_max: 50, critical_min: null, critical_max: 60 },
    { name: 'isolator_status', parameter_type: 'status', unit: 'bool', warning_min: null, warning_max: null, critical_min: null, critical_max: null },
    { name: 'earthing_status', parameter_type: 'status', unit: 'bool', warning_min: null, warning_max: null, critical_min: null, critical_max: null },
  ];

  const paramIds = {};
  
  for (const param of parameters) {
    const { data: existing } = await supabase
      .from('telemetry_parameters')
      .select('id')
      .eq('name', param.name)
      .eq('parameter_type', param.parameter_type)
      .maybeSingle();

    if (existing) {
      paramIds[param.name] = existing.id;
      console.log(`  ✓ Parameter "${param.name}" already exists`);
    } else {
      const { data: newParam, error: paramError } = await supabase
        .from('telemetry_parameters')
        .insert(param)
        .select('id')
        .single();

      if (paramError) {
        console.error(`  ❌ Failed to create "${param.name}":`, paramError.message);
      } else {
        paramIds[param.name] = newParam.id;
        console.log(`  ✅ Created parameter "${param.name}"`);
      }
    }
  }

  console.log();

  // Step 4: Seed telemetry data (last 7 days)
  console.log('Step 4: Seeding telemetry data...');
  
  let telemetryCount = 0;
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour += 6) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - day);
      timestamp.setHours(timestamp.getHours() - hour);

      const telemetryData = [
        { parameter_id: paramIds.busbar_voltage, value: 220 + (Math.random() * 10 - 5), unit: 'kV', quality_score: 95 + Math.random() * 5 },
        { parameter_id: paramIds.busbar_current, value: 1200 + (Math.random() * 400), unit: 'A', quality_score: 98 + Math.random() * 2 },
        { parameter_id: paramIds.bay_temperature, value: 35 + (Math.random() * 10), unit: '°C', quality_score: 95 + Math.random() * 5 },
        { parameter_id: paramIds.isolator_status, value: 1, unit: 'bool', quality_score: 100 },
        { parameter_id: paramIds.earthing_status, value: 1, unit: 'bool', quality_score: 100 },
      ];

      for (const data of telemetryData) {
        const { error: telError } = await supabase
          .from('telemetry_data')
          .insert({
            timestamp: timestamp.toISOString(),
            asset_id: asset.id,
            ...data
          });

        if (!telError) {
          telemetryCount++;
        }
      }
    }
  }

  console.log(`✅ Seeded ${telemetryCount} telemetry records\n`);

  // Step 5: Create health model for switchgear_bay
  console.log('Step 5: Creating health model for switchgear_bay...');
  
  const healthModel = {
    asset_type: 'switchgear_bay',
    model_version: 'v1.0',
    parameter_weights: {
      busbar_voltage: 0.30,
      busbar_current: 0.25,
      bay_temperature: 0.25,
      isolator_status: 0.10,
      earthing_status: 0.10
    },
    computation_method: 'weighted_average'
  };

  const { error: modelError } = await supabase
    .from('health_models')
    .upsert(healthModel, {
      onConflict: 'asset_type,model_version'
    });

  if (modelError) {
    console.error('❌ Failed to create health model:', modelError.message);
    return;
  }

  console.log('✅ Created health model for switchgear_bay\n');

  // Step 6: Compute health score
  console.log('Step 6: Computing health score...');

  let totalWeight = 0;
  let weightedScore = 0;
  const componentBreakdown = {};

  for (const [paramName, weight] of Object.entries(healthModel.parameter_weights)) {
    const paramId = paramIds[paramName];
    if (!paramId) continue;

    // Get latest telemetry
    const { data: telemetry } = await supabase
      .from('telemetry_data')
      .select('value')
      .eq('asset_id', asset.id)
      .eq('parameter_id', paramId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!telemetry) continue;

    // Get parameter thresholds
    const param = parameters.find(p => p.name === paramName);
    if (!param) continue;

    // Compute parameter score
    let paramScore = 100;
    const value = telemetry.value;

    if (param.critical_min !== null && value < param.critical_min) {
      paramScore = 40;
    } else if (param.critical_max !== null && value > param.critical_max) {
      paramScore = 40;
    } else if (param.warning_min !== null && value < param.warning_min) {
      paramScore = 70;
    } else if (param.warning_max !== null && value > param.warning_max) {
      paramScore = 70;
    }

    componentBreakdown[paramId] = paramScore;
    weightedScore += paramScore * weight;
    totalWeight += weight;
  }

  const healthScore = Math.round(weightedScore / totalWeight);

  // Insert health score
  const { error: scoreError } = await supabase
    .from('health_scores')
    .upsert({
      asset_id: asset.id,
      score: healthScore,
      computed_at: new Date().toISOString(),
      model_version: 'v1.0',
      component_breakdown: componentBreakdown
    }, {
      onConflict: 'asset_id,computed_at'
    });

  if (scoreError) {
    console.error('❌ Failed to insert health score:', scoreError.message);
    return;
  }

  console.log(`✅ Health Score: ${healthScore}/100\n`);

  console.log('═'.repeat(60));
  console.log('✅ Asset fixed successfully!');
  console.log('═'.repeat(60));
  console.log('\nNext steps:');
  console.log('  1. Refresh your browser');
  console.log('  2. Select "Al Aweer 220kV Bay 1"');
  console.log('  3. View the health score and breakdown');
}

main();
