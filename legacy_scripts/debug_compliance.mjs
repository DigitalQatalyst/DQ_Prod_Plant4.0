
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComplianceData() {
    console.log('Starting Compliance Data Debug (ESM)...');

    // 1. Get Tenant
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, scenario_tag')
        .eq('scenario_tag', 'power_transmission_demo_v1');

    if (tenantError) {
        console.error('Error fetching tenants:', tenantError);
        return;
    }

    if (!tenants || tenants.length === 0) {
        console.error('Tenant not found!');
        return;
    }

    const tenant = tenants[0];
    console.log('Found Tenant:', tenant);

    // 2. Check Compliance Standards
    const { data: standards, error: stdError } = await supabase
        .from('compliance_standards')
        .select('id, name')
        .eq('tenant_id', tenant.id);

    if (stdError) console.error('Error fetching standards:', stdError);
    console.log(`Found ${standards?.length || 0} Compliance Standards.`);

    // 3. Check Security Controls
    const { data: controls, error: ctrlError } = await supabase
        .from('security_controls')
        .select('id, control_id, control_name')
        .eq('tenant_id', tenant.id);

    if (ctrlError) console.error('Error fetching controls:', ctrlError);
    console.log(`Found ${controls?.length || 0} Security Controls.`);

    // 4. Check Security Policies
    const { data: policies, error: polError } = await supabase
        .from('security_policies')
        .select('id, policy_name, status')
        .eq('tenant_id', tenant.id);

    if (polError) console.error('Error fetching policies:', polError);
    console.log(`Found ${policies?.length || 0} Security Policies.`);

    // 5. Check Security Exceptions
    const { data: exceptions, error: excError } = await supabase
        .from('security_exceptions')
        .select('id, exception_id, status')
        .eq('tenant_id', tenant.id);

    if (excError) console.error('Error fetching exceptions:', excError);
    console.log(`Found ${exceptions?.length || 0} Security Exceptions.`);

}

checkComplianceData();
