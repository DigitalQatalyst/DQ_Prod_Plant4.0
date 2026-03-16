
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Use service role to inspect policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function log(msg: string) {
    try {
        console.log(msg);
        fs.appendFileSync('rls_check.log', msg + '\n');
    } catch (e) {
        console.error('Error writing to log file', e);
    }
}

async function checkRLS() {
    try {
        fs.writeFileSync('rls_check.log', '');
    } catch (e) { }

    log('🕵️ Checking RLS Policies...');

    const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .in('tablename', ['tx_substations', 'tx_feeders', 'energy_meters', 'energy_telemetry']);

    if (error) {
        log('Error fetching policies: ' + error.message);
        // Fallback if pg_policies is not accessible via API (it should be for service role if exposed, but sometimes system tables are hidden)
        // We can try to use RPC if available or just infer.
        return;
    }

    log(`Found ${policies.length} policies.`);
    policies.forEach(p => {
        log(`Table: ${p.tablename}, Policy: ${p.policyname}, Cmd: ${p.cmd}, Roles: ${p.roles}`);
    });

}

checkRLS().catch(err => log('Error: ' + err));
