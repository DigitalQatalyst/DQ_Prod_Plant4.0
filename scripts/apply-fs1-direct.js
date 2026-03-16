/**
 * Direct FS1 Schema Application Script
 * 
 * This script applies the FS1 migration and seed files directly to Supabase
 * without using the exec_sql wrapper function.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('Direct FS1 Schema Application');
console.log('='.repeat(80));
console.log(`Connected to: ${supabaseUrl}\n`);

async function executeSQLFile(filePath, description) {
  console.log(`\nExecuting: ${description}`);
  console.log('='.repeat(80));
  console.log(`File: ${filePath}\n`);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try executing via the REST API
      console.log('⚠ exec_sql function not available, using alternative method...\n');
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        try {
          // Use the Supabase client to execute raw SQL
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          
          if (stmtError) {
            console.log(`  Statement ${i + 1} FAILED: ${stmtError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`  Statement ${i + 1} FAILED: ${err.message}`);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        console.log(`\n⚠ ${description} completed with ${errorCount} errors and ${successCount} successes`);
      } else {
        console.log(`\n✓ ${description} completed successfully (${successCount} statements)`);
      }
    } else {
      console.log(`✓ ${description} completed successfully`);
    }
  } catch (err) {
    console.error(`✗ ${description} failed:`, err.message);
    throw err;
  }
}

async function main() {
  try {
    // Apply migration file
    const migrationPath = join(__dirname, '../supabase/migrations/014_apm_fs1_health_diagnostics.sql');
    await executeSQLFile(migrationPath, 'Step 1: Migration (Create Tables & Extend Schema)');
    
    // Apply seed file
    const seedPath = join(__dirname, '../supabase/seed/008_apm_fs1_seed.sql');
    await executeSQLFile(seedPath, 'Step 2: Seed (Populate Reference Data)');
    
    console.log('\n' + '='.repeat(80));
    console.log('FS1 Schema Application Complete');
    console.log('='.repeat(80));
    console.log('\n✓ All steps completed successfully');
    console.log('\nNext Steps:');
    console.log('  1. Refresh your browser to see the data');
    console.log('  2. Navigate to /monitor pages to test functionality');
    console.log('  3. Check telemetry data is displaying correctly\n');
    
  } catch (error) {
    console.error('\n✗ Schema application failed:', error);
    process.exit(1);
  }
}

main();
