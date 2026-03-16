/**
 * Usage examples for TransmissionProvider monitoring API functions
 * 
 * This file demonstrates how to use the monitoring API functions
 * for real-time telemetry, baselines, multi-fluid monitoring,
 * power quality events, and sub-metering.
 * 
 * Requirements: 2.5, 4.4, 5.1, 6.4, 7.2
 */

import { getTransmissionProvider } from '../TransmissionProvider';

const provider = getTransmissionProvider();

/**
 * Example 1: Get real-time telemetry for all meters
 */
export async function exampleGetRealtimeTelemetry() {
  // Get all meters with their latest telemetry
  const allMeters = await provider.getRealtimeTelemetry();
  
  console.log(`Found ${allMeters.length} meters with telemetry`);
  
  // Filter for meters with stale data
  const staleMeters = await provider.getRealtimeTelemetry({
    stale_telemetry: true
  });
  
  console.log(`Found ${staleMeters.length} meters with stale telemetry`);
  
  // Get meters for a specific substation
  const substationMeters = await provider.getRealtimeTelemetry({
    substation_id: 'some-substation-id',
    limit: 10
  });
  
  return substationMeters;
}

/**
 * Example 2: Get baseline with trends for a meter
 */
export async function exampleGetBaselineWithTrends(meterId: string) {
  const baselineData = await provider.getBaselineWithTrends(
    meterId,
    {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    'day' // Aggregate by day
  );
  
  if (!baselineData) {
    console.log('No baseline found for this meter');
    return null;
  }
  
  console.log('Baseline:', baselineData.baseline.baseline_name);
  console.log('Average deviation:', baselineData.summary.avg_deviation_pct, '%');
  console.log('Anomaly count:', baselineData.summary.anomaly_count);
  
  // Process trends
  baselineData.trends.forEach(trend => {
    console.log(
      `${trend.timestamp}: Actual=${trend.actual_kwh}, Baseline=${trend.baseline_kwh}, Deviation=${trend.deviation_pct}%`
    );
  });
  
  return baselineData;
}

/**
 * Example 3: Create or update a baseline
 */
export async function exampleUpsertBaseline(meterId: string) {
  const baseline = await provider.upsertBaseline({
    meter_id: meterId,
    baseline_name: 'January 2024 Baseline',
    baseline_type: 'regression',
    baseline_period_start: '2024-01-01',
    baseline_period_end: '2024-01-31',
    baseline_value: 5000, // kWh per day
    baseline_unit: 'kWh/day',
    normalization_factors: {
      temperature: 20,
      occupancy: 0.8
    },
    calculation_method: 'linear_regression',
    confidence_level: 0.95,
    r_squared: 0.92,
    baseline_method: 'regression',
    active: true,
    metadata: {
      created_by: 'energy_analyst',
      notes: 'Baseline for winter period'
    }
  });
  
  console.log('Created baseline:', baseline.id);
  return baseline;
}

/**
 * Example 4: Get multi-fluid energy summary
 */
export async function exampleGetMultiFluidSummary() {
  // Get summary for all energy types
  const summary = await provider.getMultiFluidSummary();
  
  summary.forEach(energyType => {
    console.log(`\nEnergy Type: ${energyType.energy_type}`);
    console.log(`Meter Count: ${energyType.meter_count}`);
    console.log(`Total kWh: ${energyType.total_kwh}`);
    console.log(`Average kW: ${energyType.avg_kw}`);
    console.log(`Max kW: ${energyType.max_kw}`);
    
    // List top meters
    energyType.meters.slice(0, 5).forEach(meter => {
      console.log(`  - ${meter.meter_name} (${meter.substation_name}): ${meter.current_kw} kW`);
    });
  });
  
  // Get summary for a specific substation with date range
  const substationSummary = await provider.getMultiFluidSummary({
    substation_id: 'some-substation-id',
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  });
  
  return substationSummary;
}

/**
 * Example 5: Get power quality events
 */
export async function exampleGetPowerQualityEvents() {
  // Get all unresolved PQ events
  const unresolvedEvents = await provider.getPowerQualityEvents({
    resolved: false
  });
  
  console.log(`Found ${unresolvedEvents.length} unresolved PQ events`);
  
  // Get high severity events for a specific substation
  const highSeverityEvents = await provider.getPowerQualityEvents({
    substation_id: 'some-substation-id',
    severity: 'High',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  });
  
  highSeverityEvents.forEach(event => {
    console.log(
      `${event.timestamp}: ${event.event_type} - ${event.severity} (${event.resolved ? 'Resolved' : 'Open'})`
    );
  });
  
  return highSeverityEvents;
}

/**
 * Example 6: Resolve a power quality event
 */
export async function exampleResolvePQEvent(eventId: string) {
  const resolvedEvent = await provider.resolvePQEvent(
    eventId,
    'Voltage sag resolved after capacitor bank adjustment. Root cause: transformer tap changer malfunction.'
  );
  
  console.log('Event resolved:', resolvedEvent.id);
  console.log('Resolved at:', resolvedEvent.resolved_at);
  console.log('Notes:', resolvedEvent.resolution_notes);
  
  return resolvedEvent;
}

/**
 * Example 7: Get submeters
 */
export async function exampleGetSubmeters() {
  // Get all active submeters
  const allSubmeters = await provider.getSubmeters({
    active: true
  });
  
  console.log(`Found ${allSubmeters.length} active submeters`);
  
  // Get submeters for a specific parent meter
  const parentSubmeters = await provider.getSubmeters({
    parent_meter_id: 'some-parent-meter-id'
  });
  
  parentSubmeters.forEach(submeter => {
    console.log(
      `${submeter.submeter_name} is a submeter of ${submeter.parent_meter_name} (${submeter.allocation_percentage}%)`
    );
  });
  
  // Get submeters for a specific feeder
  const feederSubmeters = await provider.getSubmeters({
    feeder_id: 'some-feeder-id'
  });
  
  return feederSubmeters;
}

/**
 * Example 8: Create a submeter relationship
 */
export async function exampleUpsertSubmeter(
  parentMeterId: string,
  submeterId: string
) {
  const submeter = await provider.upsertSubmeter({
    parent_meter_id: parentMeterId,
    submeter_id: submeterId,
    allocation_percentage: 100,
    active: true,
    metadata: {
      created_by: 'facility_manager',
      notes: 'Submeter for building A'
    }
  });
  
  console.log('Created submeter relationship:', submeter.id);
  return submeter;
}

/**
 * Example 9: Complete monitoring workflow
 * 
 * This example demonstrates a complete workflow for monitoring
 * a substation's energy consumption and power quality.
 */
export async function exampleCompleteMonitoringWorkflow(substationId: string) {
  console.log('=== Complete Monitoring Workflow ===\n');
  
  // Step 1: Get real-time telemetry for the substation
  console.log('Step 1: Getting real-time telemetry...');
  const meters = await provider.getRealtimeTelemetry({
    substation_id: substationId,
    stale_telemetry: false
  });
  console.log(`Found ${meters.length} meters with fresh telemetry\n`);
  
  // Step 2: Check for power quality issues
  console.log('Step 2: Checking power quality events...');
  const pqEvents = await provider.getPowerQualityEvents({
    substation_id: substationId,
    resolved: false
  });
  console.log(`Found ${pqEvents.length} unresolved PQ events\n`);
  
  // Step 3: Get multi-fluid energy summary
  console.log('Step 3: Getting multi-fluid energy summary...');
  const energySummary = await provider.getMultiFluidSummary({
    substation_id: substationId
  });
  console.log(`Energy types monitored: ${energySummary.map(s => s.energy_type).join(', ')}\n`);
  
  // Step 4: Check baselines for anomalies
  console.log('Step 4: Checking baselines for anomalies...');
  for (const meter of meters.slice(0, 3)) { // Check first 3 meters
    const baselineData = await provider.getBaselineWithTrends(
      meter.id,
      {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    );
    
    if (baselineData && baselineData.summary.anomaly_count > 0) {
      console.log(
        `  - ${meter.name}: ${baselineData.summary.anomaly_count} anomalies detected`
      );
    }
  }
  
  console.log('\n=== Workflow Complete ===');
  
  return {
    meters,
    pqEvents,
    energySummary
  };
}
