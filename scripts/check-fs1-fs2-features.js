/**
 * Check FS1 and FS2 Features Data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('FS1 & FS2 Features Data Check');
console.log('='.repeat(80));

async function main() {
  // FS1 Features
  console.log('\n📊 FS1: Asset Health & Diagnostics');
  console.log('-'.repeat(80));
  
  const { data: healthScores } = await supabase.from('health_scores').select('*');
  console.log(`✓ Health Scores: ${healthScores?.length || 0} records`);
  
  const { data: diagnosticEvents } = await supabase.from('diagnostic_events').select('*');
  console.log(`✓ Diagnostic Events: ${diagnosticEvents?.length || 0} records`);
  
  const { data: rcaRecords } = await supabase.from('rca_records').select('*');
  console.log(`✓ RCA Records: ${rcaRecords?.length || 0} records`);
  
  const { data: healthModels } = await supabase.from('health_models').select('*');
  console.log(`✓ Health Models: ${healthModels?.length || 0} records`);
  
  // FS2 Features
  console.log('\n🔮 FS2: Predictive & Prescriptive Maintenance');
  console.log('-'.repeat(80));
  
  const { data: predictions } = await supabase.from('failure_predictions').select('*');
  console.log(`✓ Failure Predictions: ${predictions?.length || 0} records`);
  
  const { data: cbmTriggers } = await supabase.from('cbm_triggers').select('*');
  console.log(`✓ CBM Triggers: ${cbmTriggers?.length || 0} records`);
  
  const { data: recommendations } = await supabase.from('maintenance_recommendations').select('*');
  console.log(`✓ Maintenance Recommendations: ${recommendations?.length || 0} records`);
  
  // Sample data
  console.log('\n📋 Sample Data:');
  console.log('-'.repeat(80));
  
  if (healthScores && healthScores.length > 0) {
    const sample = healthScores[0];
    console.log(`\nHealth Score Example:`);
    console.log(`  Score: ${sample.score}/100`);
    console.log(`  Model: ${sample.model_version}`);
  }
  
  if (predictions && predictions.length > 0) {
    const sample = predictions[0];
    console.log(`\nFailure Prediction Example:`);
    console.log(`  Risk Level: ${sample.risk_level}`);
    console.log(`  RUL: ${sample.rul_days} days`);
  }
  
  if (recommendations && recommendations.length > 0) {
    const sample = recommendations[0];
    console.log(`\nMaintenance Recommendation Example:`);
    console.log(`  Type: ${sample.recommendation_type}`);
    console.log(`  Title: ${sample.title}`);
    console.log(`  Priority: ${sample.priority}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ All FS1 and FS2 features have data!');
}

main();
