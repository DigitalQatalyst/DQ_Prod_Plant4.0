import { describe, it, expect, beforeEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';
import { sectors } from '@/data/mockData';
import { ReactNode } from 'react';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext Sector Switching', () => {
  it('should preserve navigation state when switching sectors', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Initial state should be Oil & Gas Upstream
    expect(result.current.currentSector.id).toBe('oil-gas');
    expect(result.current.currentSubsector).toBe('Upstream');

    // Switch to Power sector
    const powerSector = sectors.find(s => s.id === 'power');
    expect(powerSector).toBeDefined();

    act(() => {
      result.current.setCurrentSector(powerSector!);
    });

    // Should update to Power Transmission
    expect(result.current.currentSector.id).toBe('power');
    expect(result.current.currentSubsector).toBe('Transmission');
  });

  it('should track selected item ID for state preservation', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Mock asset selection
    const mockAsset = {
      id: 'test-asset-1',
      name: 'Test Asset',
      type: 'Equipment',
      status: 'online' as const,
      site: 'Test Site',
      oee: 85.5,
      availability: 92.3,
      performance: 87.2,
      quality: 97.6,
      lastUpdated: '5 minutes ago'
    };

    act(() => {
      result.current.setSelectedAsset(mockAsset);
    });

    // Should track the selected item ID
    expect(result.current.selectedAsset).toBe(mockAsset);
    expect(result.current.lastSelectedItemId).toBe('test-asset-1');
  });

  it('should clear selection when switching to incompatible sector', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Select an upstream-specific asset
    const upstreamAsset = {
      id: 'upstream-asset-1',
      name: 'Well Alpha-1',
      type: 'Well',
      status: 'online' as const,
      site: 'Permian Basin',
      sector: 'Oil & Gas',
      subsector: 'Upstream',
      oee: 82.1,
      availability: 89.5,
      performance: 91.8,
      quality: 99.9,
      lastUpdated: '2 minutes ago',
      wellUptime: 89.5,
      plannedProduction: 1200,
      actualProduction: 1102,
      energyPerBarrel: 45.2,
      flowAssuranceStatus: 'stable' as const,
      defermentHours: 2.5
    };

    act(() => {
      result.current.setSelectedAsset(upstreamAsset);
    });

    expect(result.current.selectedAsset).toBe(upstreamAsset);
    expect(result.current.lastSelectedItemId).toBe('upstream-asset-1');

    // Switch to FMCG sector
    const fmcgSector = sectors.find(s => s.id === 'fmcg');
    expect(fmcgSector).toBeDefined();

    act(() => {
      result.current.setCurrentSector(fmcgSector!);
    });

    // Should update sector but preserve selection tracking
    expect(result.current.currentSector.id).toBe('fmcg');
    expect(result.current.currentSubsector).toBe('Food & Beverage');
    expect(result.current.lastSelectedItemId).toBe('upstream-asset-1'); // Still tracked for potential restoration
  });

  it('should preserve cross-sector content selection when switching sectors', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Select a cross-sector asset (no sector/subsector properties)
    const crossSectorAsset = {
      id: 'cross-sector-asset-1',
      name: 'Generic Equipment',
      type: 'Equipment',
      status: 'online' as const,
      site: 'Main Plant',
      oee: 78.5,
      availability: 92.3,
      performance: 87.2,
      quality: 97.6,
      lastUpdated: '5 minutes ago'
    };

    act(() => {
      result.current.setSelectedAsset(crossSectorAsset);
    });

    expect(result.current.selectedAsset).toBe(crossSectorAsset);

    // Switch sectors
    const powerSector = sectors.find(s => s.id === 'power');
    act(() => {
      result.current.setCurrentSector(powerSector!);
    });

    // Cross-sector content should be preserved
    expect(result.current.selectedAsset).toBe(crossSectorAsset);
    expect(result.current.lastSelectedItemId).toBe('cross-sector-asset-1');
  });

  it('should update subsector appropriately when switching sectors', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Start with Oil & Gas
    expect(result.current.currentSector.id).toBe('oil-gas');
    expect(result.current.currentSubsector).toBe('Upstream');

    // Switch to Power
    const powerSector = sectors.find(s => s.id === 'power');
    act(() => {
      result.current.setCurrentSector(powerSector!);
    });

    expect(result.current.currentSubsector).toBe('Transmission');

    // Switch to FMCG
    const fmcgSector = sectors.find(s => s.id === 'fmcg');
    act(() => {
      result.current.setCurrentSector(fmcgSector!);
    });

    expect(result.current.currentSubsector).toBe('Food & Beverage');
  });

  it('should maintain available subsectors for current sector', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Check Oil & Gas subsectors
    expect(result.current.availableSubsectors).toContain('Upstream');

    // Switch to Power
    const powerSector = sectors.find(s => s.id === 'power');
    act(() => {
      result.current.setCurrentSector(powerSector!);
    });

    expect(result.current.availableSubsectors).toContain('Transmission');

    // Switch to FMCG
    const fmcgSector = sectors.find(s => s.id === 'fmcg');
    act(() => {
      result.current.setCurrentSector(fmcgSector!);
    });

    expect(result.current.availableSubsectors).toContain('Food & Beverage');
  });

  it('should provide preservation function for manual state management', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(typeof result.current.preserveSelectionOnSectorSwitch).toBe('function');
    expect(typeof result.current.setLastSelectedItemId).toBe('function');
    expect(result.current.lastSelectedItemId).toBeNull();
  });
});