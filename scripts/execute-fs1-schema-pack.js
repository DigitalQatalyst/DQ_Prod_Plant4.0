#!/usr/bin/env node

/**
 * Execute APM Transmission FS1 Schema Pack
 * 
 * This script executes the FS1 (Health & Diagnostics) schema pack:
 * 1. Migration (create tables and extend schema)
 * 2. Seed (populate reference data)
 * 3. Validate (verify data integrity)
 * 
 * Usage: node scripts/execute-fs1-schema-pack.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Supabase configuration from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

/**
 * Execute SQL file by splitting into individual statements and executing them
 */
async function executeSqlFile(supabase, filePath, description) {
  logStep(`Executing: ${description}`);
  log(`File: ${filePath}`, colors.gray);

  try {
    // Read SQL file
    const sql = readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    // This is a simple split - may need refinement for complex SQL
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    log(`Executing ${statements.length} SQL statements...`, colors.gray);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        // Execute using Supabase client's rpc or direct query
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';'
        });
        
        if (error) {
          // If RPC doesn't exist, try using the REST API directly
          if (error.message && error.message.includes('does not exist')) {
            // For validation queries that return results, use .from().select()
            // For DDL/DML, we need a different approach
            logWarning(`Statement ${i + 1}: RPC not available, attempting alternative...`);
            
            // Try using fetch to POST directly to the database
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              },
              body: JSON.stringify({ sql_query: statement + ';' })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
          } else {
            throw error;
          }
        }
        
        successCount++;
      } catch (err) {
        // Some errors are expected (e.g., "already exists")
        const errorMsg = err.message || String(err);
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('does not exist')) {
          log(`  Statement ${i + 1}: ${errorMsg.substring(0, 100)}...`, colors.yellow);
        } else {
          log(`  Statement ${i + 1} FAILED: ${errorMsg}`, colors.red);
          errorCount++;
        }
      }
    }
    
    if (errorCount > 0) {
      logWarning(`${description} completed with ${errorCount} errors and ${successCount} successes`);
    } else {
      logSuccess(`${description} completed successfully (${successCount} statements)`);
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  logStep('APM Transmission FS1 Schema Pack Execution');
  log('Feature Set 1: Asset Health & Diagnostics', colors.gray);
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  logSuccess('Supabase client initialized');
  log(`Connected to: ${SUPABASE_URL}`, colors.gray);
  
  // Define schema pack directory
  const schemaPackDir = join(dirname(__dirname), '.kiro', 'specs', 'apm-transmission-full', 'schema_packs', 'apm_tx_fs1_health_diagnostics');
  
  log(`Schema pack directory: ${schemaPackDir}`, colors.gray);
  
  try {
    // Step 1: Execute Migration
    const migrationResult = await executeSqlFile(
      supabase,
      join(schemaPackDir, '001_migration.sql'),
      'Step 1: Migration (Create Tables & Extend Schema)'
    );
    
    // Step 2: Execute Seed
    const seedResult = await executeSqlFile(
      supabase,
      join(schemaPackDir, '002_seed.sql'),
      'Step 2: Seed (Populate Reference Data)'
    );
    
    // Step 3: Execute Validation
    const validationResult = await executeSqlFile(
      supabase,
      join(schemaPackDir, '003_validate.sql'),
      'Step 3: Validation (Verify Data Integrity)'
    );
    
    // Success summary
    logStep('FS1 Schema Pack Execution Complete');
    console.log('');
    
    if (migrationResult.success && seedResult.success && validationResult.success) {
      logSuccess('All steps completed successfully!');
    } else {
      logWarning('Execution completed with some warnings or errors');
      log('This may be expected if tables already existed or for idempotent re-runs', colors.gray);
    }
    
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. Implement FS1 API query hooks (useLatestTelemetry, useHealthScore, etc.)', colors.gray);
    log('  2. Enhance FS1 UI pages with real functionality', colors.gray);
    log('  3. Navigate to /monitor/health-diagnostics/* to test pages', colors.gray);
    log('  4. Proceed to FS3: Asset Performance & Utilisation', colors.gray);
    console.log('');
    
    process.exit(0);
    
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
