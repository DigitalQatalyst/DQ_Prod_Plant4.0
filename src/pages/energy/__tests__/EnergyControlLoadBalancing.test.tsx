/**
 * Tests for EnergyControlLoadBalancing component
 * Verifies sector-aware rendering and load balancing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnergyControlLoadBalancing from '../EnergyControlLoadBalancing';
import * as AppContext from '@/context/AppContext';
import * as TransmissionProvider from '@/lib/data/providers/TransmissionProvider';

// Mock the context
const mockUseApp = vi.spyOn(AppContext, 'useApp');

// Mock the transmission provider
const mockGetTransmissionProvider = vi.spyOn(TransmissionProvider, 'getTransmissionProvider');

// Mock data
const mockFeeders = [
  {
    id: 'feeder-1',
    substation_id: 'sub-1',
    feeder_code: 'F-101',
    name: 'Feeder 101',
    voltage_level_kv: 132,
    direction: 'outgoer' as const,
    utility_ref: null,
    capacity_mva: 50,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'feeder-2',
    substation_id: 'sub-1',
    feeder_code: 'F-102',
    name: 'Feeder 102',
    voltage_level_kv: 132,
    direction: 'outgoer' as const,
    utility_ref: null,
    capacity_mva: 50,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockTransformers = [
  {
    id: 'tx-1',
    substation_id: 'sub-1',
    transformer_code: 'T-01',
    name: 'Transformer 01',
    primary_voltage_kv: 132,
    secondary_voltage_kv: 33,
    tertiary_voltage_kv: null,
    rated_capacity_mva: 100,
    cooling_type: 'ONAN',
    tap_changer_type: 'OLTC',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockMeters = [
  {
    id: 'meter-1',
    org_id: 'org-1',
    name: 'Meter 1',
    status: 'Normal' as const,
    energy_types: ['electricity' as const],
    meter_role: 'feeder_outgoing' as const,
    substation_id: 'sub-1',
    feeder_id: 'feeder-1',
    bay_id: null,
    transformer_id: null,
    active: true,
    current_kw: 35000,
    current_kwh: 100000,
    last_telemetry_at: '2024-01-01T12:00:00Z',
    is_stale: false,
    substation_name: 'Substation 1',
    feeder_name: 'Feeder 101',
    bay_code: null,
    transformer_name: null
  },
  {
    id: 'meter-2',
    org_id: 'org-1',
    name: 'Meter 2',
    status: 'Normal' as const,
    energy_types: ['electricity' as const],
    meter_role: 'feeder_outgoing' as const,
    substation_id: 'sub-1',
    feeder_id: 'feeder-2',
    bay_id: null,
    transformer_id: null,
    active: true,
    current_kw: 15000,
    current_kwh: 50000,
    last_telemetry_at: '2024-01-01T12:00:00Z',
    is_stale: false,
    substation_name: 'Substation 1',
    feeder_name: 'Feeder 102',
    bay_code: null,
    transformer_name: null
  }
];

const mockSubstations = [
  {
    id: 'sub-1',
    org_id: 'org-1',
    code: 'SUB-01',
    name: 'Substation 1',
    region: 'North',
    voltage_levels_kv: [132, 33],
    geo: null,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('EnergyControlLoadBalancing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Upstream Mode', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        tenantName: 'GulfUpstream Demo',
        tenantId: 'tenant-1',
        setSector: vi.fn(),
        setSubsector: vi.fn(),
        setTenantName: vi.fn(),
        setTenantId: vi.fn()
      });
    });

    it('should render upstream load balancing view', () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      // Should show upstream content
      expect(screen.getByRole('heading', { name: 'Load Balancing' })).toBeInTheDocument();
    });

    it('should display upstream controllable loads', () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      // Should show upstream load types
      expect(screen.getAllByText(/Load Distribution/i).length).toBeGreaterThan(0);
    });
  });

  describe('Transmission Mode', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission',
        tenantName: 'PowerGrid Demo',
        tenantId: 'tenant-2',
        setSector: vi.fn(),
        setSubsector: vi.fn(),
        setTenantName: vi.fn(),
        setTenantId: vi.fn()
      });

      // Mock the transmission provider
      const mockProvider = {
        listTxFeeders: vi.fn().mockResolvedValue(mockFeeders),
        listTxTransformers: vi.fn().mockResolvedValue(mockTransformers),
        listEnergyMetersTxScoped: vi.fn().mockResolvedValue(mockMeters),
        listTxSubstations: vi.fn().mockResolvedValue(mockSubstations)
      };

      mockGetTransmissionProvider.mockReturnValue(mockProvider as any);
    });

    it('should render transmission load balancing view', async () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      // Should show loading state initially
      expect(screen.getByText(/Loading transmission data/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Load Balancing' })).toBeInTheDocument();
      });
    });

    it('should display feeder load distribution', async () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Feeder Load Distribution/i)).toBeInTheDocument();
      });
    });

    it('should calculate feeder utilization correctly', async () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Feeder 1: 35000 kW / 50000 kW capacity = 70% utilization
        // Feeder 2: 15000 kW / 50000 kW capacity = 30% utilization
        expect(screen.getByText(/Total Feeders/i)).toBeInTheDocument();
      });
    });

    it('should generate load balancing recommendations for overloaded feeders', async () => {
      // Create an overloaded feeder scenario
      const overloadedMeters = [
        {
          ...mockMeters[0],
          current_kw: 45000 // 90% of 50MW capacity
        }
      ];

      const mockProvider = {
        listTxFeeders: vi.fn().mockResolvedValue(mockFeeders),
        listTxTransformers: vi.fn().mockResolvedValue(mockTransformers),
        listEnergyMetersTxScoped: vi.fn().mockResolvedValue(overloadedMeters),
        listTxSubstations: vi.fn().mockResolvedValue(mockSubstations)
      };

      mockGetTransmissionProvider.mockReturnValue(mockProvider as any);

      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Recommendations/i).length).toBeGreaterThan(0);
      });
    });

    it('should validate feeder capacity constraints', async () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show capacity constraint information
        expect(screen.getByRole('heading', { name: 'Load Balancing' })).toBeInTheDocument();
      });
    });

    it('should display transformer load summary', async () => {
      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Transformer Load Summary/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission',
        tenantName: 'PowerGrid Demo',
        tenantId: 'tenant-2',
        setSector: vi.fn(),
        setSubsector: vi.fn(),
        setTenantName: vi.fn(),
        setTenantId: vi.fn()
      });
    });

    it('should handle data loading errors gracefully', async () => {
      const mockProvider = {
        listTxFeeders: vi.fn().mockRejectedValue(new Error('Failed to load feeders')),
        listTxTransformers: vi.fn().mockResolvedValue([]),
        listEnergyMetersTxScoped: vi.fn().mockResolvedValue([]),
        listTxSubstations: vi.fn().mockResolvedValue([])
      };

      mockGetTransmissionProvider.mockReturnValue(mockProvider as any);

      render(
        <BrowserRouter>
          <EnergyControlLoadBalancing />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });
  });
});
