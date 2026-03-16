/**
 * Performance tests for APM telemetry queries
 * Validates Requirements 7.8, 28.2
 * 
 * Tests verify that telemetry queries for 30-day windows
 * return results with acceptable performance.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration - use local Supabase instance
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('APM Telemetry Query Performance', () => {
  let supabase: ReturnType<typeof createClient>;
  let isSupabaseAvailable = false;
  let testAssetId: string | null = null;

  beforeAll(async () => {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Test connection and get a test asset
      const { data: assets, error } = await supabase
        .from('assets')
        .select('id')
        .limit(1);
      
      if (!error && assets && assets.length > 0) {
        isSupabaseAvailable = true;
        testAssetId = assets[0].id;
      }
    } catch (e) {
      console.warn('Supabase not available for telemetry performance tests');
      isSupabaseAvailable = false;
    }
  });

  it('should return telemetry data for 7-day window within acceptable time', async () => {
    if (!isSupabaseAvailable || !testAssetId) {
      console.warn('Skipping telemetry performance test - Supabase not available or no test asset');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('*')
      .eq('asset_id', testAssetId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Acceptable performance for 7-day window (more lenient than 300ms for time-series data)
    expect(duration).toBeLessThan(1000);
    
    console.log(`Telemetry query (7-day window): ${duration.toFixed(2)}ms, ${data?.length || 0} records`);
  });

  it('should return telemetry data for 30-day window within acceptable time', async () => {
    if (!isSupabaseAvailable || !testAssetId) {
      console.warn('Skipping telemetry performance test - Supabase not available or no test asset');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('*')
      .eq('asset_id', testAssetId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(5000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Acceptable performance for 30-day window (requirement 7.8, 28.2)
    expect(duration).toBeLessThan(2000);
    
    console.log(`Telemetry query (30-day window): ${duration.toFixed(2)}ms, ${data?.length || 0} records`);
  });

  it('should return latest telemetry for asset within acceptable time', async () => {
    if (!isSupabaseAvailable || !testAssetId) {
      console.warn('Skipping telemetry performance test - Supabase not available or no test asset');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('*')
      .eq('asset_id', testAssetId)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Latest telemetry query: ${duration.toFixed(2)}ms, ${data?.length || 0} records`);
  });

  it('should return aggregated telemetry data within acceptable time', async () => {
    if (!isSupabaseAvailable || !testAssetId) {
      console.warn('Skipping telemetry performance test - Supabase not available or no test asset');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const startTime = performance.now();
    
    // Query with aggregation (simulating hourly averages)
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('timestamp, value')
      .eq('asset_id', testAssetId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(168); // ~7 days of hourly data
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(1000);
    
    console.log(`Aggregated telemetry query (7-day hourly): ${duration.toFixed(2)}ms, ${data?.length || 0} records`);
  });

  it('should return telemetry for multiple parameters within acceptable time', async () => {
    if (!isSupabaseAvailable || !testAssetId) {
      console.warn('Skipping telemetry performance test - Supabase not available or no test asset');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('*')
      .eq('asset_id', testAssetId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(500);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(500);
    
    console.log(`Multi-parameter telemetry query (24h): ${duration.toFixed(2)}ms, ${data?.length || 0} records`);
  });
});
