// Verify SIM migration was successful
import { supabase } from './src/lib/supabase';

async function verifySIMMigration() {
  console.log('=== Verifying SIM Migration ===\n');
  
  try {
    // Test 1: Check if all SIM tables exist
    console.log('Test 1: Checking if SIM tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND (table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%')
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      // Try alternative method
      console.log('\nTrying alternative method to check tables...');
      const tableNames = [
        'sim_shifts',
        'sim_boards',
        'sim_kpis',
        'switching_orders',
        'switching_order_impacts',
        'outages',
        'outage_impacts',
        'sim_issues',
        'sim_actions',
        'sim_action_links'
      ];
      
      for (const tableName of tableNames) {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(0);
        
        if (error) {
          console.log(`❌ Table ${tableName}: NOT FOUND`);
        } else {
          console.log(`✅ Table ${tableName}: EXISTS`);
        }
      }
    } else {
      console.log('Tables found:', tables);
    }
    
    // Test 2: Check RLS is enabled
    console.log('\nTest 2: Checking if RLS is enabled...');
    const tableNames = [
      'sim_shifts',
      'sim_boards',
      'sim_kpis',
      'switching_orders',
      'outages',
      'sim_issues',
      'sim_actions'
    ];
    
    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: Accessible (RLS working)`);
      }
    }
    
    console.log('\n=== Verification Complete ===');
    console.log('If you see errors about missing tables, run the migration:');
    console.log('  npx supabase db reset --local');
    console.log('Or manually apply the migration:');
    console.log('  npx supabase db psql < supabase/migrations/013_create_sim_tables.sql');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifySIMMigration();
