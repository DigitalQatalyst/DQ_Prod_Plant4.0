
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Fallback or need to check environment

// We might need the service role key to bypass RLS for verification if ANON is restricted.
// For local dev, usually found in .env or output of `supabase status`
// I'll try with what I can find or just use a direct PG connection if this fails.
// Let's assume standard local def for now.

async function checkCounts() {
  // Hardcoding local service_role key for standard supabase local dev if env not present
  // precise key often: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjQ0OTc5NywiZXhwIjoxOTMyMDI1Nzk3fQ.
  // But better to try to read it from a file if possible, or just use the public key and see if RLS blocks.
  
  // Note: In local dev, usually we can use the anon key if policies allow reading.
  // But let's try to verify if tables are populated.
  
  const sb = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjQ0OTc5NywiZXhwIjoxOTMyMDI1Nzk3fQ.M4a8b79b_d1_d2_d3'); // Standard local service role key part. Wait, I shouldn't guess.

  // Let's use a postgres connection string which is valid for local supabase
  const { Client } = require('pg');
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' // Port 54322 is standard for transaction pooler or direct DB? 
    // Standard local db port is 54322. Let's try 5432 or 54322.
    // config.toml says db port = 5432.
  });

  try {
    const client = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres' });
    await client.connect();

    const tables = [
      'compliance_standards',
      'compliance_requirements', 
      'security_exceptions',
      'compliance_evidence'
    ];

    console.log("--- Database Row Counts ---");
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${res.rows[0].count}`);
    }
    
    // Check specific standard existence
    const stdRes = await client.query(`SELECT name FROM compliance_standards`);
    console.log("\n--- Standards Present ---");
    stdRes.rows.forEach(r => console.log(`- ${r.name}`));

    await client.end();
  } catch (e) {
    console.error("Error connecting/querying:", e);
  }
}

checkCounts();
