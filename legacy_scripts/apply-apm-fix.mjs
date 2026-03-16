
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();

    console.log('--- Applying Schema Changes ---');
    try {
        await client.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_tag TEXT;');
        await client.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS sector TEXT;');
        await client.query('CREATE INDEX IF NOT EXISTS idx_assets_sector ON assets(sector);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);');
        console.log('✅ Columns added successfully.');
    } catch (e) {
        console.error('Error adding columns:', e.message);
    }

    console.log('--- Tagging Existing Assets ---');
    const assetMappings = {
        'Dubai T1 Main Transformer': 'TX-001',
        'Dubai T2 Backup Transformer': 'TX-010',
        'Dubai 400kV Incomer CB': 'CB-101',
        'Dubai 132kV Feeder CB': 'CB-102',
        'Jebel Ali T1 Main Transformer': 'TX-002',
        'Jebel Ali 400kV Incomer CB': 'CB-103',
        'Jebel Ali 132kV Feeder CB': 'CB-104',
        'Al Aweer T1 Main Transformer': 'TX-003',
        'Al Aweer 220kV Incomer CB': 'CB-105',
        'Al Aweer Regional Meter': 'MTR-001'
    };

    for (const [name, tag] of Object.entries(assetMappings)) {
        await client.query(
            "UPDATE assets SET asset_tag = $1, sector = 'power_transmission' WHERE name = $2",
            [tag, name]
        );
    }

    // Set default sector for all other power transmission assets
    await client.query(
        "UPDATE assets SET sector = 'power_transmission' WHERE sector IS NULL"
    );
    console.log('✅ Assets tagged.');

    console.log('--- Adding Missing Line Assets ---');
    // Need to find tenant and site for Dubai Main Substation to add lines
    const { rows: siteRows } = await client.query(
        "SELECT id, tenant_id FROM sites WHERE name = 'Dubai Main Substation' LIMIT 1"
    );

    if (siteRows.length > 0) {
        const { id: siteId, tenant_id: tenantId } = siteRows[0];

        // Add LINE-N01 and LINE-N02 if they don't exist
        await client.query(`
      INSERT INTO assets (tenant_id, site_id, name, asset_tag, sector, status, criticality)
      VALUES 
        ($1, $2, 'Dubai North 400kV Line 1', 'LINE-N01', 'power_transmission', 'online', 'critical'),
        ($1, $2, 'Dubai North 400kV Line 2', 'LINE-N02', 'power_transmission', 'online', 'high')
      ON CONFLICT DO NOTHING;
    `, [tenantId, siteId]);
        console.log('✅ Missing line assets added.');
    }

    console.log('--- Seeding Performance Benchmarks ---');
    await client.query(`
    INSERT INTO performance_benchmarks (asset_type, sector, availability_target, load_factor_target, mtbf_target)
    VALUES 
      ('power_transformer', 'power_transmission', 99.5, 75.0, 8760.0),
      ('circuit_breaker', 'power_transmission', 99.8, NULL, 17520.0),
      ('transmission_line', 'power_transmission', 99.7, 65.0, 26280.0)
    ON CONFLICT (asset_type, sector) DO UPDATE SET
      availability_target = EXCLUDED.availability_target,
      load_factor_target = EXCLUDED.load_factor_target,
      mtbf_target = EXCLUDED.mtbf_target;
  `);
    console.log('✅ Benchmarks seeded.');

    console.log('--- Seeding Metrics (Reliability & Utilisation) ---');
    // I'll run the logic of 009_apm_fs3_seed.sql but using current dates and real IDs

    const { rows: apmAssets } = await client.query(
        "SELECT id, asset_tag FROM assets WHERE asset_tag IS NOT NULL"
    );

    const assetMap = {};
    apmAssets.forEach(a => assetMap[a.asset_tag] = a.id);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Reliability Metrics for TX-001, TX-002, CB-101, CB-102, LINE-N01
    const relMetrics = [
        { tag: 'TX-001', availability: 99.4, mtbf: 2000, failures: 1, downtime: 720 },
        { tag: 'TX-002', availability: 99.9, mtbf: 5000, failures: 0, downtime: 0 },
        { tag: 'CB-101', availability: 99.2, mtbf: 1500, failures: 1, downtime: 1080 },
        { tag: 'CB-102', availability: 100, mtbf: null, failures: 0, downtime: 0 },
        { tag: 'LINE-N01', availability: 99.8, mtbf: 8000, failures: 1, downtime: 240 }
    ];

    for (const m of relMetrics) {
        if (assetMap[m.tag]) {
            await client.query(`
        INSERT INTO reliability_metrics (asset_id, period_start, period_end, availability_percent, mtbf_hours, failure_count, total_downtime_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (asset_id, period_start, period_end) DO NOTHING;
      `, [assetMap[m.tag], monthAgo, now, m.availability, m.mtbf, m.failures, m.downtime]);
        }
    }

    // Utilisation Metrics
    const utilMetrics = [
        { tag: 'TX-001', load: 82.5, peak: 1150, thermal: 15.8 },
        { tag: 'TX-002', load: 65.0, peak: 1200, thermal: 35.0 },
        { tag: 'LINE-N01', load: 78.0, peak: 1150, thermal: 22.0 },
        { tag: 'CB-101', load: null, peak: 1150, cycles: 45 },
        { tag: 'MTR-001', load: 45.0, peak: 500, cycles: null }
    ];

    for (const m of utilMetrics) {
        if (assetMap[m.tag]) {
            await client.query(`
        INSERT INTO utilisation_metrics (asset_id, period_start, period_end, load_factor, peak_current, thermal_headroom, switching_cycles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING;
      `, [assetMap[m.tag], weekAgo, now, m.load, m.peak, m.thermal, m.cycles || null]);
        }
    }

    // Performance Deviations
    const deviations = [
        { tag: 'TX-001', type: 'availability_below_target', magnitude: -0.1 },
        { tag: 'CB-101', type: 'availability_below_target', magnitude: -0.6 },
        { tag: 'TX-001', type: 'load_factor_above_target', magnitude: 7.5 }
    ];

    for (const d of deviations) {
        if (assetMap[d.tag]) {
            await client.query(`
        INSERT INTO performance_deviations (asset_id, deviation_type, magnitude, detected_at, benchmark_reference)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING;
      `, [assetMap[d.tag], d.type, d.magnitude, now, 'Reference benchmark']);
        }
    }


    // Downtime Events
    console.log('--- Seeding Downtime Events ---');
    const downtimeEvents = [
        { tag: 'TX-001', type: 'unplanned_failure', hours: 12, scope: 'transformer' },
        { tag: 'CB-101', type: 'planned_maintenance', hours: 18, scope: 'bay' },
        { tag: 'LINE-N01', type: 'forced_outage', hours: 4, scope: 'line' }
    ];

    for (const e of downtimeEvents) {
        if (assetMap[e.tag]) {
            const start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            const end = new Date(start.getTime() + e.hours * 60 * 60 * 1000);
            await client.query(`
        INSERT INTO downtime_events (asset_id, event_type, start_time, end_time, duration_minutes, outage_scope, grid_impact_mw)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING;
      `, [assetMap[e.tag], e.type, start, end, e.hours * 60, e.scope, 50.0]);
        }
    }

    console.log('✅ Detailed metrics seeded.');


    await client.end();
    console.log('\n--- ALL FIXES APPLIED ---');
}

main().catch(console.error);
