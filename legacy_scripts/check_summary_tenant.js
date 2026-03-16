
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSummaryTenant() {
    console.log('Fetching tenant UUID for scenario_tag power_transmission_demo_v1...');
    const { data: tenant } = await supabase.from('tenants').select('id').eq('scenario_tag', 'power_transmission_demo_v1').maybeSingle();
    if (!tenant) {
        console.error('Tenant not found');
        return;
    }
    const uuid = tenant.id;
    console.log('Tenant UUID:', uuid);

    console.log('Fetching summaries for this tenant UUID...');
    const { data: summaries, error } = await supabase.from('risk_compliance_summaries').select('id, tenant_id, summary_name').eq('tenant_id', uuid);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${summaries.length} summaries.`);
    summaries.forEach(s => console.log(`- ${s.summary_name} (Tenant: ${s.tenant_id})`));
}

checkSummaryTenant();
