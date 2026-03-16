import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCISeed() {
  try {
    console.log('LOCAL DATABASE ONLY: Verifying connection to localhost...');
    console.log(`Connecting to: ${supabaseUrl}\n`);
    
    // Verify we're connected to local database
    if (!supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
      console.error('❌ ERROR: Not connected to local database! Aborting.');
      process.exit(1);
    }
    
    console.log('✅ Confirmed connection to LOCAL database\n');
    
    console.log('Reading CI seed file...');
    const seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    console.log('Executing CI seed data...');
    console.log('This will create:');
    console.log('  - 6 CI stages');
    console.log('  - 12 CI projects');
    console.log('  - 12 RCA records');
    console.log('  - 30 countermeasures');
    console.log('  - 6 KPIs');
    console.log('  - 12 impact measurements');
    console.log('  - 20 document metadata records\n');
    
    // Execute the entire SQL file as one transaction
    // Note: This requires direct database access via pg library
    const { Client } = await import('pg');
    const client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres'
    });
    
    await client.connect();
    console.log('Connected to PostgreSQL directly\n');
    
    try {
      await client.query(seedSQL);
      console.log('SQL executed successfully');
    } catch (err) {
      console.error('Error executing SQL:', err.message);
      throw err;
    } finally {
      await client.end();
    }
    
    console.log('\n✅ CI seed execution completed!\n');
    
    // Verify the data was inserted
    console.log('Verifying CI data...\n');
    
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();
    
    if (tenantError || !tenants) {
      console.error('❌ DEWA - Transmission tenant not found');
      console.error('Error:', tenantError);
      return;
    }
    
    const tenantId = tenants.id;
    console.log(`Found tenant: ${tenantId}\n`);
    
    // Check CI projects count
    const { count: projectCount, error: projectError } = await supabase
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
    
    console.log('Verification Results:');
    console.log(`  Projects: ${projectCount} (expected >= 12)`);
    console.log(`  RCA records: ${rcaCount} (expected >= 12)`);
    console.log(`  Countermeasures: ${countermeasureCount} (expected >= 30)`);
    console.log(`  KPIs: ${kpiCount} (expected >= 6)\n`);
    
    // Verify minimum counts
    const allPassed = projectCount >= 12 && rcaCount >= 12 && countermeasureCount >= 30 && kpiCount >= 6;
    
    if (allPassed) {
      console.log('✅ All CI seed data validation passed!');
    } else {
      console.log('❌ CI seed data validation failed - some counts are below minimum');
      if (projectCount < 12) console.log(`  ❌ Projects: ${projectCount} < 12`);
      if (rcaCount < 12) console.log(`  ❌ RCA: ${rcaCount} < 12`);
      if (countermeasureCount < 30) console.log(`  ❌ Countermeasures: ${countermeasureCount} < 30`);
      if (kpiCount < 6) console.log(`  ❌ KPIs: ${kpiCount} < 6`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runCISeed();
