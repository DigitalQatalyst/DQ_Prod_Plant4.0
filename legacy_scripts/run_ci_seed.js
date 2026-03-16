const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Create Supabase client for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'REPLACED_SECRET'; // Local anon key from status
const supabase = createClient(supabaseUrl, supabaseKey);

async function runCISeed() {
  try {
    console.log('Reading CI seed file...');
    const seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    console.log('Executing CI seed data...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: seedSQL });
    
    if (error) {
      console.error('Error running CI seed:', error);
      return;
    }
    
    console.log('CI seed completed successfully!');
    
    // Verify the data was inserted
    console.log('\nVerifying CI data...');
    
    // Get tenant ID
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .single();
    
    if (!tenants) {
      console.error('DEWA - Transmission tenant not found');
      return;
    }
    
    const tenantId = tenants.id;
    
    // Check CI projects count
    const { count: projectCount } = await supabase
      .from('ci_projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    // Check CI RCA count
    const { data: projects } = await supabase
      .from('ci_projects')
      .select('id')
      .eq('tenant_id', tenantId);
    
    const projectIds = projects?.map(p => p.id) || [];
    
    const { count: rcaCount } = await supabase
      .from('ci_rca')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds);
    
    // Check countermeasures count
    const { count: countermeasureCount } = await supabase
      .from('ci_countermeasures')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    // Check KPIs count
    const { count: kpiCount } = await supabase
      .from('ci_kpis')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    console.log(`Projects: ${projectCount}`);
    console.log(`RCA records: ${rcaCount}`);
    console.log(`Countermeasures: ${countermeasureCount}`);
    console.log(`KPIs: ${kpiCount}`);
    
    // Verify minimum counts
    if (projectCount >= 12 && rcaCount >= 12 && countermeasureCount >= 30 && kpiCount >= 6) {
      console.log('\n✅ All CI seed data validation passed!');
    } else {
      console.log('\n❌ CI seed data validation failed - some counts are below minimum');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runCISeed();