import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function clearAndSeed() {
  const client = new Client({
    host: 'localhost',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Get tenant ID
    const tenantResult = await client.query("SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1");
    if (tenantResult.rows.length === 0) {
      console.error('DEWA - Transmission tenant not found');
      return;
    }
    const tenantId = tenantResult.rows[0].id;
    console.log('Found tenant ID:', tenantId);
    
    // Clear existing CI data for this tenant
    console.log('Clearing existing CI data...');
    await client.query('DELETE FROM ci_documents WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM ci_impacts WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM ci_kpi_links WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM ci_countermeasures WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM ci_project_links WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM ci_projects WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM ci_kpis WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM ci_stages WHERE tenant_id = $1', [tenantId]);
    
    console.log('Existing CI data cleared');
    
    // Read and execute the seed
    const seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    console.log('Running CI seed...');
    await client.query(seedSQL);
    console.log('CI seed completed successfully');
    
    // Run the verification query from the task
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = $1) as projects,
        (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = $1)) as rca,
        (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = $1) as countermeasures,
        (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = $1) as kpis;
    `, [tenantId]);
    
    console.log('Verification results:', result.rows[0]);
    
    const counts = result.rows[0];
    console.log(`Projects: ${counts.projects} (expected >= 12)`);
    console.log(`RCA: ${counts.rca} (expected >= 12)`);
    console.log(`Countermeasures: ${counts.countermeasures} (expected >= 30)`);
    console.log(`KPIs: ${counts.kpis} (expected >= 6)`);
    
    // Check if all requirements are met
    const allRequirementsMet = 
      counts.projects >= 12 &&
      counts.rca >= 12 &&
      counts.countermeasures >= 30 &&
      counts.kpis >= 6;
    
    if (allRequirementsMet) {
      console.log('✅ All seed requirements met!');
    } else {
      console.log('❌ Some seed requirements not met');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

clearAndSeed();