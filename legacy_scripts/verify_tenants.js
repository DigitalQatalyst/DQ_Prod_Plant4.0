
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTenants() {
    console.log('Verifying tenants in Supabase...');
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) {
        console.error('Error fetching tenants:', error);
        return;
    }
    console.table(data);
}

verifyTenants();
