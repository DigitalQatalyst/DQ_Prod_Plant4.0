/**
 * Reliable Migration Runner using PG Driver
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

const { Client } = pg;

// Load environment variables
config({ path: '.env.development' });

// We need the direct connection string, which isn't usually in .env.development
// Local supabase usually is on port 54322 for postgres
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const migrationsDir = path.resolve('supabase/migrations');
const filesToApply = [
  '012_apm_fs4_inventory_criticality.sql',
  '014_apm_fs1_health_diagnostics.sql',
  '016_apm_fs2_predictive_prescriptive.sql',
  '015_apm_fs3_performance_utilisation.sql',
  '017_apm_fs5_alerts_reports.sql'
];

async function runSQL(client, sql) {
    // Basic SQL split if needed, but pg.query handles multiple statements sometimes
    // Migrations have BEGIN/COMMIT blocks though.
    await client.query(sql);
}

async function main() {
  console.log('Connecting to local postgres on 54322...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected.');

    for (const file of filesToApply) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        continue;
      }

      console.log(`Applying ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await runSQL(client, sql);
        console.log(`✅ Applied ${file}`);
      } catch (err) {
        console.log(`❌ Error in ${file}: ${err.message}`);
        // If there's an error, we might want to continue or stop
      }
    }
  } catch (err) {
    console.log(`❌ Fatal connection error: ${err.message}`);
  } finally {
    await client.end();
  }
}

main();
