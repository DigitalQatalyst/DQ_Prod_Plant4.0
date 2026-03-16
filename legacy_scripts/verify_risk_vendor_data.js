import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
    console.log('Verifying Risk, Compliance, and Vendor data...');

    // 1. Get Tenant ID
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('name', 'DEWA - Transmission')
        .single();

    if (tenantError || !tenants) {
        console.error('DEWA tenant not found:', tenantError);
        return;
    }
    const tenantId = tenants.id;

    // 2. Count Summaries
    const { count: summaryCount } = await supabase
        .from('risk_compliance_summaries')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Risk Compliance Summaries:', summaryCount);

    // 3. Count Trends
    const { count: trendCount } = await supabase
        .from('risk_compliance_trends')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Risk Compliance Trends:', trendCount);

    // 4. Count Standard Statuses
    const { count: stdCount } = await supabase
        .from('compliance_standard_status')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Compliance Standard Statuses:', stdCount);

    // 5. Count Vendor Assessments
    const { count: vendorCount } = await supabase
        .from('vendor_security_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Vendor Security Assessments:', vendorCount);

    // 6. Count Vendor Findings
    const { count: findingCount } = await supabase
        .from('vendor_security_findings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Vendor Security Findings:', findingCount);

    // 7. Count Contact History
    const { count: contactCount } = await supabase
        .from('vendor_contact_history')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
    console.log('Vendor Contact History:', contactCount);

    console.log('Verification finished.');
}

verifyData();
