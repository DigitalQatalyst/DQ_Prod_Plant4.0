#!/usr/bin/env node

/**
 * Apply FS2 Schema Pack using Supabase Client
 * 
 * This script applies the FS2 migration and seed files using the Supabase JavaScript client.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

logStep('APM Transmission FS2 Schema Pack Application');
log('Feature Set 2: Predictive & Prescriptive Maintenance', colors.gray);
log(`Connected to: ${supabaseUrl}`, colors.gray);
console.log('');

async function executeSQLFile(filePath, description) {
  logStep(`Executing: ${description}`);
  log(`File: ${filePath}`, colors.gray);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Try to execute the SQL using Supabase's RPC
    // Note: This requires a custom RPC function to be set up in Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, provide alternative instructions
      if (error.message && error.message.includes('does not exist')) {
        logWarning('Direct SQL execution not available via Supabase client');
        log('', colors.reset);
        log('Please use one of these methods instead:', colors.yellow);
        log('', colors.reset);
        log('1. Supabase Studio SQL Editor:', colors.cyan);
        log('   - Open http://127.0.0.1:54321', colors.gray);
        log('   - Navigate to SQL Editor', colors.gray);
        log(`   - Copy and paste contents of: ${filePath}`, colors.gray);
        log('   - Execute the SQL', colors.gray);
        log('', colors.reset);
        log('2. PostgreSQL psql client:', colors.cyan);
        log(`   - psql <connection-string> -f ${filePath}`, colors.gray);
        log('', colors.reset);
        return { success: false, needsManual: true };
      } else {
        throw error;
      }
    }
    
    logSuccess(`${description} completed successfully`);
    return { success: true };
  } catch (err) {
    logError(`${description} failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  try {
    // Apply migration file
    const migrationPath = join(dirname(__dirname), 'supabase', 'migrations', '016_apm_fs2_predictive_prescriptive.sql');
    const migrationResult = await executeSQLFile(migrationPath, 'Step 1: Migration (Create Tables & Extend Schema)');
    
    if (migrationResult.needsManual) {
      log('', colors.reset);
      logWarning('Manual application required');
      log('', colors.reset);
      log('Files ready for manual application:', colors.green);
      log(`  1. ${migrationPath}`, colors.gray);
      log(`  2. ${join(dirname(__dirname), 'supabase', 'seed', '010_apm_fs2_seed.sql')}`, colors.gray);
      log(`  3. ${join(dirname(__dirname), '.kiro', 'specs', 'apm-transmission-full', 'schema_packs', 'apm_tx_fs2_predictive_prescriptive', '003_validate.sql')}`, colors.gray);
      log('', colors.reset);
      process.exit(0);
    }
    
    if (!migrationResult.success) {
      throw new Error('Migration failed');
    }
    
    // Apply seed file
    const seedPath = join(dirname(__dirname), 'supabase', 'seed', '010_apm_fs2_seed.sql');
    const seedResult = await executeSQLFile(seedPath, 'Step 2: Seed (Populate Reference Data)');
    
    if (!seedResult.success) {
      throw new Error('Seed failed');
    }
    
    // Apply validation file
    const validationPath = join(dirname(__dirname), '.kiro', 'specs', 'apm-transmission-full', 'schema_packs', 'apm_tx_fs2_predictive_prescriptive', '003_validate.sql');
    const validationResult = await executeSQLFile(validationPath, 'Step 3: Validation (Verify Data Integrity)');
    
    logStep('FS2 Schema Pack Application Complete');
    console.log('');
    
    if (migrationResult.success && seedResult.success && validationResult.success) {
      logSuccess('All steps completed successfully!');
    } else {
      logWarning('Application completed with some warnings');
    }
    
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. Implement FS2 API query hooks (useFailurePredictions, useCBMTriggers, etc.)', colors.gray);
    log('  2. Enhance FS2 UI pages with real functionality', colors.gray);
    log('  3. Navigate to /monitor/predictive-maintenance/* to test pages', colors.gray);
    log('  4. Proceed to FS5: Alerts, Reports & Visualisation', colors.gray);
    console.log('');
    
  } catch (error) {
    logError('Schema pack application failed');
    console.error(error);
    process.exit(1);
  }
}

main();
