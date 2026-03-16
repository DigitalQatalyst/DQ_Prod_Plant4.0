#!/usr/bin/env node

/**
 * Fix All Switchgear Bay Assets
 * 
 * This script adds telemetry and health scores to all bay assets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function computeHealthScore(assetId, assetTypeName) {
  const assetTypeKey = assetTypeName.toLowerCase().replace(/\s+/g, '_');
  
  // Get health model
  const { data: healthModel } = await supabase
    .from('health_models')
    .select('parameter_weights')
    .eq('asset_type', assetTypeKey)
    .eq('model_version', 'v1.0')
    .single();

  if (!healthModel) return null;

  const parameterWeights = healthModel.parameter_weights;
  const parameterNames = Object.keys(parameterWeights);

  // Get parameter IDs
  const { data: parameters } = await supabase
    .from('telemetry_parameters')
    .select('id, name, warning_min, warning_max, critical_min, critical_max')
    .in('name', parameterNames);

  if (!parameters || parameters.length === 0) return null;

  // Compute health score
  const componentBreakdown = {};
  let totalWeight = 0;
  let weightedScore = 0;

  for (const param of parameters) {
    const weight = parameterWeights[param.name];
    if (!weight) continue;

    const { data: telemetry } = await supabase
      .from('telemetry_data')
      .select('value')
      .eq('asset_id', assetId)
      .eq('parameter_id', param.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!telemetry) continue;

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

    componentBreakdown[param.id] = paramScore;
    weightedScore += paramScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  const healthScore = Math.round(weightedScore / totalWeight);

  return {
    score: healthScore,
    model_version: 'v1.0',
    component_breakdown: componentBreakdown
  };
}

async function main() {
  console.log('🔧 Fixing All Switchgear Bay Assets\n');

  // Get all bay assets
  const { data: bays, error: bayError } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      status,
      asset_types!inner(name)
    `)
    .eq('asset_types.name', 'Switchgear Bay');

  if (bayError || !bays) {
    console.error('❌ Error fetching bays:', bayError);
    return;
  }

  console.log(`Found ${bays.length} Switchgear Bay assets\n`);

  // Get parameter IDs
  const { data: params } = await supabase
    .from('telemetry_parameters')
    .select('id, name')
    .in('name', ['busbar_voltage', 'busbar_current', 'bay_temperature', 'isolator_status', 'earthing_status']);

  const paramIds = {};
  params?.forEach(p => {
    paramIds[p.name] = p.id;
  });

  let fixedCount = 0;

  for (const bay of bays) {
    console.log(`Processing: ${bay.name}`);

    // Check if already has telemetry
    const { data: existingTelemetry } = await supabase
      .from('telemetry_data')
      .select('id')
      .eq('asset_id', bay.id)
      .limit(1)
      .maybeSingle();

    if (existingTelemetry) {
      console.log(`  ⏭️  Already has telemetry\n`);
      
      // Check if has health score
      const { data: existingScore } = await supabase
        .from('health_scores')
        .select('score')
        .eq('asset_id', bay.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingScore) {
        // Compute health score
        const healthData = await computeHealthScore(bay.id, bay.asset_types.name);
        if (healthData) {
          await supabase
            .from('health_scores')
            .insert({
              asset_id: bay.id,
              score: healthData.score,
              computed_at: new Date().toISOString(),
              model_version: healthData.model_version,
              component_breakdown: healthData.component_breakdown
            });
          console.log(`  ✅ Computed health score: ${healthData.score}/100\n`);
          fixedCount++;
        }
      }
      continue;
    }

    // Update status to online if needed
    if (bay.status !== 'online') {
      await supabase
        .from('assets')
        .update({ status: 'online' })
        .eq('id', bay.id);
    }

    // Seed telemetry data
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
          const { error } = await supabase
            .from('telemetry_data')
            .insert({
              timestamp: timestamp.toISOString(),
              asset_id: bay.id,
              ...data
            });

          if (!error) telemetryCount++;
        }
      }
    }

    console.log(`  ✅ Seeded ${telemetryCount} telemetry records`);

    // Compute health score
    const healthData = await computeHealthScore(bay.id, bay.asset_types.name);
    if (healthData) {
      await supabase
        .from('health_scores')
        .insert({
          asset_id: bay.id,
          score: healthData.score,
          computed_at: new Date().toISOString(),
          model_version: healthData.model_version,
          component_breakdown: healthData.component_breakdown
        });
      console.log(`  ✅ Health Score: ${healthData.score}/100\n`);
      fixedCount++;
    }
  }

  console.log('═'.repeat(60));
  console.log(`✅ Fixed ${fixedCount} bay assets`);
  console.log('═'.repeat(60));
}

main();
