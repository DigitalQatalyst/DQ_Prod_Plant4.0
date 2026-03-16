#!/usr/bin/env node

/**
 * Verify APM Transmission All Feature Sets Data
 * 
 * This script verifies that all FS tables have data.
 * 
 * Usage: node scripts/verify-all-fs-data.js
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
    return -1; // Indicates error
  }
}

async function main() {
  logStep('APM Transmission All Feature Sets Data Verification');
  
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
  
  // Tables to check by feature set
  const featureSets = {
    'FS4: Asset Inventory & Criticality': [
      'assets',
      'fmea_entries',
      'spare_parts',
    ],
    'FS1: Asset Health & Diagnostics': [
      'health_scores',
      'diagnostic_events',
      'rca_records',
    ],
    'FS3: Asset Performance & Utilisation': [
      'downtime_events',
      'reliability_metrics',
      'utilisation_metrics',
      'performance_benchmarks',
    ],
    'FS2: Predictive & Prescriptive Maintenance': [
      'failure_predictions',
      'cbm_triggers',
      'maintenance_recommendations',
    ],
    'FS5: Alerts, Reports & Visualisation': [
      'apm_alerts',
      'apm_alert_history',
      'dashboards',
      'dashboard_widgets',
      'report_runs',
      'export_jobs',
    ],
  };
  
  let totalRows = 0;
  let emptyTables = [];
  
  for (const [fsName, tables] of Object.entries(featureSets)) {
    logStep(fsName);
    
    for (const table of tables) {
      const count = await getTableCount(supabase, table);
      
      if (count === -1) {
        logError(`${table}: ERROR (table may not exist)`);
      } else if (count === 0) {
        log(`  ${table}: EMPTY`, colors.yellow);
        emptyTables.push({ fs: fsName, table });
      } else {
        logSuccess(`${table}: ${count} rows`);
        totalRows += count;
      }
    }
  }
  
  // Summary
  logStep('Summary');
  console.log('');
  logSuccess(`Total rows across all tables: ${totalRows}`);
  console.log('');
  
  if (emptyTables.length > 0) {
    log(`Empty tables (${emptyTables.length}):`, colors.yellow);
    emptyTables.forEach(({ fs, table }) => {
      log(`  ${fs}: ${table}`, colors.gray);
    });
    console.log('');
    log('To populate data:', colors.cyan);
    log('  1. Run: npx supabase db reset (resets and runs all seeds)', colors.gray);
    log('  2. Or manually run seed files in supabase/seed/', colors.gray);
    console.log('');
  } else {
    logSuccess('All tables have data!');
    console.log('');
  }
}

// Run the script
main().catch((error) => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
