/**
 * Quick Seed Diagnostic Events
 * Seeds diagnostic_events table with sample data
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.development');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '[SET]' : '[MISSING]');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('Quick Seed: Diagnostic Events');
console.log('='.repeat(80));

async function main() {
  try {
    // First, get some asset IDs
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name, asset_type_id')
      .limit(10);

    if (assetsError) throw assetsError;

    if (!assets || assets.length === 0) {
      console.log('⚠ No assets found. Please seed assets first.');
      return;
    }

    console.log(`\nFound ${assets.length} assets to use for diagnostic events\n`);

    // Clear existing diagnostic events
    const { error: deleteError } = await supabase
      .from('diagnostic_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.log('Note: Could not clear existing events:', deleteError.message);
    }

    // Create diagnostic events for each asset
    const events = [];
    const eventTypes = ['thermal', 'electrical', 'mechanical', 'insulation', 'comms'];
    const states = ['open', 'ack', 'closed'];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const numEvents = Math.floor(Math.random() * 3) + 1; // 1-3 events per asset

      for (let j = 0; j < numEvents; j++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        const detectedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

        const event = {
          asset_id: asset.id,
          event_type: eventType,
          title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Anomaly Detected`,
          description: `Detected ${eventType} anomaly on ${asset.name}`,
          confidence: confidence,
          detected_at: detectedAt.toISOString(),
          state: state,
          telemetry_window_start: new Date(detectedAt.getTime() - 60 * 60 * 1000).toISOString(),
          telemetry_window_end: detectedAt.toISOString(),
        };

        // Add acknowledgement/closure data based on state
        if (state === 'ack' || state === 'closed') {
          event.acknowledged_by = 'operator@example.com';
          event.acknowledged_at = new Date(detectedAt.getTime() + 30 * 60 * 1000).toISOString();
        }

        if (state === 'closed') {
          event.closed_by = 'operator@example.com';
          event.closed_at = new Date(detectedAt.getTime() + 2 * 60 * 60 * 1000).toISOString();
          event.resolution_notes = 'Issue resolved after maintenance';
        }

        events.push(event);
      }
    }

    console.log(`Inserting ${events.length} diagnostic events...\n`);

    // Insert in batches
    const batchSize = 10;
    let inserted = 0;

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('diagnostic_events')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      } else {
        inserted += data.length;
        console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} events`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✓ Successfully inserted ${inserted} diagnostic events`);
    console.log('='.repeat(80));

    // Show summary
    const { data: summary } = await supabase
      .from('diagnostic_events')
      .select('event_type, state')
      .order('detected_at', { ascending: false });

    if (summary) {
      const byType = {};
      const byState = {};

      summary.forEach(e => {
        byType[e.event_type] = (byType[e.event_type] || 0) + 1;
        byState[e.state] = (byState[e.state] || 0) + 1;
      });

      console.log('\nSummary:');
      console.log('  By Type:', byType);
      console.log('  By State:', byState);
    }

    console.log('\nNext Steps:');
    console.log('  1. Refresh the Anomaly & Fault Detection page');
    console.log('  2. Select an asset to view diagnostic events\n');

  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
