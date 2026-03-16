/**
 * Check Missing Tables
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'diagnostic_events',
  'rca_records',
  'fmea_entries',
  'predictive_anomalies',
  'health_scores',
  'assets',
  'tenants'
];

async function main() {
  console.log('Checking tables in Supabase...');
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Fatal error ${err.message}`);
    }
  }
}

main();
