/**
 * Complete FS1 Reseed Script
 * Seeds all FS1 data: health models, health scores, diagnostic events, RCA records
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('Complete FS1 Data Reseeding');
console.log('='.repeat(80));

async function main() {
  try {
    // Get tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*');
    
    if (!tenants || tenants.length === 0) throw new Error('No tenants found');
    const tenant = tenants[0];
    console.log(`✓ Using tenant: ${tenant.name}`);
    
    // Get all assets
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'online');
    
    console.log(`✓ Found ${assets.length} online assets`);
    
    // Seed health models
    console.log('\n1. Seeding health models...');
    const healthModels = [
      {
        asset_type: 'power_transformer',
        model_version: 'v1.0',
        computation_method: 'weighted_average',
        parameter_weights: {
          top_oil_temp: 0.25,
          winding_hot_spot: 0.25,
          dga_h2: 0.15,
          dga_ch4: 0.15,
          moisture_ppm: 0.10,
          bushing_power_factor: 0.10
        }
      },
      {
        asset_type: 'circuit_breaker',
        model_version: 'v1.0',
        computation_method: 'weighted_average',
        parameter_weights: {
          sf6_pressure: 0.30,
          contact_wear_percent: 0.30,
          operation_count: 0.20,
          mechanism_time: 0.20
        }
      },
      {
        asset_type: 'switchgear_bay',
        model_version: 'v1.0',
        computation_method: 'weighted_average',
        parameter_weights: {
          ambient_temp: 0.25,
          humidity: 0.25,
          partial_discharge: 0.30,
          insulation_resistance: 0.20
        }
      },
      {
        asset_type: 'energy_meter',
        model_version: 'v1.0',
        computation_method: 'weighted_average',
        parameter_weights: {
          voltage_thd: 0.30,
          current_thd: 0.30,
          power_factor: 0.20,
          frequency: 0.20
        }
      }
    ];
    
    for (const model of healthModels) {
      const { error } = await supabase
        .from('health_models')
        .upsert(model, { onConflict: 'asset_type,model_version' });
      
      if (error) {
        console.log(`  ⚠️  ${model.asset_type}: ${error.message}`);
      } else {
        console.log(`  ✓ ${model.asset_type}`);
      }
    }
    
    // Seed health scores for all assets
    console.log('\n2. Seeding health scores...');
    const healthScores = assets.map(asset => ({
      asset_id: asset.id,
      score: Math.floor(70 + Math.random() * 25),
      computed_at: new Date().toISOString(),
      model_version: 'v1.0',
      component_breakdown: {}
    }));
    
    const { error: healthError } = await supabase
      .from('health_scores')
      .insert(healthScores);
    
    if (healthError) {
      console.log(`  ✗ Error: ${healthError.message}`);
    } else {
      console.log(`  ✓ Created ${healthScores.length} health scores`);
    }
    
    // Seed diagnostic events
    console.log('\n3. Seeding diagnostic events...');
    const eventTypes = ['thermal', 'electrical', 'mechanical', 'insulation', 'comms'];
    const diagnosticEvents = [];
    
    for (const asset of assets.slice(0, 8)) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const state = Math.random() > 0.5 ? 'open' : 'closed';
      diagnosticEvents.push({
        asset_id: asset.id,
        event_type: eventType,
        title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Issue Detected`,
        description: `Diagnostic analysis detected ${eventType} anomaly on ${asset.name}`,
        confidence: Math.floor(70 + Math.random() * 25),
        detected_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        state: state,
        closed_at: state === 'closed' ? new Date().toISOString() : null
      });
    }
    
    const { error: eventsError } = await supabase
      .from('diagnostic_events')
      .insert(diagnosticEvents);
    
    if (eventsError) {
      console.log(`  ✗ Error: ${eventsError.message}`);
    } else {
      console.log(`  ✓ Created ${diagnosticEvents.length} diagnostic events`);
    }
    
    // Seed RCA records
    console.log('\n4. Seeding RCA records...');
    
    // Get actual event IDs
    const { data: insertedEvents } = await supabase
      .from('diagnostic_events')
      .select('id, asset_id')
      .in('asset_id', diagnosticEvents.map(e => e.asset_id));
    
    if (insertedEvents && insertedEvents.length > 0) {
      const rcaRecords = insertedEvents.slice(0, 5).map(event => ({
        event_id: event.id,
        root_cause: 'Environmental stress',
        contributing_factors: 'High ambient temperature, Increased load',
        corrective_actions: 'Reduce load, Improve cooling',
        preventive_actions: 'Regular maintenance, Monitor temperature trends',
        created_by: 'system'
      }));
      
      const { error: rcaError } = await supabase
        .from('rca_records')
        .insert(rcaRecords);
      
      if (rcaError) {
        console.log(`  ✗ Error: ${rcaError.message}`);
      } else {
        console.log(`  ✓ Created ${rcaRecords.length} RCA records`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✓ FS1 reseeding completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Reseeding failed:', error);
    process.exit(1);
  }
}

main();
