/**
 * Fix APM Tables - Disable RLS for dev and seed missing data
 */
import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;

config({ path: '.env.development' });

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const disableRlsSQL = `
-- Disable RLS on APM tables for local development
ALTER TABLE IF EXISTS diagnostic_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rca_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fmea_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_parameter_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS telemetry_parameters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS telemetry_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS downtime_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS failure_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cbm_triggers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS risk_scoring_model DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_lifecycle_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_criticality_model DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spare_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_spare_parts DISABLE ROW LEVEL SECURITY;
`;

const grantAccessSQL = `
-- Grant anon access to APM tables
GRANT SELECT ON TABLE diagnostic_events TO anon;
GRANT SELECT ON TABLE rca_records TO anon;
GRANT SELECT ON TABLE fmea_entries TO anon;
GRANT SELECT ON TABLE health_scores TO anon;
GRANT SELECT ON TABLE health_models TO anon;
GRANT SELECT ON TABLE telemetry_parameters TO anon;
GRANT SELECT ON TABLE telemetry_data TO anon;
GRANT SELECT ON TABLE downtime_events TO anon;
GRANT SELECT ON TABLE failure_predictions TO anon;
GRANT SELECT ON TABLE cbm_triggers TO anon;
GRANT SELECT ON TABLE maintenance_recommendations TO anon;
GRANT SELECT ON TABLE risk_scoring_model TO anon;
GRANT SELECT ON TABLE asset_relationships TO anon;
GRANT SELECT ON TABLE asset_lifecycle_events TO anon;
GRANT SELECT ON TABLE asset_criticality_model TO anon;
GRANT SELECT ON TABLE spare_parts TO anon;
GRANT SELECT ON TABLE asset_spare_parts TO anon;
GRANT INSERT ON TABLE diagnostic_events TO anon;
GRANT INSERT ON TABLE rca_records TO anon;
GRANT INSERT ON TABLE fmea_entries TO anon;
GRANT INSERT ON TABLE health_scores TO anon;
GRANT INSERT ON TABLE failure_predictions TO anon;
GRANT INSERT ON TABLE maintenance_recommendations TO anon;
`;

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connected to local postgres');

    console.log('\n📋 Disabling RLS on APM tables...');
    await client.query(disableRlsSQL);
    console.log('✅ RLS disabled');

    console.log('\n🔓 Granting anon access...');
    await client.query(grantAccessSQL);
    console.log('✅ Permissions granted');

    // Verify tables exist
    console.log('\n🔍 Verifying APM tables...');
    const res = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN (
        'diagnostic_events', 'rca_records', 'fmea_entries', 'health_scores',
        'failure_predictions', 'cbm_triggers', 'maintenance_recommendations',
        'asset_relationships', 'spare_parts', 'fmea_entries'
      )
      ORDER BY tablename;
    `);
    console.log(`Found ${res.rows.length} APM tables:`);
    res.rows.forEach(r => console.log(`  ✅ ${r.tablename}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
