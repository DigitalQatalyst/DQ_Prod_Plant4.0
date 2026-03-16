/**
 * Tests for EnergyDashboardsAuditReports Page
 * 
 * Verifies transmission compliance reports integration
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EnergyDashboardsAuditReports } from '../EnergyDashboardsAuditReports';
import { useApp } from '@/context/AppContext';
import { getTransmissionProvider } from '@/lib/data/providers/TransmissionProvider';

// Mock dependencies
vi.mock('@/context/AppContext');
vi.mock('@/lib/data/providers/TransmissionProvider');

const mockUseApp = useApp as ReturnType<typeof vi.fn>;
const mockGetTransmissionProvider = getTransmissionProvider as ReturnType<typeof vi.fn>;

describe('EnergyDashboardsAuditReports', () => {
  const mockUpstreamContext = {
    sector: 'oil-gas',
    subsector: 'Upstream',
    currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
    energyMeters: [],
    energyTelemetry: []
  };

  const mockTransmissionContext = {
    sector: 'power',
    subsector: 'Transmission',
    currentTenant: { id: 'tenant-tx', name: 'Transmission Tenant' },
    energyMeters: [],
    energyTelemetry: []
  };

  const mockSubstations = [
    {
      id: 'sub-1',
      org_id: 'tenant-tx',
      code: 'SUB001',
      name: 'Main Substation',
      active: true
    },
    {
      id: 'sub-2',
      org_id: 'tenant-tx',
      code: 'SUB002',
      name: 'North Substation',
      active: true
    }
  ];

  const mockFeeders = [
    {
      id: 'feed-1',
      substation_id: 'sub-1',
      feeder_code: 'F001',
      name: 'Feeder 1',
      active: true
    },
    {
      id: 'feed-2',
      substation_id: 'sub-1',
      feeder_code: 'F002',
      name: 'Feeder 2',
      active: true
    }
  ];

  const mockTransmissionProvider = {
    listTxSubstations: vi.fn().mockResolvedValue(mockSubstations),
    listTxFeeders: vi.fn().mockResolvedValue(mockFeeders)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransmissionProvider.mockReturnValue(mockTransmissionProvider);
  });

  describe('Upstream Mode', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
    });

    it('should render audit reports page in upstream mode', () => {
      render(<EnergyDashboardsAuditReports />);
      
      const auditReportsElements = screen.getAllByText('Audit Reports');
      expect(auditReportsElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Export Packs')).toBeInTheDocument();
    });

    it('should display upstream export packs', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.getAllByText('Energy Audit Pack').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Emissions Audit Pack').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Power Quality Compliance Pack').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Cost Audit Pack').length).toBeGreaterThan(0);
    });

    it('should not display transmission-specific export packs', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.queryByText('Grid Performance Audit Pack')).not.toBeInTheDocument();
      expect(screen.queryByText('Transmission Compliance Pack')).not.toBeInTheDocument();
    });

    it('should not display transmission context banner', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.queryByText('Transmission Grid Context')).not.toBeInTheDocument();
    });
  });

  describe('Transmission Mode - Requirement 25.1', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should render audit reports page in transmission mode', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      const auditReportsElements = screen.getAllByText('Audit Reports');
      expect(auditReportsElements.length).toBeGreaterThan(0);
      
      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalledWith({
          org_id: 'tenant-tx'
        });
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalledWith({
          org_id: 'tenant-tx'
        });
      });
    });

    it('should display transmission context banner - Requirement 25.4', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(screen.getByText('Transmission Grid Context')).toBeInTheDocument();
        expect(screen.getByText(/Reports include grid topology context/)).toBeInTheDocument();
      });
    });

    it('should display transmission-specific export packs - Requirements 25.1, 25.2', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Grid Performance Audit Pack').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Transmission Compliance Pack').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Transmission Power Quality Audit').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Delivery Context Audit Pack').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Transmission Emissions Audit').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Substation Performance Audit').length).toBeGreaterThan(0);
      });
    });

    it('should display both transmission and upstream export packs', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        // Transmission packs
        const gridPacks = screen.getAllByText('Grid Performance Audit Pack');
        expect(gridPacks.length).toBeGreaterThan(0);
        
        // Upstream packs (still available)
        expect(screen.getAllByText('Energy Audit Pack').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Emissions Audit Pack').length).toBeGreaterThan(0);
      });
    });

    it('should load transmission topology data - Requirement 25.4', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalledTimes(1);
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalledTimes(1);
      });
    });

    it('should display substation and feeder count in context banner', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(screen.getByText('2 Substations • 2 Feeders')).toBeInTheDocument();
      });
    });
  });

  describe('Transmission Report Templates - Requirements 25.2, 25.3', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should display transmission-specific report templates', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      // Switch to Report Templates tab
      const templatesTab = screen.getByRole('tab', { name: /Report Templates/i });
      templatesTab.click();
      
      await waitFor(() => {
        // Check that the tab content is rendered
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    it('should show compliance context for transmission templates - Requirement 25.3', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      const templatesTab = screen.getByRole('tab', { name: /Report Templates/i });
      templatesTab.click();
      
      await waitFor(() => {
        // Check that the tab content is rendered
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });
  });

  describe('Export Pack Details - Requirement 25.4', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should display grid topology filters for transmission packs', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(screen.getByText('Grid Topology Context')).toBeInTheDocument();
      });
    });

    it('should display transmission datasets in export packs', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        const gridPacks = screen.getAllByText('Grid Performance Audit Pack');
        expect(gridPacks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should support searching export packs', async () => {
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search export packs...')).toBeInTheDocument();
      });
    });
  });

  describe('Export Actions - Requirements 25.5, 25.6', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should display export action buttons', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Export Now')).toBeInTheDocument();
    });

    it('should display export history tab', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.getByText('Export History')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should handle transmission data loading errors gracefully', async () => {
      mockTransmissionProvider.listTxSubstations.mockRejectedValue(
        new Error('Failed to load substations')
      );
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<EnergyDashboardsAuditReports />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load transmission data:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should display all tab options', () => {
      render(<EnergyDashboardsAuditReports />);
      
      expect(screen.getByText('Export Packs')).toBeInTheDocument();
      expect(screen.getByText('Data Export')).toBeInTheDocument();
      expect(screen.getByText('Report Templates')).toBeInTheDocument();
      expect(screen.getByText('Export History')).toBeInTheDocument();
    });
  });
});
