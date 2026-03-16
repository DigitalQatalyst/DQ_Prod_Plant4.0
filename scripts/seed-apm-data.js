/**
 * Seed all APM data via direct PG connection
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

const { Client } = pg;
config({ path: '.env.development' });

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const seedFiles = [
  'supabase/seed_sources/007_apm_fs4_seed.sql',
  'supabase/seed_sources/008_apm_fs1_seed.sql',
];

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connected to local postgres\n');

    for (const file of seedFiles) {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Not found: ${file}`);
        continue;
      }
      console.log(`📦 Seeding ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query(sql);
        console.log(`✅ Done: ${file}\n`);
      } catch (err) {
        console.log(`❌ Error in ${file}: ${err.message}\n`);
      }
    }

    // Check counts
    console.log('📊 Checking data counts...');
    const tables = [
      'diagnostic_events', 'rca_records', 'fmea_entries', 
      'health_scores', 'failure_predictions', 'spare_parts'
    ];
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(`  ${t}: ${res.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${t}: ❌ ${err.message}`);
      }
    }

  } catch (err) {
    console.error('❌ Fatal:', err.message);
  } finally {
    await client.end();
  }
}

main();
