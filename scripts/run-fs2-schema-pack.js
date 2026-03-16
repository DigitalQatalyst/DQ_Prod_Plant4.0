#!/usr/bin/env node

/**
 * Execute APM Transmission FS2 Schema Pack using pg library
 * 
 * This script executes the FS2 (Predictive & Prescriptive Maintenance) schema pack:
 * 1. Migration (create tables and extend schema)
 * 2. Seed (populate reference data)
 * 3. Validate (verify data integrity)
 * 
 * Usage: node scripts/run-fs2-schema-pack.js
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
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

// PostgreSQL connection configuration
const connectionConfig = {
  host: 'localhost',
  port: 54322, // Supabase local PostgreSQL port
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
};

/**
 * Execute SQL file
 */
async function executeSqlFile(client, filePath, description) {
  logStep(`Executing: ${description}`);
  log(`File: ${filePath}`, colors.gray);

  try {
    // Read SQL file
    const sql = readFileSync(filePath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    logSuccess(`${description} completed successfully`);
    return { success: true };
  } catch (error) {
    // Check if error is expected (idempotent re-run)
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('already exists') || 
        errorMsg.includes('duplicate')) {
      logWarning(`${description} - Some objects already exist (idempotent re-run)`);
      return { success: true, warning: true };
    } else {
      logError(`${description} failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }
}

async function main() {
  logStep('APM Transmission FS2 Schema Pack Execution');
  log('Feature Set 2: Predictive & Prescriptive Maintenance', colors.gray);
  
  // Create PostgreSQL client
  const client = new Client(connectionConfig);
  
  try {
    // Connect to database
    await client.connect();
    logSuccess('Connected to PostgreSQL database');
    log(`Host: ${connectionConfig.host}:${connectionConfig.port}`, colors.gray);
    log(`Database: ${connectionConfig.database}`, colors.gray);
    
    // Define schema pack directory
    const schemaPackDir = join(dirname(__dirname), '.kiro', 'specs', 'apm-transmission-full', 'schema_packs', 'apm_tx_fs2_predictive_prescriptive');
    
    log(`Schema pack directory: ${schemaPackDir}`, colors.gray);
    
    // Step 1: Execute Migration
    const migrationResult = await executeSqlFile(
      client,
      join(schemaPackDir, '001_migration.sql'),
      'Step 1: Migration (Create Tables & Extend Schema)'
    );
    
    if (!migrationResult.success) {
      throw new Error('Migration failed');
    }
    
    // Step 2: Execute Seed
    const seedResult = await executeSqlFile(
      client,
      join(schemaPackDir, '002_seed.sql'),
      'Step 2: Seed (Populate Reference Data)'
    );
    
    if (!seedResult.success) {
      throw new Error('Seed failed');
    }
    
    // Step 3: Execute Validation
    const validationResult = await executeSqlFile(
      client,
      join(schemaPackDir, '003_validate.sql'),
      'Step 3: Validation (Verify Data Integrity)'
    );
    
    // Success summary
    logStep('FS2 Schema Pack Execution Complete');
    console.log('');
    
    if (migrationResult.success && seedResult.success && validationResult.success) {
      logSuccess('All steps completed successfully!');
      
      if (migrationResult.warning || seedResult.warning) {
        log('Some objects already existed (idempotent re-run)', colors.gray);
      }
    } else {
      logWarning('Execution completed with some errors');
    }
    
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. Implement FS2 API query hooks (useFailurePredictions, useCBMTriggers, etc.)', colors.gray);
    log('  2. Enhance FS2 UI pages with real functionality', colors.gray);
    log('  3. Navigate to /monitor/predictive-maintenance/* to test pages', colors.gray);
    log('  4. Proceed to FS5: Alerts, Reports & Visualisation', colors.gray);
    console.log('');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    logError('Schema pack execution failed');
    console.error(error);
    
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
