#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('='.repeat(80));
console.log('Asset Parameter Map Seed');
console.log('='.repeat(80));
console.log('');

async function main() {
  try {
    // Get all parameters
    const { data: parameters, error: paramsError } = await supabase
      .from('telemetry_parameters')
      .select('id, name');
    
    if (paramsError) throw paramsError;
    
    const paramMap = {};
    parameters.forEach(p => {
      paramMap[p.name] = p.id;
    });
    
    console.log(`Found ${parameters.length} telemetry parameters\n`);
    
    // Define mappings for each asset type
    const mappings = [
      // Power Transformer mappings
      { asset_type: 'Power Transformer', parameter_name: 'top_oil_temp', is_required: true, sampling_interval_seconds: 300 },
      { asset_type: 'Power Transformer', parameter_name: 'winding_hot_spot', is_required: true, sampling_interval_seconds: 300 },
      { asset_type: 'Power Transformer', parameter_name: 'load_current', is_required: true, sampling_interval_seconds: 60 },
      { asset_type: 'Power Transformer', parameter_name: 'dga_h2', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Power Transformer', parameter_name: 'dga_ch4', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Power Transformer', parameter_name: 'dga_c2h2', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Power Transformer', parameter_name: 'moisture_ppm', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Power Transformer', parameter_name: 'bushing_power_factor', is_required: false, sampling_interval_seconds: 2592000 },
      { asset_type: 'Power Transformer', parameter_name: 'oltc_operations_count', is_required: false, sampling_interval_seconds: 3600 },
      { asset_type: 'Power Transformer', parameter_name: 'vibration', is_required: false, sampling_interval_seconds: 300 },
      { asset_type: 'Power Transformer', parameter_name: 'cooling_fan_status', is_required: false, sampling_interval_seconds: 600 },
      
      // Circuit Breaker mappings
      { asset_type: 'Circuit Breaker', parameter_name: 'sf6_pressure', is_required: true, sampling_interval_seconds: 3600 },
      { asset_type: 'Circuit Breaker', parameter_name: 'sf6_density', is_required: true, sampling_interval_seconds: 3600 },
      { asset_type: 'Circuit Breaker', parameter_name: 'contact_wear_percent', is_required: true, sampling_interval_seconds: 86400 },
      { asset_type: 'Circuit Breaker', parameter_name: 'operation_count', is_required: true, sampling_interval_seconds: 3600 },
      { asset_type: 'Circuit Breaker', parameter_name: 'trip_coil_current', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Circuit Breaker', parameter_name: 'mechanism_time', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Circuit Breaker', parameter_name: 'partial_discharge', is_required: false, sampling_interval_seconds: 86400 },
      { asset_type: 'Circuit Breaker', parameter_name: 'ambient_temp', is_required: false, sampling_interval_seconds: 600 },
      { asset_type: 'Circuit Breaker', parameter_name: 'humidity', is_required: false, sampling_interval_seconds: 600 },
      { asset_type: 'Circuit Breaker', parameter_name: 'load_current', is_required: false, sampling_interval_seconds: 60 },
    ];
    
    console.log(`Creating ${mappings.length} asset parameter mappings...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const mapping of mappings) {
      const parameterId = paramMap[mapping.parameter_name];
      
      if (!parameterId) {
        console.log(`  ⚠ Parameter not found: ${mapping.parameter_name}`);
        errorCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('asset_parameter_map')
        .insert({
          asset_type: mapping.asset_type,
          parameter_id: parameterId,
          is_required: mapping.is_required,
          sampling_interval_seconds: mapping.sampling_interval_seconds
        });
      
      if (error) {
        if (error.code === '23505') {
          // Duplicate key - already exists
          successCount++;
        } else {
          console.log(`  ✗ ${mapping.asset_type} - ${mapping.parameter_name}: ${error.message}`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✓ Successfully created ${successCount} mappings`);
    if (errorCount > 0) {
      console.log(`⚠ ${errorCount} mappings failed`);
    }
    console.log('='.repeat(80));
    console.log('\nNext steps:');
    console.log('  1. Run: node scripts/quick-seed-telemetry.js');
    console.log('  2. Refresh your browser');
    console.log('  3. Navigate to /monitor/condition-monitoring\n');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
