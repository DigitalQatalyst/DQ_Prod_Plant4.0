
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking Supabase at:', supabaseUrl);

    const { data: meters, error: metersError } = await supabase
        .from('energy_meters')
        .select('count', { count: 'exact', head: true });

    if (metersError) {
        console.error('Error fetching energy_meters:', metersError);
    } else {
        console.log('energy_meters count:', meters);
    }

    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name');

    if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
    } else {
        console.log('Tenants in DB:', tenants);
    }

    const { data: viewData, error: viewError } = await supabase
        .from('v_tx_energy_meter_registry')
        .select('count', { count: 'exact', head: true });

    if (viewError) {
        console.error('Error fetching v_tx_energy_meter_registry:', viewError);
    } else {
        console.log('v_tx_energy_meter_registry count:', viewData);
    }
}

check();
