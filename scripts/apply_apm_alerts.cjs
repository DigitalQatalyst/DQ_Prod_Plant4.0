/**
 * Apply apm_alerts migration via Supabase RPC or direct SQL
 * Targets the local Supabase instance at port 54321
 */
const http = require('http');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'REPLACED_SECRET';

const sql = `
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create apm_alerts table
CREATE TABLE IF NOT EXISTS apm_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state TEXT NOT NULL DEFAULT 'open',
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  source_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  CHECK (source IN ('telemetry', 'diagnostic', 'prediction', 'manual')),
  CHECK (state IN ('open', 'ack', 'closed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_apm_alerts_asset_detected ON apm_alerts(asset_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_apm_alerts_severity_state_detected ON apm_alerts(severity, state, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_apm_alerts_state_detected ON apm_alerts(state, detected_at DESC);

-- Create apm_alert_history table
CREATE TABLE IF NOT EXISTS apm_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES apm_alerts(id) ON DELETE CASCADE,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  CHECK (previous_state IN ('open', 'ack', 'closed')),
  CHECK (new_state IN ('open', 'ack', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_apm_alert_history_alert_changed ON apm_alert_history(alert_id, changed_at DESC);
`;

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname: '127.0.0.1',
      port: 54321,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('Applying apm_alerts migration via Supabase REST API...');
  
  // Try via the query endpoint in supabase-js format
  // The REST API doesn't accept raw SQL - need to use the pg endpoint or RPC
  // Let's try pg endpoint
  try {
    const result = await makeRequest('/pg/query', 'POST', { query: sql });
    console.log('Response status:', result.status);
    console.log('Response body:', result.body.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }

  // Also check if apm_alerts already exists by querying it
  try {
    const check = await makeRequest('/rest/v1/apm_alerts?limit=1', 'GET', null);
    console.log('\nCheck apm_alerts table - status:', check.status);
    if (check.status === 200) {
      console.log('✅ apm_alerts table EXISTS');
    } else if (check.status === 404) {
      console.log('❌ apm_alerts table DOES NOT EXIST - needs migration');
    } else {
      console.log('Body:', check.body.substring(0, 200));
    }
  } catch (err) {
    console.error('Check error:', err.message);
  }
}

main().catch(console.error);
