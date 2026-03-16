#!/usr/bin/env node
/**
 * Apply Disable RLS Migration
 * 
 * This script directly executes the SQL to disable all RLS policies
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

// List of all tables to disable RLS on
const tables = [
  // Core tables
  'tenants', 'sites', 'asset_types', 'assets', 'alerts',
  // Telemetry tables
  'tags', 'telemetry_points', 'telemetry_parameters', 'telemetry_data',
  // Grid topology tables
  'grid_nodes', 'grid_lines', 'grid_asset_links',
  // Operational data
  'operational_data',
  // FS4 tables
  'asset_relationships', 'asset_lifecycle_events', 'asset_criticality_model',
  'fmea_entries', 'spare_parts', 'asset_spare_parts',
  // FS1 tables
  'asset_parameter_map', 'health_models', 'health_scores',
  'diagnostic_events', 'downtime_events', 'rca_records',
  // FS3 tables
  'reliability_metrics', 'utilisation_metrics', 'performance_deviations',
  'performance_benchmarks',
  // FS2 tables
  'failure_predictions', 'cbm_triggers', 'maintenance_recommendations',
  'risk_scoring_model',
  // FS5 tables
  'apm_alerts', 'apm_alert_history', 'dashboards', 'dashboard_widgets',
  'report_runs', 'export_jobs',
  // Audit logs
  'audit_logs'
];

async function disableRLSForTable(tableName) {
  try {
    // First, get all policies for this table
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', tableName);

    if (!policiesError && policies && policies.length > 0) {
      console.log(`  Dropping ${policies.length} policies from ${tableName}...`);
      
      // Drop each policy
      for (const policy of policies) {
        const dropPolicySQL = `DROP POLICY IF EXISTS "${policy.policyname}" ON ${tableName};`;
        await supabase.rpc('exec', { sql: dropPolicySQL }).catch(() => {
          // Ignore errors, policy might not exist
        });
      }
    }

    // Disable RLS on the table
    const disableRLSSQL = `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;`;
    
    // We'll use a direct query since exec_sql doesn't exist
    // This will work if the service role has proper permissions
    console.log(`  Disabling RLS on ${tableName}...`);
    
    // Note: This approach won't work without a proper exec function
    // The user will need to run the SQL manually
    
    return true;
  } catch (error) {
    console.error(`  Error processing ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('NOTE: Supabase client cannot execute DDL statements directly.');
  console.log('You need to apply the migration manually using one of these methods:');
  console.log('');
  console.log('METHOD 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to your Supabase project dashboard');
  console.log('  2. Navigate to SQL Editor');
  console.log('  3. Copy and paste the contents of:');
  console.log('     supabase/migrations/022_disable_all_rls.sql');
  console.log('  4. Click "Run" to execute');
  console.log('');
  console.log('METHOD 2: Using psql (if you have database credentials)');
  console.log('  psql -h <host> -U postgres -d postgres -f supabase/migrations/022_disable_all_rls.sql');
  console.log('');
  console.log('METHOD 3: Supabase CLI (if installed)');
  console.log('  supabase db push');
  console.log('');
  
  // Read and display the migration file
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '022_disable_all_rls.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  console.log('==========================================================================');
  console.log('Migration SQL (copy this to Supabase SQL Editor):');
  console.log('==========================================================================');
  console.log('');
  console.log(sql);
}

main();
