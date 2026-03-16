import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function runSeed() {
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
    
    // Read and execute the seed
    const seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    console.log('Running CI seed...');
    await client.query(seedSQL);
    console.log('CI seed completed successfully');
    
    // Run the verification query from the task
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as projects,
        (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as rca,
        (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as countermeasures,
        (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as kpis;
    `);
    
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

runSeed();