/**
 * Apply Missing Migrations
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use the service role key if available, otherwise anon might fail if RLS is on
// But since we are local, and we often have an "exec_sql" RPC for devs, let's try direct SQL if we can.
// Actually, standard supabase-js client cannot execute arbitrary SQL without an RPC.
// So we will use the Supabase CLI to be safe.

const migrationsDir = path.resolve('supabase/migrations');
const filesToApply = [
  '012_apm_fs4_inventory_criticality.sql',
  '014_apm_fs1_health_diagnostics.sql',
  '016_apm_fs2_predictive_prescriptive.sql',
  '015_apm_fs3_performance_utilisation.sql',
  '017_apm_fs5_alerts_reports.sql'
];

import { execSync } from 'child_process';

console.log('Applying missing migrations via Supabase CLI...');

for (const file of filesToApply) {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }

  console.log(`Applying ${file}...`);
  try {
    // We use type to pipe the file content to supabase db query
    // In PowerShell it's Get-Content, in CMD it's type.
    // We'll use a more cross-platform way if possible, or just use fs.readFileSync and pass as argument if query allows string
    // But migrations can be large.
    
    const sql = fs.readFileSync(filePath, 'utf8');
    // Using supabase db query via stdin
    execSync('npx supabase db query', { 
      input: sql,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(`✅ Applied ${file}`);
  } catch (err) {
    console.log(`❌ Failed to apply ${file}: ${err.message}`);
  }
}

console.log('Migration application complete.');
