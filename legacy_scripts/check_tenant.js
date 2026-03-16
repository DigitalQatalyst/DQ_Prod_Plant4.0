import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
  console.log('Checking tenants in local Supabase...\n');
  
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, sector')
      .eq('sector', 'power')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Power sector tenants:');
    tenants.forEach(tenant => {
      console.log(`- ID: ${tenant.id}`);
      console.log(`  Name: ${tenant.name}`);
      console.log(`  Sector: ${tenant.sector}\n`);
    });
    
    if (tenants.length > 0) {
      const testTenantId = tenants[0].id;
      console.log(`Using tenant ID for tests: ${testTenantId}\n`);
      
      // Check SIM boards for this tenant
      const { data: boards, error: boardsError } = await supabase
        .from('sim_boards')
        .select('*')
        .eq('tenant_id', testTenantId)
        .limit(3);
      
      if (boardsError) {
        console.error('Error checking SIM boards:', boardsError);
      } else {
        console.log(`SIM boards for tenant ${testTenantId}: ${boards.length} found`);
        if (boards.length > 0) {
          console.log('Sample board:', boards[0]);
        }
      }
    }
    
  } catch (err) {
    console.error('Connection error:', err);
  }
}

checkTenants();