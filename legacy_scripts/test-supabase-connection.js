// Test Supabase connection and query tenants
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Check if tenants table exists
    console.log('\n=== Test 1: Query all tenants ===');
    const { data: allTenants, error: allError } = await supabase
      .from('tenants')
      .select('*');
    
    if (allError) {
      console.error('Error querying all tenants:', allError);
    } else {
      console.log('All tenants:', allTenants);
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
      console.log('Power tenants:', powerTenants);
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
      console.log('Sites:', sites);
      console.log('Total sites:', sites?.length || 0);
    }
    
    // Test 4: Check grid_nodes table
    console.log('\n=== Test 4: Query grid_nodes ===');
    const { data: nodes, error: nodesError } = await supabase
      .from('grid_nodes')
      .select('*');
    
    if (nodesError) {
      console.error('Error querying grid_nodes:', nodesError);
    } else {
      console.log('Grid nodes:', nodes);
      console.log('Total grid nodes:', nodes?.length || 0);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
