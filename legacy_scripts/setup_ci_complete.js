import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCI() {
  console.log('='.repeat(60));
  console.log('CI (Continuous Improvement) Setup Script');
  console.log('='.repeat(60));
  console.log('\nLOCAL DATABASE ONLY: Verifying connection to localhost...');
  console.log(`Connecting to: ${supabaseUrl}\n`);
  
  // Verify we're connected to local database
  if (!supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
    console.error('❌ ERROR: Not connected to local database! Aborting.');
    process.exit(1);
  }
  
  console.log('✅ Confirmed connection to LOCAL database\n');
  
  try {
    // Step 1: Check if CI tables exist
    console.log('Step 1: Checking if CI tables exist...');
    const { data: tables, error: tableError } = await supabase
      .from('ci_projects')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('❌ CI tables do not exist. Running migration first...\n');
      
      // Run migration
      console.log('Step 2: Running CI migration (015_create_ci_tables.sql)...');
      const migrationSQL = fs.readFileSync('supabase/migrations/015_create_ci_tables.sql', 'utf8');
      
      const client = new Client({
        host: '127.0.0.1',
        port: 54322,
        database: 'postgres',
        user: 'postgres',
        password: 'postgres'
      });
      
      await client.connect();
      await client.query(migrationSQL);
      await client.end();
      
      console.log('✅ Migration completed successfully\n');
    } else {
      console.log('✅ CI tables already exist\n');
    }
    
    // Step 3: Run seed data
    console.log('Step 3: Running CI seed data (009_ci_seed.sql)...');
    console.log('This will create:');
    console.log('  - 6 CI stages');
    console.log('  - 12 CI projects');
    console.log('  - 12 RCA records');
    console.log('  - 30 countermeasures');
    console.log('  - 6 KPIs');
    console.log('  - 12 impact measurements');
    console.log('  - 20 document metadata records\n');
    
    const seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    const client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres'
    });
    
    await client.connect();
    
    try {
      await client.query(seedSQL);
      console.log('✅ Seed data executed successfully\n');
    } catch (err) {
      console.error('❌ Error executing seed:', err.message);
      throw err;
    } finally {
      await client.end();
    }
    
    // Step 4: Verify the data
    console.log('Step 4: Verifying CI seed data...\n');
    
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .single();
    
    if (!tenants) {
      console.error('❌ DEWA - Transmission tenant not found');
      return;
    }
    
    const tenantId = tenants.id;
    console.log(`Found tenant: ${tenants.name} (${tenantId})\n`);
    
    // Check counts
    const { count: projectCount } = await supabase
      .from('ci_projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    const { data: projects } = await supabase
      .from('ci_projects')
      .select('id')
      .eq('tenant_id', tenantId);
    
    const projectIds = projects?.map(p => p.id) || [];
    
    const { count: rcaCount } = await supabase
      .from('ci_rca')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds);
    
    const { count: countermeasureCount } = await supabase
      .from('ci_countermeasures')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    const { count: kpiCount } = await supabase
      .from('ci_kpis')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    console.log('Verification Results:');
    console.log('='.repeat(60));
    console.log(`Projects:        ${projectCount || 0} (expected >= 12)`);
    console.log(`RCA records:     ${rcaCount || 0} (expected >= 12)`);
    console.log(`Countermeasures: ${countermeasureCount || 0} (expected >= 30)`);
    console.log(`KPIs:            ${kpiCount || 0} (expected >= 6)`);
    console.log('='.repeat(60));
    
    const allPassed = projectCount >= 12 && rcaCount >= 12 && countermeasureCount >= 30 && kpiCount >= 6;
    
    if (allPassed) {
      console.log('\n✅ SUCCESS: All CI seed data validation passed!');
      console.log('\nTask 14 (CI Seed Data) is complete.');
    } else {
      console.log('\n❌ FAILED: Some counts are below minimum\n');
      if (projectCount < 12) console.log(`  ❌ Projects: ${projectCount} < 12`);
      if (rcaCount < 12) console.log(`  ❌ RCA: ${rcaCount} < 12`);
      if (countermeasureCount < 30) console.log(`  ❌ Countermeasures: ${countermeasureCount} < 30`);
      if (kpiCount < 6) console.log(`  ❌ KPIs: ${kpiCount} < 6`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupCI();
