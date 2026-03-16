/**
 * Complete FS1 & FS2 Feature Verification
 * Verifies all features have the necessary data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Complete FS1 & FS2 Feature Verification');
console.log('='.repeat(80));

async function main() {
  const results = {
    fs1: {},
    fs2: {}
  };
  
  // FS1: Asset Health & Diagnostics
  console.log('\n📊 FS1: Asset Health & Diagnostics');
  console.log('-'.repeat(80));
  
  // 1. Real-time Condition Monitoring (needs telemetry_data)
  const { data: telemetry } = await supabase
    .from('telemetry_data')
    .select('*')
    .limit(1);
  results.fs1.conditionMonitoring = telemetry && telemetry.length > 0;
  console.log(`${results.fs1.conditionMonitoring ? '✓' : '✗'} Real-time Condition Monitoring: ${telemetry?.length || 0} telemetry records`);
  
  // 2. Asset Health Scoring (needs health_scores)
  const { data: healthScores } = await supabase
    .from('health_scores')
    .select('*');
  results.fs1.healthScoring = healthScores && healthScores.length > 0;
  console.log(`${results.fs1.healthScoring ? '✓' : '✗'} Asset Health Scoring: ${healthScores?.length || 0} health scores`);
  
  // 3. Anomaly & Fault Detection (needs diagnostic_events)
  const { data: diagnosticEvents } = await supabase
    .from('diagnostic_events')
    .select('*');
  results.fs1.anomalyDetection = diagnosticEvents && diagnosticEvents.length > 0;
  console.log(`${results.fs1.anomalyDetection ? '✓' : '✗'} Anomaly & Fault Detection: ${diagnosticEvents?.length || 0} diagnostic events`);
  
  // 4. Root-cause Diagnostics (needs rca_records)
  const { data: rcaRecords } = await supabase
    .from('rca_records')
    .select('*');
  results.fs1.rootCause = rcaRecords && rcaRecords.length > 0;
  console.log(`${results.fs1.rootCause ? '✓' : '✗'} Root-cause Diagnostics: ${rcaRecords?.length || 0} RCA records`);
  
  // 5. Degradation Trend Analysis (needs health_scores with history)
  const { data: healthHistory } = await supabase
    .from('health_scores')
    .select('asset_id')
    .limit(10);
  results.fs1.degradationTrends = healthHistory && healthHistory.length > 0;
  console.log(`${results.fs1.degradationTrends ? '✓' : '✗'} Degradation Trend Analysis: ${healthHistory?.length || 0} assets with health history`);
  
  // FS2: Predictive & Prescriptive Maintenance
  console.log('\n🔮 FS2: Predictive & Prescriptive Maintenance');
  console.log('-'.repeat(80));
  
  // 1. Machine-learning Failure Prediction (needs failure_predictions)
  const { data: predictions } = await supabase
    .from('failure_predictions')
    .select('*');
  results.fs2.failurePrediction = predictions && predictions.length > 0;
  console.log(`${results.fs2.failurePrediction ? '✓' : '✗'} Failure Prediction: ${predictions?.length || 0} predictions`);
  
  // 2. RUL Estimation (needs failure_predictions with rul_days)
  const { data: rulData } = await supabase
    .from('failure_predictions')
    .select('rul_days')
    .not('rul_days', 'is', null);
  results.fs2.rulEstimation = rulData && rulData.length > 0;
  console.log(`${results.fs2.rulEstimation ? '✓' : '✗'} RUL Estimation: ${rulData?.length || 0} assets with RUL`);
  
  // 3. CBM Triggers (needs cbm_triggers)
  const { data: cbmTriggers } = await supabase
    .from('cbm_triggers')
    .select('*');
  results.fs2.cbmTriggers = cbmTriggers && cbmTriggers.length > 0;
  console.log(`${results.fs2.cbmTriggers ? '✓' : '✗'} CBM Triggers: ${cbmTriggers?.length || 0} triggers`);
  
  // 4. Prescriptive Recommendations (needs maintenance_recommendations)
  const { data: recommendations } = await supabase
    .from('maintenance_recommendations')
    .select('*');
  results.fs2.recommendations = recommendations && recommendations.length > 0;
  console.log(`${results.fs2.recommendations ? '✓' : '✗'} Maintenance Recommendations: ${recommendations?.length || 0} recommendations`);
  
  // 5. Priority & Risk Scoring (needs failure_predictions with risk_level)
  const { data: riskData } = await supabase
    .from('failure_predictions')
    .select('risk_level')
    .not('risk_level', 'is', null);
  results.fs2.priorityScoring = riskData && riskData.length > 0;
  console.log(`${results.fs2.priorityScoring ? '✓' : '✗'} Priority & Risk Scoring: ${riskData?.length || 0} assets with risk levels`);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 Summary');
  console.log('-'.repeat(80));
  
  const fs1Features = Object.values(results.fs1);
  const fs2Features = Object.values(results.fs2);
  const fs1Complete = fs1Features.filter(Boolean).length;
  const fs2Complete = fs2Features.filter(Boolean).length;
  
  console.log(`\nFS1: ${fs1Complete}/${fs1Features.length} features have data`);
  console.log(`FS2: ${fs2Complete}/${fs2Features.length} features have data`);
  
  const allComplete = fs1Complete === fs1Features.length && fs2Complete === fs2Features.length;
  
  if (allComplete) {
    console.log('\n✅ All FS1 and FS2 features have data!');
  } else {
    console.log('\n⚠️  Some features are missing data:');
    if (fs1Complete < fs1Features.length) {
      console.log('  FS1 missing:', Object.entries(results.fs1).filter(([k, v]) => !v).map(([k]) => k).join(', '));
    }
    if (fs2Complete < fs2Features.length) {
      console.log('  FS2 missing:', Object.entries(results.fs2).filter(([k, v]) => !v).map(([k]) => k).join(', '));
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

main();
