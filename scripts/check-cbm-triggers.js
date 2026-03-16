/**
 * Check CBM Triggers Data
 * Verifies that CBM triggers exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCBMTriggers() {
  console.log('🔍 Checking CBM Triggers...\n');

  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('cbm_triggers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting CBM triggers:', countError);
      return;
    }

    console.log(`📊 Total CBM Triggers: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No CBM triggers found in database');
      console.log('💡 Run the seed script to populate data:');
      console.log('   node scripts/seed-fs2.js');
      return;
    }

    // Get sample triggers
    const { data: triggers, error } = await supabase
      .from('cbm_triggers')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching CBM triggers:', error);
      return;
    }

    console.log('📋 Sample CBM Triggers:\n');
    triggers.forEach((trigger, index) => {
      console.log(`${index + 1}. ${trigger.name}`);
      console.log(`   ID: ${trigger.id}`);
      console.log(`   Parameter ID: ${trigger.parameter_id}`);
      console.log(`   Condition: ${trigger.condition_operator} ${trigger.threshold_value}`);
      console.log(`   Active: ${trigger.is_active}`);
      console.log(`   Action: ${trigger.recommended_action}`);
      console.log('');
    });

    // Check active triggers
    const { count: activeCount } = await supabase
      .from('cbm_triggers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log(`✅ Active Triggers: ${activeCount}`);

    // Check parameters referenced
    const { data: params } = await supabase
      .from('cbm_triggers')
      .select('parameter_id')
      .not('parameter_id', 'is', null);

    const uniqueParams = new Set(params?.map(p => p.parameter_id) || []);
    console.log(`📊 Unique Parameters Referenced: ${uniqueParams.size}`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkCBMTriggers();
