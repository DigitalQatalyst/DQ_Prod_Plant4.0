/**
 * Seed FS1 data (diagnostic events, RCA records, health data) 
 * using direct inserts to avoid $$ block parsing issues
 */
import pg from 'pg';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;
config({ path: '.env.development' });

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected\n');

  try {
    // 1. Get assets
    const { rows: assets } = await client.query(`
      SELECT id, name FROM assets 
      WHERE tenant_id IS NOT NULL
      ORDER BY name
      LIMIT 15
    `);
    console.log(`Found ${assets.length} assets`);
    if (assets.length === 0) { console.log('No assets found!'); return; }

    // 2. Seed health_scores
    console.log('\n📊 Seeding health_scores...');
    const healthScoreValues = assets.slice(0, 10).map((a, i) => {
      const scores = [92, 85, 78, 71, 88, 95, 65, 82, 76, 90];
      return `('${a.id}'::uuid, ${scores[i]}, NOW() - '${i*2} hours'::interval, 'v1.0', '{"thermal": ${scores[i]-5}, "electrical": ${scores[i]+2}, "mechanical": ${scores[i]-8}}'::jsonb)`;
    });
    
    await client.query(`
      INSERT INTO health_scores (asset_id, score, computed_at, model_version, component_breakdown)
      VALUES ${healthScoreValues.join(',\n      ')}
      ON CONFLICT (asset_id, computed_at) DO NOTHING
    `);
    console.log('✅ health_scores seeded');

    // 3. Seed telemetry_parameters (needed for telemetry data)
    console.log('\n📊 Seeding telemetry_parameters...');
    await client.query(`
      INSERT INTO telemetry_parameters (name, parameter_type, unit, description, parameter_role, warning_min, warning_max, critical_min, critical_max)
      VALUES
        ('top_oil_temp', 'temperature', '°C', 'Top oil temperature', 'health_driver', 70, 85, NULL, 95),
        ('winding_hot_spot', 'temperature', '°C', 'Winding hot spot temperature', 'health_driver', 80, 95, NULL, 105),
        ('load_current', 'current', 'A', 'Load current', 'diagnostic', NULL, 1200, NULL, 1400),
        ('sf6_pressure', 'pressure', 'bar', 'SF6 gas pressure', 'health_driver', 5.0, NULL, 4.5, NULL),
        ('sf6_density', 'density', 'kg/m³', 'SF6 gas density', 'health_driver', 40, NULL, 38, NULL),
        ('contact_wear_percent', 'percentage', '%', 'Contact wear percentage', 'health_driver', NULL, 70, NULL, 85),
        ('partial_discharge', 'charge', 'pC', 'Partial discharge level', 'diagnostic', NULL, 500, NULL, 1000),
        ('vibration', 'acceleration', 'mm/s', 'Vibration level', 'diagnostic', NULL, 8, NULL, 15),
        ('comms_latency', 'time', 'ms', 'Communication latency', 'health_driver', NULL, 80, NULL, 120)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ telemetry_parameters seeded');

    // 4. Seed rca_records from existing diagnostic_events
    console.log('\n📊 Seeding rca_records...');
    const { rows: closedEvents } = await client.query(`
      SELECT id FROM diagnostic_events WHERE state = 'closed' LIMIT 5
    `);
    
    if (closedEvents.length > 0) {
      const rcaTemplates = [
        {
          root_cause: 'Degraded seal on gas compartment due to thermal cycling and aging',
          contributing: 'Seal material exceeded design life. Ambient temperature variations accelerated degradation.',
          corrective: 'Replaced degraded seal. Recharged gas to rated pressure. Performed leak test.',
          preventive: 'Updated preventive maintenance schedule for seal inspection every 5 years. Added automated density monitoring.'
        },
        {
          root_cause: 'Bird contact with energized conductor causing transient ground fault',
          contributing: 'Inadequate bird deterrent on tower structures. Recent nesting activity observed.',
          corrective: 'Fault cleared automatically by protection system. Visual inspection confirmed no damage.',
          preventive: 'Install bird deterrent devices. Schedule vegetation management. Review protection settings.'
        },
        {
          root_cause: 'Insulation moisture ingress from weathering of terminal box seal',
          contributing: 'Aged gasket no longer providing adequate weatherproofing in humid conditions.',
          corrective: 'Replaced all terminal box gaskets. Dried insulation with heating. Resistance tests passed.',
          preventive: 'Annual gasket inspection program. Improve drainage around terminal box.'
        }
      ];
      
      for (let i = 0; i < Math.min(closedEvents.length, rcaTemplates.length); i++) {
        const t = rcaTemplates[i];
        await client.query(`
          INSERT INTO rca_records (event_id, root_cause, contributing_factors, corrective_actions, preventive_actions, created_by)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          closedEvents[i].id,
          t.root_cause,
          t.contributing,
          t.corrective,
          t.preventive,
          'rca_engineer@example.com'
        ]);
      }
      console.log(`✅ rca_records seeded (${Math.min(closedEvents.length, 3)} records)`);
    } else {
      console.log('⚠️  No closed diagnostic events found to link RCA records to');
    }

    // 5. Seed failure_predictions
    console.log('\n📊 Seeding failure_predictions...');
    const predictionData = assets.slice(0, 8).map((a, i) => {
      const probs = [35, 18, 72, 25, 45, 12, 60, 28];
      const horizons = [30, 90, 7, 30, 90, 90, 30, 7];
      const risks = ['medium', 'low', 'critical', 'low', 'medium', 'low', 'high', 'low'];
      const ruls = [65, 180, 12, 120, 45, 240, 25, 90];
      const prob = probs[i];
      const horizon = horizons[i];
      const risk = risks[i];
      const rul = ruls[i];
      return `('${a.id}'::uuid, NOW() - '${i} hours'::interval, ${prob}, ${80 - i*3}, ${horizon}, '${risk}', ${rul}, ARRAY['thermal_degradation', 'wear']::text[])`;
    });
    
    await client.query(`
      INSERT INTO failure_predictions (asset_id, prediction_date, failure_probability, confidence, time_horizon_days, risk_level, rul_days, contributing_factors)
      VALUES ${predictionData.join(',\n      ')}
    `);
    console.log('✅ failure_predictions seeded');
    
    // 6. Final counts
    console.log('\n📊 Final counts:');
    const tables = ['diagnostic_events', 'rca_records', 'fmea_entries', 'health_scores', 'failure_predictions', 'spare_parts'];
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
      const count = res.rows[0].count;
      console.log(`  ${count > 0 ? '✅' : '⚠️ '} ${t}: ${count} rows`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
