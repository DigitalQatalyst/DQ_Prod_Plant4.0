#!/usr/bin/env node

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node execute-sql-file.js <sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

// Execute using RPC
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error executing SQL:', error);
  process.exit(1);
}

console.log('SQL executed successfully');
console.log(data);
