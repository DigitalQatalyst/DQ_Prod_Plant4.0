#!/usr/bin/env node

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('='.repeat(80));
console.log('FS1 Seed Data Application (Direct)');
console.log('='.repeat(80));
console.log('');

const sqlFile = 'supabase/seed/008_apm_fs1_seed.sql';
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log(`Reading: ${sqlFile}`);
console.log('Executing SQL...\n');

try {
  // Execute the SQL directly
  const { data, error } = await supabase.rpc('exec', { sql });
  
  if (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
  
  console.log('✓ SQL executed successfully');
  console.log('\nNext steps:');
  console.log('  1. Refresh your browser');
  console.log('  2. Navigate to /monitor/condition-monitoring');
  console.log('  3. Select an asset to view telemetry data\n');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
