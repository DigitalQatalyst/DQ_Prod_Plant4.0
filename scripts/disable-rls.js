#!/usr/bin/env node
/**
 * Disable All RLS Policies
 * 
 * This script applies migration 022 to disable all RLS policies
 * WARNING: This removes all security restrictions - use only in dev environment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

const { createClient } = require('@supabase/supabase-js');

console.log('==========================================================================');
console.log('Disabling All RLS Policies');
console.log('==========================================================================');
console.log('');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase credentials in .env.development');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableRLS() {
  try {
    // Read migration file
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '022_disable_all_rls.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error('ERROR: Migration file not found:', migrationFile);
      process.exit(1);
    }

    console.log('Reading migration file:', migrationFile);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executing migration...');
    console.log('');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('ERROR: Failed to execute migration');
      console.error(error);
      console.log('');
      console.log('To apply this migration manually:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy the contents of:', migrationFile);
      console.log('3. Paste and execute in the SQL Editor');
      process.exit(1);
    }

    console.log('✓ Migration executed successfully');
    console.log('');
    console.log('All RLS policies have been disabled');
    console.log('All tables now have unrestricted access');
    console.log('');
    console.log('==========================================================================');
    console.log('RLS Policies Disabled Successfully');
    console.log('==========================================================================');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

disableRLS();
