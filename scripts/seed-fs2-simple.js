/**
 * Simplified FS2 Seed Script
 * Seeds CBM triggers, failure predictions, and maintenance recommendations
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFS2() {
  console.log('🌱 Seeding FS2 Data (Simplified)...\n');

  try {
    // Get asset IDs - using name since asset_tag doesn't exist
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, name')
      .limit(20);

    if (assetsError) {
      console.error('❌ Error fetching assets:', assetsError);
      return;
    }

    if (!assets || assets.length === 0) {
      console.error('❌ No assets found. Please seed base data first.');
      return;
    }

    console.log(`✅ Found ${assets.length} assets\n`);

    // Create a simple mapping - use actual assets from database
    const assetMap = {
      'TX-001': assets.find(a => a.name.includes('T1 Main Transformer'))?.id,
      'TX-002': assets.find(a => a.name.includes('T2 Backup Transformer'))?.id,
      'CB-101': assets.find(a => a.name.includes('400kV Incomer CB'))?.id,
      'CB-102': assets.find(a => a.name.includes('132kV Feeder CB'))?.id,
      'CB-103': assets.find(a => a.name.includes('Jebel Ali 400kV'))?.id,
      'CB-104': assets.find(a => a.name.includes('Jebel Ali 132kV'))?.id
    };

    // Get parameter IDs
    const { data: parameters, error: paramsError } = await supabase
      .from('telemetry_parameters')
      .select('id, name')
      .in('name', [
        'sf6_density',
        'sf6_pressure',
        'top_oil_temp',
        'dga_c2h2',
        'dga_h2',
        'contact_wear_percent',
        'moisture_ppm'
      ]);

    if (paramsError) {
      console.error('❌ Error fetching parameters:', paramsError);
      return;
    }

    console.log(`✅ Found ${parameters?.length || 0} telemetry parameters\n`);

    const paramMap = {};
    parameters?.forEach(param => {
      paramMap[param.name] = param.id;
    });

    // Seed CBM Triggers
    console.log('📋 Seeding CBM Triggers...');

    const cbmTriggers = [
      {
        name: 'SF6 Density Critical Threshold',
        parameter_id: paramMap['sf6_density'],
        condition_operator: 'less_than',
        threshold_value: 1.3,
        recommended_action: 'Immediate SF6 gas replenishment required',
        is_active: true
      },
      {
        name: 'SF6 Pressure Low Warning',
        parameter_id: paramMap['sf6_pressure'],
        condition_operator: 'less_than',
        threshold_value: 5.0,
        recommended_action: 'Schedule SF6 pressure check and top-up',
        is_active: true
      },
      {
        name: 'Transformer Oil Temperature Warning',
        parameter_id: paramMap['top_oil_temp'],
        condition_operator: 'greater_than',
        threshold_value: 85.0,
        recommended_action: 'Inspect cooling system and oil circulation',
        is_active: true
      },
      {
        name: 'DGA C2H2 Critical (Arcing)',
        parameter_id: paramMap['dga_c2h2'],
        condition_operator: 'greater_than',
        threshold_value: 35.0,
        recommended_action: 'Immediate shutdown and DGA analysis - arcing detected',
        is_active: true
      },
      {
        name: 'DGA H2 Rate of Change',
        parameter_id: paramMap['dga_h2'],
        condition_operator: 'greater_than',
        threshold_value: 150.0,
        recommended_action: 'Monitor hydrogen trend - potential partial discharge',
        is_active: true
      },
      {
        name: 'Contact Wear Critical Threshold',
        parameter_id: paramMap['contact_wear_percent'],
        condition_operator: 'greater_than',
        threshold_value: 80.0,
        recommended_action: 'Schedule contact replacement during next outage',
        is_active: true
      },
      {
        name: 'Moisture in Oil Warning',
        parameter_id: paramMap['moisture_ppm'],
        condition_operator: 'greater_than',
        threshold_value: 30.0,
        recommended_action: 'Oil drying or replacement recommended',
        is_active: true
      },
      {
        name: 'Transformer Oil Temperature Critical',
        parameter_id: paramMap['top_oil_temp'],
        condition_operator: 'greater_than',
        threshold_value: 95.0,
        recommended_action: 'Reduce load immediately and inspect cooling system',
        is_active: true
      }
    ];

    // Filter out triggers with undefined parameter_id
    const validTriggers = cbmTriggers.filter(t => t.parameter_id);

    if (validTriggers.length === 0) {
      console.log('⚠️  No valid parameters found for CBM triggers');
      console.log('💡 Make sure telemetry parameters are seeded first');
    } else {
      const { data: insertedTriggers, error: triggersError } = await supabase
        .from('cbm_triggers')
        .insert(validTriggers)
        .select();

      if (triggersError) {
        console.error('❌ Error inserting CBM triggers:', triggersError);
      } else {
        console.log(`✅ Inserted ${insertedTriggers?.length || 0} CBM triggers\n`);
      }
    }

    // Seed Failure Predictions
    console.log('📋 Seeding Failure Predictions...');

    const failurePredictions = [
      {
        asset_id: assetMap['TX-001'],
        prediction_date: new Date().toISOString(),
        failure_probability: 75,
        confidence: 85,
        time_horizon_days: 7,
        risk_level: 'high',
        rul_days: 14,
        contributing_factors: ['High DGA levels', 'Elevated oil temperature', 'Age-related wear']
      },
      {
        asset_id: assetMap['TX-002'],
        prediction_date: new Date().toISOString(),
        failure_probability: 35,
        confidence: 78,
        time_horizon_days: 30,
        risk_level: 'medium',
        rul_days: 90,
        contributing_factors: ['Gradual temperature increase', 'Reduced cooling efficiency']
      },
      {
        asset_id: assetMap['CB-101'],
        prediction_date: new Date().toISOString(),
        failure_probability: 65,
        confidence: 82,
        time_horizon_days: 7,
        risk_level: 'high',
        rul_days: 30,
        contributing_factors: ['High operation count', 'Visible contact erosion', 'Increased resistance']
      },
      {
        asset_id: assetMap['CB-102'],
        prediction_date: new Date().toISOString(),
        failure_probability: 25,
        confidence: 75,
        time_horizon_days: 90,
        risk_level: 'low',
        rul_days: 180,
        contributing_factors: ['Gradual pressure drop', 'Seal aging']
      }
    ];

    // Filter out predictions with undefined asset_id
    const validPredictions = failurePredictions.filter(p => p.asset_id);

    if (validPredictions.length > 0) {
      const { data: insertedPredictions, error: predictionsError } = await supabase
        .from('failure_predictions')
        .insert(validPredictions)
        .select();

      if (predictionsError) {
        console.error('❌ Error inserting failure predictions:', predictionsError);
      } else {
        console.log(`✅ Inserted ${insertedPredictions?.length || 0} failure predictions\n`);
      }
    }

    // Seed Maintenance Recommendations
    console.log('📋 Seeding Maintenance Recommendations...');

    const recommendations = [
      {
        asset_id: assetMap['TX-001'],
        recommendation_type: 'inspection',
        description: 'Perform comprehensive DGA analysis and oil quality assessment',
        priority_score: 90,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
      },
      {
        asset_id: assetMap['TX-002'],
        recommendation_type: 'cleaning',
        description: 'Clean cooling system and inspect oil circulation pumps',
        priority_score: 60,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
      },
      {
        asset_id: assetMap['CB-101'],
        recommendation_type: 'replacement',
        description: 'Replace circuit breaker contacts',
        priority_score: 95,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
      },
      {
        asset_id: assetMap['CB-102'],
        recommendation_type: 'inspection',
        description: 'Inspect SF6 seals and top-up gas if needed',
        priority_score: 40,
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
      }
    ];

    // Filter out recommendations with undefined asset_id
    const validRecommendations = recommendations.filter(r => r.asset_id);

    if (validRecommendations.length > 0) {
      const { data: insertedRecommendations, error: recommendationsError } = await supabase
        .from('maintenance_recommendations')
        .insert(validRecommendations)
        .select();

      if (recommendationsError) {
        console.error('❌ Error inserting maintenance recommendations:', recommendationsError);
      } else {
        console.log(`✅ Inserted ${insertedRecommendations?.length || 0} maintenance recommendations\n`);
      }
    }

    // Verify the data
    console.log('🔍 Verifying seeded data...\n');

    const { count: cbmCount } = await supabase
      .from('cbm_triggers')
      .select('*', { count: 'exact', head: true });

    const { count: failureCount } = await supabase
      .from('failure_predictions')
      .select('*', { count: 'exact', head: true });

    const { count: recommendationCount } = await supabase
      .from('maintenance_recommendations')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 CBM Triggers: ${cbmCount}`);
    console.log(`📊 Failure Predictions: ${failureCount}`);
    console.log(`📊 Maintenance Recommendations: ${recommendationCount}`);

    if (cbmCount > 0 && failureCount > 0 && recommendationCount > 0) {
      console.log('\n🎉 FS2 data seeded successfully!\n');
      console.log('💡 You can now view CBM triggers at: /monitor/cbm-triggers');
    } else {
      console.log('\n⚠️  Some tables are still empty. Check the errors above.\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

seedFS2();
