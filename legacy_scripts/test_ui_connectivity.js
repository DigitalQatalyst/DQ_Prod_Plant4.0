
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMapping() {
    console.log('Testing tenant mapping and data retrieval...');

    // Simulate mapTenantIdToUUID
    const frontendTenantId = 'alpha-upstream';
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('scenario_tag', 'power_transmission_demo_v1')
        .maybeSingle();

    if (tenantError) {
        console.error('Tenant mapping error:', tenantError);
        return;
    }

    if (!tenant) {
        console.warn('Tenant not found');
        return;
    }

    console.log(`Mapped 'alpha-upstream' to UUID: ${tenant.id}`);

    // Fetch summaries
    const { data: summaries, error: summariesError } = await supabase
        .from('risk_compliance_summaries')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('summary_date', { ascending: false });

    if (summariesError) {
        console.error('Summaries fetch error:', summariesError);
        return;
    }

    console.log(`Fetched ${summaries.length} summaries.`);
    if (summaries.length > 0) {
        console.log('First summary name:', summaries[0].summary_name);
    }

    // Fetch vendor assessments
    const { data: vendors, error: vendorsError } = await supabase
        .from('vendor_security_assessments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('assessment_date', { ascending: false });

    if (vendorsError) {
        console.error('Vendors fetch error:', vendorsError);
        return;
    }

    console.log(`Fetched ${vendors.length} vendor assessments.`);
}

testMapping();
