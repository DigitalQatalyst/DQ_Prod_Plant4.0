// Run CI seed data
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCISeed() {
  console.log('Running CI seed data...');
  
  try {
    // Read the seed file
    const seedSQL = readFileSync('supabase/seed/009_ci_seed.sql', 'utf8');
    
    // Split the SQL into individual sta