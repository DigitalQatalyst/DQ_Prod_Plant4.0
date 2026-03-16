
import pg from 'pg';
import * as fs from 'fs';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const client = new pg.Client({
    connectionString,
});

async function executeSql() {
    try {
        await client.connect();
        console.log('Connected to Postgres');

        // Read the SQL file
        const sql = fs.readFileSync('scripts/fix_permissions.sql', 'utf8');

        // Execute the SQL
        await client.query(sql);
        console.log('Successfully executed SQL permissions fix');

    } catch (err: any) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

executeSql();
