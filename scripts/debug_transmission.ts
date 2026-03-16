
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function log(msg: string) {
    try {
        console.log(msg);
        fs.appendFileSync('debug_output.log', msg + '\n');
    } catch (e) {
        console.error('Error writing to log file', e);
    }
}

async function debugTransmissionData() {
    try {
        fs.writeFileSync('debug_output.log', ''); // Clear log file
    } catch (e) {
        console.error('Error clearing log file', e);
    }

    log('🔌 Connecting to Supabase...');

    // 1. Check Tenants
    log('\n--- Tenants ---');
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*');

    if (tenantsError) {
        log('Error fetching tenants: ' + tenantsError.message);
    } else {
        log(`Found ${tenants.length} tenants:`);
        tenants.forEach(t => log(`- ${t.name} (${t.id})`));
    }

    // 2. Check Substations
    log('\n--- Substations ---');
    const { data: substations, error: subError } = await supabase
        .from('tx_substations')
        .select('id, name, org_id');

    if (subError) {
        log('Error fetching substations: ' + subError.message);
    } else {
        log(`Found ${substations.length} substations.`);
        substations.forEach(s => log(`- ${s.name} (${s.id}) [org: ${s.org_id}]`));
    }

    // 3. Check Feeders
    log('\n--- Feeders ---');
    const { data: feeders, error: feedersError } = await supabase
        .from('tx_feeders')
        .select('id, name, substation_id');

    if (feedersError) {
        log('Error fetching feeders: ' + feedersError.message);
    } else {
        log(`Found ${feeders.length} feeders.`);
    }

    // 4. Check Meter Registry View
    log('\n--- Meter Registry View (v_tx_energy_meter_registry) ---');
    const { data: meters, error: metersError } = await supabase
        .from('v_tx_energy_meter_registry')
        .select('id, name, substation_name, feeder_name, current_kw, status, org_id');

    if (metersError) {
        log('Error fetching meter registry: ' + metersError.message);
    } else {
        log(`Found ${meters.length} meters in registry.`);
        meters.forEach(m => log(`- ${m.name}: Sub=${m.substation_name}, Feeder=${m.feeder_name}, kW=${m.current_kw}, Status=${m.status}, Org=${m.org_id}`));
    }

    // 5. Check Raw Meters
    log('\n--- Raw Energy Meters ---');
    const { data: rawMeters, error: rawMetersError } = await supabase
        .from('energy_meters')
        .select('id, name, substation_id, feeder_id');

    if (rawMetersError) {
        log('Error fetching raw meters: ' + rawMetersError.message);
    } else {
        log(`Found ${rawMeters.length} raw meters.`);
    }

}

debugTransmissionData().catch(err => log('Error: ' + err));
