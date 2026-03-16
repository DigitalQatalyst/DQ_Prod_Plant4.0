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
console.log('Telemetry Parameters Seed');
console.log('='.repeat(80));
console.log('');

const parameters = [
  // Transformer Parameters
  { name: 'top_oil_temp', parameter_type: 'temperature', unit: '°C', parameter_role: 'health_driver', warning_max: 85, critical_max: 95, description: 'Transformer top oil temperature' },
  { name: 'winding_hot_spot', parameter_type: 'temperature', unit: '°C', parameter_role: 'health_driver', warning_max: 110, critical_max: 120, description: 'Transformer winding hotspot temperature' },
  { name: 'load_current', parameter_type: 'current', unit: 'A', parameter_role: 'health_driver', description: 'Transformer load current' },
  { name: 'dga_h2', parameter_type: 'concentration', unit: 'ppm', parameter_role: 'diagnostic', warning_max: 100, critical_max: 1000, description: 'Dissolved Gas Analysis - Hydrogen' },
  { name: 'dga_ch4', parameter_type: 'concentration', unit: 'ppm', parameter_role: 'diagnostic', warning_max: 120, critical_max: 1000, description: 'Dissolved Gas Analysis - Methane' },
  { name: 'dga_c2h2', parameter_type: 'concentration', unit: 'ppm', parameter_role: 'diagnostic', warning_max: 35, critical_max: 100, description: 'Dissolved Gas Analysis - Acetylene' },
  { name: 'moisture_ppm', parameter_type: 'concentration', unit: 'ppm', parameter_role: 'diagnostic', warning_max: 30, critical_max: 50, description: 'Oil moisture content' },
  { name: 'bushing_power_factor', parameter_type: 'percentage', unit: '%', parameter_role: 'diagnostic', warning_max: 0.5, critical_max: 1.0, description: 'Bushing power factor' },
  { name: 'oltc_operations_count', parameter_type: 'count', unit: 'ops', parameter_role: 'context', description: 'On-Load Tap Changer operations count' },
  { name: 'vibration', parameter_type: 'acceleration', unit: 'mm/s', parameter_role: 'diagnostic', warning_max: 7.1, critical_max: 11.2, description: 'Transformer vibration level' },
  { name: 'cooling_fan_status', parameter_type: 'status', unit: 'bool', parameter_role: 'context', description: 'Cooling fan operational status' },
  
  // Circuit Breaker Parameters
  { name: 'sf6_pressure', parameter_type: 'pressure', unit: 'bar', parameter_role: 'health_driver', warning_min: 5.0, critical_min: 4.5, description: 'SF6 gas pressure' },
  { name: 'sf6_density', parameter_type: 'density', unit: 'kg/m³', parameter_role: 'health_driver', warning_min: 40, critical_min: 35, description: 'SF6 gas density' },
  { name: 'contact_wear_percent', parameter_type: 'percentage', unit: '%', parameter_role: 'health_driver', warning_max: 70, critical_max: 85, description: 'Contact wear percentage' },
  { name: 'operation_count', parameter_type: 'count', unit: 'ops', parameter_role: 'context', description: 'Breaker operation count' },
  { name: 'trip_coil_current', parameter_type: 'current', unit: 'A', parameter_role: 'diagnostic', warning_min: 3.5, warning_max: 6.0, critical_min: 3.0, critical_max: 7.0, description: 'Trip coil current' },
  { name: 'mechanism_time', parameter_type: 'time', unit: 'ms', parameter_role: 'diagnostic', warning_max: 60, critical_max: 80, description: 'Operating mechanism time' },
  { name: 'partial_discharge', parameter_type: 'charge', unit: 'pC', parameter_role: 'diagnostic', warning_max: 500, critical_max: 1000, description: 'Partial discharge level' },
  
  // Transmission Line Parameters
  { name: 'conductor_temp', parameter_type: 'temperature', unit: '°C', parameter_role: 'health_driver', warning_max: 75, critical_max: 90, description: 'Conductor temperature' },
  { name: 'sag_estimate', parameter_type: 'distance', unit: 'm', parameter_role: 'diagnostic', description: 'Estimated conductor sag' },
  { name: 'wind_speed', parameter_type: 'speed', unit: 'm/s', parameter_role: 'context', description: 'Wind speed at line location' },
  { name: 'current', parameter_type: 'current', unit: 'A', parameter_role: 'health_driver', description: 'Line current' },
  { name: 'fault_indicator_status', parameter_type: 'status', unit: 'bool', parameter_role: 'diagnostic', description: 'Fault indicator status' },
  { name: 'lightning_counter', parameter_type: 'count', unit: 'strikes', parameter_role: 'context', description: 'Lightning strike counter' },
  
  // Protection Relay Parameters
  { name: 'trip_events', parameter_type: 'count', unit: 'events', parameter_role: 'diagnostic', description: 'Relay trip event count' },
  { name: 'self_test_status', parameter_type: 'status', unit: 'bool', parameter_role: 'health_driver', description: 'Relay self-test status' },
  { name: 'comms_latency', parameter_type: 'time', unit: 'ms', parameter_role: 'diagnostic', warning_max: 100, critical_max: 200, description: 'Communication latency' },
  { name: 'goose_status', parameter_type: 'status', unit: 'bool', parameter_role: 'diagnostic', description: 'GOOSE message status' },
  { name: 'time_sync_offset', parameter_type: 'time', unit: 'ms', parameter_role: 'diagnostic', warning_max: 10, critical_max: 50, description: 'Time synchronization offset' },
  
  // Substation Environment Parameters
  { name: 'ambient_temp', parameter_type: 'temperature', unit: '°C', parameter_role: 'context', warning_max: 40, critical_max: 50, description: 'Ambient temperature' },
  { name: 'humidity', parameter_type: 'percentage', unit: '%', parameter_role: 'context', warning_max: 80, critical_max: 95, description: 'Relative humidity' },
  { name: 'intrusion_door_status', parameter_type: 'status', unit: 'bool', parameter_role: 'diagnostic', description: 'Intrusion door status' },
  { name: 'smoke_fire_alarm', parameter_type: 'status', unit: 'bool', parameter_role: 'diagnostic', description: 'Smoke/fire alarm status' },
  { name: 'dc_bus_voltage', parameter_type: 'voltage', unit: 'V', parameter_role: 'health_driver', warning_min: 100, warning_max: 140, critical_min: 90, critical_max: 150, description: 'DC bus voltage' },
];

async function main() {
  try {
    console.log(`Inserting ${parameters.length} telemetry parameters...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const param of parameters) {
      const { error } = await supabase
        .from('telemetry_parameters')
        .insert(param);
      
      if (error) {
        console.log(`  ✗ ${param.name}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✓ Successfully inserted ${successCount} parameters`);
    if (errorCount > 0) {
      console.log(`⚠ ${errorCount} parameters failed`);
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
