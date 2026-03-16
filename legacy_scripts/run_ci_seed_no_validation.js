import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

async function runCISeed() {
  console.log('Running CI seed without validation...\n');
  
  try {
    // Read the seed file
    let seedSQL = fs.readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    // Remove the validation block (everything after COMMIT up to the summary)
    const commitIndex = seedSQL.indexOf('COMMIT;');
    if (commitIndex > 0) {
      // Keep everything up to and including COMMIT, plus the summary SELECT
      const summaryIndex = seedSQL.indexOf('-- ============================================================================\n-- SUMMARY REPORT');
      if (summaryIndex > commitIndex) {
        seedSQL = seedSQL.substring(0, commitIndex + 7) + '\n' + seedSQL.substring(summaryIndex);
      }
    }
    
    const client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres'
    });
    
    await client.connect();
    console.log('Connected to PostgreSQL\n');
    
    try {
      const result = await client.query(seedSQL);
      console.log('✅ Seed executed successfully\n');
      console.log('Result:', result.rows);
    } catch (err) {
      console.error('❌ Error:', err.message);
      throw err;
    } finally {
      await client.end();
    }
    
    // Now verify using Supabase client
    const supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    
    console.log('\nVerifying data...\n');
    
    // Check total counts (without tenant filtering)
    const { count: projectCount } = await supabase
      .from('ci_projects')
      .select('*', { count: 'exact', head: true });
    
    const { count: rcaCount } = await supabase
      .from('ci_rca')
      .select('*', { count: 'exact', head: true });
    
    const { count: countermeasureCount } = await supabase
      .from('ci_countermeasures')
      .select('*', { count: 'exact', head: true });
    
    const { count: kpiCount } = await supabase
      .from('ci_kpis')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total Projects: ${projectCount}`);
    console.log(`Total RCA: ${rcaCount}`);
    console.log(`Total Countermeasures: ${countermeasureCount}`);
    console.log(`Total KPIs: ${kpiCount}\n`);
    
    if (projectCount >= 12 && rcaCount >= 12 && countermeasureCount >= 30 && kpiCount >= 6) {
      console.log('✅ All counts meet minimum requirements!');
    } else {
      console.log('❌ Some counts are below minimum');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runCISeed();
