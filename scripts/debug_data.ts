
import pg from 'pg';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const client = new pg.Client({
    connectionString,
});

async function checkData() {
    try {
        await client.connect();

        const tenantId = '69083830-a193-4f8b-aab2-0d17349d286c';

        console.log('--- Database Check ---');

        const counts = await client.query(`
            SELECT 'tx_delivery_context' as table_name, count(*) as count FROM tx_delivery_context WHERE org_id = $1
            UNION ALL
            SELECT 'energy_emissions_snapshots' as table_name, count(*) as count FROM energy_emissions_snapshots WHERE org_id = $1
            UNION ALL
            SELECT 'emission_factors' as table_name, count(*) as count FROM emission_factors WHERE org_id = $1
        `, [tenantId]);

        for (const row of counts.rows) {
            console.log(`${row.table_name}: ${row.count}`);
        }

        const orgCheck = await client.query('SELECT count(*) FROM tx_delivery_context WHERE org_id = $1 AND scope_type = $2', [tenantId, 'org']);
        console.log(`Org-level count: ${orgCheck.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkData();
