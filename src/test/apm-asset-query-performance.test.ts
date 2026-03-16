/**
 * Performance tests for APM asset list queries
 * Validates Requirements 1.10, 28.1
 * 
 * Tests verify that asset list queries with filters and pagination
 * return results within 300ms target for seeded datasets.
 * 
 * Note: These tests measure query performance without tenant filtering
 * to focus on database index and query optimization performance.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration - use local Supabase instance
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('APM Asset Query Performance', () => {
  let supabase: ReturnType<typeof createClient>;
  let isSupabaseAvailable = false;

  beforeAll(async () => {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Test connection
      const { error } = await supabase.from('assets').select('id').limit(1);
      
      if (!error) {
        isSupabaseAvailable = true;
      }
    } catch (e) {
      console.warn('Supabase not available for performance tests');
      isSupabaseAvailable = false;
    }
  });

  it('should return asset list within 300ms with no filters', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .limit(50);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (no filters): ${duration.toFixed(2)}ms`);
  });

  it('should return asset list within 300ms with status filter', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'active')
      .limit(50);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (status filter): ${duration.toFixed(2)}ms`);
  });

  it('should return asset list within 300ms with name search', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .ilike('name', '%transformer%')
      .limit(50);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (name search): ${duration.toFixed(2)}ms`);
  });

  it('should return asset list within 300ms with pagination', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .range(0, 19)
      .order('name', { ascending: true });
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (with pagination): ${duration.toFixed(2)}ms`);
  });

  it('should return asset list within 300ms with sorting by updated_at', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (with sorting): ${duration.toFixed(2)}ms`);
  });

  it('should return asset list within 300ms with multiple filters', async () => {
    if (!isSupabaseAvailable) {
      console.warn('Skipping performance test - Supabase not available');
      return;
    }

    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'active')
      .ilike('name', '%breaker%')
      .limit(50);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(300);
    
    console.log(`Asset list query (multiple filters): ${duration.toFixed(2)}ms`);
  });
});
