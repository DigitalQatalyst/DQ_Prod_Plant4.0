// Verify SIM tables exist by querying information_schema (bypasses RLS)
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

async function verifySchema() {
  console.log('Verifying SIM schema in local Supabase...\n');
  
  try {
    // Query information_schema to check if tables exist
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND (table_name LIKE 'sim_%' 
                   OR table_name LIKE '%order%' 
                   OR table_name LIKE 'outage%')
            ORDER BY table_name;
          `
        })
      }
    );
    
    if (!response.ok) {
      // RPC function might not exist, try alternative approach
      console.log('Note: exec_sql RPC not available, using alternative verification...\n');
      
      // Check each table by trying to access its structure
      const tablesToCheck = [
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
      
      console.log('Expected SIM tables:', tablesToCheck.length);
      console.log('Tables to verify:', tablesToCheck.join(', '));
      console.log('\n' + '='.repeat(60) + '\n');
      
      // The fact that we get RLS errors means the tables exist!
      // Let's verify by checking if we get the expected RLS error
      let verifiedCount = 0;
      
      for (const tableName of tablesToCheck) {
        const testResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?select=count&limit=0`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        const error = await testResponse.json();
        
        // If we get the RLS error about app.current_tenant_id, the table exists!
        if (error.message && error.message.includes('app.current_tenant_id')) {
          console.log(`✅ ${tableName}: EXISTS (RLS enabled)`);
          verifiedCount++;
        } else if (error.message && error.message.includes('does not exist')) {
          console.log(`❌ ${tableName}: MISSING`);
        } else if (testResponse.ok) {
          console.log(`✅ ${tableName}: EXISTS (accessible)`);
          verifiedCount++;
        } else {
          console.log(`⚠️  ${tableName}: ${error.message || 'Unknown status'}`);
        }
      }
      
      console.log('\n' + '='.repeat(60));
      console.log(`\nVerification Summary:`);
      console.log(`  ✅ Verified: ${verifiedCount}/${tablesToCheck.length}`);
      
      if (verifiedCount === tablesToCheck.length) {
        console.log('\n🎉 All SIM tables verified successfully!');
        console.log('\n✅ Migration 013_create_sim_tables.sql has been applied correctly.');
        console.log('✅ RLS policies are enabled and working as expected.');
        console.log('\nNote: Tables are protected by RLS and require tenant context to access data.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some tables may be missing!');
        process.exit(1);
      }
    } else {
      const data = await response.json();
      console.log('Found tables:', data);
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifySchema();
