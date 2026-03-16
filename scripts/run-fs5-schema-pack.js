#!/usr/bin/env node

/**
 * Execute APM Transmission FS5 Schema Pack
 * 
 * This script executes the FS5 schema pack directly against Supabase:
 * 1. Migration (create tables for alerts, dashboards, reports, exports)
 * 2. Seed (populate sample data)
 * 3. Validate (verify data integrity)
 * 
 * Usage: node scripts/run-fs5-schema-pack.js
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
    
    // Execute SQL using Supabase's query method
    // Note: We need to execute this as a raw SQL query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      if (error.message && error.message.includes('function public.exec_sql')) {
        log('exec_sql function not found, trying direct query...', colors.yellow);
        
        // For direct query, we need to split and execute statements
        // This is a simplified approach - in production you'd want better SQL parsing
        const statements = sql
          .split(/;\s*$/gm)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          if (statement) {
            const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
            if (stmtError) {
              throw stmtError;
            }
          }
        }
        
        logSuccess(`${description} completed successfully (direct query)`);
        return { success: true };
      }
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
  logStep('APM Transmission FS5 Schema Pack Execution');
  
  // Validate environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logError('Missing Supabase credentials in .env.development');
    log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', colors.gray);
    process.exit(1);
  }
  
  logSuccess('Environment variables loaded');
  log(`Supabase URL: ${supabaseUrl}`, colors.gray);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  logSuccess('Supabase client initialized');
  
  // Define schema pack directory
  const schemaPackDir = path.join(
    __dirname,
    '..',
    '.kiro',
    'specs',
    'apm-transmission-full',
    'schema_packs',
    'apm_tx_fs5_alerts_reports'
  );
  
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
      'Seed (Populate Sample Data)'
    );
    
    // Step 3: Execute Validation
    await executeSqlFile(
      supabase,
      path.join(schemaPackDir, '003_validate.sql'),
      'Validation (Verify Data Integrity)'
    );
    
    // Success summary
    logStep('FS5 Schema Pack Execution Complete');
    console.log('');
    logSuccess('All steps completed successfully!');
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. Implement FS5 API query hooks (useAlerts, useDashboards, etc.)', colors.gray);
    log('  2. Enhance FS5 UI pages with real functionality', colors.gray);
    log('  3. Test alert generation and dashboard rendering', colors.gray);
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
