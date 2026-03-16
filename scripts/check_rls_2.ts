
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function log(msg: string) {
    try {
        console.log(msg);
        fs.appendFileSync('rls_check_2.log', msg + '\n');
    } catch (e) { }
}

async function checkRLS() {
    try { fs.writeFileSync('rls_check_2.log', ''); } catch (e) { }

    log('🕵️ Checking RLS Status via pg_class...');

    // Query pg_class to check relrowsecurity
    const { data, error } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .in('relname', ['tx_substations', 'tx_feeders', 'energy_meters', 'energy_telemetry']);

    if (error) {
        log('Error fetching pg_class: ' + error.message);
        return;
    }

    log(`Found ${data.length} tables.`);
    data.forEach(t => {
        log(`Table: ${t.relname}, RLS Enabled: ${t.relrowsecurity}`);
    });
}

checkRLS().catch(err => log('Error: ' + err));
