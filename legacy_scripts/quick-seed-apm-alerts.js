// Quick seed for apm_alerts table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickSeedAlerts() {
  console.log('Quick seeding apm_alerts...\n');
  
  try {
    // Get existing assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name')
      .limit(5);
    
    if (assetsError) throw assetsError;
    
    if (!assets || assets.length === 0) {
      console.error('No assets found. Cannot seed alerts.');
      return;
    }
    
    console.log(`Found ${assets.length} assets to use for alerts`);
    
    // Create sample alerts
    const alerts = [
      {
        asset_id: assets[0].id,
        alert_type: 'temperature_critical',
        severity: 'critical',
        source: 'telemetry',
        message: `High temperature detected on ${assets[0].name}. Current: 98°C, Threshold: 95°C`,
        detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        state: 'open'
      },
      {
        asset_id: assets[0].id,
        alert_type: 'temperature_warning',
        severity: 'warning',
        source: 'telemetry',
        message: `Temperature approaching threshold on ${assets[0].name}. Current: 88°C`,
        detected_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        state: 'ack',
        acknowledged_by: 'operator_john',
        acknowledged_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        asset_id: assets[1]?.id || assets[0].id,
        alert_type: 'pressure_critical',
        severity: 'critical',
        source: 'telemetry',
        message: `SF6 pressure critically low on ${assets[1]?.name || assets[0].name}. Current: 4.2 bar, Minimum: 5.0 bar`,
        detected_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        state: 'open'
      },
      {
        asset_id: assets[2]?.id || assets[0].id,
        alert_type: 'vibration_warning',
        severity: 'warning',
        source: 'diagnostic',
        message: `Abnormal vibration detected on ${assets[2]?.name || assets[0].name}. Level: 12mm/s`,
        detected_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        state: 'closed',
        acknowledged_by: 'operator_sarah',
        acknowledged_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        closed_by: 'operator_sarah',
        closed_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        resolution_notes: 'Maintenance performed. Vibration levels returned to normal.'
      },
      {
        asset_id: assets[1]?.id || assets[0].id,
        alert_type: 'failure_prediction',
        severity: 'warning',
        source: 'prediction',
        message: `Predicted failure risk on ${assets[1]?.name || assets[0].name}. RUL: 45 days, Risk: Medium`,
        detected_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        state: 'ack',
        acknowledged_by: 'engineer_mike',
        acknowledged_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      },
      {
        asset_id: assets[3]?.id || assets[0].id,
        alert_type: 'communication_failure',
        severity: 'info',
        source: 'diagnostic',
        message: `Communication timeout on ${assets[3]?.name || assets[0].name}. Retrying...`,
        detected_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        state: 'open'
      },
      {
        asset_id: assets[0].id,
        alert_type: 'load_warning',
        severity: 'warning',
        source: 'telemetry',
        message: `Load exceeding 85% capacity on ${assets[0].name}. Current: 87%`,
        detected_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        state: 'open'
      },
      {
        asset_id: assets[2]?.id || assets[0].id,
        alert_type: 'oil_quality_warning',
        severity: 'warning',
        source: 'diagnostic',
        message: `Oil quality degradation detected on ${assets[2]?.name || assets[0].name}. DGA analysis recommended.`,
        detected_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        state: 'ack',
        acknowledged_by: 'engineer_lisa',
        acknowledged_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
      },
      {
        asset_id: assets[4]?.id || assets[0].id,
        alert_type: 'partial_discharge',
        severity: 'critical',
        source: 'diagnostic',
        message: `Partial discharge activity detected on ${assets[4]?.name || assets[0].name}. Immediate inspection required.`,
        detected_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        state: 'open'
      },
      {
        asset_id: assets[1]?.id || assets[0].id,
        alert_type: 'maintenance_due',
        severity: 'info',
        source: 'manual',
        message: `Scheduled maintenance due for ${assets[1]?.name || assets[0].name} in 7 days.`,
        detected_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        state: 'open'
      }
    ];
    
    // Insert alerts
    const { data, error } = await supabase
      .from('apm_alerts')
      .insert(alerts)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ Successfully inserted ${data.length} alerts`);
    console.log('\nAlert summary:');
    console.log(`  - Critical: ${alerts.filter(a => a.severity === 'critical').length}`);
    console.log(`  - Warning: ${alerts.filter(a => a.severity === 'warning').length}`);
    console.log(`  - Info: ${alerts.filter(a => a.severity === 'info').length}`);
    console.log(`  - Open: ${alerts.filter(a => a.state === 'open').length}`);
    console.log(`  - Acknowledged: ${alerts.filter(a => a.state === 'ack').length}`);
    console.log(`  - Closed: ${alerts.filter(a => a.state === 'closed').length}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

quickSeedAlerts();
