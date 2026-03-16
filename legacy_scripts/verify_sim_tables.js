// Simple verification script using fetch to query Supabase REST API
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

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

async function checkTable(tableName) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=count&limit=0`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (response.ok) {
      const count = response.headers.get('content-range')?.split('/')[1] || '0';
      return { exists: true, count: parseInt(count) };
    } else {
      const error = await response.json();
      return { exists: false, error: error.message };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function verifySIMTables() {
  console.log('Verifying SIM tables in local Supabase...\n');
  console.log('Expected SIM tables:', tablesToCheck.length);
  console.log('Tables to verify:', tablesToCheck.join(', '));
  console.log('\n' + '='.repeat(60) + '\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tableName of tablesToCheck) {
    const result = await checkTable(tableName);
    
    if (result.exists) {
      console.log(`✅ ${tableName}: EXISTS (${result.count} rows)`);
      successCount++;
    } else {
      console.log(`❌ ${tableName}: FAILED`);
      console.log(`   Error: ${result.error}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\nVerification Summary:`);
  console.log(`  ✅ Success: ${successCount}/${tablesToCheck.length}`);
  console.log(`  ❌ Failed:  ${failCount}/${tablesToCheck.length}`);
  
  if (successCount === tablesToCheck.length) {
    console.log('\n🎉 All SIM tables verified successfully!');
    console.log('\nMigration 013_create_sim_tables.sql has been applied correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tables are missing or have errors!');
    process.exit(1);
  }
}

verifySIMTables();
