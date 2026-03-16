#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('health_scores')
    .select(`
      *,
      assets(name)
    `)
    .order('computed_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Health Scores:');
    data.forEach(score => {
      console.log(`  ${score.assets.name}: ${score.score}/100 (computed: ${score.computed_at})`);
    });
  }
}

main();
