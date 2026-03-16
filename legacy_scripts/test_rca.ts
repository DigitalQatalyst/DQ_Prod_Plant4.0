import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envContent = fs.readFileSync('./.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of envContent.split('\n')) {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
        .from('ci_rca')
        .select('*, project:ci_projects(title, project_ref)');

    if (error) {
        console.error("ERROR:", error);
    } else {
        console.log("SUCCESS, found", data?.length, "records");
        if (data?.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        }
    }
}

test();
