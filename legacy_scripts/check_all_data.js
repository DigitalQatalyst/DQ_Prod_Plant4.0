
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllData() {
    console.log('Checking all tenants...');
    const { data: tenants } = await supabase.from('tenants').select('*');
    console.table(tenants);

    console.log('Checking risk summaries...');
    const { data: summaries } = await supabase.from('risk_compliance_summaries').select('id, tenant_id, summary_name');
    console.table(summaries);

    console.log('Checking vendor assessments...');
    const { data: vendors } = await supabase.from('vendor_security_assessments').select('id, tenant_id, vendor_name');
    console.table(vendors);
}

checkAllData();
