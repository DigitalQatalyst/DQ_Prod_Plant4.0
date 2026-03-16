#!/usr/bin/env node

/**
 * Execute APM Transmission FS4 Schema Pack
 * 
 * This script executes the FS4 schema pack using the Supabase client:
 * 1. Migration (create tables and extend schema)
 * 2. Seed (populate reference data)
 * 3. Validate (verify data integrity)
 * 
 * Usage: node scripts/run-fs4-schema-pack.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(message) {
  console.log('');
  log(message, colors.cyan);
  log('='.repeat(80), colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

async function executeSqlFile(supabase, filePath, description) {
  logStep(`Executing: ${description}`);
  log(`File: ${filePath}`, colors.gray);

  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase client doesn't support multi-statement SQL directly
    // We need to use the REST API or split statements
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    logSuccess(`${description} completed successfully`);
    return { success: true, data };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  logStep('APM Transmission FS4 Schema Pack Execution');
  
  // Validate environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logError('Missing Supabase credentials in .env.development');
    log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', colors.gray);
    process.exit(1);
  }
  
  logSuccess('Environment variables loaded');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  logSuccess('Supabase client initialized');
  
  // Define schema pack directory
  const schemaPackDir = path.join(__dirname, 'apm_tx_fs4_inventory_criticality');
  
  // Validate schema pack files exist
  const requiredFiles = [
    '001_migration.sql',
    '002_seed.sql',
    '003_validate.sql',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(schemaPackDir, file);
    if (!fs.existsSync(filePath)) {
      logError(`Required file not found: ${filePath}`);
      process.exit(1);
    }
  }
  logSuccess('All required SQL files found');
  
  try {
    // Step 1: Execute Migration
    await executeSqlFile(
      supabase,
      path.join(schemaPackDir, '001_migration.sql'),
      'Migration (Create Tables)'
    );
    
    // Step 2: Execute Seed
    await executeSqlFile(
      supabase,
      path.join(schemaPackDir, '002_seed.sql'),
      'Seed (Populate Reference Data)'
    );
    
    // Step 3: Execute Validation
    const validationResult = await executeSqlFile(
      supabase,
      path.join(schemaPackDir, '003_validate.sql'),
      'Validation (Verify Data Integrity)'
    );
    
    // Check validation results
    if (validationResult.data && JSON.stringify(validationResult.data).includes('FAIL')) {
      logWarning('Validation completed with failures');
      log('Review the output above for details', colors.yellow);
      process.exit(1);
    }
    
    // Success summary
    logStep('FS4 Schema Pack Execution Complete');
    console.log('');
    logSuccess('All steps completed successfully!');
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. Test API hooks (useAssets, useFMEAEntries, useSpareParts)', colors.gray);
    log('  2. Verify UI pages display data correctly', colors.gray);
    log('  3. Proceed to FS1: Asset Health & Diagnostics', colors.gray);
    console.log('');
    
  } catch (error) {
    logError('Schema pack execution failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
