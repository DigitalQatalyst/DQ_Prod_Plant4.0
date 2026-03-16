#!/usr/bin/env node

/**
 * Verify APM Transmission FS5 Migration
 * 
 * This script verifies that the FS5 tables were created successfully.
 * 
 * Usage: node scripts/verify-fs5-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        return false;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getTableCount(supabase, tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

async function main() {
  logStep('APM Transmission FS5 Migration Verification');
  
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
  
  // Tables to check
  const tables = [
    'apm_alerts',
    'apm_alert_history',
    'dashboards',
    'dashboard_widgets',
    'report_runs',
    'export_jobs',
  ];
  
  logStep('Checking FS5 Tables');
  
  let allTablesExist = true;
  const tableStatus = [];
  
  for (const table of tables) {
    const exists = await checkTableExists(supabase, table);
    const count = exists ? await getTableCount(supabase, table) : 0;
    
    tableStatus.push({ table, exists, count });
    
    if (exists) {
      logSuccess(`${table}: EXISTS (${count} rows)`);
    } else {
      logError(`${table}: MISSING`);
      allTablesExist = false;
    }
  }
  
  // Summary
  logStep('Verification Summary');
  console.log('');
  
  if (allTablesExist) {
    logSuccess('All FS5 tables exist!');
    console.log('');
    log('Table Summary:', colors.cyan);
    tableStatus.forEach(({ table, count }) => {
      log(`  ${table}: ${count} rows`, colors.gray);
    });
    console.log('');
    
    const totalRows = tableStatus.reduce((sum, { count }) => sum + count, 0);
    if (totalRows === 0) {
      log('Note: Tables are empty. Run seed scripts to populate data.', colors.yellow);
      log('  Seed file: supabase/seed/011_apm_fs5_seed.sql', colors.gray);
      log('  Or run: npx supabase db reset', colors.gray);
    } else {
      logSuccess(`Total rows across all tables: ${totalRows}`);
    }
    
    console.log('');
    log('Next Steps:', colors.cyan);
    log('  1. If tables are empty, run seed scripts', colors.gray);
    log('  2. Implement FS5 API query hooks', colors.gray);
    log('  3. Enhance FS5 UI pages with real functionality', colors.gray);
    console.log('');
    
  } else {
    logError('Some FS5 tables are missing!');
    console.log('');
    log('Run migration again:', colors.yellow);
    log('  npx supabase db reset', colors.gray);
    console.log('');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
