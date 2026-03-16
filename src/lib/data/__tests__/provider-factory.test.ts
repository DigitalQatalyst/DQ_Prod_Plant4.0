/**
 * Provider Factory Tests
 * 
 * Tests the data provider factory to ensure correct provider selection
 * based on VITE_DATA_BACKEND environment variable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Provider Factory', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns MockProvider by default', async () => {
    // Mock environment to be mock (default)
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'mock',
      isSupabaseConfigured: () => false,
      supabase: null
    }));
    
    const { getDataProvider, getCurrentBackend } = await import('../index');
    
    const provider = getDataProvider();
    const backend = getCurrentBackend();
    
    expect(backend).toBe('mock');
    expect(provider.getInfo().name).toBe('MockProvider');
  });

  it('returns HybridProvider when backend is hybrid', async () => {
    // Mock environment to be hybrid with valid config
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'hybrid',
      isSupabaseConfigured: () => true,
      supabase: { from: vi.fn() } // Mock supabase client
    }));
    
    const { getDataProvider, getCurrentBackend } = await import('../index');
    
    const provider = getDataProvider();
    const backend = getCurrentBackend();
    
    expect(backend).toBe('hybrid');
    expect(provider.getInfo().name).toBe('HybridProvider');
    // Check that it has transmission methods (hybrid-specific)
    expect(typeof provider.getTransmissionTenants).toBe('function');
    expect(typeof provider.getTenants).toBe('function');
  });

  it('returns SupabaseProvider when backend is supabase', async () => {
    // Mock environment to be supabase with valid config
    vi.doMock('@/lib/supabase', () => ({
      getDataBackend: () => 'supabase',
      isSupabaseConfigured: () => true,
      supabase: { from: vi.fn() } // Mock supabase client
    }));
    
    const { getDataProvider, getCurrentBackend } = await import('../index');
    
    const provider = getDataProvider();
    const backend = getCurrentBackend();
    
    expect(backend).toBe('supabase');
    expect(provider.getInfo().name).toBe('SupabaseProvider');
  });
});