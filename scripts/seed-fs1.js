/**
 * Seed FS1 Data Script
 * 
 * This script applies the FS1 seed data to the local Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // service_role key for admin access

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('FS1 Seed Data Application');
console.log('='.repeat(80));
console.log(`Connected to: ${supabaseUrl}\n`);

async function main() {
  try {
    const seedPath = join(__dirname, '../supabase/seed/008_apm_fs1_seed.sql');
    console.log(`Reading seed file: ${seedPath}\n`);
    
    const sql = readFileSync(seedPath, 'utf-8');
    
    // Split into DO blocks and other statements
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    for (const line of sql.split('\n')) {
      if (line.trim().startsWith('DO $') || line.trim().startsWith('DO $$')) {
        inDoBlock = true;
        currentStatement = line + '\n';
      } else if (inDoBlock) {
        currentStatement += line + '\n';
        if (line.trim() === 'END $;' || line.trim() === 'END $$;') {
          statements.push(currentStatement.trim());
          currentStatement = '';
          inDoBlock = false;
        }
      } else if (line.trim() && !line.trim().startsWith('--')) {
        currentStatement += line + '\n';
        if (line.trim().endsWith(';') && !inDoBlock) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 5) continue;
      
      try {
        // Execute via Supabase RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.log(`  Statement ${i + 1} FAILED: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
          if (i % 50 === 0) {
            console.log(`  Progress: ${i + 1}/${statements.length} statements...`);
          }
        }
      } catch (err) {
        console.log(`  Statement ${i + 1} FAILED: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('FS1 Seed Data Application Complete');
    console.log('='.repeat(80));
    console.log(`\n✓ Successfully executed ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠ ${errorCount} statements failed`);
    }
    console.log('\nNext Steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to /monitor pages');
    console.log('  3. Select an asset to view telemetry data\n');
    
  } catch (error) {
    console.error('\n✗ Seed application failed:', error);
    process.exit(1);
  }
}

main();
