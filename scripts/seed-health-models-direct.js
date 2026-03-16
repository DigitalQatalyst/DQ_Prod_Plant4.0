#!/usr/bin/env node

/**
 * Seed Health Models Script
 * 
 * This script directly inserts health models into the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🌱 Seeding health models...\n');

  const healthModels = [
    {
      asset_type: 'power_transformer',
      model_version: 'v1.0',
      parameter_weights: {
        top_oil_temp: 0.20,
        winding_hot_spot: 0.25,
        load_current: 0.10,
        dga_h2: 0.10,
        dga_ch4: 0.08,
        dga_c2h2: 0.12,
        moisture_ppm: 0.08,
        bushing_power_factor: 0.05,
        vibration: 0.02
      },
      computation_method: 'weighted_average'
    },
    {
      asset_type: 'circuit_breaker',
      model_version: 'v1.0',
      parameter_weights: {
        sf6_pressure: 0.25,
        sf6_density: 0.25,
        contact_wear_percent: 0.30,
        operation_count: 0.05,
        trip_coil_current: 0.08,
        mechanism_time: 0.05,
        partial_discharge: 0.02
      },
      computation_method: 'weighted_average'
    },
    {
      asset_type: 'transmission_line',
      model_version: 'v1.0',
      parameter_weights: {
        conductor_temp: 0.35,
        current: 0.30,
        sag_estimate: 0.15,
        wind_speed: 0.05,
        fault_indicator_status: 0.10,
        lightning_counter: 0.05
      },
      computation_method: 'weighted_average'
    }
  ];

  for (const model of healthModels) {
    const { error } = await supabase
      .from('health_models')
      .upsert(model, {
        onConflict: 'asset_type,model_version'
      });

    if (error) {
      console.error(`❌ Failed to insert ${model.asset_type}:`, error.message);
    } else {
      console.log(`✅ Inserted health model for ${model.asset_type}`);
    }
  }

  console.log('\n✅ Health models seeded successfully!');
}

main();
