import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function runMigration() {
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
    
    // Read and execute the migration
    const migrationSQL = fs.readFileSync('supabase/migrations/015_create_ci_tables.sql', 'utf8');
    
    console.log('Running CI migration...');
    await client.query(migrationSQL);
    console.log('CI migration completed successfully');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ci_%'
      ORDER BY table_name
    `);
    
    console.log('CI tables created:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();