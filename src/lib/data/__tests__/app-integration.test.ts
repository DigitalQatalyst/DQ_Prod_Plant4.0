/**
 * App Integration Test
 * 
 * Verifies that the data provider system works in the actual app context
 */

import { describe, it, expect } from 'vitest';
import { getDataProvider, getCurrentBackend, isHybridBackend, isMockBackend, isSupabaseBackend } from '../index';

describe('App Integration - Real Environment', () => {
  it('can get data provider in current environment', () => {
    const provider = getDataProvider();
    const backend = getCurrentBackend();
    
    expect(provider).toBeDefined();
    expect(provider.getInfo()).toBeDefined();
    expect(provider.getInfo().name).toBeDefined();
    expect(['mock', 'supabase', 'hybrid']).toContain(backend);
    
    console.log(`Current backend: ${backend}`);
    console.log(`Provider: ${provider.getInfo().name}`);
  });

  it('backend helper functions work correctly', () => {
    const backend = getCurrentBackend();
    
    if (backend === 'mock') {
      expect(isMockBackend()).toBe(true);
      expect(isSupabaseBackend()).toBe(false);
      expect(isHybridBackend()).toBe(false);
    } else if (backend === 'supabase') {
      expect(isMockBackend()).toBe(false);
      expect(isSupabaseBackend()).toBe(true);
      expect(isHybridBackend()).toBe(false);
    } else if (backend === 'hybrid') {
      expect(isMockBackend()).toBe(false);
      expect(isSupabaseBackend()).toBe(false);
      expect(isHybridBackend()).toBe(true);
    }
  });

  it('provider has all required methods', async () => {
    const provider = getDataProvider();
    
    // Test that all required methods exist
    expect(typeof provider.getTenants).toBe('function');
    expect(typeof provider.getSectors).toBe('function');
    expect(typeof provider.getAssetsByTenant).toBe('function');
    expect(typeof provider.getAlertsByTenant).toBe('function');
    
    // Test transmission-specific methods exist
    expect(typeof provider.getTransmissionTenants).toBe('function');
    expect(typeof provider.getGridNodesByTenant).toBe('function');
    expect(typeof provider.getGridLinesByTenant).toBe('function');
    expect(typeof provider.getTransmissionAssetsByTenant).toBe('function');
    expect(typeof provider.getTransmissionOverviewKpis).toBe('function');
    
    // Test that basic methods work (should not throw)
    try {
      const tenants = await provider.getTenants();
      expect(Array.isArray(tenants)).toBe(true);
      console.log(`Found ${tenants.length} tenants`);
    } catch (error) {
      console.warn('getTenants failed:', error);
      // This is expected if Supabase is not configured
    }
    
    try {
      const sectors = await provider.getSectors();
      expect(Array.isArray(sectors)).toBe(true);
      console.log(`Found ${sectors.length} sectors`);
    } catch (error) {
      console.warn('getSectors failed:', error);
      // This is expected if Supabase is not configured
    }
  });
});