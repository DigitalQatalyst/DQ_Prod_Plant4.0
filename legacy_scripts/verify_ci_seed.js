import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCISeed() {
  try {
    console.log('Verifying CI seed data...\n');
    
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .single();
    
    if (tenantError || !tenants) {
      console.error('❌ DEWA - Transmission tenant not found');
      console.error('Error:', tenantError);
      return;
    }
    
    const tenantId = tenants.id;
    console.log(`Found tenant: ${tenants.name} (${tenantId})\n`);
    
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
    
    console.log('CI Seed Verification Results:');
    console.log('=============================');
    console.log(`Projects:        ${projectCount || 0} (expected >= 12)`);
    console.log(`RCA records:     ${rcaCount || 0} (expected >= 12)`);
    console.log(`Countermeasures: ${countermeasureCount || 0} (expected >= 30)`);
    console.log(`KPIs:            ${kpiCount || 0} (expected >= 6)\n`);
    
    // Verify minimum counts
    const allPassed = projectCount >= 12 && rcaCount >= 12 && countermeasureCount >= 30 && kpiCount >= 6;
    
    if (allPassed) {
      console.log('✅ All CI seed data validation passed!');
    } else {
      console.log('❌ CI seed data validation failed - some counts are below minimum\n');
      if (projectCount < 12) console.log(`  ❌ Projects: ${projectCount} < 12`);
      if (rcaCount < 12) console.log(`  ❌ RCA: ${rcaCount} < 12`);
      if (countermeasureCount < 30) console.log(`  ❌ Countermeasures: ${countermeasureCount} < 30`);
      if (kpiCount < 6) console.log(`  ❌ KPIs: ${kpiCount} < 6`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCISeed();
