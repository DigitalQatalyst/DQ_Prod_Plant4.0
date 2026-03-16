
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log('Starting debug (ESM)...');

    // 1. Get Tenant ID
    const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, scenario_tag')
        .eq('scenario_tag', 'power_transmission_demo_v1')
        .single();

    if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
        return;
    }

    if (!tenantData) {
        console.error('Tenant not found!');
        return;
    }

    console.log('Found Tenant:', tenantData);
    const tenantId = tenantData.id;

    // 2. Fetch OT Asset Security with Assets
    const { data: assetsData, error: assetsError } = await supabase
        .from('ot_asset_security')
        .select('*, asset:assets(*)')
        .eq('tenant_id', tenantId);

    if (assetsError) {
        console.error('Error fetching OT Assets:', assetsError);
        return;
    }

    console.log(`Found ${assetsData.length} records in ot_asset_security.`);

    if (assetsData.length > 0) {
        // Inspect the first record, specifically the structure of the joined 'asset'
        console.log('Sample Record 0:', JSON.stringify(assetsData[0], null, 2));

        // Check asset type case
        const types = assetsData.map(r => r.asset?.properties?.type).filter(Boolean);
        console.log('Unique Asset Types found in properties:', [...new Set(types)]);

        // Check Filters
        const gateways = assetsData.filter(asset => {
            const t = asset.asset?.properties?.type?.toLowerCase();
            return t && (t.includes('gateway') || t.includes('concentrator') || t === 'rtu');
        });
        console.log(`Filter Check: Found ${gateways.length} Gateways (using lowercase check).`);

        const sensors = assetsData.filter(asset => {
            const t = asset.asset?.properties?.type?.toLowerCase();
            // Iot Device types: ['sensor', 'actuator', 'meter', 'gateway', 'rtu', 'ied']
            return t && ['sensor', 'actuator', 'meter'].some(x => t.includes(x));
        });
        console.log(`Filter Check: Found ${sensors.length} potential IoT devices.`);

    } else {
        console.log('WARNING: No OT Asset Security records found for this tenant.');

        // Check if plain assets exist
        const { count } = await supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
        console.log(`Total Assets in 'assets' table for tenant: ${count}`);

        // Check if ot_asset_security has ANY records
        const { count: otCount } = await supabase
            .from('ot_asset_security')
            .select('*', { count: 'exact', head: true });
        console.log(`Total OT Security records (globally): ${otCount}`);
    }
}

runDebug();
