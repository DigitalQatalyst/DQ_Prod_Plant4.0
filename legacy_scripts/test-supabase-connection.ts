// Test Supabase connection and query tenants
import { supabase } from './src/lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('Supabase client:', supabase ? 'initialized' : 'NOT initialized');
  
  if (!supabase) {
    console.error('Supabase client is not initialized!');
    console.error('Check your .env.development file');
    return;
  }
  
  try {
    // Test 1: Check if tenants table exists
    console.log('\n=== Test 1: Query all tenants ===');
    const { data: allTenants, error: allError } = await supabase
      .from('tenants')
      .select('*');
    
    if (allError) {
      console.error('Error querying all tenants:', allError);
    } else {
      console.log('All tenants:', JSON.stringify(allTenants, null, 2));
      console.log('Total tenants:', allTenants?.length || 0);
    }
    
    // Test 2: Query power sector tenants
    console.log('\n=== Test 2: Query power sector tenants ===');
    const { data: powerTenants, error: powerError } = await supabase
      .from('tenants')
      .select('*')
      .eq('sector', 'power');
    
    if (powerError) {
      console.error('Error querying power tenants:', powerError);
    } else {
      console.log('Power tenants:', JSON.stringify(powerTenants, null, 2));
      console.log('Total power tenants:', powerTenants?.length || 0);
    }
    
    // Test 3: Check sites table
    console.log('\n=== Test 3: Query sites ===');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*');
    
    if (sitesError) {
      console.error('Error querying sites:', sitesError);
    } else {
      console.log('Total sites:', sites?.length || 0);
      if (sites && sites.length > 0) {
        console.log('First site:', JSON.stringify(sites[0], null, 2));
      }
    }
    
    // Test 4: Check grid_nodes table
    console.log('\n=== Test 4: Query grid_nodes ===');
    const { data: nodes, error: nodesError } = await supabase
      .from('grid_nodes')
      .select('*');
    
    if (nodesError) {
      console.error('Error querying grid_nodes:', nodesError);
    } else {
      console.log('Total grid nodes:', nodes?.length || 0);
      if (nodes && nodes.length > 0) {
        console.log('First node:', JSON.stringify(nodes[0], null, 2));
      }
    }
    
    // Test 5: Verify SIM tables exist
    console.log('\n=== Test 5: Verify SIM tables ===');
    const simTables = [
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
    
    let allSimTablesExist = true;
    
    for (const tableName of simTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          allSimTablesExist = false;
        } else {
          console.log(`✅ ${tableName}: Table exists and is queryable`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Unexpected error`);
        allSimTablesExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allSimTablesExist) {
      console.log('🎉 SUCCESS: All SIM tables were created successfully!');
    } else {
      console.log('⚠️  WARNING: Some SIM tables are missing or have issues');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
