/**
 * Seed FS2 Data Directly
 * Executes the FS2 seed SQL file using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFS2() {
  console.log('🌱 Seeding FS2 Data...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'supabase', 'seed', '010_apm_fs2_seed.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing SQL file:', sqlPath);
    console.log('📏 File size:', sql.length, 'characters\n');

    // Execute the SQL using RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative: execute via REST API
      console.log('\n🔄 Trying alternative method...\n');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Alternative method also failed:', errorText);
        console.log('\n💡 The SQL file needs to be executed directly against PostgreSQL.');
        console.log('   You can use one of these methods:');
        console.log('   1. Supabase Studio SQL Editor');
        console.log('   2. psql command: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/seed/010_apm_fs2_seed.sql');
        console.log('   3. Copy the SQL content and paste it into Supabase Studio\n');
        process.exit(1);
      }

      const result = await response.json();
      console.log('✅ SQL executed successfully via REST API');
      console.log('📊 Result:', result);
    } else {
      console.log('✅ SQL executed successfully');
      console.log('📊 Result:', data);
    }

    // Verify the data was seeded
    console.log('\n🔍 Verifying seeded data...\n');

    const { count: cbmCount } = await supabase
      .from('cbm_triggers')
      .select('*', { count: 'exact', head: true });

    const { count: failureCount } = await supabase
      .from('failure_predictions')
      .select('*', { count: 'exact', head: true });

    const { count: recommendationCount } = await supabase
      .from('maintenance_recommendations')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ CBM Triggers: ${cbmCount}`);
    console.log(`✅ Failure Predictions: ${failureCount}`);
    console.log(`✅ Maintenance Recommendations: ${recommendationCount}`);

    if (cbmCount > 0 && failureCount > 0 && recommendationCount > 0) {
      console.log('\n🎉 FS2 data seeded successfully!\n');
    } else {
      console.log('\n⚠️  Some tables are still empty. Manual seeding may be required.\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

seedFS2();
