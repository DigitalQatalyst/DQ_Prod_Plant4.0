/**
 * Debug Diagnostic Events Query
 * Tests the exact query the UI is making
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('Debug: Diagnostic Events Query');
console.log('='.repeat(80));

async function main() {
  try {
    // First, get an asset
    console.log('\n1. Fetching assets...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name, asset_type_id')
      .limit(1);

    if (assetsError) throw assetsError;

    if (!assets || assets.length === 0) {
      console.log('No assets found!');
      return;
    }

    const asset = assets[0];
    console.log(`   Found asset: ${asset.name} (${asset.id})`);

    // Now query diagnostic events for this asset
    console.log('\n2. Querying diagnostic events for this asset...');
    
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 7); // Last 7 days

    const { data: events, error: eventsError } = await supabase
      .from('diagnostic_events')
      .select('*')
      .eq('asset_id', asset.id)
      .gte('detected_at', from.toISOString())
      .lte('detected_at', now.toISOString())
      .order('detected_at', { ascending: false });

    if (eventsError) {
      console.error('   Error:', eventsError);
      throw eventsError;
    }

    console.log(`   Found ${events?.length || 0} events`);
    
    if (events && events.length > 0) {
      console.log('\n3. Sample events:');
      events.slice(0, 3).forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title}`);
        console.log(`      Type: ${event.event_type}, State: ${event.state}`);
        console.log(`      Detected: ${event.detected_at}`);
        console.log(`      Confidence: ${event.confidence}%`);
      });
    }

    // Try query without asset_id filter
    console.log('\n4. Querying ALL diagnostic events (no filter)...');
    const { data: allEvents, error: allError } = await supabase
      .from('diagnostic_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(5);

    if (allError) {
      console.error('   Error:', allError);
      throw allError;
    }

    console.log(`   Found ${allEvents?.length || 0} events total`);
    
    if (allEvents && allEvents.length > 0) {
      console.log('\n5. Sample events (all):');
      allEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title}`);
        console.log(`      Asset ID: ${event.asset_id}`);
        console.log(`      Type: ${event.event_type}, State: ${event.state}`);
      });
    }

    // Check if RLS is blocking
    console.log('\n6. Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('pg_get_tabledef', { tablename: 'diagnostic_events' })
      .single();

    if (rlsError) {
      console.log('   Could not check RLS (this is okay)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('Debug Complete');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n✗ Debug failed:', error);
    process.exit(1);
  }
}

main();
