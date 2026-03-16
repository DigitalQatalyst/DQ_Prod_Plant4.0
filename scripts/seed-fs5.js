#!/usr/bin/env node

/**
 * Execute APM Transmission FS5 Seed Script
 * 
 * This script executes the FS5 seed script using the Supabase client.
 * 
 * Usage: node scripts/seed-fs5.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.development' });

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

async function executeSqlFile(supabase, filePath, description) {
  logStep(`Executing: ${description}`);
  log(`File: ${filePath}`, colors.gray);

  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute SQL using Supabase's RPC
    // We'll use a custom function or direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, we need to use a different approach
      // For now, we'll just throw the error
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
  logStep('APM Transmission FS5 Seed Execution');
  
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
  
  // Define seed file path
  const seedFile = path.join(__dirname, '..', 'supabase', 'seed', '011_apm_fs5_seed.sql');
  
  if (!fs.existsSync(seedFile)) {
    logError(`Seed file not found: ${seedFile}`);
    process.exit(1);
  }
  logSuccess('Seed file found');
  
  try {
    // Execute seed
    await executeSqlFile(
      supabase,
      seedFile,
      'FS5 Seed (Populate Sample Data)'
    );
    
    // Success summary
    logStep('FS5 Seed Execution Complete');
    console.log('');
    logSuccess('Seed completed successfully!');
    console.log('');
    
  } catch (error) {
    logError('Seed execution failed');
    log('Note: Supabase client may not support direct SQL execution.', colors.yellow);
    log('Try using: npx supabase db reset (to run all migrations and seeds)', colors.yellow);
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
